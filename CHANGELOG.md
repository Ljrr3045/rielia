# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

- T00: complete bilingual planning handoff and candidate assets imported unchanged
  into `docs/handoff/`, with SHA-256 inventory and a portable integrity/link check.
- Repository agent instructions, English onboarding/contribution documents,
  PR template, and [delivery progress/decision record](docs/development/progress.md).

### Changed

- Adopt Kody AI review: the coordinator posts the exact root `@kody start-review`
  request for every ready PR/head; all three review surfaces and valid findings
  must be handled before coordinator merge to `dev`.

### Removed

- Retired OpenCode review workflow, including the original inherited from `dev`,
  at the user's direction. This also removes the executable action/token exposure
  flagged by Kody on the previous PR head; the imported handoff remains unchanged.

### Pending

- T00 final-head Kody review and coordinator merge; no full T01–T35 ticket is
  complete, with a separate T02.0 supporting fixture reported in progress.
- User decisions on license, stack, and installation OAuth configuration; final
  identity and landing design remain proposals. No scaffold or deployment added.
