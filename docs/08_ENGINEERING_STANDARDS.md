# LUSHRA ENGINEERING STANDARDS

Version: 1.0
Status: Foundational Engineering Specification
Authority: Subordinate to `docs/00_THE_LUSHRA_DOCTRINE.md`, `docs/01_PRODUCT_DEFINITION.md`, `docs/02_EXPERIENCE_ARCHITECTURE.md`, `docs/03_DESIGN_CONSTITUTION.md`, `docs/04_VISUAL_LANGUAGE.md`, `docs/05_INTERACTION_SYSTEM.md`, `docs/06_RESPONSIVE_SYSTEM.md`, and `docs/07_PLATFORM_ARCHITECTURE.md`

---

## 1. Document Authority

This document defines how every feature, service, component, API, database, AI integration, deployment, and future contribution to Lushra must be engineered. It is subordinate to all prior specifications; where anything here could be read as contradicting one of them, that document prevails.

This document operationalizes the Doctrine's Engineering Philosophy (Section 12), Performance Doctrine (Section 13), Security and Data Responsibility (Section 14), and Accessibility Doctrine (Section 11) into concrete, technology-aware standards, and it implements the layers defined in the Platform Architecture as real, buildable systems. Unlike the Platform Architecture, which stays technology-agnostic, this document names the actual current stack where doing so is useful — those choices remain subordinate to the conceptual architecture and can change without requiring a change to any document above this one.

---

## 2. Engineering Philosophy

Correctness precedes cleverness. Simplicity precedes abstraction. Readability precedes brevity. Accessibility is mandatory, not a stretch goal. Performance is a feature, not an optimization pass performed afterward. Security is never optional, regardless of deadline pressure. User trust is never compromised for engineering convenience.

Every change must be maintainable by a contributor other than its author. Every implementation must trace back to an approved specification, per Doctrine Section 16 — work with no traceable specification is either premature or a sign that a specification is missing. AI-generated code meets the exact same standards as human-written code; it is never approved on a lower bar because a model produced it, per Doctrine Section 15. No architectural decision is left undocumented — if it mattered enough to decide deliberately, it matters enough to write down.

---

## 3. Definition of Ready

Engineering work does not begin until: the specification section it implements is identified by name and number; its acceptance criteria are specific enough to verify; its required states — loading, empty, success, warning, error — are already defined by the Experience Architecture or Design System; its security and data implications are understood; its accessibility and responsive expectations are already documented upstream; and its dependencies on other in-progress work are identified. This is the engineering-specific application of Doctrine Section 21 — work that begins before these conditions are met routinely costs more to correct than the time saved by starting early.

---

## 4. Definition of Done

A change is not done because it compiles and appears to work. It is done only when it satisfies its named specification section; its tests are proportional to its risk, per Section 24; its accessibility has been verified, not assumed; its responsive behavior has been verified across device classes, per the Responsive System; its performance is acceptable under real conditions; its security considerations have been addressed; its documentation is accurate; and it has passed review against the standards in Section 27. This is the engineering-specific application of Doctrine Section 22.

---

## 5. Repository Standards

Lushra is a single pnpm-managed monorepo. Shared logic lives in `packages/` and is consumed by applications in `apps/` through the workspace protocol — logic is never duplicated between an app and a package, or between two packages, when a shared package can hold it once. Every package has one clear responsibility; a package whose purpose cannot be stated in one sentence is a sign it should be split or merged. The workspace configuration is the single source of truth for what is published where; nothing outside it silently assumes a different structure.

---

## 6. Project Structure

The current structure — `apps/web` as the Next.js application, `packages/database`, `packages/types`, `packages/ui`, and `packages/config` for shared TypeScript and lint configuration — is the standing baseline this document holds as the target, not merely a description of what happens to exist today. New apps or services are added as siblings under `apps/`; new shared concerns are added as siblings under `packages/`, never nested inside an application unless they are genuinely specific to it. A package is never created to hold a single, unreused piece of code — that code stays where it is used until a second consumer justifies extracting it, per Doctrine Section 12.

---

## 7. Naming Conventions

