-- Skill Master database submission bundle
-- Generated from database/*.sql

-- >>> BEGIN FILE: 01_schema.sql
-- ============================================================
-- SKILL MASTER DATABASE SCHEMA
-- Version: 1.0 (Simplified - compatible with existing DB)
-- Description: Schema chính cho hệ thống quản lý trung tâm đào tạo
-- ============================================================

-- 1. Enable UUID extension (Bắt buộc)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. BẢNG ROLES - Vai trò người dùng
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data for Roles
INSERT INTO public.roles (code, name, description) VALUES
  ('SUPER_ADMIN', 'Super Admin', 'Quản trị viên cao nhất, toàn quyền hệ thống'),
  ('CENTER_MANAGER', 'Center Manager', 'Quản lý trung tâm'),
  ('TEACHER', 'Teacher', 'Giáo viên'),
  ('STUDENT', 'Student', 'Học viên')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. BẢNG CENTERS - Trung tâm đào tạo (Simple version)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  hotline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data for Centers
INSERT INTO public.centers (name, address, hotline) 
SELECT 'Skill Master Main Center', '123 Nguyen Hue, District 1, HCMC', '1900-1234'
WHERE NOT EXISTS (SELECT 1 FROM public.centers LIMIT 1);

-- ============================================================
-- 4. BẢNG USERS - Người dùng (Linked with Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Foreign Keys
  center_id UUID REFERENCES public.centers(id),
  role_id UUID REFERENCES public.roles(id),
  
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG COURSES - Khóa học
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  category TEXT NOT NULL,
  level TEXT,
  
  duration_weeks INT DEFAULT 4,
  total_sessions INT DEFAULT 24,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  cover_image TEXT,
  
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. BẢNG CLASSES - Lớp học
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  course_id UUID NOT NULL REFERENCES public.courses(id),
  center_id UUID NOT NULL REFERENCES public.centers(id),
  teacher_id UUID REFERENCES public.users(id),
  
  start_date DATE,
  end_date DATE,
  schedule TEXT,
  room TEXT,
  max_students INT DEFAULT 20,
  
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. BẢNG ENROLLMENTS - Ghi danh học viên
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  student_id UUID NOT NULL REFERENCES public.users(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'transferred')),
  
  -- Payment info
  tuition_fee NUMERIC(12,2),
  discount_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: 1 student chỉ được ghi danh 1 lần vào 1 lớp
  UNIQUE(student_id, class_id)
);

-- ============================================================
-- 8. BẢNG ATTENDANCE - Điểm danh
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id),
  session_date DATE NOT NULL,
  session_number INT,
  
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  
  marked_by UUID REFERENCES public.users(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: 1 học viên chỉ có 1 record điểm danh cho 1 buổi học
  UNIQUE(enrollment_id, session_date)
);

-- ============================================================
-- 9. TRIGGER: Tự động tạo user trong public.users khi đăng ký
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  default_center_id UUID;
BEGIN
  -- Lấy role STUDENT mặc định
  SELECT id INTO default_role_id FROM public.roles WHERE code = 'STUDENT';
  
  -- Lấy center đầu tiên làm mặc định
  SELECT id INTO default_center_id FROM public.centers LIMIT 1;

  INSERT INTO public.users (id, email, full_name, role_id, center_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    default_role_id,
    default_center_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo trigger mới
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. INDEXES - Tối ưu query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_center_id ON public.users(center_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_center_id ON public.classes(center_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_id ON public.attendance(enrollment_id);

-- ============================================================
-- DONE! Schema created successfully
-- ============================================================


-- <<< END FILE: 01_schema.sql

-- >>> BEGIN FILE: 02_rls_policies.sql
-- ============================================================
-- SKILL MASTER - ROW LEVEL SECURITY (RLS) POLICIES
-- Version: 1.0
-- Description: Bảo mật database với RLS
-- 
-- QUAN TRỌNG: Chạy file này SAU khi đã chạy 01_schema.sql
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS CHO TẤT CẢ CÁC BẢNG
-- ============================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLICIES CHO BẢNG ROLES
-- ============================================================

-- Ai cũng XEM được roles (để hiển thị dropdown)
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;
CREATE POLICY "Roles are viewable by everyone"
ON public.roles FOR SELECT
USING (true);

-- Chỉ SUPER_ADMIN mới được sửa roles
DROP POLICY IF EXISTS "Only super admins can modify roles" ON public.roles;
CREATE POLICY "Only super admins can modify roles"
ON public.roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN')
  )
);

-- ============================================================
-- 3. POLICIES CHO BẢNG CENTERS
-- ============================================================

-- Ai cũng XEM được centers
DROP POLICY IF EXISTS "Centers are viewable by everyone" ON public.centers;
CREATE POLICY "Centers are viewable by everyone"
ON public.centers FOR SELECT
USING (true);

-- Chỉ SUPER_ADMIN và CENTER_MANAGER mới được quản lý centers
DROP POLICY IF EXISTS "Only admins can manage centers" ON public.centers;
CREATE POLICY "Only admins can manage centers"
ON public.centers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- 4. POLICIES CHO BẢNG USERS
-- ============================================================

-- Ai cũng XEM được thông tin cơ bản của users (tên, avatar)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- Chỉ được UPDATE thông tin của chính mình
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin được UPDATE tất cả users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- INSERT: Cho phép trigger tạo user mới (SECURITY DEFINER)
-- Hoặc Admin tạo thủ công
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
CREATE POLICY "Allow insert for new users"
ON public.users FOR INSERT
WITH CHECK (
  -- Cho phép nếu là user mới tự đăng ký (id trùng với auth.uid())
  auth.uid() = id
  OR
  -- Hoặc Admin tạo thủ công
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- 5. POLICIES CHO BẢNG COURSES
-- ============================================================

-- Ai cũng XEM được courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone"
ON public.courses FOR SELECT
USING (true);

-- Chỉ Admin mới được TẠO/SỬA/XÓA courses
DROP POLICY IF EXISTS "Only admins can manage courses" ON public.courses;
CREATE POLICY "Only admins can manage courses"
ON public.courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- 6. POLICIES CHO BẢNG CLASSES
-- ============================================================

-- Học viên chỉ XEM được classes mà mình đã ghi danh
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
CREATE POLICY "Students can view enrolled classes"
ON public.classes FOR SELECT
USING (
  id IN (
    SELECT class_id FROM public.enrollments WHERE student_id = auth.uid()
  )
);

-- Giáo viên XEM được classes mình dạy + tất cả classes (để chọn)
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
CREATE POLICY "Teachers can view classes"
ON public.classes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('TEACHER', 'SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- Chỉ Admin mới được quản lý classes
DROP POLICY IF EXISTS "Only admins can manage classes" ON public.classes;
CREATE POLICY "Only admins can manage classes"
ON public.classes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- 7. POLICIES CHO BẢNG ENROLLMENTS
-- ============================================================

-- Học viên chỉ XEM được enrollments của chính mình
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments"
ON public.enrollments FOR SELECT
USING (student_id = auth.uid());

-- Giáo viên và Admin xem được TẤT CẢ enrollments
DROP POLICY IF EXISTS "Staff can view all enrollments" ON public.enrollments;
CREATE POLICY "Staff can view all enrollments"
ON public.enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles 
      WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  )
);

-- Chỉ Admin mới được TẠO/SỬA/XÓA enrollments
DROP POLICY IF EXISTS "Only admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Only admins can manage enrollments"
ON public.enrollments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- 8. POLICIES CHO BẢNG ATTENDANCE
-- ============================================================

-- Học viên XEM được điểm danh của chính mình
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
USING (
  enrollment_id IN (
    SELECT id FROM public.enrollments WHERE student_id = auth.uid()
  )
);

-- Giáo viên và Admin xem được TẤT CẢ attendance
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
CREATE POLICY "Staff can view all attendance"
ON public.attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles 
      WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  )
);

-- Giáo viên được điểm danh (INSERT/UPDATE) cho lớp mình dạy
DROP POLICY IF EXISTS "Teachers can mark attendance for their classes" ON public.attendance;
CREATE POLICY "Teachers can mark attendance for their classes"
ON public.attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON e.class_id = c.id
    WHERE e.id = enrollment_id
    AND c.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  )
);

-- ============================================================
-- DONE! RLS Policies created successfully
-- ============================================================


-- <<< END FILE: 02_rls_policies.sql

-- >>> BEGIN FILE: 03_seed_data.sql
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


-- <<< END FILE: 03_seed_data.sql

-- >>> BEGIN FILE: 04_invoices.sql
-- ============================================================
-- INVOICES TABLE - Hóa đơn học phí
-- Version: 1.0
-- Description: Quản lý công nợ và thanh toán học phí
-- ============================================================

-- ============================================================
-- 1. BẢNG INVOICES - Hóa đơn
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Mã hóa đơn tự động: INV-YYYYMMDD-XXXX
  invoice_code TEXT UNIQUE,
  
  -- Liên kết
  student_id UUID NOT NULL REFERENCES public.users(id),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id),
  
  -- Thông tin tài chính
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,           -- Tổng tiền gốc
  discount_amount NUMERIC(12,2) DEFAULT 0,           -- Giảm giá
  final_amount NUMERIC(12,2) NOT NULL DEFAULT 0,     -- Số tiền phải đóng (amount - discount)
  paid_amount NUMERIC(12,2) DEFAULT 0,               -- Đã thanh toán
  
  -- Trạng thái
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled', 'refunded')),
  
  -- Thông tin bổ sung
  description TEXT,                                   -- Mô tả (VD: "Học phí lớp IELTS-ADV-K12")
  due_date DATE,                                      -- Hạn thanh toán
  paid_at TIMESTAMPTZ,                               -- Ngày thanh toán đủ
  
  -- Audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG PAYMENTS - Lịch sử thanh toán (Chi tiết từng lần đóng)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  amount NUMERIC(12,2) NOT NULL,                     -- Số tiền đóng lần này
  payment_method TEXT DEFAULT 'cash',                -- cash | bank_transfer | card | momo | vnpay
  
  reference_code TEXT,                               -- Mã giao dịch ngân hàng (nếu có)
  notes TEXT,
  
  received_by UUID REFERENCES public.users(id),      -- Ai thu tiền
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. FUNCTION: Tự động tạo mã hóa đơn
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_code()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  -- Format: INV-YYYYMMDD-XXXX
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Đếm số hóa đơn trong ngày
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.invoices
  WHERE invoice_code LIKE 'INV-' || today_str || '-%';
  
  -- Tạo mã
  new_code := 'INV-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  NEW.invoice_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động tạo mã
DROP TRIGGER IF EXISTS trigger_generate_invoice_code ON public.invoices;
CREATE TRIGGER trigger_generate_invoice_code
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_code IS NULL)
  EXECUTE FUNCTION generate_invoice_code();

-- ============================================================
-- 4. FUNCTION: Cập nhật trạng thái hóa đơn khi thanh toán
-- ============================================================
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  invoice_final NUMERIC(12,2);
BEGIN
  -- Tính tổng đã thanh toán
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;
  
  -- Lấy số tiền phải đóng
  SELECT final_amount INTO invoice_final
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật invoice
  UPDATE public.invoices
  SET 
    paid_amount = total_paid,
    status = CASE 
      WHEN total_paid >= invoice_final THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    paid_at = CASE WHEN total_paid >= invoice_final THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật enrollment.paid_amount (nếu có)
  UPDATE public.enrollments
  SET paid_amount = total_paid, updated_at = NOW()
  WHERE id = (SELECT enrollment_id FROM public.invoices WHERE id = NEW.invoice_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sau khi thêm payment
DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment ON public.payments;
CREATE TRIGGER trigger_update_invoice_on_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_enrollment_id ON public.invoices(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- ============================================================
-- DONE! Invoices schema created successfully
-- ============================================================


-- <<< END FILE: 04_invoices.sql

-- >>> BEGIN FILE: 04_rooms_and_schedule_upgrade.sql
-- ============================================================
-- SKILL MASTER - UPGRADE: ROOMS & SMART SCHEDULING
-- Version: 1.1
-- Description: Thêm bảng rooms và chuyển schedule sang JSONB
-- ============================================================

-- ============================================================
-- 1. BẢNG ROOMS - Phòng học
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Thông tin cơ bản
  name TEXT NOT NULL,                -- VD: "Phòng 101", "Lab 1"
  code TEXT UNIQUE,                  -- VD: "P101", "LAB1"
  capacity INT NOT NULL DEFAULT 20,  -- Sức chứa tối đa
  
  -- Loại phòng & thiết bị
  room_type TEXT DEFAULT 'standard', -- standard, lab, meeting, online
  equipment JSONB DEFAULT '[]',      -- ["projector", "whiteboard", "computers"]
  
  -- Liên kết trung tâm
  center_id UUID NOT NULL REFERENCES public.centers(id),
  
  -- Trạng thái
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index cho rooms
CREATE INDEX IF NOT EXISTS idx_rooms_center_id ON public.rooms(center_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- ============================================================
-- 2. CHUYỂN SCHEDULE SANG JSONB
-- ============================================================
-- Backup dữ liệu cũ trước
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS schedule_old TEXT;
-- UPDATE public.classes SET schedule_old = schedule WHERE schedule IS NOT NULL;

-- Chuyển cột schedule sang JSONB
-- Nếu cột schedule đang là TEXT và có dữ liệu, cần xử lý cẩn thận
DO $$
BEGIN
  -- Kiểm tra nếu cột schedule chưa phải JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' 
    AND column_name = 'schedule' 
    AND data_type != 'jsonb'
  ) THEN
    -- Đặt các giá trị NULL hoặc chuyển đổi
    UPDATE public.classes SET schedule = NULL WHERE schedule IS NOT NULL;
    
    -- Thay đổi kiểu dữ liệu
    ALTER TABLE public.classes 
    ALTER COLUMN schedule TYPE JSONB USING COALESCE(schedule::jsonb, '[]'::jsonb);
    
    -- Đặt default
    ALTER TABLE public.classes 
    ALTER COLUMN schedule SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 3. THÊM CỘT room_id VÀO CLASSES (Thay cho cột room TEXT)
-- ============================================================
DO $$
BEGIN
  -- Thêm cột room_id nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN room_id UUID REFERENCES public.rooms(id);
    CREATE INDEX IF NOT EXISTS idx_classes_room_id ON public.classes(room_id);
  END IF;
END $$;

-- ============================================================
-- 4. SEED DATA - Phòng học mẫu
-- ============================================================
-- Lấy center_id đầu tiên
DO $$
DECLARE
  v_center_id UUID;
BEGIN
  SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  
  IF v_center_id IS NOT NULL THEN
    -- Chỉ insert nếu chưa có data
    INSERT INTO public.rooms (code, name, capacity, room_type, equipment, center_id, status)
    SELECT * FROM (VALUES
      ('P101', 'Phòng 101', 30, 'standard', '["projector", "whiteboard", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('P102', 'Phòng 102', 25, 'standard', '["projector", "whiteboard", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('P103', 'Phòng 103', 20, 'standard', '["whiteboard", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('LAB1', 'Lab 1 - Máy tính', 20, 'lab', '["computers", "projector", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('LAB2', 'Lab 2 - Máy tính', 15, 'lab', '["computers", "projector", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('MTG1', 'Phòng họp A', 10, 'meeting', '["projector", "whiteboard", "video_conference"]'::jsonb, v_center_id, 'active')
    ) AS v(code, name, capacity, room_type, equipment, center_id, status)
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE rooms.center_id = v_center_id);
  END IF;
END $$;

-- ============================================================
-- 5. COMMENT CHO CẤU TRÚC SCHEDULE JSONB
-- ============================================================
COMMENT ON COLUMN public.classes.schedule IS 
'Lịch học dạng JSONB. Cấu trúc:
[
  { "day": 2, "start": "18:00", "end": "20:00" },
  { "day": 4, "start": "18:00", "end": "20:00" },
  { "day": 6, "start": "09:00", "end": "11:00" }
]
Quy ước: day = 2 (Thứ Hai) ... day = 8 (Chủ Nhật)
';

-- ============================================================
-- DONE! Rooms table and schedule upgrade completed
-- ============================================================


-- <<< END FILE: 04_rooms_and_schedule_upgrade.sql

-- >>> BEGIN FILE: 04_sessions_table.sql
-- ============================================================
-- SESSIONS TABLE - Bảng lưu các buổi học
-- Version: 1.0
-- Description: Lưu trữ từng buổi học của mỗi lớp
-- ============================================================

-- 1. Tạo bảng SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id), -- GV dạy buổi này (có thể khác GV chính nếu dạy thay)
  
  session_number INT NOT NULL,        -- Buổi số mấy (1, 2, 3...)
  session_date DATE NOT NULL,          -- Ngày học
  start_time TIME DEFAULT '18:00',     -- Giờ bắt đầu
  end_time TIME DEFAULT '20:00',       -- Giờ kết thúc
  
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  
  notes TEXT,                          -- Ghi chú buổi học
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: 1 lớp chỉ có 1 buổi học vào 1 ngày
  UNIQUE(class_id, session_date)
);

-- 2. Tạo index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON public.sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);

-- 3. Cập nhật bảng ATTENDANCE để link với sessions thay vì enrollment
-- (Giữ nguyên cấu trúc cũ nhưng thêm session_id)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

-- 4. Tạo index cho attendance
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);

-- 5. Comment giải thích
COMMENT ON TABLE public.sessions IS 'Bảng lưu từng buổi học của mỗi lớp, được sinh tự động từ schedule của class';
COMMENT ON COLUMN public.sessions.session_number IS 'Số thứ tự buổi học (1, 2, 3...)';
COMMENT ON COLUMN public.sessions.teacher_id IS 'Giáo viên dạy buổi này, mặc định là GV chính, có thể đổi nếu dạy thay';

-- ============================================================
-- TRIGGER: Tự động sinh sessions khi tạo/cập nhật lớp học
-- ============================================================

-- Hàm sinh sessions từ schedule của class
CREATE OR REPLACE FUNCTION public.generate_class_sessions()
RETURNS TRIGGER AS $$
DECLARE
  schedule_data JSONB;
  schedule_item JSONB;
  day_num INT;
  start_time_val TIME;
  end_time_val TIME;
  loop_date DATE;
  session_num INT := 1;
  day_mapping INT[] := ARRAY[0, 1, 2, 3, 4, 5, 6]; -- day 2=Monday(1), 3=Tuesday(2)...
BEGIN
  -- Chỉ chạy khi có đủ thông tin
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL OR NEW.schedule IS NULL THEN
    RETURN NEW;
  END IF;

  -- Xóa sessions cũ của class này (nếu có)
  DELETE FROM public.sessions WHERE class_id = NEW.id;

  -- Parse schedule JSON
  BEGIN
    schedule_data := NEW.schedule::JSONB;
  EXCEPTION WHEN OTHERS THEN
    -- Nếu không phải JSON, bỏ qua
    RETURN NEW;
  END;

  -- Duyệt từng ngày từ start_date đến end_date
  loop_date := NEW.start_date;
  
  WHILE loop_date <= NEW.end_date LOOP
    -- Kiểm tra ngày này có trong schedule không
    FOR schedule_item IN SELECT * FROM jsonb_array_elements(schedule_data)
    LOOP
      day_num := (schedule_item->>'day')::INT;
      start_time_val := COALESCE((schedule_item->>'start')::TIME, '18:00'::TIME);
      end_time_val := COALESCE((schedule_item->>'end')::TIME, '20:00'::TIME);
      
      -- Chuyển đổi: day 2=T2(Monday=1), 3=T3(Tuesday=2), ..., 8=CN(Sunday=0)
      -- EXTRACT(DOW) trả về 0=Sunday, 1=Monday, ..., 6=Saturday
      IF (day_num = 2 AND EXTRACT(DOW FROM loop_date) = 1) OR  -- Thứ 2
         (day_num = 3 AND EXTRACT(DOW FROM loop_date) = 2) OR  -- Thứ 3
         (day_num = 4 AND EXTRACT(DOW FROM loop_date) = 3) OR  -- Thứ 4
         (day_num = 5 AND EXTRACT(DOW FROM loop_date) = 4) OR  -- Thứ 5
         (day_num = 6 AND EXTRACT(DOW FROM loop_date) = 5) OR  -- Thứ 6
         (day_num = 7 AND EXTRACT(DOW FROM loop_date) = 6) OR  -- Thứ 7
         (day_num = 8 AND EXTRACT(DOW FROM loop_date) = 0)     -- Chủ nhật
      THEN
        -- Insert session
        INSERT INTO public.sessions (
          class_id, 
          teacher_id, 
          session_number, 
          session_date, 
          start_time, 
          end_time, 
          status
        ) VALUES (
          NEW.id,
          NEW.teacher_id,
          session_num,
          loop_date,
          start_time_val,
          end_time_val,
          CASE 
            WHEN loop_date < CURRENT_DATE THEN 'completed'
            ELSE 'upcoming'
          END
        );
        
        session_num := session_num + 1;
        EXIT; -- Chỉ 1 buổi/ngày
      END IF;
    END LOOP;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS trigger_generate_sessions ON public.classes;
CREATE TRIGGER trigger_generate_sessions
  AFTER INSERT OR UPDATE OF start_date, end_date, schedule, teacher_id
  ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_class_sessions();

-- ============================================================
-- Chạy 1 lần để sinh sessions cho các lớp đã có
-- ============================================================
DO $$
DECLARE
  class_record RECORD;
BEGIN
  FOR class_record IN SELECT * FROM public.classes WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND schedule IS NOT NULL
  LOOP
    -- Trigger sẽ tự chạy khi update
    UPDATE public.classes SET updated_at = NOW() WHERE id = class_record.id;
  END LOOP;
END $$;


-- <<< END FILE: 04_sessions_table.sql

-- >>> BEGIN FILE: 05_create_rooms_quick.sql
-- ============================================================
-- QUICK FIX: Tạo bảng rooms cho Skill Master
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Tạo bảng ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  capacity INT NOT NULL DEFAULT 20,
  room_type TEXT DEFAULT 'standard',
  equipment JSONB DEFAULT '[]',
  center_id UUID NOT NULL REFERENCES public.centers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Thêm cột room_id vào classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id);

-- 3. Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_rooms_center_id ON public.rooms(center_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_classes_room_id ON public.classes(room_id);

-- 4. Seed data mẫu (optional)
DO $$
DECLARE
  v_center_id UUID;
BEGIN
  SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  
  IF v_center_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.rooms LIMIT 1) THEN
    INSERT INTO public.rooms (code, name, capacity, room_type, equipment, center_id, status) VALUES
      ('P101', 'Phòng 101', 30, 'standard', '["projector", "whiteboard", "air_conditioner"]'::jsonb, v_center_id, 'active'),
      ('P102', 'Phòng 102', 25, 'standard', '["projector", "whiteboard"]'::jsonb, v_center_id, 'active'),
      ('LAB1', 'Lab 1 - Máy tính', 20, 'lab', '["computers", "projector"]'::jsonb, v_center_id, 'active');
  END IF;
END $$;

-- Done!
SELECT 'Tạo bảng rooms thành công!' as result;


-- <<< END FILE: 05_create_rooms_quick.sql

-- >>> BEGIN FILE: 05_grades_tables.sql
-- ============================================================
-- GRADING SYSTEM TABLES - Hệ thống quản lý điểm số
-- Version: 1.0
-- Description: Cấu trúc điểm động cho từng khóa học
-- ============================================================

-- 1. Bảng GRADE_STRUCTURES (Cấu trúc điểm theo Khóa học)
-- VD: Khóa IELTS có 4 cột: Listening, Speaking, Reading, Writing
-- VD: Khóa Web Dev có 3 cột: Lab, Mid-term, Final Project
CREATE TABLE IF NOT EXISTS public.grade_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,                  -- Tên cột điểm: "Mid-term", "Speaking"
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (weight >= 0 AND weight <= 1),  -- Trọng số: 0.3 = 30%
  max_score DECIMAL(5,2) DEFAULT 10.00, -- Điểm tối đa (mặc định 10)
  order_index INT NOT NULL DEFAULT 1,  -- Thứ tự hiển thị: 1, 2, 3...
  
  description TEXT,                    -- Mô tả cột điểm
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: 1 khóa học không có 2 cột điểm cùng tên
  UNIQUE(course_id, name)
);

-- 2. Bảng GRADES (Lưu điểm số thực tế của học viên)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  grade_structure_id UUID NOT NULL REFERENCES public.grade_structures(id) ON DELETE CASCADE,
  
  score DECIMAL(5,2) CHECK (score >= 0),  -- Điểm số: 8.5, 9.0...
  
  notes TEXT,                          -- Ghi chú (VD: "Nộp trễ -1 điểm")
  graded_by UUID REFERENCES public.users(id), -- Ai chấm điểm
  graded_at TIMESTAMPTZ,               -- Chấm lúc nào
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: 1 học viên chỉ có 1 điểm cho mỗi cột điểm
  UNIQUE(enrollment_id, grade_structure_id)
);

-- 3. Tạo indexes cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_grade_structures_course_id ON public.grade_structures(course_id);
CREATE INDEX IF NOT EXISTS idx_grade_structures_order ON public.grade_structures(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON public.grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grades_structure_id ON public.grades(grade_structure_id);

-- 4. Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grades_updated_at ON public.grades;
CREATE TRIGGER trigger_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grades_updated_at();

DROP TRIGGER IF EXISTS trigger_grade_structures_updated_at ON public.grade_structures;
CREATE TRIGGER trigger_grade_structures_updated_at
  BEFORE UPDATE ON public.grade_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grades_updated_at();

-- 5. Comments giải thích
COMMENT ON TABLE public.grade_structures IS 'Cấu trúc điểm động cho từng khóa học (VD: IELTS có Listening/Speaking/Reading/Writing)';
COMMENT ON TABLE public.grades IS 'Điểm số thực tế của từng học viên theo từng cột điểm';
COMMENT ON COLUMN public.grade_structures.weight IS 'Trọng số để tính điểm tổng kết (0.3 = 30%)';
COMMENT ON COLUMN public.grade_structures.order_index IS 'Thứ tự hiển thị cột điểm trên bảng điểm';

-- 6. RLS Policies (Row Level Security)
ALTER TABLE public.grade_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Admin/Staff có thể xem và sửa tất cả
-- (Kiểm tra role_id trong bảng roles)
CREATE POLICY "Admin can manage grade_structures" ON public.grade_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

CREATE POLICY "Admin can manage grades" ON public.grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Teacher có thể xem và chấm điểm lớp mình dạy
CREATE POLICY "Teacher can view grades of their classes" ON public.grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      WHERE e.id = grades.enrollment_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teacher can update grades of their classes" ON public.grades
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      WHERE e.id = grades.enrollment_id AND c.teacher_id = auth.uid()
    )
  );

-- Student chỉ xem điểm của chính mình
CREATE POLICY "Student can view own grades" ON public.grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = grades.enrollment_id AND e.student_id = auth.uid()
    )
  );

-- ============================================================
-- SEED DATA: Cấu trúc điểm mẫu
-- ============================================================

-- Lưu ý: Chạy sau khi đã có courses trong DB
-- Em có thể comment out phần này nếu chưa có course_id

/*
-- VD: Tìm course_id của khóa IELTS
-- SELECT id FROM courses WHERE title ILIKE '%IELTS%' LIMIT 1;

-- Sau đó INSERT với course_id thực tế:
INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
VALUES 
  ('COURSE_ID_HERE', 'Listening', 0.25, 9.0, 1, 'Điểm nghe IELTS'),
  ('COURSE_ID_HERE', 'Reading', 0.25, 9.0, 2, 'Điểm đọc IELTS'),
  ('COURSE_ID_HERE', 'Writing', 0.25, 9.0, 3, 'Điểm viết IELTS'),
  ('COURSE_ID_HERE', 'Speaking', 0.25, 9.0, 4, 'Điểm nói IELTS')
ON CONFLICT (course_id, name) DO NOTHING;
*/

-- ============================================================
-- HELPER VIEW: Bảng điểm tổng hợp (Optional)
-- ============================================================

CREATE OR REPLACE VIEW public.grade_summary AS
SELECT 
  e.id AS enrollment_id,
  e.class_id,
  e.student_id,
  u.full_name AS student_name,
  u.email AS student_email,
  c.course_id,
  co.title AS course_title,
  COALESCE(
    SUM(g.score * gs.weight) / NULLIF(SUM(gs.weight), 0),
    NULL
  ) AS weighted_average,
  COUNT(g.id) AS grades_count,
  COUNT(gs.id) AS total_columns
FROM public.enrollments e
JOIN public.users u ON e.student_id = u.id
JOIN public.classes c ON e.class_id = c.id
JOIN public.courses co ON c.course_id = co.id
LEFT JOIN public.grade_structures gs ON gs.course_id = c.course_id
LEFT JOIN public.grades g ON g.enrollment_id = e.id AND g.grade_structure_id = gs.id
GROUP BY e.id, e.class_id, e.student_id, u.full_name, u.email, c.course_id, co.title;

COMMENT ON VIEW public.grade_summary IS 'View tổng hợp điểm trung bình có trọng số của học viên';


-- <<< END FILE: 05_grades_tables.sql

-- >>> BEGIN FILE: 06_grades_seed_data.sql
-- ============================================================
-- SEED DATA: Cấu trúc điểm mẫu cho các khóa học
-- Chạy SAU KHI đã có courses trong DB
-- ============================================================

-- 1. Tìm course_id và insert cấu trúc điểm IELTS
DO $$
DECLARE
  ielts_course_id UUID;
  webdev_course_id UUID;
BEGIN
  -- Tìm khóa IELTS (tìm theo tên gần đúng)
  SELECT id INTO ielts_course_id FROM public.courses 
  WHERE title ILIKE '%IELTS%' OR title ILIKE '%English%' OR title ILIKE '%Anh%'
  LIMIT 1;
  
  IF ielts_course_id IS NOT NULL THEN
    RAISE NOTICE 'Found IELTS course: %', ielts_course_id;
    
    -- Insert cấu trúc điểm cho khóa IELTS (4 kỹ năng)
    INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
    VALUES 
      (ielts_course_id, 'Listening', 0.25, 9.0, 1, 'Điểm nghe IELTS (0-9)'),
      (ielts_course_id, 'Reading', 0.25, 9.0, 2, 'Điểm đọc IELTS (0-9)'),
      (ielts_course_id, 'Writing', 0.25, 9.0, 3, 'Điểm viết IELTS (0-9)'),
      (ielts_course_id, 'Speaking', 0.25, 9.0, 4, 'Điểm nói IELTS (0-9)')
    ON CONFLICT (course_id, name) DO NOTHING;
    
    RAISE NOTICE 'Inserted IELTS grade structure (4 columns)';
  ELSE
    RAISE NOTICE 'IELTS course not found, skipping...';
  END IF;
  
  -- Tìm khóa Web Development
  SELECT id INTO webdev_course_id FROM public.courses 
  WHERE title ILIKE '%Web%' OR title ILIKE '%React%' OR title ILIKE '%JavaScript%' OR title ILIKE '%Lập trình%'
  LIMIT 1;
  
  IF webdev_course_id IS NOT NULL THEN
    RAISE NOTICE 'Found Web Dev course: %', webdev_course_id;
    
    -- Insert cấu trúc điểm cho khóa Web Dev
    INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
    VALUES 
      (webdev_course_id, 'Lab Exercises', 0.20, 10.0, 1, 'Điểm bài tập thực hành'),
      (webdev_course_id, 'Mid-term', 0.30, 10.0, 2, 'Điểm giữa kỳ'),
      (webdev_course_id, 'Final Project', 0.50, 10.0, 3, 'Điểm đồ án cuối khóa')
    ON CONFLICT (course_id, name) DO NOTHING;
    
    RAISE NOTICE 'Inserted Web Dev grade structure (3 columns)';
  ELSE
    RAISE NOTICE 'Web Dev course not found, skipping...';
  END IF;
  
END $$;

-- 2. Kiểm tra kết quả
SELECT 
  gs.id,
  c.title AS course_name,
  gs.name AS grade_column,
  gs.weight * 100 || '%' AS weight_percent,
  gs.max_score,
  gs.order_index
FROM public.grade_structures gs
JOIN public.courses c ON gs.course_id = c.id
ORDER BY c.title, gs.order_index;


-- <<< END FILE: 06_grades_seed_data.sql

-- >>> BEGIN FILE: 07_fix_missing_profiles.sql
-- ============================================================
-- FIX MISSING USER PROFILES
-- ============================================================
-- Chạy file này trong Supabase SQL Editor để:
-- 1. Tạo profile cho user đã đăng ký nhưng chưa có trong public.users
-- 2. Đảm bảo trigger hoạt động cho user mới
-- ============================================================

-- 1. Kiểm tra và tạo lại trigger (đảm bảo nó tồn tại)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  default_center_id UUID;
BEGIN
  -- Lấy role STUDENT mặc định
  SELECT id INTO default_role_id FROM public.roles WHERE code = 'STUDENT';
  
  -- Lấy center đầu tiên làm mặc định
  SELECT id INTO default_center_id FROM public.centers LIMIT 1;

  -- Insert vào public.users
  INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role_id,
    default_center_id,
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- Không lỗi nếu user đã tồn tại
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Xóa trigger cũ và tạo lại
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. FIX: Tạo profile cho TẤT CẢ user đã đăng ký nhưng chưa có profile
-- ============================================================
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  (SELECT id FROM public.roles WHERE code = 'STUDENT'),
  (SELECT id FROM public.centers LIMIT 1),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- ============================================================
-- 3. Kiểm tra kết quả
-- ============================================================
-- Hiển thị số user đã được sync
SELECT 
  'Users in auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Users in public.users' as table_name, 
  COUNT(*) as count 
FROM public.users;

-- Hiển thị danh sách user mới được tạo profile
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as role_code,
  u.created_at
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================================
-- DONE! 
-- Sau khi chạy xong, refresh trang web và đăng nhập lại
-- ============================================================


-- <<< END FILE: 07_fix_missing_profiles.sql

-- >>> BEGIN FILE: 07_seed_demo_data.sql
-- ============================================================
-- SEED DEMO DATA - Dữ liệu giả để Demo/Bảo vệ đồ án
-- Version: 2.0
-- Mục đích: Cập nhật paid_amount trong enrollments để Dashboard có biểu đồ đẹp
-- ============================================================

-- ⚠️ LƯU Ý: Chạy file này SAU KHI đã có ít nhất 1-2 students và 2-3 classes trong DB

-- ============================================================
-- 1. CẬP NHẬT ENROLLMENTS - Thêm paid_amount để tạo doanh thu
-- ============================================================
-- Doanh thu lịch sử từ các enrollments đã tồn tại
-- Cách làm: Cập nhật paid_amount của các enrollment hiện có với số tiền khác nhau

-- ============================================================
-- 2. CẬP NHẬT ENROLLMENTS - Thêm paid_amount để tạo doanh thu
-- ============================================================
-- Chiến lược: Lấy các enrollment đã tồn tại và cập nhật paid_amount
-- để Dashboard tính doanh thu từ SUM(paid_amount)

DO $$
DECLARE
  v_enrollment_id UUID;
  v_counter INT := 0;
  v_rand_amount NUMERIC;
BEGIN
  -- Cập nhật các enrollment hiện có với paid_amount khác nhau
  FOR v_enrollment_id IN 
    SELECT id FROM public.enrollments 
    WHERE paid_amount IS NULL OR paid_amount = 0
    LIMIT 30
  LOOP
    v_counter := v_counter + 1;
    
    -- Tạo số tiền ngẫu nhiên giữa 2M-5M cho mỗi enrollment
    v_rand_amount := FLOOR(RANDOM() * 3000000)::NUMERIC + 2000000;
    
    UPDATE public.enrollments 
    SET paid_amount = v_rand_amount
    WHERE id = v_enrollment_id;
    
    RAISE NOTICE 'Cập nhật enrollment #% với paid_amount = %', v_counter, v_rand_amount;
  END LOOP;

  RAISE NOTICE '✅ Đã cập nhật % enrollments với paid_amount mới', v_counter;
