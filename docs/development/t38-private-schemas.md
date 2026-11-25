# T38.2h backend-private sprint receipts

**IMPLEMENTED; PUBLICATION/REVIEW/ACCEPTANCE PENDING, 2026-11-25 America/Caracas.** The coordinator released the three
sprint receipt owners from accepted PR64 merge
`541ac5de1625722fc2f1faf7ca56f103a267d4ef`. The exact user-approved numerical
exception below is adopted; publication, current-head review and acceptance
remain coordinator gates. Full T38.2/T38 remains open under
[issue53](https://github.com/Ljrr3045/rielia/issues/53).

[T38.2g is ACCEPTED in PR64](https://github.com/Ljrr3045/rielia/pull/64#issuecomment-7175578830):
reviewed `9886fb2adf33f71dc8f3c5291d787c0d5fc86c69`, merged `541ac5de`, tree
`bbff57eaeec629ba2ca9e31f262ba96fde8438f6`. Reviewed-head CI45676135795 /
check139424057741 and exact-merge CI45705881930 / check139527608640 passed
(App15368), with native Kilo139475936300/App2193792 passed. The full27-file review
and one-file incremental documentation correction leave zero findings; the user
resolved the thread. The settled terminal/worktree was stopped/removed, retaining
branch/evidence and all93foreign coordinator entries. [Issue53 closeout](https://github.com/Ljrr3045/rielia/issues/53#issuecomment-7175600441)
records delivery. Original local/candidate/failure receipts retain their actual
source identities and are not rebound to this slice.

## Trace, scope and dependency

This implements a bounded T38.2 preservation slice supporting T05–T11/T35,
directly T11/P09/US06 and T06's exact-key/atomicity contract. P02–P06/P08–P11/P38,
US02–US07/US11–US12/US24–US25 remain authority, authorship, isolation and recovery
constraints. P01/US01 is an unchanged dependency. No presentation or renewed
P33/US08/UX04/device/accessibility conformity is claimed.

The first proposed five-owner grouping was reduced to three: workspace and
project/task receipts have unchecked historical reads and different error behavior.
Adding their schemas requires a separate corruption policy, rather than an implicit
new503. No public contract, persisted format/data, SQL/migration, domain rule,
permission, transaction, hash, new-write journal, UI, Query, form/OpenAPI tool,
credential, worker or deployment change is included.

API explicitly owns runtime `zod` **4.6.7**. The lock adds only API's three importer
lines, reusing the existing contracts/Better Auth package, empty snapshot and
integrity:

`sha512-g8W2D2kU6a8untc053fX1uVBKzM7yqAxW/3zwk83+6RyF2+SKOuV+c0wBDhUwzV1PaGapmZH+rmcUzPf+3CGwg==`

The coordinator's exact npm metadata refresh records MIT and no declared engines,
dependencies or peers. This selects no repository license and authorizes no new
lifecycle script. Node24.22.1/pnpm12.15.0/TS6.0.3, strict peers, existing overrides,
patches and build-script policy remain. Frozen app/tools installs complete from
cache. The interrupted sandbox lock attempt and successful246ms offline update
are preserved separately. Current advisories and deployed closure require their
own evidence; registry metadata is not advisory clearance.

## Private schemas and retained replay behavior

`apps/api/src/projects/sprint-receipt-schemas.ts` owns small named/staged schemas.
Only matching identifier scalars are reused from contracts. Private receipts are
not exported publicly; no validator service or generic receipt framework is added.
Aborting refinements retain short-circuit reads. Validation copies may strip
unknown keys while returned operations retain their original identity/extras.

| Operation owner            | Persisted shape and retained behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sprint-mutation.ts`       | `{kind:'project-planning'}` or `{kind:'planned-sprint',id}`. Configure/project-planning ignores ID/operation/extras and returns current planning. Otherwise planned-sprint requires the existing primitive ID pattern; the configure-to-sprint fallback remains, without target equality. Invalid shape yields Planning503. No full public planning/Sprint schema is used.                                                                                                                                                                                                                                |
| `sprint-scope-mutation.ts` | Estimate stores `{kind:'task-planning',entity:'task',id}`; transitions store `{kind:'sprint-transition',entity,id,operation}`. Record/target/entity equality precedes current hydration. Estimate fast path then ignores operation. Otherwise the historical operation read precedes tag checking, followed by record/type/activityId and explicit null-or-ID sprint/entered/exited IDs. Missing nullable fields reject. No operation sprint/visit correlation is added; the retained estimate transition fallback remains. Original operation and extras are returned. Invalid shape yields Planning503. |
| `sprint-close.ts`          | `{kind:'sprint-close',sprintId,closureId,activityId}`. Exact source equality and primitive **ordinary strings**, including empty/non-ID strings, precede canonical closure read. Missing closure retains403; canonical closure/activity mismatch retains Closing503; current project/sprint reads follow. The public closure response schema is deliberately unsuitable. Extras are ignored.                                                                                                                                                                                                              |

Planning503 remains `Planning receipt is unavailable.`; Closing503 remains
`Closing receipt is unavailable.`. Zod errors never leave the API. Current verified
authority, Project read/lock and scoped receipt lookup precede shape validation;
request-hash409 precedes shape503. Replay precedes stale version/archive/mode work.
Scope hydration errors retain precedence over later operation corruption. Fresh
canonical state replaces no immutable successful operation identity. Replays write
no domain row, receipt, activity or outbox; successful writes retain the same
transaction, lock/await order, actor/mode/source/grant and idempotency namespace.

## Remaining owners and separate releases

All eight original persisted JSON owners remain accounted: the three above are
this slice; the five below retain explicit future work. No exclusion is accepted
merely because data is backend-private.

| Remaining owner under `apps/api/src`     | Existing behavior, candidate and next decision                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspaces/workspace.service.ts`        | Full summary/member/invitation DTOs, or invite `{issued:true}` without token. Create/accept rehydrate by unchecked truthy ID, missing ID409; other routes return stored JSON after current authority; invite replay always409. Public DTO reuse is a candidate, but full validation introduces new corruption failures. Workspace owner retains email/member/token sensitivity and the separate release. |
| `projects/project-task-mutation.ts`      | Full Project/Task DTO stored; unchecked `'projectId' in saved` selects scoped canonical reread. Null/primitives may throw; no new503 policy is chosen. Public schemas fit producer shapes but impose more fields than replay currently needs. Project/task owner retains content/person/provenance sensitivity.                                                                                          |
| `projects/task-collaboration.service.ts` | Existing array-or-empty/per-element `isActivityChange` filtering already reuses G04. Invalid elements drop; public max4 is not imposed on stored arrays; original accepted objects remain. Activity owner retains bounded categorical/date history.                                                                                                                                                      |
| `projects/sprint-scope-read.ts`          | Entry/exit/start/event/outcome snapshots are cast; first legacy activity change falls back through `isPlanningSnapshot` to null. Canonical snapshot schema is reusable where guarded, but adding parses at casts needs historical-storage/error-policy review. SQL JSON totals remain SQL-owned. Scope/history owner retains version/status/points/parent/archive sensitivity.                           |
| `projects/sprint-closure-read.ts`        | Frozen outcome snapshot casts feed totals/output without validation. Public snapshot schema is a candidate, but new read failures or null substitution require a separate decision. Closure owner preserves immutable historical data.                                                                                                                                                                   |

The six opaque decoder owners are subsequent slices, with unchanged base64url
encoding and2048-character bounds. Their envelopes are private schemas; contextual
scope/revision/hash and current-authority checks remain in the operation owner.

| Owner under `projects/`         | Existing binding and error precedence                                                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project-task-read.ts`          | Strict `{v,w,p,view,filters,revision,anchor}`; canonical filter equality, safe revision, scoped Task anchor; malformed400, changed409, missing anchor400.                                                                                                                              |
| `task-collaboration.service.ts` | Strict `{v,w,p,t,k,r,a}`; collection/scope and revision; malformed400, changed409, collection-specific anchor400.                                                                                                                                                                      |
| `task-discovery.service.ts`     | Strict `{v,w,actor,query,revision,anchor}`; order-sensitive normalized-query JSON equality; ordinary string revision/anchor; readable-project/actor digest409 precedes scoped anchor400.                                                                                               |
| `sprint-read.ts`                | Six-key `{v,w,p,revision,projectVersion,anchor}`; scope, positive safe versions, revision409 and scoped Sprint anchor400.                                                                                                                                                              |
| `sprint-scope-read.ts`          | Eleven-key `{v,kind,w,p,scope,projectVersion,taskRevision,sprintRevision,entityVersion,a,o}`; bounded decimal/bigint ordinal, scope400, each version's invalid400/stale409 interleaved in current order, then collection anchor. Shared scope and sprint/task history variants remain. |
| `sprint-close-preview.ts`       | Three-key `{v,binding,anchor}`; malformed400, contextual full-consequence/closure hash409, missing anchor400; preview and closure-outcome bindings stay distinct.                                                                                                                      |

C01–12 also retain separate ownership, as detailed by the
[boundary inventory](t38-boundary-inventory.md): C01 Identity conditional secret/
origin/provider config; C02 runtime/database/migration/worker gates; C03 main
host/port; C04 web proxies/fixture fixed upstream; C05 MCP HTTPS/loopback config;
C06 Prisma tooling DB pass-through; C07 diagnostic CLI action/UUID; C08 queue/worker
diagnostic payload/result; C09 private worker health/freshness file; C10 typed/build/
dependency policy; C11 T04 container/operator/secret templates; C12 quality/repository
metadata, coverage/maps/baselines/artifacts/hooks and handoff/skill validation.
The last three proposed runtime-schema exclusions need explicit disposition before
T38.6, preserving existing validation. No blanket acceptance/exclusion follows.

## Evidence and gates

Initial focused real owner units pass **79/79**, with contracts/API production builds pass.
They retain metadata fallback, ignored getters, equality-only identity, current-read
ordering, original operation/extras, ordinary close strings and canonical403/503.
Existing guard/security/race/rollback/replay regressions remain. New real-PG cases
insert malformed copies under new keys in isolated fixture memberships; existing
receipt immutability triggers remain enabled. Canonical state/activity/outbox/
receipt snapshots must remain identical across replay and rejection.

The standard sequence completes as a **resumed equivalent**, preserving its original
89499ms failed run: format/quality24/lint/NodeAdapter closure286/cleanup1,
identity5/workspace16/projects163/prototype19/real HTTP6 and all consumer typechecks
pass. Contracts/API compilation passes; Next16.4.3 compiles/types/generates all six
pages, then raises SecurityFatalError. The coordinator inspected its exact source/
log receipt and authorized one unchanged web-only retry, which passes in14616ms.
The missing actual MCP compilation, MCP17 and final production smoke then pass.
This is not an uninterrupted `pnpm check`, and the security recommendation remains
unresolved. No upgrade, suppression or further retry authority is implied.

Selected real PostgreSQL/NodeAdapter `--sprints` passes **47/47** in45892ms:
planning11, scope/start18, close18. The new malformed copied-receipt fixtures retain
hash409/authority403/shape503 and canonical replay with unchanged domain/journal/
outbox/receipt snapshots. Existing immutability triggers stay enabled. Owned
database cleanup completes; before/after container and volume sets are identical,
preserving foreign objects. This selector omits unrelated identity/project/default
restart tails; full original T11 is not rerun or reaccepted here.

One runtime/deployed NodeAdapter closure/recovery run passes in167418ms with
default-disabled identity: deployed API/worker/migration stores retain no Express,
nonroot/exclusion checks pass, migration gates/repeatability, readiness versus
liveness/DB recovery, locked enqueue/SIGTERM cleanup and durable diagnostic work
across full stack/DB recreation pass. Exact owned project cleanup completes;
container/network/volume/image ID sets are identical before and after, preserving
all foreign objects. No provider or deployment is involved.

Current app/tools high audits pass, retaining **application1low/14moderate** and
**tools2moderate** findings. These passing gates do not resolve Next16.4.3's
security-upgrade recommendation. Any new substantive failure or SecurityFatalError
returns to the coordinator gate; only owned labelled resources may be removed.

### Preserved rejected numerical receipts

**Numerical candidate1 was rejected.** One API-only `--measure --built` run
passes324/324 in10542ms over57 maintained inputs. API L1601/2130, S1744/2326 and
F454/628 improve; B1240/1653 is75.0151%, below the protected75.23% floor and prior
1258/1672 exact ratio. Scope mutation's56/57 becomes40/41 with the same one
uncovered grant-namespace branch, also lowering its exact ratio. Metadata retains
one uncovered grant branch. No baseline was written at that gate.

The branch delta is structural: close removes5 covered units; metadata removes
3covered/1uncovered; scope removes16covered; the new private module adds6covered.
The net decrease of19total/18covered and one fewer uncovered branch is not new
test credit. The private module's23L/23S/18F/6B units are fully covered; all53
unchanged API files retain exact counts and raw maps. The184-source mixed-origin
packet retains explicitly qualified PR64 web/contracts/prototype origins; those
three baseline candidates remain byte-identical. The virtual compiler fixture
is reconstructed from its unchanged runner literal, never claimed as a physical
file. All eight original baselines were unchanged at that gate.

Exact candidate bytes/SHA, full per-file denominators/ratios/uncovered comparisons,
raw counters/maps and252distinct physical source/test/config fingerprints are
preserved. The coordinator then released only the missing granted metadata/start
namespace and missing-current-Task403 regressions in two existing test files.
Affected units69/69 plus changed-file formatting/lint pass. The actual
PrincipalService verified-context denial units and already-passed real-PG exact-key
revocation replays supply current-grant authority evidence; no duplicate authority
test or unrelated administration case was added to chase coverage.

The separately released **candidate2 remained rejected**: API327/327 in10072ms,
L1601/2130, S1745/2326, F454/628, B1243/1653. It still missed the75.23% floor,
although all224retained API file metrics preserved ratios/uncovered counts and all
four migrated source owners became fully covered. The two granted namespaces add
one covered branch each; canonical Task absence adds one statement/branch in
unchanged `project-task-read.ts`. All57API raw maps match candidate1. Rejected
API bytes30403/SHA256`1089046ae7863f39419f35eaba4d7904bb08fcea191ec2d0aa36c13aeee37473`
and both mixed-origin packets retain their original statuses and source identities.

### Explicit one-time structural exception and coherent normal

On **2026-11-25 America/Caracas**, after seeing the aggregate decrease and retained
per-file safeguards, the user explicitly approved `ok procede` to adjusting only
this migration's API branch floor **75.23% → 75.19%**. Deleting covered handwritten
guard AST units changes weighting: branches1258/1672 become1243/1653 despite
uncovered414→410 and all four migrated source owners being fully covered.
The aggregate ratio decreased to75.196612%; this is a user-authorized aggregate
rebase, not aggregate nonregression. Generic no-lowered-floor policy remains for
every other change; no general waiver, exclusion or comparator/configuration
change is authorized.

Only the exact approved API baseline is copied, without regeneration:
**30403bytes/SHA256`9431f43934fe4a591b7da1966405454f2f66cef953885d6849a4e60a349a9361`**.
Its L/S/F/B floors are7516/7502/7229/7519; it differs from rejected candidate2
only in the branch floor. Other seven baseline files, including prototype and all
four historical baselines, remain byte-identical. Original eight baseline bytes,
both rejected packets and the separate accepted-exception receipt are preserved.

Fresh coherent normal `--built` passes **844/844** (API327/web426/contracts72/
prototype19) in45842ms, enforcing the adopted baseline normally. All16actual report
files reproduce reviewed candidate2 bytes; this is a fresh full execution,
separate from that earlier mixed-origin proposal. Count digest is
`7a93fc5b6e216477afea9414a67e2e2ac95bc228764fc75e6c95fa07ea7b372a`;
the actual normal receipt identity is
`6d7905db7d3f5bef52b10dd5e60b74f33366d78a133d9cc81a51522e997ea559`.
Infrastructure20/20 and artifact validation pass without upload. Standard/MCP/
real-PG/runtime/advisory runs above retain their own source bindings and are reused
without replay for the unit-only supplement and baseline/documentation adoption.

Root owns remote publication, Draft/Ready, current-head CI/native Kilo, review,
merge and cleanup. No remote mutation or paid review is included in local work.
Full T38 remains open, retaining G06 optional/dense-helper debt, Next16.4.3's
security-upgrade recommendation, dated app1low/14moderate and tools2moderate
advisory debt, user-omitted UNVERIFIED Cancel/Leave with possible draft loss,
sprint-filter and deferred provider/staging/real-user/device/accessibility evidence.
