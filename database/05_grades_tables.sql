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
