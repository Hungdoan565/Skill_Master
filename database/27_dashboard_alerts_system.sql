-- ============================================================
-- AUDIT DASHBOARD ALERTS TABLES
-- Version: 1.0
-- Description: Bảng lưu trữ cấu hình và lịch sử alerts cho dashboard
-- ============================================================

-- 1. Alert configuration table
CREATE TABLE IF NOT EXISTS alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  threshold_days INTEGER, -- Số ngày overdue/upcoming
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE alert_configs IS 'Cấu hình các loại cảnh báo trên dashboard';

-- 2. Insert default alert configurations
INSERT INTO alert_configs (alert_type, enabled, threshold_days, severity, title, description) VALUES
('overdue_invoices', true, 7, 'critical', 'Hóa đơn quá hạn', 'Các hóa đơn chưa thanh toán quá hạn >= 7 ngày'),
('upcoming_invoices', true, 3, 'warning', 'Hóa đơn sắp đến hạn', 'Các hóa đơn sẽ đến hạn trong 3 ngày tới'),
('classes_missing_schedule', true, NULL, 'warning', 'Lớp thiếu lịch học', 'Lớp đang active nhưng không có buổi học nào'),
('certificates_pending', true, NULL, 'info', 'Chứng chỉ chờ cấp', 'Học viên đủ điều kiện nhưng chưa cấp chứng chỉ'),
('draft_invoices', true, 14, 'warning', 'Hóa đơn draft lâu', 'Hóa đơn ở trạng thái draft >= 14 ngày')
ON CONFLICT (alert_type) DO NOTHING;

