-- ============================================================
-- PARENT USER SUPPORT
-- Date: 2026-01-30
-- Description: Add PARENT role and parent-student linking for parent portal
-- Depends on: 01_schema.sql, 40_parent_guardian_support.sql
-- ============================================================

-- ============================================================
-- 1. ADD PARENT ROLE
-- ============================================================

INSERT INTO public.roles (code, name, description) 
VALUES ('PARENT', 'Parent', 'Phụ huynh học viên')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. CREATE PARENT_STUDENT_LINKS TABLE
-- Links parent users to their children (students)
-- A parent can have multiple children
-- A child (minor student) can have multiple parents/guardians
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parent user (must have PARENT role)
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Student user (must have STUDENT role)
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Relationship type
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  
  -- Is this the primary guardian for this student?
  is_primary BOOLEAN DEFAULT false,
  
  -- Can this parent make payments for the student?
  can_pay BOOLEAN DEFAULT true,
  
  -- Can this parent view grades/attendance?
  can_view_academics BOOLEAN DEFAULT true,
  
  -- Status of the link
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Notes (e.g., custody arrangements, contact preferences)
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  -- Unique constraint: one parent can only link to one student once
  UNIQUE(parent_id, student_id)
);

-- ============================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================

-- Find all children of a parent
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id 
  ON public.parent_student_links(parent_id) 
  WHERE status = 'active';

-- Find all parents of a student
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id 
  ON public.parent_student_links(student_id) 
  WHERE status = 'active';

-- Find primary guardian of a student
CREATE INDEX IF NOT EXISTS idx_parent_student_links_primary 
  ON public.parent_student_links(student_id, is_primary) 
  WHERE status = 'active' AND is_primary = true;

-- ============================================================
-- 4. HELPER VIEWS
-- ============================================================

-- View: Parents with their linked children
CREATE OR REPLACE VIEW public.parent_children_view AS
SELECT 
  psl.id AS link_id,
  psl.parent_id,
  p.full_name AS parent_name,
  p.email AS parent_email,
  p.phone AS parent_phone,
  psl.student_id,
  s.full_name AS student_name,
  s.email AS student_email,
  s.date_of_birth AS student_dob,
  EXTRACT(YEAR FROM AGE(s.date_of_birth)) AS student_age,
  psl.relationship,
  psl.is_primary,
  psl.can_pay,
  psl.can_view_academics,
  psl.status AS link_status,
  s.center_id
FROM public.parent_student_links psl
JOIN public.users p ON psl.parent_id = p.id
JOIN public.users s ON psl.student_id = s.id
WHERE psl.status = 'active';

COMMENT ON VIEW public.parent_children_view IS 
  'View phụ huynh với danh sách con em đã liên kết';

-- View: Students with their parents (for admin/manager use)
CREATE OR REPLACE VIEW public.student_parents_view AS
SELECT 
  s.id AS student_id,
  s.full_name AS student_name,
  s.email AS student_email,
  s.center_id,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'parent_id', p.id,
      'parent_name', p.full_name,
      'parent_email', p.email,
      'parent_phone', p.phone,
      'relationship', psl.relationship,
      'is_primary', psl.is_primary
    )
  ) FILTER (WHERE p.id IS NOT NULL) AS parents
FROM public.users s
LEFT JOIN public.parent_student_links psl ON s.id = psl.student_id AND psl.status = 'active'
LEFT JOIN public.users p ON psl.parent_id = p.id
WHERE s.role_id = (SELECT id FROM public.roles WHERE code = 'STUDENT')
GROUP BY s.id, s.full_name, s.email, s.center_id;

COMMENT ON VIEW public.student_parents_view IS 
  'View học viên với danh sách phụ huynh đã liên kết';

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function: Get all children of a parent
CREATE OR REPLACE FUNCTION public.get_parent_children(p_parent_id UUID)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  student_dob DATE,
  relationship TEXT,
  is_primary BOOLEAN,
  center_id UUID,
  center_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    s.email AS student_email,
    s.date_of_birth AS student_dob,
    psl.relationship,
    psl.is_primary,
    s.center_id,
    c.name AS center_name
  FROM public.parent_student_links psl
  JOIN public.users s ON psl.student_id = s.id
  LEFT JOIN public.centers c ON s.center_id = c.id
  WHERE psl.parent_id = p_parent_id
    AND psl.status = 'active'
    AND s.status = 'active'
  ORDER BY psl.is_primary DESC, s.full_name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_parent_children IS 
  'Lấy danh sách con em của một phụ huynh';

-- Function: Check if parent has access to student
CREATE OR REPLACE FUNCTION public.parent_has_access(
  p_parent_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.parent_student_links 
    WHERE parent_id = p_parent_id 
      AND student_id = p_student_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.parent_has_access IS 
  'Kiểm tra phụ huynh có quyền truy cập thông tin học viên không';

-- Function: Get primary guardian of a student
CREATE OR REPLACE FUNCTION public.get_primary_guardian(p_student_id UUID)
RETURNS TABLE(
  parent_id UUID,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS parent_id,
    p.full_name AS parent_name,
    p.email AS parent_email,
    p.phone AS parent_phone,
    psl.relationship
  FROM public.parent_student_links psl
  JOIN public.users p ON psl.parent_id = p.id
  WHERE psl.student_id = p_student_id
    AND psl.status = 'active'
    AND psl.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_primary_guardian IS 
  'Lấy thông tin người giám hộ chính của học viên';

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their own links
CREATE POLICY parent_student_links_parent_view ON public.parent_student_links
  FOR SELECT
  USING (
    parent_id = auth.uid()
  );

-- Policy: Students can view who their parents are
CREATE POLICY parent_student_links_student_view ON public.parent_student_links
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Policy: Admins/Managers can view all links in their center
CREATE POLICY parent_student_links_admin_view ON public.parent_student_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Policy: Only admins can insert/update/delete links
CREATE POLICY parent_student_links_admin_manage ON public.parent_student_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 7. TRIGGER: Update updated_at on changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_parent_student_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parent_student_links_updated_at ON public.parent_student_links;
CREATE TRIGGER parent_student_links_updated_at
  BEFORE UPDATE ON public.parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parent_student_links_updated_at();

-- ============================================================
-- DONE!
-- ============================================================

-- Verification query
SELECT 
  code, 
  name, 
  description 
FROM public.roles 
WHERE code = 'PARENT';
