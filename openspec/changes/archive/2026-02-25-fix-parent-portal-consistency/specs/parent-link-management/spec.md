## ADDED Requirements

### Requirement: Parent-student link management SHALL be available through authorized APIs
The system SHALL provide API operations to create, update, and deactivate `parent_student_links` without requiring direct database changes.

#### Scenario: Admin creates a parent-student link
- **WHEN** an authorized admin user submits a valid parent-student relationship payload
- **THEN** the system persists a new active link with relationship metadata and returns the created link record

#### Scenario: Authorized user updates link permissions
- **WHEN** an authorized user updates `can_pay`, `can_view_academics`, or `is_primary` for an existing link
- **THEN** the system validates constraints and persists the updated permissions

### Requirement: Parent link management SHALL enforce role and center scope
The system SHALL enforce role-based and center-aware constraints for link management actions.

#### Scenario: Center manager manages link in own center
- **WHEN** a `CENTER_MANAGER` manages parent links for students in their effective center
- **THEN** the system allows the action when payload and scope validation pass

#### Scenario: Center manager attempts cross-center link management
- **WHEN** a `CENTER_MANAGER` manages a link for a student outside their effective center
- **THEN** the system rejects the action with authorization failure and no mutation

### Requirement: Parent link changes SHALL preserve auditability
The system SHALL record actor identity and timestamps for link-management mutations.

#### Scenario: Link is created or updated
- **WHEN** a parent-student link mutation succeeds
- **THEN** actor and timestamp metadata are persisted and available for audit/review
