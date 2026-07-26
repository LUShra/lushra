-- Milestone 6: core database schema.
-- Rollback:
--   drop policy if exists projects_update_member on public.projects;
--   drop policy if exists projects_insert_member_owner on public.projects;
--   drop policy if exists projects_select_member on public.projects;
--   drop policy if exists workspace_memberships_select_member on public.workspace_memberships;
--   drop policy if exists workspaces_update_owner on public.workspaces;
--   drop policy if exists workspaces_select_member on public.workspaces;
--
-- All three tables already have RLS enabled (migrations
-- 20260726010000-010200). Until this migration runs, each one denies all
-- access to non-privileged roles by default (RLS enabled + zero
-- policies = deny). No policy anywhere in this file grants `anon`
-- anything on any table -- unauthenticated requests get zero rows
-- everywhere, satisfying Milestone 6 Correction 3's anonymous-access
-- requirement.

-- -----------------------------------------------------------------------
-- workspaces
-- -----------------------------------------------------------------------
create policy workspaces_select_member on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

-- Deliberately no INSERT policy: all workspace creation goes through
-- public.create_workspace() (20260726010400), which bypasses RLS as a
-- SECURITY DEFINER function. Omitting a direct INSERT policy here is
-- what makes that function the only path, per Correction 1.

create policy workspaces_update_owner on public.workspaces
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- owner_id immutability is enforced independently by the
-- public.prevent_ownership_reassignment trigger (20260726010300), not by
-- this policy's WITH CHECK -- see that migration's comment for why a
-- WITH CHECK predicate alone is not sufficient (Correction 2).

-- No DELETE policy this milestone.

-- -----------------------------------------------------------------------
-- workspace_memberships
-- -----------------------------------------------------------------------
create policy workspace_memberships_select_member on public.workspace_memberships
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- Deliberately no INSERT/UPDATE/DELETE policy: membership rows are only
-- ever created by public.create_workspace() (SECURITY DEFINER, bypasses
-- RLS). No feature in this milestone updates or removes a membership
-- row, so UPDATE and DELETE stay denied by omission rather than an
-- explicit always-false policy.

-- -----------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------
create policy projects_select_member on public.projects
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy projects_insert_member_owner on public.projects
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and owner_id = auth.uid()
  );

create policy projects_update_member on public.projects
  for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- owner_id and workspace_id immutability is enforced independently by
-- the public.prevent_ownership_reassignment trigger (20260726010300),
-- not by this policy's WITH CHECK -- see that migration's comment
-- (Correction 2: a WITH CHECK checking only owner_id would still permit
-- moving a project between two workspaces owned by the same user).

-- No DELETE policy this milestone -- archive via UPDATE (status,
-- archived_at) instead, per Experience Architecture §42.
