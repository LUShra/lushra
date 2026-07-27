-- Release Candidate 1: performance hardening.
-- Rollback:
--   drop index if exists public.sources_workspace_id_idx;
--   drop index if exists public.sessions_workspace_id_idx;
--   drop index if exists public.artifacts_workspace_id_status_idx;

-- Milestones 18-23 (Workspace Overview, Search, Activity, Billing usage)
-- each added queries that filter `sessions`/`artifacts`/`sources`
-- directly by `workspace_id` alone -- reading across every project in
-- the workspace, not scoped to one project's id the way every earlier
-- query was. Each of these three tables only ever had an index on
-- `project_id` (from their original creating migration); a workspace-id
-- query against any of them has been doing a full sequential scan since
-- the milestone that introduced it. Purely additive: no data, column, or
-- policy changes, so this carries no behavioural risk.
--
-- `artifacts` gets a composite (workspace_id, status) index rather than a
-- plain (workspace_id) one, mirroring `projects_workspace_id_status_idx`'s
-- already-established reasoning: `listPendingReviewArtifacts` filters by
-- both columns together, and Postgres's leftmost-prefix rule means this
-- one index also serves the workspace_id-only queries in
-- searchWorkspace()/listWorkspaceActivity()/getWorkspaceUsage() without
-- needing a second, overlapping index.
create index sessions_workspace_id_idx on public.sessions (workspace_id);
create index artifacts_workspace_id_status_idx on public.artifacts (workspace_id, status);
create index sources_workspace_id_idx on public.sources (workspace_id);