END $$;

-- ============================================================
-- 3. KIỂM TRA KẾT QUẢ - Doanh thu hiện tại
-- ============================================================
SELECT 
  COUNT(*) AS total_enrollments,
  SUM(paid_amount) AS total_revenue,
  ROUND(AVG(paid_amount), 0) AS avg_payment,
  MIN(paid_amount) AS min_payment,
  MAX(paid_amount) AS max_payment
FROM public.enrollments
WHERE paid_amount > 0;

-- ============================================================
-- 4. KIỂM TRA CHI TIẾT ENROLLMENTS ĐÃ CẬP NHẬT
-- ============================================================
SELECT 
  e.id,
  u.full_name AS student_name,
  c.name AS class_name,
  e.tuition_fee,
  e.paid_amount,
  e.status,
  e.created_at
FROM public.enrollments e
JOIN public.users u ON e.student_id = u.id
JOIN public.classes c ON e.class_id = c.id
WHERE e.paid_amount > 0
ORDER BY e.created_at DESC
LIMIT 15;


-- <<< END FILE: 07_seed_demo_data.sql

-- >>> BEGIN FILE: 08_full_seed_data.sql
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


-- <<< END FILE: 08_full_seed_data.sql

-- >>> BEGIN FILE: 09_add_course_status.sql
-- ============================================================
-- MIGRATION: Add status column to courses table
-- Version: 1.1
-- Date: 2025-12-01
-- Description: Thêm cột status để quản lý trạng thái khóa học
-- ============================================================

-- Thêm cột status vào bảng courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('draft', 'active', 'inactive'));

-- Cập nhật các khóa học hiện tại thành active
UPDATE public.courses SET status = 'active' WHERE status IS NULL;

-- Comment cho cột mới
COMMENT ON COLUMN public.courses.status IS 'Trạng thái khóa học: draft (Nháp), active (Đang tuyển sinh), inactive (Tạm ngưng)';


-- <<< END FILE: 09_add_course_status.sql

-- >>> BEGIN FILE: 10_add_grading_config.sql
-- ============================================================
-- MIGRATION: Add grading configuration to courses table
-- Version: 1.2
-- Date: 2025-12-01
-- Description: Thêm cấu hình cách tính điểm và điểm đạt
-- ============================================================

-- Thêm cột calculation_type: weighted (theo trọng số) hoặc sum (cộng gộp)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS calculation_type TEXT NOT NULL DEFAULT 'weighted' 
CHECK (calculation_type IN ('weighted', 'sum'));

-- Thêm cột pass_score: điểm đạt chuẩn đầu ra
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS pass_score DECIMAL(6,2) DEFAULT 5.0;

-- Thêm cột max_total_score: thang điểm tối đa (10, 9, 990...)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS max_total_score DECIMAL(6,2) DEFAULT 10.0;

-- Comments
COMMENT ON COLUMN public.courses.calculation_type IS 'Cách tính điểm: weighted (trọng số %) hoặc sum (cộng gộp như TOEIC)';
COMMENT ON COLUMN public.courses.pass_score IS 'Điểm đạt chuẩn đầu ra (5.0 cho IT, 6.5 cho IELTS, 500 cho TOEIC...)';
COMMENT ON COLUMN public.courses.max_total_score IS 'Thang điểm tối đa hiển thị (10, 9.0, 990...)';

-- Cập nhật dữ liệu mẫu cho các khóa hiện có
UPDATE public.courses 
SET 
  calculation_type = CASE 
    WHEN category IN ('toeic') THEN 'sum'
    ELSE 'weighted'
  END,
  pass_score = CASE 
    WHEN category = 'ielts' THEN 6.5
    WHEN category = 'toeic' THEN 500
    ELSE 5.0
  END,
  max_total_score = CASE 
    WHEN category = 'ielts' THEN 9.0
    WHEN category = 'toeic' THEN 990
    ELSE 10.0
  END
WHERE calculation_type IS NULL OR pass_score IS NULL;


-- <<< END FILE: 10_add_grading_config.sql

-- >>> BEGIN FILE: 11_payroll_upgrade.sql
-- ============================================================
-- PAYROLL UPGRADE - Nâng cấp schema cho tính năng Lương
-- Version: 1.0
-- Description: Thêm các trường cần thiết cho tính lương giáo viên
-- ============================================================

-- ============================================================
-- 1. THÊM TRƯỜNG HOURLY_RATE CHO GIÁO VIÊN (users table)
-- ============================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(12, 0) DEFAULT 150000;

COMMENT ON COLUMN public.users.hourly_rate IS 'Mức lương theo giờ mặc định của giáo viên (VNĐ)';

-- ============================================================
-- 2. NÂNG CẤP BẢNG SESSIONS CHO PAYROLL
-- ============================================================

-- 2.1 Thêm duration_hours (số giờ dạy)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4, 2);

-- 2.2 Thêm teacher_rate (snapshot lương tại thời điểm dạy)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS teacher_rate DECIMAL(12, 0) DEFAULT 0;

-- 2.3 Thêm is_locked (khóa sổ sau khi tính lương)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 2.4 Thêm payroll_id (link đến bảng payroll)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS payroll_id UUID;

-- 2.5 Thêm topic (chủ đề buổi học)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS topic VARCHAR(255);

-- 2.6 Thêm substitute_reason (lý do dạy thay)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS substitute_reason TEXT;

-- Comments
COMMENT ON COLUMN public.sessions.duration_hours IS 'Số giờ dạy, tính từ (end_time - start_time)';
COMMENT ON COLUMN public.sessions.teacher_rate IS 'Snapshot mức lương/giờ tại thời điểm dạy (VNĐ)';
COMMENT ON COLUMN public.sessions.is_locked IS 'TRUE nếu buổi học đã được tính lương, không cho sửa';
COMMENT ON COLUMN public.sessions.payroll_id IS 'Link đến bảng payroll khi đã tính lương';
COMMENT ON COLUMN public.sessions.topic IS 'Chủ đề/nội dung buổi học';
COMMENT ON COLUMN public.sessions.substitute_reason IS 'Lý do dạy thay nếu không phải GV chính';

-- ============================================================
-- 3. TẠO BẢNG PAYROLL (Bảng lương)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Kỳ lương
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL CHECK (period_year >= 2020),
  
  -- Thống kê
  total_sessions INT DEFAULT 0,           -- Tổng số buổi dạy
  total_hours DECIMAL(6, 2) DEFAULT 0,    -- Tổng số giờ dạy
  
  -- Tiền
  base_salary DECIMAL(15, 0) DEFAULT 0,   -- Lương cơ bản (total_hours * rate)
  bonus DECIMAL(15, 0) DEFAULT 0,          -- Thưởng
  deduction DECIMAL(15, 0) DEFAULT 0,      -- Khấu trừ
  net_salary DECIMAL(15, 0) DEFAULT 0,     -- Lương thực nhận
  
  -- Trạng thái
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid')),
  
  -- Ghi chú
  notes TEXT,
  
  -- Người duyệt
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique: Mỗi GV chỉ có 1 bảng lương/tháng
  UNIQUE(teacher_id, period_month, period_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_teacher ON public.payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payroll(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);

-- Comments
COMMENT ON TABLE public.payroll IS 'Bảng lương giáo viên theo tháng';

-- ============================================================
-- 4. NÂNG CẤP BẢNG ATTENDANCE
-- ============================================================

-- 4.1 Update status constraint
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

-- 4.2 Thêm check_in_time
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;

-- ============================================================
-- 5. FUNCTION TÍNH LƯƠNG THÁNG
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_teacher_payroll(
  p_teacher_id UUID,
  p_month INT,
  p_year INT
) RETURNS TABLE (
  total_sessions INT,
  total_hours DECIMAL(6,2),
  base_salary DECIMAL(15,0)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_sessions,
    COALESCE(SUM(s.duration_hours), 0)::DECIMAL(6,2) as total_hours,
    COALESCE(SUM(s.duration_hours * s.teacher_rate), 0)::DECIMAL(15,0) as base_salary
  FROM public.sessions s
  WHERE 
    s.teacher_id = p_teacher_id
    AND s.status = 'completed'
    AND EXTRACT(MONTH FROM s.session_date) = p_month
    AND EXTRACT(YEAR FROM s.session_date) = p_year;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. RLS POLICIES CHO PAYROLL
-- ============================================================
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Giáo viên chỉ xem lương của mình
CREATE POLICY "Teacher can view own payroll" ON public.payroll
  FOR SELECT USING (teacher_id = auth.uid());

-- Admin/Manager có thể quản lý tất cả (Backend sẽ kiểm tra role thực)
-- RLS policy ở đây chỉ cho phép các user được xác thực
CREATE POLICY "Authenticated users can view payroll" ON public.payroll
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert payroll" ON public.payroll
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can update payroll" ON public.payroll
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can delete payroll" ON public.payroll
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 7. VIEW THỐNG KÊ NHANH
-- ============================================================
CREATE OR REPLACE VIEW public.v_teacher_monthly_stats AS
SELECT 
  s.teacher_id,
  u.full_name as teacher_name,
  EXTRACT(YEAR FROM s.session_date)::INT as year,
  EXTRACT(MONTH FROM s.session_date)::INT as month,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE s.status = 'completed') as completed_sessions,
  COALESCE(SUM(s.duration_hours) FILTER (WHERE s.status = 'completed'), 0) as total_hours,
  COALESCE(SUM(s.duration_hours * s.teacher_rate) FILTER (WHERE s.status = 'completed'), 0) as total_earnings
FROM public.sessions s
JOIN public.users u ON s.teacher_id = u.id
GROUP BY s.teacher_id, u.full_name, 
         EXTRACT(YEAR FROM s.session_date), 
         EXTRACT(MONTH FROM s.session_date);

COMMENT ON VIEW public.v_teacher_monthly_stats IS 'View thống kê giờ dạy và thu nhập của giáo viên theo tháng';

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 11_payroll_upgrade.sql

-- >>> BEGIN FILE: 12_test_payroll_schema.sql
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


-- <<< END FILE: 12_test_payroll_schema.sql

-- >>> BEGIN FILE: 13_add_room_to_sessions.sql
-- ============================================================
-- SKILL MASTER - ADD ROOM_ID TO SESSIONS TABLE
-- Version: 1.0
-- Description: Cho phép đổi phòng từng buổi học riêng lẻ
-- ============================================================

-- 1. Thêm cột room_id vào bảng sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN room_id UUID REFERENCES public.rooms(id);
    CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON public.sessions(room_id);
    
    RAISE NOTICE 'Added room_id column to sessions table';
  ELSE
    RAISE NOTICE 'room_id column already exists in sessions table';
  END IF;
END $$;

-- 2. Comment giải thích
COMMENT ON COLUMN public.sessions.room_id IS 
'Phòng học cho buổi này. Nếu NULL, sẽ dùng room_id từ bảng classes. 
Cho phép đổi phòng từng buổi riêng lẻ mà không ảnh hưởng các buổi khác.';

-- ============================================================
-- DONE! Session room_id added
-- ============================================================


-- <<< END FILE: 13_add_room_to_sessions.sql

-- >>> BEGIN FILE: 14_add_invoice_type.sql
-- ============================================================
-- ADD INVOICE_TYPE COLUMN TO INVOICES TABLE
-- Version: 1.0
-- Description: Thêm cột loại hóa đơn để phân loại các loại phí
-- ============================================================

-- Thêm cột invoice_type vào bảng invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'tuition' 
CHECK (invoice_type IN ('tuition', 'book', 'uniform', 'exam', 'other'));

-- Cập nhật các hóa đơn hiện có (đặt là tuition cho hóa đơn học phí)
UPDATE public.invoices 
SET invoice_type = 'tuition' 
WHERE invoice_type IS NULL;

-- Comment cho cột mới
COMMENT ON COLUMN public.invoices.invoice_type IS 'Loại hóa đơn: tuition (Học phí), book (Giáo trình), uniform (Đồng phục), exam (Phí thi), other (Phí khác)';

-- Index cho truy vấn theo loại hóa đơn
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);


-- <<< END FILE: 14_add_invoice_type.sql

-- >>> BEGIN FILE: 14_invoice_upgrade.sql
-- ============================================================
-- INVOICE UPGRADE - Thêm tính năng mới cho hóa đơn
-- Version: 1.1
-- Description: Thêm invoice_type, cải thiện quản lý hóa đơn
-- ============================================================

-- ============================================================
-- 1. THÊM COLUMN invoice_type
-- ============================================================
-- Loại hóa đơn: tuition (học phí), book (sách), uniform (đồng phục), exam (thi), other (khác)

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE public.invoices 
    ADD COLUMN invoice_type TEXT DEFAULT 'tuition' 
    CHECK (invoice_type IN ('tuition', 'book', 'uniform', 'exam', 'other'));
    
    COMMENT ON COLUMN public.invoices.invoice_type IS 'Loại hóa đơn: tuition=học phí, book=sách, uniform=đồng phục, exam=phí thi, other=khác';
  END IF;
END $$;

-- ============================================================
-- 2. UPDATE EXISTING RECORDS
-- ============================================================
-- Đặt tất cả hóa đơn cũ là loại 'tuition'
UPDATE public.invoices 
SET invoice_type = 'tuition' 
WHERE invoice_type IS NULL;

-- ============================================================
-- 3. INDEX CHO INVOICE_TYPE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(invoice_type);

-- ============================================================
-- 4. THÊM INDEX CHO DUE_DATE (để query overdue nhanh hơn)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- ============================================================
-- 5. VIEW: Hóa đơn quá hạn
-- ============================================================
CREATE OR REPLACE VIEW public.overdue_invoices AS
SELECT 
  i.*,
  u.full_name as student_name,
  u.email as student_email,
  u.phone as student_phone,
  c.name as class_name,
  CURRENT_DATE - i.due_date as days_overdue
FROM public.invoices i
LEFT JOIN public.users u ON i.student_id = u.id
LEFT JOIN public.classes c ON i.class_id = c.id
WHERE 
  i.due_date < CURRENT_DATE 
  AND i.status NOT IN ('paid', 'cancelled', 'refunded')
ORDER BY i.due_date ASC;

COMMENT ON VIEW public.overdue_invoices IS 'Danh sách hóa đơn quá hạn thanh toán';

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 14_invoice_upgrade.sql

-- >>> BEGIN FILE: 14_reports_module.sql
-- ============================================================
-- REPORTS MODULE - Báo cáo & Thống kê chi tiết
-- Version: 1.0
-- Description: Schema cho module báo cáo nâng cao
-- ============================================================

-- ============================================================
-- 1. BẢNG SAVED_REPORTS - Báo cáo đã lưu
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Loại báo cáo
  report_type VARCHAR(50) NOT NULL, -- 'revenue', 'enrollment', 'attendance', 'grades', 'staff', 'courses'
  
  -- Lưu filter đã chọn
  filters JSONB DEFAULT '{}', -- { dateRange, centerId, courseId, etc }
  
  -- Scheduled reports (optional)
  schedule VARCHAR(50), -- 'daily', 'weekly', 'monthly', null = không tự động
  email_recipients TEXT[], -- Danh sách email nhận báo cáo
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES public.users(id),
  center_id UUID REFERENCES public.centers(id),
  is_public BOOLEAN DEFAULT false, -- Có chia sẻ cho center không
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG REPORT_LOGS - Lịch sử chạy báo cáo (audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  saved_report_id UUID REFERENCES public.saved_reports(id) ON DELETE SET NULL,
  report_type VARCHAR(50) NOT NULL,
  
  -- Params khi chạy
  filters JSONB,
  
  -- Kết quả
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'exported'
  export_format VARCHAR(20), -- 'excel', 'pdf', null = chỉ view
  result_summary JSONB, -- { totalRecords, totalRevenue, etc }
  error_message TEXT,
  
  -- User
  run_by UUID REFERENCES public.users(id),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_saved_reports_user ON public.saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_center ON public.saved_reports(center_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON public.saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_logs_report ON public.report_logs(saved_report_id);
CREATE INDEX IF NOT EXISTS idx_report_logs_type ON public.report_logs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_logs_run_at ON public.report_logs(run_at DESC);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

-- Saved Reports: User xem báo cáo của mình hoặc báo cáo public của center
CREATE POLICY "Users can view own reports" ON public.saved_reports
  FOR SELECT USING (
    created_by = auth.uid() 
    OR (is_public = true AND center_id IN (
      SELECT center_id FROM public.users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own reports" ON public.saved_reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reports" ON public.saved_reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own reports" ON public.saved_reports
  FOR DELETE USING (created_by = auth.uid());

-- Report Logs: User xem logs của mình
CREATE POLICY "Users can view own report logs" ON public.report_logs
  FOR SELECT USING (run_by = auth.uid());

CREATE POLICY "Users can create report logs" ON public.report_logs
  FOR INSERT WITH CHECK (run_by = auth.uid());

-- ============================================================
-- DONE! Reports module schema created
-- ============================================================


-- <<< END FILE: 14_reports_module.sql

-- >>> BEGIN FILE: 14_schedule_features.sql
-- ============================================================
-- 14_schedule_features.sql
-- Thêm các bảng hỗ trợ tính năng lịch học mới
-- ============================================================

-- Bảng quản lý ngày lễ/nghỉ
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE, -- Lặp lại hàng năm (ví dụ: 1/1, 30/4, 1/5...)
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho tìm kiếm theo năm
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON public.holidays(is_recurring);

-- Comment
COMMENT ON TABLE public.holidays IS 'Bảng lưu trữ ngày lễ/nghỉ của trung tâm';
COMMENT ON COLUMN public.holidays.is_recurring IS 'Nếu true, ngày lễ này lặp lại hàng năm';

-- ============================================================
-- Bảng lịch trống của giáo viên
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=CN, 1=T2, ...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE, -- True = rảnh, False = bận
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher ON public.teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_day ON public.teacher_availability(day_of_week);

-- Comment
COMMENT ON TABLE public.teacher_availability IS 'Lịch rảnh/bận của giáo viên theo tuần';
COMMENT ON COLUMN public.teacher_availability.day_of_week IS '0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7';

-- ============================================================
-- Thêm cột cho bảng sessions để hỗ trợ buổi học bù
-- ============================================================
DO $$ 
BEGIN
  -- Thêm cột is_makeup nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'is_makeup'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN is_makeup BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.sessions.is_makeup IS 'Đánh dấu đây là buổi học bù';
  END IF;

  -- Thêm cột original_session_id để liên kết buổi bù với buổi gốc
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'original_session_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN original_session_id UUID REFERENCES public.sessions(id);
    COMMENT ON COLUMN public.sessions.original_session_id IS 'ID buổi học gốc (nếu đây là buổi bù)';
  END IF;
  
  -- Thêm cột room_id nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN room_id VARCHAR(100);
    COMMENT ON COLUMN public.sessions.room_id IS 'Phòng học của buổi này';
  END IF;
END $$;

-- ============================================================
-- Bảng học viên cần học bù
-- ============================================================
CREATE TABLE IF NOT EXISTS public.makeup_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE, -- Buổi học bù
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Học viên (thay students)
  original_session_id UUID REFERENCES public.sessions(id), -- Buổi gốc mà học viên vắng
  attended BOOLEAN DEFAULT FALSE, -- Đã tham gia buổi bù chưa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, user_id) -- Mỗi học viên chỉ đăng ký 1 lần cho 1 buổi bù
);

-- Index
CREATE INDEX IF NOT EXISTS idx_makeup_students_session ON public.makeup_students(session_id);
CREATE INDEX IF NOT EXISTS idx_makeup_students_user ON public.makeup_students(user_id);

-- Comment
COMMENT ON TABLE public.makeup_students IS 'Danh sách học viên đăng ký học bù';

-- ============================================================
-- Seed data cho holidays (Ngày lễ Việt Nam)
-- ============================================================
INSERT INTO public.holidays (name, date, description, is_recurring) VALUES
  ('Tết Dương lịch', '2025-01-01', 'Nghỉ Tết Dương lịch', TRUE),
  ('Tết Nguyên đán', '2025-01-28', 'Nghỉ Tết Nguyên đán (28/1 - 2/2)', FALSE),
  ('Tết Nguyên đán', '2025-01-29', 'Nghỉ Tết Nguyên đán', FALSE),
  ('Tết Nguyên đán', '2025-01-30', 'Nghỉ Tết Nguyên đán', FALSE),
  ('Tết Nguyên đán', '2025-01-31', 'Nghỉ Tết Nguyên đán', FALSE),
  ('Tết Nguyên đán', '2025-02-01', 'Nghỉ Tết Nguyên đán', FALSE),
  ('Tết Nguyên đán', '2025-02-02', 'Nghỉ Tết Nguyên đán', FALSE),
  ('Giỗ Tổ Hùng Vương', '2025-04-07', 'Nghỉ Giỗ Tổ Hùng Vương (10/3 âm lịch)', FALSE),
  ('Ngày Giải phóng', '2025-04-30', 'Nghỉ lễ 30/4', TRUE),
  ('Quốc tế Lao động', '2025-05-01', 'Nghỉ lễ 1/5', TRUE),
  ('Quốc khánh', '2025-09-02', 'Nghỉ lễ Quốc khánh 2/9', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Holidays: Ai cũng xem được, chỉ admin mới sửa/xóa được
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view holidays" ON public.holidays;
CREATE POLICY "Anyone can view holidays" ON public.holidays
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;
CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Teacher Availability: GV xem được của mình, admin xem được tất cả
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own availability" ON public.teacher_availability;
CREATE POLICY "Teachers can view own availability" ON public.teacher_availability
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

DROP POLICY IF EXISTS "Teachers can manage own availability" ON public.teacher_availability;
CREATE POLICY "Teachers can manage own availability" ON public.teacher_availability
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Makeup Students
ALTER TABLE public.makeup_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view makeup_students" ON public.makeup_students;
CREATE POLICY "Anyone authenticated can view makeup_students" ON public.makeup_students
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage makeup_students" ON public.makeup_students;
CREATE POLICY "Admins can manage makeup_students" ON public.makeup_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );

-- ============================================================
-- Function để kiểm tra ngày có phải ngày lễ không
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_holiday(check_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  is_holiday_result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.holidays h
    WHERE 
      h.date = check_date
      OR (
        h.is_recurring = TRUE 
        AND EXTRACT(MONTH FROM h.date) = EXTRACT(MONTH FROM check_date)
        AND EXTRACT(DAY FROM h.date) = EXTRACT(DAY FROM check_date)
      )
  ) INTO is_holiday_result;
  
  RETURN is_holiday_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.is_holiday IS 'Kiểm tra một ngày có phải ngày lễ không (bao gồm ngày lễ recurring)';

-- ============================================================
-- Function để lấy danh sách học viên vắng của một buổi học
-- ============================================================
CREATE OR REPLACE FUNCTION get_absent_students(p_session_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  student_code VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS student_id,
    u.full_name AS student_name,
    u.email AS student_code
  FROM public.attendance a
  JOIN public.enrollments e ON a.enrollment_id = e.id
  JOIN public.users u ON e.student_id = u.id
  WHERE a.session_id = p_session_id
  AND a.status = 'absent';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_absent_students IS 'Lấy danh sách học viên vắng mặt của một buổi học';

-- Done!
SELECT 'Migration 14_schedule_features.sql completed successfully' AS status;


-- <<< END FILE: 14_schedule_features.sql

-- >>> BEGIN FILE: 15_centers_upgrade.sql
-- ============================================================
-- CENTERS UPGRADE - Nâng cấp schema cho tính năng Quản lý Trung tâm
-- Version: 1.0
-- Description: Thêm các trường cần thiết cho quản lý chi nhánh
-- ============================================================

-- ============================================================
-- 1. THÊM CÁC TRƯỜNG MỚI CHO BẢNG CENTERS
-- ============================================================

-- Mã trung tâm (duy nhất)
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Email liên hệ
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Logo trung tâm
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Mô tả chi tiết
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Giờ làm việc (JSON format)
-- VD: {"monday": {"open": "08:00", "close": "21:00"}, ...}
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "monday": {"open": "08:00", "close": "21:00"},
  "tuesday": {"open": "08:00", "close": "21:00"},
  "wednesday": {"open": "08:00", "close": "21:00"},
  "thursday": {"open": "08:00", "close": "21:00"},
  "friday": {"open": "08:00", "close": "21:00"},
  "saturday": {"open": "08:00", "close": "17:00"},
  "sunday": {"open": null, "close": null}
}'::jsonb;

-- Trạng thái hoạt động
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive'));

-- Quản lý chính của trung tâm (reference đến users)
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Timestamp cập nhật
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. THÊM COMMENTS
-- ============================================================
COMMENT ON COLUMN public.centers.code IS 'Mã trung tâm duy nhất (VD: CTR01, CTR02)';
COMMENT ON COLUMN public.centers.email IS 'Email liên hệ trung tâm';
COMMENT ON COLUMN public.centers.logo_url IS 'URL logo trung tâm';
COMMENT ON COLUMN public.centers.description IS 'Mô tả chi tiết về trung tâm';
COMMENT ON COLUMN public.centers.working_hours IS 'Giờ làm việc theo từng ngày (JSON)';
COMMENT ON COLUMN public.centers.status IS 'Trạng thái: active hoặc inactive';
COMMENT ON COLUMN public.centers.manager_id IS 'ID của quản lý chính (CENTER_MANAGER)';
COMMENT ON COLUMN public.centers.updated_at IS 'Thời điểm cập nhật cuối cùng';

-- ============================================================
-- 3. TẠO INDEX CHO PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_centers_status ON public.centers(status);
CREATE INDEX IF NOT EXISTS idx_centers_code ON public.centers(code);
CREATE INDEX IF NOT EXISTS idx_centers_manager ON public.centers(manager_id);

-- ============================================================
-- 4. TẠO TRIGGER CẬP NHẬT updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_centers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_centers_timestamp ON public.centers;

CREATE TRIGGER trigger_update_centers_timestamp
  BEFORE UPDATE ON public.centers
  FOR EACH ROW
  EXECUTE FUNCTION update_centers_updated_at();

-- ============================================================
-- 5. CẬP NHẬT DỮ LIỆU HIỆN TẠI (nếu có)
-- ============================================================
-- Tạo mã code cho các center chưa có
WITH ranked_centers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.centers
  WHERE code IS NULL
)
UPDATE public.centers
SET code = 'CTR' || LPAD(ranked_centers.row_num::TEXT, 2, '0')
FROM ranked_centers
WHERE public.centers.id = ranked_centers.id;

-- ============================================================
-- 6. RLS POLICIES CHO CENTERS
-- ============================================================

-- Enable RLS
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active centers" ON public.centers;
DROP POLICY IF EXISTS "Super admin can manage all centers" ON public.centers;
DROP POLICY IF EXISTS "Center manager can view own center" ON public.centers;

-- Policy: Ai cũng có thể xem các center đang active
CREATE POLICY "Anyone can view active centers" ON public.centers
  FOR SELECT
  USING (status = 'active' OR status IS NULL);

-- Policy: Super Admin có toàn quyền
CREATE POLICY "Super admin can manage all centers" ON public.centers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code = 'SUPER_ADMIN'
    )
  );

-- Policy: Center Manager xem được center của mình
CREATE POLICY "Center manager can view own center" ON public.centers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = centers.id
    )
  );

-- ============================================================
-- 7. SEED DATA BỔ SUNG (Nếu chỉ có 1 center)
-- ============================================================
DO $$
DECLARE
  center_count INT;
BEGIN
  SELECT COUNT(*) INTO center_count FROM public.centers;
  
  -- Nếu chỉ có 1 center, thêm 2 center demo nữa
  IF center_count <= 1 THEN
    INSERT INTO public.centers (name, code, address, hotline, email, description, status) 
    VALUES 
      ('Skill Master - Quận 1', 'CTR01', '123 Nguyễn Huệ, Quận 1, TP.HCM', '028-1234-5678', 'q1@skillmaster.edu.vn', 'Chi nhánh chính tại trung tâm Quận 1, gần phố đi bộ', 'active'),
      ('Skill Master - Quận 7', 'CTR02', '456 Nguyễn Văn Linh, Quận 7, TP.HCM', '028-8765-4321', 'q7@skillmaster.edu.vn', 'Chi nhánh Phú Mỹ Hưng, khu vực cao cấp', 'active'),
      ('Skill Master - Thủ Đức', 'CTR03', '789 Võ Văn Ngân, TP.Thủ Đức', '028-5555-6666', 'thuduc@skillmaster.edu.vn', 'Chi nhánh gần Đại học Sư phạm Kỹ thuật', 'active')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- DONE! Centers schema upgraded successfully
-- ============================================================


-- <<< END FILE: 15_centers_upgrade.sql

-- >>> BEGIN FILE: 15_payroll_seed_data.sql
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


-- <<< END FILE: 15_payroll_seed_data.sql

-- >>> BEGIN FILE: 16_more_centers_seed.sql
-- ============================================
-- 16_more_centers_seed.sql
-- Thêm dữ liệu demo cho Centers (từ 3 -> 15 centers)
-- ============================================

-- Tạm disable RLS để seed
ALTER TABLE centers DISABLE ROW LEVEL SECURITY;

-- Insert thêm 12 centers mới (đã có 3: Hà Nội, TP.HCM, Đà Nẵng)
INSERT INTO centers (name, code, address, hotline, email, logo_url, status, working_hours, description, created_at) VALUES

-- Miền Bắc
('Trung tâm Hải Phòng', 'HP-01', '45 Lạch Tray, Ngô Quyền, Hải Phòng', '0225.369.1234', 'haiphong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "21:00"}, "tue": {"open": "07:30", "close": "21:00"}, "wed": {"open": "07:30", "close": "21:00"}, "thu": {"open": "07:30", "close": "21:00"}, "fri": {"open": "07:30", "close": "21:00"}, "sat": {"open": "08:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm đào tạo tại Hải Phòng - Cảng biển lớn nhất miền Bắc', NOW() - INTERVAL '8 months'),

('Trung tâm Quảng Ninh', 'QN-01', '89 Trần Hưng Đạo, Hạ Long, Quảng Ninh', '0203.388.5678', 'quangninh@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "16:30"}, "sun": {"closed": true}}',
'Trung tâm tại thành phố du lịch Hạ Long', NOW() - INTERVAL '6 months'),

('Trung tâm Bắc Ninh', 'BN-01', '167 Lý Thái Tổ, TP Bắc Ninh, Bắc Ninh', '0222.365.9012', 'bacninh@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:00", "close": "21:30"}, "tue": {"open": "07:00", "close": "21:30"}, "wed": {"open": "07:00", "close": "21:30"}, "thu": {"open": "07:00", "close": "21:30"}, "fri": {"open": "07:00", "close": "21:30"}, "sat": {"open": "07:30", "close": "18:00"}, "sun": {"open": "08:00", "close": "12:00"}}',
'Trung tâm phục vụ các khu công nghiệp lớn tại Bắc Ninh', NOW() - INTERVAL '5 months'),

-- Miền Trung
('Trung tâm Huế', 'HUE-01', '56 Hùng Vương, TP Huế, Thừa Thiên Huế', '0234.382.3456', 'hue@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "21:00"}, "tue": {"open": "07:30", "close": "21:00"}, "wed": {"open": "07:30", "close": "21:00"}, "thu": {"open": "07:30", "close": "21:00"}, "fri": {"open": "07:30", "close": "21:00"}, "sat": {"open": "08:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm tại cố đô Huế - Thành phố di sản', NOW() - INTERVAL '7 months'),

('Trung tâm Nha Trang', 'NT-01', '123 Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa', '0258.352.7890', 'nhatrang@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "21:00"}, "tue": {"open": "08:00", "close": "21:00"}, "wed": {"open": "08:00", "close": "21:00"}, "thu": {"open": "08:00", "close": "21:00"}, "fri": {"open": "08:00", "close": "21:00"}, "sat": {"open": "08:30", "close": "17:30"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố biển Nha Trang xinh đẹp', NOW() - INTERVAL '4 months'),

('Trung tâm Quy Nhơn', 'QNH-01', '78 An Dương Vương, Quy Nhơn, Bình Định', '0256.389.1234', 'quynhon@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "20:30"}, "tue": {"open": "07:30", "close": "20:30"}, "wed": {"open": "07:30", "close": "20:30"}, "thu": {"open": "07:30", "close": "20:30"}, "fri": {"open": "07:30", "close": "20:30"}, "sat": {"open": "08:00", "close": "16:00"}, "sun": {"closed": true}}',
'Trung tâm tại Quy Nhơn - Thành phố của những bãi biển hoang sơ', NOW() - INTERVAL '3 months'),

-- Miền Nam
('Trung tâm Cần Thơ', 'CT-01', '234 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ', '0292.376.5432', 'cantho@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:00", "close": "21:30"}, "tue": {"open": "07:00", "close": "21:30"}, "wed": {"open": "07:00", "close": "21:30"}, "thu": {"open": "07:00", "close": "21:30"}, "fri": {"open": "07:00", "close": "21:30"}, "sat": {"open": "07:30", "close": "18:00"}, "sun": {"open": "08:00", "close": "12:00"}}',
'Trung tâm tại thủ phủ miền Tây - Cần Thơ', NOW() - INTERVAL '9 months'),

('Trung tâm Bình Dương', 'BD-01', '456 Đại lộ Bình Dương, Thủ Dầu Một, Bình Dương', '0274.365.8901', 'binhduong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "06:30", "close": "22:00"}, "tue": {"open": "06:30", "close": "22:00"}, "wed": {"open": "06:30", "close": "22:00"}, "thu": {"open": "06:30", "close": "22:00"}, "fri": {"open": "06:30", "close": "22:00"}, "sat": {"open": "07:00", "close": "18:00"}, "sun": {"open": "08:00", "close": "14:00"}}',
'Trung tâm phục vụ công nhân các khu công nghiệp Bình Dương', NOW() - INTERVAL '10 months'),

('Trung tâm Đồng Nai', 'DN-01', '789 Nguyễn Ái Quốc, Biên Hòa, Đồng Nai', '0251.382.4567', 'dongnai@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "06:30", "close": "21:30"}, "tue": {"open": "06:30", "close": "21:30"}, "wed": {"open": "06:30", "close": "21:30"}, "thu": {"open": "06:30", "close": "21:30"}, "fri": {"open": "06:30", "close": "21:30"}, "sat": {"open": "07:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm tại Biên Hòa - Trung tâm công nghiệp lớn nhất miền Nam', NOW() - INTERVAL '11 months'),

('Trung tâm Vũng Tàu', 'VT-01', '321 Thùy Vân, Bãi Sau, Vũng Tàu', '0254.385.6789', 'vungtau@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "17:00"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố biển Vũng Tàu', NOW() - INTERVAL '2 months'),

-- Tây Nguyên
('Trung tâm Đắk Lắk', 'DL-01', '147 Nguyễn Tất Thành, Buôn Ma Thuột, Đắk Lắk', '0262.385.0123', 'daklak@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "20:00"}, "tue": {"open": "07:30", "close": "20:00"}, "wed": {"open": "07:30", "close": "20:00"}, "thu": {"open": "07:30", "close": "20:00"}, "fri": {"open": "07:30", "close": "20:00"}, "sat": {"open": "08:00", "close": "16:00"}, "sun": {"closed": true}}',
'Trung tâm tại thủ phủ cà phê Tây Nguyên', NOW() - INTERVAL '4 months'),

('Trung tâm Lâm Đồng', 'LD-01', '258 Phan Đình Phùng, Đà Lạt, Lâm Đồng', '0263.382.3456', 'lamdong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "17:00"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố ngàn hoa Đà Lạt', NOW() - INTERVAL '3 months')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    hotline = EXCLUDED.hotline,
    email = EXCLUDED.email,
    working_hours = EXCLUDED.working_hours,
    description = EXCLUDED.description;

-- Seed thêm rooms cho các centers mới
DO $$
DECLARE
    center_rec RECORD;
    room_count INTEGER;
    i INTEGER;
    equipment_json JSONB := '["projector", "whiteboard", "air_conditioner"]'::jsonb;
