-- =============================================
-- Migration: Trial Enrollment Support
-- Version: 41
-- Description: Add trial class workflow
-- Author: System
-- Date: 2025-01-XX
-- =============================================

-- ====================
-- 1. ADD ENROLLMENT TYPE
-- ====================

-- Add enrollment_type column to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) DEFAULT 'regular';

-- Add check constraint for enrollment_type
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_enrollment_type_check;

ALTER TABLE enrollments
ADD CONSTRAINT enrollments_enrollment_type_check
CHECK (enrollment_type IN ('trial', 'regular', 'makeup'));

-- Add trial_expires_at for trial tracking
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Add is_trial_converted flag
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS is_trial_converted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN enrollments.enrollment_type IS 'Type of enrollment: trial (trial class), regular (paid enrollment), makeup (makeup class)';
COMMENT ON COLUMN enrollments.trial_expires_at IS 'Trial expiration date (auto-calculated: enrollment date + 3 days)';
COMMENT ON COLUMN enrollments.is_trial_converted IS 'Whether trial was converted to regular enrollment';

-- ====================
-- 2. CREATE INDEX
-- ====================

-- Index for trial enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_trial_type 
ON enrollments(enrollment_type, trial_expires_at) 
WHERE enrollment_type = 'trial';

-- Index for trial conversion tracking
CREATE INDEX IF NOT EXISTS idx_enrollments_trial_converted 
ON enrollments(student_id, is_trial_converted) 
WHERE enrollment_type = 'trial';

-- ====================
-- 3. CREATE VIEW: Active Trials
-- ====================

CREATE OR REPLACE VIEW active_trial_enrollments AS
SELECT 
  e.id,
  e.student_id,
  e.class_id,
  e.enrolled_at,
  e.trial_expires_at,
  e.status,
  e.is_trial_converted,
  u.full_name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  c.name AS class_name,
  c.code AS class_code,
  c.start_date AS class_start_date,
  -- Calculate days remaining
  CASE 
    WHEN e.trial_expires_at > NOW() 
    THEN EXTRACT(DAY FROM e.trial_expires_at - NOW())::INTEGER
    ELSE 0
  END AS days_remaining,
  -- Calculate if expired
  (e.trial_expires_at < NOW()) AS is_expired
FROM enrollments e
JOIN users u ON u.id = e.student_id
JOIN classes c ON c.id = e.class_id
WHERE e.enrollment_type = 'trial'
  AND e.status IN ('active', 'pending')
ORDER BY e.trial_expires_at ASC;

COMMENT ON VIEW active_trial_enrollments IS 'Active trial enrollments with expiration tracking and student/class details';

-- ====================
-- 4. FUNCTION: Convert Trial to Regular
-- ====================

