-- Milestone 6: core database schema.
-- Rollback: drop table if exists public.projects cascade;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_not_blank check (char_length(btrim(name)) > 0),
  constraint projects_name_max_length check (char_length(name) <= 160),
  constraint projects_description_max_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint projects_status_archived_at_consistency check (
    (status = 'active' and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

comment on table public.projects is
  'Product Definition §30 Project entity, scoped to first-release capability only: create, view, rename, archive, restore (Product Definition §20 item 4). Project Context foundational fields (name/description here) intentionally live directly on this table this milestone rather than a separate project_context table -- Context has no independent lifecycle yet (no versioning, no multiple sources). Only active/archived states exist; draft/paused/completed/deleted are deferred until a workflow produces them.';

comment on column public.projects.workspace_id is
  'ON DELETE CASCADE (Milestone 6 Correction 6): a project cannot outlive the workspace that contains it. Standard PostgreSQL FK behaviour.';

comment on column public.projects.owner_id is
  'ON DELETE CASCADE (Milestone 6 Correction 6): if a Supabase Auth user is hard-deleted, their owned projects should not survive as orphaned rows. Not currently reachable -- account deletion is not implemented (deferred in Milestone 5) -- documented ahead of that feature. Standard PostgreSQL FK behaviour.';

-- A single composite index, not a separate (workspace_id) index plus
-- this one: Postgres can use the leftmost column of a composite btree
-- index on its own (leftmost-prefix rule), so a standalone
-- (workspace_id) index alongside this one would be redundant -- every
-- write would maintain two near-identical indexes for no read benefit.
create index projects_workspace_id_status_idx on public.projects (workspace_id, status);

alter table public.projects enable row level security;

-- No policies yet -- see 20260726010500_add_rls_policies.sql.
