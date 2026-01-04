-- ============================================================
-- RUN MIGRATION 42: Waiting List System
-- Date: 2026-01-04
-- 
-- HƯỚNG DẪN CHẠY:
-- 1. Mở Supabase Dashboard
-- 2. Vào SQL Editor
-- 3. Copy toàn bộ nội dung file này
-- 4. Paste vào editor và click "Run"
-- ============================================================

-- Start transaction
BEGIN;

-- ============================================================
-- 1. CREATE WAITING_LIST TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0 CHECK (priority IN (0, 1, 2)),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'cancelled')),
  notified_at TIMESTAMPTZ,
  notified_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, class_id)
);

COMMENT ON TABLE public.waiting_list IS 'Danh sách chờ cho các lớp đã full';
COMMENT ON COLUMN public.waiting_list.priority IS '0=normal, 1=priority, 2=urgent';
COMMENT ON COLUMN public.waiting_list.status IS 'waiting|notified|enrolled|cancelled';
COMMENT ON COLUMN public.waiting_list.notified_at IS 'Thời điểm thông báo có slot';
COMMENT ON COLUMN public.waiting_list.notified_expires_at IS 'Hết hạn notification (7 ngày)';

RAISE NOTICE '✅ Created table: waiting_list';

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_waiting_list_class_id ON public.waiting_list(class_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_student_id ON public.waiting_list(student_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON public.waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_priority ON public.waiting_list(priority);

RAISE NOTICE '✅ Created indexes for waiting_list';

-- ============================================================
-- 3. CREATE VIEW: ACTIVE WAITING LIST WITH QUEUE POSITION
-- ============================================================

CREATE OR REPLACE VIEW public.active_waiting_list AS
SELECT 
  wl.id,
  wl.student_id,
  wl.class_id,
  wl.priority,
  wl.status,
  wl.notified_at,
  wl.notified_expires_at,
  wl.notes,
  wl.created_at,
  u.full_name AS student_name,
  u.phone AS student_phone,
  c.name AS class_name,
  c.capacity AS class_capacity,
  -- Queue position calculated by priority DESC, created_at ASC
  ROW_NUMBER() OVER (
    PARTITION BY wl.class_id 
    ORDER BY wl.priority DESC, wl.created_at ASC
  ) AS queue_position
FROM waiting_list wl
INNER JOIN users u ON wl.student_id = u.id
INNER JOIN classes c ON wl.class_id = c.id
WHERE wl.status IN ('waiting', 'notified');

COMMENT ON VIEW public.active_waiting_list IS 'Waiting list với queue position tự động tính';

RAISE NOTICE '✅ Created view: active_waiting_list';

-- ============================================================
-- 4. FUNCTION: ADD TO WAITING LIST
-- ============================================================

CREATE OR REPLACE FUNCTION add_to_waiting_list(
  p_student_id UUID,
  p_class_id UUID,
  p_priority INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_already_enrolled BOOLEAN;
  v_already_waiting BOOLEAN;
  v_new_id UUID;
BEGIN
  -- Check if student already enrolled in this class
  SELECT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE student_id = p_student_id 
      AND class_id = p_class_id 
      AND status = 'active'
  ) INTO v_already_enrolled;

  IF v_already_enrolled THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Học viên đã đăng ký lớp này'
    );
  END IF;

  -- Check if already in waiting list
  SELECT EXISTS (
    SELECT 1 FROM waiting_list
    WHERE student_id = p_student_id 
      AND class_id = p_class_id
      AND status IN ('waiting', 'notified')
  ) INTO v_already_waiting;

  IF v_already_waiting THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Học viên đã có trong waiting list'
    );
  END IF;

  -- Add to waiting list
  INSERT INTO waiting_list (
    student_id, class_id, priority, notes, created_at
  ) VALUES (
    p_student_id, p_class_id, p_priority, p_notes, NOW()
  )
  ON CONFLICT (student_id, class_id) 
  DO UPDATE SET
    priority = EXCLUDED.priority,
    notes = EXCLUDED.notes,
    status = 'waiting',
    updated_at = NOW()
  RETURNING id INTO v_new_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Đã thêm vào waiting list',
    'id', v_new_id
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: add_to_waiting_list';