BEGIN
    FOR center_rec IN SELECT id, code FROM centers WHERE code NOT IN ('CTR01', 'CTR02', 'CTR03')
    LOOP
        -- Random số phòng từ 3-8 cho mỗi center
        room_count := 3 + floor(random() * 6)::int;
        
        FOR i IN 1..room_count LOOP
            INSERT INTO rooms (name, code, center_id, capacity, room_type, status, equipment, notes)
            VALUES (
                'Phòng ' || i || ' - ' || center_rec.code,
                center_rec.code || '-P' || LPAD(i::text, 2, '0'),
                center_rec.id,
                20 + floor(random() * 30)::int, -- capacity 20-50
                CASE floor(random() * 3)::int
                    WHEN 0 THEN 'standard'
                    WHEN 1 THEN 'lab'
                    ELSE 'vip'
                END,
                CASE floor(random() * 10)::int
                    WHEN 0 THEN 'maintenance'
                    ELSE 'active'
                END,
                equipment_json,
                'Phòng học tại ' || center_rec.code
            )
            ON CONFLICT (code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    c.name,
    c.code,
    c.status,
    COUNT(r.id) as room_count
FROM centers c
LEFT JOIN rooms r ON r.center_id = c.id
GROUP BY c.id, c.name, c.code, c.status
ORDER BY c.created_at;


-- <<< END FILE: 16_more_centers_seed.sql

-- >>> BEGIN FILE: 16_payroll_audit_trail.sql
-- ============================================================
-- PAYROLL AUDIT TRAIL
-- Bảng lưu lại lịch sử thay đổi bảng lương
-- ============================================================

-- Tạo bảng audit trail
CREATE TABLE IF NOT EXISTS payroll_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID NOT NULL REFERENCES payroll(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'deleted'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    notes TEXT
);

-- Index để query nhanh theo payroll_id
CREATE INDEX IF NOT EXISTS idx_payroll_audit_payroll_id ON payroll_audit_log(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_action ON payroll_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_changed_at ON payroll_audit_log(changed_at);

-- Trigger function để tự động log khi payroll thay đổi
CREATE OR REPLACE FUNCTION log_payroll_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payroll_audit_log (payroll_id, action, new_values, changed_by)
        VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Chỉ log nếu có thay đổi thực sự
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO payroll_audit_log (payroll_id, action, old_values, new_values, changed_by)
            VALUES (
                NEW.id,
                CASE 
                    WHEN OLD.status != NEW.status THEN 'status_changed'
                    ELSE 'updated'
                END,
                to_jsonb(OLD),
                to_jsonb(NEW),
                COALESCE(NEW.approved_by, auth.uid())
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO payroll_audit_log (payroll_id, action, old_values, changed_by)
        VALUES (OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS payroll_audit_trigger ON payroll;

-- Tạo trigger
CREATE TRIGGER payroll_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payroll
    FOR EACH ROW
    EXECUTE FUNCTION log_payroll_changes();

-- RLS cho payroll_audit_log
ALTER TABLE payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả audit log
CREATE POLICY "Admin can view all audit logs" ON payroll_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Giáo viên có thể xem audit log của bảng lương của mình
CREATE POLICY "Teachers can view own payroll audit" ON payroll_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM payroll p
            WHERE p.id = payroll_audit_log.payroll_id
            AND p.teacher_id = auth.uid()
        )
    );

-- ============================================================
-- COMMENT
-- ============================================================
COMMENT ON TABLE payroll_audit_log IS 'Bảng lưu lịch sử thay đổi bảng lương';
COMMENT ON COLUMN payroll_audit_log.action IS 'Loại hành động: created, updated, status_changed, deleted';
COMMENT ON COLUMN payroll_audit_log.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN payroll_audit_log.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';


-- <<< END FILE: 16_payroll_audit_trail.sql

-- >>> BEGIN FILE: 17_system_settings.sql
-- ============================================================
-- SYSTEM SETTINGS - Cấu hình hệ thống động
-- Version: 1.0
-- Description: Bảng lưu các cấu hình hệ thống thay vì hardcode
-- ============================================================

-- ============================================================
-- 1. TẠO BẢNG SYSTEM_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope: NULL = global, có center_id = setting riêng cho center đó
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  
  -- Key-Value pair
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Đảm bảo không trùng key trong cùng scope
  UNIQUE(center_id, key)
);

-- ============================================================
-- 2. COMMENTS
-- ============================================================
COMMENT ON TABLE public.system_settings IS 'Bảng lưu cấu hình hệ thống động';
COMMENT ON COLUMN public.system_settings.center_id IS 'NULL = global setting, có giá trị = setting riêng cho center';
COMMENT ON COLUMN public.system_settings.key IS 'Tên setting (bank_config, grade_config, payroll_config, etc.)';
COMMENT ON COLUMN public.system_settings.value IS 'Giá trị setting dạng JSON';

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_center ON public.system_settings(center_id);

-- ============================================================
-- 4. TRIGGER CẬP NHẬT updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_settings_timestamp ON public.system_settings;

CREATE TRIGGER trigger_update_system_settings_timestamp
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin có thể xem và sửa tất cả
CREATE POLICY "Super admin full access to settings"
ON public.system_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid() AND r.code = 'SUPER_ADMIN'
  )
);

-- Center Manager chỉ xem/sửa settings của center mình hoặc global
CREATE POLICY "Center manager access own center settings"
ON public.system_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid() 
    AND r.code = 'CENTER_MANAGER'
    AND (
      public.system_settings.center_id IS NULL 
      OR public.system_settings.center_id = u.center_id
    )
  )
);

-- ============================================================
-- 6. SEED DATA - Cấu hình mặc định
-- ============================================================

-- Bank Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'bank_config',
  '{
    "bankId": "MB",
    "accountNo": "0971268268",
    "accountName": "SKILL MASTER EDU",
    "template": "compact2"
  }'::jsonb,
  'Cấu hình ngân hàng nhận thanh toán VietQR'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Grade Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'grade_config',
  '{
    "defaultPassScore": 5.0,
    "maxTotalScore": 10.0,
    "defaultCalculationType": "weighted",
    "defaultTemplate": "programming"
  }'::jsonb,
  'Cấu hình điểm số mặc định'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Payroll Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'payroll_config',
  '{
    "defaultHourlyRate": 150000,
    "defaultPassword": "SkillMaster@123",
    "paymentMethods": ["cash", "bank_transfer"],
    "quickAmounts": [1000000, 2000000, 5000000]
  }'::jsonb,
  'Cấu hình lương và thanh toán'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- System Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'system_config',
  '{
    "appName": "Skill Master",
    "timezone": "Asia/Ho_Chi_Minh",
    "dateFormat": "DD/MM/YYYY",
    "currency": "VND",
    "language": "vi"
  }'::jsonb,
  'Cấu hình hệ thống chung'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Security Config (Global) - Chỉ Super Admin
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'security_config',
  '{
    "sessionTimeout": 3600,
    "maxLoginAttempts": 5,
    "passwordMinLength": 8,
    "requireStrongPassword": true,
    "enable2FA": false
  }'::jsonb,
  'Cấu hình bảo mật (chỉ Super Admin)'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================================
-- 7. FUNCTION: Lấy setting với fallback
-- ============================================================
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT, p_center_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Thử lấy setting của center trước
  IF p_center_id IS NOT NULL THEN
    SELECT value INTO result
    FROM public.system_settings
    WHERE key = setting_key AND center_id = p_center_id;
    
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  END IF;
  
  -- Fallback về global setting
  SELECT value INTO result
  FROM public.system_settings
  WHERE key = setting_key AND center_id IS NULL;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. VERIFY
-- ============================================================
SELECT key, center_id, description, created_at 
FROM public.system_settings 
ORDER BY key;


-- <<< END FILE: 17_system_settings.sql

-- >>> BEGIN FILE: 18_documents_certificates_support.sql
-- ============================================================
-- SKILL MASTER DATABASE - DOCUMENTS, CERTIFICATES & SUPPORT
-- Version: 1.0
-- Description: Tài liệu học tập, Chứng chỉ, và Hệ thống hỗ trợ
-- ============================================================

-- ============================================================
-- 1. BẢNG DOCUMENTS - Tài liệu học tập
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- bytes
  file_type TEXT, -- pdf, doc, mp4, etc.
  
  -- Liên kết với khóa học/lớp học (optional)
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  center_id UUID REFERENCES public.centers(id),
  
  -- Document type
  type TEXT NOT NULL DEFAULT 'material' CHECK (type IN ('material', 'assignment', 'resource', 'other')),
  
  -- Access control
  is_public BOOLEAN DEFAULT false, -- true = tất cả học viên xem được
  
  -- Metadata
  uploaded_by UUID REFERENCES public.users(id),
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG CERTIFICATE_TEMPLATES - Mẫu chứng chỉ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template settings
  template_html TEXT, -- HTML template for certificate
  background_image TEXT, -- Background image URL
  
  -- Linked course (optional - template có thể dùng chung)
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  center_id UUID REFERENCES public.centers(id),
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG CERTIFICATES - Chứng chỉ được cấp
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Certificate info
  certificate_number TEXT UNIQUE NOT NULL, -- Số chứng chỉ: CC-2024-001
  
  -- Recipient
  student_id UUID NOT NULL REFERENCES public.users(id),
  student_name TEXT NOT NULL, -- Lưu tên tại thời điểm cấp
  
  -- Related course/class
  course_id UUID REFERENCES public.courses(id),
  class_id UUID REFERENCES public.classes(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  
  -- Certificate details
  course_name TEXT NOT NULL, -- Lưu tên khóa học tại thời điểm cấp
  completion_date DATE NOT NULL,
  grade TEXT, -- Excellent, Good, Pass, etc.
  
  -- Template used
  template_id UUID REFERENCES public.certificate_templates(id),
  center_id UUID REFERENCES public.centers(id),
  
  -- Generated PDF
  pdf_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Metadata
  issued_by UUID REFERENCES public.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG SUPPORT_TICKETS - Yêu cầu hỗ trợ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ticket info
  ticket_number TEXT UNIQUE NOT NULL, -- TK-2024-0001
  subject TEXT NOT NULL,
  
  -- Category & Priority
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'course', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  
  -- Participants
  created_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  center_id UUID REFERENCES public.centers(id),
  
  -- Related entities (optional)
  class_id UUID REFERENCES public.classes(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG TICKET_MESSAGES - Tin nhắn trong ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Attachment (optional)
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Sender
  sender_id UUID NOT NULL REFERENCES public.users(id),
  is_internal BOOLEAN DEFAULT false, -- true = internal note (student không thấy)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. INDEXES - Tối ưu query
-- ============================================================
-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON public.documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON public.documents(class_id);
CREATE INDEX IF NOT EXISTS idx_documents_center_id ON public.documents(center_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_class_id ON public.certificates(class_id);
CREATE INDEX IF NOT EXISTS idx_certificates_center_id ON public.certificates(center_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_center_id ON public.support_tickets(center_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);

-- Ticket messages indexes
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);

-- ============================================================
-- 7. RLS POLICIES - Row Level Security
-- ============================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "documents_select_policy" ON public.documents
  FOR SELECT USING (
    -- Admin và Manager xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
    OR
    -- Teacher xem tài liệu của mình hoặc public
    (uploaded_by = auth.uid())
    OR
    -- Student xem tài liệu public hoặc của lớp mình đang học
    (is_public = true)
    OR
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = auth.uid()
      AND e.class_id = documents.class_id
      AND e.status = 'active'
    )
  );

CREATE POLICY "documents_insert_policy" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );

CREATE POLICY "documents_update_policy" ON public.documents
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

CREATE POLICY "documents_delete_policy" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Certificate Templates Policies
CREATE POLICY "cert_templates_select_policy" ON public.certificate_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );

CREATE POLICY "cert_templates_manage_policy" ON public.certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Certificates Policies
CREATE POLICY "certificates_select_policy" ON public.certificates
  FOR SELECT USING (
    -- Admin/Manager xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
    OR
    -- Student xem chứng chỉ của mình
    student_id = auth.uid()
  );

CREATE POLICY "certificates_manage_policy" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Support Tickets Policies
CREATE POLICY "support_tickets_select_policy" ON public.support_tickets
  FOR SELECT USING (
    -- Admin/Manager/Staff xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
    OR
    -- User xem ticket của mình
    created_by = auth.uid()
  );

CREATE POLICY "support_tickets_insert_policy" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "support_tickets_update_policy" ON public.support_tickets
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    assigned_to = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Ticket Messages Policies
CREATE POLICY "ticket_messages_select_policy" ON public.ticket_messages
  FOR SELECT USING (
    -- Kiểm tra quyền xem ticket
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
    -- Nếu là internal note, chỉ staff mới xem được
    AND (
      is_internal = false
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
      )
    )
  );

CREATE POLICY "ticket_messages_insert_policy" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
  );

-- ============================================================
-- 8. FUNCTIONS - Utility functions
-- ============================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.certificates
  WHERE certificate_number LIKE 'CC-' || year_str || '-%';
  
  RETURN 'CC-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TK-' || year_str || '-%';
  
  RETURN 'TK-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. SEED DATA - Dữ liệu mẫu
-- ============================================================

-- Insert default certificate template
INSERT INTO public.certificate_templates (name, description, template_html, is_active)
SELECT 
  'Chứng chỉ hoàn thành khóa học',
  'Mẫu chứng chỉ mặc định cho tất cả khóa học',
  '<div class="certificate">
    <h1>CHỨNG CHỈ HOÀN THÀNH</h1>
    <p>Chứng nhận rằng</p>
    <h2>{{student_name}}</h2>
    <p>Đã hoàn thành xuất sắc khóa học</p>
    <h3>{{course_name}}</h3>
    <p>Ngày hoàn thành: {{completion_date}}</p>
    <p>Số chứng chỉ: {{certificate_number}}</p>
  </div>',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_templates LIMIT 1);

-- ============================================================
-- DONE! Migration completed successfully
-- ============================================================


-- <<< END FILE: 18_documents_certificates_support.sql

-- >>> BEGIN FILE: 19_certificate_types_upgrade.sql
-- ============================================================
-- SKILL MASTER DATABASE - CERTIFICATE TYPES UPGRADE
-- Version: 1.0
-- Description: Nâng cấp hệ thống chứng chỉ với loại chứng chỉ chuyên nghiệp
-- ============================================================

-- ============================================================
-- 1. BẢNG CERTIFICATE_TYPES - Loại chứng chỉ (Master data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  code TEXT UNIQUE NOT NULL, -- IELTS, TOEIC, MOS_EXCEL, EXCEL_ADVANCED, etc.
  name TEXT NOT NULL, -- Tên hiển thị: "IELTS", "TOEIC", "Microsoft Office Specialist - Excel"
  description TEXT,
  
  -- Provider info
  provider TEXT, -- British Council, ETS, Microsoft, Trung tâm ABC, etc.
  provider_logo TEXT, -- URL logo nhà cấp
  
  -- Certificate type classification
  category TEXT NOT NULL DEFAULT 'language' CHECK (category IN ('language', 'office', 'programming', 'soft_skill', 'other')),
  is_external BOOLEAN DEFAULT false, -- true = chứng chỉ bên ngoài (IELTS, TOEIC thật)
  is_internal BOOLEAN DEFAULT true, -- true = chứng chỉ do trung tâm cấp
  
  -- Score configuration (JSON)
  -- Ví dụ IELTS: {"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"]}
  -- Ví dụ TOEIC: {"type": "numeric", "min": 10, "max": 990, "sub_scores": ["listening", "reading"]}
  -- Ví dụ MOS: {"type": "numeric", "min": 0, "max": 1000, "pass_score": 700}
  score_config JSONB DEFAULT '{}',
  
  -- Template preview
  template_preview_url TEXT, -- Ảnh preview mẫu chứng chỉ
  
  -- Linked courses (có thể cấp từ những khóa học nào)
  linked_course_ids UUID[] DEFAULT '{}',
  
  -- Requirements (điều kiện cấp)
  -- Ví dụ: {"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}
  requirements JSONB DEFAULT '{}',
  
  -- Validity
  validity_months INTEGER, -- Thời hạn hiệu lực (NULL = vĩnh viễn)
  
  -- Center scope
  center_id UUID REFERENCES public.centers(id), -- NULL = system-wide
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ALTER BẢNG CERTIFICATES - Thêm các trường mới
-- ============================================================

-- Thêm liên kết với certificate_types
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS certificate_type_id UUID REFERENCES public.certificate_types(id);

-- Thêm trường điểm chi tiết (JSON)
-- Ví dụ IELTS: {"overall": 7.5, "listening": 8.0, "reading": 7.5, "writing": 6.5, "speaking": 7.0}
-- Ví dụ TOEIC: {"total": 850, "listening": 450, "reading": 400}
-- Ví dụ MOS: {"score": 925, "passed": true}
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}';

-- External certificate info
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS external_id TEXT; -- TRF number, Candidate number, etc.

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS external_verify_url TEXT; -- URL verify chứng chỉ

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS exam_date DATE; -- Ngày thi (với chứng chỉ bên ngoài)

-- File attachment (scan chứng chỉ gốc)
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS file_url TEXT; -- URL file scan/PDF

-- Expiry date
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS expires_at DATE; -- Ngày hết hạn

-- Verified by (người xác nhận chứng chỉ)
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ============================================================
-- 3. SEED DATA - Các loại chứng chỉ phổ biến
-- ============================================================
INSERT INTO public.certificate_types (code, name, description, provider, category, is_external, is_internal, score_config, requirements, display_order) VALUES

-- Language Certificates (External)
('IELTS', 'IELTS Academic', 'International English Language Testing System - Academic Module', 'British Council / IDP / Cambridge', 'language', true, false, 
 '{"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"], "labels": {"listening": "Listening", "reading": "Reading", "writing": "Writing", "speaking": "Speaking"}}',
 '{}', 1),

('IELTS_GT', 'IELTS General Training', 'International English Language Testing System - General Training Module', 'British Council / IDP / Cambridge', 'language', true, false,
 '{"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"], "labels": {"listening": "Listening", "reading": "Reading", "writing": "Writing", "speaking": "Speaking"}}',
 '{}', 2),

('TOEIC', 'TOEIC Listening & Reading', 'Test of English for International Communication', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 10, "max": 990, "sub_scores": ["listening", "reading"], "labels": {"listening": "Listening", "reading": "Reading"}, "total_label": "Total Score"}',
 '{}', 3),

('TOEIC_SW', 'TOEIC Speaking & Writing', 'Test of English for International Communication - Speaking & Writing', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 0, "max": 400, "sub_scores": ["speaking", "writing"], "labels": {"speaking": "Speaking", "writing": "Writing"}}',
 '{}', 4),

('TOEFL_IBT', 'TOEFL iBT', 'Test of English as a Foreign Language - Internet Based Test', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 0, "max": 120, "sub_scores": ["reading", "listening", "speaking", "writing"], "labels": {"reading": "Reading", "listening": "Listening", "speaking": "Speaking", "writing": "Writing"}}',
 '{}', 5),

-- Microsoft Office Certificates (External)
('MOS_EXCEL', 'MOS Excel 2019/365', 'Microsoft Office Specialist - Excel', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 10),

('MOS_WORD', 'MOS Word 2019/365', 'Microsoft Office Specialist - Word', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 11),

('MOS_POWERPOINT', 'MOS PowerPoint 2019/365', 'Microsoft Office Specialist - PowerPoint', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 12),

('MOS_EXPERT_EXCEL', 'MOS Expert Excel', 'Microsoft Office Specialist Expert - Excel', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 13),

-- Internal Certificates (do trung tâm cấp)
('EXCEL_BASIC', 'Excel Cơ bản', 'Chứng chỉ hoàn thành khóa Excel cơ bản', NULL, 'office', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}', 20),

('EXCEL_ADVANCED', 'Excel Nâng cao', 'Chứng chỉ hoàn thành khóa Excel nâng cao (Pivot, VBA, Dashboard)', NULL, 'office', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}', 21),

('IELTS_PREP', 'IELTS Preparation', 'Chứng chỉ hoàn thành khóa luyện thi IELTS', NULL, 'language', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 22),

('TOEIC_PREP', 'TOEIC Preparation', 'Chứng chỉ hoàn thành khóa luyện thi TOEIC', NULL, 'language', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 23),

('COMMUNICATION', 'Kỹ năng Giao tiếp', 'Chứng chỉ hoàn thành khóa Kỹ năng giao tiếp chuyên nghiệp', NULL, 'soft_skill', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 30),

('PRESENTATION', 'Kỹ năng Thuyết trình', 'Chứng chỉ hoàn thành khóa Kỹ năng thuyết trình', NULL, 'soft_skill', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 31)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  provider = EXCLUDED.provider,
  category = EXCLUDED.category,
  is_external = EXCLUDED.is_external,
  is_internal = EXCLUDED.is_internal,
  score_config = EXCLUDED.score_config,
  requirements = EXCLUDED.requirements,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificate_types_code ON public.certificate_types(code);
CREATE INDEX IF NOT EXISTS idx_certificate_types_category ON public.certificate_types(category);
CREATE INDEX IF NOT EXISTS idx_certificate_types_is_active ON public.certificate_types(is_active);
CREATE INDEX IF NOT EXISTS idx_certificate_types_center ON public.certificate_types(center_id);

CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expires ON public.certificates(expires_at);

-- ============================================================
-- 5. VIEW - Certificate Statistics by Type
-- ============================================================
CREATE OR REPLACE VIEW public.certificate_type_stats AS
SELECT 
  ct.id,
  ct.code,
  ct.name,
  ct.category,
  ct.provider,
  ct.is_external,
  ct.is_internal,
  ct.template_preview_url,
  ct.display_order,
  ct.is_active,
  COUNT(c.id) AS total_issued,
  COUNT(CASE WHEN c.status = 'issued' THEN 1 END) AS active_count,
  COUNT(CASE WHEN c.status = 'revoked' THEN 1 END) AS revoked_count,
  COUNT(CASE WHEN c.issued_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS issued_last_30_days,
  MAX(c.issued_at) AS last_issued_at
FROM public.certificate_types ct
LEFT JOIN public.certificates c ON c.certificate_type_id = ct.id
WHERE ct.is_active = true
GROUP BY ct.id
ORDER BY ct.display_order, ct.name;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active certificate types
CREATE POLICY "certificate_types_read_policy" ON public.certificate_types
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() IN (
    SELECT u.id FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  ));

-- Policy: Only admins can modify certificate types
CREATE POLICY "certificate_types_admin_policy" ON public.certificate_types
  FOR ALL TO authenticated
  USING (auth.uid() IN (
    SELECT u.id FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  ));

-- ============================================================
-- 7. FUNCTION - Generate Certificate Number
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number(type_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  -- Prefix based on type
  IF type_code IS NOT NULL THEN
    prefix := UPPER(LEFT(type_code, 4));
  ELSE
    prefix := 'CERT';
  END IF;
  
  -- Year part
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(NULLIF(REGEXP_REPLACE(certificate_number, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.certificates
  WHERE certificate_number LIKE prefix || '-' || year_part || '-%';
  
  -- Format: TYPE-YYYY-NNNN
  new_number := prefix || '-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.certificate_types IS 'Bảng master data các loại chứng chỉ (IELTS, TOEIC, MOS, Internal certificates)';
COMMENT ON TABLE public.certificates IS 'Bảng chứng chỉ đã cấp cho học viên';


-- <<< END FILE: 19_certificate_types_upgrade.sql

-- >>> BEGIN FILE: 20_documents_upgrade.sql
-- ============================================================================
-- MIGRATION: 20_documents_upgrade.sql
-- Purpose: Enhanced documents management with download tracking and analytics
-- Author: System
-- Date: 2025-12-06
-- Note: Documents table already exists with UUID primary keys (from migration 18)
-- ============================================================================

-- ============================================================================
-- 1. ALTER EXISTING DOCUMENTS TABLE (add new columns)
-- ============================================================================

-- Version control
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Categorization
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Analytics (download_count already exists)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Full-text search
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Soft delete (if not exists)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update type constraint to match current usage
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
    CHECK (type IN ('lesson', 'exercise', 'exam', 'reference', 'material', 'assignment', 'resource', 'video', 'audio', 'image', 'other'));

-- ============================================================================
-- 2. CREATE DOCUMENT_DOWNLOADS TABLE (download tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    
    -- Download metadata
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE document_downloads IS 'Tracks all document download events for analytics';

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON documents(class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_center_id ON documents(center_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id) WHERE deleted_at IS NULL;

-- Document downloads indexes
CREATE INDEX IF NOT EXISTS idx_doc_downloads_document_id ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_user_id ON document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_center_id ON document_downloads(center_id);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_downloaded_at ON document_downloads(downloaded_at DESC);

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at_trigger ON documents;
CREATE TRIGGER documents_updated_at_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Trigger: Update search_vector for full-text search
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.file_name, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_search_vector_trigger ON documents;
CREATE TRIGGER documents_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description, file_name, tags ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_search_vector();

-- Trigger: Increment download_count when download tracked
CREATE OR REPLACE FUNCTION increment_document_download_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents 
    SET download_count = download_count + 1 
    WHERE id = NEW.document_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_downloads_increment_trigger ON document_downloads;
CREATE TRIGGER document_downloads_increment_trigger
    AFTER INSERT ON document_downloads
    FOR EACH ROW
    EXECUTE FUNCTION increment_document_download_count();

-- ============================================================================
-- 5. MIGRATE EXISTING DATA (if any)
-- ============================================================================

-- Update search_vector for existing documents
UPDATE documents 
SET search_vector = 
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(file_name, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE search_vector IS NULL;

-- Initialize download_count if NULL
UPDATE documents SET download_count = 0 WHERE download_count IS NULL;
UPDATE documents SET view_count = 0 WHERE view_count IS NULL;
UPDATE documents SET version = 1 WHERE version IS NULL;
UPDATE documents SET tags = '{}' WHERE tags IS NULL;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_downloads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS documents_admin_all ON documents;
DROP POLICY IF EXISTS documents_teacher_select ON documents;
DROP POLICY IF EXISTS documents_student_select ON documents;
DROP POLICY IF EXISTS document_downloads_insert ON document_downloads;
DROP POLICY IF EXISTS document_downloads_select_own ON document_downloads;
DROP POLICY IF EXISTS document_downloads_manager_select ON document_downloads;
DROP POLICY IF EXISTS document_downloads_admin_select ON document_downloads;

-- Policy: Admin can do everything
CREATE POLICY documents_admin_all ON documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'SUPER_ADMIN'
        )
    );

-- Policy: Teachers can view documents in their center
CREATE POLICY documents_teacher_select ON documents
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('TEACHER', 'CENTER_MANAGER')
            AND u.center_id = documents.center_id
        )
    );

-- Policy: Students can view documents for their classes
CREATE POLICY documents_student_select ON documents
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            -- Documents in their classes
            class_id IN (
                SELECT class_id FROM enrollments
                WHERE student_id = auth.uid()
                AND status = 'active'
            )
            -- Or course-level documents (no specific class)
            OR (
                class_id IS NULL
                AND course_id IN (
                    SELECT c.id FROM courses c
                    INNER JOIN classes cls ON cls.course_id = c.id
                    INNER JOIN enrollments e ON e.class_id = cls.id
                    WHERE e.student_id = auth.uid()
                    AND e.status = 'active'
                )
            )
        )
    );

-- Policy: Download tracking - users can track their own downloads
CREATE POLICY document_downloads_insert ON document_downloads
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Download tracking - users can view their own download history
CREATE POLICY document_downloads_select_own ON document_downloads
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Managers can view downloads in their center
CREATE POLICY document_downloads_manager_select ON document_downloads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'CENTER_MANAGER'
            AND u.center_id = document_downloads.center_id
        )
    );

-- Policy: Admin can view all download history
CREATE POLICY document_downloads_admin_select ON document_downloads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'SUPER_ADMIN'
        )
    );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get document download statistics
CREATE OR REPLACE FUNCTION get_document_download_stats(doc_id UUID)
RETURNS TABLE (
    total_downloads BIGINT,
    unique_users BIGINT,
    downloads_this_month BIGINT,
    downloads_this_week BIGINT,
    top_downloader_name TEXT,
    top_downloader_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_downloads,
        COUNT(DISTINCT dd.user_id)::BIGINT as unique_users,
        COUNT(*) FILTER (WHERE dd.downloaded_at >= NOW() - INTERVAL '30 days')::BIGINT as downloads_this_month,
        COUNT(*) FILTER (WHERE dd.downloaded_at >= NOW() - INTERVAL '7 days')::BIGINT as downloads_this_week,
        (
            SELECT u.full_name 
            FROM document_downloads dd2
            INNER JOIN users u ON u.id = dd2.user_id
            WHERE dd2.document_id = doc_id
            GROUP BY dd2.user_id, u.full_name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as top_downloader_name,
        (
            SELECT COUNT(*)::BIGINT
            FROM document_downloads dd2
            WHERE dd2.document_id = doc_id
            GROUP BY dd2.user_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as top_downloader_count
    FROM document_downloads dd
    WHERE dd.document_id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get popular documents in center
CREATE OR REPLACE FUNCTION get_popular_documents(
    p_center_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    document_id UUID,
    title TEXT,
    file_name TEXT,
    download_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as document_id,
        d.title,
        d.file_name,
        COUNT(dd.id)::BIGINT as download_count,
        COUNT(DISTINCT dd.user_id)::BIGINT as unique_users
    FROM documents d
    LEFT JOIN document_downloads dd ON dd.document_id = d.id
        AND dd.downloaded_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE d.center_id = p_center_id
        AND d.deleted_at IS NULL
    GROUP BY d.id, d.title, d.file_name
    ORDER BY download_count DESC, unique_users DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT ON document_downloads TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification query
DO $$
BEGIN
    RAISE NOTICE 'Migration 20_documents_upgrade.sql completed successfully';
    RAISE NOTICE 'Documents table: %', (SELECT COUNT(*) FROM documents);
    RAISE NOTICE 'Download tracking enabled: document_downloads table created';
    RAISE NOTICE 'Full-text search enabled with search_vector';
    RAISE NOTICE 'RLS policies applied for multi-tenant security';
END $$;


-- <<< END FILE: 20_documents_upgrade.sql

-- >>> BEGIN FILE: 21_fix_auth_trigger.sql
-- ============================================================
-- FIX AUTH TRIGGER - Tự động tạo profile với đúng role
-- ============================================================
-- Vấn đề: Admin tạo teacher nhưng profile không được tạo hoặc tạo sai role
-- Giải pháp: Cập nhật trigger để đọc metadata từ auth.users
-- ============================================================

-- 1. Drop trigger và function cũ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Tạo function mới với logic thông minh hơn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_center_id UUID;
  v_role_code TEXT;
  v_full_name TEXT;
BEGIN
  -- Đọc role_code từ metadata (admin set khi tạo)
  v_role_code := COALESCE(NEW.raw_user_meta_data->>'role_code', 'STUDENT');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Lấy role_id từ role_code
  SELECT id INTO v_role_id FROM public.roles WHERE code = v_role_code;
  
  -- Nếu không tìm thấy role, dùng STUDENT mặc định
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'STUDENT';
  END IF;
  
  -- Lấy center_id từ metadata hoặc center đầu tiên
  v_center_id := (NEW.raw_user_meta_data->>'center_id')::UUID;
  IF v_center_id IS NULL THEN
    SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  END IF;

  -- Tạo profile trong public.users
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role_id, 
    center_id, 
    phone,
    status,
    created_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    v_full_name,
    v_role_id,
    v_center_id,
    NEW.raw_user_meta_data->>'phone',
    'active',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    center_id = EXCLUDED.center_id,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tạo lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync tất cả user hiện tại chưa có profile
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(
    (SELECT id FROM public.roles WHERE code = (au.raw_user_meta_data->>'role_code')),
    (SELECT id FROM public.roles WHERE code = 'STUDENT')
  ),
  COALESCE(
    (au.raw_user_meta_data->>'center_id')::UUID,
    (SELECT id FROM public.centers LIMIT 1)
  ),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Kiểm tra kết quả
SELECT 
  'Auth users' as type,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profile users' as type,
  COUNT(*) as count
FROM public.users;

-- 6. Hiển thị users với role
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as role,
  c.name as center,
  u.status
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
LEFT JOIN public.centers c ON c.id = u.center_id
ORDER BY u.created_at DESC
LIMIT 20;

-- ============================================================
-- DONE! Từ giờ khi admin tạo staff sẽ tự động có profile đúng role
-- ============================================================


-- <<< END FILE: 21_fix_auth_trigger.sql

-- >>> BEGIN FILE: 25_invoice_draft_status.sql
-- ============================================================
-- INVOICE DRAFT STATUS SUPPORT
-- Version: 1.0
-- Description: Thêm trạng thái 'draft' cho invoices để hỗ trợ workflow confirm
-- ============================================================

-- 1. Thêm 'draft' vào CHECK constraint của status
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'cancelled', 'refunded'));

-- 2. Comment
COMMENT ON COLUMN public.invoices.status IS 
'Trạng thái hóa đơn: draft (nháp), unpaid (chưa thanh toán), partial (thanh toán 1 phần), paid (đã thanh toán), cancelled (đã hủy), refunded (đã hoàn tiền)';

-- 3. Index cho draft invoices (để query nhanh)
CREATE INDEX IF NOT EXISTS idx_invoices_status_draft ON public.invoices(status) WHERE status = 'draft';

-- 4. Function xác nhận invoice từ draft
CREATE OR REPLACE FUNCTION confirm_invoice(invoice_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.invoices
  SET status = CASE 
    WHEN paid_amount >= final_amount THEN 'paid'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  updated_at = NOW()
  WHERE id = invoice_id AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirm_invoice IS 'Xác nhận invoice từ draft, tự động set status dựa trên paid_amount';

-- ============================================================
-- ROLLBACK SCRIPT (nếu cần)
-- ============================================================
/*
-- Revert constraint
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled', 'refunded'));

-- Drop function
DROP FUNCTION IF EXISTS confirm_invoice(UUID);

-- Drop index
DROP INDEX IF EXISTS idx_invoices_status_draft;
*/


-- <<< END FILE: 25_invoice_draft_status.sql

-- >>> BEGIN FILE: 26_certificate_eligibility_functions.sql
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


-- <<< END FILE: 26_certificate_eligibility_functions.sql

-- >>> BEGIN FILE: 27_dashboard_alerts_system.sql
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


-- <<< END FILE: 27_dashboard_alerts_system.sql

-- >>> BEGIN FILE: 28_class_stats_optimization.sql
-- ============================================
-- Database Optimization: Class Enrolled Count
-- ============================================

-- Function: Tính số học viên đang active trong lớp
CREATE OR REPLACE FUNCTION get_class_enrolled_count(p_class_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM enrollments
    WHERE class_id = p_class_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Materialized View: Class Statistics
-- Cập nhật định kỳ để có performance tốt
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_class_stats AS
SELECT 
  c.id AS class_id,
  c.code,
  c.name,
  c.status,
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) AS enrolled_count,
  COUNT(CASE WHEN e.status = 'dropped' THEN 1 END) AS dropped_count,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS completed_count,
  c.max_students,
  CASE 
    WHEN c.max_students > 0 
    THEN ROUND((COUNT(CASE WHEN e.status = 'active' THEN 1 END)::NUMERIC / c.max_students) * 100, 2)
    ELSE 0 
  END AS fill_rate_percent,
  CASE 
    WHEN COUNT(CASE WHEN e.status = 'active' THEN 1 END) >= c.max_students 
    THEN true 
    ELSE false 
  END AS is_full
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY c.id, c.code, c.name, c.status, c.max_students;

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_class_stats_class_id ON mv_class_stats(class_id);
CREATE INDEX IF NOT EXISTS idx_mv_class_stats_status ON mv_class_stats(status);
CREATE INDEX IF NOT EXISTS idx_mv_class_stats_is_full ON mv_class_stats(is_full);

-- ============================================
-- Trigger: Auto-refresh Materialized View
-- Refresh khi có thay đổi enrollments
-- ============================================

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_class_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_refresh_class_stats_on_enrollment ON enrollments;
DROP TRIGGER IF EXISTS trg_refresh_class_stats_on_class ON classes;

-- Trigger on enrollments table
CREATE TRIGGER trg_refresh_class_stats_on_enrollment
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_class_stats();

-- Trigger on classes table (when max_students changes)
CREATE TRIGGER trg_refresh_class_stats_on_class
AFTER INSERT OR UPDATE OF max_students ON classes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_class_stats();

-- ============================================
-- Initial refresh
-- ============================================
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;

-- ============================================
-- Usage Examples:
-- ============================================

-- 1. Get enrolled count for a single class
-- SELECT get_class_enrolled_count('class-uuid-here');

-- 2. Query class with stats from materialized view
-- SELECT 
--   c.*,
--   s.enrolled_count,
--   s.fill_rate_percent,
--   s.is_full
-- FROM classes c
-- LEFT JOIN mv_class_stats s ON c.id = s.class_id;

-- 3. Find nearly full classes (>= 80% capacity)
-- SELECT * FROM mv_class_stats 
-- WHERE fill_rate_percent >= 80 
-- AND status = 'active'
-- ORDER BY fill_rate_percent DESC;

-- 4. Manual refresh (if needed)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_stats;


-- <<< END FILE: 28_class_stats_optimization.sql

-- >>> BEGIN FILE: 29_sessions_performance_optimization.sql


-- <<< END FILE: 29_sessions_performance_optimization.sql

-- >>> BEGIN FILE: 30_certificate_system_complete.sql
-- ============================================================
-- SKILL MASTER - CERTIFICATE SYSTEM COMPLETE
-- Version: 2.0
-- Hệ thống chứng chỉ hoàn chỉnh cho Trung tâm Anh ngữ & Tin học
-- ============================================================

-- ============================================================
-- 1. THÊM CÁC LOẠI CHỨNG CHỈ MỚI
-- ============================================================

-- Delete old seed data để insert lại với design mới
DELETE FROM public.certificate_types WHERE id IS NOT NULL;

-- Insert comprehensive certificate types cho Anh ngữ & Tin học
INSERT INTO public.certificate_types (
    code, name, description, provider, category, 
    is_external, is_internal, score_config, requirements, 
    validity_months, display_order, is_active
) VALUES

-- ============================================================
-- A. CHỨNG CHỈ ANH NGỮ QUỐC TẾ (External - Bên ngoài)
-- ============================================================
('IELTS_AC', 'IELTS Academic', 
 'Chứng chỉ IELTS Academic - Dành cho học thuật, du học, định cư', 
 'British Council / IDP / Cambridge', 'language', true, false,
 '{
    "type": "band",
    "min": 0,
    "max": 9,
    "step": 0.5,
    "sub_scores": ["listening", "reading", "writing", "speaking"],
    "labels": {
        "listening": "Listening",
        "reading": "Reading", 
        "writing": "Writing",
        "speaking": "Speaking"
    },
    "levels": {
        "9": "Expert",
        "8": "Very Good",
        "7": "Good",
        "6": "Competent",
        "5": "Modest",
        "4": "Limited"
    }
 }',
 '{}',
 24, 1, true),

('IELTS_GT', 'IELTS General Training', 
 'Chứng chỉ IELTS General Training - Dành cho di trú, công việc', 
 'British Council / IDP / Cambridge', 'language', true, false,
 '{
    "type": "band",
    "min": 0,
    "max": 9,
    "step": 0.5,
    "sub_scores": ["listening", "reading", "writing", "speaking"],
    "labels": {
        "listening": "Listening",
        "reading": "Reading",
        "writing": "Writing", 
        "speaking": "Speaking"
    }
 }',
 '{}',
 24, 2, true),

('TOEIC_LR', 'TOEIC Listening & Reading', 
 'Chứng chỉ TOEIC Listening & Reading - Tiêu chuẩn doanh nghiệp', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 10,
    "max": 990,
    "sub_scores": ["listening", "reading"],
    "labels": {
        "listening": "Listening (5-495)",
        "reading": "Reading (5-495)"
    },
    "total_label": "Total Score",
    "levels": {
        "905": "International Professional Proficiency",
        "785": "Working Proficiency Plus",
        "605": "Limited Working Proficiency",
        "405": "Elementary Proficiency Plus"
    }
 }',
 '{}',
 24, 3, true),

