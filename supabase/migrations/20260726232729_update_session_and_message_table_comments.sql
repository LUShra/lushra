-- Milestone 12: table comments were stale after adding AI-authored
-- messages (they still described the pre-Milestone-12 state). Comment-only
-- correction, no schema shape change.
-- Rollback:
--   comment on table public.sessions is
--     'Product Definition §30 Session entity. A focused period of work within a project; contains messages. No AI wiring yet (Milestone 11) -- see public.messages.';
--   comment on table public.messages is
--     'Product Definition §30 Message entity. Every row is human-authored this milestone (Milestone 11) -- no role column yet, see table comment for when AI-authored responses are added.';

comment on table public.sessions is
  'Product Definition §30 Session entity. A focused period of work within a project; contains messages, both human-authored and AI-authored (Milestone 12) -- see public.messages.';

comment on table public.messages is
  'Product Definition §30 Message entity. role distinguishes human-authored (''user'') from AI-authored (''assistant'', Milestone 12) rows; assistant rows can only be created via public.insert_assistant_message().';
