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
| `purpose` | `text` | nullable, ≤500 characters (Milestone 10) |
| `desired_outcome` | `text` | nullable, ≤500 characters (Milestone 10) |
| `key_constraints` | `text` | nullable, free text, ≤1000 characters (Milestone 10) |
| `target_audience` | `text` | nullable, ≤500 characters (Milestone 10) |
| `status` | `text` | `not null default 'active' check (status in ('active','archived'))` |
| `archived_at` | `timestamptz` | nullable; consistent with `status` via CHECK |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()`; `updated_at` trigger-maintained |

Created, renamed, archived, and restored directly by application code (Milestone 8, `apps/web/features/projects/`) via ordinary `INSERT`/`UPDATE` through the existing Milestone 6 RLS policies -- no new migration or database function was required. `description` is viewable and editable from the Project Home page (Milestone 9). `purpose`, `desired_outcome`, `key_constraints`, and `target_audience` (Milestone 10) are the remaining Product Definition §20 item 5 "Project foundation" fields short of "source materials," which is deliberately not a column here -- see §6. See §6 for both.

### 2.4 `public.sessions`

Product Definition §30 Session entity (Milestone 11): a focused period of work within a project. No AI orchestration exists yet -- see §6.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `project_id` | `uuid` | `not null references projects(id) on delete cascade` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade`; denormalized from the owning project, same pattern as `projects.workspace_id` relative to `workspaces` |
| `owner_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `created_at` | `timestamptz` | `not null default now()` |

No `name`/`status` column: a session is identified by its project and creation time, not a user-chosen name, matching the minimal "quick creation" ethos already established for projects. No `UPDATE`/`DELETE` policy -- a session has no mutable fields yet, and deletion is not a requested capability.

### 2.5 `public.messages`

Product Definition §30 Message entity (Milestone 11, extended Milestone 12): a single exchange of instruction or response within a session, retained as session history.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `session_id` | `uuid` | `not null references sessions(id) on delete cascade` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade`; denormalized from the owning session |
| `sender_id` | `uuid` | nullable (Milestone 12) `references auth.users(id) on delete cascade`; not null for `role='user'`, null for `role='assistant'` |
| `role` | `text` | `not null default 'user' check (role in ('user','assistant'))` (Milestone 12) |
| `content` | `text` | `not null`, non-blank, ≤10,000 characters |
| `created_at` | `timestamptz` | `not null default now()` |

`messages_role_sender_consistency` CHECK (Milestone 12) is the authoritative guarantee that a `'user'` row always has a real `sender_id` and an `'assistant'` row never does, independent of what any calling code sends. No `UPDATE`/`DELETE` policy -- messages are immutable durable history, distinct from editable artifacts.

### 2.6 `public.artifacts`

