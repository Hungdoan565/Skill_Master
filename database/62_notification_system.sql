-- Migration: Notification system foundation
-- 1. Add RLS INSERT policy on notifications table for service_role
-- 2. Add RLS UPDATE policy on notifications for authenticated users (mark as read)
-- 3. Create user_notification_preferences table with RLS

-- ============================================
-- 1. RLS INSERT policy for notifications (service_role)
-- ============================================
CREATE POLICY "notifications_insert_service_role"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 2. RLS UPDATE policy for notifications (authenticated users can mark own as read)
-- ============================================
CREATE POLICY "notifications_update_own"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 3. Create user_notification_preferences table
-- ============================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, center_id, notification_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user_center
  ON user_notification_preferences(user_id, center_id);

-- ============================================
-- 4. RLS on user_notification_preferences
-- ============================================
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notif_prefs_select_own"
  ON user_notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_insert_own"
  ON user_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_update_own"
  ON user_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_service_role"
  ON user_notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Verify notifications table is in Realtime publication
-- ============================================
-- Add notifications table to the supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
