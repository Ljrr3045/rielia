# T36 project scoped reads and cohesive commands

This bounded T36.5 continuation starts from merged PR #40 at
`3d2354575399dd81d366736ee6630424c750c7e0`. It separates existing feature-local
queries/hydration, the cohesive mutation protocol and real command callbacks.
The earlier [values/policy/DTO owners](project-values-policy-extraction.md) stay
unchanged. Public facade/DI/composition signatures and existing behavior remain.

Traceability: T36.5; existing T06–T10/T35, P01–P11/P33/P38 and
US01–US08/US11–US12/US24–US25. No UI, schema, policy, provider, runtime/dependency
pin, configuration or neighbor-kernel rewrite is included. T36, remaining frontend
extraction and T36.6 acceptance remain open before T37, then T11.

## Ownership and transaction boundary

| Owner | Existing responsibilities |
| --- | --- |
| `project-task-read.ts` | Current readable/eligible predicates, project/task/member lookup, bounded people hydration, current view assembly, project/task/access/assignee pages and their distinct cursors; discovery metadata and events' ID/version selection remain explicit |
| `project-task-mutation.ts` | One current PrincipalService write operation; canonical request hash/scope, current target authorization before receipt, current authorized replay, actual work and awaited activity → outbox → successful receipt |
| `project-task-command.ts` | Real project/access/task/move callbacks, expected-version/archive errors, current assignment, parent/child-warning and tagged PostgreSQL rank composition |
| `ProjectTaskService` | Unchanged constructor/DI and every public signature; the existing single read operation delegates its same tx/actor/canWrite, command methods delegate to feature functions, and discovery/events/collaboration/parent seams remain compatible |

The functions use concrete existing transaction types and the same
PrincipalService instance. Reads and commands never call back into the facade or
open nested operations. There is no universal repository/query emulator, cursor
framework or new provider graph. The required-management exception remains a
bounded feature adapter; the accepted pure policy module stays free of Nest and
Prisma dependencies.

PrincipalService's current resolve, trust evidence and shared-read/exclusive-write
fence stay unchanged. The source comparison preserves query/lock order, receipt
admission and current DTO replay, version/archive/assignment/order/parent and
child-warning behavior, same-transaction journal awaits and PostgreSQL allocation.
No permission, SQL trigger, rank or outbox implementation moves to a test double.
Collaboration, discovery, events, workspace and identity kernels, controllers and
NodeAdapter wiring are unchanged.

## Comparable extraction and separate test gains

Node 24.22.1, pnpm 12.15.0, TypeScript 6.0.3, Nest 12.3.2, Prisma 7.10.1 and
the existing provider/patch graph stay fixed. Local work uses verify-deps `error`,
workspace concurrency 1, serial heavy phases and 15-second cooling. No install,
cache repair, copied task execution state or production comparator bypass occurs.

| Phase | API / total cases | API / total inputs | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A: accepted PR #40 | 148 / 288 | 33 / 104 | 638/1477 | 698/1617 | 156/396 | 523/1228 |
| B: extraction, retained tests | 148 / 288 | 36 / 107 | 648/1491 | 710/1637 | 168/416 | 523/1228 |
| C: same source, targeted additions | 216 / 356 | 36 / 107 | 782/1491 | 859/1637 | 202/416 | 645/1228 |

A reuses accepted C raw/source/emitted maps plus final lint-qualified reports under
the explicitly admitted five-`globalThis` qualification bridge from PR #40.
Original raw/test identities remain labeled; no new A application run is claimed.
One B and one C run suffice under the coordinator's bounded validation contract;
there is no speculative B repeat. Final current-head hosted reports remain an
independent delivery/stability gate.

Source comparison owns all 40 old named groups, ten read callback/closure splits,
concrete collaborator parameters and 20 new facade delegates. Independent raw
review joins all 786 old outcomes with identical hits, including 407 zeros,
60 implicit-if arms and 52 compiler units. Forty new statement/function units
belong to the 20 delegates; their 16 B zero outcomes remain visible. B's extra
covered wrapper functions/statements and physical lines are structural accounting,
not newly tested business behavior. Branch coverage stays exactly 523/1228 in B.
All 32 unchanged API files retain their complete A maps/hits in B. C retains B
source/maps and every already-covered outcome; its gains are measured separately.
The other scopes' 12 reports are byte-identical across A/B/C.

