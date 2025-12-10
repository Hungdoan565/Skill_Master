-- FIX ADMIN USER NGAY - Copy paste vào Supabase SQL Editor và Run

-- Insert hoặc update admin user
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
    au.id,
    'admin@skillmaster.edu.vn',
    'Super Admin',
    (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
    (SELECT id FROM public.centers LIMIT 1),
    'active'
FROM auth.users au
WHERE au.email = 'admin@skillmaster.edu.vn'
ON CONFLICT (id) 
DO UPDATE SET
    role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
    full_name = 'Super Admin',
    status = 'active',
    updated_at = NOW();

-- Kiểm tra kết quả
SELECT 
    u.email,
    u.full_name,
    r.code as role,
    u.status
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'admin@skillmaster.edu.vn';


-- Insert hoặc update admin user
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
    au.id,
    'admin@skillmaster.edu.vn',
    'Super Admin',
    (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
    (SELECT id FROM public.centers LIMIT 1),
    'active'
FROM auth.users au
WHERE au.email = 'admin@skillmaster.edu.vn'
ON CONFLICT (id) 
DO UPDATE SET
    role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
    full_name = 'Super Admin',
    status = 'active',
    updated_at = NOW();


SELECT 
    u.id,
    u.email,
    u.full_name,
    r.code as role,
    r.name as role_name,
    u.status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'admin@skillmaster.edu.vn';