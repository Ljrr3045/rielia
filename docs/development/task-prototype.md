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
| `selectTask(id or null)` | Select/close detail without resetting view/filters. `selectedTaskId` can be unknown while `selectedTask` is null: show a missing-task state. URL serialization/history restoration needs a separately assigned logic follow-up; presentation owns focus. |
| `beginCreateTask(status?)`, `beginEditTask(id)` | Open one controlled draft. Default create status is backlog; assignment is null. Creating within a column may pass its status. Project is fixed. |
| `updateTaskDraft`, `discardTaskDraft`, `saveTask` | Editable fields exclude IDs, version, creator and provenance. Malformed collection patches produce a field error immediately and retain the existing typed draft. Failed save retains all draft fields; success clears the draft and selects the saved task. A new draft requires explicitly saving/discarding an existing task or sprint draft. |
| `moveTask(id,status)` | Menu/keyboard and optional drag use the same action. Status stays unchanged until success. A failed move is retained for retry; no second task record is created. |
| `beginCreateSprint`, `beginEditSprint`, `updateSprintDraft`, `discardSprintDraft`, `saveSprint` | Planned-only goal/date/scope editor. `taskIds` is the full chosen scope. Choose only unscoped tasks or tasks already in this sprint; deselection returns a task to backlog scope while preserving status. |
| `startSprint(id)` | Only planned → active, with no other active sprint. Dates/goals were validated at planning; demo does not enforce today's date. |
| `getSprintSummary(state,id)` | Import from the non-React barrel. Returns separate done/canceled/unfinished task ID arrays; count with `.length`. Canceled never counts as delivered. Closed summaries retain the closing outcome after a task is reopened. |
| `closeSprint(id,destination)` | Show the summary and require a destination: `{kind:'backlog'}` or `{kind:'sprint',sprintId}` targeting another planned sprint. Moves only unfinished tasks, preserving status; done/canceled keep their closed sprint. Closure is confirmed only on save success. |
| `save` | Render `idle`, `pending`, `error`, `saved`; `kind` identifies the feedback operation and `context` identifies its actual target (see below). Error includes `code`, plain English `message`, and nullable `field`. A rejected patch may display field feedback while a previous failed save remains captured. UI may localize code/field; do not infer successful persistence from a click. |
| `canRetry`, `retryContext`, `retrySave()` | The flag and context refer to the captured **previous simulated save failure**, independently of the latest field/action error. `canRetry` is true exactly when `retryContext` is non-null. Label the control "Retry previous save" and associate it with that context; retry resubmits the captured operation and draft ID, not a rejected patch. Rejected/no-op actions retain it. A valid draft edit/discard or accepted new draft clears it; a valid new mutation replaces it. Validation/version errors themselves are not retryable and need correction/review. |
| `simulateNextSaveFailure`, `nextSaveWillFail` | Explicit demo control, one-shot after the next valid save begins. Invalid fields do not consume it. Default save delay is 350 ms, permitting pending UI. No random failures. |
| `reset('seeded' or 'empty')` | Discard all demo mutations/drafts/feedback/filters/selection; default seeded. Also invalidates pending completions. Empty keeps planned sprint templates but has zero tasks. |

During `pending`, duplicate writes and draft changes/open/discard actions are
ignored; navigation, filters, selection and reset remain available. Mutations
return `Promise<boolean>` and synchronous actions return void. Local versions
prevent saving an old task draft over a status/scope change made through this
same adapter. There is no merge/compare UI or real multiuser conflict claim.
Snapshots are stable between publications and deeply frozen. Subscribers must
only observe updates; unsubscribe when done (`useSyncExternalStore` does this).

### Feedback and retry targets

`SaveContext` is exported by the non-React barrel. `save.context` describes only
the latest feedback; `retryContext` describes only the captured failed operation.
Both are immutable snapshots, independent of selection, view, and filters:

| `context.kind` | Target and operation fields |
| --- | --- |
| `task` | `taskId` of the create/edit draft, including a new task not yet in `tasks` |
| `status` | `taskId` and the requested `status` |
| `sprint` | `sprintId` of the planning draft, including a new sprint |
| `start-sprint` | `sprintId` being started |
| `close-sprint` | Source `sprintId` and a copied `destination`; null destination means rejected validation without a valid destination shape |

Idle feedback has null context. Unbound action errors (for example, trying to
open another draft while one exists) also have null context, even with a selected
task. Rejected malformed draft patches refer to their actual draft. A validly
shaped request for a missing record refers to that requested ID; malformed runtime
target/status values are omitted from trusted context. `save.kind` remains for
compatibility and is not sufficient to correlate feedback with a record.

Match both context kind and ID before rendering local feedback. A failed or
successful save of A still belongs to A after selecting B. Navigation does not
erase feedback, drafts, data, or recovery; a global recovery control may instead
explicitly identify A. Never infer a retry's target or operation from the latest
`save`, its error code, or the selected record. For example:

