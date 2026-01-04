# 🗄️ DATABASE MIGRATIONS - PHASE 1

## ⚠️ LỖI HIỆN TẠI

```
Error: column users.parent_name does not exist
```

**Nguyên nhân:** Database migrations chưa được chạy trên Supabase.

---

## 📋 DANH SÁCH MIGRATIONS CẦN CHẠY

### 1. Migration 40: Parent/Guardian Support
**File:** `database/scripts/run-migration-40.sql`  
**Mục đích:** Thêm thông tin phụ huynh cho học viên < 18 tuổi

**Thêm vào bảng `users`:**
- `parent_name` TEXT
- `parent_phone` TEXT
- `parent_email` TEXT
- `parent_relationship` TEXT (father/mother/guardian/other)
- `date_of_birth` DATE

**Views & Functions:**
- `students_with_parent_contact` - View với primary contact
- `get_student_primary_contact(student_id)` - Function lấy contact info

---

### 2. Migration 41: Trial Enrollment System
**File:** `database/scripts/run-migration-41.sql`  
**Mục đích:** Hệ thống trial class với auto-expire

**Thêm vào bảng `enrollments`:**
- `enrollment_type` ENUM (trial/regular/makeup)
- `trial_expires_at` TIMESTAMPTZ (auto = created_at + 3 days)
- `notes` TEXT

**Triggers:**
- `set_trial_expiration_trigger` - Auto-set expire date

**Views & Functions:**
- `active_trial_enrollments` - View trial còn active/expired
- `convert_trial_to_regular()` - Chuyển trial → regular + tạo invoice
- `auto_expire_trial_enrollments()` - Background job hủy trial quá hạn
- `get_trial_statistics()` - Stats cho dashboard

---

### 3. Migration 42: Waiting List System
**File:** `database/scripts/run-migration-42.sql`  
**Mục đích:** Priority queue cho lớp full

**Tạo bảng mới:** `waiting_list`
- `student_id`, `class_id` (UNIQUE constraint)
- `priority` INTEGER (0=normal, 1=priority, 2=urgent)
- `status` (waiting/notified/enrolled/cancelled)
- `notified_at`, `notified_expires_at` (7 ngày)
- `notes` TEXT

**Views & Functions:**
- `active_waiting_list` - View với queue_position auto-calculated
- `add_to_waiting_list()` - Thêm vào queue
- `notify_next_in_queue()` - Thông báo top N students
- `complete_waiting_list_entry()` - Mark enrolled/cancelled
- `auto_expire_waiting_list_notifications()` - Reset sau 7 ngày
- `get_waiting_list_statistics()` - Stats cho dashboard

---

## 🚀 CÁCH CHẠY MIGRATIONS

### **Phương án 1: Qua Supabase Dashboard (Khuyến nghị)**

1. **Mở Supabase Dashboard**
   - Vào https://app.supabase.com
   - Chọn project: `Skill Master`

2. **Mở SQL Editor**
   - Sidebar → SQL Editor
   - Click **"New query"**

3. **Chạy từng migration theo thứ tự**

   **Bước 1: Migration 40 (Parent/Guardian)**
   ```
   - Mở file: database/scripts/run-migration-40.sql
   - Copy toàn bộ nội dung
   - Paste vào SQL Editor
   - Click "Run" (hoặc Ctrl+Enter)
   - Xem output: ✅ Các notice hiện "Added column..."
   ```

   **Bước 2: Migration 41 (Trial Enrollment)**
   ```
   - Mở file: database/scripts/run-migration-41.sql
   - Copy + Paste + Run
   - Verify: Xem verification queries ở cuối
   ```

   **Bước 3: Migration 42 (Waiting List)**
   ```
   - Mở file: database/scripts/run-migration-42.sql
   - Copy + Paste + Run
   - Verify: Check table created
   ```

4. **Verify tất cả migrations thành công**
   ```sql
   -- Check parent columns
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users' 
     AND column_name LIKE 'parent%';

   -- Check enrollment_type
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'enrollments' 
     AND column_name = 'enrollment_type';

   -- Check waiting_list table
   SELECT * FROM information_schema.tables
   WHERE table_name = 'waiting_list';
   ```

