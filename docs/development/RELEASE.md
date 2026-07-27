# LUSHRA RELEASE DOCUMENTATION

Version: Release Candidate 2 (pre-v1.0.0)
Last updated: 2026-07-27

This document is the operational reference for deploying, verifying, and operating Lushra. For product scope and history, see `README.md` and `docs/DATABASE_SCHEMA.md`; for what's still planned, see `docs/09_IMPLEMENTATION_ROADMAP.md`.

---

## 1. Scope

What's implemented: workspaces (personal, auto-provisioned), projects (create/rename/context/archive/restore), sessions with AI chat, artifacts (versioned, with a review status), link/text sources, workspace search, an activity feed, count-based usage visibility, full Supabase-Auth-backed authentication, and the production hardening covered in this document (rate limiting, CSP, structured logging, health checks).

What's not implemented: multi-user workspaces/invitations/roles, file/binary source uploads, a persisted usage-metering/billing/plan-tier system, a public API, a mobile or admin app, additional AI providers, GPU worker infrastructure, or a plugin/marketplace system. See `README.md`'s "What does not exist yet" for the full list.

---

## 2. Architecture

Next.js 15 (App Router, Server Components, Server Actions) on Vercel, talking to Supabase (Postgres + Auth) exclusively through Row-Level Security -- there is no service-role key anywhere in the application, and no code path bypasses RLS except the narrow, audited `SECURITY DEFINER` functions listed in `docs/DATABASE_SCHEMA.md` §3. AI generation goes through a provider-neutral internal orchestration interface (`apps/web/lib/ai/`); the only implemented provider is OpenAI, called server-side only. A single pnpm monorepo: `apps/web` is the only application; `packages/database|types|ui|config` are shared libraries.

---

## 3. Environment variables

