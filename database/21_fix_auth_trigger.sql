-- ============================================================
-- FIX AUTH TRIGGER - Tự động tạo profile với đúng role
-- ============================================================
-- Vấn đề: Admin tạo teacher nhưng profile không được tạo hoặc tạo sai role
-- Giải pháp: Cập nhật trigger để đọc metadata từ auth.users
-- ============================================================

-- 1. Drop trigger và function cũ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Tạo function mới với logic thông minh hơn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_center_id UUID;
  v_role_code TEXT;
  v_full_name TEXT;
BEGIN
  -- Đọc role_code từ metadata (admin set khi tạo)
  v_role_code := COALESCE(NEW.raw_user_meta_data->>'role_code', 'STUDENT');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Lấy role_id từ role_code
  SELECT id INTO v_role_id FROM public.roles WHERE code = v_role_code;
  
  -- Nếu không tìm thấy role, dùng STUDENT mặc định
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'STUDENT';
  END IF;
  
  -- Lấy center_id từ metadata hoặc center đầu tiên
  v_center_id := (NEW.raw_user_meta_data->>'center_id')::UUID;
  IF v_center_id IS NULL THEN
    SELECT id INTO v_center_id FROM public.centers LIMIT 1;
  END IF;

  -- Tạo profile trong public.users
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role_id, 
    center_id, 
    phone,
    status,
    created_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    v_full_name,
    v_role_id,
    v_center_id,
    NEW.raw_user_meta_data->>'phone',
    'active',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    center_id = EXCLUDED.center_id,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tạo lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync tất cả user hiện tại chưa có profile
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(
    (SELECT id FROM public.roles WHERE code = (au.raw_user_meta_data->>'role_code')),
    (SELECT id FROM public.roles WHERE code = 'STUDENT')
  ),
  COALESCE(
    (au.raw_user_meta_data->>'center_id')::UUID,
    (SELECT id FROM public.centers LIMIT 1)
  ),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Kiểm tra kết quả
SELECT 
  'Auth users' as type,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profile users' as type,
  COUNT(*) as count
FROM public.users;

-- 6. Hiển thị users với role
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as role,
  c.name as center,
  u.status
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
LEFT JOIN public.centers c ON c.id = u.center_id
ORDER BY u.created_at DESC
LIMIT 20;

-- ============================================================
-- DONE! Từ giờ khi admin tạo staff sẽ tự động có profile đúng role
-- ============================================================
