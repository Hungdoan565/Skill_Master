-- ============================================================
-- CREATE ADMIN USER
-- Script để tạo admin user trong database
-- ============================================================

-- 1. Kiểm tra và tạo admin user trong auth.users
-- Note: Bạn cần tạo user qua Supabase Dashboard hoặc API trước
-- Sau đó chạy script này để cập nhật role

-- 2. Update role cho admin user (thay YOUR_ADMIN_EMAIL bằng email thực tế)
DO $$
DECLARE
    admin_user_id UUID;
    super_admin_role_id UUID;
    main_center_id UUID;
BEGIN
    -- Tìm user theo email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@skillmaster.com'
    LIMIT 1;

    -- Lấy role SUPER_ADMIN
    SELECT id INTO super_admin_role_id 
    FROM public.roles 
    WHERE code = 'SUPER_ADMIN';

    -- Lấy center đầu tiên
    SELECT id INTO main_center_id 
    FROM public.centers 
    LIMIT 1;

    -- Nếu tìm thấy user
    IF admin_user_id IS NOT NULL THEN
        -- Kiểm tra xem đã có record trong users chưa
        IF EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id) THEN
            -- Update existing
            UPDATE public.users
            SET 
                role_id = super_admin_role_id,
                center_id = main_center_id,
                full_name = COALESCE(full_name, 'Super Admin'),
                status = 'active',
                updated_at = NOW()
            WHERE id = admin_user_id;
            
            RAISE NOTICE 'Updated user % to SUPER_ADMIN', admin_user_id;
        ELSE
            -- Insert new
            INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
            VALUES (
                admin_user_id,
                'admin@skillmaster.com',
                'Super Admin',
                super_admin_role_id,
                main_center_id,
                'active'
            );
            
            RAISE NOTICE 'Created SUPER_ADMIN user %', admin_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'User not found in auth.users. Please create user via Supabase Dashboard first.';
    END IF;
END $$;

-- 3. Kiểm tra kết quả
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.code as role_code,
    r.name as role_name,
    c.name as center_name,
    u.status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.centers c ON u.center_id = c.id
WHERE r.code = 'SUPER_ADMIN';