-- 3. Function to get overdue invoices
CREATE OR REPLACE FUNCTION get_overdue_invoices(p_center_id UUID DEFAULT NULL, p_threshold_days INTEGER DEFAULT 7)
RETURNS TABLE(
  invoice_id UUID,
  invoice_number VARCHAR,
  student_name TEXT,
  amount NUMERIC,
  due_date DATE,
  days_overdue INTEGER,
  center_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    p.full_name,
    i.total_amount,
    i.due_date,
    (CURRENT_DATE - i.due_date)::INTEGER,
    e.center_id
  FROM invoices i
  JOIN enrollments e ON i.enrollment_id = e.id
  JOIN profiles p ON e.student_id = p.id
  WHERE i.status IN ('unpaid', 'partial')
    AND i.due_date < CURRENT_DATE
    AND (CURRENT_DATE - i.due_date) >= p_threshold_days
    AND (p_center_id IS NULL OR e.center_id = p_center_id)
  ORDER BY i.due_date ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Function to get classes missing schedules
CREATE OR REPLACE FUNCTION get_classes_missing_schedule(p_center_id UUID DEFAULT NULL)
RETURNS TABLE(
  class_id UUID,
  class_name VARCHAR,
  course_name VARCHAR,
  start_date DATE,
  status VARCHAR,
  center_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    co.name,
    c.start_date,
    c.status,
    c.center_id
  FROM classes c
  JOIN courses co ON c.course_id = co.id
  WHERE c.status IN ('active', 'scheduled')
    AND c.start_date <= CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM sessions s WHERE s.class_id = c.id
    )
    AND (p_center_id IS NULL OR c.center_id = p_center_id)
  ORDER BY c.start_date ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Function to get students eligible for certificates but not issued
CREATE OR REPLACE FUNCTION get_certificates_pending(p_center_id UUID DEFAULT NULL)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  class_id UUID,
  class_name VARCHAR,
  certificate_type_id UUID,
  certificate_type_name VARCHAR,
  attendance_rate NUMERIC,
  average_grade NUMERIC,
  center_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    e.student_id,
    p.full_name,
    c.id,
    c.name,
    ct.id,
    ct.name,
    calculate_attendance_rate(e.student_id, c.id),
    calculate_average_grade(e.student_id, c.id),
    c.center_id
  FROM enrollments e
  JOIN classes c ON e.class_id = c.id
  JOIN courses co ON c.course_id = co.id
  JOIN certificate_types ct ON ct.course_id = co.id
  JOIN profiles p ON e.student_id = p.id
  WHERE c.status IN ('active', 'completed')
    AND e.status = 'active'
    -- Check eligibility
    AND (
      SELECT eligible 
      FROM check_certificate_eligibility(e.student_id, c.id, ct.id)
    ) = true
    -- Not yet issued
    AND NOT EXISTS (
      SELECT 1 FROM certificates cert 
      WHERE cert.student_id = e.student_id 
        AND cert.class_id = c.id
        AND cert.certificate_type_id = ct.id
    )
    AND (p_center_id IS NULL OR c.center_id = p_center_id)
  ORDER BY c.name ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Function to get long-standing draft invoices
CREATE OR REPLACE FUNCTION get_draft_invoices(p_center_id UUID DEFAULT NULL, p_threshold_days INTEGER DEFAULT 14)
RETURNS TABLE(
  invoice_id UUID,
  invoice_number VARCHAR,
  student_name TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  days_in_draft INTEGER,
  center_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    p.full_name,
    i.total_amount,
    i.created_at,
    (EXTRACT(EPOCH FROM (now() - i.created_at)) / 86400)::INTEGER,
    e.center_id
  FROM invoices i
  JOIN enrollments e ON i.enrollment_id = e.id
  JOIN profiles p ON e.student_id = p.id
  WHERE i.status = 'draft'
    AND (now() - i.created_at) >= (p_threshold_days || ' days')::INTERVAL
    AND (p_center_id IS NULL OR e.center_id = p_center_id)
  ORDER BY i.created_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Master function to get all dashboard alerts
CREATE OR REPLACE FUNCTION get_dashboard_alerts(p_center_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_config RECORD;
BEGIN
  v_result := '{}'::JSONB;
  
  -- Loop through enabled alert configs
  FOR v_config IN 
    SELECT * FROM alert_configs WHERE enabled = true
  LOOP
    CASE v_config.alert_type
      WHEN 'overdue_invoices' THEN
        v_result := v_result || jsonb_build_object(
          'overdue_invoices',
          jsonb_build_object(
            'config', row_to_json(v_config)::JSONB,
            'data', (SELECT jsonb_agg(row_to_json(t)::JSONB) FROM get_overdue_invoices(p_center_id, v_config.threshold_days) t)
          )
        );
      
      WHEN 'classes_missing_schedule' THEN
        v_result := v_result || jsonb_build_object(
          'classes_missing_schedule',
          jsonb_build_object(
            'config', row_to_json(v_config)::JSONB,
            'data', (SELECT jsonb_agg(row_to_json(t)::JSONB) FROM get_classes_missing_schedule(p_center_id) t)
          )
        );
      
      WHEN 'certificates_pending' THEN
        v_result := v_result || jsonb_build_object(
          'certificates_pending',
          jsonb_build_object(
            'config', row_to_json(v_config)::JSONB,
            'data', (SELECT jsonb_agg(row_to_json(t)::JSONB) FROM get_certificates_pending(p_center_id) t)
          )
        );
      
      WHEN 'draft_invoices' THEN
        v_result := v_result || jsonb_build_object(
          'draft_invoices',
          jsonb_build_object(
            'config', row_to_json(v_config)::JSONB,
            'data', (SELECT jsonb_agg(row_to_json(t)::JSONB) FROM get_draft_invoices(p_center_id, v_config.threshold_days) t)
          )
        );
    END CASE;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dashboard_alerts IS 'Lấy tất cả alerts cho dashboard dựa vào cấu hình';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date) 
WHERE status IN ('unpaid', 'partial');

CREATE INDEX IF NOT EXISTS idx_classes_status_start_date ON classes(status, start_date)
WHERE status IN ('active', 'scheduled');

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================
/*
-- Lấy tất cả alerts cho SUPER_ADMIN
SELECT get_dashboard_alerts(NULL);

-- Lấy alerts cho CENTER_MANAGER của center cụ thể
SELECT get_dashboard_alerts('center-uuid'::UUID);

-- Lấy từng loại alert riêng
SELECT * FROM get_overdue_invoices(NULL, 7);
SELECT * FROM get_classes_missing_schedule(NULL);
SELECT * FROM get_certificates_pending(NULL);
SELECT * FROM get_draft_invoices(NULL, 14);
*/

-- ============================================================
-- ROLLBACK SCRIPT
-- ============================================================
/*
DROP FUNCTION IF EXISTS get_dashboard_alerts(UUID);
DROP FUNCTION IF EXISTS get_draft_invoices(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_certificates_pending(UUID);
DROP FUNCTION IF EXISTS get_classes_missing_schedule(UUID);
DROP FUNCTION IF EXISTS get_overdue_invoices(UUID, INTEGER);
DROP TABLE IF EXISTS alert_configs;
DROP INDEX IF EXISTS idx_classes_status_start_date;
DROP INDEX IF EXISTS idx_invoices_status_due_date;
*/
