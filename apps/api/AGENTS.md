# API development rules

This file scopes `apps/api` and inherits the root [AGENTS.md](../../AGENTS.md).
Read [architecture](../../docs/handoff/02-architecture-technical-plan.en.md),
the [stack decision](../../docs/development/stack-validation-decisions.md),
the relevant domain delivery guide and the
[quality roadmap](../../docs/development/development-quality-roadmap.md).
All implementation and functional/security tests use Codex `gpt-6.1-sol`, effort
`xhigh`, with effective configuration verified in an isolated worktree.

## Current code and migration target

One `AppModule` currently wires the Nest backend's identity, principals, workspaces,
projects and runtime code in `src`, with Prisma schema/migrations inside this
app. Some services combine validation, policy, transaction orchestration,
queries and DTO mapping. T36 will extract responsibilities incrementally; no
shared database package, universal repository layer or completed migration is
implied by this document.

- Keep Nest modules/providers/guards and the official NodeAdapter. Preserve exact
  approved runtime pins, patches and API/worker/migration dependency-closure
  checks. Express, its adapter/types/optional peers, and a separate routing
  framework are prohibited.
- Controllers translate transport input/output and call application operations;
  they do not own domain policy or issue persistence queries. Application use
  cases coordinate verified context, policy and transaction boundaries. Domain
  policies express invariants without depending on HTTP responses or UI state.
- Keep cohesive feature ownership. A module owns its writes; cross-module
  consumers call explicit services/contracts instead of accessing its tables.
  Isolate persistence queries/mapping behind focused repository/query boundaries
  where this clarifies ownership or testing. Introduce an interface only for a
  concrete boundary; do not add dependency inversion, factories, CQRS or one
  package per entity merely to satisfy a pattern count.
- Dependency direction is transport → application → domain policy, with
  persistence/integration adapters supplying application needs through explicit
  boundaries. Migrate existing service coupling in bounded PRs rather than
  pretending that dependency direction already holds everywhere.
- Define explicit input/output DTOs and stable public errors in contracts;
  validate unknown input, allowlist fields and map persistence rows explicitly.
  `contracts` imports neither Nest nor Prisma. Keep ORM types and adapter-specific
  exceptions out of new pure policy boundaries. Preserve existing wire contracts
  until a separately reviewed change authorizes migration.
- Name modules/files by capability and responsibility using existing kebab-case
  conventions and Nest `.controller`/`.service` suffixes. Use descriptive operation
  names; avoid catch-all utilities and generic base services. Return actionable,
  stable errors without foreign-resource existence or secret disclosure.
- Resolve actor, mode, source and grant on the server. Recheck current
  membership/project/grant access for every operation/replay/job. Human-only
  administration remains unavailable to delegated/autonomous execution. Preserve
  immutable creator/comment author separately from assignee and authorizer.
- Keep `PrincipalService` as the owner of runtime-verified execution evidence;
  its WeakMap-backed trust is not preserved by serializing/copying a DTO. Identity
  owns authentication/session and the current Prisma runtime lifecycle. Preserve
  raw Better Auth handling before parsers and origin/callback/proxy/cookie parity.
- Preserve tenant/project constraints, atomic numbering/ranking, expected-version
  conflicts, request-hash idempotency and current-authority replay. Mutation,
  activity and outbox must commit atomically; extraction must keep the same
  transaction handle, lock order, rollback and commit-order event guarantees.
  Do not divide an atomic operation into independently committed repository
  transactions or dispatch external effects before commit. Focused repositories
  may share the same transaction handle.
- PostgreSQL remains canonical. SSE/cache projections reauthorize and invalidate;
  they do not store a parallel domain. Future REST/MCP adapters share use cases.
  The diagnostic worker opens no listener and cannot migrate; only the explicit
  migration one-shot does. No business worker is created by these rules.

## Verification

New or changed behavior must ship with appropriate unit/regression tests; bug
fixes reproduce the prevented regression. Preserve meaningful existing tests
during extraction. Prose or generated-only changes may explain why unit tests
add no value; applicable integration/security checks still apply.

T36 must establish deterministic backend domain-policy and application/use-case
unit suites. Use isolated repository, clock or external-service boundary doubles
where appropriate; assert observable decisions/outcomes, including denied access,
invalid transitions, conflicts, retries and failure handling. Keep current
real-library/PostgreSQL/HTTP/security/runtime tests: unit mocks cannot prove SQL
constraints, locking, atomicity, tenant isolation or restart recovery.

Require a separate backend unit-coverage report including maintained unexecuted
source, with lines/branches/functions/statements where supported and justified
generated/vendor/immutable exclusions. T36 measures the baseline, selects a
compatible runner/provider and documents numerical enforceable thresholds and
nonregression policy; disposable audit measurements are documented in the
[tooling guide](../../docs/development/quality-tooling.md). The subsequent first
[unit/coverage slice](../../docs/development/unit-coverage.md) supplies measured
commands/gates; broader lifecycle and structural coverage remain follow-up. Run unit suites
and coverage gates locally and in CI after implementation. Do not drop coverage,
weaken thresholds, omit source or add ignores to make builds green; prioritize
critical negative/error paths over percentage gaming. Follow the
[coverage/CI acceptance](../../docs/development/development-quality-roadmap.md#unit-tests-coverage-and-ci-enforcement)
for report scope, artifacts and justified changes.

Extract by behavior and responsibility without arbitrary line limits or mandatory
layers for small operations. Tests verify transitions, invariants and observable
HTTP/database behavior rather than private function counts or implementation
mirrors. Retain positive/negative two-tenant/private-project tests, author/assignee
separation, revocation, races, version conflicts, same-key retry, rollback/outbox,
SSE ordering/cancellation, migrations and restart recovery where affected.
Run the applicable focused suites, `pnpm check`, real PostgreSQL/identity/security
and Docker runtime/closure checks from [CONTRIBUTING](../../CONTRIBUTING.md), plus
CI and the current Kilo gate. Record unavailable checks; live provider/staging
validation remains explicitly deferred. For prose-only changes run documentation
checks instead. Preserve generated Prisma content, imported handoff, secrets and
existing patches; no mechanical rewrite of generated or immutable files.
