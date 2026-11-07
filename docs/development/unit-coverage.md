# T36 first unit and coverage delivery

This bounded T36.2/T36.3 slice retains `node:test`, adds behavior units and enforces
separate API, web, shared-contract and fictional-prototype coverage. It builds on
PR #33 (`465d9e4`), without production source, policy, schema or appearance changes.
T36 remains **IN PROGRESS**: later lifecycle/recovery coverage, formatting adoption,
structural extraction and acceptance precede T37, then T11.

This page records the first delivery and its historical starting floors. The
[lifecycle follow-up](project-refresh-lifecycle.md) records the later measured
API/web ratchet and reviewed line-map migration. The subsequent
[mechanical API/contracts formatting](source-format-adoption.md) records the
explicit physical-line baseline migration and current enforced floors.
The later [web transport W1 adoption](web-transport-formatting.md) records its
separate reviewed web line migration and unchanged S/F/B gates; historical
starting values below remain evidence of their original delivery.

Traceability: P01–P11/P33/P38; US01–US08/US11–US12/US24–US25; T01/T04–T10/T35;
existing UXR01–04/06 and UX01–03/05–07/09/11. No sprint/product expansion, UI
redesign, real-provider/staging validation, deployment or protected-settings change.

## Setup and commands

Use Node **24.22.1**, pnpm **12.15.0** and TypeScript **6.0.3**. Shell Node can differ;
run these commands through the repository's pinned runtime. No unit command installs
packages or makes a hidden network request.

```sh
pnpm install --frozen-lockfile
pnpm --dir scripts/unit/tools install --frozen-lockfile
pnpm unit:coverage
pnpm test:unit-infrastructure
pnpm unit:artifacts
```

`unit:api`, `unit:web`, `unit:contracts` and `unit:prototype` run one scope. Each run
starts fresh output, so a scoped run reports other scopes missing. `--built` reuses
the real contracts/API builds after a successful `pnpm check`, as CI does; normal
local commands build their prerequisites. Run commands serially in one checkout.
`coverage/unit/` contains summaries, full counters, source/provider manifests and
LCOV. `coverage/artifacts/` contains only the validated upload allowlist.

Pure files default to a five-second test deadline; DOM cases declare thirty seconds.
Files execute serially with isolated Node processes; the command's parent enforces
a 120-second POSIX process-group deadline. Failed private scratch logs/maps stay
under ignored `coverage/.unit-*` for local diagnosis. They are never uploaded.

The six real loopback HTTP cases have an explicit `test:web:integration` entrypoint
and remain in `pnpm check`. Only their test declarations moved; assertions remain.
The first final-head CI exposed an inherited 30 ms admission race in the HTTP
deadline case: a timeout before headers correctly returns a 503 body, whose read
resolves. The corrected real-HTTP case proves that control, admits a 200 response
before firing a controlled body deadline, releases a late body that must reject,
and observes close on the actual SSE response after caller abort. No production
semantics or duration was relaxed. `pnpm exec node scripts/unit/http-deadline-witness.mjs`
retains a positive run and rejects a disposable missing-body-deadline mutation;
it remains separate from offline unit infrastructure.
The shared discovery-validator case moved once to contracts. The original API
integration config callback remains intact to preserve that legacy control without
a formatting sweep; its isolated unit uses fixed fictional settings and retains all
original assertions. Integration import-time execution contributes no unit credit.

## Measured source and gates

Fresh pre-unit runs on unchanged maintained source reproduce both prior audits
exactly. [Pre-unit baselines](../../scripts/unit/baselines/pre-unit-api.json) and
the [current baselines](../../scripts/unit/baselines/api.json) commit covered/total
counts per file, four numerical floors, source hashes, compiler/config and provider
identity. Selected test/helper inventory and exact content hashes are also part of
the comparable manifest: deleting a redundant critical case cannot hide behind
unchanged coverage. Legitimate additions/edits require explicit reviewed migration.
Other scopes use adjacent named JSON files.

