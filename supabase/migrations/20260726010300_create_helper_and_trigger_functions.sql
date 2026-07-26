-- Milestone 6: core database schema.
-- Rollback:
--   drop trigger if exists prevent_ownership_reassignment on public.projects;
--   drop trigger if exists prevent_ownership_reassignment on public.workspaces;
--   drop trigger if exists set_updated_at on public.projects;
--   drop trigger if exists set_updated_at on public.workspaces;
--   drop function if exists public.prevent_ownership_reassignment();
--   drop function if exists public.set_updated_at();
--   drop function if exists public.is_workspace_member(uuid);

-- -----------------------------------------------------------------------
-- public.is_workspace_member
-- -----------------------------------------------------------------------
-- SECURITY DEFINER is required here, not merely convenient: the RLS
-- SELECT policies added on public.workspaces and public.projects (in
-- 20260726010500) call this function to decide access, and the function
-- itself must read public.workspace_memberships -- a table whose own
-- SELECT policy is "you may see membership rows for workspaces you
-- belong to." A SECURITY INVOKER version of this function would need the
-- caller to already pass that same check to read the very row that
-- proves the check -- a circular dependency. Running as SECURITY
-- DEFINER breaks the cycle by reading workspace_memberships with the
-- function owner's privilege, while still only ever returning a single
-- boolean to the caller, never raw membership rows. search_path is
-- pinned and every reference is schema-qualified to prevent search_path
-- hijacking of a privileged function; EXECUTE is restricted to
-- `authenticated` only (unlike the pre-existing platform function
-- public.rls_auto_enable(), which Supabase's own advisor already flags
-- as anon-executable -- this function deliberately does not repeat that
-- pattern).
create function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.workspace_memberships
      where public.workspace_memberships.workspace_id = target_workspace_id
        and public.workspace_memberships.user_id = auth.uid()
    );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

-- -----------------------------------------------------------------------
-- public.set_updated_at
-- -----------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.workspaces
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------
-- public.prevent_ownership_reassignment
-- -----------------------------------------------------------------------
-- One reusable function (branching on TG_TABLE_NAME) rather than two
-- table-specific functions, since the guarded columns and the rejection
-- behaviour are conceptually identical across both tables (Engineering
-- Standards §5: logic is not duplicated when one function can hold it).
--
-- This exists because a `with check (owner_id = auth.uid())` RLS policy
-- alone is not sufficient (Milestone 6 Correction 2): a user who owns two
-- workspaces could still UPDATE a project's workspace_id from one of
-- their own workspaces to the other, since owner_id would remain
-- unchanged and would still satisfy that policy. This trigger blocks the
-- reassignment outright, independent of whatever RLS policy is in force.
create function public.prevent_ownership_reassignment()
returns trigger
language plpgsql
as $$
begin
  if TG_TABLE_NAME = 'workspaces' then
    if NEW.owner_id is distinct from OLD.owner_id then
      raise exception 'workspaces.owner_id cannot be changed after creation.';
    end if;
  elsif TG_TABLE_NAME = 'projects' then
    if NEW.owner_id is distinct from OLD.owner_id then
      raise exception 'projects.owner_id cannot be changed after creation.';
    end if;
    if NEW.workspace_id is distinct from OLD.workspace_id then
      raise exception 'projects.workspace_id cannot be changed after creation.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger prevent_ownership_reassignment
  before update on public.workspaces
  for each row
  execute function public.prevent_ownership_reassignment();

create trigger prevent_ownership_reassignment
  before update on public.projects
  for each row
  execute function public.prevent_ownership_reassignment();
