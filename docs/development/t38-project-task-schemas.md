# T38.2c project, task and access schemas

**DRAFT PR60; LOCAL VALIDATION COMPLETE; CURRENT-HEAD CI/NATIVE REVIEW PENDING,
2026-11-24 America/Caracas.** The coordinator published
[Draft PR60](https://github.com/Ljrr3045/rielia/pull/60), targeting `dev`, at initial
implementation head `6757bac82e90eae89b21d5461f80a838a8d35572` (tree `4c60c0b1`).
This is the coordinator-released H05–22/G02 and bounded X03 slice of
[T38/issue 53](https://github.com/Ljrr3045/rielia/issues/53), based on
`c655f0f04fdc6750a69d63ddcbfb0178d23d88d7`. T38.2c is not yet accepted; full
T38.2/T38 and adjacent product tickets remain open. Current-head hosted CI/native
Kilo, feedback/ownership/base checks and final acceptance remain coordinator
gates. This documentation-only reference batch preserves the original source/run
identities below and replays no application suites.

The predecessor [T38.2b is ACCEPTED in PR59](https://github.com/Ljrr3045/rielia/pull/59#issuecomment-7122689772):
reviewed `d9699cf23cad09dea336c89ce7f398b3654a0a03`, merged `c655f0f0`, identical
tree `08a8a7c705093e46c78a72d5b839fb9efd87266b`. Reviewed-head
[CI45328949033](https://github.com/Ljrr3045/rielia/actions/runs/45328949033/job/138225165730)
and exact-merge
[CI45331394020](https://github.com/Ljrr3045/rielia/actions/runs/45331394020/job/138233200850)
passed 24 steps each; native Kilo completed a clean 37-file review. The settled,
clean predecessor checkout was removed through Orca with its branch retained;
the coordinator preserved its 93 foreign main-checkout entries. These are reused
coordinator receipts, not rerun predecessor evidence. [Its dated local receipts](t38-workspace-schemas.md)
retain their original source/run identities.

## Scope and canonical owners

Traceability: T38.2, bounded T06/T07/T08/T35; P02–08/P10/P38;
US02–05/US07/US11–12/US24–25. Existing interaction and recovery behavior remains.
The [finite inventory](t38-boundary-inventory.md) defines the 18 operations:
project list/create/detail/edit/archive/restore/visibility; access list/change/
review and eligible assignees; task list/create/detail/edit/move/archive/restore.

- Contracts [project-task-schemas.ts](../../packages/contracts/src/project-task-schemas.ts)
  owns person/provenance/capabilities, project/task/field/filter/count DTOs and
  project/task/access/assignee/review envelopes. Public types derive from
  `z.output` and the existing `KnownFields` projection. `DomainPage<T>` retains
  a schema-derived interface, including original chained predicate narrowing.
- [project-task-input-schemas.ts](../../packages/contracts/src/project-task-input-schemas.ts)
  owns eight strict command-body schemas and three query schemas, explicit text/
  date normalization and `z.input` request aliases. Commands retain their existing
  selectors, discriminators and optional field surface. These two cohesive leaves
  import Zod/direct siblings, never Nest, Prisma or the contracts barrel.
- [project-tasks.ts](../../packages/contracts/src/project-tasks.ts) retains URLs,
  command composition and the six original schema-backed G02 guards. Four new
  typed guards cover project pages, access pages/reviews and assignee pages.
  Migrated handwritten guards are removed; there is no legacy fallback.
- API [project-task-input.ts](../../apps/api/src/projects/project-task-input.ts)
  provides named adapters with the original error precedence/messages and converts
  validated due-date strings to backend Dates. Generic `object`, `text`, `expected`,
  `identifier` and `canonical` behavior remains for its other-family callers.
  `project-task-command.ts` retains policy and mutation callbacks; service, reads,
  DTO mapping, verified execution, locks and atomic journal/outbox ownership stay.
- `project-task-http.ts` uses the shared query schemas only for owned project,
  member-page and task-list modes. Other discovery/SSE/sprint/collaboration modes
  retain their existing checks. [The browser transport](../../apps/web/src/lib/project-task-client.ts)
  consumes schema-backed guards, preserves original objects/extras before scope
  checks and removes four relevant envelope casts. Error fields remain validated
  independently, preserving valid code/access/close-warning fields when current
  is malformed. No wholesale transport extraction or outbound API middleware is
  introduced.

Zod remains the already declared **4.6.7** edge. No dependency, lock, production
compiler, provider, mirror, lifecycle, release-age or global configuration changes.
Five new source/test/helper inputs join maintained formatting. The existing
type-only helper remains explicitly zero-unit N/A, not excluded or called 100%.

## Deliberate compatibility decisions and retained rules

The coordinator explicitly approved three corrections after reading the complete
caller scope; earlier Sprint-only permission did not authorize them:

1. `DomainPerson.kind` is now strict scalar human/agent globally through G02;
   G02 project/task provenance mode and source also require scalar enums. Arrays
   such as `['human']` are malformed **JSON wire** responses newly rejected.
   Objects with custom `toString` are a separate non-JSON correction. Valid
   producer values, actor-equals-creator and broad grant/source combinations stay.
2. Known optional `DomainPage.capabilities.canCreatePrivate` must be boolean if
   present. Omission/true/false remain valid; null/nonbooleans and non-JSON present
   undefined reject. Arbitrary response extras remain accepted. No entity-level
   capability or new permission rule is invented.
3. Task-page arrays must be dense. Sparse holes are non-JSON-only correction:
   serialized dense null entries were already invalid. Generic pages were already
   dense after PR59. Duplicate task rows remain compatible.

The release considered every direct shared-person/provenance consumer at the
base: contracts `task-collaboration.ts` and `task-planning.ts`; API
`project-task-read.ts`, `project-task-dto.ts`, `task-collaboration.service.ts`;
web `project-task-client.ts`, `project-task-controller.ts`; presentation
`task-view-bar.tsx`, `project-content-dialog.tsx`, `projects-view.tsx`,
`task-forms.tsx`, `project-recovery.tsx`, `task-detail.tsx`.
G04 comment/history guards and G06 planning-history guards consume the shared
person; G05 discovery delegates nested task validation to G02. Actual collaboration,
comment-review, discovery and task-history transports test these consequences.
Additional provenance projections/labels remain in collaboration service,
`sprint-scope-read.ts`, task comments/history and sprint history. Accepted Sprint
schemas/readers/integration labels retain their independent stricter schema.
No presentation code changes.

**G04/G06 private mode/source/action checks remain deferred and partly coercive.**
Those complete DTO families are not claimed sound or migrated merely because
their person dependency changed. The dated Sprint regression now records this
later explicit G02 decision; preserved old-source witnesses retain legacy behavior.

Requests retain strict keys, presence/null distinctions, safe positive versions
and raw UTF-16 bounds before required text is trimmed. Project/task names reject
CR/LF/tab/NUL; optional descriptions preserve whitespace/line breaks and reject
NUL. Create nullish descriptions default empty; create undefined enum fields use
existing defaults. Omitted edit fields preserve values, explicit nullish assignee/
due-date fields clear, and undefined nonnullable edit fields reject. Parent
correlation, acknowledgment and move/version error order are unchanged. Input
date-only values retain Gregorian/nonzero-year round trips; canonical hash inputs
and backend Date conversion remain identical.

Outputs retain broad strings, including empty IDs/names/URLs where previously
accepted, finite `Date.parse` dates, format-only task due dates, extra keys and
existing null fields. No Sprint grant/chronology/identifier rule is imported.
Project/access/assignee pages remain unbounded and duplicate tolerant with any
nonempty cursor. Task pages retain their 100-row bound, revision equality,
2048-character cursor, selected person and count-sum rules; transport retains
workspace/project/task/filter checks. No assignee-ID correlation or uniqueness
constraint is silently added.

HTTP/header/path/query/body/origin/key/context precedence, cookies, safe request
IDs, duplicate-query proxy admission and no-store remain. Project body parsing
still follows verified web context. Schemas do not establish WeakMap execution
trust, access ceilings, privacy authority or current membership. Transactions,
numbering/ranking, versions, idempotency, activity/outbox and SSE policy stay.

## Source-bound local evidence

Frozen app/tools installs pass on direct verified Node24.22.1/pnpm12.15.0; existing
Prisma preinstall/linked-worktree prepare retain their original policy. No project
`pnpm exec` discovery or skill approval is used. Contracts/API builds pass.
The first scratch type probe failed to resolve Zod in its preserved legacy tree;
the released scratch-only declared-dependency link/config correction passes.
Production compilation/configuration was unchanged. Actual strict TS6 proof covers
26 bidirectional DTO/command comparisons, generic/interface/union narrowing,
no index signatures and optional/scalar inference.

The focused retained/new run passes **203/203**. A test-fixture placement adjustment
fits existing finite mirror rules without changing the pipeline; 15 affected cases
pass. Source-bound before/current witnesses verify 48 scalar cases, 10 malformed
private-capability cases, one sparse-array case and 26 actual task-field
normalization/error comparisons, with valid controls. These categories are not
added into a fictitious number of unique DTOs or product journeys.

Standard validation completes as a **resumed equivalent sequence**, not an
uninterrupted `pnpm check`. Formatting/24 quality cases pass before one test-only
unqualified `structuredClone` lint failure; the released `globalThis` qualification
passes full lint. Backend closure286/no-Express, cleanup1, identity5, workspace16,
project156, prototype19, web integration6 and all consumer typechecks pass.
The root identity-logic contracts-build prerequisite is preserved.

Recursive build passes contracts/API and web compilation/TS/static generation,
then stops on inherited Next16.4.3 `SecurityFatalError`. One coordinator-authorized
identical web-only retry passes, followed by missing MCP build, MCP17 and final
smoke. Original failure/retry receipts remain. **Next's security-upgrade
recommendation is unresolved**; no upgrade, suppression or remediation is claimed.

## Numerical proposal, approval and actual normal proof

Proposal one measures **782/782** coherently but is rejected: new contracts
description-refinement debt fails protected 100% L/S/F floors, removed covered
G02 branches fail the retained branch floor, and two API per-file ratios regress.
No baseline is written. The coordinator releases only meaningful tests for actual
description schemas, public project creation/hash/journal ports, retained
collaboration text rejection and G04's migrated type/priority enum dependencies.
Affected formatting/lint and **46/46** cases pass; no production changes occur.

Proposal two combines independently measured API305/contracts43 with unchanged,
fingerprint-verified web419/prototype19 reports from proposal one. It is not a
second coherent all-scope run and invents no execution status/digest. Independent
approval binds comparison SHA-256
`bf0b6cf306b92dbc5ed3f6ce3eccf0d7e1b1d932db006ca12f65a715b2cd86f3`
and 15-file source/test snapshot
`b68fadaf235d24d6baab349c6d608591a703687a4fed34b1a85277862ad0a10f`.
All 237 physical fingerprints, one explicit synthetic compiler-metadata witness,
32 accepted/candidate report hashes and eight old baselines are verified.

Only these exact current baseline bytes are adopted:

| Scope | Approved SHA-256 |
| --- | --- |
| API | `38492e6ca884f4e09f4f915273b35457d520b00dd6a395d6f126561d8703c449` |
| Web | `52f8d649200225016fab2baf524032efe087b96133e13b6e56bc2b437bf3cf29` |
| Contracts | `9eb44a42ad7f3ebc9b87e36dfc2eedea3dc0e2302760e04330013f18be1ba2a3` |

Prototype `aa02ac448391cc4bc3ab4bb748f25b6ca631c7297d10d813c5e72d64ae2b7541`
and all four historical baselines remain byte-exact without writes.

| Scope | Lines | Statements | Functions | Branches | L/S/F/B floors, basis points |
| --- | --- | --- | --- | --- | --- |
| API | 1526/2085 | 1664/2280 | 426/605 | 1247/1712 | 7318/7298/7041/7283 |
| Web | 3582/4935 | 3946/5607 | 835/1354 | 4644/6959 | 7258/7037/6166/6673 |
| Contracts | 296/296 | 325/325 | 149/149 | 573/575 | 10000/10000/10000/9965 |
| Prototype | 238/853 | 269/984 | 87/368 | 194/954 | 2790/2733/2364/2033 |

Every retained file's exact ratio/uncovered count preserves or improves; no floor
decreases. Inventories are API53/web88/contracts16/prototype16, with no source
removal. G02 ownership moves from fully covered L27/S30/F19/B106 to fully covered
L78/S83/F33/B20 across facade/two leaves. Fewer handwritten branch units do not
claim dependency-internal coverage. Two old G04 archive/checklist branches remain
uncovered; type/priority branches now execute. API input/helper and command
function regressions are corrected through real boundaries. Changed command
covered counts shrink with extraction; combined input/command/HTTP owner changes
L196/215→217/221, S212/233→234/240, F37/40→48/48, B203/258→196/233.

Unchanged-source mapped S/F/B coverage retains API2855→2859 (public creation and
blank-comment rejection), contracts909→911 (two enum branches), web9126 and
prototype550 exact. There are zero lost covered units or map differences.
Changed-source counter semantic identity is not asserted. Nullable mapping
endpoints remain explicit: API188/10404, web543/30548, contracts21/2396,
prototype69/5348. Existing type-only N/A, unexecuted owners and tool/compiler/
provider/config identities stay visible; no source exclusion or library credit.

One fresh actual normal all-scope `--built` run passes **786/786**, without skips:
API305/web419/contracts43/prototype19. All 16 actual report hashes/sizes reproduce
proposal two exactly; all four actual statuses complete. Actual count digest:
`7dbc37e16d78094b035ea1ad1aa514c76febf466dbb7bc5b9e58a7e3dc282c09`.
Infrastructure passes **20/20**; bounded artifacts validate **17 files /
2939072 bytes**, without upload. Normal identity SHA-256 is
`f40716febf4596e37e93d93c0ca516dad36fa1ccb45d740fa7eb8d8ff355eed6`.
Subsequent integration/docs changes do not rebind these source-qualified runs.

## Real HTTP, runtime and operational receipts

The integration-only standalone `node scripts/test-identity.mjs --projects`
selects existing project/task, collaboration and discovery suites after current
contracts/API builds. Nine unknown/repeated/mixed flag probes reject before
temporary-directory or subprocess setup. Default full CI and prior selectors
retain their behavior; projects mode skips the unrelated DB restart/identity
tail, as do the existing bounded selectors. The
existing project suite still exercises its own Nest restart. This is not full
T11 or domain DB-restart acceptance.

The first attempt fails before Docker volume creation because the ignored local
runner omitted Docker's `/usr/local/bin` location. Its exit1/55ms is not DB
evidence. The released local PATH-only correction preserves pinned precedence;
read-only preflight verifies Docker29.9.3 and no identity-labelled resources.
No global/daemon/project configuration changes or broad cleanup occur.

One corrected PostgreSQL18.6/NodeAdapter run passes **57/57**, without skips:
project/task33, collaboration12, discovery12. Added serialized schema assertions
cover canonical normalized creation/same-key retry and project/task/access/
assignee readbacks through current returned versions/order. One estimate/history
read validates the real G06 human actor without replaying sprint lifecycle.
Existing two-tenant/private/viewer/grant/revocation, race/replay/rollback/order,
admission and committed-session SSE assertions remain. Generated local sessions
use no real provider credentials. Labelled container/volume cleanup is verified.

One existing Docker runtime run passes in 149815ms: packaging/nonroot execution,
migration failure/repeat/schema gates, real locked-query/SIGTERM cleanup,
readiness503 versus liveness200 and recovery, diagnostic durability across stack/
DB recreation and worker restart. Complete deployed API/worker/migration stores
contain no Express. Inherited Prisma/Studio tooling peers remain; migration also
retains TypeScript. Identity stays disabled; no business worker/deployment or
provider acceptance is inferred. Its exact containers/network/volume/image tags
are removed; shared Docker bases/cache are not pruned.

Root/tools high-severity audit gates pass, retaining application one low/fourteen
moderate and tools two moderate findings. These snapshots and a successful retry
do not resolve Next's recommendation. After integration-only edits, all 237
unit fingerprints, all eight baseline hashes and all 16 normal reports remain
exact. Integration-file hashes have their own receipt. Timings are observations,
not performance improvements; production cost comparison remains unverified.

## Remaining owned boundaries and delivery limits

X03 discovery/collaboration command/collection/comment-review/close-warning
shapes remain later owners except approved nested G02 consequences. H49–50/G05/
X06 discovery/SSE, H36–48/G04 collaboration, H23–29/H51–54/G06–07 scope/start/
close/history, encoded cursors and local navigation/form state are not migrated.
Accepted Sprint and workspace/identity slices retain their bounded ownership.

All eight private JSON owners remain assessed deferred: workspace service,
project-task mutation, sprint mutation, sprint-scope mutation, sprint close,
collaboration activity changes, sprint-scope history snapshots and sprint-closure
frozen snapshots. Locator replay reloads current authority/content; a full public
DTO schema cannot replace historical sparse ID formats. No receipt hardening or
trusted-context reconstruction is smuggled into public schema parsing.

Configuration C01–12 remains named debt in the inventory: identity config;
runtime DB/enablement/migration/worker; HOST/PORT; fixed upstream proxy/SSR;
MCP origin; Prisma config; diagnostic arguments; queue payload; heartbeat;
build/manifests/peers; Compose/Docker/env templates; quality/unit/CI/hooks/import
tooling. These are sequencing decisions, not accepted blanket exclusions.

No new package/pin, Query/RHF/OpenAPI/generated client/testing/browser/diagnostic
stack, UI redesign, database migration, real-provider/staging/user acceptance,
credentials or deployment is included. Omitted native external Cancel/Leave stays
**UNVERIFIED with possible draft loss**; filters remain T08/T10/US05 debt.
Full US05/P08/T08/T10, US12/device/accessibility conformity remains separate.
Ignored source-bound receipts live under `coverage/t38-project-task-schemas/`;
the coordinator preserves them for publication. Local checks do not accept a PR,
full T38.2/T38 or universal source conformity.
