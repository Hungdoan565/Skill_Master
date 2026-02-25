## ADDED Requirements

### Requirement: Payment import SHALL use a single canonical parse contract
The system SHALL define one canonical parse request/response schema for payment import and both frontend and backend SHALL conform to it.

#### Scenario: Operator uploads a valid statement file
- **WHEN** the client sends a parse request using the canonical contract
- **THEN** the backend returns parsed transactions in the canonical response shape

#### Scenario: Client sends non-canonical parse payload
- **WHEN** the parse endpoint receives an unsupported payload shape
- **THEN** the backend returns a validation error describing the expected contract

### Requirement: Match and apply stages SHALL share consistent identifiers and payload shapes
The system SHALL use consistent transaction identifiers and schema across parse, match, and apply so selected matches can be applied deterministically.

#### Scenario: Operator matches parsed transactions to invoices
- **WHEN** the client submits match requests from parsed transaction results
- **THEN** the backend returns match results that preserve identifiers required by apply

#### Scenario: Operator applies selected matches
- **WHEN** the client submits apply payload in canonical format
- **THEN** the backend applies only the selected matches and returns deterministic applied counts and errors

### Requirement: Import matching SHALL honor center scope for center managers
The system SHALL constrain invoice candidates and apply targets to the manager's effective center when the actor is `CENTER_MANAGER`.

#### Scenario: Center manager matches transactions
- **WHEN** a `CENTER_MANAGER` runs matching
- **THEN** only invoices in the manager's center are considered for matching

#### Scenario: Center manager applies cross-center match payload
- **WHEN** apply payload includes invoice targets outside manager center
- **THEN** the system rejects those targets and reports authorization errors without cross-center mutation
