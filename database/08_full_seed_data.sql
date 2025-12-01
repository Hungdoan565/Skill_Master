-- ============================================================
-- FULL SEED DATA - Dữ liệu demo đầy đủ cho Dashboard
-- Version: 1.0
-- Mục đích: Tạo 50 học viên, 10 lớp, enrollments, điểm danh, điểm số
-- ============================================================

-- ⚠️ CHẠY TỪNG PHẦN MỘT THEO THỨ TỰ

-- ============================================================
-- PHẦN 1: CẬP NHẬT FULL_NAME cho học viên hiện có
-- ============================================================
-- Lấy học viên STUDENT hiện có và cập nhật tên + số điện thoại
DO $$
DECLARE
  v_counter INT := 0;
  v_names TEXT[] := ARRAY[
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Đức', 'Hoàng Thu Hà',
    'Vũ Quốc Hùng', 'Đặng Thị Lan', 'Bùi Văn Long', 'Ngô Thị Mai', 'Trương Minh Nam',
    'Lý Thị Oanh', 'Phan Văn Phúc', 'Hồ Thị Quỳnh', 'Dương Văn Sơn', 'Võ Thị Tâm',
    'Đinh Văn Uy', 'Lưu Thị Vân', 'Đỗ Hoàng Xuân', 'Mai Thị Yến', 'Tạ Văn Bảo',
    'Chu Thị Chi', 'Thái Văn Dũng', 'Huỳnh Thị Em', 'Lâm Văn Giang', 'Cao Thị Hạnh',
    'Trịnh Văn Khôi', 'Nguyễn Thị Liên', 'Trần Văn Minh', 'Lê Thị Ngọc', 'Phạm Văn Phong',
    'Hoàng Thị Quyên', 'Vũ Văn Rồng', 'Đặng Thị Sen', 'Bùi Văn Thắng', 'Ngô Thị Út',
    'Trương Văn Vinh', 'Lý Thị Xuyến', 'Phan Văn Yên', 'Hồ Thị Ánh', 'Dương Văn Bình',
    'Võ Thị Cẩm', 'Đinh Văn Danh', 'Lưu Thị Én', 'Đỗ Văn Phát', 'Mai Thị Gấm',
    'Tạ Văn Hải', 'Chu Thị Ivy', 'Thái Văn Khải', 'Huỳnh Thị Loan', 'Lâm Văn Mạnh'
  ];
  v_student_id UUID;
  v_phone TEXT;
BEGIN
  -- Cập nhật tên cho học viên STUDENT hiện có
  FOR i IN 1..(SELECT COUNT(*) FROM public.users u 
                JOIN public.roles r ON u.role_id = r.id 
                WHERE r.code = 'STUDENT') LOOP
    -- Lấy học viên thứ i
    SELECT u.id INTO v_student_id 
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id 
    WHERE r.code = 'STUDENT'
    ORDER BY u.created_at
    LIMIT 1 OFFSET i-1;
    
    IF v_student_id IS NOT NULL THEN
      v_phone := '09' || LPAD((FLOOR(RANDOM() * 100000000)::INT)::TEXT, 8, '0');
      
      UPDATE public.users 
      SET 
        full_name = v_names[(i-1) % 50 + 1],
        phone = v_phone,
        updated_at = NOW()
      WHERE id = v_student_id;
      
      v_counter := v_counter + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Đã cập nhật tên cho % học viên', v_counter;
END $$;

-- Kiểm tra kết quả
SELECT COUNT(*) AS total_students FROM public.users u
JOIN public.roles r ON u.role_id = r.id WHERE r.code = 'STUDENT';


