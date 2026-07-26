-- Milestone 6: core database schema.
-- Rollback:
--   alter function public.prevent_ownership_reassignment() reset search_path;
--   alter function public.set_updated_at() reset search_path;
--
-- Found by the Supabase security advisor immediately after applying
-- 20260726010300: public.set_updated_at() and
-- public.prevent_ownership_reassignment() were created without a pinned
-- search_path (function_search_path_mutable). Neither function performs
-- any schema-dependent, unqualified object lookup that a hijacked
-- search_path could redirect -- they only read/compare NEW/OLD record
-- fields and call the built-in now() -- so this is not an exploitable
-- gap in practice, but pinning it is free and removes the warning
-- outright, matching the same hardening already applied to
-- is_workspace_member and create_workspace.
alter function public.set_updated_at() set search_path = public;
alter function public.prevent_ownership_reassignment() set search_path = public;
