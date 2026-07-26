-- Milestone 12: AI orchestration -- first assistant-authored messages.
-- Rollback:
--   drop function if exists public.insert_assistant_message(uuid, text);
--   alter policy messages_insert_member_sender on public.messages
--     with check (
--       public.is_workspace_member(workspace_id)
--       and sender_id = auth.uid()
--     );
--   alter table public.messages drop constraint messages_role_sender_consistency;
--   alter table public.messages alter column sender_id set not null;
--   alter table public.messages drop column role;

-- -----------------------------------------------------------------------
-- public.messages: add `role`, relax `sender_id`
-- -----------------------------------------------------------------------
-- Platform Architecture §11/§12: an AI-authored reply is not sent by any
-- auth.users row, so sender_id must become nullable for role='assistant'
-- rows. The consistency CHECK below is the authoritative guarantee that a
-- human-authored row always has a real sender and an assistant-authored
-- row never does, independent of what any calling code sends.
alter table public.messages
  add column role text not null default 'user' check (role in ('user', 'assistant'));

alter table public.messages
  alter column sender_id drop not null;

alter table public.messages
  add constraint messages_role_sender_consistency check (
    (role = 'user' and sender_id is not null)
    or (role = 'assistant' and sender_id is null)
  );

comment on column public.messages.role is
  'Milestone 12: distinguishes human-authored (''user'', has sender_id) from AI-authored (''assistant'', sender_id is null) messages. Assistant rows can only be created via insert_assistant_message() -- see below.';

-- -----------------------------------------------------------------------
-- Close the forgery gap: ordinary inserts may only ever create
-- role='user' rows. Without this, any authenticated workspace member
-- could insert a role='assistant' row directly through the client,
-- indistinguishable in the UI from a genuine AI reply.
-- -----------------------------------------------------------------------
alter policy messages_insert_member_sender on public.messages
  with check (
    public.is_workspace_member(workspace_id)
    and sender_id = auth.uid()
    and role = 'user'
  );

-- -----------------------------------------------------------------------
-- insert_assistant_message: the only path that can create an
-- assistant-authored message.
-- -----------------------------------------------------------------------
-- SECURITY DEFINER because RLS's own INSERT policy cannot express "no
-- real sender, but still gated by workspace membership" -- this function
-- is that gate instead. It derives workspace_id from the session itself
-- rather than trusting a caller-supplied value (unlike the application's
-- own convenience-only workspace_id fields elsewhere), and accepts no
-- caller-supplied role or sender_id: both are hardcoded below, so no
-- parameter can ever escalate this into creating a human-attributed row
-- or a row outside the caller's own workspace.
create function public.insert_assistant_message(
  target_session_id uuid,
  message_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_workspace_id uuid;
  inserted_message public.messages;
begin
  select workspace_id into resolved_workspace_id
  from public.sessions
  where id = target_session_id;

  if resolved_workspace_id is null then
    raise exception 'session not found';
  end if;

  if not public.is_workspace_member(resolved_workspace_id) then
    raise exception 'not a member of this workspace';
  end if;

  insert into public.messages (session_id, workspace_id, sender_id, role, content)
  values (target_session_id, resolved_workspace_id, null, 'assistant', message_content)
  returning * into inserted_message;

  return inserted_message;
end;
$$;

comment on function public.insert_assistant_message(uuid, text) is
  'Milestone 12: the only path that creates an assistant-authored message. Resolves workspace_id from the session itself and re-checks workspace membership; accepts no caller-supplied role or sender_id.';

revoke all on function public.insert_assistant_message(uuid, text) from public;
revoke all on function public.insert_assistant_message(uuid, text) from anon;
grant execute on function public.insert_assistant_message(uuid, text) to authenticated;
