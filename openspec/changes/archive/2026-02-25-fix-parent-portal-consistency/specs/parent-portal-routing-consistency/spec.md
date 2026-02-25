## ADDED Requirements

### Requirement: Parent navigation targets SHALL resolve to defined parent routes
The system SHALL ensure every parent sidebar navigation target maps to a defined `/parent/*` route and an associated renderable view.

#### Scenario: Parent clicks a sidebar destination
- **WHEN** a `PARENT` selects any sidebar menu item
- **THEN** navigation resolves to a defined parent route and does not fall through to a 404 placeholder

#### Scenario: Parent route is intentionally unavailable
- **WHEN** a parent feature is not yet implemented
- **THEN** the route remains explicitly defined with a controlled placeholder view instead of an undefined navigation target

### Requirement: Parent child detail route parameter SHALL be consistent end-to-end
The system SHALL use one canonical child route parameter name across router definitions, page parameter extraction, and API-hook invocation.

#### Scenario: Parent opens a child detail page
- **WHEN** a `PARENT` navigates to `/parent/child/:studentId`
- **THEN** the page extracts `studentId` and uses it consistently to load child schedule, grades, attendance, and invoices

#### Scenario: Parent opens child detail with invalid parameter
- **WHEN** the route parameter is missing or invalid
- **THEN** the page shows a controlled not-found/invalid-child state without crashing dependent tabs

### Requirement: Parent route access SHALL remain role-gated
The system SHALL restrict `/parent/*` routes to canonical `PARENT` role users and deny other roles unless explicitly configured by policy.

#### Scenario: Parent accesses parent route
- **WHEN** a `PARENT` user opens `/parent/*`
- **THEN** the route renders parent layout and content

#### Scenario: Non-parent accesses parent route
- **WHEN** a non-`PARENT` user opens `/parent/*`
- **THEN** the route guard blocks access and redirects according to auth policy
