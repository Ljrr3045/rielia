# T01/B0 task-navigation prototype logic

This is a **fictional, frontend-only, in-memory demo adapter**, prepared for a
separately owned presentation at `/prototype`. This change adds no route, JSX,
CSS, backend, identity integration, database, real permissions, credentials, or
MCP. It does not implement production task/sprint services or complete T01/B0.

The user resumed development on 2026-10-25. This bounded logic slice starts from
merged [PR #4](https://github.com/Ljrr3045/rielia/pull/4),
`ae67fcc321a0cbb152a0137141d8d6a05abae631`. The isolated worker's Orca terminal
reported **GPT-6.1-Sol xhigh** before implementation. Future UI work uses the
[recorded DeepSeek configuration and verification limits](frontend-agent.md).

## Assumptions and acceptance boundary

- One fictional workspace/project, 18 seeded tasks, two planned sprints, two
  fictional humans and one fictional autonomous agent. No real user data is
  read or accepted from the identity experiment. New tasks always have the
  fixed fictional human/web creator; creation does not auto-assign.
- Fixed status names/categories (`backlog`, `todo`, `in_progress`, `done`,
  `canceled`), priorities, labels, and project UTC time zone. These are demo
  assumptions, not ratified workflow configuration. Date-only strings are ISO
  dates; sprint end is exclusive. The demo does not schedule by wall clock.
- Canonical tasks derive list/board/detail and sprint scope. My tasks uses
  **assignee**, never creator. Delegated seed authors remain human with Cursor
  provenance; autonomous authors remain the Agent. Connections are not members.
- Title and the fixed project context suffice for capture. Description is plain
  text here; a later renderer must safely render user content. No comments,
  subtasks, checklist, archive, configurable workflows, sorting/ranking editor,
  saved views, reports, URLs/history restoration, or real concurrent sessions.
- Draft changes, status changes, sprint planning/start/closure confirm only after
  the simulated async save succeeds. Failure is deterministic and pre-commit;
  retry uses the captured operation. This is not durable API idempotency or an
  ambiguous network/commit-response recovery guarantee.
- State exists only in the mounted page's adapter. Refresh, unmount/remount,
  closing the tab, or reset loses demo data. No local/session storage, tokens,
  HTTP, identity state, telemetry, or module-global mutable store is involved.
  Separate hook instances do not share a session. Reset deliberately permits
  fictional IDs to repeat in a new session.

Acceptance for this slice is reproducible action/invariant/failure tests, strict
typing and repository checks, plus a documented presentation contract. Mobile,
desktop, keyboard/touch, focus, screen readers, real-person friction, URL state,
and the five reviewed journeys remain work for presentation/validation. The demo
five journeys are capture; daily work/detail/edit; list/board/filter/status;
sprint plan/start/close; and failure/retry/reset. They do not replace all source
journeys or provide real-project evidence.

| Source requirement | Prototype subset / evidence | Still outside acceptance |
| --- | --- | --- |
| P04 | Fixed workspace/project context on every record | Project creation/archive/visibility and isolation |
| P05, US04 | Minimal create/edit, priority, labels, dates, points, separate creator/assignee; draft retry does not create twice | Full task properties, backend validation/persistence/idempotency |
| P07 | Fixed semantic statuses, shared board columns, explicit move action | Configurable workflows/templates |
| P08, US05 | One task store; title/ID search and status/assignee/priority/label/sprint filters | Durable views, ordering, authorized production reads |
| P09, US06 | Plan goal/dates/scope; one active sprint; closure destination; distinct done/canceled/unfinished IDs; frozen closure summary | Full historical scope/estimates, transactions and reporting |
| P38, UX11 | Fictional delegated-human/autonomous-Agent provenance; immutable creator; assignable principals exclude channels | Grants, membership policy, revocation/suspension, server-resolved execution |
| US08, UX01–UX03 | Same actions/selectors available for later touch/keyboard UI | Responsive rendering, drag alternative controls, URL/focus restoration and browser QA |
| UX04–UX05 | Sprint lifecycle, pending/error/saved, retained drafts, reset, local version-conflict protection | Server conflicts, production recovery, visual feedback/accessibility |
| UX09 | Seeded/empty/no-results, missing selected record, pending/error/retry state | Network loading, insufficient permission, real disconnection |

UXR01–UXR04/UXR06 inform the eventual composition. This logic change does not
claim external screenshot inspection or visual implementation. Source scope:
[Product](../handoff/01-product.en.md),
[UI guide](../handoff/04-ui-ux-development-guide.en.md),
[T01 and architecture](../handoff/02-architecture-technical-plan.en.md).

## Typed presentation contract

The public types are in
[`types.ts`](../../apps/web/src/lib/task-prototype/types.ts). The non-React
barrel exports `createTaskPrototype`, `getSprintSummary` and all types. Import the
hook separately from
[`use-task-prototype.ts`](../../apps/web/src/lib/task-prototype/use-task-prototype.ts).
Mount it **once** in the prototype page owner and pass its returned values to
presentation components:

```ts
const { state, actions } = useTaskPrototype();
// state: PrototypeState; actions: TaskPrototypeActions (stable object)
actions.beginCreateTask('todo');
actions.updateTaskDraft({ title: 'A fictional idea' });
const saved = await actions.saveTask(); // false on validation/failure/busy/reset
```

Render the demo/memory-only notice visibly in the UI. The hook owns no layout or
focus. UI handlers call actions, and render state; do not copy the rules into
components, add fetch calls, connect to identity, or add storage.

| State/action | Integration usage |
| --- | --- |
| `tasks`, `visibleTasks`, `columns` | `tasks` is canonical; visible records and column records share its frozen objects. Filter counts use the selected view's records. Sprint scope must use all `tasks`, not filtered records. |
| `setView`, `setFilters`, `clearFilters` | View is `my-tasks`, `list`, `board`, or `sprints`. Filters compose with AND and persist across view changes. `my-tasks` adds the fixed current assignee restriction. Search is case-insensitive title/key substring. |
| `filters` | Status/priority use `all` or an enum. Assignee uses `all`, `unassigned`, or principal ID; label uses `all` or label ID; sprint uses `all`, `backlog` (no current sprint), or sprint ID. `backlog` scope differs from backlog status. |
| `selectTask(id or null)` | Select/close detail without resetting view/filters. `selectedTaskId` can be unknown while `selectedTask` is null: show a missing-task state. Routing, browser back and focus are presentation integration work. |
| `beginCreateTask(status?)`, `beginEditTask(id)` | Open one controlled draft. Default create status is backlog; assignment is null. Creating within a column may pass its status. Project is fixed. |
| `updateTaskDraft`, `discardTaskDraft`, `saveTask` | Editable fields exclude IDs, version, creator and provenance. Failed save retains all draft fields; success clears the draft and selects the saved task. A new draft requires explicitly saving/discarding an existing task or sprint draft. |
| `moveTask(id,status)` | Menu/keyboard and optional drag use the same action. Status stays unchanged until success. A failed move is retained for retry; no second task record is created. |
| `beginCreateSprint`, `beginEditSprint`, `updateSprintDraft`, `discardSprintDraft`, `saveSprint` | Planned-only goal/date/scope editor. `taskIds` is the full chosen scope. Choose only unscoped tasks or tasks already in this sprint; deselection returns a task to backlog scope while preserving status. |
| `startSprint(id)` | Only planned → active, with no other active sprint. Dates/goals were validated at planning; demo does not enforce today's date. |
| `getSprintSummary(state,id)` | Import from the non-React barrel. Returns separate done/canceled/unfinished task ID arrays; count with `.length`. Canceled never counts as delivered. Closed summaries retain the closing outcome after a task is reopened. |
| `closeSprint(id,destination)` | Show the summary and require a destination: `{kind:'backlog'}` or `{kind:'sprint',sprintId}` targeting another planned sprint. Moves only unfinished tasks, preserving status; done/canceled keep their closed sprint. Closure is confirmed only on save success. |
| `save` | Render `idle`, `pending`, `error`, `saved`; `kind` identifies the operation. Error includes `code`, plain English `message`, and nullable `field`. UI may localize code/field; do not infer successful persistence from a click. |
| `canRetry`, `retrySave()` | Only a simulated async failure is retryable. Retry resubmits the captured operation and draft ID. Editing/discarding a draft clears that retry and requires normal save again. Validation/version errors need user correction/review. |
| `simulateNextSaveFailure`, `nextSaveWillFail` | Explicit demo control, one-shot after the next valid save begins. Invalid fields do not consume it. Default save delay is 350 ms, permitting pending UI. No random failures. |
| `reset('seeded' or 'empty')` | Discard all demo mutations/drafts/feedback/filters/selection; default seeded. Also invalidates pending completions. Empty keeps planned sprint templates but has zero tasks. |

During `pending`, duplicate writes and draft changes/open/discard actions are
ignored; navigation, filters, selection and reset remain available. Mutations
return `Promise<boolean>` and synchronous actions return void. Local versions
prevent saving an old task draft over a status/scope change made through this
same adapter. There is no merge/compare UI or real multiuser conflict claim.
Snapshots are stable between publications and deeply frozen. Subscribers must
only observe updates; unsubscribe when done (`useSyncExternalStore` does this).

## Reproduce and delivery evidence

```sh
pnpm install --frozen-lockfile
pnpm test:prototype
pnpm check
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

The focused Node tests import the actual TypeScript adapter using Node 24's
type stripping. The web's `allowImportingTsExtensions` supports those imports
under its existing no-emit configuration; no dependency or build-system change
is needed. `pnpm check` includes the prototype suite, so existing CI runs it.
Tests inject only the async settle boundary to make failure/reset races
deterministic; they exercise actual actions and selectors, without React/DOM
fixtures or a parallel implementation of the model.

Current-head CI, coordinator Kody trigger, issue comments, submitted reviews,
inline findings and dispositions belong in the PR review evidence and the
coordinator delivery report. A prior-head result never approves a changed head.
The source handoff and its checksum baseline remain unchanged.

Local validation on 2026-10-25: frozen install, 11 prototype tests, full
`pnpm check`, 20 existing identity integration tests (real libraries/PostgreSQL,
simulated provider HTTP), advisory audit (no known vulnerabilities), handoff
integrity (47 files, 30 assets, 311 local links), and whitespace checks pass.
The identity harness removed its disposable database. No new browser or
real-provider evidence is claimed.
