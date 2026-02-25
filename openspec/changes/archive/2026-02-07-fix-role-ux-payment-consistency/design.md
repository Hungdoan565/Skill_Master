## Context

The current LMS has inconsistent authorization and payment workflows across frontend and backend.

- Frontend route guards allow `SUPER_ADMIN` and `CENTER_MANAGER` to enter teacher routes, while several backend teacher endpoints are strictly `TEACHER` only.
- Center-scoped permission checks are present in some invoice/payment handlers but missing in transaction listing and verification handlers.
- Payment import frontend/backend request and response contracts are misaligned, so parse/match/apply can fail even with valid operator input.
- Verification/audit semantics are inconsistent across channels (student transfer, admin manual collection, imported transactions), reducing traceability.

This change must prepare implementation-ready artifacts with minimal disruptive refactors in a monolithic backend (`backend/src/index.js`) and feature-based frontend modules.

## Goals / Non-Goals

**Goals:**
- Define a consistent center-scoped authorization model for transaction read/verify/reject actions.
- Define one canonical payment import contract for parse, match, and apply operations.
- Define consistent verification/audit requirements across payment channels.
- Define explicit route/API role behavior for teacher/admin/manager UX.
- Keep changes incremental and compatible with existing RBAC and invoice flows.

**Non-Goals:**
- Full RBAC redesign or migration to a new auth architecture.
- Rewriting invoice/payment modules end-to-end.
- Introducing new external payment providers or major schema re-platforming.
- Reworking unrelated dashboard/business features.

## Decisions

1. Enforce center scope at transaction layer, not only invoice layer
- Decision: add center checks to `/api/transactions`, `/api/transactions/bulk-verify`, and `/api/payments/:id/verify|reject` for `CENTER_MANAGER`.
- Rationale: closes cross-center visibility/tampering gap where manager-scoped checks currently do not exist.
- Alternative considered: temporarily restrict transaction endpoints to `SUPER_ADMIN` only. Rejected as primary because it breaks center-level operations.

2. Pick one canonical payment import API contract and make both sides follow it
- Decision: define exact payload and response schemas for parse/match/apply and treat any alternate shape as unsupported.
- Rationale: current contract drift causes operational failures and inconsistent matching behavior.
- Alternative considered: support multiple contracts in parallel. Rejected due to higher complexity and prolonged ambiguity.

3. Normalize verification semantics by payment channel
- Decision: require channel-specific minimum evidence/reference and always capture verifier metadata for non-student auto-post flows.
- Rationale: produces auditable records and reduces pending-state ambiguity.
- Alternative considered: keep optional evidence everywhere. Rejected due to weak auditability and reconciliation risk.

4. Make teacher/admin route intent explicit
- Decision: define clear expected behavior for `/teacher/*` (teacher-only vs explicit admin preview mode) and align frontend guarding with backend authorization.
- Rationale: current mixed behavior creates avoidable 403 UX failures.
- Alternative considered: keep permissive frontend and strict backend. Rejected due to persistent confusion and support burden.

5. Prioritize minimal-change implementation sequencing
- Decision: phase work in order: authorization closure -> import contract alignment -> verification semantics -> UX wording/guard alignment.
- Rationale: addresses highest-risk data integrity/security issues first while minimizing regression surface.
- Alternative considered: batch all changes in one pass. Rejected as higher-risk rollout.

## Risks / Trade-offs

- [Risk] Tightening center scope may hide transactions currently visible to managers. -> Mitigation: document expected scope and validate with center-role test data.
- [Risk] Contract alignment can break legacy client paths if stale frontend code remains deployed. -> Mitigation: add temporary compatibility handling or coordinated deploy window.
- [Risk] Stricter evidence/reference requirements can increase operator friction. -> Mitigation: tailor required fields by channel and improve UI guidance.
- [Risk] Changing teacher route behavior can disrupt admin supervision workflows. -> Mitigation: explicitly provide/retain an admin-supervision path if needed.
- [Risk] Monolithic backend edits can cause unintended side effects. -> Mitigation: constrain edits to targeted handlers and validate via endpoint-level tests.
