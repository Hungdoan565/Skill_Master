# Role Contract Checkpoint

## Scope completed in this checkpoint
This checkpoint captures the role-boundary work completed so far for the 4 active roles:
- `SUPER_ADMIN`
- `CENTER_MANAGER`
- `TEACHER`
- `STUDENT`

## Current role contract

### SUPER_ADMIN
Owns:
- cross-center oversight
- governance and audit
- approvals and strategic anomaly visibility
- system-wide reports and center comparison

Does not own by default:
- daily branch payroll handling
- center-level leave processing
- center-level staff operations as a primary work surface

### CENTER_MANAGER
Owns:
- one-center operations
- support and ticket handling in center scope
- local finance follow-up and overdue invoices
- local staff coordination
- center-scoped reporting surface

Does not own by default:
- cross-center governance
- system-wide anomaly oversight
- system-only strategic decision surfaces

### TEACHER
Owns:
- own schedule and own classes
- attendance, grades, availability
- leave request submission
- payroll visibility and dispute visibility

Escalates to:
- `CENTER_MANAGER` for leave approval and payroll review semantics

### STUDENT
Owns:
- self-service visibility for learning, attendance, grades, support, and payment state
- action prompts for course discovery, tuition proof, and support follow-up

Does not see by default:
- internal staff jargon
- advisor-only workflow terms
- system-internal ownership language

## What changed in implementation

### Backend hardening
- Added explicit role guards to admin-sensitive routes instead of relying only on admin-shell assumptions.
- Locked strategic report routes to `SUPER_ADMIN` semantics through source-contract regression.

### Admin / manager UI separation
- Removed manager-style operational clutter from the default `SUPER_ADMIN` sidebar surface.
- Reframed manager menu as center-operations oriented.
- Reworded support, reports, and staff pages to show manager-specific center-operator semantics.

### Teacher hardening
- Reworded teacher payroll and leave alerts so ownership points to center manager instead of generic admin wording.
- Preserved teacher execution scope; no admin-style privilege was added.

### Student hardening
- Simplified student payment wording to focus on plain-language trust signals.
- Replaced `Follow-up tư vấn` with `Theo dõi sau tư vấn` in student support.

## Verification evidence

### Passing source-contract regression
- `node --test backend/tests/admin-role-scope-regression.test.js backend/tests/transaction-rbac-routes.test.js backend/tests/admin-governance-readiness.test.js backend/tests/admin-strategic-feed-contract.test.js backend/tests/teacher-portal-hardening-regression.test.js backend/tests/student-dashboard-consistency-regression.test.js backend/tests/student-overview-consultation-followup-regression.test.js`
- Result: 44 tests passed, 0 failed

### E2E status
The targeted Playwright suite is still blocked by local environment setup:
- auth requests fail with `ECONNREFUSED ::1:54321`
- student schedule E2E also reports missing `SUPABASE_URL` or `SUPABASE_ANON_KEY`
- direct route navigation fails with `Cannot navigate to invalid URL`

This means role-boundary source contracts are verified, but browser-level E2E remains pending on environment readiness.

## Commits in this worktree so far
- `e51edb3` — docs/spec checkpoint
- `189ff07` — admin role-boundary hardening
- `ae48e8d` — manager operating surface alignment
- `d1a9a75` — teacher hardening with center-manager semantics
- `2641a1e` — student trust-signal cleanup

## Remaining work after this checkpoint
1. finalize Task 7 by syncing tracker and commit the verification checkpoint
2. complete Task 8 by documenting the `PARENT` readiness gate
3. after that, use the finishing workflow for development-branch completion
