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
