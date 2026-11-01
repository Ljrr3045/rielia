# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

- T10.1/B1b search and My tasks presentation on merged T10.0 logic
  [PR #23](https://github.com/Ljrr3045/rielia/pull/23) (`6bde444c`). `/projects`
  gains explicit workspace My tasks (`taskScope=mine`, current assignee) and
  literal ID/key-number/title Search entries without changing the bare
  project-route default. Discovery results group readable tasks by project with
  project name/key, task key/title/type/status/priority/due/assignee, canonical
  totals and next cursors, bounded paging with a 1,000-row context limit, and
  loading/empty/error/changed states. Rows preserve scope/query/filter context
  through the existing URL-addressable detail and Back, restoring focus only
  after a real detail return. Discovery and legacy project/detail rendering are
  mutually exclusive. Existing draft/retry/conflict recovery remains, a
  workspace-navigation Stay/Discard guard protects local work in place of an open
  form, and live status distinguishes connected, pending/deferred refresh,
  reconnecting and offline. Discovery exposes status/priority/project/archive
  filters with combined count/clear; the full authorized assignee selector stays
  in project view and an inherited assignee is shown only as a clearable value.
  The primary home/sidebar My tasks entry uses the explicit scope URL, and a
  visible choose-project disclosure routes to editable projects' existing quick
  capture without cross-project creation or auto-assignment. The discovery result
  title is a full-width 44 px native link. Corrected checkpoint `c1a2a1d` passes
  web typecheck, targeted ESLint, production web build and 61 focused project/
  client/proxy/controller checks including T10; independent SOL validation, full
  checks and PR/review evidence are pending.
  [UI guide](docs/development/task-discovery-ui.md). No full T10/P11/US05,
  labels/sprints, exports, coediting, real OAuth/staging/users,
  physical-device/AT/WCAG or deployment acceptance is claimed.

- T10.0/B1b workspace-authorized ID/title search and current-principal-assignee
  My tasks across readable projects, with existing filters, bounded revision
  pages/counts and context-preserving detail navigation. Session-authenticated
  SSE reads only committed authorized outbox hints, with a fenced commit-order
  sequence, bounded opaque resume/reset, heartbeat, revocation, cancellation and
  single-replica limits. Page-scoped batched people/eligibility hydration and
  id/version-only event projection preserve current authorization. Shared
  frontend logic preserves draft/conflict/exact-key
  recovery during background updates, guards workspace navigation with explicit
  Stay/Discard and clears identity state on session replacement. No presentation
  files or dependencies changed. Focused client/proxy/state, real PostgreSQL/
  migration/race/security, real Nest→Next streaming, standard checks and Docker
  runtime evidence are in the [T10 guide](docs/development/task-discovery.md) and
  [PR #23](https://github.com/Ljrr3045/rielia/pull/23).
  Presentation, labels/sprints, exports, coediting, business workers, credentials,
  real OAuth/staging/users, deployment and full T10/public-launch acceptance remain
  separate. The inherited moderate development-only audit advisory is unchanged.

- T09.1/B1b task collaboration presentation on merged T09.0 logic
  [PR #21](https://github.com/Ljrr3045/rielia/pull/21) (`76d7d31b`). The existing
  task detail now presents one-level parent/child relations with child quick-add
  and child-centric link/reparent/unlink, open-child close warnings with explicit
  acknowledgment, complete checklist progress/add/edit/toggle/reorder/remove,
  attributed Markdown comments with own-author versioned editing and edited
  marker, and separate typed history. Shared staged collaboration drafts survive
  navigation with Return/Discard, unknown-key retry and exact conflict review;
  archived/viewer surfaces stay read-only. ES/EN, light/dark, 44 px targets,
  focus restoration, safe Markdown React rendering and full-screen detail from
  320 px are included. The separate real PG/Nest/Next functional validator passed
  hierarchy, checklist, warnings, attribution, paging, recovery, auth and XSS
  cases; the independent responsive/keyboard validator passed the reviewed
  viewport and affected focus regressions. Final full `pnpm check`, audit
  high/critical gate, handoff and whitespace pass; PR URL, CI/Kody state and
  exact final head remain in the UI guide/external report.
  [UI guide, evidence and limits](docs/development/task-collaboration-ui.md),
  [PR #22](https://github.com/Ljrr3045/rielia/pull/22).
  Presentation adds no hook/controller/contract or backend change; full
  T09/P05/P14/P38, T10/T11/T12/B2, real OAuth/staging/users, physical-device/AT/
  WCAG and deployment remain open. The inherited moderate dev-tooling minimatch
  advisory is unchanged.

- T09.0/B1b task collaboration logic on merged [PR #20](https://github.com/Ljrr3045/rielia/pull/20)
  (`a93cb85e`): same-project one-level parent links, child creation/link/reparent/
  unlink, explicit revision-bound parent-close warnings, bounded ordered
  checklists with retained removal, Markdown comments with immutable authors and
  own-author versioned editing, and safe typed paged task history. Atomic
  current-authority receipts/outbox, private-project policy, archive boundaries,
  flat list/board ordering and same-key unknown recovery are preserved. Shared
  frontend section/draft/conflict/paging contracts include authorized parent
  candidates loaded on demand, canonical checklist movement and recent comment/edit
  visibility. Hierarchy validation uses indexed final relationships and skips
  rank/content-only updates.
  [Contract, evidence and limits](docs/development/task-collaboration.md),
  [PR #21](https://github.com/Ljrr3045/rielia/pull/21).
  Presentation, full T09/P05/P14/P38, T10/T11/T12/B2, real OAuth/staging/users
  and deployment remain separate; the inherited moderate dev-tooling minimatch
  advisory remains documented, with no dependency change.

- T08.1/B1b task views presentation on merged T08.0 logic
  [PR #19](https://github.com/Ljrr3045/rielia/pull/19) (`f8895709`). `/projects`
  adds a compact list/board switch and status/assignee (including unassigned)/
  priority filters, status-grouped rows, five 272 px board columns with
  authoritative counts and bounded vertical scrolling, column quick capture,
  native status movement and precise before-task/end-of-column menus, outer
  keyboard board navigation, persisted order, URL/detail context, move-conflict
  fresh-destination recovery, mobile default list and selected-column board at
  320 px, compact project Options administration, and read-only archived/viewer
  surfaces. ES/EN, light/dark, 44 px targets, focus/menu keyboard behavior and
  no inner horizontal overflow are included. Independent real PG/Nest/Next
  validation recorded 19 passing cases and fixed the reproduced pre-canonical
  focus, delayed different-row focus-intent and mobile list-menu overflow
  defects; full `pnpm check`, audit high/critical gate, handoff and whitespace
  checks pass. One moderate dev-tooling `minimatch` advisory remains documented
  in the UI guide; no production runtime path.
  [UI guide, evidence and limits](docs/development/task-views-ui.md),
  [PR #20](https://github.com/Ljrr3045/rielia/pull/20). Exact final
  head/CI/Kody state remains on the PR. No full T08/US05/P07, labels/sprints,
  T09/T10/B2, credentials, real OAuth/staging, deployment or real-user
  acceptance is claimed.

- T08.0/B1b persistent list/Kanban logic on merged T07.1 [PR #18](https://github.com/Ljrr3045/rielia/pull/18)
  (`ac3de535`), with both completed T07 worktrees removed. One PostgreSQL task
  source supplies status-grouped list and five semantic status partitions,
  status/assignee/unassigned/priority filters, bounded revision-bound pages/counts,
  historical selected-filter names and atomic expected-version/order moves.
  An additive migration preserves every earlier migration and adds gapped bigint
  ranks with transactional compaction and a task revision separate from project
  edit/access versions. Current T07 authorization, archives, immutable authorship,
  activity/outbox/idempotency and original-key recovery remain enforced.
  Hook-owned URLs, independent column errors, coherent totals, explicit move
  eligibility and fresh-destination conflict recovery extend the existing shared
  draft lifecycle. Real PG races/rollback/aborted HTTP/restart, focused tests and
  populated real Next-proxy QA are included. [Contract, evidence and limits](docs/development/task-views.md),
  [PR #19](https://github.com/Ljrr3045/rielia/pull/19).
  No JSX/CSS, configurable workflows/labels/sprints/full US05, T09/T10/B2,
  new credentials, real OAuth/staging/users or deployment is included.

- T07.1/B1b private-project access presentation on merged T07.0 logic, under the
  2026-10-29 administrative-visibility policy. `/projects` now exposes create-time
  visibility when the server permits it, textual private/workspace disclosure, a
  human-admin access panel with automatic owner/admin disclosure, paginated
  people/Agents, explicit grant/re-grant/revoke with exact-target confirmation,
  retained explicit rows and consequence-specific admin/workspace copy, archived
  revoke-only behavior, and server-eligible paginated assignees with historical
  unavailable labels. Policy and content drafts share the canonical lifecycle:
  review captures target/version, pending is distinct from unknown outcome,
  exact-target conflict review/rebase and changed-page refresh are explicit,
  including archived-revoke recovery and missing-current exact-target review;
  access/assignee first-page failures retry independently without clearing content,
  cross-context unknown outcomes require Return before Retry, and shared guards
  prevent replacing an unresolved policy draft. ES/EN, light/dark, 44 px targets,
  focus trap/restoration and 320–1440 layouts are covered by actual PG/Nest/Next
  browser QA. [UI guide, evidence and limits](docs/development/project-access-ui.md).
  [PR #18](https://github.com/Ljrr3045/rielia/pull/18). The T07.0
  [PR #17](https://github.com/Ljrr3045/rielia/pull/17) is merged as `c72831c` and
  its worktree was removed. Full T07/T35, invitations/
  guests, collaboration and real-user acceptance remain open.

- T07.0/B1b private-project and explicit human/Agent access logic, under the
  2026-10-29 ratification of automatic private content access for active human
  workspace owners/admins. Current policy filters project/task reads, counts,
  cursors, writes, conflicts, assignments and receipt replay. Human-web-only
  privacy administration uses project versions and atomic activity/outbox/receipts;
  archived revocation is allowed while grants/visibility remain frozen.
  Backend-authorized eligible-assignee/access pages and exact-target access
  conflict review extend the production hook/client/proxy without JSX/CSS.
  The read-side 403 path clears prior full mutation results; mixed-version access
  pages cannot promote stale entries. Additive migration, real PG isolation/race/
  rollback/restart and client recovery regressions preserve prior migrations.
  Transient access/assignee-page failures retain confirmed content with independent
  first-page errors/retry, while 401/403 clears immediately and rejects late responses.
  Content pager errors coexist with policy failures and remain retryable independently.
  [Decision, frontend contract, QA and limits](docs/development/project-access.md).
  [PR #17](https://github.com/Ljrr3045/rielia/pull/17).
  T06 [PR #16](https://github.com/Ljrr3045/rielia/pull/16) is merged as `545473c`;
  both T06 worktrees were removed. Presentation, full T07/T35, new credentials,
  real OAuth/staging/users, RLS and deployment remain separate.

- T06.0/B1a real workspace-visible project/task backend and frontend logic:
  create/read/edit/archive/restore, immutable project keys, transactional increasing
  task numbers, expected-version conflicts, current scoped human/Agent assignment,
  independent immutable creator/provenance and atomic activity/outbox/receipts.
  Production hook/controller/proxy provides paging, stable scoped URLs and archive
  context, captured-draft/key recovery, explicit target return and conflict
  compare/reload/rebase. Safe Markdown AST and disposable real PG/Nest/Next QA
  harness support separately owned presentation. Real PG/HTTP, concurrent writes,
  100-record paging and container-restart persistence regressions are included.
  [Scope, integration contract, evidence and limits](docs/development/project-task-flows.md).
  [PR #15](https://github.com/Ljrr3045/rielia/pull/15).
  No JSX/CSS, private policy, full P05/P14/T06, MCP credentials/transport,
  dispatcher/business worker, real provider/staging or deployment is included.

- T06.1/B1a project and task presentation: `/projects` workspace-visible project
  rail/create/settings/archive/restore, compact task list with title-only
  project-scoped capture, URL-addressable task detail (desktop panel, tablet
  overlay, full mobile), task edit/status/type/priority/date/assignee, immutable
  creator/provenance with textual Agent labeling, archived views and active/
  archived task behavior. Presentation uses only the T06 production client/hook
  and safe Markdown AST, with staged drafts, same-tab session/context recovery,
  pending/success/conflict/unknown-outcome retry, transient pager recovery,
  ES-default/EN, light/dark, focus management and responsive 320–1920 layouts.
  [Scope, evidence and limits](docs/development/project-task-ui.md). No private
  projects, sprints/board, comments/checklist/history, credentials/MCP,
  deployment, real-user/provider acceptance or full T06/P05 is claimed.

- T05.1/B1 workspace and membership presentation: `/workspaces` flow for
  authorized selection/creation, compact human/Agent member rows with owner
  protection, admin invitations/revocation, explicit fragment acceptance, versioned
  role/suspend/restore/remove, and agent registration/state/custodian controls.
  Production data comes only from `useWorkspaces`; no fake adapter, SMTP,
  credentials or ownership transfer is implied. Adds draft hydration/staging on
  edits, scoped retry/recovery feedback, transient created-link clearing without
  discarding received tokens, forbidden/error workspace escape, ES-default/EN
  selector, light/dark tokens, visible focus and responsive 320–1440 presentation.
  [Presentation scope, evidence and limits](docs/development/workspace-ui.md);
  [PR #14](https://github.com/Ljrr3045/rielia/pull/14). Rebased onto T05.0 logic
  merge `01c9cc168bb9dde62b4290c049b982d62952c9a5` (PR #13); no full T05/T07/T35,
  real OAuth/staging or real-user acceptance is claimed.

- T05.0/B1 backend/frontend logic: persisted workspace creation/selection, scoped
  human/Agent memberships, versioned human administration, bounded agent state/
  custodian operations and expiring verified-recipient single-use invitations
  with explicit copyable links. Adds hash-only storage, current issuer checks,
  terminal no-rejoin policy, atomic receipts, grant/authority invalidation and
  real PostgreSQL/HTTP regressions. Production-data hook/proxy preserves same-user
  drafts, original-scope retries, independent received/generated link clearing,
  and session/stale-response recovery without
  presentation or fake data. [Contract and limits](docs/development/workspace-flows.md);
  [PR #13](https://github.com/Ljrr3045/rielia/pull/13).
  Full T05/T07/T35, projects/tasks, email, credentials and staging remain open.

- T35.0/B1: PostgreSQL principal foundations with atomic unique human User mapping,
  workspace-bound autonomous agents, reserved System identity, minimal workspace/
  membership policy, retained historical identity, active owner/custodian guards,
  internal immutable grant policy records and verified web execution context.
  Add direct SQL, existing-user migration, two-workspace, impersonation, revocation
  and observed concurrent-transaction regressions. Creator/author/independent
  assignment types/helpers prepare future domain work; actual task/comment/
  history/export integration and credentials remain incomplete.
  [Scope, services, migration and limits](docs/development/principal-foundations.md);
  [PR #12](https://github.com/Ljrr3045/rielia/pull/12).

- T04.0/B0: provisional local Docker Compose runtime with Next standalone,
  a shared nonroot API/worker backend image, private PostgreSQL/named volume,
  migration one-shot gate and separate database/schema readiness. A single fixed
  pg-boss diagnostic job has operator-only enqueue/status/wait commands and no
  business effects or public enqueue route. Isolated Docker smoke/CI covers
  failures, restart/persistence, bounded lock/signal cleanup and image exclusions.
  [Local operator guide, pins and limits](docs/development/local-runtime.md);
  [PR #9](https://github.com/Ljrr3045/rielia/pull/9) merged after final-head CI/Kody.
  Default production-mode local HTTP identity remains disabled; no full T04,
  production deployment or domain workflow is claimed by that delivery.
- Exact pg-boss 12.38.0/OpenTelemetry API 1.10.0 peer pins and declaration-only
  patch for upstream's stripped internal type; strict dependency checks remain.
- Separate bounded migration DDL budget from short readiness/diagnostic queries,
  with a real slow-DDL regression and retained heartbeat tracking during shutdown.
- T03.0/B0: private experimental `packages/mcp-local` stdio wrapper with one
  argument-free public REST process-liveness tool, bounded validated output,
  constrained loopback HTTP opt-in, normal HTTPS validation, sanitized failures,
  no redirects and clean request/process shutdown. SDK 2.4.0 and independent
  official Inspector 2.12.0 CLI integration runs in `pnpm check`; actual protocols
  `2025-11-25` and `2026-07-28` are recorded in the [operator/evidence guide](docs/development/local-mcp.md).
  No task data, credentials, remote transport or full T03 acceptance.
- Guard truncated HTTP versus open-stalled-body behavior with actual stdio
  subprocess regressions: FIN/reset returns unavailable promptly, while an open
  stream reaches the deadline. Existing runtime error handling is retained.
- T01/B0 prototype presentation: responsive fictional `/prototype` with default
  My tasks, project List/Board/Sprints, full task detail, minimal capture/edit,
  sprint planning/start/close, visible simulated failure with draft-preserving
  retry, typed current/captured-retry targets, labelled unmatched global recovery,
  optional inert-workspace mount suppression, and seeded/empty reset. Includes
  light/dark tokens, mobile drawer/bottom navigation, focus recovery, and ES/EN
  chrome. No backend, identity, durable data, or production workflow.
  [Presentation evidence](docs/development/task-prototype-ui.md).
- T01/B0 prototype logic: fictional memory-only task adapter/hook with 18 samples,
  assignee-based My tasks, shared list/board/detail selectors, controlled create/
  edit/status/filter actions, sprint goal/date/scope/start/closure, and deterministic
  save failure/retry/reset. Meaningful invariant tests run in `pnpm check`.
  [Typed integration contract and limits](docs/development/task-prototype.md).
  No prototype route/presentation, backend, identity integration or durable data.
- T02.1: opt-in experimental Better Auth/Nest integration, minimal identity-only
  Prisma/PostgreSQL migration, configurable Google/GitHub providers, supported
  revocable sessions, strict origin/cookie/proxy handling, and an exported Google
  ID-token verification hook. [Operator guide/evidence](docs/development/identity-spike.md).
- Same-origin Next protocol routes and typed identity state/hook logic for a
  separately owned presentation change; no new identity page/CSS in T02.1.
- T02.2: experimental bilingual `/identity` presentation for the merged identity
  hook, with states for loading, unavailable API, disabled identity, unconfigured
  providers, signed-out/in, pending actions, and recoverable sign-in/sign-out
  messages. Keyboard focus recovery and an index link were added; no new dependency.
  [Presentation evidence](docs/development/identity-ui.md).
- Disposable pinned PostgreSQL integration tests with simulated provider HTTP,
  state/proxy/client timeout/recovery tests, and a declaration-only compatibility
  patch retaining strict TypeScript dependency checks.

- T00: complete bilingual planning handoff and candidate assets imported unchanged
  into `docs/handoff/`, with SHA-256 inventory and a portable integrity/link check.
- Repository agent instructions, English onboarding/contribution documents,
  PR template, and [delivery progress/decision record](docs/development/progress.md).
- T02.0: provisional strict-TypeScript pnpm workspace with Next.js/React web,
  NestJS/Express API liveness, a framework-independent health contract, and a
  bilingual development page with live/unavailable API status.
- Exact toolchain/dependency pins and lockfile, environment example, lint/build/
  typecheck/production HTTP smoke commands, handoff/code/advisory CI, and the
  [fixture guide](docs/development/technical-fixture.md). A scoped Multer 2.5.0
  override addresses GHSA-q7qp-rjg7-q26m in the Nest adapter dependency.

### Changed

- Fix T06 paging/recovery review findings with monotonic project-sequence/task-number
  cursors and an additive deterministic existing-project backfill, preserving all
  prior SQL checksums. Transient next-page failure now retains loaded lists/detail,
  cursor and mutation success with labelled `pageError` retry; auth denial still
  clears private data. Both defects have pre-fix failing regressions.
- Keep the global project allocation key private: expose a visible project ID as
  cursor and resolve it only within current workspace scope, retaining monotonic
  ordering, archived-anchor recovery and identical missing/foreign denial.
- Limit the API deployment package to compiled runtime, Prisma schema/migrations
  and Prisma config, excluding test-only signed-session QA fixtures and tests;
  verify the exclusion in actual deployed API/worker/migration images.

- Reconcile T05.1 [PR #14](https://github.com/Ljrr3045/rielia/pull/14) as merged
  2026-10-28T20:57:11Z at `d27e3302a059cda6ef570c75efed42deda188a39`, from
  reviewed source `6c0e64952129b10c25f195443f88ec7331ef1a02`, successful
  CI 40764734574 and [final Kody 6480178609](https://github.com/Ljrr3045/rielia/pull/14#issuecomment-6480178609).
  Both presentation findings are resolved; completed worktrees were removed.

- T35.0 review fixes: return sanitized 400/409 for permanent storage/state
  failures, retaining 503 for outages; use compatible shared context-read fences
  while policy/session mutations keep exclusive atomic authorization. Actual
  PostgreSQL regressions reproduce both prior defects and verify the fixes.

- Reconcile PR #11 as merged 2026-10-27T20:30:56Z at `70314c5`, following
  reviewed head `eb8b19c`, exact-head Kody approval and CI 40577221864; its
  completed worktree was removed. T35.0 follows it without completing full T35.
- Extend local migration packaging/checksum regression to each additive migration;
  preserve original identity SQL, disabled-identity default, official NodeAdapter,
  Express-free backend closure and diagnostic-only worker boundaries.

- Replace the Nest Express runtime with official NodeAdapter, using matching
  common/core/platform-node **12.3.2** and supported Nest APIs. Preserve raw
  Better Auth integration, nested parsers, callback/origin/proxy/session safeguards,
  disabled identity, liveness/readiness and shutdown. Add adapter/security
  regressions and actual installed/deployed API/worker/migration Express-absence
  guards. Remove obsolete Express dependencies/types/Multer override; retain
  patched Multer 2.5.0 and scope qs 6.16.1 for its introduced advisory.
  [Rationale, integrity, new-adapter maturity and exact age exceptions](docs/development/nest-http-adapter.md).
  No UI/domain/schema/workflow/deployment or full-ticket acceptance.
- Preserve the user's original [2026-10-27 stack and validation decision](docs/development/stack-validation-decisions.md)
  as dated history, with the completed migration recorded separately. T35 is the
  next dependency-based product foundation; it is not implemented here.
- Reconcile [PR #10](https://github.com/Ljrr3045/rielia/pull/10) as merged
  2026-10-27T19:58:09Z at `3efb49fde4f43d9d58964510c3ef61f744bea062`, after
  reviewed/approved head `81f884122dd0ab99e0a73c767b99d7aa7db6ba64` and
  [CI 40571647316](https://github.com/Ljrr3045/rielia/actions/runs/40571647316).
  The coordinator removed its completed worktree; real validation remains deferred.
- Defer real provider/HTTPS/staging, staging-dependent remote OAuth discovery and
  real-project/user acceptance until an advanced end-to-end product slice and user
  scheduling. Keep them OPEN/DEFERRED and retain source dependencies/history and
  public-launch gates; they are not immediate local implementation blockers.
  Applicable automated unit/integration/security/local Docker checks, CI and Kody
  remain required; no credential/staging request or test date is introduced.
- Reconcile T04.0 [PR #9](https://github.com/Ljrr3045/rielia/pull/9) as merged
  2026-10-27T19:25:58Z at `74779941905937ca7c05217169b0ef3028c10b9c`, after
  final reviewed head `0fcd6c4ea9b2aa05940b795c871d2d30ec3f4742`,
  [Kody approval 5672890614](https://github.com/Ljrr3045/rielia/pull/9#pullrequestreview-5672890614)
  and [CI 40565906228](https://github.com/Ljrr3045/rielia/actions/runs/40565906228).
  The coordinator removed its completed worktree; full T04 remains open.
- Reconcile T03.0 [PR #8](https://github.com/Ljrr3045/rielia/pull/8) as merged
  2026-10-26T19:31:05Z at `cb92d90`, after final reviewed head `7ead11b` and
  [Kody approval 5657821543](https://github.com/Ljrr3045/rielia/pull/8#pullrequestreview-5657821543).
  Its completed worktree was removed by the coordinator; full T03 stays open.
- Reconcile fictional prototype PRs #5/#7/#6 as merged. PR #6 merged on
  2026-10-25T08:13:36Z as `a869e317fd05e87d9afd62597842e5fc125e57ee`, after
  [CI 40175255312](https://github.com/Ljrr3045/rielia/actions/runs/40175255312)
  and [Kody approval 5642187480](https://github.com/Ljrr3045/rielia/pull/6#pullrequestreview-5642187480)
  on `043c4507`. Full T01/B0 real-user validation remains open; prior worktrees
  were removed and preview stopped by the coordinator.
- Record user branch convention: `feat/**`, `fix/**`, `refactor/**`, `docs/**`,
  `chore/**`, `test/**` by purpose, without username prefixes; corresponding
  worktree names. Coordinator corrected Orca's prefix on the empty T03.0 branch.
- Merge T01/B0 prototype logic [PR #5](https://github.com/Ljrr3045/rielia/pull/5)
  into `dev` as `5099b39aef53d5b7e2f0205f3168727cb1dc9471`, preserving reviewed
  head `55481ffb3613ccaadcb37f3e6dd3ad3118afb8c3`. Presentation is delivered
  separately on that merged base.
- Expose immutable task/sprint operation context for current prototype save
  feedback and its independently captured retry, including sprint-close destination.
  Navigation preserves recovery without retargeting it to another detail. Actual
  action regressions cover pending/saved/error, unrelated validation, malformed
  inputs and reset; presentation consumes the [typed contract](docs/development/task-prototype.md#feedback-and-retry-targets)
  separately. Merged in PR #7 as `bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f` from
  reviewed head `c90b437`. No production policy or full T01/B0 acceptance is added.
- Select OpenCode Go DeepSeek V4.1 Flash 1017 (`opencode-go/deepseek-v4.1-flash`,
  variant `max`) for future UI/UX presentation workers, replacing Haiku 5.5 `high`.
  All logic remains Codex `gpt-6.1-sol` `xhigh`. This coordination update does
  not itself resume development; the user subsequently resumed the bounded T01/B0
  prototype. [Verification evidence and limits](docs/development/frontend-agent.md).
- Adopt Kody AI review: the coordinator posts the exact root `@kody start-review`
  request for every ready PR/head; all three review surfaces and valid findings
  must be handled before coordinator merge to `dev`.
- T00 is complete and merged via [PR #1](https://github.com/Ljrr3045/rielia/pull/1),
  merge `8dd7c31f454c1989d017dbf7b40e6646112d2d2a`, after final-head Kody success/approval.
- T02.0 merged via [PR #2](https://github.com/Ljrr3045/rielia/pull/2) on
  2026-10-25T01:10:25Z as `629932ad282c27c0b71c6b8d5daf15e3cc199965`, with
  [Kody approval](https://github.com/Ljrr3045/rielia/pull/2#pullrequestreview-5640882613)
  and [passing CI](https://github.com/Ljrr3045/rielia/actions/runs/40148711191).
  Coordinator verified both prior completed worktrees removed.
- Historical T02.2 presentation was implemented with OpenCode Claude Haiku 5.5
  `high`; the current future-UI rule is the DeepSeek selection above. All logic
  uses Codex `gpt-6.1-sol` `xhigh`; Kody remains PR reviewer.
- Reconcile T02.2 as merged [PR #4](https://github.com/Ljrr3045/rielia/pull/4),
  `ae67fcc321a0cbb152a0137141d8d6a05abae631`, with exact-head
  [Kody approval 5641248403](https://github.com/Ljrr3045/rielia/pull/4#pullrequestreview-5641248403)
  and [CI 40156199016](https://github.com/Ljrr3045/rielia/actions/runs/40156199016)
  on `f9c4cc70e51cadf7722dcac775b402f926fbf9a8`. Prior worktrees were removed
  after preserved delivery evidence; real OAuth/HTTPS remains unverified.
- Reject malformed prototype draft collections with field feedback while retaining
  the usable draft, and guard sprint text validation. An actual-action regression
  reproduces the pre-fix throw and verifies correction/save after the fix.
- Preserve a prior captured demo save retry across rejected/no-op actions; field
  feedback no longer destroys recovery. A task/sprint regression reproduces the
  loss and verifies one successful creation/scope update after retry.
- Normalize identity paths before exact callback origin exemptions. Raw HTTP
  regressions reject disguised mutations/malformed paths and preserve valid
  callback/state behavior; nested form parsing verifies the existing Nest API call.
- Pin fixture CI actions to verified full upstream commit SHAs and defensively
  handle smoke child processes that never acquired a PID. A focused Node regression
  checks same-tick failed-spawn cleanup and termination of the live sibling.

### Removed

- Retired OpenCode review workflow, including the original inherited from `dev`,
  at the user's direction. This also removes the executable action/token exposure
  flagged by Kody on the previous PR head; the imported handoff remains unchanged.

### Pending

- Fictional demo journeys and targeted responsive/failure checks do not complete T01 or B0
  or establish real-person usability. Real-provider consent, private-email, HTTPS,
  and staging evidence for T02 remain OPEN/DEFERRED under the dated user decision.
  No full T01–T35 ticket is complete.
  Real provider/staging T02 acceptance, full T03 beyond the bounded local stdio
  evidence, and full T04 remain unverified.
- User decisions on license, final brand/name/logo
  and installation OAuth configuration remain open; real-provider configuration
  is deferred. Final identity and landing design remain proposals. Stack approval
  is recorded above with the Express exclusion. T02.1's simulated OAuth/database
  evidence does not claim real provider consent, worker, MCP, product workflow,
  or deployment acceptance; UI capture/keyboard limits remain documented.
