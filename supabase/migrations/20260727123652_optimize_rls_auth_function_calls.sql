-- Release Candidate 2: RLS performance hardening.
-- Rollback: re-run each ALTER POLICY below with the bare auth.uid() form
-- (i.e. remove the (select ...) wrapper) to restore the prior expressions.
--
-- Supabase's own security/performance advisor (auth_rls_initplan, WARN)
-- flagged exactly these 8 policies: each calls auth.uid() directly in its
-- USING/WITH CHECK expression, which Postgres re-evaluates per row rather
-- than once per statement. Wrapping the call in a scalar subquery,
-- (select auth.uid()), is Postgres/Supabase's own documented remediation
-- (https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
-- and produces the exact same boolean result for every row -- this is a
-- pure query-plan optimization, not a behavioural or authorization
-- change. `is_workspace_member()` itself was not flagged by the advisor
-- and is left unchanged, per this release's "fix confirmed, evidenced
-- defects only" discipline.
alter policy workspaces_update_owner on public.workspaces
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy projects_insert_member_owner on public.projects
  with check (is_workspace_member(workspace_id) and (owner_id = (select auth.uid())));

alter policy sessions_insert_member_owner on public.sessions
  with check (is_workspace_member(workspace_id) and (owner_id = (select auth.uid())));

alter policy messages_insert_member_sender on public.messages
  with check (
    is_workspace_member(workspace_id)
    and (sender_id = (select auth.uid()))
    and (role = 'user'::text)
  );

alter policy artifacts_insert_member_owner on public.artifacts
  with check (is_workspace_member(workspace_id) and (owner_id = (select auth.uid())));

alter policy artifact_versions_insert_member_creator on public.artifact_versions
  with check (is_workspace_member(workspace_id) and (created_by = (select auth.uid())));

alter policy sources_insert_member_owner on public.sources
  with check (is_workspace_member(workspace_id) and (owner_id = (select auth.uid())));

alter policy sources_delete_member_owner on public.sources
  using (is_workspace_member(workspace_id) and (owner_id = (select auth.uid())));
