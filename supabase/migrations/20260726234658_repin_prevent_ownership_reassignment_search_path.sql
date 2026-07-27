-- Milestone 13 follow-up: create_artifacts_table's `create or replace
-- function public.prevent_ownership_reassignment()` unintentionally
-- dropped the pinned search_path that 20260726010600 had set via `alter
-- function ... set search_path = public` -- CREATE OR REPLACE FUNCTION
-- does not preserve a function's proconfig settings from a prior ALTER
-- FUNCTION. Confirmed by the security advisor re-flagging
-- function_search_path_mutable for this function immediately after
-- create_artifacts_table applied. Fixed by pinning search_path inline in
-- the CREATE OR REPLACE itself (matching every function created since
-- 20260726010600), so a future replace of this function cannot silently
-- drop it again the same way.
-- Rollback:
--   alter function public.prevent_ownership_reassignment() reset search_path;

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
  end if;

  return NEW;
end;
$$;
