## ADDED Requirements

### Requirement: Parent portal read APIs SHALL return canonical envelopes and stable field mappings
The system SHALL return parent portal read responses in a canonical `{ success, data }` envelope with stable, documented field names so frontend consumers can process results deterministically.

#### Scenario: Parent loads dashboard and child list
- **WHEN** a `PARENT` requests `/api/parent/dashboard` and `/api/parent/children`
- **THEN** each response returns a canonical envelope and `data` shape that is stable across releases and sufficient for parent dashboard rendering

#### Scenario: Parent receives empty linked-children result
- **WHEN** a `PARENT` has no active links in `parent_student_links`
- **THEN** the API returns success with an empty canonical collection shape (not a contract-breaking alternate type)

### Requirement: Parent child detail APIs SHALL provide deterministic section payloads
The system SHALL provide deterministic payload structures for child schedule, grades, attendance, and invoices endpoints so parent child-detail tabs can consume them without shape inference.

#### Scenario: Parent opens child detail tabs
- **WHEN** a `PARENT` requests `/api/parent/child/:studentId/{schedule,grades,attendance,invoices}` for a linked student
- **THEN** each endpoint returns data in its documented canonical section shape and includes fields required for tab rendering

#### Scenario: Parent requests child detail without permission
- **WHEN** a `PARENT` requests child detail data for a non-linked student or without required permission flags
- **THEN** the API rejects with authorization failure and does not expose student data
