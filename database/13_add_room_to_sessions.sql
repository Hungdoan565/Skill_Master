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