('TOEIC_SW', 'TOEIC Speaking & Writing', 
 'Chứng chỉ TOEIC Speaking & Writing', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 400,
    "sub_scores": ["speaking", "writing"],
    "labels": {
        "speaking": "Speaking (0-200)",
        "writing": "Writing (0-200)"
    }
 }',
 '{}',
 24, 4, true),

('TOEFL_IBT', 'TOEFL iBT', 
 'Chứng chỉ TOEFL Internet-Based Test', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 120,
    "sub_scores": ["reading", "listening", "speaking", "writing"],
    "labels": {
        "reading": "Reading (0-30)",
        "listening": "Listening (0-30)",
        "speaking": "Speaking (0-30)",
        "writing": "Writing (0-30)"
    },
    "total_label": "Total Score"
 }',
 '{}',
 24, 5, true),

('CAMBRIDGE_KET', 'Cambridge KET (A2 Key)', 
 'Chứng chỉ Cambridge A2 Key - Trình độ cơ bản', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 100,
    "max": 150,
    "pass_score": 120,
    "grades": ["Pass with Distinction", "Pass with Merit", "Pass", "Fail"]
 }',
 '{}',
 null, 6, true),

('CAMBRIDGE_PET', 'Cambridge PET (B1 Preliminary)', 
 'Chứng chỉ Cambridge B1 Preliminary - Trình độ trung cấp', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 120,
    "max": 170,
    "pass_score": 140,
    "grades": ["Pass with Distinction", "Pass with Merit", "Pass", "Fail"]
 }',
 '{}',
 null, 7, true),

('CAMBRIDGE_FCE', 'Cambridge FCE (B2 First)', 
 'Chứng chỉ Cambridge B2 First - Trình độ cao cấp', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 140,
    "max": 190,
    "pass_score": 160,
    "grades": ["Grade A (C1)", "Grade B", "Grade C", "Fail"]
 }',
 '{}',
 null, 8, true),

-- ============================================================
-- B. CHỨNG CHỈ TIN HỌC QUỐC TẾ (External - Bên ngoài)
-- ============================================================
('MOS_WORD', 'MOS Word 365/2019', 
 'Microsoft Office Specialist - Word Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 20, true),

('MOS_EXCEL', 'MOS Excel 365/2019', 
 'Microsoft Office Specialist - Excel Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 21, true),

('MOS_POWERPOINT', 'MOS PowerPoint 365/2019', 
 'Microsoft Office Specialist - PowerPoint Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 22, true),

('MOS_EXCEL_EXPERT', 'MOS Excel Expert', 
 'Microsoft Office Specialist Expert - Excel', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 23, true),

('IC3_GS6', 'IC3 Digital Literacy GS6', 
 'Chứng chỉ Tin học Văn phòng Quốc tế IC3', 
 'Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "sub_scores": ["computing_fundamentals", "key_applications", "living_online"],
    "labels": {
        "computing_fundamentals": "Computing Fundamentals",
        "key_applications": "Key Applications",
        "living_online": "Living Online"
    }
 }',
 '{}',
 null, 24, true),

-- ============================================================
-- C. CHỨNG CHỈ NỘI BỘ - ANH NGỮ (Internal - Trung tâm cấp)
-- ============================================================
('ENGLISH_STARTER', 'English Starter (Pre-A1)', 
 'Chứng chỉ hoàn thành khóa Anh ngữ Khởi đầu', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "grade_colors": {
        "Xuất sắc": "#FFD700",
        "Giỏi": "#C0C0C0",
        "Khá": "#CD7F32",
        "Đạt": "#4CAF50"
    }
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 40, true),

('ENGLISH_A1', 'English Elementary (A1)', 
 'Chứng chỉ Anh ngữ trình độ A1 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 41, true),

('ENGLISH_A2', 'English Pre-Intermediate (A2)', 
 'Chứng chỉ Anh ngữ trình độ A2 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 42, true),

('ENGLISH_B1', 'English Intermediate (B1)', 
 'Chứng chỉ Anh ngữ trình độ B1 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 43, true),

('ENGLISH_B2', 'English Upper-Intermediate (B2)', 
 'Chứng chỉ Anh ngữ trình độ B2 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 6.5, "require_final_exam": true}',
 null, 44, true),

('IELTS_PREP', 'IELTS Preparation Course', 
 'Chứng chỉ hoàn thành khóa Luyện thi IELTS', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "target_band": true
 }',
 '{"min_attendance": 85, "min_grade": 5.0}',
 null, 45, true),

('TOEIC_PREP', 'TOEIC Preparation Course', 
 'Chứng chỉ hoàn thành khóa Luyện thi TOEIC', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "target_score": true
 }',
 '{"min_attendance": 85, "min_grade": 5.0}',
 null, 46, true),

('BUSINESS_ENGLISH', 'Business English', 
 'Chứng chỉ hoàn thành khóa Tiếng Anh Thương mại', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 47, true),

('ENGLISH_COMMUNICATION', 'English Communication', 
 'Chứng chỉ hoàn thành khóa Giao tiếp Tiếng Anh', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 48, true),

-- ============================================================
-- D. CHỨNG CHỈ NỘI BỘ - TIN HỌC (Internal - Trung tâm cấp)
-- ============================================================
('OFFICE_BASIC', 'Tin học Văn phòng Cơ bản', 
 'Chứng chỉ hoàn thành khóa Tin học Văn phòng cơ bản (Word, Excel, PowerPoint)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "modules": ["Word", "Excel", "PowerPoint"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 60, true),

('EXCEL_BASIC', 'Excel Cơ bản', 
 'Chứng chỉ hoàn thành khóa Excel cơ bản', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 61, true),

('EXCEL_ADVANCED', 'Excel Nâng cao', 
 'Chứng chỉ hoàn thành khóa Excel nâng cao (Pivot, Dashboard, VBA)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "modules": ["Pivot Table", "Dashboard", "VBA Macro"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 62, true),

('EXCEL_DATA_ANALYSIS', 'Excel Data Analysis', 
 'Chứng chỉ hoàn thành khóa Phân tích dữ liệu với Excel', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 63, true),

('WORD_ADVANCED', 'Word Nâng cao', 
 'Chứng chỉ hoàn thành khóa Word nâng cao (Mail Merge, Template, Automation)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 64, true),

('POWERPOINT_DESIGN', 'PowerPoint Design', 
 'Chứng chỉ hoàn thành khóa Thiết kế Slide chuyên nghiệp', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 65, true),

('GOOGLE_WORKSPACE', 'Google Workspace', 
 'Chứng chỉ hoàn thành khóa Google Workspace (Docs, Sheets, Slides)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 66, true),

-- ============================================================
-- E. CHỨNG CHỈ LẬP TRÌNH (Programming)
-- ============================================================
('PYTHON_BASIC', 'Python Cơ bản', 
 'Chứng chỉ hoàn thành khóa Lập trình Python cơ bản', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true, "require_project": true}',
 null, 80, true),

('PYTHON_DATA', 'Python for Data Science', 
 'Chứng chỉ hoàn thành khóa Python cho Khoa học dữ liệu', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_project": true}',
 null, 81, true),

('WEB_FRONTEND', 'Web Frontend Development', 
 'Chứng chỉ hoàn thành khóa Lập trình Web Frontend (HTML, CSS, JavaScript)', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_project": true}',
 null, 82, true),

('GRAPHIC_DESIGN', 'Graphic Design Fundamentals', 
 'Chứng chỉ hoàn thành khóa Thiết kế đồ họa cơ bản (Photoshop, Illustrator)', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_project": true}',
 null, 83, true),

-- ============================================================
-- F. KỸ NĂNG MỀM (Soft Skills)
-- ============================================================
('PRESENTATION_SKILLS', 'Kỹ năng Thuyết trình', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Thuyết trình chuyên nghiệp', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 100, true),

('COMMUNICATION_SKILLS', 'Kỹ năng Giao tiếp', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Giao tiếp hiệu quả', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 101, true),

('TEAMWORK_SKILLS', 'Kỹ năng Làm việc nhóm', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Làm việc nhóm', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 102, true);

-- ============================================================
-- 2. THÊM BẢNG CERTIFICATE_DESIGNS (Mẫu thiết kế chứng chỉ)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Design template (CSS + HTML variables)
    design_config JSONB NOT NULL DEFAULT '{
        "size": "A4",
        "orientation": "landscape",
        "background": {
            "type": "gradient",
            "colors": ["#f8fafc", "#e2e8f0"]
        },
        "border": {
            "style": "double",
            "color": "#d4af37",
            "width": 8
        },
        "colors": {
            "primary": "#1e40af",
            "secondary": "#d4af37",
            "text": "#1e293b",
            "accent": "#0891b2"
        },
        "fonts": {
            "title": "Playfair Display",
            "body": "Inter",
            "script": "Dancing Script"
        }
    }',
    
    -- Background image URL (optional)
    background_url TEXT,
    
    -- Logo positions
    logo_config JSONB DEFAULT '{
        "center_logo": true,
        "provider_logo": false
    }',
    
    -- Linked certificate types (which types can use this design)
    certificate_type_ids UUID[] DEFAULT '{}',
    
    -- Category specific (language, office, etc.)
    category TEXT CHECK (category IN ('language', 'office', 'programming', 'soft_skill', 'other', 'all')),
    
    -- Preview image
    preview_url TEXT,
    
    -- Is default for category
    is_default BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    center_id UUID REFERENCES public.centers(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SEED CERTIFICATE DESIGNS
-- ============================================================
INSERT INTO public.certificate_designs (name, description, category, is_default, design_config) VALUES

-- Classic Gold Design (Anh ngữ)
('Classic Gold - Anh ngữ', 
 'Thiết kế cổ điển với viền vàng sang trọng, phù hợp cho chứng chỉ Anh ngữ', 
 'language', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#fffbeb", "#fef3c7"]
    },
    "border": {
        "style": "ornate",
        "color": "#d4af37",
        "width": 12,
        "pattern": "greek_key"
    },
    "colors": {
        "primary": "#1e40af",
        "secondary": "#d4af37",
        "text": "#1e293b",
        "accent": "#7c3aed"
    },
    "fonts": {
        "title": "Playfair Display",
        "name": "Great Vibes",
        "body": "Cormorant Garamond"
    },
    "decorations": {
        "corner_ornaments": true,
        "seal": true,
        "ribbon": false
    }
 }'),

-- Modern Blue Design (Tin học)
('Modern Blue - Tin học', 
 'Thiết kế hiện đại với tông màu xanh công nghệ', 
 'office', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#f0f9ff", "#e0f2fe"]
    },
    "border": {
        "style": "modern",
        "color": "#0284c7",
        "width": 4
    },
    "colors": {
        "primary": "#0369a1",
        "secondary": "#0891b2",
        "text": "#0f172a",
        "accent": "#06b6d4"
    },
    "fonts": {
        "title": "Montserrat",
        "name": "Poppins",
        "body": "Inter"
    },
    "decorations": {
        "corner_ornaments": false,
        "seal": true,
        "ribbon": false,
        "tech_pattern": true
    }
 }'),

-- Professional Purple (Lập trình)
('Professional Purple - Programming', 
 'Thiết kế chuyên nghiệp tông tím cho chứng chỉ IT', 
 'programming', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#faf5ff", "#f3e8ff"]
    },
    "border": {
        "style": "code",
        "color": "#7c3aed",
        "width": 6
    },
    "colors": {
        "primary": "#6d28d9",
        "secondary": "#8b5cf6",
        "text": "#1e1b4b",
        "accent": "#a855f7"
    },
    "fonts": {
        "title": "JetBrains Mono",
        "name": "Outfit",
        "body": "Inter"
    },
    "decorations": {
        "code_pattern": true,
        "seal": true
    }
 }'),

-- Elegant Warm (Kỹ năng mềm)
('Elegant Warm - Soft Skills', 
 'Thiết kế ấm áp, thân thiện cho chứng chỉ kỹ năng mềm', 
 'soft_skill', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#fff7ed", "#ffedd5"]
    },
    "border": {
        "style": "flowing",
        "color": "#ea580c",
        "width": 6
    },
    "colors": {
        "primary": "#c2410c",
        "secondary": "#ea580c",
        "text": "#431407",
        "accent": "#f97316"
    },
    "fonts": {
        "title": "Merriweather",
        "name": "Satisfy",
        "body": "Lora"
    },
    "decorations": {
        "floral_ornaments": true,
        "seal": true
    }
 }'),

-- Premium Gold (External Certificates)
('Premium Gold - External', 
 'Thiết kế cao cấp cho chứng chỉ quốc tế', 
 'all', false,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "solid",
        "color": "#fefce8"
    },
    "border": {
        "style": "premium",
        "color": "#b45309",
        "width": 16,
        "inner_color": "#fbbf24"
    },
    "colors": {
        "primary": "#92400e",
        "secondary": "#d97706",
        "text": "#422006",
        "accent": "#fbbf24"
    },
    "fonts": {
        "title": "Cinzel",
        "name": "Alex Brush",
        "body": "EB Garamond"
    },
    "decorations": {
        "corner_ornaments": true,
        "seal": true,
        "ribbon": true,
        "watermark": true
    }
 }');

-- ============================================================
-- 4. FUNCTION - Sinh số chứng chỉ có format đẹp
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number_v2(
    p_type_code TEXT,
    p_center_code TEXT DEFAULT 'SM'
)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_part TEXT;
    month_part TEXT;
    seq_num INTEGER;
    new_number TEXT;
BEGIN
    -- Build prefix: CENTER-TYPE
    prefix := UPPER(COALESCE(p_center_code, 'SM'));
    
    -- Year and month
    year_part := TO_CHAR(NOW(), 'YYYY');
    month_part := TO_CHAR(NOW(), 'MM');
    
    -- Get next sequence for this month
    SELECT COUNT(*) + 1
    INTO seq_num
    FROM public.certificates
    WHERE certificate_number LIKE prefix || '-' || year_part || month_part || '-%'
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Format: SM-202412-0001
    new_number := prefix || '-' || year_part || month_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ADD DESIGN_ID TO CERTIFICATES
-- ============================================================
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS design_id UUID REFERENCES public.certificate_designs(id);

-- ============================================================
-- 6. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificate_designs_category ON public.certificate_designs(category);
CREATE INDEX IF NOT EXISTS idx_certificate_designs_is_default ON public.certificate_designs(is_default);
CREATE INDEX IF NOT EXISTS idx_certificate_designs_is_active ON public.certificate_designs(is_active);

-- ============================================================
-- 7. COMMENTS
-- ============================================================
COMMENT ON TABLE public.certificate_designs IS 'Bảng lưu các mẫu thiết kế chứng chỉ';
COMMENT ON COLUMN public.certificate_designs.design_config IS 'JSON config cho design: colors, fonts, border, decorations';


-- <<< END FILE: 30_certificate_system_complete.sql

-- >>> BEGIN FILE: 30_invoice_module_upgrade.sql
-- ============================================================
-- INVOICE MODULE UPGRADE - Phase 1
-- Version: 1.0
-- Description: Thêm các cột cho payment verification và tracking
-- ============================================================

-- ============================================================
-- 1. UPGRADE PAYMENTS TABLE - Thêm verification columns
-- ============================================================

-- Bank transfer proof (screenshot upload)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS bank_proof_url TEXT;

-- Verification status: pending (bank transfer) | verified | rejected
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';
-- Mặc định 'verified' cho cash, bank_transfer sẽ set 'pending'

-- Who verified
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Rejection reason (if rejected)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for verification_status
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_verification_status_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_verification_status_check 
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- ============================================================
-- FIX: Update existing payments to 'verified' status
-- This ensures backward compatibility with old payments
-- ============================================================
UPDATE public.payments 
SET verification_status = 'verified' 
WHERE verification_status IS NULL;

-- ============================================================
-- 2. UPGRADE INVOICES TABLE - Thêm reminder tracking
-- ============================================================

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- ============================================================
-- 3. CREATE STUDENT WALLET TABLE - Bảo lưu phí
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.student_wallet(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL, -- positive = credit, negative = debit
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'adjustment')),
  reference_id UUID, -- invoice_id hoặc enrollment_id
  reference_type TEXT, -- 'invoice', 'enrollment', 'refund'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ============================================================
-- 4. UPDATE TRIGGER - Chỉ count verified payments
-- ============================================================

CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  invoice_final NUMERIC(12,2);
BEGIN
  -- Chỉ tính những payment đã verified
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id
    AND verification_status = 'verified';
  
  -- Lấy số tiền phải đóng
  SELECT final_amount INTO invoice_final
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật invoice
  UPDATE public.invoices
  SET 
    paid_amount = total_paid,
    status = CASE 
      WHEN total_paid >= invoice_final THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    paid_at = CASE WHEN total_paid >= invoice_final THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật enrollment.paid_amount (nếu có)
  UPDATE public.enrollments
  SET paid_amount = total_paid, updated_at = NOW()
  WHERE id = (SELECT enrollment_id FROM public.invoices WHERE id = NEW.invoice_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cũng trigger khi UPDATE payment (để xử lý verify/reject)
DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment_update ON public.payments;
CREATE TRIGGER trigger_update_invoice_on_payment_update
  AFTER UPDATE OF verification_status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_verification_status 
ON public.payments(verification_status);

CREATE INDEX IF NOT EXISTS idx_payments_payment_method 
ON public.payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_student_wallet_student_id 
ON public.student_wallet(student_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id 
ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_invoices_reminder_sent_at 
ON public.invoices(reminder_sent_at);

-- ============================================================
-- 6. COMMENTS
-- ============================================================

COMMENT ON COLUMN public.payments.bank_proof_url IS 'URL của ảnh chụp màn hình xác nhận chuyển khoản';
COMMENT ON COLUMN public.payments.verification_status IS 'Trạng thái xác minh: pending (chờ xác nhận CK), verified (đã xác nhận), rejected (từ chối)';
COMMENT ON COLUMN public.payments.verified_by IS 'Admin đã xác nhận thanh toán';
COMMENT ON COLUMN public.payments.verified_at IS 'Thời điểm xác nhận';

COMMENT ON TABLE public.student_wallet IS 'Ví học viên để bảo lưu phí khi nghỉ học giữa chừng';
COMMENT ON TABLE public.wallet_transactions IS 'Lịch sử giao dịch ví học viên';

-- ============================================================
-- 7. RECALCULATE ALL INVOICE PAID_AMOUNT
-- Run this ONCE after migration to fix any inconsistencies
-- ============================================================

-- Recalculate paid_amount for all invoices based on verified payments
UPDATE public.invoices i
SET 
  paid_amount = COALESCE((
    SELECT SUM(p.amount)
    FROM public.payments p
    WHERE p.invoice_id = i.id
      AND p.verification_status = 'verified'
  ), 0),
  status = CASE 
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) >= i.final_amount THEN 'paid'
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  paid_at = CASE 
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) >= i.final_amount THEN NOW()
    ELSE NULL
  END,
  updated_at = NOW()
WHERE i.status != 'cancelled';

-- ============================================================
-- DONE! Invoice module upgraded successfully
-- ============================================================


-- <<< END FILE: 30_invoice_module_upgrade.sql

-- >>> BEGIN FILE: 31_courses_public_enhancement.sql
-- ============================================================
-- MIGRATION: Courses Page Enhancement
-- Version: 31
-- Date: 2025-12-24
-- Description: Add columns for public course display and consultation requests
-- ============================================================

-- ============================================================
-- PART 1: ENHANCE COURSES TABLE FOR PUBLIC DISPLAY
-- ============================================================

-- Add slug for SEO-friendly URLs
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add syllabus (curriculum timeline)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]'::jsonb;

-- Add features (key selling points)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Add outcomes (what students will learn)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '[]'::jsonb;

-- Add FAQ
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- Add target audience description
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Add prerequisites
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS prerequisites TEXT;

-- Generate slugs from course codes for existing courses
UPDATE public.courses 
SET slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE slug IS NULL;

-- Comments for documentation
COMMENT ON COLUMN public.courses.slug IS 'URL-friendly identifier, e.g., "ielts-academic"';
COMMENT ON COLUMN public.courses.syllabus IS 'Array of {week, title, topics[]} for curriculum display';
COMMENT ON COLUMN public.courses.features IS 'Array of feature strings, e.g., ["Giáo viên 8.0+", "Cam kết đầu ra"]';
COMMENT ON COLUMN public.courses.outcomes IS 'Array of learning outcomes';
COMMENT ON COLUMN public.courses.faq IS 'Array of {question, answer} pairs';
COMMENT ON COLUMN public.courses.target_audience IS 'Description of who should take this course';
COMMENT ON COLUMN public.courses.prerequisites IS 'Prerequisites for taking the course';

-- ============================================================
-- PART 2: CREATE CONSULTATION REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Interest
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  
  -- Availability for callback
  preferred_time TEXT, -- e.g., "Sáng T2-T4" or "Chiều T3-T5"
  notes TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'enrolled', 'cancelled')),
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  follow_up_date DATE,
  
  -- Source tracking
  source TEXT DEFAULT 'website', -- website, facebook, zalo, referral, etc.
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Metadata
  center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.consultation_requests IS 'Lead capture for course consultations before formal enrollment';
COMMENT ON COLUMN public.consultation_requests.status IS 'new: Chưa liên hệ, contacted: Đã liên hệ, scheduled: Đã hẹn lịch, enrolled: Đã đăng ký, cancelled: Hủy';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_course_id ON public.consultation_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_center_id ON public.consultation_requests(center_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON public.consultation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_assigned_to ON public.consultation_requests(assigned_to);

-- ============================================================
-- PART 3: RLS POLICIES FOR CONSULTATION REQUESTS
-- ============================================================

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public form submission)
DROP POLICY IF EXISTS "Anyone can submit consultation request" ON public.consultation_requests;
CREATE POLICY "Anyone can submit consultation request"
ON public.consultation_requests FOR INSERT
WITH CHECK (true);

-- Only staff can SELECT
DROP POLICY IF EXISTS "Staff can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can view consultation requests"
ON public.consultation_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  )
);

-- Only staff can UPDATE
DROP POLICY IF EXISTS "Staff can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can update consultation requests"
ON public.consultation_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  )
);

-- ============================================================
-- PART 4: SEED SAMPLE SYLLABUS DATA FOR EXISTING COURSES
-- ============================================================

-- Update IELTS course with sample syllabus
UPDATE public.courses 
SET 
  syllabus = '[
    {"week": 1, "title": "Giới thiệu IELTS", "topics": ["Tổng quan về kỳ thi", "Đánh giá đầu vào", "Lập kế hoạch học tập"]},
    {"week": 2, "title": "Listening Skills", "topics": ["Note-taking strategies", "Prediction techniques", "Multiple choice tactics"]},
    {"week": 3, "title": "Reading Strategies", "topics": ["Skimming & Scanning", "Matching headings", "True/False/Not Given"]},
    {"week": 4, "title": "Writing Task 1", "topics": ["Graph description", "Data comparison", "Trend analysis"]},
    {"week": 5, "title": "Writing Task 2", "topics": ["Essay structures", "Argument development", "Conclusion writing"]},
    {"week": 6, "title": "Speaking Part 1-2", "topics": ["Personal topics", "Cue card techniques", "Fluency practice"]},
    {"week": 7, "title": "Speaking Part 3", "topics": ["Discussion skills", "Opinion expression", "Abstract topics"]},
    {"week": 8, "title": "Mock Test & Review", "topics": ["Full practice test", "Error analysis", "Score prediction"]}
  ]'::jsonb,
  features = '["Giáo viên IELTS 8.0+", "Cam kết đầu ra rõ ràng", "Chấm Writing miễn phí không giới hạn", "Thi thử hàng tuần", "Phòng tự học 24/7", "Tài liệu Cambridge chính hãng"]'::jsonb,
  outcomes = '["Nắm vững 4 kỹ năng Nghe - Nói - Đọc - Viết", "Đạt band điểm mục tiêu (cam kết)", "Tự tin giao tiếp tiếng Anh học thuật", "Sẵn sàng cho du học hoặc định cư"]'::jsonb,
  faq = '[
    {"question": "Tôi cần trình độ gì để học khóa này?", "answer": "Khóa học phù hợp với người có nền tảng tiếng Anh từ Pre-Intermediate trở lên (IELTS 4.0-5.0)."},
    {"question": "Có cam kết đầu ra không?", "answer": "Có. Chúng tôi cam kết đầu ra theo band điểm đã thỏa thuận. Nếu không đạt, bạn được học lại miễn phí."},
    {"question": "Có được hoàn tiền nếu không hài lòng?", "answer": "Bạn có thể yêu cầu hoàn tiền trong 7 ngày đầu tiên nếu cảm thấy không phù hợp."},
    {"question": "Một lớp có bao nhiêu học viên?", "answer": "Mỗi lớp từ 8-12 học viên để đảm bảo chất lượng tương tác."}
  ]'::jsonb,
  target_audience = 'Học viên muốn du học, định cư hoặc cần chứng chỉ IELTS cho công việc',
  prerequisites = 'Tiếng Anh Pre-Intermediate (IELTS 4.0-5.0) hoặc tương đương'
WHERE category = 'english' AND (title ILIKE '%IELTS%' OR code ILIKE '%IELTS%');

-- Update IT/Office courses with sample data
UPDATE public.courses 
SET 
  syllabus = '[
    {"week": 1, "title": "Microsoft Word", "topics": ["Giao diện và thao tác cơ bản", "Định dạng văn bản", "Tạo bảng và danh sách"]},
    {"week": 2, "title": "Microsoft Word Nâng cao", "topics": ["Mail Merge", "Header/Footer", "Table of Contents"]},
    {"week": 3, "title": "Microsoft Excel", "topics": ["Công thức cơ bản", "Hàm thông dụng", "Biểu đồ"]},
    {"week": 4, "title": "Microsoft Excel Nâng cao", "topics": ["VLOOKUP/HLOOKUP", "Pivot Table", "Data Validation"]},
    {"week": 5, "title": "Microsoft PowerPoint", "topics": ["Thiết kế slide", "Animation", "Master Slide"]},
    {"week": 6, "title": "Thi thử và Ôn tập", "topics": ["Làm đề thi mẫu", "Chữa bài", "Tips thi MOS"]}
  ]'::jsonb,
  features = '["Chứng chỉ MOS quốc tế", "Thực hành 70% thời lượng", "Học 1 kèm 1 hoặc nhóm nhỏ", "Giáo trình Microsoft chính hãng", "Hỗ trợ đăng ký thi tại trung tâm"]'::jsonb,
  outcomes = '["Sử dụng thành thạo Word, Excel, PowerPoint", "Đạt chứng chỉ MOS quốc tế", "Tăng hiệu suất công việc văn phòng", "CV ấn tượng hơn với chứng chỉ quốc tế"]'::jsonb,
  faq = '[
    {"question": "Chứng chỉ MOS có giá trị như thế nào?", "answer": "MOS là chứng chỉ được Microsoft công nhận toàn cầu, có giá trị vĩnh viễn và được nhiều nhà tuyển dụng đánh giá cao."},
    {"question": "Tôi chưa biết gì về máy tính, có học được không?", "answer": "Hoàn toàn được! Khóa học bắt đầu từ cơ bản, phù hợp với mọi trình độ."},
    {"question": "Lệ phí thi chứng chỉ có bao gồm trong học phí không?", "answer": "Lệ phí thi MOS không bao gồm trong học phí. Chi phí thi khoảng 1.200.000đ/môn."}
  ]'::jsonb,
  target_audience = 'Sinh viên, nhân viên văn phòng cần chứng chỉ tin học',
  prerequisites = 'Biết sử dụng máy tính cơ bản'
WHERE category = 'it' OR category = 'office' OR title ILIKE '%MOS%' OR title ILIKE '%Office%' OR title ILIKE '%Excel%';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check courses have new columns
SELECT 
  code, 
  title, 
  slug,
  jsonb_array_length(syllabus) AS syllabus_items,
  jsonb_array_length(features) AS features_count,
  jsonb_array_length(faq) AS faq_count
FROM public.courses 
LIMIT 10;

-- Check consultation_requests table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND table_schema = 'public';

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 31_courses_public_enhancement.sql

-- >>> BEGIN FILE: 32_seed_remaining_courses_data.sql
-- ============================================================
-- MIGRATION: Seed Remaining Courses Data
-- Version: 32
-- Date: 2025-12-24
-- Description: Populate features, syllabus, outcomes for TOEIC, Programming, Communication
-- ============================================================

-- 1. Update TOEIC Courses
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Foundation & Vocabulary", "topics": ["Assessment Test", "Essential Business Vocabulary", "Grammar Refresh"]},
    {"week": 2, "title": "Listening Part 1 & 2", "topics": ["Photographs", "Question-Response", "Distractor Traps"]},
    {"week": 3, "title": "Listening Part 3 & 4", "topics": ["Conversations", "Talks", "Keyword Spotting"]},
    {"week": 4, "title": "Reading Part 5 & 6", "topics": ["Incomplete Sentences", "Text Completion", "Time Management"]},
    {"week": 5, "title": "Reading Part 7 & Review", "topics": ["Reading Comprehension", "Double/Triple Passages", "Speed Reading"]}
  ]'::jsonb,
  features = '["Giáo trình ETS 2024 mới nhất", "Cam kết tăng 150-200 điểm", "Thi thử trên máy tính như thật", "Hỗ trợ lệ phí thi tại IIG", "Lớp học tối đa 15 học viên"]'::jsonb,
  outcomes = '["Nắm vững cấu trúc bài thi TOEIC 2 kỹ năng", "Thành thạo 3000+ từ vựng Business English", "Kỹ năng nghe hiểu giọng Anh-Mỹ-Úc-Canada", "Đạt chuẩn đầu ra tốt nghiệp hoặc đi làm"]'::jsonb,
  faq = '[
    {"question": "Khóa học kéo dài bao lâu?", "answer": "Khóa học thường kéo dài 2-3 tháng tùy theo trình độ đầu vào."},
    {"question": "Học phí đã bao gồm giáo trình chưa?", "answer": "Học phí đã bao gồm toàn bộ giáo trình và tài liệu bổ trợ."},
    {"question": "Nếu thi không đạt thì sao?", "answer": "Học viên được học lại miễn phí nếu đi học đầy đủ và làm bài tập đúng quy định."}
  ]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (title ILIKE '%TOEIC%' OR code ILIKE '%TOEIC%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 2. Update Programming/IT Courses (Web, Java, Python)
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Programming Basics", "topics": ["Variables & Data Types", "Control Structures", "Functions", "Basic Algorithms"]},
    {"week": 2, "title": "Object-Oriented Programming", "topics": ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation"]},
    {"week": 3, "title": "Data Structures", "topics": ["Arrays & Lists", "Dictionaries/Maps", "Stacks & Queues", "Trees Basics"]},
    {"week": 4, "title": "Database Integration", "topics": ["SQL Basics", "CRUD Operations", "ORM Frameworks", "Database Design"]},
    {"week": 5, "title": "Project Development", "topics": ["Requirements Analysis", "System Design", "Coding Standards", "Version Control (Git)"]},
    {"week": 6, "title": "Final Project & Deployment", "topics": ["Testing & Debugging", "Deployment Strategies", "Project Presentation", "Code Review"]}
  ]'::jsonb,
  features = '["Dự án thực tế 100%", "Giảng viên Senior Developer", "Cam kết giới thiệu việc làm", "Code review 1:1 hàng tuần", "Chứng chỉ hoàn thành khóa học"]'::jsonb,
  outcomes = '["Tư duy lập trình vững chắc", "Xây dựng được ứng dụng hoàn chỉnh", "Kỹ năng làm việc nhóm (Agile/Scrum)", "Sẵn sàng cho vị trí Fresher/Junior"]'::jsonb,
  faq = '[
    {"question": "Tôi chưa biết gì về code có học được không?", "answer": "Được. Khóa học thiết kế cho người mới bắt đầu từ con số 0."},
    {"question": "Cần máy tính cấu hình cao không?", "answer": "Chỉ cần laptop i5, RAM 8GB là đủ để học lập trình cơ bản."},
    {"question": "Học xong có xin được việc không?", "answer": "Trung tâm cam kết hỗ trợ CV và kết nối với mạng lưới doanh nghiệp đối tác."}
  ]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'programming' OR title ILIKE '%Java%' OR title ILIKE '%Python%' OR title ILIKE '%Web%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 3. Update English Communication Courses
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Introduction & Greetings", "topics": ["Self-introduction", "Small talk", "Cultural etiquette"]},
    {"week": 2, "title": "Daily Routines", "topics": ["Time & Schedules", "Hobbies & Interests", "Describe Habit"]},
    {"week": 3, "title": "Travel & Directions", "topics": ["Asking directions", "Booking hotels", "At the airport"]},
    {"week": 4, "title": "Shopping & Dining", "topics": ["Ordering food", "Bargaining", "Complaints"]},
    {"week": 5, "title": "Workplace Communication", "topics": ["Phone etiquette", "Writing emails", "Participating in meetings"]}
  ]'::jsonb,
  features = '["100% Giáo viên nước ngoài/IELTS 8.0", "Lớp học ít người (6-10 HV)", "Phương pháp phản xạ Callan", "Câu lạc bộ tiếng Anh hàng tuần", "Giờ học linh hoạt"]'::jsonb,
  outcomes = '["Tự tin giao tiếp với người nước ngoài", "Phát âm chuẩn IPA", "Vốn từ vựng thông dụng phong phú", "Phản xạ nghe lại tự nhiên"]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'communication' OR title ILIKE '%Communication%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 4. Catch-all for any remaining IELTS courses (like IELTS-01 with category 'IELTS')
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "IELTS Overview", "topics": ["Exam Structure", "Scoring Criteria", "Study Plan"]},
    {"week": 2, "title": "Listening & Reading Basics", "topics": ["Question Types", "Keyword Strategy", "Speed Reading"]},
    {"week": 3, "title": "Speaking Confidence", "topics": ["Part 1 Familiar Topics", "Fluency & Coherence", "Pronunciation"]},
    {"week": 4, "title": "Writing Task 1", "topics": ["Chart Analysis", "Describing Trends", "Comparing Data"]},
    {"week": 5, "title": "Writing Task 2", "topics": ["Essay Structure", "Idea Generation", "Cohesion & Coherence"]}
  ]'::jsonb,
  features = '["Giáo viên IELTS 8.0+", "Cam kết đầu ra bằng văn bản", "Chấm bài Writing chi tiết", "Thi thử Mock Test hàng tháng", "Tài liệu độc quyền"]'::jsonb,
  outcomes = '["Nắm vững chiến thuật làm bài", "Cải thiện toàn diện 4 kỹ năng", "Tự tin bước vào kỳ thi thật", "Đạt band điểm mục tiêu"]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'IELTS' OR title ILIKE '%IELTS%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 5. Fix any duplicate slugs if generated
