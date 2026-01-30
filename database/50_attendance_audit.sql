-- ============================================================
-- ATTENDANCE AUDIT SYSTEM
-- Bảng lưu lại lịch sử thay đổi điểm danh
-- Version: 1.0
-- ============================================================

-- ============================================================
-- 1. ADD SESSION_ID AND OVERRIDE COLUMNS TO ATTENDANCE TABLE
-- ============================================================
-- Add session_id column if not exists (required for audit trigger)
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id);

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

COMMENT ON COLUMN public.attendance.session_id IS 'Reference to the session this attendance belongs to';
COMMENT ON COLUMN public.attendance.override_reason IS 'Lý do khi admin override điểm danh';
COMMENT ON COLUMN public.attendance.overridden_by IS 'Người thực hiện override';
COMMENT ON COLUMN public.attendance.overridden_at IS 'Thời điểm override';

-- ============================================================
-- 2. CREATE ATTENDANCE_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id),
    student_id UUID REFERENCES public.users(id),
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'overridden'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    override_reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ============================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_audit_attendance_id ON public.attendance_audit(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_session_id ON public.attendance_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_changed_at ON public.attendance_audit(changed_at);

-- ============================================================
-- 4. TRIGGER FUNCTION TO LOG ATTENDANCE CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_attendance_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_student_id UUID;
    v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get session_id and student_id from the new record
        v_session_id := NEW.session_id;
        SELECT e.student_id INTO v_student_id 
        FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
        
        INSERT INTO public.attendance_audit (
            attendance_id, session_id, student_id, action, new_values, changed_by
        ) VALUES (
            NEW.id, v_session_id, v_student_id, 'created', to_jsonb(NEW), NEW.marked_by
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if there are actual changes
        IF OLD IS DISTINCT FROM NEW THEN
            v_session_id := COALESCE(NEW.session_id, OLD.session_id);
            SELECT e.student_id INTO v_student_id 
            FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
            
            -- Determine action type
            IF NEW.overridden_by IS NOT NULL AND OLD.overridden_by IS NULL THEN
                v_action := 'overridden';
            ELSE
                v_action := 'updated';
            END IF;
            
            INSERT INTO public.attendance_audit (
                attendance_id, session_id, student_id, action, 
                old_values, new_values, changed_by, override_reason
            ) VALUES (
                NEW.id, v_session_id, v_student_id, v_action,
                to_jsonb(OLD), to_jsonb(NEW), 
                COALESCE(NEW.overridden_by, NEW.marked_by, auth.uid()),
                NEW.override_reason
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_session_id := OLD.session_id;
        SELECT e.student_id INTO v_student_id 
        FROM public.enrollments e WHERE e.id = OLD.enrollment_id;
        
        INSERT INTO public.attendance_audit (
            attendance_id, session_id, student_id, action, old_values, changed_by
        ) VALUES (
            OLD.id, v_session_id, v_student_id, 'deleted', to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS attendance_audit_trigger ON public.attendance;

CREATE TRIGGER attendance_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.log_attendance_changes();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
DROP POLICY IF EXISTS "Admin can view all attendance audit logs" ON public.attendance_audit;
CREATE POLICY "Admin can view all attendance audit logs" ON public.attendance_audit
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
DROP POLICY IF EXISTS "Teachers can view attendance audit for their classes" ON public.attendance_audit;
CREATE POLICY "Teachers can view attendance audit for their classes" ON public.attendance_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.enrollments e ON a.enrollment_id = e.id
            JOIN public.classes c ON e.class_id = c.id
            WHERE a.id = attendance_audit.attendance_id
            AND c.teacher_id = auth.uid()
        )
    );

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON TABLE public.attendance_audit IS 'Bảng lưu lịch sử thay đổi điểm danh để audit và tracking';
COMMENT ON COLUMN public.attendance_audit.action IS 'Loại hành động: created, updated, deleted, overridden';
COMMENT ON COLUMN public.attendance_audit.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN public.attendance_audit.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';
COMMENT ON COLUMN public.attendance_audit.override_reason IS 'Lý do override (nếu action = overridden)';
COMMENT ON COLUMN public.attendance_audit.ip_address IS 'Địa chỉ IP của người thực hiện thay đổi';
COMMENT ON COLUMN public.attendance_audit.user_agent IS 'User agent của trình duyệt';

