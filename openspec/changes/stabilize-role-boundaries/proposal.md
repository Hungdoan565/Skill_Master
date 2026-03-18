## Why

The system already has strong feature coverage for `SUPER_ADMIN`, `CENTER_MANAGER`, `TEACHER`, and `STUDENT`, but the business-owner boundaries between roles are still too soft for stable real-world center operations.

The biggest risks are:

- `SUPER_ADMIN` and `CENTER_MANAGER` still overlap too much in day-to-day operational surfaces.
- Some admin capabilities appear to rely too heavily on route-shell assumptions instead of explicit backend ownership checks.
- `TEACHER` and `STUDENT` are close to correct, but still depend on upstream role clarity and cleaner UI ownership.
- `PARENT` should not be built until the current 4-role contract is stable.

This change stabilizes the role model without rewriting the product from scratch.

## What Changes

- Harden backend ownership rules between `SUPER_ADMIN` and `CENTER_MANAGER`.
- Separate admin and manager working surfaces so UI reflects role intent.
- Re-scope `CENTER_MANAGER` into a true one-center operator.
- Preserve `TEACHER` and `STUDENT` core surfaces, but harden boundaries, state clarity, and trust signals.
- Define the completion gate required before starting `PARENT`.

## Capabilities

### New Capabilities
- `role-boundary-stabilization`: explicit ownership rules and escalation flow for the 4 active roles.
- `manager-operating-model`: center-manager work surface aligned to one-center operations.
- `role-ui-clarity`: role-specific menus and dashboards communicate correct business ownership.

### Modified Capabilities
- `admin-governance`: `SUPER_ADMIN` becomes governance-first and exception-oriented.
- `center-operations`: `CENTER_MANAGER` becomes the clear owner of one-center execution.
- `teacher-execution`: `TEACHER` remains execution-focused with clearer escalation states.
- `student-self-service`: `STUDENT` remains self-service focused with clearer trust signals and simpler language.

## Impact

- Frontend:
  - `frontend/src/App.jsx`
  - `frontend/src/components/layout/admin-sidebar.jsx`
  - `frontend/src/features/dashboard/pages/DashboardPage.jsx`
  - `frontend/src/features/dashboard/pages/ManagerDashboardPage.jsx`
  - `frontend/src/features/admin-dashboard/pages/AdminDashboardPage.jsx`
  - `frontend/src/features/teacher-dashboard/*`
  - `frontend/src/features/teacher-classes/*`
  - `frontend/src/features/student-portal/*`
- Backend:
  - `backend/src/index.js`
  - `backend/src/lib/center-scope.js`
- Verification:
  - admin/manager scope regression
  - teacher portal regression
  - student consistency regression
  - admin/teacher/student E2E coverage
