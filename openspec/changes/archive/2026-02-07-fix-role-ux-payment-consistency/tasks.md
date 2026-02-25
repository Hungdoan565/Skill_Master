## 1. Center-Scoped Transaction Authorization

- [x] 1.1 Add center-scope filtering to `GET /api/transactions` for `CENTER_MANAGER` using invoice/class center ownership.
- [x] 1.2 Add center-ownership authorization checks to `PATCH /api/payments/:id/verify` and `PATCH /api/payments/:id/reject`.
- [x] 1.3 Add center-ownership authorization checks to `POST /api/transactions/bulk-verify` for each target payment.
- [x] 1.4 Align transaction summary/statistics with the same filtered dataset used for list responses.
- [x] 1.5 Add endpoint-level tests for manager own-center success and cross-center denial cases.

## 2. Payment Import Contract Alignment

- [x] 2.1 Select and document one canonical parse contract (request fields + response shape) for frontend/backend.
- [x] 2.2 Implement frontend parse request/response handling to match canonical backend contract.
- [x] 2.3 Implement canonical match payload/response schema and preserve stable transaction identifiers.
- [x] 2.4 Implement canonical apply payload/response schema and deterministic success/error reporting.
- [x] 2.5 Enforce center-scoped invoice candidate selection and apply authorization for `CENTER_MANAGER` in import flows.
- [x] 2.6 Add integration tests that cover parse -> match -> apply success and schema mismatch failures.

## 3. Payment Verification and Audit Consistency

- [x] 3.1 Define and enforce channel-specific evidence/reference validation rules for student transfer and staff non-cash flows.
- [x] 3.2 Ensure verify/reject actions always persist complete verifier metadata and timestamps.
- [x] 3.3 Ensure rejected payments require and persist a non-empty rejection reason compatible with schema.
- [x] 3.4 Enforce deterministic payment verification state transitions and reject invalid transitions.
- [x] 3.5 Add regression tests for pending/verified/rejected transitions across manual and imported payment paths.

## 4. Role UX and Route/API Consistency

- [x] 4.1 Finalize teacher portal access policy (teacher-only or explicit admin supervision mode) and document it.
- [x] 4.2 Align frontend route guards in `ProtectedRoute`/`TeacherRoute` with backend teacher API authorization.
- [x] 4.3 Remove authorization-sensitive email-pattern role inference from navigation/route decisions.
- [x] 4.4 Update student payment CTA and status wording to reflect submit-proof then verify lifecycle.
- [x] 4.5 Add frontend route and UX tests for role-gated access and pending-verification messaging.

## 5. Verification, Rollout, and Safety

- [x] 5.1 Run backend and frontend test suites relevant to RBAC and payment flows; fix regressions from this change.
- [x] 5.2 Run manual verification checklist for SUPER_ADMIN, CENTER_MANAGER, TEACHER, STUDENT, and PARENT roles.
- [x] 5.3 Prepare rollout notes with risk controls, fallback behavior, and monitoring points for transaction verification.
- [x] 5.4 Confirm OpenSpec artifacts remain consistent with implemented behavior before archive.