-- This is a simple safety check, in production we might need smarter deduping
-- For now, we assume unique codes produce unique slugs


-- <<< END FILE: 32_seed_remaining_courses_data.sql

-- >>> BEGIN FILE: 33_blog_comments.sql
-- =============================================
-- BLOG COMMENTS SYSTEM
-- Migration: 33_blog_comments.sql
-- =============================================

-- 1. CREATE BLOG COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Post identification (using slug as reference)
    post_slug TEXT NOT NULL,
    
    -- Author (can be null for anonymous, or reference logged-in user)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- For nested comments (replies)
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE COMMENT LIKES TABLE (for tracking who liked what)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate likes
    UNIQUE(comment_id, user_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_slug ON blog_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment ON blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user ON blog_comment_likes(user_id);

-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR COMMENTS
-- =============================================

-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
ON blog_comments FOR SELECT
USING (is_approved = TRUE);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON blog_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON blog_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can do anything
CREATE POLICY "Admins can manage all comments"
ON blog_comments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
);

-- 6. RLS POLICIES FOR LIKES
-- =============================================

-- Anyone can read likes
CREATE POLICY "Anyone can read likes"
ON blog_comment_likes FOR SELECT
USING (TRUE);

-- Authenticated users can like
CREATE POLICY "Authenticated users can like"
ON blog_comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their like)
CREATE POLICY "Users can unlike"
ON blog_comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. TRIGGER TO UPDATE likes_count
-- =============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_comments
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON blog_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- 8. TRIGGER TO UPDATE updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_updated_at
BEFORE UPDATE ON blog_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_updated_at();

-- 9. SEED SOME SAMPLE COMMENTS (optional)
-- =============================================
-- Note: Run this only if you want demo data
-- These will be tied to specific post slugs

/*
INSERT INTO blog_comments (post_slug, user_id, content, likes_count, created_at)
SELECT 
    'lo-trinh-tu-hoc-ielts-5-len-7',
    (SELECT id FROM users WHERE email = 'admin@skillmaster.edu.vn' LIMIT 1),
    'Bài viết rất chi tiết và hữu ích! Mình đang học IELTS theo lộ trình này.',
    15,
    NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@skillmaster.edu.vn');
*/

-- 10. GRANT PERMISSIONS
-- =============================================
GRANT SELECT ON blog_comments TO anon;
GRANT ALL ON blog_comments TO authenticated;
GRANT SELECT ON blog_comment_likes TO anon;
GRANT ALL ON blog_comment_likes TO authenticated;

-- =============================================
-- DONE! Run this migration in Supabase Dashboard
-- SQL Editor → New query → Paste & Run
-- =============================================


-- <<< END FILE: 33_blog_comments.sql

-- >>> BEGIN FILE: 34_blog_enhancements.sql
-- =============================================
-- BLOG ENHANCEMENTS
-- Migration: 34_blog_enhancements.sql
-- =============================================

-- 1. CREATE COMMENT REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_comment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE ARTICLE REACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- 'like', 'love', 'fire', 'clap', 'bulb'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reactions per user per post (or allow multiple types?)
    -- Let's say one user can give multiple reactions but only one of each type
    UNIQUE(post_slug, user_id, reaction_type)
);

-- 3. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_blog_reports_comment ON blog_comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_slug ON blog_article_reactions(post_slug);

-- 4. RLS POLICIES
-- =============================================
ALTER TABLE blog_comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_article_reactions ENABLE ROW LEVEL SECURITY;

-- Reports: Authenticated users can insert
CREATE POLICY "Users can report comments"
ON blog_comment_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can manage reports
CREATE POLICY "Admins can manage reports"
ON blog_comment_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
);

-- Reactions: Anyone can see
CREATE POLICY "Anyone can see reactions"
ON blog_article_reactions FOR SELECT
USING (TRUE);

-- Authenticated can react
CREATE POLICY "Users can react to articles"
ON blog_article_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their reaction
CREATE POLICY "Users can remove own reaction"
ON blog_article_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. PERMISSIONS
-- =============================================
GRANT SELECT, INSERT ON blog_comment_reports TO authenticated;
GRANT ALL ON blog_comment_reports TO authenticated; -- For admins

GRANT SELECT ON blog_article_reactions TO anon;
GRANT ALL ON blog_article_reactions TO authenticated;


-- <<< END FILE: 34_blog_enhancements.sql

-- >>> BEGIN FILE: 35_blog_stats_newsletter.sql
-- ============================================
-- BLOG VIEW STATS & NEWSLETTER SUBSCRIBERS
-- Migration: 35_blog_stats_newsletter.sql
-- ============================================

-- View Counter Table
CREATE TABLE IF NOT EXISTS blog_post_stats (
    slug TEXT PRIMARY KEY,
    view_count INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_post_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for displaying counts)
CREATE POLICY "Anyone can read view stats"
    ON blog_post_stats FOR SELECT
    USING (true);

-- Only authenticated users can insert/update (to prevent abuse)
CREATE POLICY "Authenticated can update views"
    ON blog_post_stats FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated can increment views"
    ON blog_post_stats FOR UPDATE
    USING (true);

-- Function to increment view count (upsert)
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO blog_post_stats (slug, view_count, last_viewed_at)
    VALUES (post_slug, 1, NOW())
    ON CONFLICT (slug)
    DO UPDATE SET 
        view_count = blog_post_stats.view_count + 1,
        last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT DEFAULT 'blog', -- Where they subscribed from
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    unsubscribed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

-- Only admins can read all
CREATE POLICY "Admins can manage subscribers"
    ON newsletter_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code = 'SUPER_ADMIN'
        )
    );

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_stats_slug ON blog_post_stats(slug);


-- <<< END FILE: 35_blog_stats_newsletter.sql

-- >>> BEGIN FILE: 36_assessment_system.sql
-- ============================================
-- Migration: Assessment/Placement Test System
-- Author: Skill Master Team
-- Date: 2024-12-26
-- Description: Tables for online placement tests
-- ============================================

-- ============================================
-- 1. ASSESSMENT TESTS (Test categories)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ielts', 'toeic', 'office', 'general')),
    description TEXT,
    short_description VARCHAR(255),
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    duration_minutes INT DEFAULT 30,
    total_questions INT DEFAULT 30,
    passing_percentage INT DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    attempts_allowed INT DEFAULT 1, -- NULL = unlimited
    cooldown_hours INT DEFAULT 24, -- Hours between attempts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ASSESSMENT QUESTIONS (Question bank)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'single' CHECK (question_type IN ('single', 'multiple', 'fill', 'true_false')),
    options JSONB NOT NULL DEFAULT '[]', -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer JSONB NOT NULL, -- ["A"] for single, ["A", "C"] for multiple
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5), -- 1=Easy, 5=Hard
    skill_area VARCHAR(50), -- 'listening', 'reading', 'grammar', 'vocabulary'
    points INT DEFAULT 1,
    explanation TEXT, -- Shown after completion
    media_url TEXT, -- Audio/Image URL if needed
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ASSESSMENT ATTEMPTS (User submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guests
    
    -- Guest info (if not logged in)
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    
    -- Test session
    questions_order JSONB, -- Randomized question IDs for this attempt
    answers JSONB DEFAULT '{}', -- {question_id: "selected_answer"}
    
    -- Scoring
    score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    result_level VARCHAR(20), -- 'A1', 'A2', 'B1', 'B2', 'C1'
    result_level_name VARCHAR(100),
    
    -- Timing
    time_limit_seconds INT,
    time_spent_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    browser_fingerprint VARCHAR(255),
    tab_switches INT DEFAULT 0, -- Anti-cheat: count focus losses
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ASSESSMENT RESULTS MAPPING (Score → Level)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_results_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    min_percentage INT NOT NULL,
    max_percentage INT NOT NULL,
    level_code VARCHAR(20) NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
    level_name VARCHAR(100) NOT NULL, -- 'Sơ cấp', 'Trung cấp', etc.
    description TEXT,
    recommended_courses JSONB DEFAULT '[]', -- [course_id1, course_id2]
    display_color VARCHAR(20) DEFAULT '#3b82f6', -- For UI badge
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assessment_questions_test_id ON public.assessment_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_difficulty ON public.assessment_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_test_id ON public.assessment_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_guest_email ON public.assessment_attempts(guest_email);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_results_mapping_test_id ON public.assessment_results_mapping(test_id);

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.assessment_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results_mapping ENABLE ROW LEVEL SECURITY;

-- Tests: Anyone can read active tests
CREATE POLICY "Anyone can view active tests"
    ON public.assessment_tests FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage tests"
    ON public.assessment_tests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- Questions: Only show during active attempt (prevent pre-fetching)
CREATE POLICY "Anyone can view questions for attempts"
    ON public.assessment_questions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage questions"
    ON public.assessment_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- Attempts: Users can manage their own attempts
CREATE POLICY "Anyone can create attempts"
    ON public.assessment_attempts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own attempts"
    ON public.assessment_attempts FOR SELECT
    USING (
        user_id = auth.uid() 
        OR guest_email IS NOT NULL -- Guests can view by attempt ID
    );

CREATE POLICY "Users can update own in-progress attempts"
    ON public.assessment_attempts FOR UPDATE
    USING (
        (user_id = auth.uid() OR user_id IS NULL)
        AND status = 'in_progress'
    );

CREATE POLICY "Admins can view all attempts"
    ON public.assessment_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Results mapping: Anyone can read
CREATE POLICY "Anyone can view results mapping"
    ON public.assessment_results_mapping FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage results mapping"
    ON public.assessment_results_mapping FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to start a new attempt with randomized questions
CREATE OR REPLACE FUNCTION public.start_assessment_attempt(
    p_test_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_guest_email VARCHAR DEFAULT NULL,
    p_guest_name VARCHAR DEFAULT NULL,
    p_guest_phone VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_test RECORD;
    v_questions_order JSONB;
    v_existing_attempt RECORD;
BEGIN
    -- Get test info
    SELECT * INTO v_test FROM public.assessment_tests WHERE id = p_test_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test not found or inactive';
    END IF;
    
    -- Check for existing in-progress attempt
    SELECT * INTO v_existing_attempt 
    FROM public.assessment_attempts 
    WHERE test_id = p_test_id 
      AND status = 'in_progress'
      AND (
          (p_user_id IS NOT NULL AND user_id = p_user_id)
          OR (p_guest_email IS NOT NULL AND guest_email = p_guest_email)
      );
    
    IF FOUND THEN
        -- Return existing attempt
        RETURN v_existing_attempt.id;
    END IF;
    
    -- Check cooldown for completed attempts
    IF v_test.cooldown_hours IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.assessment_attempts
            WHERE test_id = p_test_id
              AND status = 'completed'
              AND completed_at > NOW() - (v_test.cooldown_hours || ' hours')::INTERVAL
              AND (
                  (p_user_id IS NOT NULL AND user_id = p_user_id)
                  OR (p_guest_email IS NOT NULL AND guest_email = p_guest_email)
              )
        ) THEN
            RAISE EXCEPTION 'Please wait before attempting this test again';
        END IF;
    END IF;
    
    -- Get randomized questions
    SELECT jsonb_agg(id ORDER BY RANDOM()) INTO v_questions_order
    FROM (
        SELECT id FROM public.assessment_questions
        WHERE test_id = p_test_id AND is_active = true
        LIMIT v_test.total_questions
    ) q;
    
    -- Create attempt
    INSERT INTO public.assessment_attempts (
        test_id, user_id, guest_email, guest_name, guest_phone,
        questions_order, time_limit_seconds, max_score
    ) VALUES (
        p_test_id, p_user_id, p_guest_email, p_guest_name, p_guest_phone,
        v_questions_order, v_test.duration_minutes * 60, v_test.total_questions
    ) RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

-- Function to submit an attempt and calculate score
CREATE OR REPLACE FUNCTION public.submit_assessment_attempt(
    p_attempt_id UUID,
    p_answers JSONB,
    p_time_spent INT DEFAULT 0,
    p_tab_switches INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt RECORD;
    v_question RECORD;
    v_score INT := 0;
    v_max_score INT := 0;
    v_percentage DECIMAL(5,2);
    v_result RECORD;
    v_answer_key TEXT;
    v_user_answer JSONB;
BEGIN
    -- Get attempt
    SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found';
    END IF;
    
    IF v_attempt.status != 'in_progress' THEN
        RAISE EXCEPTION 'Attempt already completed';
    END IF;
    
    -- Calculate score
    FOR v_question IN 
        SELECT q.* FROM public.assessment_questions q
        WHERE q.id = ANY(SELECT jsonb_array_elements_text(v_attempt.questions_order)::UUID)
    LOOP
        v_max_score := v_max_score + v_question.points;
        v_answer_key := v_question.id::TEXT;
        
        IF p_answers ? v_answer_key THEN
            v_user_answer := p_answers -> v_answer_key;
            -- Compare answers (supports both single and multiple choice)
            IF v_user_answer = v_question.correct_answer THEN
                v_score := v_score + v_question.points;
            END IF;
        END IF;
    END LOOP;
    
    -- Calculate percentage
    IF v_max_score > 0 THEN
        v_percentage := ROUND((v_score::DECIMAL / v_max_score) * 100, 2);
    ELSE
        v_percentage := 0;
    END IF;
    
    -- Get result level
    SELECT * INTO v_result 
    FROM public.assessment_results_mapping
    WHERE test_id = v_attempt.test_id
      AND v_percentage >= min_percentage
      AND v_percentage <= max_percentage
    LIMIT 1;
    
    -- Update attempt
    UPDATE public.assessment_attempts
    SET 
        answers = p_answers,
        score = v_score,
        max_score = v_max_score,
        percentage = v_percentage,
        result_level = COALESCE(v_result.level_code, 'A1'),
        result_level_name = COALESCE(v_result.level_name, 'Sơ cấp'),
        time_spent_seconds = p_time_spent,
        tab_switches = p_tab_switches,
        status = 'completed',
        completed_at = NOW()
    WHERE id = p_attempt_id;
    
    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'score', v_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'level_code', COALESCE(v_result.level_code, 'A1'),
        'level_name', COALESCE(v_result.level_name, 'Sơ cấp'),
        'description', v_result.description,
        'recommended_courses', COALESCE(v_result.recommended_courses, '[]'::JSONB)
    );
END;
$$;

-- ============================================
-- 8. SEED DATA - Sample Tests
-- ============================================

-- Insert sample tests
INSERT INTO public.assessment_tests (title, slug, category, description, short_description, icon_name, duration_minutes, total_questions, is_featured) VALUES
('Kiểm tra trình độ IELTS', 'ielts-placement', 'ielts', 
 'Bài test đánh giá năng lực tiếng Anh theo chuẩn IELTS. Kết quả sẽ giúp bạn biết trình độ hiện tại và lộ trình học phù hợp.',
 'Đánh giá trình độ theo chuẩn IELTS', 'Globe', 30, 30, true),

('Kiểm tra trình độ TOEIC', 'toeic-placement', 'toeic',
 'Bài test đánh giá năng lực tiếng Anh giao tiếp theo chuẩn TOEIC. Phù hợp cho người đi làm và sinh viên.',
 'Đánh giá trình độ theo chuẩn TOEIC', 'Briefcase', 25, 25, true),

('Kiểm tra trình độ Tin học', 'office-placement', 'office',
 'Bài test đánh giá kỹ năng tin học văn phòng cơ bản: Word, Excel, PowerPoint.',
 'Đánh giá kỹ năng tin học văn phòng', 'Monitor', 20, 20, false);

-- Insert CEFR-based results mapping for IELTS
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color) 
SELECT id, 0, 20, 'A1', 'Sơ cấp (Beginner)', 'Bạn đang ở mức bắt đầu. Khóa học Foundation sẽ giúp bạn xây dựng nền tảng vững chắc.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 21, 40, 'A2', 'Tiền trung cấp', 'Bạn có kiến thức cơ bản. Khóa học Pre-Intermediate sẽ giúp bạn nâng cao kỹ năng.', '#10b981'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 41, 60, 'B1', 'Trung cấp (Intermediate)', 'Trình độ khá tốt! Bạn sẵn sàng cho khóa IELTS 5.0-6.0.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 61, 80, 'B2', 'Trung cấp cao', 'Xuất sắc! Bạn có thể tham gia khóa IELTS 6.0-7.0.', '#8b5cf6'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 81, 100, 'C1', 'Nâng cao (Advanced)', 'Tuyệt vời! Bạn sẵn sàng cho mục tiêu IELTS 7.0+.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'ielts-placement';

-- Insert results mapping for TOEIC
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color)
SELECT id, 0, 20, 'A1', 'Dưới 300 điểm', 'Bạn cần học từ nền tảng. Khóa TOEIC Starter phù hợp với bạn.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 21, 40, 'A2', '300-450 điểm', 'Bạn có kiến thức cơ bản. Khóa TOEIC 450+ sẽ giúp bạn.', '#10b981'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 41, 60, 'B1', '450-600 điểm', 'Khá tốt! Bạn sẵn sàng cho khóa TOEIC 600+.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 61, 80, 'B2', '600-750 điểm', 'Xuất sắc! Hãy thử sức với khóa TOEIC 750+.', '#8b5cf6'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 81, 100, 'C1', 'Trên 750 điểm', 'Tuyệt vời! Bạn có thể nhắm đến TOEIC 900+.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'toeic-placement';

-- Insert results mapping for Office
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color)
SELECT id, 0, 40, 'Basic', 'Cơ bản', 'Bạn cần học thêm các kỹ năng cơ bản. Khóa Tin học Văn phòng Cơ bản phù hợp.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'office-placement'
UNION ALL
SELECT id, 41, 70, 'Intermediate', 'Trung bình', 'Bạn đã có nền tảng tốt. Khóa Excel Nâng cao sẽ giúp bạn thăng tiến.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'office-placement'
UNION ALL
SELECT id, 71, 100, 'Advanced', 'Thành thạo', 'Tuyệt vời! Bạn có thể tham gia khóa IC3 hoặc MOS.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'office-placement';

-- ============================================
-- 9. SAMPLE QUESTIONS (IELTS - Grammar/Vocabulary)
-- ============================================

-- Get IELTS test ID
DO $$
DECLARE
    v_ielts_id UUID;
BEGIN
    SELECT id INTO v_ielts_id FROM public.assessment_tests WHERE slug = 'ielts-placement';
    
    -- Easy questions (difficulty 1-2)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'She _____ to school every day.', '["goes", "go", "going", "went"]', '["goes"]', 1, 'grammar', 1),
    (v_ielts_id, 'What is the opposite of "hot"?', '["warm", "cold", "cool", "ice"]', '["cold"]', 1, 'vocabulary', 2),
    (v_ielts_id, 'I _____ a student.', '["am", "is", "are", "be"]', '["am"]', 1, 'grammar', 3),
    (v_ielts_id, 'Choose the correct plural: One child, two _____', '["childs", "children", "childes", "child"]', '["children"]', 1, 'grammar', 4),
    (v_ielts_id, 'The book is _____ the table.', '["in", "on", "at", "to"]', '["on"]', 1, 'grammar', 5),
    (v_ielts_id, 'What color is the sky on a clear day?', '["green", "blue", "red", "yellow"]', '["blue"]', 1, 'vocabulary', 6);
    
    -- Medium questions (difficulty 3)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'If I _____ rich, I would travel the world.', '["am", "was", "were", "be"]', '["were"]', 3, 'grammar', 7),
    (v_ielts_id, 'The meeting has been _____ to next Monday.', '["postponed", "delayed", "cancelled", "arranged"]', '["postponed"]', 3, 'vocabulary', 8),
    (v_ielts_id, 'She asked me where I _____.', '["live", "lived", "living", "lives"]', '["lived"]', 3, 'grammar', 9),
    (v_ielts_id, 'Despite _____ hard, he failed the exam.', '["study", "studied", "studying", "studies"]', '["studying"]', 3, 'grammar', 10),
    (v_ielts_id, 'The word "ubiquitous" means:', '["rare", "everywhere", "unique", "beautiful"]', '["everywhere"]', 3, 'vocabulary', 11),
    (v_ielts_id, 'By the time we arrived, the movie _____.', '["started", "has started", "had started", "was starting"]', '["had started"]', 3, 'grammar', 12);
    
    -- Hard questions (difficulty 4-5)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'The data _____ collected over a period of five years.', '["was", "were", "has been", "have been"]', '["were"]', 4, 'grammar', 13),
    (v_ielts_id, 'Not until the 1960s _____ to enter the workforce in large numbers.', '["women began", "did women begin", "women begin", "began women"]', '["did women begin"]', 5, 'grammar', 14),
    (v_ielts_id, 'The word "ephemeral" is closest in meaning to:', '["permanent", "temporary", "beautiful", "ancient"]', '["temporary"]', 4, 'vocabulary', 15),
    (v_ielts_id, 'Had I known about the traffic, I _____ earlier.', '["would leave", "would have left", "will leave", "left"]', '["would have left"]', 4, 'grammar', 16),
    (v_ielts_id, 'The phenomenon can be attributed to a _____ of factors.', '["myriad", "plenty", "lot", "much"]', '["myriad"]', 5, 'vocabulary', 17),
    (v_ielts_id, 'Seldom _____ such a brilliant performance.', '["I have seen", "have I seen", "I saw", "did I saw"]', '["have I seen"]', 5, 'grammar', 18);
    
    -- More medium questions to reach 30
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'The company is looking _____ new employees.', '["at", "for", "after", "into"]', '["for"]', 2, 'grammar', 19),
    (v_ielts_id, 'I wish I _____ speak French fluently.', '["can", "could", "would", "should"]', '["could"]', 2, 'grammar', 20),
    (v_ielts_id, 'The synonym of "significant" is:', '["small", "important", "simple", "difficult"]', '["important"]', 2, 'vocabulary', 21),
    (v_ielts_id, 'She speaks English very _____.', '["good", "well", "nice", "fine"]', '["well"]', 2, 'grammar', 22),
    (v_ielts_id, 'We _____ here since 2010.', '["live", "lived", "have lived", "are living"]', '["have lived"]', 2, 'grammar', 23),
    (v_ielts_id, 'The antonym of "ancient" is:', '["old", "modern", "historic", "traditional"]', '["modern"]', 2, 'vocabulary', 24),
    (v_ielts_id, 'I am used to _____ early.', '["wake", "waking", "woke", "waken"]', '["waking"]', 3, 'grammar', 25),
    (v_ielts_id, 'The report must _____ by Friday.', '["complete", "completed", "be completed", "completing"]', '["be completed"]', 3, 'grammar', 26),
    (v_ielts_id, 'Neither Tom nor his friends _____ coming to the party.', '["is", "are", "was", "were"]', '["are"]', 3, 'grammar', 27),
    (v_ielts_id, 'The word "meticulous" means:', '["careless", "careful", "quick", "slow"]', '["careful"]', 3, 'vocabulary', 28),
    (v_ielts_id, 'It is high time we _____ action.', '["take", "took", "taken", "taking"]', '["took"]', 4, 'grammar', 29),
    (v_ielts_id, 'Hardly _____ the station when the train left.', '["I reached", "had I reached", "I had reached", "did I reach"]', '["had I reached"]', 4, 'grammar', 30);
END $$;

-- ============================================
-- 10. GRANT PERMISSIONS FOR RPC FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assessment_attempt TO anon, authenticated;


-- <<< END FILE: 36_assessment_system.sql

-- >>> BEGIN FILE: 37_courses_slug.sql
-- ============================================================
-- MIGRATION: Add slug column to courses table
-- Version: 37
-- Description: Thêm cột slug để hỗ trợ SEO-friendly URLs
-- ============================================================

-- 1. Add slug column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Generate slug from existing courses (code -> slug)
UPDATE public.courses 
SET slug = LOWER(REPLACE(REPLACE(code, ' ', '-'), '_', '-'))
WHERE slug IS NULL;

-- 3. Create function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_course_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INT := 0;
BEGIN
    -- Generate base slug from title
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRANSLATE(
                    NEW.title,
                    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
                    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
                ),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
    
    new_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS(SELECT 1 FROM public.courses WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-generate slug on insert
DROP TRIGGER IF EXISTS courses_generate_slug ON public.courses;
CREATE TRIGGER courses_generate_slug
    BEFORE INSERT ON public.courses
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION generate_course_slug();

-- 5. Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- ============================================================
-- DONE: Run this migration in Supabase SQL Editor
-- ============================================================


-- <<< END FILE: 37_courses_slug.sql

-- >>> BEGIN FILE: 38_consultation_leads.sql
-- ============================================
-- CONSULTATION LEADS TABLE
-- Stores contact form submissions from website
-- ============================================

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS public.consultation_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL
);

-- Then add missing columns individually to handle cases where table existed
DO $$ 
BEGIN 
    -- Contact Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='email') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN email TEXT;
    END IF;

    -- Consultation Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='goal') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN goal TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='level') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='time_slot') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN time_slot TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='course') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN course TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='message') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN message TEXT;
    END IF;

    -- Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='source') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN source TEXT DEFAULT 'unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='source_page') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN source_page TEXT DEFAULT 'unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='utm_params') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN utm_params JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Status & Assignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='status') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN status TEXT DEFAULT 'new';
        -- Add constraint only if not present
        IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'consultation_leads' AND column_name = 'status' AND constraint_name = 'consultation_leads_status_check') THEN
            ALTER TABLE public.consultation_leads ADD CONSTRAINT consultation_leads_status_check CHECK (status IN ('new', 'contacted', 'scheduled', 'converted', 'lost'));
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='assigned_to') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='notes') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN notes TEXT;
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='contacted_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN contacted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='converted_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN converted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='updated_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_consultation_leads_status ON public.consultation_leads(status);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_created_at ON public.consultation_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_source ON public.consultation_leads(source);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_assigned_to ON public.consultation_leads(assigned_to);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.consultation_leads ENABLE ROW LEVEL SECURITY;

-- Admin policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all consultation leads') THEN
        CREATE POLICY "Admin can view all consultation leads"
            ON public.consultation_leads FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                    WHERE u.id = auth.uid() 
                    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update consultation leads') THEN
        CREATE POLICY "Admin can update consultation leads"
            ON public.consultation_leads FOR UPDATE TO authenticated
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                    WHERE u.id = auth.uid() 
                    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
                )
            );
    END IF;
END $$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_consultation_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consultation_leads_updated_at ON public.consultation_leads;
CREATE TRIGGER consultation_leads_updated_at
    BEFORE UPDATE ON public.consultation_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_leads_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.consultation_leads IS 'Stores contact form and consultation request submissions from the website';
COMMENT ON COLUMN public.consultation_leads.source IS 'Identifies which form/location the lead came from';
COMMENT ON COLUMN public.consultation_leads.status IS 'Lead lifecycle: new → contacted → scheduled → converted/lost';


-- <<< END FILE: 38_consultation_leads.sql

-- >>> BEGIN FILE: 40_parent_guardian_support.sql
-- ============================================================
-- PARENT/GUARDIAN SUPPORT
-- Date: 2026-01-04
-- Description: Add parent/guardian fields to users table for underage students
-- ============================================================

-- ============================================================
-- 1. ADD PARENT/GUARDIAN COLUMNS TO USERS TABLE
-- ============================================================

