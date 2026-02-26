# BACKEND — AGENTS.md

## OVERVIEW

Express API server (ESM, Node.js). Supabase client cho DB + Auth. pg-boss cho background jobs. Monolithic `index.js` chứa hầu hết routes.

## STRUCTURE

```
src/
├── index.js          # Entry + ALL routes (3000+ lines)
├── controllers/      # Tách controller logic (một số domain)
├── services/         # Business logic services
├── middleware/        # Auth (requireAuth, requireRole), validation
├── validators/       # Zod/custom validation schemas
├── jobs/             # pg-boss background jobs (email, notifications)
├── lib/              # Shared utilities, Supabase client
├── routes/           # Chỉ support.routes.js — còn lại inline
├── templates/        # Handlebars email templates
└── __tests__/        # Jest test files
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Thêm API endpoint | `src/index.js` | Thêm inline, theo pattern existing |
| Auth logic | `src/middleware/` | requireAuth, requireRole(['ROLE']) |
| Email templates | `src/templates/` | Handlebars (.hbs) |
| Background jobs | `src/jobs/` | pg-boss queue processing |
| DB queries | `src/index.js` hoặc `src/services/` | Dùng `supabase` client trực tiếp |

## CONVENTIONS

- **Route pattern**: `app.METHOD('/api/resource', requireAuth, requireRole([...]), async (req, res) => {...})`
- **Response format**: `res.json({ success: true, data })` hoặc `res.status(4xx).json({ success: false, message })`
- **Center scoping**: Luôn dùng `getEffectiveCenterId(req)` — KHÔNG query không có center filter
- **Error handling**: try/catch trong mỗi handler, log `console.error`, trả 500 generic
- **Imports**: ESM (`import/export`), lazy import cho Redis-dependent modules

## ANTI-PATTERNS

- **KHÔNG** tạo file route mới — thêm vào `index.js` trừ khi được yêu cầu refactor
- **KHÔNG** dùng raw SQL — dùng Supabase query builder
- **KHÔNG** skip `requireAuth` trên private endpoints
- **KHÔNG** return sensitive data (password hashes, tokens) trong response
