-- ============================================================
-- SEED TEST DATA FOR PAYROLL & DISPUTE TESTING
-- Chạy file này trong Supabase SQL Editor để tạo data test
-- ============================================================

-- 1. Lấy ID của giáo viên đầu tiên (hoặc thay bằng ID cụ thể)
DO $$
DECLARE
  v_teacher_id UUID;
  v_teacher_name TEXT;
  v_class_id UUID;
  v_center_id UUID;
  v_course_id UUID;
  v_payroll_id UUID;
  v_session_date DATE;
BEGIN
  -- Lấy giáo viên đầu tiên có role TEACHER
  SELECT u.id, u.full_name, u.center_id INTO v_teacher_id, v_teacher_name, v_center_id
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE r.code = 'TEACHER'
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'Không tìm thấy giáo viên nào!';
    RETURN;
  END IF;

  RAISE NOTICE 'Found teacher: % (ID: %)', v_teacher_name, v_teacher_id;

  -- Lấy hoặc tạo course
  SELECT id INTO v_course_id FROM public.courses LIMIT 1;
  
  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (code, title, description, category, level, duration_weeks, total_sessions, price)
    VALUES ('TEST-001', 'Test Course for Payroll', 'Khóa học test', 'IT', 'beginner', 4, 12, 5000000)
    RETURNING id INTO v_course_id;
    RAISE NOTICE 'Created test course: %', v_course_id;
  END IF;

  -- Lấy center_id nếu chưa có
  IF v_center_id IS NULL THEN
    SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  END IF;

  -- Tạo class nếu chưa có cho giáo viên này
  SELECT id INTO v_class_id 
  FROM public.classes 
  WHERE teacher_id = v_teacher_id 
  LIMIT 1;

  IF v_class_id IS NULL THEN
    INSERT INTO public.classes (code, name, course_id, center_id, teacher_id, start_date, end_date, status)
    VALUES (
      'CLS-TEST-' || EXTRACT(EPOCH FROM NOW())::INT,
      'Lớp Test Payroll',
      v_course_id,
      v_center_id,
      v_teacher_id,
      '2026-01-01',
      '2026-03-31',
      'active'
    )
    RETURNING id INTO v_class_id;
    RAISE NOTICE 'Created test class: %', v_class_id;
  END IF;

  -- Tạo 10 sessions completed cho tháng 1/2026
  FOR i IN 1..10 LOOP
    v_session_date := ('2026-01-' || LPAD(i::TEXT, 2, '0'))::DATE;
    
    INSERT INTO public.sessions (
      class_id,
      teacher_id,
      session_number,
      session_date,
      start_time,
      end_time,
      duration_hours,
      status,
      created_at
    )
    VALUES (
      v_class_id,
      v_teacher_id,
      i,  -- session_number = 1, 2, 3...
      v_session_date,
      '09:00',
      '11:00',
      2.0,
      'completed',
      NOW()
    )
    ON CONFLICT (class_id, session_date) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created 10 completed sessions for January 2026';

  -- Tạo payroll cho tháng 1/2026
  INSERT INTO public.payroll (
    teacher_id,
    period_month,
    period_year,
    total_sessions,
    total_hours,
    base_salary,
    bonus,
    deduction,
    net_salary,
    status,
    created_at
  )
  VALUES (
    v_teacher_id,
    1,
    2026,
    10,
    20.0,
    3000000,
    500000,
    0,
    3500000,
    'pending',
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_payroll_id;

  IF v_payroll_id IS NOT NULL THEN
    RAISE NOTICE 'Created payroll for January 2026: %', v_payroll_id;
  ELSE
    RAISE NOTICE 'Payroll already exists for this period';
  END IF;

  RAISE NOTICE '✅ Done! Teacher can now see payroll and submit disputes.';

END $$;

-- Verify data
SELECT 
  u.full_name as teacher_name,
  p.period_month,
  p.period_year,
  p.total_sessions,
  p.total_hours,
  p.net_salary,
  p.status
FROM public.payroll p
JOIN public.users u ON p.teacher_id = u.id
WHERE p.period_year = 2026
ORDER BY p.created_at DESC;
