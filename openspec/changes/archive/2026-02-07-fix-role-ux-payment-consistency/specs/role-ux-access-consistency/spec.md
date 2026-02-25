## ADDED Requirements

### Requirement: Teacher portal access policy SHALL be explicit and consistent
The system SHALL define a single explicit policy for who can access teacher-facing routes and align frontend guards with backend endpoint authorization.

#### Scenario: Teacher opens teacher portal
- **WHEN** a `TEACHER` accesses `/teacher/*`
- **THEN** route entry and teacher API calls succeed according to role permissions

#### Scenario: Non-teacher opens teacher portal
- **WHEN** a non-teacher role accesses `/teacher/*`
- **THEN** the system either blocks route access or routes through an explicitly defined supervision mode, consistent with backend permissions

### Requirement: Role-gated UI states SHALL not rely on email-pattern role inference
The system SHALL use canonical profile/database role codes for authorization-sensitive route and navigation decisions.

#### Scenario: User email suggests admin pattern but role is not admin
- **WHEN** the user has non-admin canonical role with admin-like email
- **THEN** authorization-sensitive UI does not grant admin/teacher portal entry based on email pattern

### Requirement: Student payment UX wording SHALL reflect verification flow
The system SHALL present student payment calls-to-action and statuses consistent with the actual submit-proof then verify lifecycle.

#### Scenario: Student sees debt payment action
- **WHEN** a student opens the payment action from dashboard
- **THEN** CTA wording indicates proof submission/confirmation rather than immediate final payment

#### Scenario: Student submits transfer evidence
- **WHEN** evidence submission succeeds and payment remains pending verification
- **THEN** the UI explicitly communicates pending verification status and next expected step
