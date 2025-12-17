-- ============================================================
-- CERTIFICATE ELIGIBILITY HELPERS
-- Version: 1.0
-- Description: Functions để tự động kiểm tra điều kiện cấp chứng chỉ
-- ============================================================

-- 1. Function tính tỷ lệ điểm danh của học viên trong lớp
CREATE OR REPLACE FUNCTION calculate_attendance_rate(
  p_student_id UUID,
  p_class_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_total_sessions INTEGER;
  v_attended_sessions INTEGER;
BEGIN
  -- Đếm tổng số buổi đã hoàn thành
  SELECT COUNT(*) INTO v_total_sessions
  FROM sessions
  WHERE class_id = p_class_id
    AND status = 'completed'
    AND session_date <= CURRENT_DATE;
  
  -- Nếu không có buổi nào, return 0
  IF v_total_sessions = 0 THEN
    RETURN 0;
  END IF;
  
  -- Đếm số buổi có mặt (present + late)
  SELECT COUNT(*) INTO v_attended_sessions
  FROM attendance a
  JOIN sessions s ON a.session_id = s.id
  WHERE s.class_id = p_class_id
    AND a.student_id = p_student_id
    AND a.status IN ('present', 'late')
    AND s.status = 'completed';
  
  -- Tính tỷ lệ %
  RETURN ROUND((v_attended_sessions::NUMERIC / v_total_sessions::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_attendance_rate IS 'Tính tỷ lệ điểm danh (%) của học viên trong lớp';

-- 2. Function tính điểm trung bình của học viên trong lớp
CREATE OR REPLACE FUNCTION calculate_average_grade(
  p_student_id UUID,
  p_class_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_weight NUMERIC;
  v_weighted_sum NUMERIC;
BEGIN
  -- Lấy enrollment_id
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE student_id = p_student_id
    AND class_id = p_class_id
  LIMIT 1;
  
  IF v_enrollment_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Tính tổng trọng số và tổng điểm có trọng số
  SELECT 
    COALESCE(SUM(gs.weight), 0),
    COALESCE(SUM(g.score * gs.weight / 100.0), 0)
  INTO v_total_weight, v_weighted_sum
  FROM grades g
  JOIN grade_structure gs ON g.grade_structure_id = gs.id
  WHERE g.enrollment_id = v_enrollment_id
    AND g.score IS NOT NULL;
  
  -- Nếu không có điểm nào hoặc tổng weight = 0, return NULL
  IF v_total_weight = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Tính điểm trung bình (scale về 10)
  RETURN ROUND((v_weighted_sum / v_total_weight) * 10, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_average_grade IS 'Tính điểm trung bình có trọng số của học viên trong lớp';

-- 3. Function kiểm tra điều kiện cấp chứng chỉ
CREATE OR REPLACE FUNCTION check_certificate_eligibility(
  p_student_id UUID,
  p_class_id UUID,
  p_certificate_type_id UUID
)
RETURNS TABLE(
  eligible BOOLEAN,
  attendance_rate NUMERIC,
  average_grade NUMERIC,
  min_attendance_required NUMERIC,
  min_grade_required NUMERIC,
  reasons TEXT[]
) AS $$
DECLARE
  v_requirements JSONB;
  v_attendance_rate NUMERIC;
  v_average_grade NUMERIC;
  v_min_attendance NUMERIC;
  v_min_grade NUMERIC;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_eligible BOOLEAN := true;
BEGIN
  -- Lấy requirements từ certificate type
  SELECT requirements INTO v_requirements
  FROM certificate_types
  WHERE id = p_certificate_type_id;
  
  -- Extract min requirements
  v_min_attendance := COALESCE((v_requirements->>'min_attendance')::NUMERIC, 0);
  v_min_grade := COALESCE((v_requirements->>'min_grade')::NUMERIC, 0);
  
  -- Tính attendance rate
  v_attendance_rate := calculate_attendance_rate(p_student_id, p_class_id);
  
  -- Tính average grade
  v_average_grade := calculate_average_grade(p_student_id, p_class_id);
  
  -- Check attendance
  IF v_attendance_rate < v_min_attendance THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 
      format('Điểm danh chỉ %s%%, cần >= %s%%', v_attendance_rate, v_min_attendance));
  END IF;
  
  -- Check grade
  IF v_average_grade IS NOT NULL AND v_average_grade < v_min_grade THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 
      format('Điểm trung bình chỉ %s, cần >= %s', v_average_grade, v_min_grade));
  END IF;
  
  -- Check if grade is missing
  IF v_average_grade IS NULL THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Chưa có điểm số');
  END IF;
  
  -- Return result
  RETURN QUERY SELECT 
    v_eligible,
    v_attendance_rate,
    v_average_grade,
    v_min_attendance,
    v_min_grade,
    v_reasons;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_certificate_eligibility(UUID, UUID, UUID) IS 'Kiểm tra điều kiện cấp chứng chỉ cho học viên';

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================
/*
-- Tính attendance rate
SELECT calculate_attendance_rate(
  'student-uuid'::UUID,
  'class-uuid'::UUID
);

-- Tính average grade
SELECT calculate_average_grade(
  'student-uuid'::UUID,
  'class-uuid'::UUID
);

-- Kiểm tra eligibility
SELECT * FROM check_certificate_eligibility(
  'student-uuid'::UUID,
  'class-uuid'::UUID,
  'cert-type-uuid'::UUID
);
*/

-- ============================================================
-- ROLLBACK SCRIPT
-- ============================================================
/*
DROP FUNCTION IF EXISTS check_certificate_eligibility(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS calculate_average_grade(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_attendance_rate(UUID, UUID);
*/
