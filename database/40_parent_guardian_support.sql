-- ============================================================
-- PARENT/GUARDIAN SUPPORT
-- Date: 2026-01-04
-- Description: Add parent/guardian fields to users table for underage students
-- ============================================================

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

-- ============================================================
-- 3. HELPER VIEW: UNDERAGE STUDENTS WITH PARENT CONTACT
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
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 AND u.parent_phone IS NOT NULL 
      THEN u.parent_phone
    ELSE u.phone
  END AS primary_contact_phone,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 AND u.parent_email IS NOT NULL 
      THEN u.parent_email
    ELSE u.email
  END AS primary_contact_email,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
      THEN true
    ELSE false
  END AS is_underage,
  u.center_id,
  u.status
FROM public.users u
WHERE u.role_id = (SELECT id FROM public.roles WHERE code = 'STUDENT')
  AND u.status = 'active';

COMMENT ON VIEW public.students_with_parent_contact IS 
  'View hiển thị học viên với thông tin liên hệ ưu tiên (parent nếu <18 tuổi)';

-- ============================================================
-- 4. FUNCTION: Get primary contact for notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_primary_contact(
  p_student_id UUID
)
RETURNS TABLE(
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_type TEXT
) AS $$
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
    CASE 
      WHEN u.date_of_birth IS NOT NULL 
           AND EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 
           AND u.parent_name IS NOT NULL
        THEN 'parent'
      ELSE 'student'
    END AS contact_type
  FROM public.users u
  WHERE u.id = p_student_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_student_primary_contact IS 
  'Trả về thông tin liên hệ ưu tiên (parent nếu học viên <18 tuổi)';

-- ============================================================
-- 5. UPDATE RLS POLICIES (if needed)
-- ============================================================

-- Allow students to view their own parent data
-- (This will be handled in RLS policies file if needed)

-- ============================================================
-- DONE!
-- ============================================================

-- Test query
SELECT 
  student_name,
  age,
  is_underage,
  parent_name,
  primary_contact_phone
FROM public.students_with_parent_contact
WHERE is_underage = true
LIMIT 5;