-- ============================================================
-- PHẦN 2: TẠO 5 KHÓA HỌC (Courses) nếu chưa có
-- ============================================================
INSERT INTO public.courses (code, title, description, category, level, duration_weeks, total_sessions, price)
VALUES 
  ('IELTS-01', 'IELTS Foundation', 'Khóa IELTS cơ bản cho người mới bắt đầu', 'IELTS', 'Beginner', 12, 36, 8500000),
  ('IELTS-02', 'IELTS Intensive', 'Khóa IELTS luyện thi chuyên sâu', 'IELTS', 'Intermediate', 8, 24, 12000000),
  ('TOEIC-01', 'TOEIC 500+', 'Khóa TOEIC mục tiêu 500+', 'TOEIC', 'Beginner', 10, 30, 6500000),
  ('TOEIC-02', 'TOEIC 700+', 'Khóa TOEIC mục tiêu 700+', 'TOEIC', 'Intermediate', 8, 24, 7500000),
  ('ENG-01', 'Giao tiếp cơ bản', 'Tiếng Anh giao tiếp cho người đi làm', 'Communication', 'Beginner', 12, 36, 5000000)
ON CONFLICT (code) DO NOTHING;

-- Kiểm tra khóa học
SELECT id, code, title, price FROM public.courses;


-- ============================================================
-- PHẦN 3: TẠO 10 LỚP HỌC (Classes)
-- ============================================================
DO $$
DECLARE
  v_course_ids UUID[];
  v_center_id UUID;
  v_teacher_id UUID;
  v_schedules TEXT[] := ARRAY[
    '[{"day":2,"start":"18:00","end":"20:00"},{"day":4,"start":"18:00","end":"20:00"}]',
    '[{"day":3,"start":"19:00","end":"21:00"},{"day":5,"start":"19:00","end":"21:00"}]',
    '[{"day":2,"start":"09:00","end":"11:00"},{"day":6,"start":"09:00","end":"11:00"}]',
    '[{"day":7,"start":"08:00","end":"10:00"},{"day":7,"start":"14:00","end":"16:00"}]',
    '[{"day":4,"start":"18:30","end":"20:30"},{"day":6,"start":"18:30","end":"20:30"}]'
  ];
  v_rooms TEXT[] := ARRAY['P.101', 'P.102', 'P.201', 'P.202', 'P.301', 'P.302', 'P.LAB1', 'P.LAB2', 'P.VIP1', 'P.VIP2'];
  v_statuses TEXT[] := ARRAY['ongoing', 'ongoing', 'ongoing', 'upcoming', 'completed', 'ongoing', 'ongoing', 'upcoming', 'completed', 'ongoing'];
BEGIN
  -- Lấy tất cả course IDs
  SELECT ARRAY_AGG(id) INTO v_course_ids FROM public.courses LIMIT 5;
  -- Lấy center
  SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  -- Lấy teacher (nếu có)
  SELECT u.id INTO v_teacher_id FROM public.users u
  JOIN public.roles r ON u.role_id = r.id 
  WHERE r.code IN ('TEACHER', 'SUPER_ADMIN') LIMIT 1;
  
  -- Tạo 10 lớp
  FOR i IN 1..10 LOOP
    INSERT INTO public.classes (
      code, name, course_id, center_id, teacher_id, 
      start_date, end_date, schedule, room, max_students, status, created_at
    )
    VALUES (
      'CLS-2025-' || LPAD(i::TEXT, 2, '0'),
      CASE 
        WHEN i <= 2 THEN 'IELTS Foundation - Lớp ' || i
        WHEN i <= 4 THEN 'IELTS Intensive - Lớp ' || (i-2)
        WHEN i <= 6 THEN 'TOEIC 500+ - Lớp ' || (i-4)
        WHEN i <= 8 THEN 'TOEIC 700+ - Lớp ' || (i-6)
        ELSE 'Giao tiếp - Lớp ' || (i-8)
      END,
      v_course_ids[((i-1) % 5) + 1],
      v_center_id,
      v_teacher_id,
      CURRENT_DATE - ((12 - i) * 15 || ' days')::INTERVAL, -- Ngày bắt đầu
      CURRENT_DATE + ((i * 30) || ' days')::INTERVAL, -- Ngày kết thúc
      v_schedules[((i-1) % 5) + 1],
      v_rooms[i],
      20 + (i % 5) * 5, -- Max 20-35 học viên
      v_statuses[i],
      NOW() - ((12-i) * 15 || ' days')::INTERVAL
    )
    ON CONFLICT (code) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '✅ Đã tạo 10 lớp học';
