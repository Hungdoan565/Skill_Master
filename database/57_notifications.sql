-- ============================================================
-- NOTIFICATIONS
-- Version: 57
-- Description: Tạo bảng thông báo realtime cho người dùng
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type VARCHAR(100),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE public.notifications IS 'Thông báo cho người dùng theo thời gian thực';
COMMENT ON COLUMN public.notifications.reference_id IS 'ID bản ghi liên quan (enrollment, payment, leave request, grade...)';
COMMENT ON COLUMN public.notifications.reference_type IS 'Loại bản ghi liên quan: enrollment, payment, leave_request, grade';
