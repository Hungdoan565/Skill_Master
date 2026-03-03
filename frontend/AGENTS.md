# FRONTEND — AGENTS.md

## OVERVIEW

React 18 SPA. Vite bundler. TailwindCSS **v4** + shadcn/ui. 29 feature modules, 4 role-based layouts. React Router v6.

## STRUCTURE

```
src/
├── App.jsx            # Root routing — 4 layouts, lazy loading
├── main.jsx           # Entry point
├── features/          # 29 domain modules (self-contained)
│   ├── dashboard/     #   components/, hooks, pages
│   ├── classes/       #   Quản lý lớp học
│   ├── students/      #   Quản lý học viên
│   ├── invoices/      #   Hóa đơn, thanh toán
│   ├── schedule/      #   Lịch học, thời khóa biểu
│   ├── payroll/       #   Bảng lương giáo viên
│   ├── parent-portal/ #   Portal phụ huynh
│   ├── student-portal/#   Portal học viên
│   └── ...            #   (29 modules total)
├── components/        # Shared components
│   ├── ui/            #   26 shadcn/ui primitives
│   ├── auth/          #   Auth forms
│   ├── common/        #   Shared UI
│   ├── errors/        #   Error boundaries
│   └── layout/        #   Layout primitives
├── contexts/          # auth-context, sidebar-context, theme-context
├── hooks/             # useDebounce, useKeyboardShortcuts
├── layouts/           # admin, teacher, student, parent layouts
├── pages/             # admin/, auth/, landing/, public/
├── lib/               # Utilities (cn, API client)
└── utils/             # Helper functions
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Thêm feature mới | `src/features/{name}/` | Tạo folder + components/ |
| Routing | `src/App.jsx` | Import + add route |
| UI primitives | `src/components/ui/` | shadcn/ui — KHÔNG sửa trực tiếp |
| Layout chung | `src/layouts/` | 4 role-based layouts |
| Auth state | `src/contexts/auth-context.jsx` | useAuth() hook |
| API calls | Feature module trực tiếp | axios instance |

## CONVENTIONS

- **Feature module**: Self-contained folder `features/{name}/components/` — mỗi feature chứa components riêng
- **Component naming**: PascalCase file + export (`StudentList.jsx` → `export default function StudentList`)
- **Styling**: TailwindCSS v4 utility classes + `cn()` helper (clsx + tailwind-merge)
- **Forms**: react-hook-form + zod schema validation
- **Icons**: lucide-react — KHÔNG dùng icon library khác
- **Toasts**: sonner (`toast.success()`, `toast.error()`)
- **Charts**: recharts
- **Exports**: PDF (jspdf + html2canvas), Excel (xlsx)
- **Role-based access**: ProtectedRoute wraps layout, `allowedRoles={['ROLE']}`

## ANTI-PATTERNS

- **KHÔNG** import component từ feature khác — dùng `components/common/` cho shared
- **KHÔNG** sửa `components/ui/*` trực tiếp — đó là shadcn/ui generated
- **KHÔNG** dùng CSS modules / styled-components — chỉ Tailwind
- **KHÔNG** tạo global state mới — dùng Context hoặc prop drilling
- **KHÔNG** nhầm TailwindCSS v4 với v3 — syntax và config khác nhau
