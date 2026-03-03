-- =============================================
-- 65: Chat Tables for AI Chatbot Molly
-- Stores chat sessions and messages for the AI chatbot
-- =============================================

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chat_sessions IS 'AI chatbot conversation sessions - tracks both visitor and authenticated user chats';
COMMENT ON COLUMN chat_sessions.visitor_id IS 'Browser-generated UUID for anonymous visitors';
COMMENT ON COLUMN chat_sessions.user_id IS 'Authenticated user ID, NULL for visitors';
COMMENT ON COLUMN chat_sessions.metadata IS 'Session metadata: page_context, user_agent, etc.';

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Individual messages within a chat session';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN chat_messages.tokens_used IS 'LLM tokens consumed for assistant responses';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON chat_sessions(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_center_id ON chat_sessions(center_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role (backend) can do everything
CREATE POLICY "service_role_chat_sessions" ON chat_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_chat_messages" ON chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can view their own sessions
CREATE POLICY "users_view_own_sessions" ON chat_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Authenticated users can view messages in their own sessions
CREATE POLICY "users_view_own_messages" ON chat_messages
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

-- SUPER_ADMIN and CENTER_MANAGER can view all sessions in their center
CREATE POLICY "admin_view_center_sessions" ON chat_sessions
    FOR SELECT TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    );

CREATE POLICY "admin_view_center_messages" ON chat_messages
    FOR SELECT TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    );

-- Anonymous users can insert sessions (visitor mode)
CREATE POLICY "anon_insert_sessions" ON chat_sessions
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL);

-- Anonymous users can insert messages to their sessions
CREATE POLICY "anon_insert_messages" ON chat_messages
    FOR INSERT TO anon
    WITH CHECK (true);
