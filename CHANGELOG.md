# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

- T02.1: opt-in experimental Better Auth/Nest integration, minimal identity-only
  Prisma/PostgreSQL migration, configurable Google/GitHub providers, supported
  revocable sessions, strict origin/cookie/proxy handling, and an exported Google
  ID-token verification hook. [Operator guide/evidence](docs/development/identity-spike.md).
- Same-origin Next protocol routes and typed identity state/hook logic for a
  separately owned presentation change; no new identity page/CSS in T02.1.
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
- Supervised development: UI/UX presentation uses OpenCode Claude Haiku 5.5
  `high`; all logic uses Codex `gpt-6.1-sol` `xhigh`. Kody remains PR reviewer.
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

- T02.1 checks/exact-head Kody delivery in [PR #3](https://github.com/Ljrr3045/rielia/pull/3);
  T02.2 presentation and accessibility.
  No full T01–T35 ticket is complete. Real provider/staging T02 acceptance,
  T03 and full T04 remain unverified.
- User decisions on license, stack, and installation OAuth configuration; final
  identity and landing design remain proposals. T02.1's simulated OAuth/database
  evidence does not claim real provider consent, worker, MCP, product workflow,
  or deployment acceptance; UI capture/keyboard limits remain documented.
