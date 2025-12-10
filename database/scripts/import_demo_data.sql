-- ============================================================
-- IMPORT DEMO DATA - Nạp lại dữ liệu demo
-- Copy paste toàn bộ file này vào Supabase SQL Editor và Run
-- ============================================================

-- Bước 1: Xóa dữ liệu cũ (giữ lại users và roles)
TRUNCATE TABLE public.grades RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.invoices RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.enrollments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.classes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;
-- Không xóa centers vì admin đang liên kết với center

-- Bước 2: Insert Courses
INSERT INTO public.courses (id, code, title, description, category, level, duration_weeks, total_sessions, price, status, created_at)
VALUES
  (gen_random_uuid(), 'ENG-101', 'English for Beginners', 'Khóa học tiếng Anh cơ bản cho người mới bắt đầu', 'English', 'Beginner', 12, 36, 3500000, 'active', NOW()),
  (gen_random_uuid(), 'ENG-201', 'English Intermediate', 'Khóa học tiếng Anh trung cấp', 'English', 'Intermediate', 16, 48, 4500000, 'active', NOW()),
  (gen_random_uuid(), 'ENG-301', 'English Advanced', 'Khóa học tiếng Anh nâng cao', 'English', 'Advanced', 20, 60, 6000000, 'active', NOW()),
  (gen_random_uuid(), 'IELTS-101', 'IELTS Foundation', 'Nền tảng IELTS', 'IELTS', 'Intermediate', 12, 36, 5000000, 'active', NOW()),
  (gen_random_uuid(), 'IELTS-201', 'IELTS 6.5+', 'Luyện thi IELTS 6.5-7.0', 'IELTS', 'Advanced', 16, 48, 7000000, 'active', NOW()),
  (gen_random_uuid(), 'TOEIC-101', 'TOEIC 450+', 'Luyện thi TOEIC 450-550', 'TOEIC', 'Beginner', 10, 30, 3000000, 'active', NOW()),
  (gen_random_uuid(), 'TOEIC-201', 'TOEIC 750+', 'Luyện thi TOEIC 750-850', 'TOEIC', 'Intermediate', 12, 36, 4000000, 'active', NOW()),
  (gen_random_uuid(), 'BIZ-101', 'Business English', 'Tiếng Anh thương mại', 'Business', 'Intermediate', 12, 36, 5500000, 'active', NOW())
ON CONFLICT (code) DO NOTHING;

-- Bước 3: Lấy IDs cần thiết
DO $$
DECLARE
  v_course_ids UUID[];
  v_center_id UUID;
  v_teacher_role_id UUID;
  v_student_role_id UUID;
  v_teacher_id UUID;
  v_student_ids UUID[];
  v_class_id UUID;
  v_enrollment_id UUID;
  i INT;
BEGIN
  -- Lấy center đầu tiên
  SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  
  -- Lấy role IDs
  SELECT id INTO v_teacher_role_id FROM public.roles WHERE code = 'TEACHER';
  SELECT id INTO v_student_role_id FROM public.roles WHERE code = 'STUDENT';
  
  -- Lấy course IDs
  SELECT ARRAY_AGG(id) INTO v_course_ids FROM public.courses;
  
  -- Tạo 1 teacher nếu chưa có
  SELECT id INTO v_teacher_id FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE r.code = 'TEACHER' LIMIT 1;
  
  IF v_teacher_id IS NULL THEN
    -- Tạo teacher mới trong auth.users trước
    RAISE NOTICE 'Cần tạo teacher account qua Supabase Dashboard với email: teacher@skillmaster.edu.vn';
  END IF;
  
  -- Tạo 30 students nếu chưa đủ
  FOR i IN 1..30 LOOP
    -- Check số lượng students hiện có
    IF (SELECT COUNT(*) FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE r.code = 'STUDENT') < 30 THEN
      RAISE NOTICE 'Cần tạo thêm student accounts qua Supabase Auth';
      EXIT;
    END IF;
  END LOOP;
  
  -- Lấy student IDs
  SELECT ARRAY_AGG(u.id) INTO v_student_ids 
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE r.code = 'STUDENT'
  LIMIT 30;
  
  -- Tạo 10 classes
  IF v_teacher_id IS NOT NULL AND v_student_ids IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      INSERT INTO public.classes (
        code, name, course_id, center_id, teacher_id,
        start_date, end_date, status, created_at
      )
      VALUES (
        'CLS-2024-' || LPAD(i::TEXT, 3, '0'),
        'Lớp ' || i,
        v_course_ids[(i % array_length(v_course_ids, 1)) + 1],
        v_center_id,
        v_teacher_id,
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '60 days',
        'active',
        NOW()
      )
      RETURNING id INTO v_class_id;
      
      -- Enroll 3-5 students per class
      FOR j IN 1..((3 + FLOOR(RANDOM() * 3))::INT) LOOP
        IF j <= array_length(v_student_ids, 1) THEN
          INSERT INTO public.enrollments (
            student_id, class_id, status, enrolled_at
          )
          VALUES (
            v_student_ids[((i * 5 + j - 1) % array_length(v_student_ids, 1)) + 1],
            v_class_id,
            'active',
            NOW() - INTERVAL '20 days'
          )
          ON CONFLICT DO NOTHING
          RETURNING id INTO v_enrollment_id;
          
          -- Tạo invoice
          IF v_enrollment_id IS NOT NULL THEN
            INSERT INTO public.invoices (
              enrollment_id, 
              total_amount, 
              paid_amount, 
              due_date,
              payment_date,
              status
            )
            VALUES (
              v_enrollment_id,
              3500000 + (RANDOM() * 2000000)::NUMERIC,
              (CASE WHEN RANDOM() > 0.3 THEN 3500000 + (RANDOM() * 2000000)::NUMERIC ELSE 0 END),
              CURRENT_DATE + INTERVAL '30 days',
              (CASE WHEN RANDOM() > 0.3 THEN NOW() - INTERVAL '10 days' ELSE NULL END),
              (CASE WHEN RANDOM() > 0.3 THEN 'paid' ELSE 'pending' END)
            );
          END IF;
        END IF;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Đã tạo 10 classes với enrollments và invoices';
  END IF;
END $$;

-- Bước 4: Kiểm tra kết quả
SELECT 
  'Courses' as table_name, 
  COUNT(*) as count 
FROM public.courses
UNION ALL
SELECT 'Classes', COUNT(*) FROM public.classes
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM public.enrollments
UNION ALL
SELECT 'Invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'Students', COUNT(*) FROM public.users u 
  JOIN public.roles r ON u.role_id = r.id 
  WHERE r.code = 'STUDENT';
