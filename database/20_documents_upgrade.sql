-- ============================================================================
-- MIGRATION: 20_documents_upgrade.sql
-- Purpose: Enhanced documents management with download tracking and analytics
-- Author: System
-- Date: 2025-12-06
-- Note: Documents table already exists with UUID primary keys (from migration 18)
-- ============================================================================

-- ============================================================================
-- 1. ALTER EXISTING DOCUMENTS TABLE (add new columns)
-- ============================================================================

-- Version control
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Categorization
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Analytics (download_count already exists)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Full-text search
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Soft delete (if not exists)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update type constraint to match current usage
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
    CHECK (type IN ('lesson', 'exercise', 'exam', 'reference', 'material', 'assignment', 'resource', 'other'));

-- ============================================================================
-- 2. CREATE DOCUMENT_DOWNLOADS TABLE (download tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    
    -- Download metadata
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE document_downloads IS 'Tracks all document download events for analytics';

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON documents(class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_center_id ON documents(center_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id) WHERE deleted_at IS NULL;

-- Document downloads indexes
CREATE INDEX IF NOT EXISTS idx_doc_downloads_document_id ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_user_id ON document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_center_id ON document_downloads(center_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_downloaded_at ON document_downloads(downloaded_at DESC);

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at_trigger ON documents;
CREATE TRIGGER documents_updated_at_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Trigger: Update search_vector for full-text search
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.file_name, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_search_vector_trigger ON documents;
CREATE TRIGGER documents_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description, file_name, tags ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_search_vector();

-- Trigger: Increment download_count when download tracked
CREATE OR REPLACE FUNCTION increment_document_download_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents 
    SET download_count = download_count + 1 
    WHERE id = NEW.document_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_downloads_increment_trigger ON document_downloads;
CREATE TRIGGER document_downloads_increment_trigger
    AFTER INSERT ON document_downloads
    FOR EACH ROW
    EXECUTE FUNCTION increment_document_download_count();

-- ============================================================================
-- 5. MIGRATE EXISTING DATA (if any)
-- ============================================================================

-- Update search_vector for existing documents
UPDATE documents 
SET search_vector = 
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(file_name, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE search_vector IS NULL;

-- Initialize download_count if NULL
UPDATE documents SET download_count = 0 WHERE download_count IS NULL;
UPDATE documents SET view_count = 0 WHERE view_count IS NULL;
UPDATE documents SET version = 1 WHERE version IS NULL;
UPDATE documents SET tags = '{}' WHERE tags IS NULL;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_downloads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS documents_admin_all ON documents;
DROP POLICY IF EXISTS documents_teacher_select ON documents;
DROP POLICY IF EXISTS documents_student_select ON documents;
DROP POLICY IF EXISTS document_downloads_insert ON document_downloads;
DROP POLICY IF EXISTS document_downloads_select_own ON document_downloads;
DROP POLICY IF EXISTS document_downloads_manager_select ON document_downloads;
DROP POLICY IF EXISTS document_downloads_admin_select ON document_downloads;

-- Policy: Admin can do everything
CREATE POLICY documents_admin_all ON documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'SUPER_ADMIN'
        )
    );

-- Policy: Teachers can view documents in their center
CREATE POLICY documents_teacher_select ON documents
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('TEACHER', 'CENTER_MANAGER')
            AND u.center_id = documents.center_id
        )
    );

-- Policy: Students can view documents for their classes
CREATE POLICY documents_student_select ON documents
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            -- Documents in their classes
            class_id IN (
                SELECT class_id FROM enrollments
                WHERE student_id = auth.uid()
                AND status = 'active'
            )
            -- Or course-level documents (no specific class)
            OR (
                class_id IS NULL
                AND course_id IN (
                    SELECT c.id FROM courses c
                    INNER JOIN classes cls ON cls.course_id = c.id
                    INNER JOIN enrollments e ON e.class_id = cls.id
                    WHERE e.student_id = auth.uid()
                    AND e.status = 'active'
                )
            )
        )
    );

-- Policy: Download tracking - users can track their own downloads
CREATE POLICY document_downloads_insert ON document_downloads
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Download tracking - users can view their own download history
CREATE POLICY document_downloads_select_own ON document_downloads
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Managers can view downloads in their center
CREATE POLICY document_downloads_manager_select ON document_downloads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'CENTER_MANAGER'
            AND u.center_id = document_downloads.center_id
        )
    );

-- Policy: Admin can view all download history
CREATE POLICY document_downloads_admin_select ON document_downloads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'SUPER_ADMIN'
        )
    );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get document download statistics
CREATE OR REPLACE FUNCTION get_document_download_stats(doc_id UUID)
RETURNS TABLE (
    total_downloads BIGINT,
    unique_users BIGINT,
    downloads_this_month BIGINT,
    downloads_this_week BIGINT,
    top_downloader_name TEXT,
    top_downloader_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_downloads,
        COUNT(DISTINCT dd.user_id)::BIGINT as unique_users,
        COUNT(*) FILTER (WHERE dd.downloaded_at >= NOW() - INTERVAL '30 days')::BIGINT as downloads_this_month,
        COUNT(*) FILTER (WHERE dd.downloaded_at >= NOW() - INTERVAL '7 days')::BIGINT as downloads_this_week,
        (
            SELECT u.full_name 
            FROM document_downloads dd2
            INNER JOIN users u ON u.id = dd2.user_id
            WHERE dd2.document_id = doc_id
            GROUP BY dd2.user_id, u.full_name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as top_downloader_name,
        (
            SELECT COUNT(*)::BIGINT
            FROM document_downloads dd2
            WHERE dd2.document_id = doc_id
            GROUP BY dd2.user_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as top_downloader_count
    FROM document_downloads dd
    WHERE dd.document_id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get popular documents in center
CREATE OR REPLACE FUNCTION get_popular_documents(
    p_center_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    document_id UUID,
    title TEXT,
    file_name TEXT,
    download_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as document_id,
        d.title,
        d.file_name,
        COUNT(dd.id)::BIGINT as download_count,
        COUNT(DISTINCT dd.user_id)::BIGINT as unique_users
    FROM documents d
    LEFT JOIN document_downloads dd ON dd.document_id = d.id
        AND dd.downloaded_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE d.center_id = p_center_id
        AND d.deleted_at IS NULL
    GROUP BY d.id, d.title, d.file_name
    ORDER BY download_count DESC, unique_users DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT ON document_downloads TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification query
DO $$
BEGIN
    RAISE NOTICE 'Migration 20_documents_upgrade.sql completed successfully';
    RAISE NOTICE 'Documents table: %', (SELECT COUNT(*) FROM documents);
    RAISE NOTICE 'Download tracking enabled: document_downloads table created';
    RAISE NOTICE 'Full-text search enabled with search_vector';
    RAISE NOTICE 'RLS policies applied for multi-tenant security';
END $$;
