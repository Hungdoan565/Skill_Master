-- ============================================================
-- SKILL MASTER - SEED DATA & ADMIN SETUP
-- Version: 1.0
-- Description: Dữ liệu mẫu và thiết lập Admin
-- 
-- QUAN TRỌNG: Chạy file này SAU khi đã chạy 01_schema.sql và 02_rls_policies.sql
-- ============================================================

-- ============================================================
-- 1. THĂNG CHỨC USER LÊN SUPER_ADMIN
-- ============================================================
-- Thay 'admin@skillmaster.edu.vn' bằng email của bạn
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN')
WHERE email = 'admin@skillmaster.edu.vn';

-- ============================================================
-- 2. SEED COURSES MẪU
-- ============================================================
INSERT INTO public.courses (code, title, description, category, level, duration_weeks, total_sessions, price)
VALUES 
  ('IELTS-BASIC', 'IELTS Foundation', 'Khóa học IELTS cơ bản cho người mới bắt đầu', 'english', 'beginner', 8, 24, 4500000),
  ('IELTS-ADV', 'IELTS Advanced', 'Khóa học IELTS nâng cao, target 7.0+', 'english', 'advanced', 12, 36, 7500000),
  ('TOEIC-500', 'TOEIC 500+', 'Khóa học TOEIC target 500 điểm', 'english', 'elementary', 6, 18, 3500000),
  ('TOEIC-700', 'TOEIC 700+', 'Khóa học TOEIC target 700 điểm', 'english', 'intermediate', 8, 24, 5000000),
  ('PY-BASIC', 'Python Cơ bản', 'Lập trình Python từ zero đến hero', 'programming', 'beginner', 10, 30, 4000000),
  ('WEB-FULLSTACK', 'Web Development Fullstack', 'Học làm web từ Frontend đến Backend', 'programming', 'intermediate', 16, 48, 12000000),
  ('OFFICE-BASIC', 'Tin học văn phòng', 'Word, Excel, PowerPoint cơ bản', 'office', 'beginner', 4, 12, 1500000)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. KIỂM TRA KẾT QUẢ
-- ============================================================

-- Kiểm tra users và roles
SELECT 
  u.email, 
  u.full_name, 
  r.code AS role_code, 
  r.name AS role_name,
  c.name AS center_name
FROM public.users u 
LEFT JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.centers c ON u.center_id = c.id;

-- Kiểm tra courses
SELECT code, title, category, level, price 
FROM public.courses 
ORDER BY created_at DESC;

-- Kiểm tra RLS đã bật chưa
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- ============================================================
-- DONE! Seed data inserted successfully
-- ============================================================