Files and directories use kebab-case. React components use PascalCase, matching the component's exported name. Functions and variables use camelCase. Types and interfaces use PascalCase. Constants that are genuinely fixed use SCREAMING_SNAKE_CASE; values that merely default to something and can be reconfigured are not named as if they were constants. Boolean names read as questions — `isActive`, `hasContext`, `canApprove` — so their meaning is unambiguous at the call site.

Code-level naming for platform concepts — Workspace, Project, Artifact, Context, Workflow, Session, Provider — matches the vocabulary defined in the Platform Architecture exactly. A codebase that invents parallel terms for the same concepts the specifications already named has failed Doctrine Section 16's requirement that implementation trace back to specification.

---

## 8. TypeScript Standards

Strict mode is always enabled, matching the shared `packages/config/typescript` baseline. `any` is never used without an explicit comment justifying why a real type could not be expressed. Type suppressions are never used to avoid solving an actual type problem, per Doctrine Section 12. Exported functions declare explicit return types; internal, private helpers may rely on inference where the inferred type is unambiguous. State with a fixed set of meaningful values — an artifact's review state, an AI interaction's automation level — is modeled as a discriminated union or a string literal union, never as a loosely-typed string or a boolean pair standing in for more than two states.

---

## 9. React Standards

Components are function components using hooks; class-based lifecycle patterns are not used. Client-side state is kept to the minimum required for interactivity — server state and URL state are preferred wherever they can correctly represent what a client store would otherwise duplicate. Composition is preferred over deep prop-drilling. Accessibility props — labels, roles, described-by relationships — are written as part of a component's initial implementation, not added in a later pass.

---

## 10. Next.js Standards

Lushra uses the App Router exclusively. Server Components are the default; a component becomes a Client Component only when it genuinely requires interactivity, browser-only APIs, or client-side state. Mutations prefer Server Actions where they fit the interaction cleanly. Middleware is used narrowly — session refresh and route protection, matching the pattern already established in `apps/web/middleware.ts` — and is never expanded into a place where meaningful business logic lives. Routes are grouped by product domain, matching the information architecture defined in the Experience Architecture, not by arbitrary technical convenience.

---

## 11. Component Engineering

Every interactive component supports the full state model defined in Design Constitution Section 27 — default, hover or focus, active, disabled, loading, error, empty, and selected, wherever each is relevant to that component. Components are implemented per `docs/10_COMPONENT_ARCHITECTURE.md` once it exists; until then, new shared components still follow this state model and the visual and interaction rules already established in Sections 3 through 6 of this specification hierarchy. Accessibility is built into a component's implementation, never treated as a follow-up task filed for later.

---

## 12. State Management

State lives at the lowest level of the tree that actually needs it. Server-derived state — the content of a Workspace, Project, or Artifact — is kept clearly separate from ephemeral UI state such as whether a menu is open. No global client-side store is used as an undifferentiated dumping ground for both. The Context entity defined in Platform Architecture Section 13 has exactly one authoritative source at any given time; the client never holds a silently divergent copy of it.

---

## 13. API Design

APIs are organized around the entities defined in the Platform Architecture — Workspace, Project, Artifact, Context, Workflow — never around raw database tables, per Platform Architecture Section 23. Every API boundary validates its input explicitly, per Doctrine Section 14; nothing is trusted merely because it arrived from an authenticated session. Errors returned from any API follow one consistent shape across the whole product, so client-side error handling (Section 17) does not need special cases per endpoint.

---

## 14. Database Standards

The schema reflects the Foundational Domain Model defined in Product Definition Section 30 directly — each entity in that model has a clear, corresponding representation in the database, and the relationships between tables match the relationships already defined there rather than introducing a parallel, undocumented structure. Migrations are additive and reviewed before merge; a destructive migration requires explicit justification and a rollback plan, per Doctrine Section 23. Row-level access rules enforce the Security and Permission Model defined in Platform Architecture Section 22 at the data layer itself — application code is a second layer of enforcement, never the only one.

---

## 15. Authentication & Authorization

