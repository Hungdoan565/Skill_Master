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
