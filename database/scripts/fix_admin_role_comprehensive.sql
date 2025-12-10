-- ============================================================
-- FIX ADMIN ROLE - COMPREHENSIVE SOLUTION
-- ============================================================
-- Description: Fix admin user role and verify database integrity
-- Usage: Copy-paste vào Supabase SQL Editor và chạy từng section
-- ============================================================

-- ============================================================
-- STEP 1: DIAGNOSTIC - Check current state
-- ============================================================
\echo '========================================';
\echo 'STEP 1: CHECKING CURRENT STATE';
\echo '========================================';

-- Check admin user current role
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as current_role,
  r.name as role_name,
  u.status,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email LIKE '%admin%' 
   OR u.email LIKE '%@skillmaster.edu.vn'
ORDER BY u.email;

\echo '';
\echo '========================================';
\echo 'STEP 2: VERIFY ROLES TABLE';
\echo '========================================';

-- Verify all roles exist
SELECT 
  id,
  code,
  name,
  description
FROM public.roles
ORDER BY 
  CASE code
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'CENTER_MANAGER' THEN 2
    WHEN 'TEACHER' THEN 3
    WHEN 'STUDENT' THEN 4
    ELSE 5
  END;

-- ============================================================
-- STEP 3: FIX ADMIN USER ROLE
-- ============================================================
\echo '';
\echo '========================================';
\echo 'STEP 3: FIXING ADMIN USER ROLE';
\echo '========================================';

-- Update admin@skillmaster.com to SUPER_ADMIN
UPDATE public.users
SET 
  role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
  full_name = COALESCE(full_name, 'Super Admin'),
  status = 'active',
  updated_at = NOW()
WHERE email = 'admin@skillmaster.com'
RETURNING 
  email,
  full_name,
  (SELECT code FROM public.roles WHERE id = role_id) as new_role,
  status,
  updated_at;

-- Update any other admin emails
UPDATE public.users
SET 
  role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
  full_name = COALESCE(full_name, 'Admin'),
  status = 'active',
  updated_at = NOW()
WHERE (email LIKE '%admin%' OR email LIKE '%@skillmaster.edu.vn')
  AND email != 'admin@skillmaster.com'
  AND role_id != (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN')
RETURNING 
  email,
  full_name,
  (SELECT code FROM public.roles WHERE id = role_id) as new_role;

-- ============================================================
-- STEP 4: VERIFICATION - Confirm changes
-- ============================================================
\echo '';
\echo '========================================';
\echo 'STEP 4: VERIFICATION';
\echo '========================================';

-- Verify admin users now have correct roles
SELECT 
  u.email,
  u.full_name,
  r.code as role,
  r.name as role_name,
  u.status,
  u.updated_at as last_updated
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.email LIKE '%admin%' 
   OR u.email LIKE '%@skillmaster.edu.vn'
ORDER BY u.email;

-- ============================================================
-- STEP 5: CHECK FOR OTHER MISMATCHES (OPTIONAL)
-- ============================================================
\echo '';
\echo '========================================';
\echo 'STEP 5: CHECK FOR OTHER POTENTIAL ROLE MISMATCHES';
\echo '========================================';

-- Check for users with email patterns that don't match their roles
SELECT 
  u.email,
  u.full_name,
  r.code as current_role,
  CASE 
    WHEN u.email LIKE '%admin%' OR u.email LIKE '%@skillmaster.edu.vn' THEN 'Should be SUPER_ADMIN'
    WHEN u.email LIKE '%teacher%' OR u.email LIKE '%gv%' THEN 'Possibly TEACHER'
    WHEN u.email LIKE '%student%' OR u.email LIKE '%hv%' THEN 'Possibly STUDENT'
    ELSE 'No pattern detected'
  END as suggested_role
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE (
  (u.email LIKE '%admin%' OR u.email LIKE '%@skillmaster.edu.vn') 
  AND r.code != 'SUPER_ADMIN'
)
ORDER BY u.email;

\echo '';
\echo '========================================';
\echo 'FIX COMPLETED SUCCESSFULLY!';
\echo '========================================';
\echo 'Next steps:';
\echo '1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)';
\echo '2. Log out and log back in';
\echo '3. Verify the admin badge shows "Super Admin"';
\echo '';