All in `apps/web/.env.example`, kept in sync with what the code actually reads:

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical app origin, used to build auth email confirmation/redirect links | Recommended in every real environment (falls back to `VERCEL_URL`, then `localhost`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key -- RLS is what makes this safe to expose | Required |
| `OPENAI_API_KEY` | Server-side-only OpenAI credential for AI chat responses | Required for AI responses to work (its absence degrades gracefully -- see §7) |

No service-role key, no Upstash/Redis credential, and no third-party monitoring vendor key are used anywhere -- rate limiting and logging are both built directly on infrastructure already provisioned (see §6, §8).

---

## 4. Migration status

All 22 migrations in `supabase/migrations/` are applied to the live project exactly once each (verified via `list_migrations` against the live database, not assumed from the repository alone). The three most recent, from Release Candidate 2, are additive/optimization-only: `add_workspace_scoped_read_indexes`, `optimize_rls_auth_function_calls` (query-plan optimization, no authorization-logic change), `revoke_public_execute_on_rls_auto_enable` + its correction `..._from_public_role` (a function-grant fix, not a schema change), and `add_rate_limiting` (new table + function, purely additive). No migration in this repository has ever been rewritten after being applied -- a correction is always a new, later migration.

---

## 5. Authentication behavior

Supabase Auth (email + password). Every action (`apps/web/features/auth/auth-actions.ts`) re-derives the current user server-side; the client never asserts identity. Password-recovery responses are deliberately identical whether or not the email has an account (anti-enumeration). Every meaningful auth event (sign-up, sign-in, sign-out, password recovery/update, email confirmation, protected-route denial) is both rate-limited (§6) and logged (§8) server-side. See `docs/DATABASE_SCHEMA.md`'s Release Candidate 2 section for the full event taxonomy.

---

## 6. Rate limits

Server-authoritative, Postgres-backed (`check_rate_limit()`, shared across every Vercel serverless instance -- never in-memory). Current limits:

| Action | Per-IP | Per-email/user |
|---|---|---|
| Sign-up | 5 / hour | 3 / hour |
| Sign-in | 20 / 5 min | 5 / 5 min |
| Password recovery | 5 / hour | 3 / hour |
| AI generation (per user) | -- | 20 / hour |

Fails **open** on any database error (never blocks legitimate traffic due to a limiter outage; the failure itself is logged at `error`). Blocked requests get a generic "try again in N minutes" message through the same form-state shape every other validation error uses.

---

## 7. AI provider configuration

`OPENAI_API_KEY` server-side only. If unset, `sendMessageAction` still saves the user's own message and returns a non-fatal `aiWarning` rather than failing the whole request. Model: `gpt-4o-mini`, capped at 1,000 output tokens, 30s request timeout. Provider failures (timeout, non-2xx, empty response) are logged with `durationMs` for latency investigation.

---

## 8. Logging & observability

Structured JSON, one line per event, to Vercel's own log viewer -- no external monitoring vendor. Every line carries `event`, `level`, `timestamp`, and `environment` (`production`/`preview`/`development`, from `VERCEL_ENV`) at minimum; most carry a request `correlationId` (Vercel's own `x-vercel-id`) and relevant entity ids (`workspaceId`/`projectId`/`sessionId`/etc.). Covers: every auth event, every rate-limit check, every mutation-action database failure, every AI-provider failure, workspace-provisioning failures, health-check degradation, and (via `instrumentation.ts`'s `onRequestError`) any exception no other handler already caught. Never logs a password, token, OTP, full user-authored content, or a raw third-party payload.

---

## 9. Health checks

`GET /api/health` returns `{ status: "healthy" | "degraded", checks: { supabase } }`, `200` or `503`. Checks Supabase Auth reachability with a 5s timeout; a degraded result is also logged (`health_check_degraded`).

---

## 10. Content-Security-Policy

Nonce-based (`script-src 'self' 'nonce-{per-request}' 'strict-dynamic'`), generated per-request in `middleware.ts`. Full policy and the runtime-needs audit behind it are in `docs/DATABASE_SCHEMA.md`'s Release Candidate 2 section. **Not yet validated in a real browser** -- see §12.

---

## 11. Deployment & rollback

**Deploy:** push to `main` (after PR review); Vercel builds and deploys automatically; GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, `node:test`, and build on every PR and push to `main`.

**Rollback:** use Vercel's instant rollback to the previous production deployment (no code change or redeploy needed). No migration in this project has ever required a down-migration -- every one so far has been additive or a query/grant optimization with no destructive statement, so rolling back the application code does not require rolling back the schema. If a future migration is ever destructive, that migration's own file must document its rollback procedure explicitly; none currently needs one.

---

## 12. Tests

49 unit tests (`node:test`, zero additional dependencies -- see `docs/DATABASE_SCHEMA.md` for why) across redirects, logging, rate-limit keys, auth events, and CSP policy-building. Run via `pnpm test`, wired into CI.

**Not run this cycle, and why:** the 12 prioritized end-to-end browser journeys (unauth redirect, sign-in/up validation, authenticated workspace access, project/artifact/session flows, AI-orchestration boundary, sign-out, keyboard/mobile nav). This development environment cannot install Playwright (`pnpm install --frozen-lockfile` fails here, confirmed directly) or run `next build`/`next start`/a browser locally. See `docs/DATABASE_SCHEMA.md`'s Release Candidate 2 section for the full accounting and the recommended next step.

---

## 13. Known limitations

- CSP has not been validated against a real browser's console (owner action, §14).
- No E2E/integration test suite exists yet (owner action, §14).
- Supabase Auth's leaked-password protection (HaveIBeenPwned check) is currently **disabled** at the project level -- a Supabase Auth-settings toggle, not something a migration or this codebase can change (owner action, §14).
- Rate limits are fixed constants in code, not configurable without a deploy.
- No multi-user workspaces, billing, public API, or additional AI providers (by design -- see §1).

---

## 14. Owner actions required before/around v1.0

1. **Validate the CSP in a real browser** on a deployed preview: open the app, check DevTools' console for `Content-Security-Policy` violation reports, fix any genuine one found (see `docs/DATABASE_SCHEMA.md` for the exact policy and the reasoning behind it).
2. **Enable Supabase Auth's leaked-password protection** (Authentication → Policies, or the equivalent Management API call) -- a one-click, no-cost improvement this pass could not make with the tools available to it.
3. **Add Playwright** from a real development environment (or directly in a CI branch) once one is available, per §12's recommendation, and decide on a safe live-test strategy (dedicated Supabase branch vs. fully mocked Supabase/OpenAI).
4. Confirm `/api/health` reports `healthy` against the real production Supabase project after this release deploys.

---

## 15. Final security & release review

Reviewed against the full checklist below. **Fixed only confirmed defects; did not redesign any working system without evidence of one.**

| Area | Finding |
|---|---|
| Authentication | Sign-up/in/out, password recovery/update all real, rate-limited, logged. No issue. |
| Authorization / RLS | RLS enabled on all 9 tables (§4 of `DATABASE_SCHEMA.md`); `anon` has zero policies anywhere. No issue. |
| `SECURITY DEFINER` functions & grants | All have `search_path` pinned (confirmed: no `function_search_path_mutable` advisor lint present). `check_rate_limit()` is deliberately also granted to `anon` (documented, required for pre-auth rate limiting); every other advisor-flagged grant is an existing, intentional `authenticated`-callable RPC. No issue. |
| Open redirects / host-header injection | `getSafeRedirectPath()`/`getAppOrigin()` fixes from Release Candidate 1 unchanged and still tested (`redirects.test.ts`). No issue. |
| CSRF / XSS | Next.js Server Actions' same-origin protection unmodified; repo-wide search confirms no `dangerouslySetInnerHTML` or `eval` anywhere, including in every file this pass added. No issue. |
| CSP | Implemented this pass (§10). Real-browser validation outstanding -- **owner action**, not a confirmed defect. |
| SQL injection | `check_rate_limit()` uses only bound parameters, no dynamic SQL string concatenation; every other query goes through PostgREST. No issue. |
| Account enumeration | Password-recovery response symmetric regardless of outcome (unchanged, still correct). Sign-up does surface Supabase's own "already registered"-style error text on failure -- pre-existing behavior from before this pass, a common and generally accepted trade-off (sign-up enumeration is far lower-severity than sign-in or password-recovery enumeration, both of which are already protected), not a regression introduced here. Noted, not treated as a blocking defect. |
| Rate limiting | Implemented this pass (§6), server-authoritative, tested. No issue. |
| Sensitive logging | Structurally impossible to log a password/token/OTP through `AuthEventContext`'s type; confirmed no log line anywhere logs full user content or a raw third-party payload. No issue. |
| Secret exposure | `.env.example` in sync with every `process.env` reference; no service-role key anywhere; rate-limit bucket keys are hashed, never raw. No issue. |
| AI provider boundary | `OPENAI_API_KEY` server-side only; provider-neutral orchestration interface unchanged. No issue. |
| Cross-workspace isolation | Every table-level policy still gated by `is_workspace_member()`; `rate_limit_hits` holds no workspace-scoped data at all, so it has no cross-workspace surface to violate. No issue. |
| Mutation ownership | `prevent_ownership_reassignment()` unchanged this pass. No issue. |
| Error leakage | Every new user-facing error message (rate-limit, CSP has none, auth) is generic; raw errors go only to server-side logs. No issue. |
| Session security | Supabase SSR cookie handling unchanged this pass. No issue. |
| Password recovery | Anti-enumeration preserved end-to-end, now also logged server-side without changing the user-facing symmetry. No issue. |
| DoS risk | Auth and AI-generation endpoints now rate-limited; `/api/health`'s Supabase check has a 5s timeout. No issue. |

**Checks run:** full `node:test` suite (49/49 passing); a standalone `tsc --noEmit` invocation (this sandbox cannot run `pnpm typecheck` directly -- see `DATABASE_SCHEMA.md` for why) shows only errors in files this pass did not touch, all falling into the same categories of environmental noise this project has documented and verified throughout its history (unresolved `next`/`node:*` modules and downstream React/Supabase-generic-type artifacts from `apps/web/node_modules` never being linked in this sandbox) -- GitHub Actions' `pnpm typecheck`, with a fully linked `node_modules`, remains the authoritative signal, consistent with how every prior milestone and Release Candidate 1 were verified. `pnpm lint`/`pnpm audit` could not run locally for the same reason; CI is authoritative there too.

**Classification: CONDITIONALLY READY -- OWNER ACTION REQUIRED.** No confirmed blocking defect was found. Two required external validations remain genuinely unresolved and are not something this pass could complete: real-browser CSP validation (§10, §14) and enabling Supabase's leaked-password protection (§13, §14) -- both are explicit owner actions, not code changes. A third, non-blocking recommendation (adding Playwright once a working install environment is available) is deferred, not blocking, since no E2E suite existed before this pass either.

---

## 16. v1.0 checklist

- [x] Schema, migrations, and RLS reviewed and live-verified
- [x] Authentication implemented and security-event logged
- [x] Rate limiting implemented, server-authoritative, tested
- [x] CSP implemented (browser validation outstanding -- owner action)
- [x] Structured logging covers every required event category
- [x] Health check reviewed
- [x] Documentation (this file, README, roadmap) corrected to match reality
- [ ] CSP validated in a real browser (owner action)
- [ ] Leaked-password protection enabled (owner action)
- [ ] E2E test suite added (owner action, next real testing investment)

---

## Amendment and Review Process

Updated whenever a change described in this document (env vars, rate limits, logging taxonomy, deployment/rollback procedure) changes in the code.

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-07-27 | Initial version, covering Release Candidate 2. |