| Scope                          | Maintained inputs |    Lines | Statements | Functions |  Branches |
| ------------------------------ | ----------------: | -------: | ---------: | --------: | --------: |
| API before                     |                30 |  38/1095 |    45/1617 |     3/396 |   36/1228 |
| API after                      |                30 | 230/1095 |   296/1617 |    62/396 |  225/1228 |
| Web production before          |                51 | 682/3251 |  1092/4251 |  168/1041 | 1140/5185 |
| Web production after           |                51 | 761/3251 |  1215/4251 |  210/1041 | 1230/5185 |
| Shared contracts after         |                 4 |    78/78 |    113/113 |     64/64 |   355/363 |
| Fictional prototype, unchanged |                16 |  199/805 |    269/984 |    87/368 |   194/954 |

There was no prior dedicated contracts suite: its dedicated pre-unit run is zero.
Old web tests invoking shared validators were excluded from web source attribution;
they do not establish a separately measured pre-unit contracts percentage.

| Enforced starting floor (%) |  Lines | Statements | Functions | Branches |
| --------------------------- | -----: | ---------: | --------: | -------: |
| API                         |  21.00 |      18.30 |     15.65 |    18.32 |
| Web production              |  23.40 |      28.58 |     20.17 |    23.72 |
| Shared contracts            | 100.00 |     100.00 |    100.00 |    97.79 |
| Fictional prototype         |  24.72 |      27.33 |     23.64 |    20.33 |

Floors are integer hundredths derived by rounding measured values down. The
comparator also uses integer cross-products of exact ratios, checks uncovered
counts and the covered-file ratio, and protects every file's measured counts.
Unrelated gains cannot hide a policy/hook regression. Source set, hashes,
denominators, compiler and provider changes fail closed and need reviewed comparable
before/after evidence. No ignores, omitted source, lowered floor or automatic CI
baseline update may regain green. Metrics with zero units are N/A, not 100%.

For an explicitly reviewed baseline update, `pnpm unit:coverage -- --write-baseline`
writes measured JSON; CI refuses all maintenance modes (`--measure`, `--write-baseline` and `--pre-unit`) before output/build work. `--pre-unit --write-baseline` reproduces
the exact original test selection from merged base `465d9e4`, not new behavior.
`--measure` emits local candidate reports without accepting gates; complete execution status is not gate acceptance in that mode. These maintenance modes are not CI shortcuts. Baseline changes require a reviewed
diff and critical-case evidence even when percentages increase.

## Compiler, mapping and attribution

Inputs are sorted before execution: all maintained API `src/**/*.ts` except generated
Prisma, plus `prisma.config.ts`; all web `src/**/*.{ts,tsx}` plus `next.config.ts`;
and all four contracts sources. Prototype route/library files form a separate scope.
API bootstrap, worker, migration, unused components, hooks and route wrappers stay
in the denominator. `projects-view.tsx` and `task-detail.tsx` are named unexecuted
AST witnesses; the lifecycle follow-up now executes `use-project-tasks.ts`. Prisma config retains its two branch-only counters.

API JavaScript comes from the real production `tsc` build with legacy decorators
and constructor metadata. An instrumented-mirror assertion verifies Nest's actual
`design:paramtypes`. Contracts use real `tsc` with scratch source maps/inline sources;
their normal build remains unchanged. Web uses TS 6 ESM/react-jsx/verbatim-module
emission. Next bundles and Node type stripping are not coverage inputs.

nyc **18.0.0** preinstruments only disposable emitted ESM; collection uses `--all`,
`--instrument false`, and `--exclude-after-remap false`. The frozen graph checks
instrumenter **6.0.3**, coverage **3.2.2**, mapper **4.0.1**. A local resolve hook
maps ordinary TS/TSX and extensionless imports to those emitted JS files and rejects
escapes to original app source. It does not transform API code with tsx/esbuild.
Shared contracts are reported separately, never duplicated in app numerators.

Report keys and LCOV source paths are repository-relative and sorted; upload counters
contain no source maps or source content; coverage location maps are retained.
Mapped statement/function/branch endpoints are
validated against original source bounds. Mapper 4 retains unknown/null columns
(API 86, web 577, prototype 98); this is documented precision loss, not perfect mapping.
Two prototype files (type declarations and reexport barrel) have empty maps and are
explicitly reconciled as zero-unit inputs. Prototype has fourteen executable files.

Generated Prisma/Next/build outputs, dependencies/vendor, tests/harnesses and immutable
handoff are excluded explicitly. CSS, SQL and Prisma schema retain their existing
lint/build/UI/integration obligations outside JavaScript coverage.

## Behavior and infrastructure evidence