-- ============================================================
-- 5. FUNCTION: NOTIFY NEXT IN QUEUE
-- ============================================================

CREATE OR REPLACE FUNCTION notify_next_in_queue(
  p_class_id UUID,
  p_slots_available INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_notified_count INTEGER := 0;
  v_student_ids UUID[];
BEGIN
  -- Get top N students in queue (by priority DESC, created_at ASC)
  SELECT ARRAY_AGG(student_id)
  INTO v_student_ids
  FROM (
    SELECT student_id
    FROM waiting_list
    WHERE class_id = p_class_id
      AND status = 'waiting'
    ORDER BY priority DESC, created_at ASC
    LIMIT p_slots_available
  ) sub;

  -- Update their status to notified
  IF v_student_ids IS NOT NULL THEN
    UPDATE waiting_list
    SET 
      status = 'notified',
      notified_at = NOW(),
      notified_expires_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
    WHERE class_id = p_class_id
      AND student_id = ANY(v_student_ids);

    GET DIAGNOSTICS v_notified_count = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'success', true,
    'notified_count', v_notified_count,
    'message', format('Đã thông báo %s học viên', v_notified_count)
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: notify_next_in_queue';

-- ============================================================
-- 6. FUNCTION: COMPLETE WAITING LIST ENTRY
-- ============================================================

CREATE OR REPLACE FUNCTION complete_waiting_list_entry(
  p_waiting_list_id UUID,
  p_status VARCHAR(20) -- 'enrolled' or 'cancelled'
)
RETURNS JSON AS $$
BEGIN
  -- Validate status
  IF p_status NOT IN ('enrolled', 'cancelled') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Status phải là enrolled hoặc cancelled'
    );
  END IF;

  -- Update status
  UPDATE waiting_list
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_waiting_list_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Waiting list entry không tồn tại'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', format('Đã cập nhật status: %s', p_status)
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: complete_waiting_list_entry';

-- ============================================================
-- 7. FUNCTION: AUTO EXPIRE NOTIFICATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auto_expire_waiting_list_notifications()
RETURNS JSON AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Reset notified entries that expired (>7 days) back to waiting
  UPDATE waiting_list
  SET 
    status = 'waiting',
    notified_at = NULL,
    notified_expires_at = NULL,
    updated_at = NOW()
  WHERE status = 'notified'
    AND notified_expires_at < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'expired_count', v_expired_count,
    'message', format('Đã reset %s notification quá hạn', v_expired_count)
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: auto_expire_waiting_list_notifications';

-- ============================================================
-- 8. FUNCTION: GET WAITING LIST STATISTICS
-- ============================================================

CREATE OR REPLACE FUNCTION get_waiting_list_statistics(p_center_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_normal INTEGER;
  v_priority INTEGER;
  v_urgent INTEGER;
  v_waiting INTEGER;
  v_notified INTEGER;
  v_enrolled INTEGER;
BEGIN
  -- Count by priority and status
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE priority = 0) AS normal,
    COUNT(*) FILTER (WHERE priority = 1) AS priority,
    COUNT(*) FILTER (WHERE priority = 2) AS urgent,
    COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
    COUNT(*) FILTER (WHERE status = 'notified') AS notified,
    COUNT(*) FILTER (WHERE status = 'enrolled') AS enrolled
  INTO v_total, v_normal, v_priority, v_urgent, v_waiting, v_notified, v_enrolled
  FROM waiting_list wl
  INNER JOIN classes c ON wl.class_id = c.id
  WHERE (p_center_id IS NULL OR c.center_id = p_center_id);

  RETURN json_build_object(
    'total_entries', v_total,
    'by_priority', json_build_object(
      'normal', v_normal,
      'priority', v_priority,
      'urgent', v_urgent
    ),
    'by_status', json_build_object(
      'waiting', v_waiting,
      'notified', v_notified,
      'enrolled', v_enrolled
    )
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: get_waiting_list_statistics';

-- Commit transaction
COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check table created
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'waiting_list'
ORDER BY ordinal_position;

-- Check view
SELECT * FROM active_waiting_list LIMIT 5;

-- Check statistics
SELECT get_waiting_list_statistics();
