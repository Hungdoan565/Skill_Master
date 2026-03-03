# SKILL MASTER — PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-25
**Commit:** 704d276
**Branch:** main

## OVERVIEW

Skill Master — hệ thống quản lý trung tâm đào tạo (education center management). Monorepo: Express backend + React frontend + Supabase (PostgreSQL) + pg-boss job queue. Multi-tenant theo center, phân quyền 5 role: SUPER_ADMIN, CENTER_MANAGER, TEACHER, STUDENT, PARENT.

## STRUCTURE

```
Skill_Master/
├── backend/        # Express API server (Node.js, ESM)
├── frontend/       # React SPA (Vite + TailwindCSS v4 + shadcn/ui)
├── database/       # SQL migrations (55+ sequential files)
├── supabase/       # Edge functions (consultation-api, send-assessment-result)
├── openspec/       # OpenSpec change management (specs + changes)
├── scripts/        # Utility scripts
└── package.json    # Monorepo root (TypeScript, Jest)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API routes | `backend/src/index.js` | Monolithic — hầu hết routes inline tại đây |
| Auth middleware | `backend/src/middleware/` | `requireAuth`, `requireRole` |
| Frontend routing | `frontend/src/App.jsx` | 4 role-based layouts, lazy loading |
| UI components | `frontend/src/components/ui/` | 26 shadcn/ui components |
| Feature modules | `frontend/src/features/` | 29 feature domains |
| DB schema | `database/01_schema.sql` | Base schema, subsequent files add features |
| Edge functions | `supabase/functions/` | consultation-api, send-assessment-result |
| Background jobs | `backend/src/jobs/` | pg-boss email queue, notifications |
| OpenSpec changes | `openspec/changes/` | Active sprints + archived changes |

## CONVENTIONS

- **Language**: Vietnamese comments, Vietnamese UI text, English code
- **Backend**: ESM (`type: "module"`), all routes in `index.js` (no router separation except `support.routes.js`)
- **API response**: `{ success: true/false, data/message/error }`
- **Multi-tenant**: `getEffectiveCenterId()` scopes every query to active center
- **Frontend state**: React Context (auth, sidebar, theme) — no Redux/Zustand
- **Component lib**: shadcn/ui (Radix + CVA + clsx + tailwind-merge)
- **Form handling**: react-hook-form + zod validation
- **Naming**: kebab-case files, PascalCase components, camelCase functions
- **Commit style**: hyphenated (e.g., `add-payroll-dispute-system`, `fix-teacher-dashboard-icons`)

## QUY TRÌNH LÀM VIỆC BẮT BUỘC

**Mọi tính năng mới đều phải có file OpenSpec.** Trước khi viết code, dùng skill `spx-plan` để phân tích spec. Sau đó dùng `spx-apply` để triển khai code. Cuối cùng **bắt buộc** gọi `spx-verify` để nghiệm thu trước khi coi là hoàn thành.

## ANTI-PATTERNS

- **KHÔNG** thêm route file mới — giữ pattern inline trong `index.js` (trừ khi refactor toàn bộ)
- **KHÔNG** dùng `as any` / `@ts-ignore` — project đang migrate sang TypeScript
- **KHÔNG** bỏ qua `getEffectiveCenterId` — mọi query phải scoped theo center
- **KHÔNG** hardcode role strings — dùng constants từ middleware

## COMMANDS

```bash
# Backend
cd backend && npm run dev          # Nodemon dev server
cd backend && npm start            # Production

# Frontend
cd frontend && npm run dev         # Vite dev server
cd frontend && npm run build       # Production build

# Tests
cd backend && npx jest             # Backend tests
```

## NOTES

- Backend `index.js` rất lớn (3000+ lines) — đọc bằng grep/search, không đọc toàn bộ
- Redis optional — pg-boss email queue lazy-load, app vẫn chạy không Redis
- TailwindCSS v4 (không phải v3) — config khác biệt
- Supabase dùng cho cả Auth + Database + Edge Functions
