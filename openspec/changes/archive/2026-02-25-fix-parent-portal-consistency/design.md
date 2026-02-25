## Context

Parent-facing flows exist across frontend and backend, but several integration seams are inconsistent:

- Parent routes in the app router do not fully match parent sidebar navigation targets.
- Parent child-detail route parameters are inconsistent between route definition and page consumption.
- Parent portal hooks/pages and backend `/api/parent/*` response envelopes are misaligned.
- Parent relationship management currently depends on direct database operations instead of explicit management APIs.

These gaps are cross-cutting (router, UI data access layer, API contracts, RBAC), so a design artifact is needed before implementation.

## Goals / Non-Goals

**Goals:**
- Define a canonical response contract for parent portal read endpoints and align consumers.
- Ensure parent navigation only points to valid route entries, with deterministic child-detail routing behavior.
- Define secure admin/manager APIs for managing `parent_student_links` with role and center constraints.
- Preserve current `PARENT` read-access permission semantics (`can_pay`, `can_view_academics`) while making behavior explicit.

**Non-Goals:**
- Full redesign of auth architecture or role model.
- New billing/payment business logic beyond parent consistency needs.
- Replacing Supabase auth/RLS with a new data access platform.
- Major UI redesign for the parent portal visual system.

## Decisions

1. Canonical parent read contract at backend boundary
- Decision: Keep backend as source of truth for parent response shapes and align frontend hooks/pages to those shapes.
- Rationale: Reduces duplication and avoids parallel undocumented contracts in UI code.
- Alternative considered: reshape API payloads to match current frontend assumptions. Rejected because existing backend envelope format (`{ success, data }`) is already established and broadly used.

2. Single authoritative route map for parent portal
- Decision: Parent sidebar items MUST map to defined `/parent/*` routes. Missing pages will either be added as explicit routes or removed from navigation until implemented.
- Rationale: Prevents dead-end links and inconsistent UX.
- Alternative considered: allow sidebar links to unresolved paths as placeholders. Rejected due to avoidable 404 behavior.

3. Strict child route param consistency
- Decision: Use `studentId` consistently in route definition, param extraction, and downstream hook calls.
- Rationale: Prevents silent data load failures in child detail tabs.
- Alternative considered: dual support for both `id` and `studentId`. Rejected as unnecessary complexity.

4. Parent link management via explicit admin/manager APIs
- Decision: Add management endpoints for create/update/deactivate of `parent_student_links`, protected by role and center-scope checks.
- Rationale: Removes manual DB dependency and operational risk, while preserving access controls.
- Alternative considered: continue manual SQL operations only. Rejected due to poor operational safety and traceability.

5. Permission flags remain enforcement source for parent child access
- Decision: Continue enforcing `can_view_academics` and `can_pay` checks in parent child endpoints, with consistent error behavior.
- Rationale: Maintains least-privilege behavior already present in backend.
- Alternative considered: flatten permissions into a single allow/deny flag. Rejected because it reduces control granularity.

## Risks / Trade-offs

- [Risk] Contract alignment may break hidden UI assumptions in parent pages. -> Mitigation: add targeted frontend tests for hook-to-page data mapping and empty-state handling.
- [Risk] New management APIs could broaden attack surface if scope checks are weak. -> Mitigation: require role + center ownership checks and enforce server-side validation of link targets.
- [Risk] Route map tightening may temporarily hide unfinished parent pages. -> Mitigation: keep explicit placeholders where needed, but only on defined routes.
- [Risk] Existing environments may not have required parent migrations. -> Mitigation: verify `53_parent_user_support.sql` application before rollout and fail fast with clear runtime errors.

## Migration Plan

1. Verify DB support (`roles.PARENT`, `parent_student_links`) is present in target environments.
2. Implement backend/ frontend contract and routing alignment in a single release branch.
3. Add regression tests for parent route access, child-detail param flow, and contract handling.
4. Deploy to staging and run role-based manual checks for `PARENT`, `CENTER_MANAGER`, and `SUPER_ADMIN` management flows.
5. Roll out production with monitoring of parent endpoint error rates and 4xx/5xx spikes.

Rollback:
- Revert parent route map and hook contract changes to previous stable commit.
- Disable new management endpoints if authorization anomalies are detected.

## Open Questions

- Should parent sidebar include dedicated top-level pages for schedule/grades/attendance/invoices, or should those remain child-detail tabs only?
- For `CENTER_MANAGER`, should parent-link management be limited strictly to their center's students and parent accounts, or only to student center ownership?
- Do we require audit-log persistence beyond existing `created_by/updated_at` fields for parent-link changes?
