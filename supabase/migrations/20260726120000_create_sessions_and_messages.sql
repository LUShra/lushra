-- Milestone 11: creation sessions.
-- Rollback:
--   drop table if exists public.messages cascade;
--   drop table if exists public.sessions cascade;

-- -----------------------------------------------------------------------
-- public.sessions
-- -----------------------------------------------------------------------
-- Product Definition §30 Session entity: "A focused period of work
-- within a project... resumable, with history preserved for
-- continuity." No name/title/status column: Product Definition §20 item
-- 6 only requires starting, resuming, and preserving history -- a
-- session is identified by its project and creation time, not a
-- user-chosen name, matching the minimal "quick creation" ethos already
-- established for projects.
--
-- workspace_id is denormalized from the owning project, mirroring the
-- exact same pattern projects.workspace_id already uses relative to
-- workspaces -- it lets RLS call is_workspace_member(workspace_id)
-- directly without a subquery through projects. As with projects, this
-- relies on the client supplying a workspace_id that is genuinely the
-- project's own; today every user has exactly one workspace (Milestone
-- 7's uniqueness constraint), so no mismatch is actually reachable. If a
-- caller ever could belong to multiple workspaces, a mismatched
-- project_id/workspace_id pair would be a data-consistency oddity, not
-- an access-control gap -- RLS still only ever reveals the row to
-- members of the claimed workspace_id.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.sessions is
  'Product Definition §30 Session entity. A focused period of work within a project; contains messages. No AI wiring yet (Milestone 11) -- see public.messages.';

comment on column public.sessions.workspace_id is
  'Denormalized from the owning project, matching the same pattern already used on public.projects -- lets RLS call is_workspace_member(workspace_id) directly without a subquery through projects.';

create index sessions_project_id_idx on public.sessions (project_id);

alter table public.sessions enable row level security;

-- No policies yet -- added below, in this same migration.

-- -----------------------------------------------------------------------
-- public.messages
-- -----------------------------------------------------------------------
-- Product Definition §30 Message entity: "A single exchange of
-- instruction or response within a session... retained as session
-- history, distinct from durable artifacts." No `role` column yet
-- (user/assistant): every message this milestone is human-authored,
-- since no AI orchestration exists (Roadmap §11, not yet built) -- a
-- role column with only one real value would be premature to add now.
-- It is a small additive migration once AI-authored responses genuinely
-- exist. Messages are immutable once sent (no UPDATE/DELETE policy
-- below): this matches their nature as durable history, not editable
-- content, per Product Definition §30's distinction between messages
-- and durable, editable artifacts.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_content_not_blank check (char_length(btrim(content)) > 0),
  constraint messages_content_max_length check (char_length(content) <= 10000)
);

comment on table public.messages is
  'Product Definition §30 Message entity. Every row is human-authored this milestone (Milestone 11) -- no role column yet, see table comment for when AI-authored responses are added.';

comment on column public.messages.workspace_id is
  'Denormalized from the owning session (itself denormalized from its project), matching the same RLS-simplification pattern as public.sessions and public.projects.';

create index messages_session_id_created_at_idx on public.messages (session_id, created_at);

alter table public.messages enable row level security;

-- -----------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------
create policy sessions_select_member on public.sessions
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy sessions_insert_member_owner on public.sessions
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and owner_id = auth.uid()
  );

-- No UPDATE/DELETE policy on sessions this milestone: a session has no
-- mutable fields yet (no name/status), and deletion is not a requested
-- capability.

create policy messages_select_member on public.messages
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy messages_insert_member_sender on public.messages
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and sender_id = auth.uid()
  );

-- No UPDATE/DELETE policy on messages this milestone: messages are
-- immutable durable history, matching Product Definition §30's
-- treatment of them as distinct from editable artifacts. `anon` has no
-- policy on either table, so unauthenticated requests get zero rows or a
-- permission-denied error, never real data.
