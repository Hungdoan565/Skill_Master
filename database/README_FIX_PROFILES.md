# Fix Missing Teacher Profiles

## Vấn đề
Khi admin tạo tài khoản giáo viên, profile không được tự động tạo trong `public.users`, khiến giáo viên không thể đăng nhập.

## Nguyên nhân
1. **Trigger cũ** không đọc metadata `role_code` từ `auth.users`
2. **API tạo staff** không truyền `role_code` vào metadata khi tạo auth user

## Giải pháp đã thực hiện

### 1. Fix Database Trigger ✅
Chạy file `database/21_fix_auth_trigger.sql` trong Supabase SQL Editor:

```sql
-- Trigger mới sẽ:
-- - Đọc role_code từ metadata (admin set khi tạo)
-- - Tự động tạo profile với đúng role
-- - Sync tất cả user hiện tại chưa có profile
```

**Cách chạy:**
1. Vào Supabase Dashboard
2. Mở SQL Editor
3. Copy toàn bộ nội dung file `21_fix_auth_trigger.sql`
4. Click "Run"

### 2. Fix Backend API ✅
File `backend/src/index.js` - API `POST /api/admin/users` đã được cập nhật:

**Trước:**
```javascript
user_metadata: {
  full_name,
  phone,
}
```

**Sau:**
```javascript
user_metadata: {
  full_name,
  phone,
  role_code,         // ✅ Trigger sẽ đọc để tạo đúng role
  center_id,         // ✅ Gán đúng center
  hourly_rate
}
```

### 3. Restart Backend
```bash
cd backend
npm run dev
```

## Cách kiểm tra

### Kiểm tra trigger hoạt động:
```sql
-- Xem trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Xem function
\df public.handle_new_user
```

### Kiểm tra user đã có profile:
```sql
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id as profile_id,
  r.code as role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.roles r ON r.id = pu.role_id
ORDER BY au.created_at DESC;
```

## Fix user hiện tại đang bị thiếu profile

### Cách 1: Chạy SQL (Nhanh)
```sql
-- Sync tất cả user chưa có profile
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
```

### Cách 2: Fix từng user cụ thể
```sql
-- Thay YOUR_USER_ID và YOUR_ROLE (TEACHER/STUDENT/CENTER_MANAGER)
INSERT INTO public.users (id, email, full_name, role_id, center_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  (SELECT id FROM public.roles WHERE code = 'TEACHER'),  -- <-- Đổi role tại đây
  (SELECT id FROM public.centers LIMIT 1),
  'active'
FROM auth.users au
WHERE au.id = 'YOUR_USER_ID'
  AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
```

## Kết quả

Từ giờ:
- ✅ Admin tạo staff → Profile tự động được tạo với đúng role
- ✅ Giáo viên đăng nhập ngay được
- ✅ Không cần vào Supabase chèn SQL thủ công nữa

## Test

1. **Tạo teacher mới từ UI:**
   - Vào `/admin/staff` → Click "Thêm nhân viên"
   - Điền thông tin → Chọn Role = "Giáo viên"
   - Submit

2. **Kiểm tra profile được tạo:**
   ```sql
   SELECT u.*, r.code as role 
   FROM public.users u 
   LEFT JOIN public.roles r ON r.id = u.role_id
   WHERE u.email = 'new-teacher@example.com';
   ```

3. **Đăng nhập với tài khoản vừa tạo:**
   - Email: new-teacher@example.com
   - Password: (password được hiển thị sau khi tạo)
   - Phải vào được `/teacher` dashboard

## Troubleshooting

### Lỗi: "Tài khoản chưa có profile"
→ Chạy lại script `21_fix_auth_trigger.sql`

### Lỗi: Profile bị tạo sai role
→ Update thủ công:
```sql
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE code = 'TEACHER')
WHERE id = 'user_id_here';
```

### Trigger không chạy
→ Kiểm tra quyền:
```sql
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
```
