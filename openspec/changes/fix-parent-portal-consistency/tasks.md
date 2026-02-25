## 1. Parent Route and Navigation Consistency

- [x] 1.1 Align parent route parameter usage to `studentId` across router definitions and `ParentChildDetail` page extraction.
- [x] 1.2 Ensure all parent sidebar targets resolve to defined `/parent/*` routes (add explicit routes or remove unresolved links).
- [x] 1.3 Add controlled placeholder views for any intentionally deferred parent pages instead of route fallthrough.

## 2. Parent API Contract Alignment

- [x] 2.1 Define canonical frontend mapping for `/api/parent/dashboard` and `/api/parent/children` response envelopes.
- [x] 2.2 Update parent hooks to consume nested `data` payloads deterministically for dashboard, children, schedule, grades, attendance, and invoices.
- [x] 2.3 Update parent pages to use canonical field names from mapped hook results and handle empty states safely.

## 3. Backend Parent Link Management APIs

- [ ] 3.1 Add secured management endpoints for creating and updating `parent_student_links` records.
- [ ] 3.2 Enforce `SUPER_ADMIN` and `CENTER_MANAGER` authorization with effective center-scope checks for mutations.
- [ ] 3.3 Persist actor/timestamp metadata for parent-link mutations and return canonical success/error envelopes.

## 4. Validation and Regression Coverage

- [x] 4.1 Add frontend tests for parent route guarding, valid sidebar navigation targets, and child-detail parameter wiring.
- [x] 4.2 Add frontend tests for parent hook/page data contract mapping and empty-state rendering.
- [ ] 4.3 Add backend tests for parent-link management authorization, center-scope denial, and successful mutation cases.

## 5. Rollout Readiness

- [ ] 5.1 Verify required DB migration support (`53_parent_user_support.sql`) in target environments before deployment.
- [ ] 5.2 Execute manual role walkthrough for `PARENT`, `CENTER_MANAGER`, and `SUPER_ADMIN` across parent flows.
- [ ] 5.3 Document rollout notes and fallback behavior for parent route and API contract changes.