DO $$ 
BEGIN
  -- Add parent_name column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_name TEXT;
    COMMENT ON COLUMN public.users.parent_name IS 'Họ tên phụ huynh/người giám hộ';
  END IF;

  -- Add parent_phone column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_phone TEXT;
    COMMENT ON COLUMN public.users.parent_phone IS 'Số điện thoại phụ huynh';
  END IF;

  -- Add parent_email column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_email TEXT;
    COMMENT ON COLUMN public.users.parent_email IS 'Email phụ huynh';
  END IF;

  -- Add parent_relationship column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_relationship'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_relationship TEXT 
      CHECK (parent_relationship IS NULL OR parent_relationship IN ('father', 'mother', 'guardian', 'other'));
    COMMENT ON COLUMN public.users.parent_relationship IS 'Mối quan hệ: father, mother, guardian, other';
  END IF;

  -- Add date_of_birth column if not exists (to determine if underage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
    COMMENT ON COLUMN public.users.date_of_birth IS 'Ngày sinh (để xác định học viên vị thành niên)';
  END IF;

END $$;

-- ============================================================
-- 2. CREATE INDEX FOR PARENT CONTACT LOOKUP
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_parent_phone 
  ON public.users(parent_phone) 
  WHERE parent_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_parent_email 
  ON public.users(parent_email) 
  WHERE parent_email IS NOT NULL;

-- ============================================================
-- 3. HELPER VIEW: UNDERAGE STUDENTS WITH PARENT CONTACT
-- ============================================================

CREATE OR REPLACE VIEW public.students_with_parent_contact AS
SELECT 
  u.id,
  u.full_name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  u.date_of_birth,
  EXTRACT(YEAR FROM AGE(u.date_of_birth)) AS age,
  u.parent_name,
  u.parent_phone,
  u.parent_email,
  u.parent_relationship,
  -- Determine primary contact
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 AND u.parent_phone IS NOT NULL 
      THEN u.parent_phone
    ELSE u.phone
  END AS primary_contact_phone,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 AND u.parent_email IS NOT NULL 
      THEN u.parent_email
    ELSE u.email
  END AS primary_contact_email,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
      THEN true
    ELSE false
  END AS is_underage,
  u.center_id,
  u.status
FROM public.users u
WHERE u.role_id = (SELECT id FROM public.roles WHERE code = 'STUDENT')
  AND u.status = 'active';

COMMENT ON VIEW public.students_with_parent_contact IS 
  'View hiển thị học viên với thông tin liên hệ ưu tiên (parent nếu <18 tuổi)';

-- ============================================================
-- 4. FUNCTION: Get primary contact for notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_primary_contact(
  p_student_id UUID
)
RETURNS TABLE(
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_name IS NOT NULL
        THEN u.parent_name
      ELSE u.full_name
    END AS contact_name,
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_phone IS NOT NULL
        THEN u.parent_phone
      ELSE u.phone
    END AS contact_phone,
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_email IS NOT NULL
        THEN u.parent_email
      ELSE u.email
    END AS contact_email,
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_name IS NOT NULL
        THEN 'parent'
      ELSE 'student'
    END AS contact_type
  FROM public.users u
  WHERE u.id = p_student_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_student_primary_contact IS 
  'Trả về thông tin liên hệ ưu tiên (parent nếu học viên <18 tuổi)';

-- ============================================================
-- 5. UPDATE RLS POLICIES (if needed)
-- ============================================================

-- Allow students to view their own parent data
-- (This will be handled in RLS policies file if needed)

-- ============================================================
-- DONE!
-- ============================================================

-- Test query
SELECT 
  student_name,
  age,
  is_underage,
  parent_name,
  primary_contact_phone
FROM public.students_with_parent_contact
WHERE is_underage = true
LIMIT 5;


-- <<< END FILE: 40_parent_guardian_support.sql

-- >>> BEGIN FILE: 41_trial_enrollment.sql
-- =============================================
-- Migration: Trial Enrollment Support
-- Version: 41
-- Description: Add trial class workflow
-- Author: System
-- Date: 2025-01-XX
-- =============================================

-- ====================
-- 1. ADD ENROLLMENT TYPE
-- ====================

-- Add enrollment_type column to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) DEFAULT 'regular';

-- Add check constraint for enrollment_type
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_enrollment_type_check;

ALTER TABLE enrollments
ADD CONSTRAINT enrollments_enrollment_type_check
CHECK (enrollment_type IN ('trial', 'regular', 'makeup'));

-- Add trial_expires_at for trial tracking
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Add is_trial_converted flag
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS is_trial_converted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN enrollments.enrollment_type IS 'Type of enrollment: trial (trial class), regular (paid enrollment), makeup (makeup class)';
COMMENT ON COLUMN enrollments.trial_expires_at IS 'Trial expiration date (auto-calculated: enrollment date + 3 days)';
COMMENT ON COLUMN enrollments.is_trial_converted IS 'Whether trial was converted to regular enrollment';

-- ====================
-- 2. CREATE INDEX
-- ====================

-- Index for trial enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_trial_type 
ON enrollments(enrollment_type, trial_expires_at) 
WHERE enrollment_type = 'trial';

-- Index for trial conversion tracking
CREATE INDEX IF NOT EXISTS idx_enrollments_trial_converted 
ON enrollments(student_id, is_trial_converted) 
WHERE enrollment_type = 'trial';

-- ====================
-- 3. CREATE VIEW: Active Trials
-- ====================

CREATE OR REPLACE VIEW active_trial_enrollments AS
SELECT 
  e.id,
  e.student_id,
  e.class_id,
  e.enrolled_at,
  e.trial_expires_at,
  e.status,
  e.is_trial_converted,
  u.full_name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  c.name AS class_name,
  c.code AS class_code,
  c.start_date AS class_start_date,
  -- Calculate days remaining
  CASE 
    WHEN e.trial_expires_at > NOW() 
    THEN EXTRACT(DAY FROM e.trial_expires_at - NOW())::INTEGER
    ELSE 0
  END AS days_remaining,
  -- Calculate if expired
  (e.trial_expires_at < NOW()) AS is_expired
FROM enrollments e
JOIN users u ON u.id = e.student_id
JOIN classes c ON c.id = e.class_id
WHERE e.enrollment_type = 'trial'
  AND e.status IN ('active', 'pending')
ORDER BY e.trial_expires_at ASC;

COMMENT ON VIEW active_trial_enrollments IS 'Active trial enrollments with expiration tracking and student/class details';

-- ====================
-- 4. FUNCTION: Convert Trial to Regular
-- ====================

CREATE OR REPLACE FUNCTION convert_trial_to_regular(
  p_enrollment_id UUID,
  p_tuition_fee NUMERIC(10,2),
  p_discount_amount NUMERIC(10,2) DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment enrollments;
  v_result JSON;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  -- Validate enrollment exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  -- Validate enrollment is trial
  IF v_enrollment.enrollment_type != 'trial' THEN
    RAISE EXCEPTION 'Enrollment % is not a trial enrollment', p_enrollment_id;
  END IF;

  -- Validate not already converted
  IF v_enrollment.is_trial_converted THEN
    RAISE EXCEPTION 'Trial enrollment % was already converted', p_enrollment_id;
  END IF;

  -- Update enrollment to regular
  UPDATE enrollments
  SET 
    enrollment_type = 'regular',
    is_trial_converted = TRUE,
    tuition_fee = p_tuition_fee,
    discount_amount = p_discount_amount,
    status = 'active',
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Return success result
  v_result := json_build_object(
    'success', TRUE,
    'enrollment_id', p_enrollment_id,
    'student_id', v_enrollment.student_id,
    'class_id', v_enrollment.class_id,
    'converted_at', NOW(),
    'tuition_fee', p_tuition_fee,
    'discount_amount', p_discount_amount
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION convert_trial_to_regular IS 'Convert trial enrollment to regular paid enrollment with fee details';

-- ====================
-- 5. FUNCTION: Auto-expire Trials
-- ====================

CREATE OR REPLACE FUNCTION auto_expire_trial_enrollments()
RETURNS TABLE(
  expired_count INTEGER,
  expired_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Find expired trial enrollments
  SELECT ARRAY_AGG(id)
  INTO v_expired_ids
  FROM enrollments
  WHERE enrollment_type = 'trial'
    AND status = 'active'
    AND trial_expires_at < NOW()
    AND NOT is_trial_converted;

  -- Get count
  v_count := COALESCE(ARRAY_LENGTH(v_expired_ids, 1), 0);

  -- Update status to 'completed' for expired trials
  IF v_count > 0 THEN
    UPDATE enrollments
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = ANY(v_expired_ids);
  END IF;

  -- Return results
  RETURN QUERY SELECT v_count, v_expired_ids;
END;
$$;

COMMENT ON FUNCTION auto_expire_trial_enrollments IS 'Automatically expire trial enrollments that have passed expiration date';

-- ====================
-- 6. FUNCTION: Get Trial Statistics
-- ====================

CREATE OR REPLACE FUNCTION get_trial_statistics(
  p_center_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT (NOW() - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT NOW()::DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
  v_total_trials INTEGER;
  v_converted INTEGER;
  v_expired INTEGER;
  v_active INTEGER;
  v_conversion_rate NUMERIC(5,2);
BEGIN
  -- Count total trial enrollments
  SELECT COUNT(*)
  INTO v_total_trials
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count converted trials
  SELECT COUNT(*)
  INTO v_converted
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'regular'
    AND e.is_trial_converted = TRUE
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count expired trials
  SELECT COUNT(*)
  INTO v_expired
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.status = 'completed'
    AND NOT e.is_trial_converted
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count active trials
  SELECT COUNT(*)
  INTO v_active
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.status = 'active'
    AND e.trial_expires_at > NOW()
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Calculate conversion rate
  IF v_total_trials > 0 THEN
    v_conversion_rate := ROUND((v_converted::NUMERIC / v_total_trials::NUMERIC) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- Build result JSON
  v_stats := json_build_object(
    'total_trials', v_total_trials,
    'converted', v_converted,
    'expired', v_expired,
    'active', v_active,
    'conversion_rate', v_conversion_rate,
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  );

  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION get_trial_statistics IS 'Get trial enrollment statistics with conversion rate for a date range';

-- ====================
-- 7. TRIGGER: Auto-set Trial Expiration
-- ====================

CREATE OR REPLACE FUNCTION set_trial_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-set trial_expires_at for trial enrollments (3 days from enrollment)
  IF NEW.enrollment_type = 'trial' AND NEW.trial_expires_at IS NULL THEN
    NEW.trial_expires_at := NEW.enrolled_at + INTERVAL '3 days';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_trial_expiration ON enrollments;

-- Create trigger
CREATE TRIGGER trigger_set_trial_expiration
BEFORE INSERT OR UPDATE ON enrollments
FOR EACH ROW
WHEN (NEW.enrollment_type = 'trial')
EXECUTE FUNCTION set_trial_expiration();

COMMENT ON TRIGGER trigger_set_trial_expiration ON enrollments IS 'Auto-set trial_expires_at to 3 days after enrollment for trial enrollments';

-- ====================
-- 8. UPDATE EXISTING DATA
-- ====================

-- Update existing enrollments to 'regular' type (default)
UPDATE enrollments
SET enrollment_type = 'regular'
WHERE enrollment_type IS NULL;

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Show new columns
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
  AND column_name IN ('enrollment_type', 'trial_expires_at', 'is_trial_converted')
ORDER BY ordinal_position;

-- Show check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'enrollments'::regclass
  AND contype = 'c'
  AND conname LIKE '%enrollment_type%';

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'enrollments'
  AND indexname LIKE '%trial%';

-- Show functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%trial%'
ORDER BY routine_name;

-- ====================
-- EXAMPLE USAGE
-- ====================

/*
-- 1. Create trial enrollment
INSERT INTO enrollments (
  student_id, 
  class_id, 
  enrollment_type,
  status
) VALUES (
  'student-uuid-here',
  'class-uuid-here',
  'trial',
  'active'
);
-- trial_expires_at will auto-set to 3 days from now

-- 2. Query active trials
SELECT * FROM active_trial_enrollments;

-- 3. Convert trial to regular
SELECT convert_trial_to_regular(
  p_enrollment_id := 'enrollment-uuid-here',
  p_tuition_fee := 5000000,
  p_discount_amount := 500000
);

-- 4. Auto-expire old trials
SELECT * FROM auto_expire_trial_enrollments();

-- 5. Get trial statistics (last 30 days, all centers)
SELECT * FROM get_trial_statistics();

-- 6. Get trial statistics (specific center, custom date range)
SELECT * FROM get_trial_statistics(
  p_center_id := 'center-uuid-here',
  p_start_date := '2025-01-01',
  p_end_date := '2025-01-31'
);
*/


-- <<< END FILE: 41_trial_enrollment.sql

-- >>> BEGIN FILE: 42_waiting_list.sql
-- =============================================
-- Migration: Waiting List System
-- Version: 42
-- Description: Add waiting list for full classes
-- Author: System
-- Date: 2025-01-XX
-- =============================================

-- ====================
-- 1. CREATE WAITING_LIST TABLE
-- ====================

CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
  
  -- Waiting list details
  priority INTEGER DEFAULT 0,
  notes TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'cancelled', 'expired')),
  
  -- Notification tracking
  notified_at TIMESTAMP WITH TIME ZONE,
  notification_method VARCHAR(20) CHECK (notification_method IN ('email', 'sms', 'phone', 'in_person')),
  
  -- Expiration (auto-remove after 7 days if not enrolled)
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(student_id, class_id) -- Student can only be on waiting list once per class
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waiting_list_student 
ON waiting_list(student_id, status);

CREATE INDEX IF NOT EXISTS idx_waiting_list_class 
ON waiting_list(class_id, status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_waiting_list_center 
ON waiting_list(center_id, status);

CREATE INDEX IF NOT EXISTS idx_waiting_list_expires 
ON waiting_list(expires_at) 
WHERE status = 'notified';

-- Comments
COMMENT ON TABLE waiting_list IS 'Waiting list for students when classes are full';
COMMENT ON COLUMN waiting_list.priority IS 'Higher priority = earlier notification (0=normal, 1=high, 2=urgent)';
COMMENT ON COLUMN waiting_list.status IS 'waiting: on list, notified: slot available (notified), enrolled: successfully enrolled, cancelled: student cancelled, expired: notification expired';
COMMENT ON COLUMN waiting_list.expires_at IS 'Notification expires after 7 days if student does not enroll';

-- ====================
-- 2. CREATE VIEW: Active Waiting List
-- ====================

CREATE OR REPLACE VIEW active_waiting_list AS
SELECT 
  wl.id,
  wl.student_id,
  wl.class_id,
  wl.center_id,
  wl.priority,
  wl.status,
  wl.notified_at,
  wl.expires_at,
  wl.created_at,
  
  -- Student details
  u.full_name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  u.parent_phone AS parent_phone,
  u.parent_email AS parent_email,
  u.date_of_birth,
  
  -- Class details
  c.name AS class_name,
  c.code AS class_code,
  c.status AS class_status,
  c.start_date AS class_start_date,
  c.max_students,
  
  -- Center details
  ctr.name AS center_name,
  
  -- Enrollment count
  (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS current_students,
  
  -- Calculate available slots
  c.max_students - (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS available_slots,
  
  -- Calculate position in queue
  (
    SELECT COUNT(*) + 1
    FROM waiting_list wl2
    WHERE wl2.class_id = wl.class_id
      AND wl2.status = 'waiting'
      AND (
        wl2.priority > wl.priority OR
        (wl2.priority = wl.priority AND wl2.created_at < wl.created_at)
      )
  ) AS queue_position,
  
  -- Calculate days waiting
  EXTRACT(DAY FROM NOW() - wl.created_at)::INTEGER AS days_waiting

FROM waiting_list wl
JOIN users u ON u.id = wl.student_id
JOIN classes c ON c.id = wl.class_id
LEFT JOIN centers ctr ON ctr.id = wl.center_id
WHERE wl.status IN ('waiting', 'notified')
ORDER BY 
  wl.class_id,
  wl.priority DESC,
  wl.created_at ASC;

COMMENT ON VIEW active_waiting_list IS 'Active waiting list with student/class details, queue position, and available slots';

-- ====================
-- 3. FUNCTION: Add to Waiting List
-- ====================

CREATE OR REPLACE FUNCTION add_to_waiting_list(
  p_student_id UUID,
  p_class_id UUID,
  p_priority INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class classes;
  v_student users;
  v_enrollment_count INTEGER;
  v_waiting_list_id UUID;
  v_result JSON;
BEGIN
  -- Validate student exists
  SELECT * INTO v_student
  FROM users
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found: %', p_student_id;
  END IF;

  -- Validate class exists
  SELECT * INTO v_class
  FROM classes
  WHERE id = p_class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found: %', p_class_id;
  END IF;

  -- Check if class is full
  SELECT COUNT(*) INTO v_enrollment_count
  FROM enrollments
  WHERE class_id = p_class_id
    AND status = 'active';

  IF v_enrollment_count < v_class.max_students THEN
    RAISE EXCEPTION 'Class % is not full (% / % students). Student can enroll directly.', 
      v_class.name, v_enrollment_count, v_class.max_students;
  END IF;

  -- Check if student already enrolled
  IF EXISTS (
    SELECT 1 FROM enrollments
    WHERE student_id = p_student_id
      AND class_id = p_class_id
      AND status IN ('active', 'pending')
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in class %', v_class.name;
  END IF;

  -- Check if student already on waiting list
  IF EXISTS (
    SELECT 1 FROM waiting_list
    WHERE student_id = p_student_id
      AND class_id = p_class_id
      AND status IN ('waiting', 'notified')
  ) THEN
    RAISE EXCEPTION 'Student is already on the waiting list for class %', v_class.name;
  END IF;

  -- Add to waiting list
  INSERT INTO waiting_list (
    student_id,
    class_id,
    center_id,
    priority,
    notes,
    status
  ) VALUES (
    p_student_id,
    p_class_id,
    v_class.center_id,
    p_priority,
    p_notes,
    'waiting'
  )
  RETURNING id INTO v_waiting_list_id;

  -- Build result
  v_result := json_build_object(
    'success', TRUE,
    'waiting_list_id', v_waiting_list_id,
    'student_id', p_student_id,
    'student_name', v_student.full_name,
    'class_id', p_class_id,
    'class_name', v_class.name,
    'priority', p_priority,
    'message', 'Student added to waiting list successfully'
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION add_to_waiting_list IS 'Add student to waiting list when class is full';

-- ====================
-- 4. FUNCTION: Notify Next in Queue
-- ====================

CREATE OR REPLACE FUNCTION notify_next_in_queue(
  p_class_id UUID,
  p_slots_available INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notified_ids UUID[];
  v_notified_count INTEGER := 0;
  v_waiting_entry RECORD;
BEGIN
  -- Find next students in queue (by priority, then FIFO)
  FOR v_waiting_entry IN
    SELECT *
    FROM waiting_list
    WHERE class_id = p_class_id
      AND status = 'waiting'
    ORDER BY priority DESC, created_at ASC
    LIMIT p_slots_available
  LOOP
    -- Update status to 'notified'
    UPDATE waiting_list
    SET 
      status = 'notified',
      notified_at = NOW(),
      expires_at = NOW() + INTERVAL '7 days', -- 7 days to enroll
      updated_at = NOW()
    WHERE id = v_waiting_entry.id;

    -- Add to notified array
    v_notified_ids := ARRAY_APPEND(v_notified_ids, v_waiting_entry.id);
    v_notified_count := v_notified_count + 1;
  END LOOP;

  -- Return result
  RETURN json_build_object(
    'success', TRUE,
    'notified_count', v_notified_count,
    'notified_ids', v_notified_ids,
    'class_id', p_class_id,
    'message', format('%s student(s) notified', v_notified_count)
  );
END;
$$;

COMMENT ON FUNCTION notify_next_in_queue IS 'Notify next students in waiting list queue when slots become available';

-- ====================
-- 5. FUNCTION: Complete Waiting List Entry
-- ====================

CREATE OR REPLACE FUNCTION complete_waiting_list_entry(
  p_waiting_list_id UUID,
  p_new_status VARCHAR(20), -- 'enrolled' or 'cancelled'
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_waiting_entry waiting_list;
  v_result JSON;
BEGIN
  -- Validate new status
  IF p_new_status NOT IN ('enrolled', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be enrolled or cancelled', p_new_status;
  END IF;

  -- Get waiting list entry
  SELECT * INTO v_waiting_entry
  FROM waiting_list
  WHERE id = p_waiting_list_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Waiting list entry not found: %', p_waiting_list_id;
  END IF;

  -- Update status
  UPDATE waiting_list
  SET 
    status = p_new_status,
    notes = COALESCE(p_reason, notes),
    updated_at = NOW()
  WHERE id = p_waiting_list_id;

  -- If cancelled and was notified, notify next in queue
  IF p_new_status = 'cancelled' AND v_waiting_entry.status = 'notified' THEN
    -- Recursively notify next student
    PERFORM notify_next_in_queue(v_waiting_entry.class_id, 1);
  END IF;

  -- Build result
  v_result := json_build_object(
    'success', TRUE,
    'waiting_list_id', p_waiting_list_id,
    'student_id', v_waiting_entry.student_id,
    'class_id', v_waiting_entry.class_id,
    'old_status', v_waiting_entry.status,
    'new_status', p_new_status,
    'message', format('Waiting list entry updated to %', p_new_status)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION complete_waiting_list_entry IS 'Mark waiting list entry as enrolled or cancelled';

-- ====================
-- 6. FUNCTION: Auto-expire Notifications
-- ====================

CREATE OR REPLACE FUNCTION auto_expire_waiting_list_notifications()
RETURNS TABLE(
  expired_count INTEGER,
  expired_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Find expired notifications (7 days passed)
  SELECT ARRAY_AGG(id)
  INTO v_expired_ids
  FROM waiting_list
  WHERE status = 'notified'
    AND expires_at < NOW();

  -- Get count
  v_count := COALESCE(ARRAY_LENGTH(v_expired_ids, 1), 0);

  -- Update status to 'expired'
  IF v_count > 0 THEN
    UPDATE waiting_list
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE id = ANY(v_expired_ids);

    -- Notify next students in queue for each expired class
    DECLARE
      v_class_rec RECORD;
    BEGIN
      FOR v_class_rec IN
        SELECT DISTINCT class_id
        FROM waiting_list
        WHERE id = ANY(v_expired_ids)
      LOOP
        PERFORM notify_next_in_queue(v_class_rec.class_id, 1);
      END LOOP;
    END;
  END IF;

  -- Return results
  RETURN QUERY SELECT v_count, v_expired_ids;
END;
$$;

COMMENT ON FUNCTION auto_expire_waiting_list_notifications IS 'Auto-expire notifications after 7 days and notify next in queue';

-- ====================
-- 7. FUNCTION: Get Waiting List Statistics
-- ====================

CREATE OR REPLACE FUNCTION get_waiting_list_statistics(
  p_center_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT (NOW() - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT NOW()::DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
  v_total INTEGER;
  v_waiting INTEGER;
  v_notified INTEGER;
  v_enrolled INTEGER;
  v_cancelled INTEGER;
  v_expired INTEGER;
  v_avg_wait_time NUMERIC(10,2);
BEGIN
  -- Total entries
  SELECT COUNT(*)
  INTO v_total
  FROM waiting_list
  WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR center_id = p_center_id);

  -- Status counts
  SELECT 
    COUNT(*) FILTER (WHERE status = 'waiting'),
    COUNT(*) FILTER (WHERE status = 'notified'),
    COUNT(*) FILTER (WHERE status = 'enrolled'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO v_waiting, v_notified, v_enrolled, v_cancelled, v_expired
  FROM waiting_list
  WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR center_id = p_center_id);

  -- Average wait time (days) for enrolled students
  SELECT ROUND(AVG(EXTRACT(DAY FROM updated_at - created_at)), 2)
  INTO v_avg_wait_time
  FROM waiting_list
  WHERE status = 'enrolled'
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR center_id = p_center_id);

  -- Build result
  v_stats := json_build_object(
    'total', v_total,
    'waiting', v_waiting,
    'notified', v_notified,
    'enrolled', v_enrolled,
    'cancelled', v_cancelled,
    'expired', v_expired,
    'avg_wait_time_days', COALESCE(v_avg_wait_time, 0),
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  );

  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION get_waiting_list_statistics IS 'Get waiting list statistics for a date range';

-- ====================
-- 8. TRIGGER: Auto-update timestamp
-- ====================

CREATE OR REPLACE FUNCTION update_waiting_list_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_waiting_list_timestamp ON waiting_list;

CREATE TRIGGER trigger_update_waiting_list_timestamp
BEFORE UPDATE ON waiting_list
FOR EACH ROW
EXECUTE FUNCTION update_waiting_list_timestamp();

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'waiting_list'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'waiting_list'
ORDER BY indexname;

-- Show functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%waiting_list%'
ORDER BY routine_name;

-- ====================
-- EXAMPLE USAGE
-- ====================

/*
-- 1. Add student to waiting list
SELECT add_to_waiting_list(
  p_student_id := 'student-uuid-here',
  p_class_id := 'class-uuid-here',
  p_priority := 0,
  p_notes := 'Regular priority'
);

-- 2. Query active waiting list
SELECT * FROM active_waiting_list;

-- 3. Notify next 2 students when slots available
SELECT notify_next_in_queue(
  p_class_id := 'class-uuid-here',
  p_slots_available := 2
);

-- 4. Mark as enrolled (when student successfully enrolled)
SELECT complete_waiting_list_entry(
  p_waiting_list_id := 'waiting-list-uuid-here',
  p_new_status := 'enrolled'
);

-- 5. Mark as cancelled (student declined)
SELECT complete_waiting_list_entry(
  p_waiting_list_id := 'waiting-list-uuid-here',
  p_new_status := 'cancelled',
  p_reason := 'Student found another class'
);

-- 6. Auto-expire old notifications (run daily via cron)
SELECT * FROM auto_expire_waiting_list_notifications();

-- 7. Get waiting list statistics
SELECT * FROM get_waiting_list_statistics();

-- 8. Get statistics for specific center
SELECT * FROM get_waiting_list_statistics(
  p_center_id := 'center-uuid-here',
  p_start_date := '2025-01-01',
  p_end_date := '2025-01-31'
);
*/


-- <<< END FILE: 42_waiting_list.sql

-- >>> BEGIN FILE: 43_dashboard_goals_setting.sql
-- ============================================================
-- DASHBOARD GOALS SETTING
-- Version: 1.0
-- Description: Add dashboard_goals setting for configurable monthly targets
-- ============================================================

-- ============================================================
-- 1. CREATE SYSTEM_SETTINGS TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(center_id, key)
);

-- Handle NULL center_id for global settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_global_key 
ON public.system_settings (key) WHERE center_id IS NULL;

-- ============================================================
-- 2. INSERT DASHBOARD GOALS SETTING (Global)
-- ============================================================
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
    NULL,
    'dashboard_goals',
    '{
        "revenueGoal": 200000000,
        "studentsGoal": 50
    }'::jsonb,
    'Mục tiêu dashboard hàng tháng (doanh thu và học viên mới)'
)
ON CONFLICT (key) WHERE center_id IS NULL DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Comment
COMMENT ON TABLE public.system_settings IS 'System configuration settings (global or per-center)';
COMMENT ON COLUMN public.system_settings.value IS 'Giá trị setting dạng JSON. dashboard_goals: {revenueGoal: number, studentsGoal: number}';
    


-- <<< END FILE: 43_dashboard_goals_setting.sql

-- >>> BEGIN FILE: 43_payment_verification_columns.sql
-- ============================================================
-- Add missing columns to payments table for student payment verification
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add bank_proof_url column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS bank_proof_url TEXT;

-- Add verification_status column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified' 
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Add verified_by column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

-- Add verified_at column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_verification_status ON public.payments(verification_status);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments(verified_by);

-- Comment
COMMENT ON COLUMN public.payments.bank_proof_url IS 'URL of bank transfer proof image uploaded by student';
COMMENT ON COLUMN public.payments.verification_status IS 'pending = awaiting verification, verified = confirmed, rejected = declined';
COMMENT ON COLUMN public.payments.verified_by IS 'Staff who verified this payment';
COMMENT ON COLUMN public.payments.verified_at IS 'When the payment was verified';

-- Done
SELECT 'Payment verification columns added successfully!' as result;


-- <<< END FILE: 43_payment_verification_columns.sql

-- >>> BEGIN FILE: 50_attendance_audit.sql
-- ============================================================
-- ATTENDANCE AUDIT SYSTEM
-- Bảng lưu lại lịch sử thay đổi điểm danh
-- Version: 1.0
-- ============================================================

-- ============================================================
-- 1. ADD SESSION_ID AND OVERRIDE COLUMNS TO ATTENDANCE TABLE
-- ============================================================
-- Add session_id column if not exists (required for audit trigger)
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id);

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

COMMENT ON COLUMN public.attendance.session_id IS 'Reference to the session this attendance belongs to';
COMMENT ON COLUMN public.attendance.override_reason IS 'Lý do khi admin override điểm danh';
COMMENT ON COLUMN public.attendance.overridden_by IS 'Người thực hiện override';
COMMENT ON COLUMN public.attendance.overridden_at IS 'Thời điểm override';

-- ============================================================
-- 2. CREATE ATTENDANCE_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id),
    student_id UUID REFERENCES public.users(id),
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'overridden'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    override_reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ============================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_audit_attendance_id ON public.attendance_audit(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_session_id ON public.attendance_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_changed_at ON public.attendance_audit(changed_at);

-- ============================================================
-- 4. TRIGGER FUNCTION TO LOG ATTENDANCE CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_attendance_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_student_id UUID;
    v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get session_id and student_id from the new record
        v_session_id := NEW.session_id;
        SELECT e.student_id INTO v_student_id 
        FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
        
        INSERT INTO public.attendance_audit (
            attendance_id, session_id, student_id, action, new_values, changed_by
        ) VALUES (
            NEW.id, v_session_id, v_student_id, 'created', to_jsonb(NEW), NEW.marked_by
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if there are actual changes
        IF OLD IS DISTINCT FROM NEW THEN
            v_session_id := COALESCE(NEW.session_id, OLD.session_id);
            SELECT e.student_id INTO v_student_id 
            FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
            
            -- Determine action type
            IF NEW.overridden_by IS NOT NULL AND OLD.overridden_by IS NULL THEN
                v_action := 'overridden';
            ELSE
                v_action := 'updated';
            END IF;
            
            INSERT INTO public.attendance_audit (
                attendance_id, session_id, student_id, action, 
                old_values, new_values, changed_by, override_reason
            ) VALUES (
                NEW.id, v_session_id, v_student_id, v_action,
                to_jsonb(OLD), to_jsonb(NEW), 
                COALESCE(NEW.overridden_by, NEW.marked_by, auth.uid()),
                NEW.override_reason
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_session_id := OLD.session_id;
        SELECT e.student_id INTO v_student_id 
        FROM public.enrollments e WHERE e.id = OLD.enrollment_id;
        
        INSERT INTO public.attendance_audit (
            attendance_id, session_id, student_id, action, old_values, changed_by
        ) VALUES (
            OLD.id, v_session_id, v_student_id, 'deleted', to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS attendance_audit_trigger ON public.attendance;

CREATE TRIGGER attendance_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.log_attendance_changes();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
DROP POLICY IF EXISTS "Admin can view all attendance audit logs" ON public.attendance_audit;
CREATE POLICY "Admin can view all attendance audit logs" ON public.attendance_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Teacher can view audit logs for their classes
DROP POLICY IF EXISTS "Teachers can view attendance audit for their classes" ON public.attendance_audit;
CREATE POLICY "Teachers can view attendance audit for their classes" ON public.attendance_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.enrollments e ON a.enrollment_id = e.id
            JOIN public.classes c ON e.class_id = c.id
            WHERE a.id = attendance_audit.attendance_id
            AND c.teacher_id = auth.uid()
        )
    );

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON TABLE public.attendance_audit IS 'Bảng lưu lịch sử thay đổi điểm danh để audit và tracking';
COMMENT ON COLUMN public.attendance_audit.action IS 'Loại hành động: created, updated, deleted, overridden';
COMMENT ON COLUMN public.attendance_audit.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN public.attendance_audit.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';
COMMENT ON COLUMN public.attendance_audit.override_reason IS 'Lý do override (nếu action = overridden)';
COMMENT ON COLUMN public.attendance_audit.ip_address IS 'Địa chỉ IP của người thực hiện thay đổi';
COMMENT ON COLUMN public.attendance_audit.user_agent IS 'User agent của trình duyệt';



-- <<< END FILE: 50_attendance_audit.sql

-- >>> BEGIN FILE: 51_grade_audit.sql
-- ============================================================
-- GRADE LOCK AND AUDIT SYSTEM
-- Bảng lưu lại lịch sử thay đổi điểm số và hệ thống khóa điểm
-- Version: 1.0
-- ============================================================

-- ============================================================
-- 1. ADD LOCK AND OVERRIDE COLUMNS TO GRADES TABLE
-- ============================================================
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS lock_reason TEXT,
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

COMMENT ON COLUMN public.grades.is_locked IS 'Trạng thái khóa điểm - không cho phép chỉnh sửa khi đã khóa';
COMMENT ON COLUMN public.grades.locked_at IS 'Thời điểm khóa điểm';
COMMENT ON COLUMN public.grades.locked_by IS 'Người thực hiện khóa điểm';
COMMENT ON COLUMN public.grades.lock_reason IS 'Lý do khóa điểm';
COMMENT ON COLUMN public.grades.override_reason IS 'Lý do khi admin override điểm đã khóa';
COMMENT ON COLUMN public.grades.overridden_by IS 'Người thực hiện override';
COMMENT ON COLUMN public.grades.overridden_at IS 'Thời điểm override';

-- ============================================================
-- 2. CREATE GRADE_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grade_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES public.enrollments(id),
    student_id UUID REFERENCES public.users(id),
    class_id UUID REFERENCES public.classes(id),
    grade_structure_id UUID REFERENCES public.grade_structures(id),
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'locked', 'unlocked', 'overridden'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ============================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_grade_audit_grade_id ON public.grade_audit(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_enrollment_id ON public.grade_audit(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_student_id ON public.grade_audit(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_class_id ON public.grade_audit(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_changed_at ON public.grade_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_grade_audit_action ON public.grade_audit(action);

-- Index for locked grades queries
CREATE INDEX IF NOT EXISTS idx_grades_is_locked ON public.grades(is_locked) WHERE is_locked = TRUE;

-- ============================================================
-- 4. TRIGGER FUNCTION TO LOG GRADE CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_grade_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_enrollment_id UUID;
    v_student_id UUID;
    v_class_id UUID;
    v_grade_structure_id UUID;
    v_action VARCHAR(50);
    v_reason TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_enrollment_id := NEW.enrollment_id;
        v_grade_structure_id := NEW.grade_structure_id;
        
        SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
        FROM public.enrollments e WHERE e.id = NEW.enrollment_id;
        
        INSERT INTO public.grade_audit (
            grade_id, enrollment_id, student_id, class_id, grade_structure_id,
            action, new_values, changed_by
        ) VALUES (
            NEW.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
            'created', to_jsonb(NEW), NEW.graded_by
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD IS DISTINCT FROM NEW THEN
            v_enrollment_id := COALESCE(NEW.enrollment_id, OLD.enrollment_id);
            v_grade_structure_id := COALESCE(NEW.grade_structure_id, OLD.grade_structure_id);
            
            SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
            FROM public.enrollments e WHERE e.id = v_enrollment_id;
            
            -- Determine action type based on what changed
            IF NEW.is_locked = TRUE AND (OLD.is_locked IS NULL OR OLD.is_locked = FALSE) THEN
                v_action := 'locked';
                v_reason := NEW.lock_reason;
            ELSIF NEW.is_locked = FALSE AND OLD.is_locked = TRUE THEN
                v_action := 'unlocked';
                v_reason := NEW.override_reason;
            ELSIF NEW.overridden_by IS NOT NULL AND OLD.overridden_by IS NULL THEN
                v_action := 'overridden';
                v_reason := NEW.override_reason;
            ELSE
                v_action := 'updated';
                v_reason := NULL;
            END IF;
            
            INSERT INTO public.grade_audit (
                grade_id, enrollment_id, student_id, class_id, grade_structure_id,
                action, old_values, new_values, changed_by, reason
            ) VALUES (
                NEW.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
                v_action, to_jsonb(OLD), to_jsonb(NEW),
                COALESCE(NEW.overridden_by, NEW.graded_by, auth.uid()),
                v_reason
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_enrollment_id := OLD.enrollment_id;
        v_grade_structure_id := OLD.grade_structure_id;
        
        SELECT e.student_id, e.class_id INTO v_student_id, v_class_id
        FROM public.enrollments e WHERE e.id = OLD.enrollment_id;
        
        INSERT INTO public.grade_audit (
            grade_id, enrollment_id, student_id, class_id, grade_structure_id,
            action, old_values, changed_by
        ) VALUES (
            OLD.id, v_enrollment_id, v_student_id, v_class_id, v_grade_structure_id,
            'deleted', to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS grade_audit_trigger ON public.grades;

CREATE TRIGGER grade_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION public.log_grade_changes();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.grade_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
DROP POLICY IF EXISTS "Admin can view all grade audit logs" ON public.grade_audit;
CREATE POLICY "Admin can view all grade audit logs" ON public.grade_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Teacher can view audit logs for their classes
DROP POLICY IF EXISTS "Teachers can view grade audit for their classes" ON public.grade_audit;
CREATE POLICY "Teachers can view grade audit for their classes" ON public.grade_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = grade_audit.class_id
            AND c.teacher_id = auth.uid()
        )
    );

-- Admin can insert audit logs (for manual audit entries)
DROP POLICY IF EXISTS "Admin can insert grade audit logs" ON public.grade_audit;
CREATE POLICY "Admin can insert grade audit logs" ON public.grade_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON TABLE public.grade_audit IS 'Bảng lưu lịch sử thay đổi điểm số để audit và tracking';
COMMENT ON COLUMN public.grade_audit.grade_id IS 'ID của điểm số bị thay đổi (NULL nếu đã xóa)';
COMMENT ON COLUMN public.grade_audit.enrollment_id IS 'ID enrollment của học viên';
COMMENT ON COLUMN public.grade_audit.student_id IS 'ID học viên';
COMMENT ON COLUMN public.grade_audit.class_id IS 'ID lớp học';
COMMENT ON COLUMN public.grade_audit.grade_structure_id IS 'ID cấu trúc điểm (cột điểm)';
COMMENT ON COLUMN public.grade_audit.action IS 'Loại hành động: created, updated, deleted, locked, unlocked, overridden';
COMMENT ON COLUMN public.grade_audit.old_values IS 'Giá trị cũ trước khi thay đổi (JSON)';
COMMENT ON COLUMN public.grade_audit.new_values IS 'Giá trị mới sau khi thay đổi (JSON)';
COMMENT ON COLUMN public.grade_audit.changed_by IS 'Người thực hiện thay đổi';
COMMENT ON COLUMN public.grade_audit.changed_at IS 'Thời điểm thay đổi';
COMMENT ON COLUMN public.grade_audit.reason IS 'Lý do thay đổi (lock/unlock/override)';
COMMENT ON COLUMN public.grade_audit.ip_address IS 'Địa chỉ IP của người thực hiện thay đổi';
COMMENT ON COLUMN public.grade_audit.user_agent IS 'User agent của trình duyệt';



-- <<< END FILE: 51_grade_audit.sql

-- >>> BEGIN FILE: 52_payment_jobs_tables.sql
-- ============================================================
-- PAYMENT JOBS TABLES
-- Version: 1.0
-- Description: Tables for payment reminder jobs and call list
-- ============================================================

-- ============================================================
-- 1. PAYMENT_REMINDER_LOGS - Track sent reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'upcoming_3_days', 'due_today', 'overdue_1_day', 'overdue_7_days'
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'delivered', 'opened'
    error_message TEXT,
    metadata JSONB,
    
    -- Prevent duplicate reminders
    UNIQUE(invoice_id, reminder_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_logs_invoice ON public.payment_reminder_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_type ON public.payment_reminder_logs(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON public.payment_reminder_logs(sent_at);

-- ============================================================
-- 2. INVOICE_STATUS_LOGS - Track status changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_logs_invoice ON public.invoice_status_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_changed_at ON public.invoice_status_logs(changed_at);

-- ============================================================
-- 3. PAYMENT_CALL_LIST - Invoices requiring phone follow-up
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_call_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    days_overdue INTEGER,
    amount_due NUMERIC(12,2),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES public.users(id), -- Staff assigned to call
    last_call_at TIMESTAMPTZ,
    call_count INTEGER DEFAULT 0,
    call_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'called', 'promised', 'paid', 'escalated'
    next_call_date DATE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB, -- Extra info: student_name, student_phone, invoice_code, due_date
    
    UNIQUE(invoice_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_list_status ON public.payment_call_list(status);
CREATE INDEX IF NOT EXISTS idx_call_list_priority ON public.payment_call_list(priority);
CREATE INDEX IF NOT EXISTS idx_call_list_assigned ON public.payment_call_list(assigned_to);
CREATE INDEX IF NOT EXISTS idx_call_list_next_call ON public.payment_call_list(next_call_date);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.payment_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_call_list ENABLE ROW LEVEL SECURITY;

-- Admin can view all
CREATE POLICY "Admin can view reminder logs" ON public.payment_reminder_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

CREATE POLICY "Admin can view status logs" ON public.invoice_status_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

CREATE POLICY "Admin can manage call list" ON public.payment_call_list
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

-- NOTE: Service role (used by backend jobs) bypasses RLS entirely in Supabase
-- No additional policies needed for service role operations

-- ============================================================
-- 5. COMMENTS
-- ============================================================
COMMENT ON TABLE public.payment_reminder_logs IS 'Lịch sử gửi nhắc nhở thanh toán';
COMMENT ON TABLE public.invoice_status_logs IS 'Lịch sử thay đổi trạng thái hóa đơn';
COMMENT ON TABLE public.payment_call_list IS 'Danh sách cần gọi điện nhắc thanh toán';

COMMENT ON COLUMN public.payment_call_list.priority IS 'Mức độ ưu tiên: low, normal, high, urgent';
COMMENT ON COLUMN public.payment_call_list.status IS 'Trạng thái: pending, called, promised, paid, escalated';



-- <<< END FILE: 52_payment_jobs_tables.sql

-- >>> BEGIN FILE: 53_parent_user_support.sql
-- ============================================================
-- PARENT USER SUPPORT
-- Date: 2026-01-30
-- Description: Add PARENT role and parent-student linking for parent portal
-- Depends on: 01_schema.sql, 40_parent_guardian_support.sql
-- ============================================================

-- ============================================================
-- 1. ADD PARENT ROLE
-- ============================================================

INSERT INTO public.roles (code, name, description) 
VALUES ('PARENT', 'Parent', 'Phụ huynh học viên')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. CREATE PARENT_STUDENT_LINKS TABLE
-- Links parent users to their children (students)
-- A parent can have multiple children
-- A child (minor student) can have multiple parents/guardians
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parent user (must have PARENT role)
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Student user (must have STUDENT role)
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Relationship type
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  
  -- Is this the primary guardian for this student?
  is_primary BOOLEAN DEFAULT false,
  
  -- Can this parent make payments for the student?
  can_pay BOOLEAN DEFAULT true,
  
  -- Can this parent view grades/attendance?
  can_view_academics BOOLEAN DEFAULT true,
  
  -- Status of the link
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Notes (e.g., custody arrangements, contact preferences)
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  -- Unique constraint: one parent can only link to one student once
  UNIQUE(parent_id, student_id)
);

-- ============================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================

-- Find all children of a parent
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id 
  ON public.parent_student_links(parent_id) 
  WHERE status = 'active';

-- Find all parents of a student
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id 
  ON public.parent_student_links(student_id) 
  WHERE status = 'active';

-- Find primary guardian of a student
CREATE INDEX IF NOT EXISTS idx_parent_student_links_primary 
  ON public.parent_student_links(student_id, is_primary) 
  WHERE status = 'active' AND is_primary = true;

-- ============================================================
-- 4. HELPER VIEWS
-- ============================================================

-- View: Parents with their linked children
CREATE OR REPLACE VIEW public.parent_children_view AS
SELECT 
  psl.id AS link_id,
  psl.parent_id,
  p.full_name AS parent_name,
  p.email AS parent_email,
  p.phone AS parent_phone,
  psl.student_id,
  s.full_name AS student_name,
  s.email AS student_email,
  s.date_of_birth AS student_dob,
  EXTRACT(YEAR FROM AGE(s.date_of_birth)) AS student_age,
  psl.relationship,
  psl.is_primary,
  psl.can_pay,
  psl.can_view_academics,
  psl.status AS link_status,
  s.center_id
FROM public.parent_student_links psl
JOIN public.users p ON psl.parent_id = p.id
JOIN public.users s ON psl.student_id = s.id
WHERE psl.status = 'active';

COMMENT ON VIEW public.parent_children_view IS 
  'View phụ huynh với danh sách con em đã liên kết';

-- View: Students with their parents (for admin/manager use)
CREATE OR REPLACE VIEW public.student_parents_view AS
SELECT 
  s.id AS student_id,
  s.full_name AS student_name,
  s.email AS student_email,
  s.center_id,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'parent_id', p.id,
      'parent_name', p.full_name,
      'parent_email', p.email,
      'parent_phone', p.phone,
      'relationship', psl.relationship,
      'is_primary', psl.is_primary
    )
  ) FILTER (WHERE p.id IS NOT NULL) AS parents
FROM public.users s
LEFT JOIN public.parent_student_links psl ON s.id = psl.student_id AND psl.status = 'active'
LEFT JOIN public.users p ON psl.parent_id = p.id
WHERE s.role_id = (SELECT id FROM public.roles WHERE code = 'STUDENT')
GROUP BY s.id, s.full_name, s.email, s.center_id;

COMMENT ON VIEW public.student_parents_view IS 
  'View học viên với danh sách phụ huynh đã liên kết';

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function: Get all children of a parent
CREATE OR REPLACE FUNCTION public.get_parent_children(p_parent_id UUID)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  student_dob DATE,
  relationship TEXT,
  is_primary BOOLEAN,
  center_id UUID,
  center_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    s.email AS student_email,
    s.date_of_birth AS student_dob,
    psl.relationship,
    psl.is_primary,
    s.center_id,
    c.name AS center_name
  FROM public.parent_student_links psl
  JOIN public.users s ON psl.student_id = s.id
  LEFT JOIN public.centers c ON s.center_id = c.id
  WHERE psl.parent_id = p_parent_id
    AND psl.status = 'active'
    AND s.status = 'active'
  ORDER BY psl.is_primary DESC, s.full_name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_parent_children IS 
  'Lấy danh sách con em của một phụ huynh';

-- Function: Check if parent has access to student
CREATE OR REPLACE FUNCTION public.parent_has_access(
  p_parent_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.parent_student_links 
    WHERE parent_id = p_parent_id 
      AND student_id = p_student_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.parent_has_access IS 
  'Kiểm tra phụ huynh có quyền truy cập thông tin học viên không';

-- Function: Get primary guardian of a student
CREATE OR REPLACE FUNCTION public.get_primary_guardian(p_student_id UUID)
RETURNS TABLE(
  parent_id UUID,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS parent_id,
    p.full_name AS parent_name,
    p.email AS parent_email,
    p.phone AS parent_phone,
    psl.relationship
  FROM public.parent_student_links psl
  JOIN public.users p ON psl.parent_id = p.id
  WHERE psl.student_id = p_student_id
    AND psl.status = 'active'
    AND psl.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_primary_guardian IS 
  'Lấy thông tin người giám hộ chính của học viên';

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their own links
CREATE POLICY parent_student_links_parent_view ON public.parent_student_links
  FOR SELECT
  USING (
    parent_id = auth.uid()
  );

-- Policy: Students can view who their parents are
CREATE POLICY parent_student_links_student_view ON public.parent_student_links
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Policy: Admins/Managers can view all links in their center
CREATE POLICY parent_student_links_admin_view ON public.parent_student_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Policy: Only admins can insert/update/delete links
CREATE POLICY parent_student_links_admin_manage ON public.parent_student_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 7. TRIGGER: Update updated_at on changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_parent_student_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parent_student_links_updated_at ON public.parent_student_links;
CREATE TRIGGER parent_student_links_updated_at
  BEFORE UPDATE ON public.parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parent_student_links_updated_at();

-- ============================================================
-- DONE!
-- ============================================================

-- Verification query
SELECT 
  code, 
  name, 
  description 
FROM public.roles 
WHERE code = 'PARENT';


-- <<< END FILE: 53_parent_user_support.sql

-- >>> BEGIN FILE: 54_payroll_enhancements.sql
-- ============================================================
-- PAYROLL ENHANCEMENTS - Bank Account, Payment Proof, Disputes
-- Version: 54
-- Description: Thêm thông tin ngân hàng cho GV, upload chứng từ thanh toán, hệ thống khiếu nại
-- ============================================================

-- ============================================================
-- 1. THÊM THÔNG TIN NGÂN HÀNG CHO GIÁO VIÊN (users table)
-- ============================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(100);

COMMENT ON COLUMN public.users.bank_name IS 'Tên ngân hàng của giáo viên (VD: Vietcombank, BIDV, Techcombank)';
COMMENT ON COLUMN public.users.bank_account_number IS 'Số tài khoản ngân hàng';
COMMENT ON COLUMN public.users.bank_account_holder IS 'Tên chủ tài khoản ngân hàng';

-- ============================================================
-- 2. THÊM THÔNG TIN THANH TOÁN CHO PAYROLL
-- ============================================================
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.users(id);

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

COMMENT ON COLUMN public.payroll.payment_proof_url IS 'URL ảnh chứng từ thanh toán (biên lai chuyển khoản)';
COMMENT ON COLUMN public.payroll.paid_at IS 'Thời điểm thanh toán thực tế';
COMMENT ON COLUMN public.payroll.paid_by IS 'Người thực hiện thanh toán';
COMMENT ON COLUMN public.payroll.payment_method IS 'Phương thức thanh toán: bank_transfer, cash, etc.';
COMMENT ON COLUMN public.payroll.payment_reference IS 'Mã giao dịch/tham chiếu thanh toán';

-- ============================================================
-- 3. TẠO BẢNG PAYROLL DISPUTES (Khiếu nại lương)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Nội dung khiếu nại
  reason TEXT NOT NULL,
  dispute_type VARCHAR(50) DEFAULT 'other' CHECK (dispute_type IN ('incorrect_hours', 'incorrect_rate', 'missing_sessions', 'incorrect_bonus', 'incorrect_deduction', 'other')),
  
  -- Trạng thái xử lý
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  
  -- Phản hồi từ admin
  admin_response TEXT,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_payroll ON public.payroll_disputes(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_teacher ON public.payroll_disputes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_status ON public.payroll_disputes(status);

-- Comments
COMMENT ON TABLE public.payroll_disputes IS 'Bảng lưu trữ khiếu nại về lương từ giáo viên';

-- ============================================================
-- 4. RLS POLICIES CHO PAYROLL_DISPUTES
-- ============================================================
ALTER TABLE public.payroll_disputes ENABLE ROW LEVEL SECURITY;

-- Giáo viên chỉ xem khiếu nại của mình
CREATE POLICY "Teacher can view own disputes" ON public.payroll_disputes
  FOR SELECT USING (teacher_id = auth.uid());

-- Giáo viên có thể tạo khiếu nại
CREATE POLICY "Teacher can create disputes" ON public.payroll_disputes
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Admin có thể xem tất cả
CREATE POLICY "Admin can view all disputes" ON public.payroll_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin có thể update disputes
CREATE POLICY "Admin can update disputes" ON public.payroll_disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 5. TRIGGER CẬP NHẬT updated_at CHO payroll_disputes
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_payroll_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payroll_disputes_updated_at ON public.payroll_disputes;
CREATE TRIGGER trigger_update_payroll_disputes_updated_at
  BEFORE UPDATE ON public.payroll_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payroll_disputes_updated_at();

-- ============================================================
-- 6. VIEW THỐNG KÊ DISPUTES
-- ============================================================
CREATE OR REPLACE VIEW public.v_payroll_disputes_stats AS
SELECT 
  COUNT(*) as total_disputes,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
FROM public.payroll_disputes;

COMMENT ON VIEW public.v_payroll_disputes_stats IS 'View thống kê nhanh về khiếu nại lương';

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 54_payroll_enhancements.sql

-- >>> BEGIN FILE: 55_fix_payroll_rls.sql
-- ============================================================
-- FIX: Payroll RLS Policies - Restrict to Admin/Manager only
-- Version: 55
-- Description: SECURITY FIX - Replace overly permissive payroll RLS
--   policies that allowed ANY authenticated user to modify payrolls.
--   Now restricted to SUPER_ADMIN and CENTER_MANAGER roles only.
-- ============================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can insert payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can update payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can delete payroll" ON public.payroll;

-- Admin/Manager can view all payrolls
CREATE POLICY "Admin can view all payroll" ON public.payroll
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can insert payrolls
CREATE POLICY "Admin can insert payroll" ON public.payroll
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can update payrolls
CREATE POLICY "Admin can update payroll" ON public.payroll
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can delete payrolls (draft only enforced by backend)
CREATE POLICY "Admin can delete payroll" ON public.payroll
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Keep existing teacher self-view policy (already correct)
-- "Teacher can view own payroll" already exists from 11_payroll_upgrade.sql

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 55_fix_payroll_rls.sql

-- >>> BEGIN FILE: 55_teacher_compensation.sql
-- ============================================================
-- TEACHER COMPENSATION SYSTEM
-- Version: 55
-- Description: Hệ thống cấu hình lương giáo viên linh hoạt
--              Hỗ trợ: Lương theo giờ, Lương cố định, Kết hợp
-- ============================================================

-- ============================================================
-- 1. TẠO BẢNG TEACHER_COMPENSATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Teacher reference
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centers(id), -- Denormalize for filtering
  
  -- Pay scheme type
  pay_scheme TEXT NOT NULL DEFAULT 'HOURLY_ONLY' CHECK (pay_scheme IN (
    'HOURLY_ONLY',        -- Chỉ lương theo giờ (part-time, sinh viên dạy thêm)
    'FIXED_ONLY',         -- Chỉ lương cố định (ít dùng)
    'FIXED_PLUS_HOURLY'   -- Lương cố định + thưởng giờ extra (full-time)
  )),
  
  -- Salary amounts
  hourly_rate NUMERIC(12,0) DEFAULT 150000,           -- Đơn giá/giờ (VND)
  fixed_monthly_salary NUMERIC(15,0) DEFAULT 0,       -- Lương cố định/tháng
  extra_hourly_rate NUMERIC(12,0),                    -- Đơn giá cho lớp extra (NULL = dùng hourly_rate)
  
  -- Effective dates (for history tracking)
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE NULL,  -- NULL = đang hiệu lực
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT valid_hourly_scheme CHECK (
    (pay_scheme = 'HOURLY_ONLY' AND hourly_rate IS NOT NULL AND hourly_rate > 0) OR
    (pay_scheme = 'FIXED_ONLY' AND fixed_monthly_salary IS NOT NULL) OR
    (pay_scheme = 'FIXED_PLUS_HOURLY' AND fixed_monthly_salary IS NOT NULL)
  )
);

-- Unique constraint: Only one active config per teacher at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_compensation_active
ON public.teacher_compensation(teacher_id)
WHERE effective_to IS NULL;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_teacher ON public.teacher_compensation(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_center ON public.teacher_compensation(center_id);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_scheme ON public.teacher_compensation(pay_scheme);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_effective ON public.teacher_compensation(effective_from, effective_to);

-- Comments
COMMENT ON TABLE public.teacher_compensation IS 'Cấu hình lương giáo viên - Lưu trữ mức lương và loại hình trả lương';
COMMENT ON COLUMN public.teacher_compensation.pay_scheme IS 'Loại hình: HOURLY_ONLY (part-time), FIXED_ONLY (cố định), FIXED_PLUS_HOURLY (full-time + extra)';
COMMENT ON COLUMN public.teacher_compensation.hourly_rate IS 'Đơn giá/giờ dạy (VND)';
COMMENT ON COLUMN public.teacher_compensation.fixed_monthly_salary IS 'Lương cố định hàng tháng (VND)';
COMMENT ON COLUMN public.teacher_compensation.extra_hourly_rate IS 'Đơn giá cho lớp extra - NULL thì dùng hourly_rate';
COMMENT ON COLUMN public.teacher_compensation.effective_from IS 'Ngày bắt đầu hiệu lực';
COMMENT ON COLUMN public.teacher_compensation.effective_to IS 'Ngày kết thúc - NULL nghĩa là đang hiệu lực';

-- ============================================================
-- 2. THÊM CỘT FIXED_SALARY VÀO PAYROLL
-- ============================================================
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS fixed_salary NUMERIC(15,0) NOT NULL DEFAULT 0;

ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS compensation_id UUID REFERENCES public.teacher_compensation(id);

COMMENT ON COLUMN public.payroll.fixed_salary IS 'Lương cố định trong kỳ (từ teacher_compensation)';
COMMENT ON COLUMN public.payroll.compensation_id IS 'Reference đến cấu hình lương được áp dụng';

-- ============================================================
-- 3. TRIGGER CẬP NHẬT UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_teacher_compensation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_compensation_updated_at ON public.teacher_compensation;
CREATE TRIGGER trigger_teacher_compensation_updated_at
  BEFORE UPDATE ON public.teacher_compensation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_compensation_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.teacher_compensation ENABLE ROW LEVEL SECURITY;

-- Giáo viên xem cấu hình lương của mình
CREATE POLICY "Teacher can view own compensation" ON public.teacher_compensation
  FOR SELECT USING (teacher_id = auth.uid());

-- Admin/Manager xem tất cả
CREATE POLICY "Admin can view all compensations" ON public.teacher_compensation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager có thể tạo/sửa
CREATE POLICY "Admin can manage compensations" ON public.teacher_compensation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 5. BACKFILL: Tạo cấu hình mặc định từ users.hourly_rate
-- ============================================================
INSERT INTO public.teacher_compensation (
  teacher_id,
  center_id,
  pay_scheme,
  hourly_rate,
  fixed_monthly_salary,
  effective_from,
  notes
)
SELECT 
  u.id AS teacher_id,
  u.center_id,
  'HOURLY_ONLY' AS pay_scheme,
  COALESCE(u.hourly_rate, 150000) AS hourly_rate,
  0 AS fixed_monthly_salary,
  CURRENT_DATE AS effective_from,
  'Auto-migrated from users.hourly_rate' AS notes
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE r.code = 'TEACHER'
AND NOT EXISTS (
  SELECT 1 FROM public.teacher_compensation tc 
  WHERE tc.teacher_id = u.id AND tc.effective_to IS NULL
);

-- ============================================================
-- 6. VIEW: Thống kê cấu hình lương
-- ============================================================
CREATE OR REPLACE VIEW public.v_teacher_compensation_summary AS
SELECT 
  tc.id,
  tc.teacher_id,
  u.full_name AS teacher_name,
  u.email AS teacher_email,
  u.avatar_url,
  tc.center_id,
  c.name AS center_name,
  tc.pay_scheme,
  tc.hourly_rate,
  tc.fixed_monthly_salary,
  tc.extra_hourly_rate,
  tc.effective_from,
  tc.effective_to,
  CASE 
    WHEN tc.effective_to IS NULL THEN true 
    ELSE false 
  END AS is_active,
  tc.notes,
  tc.created_at,
  tc.updated_at
FROM public.teacher_compensation tc
JOIN public.users u ON tc.teacher_id = u.id
LEFT JOIN public.centers c ON tc.center_id = c.id
ORDER BY tc.effective_to IS NULL DESC, tc.updated_at DESC;

COMMENT ON VIEW public.v_teacher_compensation_summary IS 'View tổng hợp cấu hình lương giáo viên với thông tin chi tiết';

-- ============================================================
-- DONE!
-- ============================================================


-- <<< END FILE: 55_teacher_compensation.sql

-- >>> BEGIN FILE: 56_leave_requests.sql
-- ============================================================
-- TEACHER LEAVE REQUESTS
-- Version: 56
-- Description: Tạo bảng đơn xin nghỉ cho giáo viên
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('sick', 'personal', 'annual', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_requests_valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher_center_status
  ON public.leave_requests(teacher_id, center_id, status);

CREATE OR REPLACE FUNCTION public.update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trigger_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leave_requests_updated_at();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Teacher: xem đơn của chính mình
CREATE POLICY leave_requests_teacher_view_own ON public.leave_requests
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Teacher: tạo đơn cho chính mình
CREATE POLICY leave_requests_teacher_insert_own ON public.leave_requests
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teacher: chỉ xoa don pending cua chinh minh
CREATE POLICY leave_requests_teacher_delete_pending ON public.leave_requests
  FOR DELETE
  USING (teacher_id = auth.uid() AND status = 'pending');

-- Admin/Center Manager: xem tat ca don trong trung tam cua minh
CREATE POLICY leave_requests_manager_admin_view_center ON public.leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        AND (
          r.code = 'SUPER_ADMIN'
          OR u.center_id = leave_requests.center_id
        )
    )
  );

COMMENT ON TABLE public.leave_requests IS 'Đơn xin nghỉ của giáo viên';
COMMENT ON COLUMN public.leave_requests.leave_type IS 'Loại nghỉ: sick, personal, annual, other';
COMMENT ON COLUMN public.leave_requests.status IS 'Trạng thái xử lý: pending, approved, rejected';


-- <<< END FILE: 56_leave_requests.sql

-- >>> BEGIN FILE: 57_notifications.sql
-- ============================================================
-- NOTIFICATIONS
-- Version: 57
-- Description: Tạo bảng thông báo realtime cho người dùng
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type VARCHAR(100),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE public.notifications IS 'Thông báo cho người dùng theo thời gian thực';
COMMENT ON COLUMN public.notifications.reference_id IS 'ID bản ghi liên quan (enrollment, payment, leave request, grade...)';
COMMENT ON COLUMN public.notifications.reference_type IS 'Loại bản ghi liên quan: enrollment, payment, leave_request, grade';


-- <<< END FILE: 57_notifications.sql

-- >>> BEGIN FILE: 58_messaging.sql
-- ============================================================
-- INTERNAL MESSAGING
-- Version: 58
-- Description: Tạo hệ thống hội thoại và tin nhắn nội bộ
-- ============================================================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES centers(id),
  title varchar(255),
  class_id uuid REFERENCES classes(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);


-- <<< END FILE: 58_messaging.sql

-- >>> BEGIN FILE: 59_certificate_approvals.sql
-- Migration: Certificate Approval Workflow + New Certificate Types
-- Adds approval workflow support and additional certificate types (VSTEP, APTIS, ICDL, CNTT)

-- 1. Create certificate_approvals table
CREATE TABLE IF NOT EXISTS public.certificate_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_ids UUID[] NOT NULL, -- Array of certificate IDs in this approval batch
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    certificate_type_id UUID REFERENCES public.certificate_types(id),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add approval_status column to certificates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.certificates 
        ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'auto_approved' 
        CHECK (approval_status IN ('pending_approval', 'approved', 'auto_approved', 'rejected'));
    END IF;
END $$;

-- 3. Add approval_id column to certificates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'approval_id'
    ) THEN
        ALTER TABLE public.certificates 
        ADD COLUMN approval_id UUID REFERENCES public.certificate_approvals(id);
    END IF;
END $$;

-- 4. Indexes for certificate_approvals
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_center_id ON public.certificate_approvals(center_id);
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_status ON public.certificate_approvals(status);
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_requested_by ON public.certificate_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_certificates_approval_status ON public.certificates(approval_status);

-- 5. RLS for certificate_approvals
ALTER TABLE public.certificate_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_approvals_center_isolation" ON public.certificate_approvals
    USING (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc WHERE uc.user_id = auth.uid()
    ));

CREATE POLICY "certificate_approvals_insert" ON public.certificate_approvals
    FOR INSERT WITH CHECK (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc WHERE uc.user_id = auth.uid()
    ));

CREATE POLICY "certificate_approvals_update" ON public.certificate_approvals
    FOR UPDATE USING (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc 
        WHERE uc.user_id = auth.uid() 
        AND uc.role IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    ));

-- 6. Seed additional certificate types (VSTEP, APTIS, ICDL, CNTT)
INSERT INTO public.certificate_types (code, name, description, provider, category, is_external, is_internal, score_config, requirements, validity_months, display_order, is_active)
VALUES
    -- VSTEP - Vietnamese Standardized Test of English Proficiency
    ('VSTEP', 'VSTEP', 'Bài thi năng lực ngoại ngữ theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam', 'Bộ Giáo dục và Đào tạo', 'language', true, false,
     '{"type": "numeric", "max_score": 10, "min_score": 0, "pass_score": 4, "sub_scores": ["Listening", "Reading", "Writing", "Speaking"], "levels": [{"min": 4, "max": 5.5, "level": "B1"}, {"min": 6, "max": 7.5, "level": "B2"}, {"min": 8, "max": 10, "level": "C1"}]}'::jsonb,
     '{"description": "Đăng ký thi tại các cơ sở được Bộ GD&ĐT cấp phép"}'::jsonb,
     24, 15, true),
    
    -- APTIS - British Council
    ('APTIS', 'Aptis', 'Bài kiểm tra năng lực tiếng Anh của British Council', 'British Council', 'language', true, false,
     '{"type": "numeric", "max_score": 50, "min_score": 0, "sub_scores": ["Listening", "Reading", "Writing", "Speaking", "Grammar & Vocabulary"], "levels": [{"min": 0, "max": 19, "level": "A1"}, {"min": 20, "max": 29, "level": "A2"}, {"min": 30, "max": 39, "level": "B1"}, {"min": 40, "max": 44, "level": "B2"}, {"min": 45, "max": 50, "level": "C"}]}'::jsonb,
     '{"description": "Thi tại các trung tâm được British Council ủy quyền"}'::jsonb,
     24, 16, true),
    
    -- ICDL - International Computer Driving Licence
    ('ICDL', 'ICDL', 'Chứng chỉ tin học quốc tế ICDL (trước đây là ECDL)', 'ICDL Foundation', 'office', true, false,
     '{"type": "numeric", "max_score": 100, "min_score": 0, "pass_score": 75, "sub_scores": ["Computer Essentials", "Online Essentials", "Word Processing", "Spreadsheets", "Presentation", "Using Databases", "IT Security"]}'::jsonb,
     '{"description": "Thi tại các trung tâm khảo thí ICDL được ủy quyền"}'::jsonb,
     NULL, 25, true),
    
    -- Tin học ứng dụng CNTT - Thông tư 03/2014
    ('CNTT_UD', 'Tin học ứng dụng CNTT', 'Chứng chỉ ứng dụng CNTT theo Thông tư 03/2014/TT-BTTTT', 'Bộ Thông tin và Truyền thông', 'office', true, false,
     '{"type": "grade", "grades": ["Cơ bản", "Nâng cao"], "sub_scores": ["Kiến thức chung về CNTT", "Sử dụng máy tính cơ bản", "Xử lý văn bản", "Bảng tính", "Trình chiếu", "Internet"]}'::jsonb,
     '{"description": "Thi tại các cơ sở được Bộ TT&TT cấp phép tổ chức thi"}'::jsonb,
     NULL, 26, true)
ON CONFLICT (code) DO NOTHING;

-- 7. Updated_at trigger for certificate_approvals
CREATE OR REPLACE FUNCTION update_certificate_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_certificate_approvals_updated_at ON public.certificate_approvals;
CREATE TRIGGER trigger_certificate_approvals_updated_at
    BEFORE UPDATE ON public.certificate_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_approvals_updated_at();


-- <<< END FILE: 59_certificate_approvals.sql

-- >>> BEGIN FILE: 60_fix_eligibility_functions.sql
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


-- <<< END FILE: 60_fix_eligibility_functions.sql

-- >>> BEGIN FILE: 61_fix_certificate_status_constraint.sql
-- Fix certificates_status_check constraint to allow pending_approval and active statuses
ALTER TABLE certificates DROP CONSTRAINT IF EXISTS certificates_status_check;
ALTER TABLE certificates ADD CONSTRAINT certificates_status_check 
  CHECK (status = ANY (ARRAY['issued', 'revoked', 'expired', 'pending_approval', 'active']));


-- <<< END FILE: 61_fix_certificate_status_constraint.sql

-- >>> BEGIN FILE: 62_notification_system.sql
-- Migration: Notification system foundation
-- 1. Add RLS INSERT policy on notifications table for service_role
-- 2. Add RLS UPDATE policy on notifications for authenticated users (mark as read)
-- 3. Create user_notification_preferences table with RLS

-- ============================================
-- 1. RLS INSERT policy for notifications (service_role)
-- ============================================
CREATE POLICY "notifications_insert_service_role"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 2. RLS UPDATE policy for notifications (authenticated users can mark own as read)
-- ============================================
CREATE POLICY "notifications_update_own"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 3. Create user_notification_preferences table
-- ============================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, center_id, notification_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user_center
  ON user_notification_preferences(user_id, center_id);

-- ============================================
-- 4. RLS on user_notification_preferences
-- ============================================
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notif_prefs_select_own"
  ON user_notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_insert_own"
  ON user_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_update_own"
  ON user_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_service_role"
  ON user_notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Verify notifications table is in Realtime publication
-- ============================================
-- Add notifications table to the supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;


-- <<< END FILE: 62_notification_system.sql

-- >>> BEGIN FILE: 63_enrollment_requests.sql
-- Migration: Create enrollment_requests table
-- Allows students to request enrollment in classes, with admin approval workflow

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'enrolled', 'cancelled')),
    message TEXT,
    admin_note TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, class_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_enrollment_requests_center_status ON enrollment_requests(center_id, status);
CREATE INDEX idx_enrollment_requests_student_status ON enrollment_requests(student_id, status);
CREATE INDEX idx_enrollment_requests_class_id ON enrollment_requests(class_id);

-- Enable RLS
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own requests
CREATE POLICY "Students can view own enrollment requests"
    ON enrollment_requests FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- RLS Policy: Students can insert their own requests
CREATE POLICY "Students can create enrollment requests"
    ON enrollment_requests FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- RLS Policy: Students can delete (cancel) their own pending/waitlisted requests
CREATE POLICY "Students can cancel own pending requests"
    ON enrollment_requests FOR DELETE
    TO authenticated
    USING (student_id = auth.uid() AND status IN ('pending', 'waitlisted'));

-- RLS Policy: Service role has full access (for backend API operations)
CREATE POLICY "Service role full access on enrollment requests"
    ON enrollment_requests FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policy: Staff can view all requests at their center (via service_role, handled by backend)
-- Note: Backend uses service_role for all admin operations, scoped by center_id in queries

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_requests_updated_at
    BEFORE UPDATE ON enrollment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_requests_updated_at();

-- Add to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE enrollment_requests;


-- <<< END FILE: 63_enrollment_requests.sql

-- >>> BEGIN FILE: 64_audit_trail.sql
-- Migration: Audit Trail System
-- Creates audit schema, audit.logs table, trigger function, and attaches to critical tables

-- 1. Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- 2. Create audit.logs table
CREATE TABLE audit.logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'EXPORT')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes
CREATE INDEX idx_audit_logs_created_at ON audit.logs USING BRIN (created_at);
CREATE INDEX idx_audit_logs_tenant_entity ON audit.logs (tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit.logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit.logs (action);
CREATE INDEX idx_audit_logs_entity_type ON audit.logs (entity_type);

-- 4. Enable RLS
ALTER TABLE audit.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SUPER_ADMIN can see all audit logs
CREATE POLICY "super_admin_read_all" ON audit.logs
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'user_role') = 'SUPER_ADMIN'
  );

-- CENTER_MANAGER can see only their center's audit logs
CREATE POLICY "center_manager_read_own" ON audit.logs
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'user_role') = 'CENTER_MANAGER'
    AND tenant_id = (current_setting('request.jwt.claims', true)::json->>'center_id')::UUID
  );

-- Service role can insert (for triggers and backend)
CREATE POLICY "service_insert" ON audit.logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can insert (for PG triggers running in user context)
CREATE POLICY "authenticated_insert" ON audit.logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Generic trigger function
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
DECLARE
  _actor_id UUID;
  _actor_role TEXT;
  _tenant_id UUID;
  _entity_id UUID;
  _action TEXT;
  _old_values JSONB;
  _new_values JSONB;
BEGIN
  -- Extract actor from Supabase JWT context
  BEGIN
    _actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _actor_id := NULL;
  END;

  BEGIN
    _actor_role := current_setting('request.jwt.claims', true)::json->>'user_role';
  EXCEPTION WHEN OTHERS THEN
    _actor_role := 'system';
  END;

  -- Determine action, values, entity_id, and tenant_id
  IF TG_OP = 'INSERT' THEN
    _action := 'CREATE';
    _new_values := to_jsonb(NEW);
    _old_values := NULL;
    _entity_id := NEW.id;
    _tenant_id := CASE WHEN TG_TABLE_NAME = 'settings' THEN NEW.center_id ELSE NEW.center_id END;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'UPDATE';
    _old_values := to_jsonb(OLD);
    _new_values := to_jsonb(NEW);
    _entity_id := NEW.id;
    _tenant_id := COALESCE(NEW.center_id, OLD.center_id);
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'DELETE';
    _old_values := to_jsonb(OLD);
    _new_values := NULL;
    _entity_id := OLD.id;
    _tenant_id := OLD.center_id;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit.logs (
    tenant_id, actor_id, actor_role, action,
    entity_type, entity_id, old_values, new_values
  ) VALUES (
    _tenant_id, _actor_id, _actor_role, _action,
    TG_TABLE_NAME, _entity_id, _old_values, _new_values
  );

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach triggers to critical tables

-- Grades
DROP TRIGGER IF EXISTS audit_grades ON public.grades;
CREATE TRIGGER audit_grades
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Attendance
DROP TRIGGER IF EXISTS audit_attendance ON public.attendance;
CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Payments
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Enrollments
DROP TRIGGER IF EXISTS audit_enrollments ON public.enrollments;
CREATE TRIGGER audit_enrollments
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Students
DROP TRIGGER IF EXISTS audit_students ON public.students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- User Profiles (staff)
DROP TRIGGER IF EXISTS audit_user_profiles ON public.user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Settings
DROP TRIGGER IF EXISTS audit_settings ON public.settings;
CREATE TRIGGER audit_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();


-- <<< END FILE: 64_audit_trail.sql

-- >>> BEGIN FILE: 65_chat_tables.sql
-- =============================================
-- 65: Chat Tables for AI Chatbot Molly
-- Stores chat sessions and messages for the AI chatbot
-- =============================================

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chat_sessions IS 'AI chatbot conversation sessions - tracks both visitor and authenticated user chats';
COMMENT ON COLUMN chat_sessions.visitor_id IS 'Browser-generated UUID for anonymous visitors';
COMMENT ON COLUMN chat_sessions.user_id IS 'Authenticated user ID, NULL for visitors';
COMMENT ON COLUMN chat_sessions.metadata IS 'Session metadata: page_context, user_agent, etc.';

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Individual messages within a chat session';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN chat_messages.tokens_used IS 'LLM tokens consumed for assistant responses';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON chat_sessions(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_center_id ON chat_sessions(center_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role (backend) can do everything
CREATE POLICY "service_role_chat_sessions" ON chat_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_chat_messages" ON chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can view their own sessions
CREATE POLICY "users_view_own_sessions" ON chat_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Authenticated users can view messages in their own sessions
CREATE POLICY "users_view_own_messages" ON chat_messages
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

-- SUPER_ADMIN and CENTER_MANAGER can view all sessions in their center
CREATE POLICY "admin_view_center_sessions" ON chat_sessions
    FOR SELECT TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    );

CREATE POLICY "admin_view_center_messages" ON chat_messages
    FOR SELECT TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    );

-- Anonymous users can insert sessions (visitor mode)
CREATE POLICY "anon_insert_sessions" ON chat_sessions
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL);

-- Anonymous users can insert messages to their sessions
CREATE POLICY "anon_insert_messages" ON chat_messages
    FOR INSERT TO anon
    WITH CHECK (true);


-- <<< END FILE: 65_chat_tables.sql

-- >>> BEGIN FILE: 66_chatbot_faqs.sql
-- Migration: Create chatbot_faqs table for FAQ knowledge base
-- Part of: improve-chatbot-molly change

CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('enrollment', 'payment', 'policy', 'schedule', 'general')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_center_active
  ON chatbot_faqs(center_id, is_active, sort_order)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- Service role full access (backend chatbot queries)
CREATE POLICY "chatbot_faqs_service_all" ON chatbot_faqs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read FAQs (future admin UI)
CREATE POLICY "chatbot_faqs_authenticated_select" ON chatbot_faqs
  FOR SELECT TO authenticated USING (true);


-- <<< END FILE: 66_chatbot_faqs.sql

-- >>> BEGIN FILE: 67_chatbot_conversations_upgrade.sql
-- =============================================
-- 67: Chatbot Conversations Upgrade
-- Multi-conversation, auto-title, message rating
-- =============================================

-- Add title, active status, soft delete to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add rating to chat_messages (user feedback: up/down)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS rating TEXT CHECK (rating IN ('up', 'down'));

-- Conversation list index (student mode: list by user, sorted by latest)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_conversations 
  ON chat_sessions(user_id, last_message_at DESC) 
  WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- Latest message per session (for preview text)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_latest 
  ON chat_messages(session_id, created_at DESC);

-- Column comments
COMMENT ON COLUMN chat_sessions.title IS 'AI-generated or user-set conversation title';
COMMENT ON COLUMN chat_sessions.is_active IS 'Whether conversation is active (not archived)';
COMMENT ON COLUMN chat_sessions.deleted_at IS 'Soft delete timestamp, NULL means active';
COMMENT ON COLUMN chat_messages.rating IS 'User feedback: up (helpful) or down (not helpful)';


-- <<< END FILE: 67_chatbot_conversations_upgrade.sql

-- >>> BEGIN FILE: 68_custom_alert_rules.sql
-- Custom Alert Rules System
-- Allows admins to create custom alert rules with configurable thresholds

-- Custom alert rules table
CREATE TABLE IF NOT EXISTS custom_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,  -- NULL = all centers
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'revenue_drop', 'low_attendance', 'high_debt', 
        'pending_approvals', 'low_enrollment'
    )),
    condition_operator VARCHAR(10) NOT NULL CHECK (condition_operator IN (
        'gt', 'lt', 'gte', 'lte'
    )),
    threshold_value NUMERIC NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN (
        'info', 'warning', 'critical'
    )),
    notification_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert history table  
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES custom_alert_rules(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_value NUMERIC,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_center ON custom_alert_rules(center_id);
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_created_by ON custom_alert_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_active ON custom_alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_center ON alert_history(center_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unack ON alert_history(acknowledged) WHERE acknowledged = false;

-- RLS
ALTER TABLE custom_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Policies: service_role full access, authenticated users can read their own
CREATE POLICY "Service role full access on custom_alert_rules"
    ON custom_alert_rules FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own alert rules"
    ON custom_alert_rules FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Service role full access on alert_history"
    ON alert_history FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view alert history for their rules"
    ON alert_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM custom_alert_rules
            WHERE custom_alert_rules.id = alert_history.rule_id
            AND custom_alert_rules.created_by = auth.uid()
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_custom_alert_rules_updated_at
    BEFORE UPDATE ON custom_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_alert_rules_updated_at();

-- Add comment
COMMENT ON TABLE custom_alert_rules IS 'User-defined custom alert rules with configurable thresholds and notification channels';
COMMENT ON TABLE alert_history IS 'History of triggered alerts from custom alert rules';


-- <<< END FILE: 68_custom_alert_rules.sql

-- >>> BEGIN FILE: 69_consultation_requests_unification.sql
-- ============================================
-- CONSULTATION REQUESTS UNIFICATION
-- Canonical intake storage for Molly + website consultation forms
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'source_page'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN source_page TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'handoff_reason'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN handoff_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'transcript_summary'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN transcript_summary TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN assigned_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'contacted_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN contacted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_phone_center_active
    ON public.consultation_requests(phone, center_id, status);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_source_page
    ON public.consultation_requests(source_page);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_session_id
    ON public.consultation_requests(session_id)
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_id
    ON public.consultation_requests(user_id)
    WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.consultation_requests.source_page IS 'Path where the consultation request originated';
COMMENT ON COLUMN public.consultation_requests.user_id IS 'Authenticated user who created the consultation request when available';
COMMENT ON COLUMN public.consultation_requests.session_id IS 'Associated Molly chat session when the request came from chatbot handoff';
COMMENT ON COLUMN public.consultation_requests.handoff_reason IS 'Why the request was handed off to a human advisor';
COMMENT ON COLUMN public.consultation_requests.transcript_summary IS 'Short summary of the latest Molly conversation context';
COMMENT ON COLUMN public.consultation_requests.metadata IS 'Structured intake metadata including UTM parameters and form-specific fields';


-- <<< END FILE: 69_consultation_requests_unification.sql

-- >>> BEGIN FILE: 70_support_ticket_consultation_link.sql
-- ============================================================
-- SUPPORT TICKET <-> CONSULTATION FOLLOW-UP LINK
-- Version: 1.0
-- Description: Add canonical idempotent linkage for consultation follow-up threads
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'support_tickets'
      AND column_name = 'consultation_request_id'
  ) THEN
    ALTER TABLE public.support_tickets
      ADD COLUMN consultation_request_id UUID REFERENCES public.consultation_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_consultation_request_unique
  ON public.support_tickets(consultation_request_id)
  WHERE consultation_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_follow_up_ticket_id
  ON public.consultation_requests ((metadata->>'follow_up_ticket_id'));

COMMENT ON COLUMN public.support_tickets.consultation_request_id
  IS 'Canonical link to consultation_requests for idempotent follow-up thread creation';


-- <<< END FILE: 70_support_ticket_consultation_link.sql

-- >>> BEGIN FILE: 71_fix_consultation_requests.sql
-- ============================================================
-- FIX: Consultation Requests — Schema Drift + RLS Gap
-- Version: 71
-- Date: 2026-03-15
-- Description:
--   1. ALTER CHECK constraint to match current code statuses
--      Old: ('new', 'contacted', 'scheduled', 'enrolled', 'cancelled')
--      New: ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'lost')
--   2. Add TEACHER to RLS SELECT/UPDATE policies (backend allows TEACHER)
-- ============================================================

-- ============================================================
-- FIX 1: STATUS CHECK CONSTRAINT
-- ============================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the existing CHECK constraint on status column
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'consultation_requests'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';

    -- Drop old constraint if exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.consultation_requests DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped old CHECK constraint: %', constraint_name;
    END IF;

    -- Migrate legacy status values BEFORE applying new constraint
    UPDATE public.consultation_requests SET status = 'closed' WHERE status = 'enrolled';
    UPDATE public.consultation_requests SET status = 'lost'   WHERE status = 'cancelled';
END $$;

-- Add new CHECK constraint with correct statuses
ALTER TABLE public.consultation_requests
    ADD CONSTRAINT consultation_requests_status_check
    CHECK (status IN ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'lost'));

-- ============================================================
-- FIX 2: RLS POLICIES — ADD TEACHER ROLE
-- ============================================================

-- Recreate SELECT policy with TEACHER included
DROP POLICY IF EXISTS "Staff can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can view consultation requests"
ON public.consultation_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- Recreate UPDATE policy with TEACHER included
DROP POLICY IF EXISTS "Staff can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can update consultation requests"
ON public.consultation_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify CHECK constraint
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'consultation_requests'
  AND con.contype = 'c';

-- Verify RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'consultation_requests'
  AND schemaname = 'public';


-- <<< END FILE: 71_fix_consultation_requests.sql

-- >>> BEGIN FILE: 72_consultation_activities.sql
-- ============================================================
-- CONSULTATION ACTIVITY TIMELINE
-- Version: 72
-- Date: 2026-03-15
-- Description: Activity log for consultation requests — tracks
--   status changes, notes, claims, follow-up actions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultation_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_request_id UUID NOT NULL REFERENCES public.consultation_requests(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.consultation_activities IS 'Activity timeline for consultation requests — each status change, note, or action creates a row';
COMMENT ON COLUMN public.consultation_activities.action IS 'Action type: status_change, note_added, claimed, released, follow_up_created, follow_up_date_set';
COMMENT ON COLUMN public.consultation_activities.details IS 'Structured details: {old_status, new_status, note_excerpt, etc}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultation_activities_request_id
    ON public.consultation_activities(consultation_request_id);

CREATE INDEX IF NOT EXISTS idx_consultation_activities_created_at
    ON public.consultation_activities(created_at DESC);

-- RLS
ALTER TABLE public.consultation_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view consultation activities" ON public.consultation_activities;
CREATE POLICY "Staff can view consultation activities"
ON public.consultation_activities FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- Service role insert (backend uses service_role key)
DROP POLICY IF EXISTS "Service role can insert consultation activities" ON public.consultation_activities;
CREATE POLICY "Service role can insert consultation activities"
ON public.consultation_activities FOR INSERT
WITH CHECK (true);


-- <<< END FILE: 72_consultation_activities.sql

-- >>> BEGIN FILE: 73_unified_inbox.sql
-- ============================================================
-- MIGRATION 73: Unified Inbox
-- Extend support_tickets to absorb consultation requests
-- Auto-bridge: consultation_requests INSERT → support_ticket created
-- ============================================================

-- ============================================================
-- 1. EXTEND SUPPORT_TICKETS TABLE
-- ============================================================

-- Allow anonymous tickets (from chatbot/website guests)
ALTER TABLE public.support_tickets ALTER COLUMN created_by DROP NOT NULL;

-- Add source tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_name'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_phone'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_phone TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_email'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'consultation_metadata'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN consultation_metadata JSONB DEFAULT '{}';
    END IF;

    -- Subject column (some older tickets only have title)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN subject TEXT;
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.support_tickets.source IS 'Origin: manual, chatbot, website, website_course_detail';
COMMENT ON COLUMN public.support_tickets.guest_name IS 'Contact name for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.guest_phone IS 'Contact phone for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.guest_email IS 'Contact email for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.consultation_metadata IS 'CRM intake context: urgency, conversion, handoff, transcript, intake fields';

-- ============================================================
-- 2. EXPAND CATEGORY CONSTRAINT
-- ============================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'support_tickets'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.support_tickets DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_category_check
    CHECK (category IN ('general','technical','billing','course','schedule','certificate','consultation','other'));

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON public.support_tickets(source);

-- ============================================================
-- 4. AUTO-BRIDGE TRIGGER
-- When consultation_requests is inserted, auto-create support_ticket
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_ticket_from_consultation()
RETURNS TRIGGER AS $$
DECLARE
    new_ticket_number TEXT;
    metadata_obj JSONB;
    new_ticket_id UUID;
BEGIN
    -- Check if a ticket already exists for this consultation request
    IF EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE consultation_request_id = NEW.id
    ) THEN
        RETURN NEW;
    END IF;

    -- Generate ticket number
    new_ticket_number := generate_ticket_number();

    -- Build metadata
    metadata_obj := jsonb_build_object(
        'urgency_level', COALESCE((NEW.metadata->>'urgency_level'), 'warm'),
        'handoff_reason', COALESCE(NEW.handoff_reason, ''),
        'transcript_summary', COALESCE(NEW.transcript_summary, ''),
        'preferred_time', COALESCE(NEW.preferred_time, ''),
        'intake', jsonb_build_object(
            'goal', NEW.metadata->>'goal',
            'level', NEW.metadata->>'level',
            'course', NEW.metadata->>'course',
            'message', NEW.metadata->>'message'
        )
    );

    INSERT INTO public.support_tickets (
        ticket_number,
        subject,
        category,
        priority,
        status,
        source,
        created_by,
        guest_name,
        guest_phone,
        guest_email,
        consultation_request_id,
        consultation_metadata,
        center_id,
        created_at
    ) VALUES (
        new_ticket_number,
        'Tư vấn: ' || COALESCE(NEW.full_name, 'Khách hàng'),
        'consultation',
        CASE
            WHEN (NEW.metadata->>'urgency_level') = 'hot' THEN 'high'
            WHEN (NEW.metadata->>'urgency_level') = 'cold' THEN 'low'
            ELSE 'normal'
        END,
        'open',
        COALESCE(NEW.source, 'chatbot'),
        NEW.user_id,  -- NULL for anonymous visitors, UUID for authenticated students
        NEW.full_name,
        NEW.phone,
        NEW.email,
        NEW.id,
        metadata_obj,
        NEW.center_id,
        NEW.created_at
    )
    RETURNING id INTO new_ticket_id;

    -- Update consultation_request with the ticket link
    UPDATE public.consultation_requests
    SET follow_up_ticket_id = new_ticket_id
    WHERE id = NEW.id
      AND follow_up_ticket_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_consultation_to_ticket ON public.consultation_requests;
CREATE TRIGGER trg_consultation_to_ticket
    AFTER INSERT ON public.consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_ticket_from_consultation();

-- ============================================================
-- 5. BACKFILL: Create tickets for existing consultation_requests
-- that do NOT already have a linked ticket
-- ============================================================

DO $$
DECLARE
    rec RECORD;
    new_ticket_number TEXT;
    meta JSONB;
    new_ticket_id UUID;
BEGIN
    FOR rec IN
        SELECT cr.* FROM public.consultation_requests cr
        LEFT JOIN public.support_tickets st ON st.consultation_request_id = cr.id
        WHERE st.id IS NULL
    LOOP
        new_ticket_number := generate_ticket_number();
        meta := jsonb_build_object(
            'urgency_level', COALESCE((rec.metadata->>'urgency_level'), 'warm'),
            'handoff_reason', COALESCE(rec.handoff_reason, ''),
            'transcript_summary', COALESCE(rec.transcript_summary, ''),
            'preferred_time', COALESCE(rec.preferred_time, '')
        );

        INSERT INTO public.support_tickets (
            ticket_number, subject, category, priority, status, source,
            guest_name, guest_phone, guest_email,
            consultation_request_id, consultation_metadata,
            center_id, created_at
        ) VALUES (
            new_ticket_number,
            'Tư vấn: ' || COALESCE(rec.full_name, 'Khách hàng'),
            'consultation', 'normal', 'open',
            COALESCE(rec.source, 'chatbot'),
            rec.full_name, rec.phone, rec.email,
            rec.id, meta,
            rec.center_id, rec.created_at
        )
        RETURNING id INTO new_ticket_id;

        -- Link back
        UPDATE public.consultation_requests
        SET follow_up_ticket_id = new_ticket_id
        WHERE id = rec.id
          AND follow_up_ticket_id IS NULL;
    END LOOP;
END;
$$;

-- ============================================================
-- DONE
-- ============================================================


-- <<< END FILE: 73_unified_inbox.sql

-- >>> BEGIN FILE: 74_fix_rls_unified_inbox.sql
-- ============================================================
-- MIGRATION 74: Fix RLS policies for unified inbox
-- Allow students to SELECT/INSERT ticket_messages via
-- consultation_request_id → user_id chain
-- (Required for Supabase Realtime to work for student ↔ admin chat)
-- ============================================================

-- Drop and recreate ticket_messages SELECT policy
DROP POLICY IF EXISTS "ticket_messages_select_policy" ON public.ticket_messages;

CREATE POLICY "ticket_messages_select_policy" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        -- Direct creator
        t.created_by = auth.uid()
        -- Assigned staff
        OR t.assigned_to = auth.uid()
        -- Via consultation_request (for trigger-created tickets where created_by may be NULL)
        OR EXISTS (
          SELECT 1 FROM public.consultation_requests cr
          WHERE cr.id = t.consultation_request_id
          AND cr.user_id = auth.uid()
        )
        -- Staff roles (SUPER_ADMIN, CENTER_MANAGER, TEACHER)
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
    -- Internal notes: only staff can see
    AND (
      is_internal = false
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
      )
    )
  );

-- Drop and recreate ticket_messages INSERT policy
DROP POLICY IF EXISTS "ticket_messages_insert_policy" ON public.ticket_messages;

CREATE POLICY "ticket_messages_insert_policy" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        -- Direct creator
        t.created_by = auth.uid()
        -- Assigned staff
        OR t.assigned_to = auth.uid()
        -- Via consultation_request (for trigger-created tickets)
        OR EXISTS (
          SELECT 1 FROM public.consultation_requests cr
          WHERE cr.id = t.consultation_request_id
          AND cr.user_id = auth.uid()
        )
        -- Staff roles
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
  );

