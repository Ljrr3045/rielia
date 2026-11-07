# T36 project refresh lifecycle and behavior units

A quiet `/projects` page now retains its loaded task page instead of repeatedly
reading the first page and resetting 114 loaded rows to 100. Genuine SSE,
visibility and focus invalidations still reauthorize and refresh current data;
dirty drafts and unknown commands retain their existing recovery contract.
A failed full background read exposes the existing load-error state and can
recover on a later hint rather than remaining indefinitely in loading.

This bounded T36.2/T36.3 follow-up builds on merged
[PR #34](https://github.com/Ljrr3045/rielia/pull/34), base
`969480a7c27762cc74fa4290389fab89f0757776`. It preserves public contracts,
permissions, schema and appearance. Traceability remains T01/T04–T10/T35,
P01–P11/P33/P38, US01–US08/US11–US12/US24–US25, UXR01–04/06 and
UX01–03/05–07/09/11. T36 remains **IN PROGRESS**; structural extraction and
stable UI acceptance still precede T37, then T11.

## Correction and regression controls

`backgroundRefresh` records a new invalidation; `flushBackgroundRefresh` services
recorded work. The hook's reaction to ready state and the controller's queued
refresh callback use the latter, so completing a refresh does not invent another
invalidation. Epoch/reset tracking preserves hints received during active work.
Current authority is checked before deferring data replacement for a draft.
Pending or unknown commands are never automatically resubmitted.

The real React hook suite reproduces the original reset before the correction.
It covers initial/StrictMode mount, unmount and late responses, visible/hidden
return, repeated in-flight hints and resets, draft defer/discard, same-human
session and different-account replacement, workspace replacement, exact-key/body
retry, expiry timers, SSE reconnect/cursors, queued cleanup and transient read
failures without a retry loop. Both replacement cases return a validated task DTO
for the original command, proving that a valid late success cannot publish old
private data. A separate type-only correction resolves TypeScript's narrowing
across an asynchronous state update; normalized emitted JavaScript is identical
to the browser-tested core.

Disposable witnesses reject removal of the refresh correction, incoming epoch,
failed-read disclosure and queued timer cleanup. Independent review caught an
initial replacement fixture that returned a project DTO for a task command and
therefore tested a late 502 rejection. The corrected cases pass normally and
fail both intended stale-success assertions when only the success-generation
guard is removed, while the catch guard remains. No mutant is shipped.

| Additional real-method units | Cases | Observable behavior                                                                                                |
| ---------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------ |
| Web hook lifecycle           |    19 | Refresh, private state, cancellation, deferred drafts and command recovery through actual React/controller/clients |
| Workspace invitations        |    23 | Recipient/issuer authority, expiry/consumption, membership, current replay and failure effects                     |
| Collaboration policy         |    18 | Authorship, versions/archive, hierarchy/checklist decisions and collaborator failures                              |
| Discovery policy             |    16 | Current assignee, public projection, scoped cursors, filtering and hydration failure                               |
| Event lifecycle              |    17 | Admission, awaited polls, safe hints, resume/expiry, backpressure and timer/listener teardown                      |

API units execute actual production service methods with named repository,
clock and response boundaries and real TypeScript Nest constructor metadata.
They do not emulate SQL or prove locks, isolation, rollback or durability.
Existing real PostgreSQL/HTTP/security/runtime suites remain mandatory.

## Comparable coverage and reviewed migration

All four stages use Node 24.22.1, TypeScript 6.0.3 and the accepted nyc 18.0.0 /
instrumenter 6.0.3 / coverage 3.2.2 / mapper 4.0.1 graph. Every maintained input stays:
API 30, production web 51, contracts 4 and isolated prototype 16. Existing tests and
helper hashes are retained; the new four API files and two web files receive
explicit fingerprints. The runner preserves fail-closed dependency verification
in its sanitized child environment. Locks and deployed dependencies are unchanged.

A reproduces every accepted count exactly; B changes only formatting; C applies
the correction with retained tests; D adds the lifecycle units, including the
reviewed valid late-success fixture. The earlier provisional D remains preserved
as historical evidence. Its malformed-response hits are not retained as credit
for the corrected late-success case.

| Scope / stage        |    Lines | Statements | Functions |  Branches |
| -------------------- | -------: | ---------: | --------: | --------: |
| API A/B/C            | 230/1095 |   296/1617 |    62/396 |  225/1228 |
| API D                | 459/1095 |   654/1617 |   140/396 |  469/1228 |
| Web A                | 761/3251 |  1215/4251 |  210/1041 | 1230/5185 |
| Web B                | 911/3459 |  1215/4251 |  210/1041 | 1230/5185 |
| Web C                | 914/3463 |  1217/4255 |  211/1042 | 1233/5192 |
| Web D                | 975/3463 |  1292/4255 |  230/1042 | 1300/5192 |
| Contracts, unchanged |    78/78 |    113/113 |     64/64 |   355/363 |
| Prototype, unchanged |  199/805 |    269/984 |    87/368 |   194/954 |

The coordinator explicitly accepted one mapped-line migration after independent
review. The controller's line counts are A351/363 → B501/544 → C504/548 → D510/548.
A/B have identical emitted JavaScript and exactly equal statement/function/branch
counters. Splitting dense physical lines exposes existing uncovered statements
as additional line units: 12 uncovered lines become 43 under formatting alone;
D reduces that to 38. Its uncovered statements/functions/branches improve from
78/8/122 to 69/5/115. The line percentage change is recorded, not hidden through
an exclusion or a different provider. The hook's format-only line denominator
changes 29→56; real D execution covers 54/56 lines and 16/18 functions.

Only the reviewed API/web baselines migrate. All six other baseline files,
including historical pre-unit baselines, remain byte-identical. Exact ratios,
uncovered counts, per-file/source/provider/config/test fingerprints and all
failure gates remain enforced. `projects-view.tsx` and `task-detail.tsx` retain
real unexecuted AST counters; the hook now has positive function/branch assertions.

| Current enforced floor (%) |  Lines | Statements | Functions | Branches |
| -------------------------- | -----: | ---------: | --------: | -------: |
| API                        |  41.91 |      40.44 |     35.35 |    38.19 |
| Production web             |  28.15 |      30.36 |     22.07 |    25.03 |
| Contracts                  | 100.00 |     100.00 |    100.00 |    97.79 |
| Prototype                  |  24.72 |      27.33 |     23.64 |    20.33 |

These are measured ratchets, not a claim of broad UI coverage or T36 completion.
No automatic CI baseline reset, ignored source or arbitrary target is introduced.

## Executed evidence and limits

The gated run passes API 129, web 114, contracts 7 and prototype 19 tests (269 total),
followed serially by all 20 infrastructure/upload cases. Canonical digest:
`82f6cc209076c186ef76a039c59fa7e8f1dfbdc33cc4ad8986f2e05a17ff02f6`.
The paired measurement took about 49 seconds and corrected D about 14 seconds,
including disposable setup/report copying. The actual serial `pnpm check` passed
in 85.141 seconds, including typechecks/optimized builds, 286-package Express-free
backend closure, retained real HTTP/MCP checks and final application HTTP smoke.

An extra local preservation wrapper exited 1 after that successful command because
the owned generated workspace-validation cache hash changed. Installed modules
metadata and virtual-store lock stayed exact; all borrowed tools metadata/package
hashes stayed exact. The coordinator accepted an expected validation-cache refresh
as an inference, with the failed guard preserved. Before cache bytes were not
captured, so an exact field delta or timestamp-only proof is not claimed. No
install, repair, restoration or check rerun followed that guard.

The reviewed production core `f5a26f9` and this integration have identical web/API/
contracts/Prisma trees. Its real PG 103 reported tests plus database restart,
Docker build/closure/readiness/job recovery and browser evidence are retained
with that exact mapping. Browser checks include quiet zero-request observation,
114-row retention, real two-session SSE, dirty draft defer/discard, a lost actual
201 response retried with the original key/body and one persisted result, controlled
503 recovery and real private-grant revocation. CDP mouse/keyboard and emulated
touch at 390 px evidence are distinguished from DOM button intents and physical devices.
Screenshots alone do not prove persistence or certify CSS/accessibility.

No full local PG/Docker/browser rerun is claimed for this test/manifest integration.
Final current-head hosted CI remains required. Physical touch/virtual keyboards,
AT, cross-browser coverage, real OAuth/provider/staging and real-user acceptance
remain unverified. Unexecuted views and other source gaps stay visible; later
formatting/extraction must preserve these gates and pair source-map changes with
before/after behavior evidence. The coordinator retains the bounded raw reports,
mutation logs, screenshots and fixture recipes separately from upload artifacts.
