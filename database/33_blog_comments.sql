-- =============================================
-- BLOG COMMENTS SYSTEM
-- Migration: 33_blog_comments.sql
-- =============================================

-- 1. CREATE BLOG COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Post identification (using slug as reference)
    post_slug TEXT NOT NULL,
    
    -- Author (can be null for anonymous, or reference logged-in user)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- For nested comments (replies)
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE COMMENT LIKES TABLE (for tracking who liked what)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate likes
    UNIQUE(comment_id, user_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_slug ON blog_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment ON blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user ON blog_comment_likes(user_id);

-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR COMMENTS
-- =============================================

-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
ON blog_comments FOR SELECT
USING (is_approved = TRUE);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON blog_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON blog_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can do anything
CREATE POLICY "Admins can manage all comments"
ON blog_comments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
);

-- 6. RLS POLICIES FOR LIKES
-- =============================================

-- Anyone can read likes
CREATE POLICY "Anyone can read likes"
ON blog_comment_likes FOR SELECT
USING (TRUE);

-- Authenticated users can like
CREATE POLICY "Authenticated users can like"
ON blog_comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their like)
CREATE POLICY "Users can unlike"
ON blog_comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. TRIGGER TO UPDATE likes_count
-- =============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_comments
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON blog_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- 8. TRIGGER TO UPDATE updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_updated_at
BEFORE UPDATE ON blog_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_updated_at();

-- 9. SEED SOME SAMPLE COMMENTS (optional)
-- =============================================
-- Note: Run this only if you want demo data
-- These will be tied to specific post slugs

/*
INSERT INTO blog_comments (post_slug, user_id, content, likes_count, created_at)
SELECT 
    'lo-trinh-tu-hoc-ielts-5-len-7',
    (SELECT id FROM users WHERE email = 'admin@skillmaster.edu.vn' LIMIT 1),
    'Bài viết rất chi tiết và hữu ích! Mình đang học IELTS theo lộ trình này.',
    15,
    NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@skillmaster.edu.vn');
*/

-- 10. GRANT PERMISSIONS
-- =============================================
GRANT SELECT ON blog_comments TO anon;
GRANT ALL ON blog_comments TO authenticated;
GRANT SELECT ON blog_comment_likes TO anon;
GRANT ALL ON blog_comment_likes TO authenticated;

-- =============================================
-- DONE! Run this migration in Supabase Dashboard
-- SQL Editor → New query → Paste & Run
-- =============================================
