# Development quality roadmap

Decision date: **2026-11-05, America/Caracas**; research/delivery timestamps may
fall on November 6 UTC. Authority: the user's explicit reprioritization. This is
an additive development decision; the original
[T01–T35 backlog](../handoff/02-architecture-technical-plan.en.md#73-execution-ready-engineering-backlog)
and all imported handoff bytes remain unchanged.

## Decision and acceptance boundary

Add exactly two top-level tickets: **T36 — Engineering quality, tooling and
structure**, then **T37 — UI quality redesign**. The explicit execution order is
**T36 → T37 → T11 → remaining work under its existing dependencies**. These
prerequisites pause new sprint/product expansion; they do not waive incomplete
T01–T35 acceptance, authorize later capabilities, or reorder the remaining
dependency graph numerically. Required regression fixes within these tickets
remain part of their bounded batches.

PR #32 prepared guidance. Later [tooling](quality-tooling.md),
[all-source unit gates](unit-coverage.md), maintained formatting at 242/242,
[backend owners](project-flow-extraction.md), [project owners](project-interactions-extraction.md)
and [workspace owners](workspace-interactions-extraction.md) deliver the agreed
T36.1–T36.5 implementation through merged PR #43. The [stable contract and debt](t36-stable-ui-contract.md)
records the bounded T36.6 closure accepted in
[PR #44](https://github.com/Ljrr3045/rielia/pull/44), merged at `92d480d` from
reviewed `37f2a8c` with successful current-head CI/native review. T36.1–T36.6 are
ACCEPTED; explicit debt remains owned. The user authorized starting T37 on
2026-11-11 America/Caracas. T37 is IN PROGRESS through
[T37.1 technical skill preparation](frontend-skills.md) and integrated
[Astra inventory](t37-ui-inventory.md)/[direction proposal](t37-design-direction.md).
Fresh frontend catalog discovery and explicit local loading are verified at
`325d732`, including removal of an unintended archived-source candidate. Bare-name
local/global precedence is not established; dispatches select explicit local
top-level paths. Current-head CI/native review and coordinator acceptance remain
required. T11 has not started.
No screen is redesigned or Astro app scaffolded by this preparation.
Prose or smaller files do not establish universal conformity, production readiness
or full T01–T35 acceptance.

Traceability: architecture §§1.4–1.5, 2–4 and 8.2/8.6; T01/T04–T10/T35; product
P01–P11/P33/P38, US01–US08/US11–US12/US24–US25; UXR01–UXR04/UXR06 and
UX01–UX03/UX05–UX07/UX09/UX11 for existing product surfaces. UX04 applies when
T11 later implements sprints. T37 does not implement T11 to satisfy that criterion.

Product owns scope, the [UI/UX guide](../handoff/04-ui-ux-development-guide.en.md)
owns composition/interaction, architecture owns contracts and permissions, and
[branding](../handoff/03-branding.en.md) owns voice and proposed identity/tokens.
Record contradictions for coordinator decisions. Reference products and skills
cannot expand these authorities.

## Observed baseline for the new work

Read-only audit at `origin/dev` **`63bf4c6eb0c20fd493a08442fbd337fa4a5f4187`**
separates implemented foundations from the improvements planned below:

| Surface | Observed state and planning implication |
| --- | --- |
| Lint/tooling | Root [package scripts](../../package.json) and [flat ESLint config](../../eslint.config.mjs) already pin/enforce ESLint, TypeScript and Next rules plus web/contracts/MCP import boundaries. [CI](../../.github/workflows/ci.yml) runs lint through `pnpm check`. Prettier, Husky, commitlint and lint-staged are absent from the audited setup; their later versions/compatibility remain to be selected |
| Frontend | `src/app` contains route/components and CSS modules; `src/lib` has hooks, injectable controllers, transports and same-origin proxies. `projects-view.tsx` has 2,993 lines and its CSS 3,866 at this base. These measurements locate review work, not an arbitrary limit or proof that every long file is wrong. The view still mixes presentation with navigation/form/command preparation; SOL must preserve its behavioral seams |
| Backend | A single `AppModule` wires identity/principals/workspaces/projects/runtime folders. `project-task.service.ts` has only 455 lines but compresses validation, policy, DTO projection, queries and transactional commands/replay/activity/outbox. Start with pure validators/mappers, then cohesive policy/read/command extraction while retaining the same verified context and `Transaction` |
| Tests | Existing `node:test` `.mjs` suites exercise pure TypeScript logic/transports and built Nest/real PostgreSQL integration; full CI adds Docker runtime and advisory checks. No Playwright/Vitest/Jest or React component runner is configured. Browser/responsive evidence in prior guides is separate from a newly installed automated browser suite |
| Scoped guidance | No `apps/web/AGENTS.md` or `apps/api/AGENTS.md` existed at the audit base. This documentation PR adds them before tool/configuration or code changes; it does not claim current source already follows every target boundary |
| Protected baseline | The UI research comparison found the supplied original handoff and all 47 imported paths/contents identical; repository verification retains that hash baseline. Product routes are `/identity`, `/workspaces`, `/projects`; `/` is a technical fixture and `/prototype` a fictional demo. No landing app exists |

This is source/configuration evidence, not a fresh run of application suites or
a complete code-quality/accessibility audit. Implementation workers refresh the
inventory after intervening merges, then attach actual checks to each bounded PR.
The table is the historical pre-tooling snapshot. See the
[tooling delivery guide](quality-tooling.md) for current exact pins, adoption,
separate unit-baseline audit findings and remaining enforcement/extraction work.

## T36 — Engineering quality, tooling and structure

**Objective:** make the existing application easier to change safely through
explicit developer standards, compatible automated enforcement and cohesive
responsibility boundaries, plus meaningful frontend/backend unit tests and
separate CI-enforced coverage, while preserving its public and UI behavior.
**Size:** L; ordered subdeliveries below require separate bounded PRs as needed.
**Dependencies:** merged T05–T10/T35 bounded foundations, approved Nest
[NodeAdapter/stack decision](stack-validation-decisions.md), current contracts
and tests; no claim that full source tickets are accepted.
**Ownership:** SOL `gpt-6.1-sol` `xhigh` owns tooling, architecture, all extraction
and tests, including code inside frontend `.tsx` files. Coordinator scopes and
accepts each batch and alone controls review transitions/merge.

| Order | Bounded subdelivery | Acceptance and evidence |
| --- | --- | --- |
| T36.1 | Document actual developer architecture, patterns and standards first | Root guidance links concise [web rules](../../apps/web/AGENTS.md) and [API rules](../../apps/api/AGENTS.md). Rules distinguish present structure from target, ownership/dependency direction, DTO/error/state conventions and applicable checks. Originally supplied by PR #32; current guidance records delivered boundaries and pending final acceptance |
| T36.2 | Audit lint/test/build scope and measure frontend/backend unit-coverage baselines | Inventory existing suites, maintained source and unexecuted files, gaps/exclusions and CI. Select compatible runner/coverage providers without assuming a migration; measure separate app baselines and document numerical thresholds/nonregression policy with evidence before enforcement. Reuse ESLint and record exact tool/peer/runtime/license/advisory compatibility |
| T36.3 | Implement unit/coverage gates alongside compatible formatting and commit/staged enforcement | Establish deterministic frontend/backend unit suites, separate reports and numerical CI gates under the acceptance below. Pin selected test/coverage tools and Prettier/Husky/commitlint/staged tooling. Prove test/threshold failures block CI, publish bounded reports, preserve existing checks, and retain fast staged checks with immutable/generated exclusions. Keep formatting batches separate from structural changes |
| T36.4 | Extract frontend responsibilities in small behavior-preserving batches | SOL separates navigation/form/command/lifecycle concerns from presentation contracts, and separates cohesive CSS/components where justified. Preserve URLs, focus/draft return, pending/unknown outcomes, exact-key retries, sessions, SSE and authorization projections. Add/update meaningful logic/controller/hook and appropriate component-interaction unit tests; record comparable coverage, affected regression results and remaining debt |
| T36.5 | Extract backend responsibilities in small behavior-preserving batches | SOL separates validation/DTO mapping, application orchestration, policy and focused persistence boundaries where useful. Add/update domain/use-case unit tests with isolated boundary doubles and comparable coverage. Preserve transactions, locks, tenant filters, version/idempotency/current-authority replay, activity/outbox, SSE commit order and NodeAdapter closure; retain real PostgreSQL/security/race/recovery checks |
| T36.6 | Consolidate evidence and freeze the UI contract for T37 | Tooling, deterministic unit suites and separate frontend/backend numerical coverage gates are actually enforced locally/in CI; agreed extraction scope is implemented and reviewed. Publish reports, thresholds/exclusions/nonregression evidence, stable UI contracts, surface inventory and remaining owned debt. Coordinator accepts T36 before T37 begins |

### Delivered scope and proposed final closure

| Subdelivery | Current bounded state and evidence |
| --- | --- |
| T36.1 | Scoped standards are implemented; this closure updates factual guidance while preserving authority and ongoing rules |
| T36.2–T36.3 | Pinned behavior-unit providers, all-source/per-file/nonregression gates, bounded artifacts and formatting/commit enforcement are delivered; [unit guide](unit-coverage.md) and [242/242 inventory](formatting-inventory.json) preserve historical baselines/failure proofs |
| T36.4 | Delivered [PR42 project](project-interactions-extraction.md) and [PR43 workspace](workspace-interactions-extraction.md) owners retain behavior with finite covered/zero/maps and native/CSS evidence; CSS families and unexecuted variants remain owned debt |
| T36.5 | Delivered [values/policy/DTO](project-values-policy-extraction.md) and [reads/commands](project-flow-extraction.md) preserve facade, transaction and query/lock/await order; other coupling remains explicit |
| T36.6 | [Stable contract](t36-stable-ui-contract.md), evidence/advisory conditions and debt ownership accepted in merged [PR #44](https://github.com/Ljrr3045/rielia/pull/44); historical proposal snapshots are preserved |

T37.1 frontend-local skills/research started under separate scope after accepted
T36. SOL retains all logic/tests and verified Approve for me rules.
T11 still follows accepted T37.

### Architecture and standards to apply

Use the actual files `apps/web/AGENTS.md` and `apps/api/AGENTS.md`; do not create
an alternative `AGENT.md`, invent packages from the source proposal, or spread
conflicting architecture checklists across tools. The scoped files inherit root
rules and guide subsequent implementation.

Web composition consumes typed view data and emits user intent; React hooks bind
lifecycle to controllers/state and transports. API controllers remain thin
transport adapters; application operations coordinate policy and transactions;
domain policies express invariants; persistence/query boundaries own storage
details where suitable. Cohesive feature ownership matters more than uniform
directory trees. An explicit interface is useful at a real boundary, not as
dependency inversion ceremony for every function. Avoid arbitrary line limits,
class/layer quotas, catch-all helpers and extracting code solely to lower counts.

Preserve current contract names/error codes and explicit DTO validation; a naming
cleanup must not silently change wire behavior. Distinguish pending, confirmed,
failed, forbidden, stale and conflict states. Keep `/prototype` a separately
isolated fake domain. Nest's official NodeAdapter, exact approved pins/patches,
no Express anywhere in API/worker/migration closure, and the existing identity
security controls are mandatory. Transactions, tenant/project consistency,
version checks, request-hash idempotency, current-authority replay and atomic
activity/outbox remain invariant through extraction.

### Tooling rollout constraints

ESLint already exists in root flat config, package scripts and CI. Audit its
coverage and ignored paths before adjusting rules; do not report its installation
as new work. Prettier provides formatting, not policy validation. Review exact
versions against Node 24.22.1, pnpm 12.15.0, TypeScript 6.0.3, ESLint 10.13.0,
typescript-eslint 8.72.0, Next 16.4.3/React 19.3.1 and pinned Nest 12.3.2.
These are repository pins, not a claim of newest versions. Recheck compatibility,
advisories, release maturity and lifecycle-script policy at implementation time;
no unreviewed `latest`, peer auto-install or blanket exception.

Plan Husky `pre-commit` for fast staged formatting/linting and `commit-msg` for
Conventional Commits validation through commitlint. Use lint-staged if its actual
file/argument behavior suits this monorepo. Keep network, Docker, full builds and
long integration suites out of every local commit. Avoid staging unrelated files
or formatters writing unstaged work; start with read-only ESLint/Prettier checks
and prove partial-staging behavior in a disposable repository. Document explicit
formatting and safe recovery. Do not require hooks to exist in production images.
The current root install runs inside Docker while its context excludes root
scripts and `.husky`. Any future prepare installer must be present where invoked
and skip CI/container/production/no-Git cases before importing dev-only Husky;
verify frozen install and real Docker builds rather than assuming an environment
flag or missing hook directory is harmless.

CI must independently enforce formatting/lint and the chosen commit policy,
because hooks can be skipped. Decide and document the commit range, PR-title versus
commit semantics, squash/merge commits, existing history, bots and generated
messages before enabling commitlint; do not reject immutable legacy history or
invent an admission/reviewer bypass. Keep current CI/review/protection gates.
The first tooling slice changes CI checkout to full history for prospective
base/head ranges and merge handling. Preserve the main/dev merge
ancestry rather than rewriting history to satisfy a new message convention.

Ignore immutable `docs/handoff`, generated Prisma/Next files, build output,
dependencies and lockfiles where formatting is inappropriate. Preserve handoff
checksums and selected source notices. Make initial formatting narrowly scoped
and separately reviewable; no repository-wide mechanical churn mixed with
extraction or policy changes. Exact formatter/hook/commit/staged pins and
configurations are now delivered separately from application coverage tooling.
Roll out formatting through explicit adopted
scopes and changed/new maintained-file checks initially. T36's final inventory
must account for all targeted maintained web/API/shared source: record completed
coverage and deliberate generated/vendor/immutable or other justified exceptions,
with owners for remaining debt. Changed-file-only adoption cannot hide permanent
unreported formatting or responsibility gaps at acceptance.

Primary tool references reviewed for the plan: [ESLint prerequisites](https://eslint.org/docs/latest/use/getting-started),
[typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/),
[Next ESLint scope](https://nextjs.org/docs/app/api-reference/config/eslint),
[Prettier exact local installation](https://prettier.io/docs/install),
[Husky CI/container handling](https://typicode.github.io/husky/how-to.html),
[lint-staged](https://github.com/lint-staged/lint-staged),
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and
[commitlint CI ranges](https://commitlint.js.org/guides/ci-setup.html).
Their mutable examples are reference material; retain repository pins and
independently verify selected published artifacts during T36.3.

### Unit tests, coverage and CI enforcement

The user's explicit follow-up makes **frontend and backend unit tests, separate
coverage and CI enforcement mandatory T36 work**. The original documentation PR
implemented no infrastructure; the later [unit/coverage delivery](unit-coverage.md)
now supplies maintained commands/providers, all-source reports and numerical gates.
The requirements below continue to govern new behavior and provider migrations.
Reuse useful
existing `node:test` suites; select/pin any additional runner, DOM/hook test support
and coverage provider only after proving compatibility with current Node/pnpm,
TypeScript/ESM, React/Next and Nest pins. Do not mandate an unsupported runner
migration or treat all current integration suites as unit tests.

| Unit scope | Meaningful behavior to verify |
| --- | --- |
| Frontend | Pure state/validation/selection logic, controllers, hook lifecycle/state and component interactions where appropriate: user intent, pending/confirmed/error output, draft/retry/conflict, cancellation, stale responses and session cleanup. Use isolated transport/browser-boundary doubles; prefer observable outcomes over implementation mirrors or snapshots alone |
| Backend | Domain policies and application/use-case decisions with isolated repository/clock/external-service boundary doubles: valid/invalid transitions, authorization denials, version/idempotency/retry and error outcomes. Test public behavior and collaborator contracts without duplicating implementation |

Unit doubles cannot establish real SQL constraints, locking, atomic transactions,
tenant isolation or durable recovery. Keep real PostgreSQL/HTTP/library,
integration/security, backend closure, Docker runtime/restart and relevant browser
checks; coverage totals do not replace those checks or critical negative/error
paths. All unit/functional test source remains SOL xhigh-owned.
These are ongoing development requirements after T36: new/changed behavior needs
appropriate unit/regression tests, bug fixes reproduce the regression, and
extraction preserves meaningful tests. Explain when prose, pure styling or
generated-only changes make unit tests inapplicable; retain relevant other checks.

Produce **separate frontend and backend unit-coverage reports**, recording
lines, branches, functions and statements where the selected provider supports
them; document unsupported metrics and the evidence for provider selection.
Include all targeted maintained source, **including files no test imports or
executes**, in the denominator. Record source globs, shared-source attribution,
source-map handling and justified generated/vendor/immutable exclusions; do not
hide maintained untested code with broad exclusions, ignore pragmas or imported-
files-only collection. Label any supplemental integration coverage separately.

Measure reproducible baselines before extraction, then document numerical,
enforceable thresholds for each app and supported metric, their rationale and a
comparable-baseline nonregression policy. T36 acceptance requires those values
actually configured and tested; this plan invents no percentage or current result.
CI must fail test failures, unmet thresholds and coverage regressions under that
policy. Do not lower thresholds, remove meaningful tests/source from coverage,
add ignores or disable gates merely to make builds green. Any legitimate source/
provider/scope change needs reviewed evidence and comparable before/after reports;
it cannot silently reset the baseline. Prioritize important denied/error/conflict/
recovery paths even when aggregate coverage already passes.

T36 must update CI to run deterministic unit suites and coverage gates on pull
requests and pushes to `dev`/`main` consistently with the existing workflow.
Use fixed fixtures and controlled time/randomness, no live service credentials.
Publish bounded frontend/backend summaries and machine-readable coverage artifacts
with documented size/retention limits and safe relative paths; keep diagnostics
available on failures without turning a failed test/gate green. Prove passing and
failing test/threshold cases, including maintained unexecuted files and skipped
local hooks. Preserve existing `validate` checks, integration/runtime/audit stages,
pins, read-only permissions, protected content and review/security requirements.
The tooling and unit slices now enforce formatting/commit CI, deterministic
application-unit commands, bounded artifacts and numerical gates. Their delivered
failure proofs remain evidence; future changes preserve these requirements rather
than reselecting tools or representing inherited coverage gaps as complete.

### T36 completion, tests and exclusions

Completion requires actual standards/tool enforcement, meaningful unit suites and
separate frontend/backend coverage reports with numerical CI gates, reviewed
restructuring evidence for the agreed high-risk surfaces, plus a stable UI
contract baseline for T37. A document, green lint, coverage percentage or smaller
file count alone is insufficient. Record unresolved debt with owner and scope;
do not claim all code conforms.

Run affected focused logic/transport/controller tests and `pnpm check`; backend
or domain-boundary changes also require relevant `pnpm test:identity`,
`pnpm test:runtime`, backend deployed-closure and advisory checks. Verify unchanged
HTTP/contracts, positive/negative two-tenant/private-project access, principal/
author/assignee distinction, removal/revocation, conflict/race/rollback, exact-key
retry and unknown outcome, SSE ordering/cancellation, migration/restart behavior
as affected. Capture before/after UI behavior where extraction crosses rendering,
navigation, local state or focus. Tests should detect behavior regressions rather
than mirror private helpers or assert file organization. Preserve automatic full
CI and required Kilo/ownership review on each accepted current head.

Excludes UI redesign, new product/domain features, a full architecture rewrite,
new database/UI/tooling packages by default, business worker, MCP product catalog,
staging/provider provisioning, deployment and completion of T01–T35. Deferred
real-provider/staging/user checks remain open under the existing user sequencing.

## T37 — UI quality redesign

**Objective:** redesign the existing product interface into a coherent, accessible
and responsive work experience using its stabilized real contracts and brand/UX
direction, with persisted-flow and recovery parity.
**Size:** L; deliver ordered bounded surfaces rather than one giant visual PR.
**Dependency:** coordinator-accepted **T36**, including enforcement, actual
restructuring evidence and stable UI contract baseline. Research may inform the
plan now; implementation starts only after that acceptance.
**Ownership:** Codex `gpt-6-astra` effort `high` owns UI/UX research, composition
and presentation. SOL `gpt-6.1-sol` `xhigh` owns every logic/test/auth/proxy change
and independently validates functional behavior. Each worker uses its own
worktree and verified effective configuration; mixed files require explicit
coordination against contracts. Native Kilo remains the selected external reviewer.

| Order | Bounded subdelivery | Acceptance and evidence |
| --- | --- | --- |
| T37.1 | Inventory existing surfaces/states and prepare frontend-local skills/reference study | Record route, role, command/DTO/state source, ES/EN copy, responsive/nonideal states and baseline regressions. Review/pin/install the three requested skills locally to `apps/web` in an implementation PR; prove discovery from frontend workers and no scope spill into API/global configuration. Record actual Mobbin evidence and unavailable references honestly |
| T37.2 | Establish design-system foundations and base components | Apply approved/proposed token status explicitly; agree typography/density/spacing, semantic colors, light/dark, focus/error/loading states and common controls. Verify contrast in real states, keyboard/focus, touch, zoom/reflow/reduced motion, then reuse those components. No generic style override or mandatory new shared package |
| T37.3 | Redesign shell and existing identity/workspace entry flows | Coherent useful-work navigation, identity/session states, workspace selector, invitations/members/administration and project entry. Preserve role disclosures, navigation/draft protection, session expiry/replacement and accessible mobile menu/panels |
| T37.4 | Redesign project/task work and collaboration | Project list/forms/privacy, backlog/list/board, filters/move alternative, task capture/edit/detail, properties, hierarchy/checklist/comments/history and explicit creator/assignee/provenance. Preserve server capabilities, URL return/focus, exact-key retry/conflict/unknown outcomes and persisted updates |
| T37.5 | Redesign My tasks/search and complete cross-surface QA | Current-assignee My tasks, project-grouped authorized search, paging/counts and live/reconnecting/offline states use the same records/contracts. Verify complete daily-work journeys and consistency across shell, workspace, project and task surfaces; record remaining gaps |
| T37.6 | Accept the bounded redesign and hand T11 a coherent foundation | Coordinator reviews actual desktop/mobile behavior, visual/state consistency, a11y and persisted/recovery parity with SOL functional evidence and current-head CI/Kilo. Record any deferred real-device/AT/user evidence explicitly; T37 does not certify the entire future product |

### Requested frontend skills and authority

Current T37.1 technical installation, immutable pins, safety boundaries and verified
initial/corrected fresh-worker discovery are recorded in [frontend skills](frontend-skills.md).
The table below preserves the November 5/6 **research snapshot**: its "Not installed"
status applied to that documentation PR, before the separate T37.1 installation.

| Requested source | Intended use | Status |
| --- | --- | --- |
| [anthropics/skills — frontend-design](https://www.skills.sh/anthropics/skills/frontend-design) | Intentional composition and implementation craft within Rielia's system | Research revision `ca45fc496a3436251f191354091d557da31c15b5`; [source](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/frontend-design/SKILL.md), [Apache-2.0 notice](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/frontend-design/LICENSE.txt). Not installed |
| [pbakaus/impeccable — impeccable](https://www.skills.sh/pbakaus/impeccable/impeccable) | Interface critique/refinement and state consistency | Research revision `c3bb418ee38ee49a6b999b7752c1368f3123a2bd`, skill v4.8.0; [source](https://github.com/pbakaus/impeccable/blob/c3bb418ee38ee49a6b999b7752c1368f3123a2bd/.agents/skills/impeccable/SKILL.md), [Apache-2.0 notice](https://github.com/pbakaus/impeccable/blob/c3bb418ee38ee49a6b999b7752c1368f3123a2bd/LICENSE). Not installed |
| [nextlevelbuilder/ui-ux-pro-max-skill — ui-ux-pro-max](https://www.skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max) | UI/UX review and Next/React guidance; later Astro guidance | Research revision `b7d5353e0130feb8c5574ef1251f8a1db1873ccb`; [source](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/.claude/skills/ui-ux-pro-max/SKILL.md), [Codex layout](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/src/ui-ux-pro-max/templates/platforms/codex.json), [MIT notice](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/LICENSE). Not installed |

At T37.1, record repository URL, immutable commit, skill path, reviewed instructions,
license/provenance, dependencies/commands, local destination and discovery proof.
Inspect conflicts and security before executing installation. An already available
global skill is not evidence of the requested frontend-local installation.
The research found that the existing global `ui-ux-pro-max` body is customized for
React Native only; do not reuse or overwrite it for this Next app. Proposed local
target is `apps/web/.agents/skills`, with complete resources/notices and a pinned
installation manifest. Launch frontend workers from `apps/web` and verify the
actual loaded local paths in a fresh session, including duplicate-name resolution;
do not assume a worker launched at repository root discovers descendant skills.
Reviewed upstream revisions above are research snapshots, not tested installations
or approved runtime/binary pins. Third-party licenses do not select Rielia's license.

The [pinned Impeccable README](https://github.com/pbakaus/impeccable/blob/c3bb418ee38ee49a6b999b7752c1368f3123a2bd/README.md)
documents optional engine/hooks and a live-copy Apply fallback that can spawn an
agent with approvals/sandbox disabled. Exclude that fallback: leave live-copy Apply
off and use ordinary controlled skill-guided edits. No implicit agent launch,
binary download, hook approval or global configuration change is authorized by
installing/using the design guidance; review permitted tooling separately.

Suggestions stay subordinate to product/UX/brand/architecture and cannot change
business policy, invent screens/features or approve publishing. Keep only useful
instructions, avoid copied competitor expression, and do not let several skill
style systems override one another. Model verification is documented separately in
[frontend-agent.md](frontend-agent.md).

### Image-inspected Mobbin research

The November 5/6 research used the functioning Mobbin MCP and inspected returned
images; no new screen design or competitor asset is delivered here. These are
captured versions and visual pattern observations, not measured usability,
performance, accessibility or persistence results.

| Actual inspected reference | Bounded lesson for later work |
| --- | --- |
| [Linear issue-creation flow](https://mobbin.com/flows/b49200b2-cfac-4c16-aae9-55aecdb91d09?tab=screens), preview screens 1, 3 and 5 | Stable list/sidebar context, title/description-first capture with secondary properties, then new item in list. Supports UXR01 capture-in-context; unshown steps and keyboard/persistence behavior were not verified |
| [Trello board](https://mobbin.com/screens/ff8199fb-ba6c-4460-989c-2a0ba4126ed2) | Named columns and local creation support UXR04. Omit photographic background and unrelated premium views |
| [Todoist iOS task list](https://mobbin.com/screens/ff08723d-19d9-49dd-b38b-4e6a0a1749fe) | Dominant title, date metadata, visible add and short navigation support UXR03; responsive web still requires its own touch/keyboard verification |
| [Plane task detail](https://mobbin.com/screens/e4e28e54-94c1-432b-946b-430997323dd8) | Title/description, child rows and separate properties illustrate grouping. Supplemental comparison only; no expanded UXR05 authority, dependency/milestone feature or archive policy adoption |
| [ClickUp product section](https://mobbin.com/sites/sections/2e29fbe7-7bdd-4574-8b48-138f7770994f) | Freshly inspected LPR02 pairs benefit copy with a recognizable product view; relevant to later T30–T34, without competitor replacement claims or colors |

Asana search results showed setup/templates rather than the requested board; no
new Asana-board observation is claimed. Other historical UXR/LPR links retain
their earlier evidence status; do not claim they were all freshly inspected.

### Surface and state coverage

The inventory covers existing productive `/identity`, `/workspaces` and `/projects`
(including project list/detail, list/board, task detail/collaboration and My tasks/
search), plus their reachable menus/dialogs/forms, themes/language, global layout
and relevant permission/session/error/not-found states. `/` stays a technical
fixture, not a new marketing/product home; any routing change is separately
SOL-owned. `/prototype` stays a separately labeled demo; both are inventoried for
shared-style/accessibility regression and isolation, not promoted into the product.
Sprint planning, credentials/MCP,
calendar/reports/roadmap, export/import and marketing are later tickets, not
redesign placeholders presented as working features.

| Existing surface | Inventory and parity to preserve |
| --- | --- |
| `/identity` | Configured providers, signed-in/out/loading/disabled/unavailable/cancel/retry/sign-out states; separate-tab return/refresh guidance and memory-only draft/invitation-token preservation |
| `/workspaces` | Workspace create/select/list/paging, owner/roles, human/Agent members, invitations/create/copy/revoke/accept, Agent registration/state/custodian administration; transient token handling and capability/owner restrictions |
| `/projects` shell and project administration | Workspace/project navigation and mobile drawer, create/settings/archive/restore, visibility/access and automatic-human-admin disclosure, explicit/effective access, paginated eligible human/Agent assignees |
| `/projects` task list/board/detail | Existing statuses, server counts/filter/paging, quick/column capture and move alternatives; safe Markdown/properties, creator versus assignee/provenance, parent/child relations and close warning, checklist, own-author comments and typed history |
| My tasks and Search in `/projects` | Current-assignee scope, literal ID/title query, project-grouped authorized results, existing filters/canonical totals/context limit, detail/Back return, draft guard, live/deferred/offline feedback and account-change clearing |
| Shared and diagnostic surfaces | ES/EN/themes, menus/dialogs/feedback/conflict/retry/independent pager failures, global layout/error/not-found; regression checks for `/` fixture and isolated `/prototype`. Auth/API proxy routes remain SOL protocol boundaries, not visual redesign targets |

Use UXR01 for stable work hierarchy, UXR02 for collaboration/card clarity, UXR03
for personal/mobile work, UXR04 for board simplicity and UXR06 only for current
list comparisons. UXR05 and advanced views remain later scope. Skills and Mobbin
screens justify a pattern choice; neither supplies Rielia rules or empirical
usability/accessibility evidence.

For each delivered surface record populated/long/missing data, loading/empty/
no-results, error/forbidden, stale/disconnected/reconnecting, pending/save failure,
version conflict, unknown outcome, archived/read-only and revoked-session/access
states as applicable. Verify 320/375/390/768/1024/1440 px, landscape, 200% zoom,
reflow, safe areas and virtual keyboard; touch targets, keyboard/drag alternatives,
focus order/return/traps, semantic labels/status announcements, contrast in both
themes and reduced motion. Record automation and manual screen-reader/device
coverage separately; WCAG 2.2 AA is a target, not a certification claim. Retain
the product's 44×44 CSS px touch guideline and normal-text contrast ≥4.5:1;
generic skill suggestions cannot weaken them.

Use real disposable local PostgreSQL/Nest/Next evidence for create/edit/comment/
checklist/move/privacy/search journeys, two-session invalidation, drafts, retry,
conflict and return navigation. SOL verifies logic/persistence/security parity;
screenshots support the visual review but cannot prove authorization or saving.
Run affected checks, full CI and current-head required Kilo/ownership gates.
Real-user/provider/staging acceptance remains explicitly deferred until the user
schedules it; do not silently mark it passed or request credentials now.

T37 excludes backend policy invention, logic ownership transfer to Astra,
prototype promotion, future views/features, final brand/license ratification,
landing implementation and deployment. Accepted T37 then unblocks T11 under its
original sprint/UTC/DST/history/permission requirements.

## Later landing work and delivery status

The [landing direction](landing-direction.md) updates existing T30–T34 with the
Astro app proposal, broader free-software narrative and real GitHub star-link
behavior. It adds no third prerequisite ticket and does not displace T36/T37/T11.

For the historical documentation preparation, checks covered immutable handoff/links
and proposed-diff whitespace. Implementation slices also run applicable suites
from CONTRIBUTING and retain exact evidence; inspect all changes and update
[progress](progress.md) and [changelog](../../CHANGELOG.md), and open one Draft PR
to `dev`. Full remote CI remains obligatory. Only the coordinator transitions Ready,
requests paid review, accepts the batch and merges; current-head Kilo remains a
closed merge gate while Draft. Agreed tooling/units/formatting, scoped
frontend/backend implementation and bounded T36.6 consolidation are accepted in
PR #44 with owned debt. T37.1 technical preparation is in progress; its current-head
CI/native review and coordinator decision remain
required. T11 follows accepted T37.