CREATE OR REPLACE FUNCTION convert_trial_to_regular(
  p_enrollment_id UUID,
  p_tuition_fee NUMERIC(10,2),
  p_discount_amount NUMERIC(10,2) DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment enrollments;
  v_result JSON;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  -- Validate enrollment exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  -- Validate enrollment is trial
  IF v_enrollment.enrollment_type != 'trial' THEN
    RAISE EXCEPTION 'Enrollment % is not a trial enrollment', p_enrollment_id;
  END IF;

  -- Validate not already converted
  IF v_enrollment.is_trial_converted THEN
    RAISE EXCEPTION 'Trial enrollment % was already converted', p_enrollment_id;
  END IF;

  -- Update enrollment to regular
  UPDATE enrollments
  SET 
    enrollment_type = 'regular',
    is_trial_converted = TRUE,
    tuition_fee = p_tuition_fee,
    discount_amount = p_discount_amount,
    status = 'active',
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Return success result
  v_result := json_build_object(
    'success', TRUE,
    'enrollment_id', p_enrollment_id,
    'student_id', v_enrollment.student_id,
    'class_id', v_enrollment.class_id,
    'converted_at', NOW(),
    'tuition_fee', p_tuition_fee,
    'discount_amount', p_discount_amount
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION convert_trial_to_regular IS 'Convert trial enrollment to regular paid enrollment with fee details';

-- ====================
-- 5. FUNCTION: Auto-expire Trials
-- ====================

CREATE OR REPLACE FUNCTION auto_expire_trial_enrollments()
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
  -- Find expired trial enrollments
  SELECT ARRAY_AGG(id)
  INTO v_expired_ids
  FROM enrollments
  WHERE enrollment_type = 'trial'
    AND status = 'active'
    AND trial_expires_at < NOW()
    AND NOT is_trial_converted;

  -- Get count
  v_count := COALESCE(ARRAY_LENGTH(v_expired_ids, 1), 0);

  -- Update status to 'completed' for expired trials
  IF v_count > 0 THEN
    UPDATE enrollments
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = ANY(v_expired_ids);
  END IF;

  -- Return results
  RETURN QUERY SELECT v_count, v_expired_ids;
END;
$$;

COMMENT ON FUNCTION auto_expire_trial_enrollments IS 'Automatically expire trial enrollments that have passed expiration date';

-- ====================
-- 6. FUNCTION: Get Trial Statistics
-- ====================

CREATE OR REPLACE FUNCTION get_trial_statistics(
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
  v_total_trials INTEGER;
  v_converted INTEGER;
  v_expired INTEGER;
  v_active INTEGER;
  v_conversion_rate NUMERIC(5,2);
BEGIN
  -- Count total trial enrollments
  SELECT COUNT(*)
  INTO v_total_trials
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count converted trials
  SELECT COUNT(*)
  INTO v_converted
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'regular'
    AND e.is_trial_converted = TRUE
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count expired trials
  SELECT COUNT(*)
  INTO v_expired
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.status = 'completed'
    AND NOT e.is_trial_converted
    AND e.enrolled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Count active trials
  SELECT COUNT(*)
  INTO v_active
  FROM enrollments e
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE e.enrollment_type = 'trial'
    AND e.status = 'active'
    AND e.trial_expires_at > NOW()
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Calculate conversion rate
  IF v_total_trials > 0 THEN
    v_conversion_rate := ROUND((v_converted::NUMERIC / v_total_trials::NUMERIC) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- Build result JSON
  v_stats := json_build_object(
    'total_trials', v_total_trials,
    'converted', v_converted,
    'expired', v_expired,
    'active', v_active,
    'conversion_rate', v_conversion_rate,
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  );

  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION get_trial_statistics IS 'Get trial enrollment statistics with conversion rate for a date range';

-- ====================
-- 7. TRIGGER: Auto-set Trial Expiration
-- ====================

CREATE OR REPLACE FUNCTION set_trial_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-set trial_expires_at for trial enrollments (3 days from enrollment)
  IF NEW.enrollment_type = 'trial' AND NEW.trial_expires_at IS NULL THEN
    NEW.trial_expires_at := NEW.enrolled_at + INTERVAL '3 days';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_trial_expiration ON enrollments;

-- Create trigger
CREATE TRIGGER trigger_set_trial_expiration
BEFORE INSERT OR UPDATE ON enrollments
FOR EACH ROW
WHEN (NEW.enrollment_type = 'trial')
EXECUTE FUNCTION set_trial_expiration();

COMMENT ON TRIGGER trigger_set_trial_expiration ON enrollments IS 'Auto-set trial_expires_at to 3 days after enrollment for trial enrollments';

-- ====================
-- 8. UPDATE EXISTING DATA
-- ====================

-- Update existing enrollments to 'regular' type (default)
UPDATE enrollments
SET enrollment_type = 'regular'
WHERE enrollment_type IS NULL;

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Show new columns
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
  AND column_name IN ('enrollment_type', 'trial_expires_at', 'is_trial_converted')
ORDER BY ordinal_position;

-- Show check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'enrollments'::regclass
  AND contype = 'c'
  AND conname LIKE '%enrollment_type%';

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'enrollments'
  AND indexname LIKE '%trial%';

-- Show functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%trial%'
ORDER BY routine_name;

-- ====================
-- EXAMPLE USAGE
-- ====================

/*
-- 1. Create trial enrollment
INSERT INTO enrollments (
  student_id, 
  class_id, 
  enrollment_type,
  status
) VALUES (
  'student-uuid-here',
  'class-uuid-here',
  'trial',
  'active'
);
-- trial_expires_at will auto-set to 3 days from now

-- 2. Query active trials
SELECT * FROM active_trial_enrollments;

-- 3. Convert trial to regular
SELECT convert_trial_to_regular(
  p_enrollment_id := 'enrollment-uuid-here',
  p_tuition_fee := 5000000,
  p_discount_amount := 500000
);

-- 4. Auto-expire old trials
SELECT * FROM auto_expire_trial_enrollments();

-- 5. Get trial statistics (last 30 days, all centers)
SELECT * FROM get_trial_statistics();

-- 6. Get trial statistics (specific center, custom date range)
SELECT * FROM get_trial_statistics(
  p_center_id := 'center-uuid-here',
  p_start_date := '2025-01-01',
  p_end_date := '2025-01-31'
);
*/
