-- ============================================================
-- PAYROLL AUDIT TRAIL
-- Bảng lưu lại lịch sử thay đổi bảng lương
-- ============================================================

-- Tạo bảng audit trail
CREATE TABLE IF NOT EXISTS payroll_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID NOT NULL REFERENCES payroll(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'deleted'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    notes TEXT
);

-- Index để query nhanh theo payroll_id
CREATE INDEX IF NOT EXISTS idx_payroll_audit_payroll_id ON payroll_audit_log(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_action ON payroll_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_changed_at ON payroll_audit_log(changed_at);

-- Trigger function để tự động log khi payroll thay đổi
CREATE OR REPLACE FUNCTION log_payroll_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payroll_audit_log (payroll_id, action, new_values, changed_by)
        VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Chỉ log nếu có thay đổi thực sự
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO payroll_audit_log (payroll_id, action, old_values, new_values, changed_by)
            VALUES (
                NEW.id,
                CASE 
                    WHEN OLD.status != NEW.status THEN 'status_changed'
                    ELSE 'updated'
                END,
                to_jsonb(OLD),
                to_jsonb(NEW),
                COALESCE(NEW.approved_by, auth.uid())
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO payroll_audit_log (payroll_id, action, old_values, changed_by)
        VALUES (OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS payroll_audit_trigger ON payroll;

-- Tạo trigger
CREATE TRIGGER payroll_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payroll
    FOR EACH ROW
    EXECUTE FUNCTION log_payroll_changes();

-- RLS cho payroll_audit_log
ALTER TABLE payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả audit log
CREATE POLICY "Admin can view all audit logs" ON payroll_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Giáo viên có thể xem audit log của bảng lương của mình
CREATE POLICY "Teachers can view own payroll audit" ON payroll_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM payroll p
            WHERE p.id = payroll_audit_log.payroll_id
            AND p.teacher_id = auth.uid()
        )
    );

-- ============================================================
-- COMMENT
-- ============================================================
COMMENT ON TABLE payroll_audit_log IS 'Bảng lưu lịch sử thay đổi bảng lương';
COMMENT ON COLUMN payroll_audit_log.action IS 'Loại hành động: created, updated, status_changed, deleted';
COMMENT ON COLUMN payroll_audit_log.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN payroll_audit_log.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';
