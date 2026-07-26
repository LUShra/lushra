-- Milestone 6: core database schema.
-- Rollback: drop function if exists public.create_workspace(text);

-- -----------------------------------------------------------------------
-- public.create_workspace
-- -----------------------------------------------------------------------
-- The only sanctioned way to create a workspace (Milestone 6 Correction
-- 1). Without this function there is no valid path to create the initial
-- owner membership row atomically alongside the workspace, since
-- `authenticated` is deliberately given no INSERT policy on either
-- public.workspaces or public.workspace_memberships (20260726010500).
--
-- A trigger-based alternative (an AFTER INSERT trigger on
-- public.workspaces that creates the membership row automatically) was
-- considered and rejected: it would still need *something* to authorize
-- the initial workspace INSERT itself -- either a direct INSERT policy
-- re-checking owner_id = auth.uid(), which duplicates exactly the
-- validation this function already performs, or routing creation through
-- this same function anyway. A single SECURITY DEFINER function
-- performing both inserts in one atomic call is simpler: there is one
-- obvious place to review the entire operation, and Postgres wraps the
-- whole function invocation in one implicit transaction, so a failure
-- inserting the membership row rolls back the workspace insert too --
-- a workspace can never exist without its owner membership.
--
-- search_path is pinned and every table reference is schema-qualified.
-- The function does not accept an owner_id (or any user-identifying)
-- argument -- the owner is always auth.uid(), so a caller can never
-- create a workspace or membership on another user's behalf. EXECUTE is
-- restricted to `authenticated` only; this function is never called with
-- the service-role key.
create function public.create_workspace(workspace_name text)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text;
  created_workspace public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to create a workspace.';
  end if;

  normalized_name := nullif(btrim(workspace_name), '');

  if normalized_name is null then
    raise exception 'Workspace name must not be empty.';
  end if;

  if char_length(normalized_name) > 120 then
    raise exception 'Workspace name must be 120 characters or fewer.';
  end if;

  insert into public.workspaces (owner_id, name)
  values (auth.uid(), normalized_name)
  returning * into created_workspace;

  insert into public.workspace_memberships (workspace_id, user_id, role)
  values (created_workspace.id, auth.uid(), 'owner');

  return created_workspace;
end;
$$;

revoke all on function public.create_workspace(text) from public;
revoke all on function public.create_workspace(text) from anon;
grant execute on function public.create_workspace(text) to authenticated;
