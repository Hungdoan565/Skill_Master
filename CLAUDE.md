# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skill Master** is a full-stack Learning Management System (LMS) for English and IT training centers. Built with React (Vite) frontend and Express.js backend, using Supabase for authentication and PostgreSQL database.

## Development Commands

### Backend (Express.js + Supabase)
```bash
cd backend
npm install
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Setup
- Backend: Copy `backend/.env.example` to `backend/.env` and configure `SUPABASE_URL` and `SUPABASE_KEY`
- Frontend: Copy `frontend/.env.example` to `frontend/.env.local` and configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Architecture

### Monorepo Structure
```
Skill_Master/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── index.js           # Main API file (monolithic, ~8000+ lines)
│   │   ├── middleware/        # Auth, security middleware
│   │   ├── services/          # Business logic (enrollment, certificates)
│   │   └── lib/               # Utilities (db, schedule-conflict, session-generator)
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── features/          # Feature-based modules (barrel exports)
│       ├── components/        # Shared UI components
│       ├── contexts/          # React contexts (auth-context)
│       ├── layouts/           # Layout components
│       └── pages/             # Public pages
└── database/         # SQL migration files
```

### Frontend Feature Modules
Frontend uses **feature-based architecture** with barrel exports:
- Each feature in `src/features/` has: `components/`, `hooks/`, `pages/`, `utils/`
- Import via: `import { Component } from '@/features/feature-name'`
- Path alias `@/` maps to `frontend/src/`

### Backend API Structure
- **Monolithic**: Single `backend/src/index.js` file contains all API routes (~8000+ lines)
- **Services**: Extracted business logic in `services/` (enrollmentService, certificateService)
- **Libraries**: Reusable utilities in `lib/` (schedule-conflict, session-generator)

## Role-Based Access Control (RBAC)

### Roles Hierarchy
1. **SUPER_ADMIN**: Full system access, multi-center management
2. **CENTER_MANAGER**: Single center management
3. **TEACHER**: Teaching duties, class management
4. **STUDENT**: Learning portal access

### Authentication Flow
1. Frontend: Supabase Auth (`@supabase/supabase-js`) with JWT tokens
2. Backend: `requireAuth` middleware validates JWT via `supabase.auth.getUser(token)`
3. Backend: `requireRole(['SUPER_ADMIN', 'CENTER_MANAGER'])` checks user role
4. Frontend: `<ProtectedRoute allowedRoles={[...]}>` guards routes

### Center Filtering Pattern
```javascript
// Backend: getEffectiveCenterId helper
const { effectiveCenterId, error } = getEffectiveCenterId(req.user, centerId);
// SUPER_ADMIN: can access any center (centerId param)
// CENTER_MANAGER: restricted to req.user.centerId
```

## Special Business Logic

### 1. Schedule Conflict Detection
**File**: `backend/src/lib/schedule-conflict.js`

Multi-layer conflict detection for classes:
- **Layer 1**: Time slot overlap `(Start_A < End_B) AND (End_A > Start_B)`
- **Layer 2**: Day-of-week matching (schedule uses day numbers: 2=Mon, 8=Sun)
- **Layer 3**: Date range overlap
- Checks both **room** and **teacher** conflicts simultaneously
- Returns detailed conflict info with class names, times, and conflict types

### 2. Session Auto-Generation
**File**: `backend/src/lib/session-generator.js`

Automatically creates class sessions from schedule pattern:
- Generates sessions between `start_date` and `end_date`
- Respects `schedule` array: `[{day: 2, start: '18:00', end: '20:00'}]`
- **Day mapping**: 2=Monday, 3=Tuesday, ..., 8=Sunday (custom convention)
- Auto-calculates `teacher_rate` from teacher's `hourly_rate`
- Sets `status='completed'` for past sessions, `'scheduled'` for future
- **Locked sessions**: Never deletes/modifies sessions with `is_locked=true`

### 3. Enrollment with Draft Invoice
**File**: `backend/src/services/enrollmentService.js`

Two-phase enrollment process:
1. **Create enrollment** → Auto-creates **draft invoice**
2. Admin reviews → **Confirms invoice** (status: draft → pending)
3. Payment received → Invoice status: pending → paid/partial

**Why draft?** Prevents accidental double-billing, allows review before finalizing.

### 4. Certificate Eligibility System
**File**: `backend/src/services/certificateService.js`

Certificates require:
- Minimum attendance rate (e.g., 80%)
- Minimum average grade (e.g., 5.0/10)
- **Override mechanism**: Admin can issue with `override_reason` if criteria not met
- Eligibility check before issuance, stored in certificate `metadata`

### 5. Auth Trigger for User Profiles
**Database**: `database/21_fix_auth_trigger.sql`

**Critical**: When admin creates staff via Supabase Auth:
- Must pass `role_code` in `user_metadata` (e.g., `{role_code: 'TEACHER'}`)
- Trigger `handle_new_user()` reads metadata and creates profile in `public.users`
- **Without metadata**: Defaults to STUDENT role (wrong for staff!)

### 6. Day Number Convention
**Throughout codebase**: Days use numbers 2-8 (NOT 0-6):
- 2 = Monday, 3 = Tuesday, ..., 7 = Saturday, 8 = Sunday
- Helper: `dayNumberToJsDay()` converts to JS (0-6)
- Used in: schedules, session generation, conflict detection

### 7. Invoice Status Flow
- **draft**: Created with enrollment, not yet confirmed
- **pending**: Confirmed, awaiting payment
- **paid**: Fully paid (`paid_amount >= final_amount`)
- **partial**: Partially paid (`0 < paid_amount < final_amount`)
- **overdue**: Past `due_date` and not paid
- **cancelled**: Voided invoice

### 8. System Settings Architecture
**Table**: `system_settings` with `center_id` (nullable)
- **Global settings**: `center_id = NULL` (applies to all centers)
- **Center-specific**: `center_id = <uuid>` (overrides global)
- Settings keys: `bank_config`, `grade_config`, `payroll_config`, `system_config`, `security_config`
- **Permission**: Only SUPER_ADMIN can modify global settings

## Database Schema Key Points

### Core Tables
- **users**: Linked to `auth.users` via `id`, has `role_id` and `center_id`
- **classes**: Has `schedule` JSONB field: `[{day: 2, start: '18:00', end: '20:00'}]`
- **sessions**: Individual class meetings, has `is_locked` flag
- **enrollments**: Student-class relationship, has payment fields
- **invoices**: Separate from enrollments, supports multiple payment records
- **certificates**: Issued to students, has `metadata` JSONB with eligibility info

### Foreign Key Naming
When querying with joins, use explicit FK hints to avoid ambiguity:
```javascript
// ✅ Correct
.select('*, centers!users_center_id_fkey(id, name)')

