## ADDED Requirements

### Requirement: Verification metadata SHALL be complete for manual verification actions
The system SHALL persist complete verification audit metadata for manual verification and rejection actions, including verifier identity, timestamp, status, and rejection reason when applicable.

#### Scenario: Staff verifies pending payment
- **WHEN** authorized staff marks a pending payment as verified
- **THEN** the record stores verifier identity, verification timestamp, and final verification status

#### Scenario: Staff rejects pending payment
- **WHEN** authorized staff rejects a pending payment
- **THEN** the record stores verifier identity, rejection timestamp, rejection status, and non-empty rejection reason

### Requirement: Evidence requirements SHALL be explicit by payment channel
The system SHALL enforce channel-specific minimum evidence/reference requirements for creating or importing payments.

#### Scenario: Student transfer submission
- **WHEN** a student submits bank transfer proof
- **THEN** the system requires transfer evidence fields defined for student channel before accepting submission

#### Scenario: Staff records non-cash payment
- **WHEN** staff records a non-cash payment method
- **THEN** the system requires channel-defined reference or evidence fields before finalizing status

### Requirement: Verification status transitions SHALL be deterministic
The system SHALL define allowed transitions among `pending`, `verified`, and `rejected` and reject invalid state transitions.

#### Scenario: Verifying already verified payment
- **WHEN** a verify action targets a payment already in verified state
- **THEN** the system rejects the action as invalid transition

#### Scenario: Rejecting already rejected payment
- **WHEN** a reject action targets a payment already rejected
- **THEN** the system rejects the action as invalid transition
