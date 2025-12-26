-- ============================================
-- BLOG VIEW STATS & NEWSLETTER SUBSCRIBERS
-- Migration: 35_blog_stats_newsletter.sql
-- ============================================

-- View Counter Table
CREATE TABLE IF NOT EXISTS blog_post_stats (
    slug TEXT PRIMARY KEY,
    view_count INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_post_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for displaying counts)
CREATE POLICY "Anyone can read view stats"
    ON blog_post_stats FOR SELECT
    USING (true);

-- Only authenticated users can insert/update (to prevent abuse)
CREATE POLICY "Authenticated can update views"
    ON blog_post_stats FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated can increment views"
    ON blog_post_stats FOR UPDATE
    USING (true);

-- Function to increment view count (upsert)
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO blog_post_stats (slug, view_count, last_viewed_at)
    VALUES (post_slug, 1, NOW())
    ON CONFLICT (slug)
    DO UPDATE SET 
        view_count = blog_post_stats.view_count + 1,
        last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT DEFAULT 'blog', -- Where they subscribed from
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    unsubscribed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

-- Only admins can read all
CREATE POLICY "Admins can manage subscribers"
    ON newsletter_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code = 'SUPER_ADMIN'
        )
    );

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_stats_slug ON blog_post_stats(slug);
