Lushra

An AI Creation Operating Layer

Lushra is a web application for durable, project-based AI creation work. A user establishes a project, gives it context, works within it across sessions using an AI assistant, produces artifacts that persist and version over time, and reviews what becomes authoritative. Conversation is one way to interact with the system -- it is not the unit the product is built around.

This README describes what is actually implemented in this repository today. For the long-term product vision (a much larger scope than currently exists), see `docs/01_PRODUCT_DEFINITION.md`; for what's built versus what's planned, see `docs/09_IMPLEMENTATION_ROADMAP.md` and `docs/DATABASE_SCHEMA.md`.

---

What exists today

- **Workspaces.** Every user is automatically provisioned a personal workspace on first sign-in. Multi-user workspaces, invitations, and roles beyond owner are not yet implemented.
- **Projects.** Create, rename, edit context (purpose, desired outcome, key constraints, target audience), archive, and restore. Project Home surfaces sessions, artifacts, and sources for a project in one place.
- **Sessions and AI chat.** Each project can have one or more sessions; each session is a message thread with an AI assistant. AI responses are generated through a provider-neutral orchestration layer -- the application never calls a specific AI vendor's SDK directly, only its own internal interface, so the underlying provider can change without touching product code. The only implemented provider today is OpenAI, called server-side only.
- **Artifacts.** Durable, versioned outputs saved from a session or edited directly, with a review status (draft → in review → approved, etc.) and full version history with restore.
- **Sources.** Link and pasted-text material attached to a project for context. File/binary upload is not yet implemented.
- **Search and activity.** Workspace-wide search across projects, artifacts, and sources; a workspace activity feed composed from existing table timestamps (not yet a persisted event ledger).
- **Usage visibility.** Count-based usage figures on the Settings page (not yet a metering/quota/billing layer -- there is no billing or plan-tier system in this repository).
- **Authentication.** Supabase Auth: sign-up, sign-in, sign-out, password recovery, and password update, all as Next.js Server Actions. Every authorization decision is enforced by Postgres Row-Level Security -- there is no service-role/RLS-bypass path anywhere in the application.
- **Production hardening.** Standard security headers plus a nonce-based Content-Security-Policy; server-authoritative, Postgres-backed rate limiting on auth and AI-generation endpoints (safe across Vercel's serverless model); structured JSON logging for auth events, mutation failures, AI-provider failures, rate-limit events, and unhandled exceptions; a `/api/health` endpoint.

What does not exist yet (and isn't implied by this repository's structure)

GPU worker infrastructure, a distributed execution network, a public API, a mobile app, an admin app, a provider marketplace, additional media-generation providers (image/video/portrait/face-transformation engines), payment processing, an enterprise admin surface, or a plugin system. Nothing below should be read as a roadmap commitment -- see `docs/09_IMPLEMENTATION_ROADMAP.md` for that.

---

Repository structure

```
lushra/
├── apps/
│   └── web/            Next.js 15 (App Router) application -- the only app in this repo
├── packages/
│   ├── database/        Generated Supabase types, re-exported for apps/web
│   ├── types/            Shared TypeScript types
│   ├── ui/               Shared design-system components and CSS
│   └── config/           Shared tooling config (eslint, typescript, ...)
├── supabase/
│   ├── migrations/       SQL migrations -- the source of truth for the live schema
│   └── functions/        (currently empty -- no Edge Functions deployed)
├── docs/                 Product, design, engineering, and schema documentation
└── scripts/
```

---

Technology stack

- **Frontend/Backend:** Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript 5.9 (strict)
- **Database/Auth:** Supabase (Postgres, Auth/GoTrue), accessed exclusively through Row-Level Security -- no service-role key is used anywhere in the application
- **AI:** OpenAI, called server-side only, behind an internal provider-neutral interface
- **Deployment:** Vercel
- **Package management:** pnpm workspaces (this monorepo)
- **Testing:** Node's built-in `node:test` runner (zero additional dependencies)

---

Getting started

```
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase + OpenAI values
pnpm dev
```

Required environment variables are listed in `apps/web/.env.example`.

---

Repository

GitHub: `LUShra/lushra` (private)

---

License

This repository is currently private and proprietary. No permission is granted to copy, distribute, modify, sublicense, publish, or commercially use this repository without the express permission of the repository owner.
