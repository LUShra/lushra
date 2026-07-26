-- Milestone 10: project context fields.
-- Rollback:
--   alter table public.projects drop constraint if exists projects_target_audience_max_length;
--   alter table public.projects drop constraint if exists projects_key_constraints_max_length;
--   alter table public.projects drop constraint if exists projects_desired_outcome_max_length;
--   alter table public.projects drop constraint if exists projects_purpose_max_length;
--   alter table public.projects drop column if exists target_audience;
--   alter table public.projects drop column if exists key_constraints;
--   alter table public.projects drop column if exists desired_outcome;
--   alter table public.projects drop column if exists purpose;
--
-- Product Definition §20 item 5 ("Project foundation") names title,
-- purpose, desired outcome, description or brief, key constraints,
-- target audience, source materials, and a project context summary.
-- Milestone 6 already covers title (name) and description or brief
-- (description). This migration adds purpose, desired_outcome,
-- key_constraints, and target_audience as four more nullable columns on
-- the same table -- Context still has no independent lifecycle (no
-- versioning, no multiple sources), so it continues to live directly on
-- public.projects rather than a separate table, consistent with the
-- Milestone 6 design decision documented on that table's own comment.
--
-- "Source materials" is deliberately NOT added as a column here: it is
-- the Source entity from Product Definition §30, with its own
-- upload/attachment/processing lifecycle belonging to a distinct, later
-- architectural layer (Asset Management, Platform Architecture §15). A
-- plain text column could not honestly represent that capability, so
-- representing it as one would misstate what the product can actually
-- do, per Doctrine §4. It remains deferred. Likewise, no separate
-- "project context summary" column is added -- Experience Architecture
-- §19 requires users be able to see what context exists, which the
-- application satisfies by rendering the existing fields together, not
-- by storing a derived summary as its own row.
--
-- All four columns are nullable (a project can exist with only a name,
-- per the "quick creation" model from Experience Architecture §16) and
-- each has its own max-length CHECK, mirroring the pattern already
-- established on `description`. RLS is unaffected: the existing
-- projects_update_member policy already covers UPDATE on any column,
-- including these new ones, and prevent_ownership_reassignment() only
-- ever inspects owner_id/workspace_id, so it has nothing to do with
-- these fields.
alter table public.projects
  add column purpose text
    constraint projects_purpose_max_length check (
      purpose is null or char_length(purpose) <= 500
    ),
  add column desired_outcome text
    constraint projects_desired_outcome_max_length check (
      desired_outcome is null or char_length(desired_outcome) <= 500
    ),
  add column key_constraints text
    constraint projects_key_constraints_max_length check (
      key_constraints is null or char_length(key_constraints) <= 1000
    ),
  add column target_audience text
    constraint projects_target_audience_max_length check (
      target_audience is null or char_length(target_audience) <= 500
    );

comment on column public.projects.purpose is
  'Product Definition §20 item 5 ("purpose"). Nullable -- quick creation supplies only a name.';

comment on column public.projects.desired_outcome is
  'Product Definition §20 item 5 ("desired outcome"). Nullable -- quick creation supplies only a name.';

comment on column public.projects.key_constraints is
  'Product Definition §20 item 5 ("key constraints"). Free text, not a structured list -- a single project may have several constraints in one field for this milestone.';

comment on column public.projects.target_audience is
  'Product Definition §20 item 5 ("target audience"). Nullable -- quick creation supplies only a name.';
