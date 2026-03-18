## Context

The current product is not primarily missing role features. The deeper issue is that role ownership is not yet consistently communicated and enforced across backend permissions, dashboard surfaces, navigation, and escalation flows.

This is most visible between `SUPER_ADMIN` and `CENTER_MANAGER`, where business responsibilities are conceptually different but still share too much infrastructure and too many mental models.

## Goals / Non-Goals

**Goals**
- Make `SUPER_ADMIN` governance-first, not branch-operator-first.
- Make `CENTER_MANAGER` the true owner of one-center operations.
- Keep `TEACHER` focused on teaching execution and class-level outcomes.
- Keep `STUDENT` focused on self-service learning, payment visibility, and support.
- Align UI surfaces with business ownership instead of only hiding things with permission checks.
- Establish a clear prerequisite gate before starting `PARENT`.

**Non-Goals**
- Large route-architecture rewrite.
- Full dashboard rebuild from zero.
- Adding broad new feature domains unrelated to role clarity.
- Building `PARENT` in this change.

## Decisions

### 1. Keep the feature skeleton, re-scope the owners
The implementation will keep most existing routes and features, then reassign ownership through:
- backend role hardening
- center-scoped checks
- UI surface cleanup
- escalation-state clarity

### 2. `SUPER_ADMIN` is governance and exception authority
`SUPER_ADMIN` owns:
- cross-center visibility
- audit and governance
- policy and permission control
- critical exception approval

`SUPER_ADMIN` should not be the default operator for normal center-level work.

### 3. `CENTER_MANAGER` is the one-center operator
`CENTER_MANAGER` owns:
- local students, classes, staff coordination
- local support and finance follow-up
- center operations dashboard
- center-scoped exception handling

### 4. `TEACHER` remains conservative
`TEACHER` should stay close to the current successful shape:
- own schedule
- own classes
- own attendance and grades
- leave, availability, payroll visibility

The main change is clearer escalation and boundary hardening, not a role redesign.

### 5. `STUDENT` remains conservative
`STUDENT` should stay focused on:
- schedule
- grades
- attendance
- tuition/payment visibility
- certificates
- support

The main change is clearer language and more trustworthy states, not broader feature growth.

### 6. UI must communicate ownership
Menus, dashboard cards, worklists, and empty states should reinforce who owns the action.

This means:
- `SUPER_ADMIN` UI should feel like governance and oversight.
- `CENTER_MANAGER` UI should feel like a one-center operating cockpit.
- `TEACHER` UI should feel like a teaching cockpit.
- `STUDENT` UI should feel like simple self-service.

## Risks / Trade-offs

- Tightening backend role guards may expose latent flows that were previously working only by accident.
- Separating admin and manager surfaces may briefly feel disruptive to users accustomed to the current overlap.
- Keeping the existing route skeleton avoids a rewrite, but requires discipline to prevent partial fixes.
- UI cleanup without strict backend hardening would be cosmetic only; backend ownership must land first.

## Migration Plan

1. Register the OpenSpec change and acceptance checklist.
2. Harden backend ownership and manager center-scope enforcement.
3. Split `SUPER_ADMIN` and `CENTER_MANAGER` dashboard/sidebar mental models.
4. Re-scope manager-owned operational flows.
5. Harden teacher execution and escalation visibility.
6. Harden student trust signals and self-service states.
7. Run cross-role verification.
8. Lock the `PARENT` readiness gate.

## Acceptance Criteria

- `SUPER_ADMIN` and `CENTER_MANAGER` have clearly different default working surfaces.
- Backend strategic and governance routes require explicit `SUPER_ADMIN` ownership where appropriate.
- Manager actions are center-scoped and cannot drift cross-center.
- Teacher actions remain restricted to own teaching scope.
- Student-facing states avoid internal staff jargon and remain contract-driven.
- Role boundaries are covered by targeted regression tests.
- `PARENT` remains blocked until the 4 active roles pass the new boundary contract.
