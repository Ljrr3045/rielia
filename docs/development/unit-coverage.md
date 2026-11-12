# T36 first unit and coverage delivery

This bounded T36.2/T36.3 slice retains `node:test`, adds behavior units and enforces
separate API, web, shared-contract and fictional-prototype coverage. It builds on
PR #33 (`465d9e4`), without production source, policy, schema or appearance changes.
This page preserves the first delivery's evidence. Later lifecycle, formatting
and scoped structural batches are delivered; [T36.6 consolidation](t36-stable-ui-contract.md)
is proposed, with this head's CI/native review, merge and coordinator acceptance
still pending before T37, then T11.

This page records the first delivery and its historical starting floors. The
[lifecycle follow-up](project-refresh-lifecycle.md) records the later measured
API/web ratchet and reviewed line-map migration. The subsequent
[mechanical API/contracts formatting](source-format-adoption.md) records the
explicit physical-line baseline migration and current enforced floors.
The later [web transport W1 adoption](web-transport-formatting.md) records its
separate reviewed web line migration and unchanged S/F/B gates; historical
starting values below remain evidence of their original delivery.
The subsequent [project-surface formatting](project-surface-formatting.md)
records the separately reviewed 31.18% web physical-line floor, retained zero
units and exact end-span precision exception; S/F/B gates remain unchanged.
The subsequent [formatting completion](formatting-completion.md) reaches 208/208
maintained formatting inputs and explicitly migrates current web/prototype line
floors to 31.14%/27.90%, all four shared-config manifests and four selected-test
fingerprints. Semantic hits/S/F/B gates and all historical baselines remain exact;
88 enumerated new END-column losses include 14 fields with hits and remain debt.

The first [backend values/policy/DTO extraction](project-values-policy-extraction.md)
records separately accepted retained-test equivalence and 19 targeted additions:
148 API cases/33 inputs, 288 cases/104 inputs overall. Historical starting values
below remain evidence of their original delivery; current gates remain in the
reviewed baseline files.

The subsequent [scoped project read/command extraction](project-flow-extraction.md)
retains those 148 API cases through a separately reconciled split and adds 68
focused cases/subtests: 216 API/356 total, 36 API/107 total inputs. Its accepted
current API floors are L52.44/S52.47/F48.55/B52.52 percent after exact numerical
acceptance. Other scopes/history and the normal comparator remain unchanged.

Delivered [project interaction owners](project-interactions-extraction.md) end
at corrected PR42 C: 138 web / 380 total cases over 118 inputs. Delivered
[workspace owners](workspace-interactions-extraction.md) end at PR43 C: 145 web,
216 API, 7 contracts and 19 isolated prototype cases, 387 total over 124 maintained
inputs (68 web). Historical PR43 web L/S/F/B floors were 4131/4061/3073/3058
basis points. The T37.3 migrations raised web floors to 4347/4258/3187/3204. Current
T37.4 web floors are **5994/5781/4739/5362** after the reviewed recovery and
PR47 integration migrations below; API floors are 5244/5247/4855/5252. Prototype counts do not inflate production
metrics. Exact baseline files and linked covered/zero/null proof govern;
historical starting values below are not current results.

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
in the denominator. Actual unexecuted runtime inputs retain AST witnesses;
`projects-view.tsx`, `task-detail.tsx` and `use-project-tasks.ts` now execute in
meaningful screen/lifecycle units. Prisma config retains its two branch-only counters.

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

## Final T36 advisory recheck and conditions

**No material delta found; no published range-compatible fix identified for the
retained glob/minimatch parent paths. Keep the existing conditional moderate
debt.** This is targeted metadata research, not a full audit or T36 acceptance.

UTC reads: **2026-11-07 18:54:36–18:55:26**. Fifteen successful official public
JSON responses retain exact bytes, SHA-256, status, per-request UTC and Date/ETag/
Last-Modified headers in `metadata-index.json` and `affected-latest-index.json`.
`comparison.json` binds the prior approximately 05 UTC records; `graph-binding.json`
confirms the root/tools package manifests and lockfiles are still byte-identical
to that graph. No resolution, install, override, package/source/config change,
application run, local audit, GitHub write or new agent occurred.

