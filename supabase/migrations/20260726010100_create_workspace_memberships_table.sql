-- Milestone 6: core database schema.
-- Rollback: drop table if exists public.workspace_memberships cascade;

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  constraint workspace_memberships_workspace_user_unique unique (workspace_id, user_id)
);

comment on table public.workspace_memberships is
  'Product Definition §30 Workspace Membership entity. Only the ''owner'' role exists in the first release; a CHECK constraint is used instead of a Postgres ENUM specifically so additional roles (member, admin) can be added later with a simple additive migration rather than an ALTER TYPE.';

comment on column public.workspace_memberships.role is
  'Constrained to ''owner'' only this milestone -- see table comment. No column comment implies future values; that is documented deferred work, not implied capability.';

comment on column public.workspace_memberships.workspace_id is
  'ON DELETE CASCADE (Milestone 6 Correction 6): a membership row cannot outlive the workspace it belongs to. Standard PostgreSQL FK behaviour.';

comment on column public.workspace_memberships.user_id is
  'ON DELETE CASCADE (Milestone 6 Correction 6): if a Supabase Auth user is hard-deleted, their membership rows should not survive as orphaned references. Not currently reachable -- account deletion is not implemented (deferred in Milestone 5) -- documented ahead of that feature. Standard PostgreSQL FK behaviour.';

create index workspace_memberships_user_id_idx on public.workspace_memberships (user_id);

alter table public.workspace_memberships enable row level security;

-- No policies yet -- see 20260726010500_add_rls_policies.sql. There is
-- deliberately no INSERT policy for `authenticated` at all: every
-- membership row is created exclusively by public.create_workspace()
-- (20260726010400), which runs SECURITY DEFINER and therefore bypasses
-- RLS for its own inserts. This is the resolution to Milestone 6
-- Correction 1 (initial owner membership).
