-- Milestone 17: Sources (link + pasted-text sources attached to a project).
-- Rollback:
--   drop trigger if exists prevent_ownership_reassignment on public.sources;
--   drop trigger if exists set_updated_at on public.sources;
--   drop table if exists public.sources cascade;
--   create or replace function public.prevent_ownership_reassignment()
--   returns trigger
--   language plpgsql
--   set search_path = public
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
--     elsif TG_TABLE_NAME = 'artifacts' then
--       if NEW.owner_id is distinct from OLD.owner_id then
--         raise exception 'artifacts.owner_id cannot be changed after creation.';
--       end if;
--       if NEW.workspace_id is distinct from OLD.workspace_id then
--         raise exception 'artifacts.workspace_id cannot be changed after creation.';
--       end if;
--       if NEW.project_id is distinct from OLD.project_id then
--         raise exception 'artifacts.project_id cannot be changed after creation.';
--       end if;
--     end if;
--     return NEW;
--   end;
--   $$;

-- -----------------------------------------------------------------------
-- public.sources
-- -----------------------------------------------------------------------
-- Product Definition §30 Source entity: "External or uploaded material
-- attached to inform project context... Retained until the user removes
-- it; removal must be complete." This is the first entity in this schema
-- with a real hard-DELETE policy -- every other entity so far is
-- archived (projects) or simply immutable/append-only (messages,
-- artifact_versions). This milestone ships link and pasted-text sources
-- only; actual binary file upload belongs to the separate, later Asset
-- Management layer (Platform Architecture §15) and Product Definition
-- explicitly distinguishes Source from Asset -- adding upload later is a
-- purely additive migration (a new 'file' type value plus storage
-- columns), not a rewrite of this one.
--
-- `type` determines which of `url`/`content` is populated; the
-- consistency CHECK is the authoritative guarantee that a 'link' row
-- always has a url and never has content, and a 'text' row is the exact
-- reverse -- independent of what any calling code sends.
--
-- workspace_id is denormalized from the owning project, the same
-- pattern already used by public.sessions and public.artifacts.
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  url text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_type_known check (type in ('link', 'text')),
  constraint sources_title_not_blank check (char_length(btrim(title)) > 0),
  constraint sources_title_max_length check (char_length(title) <= 200),
  constraint sources_url_max_length check (url is null or char_length(url) <= 2000),
  constraint sources_content_max_length check (content is null or char_length(content) <= 50000),
  constraint sources_type_fields_consistency check (
    (type = 'link' and url is not null and content is null)
    or (type = 'text' and content is not null and url is null)
  )
);

comment on table public.sources is
  'Product Definition §30 Source entity. Milestone 17: link and pasted-text sources only -- no file upload yet (Asset Management, a later layer). Retained until removed; removal is a real DELETE, unlike the archive-only pattern used elsewhere in this schema.';

comment on column public.sources.workspace_id is
  'Denormalized from the owning project, matching the same RLS-simplification pattern already used by public.sessions and public.artifacts.';

create index sources_project_id_idx on public.sources (project_id);

alter table public.sources enable row level security;

create trigger set_updated_at
  before update on public.sources
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------
-- Extend prevent_ownership_reassignment() to cover sources
-- -----------------------------------------------------------------------
-- Based on the already-fixed (post-Milestone-13) function body with
-- search_path pinned inline in this same CREATE OR REPLACE, so this
-- migration does not repeat the Milestone 13 search_path regression.
create or replace function public.prevent_ownership_reassignment()
returns trigger
language plpgsql
set search_path = public
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
  elsif TG_TABLE_NAME = 'sources' then
    if NEW.owner_id is distinct from OLD.owner_id then
      raise exception 'sources.owner_id cannot be changed after creation.';
    end if;
    if NEW.workspace_id is distinct from OLD.workspace_id then
      raise exception 'sources.workspace_id cannot be changed after creation.';
    end if;
    if NEW.project_id is distinct from OLD.project_id then
      raise exception 'sources.project_id cannot be changed after creation.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger prevent_ownership_reassignment
  before update on public.sources
  for each row
  execute function public.prevent_ownership_reassignment();

-- -----------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------
create policy sources_select_member on public.sources
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy sources_insert_member_owner on public.sources
  for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and owner_id = auth.uid()
  );

create policy sources_update_member on public.sources
  for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy sources_delete_member_owner on public.sources
  for delete
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and owner_id = auth.uid()
  );
