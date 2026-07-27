-- Milestone 15: Artifact review workflow.
-- Rollback:
--   alter table public.artifacts drop constraint artifacts_status_known;
--   alter table public.artifacts drop column status;

-- -----------------------------------------------------------------------
-- public.artifacts.status
-- -----------------------------------------------------------------------
-- Product Definition §20 item 10 / §30 Review entity: draft, in review,
-- approved, rejected -- "kept understandable rather than elaborate in
-- this first release." No review-notes/comments table, no comparison,
-- and no separate review-history log yet (Experience Architecture §27
-- lists those too, but item 10 explicitly asks for the minimal model);
-- each is its own later milestone.
--
-- No new RLS policy is needed: `status` is just another column on
-- public.artifacts, already covered by the existing
-- artifacts_update_member UPDATE policy (workspace membership is the
-- only gate, same as title/content). There is no separate "reviewer"
-- role in this schema yet (workspace_memberships only ever has 'owner'),
-- so nothing today distinguishes who submitted an artifact from who
-- reviews it -- that distinction is a later Collaboration-phase concern,
-- not something this migration can or should invent.
--
-- Valid transitions (enforced in application code, not a DB trigger,
-- matching the same rigor already used for projects.status):
--   draft      -> in_review   (submit for review)
--   in_review  -> approved    (approve)
--   in_review  -> rejected    (reject / request revision)
--   approved   -> draft       (reopen)
--   rejected   -> draft       (reopen)
-- No code path lets AI-authored content trigger a transition to
-- 'approved' -- there is no application mutation path today that lets
-- Milestone 12's AI orchestration touch public.artifacts at all, so
-- Product Definition §17's "AI never approves its own output" is
-- already satisfied by the absence of that capability, not by an
-- explicit guard this migration needs to add.
alter table public.artifacts
  add column status text not null default 'draft';

alter table public.artifacts
  add constraint artifacts_status_known check (
    status in ('draft', 'in_review', 'approved', 'rejected')
  );

comment on column public.artifacts.status is
  'Product Definition §20 item 10 / §30 Review entity. Milestone 15: draft/in_review/approved/rejected only -- no review notes, comparison, or history log yet. Valid transitions are enforced by apps/web/features/artifacts/review-actions.ts, not a database trigger.';