END $$;

-- Kiểm tra lớp học
SELECT id, code, name, status, max_students FROM public.classes ORDER BY created_at;


-- ============================================================
-- PHẦN 4: TẠO ENROLLMENTS (Ghi danh học viên vào các lớp)
-- ============================================================
DO $$
DECLARE
  v_student_ids UUID[];
  v_class_record RECORD;
  v_student_id UUID;
  v_tuition NUMERIC;
  v_paid NUMERIC;
  v_discount NUMERIC;
  v_enrolled_date TIMESTAMPTZ;
  v_count INT := 0;
  v_student_count INT;
BEGIN
  -- Lấy tất cả student IDs
  SELECT ARRAY_AGG(u.id) INTO v_student_ids 
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id 
  WHERE r.code = 'STUDENT';
  
  v_student_count := ARRAY_LENGTH(v_student_ids, 1);
  
  IF v_student_count IS NULL OR v_student_count = 0 THEN
    RAISE EXCEPTION 'Chưa có học viên nào! Hãy tạo học viên trước.';
  END IF;
  
  RAISE NOTICE 'Có % học viên để ghi danh', v_student_count;
  
  -- Duyệt qua từng lớp
  FOR v_class_record IN 
    SELECT cl.id, cl.status, cl.start_date, co.price 
    FROM public.classes cl
    JOIN public.courses co ON cl.course_id = co.id
    ORDER BY cl.created_at
  LOOP
    -- Random 4-8 học viên cho mỗi lớp
    FOR i IN 1..(4 + FLOOR(RANDOM() * 5)::INT) LOOP
      -- Lấy random student từ danh sách có
      v_student_id := v_student_ids[1 + FLOOR(RANDOM() * v_student_count)::INT];
      v_tuition := v_class_record.price;
      
      -- Random discount 0-20%
      v_discount := FLOOR(RANDOM() * 0.2 * v_tuition);
      
      -- Random paid amount (50%-100% của tuition - discount)
      v_paid := FLOOR((0.5 + RANDOM() * 0.5) * (v_tuition - v_discount));
      
      -- Enrolled date dựa trên class start date
      v_enrolled_date := v_class_record.start_date - (RANDOM() * 14 || ' days')::INTERVAL;
      
      INSERT INTO public.enrollments (
        student_id, class_id, enrolled_at, status,
        tuition_fee, discount_amount, paid_amount, notes, created_at
      )
      VALUES (
        v_student_id,
        v_class_record.id,
        v_enrolled_date,
        CASE 
          WHEN v_class_record.status = 'completed' THEN 'completed'
          WHEN RANDOM() > 0.95 THEN 'dropped'
          ELSE 'active'
        END,
        v_tuition,
        v_discount,
        v_paid,
        CASE WHEN RANDOM() > 0.7 THEN 'Học viên mới giới thiệu' ELSE NULL END,
        v_enrolled_date
      )
      ON CONFLICT (student_id, class_id) DO NOTHING;
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Đã tạo % enrollments', v_count;
END $$;

-- Kiểm tra enrollments
SELECT 
  COUNT(*) AS total_enrollments,
  SUM(paid_amount) AS total_revenue,
  SUM(tuition_fee - discount_amount - paid_amount) AS total_debt
FROM public.enrollments;


-- ============================================================
-- PHẦN 5: TẠO SESSIONS (Buổi học) cho các lớp ONGOING
-- ============================================================
DO $$
DECLARE
  v_class_record RECORD;
  v_schedule JSONB;
  v_schedule_item JSONB;
  v_current_date DATE;
  v_day_of_week INT;
  v_session_number INT;
  v_created_count INT := 0;
