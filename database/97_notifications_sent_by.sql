-- ============================================================
-- NOTIFICATIONS: Add sent_by column
-- Version: 97
-- Description: Track who sent each notification (admin/manager)
--              so admin history can query by sender
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_notifications_sent_by
  ON public.notifications(sent_by, created_at DESC)
  WHERE sent_by IS NOT NULL;

COMMENT ON COLUMN public.notifications.sent_by IS 'User ID of the admin/manager who sent this notification (NULL for system-generated)';
