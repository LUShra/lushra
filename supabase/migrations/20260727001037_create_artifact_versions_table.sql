-- Milestone 14: Artifact versioning (save + restore, no diff/comparison UI yet).
-- Rollback:
--   drop table if exists public.artifact_versions cascade;

-- -----------------------------------------------------------------------
-- public.artifact_versions
-- -----------------------------------------------------------------------
-- Product Definition §30 Artifact Version entity: "A recorded, meaningful
-- evolution of an artifact... Immutable once recorded; restoring creates
-- a new version rather than overwriting history." No UPDATE/DELETE
-- policy at all -- once saved, a version is permanent, matching
-- public.messages' same immutability treatment. Because nothing can ever
-- update this table, prevent_ownership_reassignment() does not need
-- extending here (unlike public.artifacts in Milestone 13): there is no
-- UPDATE path for an ownership column to be reassigned through.
--
-- Snapshots `content` only, not `title` -- a version is "a meaningful
-- evolution" of the artifact's body; the title is independently editable
-- via renameArtifactAction and is not itself versioned this milestone.
--
-- workspace_id is denormalized from the owning artifact, the same
-- pattern already used by public.sessions and public.artifacts.
create table public.artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  content text,
  created_at timestamptz not null default now(),
  constraint artifact_versions_content_max_length check (content is null or char_length(content) <= 50000)
);

comment on table public.artifact_versions is
  'Product Definition §30 Artifact Version entity. Milestone 14: save + restore only, no diff/comparison UI, named versions, or duplication yet. Immutable once recorded -- no UPDATE/DELETE policy exists.';

comment on column public.artifact_versions.workspace_id is
  'Denormalized from the owning artifact, matching the same RLS-simplification pattern already used by public.sessions and public.artifacts.';

create index artifact_versions_artifact_id_created_at_idx on public.artifact_versions (artifact_id, created_at);

alter table public.artifact_versions enable row level security;

-- -----------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------
create policy artifact_versions_select_member on public.artifact_versions
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy artifact_versions_insert_member_creator on public.artifact_versions
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

-- No UPDATE/DELETE policy: versions are permanent once recorded.
