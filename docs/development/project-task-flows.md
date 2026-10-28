# T06.0/B1a project and task logic

This bounded vertical builds on merged T05.1 [PR #14](https://github.com/Ljrr3045/rielia/pull/14),
`d27e3302a059cda6ef570c75efed42deda188a39`. It implements the project/task
subset of P02/P04/P05/P14/P38 and US04/US08/US12/US24/US25, with
UX01/UX02/UX05/UX06/UX09/UX11 contracts from the unchanged
[product](../handoff/01-product.en.md),
[architecture T06](../handoff/02-architecture-technical-plan.en.md) and
[UI guide](../handoff/04-ui-ux-development-guide.en.md).
Dependencies are [T35 foundations](principal-foundations.md) and
[T05 workspace logic](workspace-flows.md). Presentation is separately owned;
this delivery contains no JSX/CSS or new product page. Full T06/P05/P14/T35,
real-user/project acceptance and public launch remain open.

## Bounded decisions

- Only workspace-visible projects exist. Active workspace owner/admin/member
  can create/edit/archive/restore projects and tasks; viewer is read-only.
  The same policy applies to current human, delegated and autonomous subjects,
  narrowed by their existing operation grants. No new credential/auth adapter
  is introduced. Private visibility is rejected; private owner/admin content
  policy remains unresolved for T07.
- Project key is a conservative immutable 2–10 character uppercase ASCII value,
  starting with a letter and followed by letters/digits. It is unique within the
  workspace, including archived projects. Name and Markdown description can
  change; moving projects/tasks or editing their keys is unavailable.
- A task needs only project and a nonblank title (up to 300 UTF-16 code units).
  Description is Markdown source, at most 20,000 code units. Fixed types are
  `task`, `bug`, `feature`; priorities `none`, `low`, `medium`, `high`, `urgent`;
  semantic statuses `backlog`, `todo`, `in_progress`, `done`, `canceled`.
  Defaults are empty description, `task`/`none`/`backlog`, no assignee or due date.
  Due date is a validated calendar date `YYYY-MM-DD`, never a local timestamp.
  These baseline statuses do not implement configurable workflows.
- Assignee is explicitly null or an active human/Agent membership with access
  to the same workspace-visible project. Creator is never automatically assigned.
  An unchanged historical inactive assignee survives unrelated edits and is
  returned with `active: false`; new assignment to that principal is denied.
  Reassignment, suspension and removal preserve immutable creator/provenance.
- Task numbers increase per project. A task-insert trigger allocates under the
  same transaction; failed insertion rolls back its counter change. Committed
  numbers are never reused and no deletion endpoint exists. Counter-only
  allocation leaves the project edit version unchanged. Every accepted project
  or task mutation, including a same-value edit, advances its entity version.
- Archive removes records from the default active page. Stable detail reads
  still work. Archived task editing requires explicit restore. Archived project
  freezes all child writes, including task restore. Restoring a project leaves
  each task's own archive state unchanged. Restore/archive use expected versions
  and cannot silently overwrite a concurrent change.

Excluded: labels/checklists/subtasks/comments/history UI, configurable workflow,
sprints/Kanban/ranking/filters/search, JSON/CSV export, private projects, MCP
credentials/transport/catalog, SSE, dispatcher/business worker, SMTP, RLS
deployment, shared database extraction, real OAuth/staging and deployment.

## HTTP and storage contract

Routes below `/api/v1/workspaces/:workspaceId` use real Better Auth sessions,
the official Nest NodeAdapter 12.3.2 and existing principal policy. No Express
dependency or alternative routing framework was added.

| Method and path | Input/result |
| --- | --- |
| `GET /projects` | `DomainPage<Project>`, optional `view=active\|archived`, `cursor` |
| `POST /projects` | `{name,key,description?}`; optional visibility must be `workspace` |
| `GET /projects/:projectId` | Current authorized Project, including archived |
| `POST /projects/:projectId` | `{expectedVersion,name,description}` |
| `POST /projects/:projectId/archive` or `/restore` | `{expectedVersion}` |
| `GET /projects/:projectId/tasks` | `DomainPage<Task>`, optional view/cursor |
| `POST /projects/:projectId/tasks` | `{title,description?,type?,priority?,status?,assigneePrincipalId?,dueDate?}` |
| `GET /projects/:projectId/tasks/:taskId` | Current authorized Task, including archived |
| `POST /projects/:projectId/tasks/:taskId` | `{expectedVersion,...changedTaskFields}` |
| `POST /projects/:projectId/tasks/:taskId/archive` or `/restore` | `{expectedVersion}` |

Pages contain `{items,total,nextCursor,capabilities:{canCreate}}`, at most 100
records ordered by immutable ID. Counts, cursors and detail predicates always
include workspace/project scope. Detail capabilities `canEdit/canArchive/canRestore`
are current server policy projections, including current grant narrowing and
archive state. Presentation consumes them without implementing a second policy.
Historical human/Agent names/kinds/active state accompany separate creator and
assignee. No social email, cookie, session or credential is projected.

Mutation requests require configured exact Origin, JSON, UUID-v4
`Idempotency-Key`, and compatible Sec-Fetch-Site. Unknown fields, attribution
fields/headers, unsupported queries and GET bodies are rejected. All domain
responses, including parser failures, have `Cache-Control: no-store` and a
server-generated `X-Request-Id`. Successful session-renewal cookies are forwarded.
No-session is 401; denied/missing/foreign scope is the same generic 403;
invalid input is 400; conflict is 409; unavailable storage/auth is sanitized 503.
Version conflict returns `{code:'version-conflict',message,current}` with the
authorized current record; archive-state conflict uses `code:'archived'`.

`PrincipalService.domainOperation` recognizes only backend-issued opaque
contexts. It rechecks current session/grant/principal/membership under the policy
fence through commit; a copied context cannot authenticate. Domain reads use
shared fence locks and writes take its exclusive lock. Current workspace-visible
access admits all scoped members; grant operation ceilings remain effective
after role changes. There are no project-limited grant credentials in this slice.
`PrincipalService` retains principal/membership writes and owns assignment checks;
`WorkspaceService` retains workspace/invitation writes. `ProjectTaskService` owns
its domain writes and never edits another module's tables.

The additive `20261028220000_project_task_flows` migration preserves every prior
migration/checksum. Composite foreign keys fence task→project, creator/assignee→
membership, grant→scope/subject, activity→project/task/actor and outbox→activity.
Triggers preserve IDs/keys/creator/creation provenance, history and monotonic
allocation. The existing one-shot alone migrates; API and diagnostic worker
cannot migrate. RLS and least-privilege deployment roles remain future work.

Business mutation, immutable activity, minimal outbox `{activityId}` and successful
receipt commit together. Activity stores actor/mode/source/grant, action, entity
version, changed field names and server correlation, never description/title
contents, credentials or arbitrary client metadata. There is no dispatcher or
delivery-state machine. Request hash covers canonical input, operation and target;
receipt scope is workspace + actor + web/grant channel + key. Same key/different
input conflicts. Replay first rechecks current write access, returns the current
authorized target, and creates no additional business write/event/receipt.
Revoked, suspended or newly read-only execution cannot replay past authority.
There is no automatic mutation retry. The singleton fence deliberately serializes
this internal slice; no throughput/scale claim is made.

## Frontend contract and recovery

Import `useProjectTasks` from `apps/web/src/lib/use-project-tasks.ts`. Public
domain types/commands/validators and stable record URL helpers are exported from
`@rielia/contracts`; the pure controller/transport/proxy live beside the hook.
The same-origin Next workspace catch-all dispatches only allowlisted domain paths
to the fixed configured API. Client code imports no database/domain policy.

State: `status`, `session`, `workspaces`, `workspace`, `members`, `projects`,
`project`, `tasks`, `task`, `selection:{workspaceId,projectId,taskId}`,
`views:{projects,tasks}`, `url`, `draft`, `pending`, `outcome`, `retryTarget`,
`conflict`, `result`, `requestId`. Loading/disabled/signed-out/empty/ready/
forbidden/error are distinct. Empty project/task collections retain their own
server capabilities. Members are paged; task creator/assignee projections remain
available even when that member is outside the currently loaded member page.

Actions: `refresh`, `selectWorkspace`, `selectProject`, `selectTask`,
`setView('projects'|'tasks','active'|'archived')`, `loadMore`, `stage(command)`,
`submit`, `retrySave`, `returnToDraft`, `discardDraft`, `cancelPending`,
`reloadConflict`, `rebaseDraft`, `dismissOutcome`.

Presentation uses one `/projects` route and query selectors
`?workspace=W&project=P&task=T`. `projectsView=archived` and `tasksView=archived`
retain archive-list context through detail/reload/Back. Stable record URLs remain
valid with default active context even when their record is archived. The hook
owns URL parsing and popstate; presentation does not invent routing rules.

`stage` copies a typed `ProjectTaskCommand`. Same-target form updates keep the
version captured when that form opened, including across refreshes. A pending or
unknown-outcome save keeps its exact copied command/key. New input cannot replace
that recovery until explicit discard; cancellation/discard cannot undo a server
commit. `retryTarget` identifies the full original command, independently of
current navigation. Submit/retry requires its exact workspace/project/task target;
`returnToDraft` navigates there explicitly. Duplicate pending submits are ignored.
Stale reads, pages and mutation completions cannot overwrite a later selection.

409 preserves the draft and exposes the current record for comparison.
`reloadConflict` refreshes that original target while retaining unsent fields;
`rebaseDraft` is an explicit user review action adopting only a matching current
version. It does not submit. A later concurrent edit can still return another 409.
A successful mutation remains successful with `result` even if the following read
fails; Refresh reads data without resubmitting. Session loss clears visible domain
data and retains same-human memory recovery. A different account clears private
drafts/retry/conflict/result. Visibility/pageshow/expiry recheck identity. No domain
data/drafts/request keys enter durable browser storage; reload/navigation away loses
memory drafts. Sign in in another tab and Refresh to retain same-tab recovery.

`parseSafeMarkdown` in `safe-markdown.ts` returns a bounded safe AST of paragraphs,
headings, lists, fenced code, text, inline code, emphasis/strong and links. Render
normal React text children and elements; never innerHTML. Raw HTML/images remain
text. Only validated HTTP(S), root-local and fragment links survive; use
`rel="noopener noreferrer"` for external links. This is a documented Markdown
subset, not a full CommonMark/HTML renderer. Presentation owns styling, focus,
keyboard/touch and assistive-technology evidence.

## Validation and reusable local QA

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:projects:logic
pnpm test:identity
pnpm test:runtime
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
```

The 15 focused pure/client/proxy/Markdown checks cover captured target/version,
unknown-key retry, A/B navigation, conflict review/rebase, success versus refresh
failure, stale response/paging, account change, archive URLs, HTTP deadlines,
scoped response validation, safe rendering data and restricted proxy headers.
`pnpm test:identity` adds 14 real-PG/HTTP domain checks beside the existing 12
principal, 12 workspace and 23 identity checks. It covers two tenants/roles,
current revoked grants/memberships, active/historical human/Agent assignment,
immutable creator/provenance, key/number races, scoped replay/different payload,
version collisions, actual 100-record page boundaries, archive/restore/races,
forced deferred failures at every event/receipt stage and Nest restart.
An additional all-five-table digest/count witness survives an actual task-owned
PostgreSQL container restart, then verifies a real Nest read and next allocation.
The labelled temporary volume is removed after the suite. Docker smoke checks
all four migration packages/checksums and preserves diagnostic worker boundaries.

The test-only `apps/api/test/project-task-qa.mjs` is outside production `src`,
compiled output and container inputs. After frozen install and API/contracts build:

```sh
pnpm --filter @rielia/contracts build
pnpm --filter @rielia/api build
pnpm exec node apps/api/test/project-task-qa.mjs /tmp/rielia-t06-qa.json
```

It starts task-owned real PostgreSQL/migrations/Nest/Next on random loopback ports,
creates fictional signed Better Auth sessions directly in its disposable database,
and uses the actual API for persisted project/task data. Private mode-0600 temporary
state contains URL/IDs, process ID and owner/member/viewer/other-tenant cookies plus
browser cookie objects. A separate test-only loopback server exposes
`fixtureURLs.owner/member/viewer/outsider` to set a generated signed HttpOnly cookie
and redirect to the fixed app origin `/projects`; `fixtureURLs['signed-out']`
expires it. These URLs let a local browser switch fictional sessions without
DevTools or exposing cookies. They are absent from production routing/bundles.
Read raw session state privately; never copy cookies into reports/commits.
No login bypass exists in production code.
SIGTERM/SIGINT stops the fixture server and owned processes, removes only matching labelled container/
volume and deletes the state file. Add `--smoke` for automatic cleanup after a real
Next-proxy detail read. Run a local QA instance only in its owning checkout.
Stop Next dev before production typegen/build; stale `.next/dev` generated types
may need removal before `pnpm check`. Do not edit `next-env.d.ts` by hand or touch
another checkout. This harness does not exercise real OAuth providers or staging.

Command outcomes and exact-head PR/CI/Kody evidence are tracked in
[progress](progress.md) and [PR #15](https://github.com/Ljrr3045/rielia/pull/15).
Full check, audit, handoff and the complete PG suite passed locally; the full
runtime smoke passed again after the final production-source change. PR review
evidence remains to be recorded before delivery.
Initial harness tmpfs/random-port restart and variable-shadowing failures were
corrected before the passing persistence run. Real provider/HTTPS/staging,
screen-reader/touch/browser presentation and real-person acceptance are unverified
by this logic delivery and are not reported as passed.
