-- Milestone 7: personal workspace provisioning.
-- Rollback:
--   drop function if exists public.ensure_personal_workspace();
--   alter table public.workspaces drop constraint if exists workspaces_owner_id_unique;
--   create index workspaces_owner_id_idx on public.workspaces (owner_id);

-- -----------------------------------------------------------------------
-- Uniqueness: one personal workspace per user
-- -----------------------------------------------------------------------
-- The only kind of workspace this schema currently models is a personal
-- one -- there is no "type" column and no team/shared workspace concept
-- yet (Organisation and Collaboration are both explicitly deferred,
-- Platform Architecture §7/§17). Constraining owner_id to be unique
-- across all of public.workspaces is therefore the exact, minimal
-- expression of "one personal workspace per user": no new column, no new
-- table, no redundant function.
--
-- This is deliberately NOT a uniqueness rule on
-- workspace_memberships.user_id: once team workspaces ship, a user will
-- need multiple membership rows (one per workspace they belong to as a
-- non-owner), so a broader uniqueness rule there would have to be
-- dropped again later. Constraining ownership, not membership, is the
-- rule that is actually permanent for this milestone.
--
-- The table is currently empty (confirmed before writing this
-- migration), so adding this constraint is instant and cannot fail on a
-- pre-existing duplicate; a table with real data would need a duplicate
-- check first.
--
-- The UNIQUE constraint below creates its own backing unique index on
-- owner_id, which makes the plain (non-unique) workspaces_owner_id_idx
-- index from Milestone 6 (20260726010000) entirely redundant -- it is
-- dropped here rather than left in place as dead weight alongside its
-- replacement.
drop index if exists public.workspaces_owner_id_idx;

alter table public.workspaces
  add constraint workspaces_owner_id_unique unique (owner_id);

-- -----------------------------------------------------------------------
-- public.ensure_personal_workspace
-- -----------------------------------------------------------------------
-- The idempotent, server-authoritative entry point every authenticated
-- request to /workspace calls. Returns the caller's existing personal
-- workspace if one exists; creates it (and its owner membership,
-- atomically) if not.
--
-- Distinct from public.create_workspace() (Milestone 6, 20260726010400):
-- that function accepts an arbitrary name and is not idempotent --
-- calling it twice for the same user now fails with a unique-constraint
-- violation rather than silently creating a second workspace, which is
-- correct given the one-workspace-per-user rule above, but it was never
-- meant to be the auto-provisioning path. create_workspace() currently
-- has no application caller and is left untouched rather than modified
-- or removed, since neither is required to implement Milestone 7 safely.
--
-- SECURITY DEFINER is required, not optional: public.workspaces and
-- public.workspace_memberships have no INSERT policy for `authenticated`
-- at all (Milestone 6 Corrections 1 and 3) -- a SECURITY INVOKER version
-- of this function could not insert anything. search_path is pinned and
-- every reference is schema-qualified. The function takes no user- or
-- owner-identifying argument; the only identity it ever uses is
-- auth.uid(), so a caller can never provision or return a workspace on
-- another user's behalf. EXECUTE is restricted to `authenticated` only;
-- this function is never called with the service-role key.
--
-- Concurrency: two simultaneous calls for the same user (two tabs, a
-- retried request, simultaneous middleware/layout renders) are resolved
-- by the unique constraint above plus `insert ... on conflict (owner_id)
-- do nothing`, not by a fragile check-then-insert sequence. Exactly one
-- of the concurrent calls performs the real insert; every other call
-- observes the conflict (FOUND = false after the no-op insert) and falls
-- back to re-selecting the row the winning call just created, rather
-- than erroring or creating a duplicate.
create function public.ensure_personal_workspace()
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  workspace_row public.workspaces;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required to provision a workspace.';
  end if;

  select *
  into workspace_row
  from public.workspaces
  where owner_id = current_user_id;

  if found then
    return workspace_row;
  end if;

  insert into public.workspaces (owner_id, name)
  values (current_user_id, 'Personal workspace')
  on conflict (owner_id) do nothing
  returning * into workspace_row;

  if not found then
    -- Lost a concurrent race: another call for this same user committed
    -- first. Its workspace now exists -- return that one rather than
    -- erroring or attempting a second insert.
    select *
    into workspace_row
    from public.workspaces
    where owner_id = current_user_id;

    return workspace_row;
  end if;

  insert into public.workspace_memberships (workspace_id, user_id, role)
  values (workspace_row.id, current_user_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  return workspace_row;
end;
$$;

revoke all on function public.ensure_personal_workspace() from public;
revoke all on function public.ensure_personal_workspace() from anon;
grant execute on function public.ensure_personal_workspace() to authenticated;
