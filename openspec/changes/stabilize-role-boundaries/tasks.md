## 1. Spec & Planning

- [ ] 1.1 Register OpenSpec change for role-boundary stabilization.
- [ ] 1.2 Lock the owner model for `SUPER_ADMIN`, `CENTER_MANAGER`, `TEACHER`, and `STUDENT`.
- [ ] 1.3 Record the no-rewrite rule: keep, re-scope, hide, harden.

## 2. Backend Ownership Hardening

- [ ] 2.1 Audit admin and manager routes for explicit backend ownership checks.
- [ ] 2.2 Harden strategic and governance routes for `SUPER_ADMIN`.
- [ ] 2.3 Harden center-scoped routes for `CENTER_MANAGER`.
- [ ] 2.4 Extend regression coverage for role ownership and center scope.

## 3. Admin / Manager UI Boundary Separation

- [ ] 3.1 Split `SUPER_ADMIN` and `CENTER_MANAGER` navigation mental models.
- [ ] 3.2 Align dashboards with governance-first vs operations-first ownership.
- [ ] 3.3 Remove or hide cross-owner actions from the wrong surface.

## 4. Center Manager Operating Model

- [ ] 4.1 Re-scope manager workflows into one-center operations.
- [ ] 4.2 Keep core center features while removing cross-center or governance clutter.
- [ ] 4.3 Add clear escalation paths from manager to super admin.

## 5. Teacher Hardening

- [ ] 5.1 Preserve teacher core routes and workflows.
- [ ] 5.2 Harden own-class and own-session boundaries.
- [ ] 5.3 Clarify escalation and request-result states.

## 6. Student Hardening

- [ ] 6.1 Preserve student self-service routes and core visibility.
- [ ] 6.2 Simplify UI language and remove internal workflow jargon.
- [ ] 6.3 Harden trust signals across attendance, grades, support, and payment states.

## 7. Regression & Verification

- [ ] 7.1 Run admin/manager scope regression.
- [ ] 7.2 Run teacher portal regression.
- [ ] 7.3 Run student consistency regression.
- [ ] 7.4 Run targeted E2E verification for admin, teacher, and student surfaces.

## 8. Parent Readiness Gate

- [ ] 8.1 Document explicit prerequisites before starting `PARENT`.
- [ ] 8.2 Mark deferred work that is intentionally out of scope for this change.
