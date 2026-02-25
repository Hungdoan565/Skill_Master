## ADDED Requirements

### Requirement: Center manager transaction visibility SHALL be center-scoped
The system SHALL restrict transaction list results for `CENTER_MANAGER` users to payments that belong to invoices in the manager's effective center.

#### Scenario: Center manager requests transactions without center override
- **WHEN** a `CENTER_MANAGER` calls the transaction listing endpoint
- **THEN** the response includes only transactions whose invoice class belongs to the manager's center

#### Scenario: Super admin requests transactions
- **WHEN** a `SUPER_ADMIN` calls the transaction listing endpoint
- **THEN** the response may include transactions across all centers according to existing filters

### Requirement: Payment verification actions SHALL enforce center ownership
The system SHALL validate center ownership before processing `verify`, `reject`, or `bulk-verify` actions when performed by `CENTER_MANAGER` users.

#### Scenario: Center manager verifies payment in own center
- **WHEN** a `CENTER_MANAGER` verifies a payment tied to an invoice in their center
- **THEN** the system accepts the operation and records verifier metadata

#### Scenario: Center manager verifies payment in another center
- **WHEN** a `CENTER_MANAGER` attempts to verify or reject a payment tied to another center
- **THEN** the system rejects the operation with authorization failure and no data mutation