---

### **Phương án 2: Qua Supabase CLI (Advanced)**

```bash
# Cài Supabase CLI (nếu chưa có)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Chạy migrations
supabase db push --include-schemas public

# Hoặc chạy từng file
psql $DATABASE_URL -f database/scripts/run-migration-40.sql
psql $DATABASE_URL -f database/scripts/run-migration-41.sql
psql $DATABASE_URL -f database/scripts/run-migration-42.sql
```

---

## ✅ SAU KHI CHẠY MIGRATIONS

### 1. **Restart Backend**
```powershell
# Kill backend hiện tại (nếu đang chạy)
Get-Process node | Stop-Process -Force

# Khởi động lại
cd backend
npm run dev
```

### 2. **Refresh Frontend**
- Vào browser: http://localhost:5174
- Hard refresh: Ctrl + Shift + R
- Kiểm tra console không còn lỗi

### 3. **Test từng feature**

**Test Parent/Guardian:**
```
1. Vào trang Students
2. Edit 1 student, nhập date_of_birth (< 18 tuổi)
3. Verify amber section "Thông tin Phụ huynh" xuất hiện
4. Fill parent info → Save
5. Refresh → data persists
```

**Test Trial Enrollment:**
```
1. Vào trang Enrollments
2. Click button "Trial Enrollment" (amber)
3. Search student + class
4. Submit → Verify badge "Trial" xuất hiện
5. Check expire date = created_at + 3 days
```

**Test Waiting List:**
```
1. Vào trang Enrollments
2. Click "Add to Waiting List" (blue)
3. Select priority (0/1/2)
4. Submit → Verify queue position hiển thị
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "column already exists"
```
✅ BÌNH THƯỜNG - Migration sử dụng IF NOT EXISTS
```

### Lỗi: "permission denied"
```
→ Kiểm tra user có quyền ALTER TABLE không
→ Dùng service_role key trong Supabase Dashboard
```

### Lỗi: "relation does not exist"
```
→ Chạy migration theo đúng thứ tự (40 → 41 → 42)
→ Migration 41, 42 phụ thuộc vào bảng enrollments, classes
```

### Backend vẫn báo lỗi sau khi migration
```
→ Restart backend (nodemon tự restart, node manual restart)
→ Clear Supabase client cache
→ Check .env có SUPABASE_URL, SUPABASE_KEY đúng không
```

---

## 📊 KIỂM TRA MIGRATIONS ĐÃ CHẠY

```sql
-- Check parent columns
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND (
    column_name LIKE 'parent%' 
    OR column_name = 'date_of_birth'
    OR column_name = 'enrollment_type'
    OR column_name = 'trial_expires_at'
  )
ORDER BY table_name, column_name;

-- Check waiting_list table
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename = 'waiting_list';

-- Check functions
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_student_primary_contact',
    'convert_trial_to_regular',
    'auto_expire_trial_enrollments',
    'get_trial_statistics',
    'add_to_waiting_list',
    'notify_next_in_queue',
    'complete_waiting_list_entry',
    'get_waiting_list_statistics'
  )
ORDER BY routine_name;
```

---

## 📝 NOTES

- **Idempotent:** Tất cả migrations dùng `IF NOT EXISTS` → có thể chạy lại nhiều lần
- **Transaction:** Mỗi migration wrapped trong `BEGIN...COMMIT` → rollback nếu lỗi
- **Verification:** Mỗi file có verification queries ở cuối để kiểm tra
- **RAISE NOTICE:** Output messages để track progress

---

## 🔗 RELATED FILES

- Original migrations: `database/40_*.sql`, `database/41_*.sql`, `database/42_*.sql`
- Backend API: `backend/src/index.js` (lines 2238+, 14101+)
- Frontend hooks: `frontend/src/features/enrollments/hooks/useEnrollments.js`
- Frontend modals: `frontend/src/features/enrollments/components/`

---

**Sau khi chạy xong 3 migrations, backend sẽ không còn lỗi "column does not exist" nữa!** ✅