Product Definition §30 Artifact entity (Milestone 13): a durable unit of created work. This milestone ships creation and editing only -- no versioning, review, or export yet, each a distinct later milestone (see §6).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `project_id` | `uuid` | `not null references projects(id) on delete cascade` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade`; denormalized from the owning project, same pattern as `sessions.workspace_id` |
| `owner_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `title` | `text` | `not null`, non-blank, ≤200 characters |
| `type` | `text` | `not null check (type in ('brief','specification','structured_document','marketing_copy','research_synthesis','content_outline'))` -- the exact named examples in Experience Architecture §24, deliberately a CHECK rather than an ENUM since Product Definition §20 item 7 frames the list as illustrative ("such as") and expected to grow |
| `content` | `text` | nullable, ≤50,000 characters -- nullable because an artifact can be created title-only and filled in afterwards, matching the "quick creation" ethos already established for projects |
| `status` | `text` | `not null default 'draft' check (status in ('draft','in_review','approved','rejected'))` (Milestone 15) |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()`; `updated_at` trigger-maintained |

`owner_id`, `workspace_id`, and `project_id` cannot be changed by an ordinary `UPDATE` -- `prevent_ownership_reassignment()` (§3) was extended in Milestone 13 to cover `artifacts` the same way it already covered `workspaces`/`projects`. No `DELETE` policy this milestone: archiving/deletion for artifacts is deferred (§8). `status` transitions are enforced in application code (§6), not a database trigger -- no new RLS policy was needed since `status` is just another column already covered by `artifacts_update_member`.

### 2.7 `public.artifact_versions`

Product Definition §30 Artifact Version entity (Milestone 14): a recorded, meaningful evolution of an artifact. This milestone ships save + restore only -- no diff/comparison UI, named versions, or duplication yet (see §6, §8).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `artifact_id` | `uuid` | `not null references artifacts(id) on delete cascade` |
| `workspace_id` | `uuid` | `not null references workspaces(id) on delete cascade`; denormalized from the owning artifact |
| `created_by` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `content` | `text` | nullable, ≤50,000 characters -- a snapshot of `artifacts.content` at save time; `title` is not versioned |
| `created_at` | `timestamptz` | `not null default now()` |

Immutable once recorded -- no `UPDATE`/`DELETE` policy exists at all, matching `messages`' treatment. Because nothing can ever update this table, `prevent_ownership_reassignment()` does not need extending here (unlike `artifacts` in Milestone 13): there is no `UPDATE` path for an ownership column to be reassigned through.

---

## 3. Functions

| Function | Security | Callable by | Purpose |
|---|---|---|---|
| `is_workspace_member(target_workspace_id uuid) returns boolean` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | RLS helper: does the current user belong to this workspace. |
| `create_workspace(workspace_name text) returns workspaces` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | Milestone 6's general-purpose workspace creator. **Not currently called by the application** -- superseded for the personal-workspace path by `ensure_personal_workspace()`. Left in place unmodified; calling it for a user who already owns a workspace now fails with a unique-constraint violation rather than silently creating a second one, which is correct given §2.1's uniqueness rule. |
| `ensure_personal_workspace() returns workspaces` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | The idempotent personal-workspace provisioning entry point. See §5. |
| `set_updated_at() returns trigger` | invoker, `search_path=public` | (trigger only) | Sets `NEW.updated_at = now()` on `workspaces` and `projects`. |
| `prevent_ownership_reassignment() returns trigger` | invoker, `search_path=public` | (trigger only) | Rejects any change to `owner_id` (and, on `projects`/`artifacts`, `workspace_id`; on `artifacts`, also `project_id`) via `UPDATE`. Extended in Milestone 13 (`20260726234601`) to cover `artifacts`; that same migration's `CREATE OR REPLACE` unintentionally dropped this function's pinned `search_path` (a prior `ALTER FUNCTION ... SET search_path` is not preserved across a full replace), caught immediately by the security advisor and re-pinned inline in the very next migration, `20260726234658`. |
| `insert_assistant_message(target_session_id uuid, message_content text) returns messages` | `SECURITY DEFINER`, `search_path=public` | `authenticated` | Milestone 12: the only path that can create a `role='assistant'` message. Resolves `workspace_id` from the session itself (not a caller-supplied value) and re-checks `is_workspace_member()`; accepts no caller-supplied `role` or `sender_id`, so no parameter can escalate it into creating a human-attributed row or a row outside the caller's own workspace. See §6. |

All `SECURITY DEFINER` functions: `search_path` pinned, every reference schema-qualified, `EXECUTE` revoked from `PUBLIC` and `anon`, granted only to `authenticated`. None accept a caller-supplied user or owner ID -- every one uses `auth.uid()` exclusively, so a caller can never act on another user's behalf.

---

## 4. Row-Level Security

RLS is enabled on all seven tables. `anon` has zero policies anywhere, so unauthenticated requests receive zero rows or a permission-denied error, never real data.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `workspaces` | member (`is_workspace_member(id)`) | none for `authenticated` -- only `create_workspace()`/`ensure_personal_workspace()` (bypass RLS as `SECURITY DEFINER`) | owner only (`auth.uid() = owner_id`) | none |
| `workspace_memberships` | member (`is_workspace_member(workspace_id)`) | none | none | none |
| `projects` | member (`is_workspace_member(workspace_id)`) | member + `owner_id = auth.uid()` | member | none (archive via UPDATE) |
| `sessions` | member (`is_workspace_member(workspace_id)`) | member + `owner_id = auth.uid()` | none | none |
| `messages` | member (`is_workspace_member(workspace_id)`) | member + `sender_id = auth.uid()` + `role = 'user'` (Milestone 12) for ordinary inserts; `role='assistant'` rows only via `insert_assistant_message()` (bypasses RLS as `SECURITY DEFINER`) | none | none |
| `artifacts` | member (`is_workspace_member(workspace_id)`) | member + `owner_id = auth.uid()` | member | none (Milestone 13) |
| `artifact_versions` | member (`is_workspace_member(workspace_id)`) | member + `created_by = auth.uid()` | none | none (Milestone 14) |

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
- **Scope:** quick creation (name only) and the `active`/`archived` states established in Milestone 6 -- guided creation, duplication, and the `draft`/`paused`/`completed`/`deleted` states from Experience Architecture §17 remain deferred (§8).

**Milestone 9 (Project Home)** adds the "open a project" capability from Product Definition §20 item 4: a dedicated `/workspace/projects/[id]` page (`apps/web/app/workspace/projects/[id]/page.tsx`). `getProject(projectId, workspaceId)` fetches a single row scoped by both `id` and `workspace_id` -- RLS already prevents a cross-workspace read, but the explicit filter keeps the query's intent legible without relying solely on RLS to narrow scope by omission. If the row doesn't exist or isn't visible to the caller, the page renders a generic `notFound()` in both cases -- deliberately not distinguishing "doesn't exist" from "exists but isn't yours," to avoid leaking which projects exist to a user who doesn't own them. `updateProjectDescriptionAction` is the one new mutation, editing the existing `description` column (using it as the "brief" field from Product Definition §20 item 5) via the same `projects_update_member` policy and the same `.select().single()` honest-failure pattern as rename/archive/restore. Archive/restore are also exposed here, reusing the exact same Milestone 8 server actions -- not a duplicated implementation, a second presentation of the same one. The page is honest about what it cannot show yet: a "Sessions, artifacts, and review" section states plainly that this content isn't available, rather than faking it, since no Session/Artifact/Review entities exist yet. The fuller Project Context fields (objective, desired outcome, key constraints, target audience, source materials) from Product Definition §20 item 5 remain deferred (§8) -- they would require new columns, which this milestone did not add.

**Milestone 10 (Project Context Fields)** adds `purpose`, `desired_outcome`, `key_constraints`, and `target_audience` (§2.3) via one additive migration (`20260726110000_add_project_context_fields.sql`) and a new "Context" section on Project Home (`apps/web/features/projects/project-context-form.tsx`, `updateProjectContextAction`). All four columns are nullable with their own max-length CHECK, mirroring `description`'s existing pattern; `updateProjectContextAction` validates the same lengths client- and server-side before ever reaching the database, and uses the same `.select().single()` honest-failure pattern as every other project mutation. No RLS policy changed -- `projects_update_member` already covers `UPDATE` on any column on the row, including these new ones, and `prevent_ownership_reassignment()` has nothing to do with non-ownership fields. "Source materials" is still deliberately not a column: it is the Source entity (Product Definition §30), with its own attachment/upload lifecycle belonging to a distinct, later architectural layer (Asset Management) -- a text column could not honestly represent that capability. No "project context summary" column was added either; the application satisfies Experience Architecture §19's visibility requirement by rendering the existing fields together on Project Home, not by storing a derived summary as its own row.

**Milestone 11 (Creation Sessions)** adds `public.sessions` and `public.messages` (§2.4, §2.5) via one additive migration (`20260726120000_create_sessions_and_messages.sql`), and application code in `apps/web/features/sessions/`. Project Home's Sessions section (`apps/web/app/workspace/projects/[id]/page.tsx`) lists a project's sessions (`listSessions`) and offers `StartSessionForm` (`createSessionAction`) to begin one; a new `/workspace/projects/[id]/sessions/[sessionId]` page (`getSession`, `listMessages`) shows the message history and `SendMessageForm` (`sendMessageAction`) to add to it. Both new tables reuse the existing `is_workspace_member(workspace_id)` RLS helper unchanged -- no new function was required. `getSession` is scoped by `id`, `project_id`, and `workspace_id` together, the same defense-in-depth pattern as `getProject`; both "doesn't exist" and "exists but isn't yours/isn't this project's" render the same generic `notFound()`. Messages are append-only from the application's perspective: `sendMessageAction` only ever inserts, matching the tables having no `UPDATE`/`DELETE` policy at all. This milestone deliberately ships no AI wiring -- every message is human-authored, sent by whichever user submits the form as `sender_id = auth.uid()`; a `role` column and real AI-authored responses are a distinct, later roadmap phase (§8).

**Milestone 12 (AI Orchestration)** implements Platform Architecture §11/§12: a provider-agnostic AI Orchestration Layer with its first Model Provider wired behind it, satisfying Roadmap §11's exit criteria. Two migrations: `20260726232634_add_message_role_and_assistant_reply.sql` (§2.5, §3, §4) and a comment-only follow-up, `20260726232729_update_session_and_message_table_comments.sql`, correcting `sessions`/`messages` table comments that Milestone 11 left stale. Application code lives in `apps/web/lib/ai/`: `provider.ts` defines the `AiProvider` interface (`respond(instruction): Promise<AiProviderResult>`); `providers/openai-provider.ts` is the first, and today only, implementation, calling OpenAI's Chat Completions endpoint (`gpt-4o-mini`, capped at 1,000 output tokens to stay well under `messages.content`'s 10,000-character CHECK) and reading `OPENAI_API_KEY` server-side only -- this file is never imported from a `"use client"` module, so no bundler ever ships the key to the browser; `orchestrator.ts`'s `orchestrateResponse()` is the one entry point anything above this layer calls, routing to the single wired provider today so that adding a second provider later changes only this function's body, never any caller (Product Definition §18, Roadmap §29). `sendMessageAction` (`apps/web/features/sessions/session-actions.ts`) inserts the user's message as before, then calls `orchestrateResponse()` and, on success, `insert_assistant_message()` to record the reply; any failure in that second half -- missing key, provider error, empty response, or the RPC itself failing -- is reported as a non-fatal `aiWarning` (rendered via `FormMessage tone="warning"`) since the user's own message already sent successfully regardless. This is Product Definition §17's **Observed** automation level: the AI generates a session reply, it does not change any Project or Artifact state. The session detail page labels each message "You" or "AI assistant" from `role`. No streaming, retry, or interruption UI yet (Interaction System §12/§14) -- the whole round trip is one synchronous request, communicated only by the existing pending-button spinner; token-level streaming remains deferred (§8).

**Milestone 13 (Artifacts)** begins Roadmap §13 (Artifact System): creation and editing only, via one migration, `20260726234601_create_artifacts_table.sql` (§2.6, §3, §4), plus a same-session corrective, `20260726234658_repin_prevent_ownership_reassignment_search_path.sql` (see §3's note on `prevent_ownership_reassignment()`). Application code lives in `apps/web/features/artifacts/`: `listArtifacts`/`getArtifact` (scoped by `id`, `project_id`, and `workspace_id` together, the same defense-in-depth pattern as `getSession`), and four actions -- `createArtifactAction` (a standalone quick-create form on Project Home: title + type), `createArtifactFromMessageAction` (the First-Value Journey bridge, Experience Architecture §13: a "Save as artifact" button on every session message inserts a new artifact with that message's content, a title derived from its first line, and `type: 'brief'` as the one-click default), `renameArtifactAction`, and `updateArtifactContentAction` -- all following the same `.select().single()` honest-failure pattern as every other mutation in this project. A new `/workspace/projects/[id]/artifacts/[artifactId]` page shows and edits an artifact's title and content. Project Home gains an "Artifacts" section (list + quick-create), mirroring the Sessions section's structure. `packages/ui` gains one new primitive, `Select` (`select.tsx`/`select.module.css`), needed for the type picker -- built to the exact same `useFieldContext()`/`invalid`/`id`-from-context pattern as `Input`, not a parallel design system. No versioning (Experience Architecture §26), review (§27, Product Definition §20 item 10), export (§29), or archive/delete for artifacts yet -- each is its own later milestone (§8); a single mutable row is the correct minimal shape until versioning genuinely exists.

**Milestone 14 (Artifact Versions)** continues Roadmap §13: save + restore only, via one migration, `20260727001037_create_artifact_versions_table.sql` (§2.7, §4). Application code lives in `apps/web/features/artifacts/`: `listArtifactVersions` (most-recent-first, scoped by `artifact_id` and `workspace_id`), and two actions -- `saveArtifactVersionAction` snapshots the artifact's *current, live* `content` (read server-side from the `artifacts` row itself, never trusted from the client, since the Save Version button carries no textarea of its own) into a new, immutable `artifact_versions` row; `restoreArtifactVersionAction` copies a past version's `content` back onto the live artifact via the existing `.select().single()` honest-failure pattern, then -- per Product Definition §30's "restoring creates a new version rather than overwriting history" -- inserts *another* new version row capturing that restored state, so the act of restoring itself becomes part of the permanent history rather than silently reusing or deleting the old entry. That second insert's failure is logged and swallowed rather than surfaced as a user-facing error: the restore the user actually asked for already succeeded by that point, and a failed history record is a non-fatal, best-effort concern (same pattern as `sendMessageAction`'s AI-reply insert in Milestone 12). The artifact detail page gains a "Versions" section: a numbered history list (oldest is "Version 1", ascending, independent of the most-recent-first display order) with a "Restore" action per row, and a "Save version" button. `title` is deliberately not versioned -- only `content` is snapshotted, since a version is "a meaningful evolution" of the artifact's body specifically. No diff/comparison UI, named versions, or duplication yet -- each is its own later milestone (§8).

**Milestone 15 (Artifact Review)** continues Roadmap §13: the review state machine only, via one migration, `20260727002515_add_artifact_review_status.sql` (§2.6). Application code lives in `apps/web/features/artifacts/`: `artifact-status.ts` defines the four states and their display labels/`Badge` variants (`draft`→neutral, `in_review`→info, `approved`→success, `rejected`→danger); `review-actions.ts`'s four actions -- `submitForReviewAction`, `approveArtifactAction`, `rejectArtifactAction`, `reopenArtifactAction` -- each filter their `UPDATE` by both `id` *and* the required starting status (e.g. `.eq("status", "draft")`), making the transition check atomic and race-safe with no separate read-then-write step; an invalid transition (already submitted, a stale double-click) surfaces as a genuine zero-row honest failure via `.select().single()`, never a silent no-op. `ArtifactReviewActions` renders the status `Badge` plus only the action(s) valid for the current status. `ArtifactListItem` on Project Home also gains the status `Badge`. No new RLS policy was needed (see §2.6). Per Product Definition §17 ("AI never approves its own output"), no code path lets AI-authored content call `approveArtifactAction` -- there is no application mutation path today that lets Milestone 12's AI orchestration touch `public.artifacts` at all, so this is satisfied by the absence of that capability rather than an explicit guard.

A genuine integrity gap was found and fixed in the same PR: without a further change, a user could edit an artifact's content or title (or restore an old version onto it) while its status was `approved` or `rejected`, leaving a stale badge that no longer honestly described the current content -- a misleading-UI defect, not a hypothetical one. Fixed by having `renameArtifactAction`, `updateArtifactContentAction` (both Milestone 13), and `restoreArtifactVersionAction` (Milestone 14) each also reset `status` to `'draft'` as part of the same `UPDATE` whenever they change `title` or `content` -- a no-op when already `draft`, otherwise an honest signal that the artifact has diverged from whatever was last reviewed. No review notes/comments, comparison, or review-history log yet -- each is its own later milestone (§8).

**Milestone 16 (Artifact Export)** completes Roadmap §13's stated First-Value Journey ("produce an artifact draft... save a meaningful version, move it through review, and export it"). **No migration or schema change** -- Experience Architecture §29 export (copy, plain text, Markdown) is implemented entirely client-side against data already fetched and authorized server-side; there is nothing new for RLS or a migration to do. `apps/web/features/artifacts/export-utils.ts` provides `sanitizeFilename` (alphanumeric + hyphens only, falls back to `"artifact"` if nothing usable remains), `downloadTextFile` (Blob + temporary anchor download), and `copyToClipboard` (returns `false` rather than throwing when the Clipboard API is unavailable). `export-actions.tsx`'s `ExportActions` component renders Copy/`.txt`/`.md` buttons with inline success/error feedback, or an honest "Add content before exporting" message when there is nothing to export. Wired into the artifact detail page for the artifact's current content, and into `VersionListItem` for each individual saved version's snapshot -- distinguishing "export the current content" from "export a specific past version," in place of a not-yet-modeled `approved_version_id` link (Experience Architecture §29 mentions distinguishing current from *approved*; per Product Definition §20 item 10's instruction to keep review "understandable rather than elaborate," this schema does not yet tag which specific version corresponds to an approval, so per-version export is the honest substitute). "Markdown export" is the artifact's existing plain-text content saved with a `.md` extension and `text/markdown` MIME type -- there is no rich-text/structured-formatting model anywhere in this schema to actually convert, so no such conversion is claimed. Mobile-specific sharing (Web Share API) and attribution metadata (no multi-author scenario exists yet -- Workspace Membership's `role` column only ever has `'owner'`) are both deferred (§8).

---

## 7. Type generation

`packages/database/src/generated/database.types.ts` is generated from the live schema via `pnpm generate-types` (see `packages/database/README.md`) and re-exported from `packages/database/src/index.ts`. Application code (`apps/web`) consumes it through the `Database` generic parameter on both `createServerClient<Database>()` and `createBrowserClient<Database>()`, and via the `Tables<'...'>` helper type -- no hand-written row types exist anywhere in `apps/web`.

---

## 8. Deferred

Not yet implemented, each belonging to a later, distinct roadmap phase: multiple workspaces per user, workspace switching, workspace invitations or additional membership roles, Organisation as a tier above Workspace, guided project creation/duplication, source materials as an attachable Source entity and Project Context as an independent table, the `draft`/`paused`/`completed`/`deleted` project states, the fuller Workspace Overview experience (recent work, pending reviews, next actions beyond a project count), session naming/status, a second AI provider and real provider-selection logic, streaming/interrupt/retry AI interactions, Assisted and Controlled Execution automation levels (Product Definition §17), diff/comparison UI between artifact versions, named versions, version duplication (Experience Architecture §26), review notes/comments, comparing review alternatives, a review-history log distinct from Activity Event (§27), mobile-specific export sharing (Web Share API) and export attribution metadata (§29), artifact archive/delete/duplication, Activity Event, AI Capability/Provider as first-class schema entities, Usage Record, Source/Asset, Decision/Audit Event, Notifications. `create_workspace(text)`'s eventual removal (currently unused, left in place) is also unresolved.

---

## Amendment and Review Process

This document is updated whenever a migration changes the live schema it describes. A stale entry here is treated as a defect to fix immediately, not a discrepancy to note and defer, per Engineering Standards §28.

**Amendment Record**

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-07-26 | Initial document, covering the Milestone 6 schema (workspaces, workspace_memberships, projects; create_workspace, is_workspace_member) and the Milestone 7 addition (ensure_personal_workspace, workspaces.owner_id uniqueness). |
| 1.1 | 2026-07-26 | Milestone 8: added §6 documenting application-level project create/rename/archive/restore against the unchanged Milestone 6 schema; updated §8 Deferred accordingly. |
| 1.2 | 2026-07-26 | Milestone 9: documented the Project Home page and description editing in §6, both against the unchanged schema; updated §8 Deferred accordingly. |
| 1.3 | 2026-07-26 | Milestone 10: added `purpose`, `desired_outcome`, `key_constraints`, `target_audience` to §2.3 via migration `20260726110000_add_project_context_fields.sql`; documented the new Project Home Context section in §6; updated §8 Deferred accordingly. |
| 1.4 | 2026-07-26 | Milestone 11: added `public.sessions` and `public.messages` (§2.4, §2.5) via migration `20260726120000_create_sessions_and_messages.sql`; added their RLS rows to §4; documented the new Sessions section on Project Home and the session detail page in §6; updated §8 Deferred accordingly. |
| 1.5 | 2026-07-26 | Milestone 12: added `messages.role`, made `messages.sender_id` nullable, added the role/sender consistency CHECK, and added `insert_assistant_message()` (§2.5, §3, §4) via migrations `20260726232634_add_message_role_and_assistant_reply.sql` and `20260726232729_update_session_and_message_table_comments.sql`; documented the AI Orchestration Layer, the OpenAI provider, and `sendMessageAction`'s AI-reply wiring in §6; updated §8 Deferred accordingly. |
| 1.6 | 2026-07-26 | Milestone 13: added `public.artifacts` (§2.6) and extended `prevent_ownership_reassignment()` to cover it (§3) via migrations `20260726234601_create_artifacts_table.sql` and `20260726234658_repin_prevent_ownership_reassignment_search_path.sql` (the latter fixing a search_path regression the former introduced); added its RLS row to §4; documented artifact creation/editing and the session-to-artifact bridge in §6; updated §8 Deferred accordingly. |
| 1.7 | 2026-07-27 | Milestone 14: added `public.artifact_versions` (§2.7) via migration `20260727001037_create_artifact_versions_table.sql`; added its RLS row to §4; documented save/restore versioning in §6; updated §8 Deferred accordingly. |
| 1.8 | 2026-07-27 | Milestone 15: added `artifacts.status` (§2.6) via migration `20260727002515_add_artifact_review_status.sql`; documented the review state machine and the same-PR status-reset fix to `renameArtifactAction`/`updateArtifactContentAction`/`restoreArtifactVersionAction` in §6; updated §8 Deferred accordingly. |
| 1.9 | 2026-07-27 | Milestone 16: no schema change -- documented client-side artifact export (copy/plain-text/Markdown) in §6, completing Roadmap §13's stated First-Value Journey; updated §8 Deferred accordingly. |
