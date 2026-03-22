-- ============================================================
-- LEAVE REQUESTS REALTIME & NOTIFICATIONS
-- Version: 102
-- Description: Add DB triggers to notify managers on new leave
--              requests, notify teachers on status changes,
--              and publish leave_requests to Supabase Realtime.
-- ============================================================

-- Notify managers when a teacher submits a new leave request
CREATE OR REPLACE FUNCTION public.notify_managers_on_leave_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name TEXT;
  v_center_id UUID;
  v_date_range TEXT;
BEGIN
  SELECT u.full_name, u.center_id
  INTO v_teacher_name, v_center_id
  FROM public.users u
  WHERE u.id = NEW.staff_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date_range := COALESCE(TO_CHAR(NEW.start_date, 'DD/MM/YYYY'), '?') || ' – ' ||
                 COALESCE(TO_CHAR(NEW.end_date, 'DD/MM/YYYY'), '?');

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
    'leave_request_submitted',
    'Có đơn xin nghỉ mới cần duyệt',
    COALESCE(v_teacher_name, 'Một giáo viên') || ' đã gửi đơn xin nghỉ (' || v_date_range || ').',
    NEW.id,
    'leave_request',
    NEW.staff_id
  FROM public.users manager_user
  JOIN public.roles role_record ON role_record.id = manager_user.role_id
  WHERE manager_user.center_id = v_center_id
    AND role_record.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    AND manager_user.id <> NEW.staff_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_managers_on_leave_request ON public.leave_requests;

CREATE TRIGGER trigger_notify_managers_on_leave_request
AFTER INSERT ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_managers_on_leave_request();

-- Notify teachers when their leave request is approved or rejected
CREATE OR REPLACE FUNCTION public.notify_teacher_on_leave_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id UUID;
  v_date_range TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF NEW.staff_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only fire on meaningful status changes
  IF NEW.status IS NOT DISTINCT FROM OLD.status
    AND COALESCE(BTRIM(NEW.reviewer_notes), '') IS NOT DISTINCT FROM COALESCE(BTRIM(OLD.reviewer_notes), '') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT u.center_id
  INTO v_center_id
  FROM public.users u
  WHERE u.id = NEW.staff_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date_range := COALESCE(TO_CHAR(NEW.start_date, 'DD/MM/YYYY'), '?') || ' – ' ||
                 COALESCE(TO_CHAR(NEW.end_date, 'DD/MM/YYYY'), '?');

  IF NEW.status = 'approved' THEN
    v_title := 'Đơn xin nghỉ đã được duyệt';
    v_message := 'Đơn xin nghỉ của bạn (' || v_date_range || ') đã được duyệt.';
  ELSIF NEW.status = 'rejected' THEN
    v_title := 'Đơn xin nghỉ đã bị từ chối';
    v_message := 'Đơn xin nghỉ của bạn (' || v_date_range || ') đã bị từ chối.';
    IF COALESCE(BTRIM(NEW.reviewer_notes), '') <> '' THEN
      v_message := v_message || ' Lý do: ' || BTRIM(NEW.reviewer_notes);
    END IF;
  ELSE
    RETURN NEW;
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
    NEW.staff_id,
    v_center_id,
    'leave_request_' || NEW.status,
    v_title,
    v_message,
    NEW.id,
    'leave_request',
    NEW.reviewed_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_teacher_on_leave_request_status ON public.leave_requests;

CREATE TRIGGER trigger_notify_teacher_on_leave_request_status
AFTER UPDATE OF status, reviewer_notes ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_teacher_on_leave_request_status();

-- Add leave_requests to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'leave_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_managers_on_leave_request() IS 'Creates manager notifications when a teacher submits a leave request';
COMMENT ON FUNCTION public.notify_teacher_on_leave_request_status() IS 'Creates teacher notifications when their leave request is approved or rejected';
