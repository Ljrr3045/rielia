# T11.3 sprint close and explicit carryover

Status: implemented and locally verified in [Draft PR52](https://github.com/Ljrr3045/rielia/pull/52).
Current-head CI/native review and coordinator acceptance remain pending. This is the
bounded T11/B1c, P09/US06 API/transport slice, with affected P05/P08/P10 and
US05/US12. Full T11 remains IN PROGRESS. T11.4 owns UX04 presentation and T11.5
owns integrated acceptance. No UI, T22 reports/charts, new grants/credentials/MCP,
landing, dependency upgrade, deployment or real-provider/staging/user acceptance
is included.

T11.1 was accepted in [PR50](https://github.com/Ljrr3045/rielia/pull/50#issuecomment-7025241040),
merged `e215973c8b83c3353f39959a49501e5d7521fbbc`. T11.2 was accepted in
[PR51](https://github.com/Ljrr3045/rielia/pull/51#issuecomment-7029096363), reviewed
`a966441850a22a786ebe1227ce4247d4736c6ae1`, merged
`10f0e89bc2b901071de235a7352e759bdd3e48d3`. Its exact postmerge
[validate](https://github.com/Ljrr3045/rielia/actions/runs/44665402349/job/136053330577)
passed. Earlier dated evidence in [scope/start](sprint-scope-start.md) remains
historical; its then-pending wording does not supersede that acceptance.

## Public contract

Paths are relative to `/api/v1/workspaces/:workspaceId/projects/:projectId`.
The existing verified subject, current Project access/grants, same-origin JSON
boundary, no-store, request IDs and UUID-v4 idempotency contract remain.

| Route | Contract |
| --- | --- |
| `GET /sprints/:s/close-preview?destination=backlog\|<planned-id>&cursor=…` | Write-authorized read; complete canonical totals and SHA-256 binding, at most 100 consequence rows, bound continuation |
| `POST /sprints/:s/close` | Explicit destination/null, source/target/Project versions, Task/sprint revisions, preview schema/hash and caller-retained key/body |
| `GET /sprints/:s/closure` | Current-read-authorized immutable original closure summary |
| `GET /sprints/:s/closure/outcomes?cursor=…` | Current-read-authorized frozen outcomes, at most 100 rows and closure/scope-bound continuation |

Queries are strict scalars; reads have no payload. Every pending participant,
including an informational child or archived Task, requires an explicit destination.
Null is permitted only when no participant is pending. The destination is either
unscheduled backlog or a distinct same-Project planned Sprint. Done and canceled
remain separate; children participate independently and never cascade with a
parent. Only top-level estimates count points; zero, null and retained off-scale
estimates remain distinct. An empty Sprint may close. Closing an existing active
Sprint also works in Kanban, while archived Project writes remain denied.

Unscheduled backlog removes membership while preserving Task status, rank,
version, estimate, archive and `taskRevision`. Carryover to a planned Sprint has
the same Task preservation contract. No implicit Sprint creation/start/close,
Task reopening, status reset or closed-Sprint reopening occurs.

The versioned SHA-256 binds server-resolved actor/mode/grant policy and scope,
Project/source/target versions, Task/sprint revisions, destination and the ordered
complete immutable consequence tuples. It binds freshness, never authorization.
A continuation or close cannot silently rebase or process only its visible page.

## Ownership, storage and retry

PrincipalService owns the current authority fence and transaction. Close locks
Project, distinct sorted Sprints and sorted participating Tasks, then recomputes
the complete preview. Actual close time is captured after those locks. Sprint
owners perform grouped membership-only writes, including archived participants;
Task owners supply canonical snapshots. No Task-DML path or per-Task transfer
loop is used. Each affected Sprint advances once, with one aggregate source
`close` fact and one destination `carryover` fact linked through outcomes.

One additive migration, `20261121000000_sprint_close`, adds `closedAt`, one immutable
`SprintClosure` per source and one immutable `SprintClosingOutcome` per source
visit current at close. Scoped FKs, unique/exact-set/deferred guards preserve
the complete set, original start event/references and ordinals, and the existing
one-active and one-current-visit indexes. Closed metadata, scope and semantic
writes are denied, including insertion into old ordinal gaps. Earlier migrations
are unchanged and no historical outcomes are backfilled.

State/visits/outcomes, server-authored Activity, minimal outbox and a dedicated
close receipt commit atomically. The immutable operation/summary is distinct
from freshly authorized current state. Current write authority precedes replay;
original-key replay precedes stale version/state/mode/archive checks. A different
normalized body with the same key conflicts. The close transport never retries
automatically. Later Task/status/parent/estimate/archive changes and destination
metadata cannot rewrite closing outcomes or original start facts.

All Sprint list/get/conflict/capability and legacy configure/create/edit/start/
visit/estimate receipt paths understand true closed state. Original hashes,
namespaces and reference tags, including `planned-sprint`, remain. Scope exposes
frozen `closingTotals`, manual `removed` and `transferred` separately from close
dispositions; safe Task history links outcomes, and Sprint history uses aggregate
facts without duplicate legacy Activity projection. Hydration uses grouped reads.
Existing SSE Project/Task invalidation and true Project versions remain.

## Migration operator compatibility

Use the [planning maintenance procedure](sprint-planning.md#owners-migration-and-recovery):
drain readers/writers and long transactions, run only the explicit migration
one-shot, keep dependents stopped on failure, and verify readiness before resuming.
Fully validated DDL holds strong locks through commit. Large-table duration and
online/zero-downtime availability are unmeasured.

Drain old writers and deploy schema, serializers, contracts and transports
together. T11.2 binaries cannot safely observe closed storage, and their writers
omit closure facts. Application-only rollback is unsafe after use; keep traffic
stopped for verified roll-forward or separately reviewed database restoration.
No destructive down-migration or deployment automation is supplied.

## Verification and limits — 2026-11-20

Frozen root and isolated tool installs retain all pins and policies. The coordinator
approved only the three exact current API/web/contracts coverage candidates before
baseline writes. [Normal coverage](unit-coverage.md#t113-closecarryover-coverage--2026-11-20)
passes **558** cases (290/228/21/19); all 16 reports reproduce the candidates
byte-for-byte. Twenty infrastructure checks and bounded artifact validation pass.
Prototype/four historical baselines and all 11 earlier migrations remain exact.
The new close receipt grant-namespace arm is explicit uncovered unit debt; real
grant tests supply no unit credit. No source/test removal, ignore or lower floor.

The complete standard check passes formatting/tooling/lint, backend closure,
logic/integration cases, strict types, production builds, 17 MCP cases and HTTP
smoke. Next's existing security notice stopped the first run; its supported
unchanged-command retry passed. No dependency or security-setting change was made.
Current high/critical audit gates pass: root has 14 moderate/one low finding;
isolated tooling has two moderate findings. Next's security-upgrade recommendation
and that dependency debt remain explicit follow-up work.

The full retained real PostgreSQL/HTTP/security sequence passes principal,
workspace, project/task, collaboration, discovery, planning, scope/start, close
and simulated-provider identity suites (12/12/32/12/12/10/17/13/23 cases).
The **14-table** digest/readback survives real PostgreSQL and API restart,
including immutable closure/outcomes, exact-key close replay after later mode/
archive/Task/target changes, a known carried participant, and the retained active
participant/legacy retry witness. No arbitrary empty read can skip either witness.

The final focused close suite passes **14** cases after one additive non-unit SQL
test. It proves real cross-scope closure/target-visit FKs reject with `23503`, and
complete close Activity/closure/event facts still reject missing outcomes with
`23514`. All earlier test bytes are retained. The preceding full run had 13 close
cases; it is not relabelled as executing this later addition. Application/unit/
provider/baseline bytes remain unchanged. Evidence includes:

- Complete 103-participant consequences and bounded continuation/outcome pages;
  empty/done/canceled, zero/null/off-scale, independent/archived and child-only rules.
- Exact preservation of Task rows/ranks/status/archive/version and `taskRevision`;
  immutable start references and frozen outcomes after later semantic changes.
- Close versus Task/scope/target/mode/archive/access/grant races, same/different
  keys, current-authority replay and actual committed HTTP-response loss.
- Actual close time after Project/participant locks, rollback at every aggregate
  durable stage, direct closed metadata/old ordinal-gap/start/outcome immutability
  guards, exact sets and foreign scope rejection.

The isolated runtime suite passes fresh API/web/migrator images, nonroot runtime
files, Express exclusion, explicit migration failure/gating/reapply, controlled
DDL delay, schema/DB readiness recovery, lock deadlines, signal cleanup and durable
queue restart. It cleans only its owned containers, networks, volume and image
tags; PostgreSQL harnesses also clean their owned fixtures. No task-local server
is retained. Doubles do not establish SQL/security/restart properties, and this
API-only slice does not establish UI/usability or full T11 acceptance.

The implementation batch is `52cb23f`; this publication update changes prose only.
The same [Draft PR52](https://github.com/Ljrr3045/rielia/pull/52) targets `dev`.
Handoff/asset/local-link and whitespace checks pass, with repository commit hooks;
all code/unit/SQL/dependency/baseline bytes remain those tested above. Current-head
hosted CI remains a delivery gate. Coordinator owns Ready/native Kilo, thread
disposition, acceptance and merge; this worker activates none of those actions.
