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
