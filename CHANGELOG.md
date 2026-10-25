# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

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

- T01 prototype presentation exact-head CI/Kody review for the UI PR; fictional
  demo journeys and targeted responsive/failure checks do not complete T01 or B0
  or establish real-person usability. Real-provider consent, private-email, HTTPS,
  and staging evidence for T02 remain open. No full T01–T35 ticket is complete.
  Real provider/staging T02 acceptance, T03 and full T04 remain unverified.
- User decisions on license, stack, and installation OAuth configuration; final
  identity and landing design remain proposals. T02.1's simulated OAuth/database
  evidence does not claim real provider consent, worker, MCP, product workflow,
  or deployment acceptance; UI capture/keyboard limits remain documented.