-- Also update support_tickets SELECT policy to allow student access via consultation chain
DROP POLICY IF EXISTS "support_tickets_select_policy" ON public.support_tickets;

CREATE POLICY "support_tickets_select_policy" ON public.support_tickets
  FOR SELECT USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    -- Via consultation_request (for trigger-created tickets)
    OR EXISTS (
      SELECT 1 FROM public.consultation_requests cr
      WHERE cr.id = consultation_request_id
      AND cr.user_id = auth.uid()
    )
    -- Staff roles
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );


-- <<< END FILE: 74_fix_rls_unified_inbox.sql

-- >>> BEGIN FILE: 75_student_notes.sql
-- ============================================================
-- 75: Student Notes & Teaching Notes
-- Description: Bảng nhận xét học viên và ghi chú giảng dạy per-session
-- ============================================================

-- 1. Student Notes table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'general'
        CHECK (note_type IN ('academic', 'behavior', 'general')),
    is_shared_with_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_notes_teacher_student
    ON public.student_notes(teacher_id, student_id, class_id);

CREATE INDEX IF NOT EXISTS idx_student_notes_session
    ON public.student_notes(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_notes_class
    ON public.student_notes(class_id, created_at DESC);

-- 3. Enable RLS (safety layer, backend uses service key so bypassed but still recommended)
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 4. Teaching notes columns on sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS homework TEXT;

-- 5. Comments
COMMENT ON TABLE public.student_notes IS 'Nhận xét giáo viên về học viên theo lớp/buổi';
COMMENT ON COLUMN public.student_notes.note_type IS 'academic = học tập, behavior = thái độ, general = chung';
COMMENT ON COLUMN public.student_notes.is_shared_with_parent IS 'Chia sẻ với phụ huynh hay không';
COMMENT ON COLUMN public.sessions.teacher_notes IS 'Ghi chú nội dung đã dạy trong buổi';
COMMENT ON COLUMN public.sessions.homework IS 'Bài tập về nhà cho buổi này';


-- <<< END FILE: 75_student_notes.sql

-- >>> BEGIN FILE: 76_core_gaps_assessment_assignments_contracts.sql
-- =====================================================
-- MIGRATION 76: Core Gaps - Assignments & Labor Contracts
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1) Structured assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  legacy_session_id UUID UNIQUE REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  due_at TIMESTAMPTZ,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_center_id ON public.assignments(center_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status_due_at ON public.assignments(status, due_at);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'resubmitted', 'graded')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  grade NUMERIC(8,2),
  graded_at TIMESTAMPTZ,
  grader_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_user_id ON public.assignment_submissions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

