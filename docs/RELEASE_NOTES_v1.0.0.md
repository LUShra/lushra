# Lushra v1.0.0 -- Draft Release Notes

**Status: DRAFT.** This describes the intended v1.0.0 release. No Git tag has been created and no GitHub release has been published -- both remain explicit owner actions, taken only after the outstanding items in `docs/development/RELEASE.md` §14 are resolved.

---

## Summary

Lushra v1.0.0 is the first production-ready release of the AI Creation Operating Layer: project-based, durable AI creation work with real authentication, a real database, and production-grade security and observability hardening.

## What's included

- Workspaces, projects (with context, archive/restore), sessions with AI chat, versioned artifacts with review status, link/text sources, workspace search, an activity feed, and count-based usage visibility.
- Full Supabase Auth: sign-up, sign-in, sign-out, password recovery, password update -- every authorization decision enforced by Postgres Row-Level Security.
- Production hardening: server-authoritative rate limiting (auth + AI generation), a nonce-based Content-Security-Policy, structured security-event and observability logging, an `/api/health` endpoint.
- A zero-additional-dependency unit test suite (49 tests) wired into CI alongside typecheck, lint, and build.

## What's explicitly not included

Multi-user workspaces and invitations, file/binary source uploads, billing or plan tiers, a public API, a mobile or admin app, additional AI providers, and any GPU/media-generation infrastructure. See `README.md` for the full account of current scope.

## Known limitations at release

- The Content-Security-Policy has been implemented and unit-tested but **not yet validated against a real browser's console** -- an owner action before this is trusted as fully verified.
- No end-to-end/integration test suite exists yet; the development environment used to prepare this release could not install Playwright or run a browser. See `docs/development/RELEASE.md` §12.
- Supabase Auth's leaked-password protection is currently disabled at the project level (an Auth-settings toggle, an owner action).

## Upgrade / deployment notes

No breaking changes to any existing data or API surface. All database migrations in this release are additive (new table/indexes) or optimization/grant fixes with no destructive statement -- no data migration or backfill is required. See `docs/development/RELEASE.md` §11 for deployment and rollback.

---

*Prepared as part of Release Candidate 2. Do not tag or publish until the release-readiness classification in the RC2 final report is READY FOR v1.0 RELEASE or the listed owner actions have been explicitly accepted as deferred.*
