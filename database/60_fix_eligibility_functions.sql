-- Fix calculate_attendance_rate: use enrollment_id instead of non-existent student_id on attendance table
CREATE OR REPLACE FUNCTION public.calculate_attendance_rate(p_student_id uuid, p_class_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_enrollment_id UUID;
  v_total_sessions INT;
  v_attended_sessions INT;
BEGIN
  -- Lấy enrollment_id từ student + class
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE student_id = p_student_id
    AND class_id = p_class_id
  LIMIT 1;
  
  IF v_enrollment_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Đếm tổng số buổi đã completed
  SELECT COUNT(*) INTO v_total_sessions
  FROM sessions s
  WHERE s.class_id = p_class_id
    AND s.status = 'completed';
  
  IF v_total_sessions = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Đếm số buổi có mặt (present hoặc late)
  SELECT COUNT(*) INTO v_attended_sessions
  FROM attendance a
  WHERE a.enrollment_id = v_enrollment_id
    AND a.status IN ('present', 'late');
  
  RETURN ROUND((v_attended_sessions::numeric / v_total_sessions::numeric) * 100, 2);
END;
$function$;

-- Fix calculate_average_grade: fix table name (grade_structure -> grade_structures)
-- and fix weight calculation (weights are decimals 0.20, not percentages 20)
CREATE OR REPLACE FUNCTION public.calculate_average_grade(p_student_id uuid, p_class_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_enrollment_id UUID;
  v_total_weight NUMERIC;
  v_weighted_sum NUMERIC;
BEGIN
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE student_id = p_student_id
    AND class_id = p_class_id
  LIMIT 1;
  
  IF v_enrollment_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT 
    COALESCE(SUM(gs.weight), 0),
    COALESCE(SUM(g.score * gs.weight), 0)
  INTO v_total_weight, v_weighted_sum
  FROM grades g
  JOIN grade_structures gs ON g.grade_structure_id = gs.id
  WHERE g.enrollment_id = v_enrollment_id
    AND g.score IS NOT NULL;
  
  IF v_total_weight = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(v_weighted_sum / v_total_weight, 2);
END;
$function$;