BEGIN
  -- Duyệt qua các lớp ongoing
  FOR v_class_record IN 
    SELECT id, start_date, end_date, schedule, status
    FROM public.classes 
    WHERE status IN ('ongoing', 'completed')
      AND schedule IS NOT NULL
  LOOP
    v_session_number := 0;
    v_schedule := v_class_record.schedule::JSONB;
    v_current_date := v_class_record.start_date;
    
    -- Tạo sessions từ start_date đến hôm nay hoặc end_date
    WHILE v_current_date <= LEAST(CURRENT_DATE, v_class_record.end_date) AND v_session_number < 50 LOOP
      v_day_of_week := EXTRACT(DOW FROM v_current_date)::INT;
      -- PostgreSQL: 0=Sunday, 1=Monday... (giống JS)
      
      FOR v_schedule_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF (v_schedule_item->>'day')::INT = v_day_of_week THEN
          v_session_number := v_session_number + 1;
          
          INSERT INTO public.sessions (
            class_id, session_number, session_date,
            start_time, end_time, status, created_at
          )
          VALUES (
            v_class_record.id,
            v_session_number,
            v_current_date,
            (v_schedule_item->>'start')::TIME,
            (v_schedule_item->>'end')::TIME,
            CASE 
              WHEN v_current_date < CURRENT_DATE THEN 'completed'
              WHEN v_current_date = CURRENT_DATE THEN 'ongoing'
              ELSE 'scheduled'
            END,
            v_current_date
          )
          ON CONFLICT DO NOTHING;
          
          v_created_count := v_created_count + 1;
        END IF;
      END LOOP;
      
      v_current_date := v_current_date + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Đã tạo % sessions', v_created_count;
END $$;

-- Kiểm tra sessions
SELECT 
  c.name AS class_name,
  COUNT(s.id) AS total_sessions,
  MIN(s.session_date) AS first_session,
  MAX(s.session_date) AS last_session
FROM public.classes c
LEFT JOIN public.sessions s ON c.id = s.class_id
GROUP BY c.id, c.name
ORDER BY c.name;


-- ============================================================
-- PHẦN 6: TẠO ATTENDANCE (Điểm danh)
-- ============================================================
DO $$
DECLARE
  v_session RECORD;
  v_enrollment RECORD;
  v_status TEXT;
  v_count INT := 0;
BEGIN
  -- Duyệt qua từng session đã hoàn thành
  FOR v_session IN 
    SELECT s.id AS session_id, s.class_id, s.session_date, s.session_number
    FROM public.sessions s
    WHERE s.status = 'completed'
    ORDER BY s.session_date
  LOOP
    -- Duyệt qua từng enrollment của class
    FOR v_enrollment IN 
      SELECT id FROM public.enrollments 
      WHERE class_id = v_session.class_id
        AND status = 'active'
    LOOP
      -- Random status: 85% có mặt, 10% vắng, 5% trễ
      v_status := CASE 
        WHEN RANDOM() < 0.85 THEN 'present'
        WHEN RANDOM() < 0.95 THEN 'absent'
        ELSE 'late'
      END;
      
      INSERT INTO public.attendance (
        enrollment_id, session_date, session_number, status, created_at
      )
      VALUES (
        v_enrollment.id,
        v_session.session_date,
        v_session.session_number,
        v_status,
        v_session.session_date
      )
      ON CONFLICT (enrollment_id, session_date) DO NOTHING;
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Đã tạo % attendance records', v_count;
END $$;

-- Kiểm tra attendance
SELECT 
  status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percent
FROM public.attendance
GROUP BY status;


-- ============================================================
-- PHẦN 7: TẠO GRADE STRUCTURES & GRADES
-- ============================================================
-- 7.1 Tạo cấu trúc điểm cho các khóa học
INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
SELECT 
  c.id,
  gs.name,
  gs.weight,
  gs.max_score,
  gs.order_index,
  gs.description
