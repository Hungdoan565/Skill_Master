-- ============================================================
-- DEBUG: Check admin profile data
-- ============================================================

-- Check admin user full_name and avatar
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.avatar_url,
    r.code as role,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.full_name IS NULL THEN '❌ NULL - This causes "Chưa cập nhật tên"'
        WHEN u.full_name = '' THEN '⚠️ EMPTY STRING'
        ELSE '✅ HAS VALUE'
    END as full_name_status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email LIKE '%admin%@skillmaster%'
ORDER BY u.email;

-- Check auth.users metadata
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as metadata_full_name,
    created_at
FROM auth.users
WHERE email LIKE '%admin%@skillmaster%';

