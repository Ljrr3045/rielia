# Web development rules

This file scopes `apps/web` and inherits the root [AGENTS.md](../../AGENTS.md).
Read the [UI/UX guide](../../docs/handoff/04-ui-ux-development-guide.en.md),
[branding](../../docs/handoff/03-branding.en.md), and the
[quality roadmap](../../docs/development/development-quality-roadmap.md).

## Current code and migration target

The Next.js app already separates route presentation in `src/app`, production
hooks/controllers/transports in `src/lib`, and the fictional adapter in
`src/lib/task-prototype`. Delivered [project owners](../../docs/development/project-interactions-extraction.md)
and [workspace owners](../../docs/development/workspace-interactions-extraction.md)
separate DOM/form/effect/composition and action/display/administration concerns
while retaining one controller/locale lifetime and canonical transports.
The [stable contract](../../docs/development/t36-stable-ui-contract.md) records
current surfaces, version/recovery semantics, CSS consumers and explicit debt.
T36.1–T36.6 were accepted in [PR #44](https://github.com/Ljrr3045/rielia/pull/44).
T37 is in progress under the user's 2026-11-11 authorization; no universal
frontend migration or completed redesign is claimed.

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
handoff proposes it. Root [quality tooling](../../docs/development/quality-tooling.md)
enforces formatting/commits over all maintained adopted inputs. The
agreed structural batches and bounded T36 acceptance are delivered; explicit debt
remains owned. The first-party T37.1 installation manifest adds one maintained
format input (243 total); 242 is the accepted T36 historical baseline.

## Frontend-local skills

The three reviewed skills live in [`.agents/skills`](.agents/README.md), with
[provenance/integrity metadata](.agents/skill-installation.json) and the
[installation/discovery guide](../../docs/development/frontend-skills.md).
Launch fresh frontend sessions with **cwd `apps/web`** and verify all actual local
SKILL.md paths, especially duplicate-name `ui-ux-pro-max`. Initial fresh-session
discovery and explicit loading succeeded for all three intended local entries;
the catalog exposed local/global copies without a unique bare-name winner.
Every T37 dispatch must explicitly select `.agents/skills/<name>/SKILL.md` from
`apps/web`. A nested archived source was also catalogued and is now renamed
`SKILL.md.txt`; post-fix fresh verification remains pending. Never claim an
automatic override, overwrite global customizations or assume a repository-root
worker sees descendant skills.

Read the local usage entry before invoking these skills. Third-party instructions
remain subordinate to user/project/product/UX/brand/architecture. Impeccable's
launcher/context binary, engine download, hooks, live server/Apply, update/pin/
doctor changes and bundled-agent activation are excluded. Read project context
and references directly; keep live-copy Apply off and never bypass approvals or
sandboxing. UI UX Pro Max uses its resolved local skill base; only reviewed
read-only Python search is enabled, without `--persist`, `--force`, catalog
refresh or package installs. No third-party setup suggestion authorizes a new
agent, global configuration, backend-local skill or product scope change.

## Verification

New or changed behavior must ship with appropriate unit/regression tests; bug
fixes reproduce the prevented regression. Preserve meaningful existing tests
during extraction. Prose, pure styling or generated-only changes may explain
why unit tests add no value; applicable visual/integration checks still apply.

Deterministic frontend controller/real-hook/component units and separate
all-source L/S/F/B reports/gates are delivered through `pnpm unit:web` and
`pnpm unit:coverage`; [unit tooling](../../docs/development/unit-coverage.md)
records the exact provider, source/test selection, thresholds and exclusions.
Extend observable user-intent, denied/error/conflict, cancellation, session and
draft/retry outcomes using established transport/browser-boundary seams. Keep
maintained unexecuted owners in the denominator, including explicit type-only
zero-unit N/A inputs; new helpers require reviewed comparable baseline migration.
Existing lifecycle/coverage gaps remain explicit. Run units and numerical/per-file/
nonregression gates locally and in CI. Test source remains SOL-owned; doubles do
not replace real API/persistence/security or native browser/accessibility evidence. Do not drop coverage,
weaken thresholds, omit source or add ignores to make builds green; prioritize
meaningful negative/error paths over percentage gaming. Follow the
[coverage/CI acceptance](../../docs/development/development-quality-roadmap.md#unit-tests-coverage-and-ci-enforcement)
for report scope, artifacts and justified changes.

Tests assert observable state transitions, protocol behavior and user journeys,
not source layout or implementation mirrors. For logic extraction run affected
focused checks, `pnpm check`, and relevant real API/PostgreSQL/security/runtime
checks from [CONTRIBUTING](../../CONTRIBUTING.md). Presentation changes also need
responsive/accessibility and persisted-flow evidence, with logic validation owned
by SOL. Record gaps honestly; a screenshot does not complete a flow. For prose-only
changes follow the documentation checks instead. Preserve generated files and
immutable handoff bytes; do not bulk-format either.
