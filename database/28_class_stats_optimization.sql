-- ============================================
-- Database Optimization: Class Enrolled Count
-- ============================================

-- Function: Tính số học viên đang active trong lớp
CREATE OR REPLACE FUNCTION get_class_enrolled_count(p_class_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM enrollments
    WHERE class_id = p_class_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Materialized View: Class Statistics
-- Cập nhật định kỳ để có performance tốt
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_class_stats AS
SELECT 
  c.id AS class_id,
  c.code,
  c.name,
  c.status,
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) AS enrolled_count,
  COUNT(CASE WHEN e.status = 'dropped' THEN 1 END) AS dropped_count,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS completed_count,
  c.max_students,
  CASE 
    WHEN c.max_students > 0 
    THEN ROUND((COUNT(CASE WHEN e.status = 'active' THEN 1 END)::NUMERIC / c.max_students) * 100, 2)
    ELSE 0 
  END AS fill_rate_percent,
  CASE 
    WHEN COUNT(CASE WHEN e.status = 'active' THEN 1 END) >= c.max_students 
    THEN true 
    ELSE false 
  END AS is_full
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY c.id, c.code, c.name, c.status, c.max_students;

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_class_stats_class_id ON mv_class_stats(class_id);
CREATE INDEX IF NOT EXISTS idx_mv_class_stats_status ON mv_class_stats(status);
CREATE INDEX IF NOT EXISTS idx_mv_class_stats_is_full ON mv_class_stats(is_full);

-- ============================================
-- Trigger: Auto-refresh Materialized View
-- Refresh khi có thay đổi enrollments
-- ============================================

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_class_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_refresh_class_stats_on_enrollment ON enrollments;
DROP TRIGGER IF EXISTS trg_refresh_class_stats_on_class ON classes;

-- Trigger on enrollments table
CREATE TRIGGER trg_refresh_class_stats_on_enrollment
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_class_stats();

-- Trigger on classes table (when max_students changes)
CREATE TRIGGER trg_refresh_class_stats_on_class
AFTER INSERT OR UPDATE OF max_students ON classes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_class_stats();

-- ============================================
-- Initial refresh
-- ============================================
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;

-- ============================================
-- Usage Examples:
-- ============================================

-- 1. Get enrolled count for a single class
-- SELECT get_class_enrolled_count('class-uuid-here');

-- 2. Query class with stats from materialized view
-- SELECT 
--   c.*,
--   s.enrolled_count,
--   s.fill_rate_percent,
--   s.is_full
-- FROM classes c
-- LEFT JOIN mv_class_stats s ON c.id = s.class_id;

-- 3. Find nearly full classes (>= 80% capacity)
-- SELECT * FROM mv_class_stats 
-- WHERE fill_rate_percent >= 80 
-- AND status = 'active'
-- ORDER BY fill_rate_percent DESC;

-- 4. Manual refresh (if needed)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;
