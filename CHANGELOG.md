# Changelog

This records repository changes. No application version has been released.

## Unreleased

### Added

- T00: complete bilingual planning handoff and candidate assets imported unchanged
  into `docs/handoff/`, with SHA-256 inventory and a portable integrity/link check.
- Repository agent instructions, English onboarding/contribution documents,
  PR template, and [delivery progress/decision record](docs/development/progress.md).

### Fixed

- OpenCode model resolution moved to job environment scope so step configuration
  receives its selected model instead of a null whitelist entry. Coordinator
  authorized this narrow T00 exception; triggers, permissions, provider restriction,
  credential handling, and review-only behavior are retained.

### Pending

- T00 coordinator review/merge; T01–T35 implementation has not started.
- User decisions on license, stack, and installation OAuth configuration; final
  identity and landing design remain proposals. No scaffold or deployment added.
