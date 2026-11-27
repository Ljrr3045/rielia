# T38.2g sprint closure schemas

[T38.2g is ACCEPTED and delivered in PR64](https://github.com/Ljrr3045/rielia/pull/64#issuecomment-7175578830):
reviewed `9886fb2adf33f71dc8f3c5291d787c0d5fc86c69`, merged
`541ac5de1625722fc2f1faf7ca56f103a267d4ef`, tree
`bbff57eaeec629ba2ca9e31f262ba96fde8438f6`. Reviewed-head CI45676135795 /
check139424057741 and exact-merge CI45705881930 / check139527608640 passed
(App15368), with native Kilo139475936300/App2193792 passed. Full27-file review
then one-file incremental documentation correction leave zero findings; the user
resolved the thread. Settled checkout/terminal cleanup and retained evidence/branch
are recorded in [issue53 closeout](https://github.com/Ljrr3045/rielia/issues/53#issuecomment-7175600441).
All93foreign coordinator entries were preserved. [T38.2h](t38-private-schemas.md)
now owns the separately released private sprint receipt schemas. Full T38 remains
open. **The following dated publication and local receipts retain their original
pre-acceptance state and source identities.**

**PUBLISHED IN DRAFT PR64; CURRENT-HEAD CI/NATIVE REVIEW/ACCEPTANCE PENDING,
2026-11-25 America/Caracas.** The coordinator released bounded
H23–26/G07, closure X05 and closure-only HTTP/X09 work from accepted PR63 merge
`5536162dca58c81139cd2732712b8760185af44c`. Exact numerical adoption and local
gates are complete; current-head CI, native review and acceptance remain
coordinator gates.
Full T38.2/T38 remains open under [issue53](https://github.com/Ljrr3045/rielia/issues/53).

**Initial publication:** [Draft PR64](https://github.com/Ljrr3045/rielia/pull/64),
targeting `dev`, was opened at implementation head
`a112682dc8e254563fad4f5a46b048b0e7c6a7f2`, tree
`0980d799ba51ebb81303e05a642a9f6042708cc3`. Initial exact-head CI run
`45550717155` / validate check `138990956650` (App15368) passed all 20 steps in
9m42s. Its sole annotation is the Node20-to-24 `pnpm/action-setup` deprecation
warning; there were no failed steps or failed-step logs. Kilo reviewed reference
commit `d00d934a575551322bdafcb1957f11d7fdc351e7` successfully (27 files, one
suggestion): it identified the stale publication banner corrected in this
follow-up. This correction has no current-head CI or native review yet, and
coordinator acceptance remains pending. The initial-head result and prior review
do not rebind the frozen local delivery manifest or any source/run receipt.

This supports accepted T11/B1c, P09/US06 and affected P05/P06/P08/P10/P38,
US05/US12/US24–25 while preserving T35 authority. UX04/UXR01 describe existing
interaction context; no presentation or renewed native/device/accessibility
acceptance is included. No Query, RHF, OpenAPI, dependency, configuration,
permission, database, SSE, cache, workflow, credential, deployment or main change.

## Public owners

| Owner | Responsibility |
| --- | --- |
| `packages/contracts/src/sprint-closure-schemas.ts` | Named destination, disposition, consequence, close binding, preview, closure, outcome/page and result schemas; nine inferred public types |
| `packages/contracts/src/sprint-closure-input-schemas.ts` | Separate strict eight-field body and preview HTTP query admission |
| `packages/contracts/src/sprint-closure.ts` | Five original compatibility predicates and schema/type reexports |
| `apps/api/src/projects/sprint-closure-input.ts` | Existing staged object-copy/body validation and stable errors |
| `sprint-close.ts`, `sprint-close-preview.ts` | Input delegation and destination scalar reuse; canonical application/transaction ownership retained |
| `sprint.controller.ts`, `project-task-http.ts` | Closure-only query selection before authority |
| Web `task-planning-client.ts`, `project-task-proxy.ts` | X05 unchanged schema-backed guard consumption; closure-only X09 query admission |

H23 GET `/sprints/:s/close-preview` accepts optional scalar destination/cursor.
H24 POST `/sprints/:s/close` requires all eight original concurrency/hash binding
fields. H25 GET `/sprints/:s/closure` accepts an empty query. H26 GET
`/sprints/:s/closure/outcomes` accepts optional cursor. Preview/outcome cursors
retain their 2048-character admission; body destination is explicit nullable,
while an omitted preview destination normalizes to null. Backlog and a planned
Sprint identifier remain separate. Literal query text `null` is an identifier.
X03 contains no planning path and is unchanged.

G06 supplies canonical snapshots and totals; G03 supplies canonical Sprint;
accepted identifier/version/cursor and equivalent count/UTC fields are reused.
No second Sprint, snapshot, totals, person or provenance model is introduced.
`CloseSprintInput` remains the tolerant guard's inferred binding type, while the
HTTP schema rejects unknown body keys. Broad published current-Sprint types stay
broad; runtime refinements preserve the existing closed-state correlations.

## Compatibility and corrections

Safe counts/versions, schema1/lowercase-hex hash, canonical UTC timestamps,
pending/total bounds, 100-row pages, status/disposition and destination/canClose
correlations remain. Preview participation IDs are unique; outcomes require
unique outcome and participation IDs. Carried outcomes have both target IDs and
a target Sprint different from the source; all other outcomes have both null.
Operation/activity/closure/current scope, timestamp and ordinal identity remain.
There is no added totals arithmetic, Task uniqueness or policy/time correlation.

Snapshot admission retains exactly five own enumerable keys followed by direct
known-field reads, including hidden/inherited values, ignored symbols and an
unrelated enumerable key replacing a hidden known field. G06 optional-field
original-object unsoundness remains separately owned debt, unchanged here.
G07 validation copies strip ignored extras without evaluating their getters.
Compatibility predicates and X05 keep original objects, extras, descriptors and
identity. Existing nested G03 behavior is unchanged. The staged backend object
copy retains enumerable symbols and evaluates body getters before field checks;
JSON serialization/hash behavior is unchanged.

The coordinator explicitly approved these bounded non-JSON dispositions:

- Preview/outcome arrays reject holes that legacy `every`/`map`/`Set` could admit.
  Explicit undefined/null elements already rejected; populated inherited numeric
  indices and ordinary extras remain admitted.
- On an already-invalid executable object, eager reads can invoke a later known
  property's throwing getter after legacy validation would return false. The
  recorded example has `expectedVersion: 0` and a throwing `previewHash` getter:
  legacy reads no hash; candidate reads `previewHash` and throws. This is accepted
  accessor-evaluation drift, not a security correction or universal parity claim.
- G07 validity follows actual populated array elements rather than input-provided
  `every`/`map` methods. Throwing method getters and custom method return values
  cannot reject valid elements, hide invalid elements or manufacture uniqueness.
  These method-dispatch differences are counted separately, not as parity.

A pre-fix diagnostic exposed six array-method differences, including a newly
read ignored `keys` getter. Its source/output/receipt is frozen. The G07-local
density check now uses bounded numeric index-in checks, without input traversal
methods. Actual pinned Zod4.6.7 array-parser source inspection confirms numeric
index traversal; getters for `keys`, `Symbol.iterator`, `every` and `map` remain
unread by candidate validation. Meaningful tests cover valid items rejected by
custom methods, null items hidden by custom every/map and duplicates disguised
by custom map. The shared `dense-array-schema.ts` helper still calls input
`keys()`; that separately owned G02/G04/G05/G06 helper caveat is unchanged debt,
not remediation delivered here.

Valid stable getters/inherited/hidden values retain boolean results; ignored
extras remain unread. Validation of executable JavaScript objects may throw.
Side-effectful changing getters and other unapproved differences remain gates;
there is no catch-all exception conversion or descriptor-copy machinery.
PR52 strict scalar kind/disposition and target/current regressions remain intact;
no additional scalar hardening was inferred from earlier family approvals.

The first finite proof found a real implementation defect: null snapshot produced
legacy false but a candidate TypeError in the consequence status refinement.
The failed source/output/proof and log remain frozen. A separately released local
prerequisite validates the canonical snapshot before dereferencing status,
without changing G06 or parsing a whole preview/result twice. Direct preview and
outcome regressions require false without an unexpected throw.

## Protocol and private boundaries

HTTP order stays spoofed headers, path, query, GET-body or mutation Origin/
Fetch-Site/JSON/key-presence, verified web context/cookies, staged body, UUID-v4,
normalized hash and use case. Empty/page closure queries reuse accepted planning
admission, including inherited reads and `String(view)` exceptions. Only now-
unreachable close-preview fallback arms and its proxy destination check are
removed. Reachable Sprint/false/events and inherited-destination fallback paths
remain. Proxy duplicate-query checks, body streaming, fixed upstream, no-store,
cookies/request IDs, cancellation/deadlines and stable errors remain.

X05 preserves request scope/entity/destination/hash/schema and source/target
version+1 checks, safe current/error decoding, exact key/body retry, unknown
results and draft recovery. State, controllers, hooks, presentation and the
single existing invalidation owner are unchanged.

Private close receipt validation in `sprint-close.ts` is assessed but **deferred**.
Its `{kind,sprintId,closureId,activityId}` shape accepts ordinary strings/extras
and retains source equality and the same 503 behavior. API has no direct Zod
dependency; no transitive import, new runtime edge or public backend-only schema
was introduced. Authority precedes lookup, request-hash conflict precedes shape,
replay precedes stale checks, and fresh closure/current state is reconstructed.
Public result validation cannot substitute for that receipt or trusted context.

Preview authority/grant canonical/hash inputs stay backend-owned. Frozen outcome
snapshot casts and whole-row mapping in `sprint-closure-read.ts` remain owned
debt: adding public snapshot parses could introduce new database read failures
and needs a separate historical-storage/error decision. No persisted row parse
was added. Complete preview/outcome `closingPage` decoding remains service-owned:
base64url JSON, exactly three keys, v1, string binding, identifier anchor, binding
mismatch409 before scoped-anchor400. Public cursor admission does not migrate
that encoding, format or current-authority/transaction policy.

The other five opaque-decoder owners remain `project-task-read.ts`,
`task-collaboration.service.ts`, `task-discovery.service.ts`, `sprint-read.ts` and
`sprint-scope-read.ts`. Other six persisted JSON owners remain
`workspace.service.ts`, `project-task-mutation.ts`, `sprint-mutation.ts`,
`sprint-scope-mutation.ts`, `task-collaboration.service.ts` and `sprint-scope-read.ts`.
All eight private JSON owners and C01–12 stay explicitly accounted in the
[inventory](t38-boundary-inventory.md), not accepted blanket exclusions.

## Source-bound checks and remaining gates

Direct pinned Node24.22.1/pnpm12.15.0 frozen application/tool installs pass.
The first sandboxed registry-DNS install failure is retained; the approved-network
attempt succeeds without policy/lock changes. Contracts/API builds pass. Strict
comparison proves all nine types bidirectionally against independent frozen
predecessor declarations and separately checks raw input/output requirements,
nullable slots/dispositions/schema and broad current state. Its initial scratch
Zod import-resolution interruption and corrected contracts-local type import
remain recorded; no API runtime import was added.

Final finite guard proof passes **2157** cases: **2140 unchanged**, **4 approved
dense-array corrections**, **1 accepted accessor-evaluation drift**, **12 accepted
method-dispatch differences**; **1688 JSON / 469 non-JSON**. Boolean/throw outcomes and accessed fields are separate. Body/
destination parity passes **229**, HTTP admission **2040**, and proxy parity
**168**, with no difference. Earlier focused contracts/API/web regressions pass **39/39**; affected final
contracts regressions pass **16/16** and final strict inference proof passes.
The failed guard proof is not relabelled as passing or as approved getter drift.

The first standard sequence passed formatting and quality24, then failed the new
sparse-array fixture literal's no-sparse-arrays lint rule. An equivalent
Array(2)/index1 fixture retains every sparse assertion; that failed command is
preserved. The resumed tail passes lint, backend closure286, cleanup1 and identity5,
then workspace HTTP is denied loopback binding by the sandbox (13/16 pass).
That original EPERM attempt is retained. A permission-enabled continuation
passes workspace16, project/planning163, prototype19, web integration6 and strict
all-workspace types. Recursive contracts/API builds pass; Next16.4.3 compiles,
finishes TypeScript and generates all six pages, then stops with SecurityFatalError.
The original output/recommendation is retained. One coordinator-approved unchanged
web-only retry passes; subsequently released actual MCP compilation, MCP17 and
production HTTP smoke pass. This completes a resumed equivalent sequence,
not an uninterrupted `pnpm check`. MCP typecheck is distinct from compilation;
the latter ran only after the recursive build interruption was addressed.
No upgrade, suppression, security-setting change or tool-output instruction was
executed. The Next recommendation remains unresolved. A final query-test-only
negative-admission addition passes affected formatting/lint and is included in
the numerical measurement; application sources are unchanged.

Candidate1 executes **834/834** (API318/web426/contracts71/prototype19),
digest `40b4bf12aa5231d84553229b5657a662776fbdb1a4b1c70d529a9d13183a5983`.
It is **rejected for adoption**: API branches1255/1672 (7505) miss protected7514,
with HTTP inherited-destination fallback newly unexecuted; contracts lose one
statement/function in unchanged public `isSprintTotals` after G07 stops invoking
the compatibility wrapper indirectly. Contracts L/S/F fall below100%. Covered
body-guard deletion also slightly lowers close-owner branch ratio while retaining
its original single grant-namespace gap. Structural deletion is not a new test
gain. Candidate1 reports, current source bytes and comparison remain frozen.

The coordinator released exactly three test-only regressions: direct public
totals boundary admission, inherited destination fallback rejection before
authority/body, and a matching grant-actor preview/close/replay proving receipt
lookup/write namespace and current-authority denial before replay lookup.
All32 affected cases and changed-file formatting/lint pass; production/schema/
G06/private/dependency/config bytes are unchanged. API/contracts-only candidate2
measurement passes320/72: API L1576/2105,S1719/2301,F436/610,B1258/1672;
contracts L413/413,S437/437,F196/196,B317/317. This second packet retains its mixed measurement origins. Candidate1 web426/prototype19 reuse has exact current
runtime/compiler/provider/lock/source/test/config/report-hash proof. Any assembled
second proposal has mixed origins; it cannot supply a coherent all-scope digest.

The coordinator approved only exact candidate2 API/web/contracts bytes, bound to
comparison SHA256 `4908a01008bb3807080d797d72ce515f9d275367411af5638cb827f9024f6c2d`.
API/web/contracts floors L/S/F/B become7486/7470/7147/7523,
7291/7070/6166/6704 and10000all. Prototype/four historical baselines remain
byte-identical. All720 retained metric comparisons preserve ratios/uncovered;
668 have a positive before/either denominator,667 positive on both sides/after.
The retired facade branch denominator127 becomes0/0 by structural extraction,
not lost coverage or new test credit. Unchanged raw covered units remain
API3028/web9327/contracts798/prototype550 with zero losses/map differences.
Those cohorts differ from earlier changed-owner sets; their absolute counts
are not a universal cross-slice comparison. New source owners are fully covered.
Nullable endpoint precision remains explicit: API185/10370→186/10386,
web543/30570→545/30582,contracts26/2332→35/2292,prototype69/5348unchanged.
Fresh coherent **837/837** normal (API320/web426/contracts72/prototype19)
passes all numerical gates and reproduces all16 approved reports exactly,
digest `fe29d20b6b447b23139f088f1c70367c613ee63e2bcb39a420f392083007ab5d`,
normal identity `27328b3f81888e7f4ed842f88ba2b64ae586a285e1365d459a568ad217e5a3a7`.
Infrastructure20/20 and17 bounded artifact files/2942493bytes pass without upload.
This fresh run, not mixed candidate2, supplies the coherent count/digest.
Selected real PostgreSQL/HTTP17 passes after twice-applied migrations; the
single owned container/volume is removed and all8 existing containers/volumes
and9 networks retain identity. The isolated runtime suite passes fresh
API/web/migration images, nonroot/deployed Express exclusion, migration failure/
gating/reapply, controlled DDL delay, readiness/DB recovery, locked enqueue and
signal cleanup, and durable queue restart. Exact owned containers/network/volume/
image tags and private probes are removed; all21 existing image/tag identities
remain. High-severity audits pass with the unchanged application1low/14moderate
and tooling2moderate findings. No source/lock/peer/lifecycle/security change or
automatic retry was used to make these pass.

All required local application gates are complete for the bounded slice.
Final portable-link/handoff/whitespace checks and actual command-local hook
execution accompany the local commit; PR64's initial exact-head CI passed, while
later docs-head CI, native review and coordinator acceptance remain pending. PR63's source-bound normal823/digest/
identity is the predecessor baseline; it was reused without replay for counts.
The new normal837 receipt retains its actual source/run identity independently
of later documentation commits, PR references or merge.
The coordinator owns every baseline adoption and remote mutation. Existing
Next SecurityFatalError/upgrade recommendation, application low/moderate and
tooling moderate advisories, forced Node24 action notice, defensive collaboration
API branch, optional/native/provider/staging/user/device/accessibility and
bundle/request-cost limitations remain. Native Cancel/Leave stays explicitly
omitted with possible draft loss.