| Official finding | Current observed status | Delta from 05 UTC |
| --- | --- | --- |
| [glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Medium/moderate, CVSSv4 6.3; affected >=9.0.0 through 14.0.1, first patched 14.0.2; unwithdrawn, update 2026-10-30T23:09:15Z | Exact relevant fields unchanged |
| [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | Medium/moderate, CVSSv4 6.9; affected >=7.0.0 below 11.0.1, first patched 11.0.1; unwithdrawn, update 2026-11-04T16:50:04Z | Exact relevant fields unchanged |

The [fixed glob 14.0.2](https://registry.npmjs.org/glob/14.0.2) and
[fixed minimatch 11.0.1](https://registry.npmjs.org/minimatch/11.0.1) manifests
remain available with exact prior dependency/engine/peer/type metadata. Pinned
Node 24.22.1 is not the blocker; the parent dependency ranges exclude the fixes.

| Published parent evidence | Current blocking edge / conclusion |
| --- | --- |
| [nyc inventory](https://registry.npmjs.org/nyc), [test-exclude inventory](https://registry.npmjs.org/test-exclude) | Still 18.0.0 and 8.0.0 respectively; nyc 18/test-exclude 8 retain glob ^13.0.6, and test-exclude 8 retains minimatch ^10.2.2. Complete inventories/dist-tags are JSON-exact to prior records; no newly published compatible maintenance release |
| [ESLint inventory](https://registry.npmjs.org/eslint), [config-array inventory](https://registry.npmjs.org/@eslint%2Fconfig-array) | ESLint latest 10.14.0 still uses minimatch ^10.2.6; latest 0.23.5 config-array uses ^10.2.4. ESLint current latest dependency/engine/peer/type fields equal prior latest, and config-array inventory is exact. The 10/0.23 lines provide no observed fixed-major edge |
| [typescript-estree latest](https://registry.npmjs.org/@typescript-eslint%2Ftypescript-estree/latest), [typescript-eslint latest](https://registry.npmjs.org/typescript-eslint/latest) | Both still 8.72.1 with exact prior relevant fields; estree still minimatch ^10.2.2. Its full inventory exceeded the 4 MiB budget and was not retained/represented as complete; only these affected bounded latest reads followed. No exhaustive older-branch publication claim is made |
| [artifact inventory](https://registry.npmjs.org/@actions%2Fartifact), [archiver inventory](https://registry.npmjs.org/archiver), [archiver-utils inventory](https://registry.npmjs.org/archiver-utils), [zip-stream inventory](https://registry.npmjs.org/zip-stream) | All complete inventories/dist-tags remain JSON-exact. SDK 6.3.1 requires archiver ^7.0.1; archiver 7.0.1/zip-stream 6.0.1 use archiver-utils 5.0.2 → glob ^10.0.0. No compatible maintenance fix; zip-stream 7 stays outside the old archiver range |
| [readdir-glob inventory](https://registry.npmjs.org/readdir-glob) | Exact inventory. Archiver 8 is outside SDK 6's range, remains an ESM major change and still uses readdir-glob 3 → minimatch ^10.2.2. It is not a complete migration proposal |

Inference from the unchanged graph and targeted metadata: the prior conditional
tooling-exposure disposition remains applicable. Fixed reviewed patterns,
bounded private source mirror, source-symlink refusal, allowlisted artifact files,
no tooling in runtime and independent process-group deadlines are retained
conditions, not evidence that vulnerable packages are patched or universally
unreachable. Those implementation witnesses were not rerun here. No severity,
affected-range, withdrawal or observed remediation/exposure change was found for
the two targeted advisory families. No default-branch/unpublished fix is claimed.

The initial web adapter could not open the official API/registry URLs; direct
HTTPS public JSON GET supplied the preserved primary evidence instead. One full
estree response failed the finite 4 MiB budget; the failure and script exit remain
in the initial index, followed only by its two small affected latest manifests.
No other request or broad audit was repeated.

Coordinator final acceptance must bind this unchanged graph to root and
isolated-tools full-audit results produced by required CI for the exact final
reviewed head. Each new head requires its own results. This research does not
establish current full-graph totals or absence of other newly disclosed advisories, and does not call either graph audit-clean. Future actual
compatible candidates still need a separately authorized exact-version/lock,
engine/peer/lifecycle/runtime and comparable-provider review; no upgrade, forced
major, override or gate reduction is proposed.

The separately observed required [PR43 CI job](https://github.com/Ljrr3045/rielia/actions/runs/42412029803/job/128522082738)
ran actual full-graph high-threshold audits on the same graph:

| Graph / command | UTC 2026-11-07 | Result |
| --- | --- | --- |
| Root, `pnpm audit --audit-level=high` | 20:46:09 | 1 moderate, 0 high/critical; threshold step passed |
| Isolated tools, `pnpm --dir scripts/unit/tools audit --audit-level=high` | 20:46:10 | 2 moderate, 0 high/critical; threshold step passed |

The CI log emits counts only, with no advisory IDs, titles or dependency paths.
Those counts do not establish complete current attribution to the two targeted
families or exclude other mapped paths. Neither graph is called audit-clean.
This documentation batch runs no app/audit/install or metadata sweep. Its final
head still needs actual CI audit results and coordinator disposition before T36
acceptance; earlier implementation-head results do not replace that gate.

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

The first slice’s final count/source digest is
`400c9a600f09809f39749bf879b4fdad6b13e0e8f686d1ef733f56c7c42c863e`.
Current-head local/remote checks, actual CI duration and Draft PR evidence are in
[progress](progress.md). Real-device/assistive-technology/provider/staging/user checks
remain deferred; DOM evidence does not replace them. Further project-task hook/SSE
recovery units and responsibility extraction remain later bounded deliveries.


## T37.3 reviewed current-web baseline migration

The coordinator explicitly reviewed and approved this current-web-only migration
through a blocking candidate decision after the bounded invitation-feedback fix
at `9f9f07f`. Earlier T37.3 statements that coverage reconciliation remained blocked
are superseded by this decision and the passing normal gate; their original run
failure is preserved as historical evidence. This accepts a reviewed baseline
migration, not T37.3 UI/publication or broader T37 acceptance.

| Metric | Accepted covered/total | Reviewed covered/total | Floor before → after (basis points) |
| --- | --- | --- | --- |
| Lines | 1567/3793 | 1649/3793 | 4131 → 4347 |
| Statements | 1734/4269 | 1818/4269 | 4061 → 4258 |
| Functions | 323/1051 | 335/1051 | 3073 → 3187 |
| Branches | 1588/5192 | 1665/5196 | 3058 → 3204 |

Only `scripts/unit/baselines/web.json` changes from SHA-256
`15fd5321b42a3bcbc221aa72ceaba8355d7ea33f485794ef92a0a2e23b36fc35` to
`9e85d482a01099d38b2101cdcef6d83b57ba21722562239bf9c61c67f6f50f16`.
The exact 68 maintained inputs remain; 64 file counters match and four improve:
workspace strings, feedback, invitations and UI. Every L/S/F denominator is
unchanged. Only workspace-feedback B131→135 adds outcomes: the new conditional
has mapped hits [9,24], and its short-circuit operand counters [33,32]. No unhit
outcome or source was omitted, no count/floor regressed and no exclusion/ignore,
provider, compiler/runtime/tool lock, shared config or gate code changed.

Seven expected maintained-source fingerprint deltas cover identity view/page,
project shell, and workspace strings/entry/feedback/view. Existing test/helper
fingerprints are byte-identical; the only added input is
`apps/web/test/unit/workspace-feedback.test.mjs`, containing ten real rendered
component/hook/controller regressions. All historical pre-unit manifests and
other-scope current manifests remain byte-identical. The 92-source compiled UI
binding from `9f9f07f` is unchanged by this baseline/docs-only descendant.

The candidate is generated with existing `baselineFor` and manifest semantics
from the already retained complete 155-pass instrumented report. Source-map
`sourcesContent` matches all 68 current inputs; selected tests/helpers match the
retained execution mirror. No fresh measure or maintenance-mode run is needed.
After the exact candidate decision, one normal `pnpm unit:web` passes all 155 cases,
exact manifests, aggregate/floor/per-file/nonregression and mapping-bound checks;
its full normalized maps and hit vectors match the retained report exactly.

Current source mapping still contains 797 null-column points of 28348 mapped
points; these remain provider precision limits, not precise recovered endpoints.
The type-only `task-collaboration-view.ts` stays in the denominator as an explicit
zero-unit N/A input, without a 100% fiction. Existing unexecuted-source, implicit
branch, null/zero-unit and lifecycle debt is not closed. No unavailable historical
endpoint comparison or universal coverage conformity is claimed.

No app/test source, install, production build, browser or native-matrix rerun is
part of this migration. Existing 19 native checks/23 captures retain their exact
build/source provenance. Current-head CI/native review, T37.3 publication and
coordinator acceptance, plus later real persisted/security/device/AT/provider/
staging/actual-browser-zoom QA remain separate requirements.


## T37.4 reviewed recovery baseline migration

The T37.4 recovery checkpoint starts from accepted local T37.3 source/coverage
`d3cc536`, integrating exact Astra presentation `0721c721` by merge `0b874e3`.
The coordinator reviewed actual recovery owners and assigned conditional JSX,
controller/lifecycle/copy and tests to SOL. This is a current-web comparable
migration, not a pre-unit/history rewrite, automatic rebaseline or gate waiver.

All 155 existing cases remain selected. Twenty-two added real component/hook
regressions exercise confirmed write/read failures and read-only recovery,
target/expiry/session fences, denied/authorized draft restoration, lifecycle
captured versions, current access administration, empty/ready creation and
pending/lost/403/409 checklist outcomes. Retained create/move result-focus tests
still enforce canonical row/page revision barriers and existing fallbacks.
Finite public HTTP DTOs, media/clock/RAF/idle seams and stylesheet loading are
explicit; these tests do not establish native layout or persisted security.

The first instrumented attempt fails before the new rendered file can run:
Node ESM requires the extension on the actual installed `next/link.js`; 160 other
cases pass. A coordinator-authorized file-local resolver executes the real Next
exports without changing shared loaders/provider/config or substituting components.
Its corrected 171-case candidate is preserved but unapproved. Reviewed mapped
capability gaps prompted six actual screen journeys. These reproduce automatic
stale create-form remount in an empty workspace; the existing close condition now
handles ready and empty. The final complete measurement passes 177 cases.

| Metric | Previous current web | Final measured/gated | Floors before → after, basis points |
| --- | --- | --- | --- |
| Lines | 1649/3793 | 2299/3835 | 4347 → 5994 |
| Statements | 1818/4269 | 2500/4324 | 4258 → 5781 |
| Functions | 335/1051 | 500/1055 | 3187 → 4739 |
| Branches | 1665/5196 | 2845/5305 | 3204 → 5362 |

Accepted baseline SHA-256 was
`9e85d482a01099d38b2101cdcef6d83b57ba21722562239bf9c61c67f6f50f16`.
A blocking coordinator decision approved exact candidate/final baseline
`c69839c025e8cab983ef0c9366d92e75139989dc61c1fd86b446d119cf1b26e4`
before it was written. One normal `pnpm unit:web` then passes all 177 cases and
strict comparable-manifest, aggregate-floor, per-file and nonregression gates.
Summary, manifest, normalized maps and all hit vectors are exact to measurement.
No predictable stale normal gate was run.

The inventory stays 68, with 12 expected source fingerprint deltas and 56 exact
source fingerprints. Thirty-nine file counter sets remain exact and 29 improve;
no file loses covered counts or increases uncovered counts. All old selected
cases remain: 20 previous test/helper fingerprints are exact, two existing test
files only append cases apart from a fixture import, an HTTP helper adds optional
raw public DTO answers, and one actual-screen test file is added. Provider/runtime/
pnpm/compiler/tool-lock/four config identities remain exact. All seven other
current/historical baselines remain byte-identical; no exclusions, ignores,
threshold reductions or shared gate/config change are introduced.

All 56 unchanged sources retain exact normalized maps and every previously
covered mapped endpoint. Changed-source mapping/denominator deltas are reviewed,
not claimed byte-identical. Null-column precision remains 803 of 28,798 points,
compared with 797 of 28,348 before; the type-only `task-collaboration-view.ts`
remains among the inputs with zero units, N/A. Unexecuted branches, implicit arms
and source-map limitations remain owned debt. The gain is bounded evidence,
not universal source conformity or full application/security coverage.

No install, frontend production rebuild, app/browser/Docker/runtime or native
matrix rerun is part of this source/coverage task. Existing T37.3 build/capture
bindings remain historical and do not prove changed T37.4 source. Native QA,
real PostgreSQL/Nest/Next journeys, current-head CI/native review, accepted PR47
correction integration with a fresh manifest review, and coordinator acceptance
remain separate. See the [implementation guide](t37-project-task-ui.md).
## T37.3 native round1 manifest correction (2026-11-12)

The four valid [PR #47 native findings](t37-shell-entry.md#native-round1-corrective-batch-2026-11-12)
include transition-specific invitation assertions and the stale current-floors
sentence above. All ten invitation-feedback cases and all prior cases remain.
One necessary fresh web measurement passes **155/155** with the same toolchain,
provider, config, source/test selection and 68 maintained inputs. All 68 per-file
counters, totals, floors, normalized maps and hit vectors are exactly equal to
the accepted T37.3 report: L1649/3793, S1818/4269, F335/1051, B1665/5196;
floors remain **4347/4258/3187/3204** basis points. No added coverage is claimed.

After a blocking exact-candidate approval, only current `web.json` migrates from
`9e85d482a01099d38b2101cdcef6d83b57ba21722562239bf9c61c67f6f50f16` to
`2553f6c1aff88cc0e9d3f2372058fa8f041da505c576207768927b1302ebe70f`.
Its only changes are the identity-view source fingerprint (unused class removed)
and the existing workspace-feedback test fingerprint (stronger assertions).
All seven other baselines are byte-identical; no floor, ignore, exclusion,
inventory, provider/config/tool lock or gate changes. One normal `pnpm unit:web -- --built`
then passes 155/155 and exactly reproduces measured manifests, counters/maps/hits.
The normal gate reuses the required contracts-only compilation, not an app build.

Raw provider diagnostics and measured/normal reports are preserved in the
external corrective report. Null-column points remain 797/28348; the explicit
zero-unit type-only input and unexecuted-source/lifecycle debt remain. Earlier
build/source equivalence applies to its dated checkpoint: the two dead style
hooks change source bytes, so no old build is represented as this new source.
No new Next/API build, browser/device/AT/persistence/security/provider/staging
validation ran; current-head CI/native review and coordinator acceptance remain.


## T37.4 exact PR47 corrective-head integration

The isolated recovery branch integrates only corrective `b1f3ddec`, preserving
all 177 cases and its exact strengthened invitation assertions. One full web
measurement retains all 68 file counters, totals/floors, normalized maps and hit
vectors exactly: L2299/3835, S2500/4324, F500/1055, B2845/5305; floors remain
5994/5781/4739/5362. Only identity-view and workspace-feedback test fingerprints
change. Runtime/compiler/provider/config/tool identities, all 24 test/helper
inputs, type-only N/A and 803/28798 null-column points remain; seven other
baselines are byte-identical.

A blocking coordinator review approved exact candidate
`7e44c96c37036bff1e8aa65a01c1020b664a74ba411d238bcd3c82a2f63ff865`
before writing current web baseline. One normal gate then passes 177/177 with
exact measured summary/manifest/maps/hits equality. No gate waiver, coverage gain,
excluded source, reduced floor or historical baseline change is claimed. That
local integration authorization itself did not accept PR47. The coordinator
subsequently [accepted/merged PR47](https://github.com/Ljrr3045/rielia/pull/47#issuecomment-6814793798) at `55f0f8d`; T37.4 acceptance
remains separate. The separately authorized T37.4 production/native
group follows this integration; HTTP fixtures cannot establish persisted security.


## T37.4 infrastructure witness correction

The initial [PR48 CI run](https://github.com/Ljrr3045/rielia/actions/runs/43159616732)
passed the four-scope coverage pipeline but failed one of 20 infrastructure cases:
its historical unexecuted-screen assertion expected zero covered functions in
`projects-view.tsx`, now 11 after meaningful T37.4 screen units. `task-detail.tsx`
also executes (7 covered functions). This was an obsolete witness, not a coverage
floor failure; the failed log and exact-head safe artifact remain preserved.

The corrected actual-report assertions require both screens to execute functions
and branches. Unexecuted executable inputs are selected from the actual web report
rather than freezing a screen as permanently unimported. Their four positive
L/S/F/B denominators are checked against actual Istanbul AST counters, with zero
covered units retained. Ten such inputs are present in the failed run's report.
The separate real never-imported two-branch fixture, all-scope raised-floor
rejection, per-file regression, malformed-input and selected-test protections
remain unchanged.

One targeted `pnpm test:unit-infrastructure` passes all 20 cases on Node 24.22.1,
using the already-produced safe artifact from exact unchanged source head
`df4876d8`. All four manifest cores, source/test fingerprints, provider/config and
tool-lock identities match the accepted baselines and current inputs; the API's
runner-generated compiler witness is checked against its unchanged runner string.
No application suites, measurement, install, build, browser or Docker rerun occurs.
All 92 compiled-source hashes, 24 frontend test/helper fingerprints and eight
baselines remain exact, including current web `7e44c96c` and its higher floors.
The prior 177-case/native evidence therefore retains its source binding, without
claiming a new application run. Current-head CI and coordinator review/acceptance
remain required; this fix does not accept T37.4 or T37.


## T37.4 reviewed round1 recovery migration

Completed native review exposed missing read-modal, cross-target denied-draft and
revocation-focus schedules. Eight new real screen/controller cases retain 177
prior cases; one measure and one normal `pnpm unit:web` pass **185**. Four owned
source fingerprints and the existing recovery-test fingerprint change; all 68
inputs and 24 selected test/helper entries remain. Runtime/compiler/provider/config/
tool identities and the seven other baselines are byte-identical.

The coordinator approved exact current-web candidate
`560abd962881e8e3d93666919c8e190125f8a8e467a65af60bcf7078f88d41df`
before writing it. L/S/F/B move from 2299/3835, 2500/4324, 500/1055, 2845/5305 to
2336/3847, 2542/4339, 511/1059, 2910/5333; all floors rise from
5994/5781/4739/5362 to **6072/5858/4825/5456**. All per-file covered counts/ratios are
retained or improved and no uncovered count increases. Fifty-eight file summaries,
64 map sets and 39 hit vectors remain exact. Stable-map owners lose no previously
covered unit; shifted locations in the four changed owners are not asserted to be
one-to-one semantic identities. Both raw counter/map reports are preserved.

The normal gate reproduces the measured candidate, full manifests, normalized
maps/hits and LCOV exactly. No lowered threshold, omitted test/source, ignore,
provider change or historical baseline edit. Null-column debt changes from
803/28,798 to **811/28,926** with the new mapped code; implicit arms, unexecuted
owners and the unchanged type-only zero-unit N/A remain explicit. Controlled HTTP
units do not establish SQL persistence/security or native focus behavior.


## T37.4 reviewed round2 modal-focus migration

The selected-task overlap had been omitted from previous native matrices. Ten
meaningful real screen/priority-navigation tests retain all 185 prior cases; the
revised measure and one normal gate pass **195**, with exact reports/maps/hits/LCOV.
The first 194-case candidate is retained as unapproved evidence: its optional
marker default added two uncovered UI outcomes and reduced that file's ratio.
One coordinator-authorized real workspace-navigation guard test and revised measure
cover priority ownership without adding production code or mirrored assertions.

The exact revised current-web candidate
`263d596f595c8cc89b7fecacde9ec7e0ad9d3be03483c8145a5c309f9e872a75`
was approved before writing. L/S/F/B move from 2336/3847, 2542/4339, 511/1059,
2910/5333 to **2387/3861, 2595/4354, 526/1060, 2996/5349**; floors rise from
6072/5858/4825/5456 to **6182/5960/4962/5601**. No per-file covered count/ratio or
stable-map covered unit regresses. New defensive disconnected/CSS-hidden checks
add a net one uncovered line/two statements/one branch in the effect, with improved
ratios; this debt is explicit, not ignored or padded to 100%.

Three source fingerprints and one existing test fingerprint change; 68 inputs,
24 test/helper entries, provider/config/tools and seven other baselines remain
exact. 54 file summaries/65 maps/35 hit vectors are unchanged. Null-column points
remain 811 with 29,010 total points; implicit arms, changed-location identity limits
and the same type-only zero-unit N/A remain. No lowered floor/exclusion, historical
baseline rewrite, backend/policy or persistence/security claim.