API units cover fixed identity config, nested/cyclic storage-error classification,
copied/foreign verification rejection, current authority/session/grant expiry,
read-only/admin denials, sanitized failures, invalid task fields/dates, access denial,
conflict/no-write, replay reauthorization, idempotency mismatch and failed collaborator
effects. There are 54 behavior cases/subtests plus one compiler-metadata infrastructure case.
Repository doubles cannot prove SQL rollback, isolation, locks or concurrency.

Web runs 79 existing isolated production cases and 16 actual React/hook DOM cases:
StrictMode cleanup, controlled late loads, invitation capture/scrubbing, visible-only
refresh, timer cleanup/clamping, throwing optional storage, account replacement,
configured providers, duplicate pending intents, announced error/retry and focus
recovery. Seven contract cases exercise health/workspace/project/task/collaboration/
discovery public guards and malformed data/query boundaries without tightening policy.
All nineteen prototype cases remain separate.

Disposable behavior mutations remove current-authority verification, pending guards,
identity-load invalidation or listener cleanup and fail the intended assertions.
No mutation is shipped. Fifteen coverage-infrastructure cases verify actual four-metric gates,
same-aggregate protected-file rejection, passing/failed/unawaited-rejection NYC children,
a new never-imported two-branch input, missing/malformed inputs, wrong runtime/config,
source bounds/symlinks, descendant termination, test/helper omission or changes at
equal coverage and bounded/current artifact packaging.
At an already-100% metric, a valid 100% floor rejects a well-formed partial synthetic report; an impossible >100% floor separately proves configuration rejection.
Five additional upload-boundary cases verify the actual SDK module loads, explicit
file/options success, missing capability, sanitized failure/deadline, and rejected
paths/symlinks/size before SDK effects. Publication itself needs Draft CI evidence.

The independent checkpoint review reproduced stale-report reuse, a coverage-parent
symlink escape and unbounded failure JSON. The corrected parent clears owned output
before execution, per-scope completion status controls packaging, every directory is
checked for symlinks, and failure diagnostics have a narrow phase/exit schema plus
the same size/path budget as successful reports. Focused regressions cover all three.

## Native-review corrective evidence

The first PR #34 native round produced one warning and eight suggestions. Its
corrective batch adds the standalone contracts-build prerequisite, rejects all CI
maintenance modes, handles encoded checkout paths, guards every maintained input
while allowing public contracts runtime imports outside their own scope, and
preserves ENOENT without invalid process-group kills. Real negative/positive
controls exercise those boundaries; existing descendant deadlines remain required.

Weak assertions now observe actual effects: principal/membership creates are absent
on administration denial and present in a real human-admin control; an aborted
workspace read cannot persist private selection after unmount. A disposable missing
generation guard fails that storage assertion. The detached Retry click was removed;
connected pending controls, status and focus evidence remain. No production source
or test-file selection changed. One new API positive control changes coverage only
within PrincipalService, raising the API aggregate from L219/S284/F58/B214 to
L230/S296/F62/B225 at identical denominators. The file itself rises from 61 to 72/134
lines, 73 to 85/178 statements, 16 to 20/43 functions and 48 to 59/184 branches.
Every other file/scope remains equal, and no floor is lowered.

All eight pre/current manifests migrate exact helper/test hashes explicitly. Fresh
pre-unit runs retain every historical count/floor; current runs retain identical
source/compiler/config/provider/tool-lock identities. The coordinator accepted the
upward API ratchet contingent on repeated identical measurements and independent
review. Hook safety is a distinct prerequisite, documented in [quality tooling](quality-tooling.md).
Current-head full CI and review evidence remain in progress/PR body.

## Isolated tool graph and retained advisory risk

The private [tools package](../../scripts/unit/tools/package.json) is outside app
workspace globs. It pins nyc 18.0.0, jsdom 31.0.0, DOM Testing Library 10.4.2,
tsx 4.23.15 and official `@actions/artifact` 6.3.1 with its own pnpm 12.15 lock,
exact Node 24.22.1 engine, strict peers and
automatic peer installation disabled. React/react-dom remain existing 19.3.1 pins.
nyc is ISC; jsdom/DOM Testing Library/tsx/artifact SDK are MIT. Published metadata and installed
manifests were checked for engines, peers and lifecycle scripts. Optional canvas is
not installed. No library is a runtime dependency and no new script is approved:
esbuild 0.28.2's installer is explicitly denied; its locked platform package works.

