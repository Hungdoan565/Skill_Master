## Why

Current role and payment behaviors are inconsistent across frontend and backend, creating security and operations risk. Center-scoped access is enforced in some invoice flows but missing in transaction verification flows, and payment import contracts are mismatched, so the system can leak cross-center financial data and fail common reconciliation tasks.

## What Changes

- Enforce center-scoped authorization consistently for transaction listing and payment verification actions used by `CENTER_MANAGER`.
- Align payment import API contracts between frontend and backend (parse, match, apply) so the workflow is reliable and auditable.
- Normalize payment verification semantics across student/admin/manual flows (required evidence, references, verification metadata, and status handling).
- Clarify role UX boundaries for teacher-facing routes and APIs to remove ambiguous access outcomes for `SUPER_ADMIN` and `CENTER_MANAGER`.
- Correct misleading payment copy in student-facing surfaces to reflect the actual proof-submit then verify flow.

## Capabilities

### New Capabilities
- `center-scoped-transaction-authorization`: Enforce tenant-aware filtering and mutation checks for transaction list and verify/reject/bulk-verify operations.
- `payment-import-contract-consistency`: Define a single request/response contract for parse/match/apply flows and require center-safe matching behavior.
- `payment-verification-audit-consistency`: Standardize evidence and audit metadata requirements across payment channels and statuses.
- `role-ux-access-consistency`: Define consistent route and API behavior for teacher/admin/manager access boundaries.

### Modified Capabilities
- None.

## Impact

- Backend: `backend/src/index.js`, `backend/src/services/paymentImportService.js`, related payment/transaction authorization paths.
- Frontend: `frontend/src/components/auth/protected-route.jsx`, `frontend/src/App.jsx`, invoice import/payment modules, and student payment UI copy.
- Database/Schema: payment verification/audit columns and reject-reason compatibility checks.
- Operations: lower cross-center data exposure risk, fewer reconciliation failures, clearer role UX, and cleaner audit trails.
