-- ============================================================
-- FIX TRIGGER - Prevent role overwrite on user update
-- ============================================================
-- Vấn đề: Trigger chạy cả INSERT và UPDATE, nên khi đăng nhập
-- trigger có thể ghi đè role thành STUDENT
-- Giải pháp: Chỉ chạy INSERT, không chạy UPDATE
-- ============================================================

-- 1. Drop trigger cũ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Tạo lại function với logic CHỈ INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_center_id UUID;
  v_role_code TEXT;
  v_full_name TEXT;
  v_existing_user_id UUID;
BEGIN
  -- QUAN TRỌNG: Chỉ tạo profile nếu user CHƯA TỒN TẠI
  SELECT id INTO v_existing_user_id FROM public.users WHERE id = NEW.id;
  
  -- Nếu user đã tồn tại, KHÔNG làm gì cả (không ghi đè role)
  IF v_existing_user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

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

  -- Tạo profile trong public.users (CHỈ INSERT MỚI)
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
  ON CONFLICT (id) DO NOTHING;  -- QUAN TRỌNG: DO NOTHING thay vì DO UPDATE
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tạo lại trigger CHỈ cho INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users  -- BỎ OR UPDATE
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. QUAN TRỌNG: Fix admin role ngay bây giờ
-- Cập nhật admin user về đúng role SUPER_ADMIN
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'),
    updated_at = NOW()
WHERE email = 'admin@skillmaster.edu.vn';

-- 5. Verify
SELECT 
  u.email,
  u.full_name,
  r.code as role_code,
  r.name as role_name
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.email LIKE '%admin%' OR u.email LIKE '%@skillmaster.edu.vn';
