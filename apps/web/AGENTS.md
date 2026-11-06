# Web development rules

This file scopes `apps/web` and inherits the root [AGENTS.md](../../AGENTS.md).
Read the [UI/UX guide](../../docs/handoff/04-ui-ux-development-guide.en.md),
[branding](../../docs/handoff/03-branding.en.md), and the
[quality roadmap](../../docs/development/development-quality-roadmap.md).

## Current code and migration target

The Next.js app already separates route presentation in `src/app`, production
hooks/controllers/transports in `src/lib`, and the fictional adapter in
`src/lib/task-prototype`. Some views still combine rendering, local form state,
navigation guards and command preparation. T36 will extract cohesive
responsibilities with evidence; these instructions do not assert that migration
has happened or require an immediate directory rewrite.

- Route files compose screens. Feature components render typed public data and
  emit explicit user intents. Keep related components, styles and copy together;
  promote a shared primitive only after there is a real shared responsibility.
- Hooks bind React lifecycle to state/controllers; controllers own request,
  cancellation, draft, retry, version-conflict and navigation state transitions.
  Transports/proxies handle HTTP and protocol validation. Dependency direction is
  presentation → hook/controller → transport/public contracts. No presentation
  import back into those logic modules.
- UI/UX presentation workers use Codex `gpt-6-astra`, effort `high`. All logic,
  including hooks, state machines, auth/session, data, command preparation,
  proxies and functional tests, belongs to Codex `gpt-6.1-sol`, effort `xhigh`.
  Verify each worker's effective model/effort and use separate worktrees. Mixed
  files require explicit coordination; a `.tsx` extension does not make logic
  presentation-owned. T36's behavior-preserving structural extraction/moves of
  existing components also belong to SOL xhigh, retaining appearance; actual
  visual/interaction redesign belongs to Astra in T37 after T36 acceptance.
- Backend policy remains canonical. Consume public DTOs, capabilities and errors
  from `@rielia/contracts`; validate untrusted responses at the transport boundary.
  Do not import Prisma/backend code, leak server-only configuration, invent
  permission/sprint rules, or derive authorship from editable client data.
- Name files by responsibility using existing kebab-case conventions; components
  use PascalCase and hooks `use…`. Prefer explicit typed props/commands and named
  operations over generic helpers. Preserve existing wire names/error codes;
  changing a public contract requires a separately agreed migration.
- Keep pending, confirmed, failed, forbidden, stale and version-conflict states
  distinguishable. A timeout after submission retains the original idempotency
  key and recoverable intent; never show saved before confirmation. Preserve
  abort cleanup, session/logout clearing, workspace isolation and SSE recovery.
- `/prototype` and its memory-only fake domain remain isolated. Do not reuse its
  policy or storage as production task/sprint behavior.
- Follow product/UX scope and brand tokens before generic skill suggestions.
  Reuse accessible controls and semantic states. Verify ES/EN, responsive layout,
  keyboard/focus, touch, reduced motion and nonideal states; retain URL/detail
  return, draft protection, persistence and recovery behavior.

Extract by reason to change and testable responsibility, without arbitrary line
limits, one-file-per-function rules or new abstraction/package quotas. Do not
introduce a global store, query library or shared UI package merely because the
handoff proposes it. Future tooling/skills are planned, not installed by T36's
documentation preparation.

## Verification

Tests assert observable state transitions, protocol behavior and user journeys,
not source layout or implementation mirrors. For logic extraction run affected
focused checks, `pnpm check`, and relevant real API/PostgreSQL/security/runtime
checks from [CONTRIBUTING](../../CONTRIBUTING.md). Presentation changes also need
responsive/accessibility and persisted-flow evidence, with logic validation owned
by SOL. Record gaps honestly; a screenshot does not complete a flow. For prose-only
changes follow the documentation checks instead. Preserve generated files and
immutable handoff bytes; do not bulk-format either.
