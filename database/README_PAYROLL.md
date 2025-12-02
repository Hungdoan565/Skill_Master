-- ============================================================
-- EXECUTION ORDER FOR PAYROLL FEATURE
-- ============================================================

-- Step 1: Ensure sessions table và các columns có layout đúng
-- File: 04_sessions_table.sql
-- Thêm: sessions table, attendance join, trigger auto-generate

-- Step 2: Nâng cấp schema cho payroll
-- File: 11_payroll_upgrade.sql
-- Thêm: hourly_rate (users), duration_hours, teacher_rate, is_locked, payroll table, RLS, function tính lương

-- Step 3: Verify schema (Optional, để debug)
-- File: 12_test_payroll_schema.sql
-- Chạy các queries để kiểm tra tất cả đã setup đúng

-- ============================================================
-- NOTES:
-- ============================================================

-- 1. Trigger generate_class_sessions sẽ tự động:
-- - Sinh sessions khi INSERT/UPDATE class (start_date, end_date, schedule, teacher_id)
-- - Tính duration_hours = (end_time - start_time)
-- - Lấy teacher_rate snapshot từ users.hourly_rate
-- - Set is_locked = FALSE (sẽ lock khi tính lương)

-- 2. Function calculate_teacher_payroll(teacher_id, month, year):
-- - Tính tổng giờ dạy (duration_hours) của GV trong tháng
-- - Tính tổng lương = SUM(duration_hours \* teacher_rate)
-- - Chỉ tính sessions có status = 'completed'

-- 3. RLS Policies:
-- - Giáo viên chỉ xem lương của mình
-- - Authenticated users có thể xem/insert/update/delete payroll (Backend kiểm tra role)

-- 4. IMPORTANT:
-- - Không edit duration_hours, teacher_rate, is_locked sau khi lock (để đảm bảo audit trail)
-- - payroll_id được set khi bảng lương được create/approve

-- ============================================================
