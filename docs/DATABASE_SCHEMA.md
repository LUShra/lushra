# LUSHRA DATABASE SCHEMA

Version: 1.0
Status: Operational reference
Authority: Describes the live schema of the `lushra` Supabase project (`fiilitjyencsgxrvpmzt`). Subordinate to `docs/07_PLATFORM_ARCHITECTURE.md` and `docs/08_ENGINEERING_STANDARDS.md`; where this document and the actual live schema disagree, the live schema is authoritative and this document is out of date and should be corrected.

---

## 1. Purpose

This document describes the tables, functions, triggers, and Row-Level Security policies that exist in the `public` schema today, and the lifecycle of the one piece of application data currently provisioned automatically: a user's personal workspace. It is an operational reference, not a design proposal -- every object described here has been applied to the live project.

---

## 2. Tables

### 2.1 `public.workspaces`

Product Definition §30 Workspace entity. One row per user-owned workspace. First release defaults every user into exactly one, provisioned automatically (§5).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `owner_id` | `uuid` | `not null references auth.users(id) on delete cascade`, **`unique`** |
| `name` | `text` | `not null`, non-blank, ≤120 characters |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()`, trigger-maintained |

`owner_id` is unique across the whole table (added in Milestone 7, `20260726100000_ensure_personal_workspace.sql`): the schema currently models only personal workspaces, so "one workspace per user" is expressed directly as ownership uniqueness rather than a separate `type` column.

### 2.2 `public.workspace_memberships`

Product Definition §30 Workspace Membership entity.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade` |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `role` | `text` | `not null default 'owner' check (role in ('owner'))` |
| `created_at` | `timestamptz` | `not null default now()` |

`UNIQUE (workspace_id, user_id)`. Only the `'owner'` role exists; a CHECK constraint is used instead of a Postgres ENUM so additional roles can be added later without an `ALTER TYPE`.

### 2.3 `public.projects`

