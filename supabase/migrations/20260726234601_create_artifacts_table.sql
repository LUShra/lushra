-- Milestone 13: Artifacts (create + edit, no versioning/review/export yet).
-- Rollback:
--   drop trigger if exists prevent_ownership_reassignment on public.artifacts;
--   drop trigger if exists set_updated_at on public.artifacts;
--   drop table if exists public.artifacts cascade;
--   create or replace function public.prevent_ownership_reassignment()
--   returns trigger
--   language plpgsql
--   as $$
--   begin
--     if TG_TABLE_NAME = 'workspaces' then
--       if NEW.owner_id is distinct from OLD.owner_id then
--         raise exception 'workspaces.owner_id cannot be changed after creation.';
--       end if;
--     elsif TG_TABLE_NAME = 'projects' then
--       if NEW.owner_id is distinct from OLD.owner_id then
--         raise exception 'projects.owner_id cannot be changed after creation.';
--       end if;
--       if NEW.workspace_id is distinct from OLD.workspace_id then
--         raise exception 'projects.workspace_id cannot be changed after creation.';
--       end if;
--     end if;
--     return NEW;
--   end;
--   $$;

-- -----------------------------------------------------------------------
-- public.artifacts
-- -----------------------------------------------------------------------
-- Product Definition §30 Artifact entity: "A durable unit of created
-- work... has one or more versions... persists independently of the
-- session that created it." This milestone ships creation and editing
-- only -- Artifact Version (Experience Architecture §26), Review
-- (§27/Product Definition §20 item 10), and Export (§29) are each their
-- own later milestone; a single mutable row is the correct minimal shape
-- until versioning genuinely exists (adding artifact_versions later is a
-- purely additive migration, not a rewrite of this one).
--
-- `type` is a CHECK, not an ENUM, over the exact named examples in
-- Experience Architecture §24 -- Product Definition §20 item 7 explicitly
-- frames these as illustrative ("such as"), so the set is expected to
-- grow; a CHECK is trivially widened in an additive migration, an ENUM is
-- not.
--
-- workspace_id is denormalized from the owning project, the same pattern
-- already used by public.sessions relative to public.projects.
create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artifacts_title_not_blank check (char_length(btrim(title)) > 0),
  constraint artifacts_title_max_length check (char_length(title) <= 200),
  constraint artifacts_type_known check (
    type in (
      'brief',
      'specification',
      'structured_document',
      'marketing_copy',
      'research_synthesis',
      'content_outline'
    )
  ),
  constraint artifacts_content_max_length check (content is null or char_length(content) <= 50000)
);

comment on table public.artifacts is
  'Product Definition §30 Artifact entity. Milestone 13: creation and editing only -- no versioning, review, or export yet (each a distinct later milestone).';

comment on column public.artifacts.workspace_id is
  'Denormalized from the owning project, matching the same RLS-simplification pattern already used by public.sessions.';

create index artifacts_project_id_idx on public.artifacts (project_id);

alter table public.artifacts enable row level security;

create trigger set_updated_at
  before update on public.artifacts
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------
-- Extend prevent_ownership_reassignment() to cover artifacts
-- -----------------------------------------------------------------------
-- Same invariant already enforced on workspaces/projects: owner_id and
-- workspace_id/project_id cannot be changed by an ordinary UPDATE even by
-- a workspace member, independent of what any RLS policy would otherwise
-- permit.
--
-- NOTE: this CREATE OR REPLACE unintentionally dropped the pinned
-- search_path that 20260726010600 had set via a separate `ALTER FUNCTION
-- ... SET search_path` -- CREATE OR REPLACE FUNCTION does not preserve a
-- function's proconfig settings from a prior ALTER FUNCTION. Caught by
-- the security advisor immediately after this migration applied and
-- fixed in the very next migration, 20260726234658 -- left exactly as
-- originally applied here, per the "never rewrite an applied migration"
-- rule; the fix is the following migration, not an edit to this one.
create or replace function public.prevent_ownership_reassignment()
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
  elsif TG_TABLE_NAME = 'artifacts' then
    if NEW.owner_id is distinct from OLD.owner_id then
      raise exception 'artifacts.owner_id cannot be changed after creation.';
    end if;
    if NEW.workspace_id is distinct from OLD.workspace_id then
      raise exception 'artifacts.workspace_id cannot be changed after creation.';
    end if;
    if NEW.project_id is distinct from OLD.project_id then
      raise exception 'artifacts.project_id cannot be changed after creation.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger prevent_ownership_reassignment
  before update on public.artifacts
  for each row
  execute function public.prevent_ownership_reassignment();

-- -----------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------
create policy artifacts_select_member on public.artifacts
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy artifacts_insert_member_owner on public.artifacts
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and owner_id = auth.uid()
  );

create policy artifacts_update_member on public.artifacts
  for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- No DELETE policy this milestone: archiving/deletion for artifacts is
-- deferred (Experience Architecture §25 Artifact Lifecycle), matching the
-- same "no capability without a real, reviewed action" discipline used
-- throughout this project.
