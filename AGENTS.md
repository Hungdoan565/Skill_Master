# SKILL MASTER — PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-25
**Commit:** 704d276
**Branch:** main

## OVERVIEW

Skill Master — hệ thống quản lý trung tâm đào tạo (education center management). Monorepo: Express backend + React frontend + Supabase (PostgreSQL) + pg-boss job queue. Multi-tenant theo center, phân quyền 5 role: SUPER_ADMIN, CENTER_MANAGER, TEACHER, STUDENT, PARENT.

## STRUCTURE

```
Skill_Master/
├── backend/        # Express API server (Node.js, ESM)
├── frontend/       # React SPA (Vite + TailwindCSS v4 + shadcn/ui)
├── database/       # SQL migrations (55+ sequential files)
├── supabase/       # Edge functions (consultation-api, send-assessment-result)
├── openspec/       # OpenSpec change management (specs + changes)
├── scripts/        # Utility scripts
└── package.json    # Monorepo root (TypeScript, Jest)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API routes | `backend/src/index.js` | Monolithic — hầu hết routes inline tại đây |
| Auth middleware | `backend/src/middleware/` | `requireAuth`, `requireRole` |
| Frontend routing | `frontend/src/App.jsx` | 4 role-based layouts, lazy loading |
| UI components | `frontend/src/components/ui/` | 26 shadcn/ui components |
| Feature modules | `frontend/src/features/` | 29 feature domains |
| DB schema | `database/01_schema.sql` | Base schema, subsequent files add features |
| Edge functions | `supabase/functions/` | consultation-api, send-assessment-result |
| Background jobs | `backend/src/jobs/` | pg-boss email queue, notifications |
| OpenSpec changes | `openspec/changes/` | Active sprints + archived changes |

## CONVENTIONS

- **Language**: Vietnamese comments, Vietnamese UI text, English code
- **Backend**: ESM (`type: "module"`), all routes in `index.js` (no router separation except `support.routes.js`)
- **API response**: `{ success: true/false, data/message/error }`
- **Multi-tenant**: `getEffectiveCenterId()` scopes every query to active center
- **Frontend state**: React Context (auth, sidebar, theme) — no Redux/Zustand
- **Component lib**: shadcn/ui (Radix + CVA + clsx + tailwind-merge)
- **Form handling**: react-hook-form + zod validation
- **Naming**: kebab-case files, PascalCase components, camelCase functions
- **Commit style**: hyphenated (e.g., `add-payroll-dispute-system`, `fix-teacher-dashboard-icons`)

## QUY TRÌNH LÀM VIỆC BẮT BUỘC

**Mọi tính năng mới đều phải có file OpenSpec.** Trước khi viết code, dùng skill `spx-plan` để phân tích spec. Sau đó dùng `spx-apply` để triển khai code. Cuối cùng **bắt buộc** gọi `spx-verify` để nghiệm thu trước khi coi là hoàn thành.

## ANTI-PATTERNS

- **KHÔNG** thêm route file mới — giữ pattern inline trong `index.js` (trừ khi refactor toàn bộ)
- **KHÔNG** dùng `as any` / `@ts-ignore` — project đang migrate sang TypeScript
- **KHÔNG** bỏ qua `getEffectiveCenterId` — mọi query phải scoped theo center
- **KHÔNG** hardcode role strings — dùng constants từ middleware

## COMMANDS

```bash
# Backend
cd backend && npm run dev          # Nodemon dev server
cd backend && npm start            # Production

# Frontend
cd frontend && npm run dev         # Vite dev server
cd frontend && npm run build       # Production build

# Tests
cd backend && npx jest             # Backend tests
```

## NOTES

- Backend `index.js` rất lớn (3000+ lines) — đọc bằng grep/search, không đọc toàn bộ
- Redis optional — pg-boss email queue lazy-load, app vẫn chạy không Redis
- TailwindCSS v4 (không phải v3) — config khác biệt
- Supabase dùng cho cả Auth + Database + Edge Functions
# Superpowers for Antigravity

You have superpowers.

This profile adapts Superpowers workflows for Antigravity with strict single-flow execution.

## Core Rules

1. Prefer local skills in `.agent/skills/<skill-name>/SKILL.md`.
2. Execute one core task at a time with `task_boundary`.
3. Use `browser_subagent` only for browser automation tasks.
4. Track checklist progress in `<project-root>/docs/plans/task.md` (table-only live tracker).
5. Keep changes scoped to the requested task and verify before completion claims.

## Tool Translation Contract

When source skills reference legacy tool names, use these Antigravity equivalents:

- Legacy assistant/platform names -> `Antigravity`
- `Task` tool -> `browser_subagent` for browser tasks, otherwise sequential `task_boundary`
- `Skill` tool -> `view_file ~/.gemini/skills/<skill-name>/SKILL.md` (or project-local `.agent/skills/<skill-name>/SKILL.md`)
- `TodoWrite` -> update `<project-root>/docs/plans/task.md` task list
- File operations -> `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Directory listing -> `list_dir`
- Code structure -> `view_file_outline`, `view_code_item`
- Search -> `grep_search`, `find_by_name`
- Shell -> `run_command`
- Web fetch -> `read_url_content`
- Web search -> `search_web`
- Image generation -> `generate_image`
- User communication during tasks -> `notify_user`
- MCP tools -> `mcp_*` tool family

## Skill Loading

- First preference: project skills at `.agent/skills`.
- Second preference: user skills at `~/.gemini/skills`.
- If both exist, project-local skills win for this profile.
- Optional parity assets may exist at `.agent/workflows/*` and `.agent/agents/*` as entrypoint shims/reference profiles.
- These assets do not change the strict single-flow execution requirements in this file.

## Single-Flow Execution Model

- Do not dispatch multiple coding agents in parallel.
- Decompose large work into ordered, explicit steps.
- Keep exactly one active task at a time in `<project-root>/docs/plans/task.md`.
- If browser work is required, isolate it in a dedicated browser step.

## Verification Discipline

Before saying a task is done:

1. Run the relevant verification command(s).
2. Confirm exit status and key output.
3. Update `<project-root>/docs/plans/task.md`.
4. Report evidence, then claim completion.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Skill_Master** (5411 symbols, 12541 relationships, 238 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Skill_Master/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Skill_Master/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Skill_Master/clusters` | All functional areas |
| `gitnexus://repo/Skill_Master/processes` | All execution flows |
| `gitnexus://repo/Skill_Master/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## CLI

- Re-index: `npx gitnexus analyze`
- Check freshness: `npx gitnexus status`
- Generate docs: `npx gitnexus wiki`

<!-- gitnexus:end -->
