-- ============================================================
-- EMERGENCY FIX - RUN THIS NOW IN SUPABASE SQL EDITOR
-- ============================================================

-- 1. Check current state (BEFORE fix)
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as current_role,
  r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'admin@skillmaster.com';

-- Expected: current_role = STUDENT (wrong!)

-- 2. FIX IT NOW
UPDATE public.users
SET 
  role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
  full_name = COALESCE(full_name, 'Super Admin'),
  status = 'active',
  updated_at = NOW()
WHERE email = 'admin@skillmaster.com';

-- 3. VERIFY (AFTER fix)
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as current_role,
  r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'admin@skillmaster.com';

-- Expected: current_role = SUPER_ADMIN (correct!)

-- 4. Double-check
SELECT 
  'Database Fix Complete!' as status,
  u.email,
  r.code as role
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'admin@skillmaster.com'
  AND r.code = 'SUPER_ADMIN';

-- If this returns a row: SUCCESS ✅
-- If no rows: Something went wrong, email may be different

