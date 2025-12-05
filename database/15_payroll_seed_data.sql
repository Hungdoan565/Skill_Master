-- ============================================================
-- SEED DATA FOR PAYROLL FEATURE
-- Version: 1.0
-- Description: Dữ liệu mẫu để test tính năng Bảng lương
-- ============================================================

-- ============================================================
-- 1. CẬP NHẬT HOURLY_RATE CHO GIÁO VIÊN
-- ============================================================

-- Cập nhật hourly_rate cho tất cả giáo viên chưa có
UPDATE public.users u
SET hourly_rate = CASE 
  WHEN hourly_rate IS NULL OR hourly_rate = 0 THEN 
    CASE 
      WHEN u.email LIKE '%teacher1%' THEN 200000
      WHEN u.email LIKE '%teacher2%' THEN 180000
      WHEN u.email LIKE '%teacher3%' THEN 250000
      ELSE 150000 + (RANDOM() * 100000)::INT
    END
  ELSE hourly_rate
END
FROM public.roles r
WHERE u.role_id = r.id AND r.code = 'TEACHER';

-- ============================================================
-- 2. CẬP NHẬT SESSIONS ĐỂ CÓ DỮ LIỆU PAYROLL
-- ============================================================

-- Cập nhật duration_hours dựa trên start_time và end_time
UPDATE public.sessions
SET duration_hours = EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600
WHERE duration_hours IS NULL OR duration_hours = 0;

-- Cập nhật teacher_rate cho sessions (lấy từ teacher's hourly_rate)
UPDATE public.sessions s
SET teacher_rate = COALESCE(
  (SELECT u.hourly_rate FROM public.users u WHERE u.id = s.teacher_id),
  150000
)
WHERE teacher_rate IS NULL OR teacher_rate = 0;

-- Đánh dấu một số sessions là completed (trong 3 tháng gần đây)
-- Chỉ update những session có ngày trong quá khứ
UPDATE public.sessions
SET status = 'completed'
WHERE session_date < CURRENT_DATE
  AND status = 'scheduled';

-- ============================================================
-- 3. TẠO PAYROLL CHO THÁNG HIỆN TẠI VÀ THÁNG TRƯỚC
-- ============================================================

-- Xóa dữ liệu cũ (nếu chạy lại)
-- DELETE FROM public.payroll WHERE notes LIKE '%SEED DATA%';

-- Tạo payroll cho các giáo viên (tháng trước)
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
  notes
)
SELECT 
  u.id as teacher_id,
  EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::INT as period_month,
  EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INT as period_year,
  COALESCE(sess.total_sessions, 0) as total_sessions,
  COALESCE(sess.total_hours, 0) as total_hours,
  COALESCE(sess.base_salary, 0) as base_salary,
  CASE WHEN RANDOM() > 0.5 THEN (RANDOM() * 500000)::INT ELSE 0 END as bonus,
  CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 200000)::INT ELSE 0 END as deduction,
  COALESCE(sess.base_salary, 0) 
    + CASE WHEN RANDOM() > 0.5 THEN (RANDOM() * 500000)::INT ELSE 0 END
    - CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 200000)::INT ELSE 0 END as net_salary,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'paid'
    WHEN RANDOM() > 0.4 THEN 'approved'
    ELSE 'draft'
  END as status,
  'SEED DATA - Tháng trước' as notes
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
LEFT JOIN (
  SELECT 
    teacher_id,
    COUNT(*) as total_sessions,
    SUM(duration_hours) as total_hours,
    SUM(duration_hours * COALESCE(teacher_rate, 150000)) as base_salary
  FROM public.sessions
  WHERE status = 'completed'
    AND EXTRACT(MONTH FROM session_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND EXTRACT(YEAR FROM session_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
  GROUP BY teacher_id
) sess ON u.id = sess.teacher_id
WHERE r.code = 'TEACHER' AND u.status = 'active'
ON CONFLICT (teacher_id, period_month, period_year) DO NOTHING;

-- Tạo payroll cho tháng hiện tại (draft)
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
  notes
)
SELECT 
  u.id as teacher_id,
  EXTRACT(MONTH FROM CURRENT_DATE)::INT as period_month,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT as period_year,
  COALESCE(sess.total_sessions, 0) as total_sessions,
  COALESCE(sess.total_hours, 0) as total_hours,
  COALESCE(sess.base_salary, 0) as base_salary,
  0 as bonus,
  0 as deduction,
  COALESCE(sess.base_salary, 0) as net_salary,
  'draft' as status,
  'SEED DATA - Tháng hiện tại' as notes
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
LEFT JOIN (
  SELECT 
    teacher_id,
    COUNT(*) as total_sessions,
    SUM(duration_hours) as total_hours,
    SUM(duration_hours * COALESCE(teacher_rate, 150000)) as base_salary
  FROM public.sessions
  WHERE status = 'completed'
    AND EXTRACT(MONTH FROM session_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM session_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY teacher_id
) sess ON u.id = sess.teacher_id
WHERE r.code = 'TEACHER' AND u.status = 'active'
ON CONFLICT (teacher_id, period_month, period_year) DO NOTHING;

-- ============================================================
-- 4. KIỂM TRA KẾT QUẢ
-- ============================================================

-- Hiển thị số lượng payroll đã tạo
SELECT 
  status,
  COUNT(*) as count,
  SUM(net_salary) as total_salary
FROM public.payroll
GROUP BY status;

-- Hiển thị chi tiết payroll
SELECT 
  p.id,
  u.full_name as teacher_name,
  p.period_month,
  p.period_year,
  p.total_sessions,
  p.total_hours,
  p.base_salary,
  p.bonus,
  p.deduction,
  p.net_salary,
  p.status
FROM public.payroll p
JOIN public.users u ON p.teacher_id = u.id
ORDER BY p.period_year DESC, p.period_month DESC, u.full_name;
