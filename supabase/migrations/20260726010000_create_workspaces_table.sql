-- Milestone 6: core database schema.
-- Rollback: drop table if exists public.workspaces cascade;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_not_blank check (char_length(btrim(name)) > 0),
  constraint workspaces_name_max_length check (char_length(name) <= 120)
);

comment on table public.workspaces is
  'Product Definition §30 Workspace entity. One row per user-owned workspace; first release defaults every user into exactly one, created exclusively via public.create_workspace() (see 20260726010400).';

comment on column public.workspaces.owner_id is
  'References auth.users directly -- Supabase Auth is the sole identity provider (Platform Architecture §6), no profiles table exists. ON DELETE CASCADE is deliberate (Milestone 6 Correction 6): if a Supabase Auth user is ever hard-deleted, their owned workspaces should not survive as orphaned rows with a dangling owner_id. Account deletion is not implemented yet (deferred in Milestone 5), so this cascade is not currently reachable by any user action -- it exists for referential correctness ahead of that feature, not because it is exercised today. Standard, fully-supported PostgreSQL FK behaviour; no exotic syntax.';

create index workspaces_owner_id_idx on public.workspaces (owner_id);

alter table public.workspaces enable row level security;

-- No policies yet -- added in 20260726010500_add_rls_policies.sql once
-- public.is_workspace_member() exists (20260726010300). RLS is enabled
-- here immediately, in the same migration that creates the table, so
-- there is never a window where this table is queryable without
-- policies: with RLS on and zero policies, Postgres denies all access
-- to non-privileged roles by default.
