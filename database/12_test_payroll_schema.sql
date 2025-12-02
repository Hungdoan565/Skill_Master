-- ============================================================
-- Test script để verify payroll schema
-- ============================================================

-- 1. Kiểm tra hourly_rate đã add vào users chưa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'hourly_rate';

-- 2. Kiểm tra payroll table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;

-- 3. Kiểm tra sessions có các trường payroll chưa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name IN ('duration_hours', 'teacher_rate', 'is_locked', 'payroll_id', 'topic')
ORDER BY ordinal_position;

-- 4. Kiểm tra view thống kê
SELECT * FROM information_schema.views WHERE table_name = 'v_teacher_monthly_stats';

-- 5. Kiểm tra RLS policies
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'payroll';

-- 6. Test function tính lương
SELECT * FROM public.calculate_teacher_payroll(
  (SELECT id FROM public.users LIMIT 1)::UUID, 
  12, 
  2025
);

-- ============================================================
-- Output: Nếu tất cả queries trên đều chạy thành công → Schema OK!
-- ============================================================
