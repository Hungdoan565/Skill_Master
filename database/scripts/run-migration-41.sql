-- ============================================================
-- RUN MIGRATION 41: Trial Enrollment System
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
-- 1. CREATE ENUM FOR ENROLLMENT TYPE
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_type_enum') THEN
    CREATE TYPE enrollment_type_enum AS ENUM ('trial', 'regular', 'makeup');
    RAISE NOTICE '✅ Created enum: enrollment_type_enum';
  ELSE
    RAISE NOTICE '⏭️  Enum enrollment_type_enum already exists';
  END IF;
END $$;

-- ============================================================
-- 2. ADD COLUMNS TO ENROLLMENTS TABLE
-- ============================================================

DO $$ 
BEGIN
  -- Add enrollment_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments' 
    AND column_name = 'enrollment_type'
  ) THEN
    ALTER TABLE public.enrollments 
      ADD COLUMN enrollment_type enrollment_type_enum DEFAULT 'regular';
    COMMENT ON COLUMN public.enrollments.enrollment_type IS 'Loại enrollment: trial/regular/makeup';
    RAISE NOTICE '✅ Added column: enrollment_type';
  ELSE
    RAISE NOTICE '⏭️  Column enrollment_type already exists';
  END IF;

  -- Add trial_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments' 
    AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE public.enrollments 
      ADD COLUMN trial_expires_at TIMESTAMPTZ;
    COMMENT ON COLUMN public.enrollments.trial_expires_at IS 'Ngày hết hạn trial (auto-set = created_at + 3 days)';
    RAISE NOTICE '✅ Added column: trial_expires_at';
  ELSE
    RAISE NOTICE '⏭️  Column trial_expires_at already exists';
  END IF;

  -- Add notes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN notes TEXT;
    COMMENT ON COLUMN public.enrollments.notes IS 'Ghi chú về enrollment';
    RAISE NOTICE '✅ Added column: notes';
  ELSE
    RAISE NOTICE '⏭️  Column notes already exists';
  END IF;

END $$;

-- ============================================================
-- 3. CREATE TRIGGER TO AUTO-SET TRIAL EXPIRATION
-- ============================================================

CREATE OR REPLACE FUNCTION set_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enrollment_type = 'trial' AND NEW.trial_expires_at IS NULL THEN
    NEW.trial_expires_at := NEW.created_at + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trial_expiration_trigger ON enrollments;
CREATE TRIGGER set_trial_expiration_trigger
  BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_expiration();

RAISE NOTICE '✅ Created trigger: set_trial_expiration_trigger';

-- ============================================================
-- 4. CREATE VIEW: ACTIVE TRIAL ENROLLMENTS
-- ============================================================

CREATE OR REPLACE VIEW active_trial_enrollments AS
SELECT 
  e.id,
  e.student_id,
  e.class_id,
  e.enrollment_type,
  e.trial_expires_at,
  e.notes,
  e.created_at,
  u.full_name AS student_name,
  c.name AS class_name,
  CASE 
    WHEN e.trial_expires_at > NOW() THEN 'active'
    ELSE 'expired'
  END AS trial_status
FROM enrollments e
INNER JOIN users u ON e.student_id = u.id
INNER JOIN classes c ON e.class_id = c.id
WHERE e.enrollment_type = 'trial'
  AND e.status != 'cancelled';

RAISE NOTICE '✅ Created view: active_trial_enrollments';

-- ============================================================
-- 5. FUNCTION: CONVERT TRIAL TO REGULAR
-- ============================================================

CREATE OR REPLACE FUNCTION convert_trial_to_regular(
  p_enrollment_id UUID,
  p_tuition_fee DECIMAL,
  p_discount_amount DECIMAL DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_enrollment RECORD;
  v_invoice_id UUID;
  v_final_amount DECIMAL;
BEGIN
  -- Check enrollment exists and is trial
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id AND enrollment_type = 'trial';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Trial enrollment không tồn tại'
    );
  END IF;

  -- Check if invoice already exists
  IF EXISTS (SELECT 1 FROM invoices WHERE enrollment_id = p_enrollment_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Hóa đơn đã tồn tại cho enrollment này'
    );
  END IF;

  -- Calculate final amount
  v_final_amount := p_tuition_fee - COALESCE(p_discount_amount, 0);

  -- Update enrollment type
  UPDATE enrollments
  SET 
    enrollment_type = 'regular',
    trial_expires_at = NULL,
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Create invoice
  INSERT INTO invoices (
    enrollment_id,
    student_id,
    class_id,
    invoice_type,
    total_amount,
    discount_amount,
    final_amount,
    status,
    created_at
  ) VALUES (
    p_enrollment_id,
    v_enrollment.student_id,
    v_enrollment.class_id,
    'regular_tuition',
    p_tuition_fee,
    p_discount_amount,
    v_final_amount,
    'draft',
    NOW()
  ) RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Chuyển đổi thành công',
    'enrollment_id', p_enrollment_id,
    'invoice_id', v_invoice_id
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: convert_trial_to_regular';

-- ============================================================
-- 6. FUNCTION: AUTO EXPIRE TRIAL ENROLLMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION auto_expire_trial_enrollments()
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE enrollments
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE enrollment_type = 'trial'
    AND trial_expires_at < NOW()
    AND status = 'active';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'expired_count', v_updated_count,
    'message', format('Đã hủy %s trial enrollments quá hạn', v_updated_count)
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: auto_expire_trial_enrollments';

-- ============================================================
-- 7. FUNCTION: GET TRIAL STATISTICS
-- ============================================================

CREATE OR REPLACE FUNCTION get_trial_statistics(p_center_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_expired INTEGER;
  v_converted INTEGER;
  v_conversion_rate DECIMAL;
BEGIN
  -- Count trials by status
  SELECT 
    COUNT(*) FILTER (WHERE 1=1) AS total,
    COUNT(*) FILTER (WHERE trial_expires_at > NOW() AND status = 'active') AS active,
    COUNT(*) FILTER (WHERE trial_expires_at <= NOW() AND status = 'active') AS expired,
    COUNT(*) FILTER (WHERE status = 'converted') AS converted
  INTO v_total, v_active, v_expired, v_converted
  FROM enrollments e
  INNER JOIN classes c ON e.class_id = c.id
  WHERE e.enrollment_type = 'trial'
    AND (p_center_id IS NULL OR c.center_id = p_center_id);

  -- Calculate conversion rate
  IF v_total > 0 THEN
    v_conversion_rate := ROUND((v_converted::DECIMAL / v_total) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;

  RETURN json_build_object(
    'total_trials', v_total,
    'active_trials', v_active,
    'expired_trials', v_expired,
    'converted_trials', v_converted,
    'conversion_rate', v_conversion_rate
  );
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Created function: get_trial_statistics';

-- Commit transaction
COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'enrollments'
  AND column_name IN ('enrollment_type', 'trial_expires_at', 'notes')
ORDER BY column_name;

-- Test trial creation (you can adjust values)
-- INSERT INTO enrollments (student_id, class_id, enrollment_type, notes)
-- VALUES (
--   (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE code = 'STUDENT') LIMIT 1),
--   (SELECT id FROM classes LIMIT 1),
--   'trial',
--   'Test trial enrollment'
-- );

-- Check view
SELECT * FROM active_trial_enrollments LIMIT 5;

-- Check statistics
SELECT get_trial_statistics();
