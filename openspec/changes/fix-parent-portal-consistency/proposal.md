## Why

The PARENT portal has core building blocks, but current frontend routing and data contracts do not align with backend responses, causing broken or inconsistent user flows. This should be fixed now to make parent access reliable before broader role/UX rollout.

## What Changes

- Align parent portal frontend-backend response contracts so hooks and pages consume the canonical payload shape from `/api/parent/*` endpoints.
- Fix parent routing inconsistencies, including route parameter naming and sidebar links that currently point to missing routes.
- Standardize parent portal page data mappings (field naming and nested structures) so dashboard and child detail views render consistently.
- Add parent-role regression tests for route access, parameter wiring, and API contract handling.
- Add explicit admin/manager management APIs for `parent_student_links` to support controlled relationship maintenance without manual database edits.

## Capabilities

### New Capabilities
- `parent-portal-contract-alignment`: Define and enforce consistent API response contracts and field mappings for all parent portal read flows.
- `parent-portal-routing-consistency`: Define valid parent route map, parameter behavior, and navigation consistency between router and sidebar.
- `parent-link-management`: Define secure admin/manager APIs and authorization rules for creating and updating parent-student links.

### Modified Capabilities
- None.

## Impact

- Frontend: `frontend/src/App.jsx`, `frontend/src/components/layout/parent-sidebar.jsx`, `frontend/src/features/parent-portal/pages/*`, `frontend/src/features/parent-portal/hooks/*`.
- Backend: `backend/src/index.js` (`/api/parent/*` and new parent-link management endpoints).
- Database assumptions: `parent_student_links` from `database/53_parent_user_support.sql` must be present.
- Testing: new/updated frontend and backend tests for parent routing, contract correctness, and RBAC.