FROM public.courses c
CROSS JOIN (
  VALUES 
    ('Bài tập', 0.20::DECIMAL, 10.00, 1, 'Điểm bài tập định kỳ'),
    ('Kiểm tra giữa kỳ', 0.30::DECIMAL, 10.00, 2, 'Điểm kiểm tra giữa kỳ'),
    ('Thi cuối kỳ', 0.50::DECIMAL, 10.00, 3, 'Điểm thi cuối kỳ')
) AS gs(name, weight, max_score, order_index, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.grade_structures 
  WHERE course_id = c.id AND name = gs.name
);

-- 7.2 Tạo điểm cho học viên
DO $$
DECLARE
  v_enrollment RECORD;
  v_structure RECORD;
  v_score NUMERIC;
  v_count INT := 0;
BEGIN
  -- Duyệt qua từng enrollment
  FOR v_enrollment IN 
    SELECT e.id AS enrollment_id, cl.course_id
    FROM public.enrollments e
    JOIN public.classes cl ON e.class_id = cl.id
    WHERE e.status IN ('active', 'completed')
  LOOP
    -- Duyệt qua từng cột điểm
    FOR v_structure IN 
      SELECT id, max_score FROM public.grade_structures 
      WHERE course_id = v_enrollment.course_id
    LOOP
      -- Random điểm 5.0-10.0 (phân bố chuẩn)
      v_score := ROUND((5 + RANDOM() * 5)::NUMERIC, 1);
      IF v_score > v_structure.max_score THEN
        v_score := v_structure.max_score;
      END IF;
      
      INSERT INTO public.grades (enrollment_id, grade_structure_id, score, created_at)
      VALUES (v_enrollment.enrollment_id, v_structure.id, v_score, NOW())
      ON CONFLICT DO NOTHING;
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Đã tạo % grades', v_count;
END $$;

-- Kiểm tra grades
SELECT 
  gs.name AS grade_type,
  COUNT(g.id) AS count,
  ROUND(AVG(g.score), 2) AS avg_score,
  MIN(g.score) AS min_score,
  MAX(g.score) AS max_score
FROM public.grade_structures gs
LEFT JOIN public.grades g ON gs.id = g.grade_structure_id
GROUP BY gs.id, gs.name, gs.order_index
ORDER BY gs.order_index;


-- ============================================================
-- PHẦN 8: KIỂM TRA TỔNG QUAN DASHBOARD DATA
-- ============================================================

-- 8.1 Tổng quan
SELECT 
  (SELECT COUNT(*) FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE r.code = 'STUDENT') AS total_students,
  (SELECT COUNT(*) FROM public.classes WHERE status IN ('ongoing', 'upcoming')) AS active_classes,
  (SELECT COUNT(*) FROM public.courses) AS total_courses,
  (SELECT COALESCE(SUM(paid_amount), 0) FROM public.enrollments) AS total_revenue,
  (SELECT COALESCE(SUM(tuition_fee - discount_amount - paid_amount), 0) FROM public.enrollments WHERE tuition_fee - discount_amount - paid_amount > 0) AS total_debt;

-- 8.2 Doanh thu theo tháng (tính từ enrollment created_at)
SELECT 
  TO_CHAR(created_at, 'MM/YYYY') AS month,
  SUM(paid_amount) AS revenue,
  COUNT(*) AS enrollment_count
FROM public.enrollments
WHERE paid_amount > 0
GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at);

-- 8.3 Phân bố khóa học
SELECT 
  co.title AS course_name,
  COUNT(e.id) AS student_count
FROM public.courses co
LEFT JOIN public.classes cl ON co.id = cl.course_id
LEFT JOIN public.enrollments e ON cl.id = e.class_id
GROUP BY co.id, co.title
ORDER BY student_count DESC;

-- ============================================================
-- ✅ HOÀN TẤT SEED DATA!
-- ============================================================