Identity is established through Supabase Auth, matching the Identity and Authentication Layer defined in Platform Architecture Section 6. Authorization is checked explicitly and separately on every sensitive action; it is never inferred from the mere fact that a session is authenticated, per Doctrine Section 14. Session-refresh middleware is not, by itself, a substitute for route-level authorization — a route that requires an authenticated user actively verifies this and redirects otherwise, closing the gap present in the current scaffolding, where middleware refreshes the session but does not yet enforce access to protected routes.

---

## 16. AI Provider Integration

Providers are accessed only through the AI Orchestration Layer defined in Platform Architecture Sections 11 and 12 — no application or UI code calls a provider's API directly. Provider credentials are server-only and never reach a client bundle, matching the environment-variable standard in Section 23. The orchestration layer, not individual call sites, is responsible for retry behavior, failure handling, and communicating uncertainty, per Product Definition Section 17.

---

## 17. Error Handling

Errors are caught at the boundary closest to where they occur and are never silently swallowed. A user-facing error message never exposes a stack trace or a raw provider response, per Design Constitution Section 22. Where the shape of a failure is known in advance, it is modeled as a typed result rather than relying solely on thrown exceptions caught far from their origin.

---

## 18. Logging & Observability

Logs are structured and machine-parseable. Sensitive data — credentials, full user-authored content, complete provider payloads — is never written to logs, per Doctrine Section 14's data minimization requirement. Logs are correlated to the request or session that produced them, so an issue can be traced without needing to store more content than is genuinely necessary to debug it.

---

## 19. Performance Standards

Interactions acknowledge user input immediately, consistent with Interaction System Section 19. Layout shift is avoided as content loads. Routes are code-split so a user only downloads what the current view requires. Images are served at an appropriate size and format for the device requesting them. Client-side JavaScript is added deliberately, per Doctrine Section 13 — a dependency that exists only to save a small amount of implementation time is weighed against the client-side cost it adds to every user's session.

---

## 20. Accessibility Standards

Contrast and semantic structure meet or exceed recognized accessibility standards as a testable, automatically checked baseline, per Doctrine Section 11. Automated accessibility checks run in continuous integration as a gate, per Section 25, not as an optional report. Manual keyboard and screen-reader verification is required before a feature can be considered Done, per Section 4 — automated checks catch a meaningful subset of accessibility defects, not all of them.

---

## 21. Security Standards

Least privilege applies to every service, credential, and integration, per Platform Architecture Section 22. Secrets are never present in a client bundle. Every input boundary validates explicitly, per Section 13. Dependency vulnerabilities are tracked and addressed, per Section 29. No security shortcut is ever justified as temporary when real user data is involved, per Doctrine Section 14 — this applies equally to code written by a human and code generated by AI.

---

## 22. Privacy & Data Protection

Data collection is minimized to what a feature genuinely requires, per Doctrine Section 14 and Product Definition Section 25. Retention periods are documented, not left implicit. Deletion actually removes data rather than merely hiding it from the interface that displays it.

---

## 23. Environment Variables

Only values genuinely safe to expose to the browser use the `NEXT_PUBLIC_` prefix, matching the pattern already established in `apps/web/.env.example`. Service-role keys, provider credentials, and any other secret are never prefixed this way and are never referenced from client-side code. `.env.local` and any other file containing real credentials is never committed, consistent with the existing `.gitignore` configuration. `.env.example` is kept in sync with the variables actually read by the application — an undocumented required variable is treated as a defect.

---

## 24. Testing Strategy

Test coverage is proportional to risk, per Doctrine Section 22 — authentication, data mutation, and the AI orchestration boundary require automated coverage; a purely presentational component with no logic may require less. Interface components are tested for behavior and accessibility, not for incidental implementation detail that would make the test brittle without making it more meaningful. An automated test suite is never treated as a substitute for actually running the feature and observing it behave correctly.

---

## 25. CI/CD Standards

Type checking, linting, automated tests, an accessibility check, and a production build all run on every change before it can merge — none of these are optional or skipped to unblock a merge. The deployment pipeline promotes through environments that mirror each other closely enough that a passing check in one environment is meaningful evidence for the next.

---

## 26. Git Workflow

