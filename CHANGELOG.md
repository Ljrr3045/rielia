# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

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

### Removed

- Retired OpenCode review workflow, including the original inherited from `dev`,
  at the user's direction. This also removes the executable action/token exposure
  flagged by Kody on the previous PR head; the imported handoff remains unchanged.

### Pending

- T02.0 coordinator acceptance/merge in [PR #2](https://github.com/Ljrr3045/rielia/pull/2),
  with latest-head checks/Kody evidence tracked there; no full T01–T35 ticket is
  complete. T02/T03 spikes and full T04 acceptance remain unverified.
- User decisions on license, stack, and installation OAuth configuration; final
  identity and landing design remain proposals. No OAuth, DB, worker, MCP, product
  workflow, or deployment is claimed; UI capture/keyboard limits are documented.
