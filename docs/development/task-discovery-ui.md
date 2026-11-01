# T10.1/B1b search and My tasks presentation

Status: bounded presentation on the merged T10.0 logic
([PR #23](https://github.com/Ljrr3045/rielia/pull/23), merge
`6bde444cd4e69115bc7004cf8d58c229ee7c55a7`). It supports P11, P02, P33 and
P38, US02/US05/US08/US12/US25, UXR01/UXR03 and UX01/UX03/UX05/UX06/UX07/UX09/
UX11. It does not complete full T10/P11/US05, labels/sprints, exports,
coediting, B2 views, real OAuth/staging/users or deployment. The delivery also
carries two independently authored, root-reviewed SOL controller/test
corrections for guarded-history URL restoration and session-replacement URL
clearing; those are not UI-owned logic changes.

The UI owns JSX, CSS, ES/EN copy, presentation composition and this evidence. All
other contracts, hooks, controllers, proxies, streams, session handling and
functional-test source remain logic-owned. The presentation consumes the merged
`useProjectTasks` surface and adds no domain logic of its own. The two accepted
SOL commits are included exactly as reviewed:

- `f1435b172180a940f6f914b22549e593c24235bc` (cherry-picked as
  `b4c6a42`) repairs the accepted guarded-history URL before destination reads,
  with a controller regression for draft/unknown and allowed/denied targets;
- `f67fc41bf986e829aa160bfa21aeb7cf73e71005` (cherry-picked as
  `29601ac`) clears a stale task/query URL when the human session is replaced and
  syncs the authorized default workspace, with a controller regression.

No other logic/test source is changed. The presentation does not change the bare
`/projects` default.

## Scope and paths

| Area | Presentation delivered | Requirement |
| --- | --- | --- |
| Navigation | Explicit **My tasks** (`?taskScope=mine`) and **Search tasks** (`?taskScope=search`) entries in the existing workspace sidebar; My tasks is the primary styled entry, the development home task-work link uses the explicit My tasks URL, and selected workspace parameters are preserved | P11/P33, US02, UX01 |
| Discovery bar | Scope switch, literal ID/key-number/title query (100 UTF-16 units maximum), status/priority/project/archive filters with a combined active-filter count, an inherited URL assignee shown only as a clearable selected value, and an explicit all-filter clear | P02/P08/P11, US05/US08, UXR03 |
| Creation affordance | Visible "Choose a project to create a task" disclosure over visible non-archived projects the project capabilities allow editing; it routes to that project's existing quick capture and focuses it. It never creates cross-project, invents capability or auto-assigns | P05/P11, US04/US08, UX02/UX03 |
| My tasks | Workspace-wide current-assignee rows; server resolves the assignee from the verified principal. The screen never substitutes creator or credential issuer | P11/P38, US02/US05/US25, UX06/UX11 |
| Search | Literal case-insensitive title substring or exact public UUID / project key and number; empty query lists readable tasks; optional project filter | P11, US05, UXR03 |
| Results | Project-grouped rows with project name and key, task key, title, type, status, priority, due date, human/Agent assignee, inactive/historical marker and archive state; no descriptions or foreign data | P11/P33/P38, US08/US25, UX03/UX06/UX09 |
| Counts/paging | Canonical page total and next cursor; loaded/total summary; loading-more state; 1,000-row context limit with narrowing/refresh guidance; changed/error states keep already loaded authorized rows | P33/P38, US08/US12, UX05/UX09 |
| Detail/context | Rows open through `openDiscoveryTask`; the existing URL-addressable detail keeps scope, query and filters, with Back/refresh reconstruction and an explicit return label. Focus returns only after an actual detail return | P05/P10/P11, US08/US12, UX01/UX03 |
| Live status | Truthful connected/pending, reconnecting, offline, deferred-refresh and delayed-stale feedback with an explicit Refresh action where allowed | P33/P38, US12, UX05/UX09 |
| Recovery | Existing project/task draft, retry, conflict, close-warning, policy and collaboration surfaces remain composed in the discovery route; no second state machine | P33/P38, US12/US25, UX05/UX09 |
| Workspace guard | Explicit Stay / Discard-and-switch dialog when a workspace change would discard local draft, pending or recovery state; Discard is disabled while a save is pending and explains that it removes local state but cannot undo a server write | P02/P38, US02/US12/US25, UX05/UX09 |
| Read-only/archive | Archived task/project rows remain visible with textual state; existing detail edit/archive/restore permissions still decide available actions | P14/P38, US24–US25, UX06/UX09/UX11 |

Key files:

- `apps/web/src/app/projects/task-discovery.tsx` owns the discovery bar, grouped
  result list, empty/loading/error/changed states and the live-status notice.
- `apps/web/src/app/projects/projects-view.tsx` wires the scope entries, discovery
  state/actions, detail return/focus, workspace guard and the existing recovery
  panels without adding another task store.
- `task-detail.tsx` accepts the presentation back label so the same accessible
  control says "Back to My tasks" or "Back to the search results" in discovery.
- `project-ui.tsx`, `strings.ts` and `projects.module.css` provide the search
  icon, ES/EN copy, shared semantic tokens and scoped responsive/theme styles.
- `apps/web/src/app/page.tsx` updates the development home's task-work entry to
  the explicit My Tasks URL without changing auth/session or bare-path behavior.
- `apps/web/src/lib/project-task-controller.ts` and
  `scripts/project-task-logic.test.mjs` contain only the two accepted SOL-owned
  navigation URL corrections and their regressions; the UI worker did not author
  or rewrite them.

Canonical route selectors are supplied and validated by the merged controller:
`/projects?workspace=W&taskScope=mine|search&q=…&searchProject=…` plus the
existing status/priority/assignee/tasksView and selected project/task. The UI
does not parse selectors. The sidebar links explicitly request a scope; bare
`/projects` keeps its previous first-project behavior.

## Interaction decisions

- The scope switch uses `setTaskScope`; the query form uses `setSearchQuery`; the
  project filter uses `setDiscoveryProject`. Filter changes use the shared
  `setTaskFilters` contract. No presentation effect implements default, session
  or URL policy.
- My tasks means **assignee**, never author. The server returns the current
  assignee identity and historical human/Agent labels; the row does not infer an
  assignee from the creator or the session email.
- The first page and every continuation come from the canonical discovery page.
  Counts are never derived from loaded rows. When a new query/filter context is
  loading, the previous context's rows are replaced by a loading region rather
  than being presented under the new controls. A same-context refresh or
  continuation keeps the loaded rows and labels the update.
- Discovery and legacy project rendering are mutually exclusive: the project
  header/list/board/detail block requires `taskScope=project`, and the legacy
  project-overview empty block is gated the same way. Opening a discovery detail
  therefore cannot mount a second task detail, dialog ID or focus trap behind the
  discovery result list.
- `discovery.status === 'changed'` keeps the stale page readable but requires
  Refresh before continuing. A failed first page offers Retry; a failed
  continuation keeps the rows and offers Retry. A 401/403 clears private data
  through the existing controller and the route's signed-out/forbidden state.
- The 1,000-row context limit is shown explicitly; it disables append and points
  to narrower filters or Refresh. No fake total or client search is introduced.
- The approved status/priority/project/archive filters are exposed. The project
  filter is included in the active-filter count and the explicit all-filter
  clear; the query stays separately clearable. The project view keeps its
  authorized project-assignee selector. Discovery does not invent a
  workspace-wide assignee catalog: an assignee value already present in a URL or
  inherited from project scope is displayed only as a clearable selected value,
  with no invented people options or displayed name.
- Zero-result discovery states distinguish a true empty scope (My tasks with no
  assignment, empty search guidance, archived-empty) from a query/filter that
  merely matches nothing; the latter always uses the no-matching-results copy.
- Quick capture remains the existing project-scoped capture. The discovery view
  exposes a visible "Choose a project to create a task" disclosure for visible,
  non-archived projects whose returned capabilities allow editing; choosing one
  opens that project's existing quick capture and focuses it. The UI does not
  fabricate a cross-project create command, an unavailable project choice or an
  auto-assignment. Archived task views hide creation.
- Opening a row calls `openDiscoveryTask`; closing uses `returnToDiscovery`.
  Browser Back and reload reconstruct the scope/query/filter context. Focus is
  restored to `discoveryFocusTaskId` only after leaving a discovery detail, and a
  background SSE refresh never steals focus.
- Existing draft/retry/conflict/unknown-outcome/close-warning feedback is reused.
  A discovery detail can still edit/archive/restore according to the returned
  task and project permissions. Workspace changes with pending local state open
  the explicit guard in place of an open form: exactly one modal/focus trap is
  active, retained form state is not reset, Stay restores the form, and Discard
  is disabled while a save is pending. The guard explains that discarding removes
  local state but cannot undo a server-accepted write.
- `streamStatus` is displayed truthfully: connected is not described as
  up-to-date; pending refresh, deferred refresh, reconnecting, retry exhaustion
  and offline are separate messages. A safe Refresh action is offered where the
  controller permits it.

## Accessibility and responsive decisions

- Native buttons, links, inputs, selects and headings; visible focus; labelled
  query/filter controls; 44 px targets; 16 px mobile query text; no color-only
  status, priority, Agent or archive state.
- Discovery controls stack at 320 px without page overflow. Scope tabs share a
  row, the query form wraps to one column at 320 px, and filters move into the
  existing disclosure pattern at narrow widths. Desktop keeps the compact
  filter row.
- The result list is grouped by project with a heading per group and a labelled
  list per group. Project name and key are visible with every workspace result,
  not only in a tooltip.
- Each result title is a full-width native link with a 44 px minimum target in
  normal flow; metadata remains outside the link and modified clicks keep native
  new-tab/open behavior. The results section has an explicit heading.
- ES/EN copy and light/dark semantic tokens are included. The localized subtree
  keeps its existing `lang` behavior; the document shell language is unchanged.
- Toolkit widths for validation are 320, 375, 390, 768, 1024 and 1440 px, plus
  keyboard and touch-emulated interaction. No physical device, screen-reader/AT,
  WCAG certification or real 200% browser zoom is claimed.

## Validation evidence

Committed combined source checkpoint:
`29601ac17965f7038c397e95fa8773eb9fdd4798` (presentation series
`c1a2a1d`, `7c59d29`, `81c2fe0`, `b6ad973`, `0f6cc64` plus the exact accepted
SOL commits `f1435b17` and `f67fc41b`). Presentation files are
`task-discovery.tsx`, `projects-view.tsx`, `task-detail.tsx`, `project-ui.tsx`,
`strings.ts`, `projects.module.css` and the development home `page.tsx`; the two
SOL controller/test files are listed above. Earlier checkpoint
`792414f0ea3b8d386780ab35a0c73c475c27d0b7` was the validators' initial fixture
source and is superseded.

Root review and independent-validator findings resolved:

- Discovery and legacy project/detail blocks are mutually exclusive, including
  the empty project overview, so an open discovery detail cannot duplicate the
  detail, dialog IDs or focus traps.
- The workspace guard replaces an open form rather than hiding behind it: one
  modal/focus trap is active, retained form values are not reset, Stay restores
  the form, and Discard remains disabled while a mutation is pending.
- The project filter is counted and cleared with the explicit all-filter action;
  an inherited URL/project assignee is a visible clearable selected criterion with
  no invented people source. Query text remains separately clearable.
- Filtered/query zero results use the no-matching-results state; true-empty copy is
  reserved for unfiltered scopes in mine/search/archived.
- The development home task-work link and primary sidebar My Tasks entry use the
  explicit My Tasks URL; selected workspace parameters are preserved where
  available.
- A visible choose-project-to-create disclosure lists visible, non-archived
  projects whose returned capabilities allow editing and routes to that project's
  existing quick capture. It does not create cross-project or auto-assign.
- The discovery result title is a full-width native 44 px link without overlapping
  metadata or a blanket row-click role; the results section has an explicit
  heading.
- The shared breadcrumb link now has a scoped 44 px hit area; the responsive
  validator measured 44 px at 768, 844 landscape and 1024 with no overflow.
- Feedback target text wraps long unbroken titles. The measured 608 CSS px pending
  guard was constrained by a `minmax(0,1fr)` modal grid column and
  `min-width:0`/`max-width:100%` modal variants; narrow modal actions stack
  full-width. The targeted 320/390 recheck reported `failure=null` and the root
  visually confirmed the corrected 390 guard.
- On forbidden reauthorization, a stale empty edit/policy modal shell is dismissed
  and any workspace guard is cleared without discarding controller recovery. The
  precise functional disposition is: the old-source revocation removed private
  rows, detail and textarea fields; only the empty Edit task modal shell persisted
  (one dialog, zero cached fields). The fix is shell dismissal/focus, not a
  demonstrated private-data leak.
- The two accepted SOL controller fixes restore the requested workspace URL after
  guarded history Discard (including denied destinations) and clear the old
  task/query URL when a human session is replaced.

Validation evidence:

- The focused `pnpm test:projects:logic` suite passes 63 project/client/proxy/
  controller checks after the SOL cherry-picks, including T10 scope/search/detail/
  Back, paging, draft, conflict, guarded-history and session-replacement cases.
- Web typecheck, targeted ESLint and production web build pass on the presentation
  corrections.
- Independent responsive evidence: results/filter/single-detail/return/no-results
  pass at 320, 375, 390, 768, 1024 and 1440 px plus 844×390 landscape; ES/EN
  light/dark sampled; no page overflow; result target 44 px; query text 16 px;
  overlay Tab/Escape pass. Page-two (105 rows) exact focus works via explicit
  return and browser Back; a focus refresh retains an unsent query. The guard over
  an edit presents one accessible trapped dialog; Stay preserves the exact draft
  and Discard reaches the actual foreign-workspace denial. The final accepted
  responsive report confirms the exact 320/390 guard width, fitting actions,
  disabled pending Discard, long feedback at 267/337 px, native keyboard status
  selection, Stay/Escape draft and Discard URL, exactly one active guard in the
  CDP accessibility tree, and desktop smoke. Its final mobile evidence used UI
  head `b4c6a42` with the live SOL `f67` source, which the combined `29601ac`
  review contains.
- Independent functional evidence: real two-session update without reload; dirty
  input and captured conflict survive later writes; final blocker discard
  refreshes canonical state; unknown-response commit followed by response loss
  preserves the original retry key across events (two attempts, one persisted
  version); deferred SQL rollback leaves no outbox/count/visible refresh change;
  offline/online plus focus recovers; member suspension and actual session expiry
  pass; the real authorization suite and a 1,001-row context cap pass. The SOL
  session-replacement regression covers same/different human and ready/empty/
  forbidden/unavailable targets without resubmitting. The final existing-390
  functional regression/report was still pending when this guide was updated; the
  combined standard check below passes.
- `pnpm install --frozen-lockfile` and the combined `pnpm check` pass on
  `29601ac`: lint, Express-free closure, process cleanup, identity/workspace/
  project suites, 63 focused project/client/proxy/controller checks including T10,
  prototype, strict types, production builds, 17 MCP/Inspector checks and HTTP
  smoke. Audit high/critical, handoff integrity and whitespace are recorded in the
  final delivery pass. Screenshots and private QA state remain outside the
  repository.

The earlier 390×844 EN dark touch initial capture measured a 169.23×18 px result
title and two visible duplicate detail dialogs with no whole-page overflow; the
corrected candidate removes both and the final validator recheck covers them.

## Limits and remaining work

- No full T10/P11/US05, labels, sprints, exports, advanced search, coediting,
  business worker, B2 views, real OAuth/staging/HTTPS, real users, deployment or
  public-launch acceptance is claimed.
- The bare `/projects` default is intentionally unchanged; discovery is reached
  through the explicit My tasks/Search entries or a scope URL.
- The discovery assignee filter is limited to a value already supplied by the URL
  or inherited from the project view. A full people picker in workspace search
  would need a logic-owned authorized source.
- Creation remains project-scoped: the discovery disclosure only chooses an
  editable project and opens its existing quick capture. No cross-project create
  or auto-assignment is presented.
- SSE is single-replica invalidation, not a durable client log or coediting
  guarantee. A live connection does not imply that a pending refresh has already
  completed.
- Physical touch, real screen-reader output, Safari/Firefox, 200% zoom and
  user-outcome validation remain unavailable. A screenshot alone is not treated
  as flow proof.

## PR evidence

Presentation PR: to be opened as one English non-draft PR to `dev` from
`feat/t10-search-my-tasks-ui` after independent validation. The coordinator
alone posts the exact `@kody start-review` trigger for each ready head and merges.