CREATE TABLE IF NOT EXISTS public.assignment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_feedback_submission_id ON public.assignment_feedback(submission_id);

-- -----------------------------------------------------
-- 2) Labor contracts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contract_code TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'full_time',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'amended', 'expired', 'terminated')),
  effective_from DATE NOT NULL,
  effective_to DATE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  current_version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (center_id, contract_code)
);

CREATE INDEX IF NOT EXISTS idx_hr_contracts_center_id ON public.hr_contracts(center_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_staff_user_id ON public.hr_contracts(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_status ON public.hr_contracts(status);

CREATE TABLE IF NOT EXISTS public.hr_contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.hr_contracts(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'activate', 'amend', 'expire', 'terminate', 'restore')),
  from_status TEXT,
  to_status TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  effective_date DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_contract_events_contract_id ON public.hr_contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_hr_contract_events_center_id ON public.hr_contract_events(center_id);
CREATE INDEX IF NOT EXISTS idx_hr_contract_events_created_at ON public.hr_contract_events(created_at DESC);

-- -----------------------------------------------------
-- 3) Row Level Security for new tables
-- -----------------------------------------------------
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_contract_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assignments_center_isolation_select ON public.assignments;
CREATE POLICY assignments_center_isolation_select ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  );

DROP POLICY IF EXISTS assignments_center_isolation_modify ON public.assignments;
CREATE POLICY assignments_center_isolation_modify ON public.assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  );

DROP POLICY IF EXISTS assignment_submissions_center_isolation_select ON public.assignment_submissions;
CREATE POLICY assignment_submissions_center_isolation_select ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_submissions_center_isolation_modify ON public.assignment_submissions;
CREATE POLICY assignment_submissions_center_isolation_modify ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_feedback_center_isolation_select ON public.assignment_feedback;
CREATE POLICY assignment_feedback_center_isolation_select ON public.assignment_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_feedback_center_isolation_modify ON public.assignment_feedback;
CREATE POLICY assignment_feedback_center_isolation_modify ON public.assignment_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS hr_contracts_center_isolation_select ON public.hr_contracts;
CREATE POLICY hr_contracts_center_isolation_select ON public.hr_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  );

DROP POLICY IF EXISTS hr_contracts_center_isolation_modify ON public.hr_contracts;
CREATE POLICY hr_contracts_center_isolation_modify ON public.hr_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  );

DROP POLICY IF EXISTS hr_contract_events_center_isolation_select ON public.hr_contract_events;
CREATE POLICY hr_contract_events_center_isolation_select ON public.hr_contract_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  );

DROP POLICY IF EXISTS hr_contract_events_center_isolation_modify ON public.hr_contract_events;
CREATE POLICY hr_contract_events_center_isolation_modify ON public.hr_contract_events
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  );

-- -----------------------------------------------------
-- 4) Seed feature flags using existing system_settings
-- -----------------------------------------------------
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES
  (NULL, 'feature_core_online_assessment_engine', '{"enabled": false}'::jsonb, 'Feature flag for online assessment engine rollout'),
  (NULL, 'feature_core_structured_assignments_management', '{"enabled": false}'::jsonb, 'Feature flag for structured assignments rollout'),
  (NULL, 'feature_core_labor_contract_management', '{"enabled": false}'::jsonb, 'Feature flag for labor contract rollout')
ON CONFLICT (key) WHERE center_id IS NULL
DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

COMMIT;


-- <<< END FILE: 76_core_gaps_assessment_assignments_contracts.sql

-- >>> BEGIN FILE: 76_teacher_availability_type.sql
-- ============================================================
-- Migration 76: Persist availability type for teacher slots
-- Purpose: keep `preferred` selection after save/reload
-- ============================================================

ALTER TABLE public.teacher_availability
ADD COLUMN IF NOT EXISTS type VARCHAR(20);

UPDATE public.teacher_availability
SET type = 'available'
WHERE type IS NULL;

ALTER TABLE public.teacher_availability
ALTER COLUMN type SET DEFAULT 'available';

ALTER TABLE public.teacher_availability
ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.teacher_availability
DROP CONSTRAINT IF EXISTS teacher_availability_type_check;

ALTER TABLE public.teacher_availability
ADD CONSTRAINT teacher_availability_type_check
CHECK (type IN ('available', 'preferred'));

CREATE INDEX IF NOT EXISTS idx_teacher_availability_type ON public.teacher_availability(type);

COMMENT ON COLUMN public.teacher_availability.type IS 'Loại slot: available (có thể dạy), preferred (ưu tiên dạy)';



-- <<< END FILE: 76_teacher_availability_type.sql

-- >>> BEGIN FILE: 77_leave_requests_upgrade.sql
-- ============================================================
-- LEAVE REQUESTS — RLS UPGRADE
-- Version: 77
-- Description: Thêm RLS policies còn thiếu cho leave_requests:
--   1. UPDATE policy cho giáo viên (edit đơn pending của mình)
--   2. DELETE policy cho giáo viên (thu hồi đơn pending của mình)
--
-- NOTE: Production DB đã có đầy đủ schema:
--   - staff_id (không phải teacher_id)
--   - reviewer_notes
--   - attachments JSONB DEFAULT '[]'
--   - total_days INTEGER
--   - leave_type hỗ trợ: annual, sick, personal, maternity, compensatory, other
--   - status hỗ trợ: pending, approved, rejected, cancelled
-- ============================================================

-- Thêm RLS UPDATE: Giáo viên có thể sửa đơn pending của chính mình
CREATE POLICY "Users can update own pending leave requests"
ON public.leave_requests
FOR UPDATE
USING (staff_id = auth.uid() AND status = 'pending')
WITH CHECK (staff_id = auth.uid() AND status = 'pending');

-- Thêm RLS DELETE: Giáo viên có thể xóa đơn pending của chính mình
CREATE POLICY "Users can delete own pending leave requests"
ON public.leave_requests
FOR DELETE
USING (staff_id = auth.uid() AND status = 'pending');


-- <<< END FILE: 77_leave_requests_upgrade.sql

-- >>> BEGIN FILE: 97_notifications_sent_by.sql
-- ============================================================
-- NOTIFICATIONS: Add sent_by column
-- Version: 97
-- Description: Track who sent each notification (admin/manager)
--              so admin history can query by sender
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_notifications_sent_by
  ON public.notifications(sent_by, created_at DESC)
  WHERE sent_by IS NOT NULL;

COMMENT ON COLUMN public.notifications.sent_by IS 'User ID of the admin/manager who sent this notification (NULL for system-generated)';


-- <<< END FILE: 97_notifications_sent_by.sql

-- >>> BEGIN FILE: 98_custom_alert_rules_rls.sql
-- Fix RLS policies for custom_alert_rules
-- The INSERT/UPDATE/DELETE policies were missing, causing 500 errors on POST /api/admin/custom-alerts

-- INSERT policy: authenticated users can create their own rules
CREATE POLICY "Users can insert own custom alert rules"
    ON custom_alert_rules FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- UPDATE policy: users can update their own rules
CREATE POLICY "Users can update own custom alert rules"
    ON custom_alert_rules FOR UPDATE
    USING (auth.uid() = created_by);

-- DELETE policy: users can delete their own rules
CREATE POLICY "Users can delete own custom alert rules"
    ON custom_alert_rules FOR DELETE
    USING (auth.uid() = created_by);

-- Also fix alert_history: authenticated users can acknowledge their own alerts
CREATE POLICY "Users can update own alert history"
    ON alert_history FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM custom_alert_rules
            WHERE custom_alert_rules.id = alert_history.rule_id
            AND custom_alert_rules.created_by = auth.uid()
        )
    );

COMMENT ON POLICY "Users can insert own custom alert rules" ON custom_alert_rules IS 'Allows authenticated users to create their own custom alert rules';
COMMENT ON POLICY "Users can update own custom alert rules" ON custom_alert_rules IS 'Allows users to update their own custom alert rules';
COMMENT ON POLICY "Users can delete own custom alert rules" ON custom_alert_rules IS 'Allows users to delete their own custom alert rules';


-- <<< END FILE: 98_custom_alert_rules_rls.sql

-- >>> BEGIN FILE: 99_payroll_dispute_notifications.sql
-- ============================================================
-- PAYROLL DISPUTES: Notify managers on new dispute submission
-- Version: 99
-- Description: Create in-app notifications for center managers
--              and super admins when a teacher submits a payroll dispute.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_managers_on_payroll_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name TEXT;
  v_center_id UUID;
  v_period_label TEXT;
BEGIN
  SELECT u.full_name, u.center_id
  INTO v_teacher_name, v_center_id
  FROM public.users u
  WHERE u.id = NEW.teacher_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lpad(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
  INTO v_period_label
  FROM public.payroll p
  WHERE p.id = NEW.payroll_id;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  )
  SELECT
    manager_user.id,
    v_center_id,
    'payroll_dispute_submitted',
    'Có khiếu nại lương mới cần xử lý',
    COALESCE(v_teacher_name, 'Giảng viên') || ' đã gửi khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || '.',
    NEW.id,
    'payroll_dispute',
    NEW.teacher_id
  FROM public.users manager_user
  JOIN public.roles role_record ON role_record.id = manager_user.role_id
  WHERE manager_user.center_id = v_center_id
    AND role_record.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    AND manager_user.id <> NEW.teacher_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_managers_on_payroll_dispute ON public.payroll_disputes;

CREATE TRIGGER trigger_notify_managers_on_payroll_dispute
AFTER INSERT ON public.payroll_disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_managers_on_payroll_dispute();

COMMENT ON FUNCTION public.notify_managers_on_payroll_dispute() IS 'Creates manager notifications when a teacher submits a payroll dispute';


-- <<< END FILE: 99_payroll_dispute_notifications.sql

-- >>> BEGIN FILE: 100_payroll_active_dispute_guard.sql
-- ============================================================
-- PAYROLL DISPUTES: Guard one active dispute per payroll/teacher
-- Version: 100
-- Description: Prevent concurrent pending/reviewing disputes for the same payroll.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_disputes_one_active_per_teacher
ON public.payroll_disputes (payroll_id, teacher_id)
WHERE status IN ('pending', 'reviewing');


-- <<< END FILE: 100_payroll_active_dispute_guard.sql

-- >>> BEGIN FILE: 101_payroll_dispute_realtime_updates.sql
-- ============================================================
-- PAYROLL DISPUTE REALTIME UPDATES
-- Version: 101
-- Description: Re-assert manager notifications for new disputes,
--              notify teachers when dispute status changes,
--              and publish payroll_disputes to Supabase Realtime.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_managers_on_payroll_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name TEXT;
  v_center_id UUID;
  v_period_label TEXT;
BEGIN
  SELECT u.full_name, u.center_id
  INTO v_teacher_name, v_center_id
  FROM public.users u
  WHERE u.id = NEW.teacher_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT LPAD(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
  INTO v_period_label
  FROM public.payroll p
  WHERE p.id = NEW.payroll_id;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  )
  SELECT
    manager_user.id,
    v_center_id,
    'payroll_dispute_submitted',
    'Có khiếu nại lương mới cần xử lý',
    COALESCE(v_teacher_name, 'Giảng viên') || ' đã gửi khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || '.',
    NEW.id,
    'payroll_dispute',
    NEW.teacher_id
  FROM public.users manager_user
  JOIN public.roles role_record ON role_record.id = manager_user.role_id
  WHERE manager_user.center_id = v_center_id
    AND role_record.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    AND manager_user.id <> NEW.teacher_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_managers_on_payroll_dispute ON public.payroll_disputes;

CREATE TRIGGER trigger_notify_managers_on_payroll_dispute
AFTER INSERT ON public.payroll_disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_managers_on_payroll_dispute();

CREATE OR REPLACE FUNCTION public.notify_teacher_on_payroll_dispute_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id UUID;
  v_period_label TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF NEW.teacher_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status
    AND COALESCE(BTRIM(NEW.admin_response), '') IS NOT DISTINCT FROM COALESCE(BTRIM(OLD.admin_response), '') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('reviewing', 'resolved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT u.center_id
  INTO v_center_id
  FROM public.users u
  WHERE u.id = NEW.teacher_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT LPAD(COALESCE(p.period_month, 0)::TEXT, 2, '0') || '/' || COALESCE(p.period_year, EXTRACT(YEAR FROM NOW())::INT)::TEXT
  INTO v_period_label
  FROM public.payroll p
  WHERE p.id = NEW.payroll_id;

  CASE NEW.status
    WHEN 'reviewing' THEN
      v_title := 'Khiếu nại lương đang được xem xét';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đang được quản lý xem xét.';
    WHEN 'resolved' THEN
      v_title := 'Khiếu nại lương đã được giải quyết';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đã được quản lý giải quyết.';
    WHEN 'rejected' THEN
      v_title := 'Khiếu nại lương đã bị từ chối';
      v_message := 'Khiếu nại cho kỳ lương ' || COALESCE(v_period_label, 'gần nhất') || ' đã bị quản lý từ chối.';
    ELSE
      RETURN NEW;
  END CASE;

  IF COALESCE(BTRIM(NEW.admin_response), '') <> '' THEN
    v_message := v_message || ' Phản hồi: ' || BTRIM(NEW.admin_response);
  END IF;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  ) VALUES (
    NEW.teacher_id,
    v_center_id,
    'payroll_dispute_' || NEW.status,
    v_title,
    v_message,
    NEW.id,
    'payroll_dispute',
    NEW.resolved_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_teacher_on_payroll_dispute_status ON public.payroll_disputes;

CREATE TRIGGER trigger_notify_teacher_on_payroll_dispute_status
AFTER UPDATE OF status, admin_response ON public.payroll_disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_teacher_on_payroll_dispute_status();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payroll_disputes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payroll_disputes;
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_teacher_on_payroll_dispute_status() IS 'Creates teacher notifications when payroll dispute status changes';


-- <<< END FILE: 101_payroll_dispute_realtime_updates.sql

-- >>> BEGIN FILE: 102_leave_requests_notifications.sql
-- ============================================================
-- LEAVE REQUESTS REALTIME & NOTIFICATIONS
-- Version: 102
-- Description: Add DB triggers to notify managers on new leave
--              requests, notify teachers on status changes,
--              and publish leave_requests to Supabase Realtime.
-- ============================================================

-- Notify managers when a teacher submits a new leave request
CREATE OR REPLACE FUNCTION public.notify_managers_on_leave_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name TEXT;
  v_center_id UUID;
  v_date_range TEXT;
BEGIN
  SELECT u.full_name, u.center_id
  INTO v_teacher_name, v_center_id
  FROM public.users u
  WHERE u.id = NEW.staff_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date_range := COALESCE(TO_CHAR(NEW.start_date, 'DD/MM/YYYY'), '?') || ' – ' ||
                 COALESCE(TO_CHAR(NEW.end_date, 'DD/MM/YYYY'), '?');

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  )
  SELECT
    manager_user.id,
    v_center_id,
    'leave_request_submitted',
    'Có đơn xin nghỉ mới cần duyệt',
    COALESCE(v_teacher_name, 'Một giáo viên') || ' đã gửi đơn xin nghỉ (' || v_date_range || ').',
    NEW.id,
    'leave_request',
    NEW.staff_id
  FROM public.users manager_user
  JOIN public.roles role_record ON role_record.id = manager_user.role_id
  WHERE manager_user.center_id = v_center_id
    AND role_record.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    AND manager_user.id <> NEW.staff_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_managers_on_leave_request ON public.leave_requests;

CREATE TRIGGER trigger_notify_managers_on_leave_request
AFTER INSERT ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_managers_on_leave_request();

-- Notify teachers when their leave request is approved or rejected
CREATE OR REPLACE FUNCTION public.notify_teacher_on_leave_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id UUID;
  v_date_range TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF NEW.staff_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only fire on meaningful status changes
  IF NEW.status IS NOT DISTINCT FROM OLD.status
    AND COALESCE(BTRIM(NEW.reviewer_notes), '') IS NOT DISTINCT FROM COALESCE(BTRIM(OLD.reviewer_notes), '') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT u.center_id
  INTO v_center_id
  FROM public.users u
  WHERE u.id = NEW.staff_id;

  IF v_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date_range := COALESCE(TO_CHAR(NEW.start_date, 'DD/MM/YYYY'), '?') || ' – ' ||
                 COALESCE(TO_CHAR(NEW.end_date, 'DD/MM/YYYY'), '?');

  IF NEW.status = 'approved' THEN
    v_title := 'Đơn xin nghỉ đã được duyệt';
    v_message := 'Đơn xin nghỉ của bạn (' || v_date_range || ') đã được duyệt.';
  ELSIF NEW.status = 'rejected' THEN
    v_title := 'Đơn xin nghỉ đã bị từ chối';
    v_message := 'Đơn xin nghỉ của bạn (' || v_date_range || ') đã bị từ chối.';
    IF COALESCE(BTRIM(NEW.reviewer_notes), '') <> '' THEN
      v_message := v_message || ' Lý do: ' || BTRIM(NEW.reviewer_notes);
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    center_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    sent_by
  ) VALUES (
    NEW.staff_id,
    v_center_id,
    'leave_request_' || NEW.status,
    v_title,
    v_message,
    NEW.id,
    'leave_request',
    NEW.reviewed_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_teacher_on_leave_request_status ON public.leave_requests;

CREATE TRIGGER trigger_notify_teacher_on_leave_request_status
AFTER UPDATE OF status, reviewer_notes ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_teacher_on_leave_request_status();

-- Add leave_requests to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'leave_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_managers_on_leave_request() IS 'Creates manager notifications when a teacher submits a leave request';
COMMENT ON FUNCTION public.notify_teacher_on_leave_request_status() IS 'Creates teacher notifications when their leave request is approved or rejected';


-- <<< END FILE: 102_leave_requests_notifications.sql

-- >>> BEGIN FILE: 103_assessment_center_scope.sql
BEGIN;

ALTER TABLE public.assessment_tests
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.assessment_tests
SET center_id = u.center_id
FROM public.users u
WHERE assessment_tests.created_by = u.id
  AND assessment_tests.center_id IS NULL;

UPDATE public.assessment_questions q
SET center_id = t.center_id
FROM public.assessment_tests t
WHERE q.test_id = t.id
  AND q.center_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_tests_center_id ON public.assessment_tests(center_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_center_id ON public.assessment_questions(center_id);

COMMIT;


-- <<< END FILE: 103_assessment_center_scope.sql

-- >>> BEGIN FILE: seed_bank_config.sql
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'bank_config',
  '{
    "bankId": "VCB",
    "bankName": "Vietcombank",
    "accountNo": "1029849106",
    "accountName": "SKILL MASTER EDU",
    "template": "compact2"
  }'::jsonb,
  'Cau hinh ngan hang nhan thanh toan VietQR'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();


-- <<< END FILE: seed_bank_config.sql
