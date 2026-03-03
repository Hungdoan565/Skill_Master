-- =============================================
-- 67: Chatbot Conversations Upgrade
-- Multi-conversation, auto-title, message rating
-- =============================================

-- Add title, active status, soft delete to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add rating to chat_messages (user feedback: up/down)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS rating TEXT CHECK (rating IN ('up', 'down'));

-- Conversation list index (student mode: list by user, sorted by latest)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_conversations 
  ON chat_sessions(user_id, last_message_at DESC) 
  WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- Latest message per session (for preview text)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_latest 
  ON chat_messages(session_id, created_at DESC);

-- Column comments
COMMENT ON COLUMN chat_sessions.title IS 'AI-generated or user-set conversation title';
COMMENT ON COLUMN chat_sessions.is_active IS 'Whether conversation is active (not archived)';
COMMENT ON COLUMN chat_sessions.deleted_at IS 'Soft delete timestamp, NULL means active';
COMMENT ON COLUMN chat_messages.rating IS 'User feedback: up (helpful) or down (not helpful)';