// ❌ Ambiguous (if multiple FKs to same table)
.select('*, centers(id, name)')
```

## UI/UX Patterns

### Design System
- **Primary color**: Orange (#f97316)
- **Dark theme**: Zinc-950 sidebar, stone-100 background
- **Border radius**: 1rem (rounded-2xl) for cards
- **Spacing**: 8px grid system
- **Components**: Radix UI primitives + custom styling

### Component Library
- **shadcn/ui inspired**: Button, Input, Select components in `components/ui/`
- **Transitions**: All interactions use `transition-all duration-200`
- **Focus states**: Indigo ring with `focus:ring-2 focus:ring-indigo-500/20`

### Toast Notifications
- Custom toast system in `components/ui/toast.jsx`
- Usage: `<ToastProvider>` wraps app, components use toast context

## API Conventions

### Response Format
```javascript
// Success
{ success: true, data: {...}, message: 'Optional message' }

// Error
{ success: false, message: 'Error description', error: 'Details' }
```

### Pagination
Query params: `?page=1&limit=20&sortBy=created_at&sortOrder=desc`

### Filtering
- `centerId`: Filter by center (SUPER_ADMIN only)
- `status`: Filter by status
- `search`: Full-text search
- `startDate`, `endDate`: Date range filters

## Common Pitfalls

1. **Missing role_code in metadata**: When creating staff via Supabase Auth, always include `role_code` in `user_metadata`
2. **Day number confusion**: Remember 2=Monday, not 0=Monday
3. **Center filtering**: Always use `getEffectiveCenterId()` helper in backend APIs
4. **Locked sessions**: Never delete/modify sessions with `is_locked=true`
5. **Draft invoices**: Enrollment creates draft invoice, must be confirmed separately
6. **Foreign key hints**: Use explicit FK names in Supabase queries when ambiguous

## Testing & Debugging

### Backend Logs
Backend uses extensive console logging with emojis:
- 🔐 Authentication events
- 📝 CRUD operations
- ⚠️ Warnings
- ❌ Errors
- ✅ Success operations

### Frontend DevTools
- React DevTools for component inspection
- Supabase client logs in browser console
- Network tab for API debugging

## Package Management

- **Backend**: npm (Node.js 20+)
- **Frontend**: npm with Vite
- **Always use package managers** for dependencies (never edit package.json manually)

## Key Dependencies

### Backend
- `express`: Web framework
- `@supabase/supabase-js`: Database & auth client
- `cors`: CORS middleware
- `dotenv`: Environment variables
- `jsonwebtoken`: JWT utilities
- `bullmq`: Job queue for background tasks
- `ioredis`: Redis client (required for BullMQ)
- `nodemailer`: Email sending
- `handlebars`: Email template engine
- `pg`: PostgreSQL client

### Frontend
- `react` + `react-dom`: UI framework
- `react-router-dom`: Routing
- `@supabase/supabase-js`: Auth & database
- `axios`: HTTP client
- `lucide-react`: Icons
- `react-hook-form` + `zod`: Form validation
- `recharts`: Charts
- `date-fns`: Date utilities
- `xlsx`: Excel export

## Testing

### Backend Testing
- **Test Framework**: Jest configured in `backend/package.json`
- **Test Scripts**:
  - `backend/test-schedule-apis.js` - Automated API tests
  - `backend/test-api-automated.js` - Full API test suite
  - `backend/test-endpoints.ps1` - PowerShell endpoint validation
- **Running Tests**: Tests require authentication token from browser DevTools
  - Location: `Application > Local Storage > sb-*-auth-token > access_token`

### No Automated Test Suite
- Currently no `npm test` script configured
- Tests are run manually using provided scripts

## Email Queue System

**Stack**: BullMQ + Redis + Nodemailer + Handlebars

The backend uses BullMQ for asynchronous email processing:
- **Queue**: Background job processing for emails
- **Templates**: Handlebars templates (location TBD in codebase)
- **Redis Required**: Must have Redis server running locally or remote
- **Use Cases**: Welcome emails, invoice notifications, certificate issuance

**Setup**:
```bash
# Install and start Redis (required for BullMQ)
# macOS: brew install redis && brew services start redis
# Windows: Download from https://redis.io/download
# Linux: sudo apt-get install redis-server
redis-server
```

## Additional Technical Details

### Session Uniqueness Constraint
Database enforces: **One class can only have one session per date**
- Constraint: `UNIQUE(class_id, session_date)` in `sessions` table
- Prevents double-booking of sessions

### Vite Proxy Configuration
Frontend proxies `/api` requests to backend:
- Config: `frontend/vite.config.mts`
- Proxy: `/api` → `http://localhost:3000`
- Allows relative API calls from frontend