Product Definition §30 Project entity, scoped to first-release capability (create, view, rename, archive, restore). Project Context foundational fields live directly on this table rather than a separate table -- Context has no independent lifecycle yet.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade` |
| `owner_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `name` | `text` | `not null`, non-blank, ≤160 characters |
| `description` | `text` | nullable, ≤2000 characters |
| `status` | `text` | `not null default 'active' check (status in ('active','archived'))` |
| `archived_at` | `timestamptz` | nullable; consistent with `status` via CHECK |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()`; `updated_at` trigger-maintained |

Created, renamed, archived, and restored directly by application code (Milestone 8, `apps/web/features/projects/`) via ordinary `INSERT`/`UPDATE` through the existing Milestone 6 RLS policies -- no new migration or database function was required. See §8.

---

## 3. Functions

| Function | Security | Callable by | Purpose |
|---|---|---|---|
| `is_workspace_member(target_workspace_id uuid) returns boolean` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | RLS helper: does the current user belong to this workspace. |
| `create_workspace(workspace_name text) returns workspaces` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | Milestone 6's general-purpose workspace creator. **Not currently called by the application** -- superseded for the personal-workspace path by `ensure_personal_workspace()`. Left in place unmodified; calling it for a user who already owns a workspace now fails with a unique-constraint violation rather than silently creating a second one, which is correct given §2.1's uniqueness rule. |
| `ensure_personal_workspace() returns workspaces` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | The idempotent personal-workspace provisioning entry point. See §5. |
| `set_updated_at() returns trigger` | invoker, `search_path=public` | (trigger only) | Sets `NEW.updated_at = now()` on `workspaces` and `projects`. |
| `prevent_ownership_reassignment() returns trigger` | invoker, `search_path=public` | (trigger only) | Rejects any change to `owner_id` (and, on `projects`, `workspace_id`) via `UPDATE`. |

All `SECURITY DEFINER` functions: `search_path` pinned, every reference schema-qualified, `EXECUTE` revoked from `PUBLIC` and `anon`, granted only to `authenticated`. None accept a caller-supplied user or owner ID -- every one uses `auth.uid()` exclusively, so a caller can never act on another user's behalf.

---

## 4. Row-Level Security

RLS is enabled on all three tables. `anon` has zero policies anywhere, so unauthenticated requests receive zero rows or a permission-denied error, never real data.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `workspaces` | member (`is_workspace_member(id)`) | none for `authenticated` -- only `create_workspace()`/`ensure_personal_workspace()` (bypass RLS as `SECURITY DEFINER`) | owner only (`auth.uid() = owner_id`) | none |
| `workspace_memberships` | member (`is_workspace_member(workspace_id)`) | none | none | none |
| `projects` | member (`is_workspace_member(workspace_id)`) | member + `owner_id = auth.uid()` | member | none (archive via UPDATE) |

Ownership columns (`workspaces.owner_id`, `projects.owner_id`, `projects.workspace_id`) cannot be changed by an ordinary `UPDATE` even by a workspace member -- `prevent_ownership_reassignment()` rejects the change regardless of what any RLS policy would otherwise permit, closing a gap a `WITH CHECK owner_id = auth.uid()` policy alone would miss (a user owning two workspaces could otherwise move a project between them).

---

## 5. Personal workspace provisioning lifecycle

**Trigger point:** the workspace layout (`apps/web/app/workspace/layout.tsx`) calls `ensure_personal_workspace()` on every authenticated request to `/workspace` or any nested route, after `supabase.auth.getUser()` has confirmed a real session. Provisioning never happens before a server-validated session exists -- it is not attempted inside the sign-up action itself, since email confirmation may mean no session exists yet at that point.

**Behavior:**
1. If the calling user already owns a workspace, that row is returned unchanged.
2. If not, a workspace named `"Personal workspace"` and its owner membership row are inserted in one atomic call.
3. Every code path returns exactly one workspace row for the calling user; there is no path that returns nothing for an authenticated call.

**Idempotency and concurrency:** guaranteed at the database level, not by application logic. `workspaces.owner_id` is `UNIQUE`, and the insert uses `ON CONFLICT (owner_id) DO NOTHING`. Two simultaneous calls for the same user (two tabs, a retried request, overlapping layout renders) resolve so that exactly one performs the real insert; every other call detects the conflict and re-selects the row the winning call created, rather than erroring or creating a duplicate. Within a single request, `apps/web/features/workspace/get-or-create-personal-workspace.ts` wraps the call in React's `cache()` so the layout and any page that also needs the workspace (for example the Overview page) share one underlying database call rather than provisioning independently.

**Failure handling:** if the RPC call itself errors or returns no row, the layout renders `WorkspaceError` (`apps/web/features/workspace/workspace-error.tsx`) instead of the authenticated shell -- no fabricated workspace data, no silent blank screen. The error message is generic (no SQL, Supabase payload, stack trace, ID, or policy name); a "Try again" link and the existing sign-out action are the only recovery paths offered. Unexpected RPC errors are logged server-side with `console.error`, logging only the error's message, never a raw payload, token, or Auth internals.

**Identity display:** the real `workspaces.name` value is rendered in the authenticated shell's header (desktop only, alongside the existing user-email identity from Milestone 5) and as the Workspace Overview page's eyebrow label -- both are real data, never invented.

---

## 6. Project lifecycle (application-level)

Milestone 8 implements create/rename/archive/restore entirely in application code (`apps/web/features/projects/`), against the Milestone 6 schema and RLS policies unchanged -- no migration was required.

- **Create:** `createProjectAction` inserts `{workspace_id, owner_id: auth.uid(), name}` via `projects_insert_member_owner`. A caller-supplied `workspaceId` that the user does not belong to is rejected by RLS's `is_workspace_member(workspace_id)` check regardless of what the client submits -- the form field is a convenience, not the authorization boundary.
- **Rename:** updates `name` via `projects_update_member`.
- **Archive / Restore:** update `status` and `archived_at` together (`'archived'` + a timestamp, or `'active'` + `null`) via the same policy; the `projects_status_archived_at_consistency` CHECK is the authoritative guarantee that the two columns never disagree, independent of what the application sends.
- **Ownership stays immutable:** `owner_id` and `workspace_id` are never included in any update payload, and `prevent_ownership_reassignment()` would reject them if they were.
- **Honest failure on a stale/foreign target:** every `UPDATE` chains `.select().single()` so that an `id` RLS silently filters out (project deleted, or belonging to another workspace) surfaces as a genuine error rather than a misleading "success" redirect with zero rows actually changed.
- **Scope:** quick creation (name only) and the `active`/`archived` states established in Milestone 6 -- guided creation, duplication, project home, context editing, and the `draft`/`paused`/`completed`/`deleted` states from Experience Architecture §17 remain deferred (§8).

---

## 7. Type generation

`packages/database/src/generated/database.types.ts` is generated from the live schema via `pnpm generate-types` (see `packages/database/README.md`) and re-exported from `packages/database/src/index.ts`. Application code (`apps/web`) consumes it through the `Database` generic parameter on both `createServerClient<Database>()` and `createBrowserClient<Database>()`, and via the `Tables<'...'>` helper type -- no hand-written row types exist anywhere in `apps/web`.

---

## 8. Deferred

Not yet implemented, each belonging to a later, distinct roadmap phase: multiple workspaces per user, workspace switching, workspace invitations or additional membership roles, Organisation as a tier above Workspace, guided project creation/duplication, project home, Project Context as an independent table and its editing UI, the `draft`/`paused`/`completed`/`deleted` project states, Session/Message/Artifact/Artifact Version, Activity Event, AI Capability/Provider, Usage Record, Source/Asset, Decision/Audit Event, Notifications. `create_workspace(text)`'s eventual removal (currently unused, left in place) is also unresolved.

---

## Amendment and Review Process

This document is updated whenever a migration changes the live schema it describes. A stale entry here is treated as a defect to fix immediately, not a discrepancy to note and defer, per Engineering Standards §28.

**Amendment Record**

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-07-26 | Initial document, covering the Milestone 6 schema (workspaces, workspace_memberships, projects; create_workspace, is_workspace_member) and the Milestone 7 addition (ensure_personal_workspace, workspaces.owner_id uniqueness). |
| 1.1 | 2026-07-26 | Milestone 8: added §6 documenting application-level project create/rename/archive/restore against the unchanged Milestone 6 schema; updated §8 Deferred accordingly. |
