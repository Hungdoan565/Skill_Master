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
