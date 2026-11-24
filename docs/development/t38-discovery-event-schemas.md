# T38.2d discovery, query and invalidation schemas

**DRAFT PR61; LOCAL GATES COMPLETE; CURRENT-HEAD CI/NATIVE REVIEW PENDING,
2026-11-24 America/Caracas.** The coordinator published
[Draft PR61](https://github.com/Ljrr3045/rielia/pull/61), targeting `dev`, at initial
implementation head `b704c1e23ed8bc293970f3fb62d801430de94cab` (tree
`05a3cee17ff2a085b911fd8140048426ce2301be`). This documentation-only reference
batch retains the original source/run/failure identities below and replays no
application suites. This coordinator-released slice of
[T38/issue 53](https://github.com/Ljrr3045/rielia/issues/53) covers H49–50/G05,
discovery X03, X06 event validation and discovery-only API HTTP/X09 query
admission is not yet accepted. Full T38.2/T38 remains open. Current-head hosted
CI/native Kilo, feedback/ownership/base checks and final acceptance remain
coordinator gates.

The base is accepted [T38.2c/PR60](https://github.com/Ljrr3045/rielia/pull/60#issuecomment-7125188276),
reviewed `fdd0450b1fa8f1ee868bd87375b9a8aa59d2e585`, merged
`8c7e897bcfb47502d844c151c9fc2c5f4f5e0d4f`, identical tree
`adcd0147a18da5aa73a8acfb2be6cfd0ec175b6f`. Reviewed-head
[CI45346536704](https://github.com/Ljrr3045/rielia/actions/runs/45346536704/job/138282481671)
and exact-merge
[CI45349417965](https://github.com/Ljrr3045/rielia/actions/runs/45349417965/job/138291825734)
passed 24 steps each; native Kilo round `a29c7df5-9106-476c-af04-6355a4f17683`,
check138288110677, was clean across 29 files. Its settled clean checkout was
removed through Orca, with branch/evidence retained and 93 foreign coordinator
entries preserved. These predecessor receipts are reused, never rerun or rebound.

## Scope and schema ownership

Traceability: T38.2, bounded T10/T07/T35; P02/P03/P05/P08/P10/P11/P14/P33/P38;
US02/03/05/08/12/25. UXR01/03 and UX01/03/05/06/07/09/11 describe preserved
interaction context, not new presentation or native acceptance.

- [task-discovery-schemas.ts](../../packages/contracts/src/task-discovery-schemas.ts)
  owns identifier/search, structured query, raw parameters, HTTP admission,
  discovery page and strict discriminated invalidation schemas. Public DTOs
  derive from `z.output` and `KnownFields`; optional fields and union narrowing
  retain their previous surface without string index signatures.
- [project-task-schemas.ts](../../packages/contracts/src/project-task-schemas.ts)
  privately names the existing unrefined Task object. Both public `taskSchema`
  and derived `taskDiscoveryItemSchema` explicitly apply the same private
  creator-correlation refinement. No unrefined Task validator is exported and
  no second Task field definition is maintained. The item schema checks original
  description presence before reproducing the enumerable Task projection and
  direct `projectName` read.
- [task-discovery.ts](../../packages/contracts/src/task-discovery.ts) retains all
  six G05 signatures: `discoveryIdentifier`, `isTaskSearch`,
  `isTaskDiscoveryQuery`, `parseTaskDiscoveryQuery`, `isTaskDiscoveryPage` and
  `isTaskInvalidation`. Boolean guards preserve original objects/extras; the raw
  parser returns the schema-derived query or null. There is no legacy fallback.
- [project-task-http.ts](../../apps/api/src/projects/project-task-http.ts) selects
  shared HTTP admission only for discovery. The
  [proxy](../../apps/web/src/lib/project-task-proxy.ts) consumes that schema
  without changing duplicate-key admission, fixed upstream, other route modes,
  headers, cookies, no-store, body or authorization order. Validation still maps
  to existing errors, never raw Zod issues.

X03 and X06 retain their transports and consume the migrated guards. API
controller/service/read mapping, event producer, URL/controller/hook/sprint
owners and presentation retain their existing responsibilities. Type consumers
and indirect G02/collaboration callers are covered without migrating their DTO
families. Zod remains the existing direct **4.6.7** dependency; no package, lock,
runtime/compiler/provider or peer/age/lifecycle policy changes. Three new
source/test files join maintained formatting.

## Exact retained boundaries and intentional corrections

Search accepts at most **100 UTF-16 units before trimming**, rejecting C0
characters and DEL only. Empty/whitespace, literal percent/underscore, C1 and
unpaired UTF-16 retain their old meaning. Identifier inputs use the original
1–128 alphabet. Structured query/filter objects remain strict, with mine
forbidding assignee presence and present undefined/null project IDs rejected.

Raw parameters admit scope/q/view/project/status/assignee/priority/cursor.
Nullish scope/q/view default to search/empty/active; project and filters retain
presence semantics. **Raw cursor is admitted, ignored and not validated.** The
separate HTTP schema preserves undefined-or-valid view/cursor admission, rejects
null, and bounds cursor alphabet/length to 1–2048. It does not decode cursors.
Service normalization still trims q and sorts filters after validation.

Discovery retains loose response extras, strict echoed query, workspace/principal
identifiers, lowercase hex64 revision, at most 100 items, row workspace equality,
unique row IDs, safe total at least row length and null-or-bounded cursor. G02's
broad Task strings/dates/grants, strict nested kind/mode/source and creator
correlation remain; no stricter Task IDs, chronology or assignee correlation is
introduced. `description` must be absent even if undefined, inherited or hidden.
Transport retains requested query/workspace/project/view/filter correlation and
mine's returned-principal assignment check, using original response objects.
Controller revision/total/context binding and changed-page recovery remain.

Three non-JSON corrections were explicitly released:

1. Discovery arrays must be dense. A legacy single sparse hole is rejected;
   dense JSON null/undefined entries were already invalid.
2. Every event protocol field must be an own enumerable string key of its exact
   alternative. Prototype substitutions and hidden/inherited required fields
   reject. Symbols and unrelated inherited/nonenumerable extras retain legacy
   `Object.keys` treatment; no blanket prototype ban is added elsewhere.
3. The raw parser rejects nonrecord runtime arguments with controlled null.
   Its public `Record` signature, ordinary/null-prototype records and typed-record
   property semantics remain. No additional inherited-key discrepancy is adopted.

Events remain reset, heartbeat, denied(signed-out/forbidden), or invalidate with
task/project entity, bounded IDs and positive safe version. No event becomes a
DTO or mutation-success authority. Streaming UTF-8/framing, decoded buffer/frame/
line bounds, idle and handshake/body deadlines, Last-Event-ID, current-access
revalidation, opaque resume state, backpressure, cancellation, reconnect and
cleanup remain. The single session/workspace stream, scope matching, heartbeat
no-op, reset/denial, pending-write coalescing, stale preview, captured draft/version
and exact-key unknown-outcome recovery remain unchanged.

## Source-bound proof and preserved failures

Direct Node24.22.1/pnpm12.15.0 were verified before frozen app/tools installs.
The first app install failed registry DNS; its one released retry succeeded.
No project `pnpm exec` discovery or policy workaround was used. Initial contracts
compile failed private pipe inference/unknown narrowing; the approved return
annotation and record check corrected composition without public type weakening.
Original source/logs and successful affected compile remain preserved.

Strict compilation proves 21 bidirectional DTO/signature/optional/discriminated/
no-index comparisons, including unchanged Task types. Exact old contracts sources
compile in their declared Zod package context. A 432-case differential has 391
unchanged outcomes and 41 approved non-JSON differences: two sparse cases,
32 event-key substitutions and seven nonrecord raw-parser outcomes. Source-bound
old/current HTTP probes match 131 admission/error/callback/header cases.

The initial focused attempt reports 191 passes, two new controller-fixture
constructor-order failures and one unchanged hook module-admission failure.
The released fixture-only argument swap passes its two affected cases without
assertion changes. The hook's plain-Node extensionless-import failure remains;
later canonical instrumented selection/execution supplies actual passing proof.
A scratch HTTP probe initially could not resolve bare reflect-metadata; an
API-declared package import correction passes, with no production/provider change.

The standard result is a **resumed equivalent sequence**, not uninterrupted
`pnpm check`: formatting/quality24/lint, closure286/no-Express, cleanup1,
identity5/workspace16/project160/prototype19, real HTTP integration6 and all
consumer typechecks pass. Contracts/API builds and web compilation/TS/static
generation complete before inherited Next16.4.3 `SecurityFatalError`. One
coordinator-authorized identical web-only retry passes, then missing MCP build,
MCP17 and final smoke pass. **Next's security recommendation remains unresolved.**
No upgrade, suppression or remediation is claimed. A later test-only supplement
does not rebind that earlier standard-source receipt.

## Numerical approval and actual normal proof

Coherent proposal one passes 798 measured cases but is rejected: contracts
547/549 branches gives 9963 below protected 9965 after 26 covered branch units
move out of handwritten guards. No baseline is written then. One explicitly
released adjacent archived-task projection test checks independent public detail,
discovery, relation and parent-candidate metadata plus malformed dates. G04's
reference guard is an independent projection, not a runtime caller of taskSchema.
No production defect or full G04 migration is claimed.

Affected formatting/lint and seven cases pass; one contracts-only measurement
passes 50 cases and 548/549 branches. Proposal two combines those actual
contracts reports with fingerprint-verified proposal-one API307/web423/prototype19.
It is not another coherent all-scope run or invented digest. Independent approval
binds comparison `0317275fffef16dcfdf5c839ccd270e1671e495c30e131c528c5dcb957a84894`,
240 physical fingerprints, ten working files, 32 report hashes/sizes and all
eight old baselines. All 692 retained file metric comparisons preserve/improve
exact ratios and uncovered counts. Only these exact current bytes are adopted:

| Scope | Baseline SHA-256 | Lines / statements / functions / branches | Floors L/S/F/B |
| --- | --- | --- | --- |
| API | `080921e519ce498048956c520801d8005c583a29d841313e4815a9f389f05d6b` | 1537/2085 · 1676/2280 · 431/605 · 1259/1712 | 7371/7350/7123/7353 |
| Web | `036122819c9cf0ecc714b2a0aa53a23e33adb805430c03c89460087d66d70a94` | 3582/4935 · 3948/5607 · 835/1354 · 4655/6959 | 7258/7041/6166/6689 |
| Contracts | `7e1b656db92d05939ff1505369b439f3781994975037fc2e4e98bbbd93a66fb0` | 316/316 · 345/345 · 163/163 · 548/549 | 10000/10000/10000/9981 |
| Prototype, unchanged | `aa02ac448391cc4bc3ab4bb748f25b6ca631c7297d10d813c5e72d64ae2b7541` | 238/853 · 269/984 · 87/368 · 194/954 | 2790/2733/2364/2033 |

Prototype and all four historical baseline bytes are never written. Inventories
are 53/88/17/16 with no removed source. G02+G05 owners remain fully covered,
L55/S60/F23/B71 → L75/S80/F37/B45. Unchanged-source mapped S/F/B coverage is
API3231→3248, web9295→9305, contracts893→894 (the released archive branch),
prototype550 exact; no covered-unit loss or map difference. One old G04 checklist
branch remains debt. Nullable endpoints remain API188/10404, web543/30548,
contracts24/2440, prototype69/5348. Type-only N/A and unexecuted owners remain;
there is no dependency-internal coverage credit, exclusion or lower floor.

One fresh actual normal run passes **799/799**: API307/web423/contracts50/
prototype19, no failures/skips/cancellations. All 16 actual report hashes/sizes
reproduce proposal two exactly. Actual digest is
`96c6a99b5394c414d0d3e1a1e6210db45b7419f33629c07ece4356be455128ca`;
normal identity SHA-256 is
`c69174f9280f5063c20e58c64ffc05a4e73852e0fff06b286f9488408f769117`.
Infrastructure20/20 and 17 bounded artifact files/2942922 bytes pass without
upload. Later integration/docs do not rebind these source-qualified runs.

## Real integration, cleanup and limits

Docker29.9.3/Compose5.7.0 preflight uses pinned tools first and retains
`/usr/local/bin` for Docker. One existing `--projects` run passes **57/57**
(33 project/task, 12 collaboration, 12 discovery) using already-built current
contracts/API. The real page helper and event reader invoke the migrated public
guards. Existing tenant/private/query/cursor/revision, current-authority,
rollback/commit-order/replay and session SSE scenarios pass. The selector omits
unrelated identity/sprint/default DB-restart tails; no full T11 recertification.
No integration source changes or duplicate discovery run are needed.

One existing runtime run passes in 154256ms: frozen packaging/nonroot/secret
exclusions, complete deployed API/worker/migration no-Express closure, migration
failure/repeat, readiness/liveness/recovery, locked-query/SIGTERM cleanup and
durable diagnostic restart. Identity remains disabled. Exact runtime project
resources/image tags are removed and read-only state matches preflight; no
shared bases/cache or foreign resources are pruned. Selected identity-labelled
container/volume absence is also verified. A bounded Docker history query
returned no events, so that run's random identity resource names are not
recovered; harness cleanup, script hashes and labelled before/after absence
remain the evidence, not an invented identifier receipt.

Root/tools high audits pass, retaining application one low/fourteen moderate and
tools two moderate findings. These snapshots do not remediate Next. All 240 unit
fingerprints, 255 frozen inputs, eight approved baselines and 16 normal reports
remain exact after integration. Script/resource and command receipts are separate.
Timings are observations; production bundle/request cost comparison is unmeasured.

Remaining G04/G06/G07 families, their coercion debt, all six opaque cursor
decoders, invitation/navigation state, all eight private JSON owners and C01–12
remain individually owned in the [inventory](t38-boundary-inventory.md). This
slice leaves cursor decoding, token formats, authority, transactions and SSE
producer policy with their existing owners; it does not accept blanket exclusions.
No Query/cache/form/OpenAPI/generated client/tooling stack, UI redesign, DB
migration, provider/staging/user/native acceptance, credentials or deployment.
Cancel/Leave stays user-omitted **UNVERIFIED with possible draft loss**; sprint
filters remain T08/T10/US05 debt. Full US05/P08/T08/T10 and US12/device/accessibility
conformity remain separate. Source-bound receipts are retained under ignored
`coverage/t38-discovery-event-schemas/` for coordinator preservation and delivery.
