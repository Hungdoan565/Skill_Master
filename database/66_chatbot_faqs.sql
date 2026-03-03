-- Migration: Create chatbot_faqs table for FAQ knowledge base
-- Part of: improve-chatbot-molly change

CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('enrollment', 'payment', 'policy', 'schedule', 'general')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_center_active
  ON chatbot_faqs(center_id, is_active, sort_order)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- Service role full access (backend chatbot queries)
CREATE POLICY "chatbot_faqs_service_all" ON chatbot_faqs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read FAQs (future admin UI)
CREATE POLICY "chatbot_faqs_authenticated_select" ON chatbot_faqs
  FOR SELECT TO authenticated USING (true);