Actual mapped UTF-16 bounds pass. Global unknown endpoint fields are 149 in A and
142 in B/C, with original null meaning retained rather than fabricated columns.
Raw/compiler-parent and empty implicit endpoints remain explicit in the private
join. These task-bound findings change no provider/precision policy or future
migration rule.

Only the current API baseline migrates, using production
`baselineFor` and the lean manifest. Accepted L/S/F/B floors are
52.44/52.47/48.55/52.52 percent. The coordinator accepted the exact numerical migration; seven other current/historical baselines remain unchanged. No test
gain is used to conceal extraction loss or weaken an existing gate.

## Public behavior additions and retained limits

One focused suite adds 68 cases/subtests through the actual facade. Its finite
ordered double only supplies loaded answers and records attempted collaborator
calls. It evaluates no query, permission, storage, increment, trigger, transaction
or rollback. Unexpected calls and unused required answers fail the case.

The additions cover bounded project/task/access/eligible-assignee pages, scoped
anchors and distinct task revision/filter/archive cursors; column counts and
authorized historical/current selection; same-value project version writes,
archive/restore/conflict fences; exact access-target conflict DTO and upsert
boundaries; current project assignment; and move order/anchor/open-child warnings
versus acknowledged parent-only movement. Existing 148 API cases remain, including
the 74 neighbor cases, current-authority replay/awaited journal failures and 19
values/policy/DTO cases. Existing access-review/management/historical projection
controls are reused rather than duplicated. Inherited unexecuted createProject
paths and broader unit debt remain visible.

Fresh contracts/API builds and source lint pass without source corrections. The
focused 68 cases pass after final test lint/formatting. An initial missing explicit
Buffer import was caught by lint before C, corrected and preserved as failure
evidence; only affected checks were repeated. B and C complete in approximately
14.4 and 14.8 seconds, with actual exit, process-group/capture cleanup and owned/
frozen dependency evidence. Four new supported paths are adopted at 216/216.

The normal `pnpm check` passes in 76.25 seconds, infrastructure passes 20 cases,
and all four production comparable/nonregression gates pass against the actual
final C reports without another application measurement. Artifacts, handoff
(47 imported files, 30 assets, 620 links in 71 documents), whitespace, source-frame
identity and owned/frozen dependency guards pass. Actual closing process groups
exit without timeout/leak. Normal native task transitions remain recorded without
restoration. Tracked quality hooks govern local commits; publication and
current-head hosted CI/native Kilo remain coordinator-owned delivery gates. Unit decisions/call order
do not replace real PostgreSQL two-tenant/private-project/security, authorship,
version/idempotency/race/rollback, lock/rank/outbox/SSE/restart and runtime/closure
checks; remote CI owns those retained checks. No new local Docker, provider/
staging/user/device result, deployment, merge or completed ticket is claimed.

## PR #41 review assertions

The completed native Kilo round suggested two test-strength improvements. The
historical-assignee lookup now checks its exact workspace/project/assignee scope;
the eligible-assignee page checks active membership/principal state/kind and both
private-project entitlement predicates. Its public item DTO check replaces the
unconditional-active assertion. Production source, loaded answers and 68-case
inventory are unchanged. Only that suite fingerprint changes in the current API
baseline after independent/coordinator acceptance; all numerical/source/provider
values and seven other baselines stay exact.

The one final ordinary gated `--built` run passes 216 API/356 total cases in
14.54 seconds against the retained build, followed by infrastructure20 and actual
artifact validation. Sixteen reports are byte-identical to accepted C; only the
API manifest's accepted test fingerprint differs. Original A/B/C/raw history and
failed browser attempts remain untouched. No production build, B comparison or
finite-control replay is repeated. Root owns Draft publication, both thread
dispositions and the new current-head hosted CI/native Kilo round.
