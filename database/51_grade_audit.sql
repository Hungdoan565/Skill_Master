-- ============================================================
-- GRADE LOCK AND AUDIT SYSTEM
-- Bảng lưu lại lịch sử thay đổi điểm số và hệ thống khóa điểm
-- Version: 1.0
-- ============================================================

-- ============================================================
-- 1. ADD LOCK AND OVERRIDE COLUMNS TO GRADES TABLE
-- ============================================================
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS lock_reason TEXT,
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

COMMENT ON COLUMN public.grades.is_locked IS 'Trạng thái khóa điểm - không cho phép chỉnh sửa khi đã khóa';
COMMENT ON COLUMN public.grades.locked_at IS 'Thời điểm khóa điểm';
COMMENT ON COLUMN public.grades.locked_by IS 'Người thực hiện khóa điểm';
COMMENT ON COLUMN public.grades.lock_reason IS 'Lý do khóa điểm';
COMMENT ON COLUMN public.grades.override_reason IS 'Lý do khi admin override điểm đã khóa';
COMMENT ON COLUMN public.grades.overridden_by IS 'Người thực hiện override';
COMMENT ON COLUMN public.grades.overridden_at IS 'Thời điểm override';

-- ============================================================
-- 2. CREATE GRADE_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grade_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES public.enrollments(id),
    student_id UUID REFERENCES public.users(id),
    class_id UUID REFERENCES public.classes(id),
    grade_structure_id UUID REFERENCES public.grade_structures(id),
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'locked', 'unlocked', 'overridden'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ============================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_grade_audit_grade_id ON public.grade_audit(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_enrollment_id ON public.grade_audit(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_student_id ON public.grade_audit(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_class_id ON public.grade_audit(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_changed_at ON public.grade_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_grade_audit_action ON public.grade_audit(action);

-- Index for locked grades queries
CREATE INDEX IF NOT EXISTS idx_grades_is_locked ON public.grades(is_locked) WHERE is_locked = TRUE;

-- ============================================================
-- 4. TRIGGER FUNCTION TO LOG GRADE CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_grade_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_enrollment_id UUID;
    v_student_id UUID;
    v_class_id UUID;
    v_grade_structure_id UUID;
    v_action VARCHAR(50);
    v_reason TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_enrollment_id := NEW.enrollment_id;
        v_grade_structure_id := NEW.grade_structure_id;
        
        SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
        FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
        
        INSERT INTO public.grade_audit (
            grade_id, enrollment_id, student_id, class_id, grade_structure_id,
            action, new_values, changed_by
        ) VALUES (
            NEW.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
            'created', to_jsonb(NEW), NEW.graded_by
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD IS DISTINCT FROM NEW THEN
            v_enrollment_id := COALESCE(NEW.enrollment_id, OLD.enrollment_id);
            v_grade_structure_id := COALESCE(NEW.grade_structure_id, OLD.grade_structure_id);
            
            SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
            FROM public.enrollments e WHERE e.id = v_enrollment_id;
            
            -- Determine action type based on what changed
            IF NEW.is_locked = TRUE AND (OLD.is_locked IS NULL OR OLD.is_locked = FALSE) THEN
                v_action := 'locked';
                v_reason := NEW.lock_reason;
            ELSIF NEW.is_locked = FALSE AND OLD.is_locked = TRUE THEN
                v_action := 'unlocked';
                v_reason := NEW.override_reason;
            ELSIF NEW.overridden_by IS NOT NULL AND OLD.overridden_by IS NULL THEN
                v_action := 'overridden';
                v_reason := NEW.override_reason;
            ELSE
                v_action := 'updated';
                v_reason := NULL;
            END IF;
            
            INSERT INTO public.grade_audit (
                grade_id, enrollment_id, student_id, class_id, grade_structure_id,
                action, old_values, new_values, changed_by, reason
            ) VALUES (
                NEW.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
                v_action, to_jsonb(OLD), to_jsonb(NEW),
                COALESCE(NEW.overridden_by, NEW.graded_by, auth.uid()),
                v_reason
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_enrollment_id := OLD.enrollment_id;
        v_grade_structure_id := OLD.grade_structure_id;
        
        SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
        FROM public.enrollments e WHERE e.id = OLD.enrollment_id;
        
        INSERT INTO public.grade_audit (
            grade_id, enrollment_id, student_id, class_id, grade_structure_id,
            action, old_values, changed_by
        ) VALUES (
            OLD.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
            'deleted', to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS grade_audit_trigger ON public.grades;

CREATE TRIGGER grade_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION public.log_grade_changes();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.grade_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
DROP POLICY IF EXISTS "Admin can view all grade audit logs" ON public.grade_audit;
CREATE POLICY "Admin can view all grade audit logs" ON public.grade_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Teacher can view audit logs for their classes
DROP POLICY IF EXISTS "Teachers can view grade audit for their classes" ON public.grade_audit;
CREATE POLICY "Teachers can view grade audit for their classes" ON public.grade_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = grade_audit.class_id
            AND c.teacher_id = auth.uid()
        )
    );

-- Admin can insert audit logs (for manual audit entries)
DROP POLICY IF EXISTS "Admin can insert grade audit logs" ON public.grade_audit;
CREATE POLICY "Admin can insert grade audit logs" ON public.grade_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON TABLE public.grade_audit IS 'Bảng lưu lịch sử thay đổi điểm số để audit và tracking';
COMMENT ON COLUMN public.grade_audit.grade_id IS 'ID của điểm số bị thay đổi (NULL nếu đã xóa)';
COMMENT ON COLUMN public.grade_audit.enrollment_id IS 'ID enrollment của học viên';
COMMENT ON COLUMN public.grade_audit.student_id IS 'ID học viên';
COMMENT ON COLUMN public.grade_audit.class_id IS 'ID lớp học';
COMMENT ON COLUMN public.grade_audit.grade_structure_id IS 'ID cấu trúc điểm (cột điểm)';
COMMENT ON COLUMN public.grade_audit.action IS 'Loại hành động: created, updated, deleted, locked, unlocked, overridden';
COMMENT ON COLUMN public.grade_audit.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN public.grade_audit.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';
COMMENT ON COLUMN public.grade_audit.changed_by IS 'Người thực hiện thay đổi';
COMMENT ON COLUMN public.grade_audit.changed_at IS 'Thời điểm thay đổi';
COMMENT ON COLUMN public.grade_audit.reason IS 'Lý do thay đổi (lock/unlock/override)';
COMMENT ON COLUMN public.grade_audit.ip_address IS 'Địa chỉ IP của người thực hiện thay đổi';
COMMENT ON COLUMN public.grade_audit.user_agent IS 'User agent của trình duyệt';

