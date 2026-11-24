# T38.2b workspace, identity and infrastructure schemas

**LOCAL GATES PASS; DRAFT PR59, FINAL REVIEW PENDING, 2026-11-24
America/Caracas.** The coordinator released H01–04/H55–66/G01/X01–02 after
[T38.2a acceptance in PR58](https://github.com/Ljrr3045/rielia/pull/58#issuecomment-7120471111),
reviewed `5e2671bdd58b1052db848f536381b65864fdd724`, merged
`e1ebe3ac13ab3f8b749ca1c6dfc383f296e72629`, identical tree
`2e8086cc0230f3b5fcfadf54ea444f561df06742`. Reviewed-head
[CI138171467198](https://github.com/Ljrr3045/rielia/actions/runs/45312482493/job/138171467198)
and exact-merge
[CI138179184674](https://github.com/Ljrr3045/rielia/actions/runs/45314875237/job/138179184674)
passed 24 steps each. Native Kilo `4be37ffe-9502-49bc-bf3f-093f495cc20b`,
check `138176502915`, completed a clean 25-file static review. These are
coordinator receipts reused without replaying accepted T11/T38.1/T38.2a checks.

Prepared in [Draft PR59](https://github.com/Ljrr3045/rielia/pull/59), targeting
`dev`, published by the coordinator at initial implementation head
`dfe072141b2f68840045e46591f60623d58ea0bb`, tree
`1170c8d5f35b277ddd2626fc5f39e675908ec74d`. Local source/run identities below
retain their original bindings. Reference-only commit `699175c` replayed no
application checks and did not rebind that evidence. Current-head
hosted CI/native Kilo, feedback/base/ownership checks and final acceptance remain
pending.

Traceability: T38.2, bounded T02/T04/T05/T07/T35, P01–03/P38,
US01–03/US24–25; retained UX07/09 recovery. No UI, domain policy, database or
product-capability change. [Issue 53](https://github.com/Ljrr3045/rielia/issues/53)
and the [finite inventory](t38-boundary-inventory.md) retain later gates;
full T38.2/T38 and adjacent-ticket acceptance remain open.

## Canonical ownership

- Contracts `workspace-schemas.ts` owns seven strict request bodies, workspace
  projections, generic/finite page schemas and permissive string error-code
  projection. DTOs/request types derive from schemas; commands compose request
  aliases with existing selectors/discriminators. `index.ts` retains six G01
  entrypoints and unchanged `isRecord`. `isPage` retains its caller predicate API
  used by project/access/assignee consumers without G02 migration.
- `identity-schemas.ts` owns public configuration/session wire projections.
  `identity-controller.ts` retains parser exports, exact messages and unchanged
  state machine. Session type remains non-null; only its response/parser adds
  null. Provider deduplication/order, extra-key projection and empty strings stay.
- `principal-schemas.ts` derives informational execution/attribution and enum
  types. Readonly stays type-level; schemas do not freeze objects. Parsing or
  copying a valid DTO creates no WeakMap evidence. H04 gets no new outbound
  runtime layer; serialized HTTP validation passed in the Stage D real suite.
- `infrastructure-schemas.ts` owns liveness/readiness. Health consumers retain
  the facade; MCP reuses the shape with its existing strict output policy.
  Bounded MCP literal projection, strict empty input and config stay unchanged.
  Readiness's annotation derives from contracts; controlled 503 is unchanged.
- API `workspaces/workspace-input.ts` maps schemas to original errors and
  normalization. The service retains authorization, queries, DTOs, receipts,
  invitation lifecycle, writes and transactions. Body errors precede auth;
  name/email errors precede role/custodian errors as before.
- `workspace-client.ts` retains HTTP/status/JSON-parse precedence, cancellation,
  command/key serialization and target checks. Error codes remain any string,
  including empty/unknown. Created-invitation projects the same outer two fields
  while retaining nested invitation extras.

Schema leaves import Zod/direct siblings, never the barrel. Accepted Sprint
source is untouched. The small type-only `schema-types.ts` derives known DTO
keys while preserving arrays/unions/optionality. Its maintained source remains
explicit zero-unit N/A in the existing reconciliation registry, not an exclusion
or 100% claim. `dense-array-schema.ts` checks density before item parsing. New
source/tests join maintained formatting. No new runtime dependency is added.

## Compatibility and deferred owners

Inputs retain strict keys, null/presence, safe positive versions and patch-field
requirements. Names trim then use UTF-16 1–200 bounds, retaining embedded
newline/NUL. Email raw length is checked before trim/lowercase with the old
simple regex. Token/custodian patterns, normalized receipt inputs and optional
keys remain unchanged. Outputs keep nonempty strings without stronger ID/email
rules, finite `Date.parse` values without Sprint instant/chronology rules,
required null fields, strict scalar enums and runtime extra keys. Generic pages
retain duplicate/unbounded items and arbitrary nonempty cursors. Public DTOs
have no loose-object string index signature. Schemas do not authorize operations.

The sole approved correction rejects decorated arrays used as health/identity
record objects and sparse provider/page arrays. Seven legacy-accepted witnesses
reject in the candidate; ordinary JSON/extra-key controls pass both. These are
not corresponding JSON object/dense-array representations. No broader exotic
input or global scalar behavior correction is included.

Admission, Better Auth raw-before-parser routing, callbacks/origins, cookies,
no-store, body/header/query/key precedence and project-only request IDs stay.
Workspace proxy forwards queries to Nest rather than implementing the project
proxy duplicate-query gate. Context has no standalone path-shape validator:
principal membership authorization handles the selector. UUID-v4 validation
stays in receipts after current authority. Internal Better Auth Date-valued
session objects are not parsed as wire string DTOs.

Configuration C01–12 stays separately gated. Conditional settings, enablement,
PORT coercion/defaults, server-only upstreams, MCP numeric-loopback and private
operational/tooling formats have distinct semantics. No config migration occurs.

Private workspace receipts are assessed and deferred to a separate T38.2
release, owned by the workspace service/receipt maintainer and coordinator.
Create/accept replay consumes saved ID (sparse `{id}` suffices) then reloads
current summary after authorization; issuance stores `{issued:true}` and
refuses secret replay; member/agent/revoke replay returns full member/invitation
JSON. Full public summary/created-invitation schemas cannot replace these
formats. Existing casts/corrupt-storage behavior stay. This is sequencing, not
an accepted exclusion; the other seven receipt owners and G02/G04–07 remain debt.

## Evidence and remaining gates

One frozen app install and one frozen isolated-tools install passed using
verified direct Node24.22.1/pnpm12.15.0. Existing Prisma preinstall/linked-worktree
prepare ran, with shared Git config unchanged. No manifest/lock/pin/peer/age/
lifecycle changes or agent-skill approval occurred.

Strict contracts/API compilation and strict TS6 no-emit compatibility probe pass:
both-way DTO/command compatibility, generic `Page<T>`, nested readonly provenance,
optional absence/undefined and non-null session typing. Focused retained/new
tests pass **98/98**, without skips, including parsed-context trust rejection,
body/admission error order, normalized results, HTTP statuses/codes/scopes and
identity recovery. Scripted boundaries do not prove PG locks/rollback or real
HTTP serialization.

Standard validation completed as a **resumed equivalent sequence**, not an
uninterrupted successful `pnpm check`. Formatting and 24 quality cases passed
before lint stopped on three unqualified `Headers` constructors in a new test.
The coordinator released `globalThis.Headers`; focused/full lint passed. Backend
closure passes for 286 packages without Express, smoke cleanup passes one case
and identity logic passes five. Restricted-sandbox workspace HTTP passed 13/16
before three loopback listeners failed with `EPERM` before assertions. Released
per-command escalation passed workspace 16/16, project logic 154/154, prototype
19/19 and six real web integrations, without replaying the successful prefix.

Full web typechecking then found eight errors at unchanged project callers:
the initial inferred `Page<T>` alias changed TS6's chained `isPage`/`isRecord`
extra-field narrowing despite both-way structural assignability. The released
schema-derived interface restores original interface semantics without an index
signature, cast, caller rewrite or runtime change. An extended exact narrowing
probe and corrected root typecheck pass for every consumer. The failed compile
is retained as the regression witness; the 98-case runtime prefix was not replayed
for this declaration-only fix.

Contracts/API build and web compile/static generation passed before Next16.4.3
stopped on its inherited security-upgrade recommendation. The coordinator
released one identical web-only retry, which passed, then missing MCP build,
17/17 MCP cases and final API/web/disabled-identity/fallback smoke passed.
Original failure/retry receipts remain separate. **Next's security-upgrade
recommendation remains unresolved advisory debt**; no upgrade, suppression,
configuration or dependency-pin change is included.

The first candidate measurement stopped in API tests after 299 passing assertions
and one file-level unhandled rejection: importing readiness's runtime dependency
started a migration-directory scan absent from the finite JavaScript mirror.
It was `api:partial`, not a passing scope. The failed scratch/receipt remain.
The coordinator released a test-only exact-URL/options filesystem double before
dynamic import of the same instrumented controller, delegating unrelated reads,
asserting one call and restoring/synchronizing built-ins in guaranteed cleanup.
Focused lint and all four affected cases pass. This covers controller projection
and injected readiness true/false, not migrations, SQL or live database readiness;
import-time execution receives only its actual measured first-party counters.
No production/mirror/provider/exclusion change resolves this test isolation issue.

### First proposal, rejected

The fresh four-scope measurement passes **765/765**, no skips: API299/web411/
contracts36/prototype19. All scope execution statuses are complete in measurement
mode; this is not a normal accepted gate. Count digest:
`f0a2cf82c4f40b2dd2cff4bcbc7dbc2ee5a41746b665441e6c1af6e73115ffe5`.

| Scope | Lines | Statements | Functions | Branches |
| --- | --- | --- | --- | --- |
| API | 1504/2079 | 1640/2273 | 414/597 | 1253/1737 |
| Web | 3538/4936 | 3894/5601 | 832/1356 | 4633/6971 |
| Contracts | 245/245 | 272/272 | 135/135 | 656/661 |
| Prototype | 238/853 | 269/984 | 87/368 | 194/954 |

The first proposal was **rejected** at protected floors. Web removes two fully covered
identity-parser functions, retaining 524 uncovered functions: 834/1358 becomes
832/1356, measured 6135 below protected 6141 basis points. Contracts migrates old
G01's 48/48 branches to 13/13 across facade/new owners, removing 35 covered
branch units. Its five existing G04/G05 uncovered units remain byte/source-
qualified: 691/696 becomes 656/661, measured 9924 below protected 9928. All new
contracts executable units and API input adapter units are covered; type-only
N/A stays explicit. Each failed floor would require one additional covered unit
at the present denominator, but no unrelated tests or redundant code are added
to manufacture that gain. Protected candidate floor bytes retain 6141/9928.

All eight tracked baselines remain byte-exact, including four historical files.
Prototype reports/manifest and proposed baseline reproduce accepted bytes.
Source/compiler/provider/tool-lock identities are compared independently; no
changed-source counter equivalence is claimed. Unchanged-source mapped S/F/B
units lose zero coverage: API 2976→3110 (134 gains), web 9142→9142, contracts
972→972, prototype 550→550, with unchanged maps. API gains include real controller
assertions and explicitly mocked import-time runtime initialization, not live DB
proof. Mapper missing/total column endpoints are API191/10408, web543/30568,
contracts21/2406, prototype69/5348; missing counts do not increase, and retained
precision limits remain. No dependency-internal coverage is credited.

Six new contracts sources include the maintained zero-unit helper; one API
input source is added; no source is removed. The API service/input ownership
changes L74/149→99/155, S76/155→108/168, F17/49→29/54, B54/116→50/84 through
schema extraction and meaningful negative controls. Remaining service/controller/
transport gaps stay owned. No normal replay/infrastructure/artifact packaging,
baseline adoption or stage D PG/HTTP/runtime/audits run while this gate is blocked.

The one final web build observation is 28 emitted JS chunks, 1660145 raw bytes /
474295 aggregate gzip9 bytes, with 14122 ms retry wall time. There is no equivalent
retained production chunk set for a comparative claim; retry cache/wall time is
not a performance improvement. No extra build was run for measurement.

## Released compatibility supplement and proposal two

The coordinator rejected proposal one, comparison
`6d2bf947643368b4f0b4bc3df6288e97be703521f3d47875f483711bd0936219`, without
lowering either floor. Its reports/snapshot and separate failed measurement
remain preserved. The released supplement changes only two test files:

- Existing selected `workspace-transport.test.mjs` exercises actual identity and
  workspace proxies with controlled fetch/environment/deadline doubles. It
  verifies fixed destination, duplicate queries, method/body/allowed headers,
  actual admission differences, status/cookie/location/no-store, abort and 503.
  It opens no listener and retains independent real-HTTP checks without
  relabeling them as unit credit.
- Existing contracts `guards.test.mjs` pairs G01 generic pages with retained G05
  discovery cursor validation using a full accepted discovery/item scope. Null,
  ordinary/2048 valid cursor, empty, invalid-character, 2049 and nonstring
  controls preserve their different policies. This releases only discovery-page
  cursor compatibility test debt; G05 production/query/invalidation migration
  and G04 remain separately owned.

Focused formatting/lint and **20/20** affected-file cases pass. One coherent
fresh four-scope measurement passes **771/771**, no skips: API299/web417/
contracts36/prototype19, digest
`f5007649c2dffd0f86383ee5154c13b5fbbcdcd2e6fadbafcc9ad9dd528f3782`.
No standard/build replay or production/config/provider/baseline change occurs.

| Scope | Lines | Statements | Functions | Branches |
| --- | --- | --- | --- | --- |
| API | 1504/2079 | 1640/2273 | 414/597 | 1253/1737 |
| Web | 3579/4936 | 3938/5601 | 836/1356 | 4652/6971 |
| Contracts | 245/245 | 272/272 | 135/135 | 657/661 |
| Prototype | 238/853 | 269/984 | 87/368 | 194/954 |

Proposed L/S/F/B floors: API7234/7215/6934/7213,
web7250/7030/6165/6673, contracts10000/10000/10000/9939 and unchanged
prototype2790/2733/2364/2033. Every protected floor passes without decreasing.
The supplement adds web L41/S44/F4/B19 through two unchanged proxies and one
contracts G05 branch; four old G04 uncovered units remain. All new schema/input
units remain fully covered. API/prototype's four reports each exactly reproduce
proposal one. Source/compiler/provider/config identities, denominators and map
precision stay unchanged. Unchanged-source mapped units gain API134/web67/
contracts1/prototype0, losing zero with unchanged maps. No dependency credit or
universal source conformity is claimed.

Historical pre-adoption checkpoint: separate
`coverage/t38-workspace-schemas/proposal2/` awaited independent numerical
approval, with all eight tracked baselines still byte-exact. Normal replay,
infrastructure/artifact packaging and Stage D remained gated after measurement;
the subsequent exact approval and actual normal proof are recorded below.

## Approved numerical adoption and normal proof

The coordinator independently approved proposal two comparison
`49be2b5a97bf7998576d1571fc1dc944762db3ba98db2ce87ba39405647670a0`, bound to
28-file snapshot `6dbfb62173b4b35b7cdc598bf1c08f740f9671406e2c651caf4c38c25fda3a43`.
Review verified all 32 accepted/candidate reports, eight protected baselines,
656 retained-file metric comparisons and raw unchanged-source maps/counters,
with no ratio decline, uncovered increase or lost mapped coverage. Archive
identity: `2026-11-23-t38/t38-2b-proposal2-approved`. This is numerical acceptance,
not final feature/PR acceptance; the preceding pending proposal snapshot keeps
its historical meaning.

Only three exact approved current baselines were adopted:

| Baseline | Approved SHA-256 |
| --- | --- |
| API | `0cf687bf2b82a2af8eaaa17e933e7ac8d9576fef169b96deb0594221e8488494` |
| Web | `bbd1658cd8ca74dfe305813d94ca3e41dff8ce993e5fd31f75648ff8b6400ec2` |
| Contracts | `f90a50db0466ce26200899d23f0b7586725433b170c35a5274fc3c37395c6de1` |

Prototype `aa02ac448391cc4bc3ab4bb748f25b6ca631c7297d10d813c5e72d64ae2b7541`
and all four historical baselines remain byte-exact, without writes. One fresh
real normal four-scope `--built` run passes **771/771**, without skips, reproducing
all **16 approved report hashes and sizes** and digest
`f5007649c2dffd0f86383ee5154c13b5fbbcdcd2e6fadbafcc9ad9dd528f3782`.
All four actual scope statuses are complete; no normal output is synthesized
from measurement. Production/test/config/provider bytes remained frozen
through the run. Full infrastructure passes **20/20**; artifact validation
packages **17 bounded files**, all complete, without upload. Whitespace checks
pass. These later documentation receipts do not rebind application runs.

Historical Stage C checkpoint: Stage D harness/real PostgreSQL/HTTP/runtime/
audits and local commit were still coordinator-gated before their later release
and completion below. Current-head CI/native Kilo and final acceptance remain
pending. Next advisory, production cost-comparison UNVERIFIED and named
configuration/private-receipt debt retain their earlier status. No further
standard/build replay occurred.

## Selected real HTTP and runtime evidence

After Stage C acceptance, the coordinator released the integration-only
`node scripts/test-identity.mjs --workspaces` selector, using already-built
contracts/API prerequisites. The flag must stand alone; five repeated/combined
flag probes reject before temporary-directory or subprocess/DB setup. The
selector runs principal, workspace and identity suites once, preserving existing
private environment/redaction, legacy-user/backfill fixture, double migration
deployment, deadlines/signals and label-verified cleanup. It skips unrelated
domain/sprint suites and their persistence/restart witness only for this flag.
The default full CI path and existing sprint-selector behavior stay intact;
they were inspected, not replayed for selection validation.

One selected real PostgreSQL18.6/NodeAdapter run passes **47/47**, without skips:
12 principal, 12 workspace and 23 identity cases. Added public-schema assertions
supplement existing canonical/status/security checks: serialized informational
context, health/config/session/null and DB expiry readback; normalized workspace
name/detail/receipt retry, recipient-email/hash-only invitation replay, member
mutation/list readback and workspace page/member/invitation envelopes. Invalid
body error precedence remains before authentication; disabled readiness retains
503/no-store. Raw auth/parsers, cookie renewal, real policy/current authority,
two tenants, human administration, forgery, versions/invitation races and
rollback remain exercised. Only provider HTTP is simulated; no real credentials
or provider/staging/user acceptance is claimed. Owned database/container/volume
and private fixture directory were cleaned. This selected path makes no domain
restart/T11 acceptance claim.

One existing Docker runtime run passes packaging/nonroot execution, migration
failure/repetition/schema gates, real locked-query/SIGTERM cleanup, readiness503
versus liveness200/recovery, durable diagnostic work across stack/DB recreation
and worker restart. API/worker and migration resolved graphs/full deployed stores
contain no Express. Inherited Prisma/Studio tooling peers remain in API/migration;
migration also retains TypeScript. This does not claim absence of all tooling.
Its owned containers, network, volume and image tags were removed. Identity
stayed disabled; the worker remains diagnostic-only and cannot migrate/listen.

Root and isolated-tool `audit --audit-level=high` gates pass: application one low/
fourteen moderate; tools two moderate, no high/critical in those snapshots.
**The inherited Next security-upgrade recommendation remains unresolved**;
there is no upgrade, suppression, pin change or vulnerability remediation.

Only integration harness/test files changed after the approved normal proof;
maintained production/unit/compiler/provider/baseline fingerprints remain bound
to Stage C. The runner-generated metadata fixture is compared through its
approved/normal manifest rather than treated as a physical source file. No
unit/standard/build rerun is needed for these integration-only assertions and
later evidence prose. Final offline links/whitespace and normal-hook local
handoff receipts accompany the coordinator delivery. The initial implementation
was published in Draft PR59; current-head CI/native Kilo and final acceptance
remain separate.

## Initial-head CI prerequisite correction

The coordinator reported initial-head
[CI138220779050](https://github.com/Ljrr3045/rielia/actions/runs/45327586391/job/138220779050)
failed in `pnpm check` at `test:identity:logic`, after the preceding phases passed:
`identity-controller.ts` could not load `@rielia/contracts/dist/index.js` on a
clean runner. The new runtime schema import requires built contracts; previously
prepared local output had masked this entrypoint prerequisite. The earlier local
sequence retains its actual source/run scope and is not clean-runner CI proof.

The released root `package.json` script adds
`pnpm --filter @rielia/contracts build &&` before the same two identity test files,
matching the existing workspace/project logic prerequisite pattern. No pin,
lockfile, install, CI workflow, production/unit source or baseline changes occur.
The root script is outside current unit comparable config fingerprints, verified
against actual manifests rather than triggering a baseline rewrite.

One focused proof safely moved only this checkout's generated contracts `dist`
into owned ignored scratch, verified absence, and ran the corrected pinned
script once. A fresh contracts build and **5/5** identity logic cases pass,
without skips. All 28 fresh generated files exactly reproduce the preserved
prior bytes; original output remains available. No full standard/build/normal/
PG/runtime suite is replayed. Current-head hosted CI/native Kilo and final
acceptance remain pending after this focused local correction.

Ignored evidence: `coverage/t38-workspace-schemas/`. Production cost comparison
requires equivalent retained evidence and remains unverified. Query/RHF/OpenAPI,
testing/browser/diagnostic additions, UI/DB/deployment, credentials/staging are
excluded. Omitted native Cancel/Leave remains UNVERIFIED with possible draft
loss; sprint filters remain T08/T10/US05. Current-head CI/native Kilo/final review
remain coordinator gates. The worker made no remote mutations; final acceptance
is not claimed.
