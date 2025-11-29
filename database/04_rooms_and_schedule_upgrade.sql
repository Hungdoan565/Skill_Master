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
