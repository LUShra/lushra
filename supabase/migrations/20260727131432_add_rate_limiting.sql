-- Release Candidate 2: production-safe rate limiting.
-- Rollback:
--   drop function if exists public.check_rate_limit(text, int, int);
--   drop table if exists public.rate_limit_hits;
--
-- Backed by this same Postgres database (already fully provisioned,
-- already paid for) rather than a new external service -- Vercel's
-- serverless functions share no in-memory state across instances, so an
-- in-process counter would silently not work; every instance already
-- shares this one database, making it the correct, already-available
-- place for shared rate-limit state.
--
-- The table itself has RLS enabled with zero policies (this schema's
-- established "anon has zero policies" pattern) and is never queried
-- directly via PostgREST by any role -- only through the function below,
-- matching the existing is_workspace_member()/ensure_personal_workspace()
-- pattern of a narrow, computed SECURITY DEFINER interface rather than
-- exposing a raw table. This matters specifically here: rate-limit
-- buckets are keyed by things like a normalized email or IP, and a
-- direct SELECT policy permissive enough for an unauthenticated sign-in
-- attempt to check its own bucket would also let any anon client list
-- every other bucket key ever recorded -- an account-enumeration leak.
-- The function returns only a boolean and a retry-after estimate, never
-- the underlying rows.
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

comment on table public.rate_limit_hits is
  'Release Candidate 2: shared rate-limit state, one row per recorded hit. Never exposed directly via PostgREST -- see public.check_rate_limit(). bucket_key encodes action+identifier (e.g. "sign_in:email:<sha256>", "sign_in:ip:<address>"), never a raw secret.';

create index rate_limit_hits_bucket_key_created_at_idx
  on public.rate_limit_hits (bucket_key, created_at);

alter table public.rate_limit_hits enable row level security;
-- No policies: matches this schema's "anon has zero policies" pattern.
-- All access goes through check_rate_limit() below.

-- Atomically checks and, if allowed, records one hit for bucket_key
-- within a p_window_seconds rolling window capped at p_max_hits.
-- pg_advisory_xact_lock serializes concurrent calls for the *same*
-- bucket_key only (different keys never block each other), closing the
-- check-then-act race a plain count+insert would have under concurrent
-- requests; the lock auto-releases at transaction end. Opportunistically
-- deletes only this bucket's own expired rows on each call, bounding
-- table growth without needing a separate scheduled job.
create function public.check_rate_limit(
  p_bucket_key text,
  p_max_hits int,
  p_window_seconds int
)
returns table (allowed boolean, retry_after_seconds int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_oldest timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext(p_bucket_key));

  delete from public.rate_limit_hits
    where bucket_key = p_bucket_key
      and created_at <= now() - (p_window_seconds || ' seconds')::interval;

  select count(*), min(created_at) into v_count, v_oldest
    from public.rate_limit_hits
    where bucket_key = p_bucket_key;

  if v_count >= p_max_hits then
    return query select
      false,
      greatest(1, p_window_seconds - floor(extract(epoch from (now() - v_oldest)))::int);
    return;
  end if;

  insert into public.rate_limit_hits (bucket_key) values (p_bucket_key);
  return query select true, 0;
end;
$$;

comment on function public.check_rate_limit(text, int, int) is
  'Release Candidate 2: server-authoritative, database-shared rate limiting. Returns (allowed, retry_after_seconds) without ever exposing public.rate_limit_hits rows directly.';

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;