The initial root-tool resolution injected optional Babel/tsx peers into runtime
graphs. Pinned pnpm 12.15 cannot narrowly isolate those optional peers while preserving
existing required-peer reuse. Coordinator accepted the separate tooling install
instead; root lock/workspace and runtime pins remain unchanged. No override, peer
suppression or package-manager upgrade was adopted. Installed backend closure remains
**286 packages, no Express**; Docker context/runtime exclude root scripts/tooling.

Adoption audits: root retains **one moderate** minimatch finding; isolated tooling has
**two moderate**, zero high/critical. [Glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
affects locked 13.0.6 (fixed 14.0.2); [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
affects locked 10.2.6 (fixed 11.0.1). Their fixed major versions are outside selected
upstream ranges. Findings are retained, not suppressed or represented as fixed.
The SDK's archiver additionally resolves glob 10.5.0/minimatch 9.0.9 paths for the
same two findings; these remain explicit. Its chosen upload path adds individually
validated files to ZIP, without glob discovery or a directory-copy operation.

The coordinator permits only this bounded dev-tool exposure: fixed reviewed globs,
private finite mirror, no followed source symlinks, no event/CLI pattern or cwd,
no complete-copy traversal, no runtime inclusion, and an independent deadline killing
the entire process group. Preflight fails above 1,500 files, 20 MiB or depth 16 rather
than omitting source. Upstream call sites use fixed patterns and no cancellation
signal; this narrows exposure without claiming vulnerable code is unreachable.

**Owned follow-up:** T36 tooling integration owner/coordinator must recheck official
nyc/test-exclude compatible fixes at every provider refresh and before final T36
acceptance, rerun both audits, and reproduce comparable counters before updating
this graph. A changed severity or exposure requires a new coordinator disposition.
Both root and tools `audit --audit-level=high` remain required in CI.

## CI and remaining acceptance

The existing required `validate` keeps PR/dev/main push events, contents:read,
HUSKY=0 and its 25-minute timeout. It retains full check, real PostgreSQL/HTTP/
security/migration/restart, Docker runtime/closure and high audits. Unit tests/gates
and infrastructure proofs run independently of local hooks, reusing prior builds.

An always-run packager publishes explicit missing/partial status even on failure.
Only sanitized JSON/LCOV/manifest files and bounded phase/exit diagnostics upload;
never raw output, source maps, sourcesContent, environment, cookies, URLs or tokens.
Budgets: **2 MiB/file, 10 MiB total, 7 days**. The measured complete payload is about
2.19 MB. Exceeding a bound fails, with no truncation of coverage maps. Upload uses
the reviewed [local Node 24 JavaScript Action](../../.github/actions/unit-artifacts/action.yml)
with the frozen [official artifact SDK](https://github.com/actions/toolkit/tree/main/packages/artifact).
Runner-provided artifact capability is available in that supported JS-action context;
shell access is not assumed. The child receives only required runner variables,
never `GITHUB_TOKEN` or unrelated secrets, and fails if capability is missing.
It uses an explicit regular-file allowlist, seven-day retention and a 90-second
process-group deadline. SDK output/errors are not forwarded into reports or logs.
No custom transport, personal token, permission expansion or action fork is added.
Packaging/upload cannot turn failed tests green.

The initially proposed official upload-artifact v7.0.2 bundle was rejected before
execution/publication: its immutable shipped XML and undici modules match additional
high advisories, beyond lock-only development dependencies. This does not establish
exploitability of every advisory in this workflow. The supported SDK 6.3.1 fresh
compatible resolution fixes those high paths without overrides; the isolated high
audit still passes with only the two documented moderate families. All eight
baseline manifests explicitly migrate their provider-lock hash with measured
covered/total values, floors and maintained-source hashes unchanged.

Fresh final count/source digest is
`400c9a600f09809f39749bf879b4fdad6b13e0e8f686d1ef733f56c7c42c863e`.
Current-head local/remote checks, actual CI duration and Draft PR evidence are in
[progress](progress.md). Real-device/assistive-technology/provider/staging/user checks
remain deferred; DOM evidence does not replace them. Further project-task hook/SSE
recovery units and responsibility extraction remain later bounded deliveries.