### Locked Sessions Protection
Sessions with `is_locked=true` are **never** deleted or modified:
- Protected when they have: attendance records, grades, or payment records
- Auto-generation skips locked sessions
- Manual deletion also blocked

## Additional AI Tools

When working on this project, use specialized AI tools for different tasks:

-

**Codex CLI (**

```
codex
```

**)**

: Use for main tasks requiring code generation, designing, and refactoring
-

**Gemini CLI (**

```
gemini
```

**)**

: Use with model

```
gemini-3-pro-preview
```

(must be this exact model) for:
  - Finding documentation
  - Writing informational content
  - Generating long text
  - i18n translations
  - UX specifications

Example usage:
Bash
# Codex for code tasks
codex "Refactor component X to use hooks"

# Gemini for content/docs
gemini -m gemini-3.0-pro-preview "Write Vietnamese translations for navigation items"


## Codex CLI
Codex CLI

Usage: codex [OPTIONS] [PROMPT]
       codex [OPTIONS] <COMMAND> [ARGS]

Commands:
  exec        Run Codex non-interactively [aliases: e]
  review      Run a code review non-interactively
  login       Manage login
  logout      Remove stored authentication credentials
  mcp         [experimental] Run Codex as an MCP server and manage MCP servers
  mcp-server  [experimental] Run the Codex MCP server (stdio transport)
  app-server  [experimental] Run the app server or related tooling
  completion  Generate shell completion scripts
  sandbox     Run commands within a Codex-provided sandbox [aliases: debug]
  apply       Apply the latest diff produced by Codex agent as a `git apply` to your local working
              tree [aliases: a]
  resume      Resume a previous interactive session (picker by default; use --last to continue the
              most recent)
  cloud       [EXPERIMENTAL] Browse tasks from Codex Cloud and apply changes locally
  features    Inspect feature flags
  help        Print this message or the help of the given subcommand(s)