```ts
const feedback = state.save.context;
const retry = state.retryContext;
const feedbackForTask = feedback !== null
  && (feedback.kind === 'task' || feedback.kind === 'status')
  && feedback.taskId === renderedTaskId;
const retryForTask = retry !== null
  && (retry.kind === 'task' || retry.kind === 'status')
  && retry.taskId === renderedTaskId;
```

While a save is pending, `save.context` describes that attempt and `retryContext`
is null. On simulated failure both describe that attempt. Later rejected actions
may replace feedback while preserving the retry context. Successful save, accepted
draft change/discard/open, and reset clear retry context; success retains its own
feedback context. A valid new save replaces the previous attempt.

For a close dialog, use matching `close-sprint` context and source sprint ID.
When reopening after failure, show the captured retry destination; retry uses
that destination regardless of a dialog's local default. During pending use
`save.context`. A captured close retry always has a non-null destination.
An unrelated task/sprint retry cannot lock this dialog's destination control.
No operation history, backend behavior, or production recovery guarantee is added.

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

Local validation on 2026-10-25: frozen install, 13 prototype tests, full
`pnpm check`, 20 existing identity integration tests (real libraries/PostgreSQL,
simulated provider HTTP), advisory audit (no known vulnerabilities), handoff
integrity (47 files, 30 assets, 311 local links), and whitespace checks pass.
The identity harness removed its disposable database. No new browser or
real-provider evidence is claimed.

Kody's [draft collection finding](https://github.com/Ljrr3045/rielia/pull/5#discussion_r4369776732)
was valid: a malformed `labelIds`/`taskIds` patch could throw before validation.
An actual-action regression failed with `value.labelIds is not iterable` before
the fix. Draft update boundaries now reject non-array/non-string collections
with field feedback, retaining the usable draft; sprint text validation also
guards its string operations. The regression covers null, undefined, scalar,
object, string and invalid-element collections and successful correction/save.
Public signatures and prototype scope are unchanged. A new head requires fresh CI
and the coordinator's new Kody trigger.

The next requested round's [retry-retention finding](https://github.com/Ljrr3045/rielia/pull/5#discussion_r4369810021)
was also valid: rejecting a malformed patch retained the draft but erased the
captured retry. A real task/sprint failure → rejected patch → retry regression
failed with `canRetry === false` before the fix. Rejected/no-op actions now
preserve the captured operation; feedback and retry availability are independent.
Only accepted draft changes or new mutations intentionally clear/replace it.
The test verifies no duplicate task/sprint, correct scope and eventual save,
including invalid draft-open/no-op discard and a valid edit that clears retry.

### Save-target follow-up

Tracked in [PR #7](https://github.com/Ljrr3045/rielia/pull/7), a non-draft
prerequisite to `dev` for separately owned UI PR #6.

The coordinator requested this bounded prerequisite from merged
[PR #5](https://github.com/Ljrr3045/rielia/pull/5),
`5099b39aef53d5b7e2f0205f3168727cb1dc9471`, after PR #6's
[foreign task feedback/retry](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4369892991)
and [unrelated retry locking closure](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4369892911)
findings. Kind-only gating cannot distinguish task A from B. Separate immutable
feedback/retry contexts supply that missing identity and captured close destination
without clearing recovery on navigation. Orca's worker terminal reported
**GPT-6.1-Sol xhigh** before implementation.

Scope remains T01/B0 prototype subsets of P05/P07/P09, US04/US05/US06 and
UX01/UX04/UX05/UX09. Acceptance is actual-action regression evidence for foreign
task feedback, independently retained retry, truthful close destination, immutable
snapshots, malformed boundaries and stale completion after reset. Six new focused
tests bring the suite to 19; the first five failed against the original adapter
(13 existing passed, five failed on missing contexts) and passed after the fix.
The additional runtime-boundary test rejects malformed target/status/destination
values without freezing caller objects or erasing a previous retry.

This prerequisite adds no JSX/CSS, route, identity/backend/public contract, storage,
dependency, handoff edit, or production policy. UI integration and browser journey
verification remain with the separate PR #6 owner; full T01/B0 remains incomplete.

Follow-up local validation on 2026-10-25 uses Node 24.22.1 (the repository runtime)
and pnpm 12.15.0: frozen install, all 19 prototype tests, full `pnpm check`, all
20 existing real-library/PostgreSQL identity tests, advisory audit (no known
vulnerabilities), handoff integrity (47 files, 30 assets, 313 local links) and
whitespace checks pass. The identity harness removed its disposable database;
smoke servers exited. An initial sandboxed check could not bind identity test
loopback ports (`EPERM`); the authorized rerun outside that restriction passed.
No new browser, provider, deployment or real-product evidence is claimed.
