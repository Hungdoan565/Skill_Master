-- ============================================================
-- INTERNAL MESSAGING
-- Version: 58
-- Description: Tạo hệ thống hội thoại và tin nhắn nội bộ
-- ============================================================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES centers(id),
  title varchar(255),
  class_id uuid REFERENCES classes(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
