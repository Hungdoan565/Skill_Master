-- ============================================================
-- OPTIMIZE PROFILE QUERY - Add indexes for faster profile fetch
-- ============================================================
-- Vấn đề: Query profile timeout vì không có index
-- Giải pháp: Thêm index cho foreign keys và các cột thường dùng
-- ============================================================

-- 1. Index cho role_id trong users (đã có sẵn foreign key nhưng thêm explicit index)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);

-- 2. Index cho center_id trong users
CREATE INDEX IF NOT EXISTS idx_users_center_id ON public.users(center_id);

-- 3. Index cho email trong users (cho search)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4. Index cho status trong users (filter active users)
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 5. Index cho code trong roles (lookup role by code)
CREATE INDEX IF NOT EXISTS idx_roles_code ON public.roles(code);

-- 6. Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'roles', 'centers')
ORDER BY tablename, indexname;

-- 7. Test query performance
EXPLAIN ANALYZE
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.avatar_url,
  u.role_id,
  u.center_id,
  r.id as role_id_ref,
  r.code as role_code,
  r.name as role_name,
  c.id as center_id_ref,
  c.name as center_name
FROM public.users u
INNER JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.centers c ON u.center_id = c.id
WHERE u.id = '5be50fa0-f6c1-476e-9c4a-c7cd82caa55c'
LIMIT 1;
