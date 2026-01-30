# CLAUDE.md

This file is the single source of truth for AI/code assistants working in this repo.
It replaces older guidance. Keep it short, correct, and aligned with the codebase.

## Project Summary
Skill Master is a full-stack LMS for English/IT training centers.
- Frontend: React (Vite)
- Backend: Express.js (monolithic routes)
- DB/Auth: Supabase (PostgreSQL + Auth)
- Queue/Email: BullMQ + Redis + Nodemailer

## Dev Commands
Backend:
- cd backend
- npm install
- npm run dev   # nodemon
- npm start     # prod

Frontend:
- cd frontend
- npm install
- npm run dev   # http://localhost:5173
- npm run build
- npm run preview

Env:
- backend/.env from backend/.env.example
- frontend/.env.local from frontend/.env.example

## Repo Map
- backend/src/index.js            # monolithic API (~19k lines)
- backend/src/lib/                # schedule-conflict, session-generator
- backend/src/services/           # business logic
- backend/src/jobs/               # BullMQ workers/scheduler
- frontend/src/features/          # feature modules
- database/                       # SQL migrations
- docs/                           # specs, roadmap, audit

## User Groups (5)
1) Admin (system-wide)
2) Manager (single center)
3) Teacher
4) Student (2 subtypes)
   - Student Adult/Professional: self-managed
   - Student Minor: parent-managed
5) Parent

### Role Codes (recommended)
- SUPER_ADMIN  -> Admin
- CENTER_MANAGER -> Manager
- TEACHER
- STUDENT
- PARENT

If code already uses SUPER_ADMIN/CENTER_MANAGER, keep them for compatibility.
Student subtype should be a field (e.g. student_type = adult | minor) not a new role.
Parent can be a role with its own user profile.

## Auth + RBAC
- Frontend: Supabase auth client, ProtectedRoute
- Backend: requireAuth + requireRole
- Always use getEffectiveCenterId(user, requestedCenterId)
  - SUPER_ADMIN: can access any center
  - CENTER_MANAGER: only own center

## Critical Business Rules (Do Not Break)
- Day mapping: 2=Mon, 3=Tue, ... 8=Sun
- Schedule conflicts: time overlap + day match + date range overlap
- Sessions:
  - auto-generated from schedule
  - is_locked=true sessions must never be edited/deleted
- Enrollment -> draft invoice -> confirm -> paid/partial/overdue
- Certificate eligibility: attendance + grade thresholds; admin override allowed

## Parent / Student Model (new requirements)
- Students are either adult (self-managed) or minor (parent-managed)
- Parent must be able to view and manage the minor student (read-only or limited actions)
- Existing migrations add parent_* fields to users; do not lose that data
- If adding full parent model, prefer a guardians/relations table for many-to-one

## Migrations / Known Blockers
- Migrations 40/41/42 are prepared but may not be executed yet:
  - 40_parent_guardian_support
  - 41_trial_enrollment
  - 42_waiting_list
- If runtime errors mention missing columns, verify these ran in Supabase.

## API Conventions
Success:
{ success: true, data: {...}, message?: string }
Error:
{ success: false, message: '...', error?: '...' }
Pagination: ?page=1&limit=20&sortBy=created_at&sortOrder=desc

## Frontend Architecture
- Feature-based modules under frontend/src/features
- Barrel exports, alias @/ -> frontend/src
- Design system: warm/orange primary, rounded cards, shadcn-like UI

## Backend Notes
- API routes are currently in backend/src/index.js
- Services hold business logic (enrollment, certificate, etc.)
- Job scheduler starts on server boot; Redis may be optional

## Common Pitfalls
- Missing role_code in Supabase auth user_metadata for staff creation
- Day number confusion (2=Mon)
- Over-filtering by enrollment status -> empty lists
- Not handling locked sessions
- Endpoint name mismatches (bulk vs batch)
- **Role/UX issues**: See [docs/ROLE_UX_ISSUES.md](./docs/ROLE_UX_ISSUES.md) for role-specific bugs

## Known Role/UX Issues (Phase 2 Blockers)
> Full details: [docs/ROLE_UX_ISSUES.md](./docs/ROLE_UX_ISSUES.md)

| Issue | Description | Priority |
|-------|-------------|----------|
| QR Code in Admin | Admin PaymentModal shows QR - wrong logic (admin collects, not pays) | 🔴 Critical |
| Missing PARENT Role | No `isParent()`, no ParentRoute, no parent-portal | 🔴 Critical |
| Hardcoded Bank Config | `invoices/utils/constants.js` has hardcoded bank info | 🔴 Critical |
| Email-based Role Bypass | `protected-route.jsx` allows admin email pattern bypass | 🟠 Medium |
| Dashboard Not Role-Aware | CENTER_MANAGER sees same UI as SUPER_ADMIN | 🟠 Medium |

## Testing / Debugging
- Some test scripts exist in backend/ but require access token
- Use browser DevTools > Application > Local Storage > access_token
- Backend logs use emoji prefixes for quick scanning

## When Updating This File
- Keep it aligned with actual code behavior
- Prefer short, actionable bullet points
- If roles or flows change, update here first
