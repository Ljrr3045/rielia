# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

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
- User decisions on license, final brand/name/logo, private-project admin visibility
  and installation OAuth configuration remain open; real-provider configuration
  is deferred. Final identity and landing design remain proposals. Stack approval
  is recorded above with the Express exclusion. T02.1's simulated OAuth/database
  evidence does not claim real provider consent, worker, MCP, product workflow,
  or deployment acceptance; UI capture/keyboard limits remain documented.