Arguments:
  [PROMPT]  Optional user prompt to start the session

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from
          `~/.codex/config.toml`. Use a dotted path (`foo.bar.baz`) to override nested values. The
          `value` portion is parsed as TOML. If it fails to parse as TOML, the raw string is used
          as a literal
      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`
      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`
  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt
  -m, --model <MODEL>
          Model the agent should use
      --oss
          Convenience flag to select the local open source model provider. Equivalent to -c
          model_provider=oss; verifies a local LM Studio or Ollama server is running
      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection
  -p, --profile <CONFIG_PROFILE>
          Configuration profile from config.toml to specify default options
  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands [possible
          values: read-only, workspace-write, danger-full-access]
  -a, --ask-for-approval <APPROVAL_POLICY>
          Configure when the model requires human approval before executing a command [possible
          values: untrusted, on-failure, on-request, never]
      --full-auto
          Convenience alias for low-friction sandboxed automatic execution (-a on-request,
          --sandbox workspace-write)
      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed
  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root
      --search
          Enable web search (off by default). When enabled, the native Responses `web_search` tool
          is available to the model (no per‑call approval)
      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace
  -h, --help
          Print help (see more with '--help')
  -V, --version
          Print version
        
  ## Gemini CLI 
Usage: gemini [options] [command]

Gemini CLI - Launch an interactive CLI, use -p/--prompt for non-interactive mode

Commands:
  gemini [query..]             Launch Gemini CLI                                        [default]
  gemini mcp                   Manage MCP servers
  gemini extensions <command>  Manage Gemini CLI extensions.                 [aliases: extension]

Positionals:
  query  Positional prompt. Defaults to one-shot; use -i/--prompt-interactive for interactive.

Options:
  -d, --debug                     Run in debug mode?                   [boolean] [default: false]
  -m, --model                     Model                                                  [string]
  -p, --prompt                    Prompt. Appended to input on stdin (if any).
  [deprecated: Use the positional prompt instead. This flag will be removed in a future version.]
                                                                                         [string]
  -i, --prompt-interactive        Execute the provided prompt and continue in interactive mode
                                                                                         [string]
  -s, --sandbox                   Run in sandbox?                                       [boolean]
  -y, --yolo                      Automatically accept all actions (aka YOLO mode, see
                                  https://www.youtube.com/watch?v=xvFZjo5PgG0 for more details)?
                                                                       [boolean] [default: false]
      --approval-mode             Set the approval mode: default (prompt for approval), auto_edit
                                  (auto-approve edit tools), yolo (auto-approve all tools)
                                               [string] [choices: "default", "auto_edit", "yolo"]
      --experimental-acp          Starts the agent in ACP mode                          [boolean]
      --allowed-mcp-server-names  Allowed MCP server names                                [array]
      --allowed-tools             Tools that are allowed to run without confirmation      [array]
  -e, --extensions                A list of extensions to use. If not provided, all extensions
                                  are used.                                               [array]
  -l, --list-extensions           List all available extensions and exit.               [boolean]
  -r, --resume                    Resume a previous session. Use "latest" for most recent or
                                  index number (e.g. --resume 5)                         [string]
      --list-sessions             List available sessions for the current project and exit.
                                                                                        [boolean]
      --delete-session            Delete a session by index number (use --list-sessions to see
                                  available sessions).                                   [string]
      --include-directories       Additional directories to include in the workspace
                                  (comma-separated or multiple --include-directories)     [array]
      --screen-reader             Enable screen reader mode for accessibility.          [boolean]
  -o, --output-format             The format of the CLI output.
                                                [string] [choices: "text", "json", "stream-json"]
  -v, --version                   Show version number                                   [boolean]
  -h, --help                      Show help                                             [boolean]
