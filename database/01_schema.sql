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
