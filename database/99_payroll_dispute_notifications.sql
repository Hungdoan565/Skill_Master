-- ============================================================
-- PAYROLL DISPUTES: Notify managers on new dispute submission
-- Version: 99
-- Description: Create in-app notifications for center managers
--              and super admins when a teacher submits a payroll dispute.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_managers_on_payroll_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name TEXT;
  v_center_id UUID;
  v_period_label TEXT;
BEGIN
  SELECT u.full_name, u.center_id
  INTO v_teacher_name, v_center_id
  FROM public.users u
  WHERE u.id = NEW.teacher_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lpad(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
  INTO v_period_label
  FROM public.payroll p
  WHERE p.id = NEW.payroll_id;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  )
  SELECT
    manager_user.id,
    v_center_id,
    'payroll_dispute_submitted',
    'Có khiếu nại lương mới cần xử lý',
    COALESCE(v_teacher_name, 'Giảng viên') || ' đã gửi khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || '.',
    NEW.id,
    'payroll_dispute',
    NEW.teacher_id
  FROM public.users manager_user
  JOIN public.roles role_record ON role_record.id = manager_user.role_id
  WHERE manager_user.center_id = v_center_id
    AND role_record.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    AND manager_user.id <> NEW.teacher_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_managers_on_payroll_dispute ON public.payroll_disputes;

CREATE TRIGGER trigger_notify_managers_on_payroll_dispute
AFTER INSERT ON public.payroll_disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_managers_on_payroll_dispute();

COMMENT ON FUNCTION public.notify_managers_on_payroll_dispute() IS 'Creates manager notifications when a teacher submits a payroll dispute';
