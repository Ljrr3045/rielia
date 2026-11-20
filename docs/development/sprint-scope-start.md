# T11.2 persistent sprint scope and explicit start

Status: implemented and locally verified in [Draft PR51](https://github.com/Ljrr3045/rielia/pull/51)
from implementation head `24a331f`. Current-head CI/native review and coordinator
acceptance remain pending. T11.1 was accepted in [PR50](https://github.com/Ljrr3045/rielia/pull/50#issuecomment-7025241040),
reviewed `4ce5775`, merged `e215973`; its exact postmerge
[validate run](https://github.com/Ljrr3045/rielia/actions/runs/44638739992) passed.
Full T11 remains IN PROGRESS after this slice.

This API/transport batch addresses T11/B1c, P09/US06, affected P05/P08/P10 and
US05/US12. T11.3 owns close/carryover, T11.4 owns UX04 presentation and T11.5 owns
integrated/native acceptance. No UI components/styles/controllers, T12 credentials,
OAuth/MCP catalog, T22 reports/charts, bulk, landing, deployment or real-provider/
staging/user scheduling are included. Accepted T36/T37 boundaries and immutable
handoff remain intact.

## Public sidecars

Paths are relative to `/api/v1/workspaces/:workspaceId/projects/:projectId`.
Every read/command/replay rechecks current tenant/project and coarse read/write
authority. Human-only administration stays human-only; delegated/autonomous
subjects gain no custodian permissions or new `sprints:*` grant contract.

| Route | Explicit input/result |
| --- | --- |
| `GET /tasks/:taskId/planning` | Current Task semantic snapshot, Task/sprint revisions, nullable current visit and current Sprint/capabilities |
| `POST /tasks/:taskId/planning` | `{expectedVersion,estimatePoints}`; explicit null clears, zero is estimated |
| `POST /tasks/:taskId/sprint` | `{expectedTaskVersion,expectedCurrentParticipationId,expectedSourceVersion,targetSprintId,expectedTargetVersion}`; source/target absence and versions are explicit nulls |
| `POST /sprints/:sprintId/start` | `{expectedVersion,expectedProjectVersion,expectedTaskRevision}`; no client actor/time/state |
| `GET /sprints/:sprintId/scope` | At most 100 visit rows, canonical current/start totals and removed count |
| `GET /sprints/:sprintId/history` | At most 100 typed facts, projecting retained earlier Sprint Activity exactly once |
| `GET /tasks/:taskId/sprint-history` | At most 100 planning facts; legacy Task history union is unchanged |

Only scalar `cursor` is accepted on the three paged sidecars. Separate typed
envelopes bind collection, tenant/project/entity, Project/Task/sprint revisions
and entity version. Authorization precedes anchor access. Counts cover the full
authorized collection, not its visible page; hydration is grouped. Task history
orders committed operations by outbox sequence and stable event ID; Sprint
history orders Sprint version ordinals. Wall-clock timestamp ties do not decide
membership at start. Legacy Project/Task DTOs and SSE remain unchanged. Sprint
events invalidate the true current Project version.

Existing Sprint list/read/edit routes now return a planned/active discriminated
union. Planned fields stay compatible; active requires immutable `startedAt`.
`isPlannedSprint` stays narrow. Normal, conflict and replay transports understand
the same union. Existing metadata management works in Kanban; creation/start
require Scrum. Neither scheduled boundary starts a Sprint automatically. Empty
start is legal. There is no closed state or close/reopen endpoint.

## Domain, owners and transactions

Nullable integer estimates are bounded to 0–1000. A changed non-null estimate must
belong to the current Project scale; the same retained off-scale value is legal.
Scale edits never rewrite estimates. Ordinary archived Task estimates/manual
scope and archived Project writes are frozen. Archive retains participation.

Each participation is a visit with immutable entry identity/snapshot and one-time
exit. A partial unique index permits one current visit per Task across all
planned/active Sprints. Transfers finalize the source and create a new destination
visit atomically. Re-entry creates another visit. Membership changes leave Task
content/status/rank/archive/version and the existing Task-DML `taskRevision`
unchanged. Children participate independently; only top-level participants count
points/done/canceled/pending totals. Child information and archived participants
remain visible. Done/canceled are distinct; zero/null remain distinct.

PrincipalService retains authority/fence/transaction ownership and its existing
timeouts. The lock order is Project, distinct sorted affected Sprints, then sorted
Tasks. Destination rank compaction covers every row including archived rows.
Task owners supply canonical snapshots/estimate writes; Sprint participation
owners perform visit/reference/event writes using the same transaction. There
is no service DI cycle, nested independent transaction or post-commit observer.

Task mutation observations run after all Task writes and the existing Activity,
before outbox/receipt. Parent assignment can advance the Task version twice; its
event uses the final persisted version. Status/move, parent, archive/restore and
estimate changes append semantic facts to a current visit. Rank/version/comment/
title-only changes do not fabricate scope observations. A same-value estimate
retains its command Activity/receipt without a semantic planning-history row.

Start locks and snapshots every current participant, including archived Tasks,
children and rows beyond the first page. Actual start time is captured after
authority/fence/row locks. The resulting Sprint version is its event ordinal.
Entry/exit ordinals define the exact start reference set. Deferred SQL guards
require the unique start event even for empty scope and the complete reference
set; scoped FKs and append/one-time-finalization guards retain those facts.
Later Task/metadata changes cannot rewrite references, entry or finalized exit.

## Retry and storage compatibility

The original configure/create/edit normalized payloads, hashes and key namespace
are unchanged. Historical `planned-sprint` receipts are reference-format tags;
after current write authorization they rehydrate the actual current Sprint union
before stale version/mode/archive checks. A committed original create/edit can
therefore replay as active after later edits/Kanban/archive without another
Activity/outbox/history row. Revocation still denies replay.

New start/visit receipts separately identify the original successful Activity and
entered/exited visit IDs, then resolve freshly authorized current state. A later
removal does not change which entry succeeded. New estimate receipts resolve
current Task planning. A caller explicitly retries the exact original key/body;
neither web transport automatically retries mutations. HTTP response loss after
commit is distinct from rollback. Same-key/different-body conflicts; no client
actor or timestamp is trusted.

One additive migration, `20261120000000_sprint_scope_start`, adds nullable Task
estimate and actual start fields without Task/version/rank/counter backfill,
planned/active constraints, one-active/current-visit indexes, scoped visit/event/
reference tables and Activity actions. Every prior migration remains unchanged.
SQL facts constrain storage consistency; they do not authenticate database actors
or replace canonical Task snapshots from application owners.

Use the [existing migration maintenance procedure](sprint-planning.md#owners-migration-and-recovery):
stop/drain readers, writers and long transactions, run only the explicit one-shot,
keep dependents stopped on failure, then check readiness before resuming traffic.
Fully validated DDL retains strong locks through commit; no online/large-table
availability claim is made. Deploy matching schema, DTO serializers and transports
together, with old writers drained before participation is used. Once active
storage exists, T11.1 binaries cannot safely read it: their serializer labels all
rows planned. Old Task writers also omit required observations. Rolling back
application binaries alone is unsafe; keep traffic stopped and use a verified
roll-forward or separately reviewed database restoration plan. No destructive
down-migration or deployment is supplied.

## Verification state

Frozen workspace and isolated unit-tool installs preserve dependency pins. The
coordinator approved exactly three current coverage baselines after independent
fingerprint/count/ratio/mapping review. Normal all-source coverage passes **510
cases** (274 API, 203 web, 14 contracts, 19 prototype) and reproduces all 16 measured
report files byte-for-byte. All old floors/per-file ratios are retained or improved;
prototype/four historical baselines and all 11 earlier migration files stay exact.
The [unit guide](unit-coverage.md#t112-scopestart-coverage--2026-11-19) records
hashes, counts, generated metadata witness and inherited/new uncovered/null debt.
Twenty infrastructure checks and bounded artifact validation pass. Numerical
approval does not constitute source/product acceptance.

The complete standard check passes formatting/tooling/lint, backend dependency
closure, logic/integration tests, strict types, production builds, 17 MCP cases
and production HTTP smoke. Next's existing security notice stopped the first
build; the supported unchanged-command retry passed. No advisory suppression,
pin or security-setting change was made. Current audits pass the existing high/
critical gate: root 14 moderate/one low; isolated tooling two moderate. These are
dated audit counts, not universal vulnerability absence; Next's upgrade notice
and inherited dependency debt remain explicit follow-up work.

The full retained real PostgreSQL/HTTP/security sequence passes principal,
workspace, project/task, collaboration, discovery, planning, scope/start and
simulated-provider identity suites (12/12/32/12/12/10/16/23 cases respectively).
The expanded twelve-table persistence digest/readback survives real PostgreSQL
and API restart, including estimates, visits, references/events and old data.
Original create/start/visit keys replay exactly once after removal, Kanban and
archive, with original transition identity distinct from authorized current state.
The obsolete T11.1 assertion that start is unimplemented was updated to check its
empty-payload rejection; close remains explicitly unimplemented. This correction
changes no application/unit/baseline bytes.

The final expanded focused suite passes **17 cases** after adding direct SQL
checks for the independent one-active/current-visit indexes and exact reference
set rejection. This targeted run follows the full sequence above; it does not
relabel the full run as containing the later test additions. Evidence includes:

- Legacy/archived Project, Task and planned Sprint preservation without DML
  backfill, migration reapply and no fabricated historical facts.
- Entry/exit/reentry, atomic transfers and concurrent starts/assignments, independent
  children and archived participants, full 102-row start reference and bounded pages.
- Final parent versions, status/move/estimate/archive/restore observations and
  archived rank compaction without rank/version/title/comment-only scope events.
- Actual tenant/private/viewer/delegated/autonomous/revoked authority, current-state
  legacy/new receipt replay and committed HTTP-response loss with exact-key retry.
- Injected rollback at reference/visit/Sprint/event/Activity/outbox/receipt and Task
  observation stages, direct FKs/immutability, missing/extra reference rejection,
  lock-wait actual timestamp capture and once-only retained Activity projection.

The isolated runtime suite passes API/web/migrator images, nonroot runtime files,
complete Express exclusion, explicit migration failure/gating/reapply, controlled
DDL delay, readiness/schema/DB recovery, lock deadlines, signal cleanup and durable
queue restart. It removes only its owned containers/networks/volume/image tags;
PG fixtures likewise remove their owned databases. No provider, production or
staging deployment was used. Earlier failed diagnostics remain failed evidence.

Handoff/whitespace checks pass (47 imported files, 30 assets, 901 local links).
The complete batch is published as Draft PR51; application/unit/baseline bytes
remain exact through the documentation URL update. Current-head hosted CI remains
a delivery gate. Coordinator owns Ready/native Kilo/ownership, acceptance and merge.
Unit doubles do not prove SQL/security/restart properties; API-only evidence does
not complete native UI or full T11 acceptance. Later close/UI/integrated work and
real-user/provider/staging scheduling remain outside this slice.
