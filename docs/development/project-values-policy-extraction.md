# T36 first backend values, policy and DTO extraction

This bounded T36.5 delivery starts from merged PR #39 at
`c9a742618a7b1d7734daf1d98c31f33245304120`. It separates already-existing
project/task input handling, human-management policy and loaded DTO projections.
Public service/DI signatures, wire output, exceptions and existing behavior stay
unchanged. T36 remains **IN PROGRESS**; further frontend/backend extraction,
T36.6 contract acceptance, T37 and T11 remain open in their existing order.

Traceability: T36.5; existing T06–T10/T35, P01–P11/P33/P38 and
US01–US08/US11–US12/US24–US25. This changes no product scope, database schema,
permission rule, runtime/framework/dependency pin, UI or immutable handoff.

## Responsibility boundary

| Owner | Existing groups moved or retained |
| --- | --- |
| `project-task-input.ts` | `identifier`, `object`, `text`, `expected`, `taskFields`, `taskProperties`, `canonical`; input-adapter BadRequestException text remains exact |
| `project-task-policy.ts` | Pure `administrator` and `canManage` booleans; no Nest exceptions or Prisma imports |
| `project-task-dto.ts` | `ReadableTaskProject`, provenance/attribution/date projection, `projectDto`, `taskDto`, `accessDto`; loaded rows, people and eligibility only, no I/O |
| `ProjectTaskService` facade | `page`, required-management ForbiddenException, scoped reads/hydration, queries/SQL/locks, mutation/receipt kernel and command callbacks remain |

The facade re-exports `ReadableTaskProject` for compatibility. Collaboration now
imports `object`/`expected`/`text` from the input owner and retains its existing
facade composition APIs. Discovery imports `object` from that owner and retains
`discoveryRead`/`discoveryItems`. Controllers, providers and module wiring do not
change. Canonicalization still serves both mutation hashes and task-filter/cursor
comparison, sorts object properties recursively and preserves array order.

Human owner/admin role and human execution mode retain their separate checks.
Verified-context invariants remain PrincipalService-owned. DTOs preserve current
eligibility/capabilities separately from immutable creator/provenance and named
historical assignees; archived explicit access can remain revocable. No new
source-policy condition or agent administration capability is added.

## Separate measurements

Node 24.22.1, pnpm 12.15.0, TypeScript 6.0.3, Nest 12.3.2, Prisma 7.10.1,
existing patches, actual NodeNext/decorator metadata and the installed provider
are unchanged. Builds and measurements run serially with verify-deps `error`,
workspace concurrency 1 and 15-second cooling boundaries. No dependency install,
cache repair, test/provider/config exclusion or threshold bypass is used.

| Phase | API cases / inputs | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| A: merged source, retained suites | 129 / 30 | 597/1477 | 654/1617 | 140/396 | 469/1228 |
| B and repeat: extraction, same suites | 129 / 33 | 597/1477 | 654/1617 | 140/396 | 469/1228 |
| C: same extracted source, targeted additions | 148 / 33 | 638/1477 | 698/1617 | 156/396 | 523/1228 |

A's 17 saved reports equal accepted PR #39 hosted reports. All 17 B/repeat reports
match byte for byte. Independent review accepts all 996 facade raw units,
including 530 zeros, with exact AST/raw/parent correspondences rather than moved
numeric IDs. It accounts for published, generated helper and implicit-branch
units separately; two compiler implicit arms retain empty endpoints with exact
compiler-parent association. The 56 measured physical-line groups retain 174/365 lines
before new tests. All 27 unchanged API files retain complete maps; the two import
consumers have explicitly accounted one-line shifts. Source/emitted/raw/maps/LCOV
identities and UTF-16 bounds are retained privately, not inferred from totals.

There is no new END precision waiver: the existing 149 global/29 facade null
endpoints retain their actual provider meaning, including Infinity serialized as
null. Empty compiler endpoints remain empty. No uncovered unit or unknown column
is fabricated, discarded or converted into a precise endpoint. These task-bound
proofs do not alter the normal CI comparator or authorize future migrations.

C passes a focused 19-case suite and 288 total cases across 104 maintained inputs.
The three other scopes' 12 reports are byte-identical to B. All three new maintained helpers
enter the normal all-source denominator automatically. The inventory also covers
maintained files that no suite imports; the exact source/test-manifest gate remains
enforced.
The coordinator accepted API L/S/F/B floors of 43.19/43.16/39.39/42.58 percent
and the exact measured per-file counts/source-test manifest. Only the current API
baseline changes; seven other current/historical baselines remain unchanged. No C coverage gain is used to conceal an extraction regression.

## Targeted outcomes and limits

The new suite exercises the actual service and coherent exported canonical
transformation. Its boundary double only consumes explicitly scripted loaded
answers; it evaluates no queries and emulates no repository, domain policy,
trigger, transaction or rollback. Cases cover leap date, null/undefined clearing
versus omission/invalid fields, optional description bytes, required title length
before trimming, empty/version rejection, equivalent request replay, array-order
preservation, human web administration, delegated/autonomous denials, project
content/management flags and archived/current eligibility versus historical
identity/provenance. Synthetic callback capabilities isolate projection behavior;
they do not prove PrincipalService emits each callback combination in production.
All 74 previously delivered neighboring cases remain unchanged.

All six extracted source candidates already match pinned Prettier 3.9.10 exactly;
there is no source-format delta between B and C. Four new maintained paths are
adopted, reaching 212/212 eligible inputs.

The actual C fresh builds, focused test and full measurement pass, with four
native calls, actual exit/deadline/group receipts and raw owned/frozen metadata,
cache/task/store/Git/link preservation. Only admitted native task transitions
changed. The final `pnpm check` passes in 76.47 seconds. The final-source gated coverage
run passes all 288 cases in 14.46 seconds, infrastructure passes 20 cases, local
artifacts validate, and the handoff verifier confirms 47 imported files, 30 assets
and 616 local links in 70 documents. Whitespace and process/dependency guards pass.
The final reports retain C numerical values with the final test fingerprint; the
original C capture and resolved lint/stale-report failures remain private evidence.
The local commit uses the tracked quality hooks. Current-head hosted CI, external
Kilo feedback and publication remain coordinator-owned delivery gates.
Units do not replace retained PostgreSQL, tenant/security, immutable authorship,
version/idempotency/race/rollback/outbox/SSE/restart or runtime/closure suites.
No new local Docker/browser/provider/staging result, deployment, merge or completed
ticket is claimed.
