-- ============================================================
-- PAYROLL DISPUTE REALTIME UPDATES
-- Version: 101
-- Description: Re-assert manager notifications for new disputes,
--              notify teachers when dispute status changes,
--              and publish payroll_disputes to Supabase Realtime.
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

  SELECT LPAD(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
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

CREATE OR REPLACE FUNCTION public.notify_teacher_on_payroll_dispute_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id UUID;
  v_period_label TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF NEW.teacher_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status
    AND COALESCE(BTRIM(NEW.admin_response), '') IS NOT DISTINCT FROM COALESCE(BTRIM(OLD.admin_response), '') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('reviewing', 'resolved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT u.center_id
  INTO v_center_id
  FROM public.users u
  WHERE u.id = NEW.teacher_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT LPAD(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
  INTO v_period_label
  FROM public.payroll p
  WHERE p.id = NEW.payroll_id;

  CASE NEW.status
    WHEN 'reviewing' THEN
      v_title := 'Khiếu nại lương đang được xem xét';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đang được quản lý xem xét.';
    WHEN 'resolved' THEN
      v_title := 'Khiếu nại lương đã được giải quyết';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đã được quản lý giải quyết.';
    WHEN 'rejected' THEN
      v_title := 'Khiếu nại lương đã bị từ chối';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đã bị quản lý từ chối.';
    ELSE
      RETURN NEW;
  END CASE;

  IF COALESCE(BTRIM(NEW.admin_response), '') <> '' THEN
    v_message := v_message || ' Phản hồi: ' || BTRIM(NEW.admin_response);
  END IF;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  ) VALUES (
    NEW.teacher_id,
    v_center_id,
    'payroll_dispute_' || NEW.status,
    v_title,
    v_message,
    NEW.id,
    'payroll_dispute',
    NEW.resolved_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_teacher_on_payroll_dispute_status ON public.payroll_disputes;

CREATE TRIGGER trigger_notify_teacher_on_payroll_dispute_status
AFTER UPDATE OF status, admin_response ON public.payroll_disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_teacher_on_payroll_dispute_status();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payroll_disputes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payroll_disputes;
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_teacher_on_payroll_dispute_status() IS 'Creates teacher notifications when payroll dispute status changes';
