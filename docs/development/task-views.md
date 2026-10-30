# T08.0/B1b persistent list and Kanban logic

This bounded logic slice follows merged [PR #18](https://github.com/Ljrr3045/rielia/pull/18),
`ac3de5351e49b8b60bf3b2bbb55b8d695899f68d`. Both completed T07 worktrees are absent
from current Orca inventory. It implements the existing-field portion of
P05/P08, preserves P14/P33/P38 and US04/US05/US08/US12/US24–US25, and supplies
UX01/UX02/UX03/UX05/UX06/UX07/UX09/UX11 contracts for UXR01/02/03/04/06.
See the unchanged [product](../handoff/01-product.en.md),
[T08 architecture](../handoff/02-architecture-technical-plan.en.md), and
[UI guide](../handoff/04-ui-ux-development-guide.en.md).
Presentation, touch/keyboard/drag controls, copy and browser accessibility QA are
separately owned. No JSX/CSS or new product route is included.

P07 configurable workflows, labels and sprints are absent. Their US05 filters
remain open; this delivery does not complete full US05/T08/P05/P14/P38. There is
no T09 comments/subtasks/history UI, T10 search/My tasks/SSE, B2 saved/advanced
views, new credential/authentication adapter, generated OpenAPI-client project,
dispatcher/business worker, RLS/deployment, real OAuth/staging or real-user acceptance.

## One task source and persistent order

`Task` remains the canonical PostgreSQL entity. List and board query the same
records, permissions, versions and ordering. The fixed statuses are `backlog`,
`todo`, `in_progress`, `done`, `canceled`; they are semantic baseline values,
not configurable workflow definitions.

List order groups those statuses in that order, then uses persisted rank and
immutable task number. A board column is exactly its status partition. This is
an explicit status-grouped list, not a second global backlog ordering.
The server returns ordered pages; the browser never submits an index or rank.

The additive `20261030180000_task_views` migration adds positive bigint `Task.rank`
and positive integer `Project.taskRevision`. Existing rows are deterministically
backfilled within workspace/project/status by task number with gaps of 1024;
their versions, archives, content, attribution and prior migrations are preserved.
A deferred scoped unique constraint protects ranks, including archived rows.
The explicit one-shot remains the only migration owner; API/worker cannot migrate.

Normal placement uses a bigint midpoint or appends with a gap of 1024. A full gap
or bigint tail compacts only the destination status partition inside the same
transaction, preserving relative order, then retries once. Compaction includes
archived rows so restore retains its canonical position and cannot collide.
It conservatively advances every updated row's existing edit version, including
the moved row if applicable. These internal rank changes are one aggregate move
with one immutable activity/outbox/receipt, rather than separate authored content
edits; no title/description/creator is changed. A successful move can therefore
advance a row version more than once. Drafts safely conflict instead of silently
overwriting. Compaction failure rolls back all rank/version/revision/event effects.

Every task insert/update advances the project task revision, including content
edits, status-only edits, archive/restore and compaction. It is a monotonic token,
not a promised increment of exactly one. Task revision and number allocation
leave the project content/access version unchanged. Project edit/access version
fences keep their existing behavior.
Create and ordinary status edits append to the destination; archive retains rank,
restore retains position. The existing singleton policy fence serializes writes.
This deliberately conservative implementation makes no throughput or performance
target claim; rare compaction is proportional to column size. PostgreSQL documents
[integer precision](https://www.postgresql.org/docs/18/datatype-numeric.html),
[constraints](https://www.postgresql.org/docs/18/ddl-constraints.html), and
[transaction locks](https://www.postgresql.org/docs/18/explicit-locking.html).

## Public API and security

Paths are below `/api/v1/workspaces/:workspaceId/projects/:projectId`.
The official Nest NodeAdapter, same-origin Next proxy, session renewal, no-store,
request IDs, strict JSON/Origin/Fetch-Site protections and UUID-v4 idempotency keys
remain. No Express or new dependency is added.

| Route | Contract |
| --- | --- |
| `GET /tasks` | Existing active/archived `view`, opaque `cursor`, optional scalar `status`, `assignee`, `priority`; returns `TaskPage` |
| `POST /tasks/:taskId/move` | `{expectedVersion,expectedOrderVersion,status,beforeTaskId}`; returns current `Task` |
| Existing detail/content/archive/restore | Preserved; Task now includes current `orderVersion` |

Filters are a conjunction of existing allowlisted values. Assignee is a scoped
principal ID or reserved `unassigned`; absent means all. Status/priority use
existing enums. Unknown, duplicate and malformed queries are rejected by the
proxy and backend; client responses are validated for scope/filter/revision.
Historical assignee filters do not confer assignment eligibility.

`TaskPage` extends `DomainPage<Task>` with `orderVersion`, five `columnCounts`,
and `selectedAssignee: DomainPerson|null`. It returns at most 100 rows plus a
lookahead query, not an unbounded download. Counts intersect the request's
filters and archive view. Every returned row has that page's orderVersion.
No rank or global allocation sequence is exposed.

For a named assignee filter, selected metadata is resolved independently of the
eligible-assignee page. A currently eligible project member or an assignee already
referenced by a task in this authorized project can be named; historical
noneligible identities have `active:false`. Nonexistent, unrelated inactive and
foreign identities all return null. This never looks up an arbitrary person's
name across private/tenant boundaries. `unassigned` has null metadata. Assignment
controls continue to use only the separately authorized eligible-assignee pages.

Cursors are bounded base64url envelopes binding schema version, workspace,
project, archive mode, normalized filters, task revision and an already visible
anchor ID. The server reauthorizes the project before interpreting the envelope;
it resolves the anchor in current scoped matching data. Malformed/foreign/reused
filter cursors return generic 400. A changed revision returns 409 `page-changed`
without record content. Any task mutation invalidates later pages conservatively.
This is revision-checked paging, not a durable database snapshot or SSE invalidation.

Moves require both the task version and aggregate order version. The exclusive
policy fence rechecks current human/delegated/Agent session/grant/membership and
T07 project entitlement through commit. First concurrent move wins; another move
against that aggregate revision receives 409 even when its source task differs.
Changed task versions return `version-conflict`; otherwise stale order returns
`order-conflict`, each with only an authorized current Task. Denied requests
never return current content. Archive freezes remain effective.

`beforeTaskId:null` means end of the **full canonical destination column**, not
end of a loaded or filtered subset. A named anchor must be active, different from
the source, in the same authorized project and requested status. Foreign/missing/
archived/wrong-status anchors receive the same generic 400. The server determines
the actual predecessor, preserving other filtered-out tasks' relative order.
All same-project tasks are project-readable; filters never create permission.

Status/rank/task versions/revision, one activity (`changedFields:[status,rank]`),
minimal outbox and successful receipt commit atomically. Original-key replay
rechecks current write authority and returns the current authorized task without
another effect; prior receipts never authorize access. Immutable creator and
provenance remain independent of nullable human/Agent assignment. Human
owner/admin implicit private access, explicit access for others and grant ceilings
remain as [T07](project-access.md) defines them.

## Frontend integration contract

`useProjectTasks` remains the entry point. The existing content and policy
projections keep their types. All projections share one controller draft,
pending command, captured retry key, conflict and success state.

| UI need | Exact contract |
| --- | --- |
| View/filter/column | `taskView:{layout:'list'|'board',filters:TaskFilters,column:TaskStatus}`; `setTaskLayout`, `setTaskFilters`, `setTaskColumn` |
| Filter update/clear | `setTaskFilters` replaces the whole filter object; omit a key to clear it, `{}` clears all; no `all` sentinel or explicit undefined |
| List | `tasks:TaskPage|null`, already status-grouped; `loadMore('tasks')`; changed `pageError.reason` requires Refresh |
| Board | `taskColumns:Partial<Record<TaskStatus,TaskPage>>`, automatically loads five authorized status partitions intersecting assignee/priority; status filter selects visible columns, with hidden destinations still loaded |
| Column loading/failure | Missing page means loading/unavailable, not zero; `taskColumnErrors[status]:{requestId,reason?:'changed'}`; `loadTaskColumn(status)` retries first page or loads more; changed/mixed requires full Refresh |
| Overall count/capture | `taskSummary:{status:'loading'|'ready'|'partial'|'changed',total:number|null,orderVersion:number|null,canCreate:boolean}`; totals/capture only available from coherent complete visible pages; never sum mixed/failed counts |
| Named filter label | `selectedTaskAssignee:DomainPerson|null`, `taskFilterAssigneeStatus:'none'|'unassigned'|'loading'|'resolved'|'unavailable'`; retain URL filter with unavailable copy and Clear, never raw UUID/reset |
| Stage move | `stageMove(taskId,status,beforeTaskId)` returns a `MoveEligibility`; `moveEligibility(...)` predicts the same result; only `ready` stages |
| Eligibility reasons | `ready`, `pending`, `recovery`, `draft`, `changed`, `unavailable`, `forbidden`, `invalid-destination`, `different-detail` |
| List destination | A full-column append uses source page's aggregate revision without loading a destination column; a named anchor must be in the loaded page at the matching revision/status |
| Board destination | Source/destination pages and source row must share the same revision; any mixed board revision blocks all staging; exact anchor must be loaded |
| Move projection | `moveDraft`, `movePending`, `moveRetryTarget`; shared `submit`, `retrySave`, `returnToDraft`, `discardDraft`, `cancelPending`, `outcome`, `result`, `conflict` |
| Quick capture | Existing `stage({type:'create-task',workspaceId,projectId,fields:{title,status}})` then `submit`; title/status/key survive unknown retry; use `taskSummary.canCreate` plus shared lifecycle guards |
| Move conflict | `moveNeedsDestination`; ordinary `rebaseDraft` intentionally refuses moves; explicitly discard, Refresh and choose a fresh destination through `stageMove` |

For a different open detail, eligibility is `different-detail`; the UI explains
that the current detail must be explicitly closed before choosing another row's
destination. A staged unknown move later navigated to task B still requires
Return before Retry. No silent navigation, filter clearing or array-index rank is
performed. Same-form staging retains both captured versions. Raw
`ProjectMoveCommand` is part of `ProjectCommand`, but ordinary UI movement should
use `stageMove`; no workaround is needed.

Move conflicts expose the original requested semantic status and placement through
`moveDraft`, and authorized current task through `conflict`. An old anchor ID is
request identity, not current anchor evidence: do not display its UUID or claim an
old title remains current. For a before-anchor conflict, use neutral previous
destination copy and require a fresh choice. No anchor-specific rebase endpoint is
claimed. Even Reload of the current task cannot authorize the former anchor.

Move success returns that Task as `result`, retains selection/layout/filter, and
refreshes canonical pages. A committed success survives follow-up read failure
without becoming a retry. No optimistic browser order is committed. Refresh
retains unsent drafts and original-key unknown recovery; pending Refresh is
ignored. Discard cannot undo a committed server operation. Ordinary content/policy
conflict compare/reload/rebase remains unchanged.

URL selectors add `taskLayout`, `status`, `assignee`, `priority`, `column` to
existing workspace/project/task/archive selectors. Default is list on every
screen; explicit board deep links stay board on mobile and archived views.
The hook validates values/scalar duplicates, serializes defaults sparsely, handles
popstate/refresh, and pushes user view/filter/column changes into history. Selected
detail survives filters and is never inserted artificially into a result list.
Navigation preserves memory-only drafts/unknown recovery. There is no durable
browser task/order/draft/key store.

Mixed or changed pages retain already loaded rows/counts as old observations,
show Refresh and block moves. Summary total is null until coherent. Per-column
errors remain independent from access/assignee first-page failures and content
pager errors. Auth denial clears all private rows/results/conflicts/filter names,
invalidates generations and prevents late siblings from repopulating them.
Different-account sign-in clears private recovery as before.

## Validation and local QA

Run the repository's existing commands:

```sh
pnpm install --frozen-lockfile
pnpm test:projects:logic
pnpm check
pnpm test:identity
pnpm test:runtime
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

Focused tests cover URLs, historical label fallback, coherent board summaries,
filtered cross-column staging, explicit different-detail eligibility, independent
column/policy errors, mixed-version refusal, exact-key recovery and fresh conflict
destination. Real PG/Nest tests cover the actual migration on existing archived
rows, filters/counts, >100 pages and cursor binding, within/cross-column races,
stale content/status/create/archive/restore revisions, hidden/foreign/archived
anchors, same-value moves, forced compaction, deferred rollback at every durable
stage, real aborted HTTP with committed outcome and same-key retry, private/grant
policy and immutable authorship. Existing six-table digest/count witnesses include
ranks/revisions across an actual PostgreSQL container restart.

The test-only [QA harness](../../apps/api/test/project-task-qa.mjs) remains excluded
from production routing/package/images. It uses real PostgreSQL, migrations,
Nest/Better Auth and Next with fictional signed sessions, never a production
authentication bypass. After build, run:

```sh
pnpm exec node apps/api/test/project-task-qa.mjs /tmp/rielia-t08-qa.json --task-views
```

`--task-views` adds 114 tasks across five statuses, >100 backlog records, varied
priorities, unassigned/human/Agent assignments and an archived record. Private
state includes board/filtered links, fixture task IDs, loopback session switch
links and runtime configuration; never copy cookies into reports. It also checks
real Next-proxy paging, moves/replay and stale-cursor rejection. `--smoke` cleans
automatically; otherwise SIGTERM/SIGINT removes owned servers, labelled container,
volume and private state. Existing `--large-members` remains independent.
Stop Next dev before production typegen/build; remove only this checkout's stale
ignored `.next/dev` output if duplicate generated route types remain.

Current exact command outcomes and PR/CI/Kody evidence are recorded in
[progress](progress.md) and [PR #19](https://github.com/Ljrr3045/rielia/pull/19),
with final settlement evidence external. Exact-head CI/root Kody are pending
before coordinator merge; review bookkeeping alone does not require source pushes.
Real browser presentation/assistive/touch evidence belongs to the separate UI
delivery. No real OAuth/HTTPS/staging/users or scale certification is claimed.
