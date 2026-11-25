# T38.2e collaboration boundary schemas

[T38.2e is ACCEPTED and delivered in PR62](https://github.com/Ljrr3045/rielia/pull/62#issuecomment-7150139496):
reviewed `6cc1e4ac4ed413f88d52a9fefe24e7b839a85bbc`, merged
`f319508181524d340e810faf55b1e1cc625abac9`, identical tree
`f4c71c47cf39670918117450c54f3250719bba6b`. Reviewed-head CI45525396980 /
check138907464647 and exact-merge CI45529401624 / check138920664764 passed all
24 steps (App15368). Native Kilo138913186695/App2193792 reviewed all 27 files
without findings in one final round. The settled clean worktree was removed
through Orca; branch/evidence and all 93 foreign coordinator entries were retained.
[Issue53 closeout](https://github.com/Ljrr3045/rielia/issues/53#issuecomment-7150381370)
records delivery. Original source/run/failure identities below remain unchanged;
these acceptance and cleanup facts do not rebind local receipts.

## Preserved pre-acceptance local receipt

**DRAFT PR62; LOCAL GATES COMPLETE; FINAL-HEAD CI/NATIVE REVIEW/ACCEPTANCE PENDING,
2026-11-24 America/Caracas.** The coordinator published
[Draft PR62](https://github.com/Ljrr3045/rielia/pull/62), targeting `dev`, at initial
implementation head `15e56e383acf03917acdac606faa9b7e4208384e`, tree
`84a6b3cc4930b1746d1355a1b1b411a8e04b3ade`. Initial publication is complete;
this docs-only PR-reference batch does not rebind source-qualified runs or their
original failures. Final-head CI, native Kilo and final acceptance remain
coordinator gates.

This coordinator-released
[T38/issue 53](https://github.com/Ljrr3045/rielia/issues/53) slice covers
H36–48/G04, collaboration X03 and its bounded API HTTP/X09 admission.
Full T38.2/T38 remains open.

The base is accepted and delivered [PR61](https://github.com/Ljrr3045/rielia/pull/61#issuecomment-7147377623):
reviewed `09d257a513ff5a6558402958656af787da460ebc`, merged
`0a2cb1156d7895340e19b33808fda7aca0ac3dad`, identical tree
`cbc738b9dd24c16f1fca271f67f9d9ed17b40506`. Reviewed-head
[CI45360527713](https://github.com/Ljrr3045/rielia/actions/runs/45360527713/job/138329274200)
and exact-merge
[CI45509817901](https://github.com/Ljrr3045/rielia/actions/runs/45509817901/job/138854326459)
passed all 24 applicable steps. Native Kilo retry138846538938/App2193792 reviewed
20 files with zero critical/warning findings and one accepted maintenance
suggestion. Earlier insufficient-credit check138335809998 is failed-to-start
evidence, not a review. Its settled clean worktree was removed through Orca,
retaining branch/evidence and all 93 foreign coordinator entries. These receipts
are reused without rerunning or rebinding their source-qualified proof.

## Scope and owners

Traceability: bounded T38.2/T09/T06/T07/T35; P05/P06/P10/P14/P33/P38;
US07/08/11/12/24/25. Existing UXR01/02/03/04/06 and UX01/02/03/05/06/07/09/11
describe preserved interaction context, not new presentation or native acceptance.

| Owner | Bounded responsibility |
| --- | --- |
| [task-collaboration-schemas.ts](../../packages/contracts/src/task-collaboration-schemas.ts) | References, page envelopes/capabilities, checklist, comments/review, safe changes/history, close warning and schema-derived public types |
| [task-collaboration-input-schemas.ts](../../packages/contracts/src/task-collaboration-input-schemas.ts) | Seven strict mutation bodies, full command schema/types, scalar action selector and collaboration HTTP query admission |
| [task-collaboration.ts](../../packages/contracts/src/task-collaboration.ts) | Five original compatibility signatures plus the new comment-review guard; returns predicates over original objects |
| [task-collaboration-input.ts](../../apps/api/src/projects/task-collaboration-input.ts) | Stable staged Nest errors, own-enumerable payload copy and normalization; no policy or persistence |
| [task-collaboration.service.ts](../../apps/api/src/projects/task-collaboration.service.ts) | Existing application/transaction/DTO/cursor owner; delegates mutation shape parsing and retains the existing per-element activity filter |
| [project-task-http.ts](../../apps/api/src/projects/project-task-http.ts) | Collaboration query selection and removal of unreachable migrated-mode fallback clauses; existing protocol/security order |
| [client](../../apps/web/src/lib/project-task-client.ts) and [proxy](../../apps/web/src/lib/project-task-proxy.ts) | Canonical comment-review/query admission, original response identity, requested scope, fixed destination, serialization and safe failures |

The five original exports are `isCollaborationCommand`, `isCloseWarning`,
`isActivityChange`, `isTaskComment` and `isCollaborationPage`. The original private
record/identifier/count/date/reference/provenance checks and `CollaborationTarget`
are owned by the new schemas. `TaskReference`, generic `CollaborationPage<T>`,
the five page members/map, checklist/comment/review/activity/change/warning types,
`CreateTaskFields` and `TaskCollaborationCommand` retain their public shape.
The three collection/action/field tuples remain canonical. Generic/map narrowing,
optional presence and broad `ActivityChange` values retain strict bidirectional
type equivalence; no output cast supplies enum soundness.

API service, client, project controller and hook are the direct production guard
consumers. Indirect consumers include collaboration state, detail sections,
content forms/recovery, `ProjectCommand`, revision/append handling, conflict
review/rebase and same-key unknown-outcome recovery. Existing G02/discovery,
client/controller/hook/recovery and real HTTP suites remain in their actual
selections. G06/G07 have no direct G04 guard dependency and are not migrated.

G02 supplies `domainPersonSchema`, the complete `taskSchema` including creator
correlation, Task fields and categorical enums. G04 refines the accepted
provenance fields without changing G02 itself; G05 identifiers and the existing
safe version/dense-array helpers are reused where their semantics match. There
is no second Task/person definition or unrefined Task export. G03's narrower
Sprint chronology/provenance rules are not imported.

## Compatibility and explicit corrections

`isCollaborationCommand` remains a **discriminator-only selector**, including
partial `{type}` staging calls. It is not full command validation. The separately
named full command/body schemas do not replace controller/hook draft selection.

Requests retain exact command keys, required/optional presence, positive safe
versions, nullable parent/destination rules and parent-version/checklist-edit
correlations. Checklist text uses the original pretrim UTF-16 limit 500,
nonblank/single-line/no-NUL policy and trimming. Comment input uses UTF-16
limit 10000/no-NUL/nonblank checks, retaining multiline content and original
whitespace. The adapter preserves this error order: operation/item identifier;
object allowlist/required key; expected version; present text; comment text,
blankness and comment version; checklist change; destination; parent/version.
Normalization and the original idempotency payload stay unchanged.

Response snapshots remain broader than request bodies: empty/whitespace text,
legacy parseable dates, date-format-only due dates, nullable fields and the
existing family-specific identifier/string bounds remain. Versions/order values
are safe integers. Pages retain limit 100, total-at-least-length, nullable bounded
cursor and relations `archivedOpen <= open <= total`; warnings require positive
open/children version. Duplicate rows/fields/changes remain accepted. No new
chronology, anchor-membership, checklist count-equality or actor-kind/mode rule
is added. History action/field discriminators were already primitive checks;
the separate G06 action coercion remains deferred.

The coordinator explicitly approved two corrections:

1. **JSON-visible malformed response correction:** G04 mode must be a primitive
   scalar. Arrays such as `["delegated"]`/`["autonomous"]` formerly passed
   `String(...)`; they now reject. Boxed/custom-stringifiable non-JSON modes
   also reject. Valid scalar actor/source/grant combinations retain their
   correlation, including history-only System/internal/null snapshots.
2. **Non-JSON array correction:** public page items and history fields/changes
   reject holes. Populated inherited numeric indices and ordinary array extras
   retain the existing dense semantics. No blanket own-field/prototype rule is
   introduced.

Comments continue accepting human **or Agent** authors and exclude System;
history supports human/Agent/System. Immutable server-resolved authorship,
own-author editing, current authority and historical scalar combinations remain.
The dispatch's initial human-only wording was corrected against P38/US24 and the
existing autonomous-comment API evidence; no MCP channel or administration is added.

**Validation copy versus response identity.** G04-owned response schemas strip
unknown keys only from their temporary successful parse data. Guards continue
accepting allowed extras and narrow the original input; transports return that
same response object. They do not return the stripped copy. This prevents newly
evaluating ignored own/inherited enumerable getters while retaining known
inherited/hidden reads, descriptors and original extras. Shared G02 Task/person
behavior and the broader client `CreateTaskFields` schema are unchanged. Future
direct G04 schema consumers must choose this parse-copy behavior explicitly.
Strict ActivityChange/request/query policies remain separate.

Transport retains header/path/query/body/origin/authority ordering, body-parser
ownership, same-origin credentials, no-store, fixed proxy destination, cookie
renewal, abort/deadlines and stable error fields. No browser response-byte cap
or proxy body buffering is added. Comment review retains Task validation/scope
rejection before reading comment content, then exact requested comment identity.
Controller detail/page revisions, conflict/retry/draft recovery, confirmed save
versus failed refetch and original-key unknown-outcome intent remain unchanged.

The [PR61 maintenance disposition](https://github.com/Ljrr3045/rielia/pull/61#discussion_r4687914989),
[owned under issue53](https://github.com/Ljrr3045/rielia/issues/53#issuecomment-7147342867),
is implemented locally: unreachable discovery and already-schema-selected
project/cursor/task fallback alternatives are removed coherently. Reachable
events/sprints/close-preview/no-query behavior and canonical discovery selection
remain. Rejection-before-authority regressions and source-bound HTTP parity
protect the order; the earlier nonblocking disposition is not rewritten as a fix.

## Private and deferred boundaries

Persisted activity changes reuse only the existing
`Array.isArray(row.changes) ? row.changes.filter(isActivityChange) : []` boundary.
Nonarrays become empty, invalid elements are filtered, legacy empty changes and
private metadata omission remain. The public max 4 is not imposed on stored
arrays. No whole-row JSON or receipt migration is claimed.

Collaboration cursor decoding stays in the service's authorized task read:
base64url alphabet/limit 2048, exact `{v,w,p,t,k,r,a}`, v1, workspace/project/task/
collection binding, safe positive revision and identifier anchor. Malformed
context gives 400 before stale revision gives 409 `page-changed`; anchor lookup
remains scoped and checklist rejects paging anchors. Encoding, policy and
transactions are unchanged. Unit witnesses do not replace real SQL proof.

Other opaque owners remain `project-task-read.ts`, `task-discovery.service.ts`,
`sprint-read.ts`, `sprint-scope-read.ts` and `sprint-close-preview.ts`. Other
persisted owners remain workspace/task/sprint/scope-start/close receipts,
planning-history snapshots and frozen outcome snapshots. G06/G07 and every
C01–12 configuration/tooling owner remain separately accounted in the
[inventory](t38-boundary-inventory.md), without blanket exclusions.

## Source-bound validation and numerical approval

Direct Node24.22.1/pnpm12.15.0 frozen application/tools installs retain the lock,
age/peer/lifecycle policy. Initial sandbox DNS retries were interrupted at130;
the unchanged network-authorized frozen install passed. Scratch compiler
CommonJS context was corrected to explicit ESM probe emission. A retained
G04 coercion expectation changed only under the approved correction; G06 stays
unchanged. Test-global qualifications and an inadvertently started/interrupted
measurement retain their failure/stop receipts.

24 strict bidirectional comparisons pass. The finite guard differential has 1042
cases: 1023 identical, 6 JSON mode corrections, 6 non-JSON mode corrections and 7
sparse corrections. The 404 input and 1026 HTTP cases match the source-bound original.
The five-case ignored-getter witness first reproduced four throws, then passes
with zero reads after the authorized stripping repair. Direct review/query and
retained malformed/scoped/revision/authorized-anchor cases supplement existing
real service/client/controller/hook checks.

Proposal 1 passes 808 cases but fails protected floors and per-file gates.
Candidate 2's API 310 passes aggregate floors but retains a per-file branch-ratio
failure after removing the obsolete text helper. The independently approved
internal `object()` required-key parameter now requires its array explicitly;
all 17 production calls across 53 source files already provide defined lists.
Caller code, helper body and other exports are byte-preserved. Removing 3 covered
lines/3 statements/1 function/10 text branches and 1 unused uncovered default
branch is structural deletion accounting, not new coverage. The defensive final
schema-admission branch remains explicit unexecuted API debt.

Approved proposal 3 combines source-qualified API 310/contracts 58/web 424 runs and
independently bound prototype 19 reuse; it is not a coherent aggregate run.
All 696 retained-file metric ratios/uncovered counts preserve or improve. No
source is excluded and no dependency-internal counter receives credit.

Floors are integer basis points: 10000 means 100%.

| Current scope | Adopted SHA-256 | L/S/F/B floors |
| --- | --- | --- |
| API | `80f8c24dadd8b0273ea1e347d9a3c489fe57d03fe2d0c4802e1fda23ed36eeba` | 7462/7446/7128/7510 |
| Web | `613eddd4a50f9acb0490c1e2c2c9e35c6cd5d2b229584211f71dc56293ddb5fe` | 7288/7067/6166/6700 |
| Contracts | `779e06131b06e1d4eeed52515e7691b116b5eceaede7c0a4d4762ad313928cc0` | 10000/10000/10000/10000 |
| Prototype, unchanged | `aa02ac448391cc4bc3ab4bb748f25b6ca631c7297d10d813c5e72d64ae2b7541` | 2790/2733/2364/2033 |

Prototype and four historical baseline bytes remain untouched. Inventories are
54/88/19/16 with type-only N/A and unexecuted owners retained. Unchanged raw
mapped units remain API2884/web8996/contracts855/prototype550 with zero losses or
map differences. Nullable endpoints remain explicit:188/10348,543/30552,
17/2422 and69/5348 respectively. Original G04 B139/140 becomes measured schema/
facade B59/59; deleted guarded units are not library coverage.

One fresh coherent normal run passes **811/811**:API 310/web 424/contracts 58/
prototype 19, no failures/skips/cancellations. All 16 report hashes/sizes exactly
reproduce the approved candidates. Actual digest is
`7771e2357ad8fdcec402da68f32b3884dcd6b0c7fedfcd4d1fa2fe15700e3a9e`;
normal identity is
`2a5a5660560173ac34e06ba5e260bda5039a2372155c5c8d14b331b0dd043c3e`.
Infrastructure 20/20 and 17 bounded artifact files / 2940066 bytes pass without upload.
Later integration/documentation does not rebind these measured sources/runs.

## Integration status and limits

Standard validation is a **resumed equivalent sequence**, not uninterrupted
`pnpm check`. Formatting/quality 24/lint, no-Express closure 286, cleanup 1,
identity 5/workspace 13 logic, projects 161/prototype 19 and all consumer typechecks
pass. Three initial sandbox listen-EPERM cases pass in canonical real HTTP 6
after loopback permission. Contracts/API build and web compilation/TS/static
generation finish before the inherited Next16.4.3 `SecurityFatalError`; the one
coordinator-approved identical web-only retry passes, then missing MCP build,
MCP 17 and final smoke pass. **Next's security recommendation remains unresolved.**
No upgrade, suppression or advisory remediation is claimed.

Selected real PostgreSQL/NodeAdapter HTTP **57/57** passes: 33 project/task,
12 collaboration and 12 discovery cases. The selector omits unrelated identity/
sprint/default DB-restart tails; it does not replay or accept full original T11.
Exact live labelled container/volume identities were captured and their removal
verified after the harness completed, preserving pre-existing Docker identities.

One runtime run passes in 161321ms: frozen multi-stage/nonroot packaging, complete
deployed API/worker/migration no-Express closure, migration gating/repeatability,
readiness/liveness/DB recovery, locked-query/SIGTERM cleanup and durable diagnostic
restart. Identity stays disabled. The exact project containers/networks/volume
and three unique image tags are absent; private source probes are gone and
pre-existing resources remain. Shared images/cache were not pruned.

Both high-severity audits pass: application one low/fourteen moderate, unit tools
two moderate, zero high/critical. These observations do not remediate Next.
After integration, all 244 physical unit inputs, original 15 working source files,
eight adopted/protected baselines and 16 normal report identities remain exact.
Later documentation and local delivery do not rebind those measured sources.
Hosted CI/native review/acceptance remain coordinator gates.

No production task/UI redesign, permission/transaction/DB/workflow/SSE producer/
cache change, Query/RHF/OpenAPI installation, credentials or deployment. Native
Cancel/Leave stays user-omitted **UNVERIFIED with possible draft loss**; sprint
filters stay T08/T10/US05 debt. Full US05/P08/T08/T10 and US12/device/accessibility/
provider/staging/real-user conformity remain separate. The pinned pnpm-action
Node20/forced-Node24 warning and audit maintenance remain separately owned.
Production bundle/request cost comparison is unmeasured. Source-bound logs,
original failures, proposals and receipts are retained under ignored
`coverage/t38-collaboration-schemas/` for coordinator preservation.
