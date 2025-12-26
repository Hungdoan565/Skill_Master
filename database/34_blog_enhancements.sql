-- =============================================
-- BLOG ENHANCEMENTS
-- Migration: 34_blog_enhancements.sql
-- =============================================

-- 1. CREATE COMMENT REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE ARTICLE REACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- 'like', 'love', 'fire', 'clap', 'bulb'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reactions per user per post (or allow multiple types?)
    -- Let's say one user can give multiple reactions but only one of each type
    UNIQUE(post_slug, user_id, reaction_type)
);

-- 3. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_blog_reports_comment ON blog_comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_slug ON blog_article_reactions(post_slug);

-- 4. RLS POLICIES
-- =============================================
ALTER TABLE blog_comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_article_reactions ENABLE ROW LEVEL SECURITY;

-- Reports: Authenticated users can insert
CREATE POLICY "Users can report comments"
ON blog_comment_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can manage reports
CREATE POLICY "Admins can manage reports"
ON blog_comment_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
);

-- Reactions: Anyone can see
CREATE POLICY "Anyone can see reactions"
ON blog_article_reactions FOR SELECT
USING (TRUE);

-- Authenticated can react
CREATE POLICY "Users can react to articles"
ON blog_article_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their reaction
CREATE POLICY "Users can remove own reaction"
ON blog_article_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. PERMISSIONS
-- =============================================
GRANT SELECT, INSERT ON blog_comment_reports TO authenticated;
GRANT ALL ON blog_comment_reports TO authenticated; -- For admins

GRANT SELECT ON blog_article_reactions TO anon;
GRANT ALL ON blog_article_reactions TO authenticated;
