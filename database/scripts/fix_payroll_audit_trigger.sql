-- ============================================================
-- FIX: Payroll Audit Trigger - Add created_by column
-- Lỗi: trigger log_payroll_changes() tham chiếu NEW.created_by nhưng cột không tồn tại
-- ============================================================

-- 1. Thêm cột created_by vào bảng payroll
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

COMMENT ON COLUMN public.payroll.created_by IS 'Người tạo bảng lương';

-- 2. Cập nhật trigger để handle trường hợp created_by là NULL
CREATE OR REPLACE FUNCTION log_payroll_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payroll_audit_log (payroll_id, action, new_values, changed_by)
        VALUES (NEW.id, 'created', to_jsonb(NEW), COALESCE(NEW.created_by, auth.uid()));
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

-- Trigger đã tồn tại, chỉ cần replace function là đủ

-- ============================================================
-- DONE - Giờ có thể INSERT payroll mà không bị lỗi
-- ============================================================
