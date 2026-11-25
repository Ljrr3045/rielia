# T38.2f planning, scope, start and history schemas

**DRAFT PR63; LOCAL GATES COMPLETE; FINAL-HEAD CI/NATIVE REVIEW/ACCEPTANCE PENDING,
2026-11-24 America/Caracas.** The coordinator published
[Draft PR63](https://github.com/Ljrr3045/rielia/pull/63), targeting `dev`, at initial
implementation head `480263aa5b0b9214e8b045e8a313c47e4908b55d`, tree
`a329cbef9a8a6fe1e766b5a44dc76141e36f7f5d`. Initial publication is complete;
this docs-only PR-reference batch does not rebind local source/run receipts or
original failures. Final-head CI, native Kilo and coordinator acceptance remain
pending.

Base is accepted PR62 merge
`f319508181524d340e810faf55b1e1cc625abac9`. Full T38.2/T38 remains open under
[issue53](https://github.com/Ljrr3045/rielia/issues/53).

This bounded T38.2 migration supports accepted T11 scope/start/history, P09/US06,
affected P05/P06/P08/P10/P38 and US05/US12/US24–25, retaining T35 authority and
authorship. UX04 describes preserved interaction context; there is no UI change
or renewed native/device/accessibility acceptance. G07 closure is a direct
unmigrated dependency. Query/RHF/OpenAPI/configuration/dependencies, product
policy, database changes, SSE producers, credentials/deployment and main promotion
are outside this release.

## Owners and operations

| Owner | Responsibility |
| --- | --- |
| `packages/contracts/src/task-planning-schemas.ts` | Named snapshot, Task planning, visit, totals, history-item/page, scope-page and transition schemas; inferred types and narrowly documented compatibility projections |
| `packages/contracts/src/task-planning-input-schemas.ts` | Estimate/start/participation strict bodies and empty/cursor-only planning HTTP admission |
| `packages/contracts/src/task-planning.ts` | Six original compatibility predicates over original inputs, schema/type reexports |
| `apps/api/src/projects/task-planning-input.ts` | Three staged transport parsers and stable Nest errors |
| `task-planning.service.ts`, `sprint-start.ts` | Delegate input parsing; existing use cases/policy/transactions retain ownership |
| API `project-task-http.ts`, Sprint/Task planning controllers | Planning-only empty/page query selection before authority |
| Web `task-planning-client.ts`, `project-task-proxy.ts` | X05 input type and planning-only X09 query admission, original response identity and requested command/scope checks |

The registry identifies `task-planning-client.ts` as **X05**; X03 contains no
planning path and is unchanged. H27 POST Sprint/start takes three required safe
positive expected versions. H28/H29 GET Sprint/scope/history accept optional
cursor. H51 GET Task/planning takes no query/body; H52 GET Task/sprint-history
accepts cursor. H53 POST Task/planning takes expectedVersion and explicit nullable
estimatePoints. H54 POST Task/sprint takes all five explicit source/target/version
fields with paired nulls. Proxy bodies remain streamed, not buffered or parsed.

G02 supplies Task statuses and the existing human/Agent person schema; G03
supplies the canonical planned/active/closed Sprint schema. G04 supplies the
equivalent scalar correlated provenance and cursor primitives. Safe versions,
identifiers and dense arrays are reused where equivalent. HTTP inherited view
conversion ordering is retained locally: G04's raw query view admission is not
interchangeable for non-JSON conversion exceptions. No second Task, person,
Sprint or provenance model is introduced.

## Compatibility and approved corrections

Snapshots retain exactly five own enumerable keys followed by direct known-field
reads. They do not require five own required fields. Inherited/hidden known
values, ignored symbols and an unrelated enumerable key replacing a hidden known
key preserve legacy cardinality/read behavior. The named admission adapter only
checks record/key cardinality; actual field schemas own values. No descriptor
pipeline or whole legacy guard is hidden inside a custom schema.

All G06 counts/revisions are safe integers. Estimate bounds 0–1000 preserve
zero/null and retained off-scale snapshots without moving point-scale policy into
contracts. Historical snapshot/status/parent/archive permissiveness remains.
Pages retain limit 100, total-at-least-length, unique identities, scope/revision
bindings and one-of sprint/task history scope. Visits require the complete exit
quartet and ordinal progression without adding timestamp or membership rules.

Outcome-only history requires closureId, scalar disposition and both carried
target IDs or both null otherwise. Non-outcome records do not require or inspect
those slots. G06 does not add G07's distinct-target-Sprint rule. Start transition
results accept current active/closed Sprint with matching operation identity and
null visit IDs. Participation transitions retain successful immutable entered/
exited identity separately from freshly authorized current Task planning; a later
removal or transfer does not invalidate an original-key replay.

The coordinator explicitly approved primitive scalar validation for history
action, exitReason, executionMode and operation.type. Former JSON singleton
arrays and boxed/custom-coercible non-JSON values reject; String-conversion
exceptions become false. The special coerced start-sprint value formerly taking
the TaskPlanning branch also rejects. Public scope/history arrays reject holes,
preserving populated inherited indices and ordinary extras. Actor admissibility
remains the existing G06 human/Agent contract; System/internal support in G04
does not authorize broadening G06 or restricting all history to humans.

G06-owned output validation copies strip unknown keys without evaluating ignored
extra getters. Predicates and X05 retain the original response object, extras,
descriptors and identity. Canonical nested G02/G03 behavior is unchanged.

### Explicit public compatibility type debt

Two type-level projections preserve the original public interfaces. Scope's
optional transferred/closingTotals retain explicit-undefined runtime acceptance,
while the public exact-optional types omit undefined. Non-outcome original
closureId/disposition/targetSprintId/targetParticipationId remain unread even when
malformed or getters; their public optional types remain derived from the outcome
field schemas. New parse data excludes ignored outcome slots. PlanningHistoryPage
projects that public item type. These are disclosed original-object unsoundness,
owned by a later separately released G06 correction, not full inferred-type
soundness. No entire runtime schema is cast to an old DTO.

Strict bidirectional comparison against independent frozen predecessor source
covers ten public types, the shared page fields and inline estimate input.
Separate raw output checks prove outcome-only required fields, absent non-outcome
parse slots and admitted scope undefined; public-type equality is not substituted
for those raw inference checks. Public action remains string via refinement;
the existing broad operation/current public union remains compatible.

## Protocol, backend and deferred boundaries

API order remains spoofed headers, path, query, GET-body or mutation origin/JSON/
key-presence, verified web context/cookies, then service input parsing. Start
parses its three versions in original order; estimate validates points before
expectedVersion. Participation validates identifiers, Task/source/target versions,
then null correlation. UUID-v4 admission, normalized hash, current authority,
receipt replay before stale state checks, locks/transactions and atomic activity/
outbox writes stay backend-owned. Exact stable messages/statuses remain.

Same-origin/no-store/fixed destination, duplicate-query rejection, streamed body,
cookies/request IDs, cancellation/deadlines, safe malformed/error/current decoding
and requested transition/source/target binding remain. No controller/hook/cache
owner, optimistic version, conflict/draft recovery or invalidation behavior changes.

G07 consequences directly reuse the snapshot predicate; preview/closure reuse
totals; close-result indirectly depends on closure/totals and canonical Sprint.
All five G07 signatures and PR52 scalar-kind/disposition/targets/closure/current
regressions remain. This is dependency protection, not G07 migration.

Only the existing planningBefore/planningAfter per-snapshot history fallback
automatically reuses the snapshot predicate. Persisted visit entry/exit, start,
event and frozen outcome snapshot casts/whole-row mapping remain backend-owned
debt in `sprint-scope-read.ts` and `sprint-closure-read.ts`. Public output schemas
are not imposed on database rows. Scope/start receipts in `sprint-scope-mutation.ts`
retain reference/operation parsing plus freshly authorized current state; they
cannot parse as complete public transition results. Other seven persisted owner
families remain separately accounted in the [inventory](t38-boundary-inventory.md).

The scope/history opaque decoder remains service-owned: base64url/11-key envelope,
kind/tenant/project/scope binding, decimal ordinal within int64, ordered individual
version validation/comparison and scoped anchor lookup. Other five opaque decoder
owners and C01–12 remain named debt, not accepted exclusions. No format/version
policy changes follow shared public schemas.

## Source-bound evidence and remaining gates

Direct Node24.22.1/pnpm12.15.0 frozen application/tools installs preserve dependency,
lock, peer, age and lifecycle policies. Strict contracts/API builds pass. Twelve
bidirectional comparisons against independent legacy source and separate raw
output/negative checks pass; the final strict proof also passes against final
source. Finite predecessor/candidate probes pass **877 guards** (845 same/32
approved differences; 783 JSON/94 non-JSON), **214 staged inputs**, **504 HTTP**
and **144 proxy** comparisons. Throws are recorded separately from booleans;
unexpected runtime/getter failures are not hidden by an exception fallback.

The initial focused27 run failed two cases because a new getter fixture mutated
shared visits/totals. The isolated fixture correction retains every assertion and
one affected recheck passes 27. The initial standard command passes formatting and
quality 24, then fails the new test's bare Headers no-undef. The permitted
`globalThis.Headers` correction retains that failure. Continuation passes lint,
backend closure 286, cleanup 1, identity 5/workspace 16/project/planning 162/prototype 19/
web integration 6 and strict all-workspace types. Next16.4.3 then stops production
build after compilation/TS/static generation with its inherited SecurityFatalError.
One coordinator-approved unchanged web-only retry passes without upgrade,
suppression or security-setting changes. The recursive build had stopped before
MCP compilation: only MCP typechecking had passed, correcting the initial worker
report. Separately released missing MCP compilation, MCP 17 and production HTTP
smoke pass. This is a **completed resumed equivalent sequence**, not an
uninterrupted `pnpm check`; all original interruptions and the correction remain.

### Exact numerical adoption and fresh normal evidence

PR62's frozen normal 811 reports/manifests and eight protected baselines were
verified and reused; predecessor suites were not replayed. Candidate1 passes 820
cases but fails the protected API branch floor7497 <7510 after nine covered parser
units move out of that denominator, with 418 uncovered unchanged. This is structural
deletion, not new coverage or a waived gate. The rejected candidate and manifest
remain immutable evidence.

The coordinator releases exactly three test-only retry/receipt regressions:
invalid UUID key before authority/effects; original start replay against a later
closed current Sprint after mode/archive changes; malformed stored exited identity
rejected503 after current-authority read without writes. Focused 3 and changed-file
lint pass. API-only315 measurement supplies one statement/three branch gains in
unchanged `sprint-scope-mutation.ts`. Candidate2 reuses web 425/contracts 64/prototype 19
only after verifying their runtime/compiler/provider/pnpm/tools-lock/source/test/
config dependencies. That proposal has **mixed origins and no coherent digest**.

The coordinator independently approves exactly these current baseline identities:

| Baseline | SHA-256 | Floors L/S/F/B |
| --- | --- | --- |
| API | `20fa71fcf44ed15e11e0f2ee0eef7f38592eb046bf9897d412ed02fa1bfab358` | 7482/7466/7142/7514 |
| Web | `c60178613348f0211423564b93e85b38cb9759de9ce422607b949514913f057c` | 7290/7069/6166/6703 |
| Contracts | `d0580b9a278dee8d2f5d8ec49492edf3806a029761f3b7413bcb7753eec25788` | 10000/10000/10000/10000 |

All 247 physical fingerprints, 26 working inputs, eight original baseline hashes and
32 before/after report hashes were checked before copying only those approved
bytes. Prototype and four historical baselines remain exact. All 708 retained-file
metric ratio/uncovered comparisons preserve or improve. G06 contracts ownership
moves B167/167 to schema/facade B67/67, fully covered; API changed owners B122/128
to113/119 retain their six existing uncovered HTTP units. No dependency-internal
counter receives credit and no source/exclusion/floor is weakened.

The subsequent actual fresh full normal run passes **823/823**, with no skips:
API 315/web 425/contracts 64/prototype 19. All16 approved reports reproduce byte-for-byte.
Actual coherent digest is
`c63d59240de533d4b657b45e1ac5eb838e4c2aa328ab2369b32554e849736698`;
`normal-identity.json` SHA-256 is
`d07f80354805cc1b3b4bbec20b0323851ddfd5aeff5e354af80f535ac2108483`.
Infrastructure 20/20 and 17 bounded artifact files/2940112 bytes pass without upload.
Maintained inventories 55/88/21/16 retain type-only N/A and unexecuted owners.
Unchanged-source raw maps retain API 3034→3038 covered units with precisely the
four authorized gains, web 9139/contracts 815/prototype 550 unchanged, zero losses
or map differences. Nullable endpoints remain explicit precision limits:
API 185/10370, web 543/30570, contracts 26/2332, prototype 69/5348. Source-bound
integration/prose evidence is not unit credit or a rebind of these reports.

### Real HTTP, runtime and cleanup

The standalone `--planning-schemas` selector runs scope/start 17 and closure 17,
**34/34 actual PostgreSQL/NodeAdapter HTTP cases**, in one twice-migrated disposable
fixture. Seven mixed/repeated/unknown argv cases reject before temporary resources.
The selection protects G06/G07 dependency, current authority, input denial,
races/rollback, immutable facts, original-key response-loss recovery and history;
it skips unrelated settings/identity/default DB-restart tails and does not replay
or accept full original T11. Existing G07/PR52 contract regressions remain intact.

One isolated runtime run passes pinned API/web/migrator images, nonroot usable
files, deployed NodeAdapter/Express exclusion, migration failure/gating/reapply,
controlled DDL delay, readiness/liveness and DB recovery, lock/signal cleanup and
queue persistence through full stack recreation and worker restart. Exact owned
planning container/volume, runtime resources and three image tags are absent;
private source probes are removed. Pre-existing eight container/eight volume/nine
network identities are preserved. No provider, staging or deployment is involved.

Both high-severity audit gates pass: application one low/fourteen moderate;
isolated tools two moderate, zero high/critical. Next's security recommendation
remains **UNRESOLVED**, irrespective of passing retry/runtime/audits. Pinned
pnpm-action Node20/forcedNode24 warning and the inherited defensive collaboration
API schema branch remain debt. Optional-field unsoundness, G07/private/opaque/C01–12
owners, omitted native Cancel/Leave (UNVERIFIED, possible draft loss), sprint
filters, provider/staging/real-user/device/accessibility and production bundle/
request-cost limits remain open.

Sanitized local evidence lives under ignored `coverage/t38-planning-schemas/` for
coordinator preservation. Later prose/commit/PR references do not rebind source/run
receipts. Root alone publishes Draft/PR references, freezes the final head,
controls current-head CI/Ready/Kilo/acceptance/merge and completed cleanup.
Full T38.2/T38 and current-head review/acceptance remain open.