Changes are small and reviewable, per Doctrine Section 12 — a change too large to review in one sitting is broken apart. Commit messages explain why a change was made, not only what changed. Feature work merges only after review; direct commits to a shared branch are reserved for genuinely trivial fixes. Hooks and checks configured for the repository are never bypassed to force a merge through.

---

## 27. Code Review Standards

Every review evaluates correctness, security, readability, maintainability, testability, performance, the accessibility of any resulting interface, failure handling, observability, documentation accuracy, the impact of any new dependency, and the safety of any migration or rollback path — matching the Doctrine's Engineering Review Standard in Section 20 exactly. A change is never approved solely because it compiles or passes a superficial check.

---

## 28. Documentation Standards

Code comments explain only non-obvious reasoning — a hidden constraint, a workaround for a specific issue, a subtlety that would otherwise surprise a future reader — never what well-named code already communicates on its own. Specification documents are updated before an implementation that changes their meaning, per Doctrine Section 16, never after, as an afterthought. Repository-level documentation is kept accurate as the codebase evolves; a stale doc is treated as a defect, not a low-priority cleanup item.

---

## 29. Dependency Management

A new dependency is justified against what it replaces or enables — dependencies are never added for something trivial to implement directly. The lockfile is committed and treated as authoritative. Dependency updates are reviewed for breaking changes and security advisories before being merged. Dependencies no longer used are removed rather than left to accumulate silently.

---

## 30. Technical Debt Management

Technical debt is tracked explicitly rather than left implicit in messy code. A shortcut taken under real time pressure is documented as debt, with a stated plan for resolving it, at the time it is taken. Debt affecting security or accessibility is never deferred indefinitely, per Doctrine Sections 11 and 14 — it is prioritized ahead of debt that only affects convenience.

---

## 31. Scalability Principles

The application layer is kept stateless wherever possible, so it can scale horizontally without coordination overhead. Data access patterns are designed around the entity relationships defined in the Platform Architecture, not around whatever query happens to be convenient to write first. Scaling optimization is not applied prematurely where it would compromise the simplicity required by Doctrine Section 12 — architecture is built to scale when scale is genuinely needed, not spent in advance on a guess.

---

## 32. Reliability Standards

The system degrades gracefully when a provider or external dependency fails, made possible by the provider interchangeability defined in Platform Architecture Section 12. Retries are bounded and, where relevant to the user's understanding of what is happening, made visible per Experience Architecture Section 39. Data is never silently lost — a failed save is a visible, recoverable error state, never a quiet discard.

---

## 33. Monitoring & Incident Response

Key user journeys, per Experience Architecture Section 7, are monitored for failure directly, not only inferred from infrastructure-level metrics. An incident that affects user trust is treated with the same seriousness the Doctrine requires of any other trust-affecting decision, per Doctrine Section 4. A post-incident review updates the relevant specification whenever the incident reveals a gap in it, per Doctrine Section 16 — the response to an incident is never purely a code fix when the specification itself was also wrong or silent.

---

## 34. Engineering Anti-Patterns

Lushra's engineering practice never bypasses strict TypeScript with broad suppressions used to avoid a real fix; calls an AI provider directly from client-side code; stores a secret anywhere client-accessible; defers accessibility with the reasoning that it can be added later; treats a genuine conflict between a specification and the codebase as something to quietly route around instead of reporting, per Doctrine Section 16; ships a feature whose loading, empty, and error states were never actually designed; or adds a dependency to solve something that a small amount of direct code would have solved just as well.

---

## 35. Governance

Changes to this document follow the Doctrine's Decision Framework, per Doctrine Section 17, and require an explicit, reviewed amendment. A new standard is added to this document only when it serves an already-approved specification — this document does not encode a personal engineering preference that no upstream specification actually requires.

---

## 36. Acceptance Standards

An implementation is accepted only when it satisfies the specification it traces back to, meets every relevant standard in this document, and has passed review against Section 27. An implementation that merely runs without meeting these conditions has not met this standard, regardless of how close it appears to being finished.

---

## Amendment and Review Process

These Engineering Standards can be amended, but only deliberately: an explicit proposal, a stated reason, and review before the change takes effect, matching the discipline established across every prior specification.

**Amendment Record**

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-07-24 | Initial ratification of the Lushra Engineering Standards. |
