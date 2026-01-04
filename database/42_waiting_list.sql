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
