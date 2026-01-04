-- ============================================================
-- RUN MIGRATION 40: Parent/Guardian Support
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
-- 1. ADD PARENT/GUARDIAN COLUMNS TO USERS TABLE
-- ============================================================

DO $$ 
BEGIN
  -- Add parent_name column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_name TEXT;
    COMMENT ON COLUMN public.users.parent_name IS 'Họ tên phụ huynh/người giám hộ';
    RAISE NOTICE '✅ Added column: parent_name';
  ELSE
    RAISE NOTICE '⏭️  Column parent_name already exists';
  END IF;

  -- Add parent_phone column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_phone TEXT;
    COMMENT ON COLUMN public.users.parent_phone IS 'Số điện thoại phụ huynh';
    RAISE NOTICE '✅ Added column: parent_phone';
  ELSE
    RAISE NOTICE '⏭️  Column parent_phone already exists';
  END IF;

  -- Add parent_email column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_email TEXT;
    COMMENT ON COLUMN public.users.parent_email IS 'Email phụ huynh';
    RAISE NOTICE '✅ Added column: parent_email';
  ELSE
    RAISE NOTICE '⏭️  Column parent_email already exists';
  END IF;

  -- Add parent_relationship column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'parent_relationship'
  ) THEN
    ALTER TABLE public.users ADD COLUMN parent_relationship TEXT 
      CHECK (parent_relationship IS NULL OR parent_relationship IN ('father', 'mother', 'guardian', 'other'));
    COMMENT ON COLUMN public.users.parent_relationship IS 'Mối quan hệ: father, mother, guardian, other';
    RAISE NOTICE '✅ Added column: parent_relationship';
  ELSE
    RAISE NOTICE '⏭️  Column parent_relationship already exists';
  END IF;

  -- Add date_of_birth column if not exists (to determine if underage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
    COMMENT ON COLUMN public.users.date_of_birth IS 'Ngày sinh (để xác định học viên vị thành niên)';
    RAISE NOTICE '✅ Added column: date_of_birth';
  ELSE
    RAISE NOTICE '⏭️  Column date_of_birth already exists';
  END IF;

END $$;

-- ============================================================
-- 2. CREATE INDEX FOR PARENT CONTACT LOOKUP
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_parent_phone 
  ON public.users(parent_phone) 
  WHERE parent_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_parent_email 
  ON public.users(parent_email) 
  WHERE parent_email IS NOT NULL;

RAISE NOTICE '✅ Created indexes for parent contact lookup';

-- ============================================================
-- 3. HELPER VIEW: STUDENTS WITH PARENT CONTACT
-- ============================================================

CREATE OR REPLACE VIEW public.students_with_parent_contact AS
SELECT 
  u.id,
  u.full_name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  u.date_of_birth,
  EXTRACT(YEAR FROM AGE(u.date_of_birth)) AS age,
  u.parent_name,
  u.parent_phone,
  u.parent_email,
  u.parent_relationship,
  -- Determine primary contact
  CASE 
    WHEN u.date_of_birth IS NOT NULL 
         AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
         AND u.parent_phone IS NOT NULL 
    THEN u.parent_phone
    ELSE u.phone
  END AS primary_contact_phone,
  CASE 
    WHEN u.date_of_birth IS NOT NULL 
         AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
         AND u.parent_email IS NOT NULL 
    THEN u.parent_email
    ELSE u.email
  END AS primary_contact_email,
  CASE 
    WHEN u.date_of_birth IS NOT NULL 
         AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
         AND u.parent_name IS NOT NULL 
    THEN u.parent_name
    ELSE u.full_name
  END AS primary_contact_name
FROM public.users u
INNER JOIN public.roles r ON u.role_id = r.id
WHERE r.code = 'STUDENT';

RAISE NOTICE '✅ Created view: students_with_parent_contact';

-- ============================================================
-- 4. HELPER FUNCTION: GET PRIMARY CONTACT
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_primary_contact(student_id UUID)
RETURNS TABLE (
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_parent BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_name IS NOT NULL 
      THEN u.parent_name
      ELSE u.full_name
    END AS contact_name,
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_phone IS NOT NULL 
      THEN u.parent_phone
      ELSE u.phone
    END AS contact_phone,
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_email IS NOT NULL 
      THEN u.parent_email
      ELSE u.email
    END AS contact_email,
    (u.date_of_birth IS NOT NULL 
     AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
     AND u.parent_name IS NOT NULL) AS is_parent
  FROM public.users u
  WHERE u.id = student_id;
END;
$$;

RAISE NOTICE '✅ Created function: get_student_primary_contact';

-- Commit transaction
COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check columns added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('parent_name', 'parent_phone', 'parent_email', 'parent_relationship', 'date_of_birth')
ORDER BY column_name;

-- Sample query
SELECT 
  full_name,
  date_of_birth,
  EXTRACT(YEAR FROM AGE(date_of_birth)) AS age,
  parent_name,
  parent_phone
FROM users
WHERE role_id = (SELECT id FROM roles WHERE code = 'STUDENT')
LIMIT 5;
