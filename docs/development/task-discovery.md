# T10.0/B1b search, My tasks and session invalidation

Implementation acceptance, recorded before code changes: this isolated logic
slice follows T07–T09 and merged T09.1 [PR #22](https://github.com/Ljrr3045/rielia/pull/22),
merged 2026-10-31T20:10:22Z as `8d51135af5260bdb8773863a4a7fb8ff6a966f8e`.
It addresses bounded P02/P03/P05/P08/P10/P11/P14/P33/P38 and
US02/03/05/08/12/25; presentation contracts follow UX01/03/05/06/07/09/11
and UXR01/03 in the unchanged [UI guide](../handoff/04-ui-ux-development-guide.en.md).
Codex `gpt-6.1-sol`, effort `xhigh`, was verified in the Orca terminal footer;
there are no helpers or shared worker checkouts.

Acceptance is workspace-wide ID/title search over currently readable projects,
strict current-principal-assignee My tasks, existing status/priority/assignee and
archive filters, bounded stable pages and context-preserving detail navigation.
Every result, count, cursor and invalidation reuses current T07 authority,
including automatic human owner/admin private access and actual Agent subjects.
Creator and provenance remain independent of assignment. P14 here covers existing
archive/restore visibility only; exports remain separate.

Session-authenticated same-origin SSE must observe only committed durable outbox
writes, send small authorized hints, reevaluate current access, heartbeat, cancel
cleanly and bound replay/reconnect. Expired/missing replay state requires a full
authorized refresh; focus also refreshes. Workspace/account switches clear prior
rows, subscriptions and drafts; background invalidation preserves unsent edits,
captured conflict review and exact-key unknown-outcome recovery.

Validation includes focused state/client/proxy regressions, real PostgreSQL
permissions/paging/commit-versus-rollback and commit-order races, real Nest→Next
proxy streaming with two sessions, expiry/revocation/privacy changes, abort,
backlog/reset and draft/retry/conflict preservation. Required contribution checks
remain frozen install, full check, identity/runtime, audit, handoff and whitespace.
Results will be recorded after execution; this acceptance statement is not a pass.

Excluded: JSX/CSS/copy, labels, sprints, advanced search, coediting, offline queues,
Redis, business worker effects, exports, credentials/MCP authentication, real
OAuth/staging/users, deployment and full T10/public-launch acceptance. One API
replica is the explicit operating limit; PostgreSQL remains canonical and only
the one-shot migrates. Official Nest NodeAdapter and Express-free closure remain.

## Typed presentation integration

`useProjectTasks` remains the entry point and retains all existing T06–T09
actions/projections. `taskScope` is `project|mine|search`; explicit existing
project/task URLs default to `project`. Presentation can select `mine` initially.
`setTaskScope(scope)`, `setSearchQuery(text)`, `setDiscoveryProject(id|null)` and
existing `setTaskFilters`/`setView('tasks',view)` load canonical discovery data.
`mine` removes the assignee selector/filter; the backend always resolves its
assignee from the current verified principal, never creator or credential issuer.
Only status/priority and optional project/archive filters apply there.

`discovery={status:'idle'|'loading'|'ready'|'empty'|'error'|'changed',page,requestId}`
is independent of selected detail. A null page is unavailable, not zero results.
`TaskDiscoveryPage` has workspace/principal/query/revision/items/total/nextCursor.
Items omit descriptions and add projectName to the existing task metadata,
capabilities, author/provenance and canonical detail URL. ID search accepts exact
public UUID or case-insensitive project-key/number; title search is a literal
case-insensitive substring, at most 100 UTF-16 units. Empty search lists readable
tasks. Active excludes archived tasks/projects; archived includes either archive.
Order is project ID then immutable task number; pages contain at most 100 items.
`loadDiscoveryMore()` retries a failed first/next page. `changed` requires Refresh.

`openDiscoveryTask(item)` selects its authorized project/task while retaining
scope/query/filters; `returnToDiscovery()` clears the selected detail/project.
URL selectors are `/projects?workspace=…&taskScope=mine|search&q=…&searchProject=…`
plus the existing status/priority/assignee/tasksView and selected project/task.
Back/refresh reconstruct the context. No durable browser task/draft/key store exists.
One memory-only return context retains at most 1,000 loaded results for the same
workspace/session/query. Detail return and Back requery the first page and reuse
that context only if its current authorized revision and total match. A changed
revision drops the old pages. `discoveryFocusTaskId` identifies the returned row
for presentation focus restoration. `discoveryContextLimitReached` disables
further append at 1,000 rows; presentation can offer narrower filters or Refresh.
Workspace/session changes and permission denial erase the context. A reset hides
all result rows until the new authorized snapshot proves whether reuse is valid.

`streamStatus` is `idle|connecting|live|reconnecting|offline|signed-out|forbidden`.
`refreshRequired` means cached reads need refresh; `refreshDeferred` specifically
means a draft/pending save/unknown recovery/captured conflict is being preserved.
These flags are independent of connection state: a live stream can have deferred
refresh. Explicit `refresh()` remains available. Background updates never rebase,
resubmit, discard or rewrite captured edit/conflict/key state. Reset/focus verifies
selected access before deferring; authorization denial clears private reads.
Workspace navigation with a draft, pending mutation or unknown recovery exposes
`workspaceNavigation:{workspaceId}|null` and stays in the current context, including
restoring its canonical URL for blocked history/deep-link changes.
`resolveWorkspaceNavigation('stay')` preserves edits; explicit `'discard'` removes
local draft/recovery and continues the requested navigation. Discard is ignored
while a mutation is pending. Discarding unknown recovery does not undo a potentially
committed write. After switching, no old workspace rows, stream or draft remain.
A different session ID (including the same human signing in anew) clears prior
identity state. Same-workspace navigation/exact-key recovery remain unchanged.

## Outbox, stream and operating bounds

`GET /api/v1/workspaces/:workspaceId/task-discovery` accepts scalar `scope`
(`search|mine`), `q`, `project`, `view`, existing filters and `cursor`. Unknown,
repeated and non-scalar values fail closed. Counts and cursor revision use only
currently readable projects. Cursor scope includes principal/workspace/query;
anchors must still belong to that same matching authorized collection. Any
authorized task/policy revision change gives 409 `page-changed` on continuation.
The backend resolves people and immutable authorship through the shared detail/
list/discovery DTO projection. Returned rows are indexed by project once; one
bounded membership/active-access hydration covers only the page's represented
projects and at most 200 creator/assignee identities. No per-project people query
or repeated full-project/result scan remains. No raw outbox JSON, descriptions or
foreign identity names are returned.

`GET /api/v1/workspaces/:workspaceId/events` uses the existing web session,
same-origin/Fetch-Site and no-body boundary. Cookies/renewal/request IDs and fixed
API destination pass through Next; no forwarding identity is trusted. The API
rechecks current session/principal/membership/readable projects under the shared
policy fence every second, immediately before each batch. The dedicated event
projection loads only authorized project IDs and policy versions, rather than
discovery names, keys, task revisions or other content. A read already holding
that fence can finish before a policy write commits. Project access-set/policy
changes cause a generic reset; session/workspace denial sends a generic denial
and closes. No instantaneous erasure of content already delivered is promised.

The additive migration assigns a positive outbox sequence **after** a BEFORE
STATEMENT trigger acquires the existing singleton exclusive policy fence. All
insertion paths, including future worker inserts, hold this fence until commit;
the BEFORE ROW assignment ignores supplied sequence values. Thus a later writer
cannot allocate/commit past an earlier uncommitted outbox insert. Transaction
start/timestamp order is irrelevant; rolled-back sequence holes are safe. Legacy
payloads/IDs/timestamps remain unchanged. The offline/local atomic migration
locks outbox storage; quiesce a running installation. API/worker never migrate.
Keep consistent policy-fence-first write ordering. The inherited global write
serialization and per-poll work proportional to readable project metadata make
no throughput or scale claim.

Only current-authorized `domain.activity` rows are read, at most 101 per batch.
At most 100 hints carry `{type:'invalidate',entity,id,projectId,version}`; policy
changes or larger backlogs send `{type:'reset'}` and refresh from canonical HTTP.
Hidden activity never changes another reader's payload/count/cursor or triggers
backlog reset. Event IDs are random opaque resume handles, bound to the actual
web session and workspace; no global allocation number is exposed. The map holds
at most 512 handles globally/32 per session, expires after 60 seconds, and is
ephemeral to this API replica. Missing/expired/foreign/restarted state gets the
same generic reset. No outbox is acknowledged, consumed or deleted by SSE.

The API caps 32 connections globally/four per session, polls sequentially, sends
a heartbeat every 15 seconds and ends a connection after 60 seconds for a fresh
session handshake. Slow-reader backpressure closes the socket at Node's high
water mark rather than accumulating a producer queue. Disconnect/module shutdown
clears timers and connection ownership. Next keeps the 15-second whole-response
deadline for JSON; SSE has a bounded header handshake and streams without
buffering (`no-transform`, `X-Accel-Buffering:no`) with request abort propagation.

The client parses bounded UTF-8 SSE frames, aborts after 35 seconds idle and
retries failed connections at 1/2/4/8/15 seconds before showing offline. Long-lived
healthy streams renew normally; focus/online retries start a new connection and
reauthorize reads. Reconnect always requests canonical refresh even if resume
succeeds. Dirty epochs coalesce invalidations while preserving later reset intent;
releasing the final draft/recovery blocker services the already-owed refresh.
The wire framing follows the [HTML SSE standard](https://html.spec.whatwg.org/multipage/server-sent-events.html).
This is single-replica invalidation, not ordered coediting or a durable client log.

## Validation and local QA

Frozen `pnpm install --frozen-lockfile` passes with the existing lockfile and no
dependency changes. The 61 focused project/client/proxy/state checks cover scalar
validation, scope/assignment/archive response checks, URL/Back/detail return,
queued invalidation/reset, dirty edit/conflict/exact-key preservation, explicit
workspace guard, session replacement, denial clearing, final-recovery refresh,
SSE parsing/retry/late abort and JSON-body versus stream deadlines.

`pnpm test:identity` passes all existing suites plus 12 T10 PostgreSQL/Nest checks:
legacy immutable outbox migration, exact ID/literal-title search, >100 query-bound
pages, hidden-write revision isolation, human owner/admin/member/viewer and
delegated/autonomous grant subjects, archives, deferred rollback silence, two
sessions, delayed/locked commit order, replay/expiry/backlog reset, heartbeat,
current private access/session/membership revocation, admission and backpressure.
The query-shape regression proves one membership hydration for five projects,
private historical assignee inactivity versus human owner/admin implicit access,
and narrow id/version project reads plus current authorization on successive
actual SSE ticks.
The existing eight-table digest/count witness still passes an actual PostgreSQL
container restart with the new sequence included in outbox rows.

The test-only fixture runs real PostgreSQL/migrations, Nest/Better Auth and Next;
it never adds a product login bypass. After building, run:

```sh
pnpm exec node apps/api/test/project-task-qa.mjs /tmp/rielia-t10-qa.json --discovery --collaboration --smoke
```

This passes real proxy search/My tasks and 105-row paging, concurrent sessions,
committed update/readback, deferred rollback, heartbeat beyond the 15-second JSON
deadline, private revocation, resume/reset and aborted-socket cleanup. Omit
`--smoke` to retain the owned fictional runtime for later presentation validation.
`discoveryFixtures` contains typed-scope URLs and task IDs alongside existing
collaboration fixtures. Private mode-0600 state contains fictional sessions and
must never be copied into a report. SIGTERM/SIGINT cleans the owned local servers,
labelled database/volume and private state. Stop Next dev before production builds
and remove only its ignored generated dev cache if typegen retains stale routes.

Full `pnpm check` (lint, Express-free dependency closure, pure suites, strict
typechecks, production builds, MCP and HTTP smoke) and `pnpm test:runtime` pass.
Runtime verifies frozen nonroot images, all migration checksums, one-shot gating,
readiness/recovery and diagnostic-job persistence/cleanup. No worker business
effect or live external provider is introduced. `pnpm audit --audit-level=high`
passes with zero high/critical and the inherited one moderate development-only
minimatch advisory. Handoff and whitespace remain delivery gates.

Initial local attempts encountered sandbox loopback/Docker restrictions and a
stopped Docker engine; the coordinator restored the installed engine, and permitted
reruns passed. An intermediate suite-wiring typo was fixed before the passing
expanded integration run. Independent read-only review found and the owner fixed
mutation-denial discovery clearing, final-draft refresh deferral and page-two
detail return. Each has a final-source focused regression. Final PR/CI and
coordinator-only exact-head Kody evidence remain required before merge of
[PR #23](https://github.com/Ljrr3045/rielia/pull/23); current-head review settlement
is recorded on that PR and in the external delivery report without a bookkeeping
push that invalidates an already-reviewed source head.

No mobile/browser presentation, physical touch, screen-reader/AT or WCAG
certification is claimed by these logic tests; those belong to the following UI
delivery. Real OAuth/HTTPS/staging/users, multiple replicas, scale certification,
coediting, credentials, sprints/labels, exports and deployment remain excluded.

## PR #23 Kody dispositions

[Discovery hydration](https://github.com/Ljrr3045/rielia/pull/23#discussion_r4437329828)
was valid: a single project index and bounded shared people/eligibility batch now
replace repeated row scans and per-project membership queries. The real-PG
multi-project/private-historical-assignee regression verifies the changed query
shape without weakening read/assignment policy or rewriting authorship.

[SSE metadata reads](https://github.com/Ljrr3045/rielia/pull/23#discussion_r4437329994)
were partially applicable. The event path now selects only id/version and keeps
current session/principal/membership/private access reevaluation every second.
Residual work remains O(currently readable IDs) per admitted connection, under
the inherited shared policy fence; this explicitly bounded single-replica slice
makes no scale acceptance claim. A time-only authority cache would weaken
revocation, and broader revision-indexed caching is deferred. Actual successive-
tick projection/current-authority checks, hidden-write silence and midstream
revocation/privacy/session cases remain required. Changed source requires fresh
exact-head CI and a new coordinator root Kody request.
