# DATABASE — AGENTS.md

## OVERVIEW

PostgreSQL via Supabase. 55+ sequential SQL migration files. Schema quản lý trung tâm đào tạo multi-tenant.

## STRUCTURE

```
database/
├── 01_schema.sql              # Base schema (tables, RLS)
├── 02_fix_rls.sql             # RLS policy fixes
├── ...                        # Sequential migrations
├── 55_teacher_compensation.sql # Latest migration
├── scripts/                   # Utility SQL scripts
├── seeds/                     # Seed data
└── seed_bank_config.sql       # Bank configuration seed
```

## CONVENTIONS

- **File naming**: `NN_description.sql` — số thứ tự tăng dần, mô tả ngắn gọn
- **Thêm migration**: Tạo file `{N+1}_description.sql` với N = số cao nhất hiện tại
- **RLS**: Row Level Security bắt buộc cho mọi table — scope theo `center_id`
- **Schema**: Dùng `public` schema, functions trong `public`
- **Idempotent**: Dùng `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

## ANTI-PATTERNS

- **KHÔNG** sửa migration file đã tồn tại — luôn tạo file mới
- **KHÔNG** tạo table không có `center_id` (trừ lookup/config tables)
- **KHÔNG** bỏ qua RLS policies — mọi table cần policy
- **KHÔNG** dùng `DROP TABLE` trong migration — dùng `ALTER` để sửa
