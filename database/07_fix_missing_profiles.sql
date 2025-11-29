-- ============================================================
-- FIX MISSING USER PROFILES
-- ============================================================
-- Chạy file này trong Supabase SQL Editor để:
-- 1. Tạo profile cho user đã đăng ký nhưng chưa có trong public.users
-- 2. Đảm bảo trigger hoạt động cho user mới
-- ============================================================

-- 1. Kiểm tra và tạo lại trigger (đảm bảo nó tồn tại)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  default_center_id UUID;
BEGIN
  -- Lấy role STUDENT mặc định
  SELECT id INTO default_role_id FROM public.roles WHERE code = 'STUDENT';
  
  -- Lấy center đầu tiên làm mặc định
  SELECT id INTO default_center_id FROM public.centers LIMIT 1;

  -- Insert vào public.users
  INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role_id,
    default_center_id,
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- Không lỗi nếu user đã tồn tại
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Xóa trigger cũ và tạo lại
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. FIX: Tạo profile cho TẤT CẢ user đã đăng ký nhưng chưa có profile
-- ============================================================
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  (SELECT id FROM public.roles WHERE code = 'STUDENT'),
  (SELECT id FROM public.centers LIMIT 1),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- ============================================================
-- 3. Kiểm tra kết quả
-- ============================================================
-- Hiển thị số user đã được sync
SELECT 
  'Users in auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Users in public.users' as table_name, 
  COUNT(*) as count 
FROM public.users;

-- Hiển thị danh sách user mới được tạo profile
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.code as role_code,
  u.created_at
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================================
-- DONE! 
-- Sau khi chạy xong, refresh trang web và đăng nhập lại
-- ============================================================
