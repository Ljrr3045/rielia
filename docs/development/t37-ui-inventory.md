# T37.1 current UI inventory

**Discovery addendum — 2026-11-11 America/Caracas:** the subsequent fresh session
at preparation checkpoint `bc2fb2e` catalogued and explicitly loaded all three
intended frontend-local skills with readable resources. It also catalogued the
preserved upstream SKILL.md with unresolved relative resources; that archive is
now `SKILL.md.txt`. A second fresh session at `325d732` observed the three intended
local entries, no nested/archive candidate, and explicitly loaded all three.
Dispatches explicitly
select local top-level paths because local/global bare-name precedence was not
established. See [discovery evidence](frontend-skills.md#safe-discovery-and-precedence).
The source/base snapshot below remains unchanged.

Research snapshot: **2026-11-11, America/Caracas**, branch `docs/t37-ui-research`,
source/base `92d480dcc3c35f2bc340b99ff2dd084097c7457c`. This is a source inventory
and evidence index, not a new browser audit. The dispatch records T36 accepted in
[PR44](https://github.com/Ljrr3045/rielia/pull/44) and T37 authorized on November 11;
the preserved PROPOSED wording in older documents describes their pre-review state.

**Frontend-local skill discovery: PENDING.** `frontend-design`, `impeccable` and
`ui-ux-pro-max` are absent at this base. SOL prepares them separately in
`chore/t37-frontend-skills`; a fresh frontend session against the committed local
installation must verify discovery before visual implementation. The global skill
catalog proves no local installation. No installation or optional Impeccable
engine/hooks/live-copy Apply is part of this research.

## Scope and evidence labels

T37.1 prepares T37.2 through T37.5 under the [quality roadmap](development-quality-roadmap.md)
and [stable UI contract](t36-stable-ui-contract.md). Traceability is
P01-P11/P33/P38, US01-US08/US11-US12/US24-US25, UXR01-04 and UXR06 for current-list
comparison only, UX01-03/05-07/09/11. P09/US06/UX04 sprint implementation is
excluded, as are T11, calendar/reports/roadmap, MCP credentials, new task fields,
future navigation, landing, final brand/license decisions and deployment.
Broad product requirements do not make their undelivered fields current UI.

- **Source:** inspected code at the SHA above; describes rendering/contracts,
  without asserting successful execution.
- **Inherited evidence:** previously recorded observations, with their original
  build, scope and limitations. No audit or browser run was repeated here.
- **Proposal:** a T37 design or SOL follow-up in the [direction](t37-design-direction.md).
  It is not current behavior or acceptance evidence.

## State and contract owners

| Family | Public inputs and canonical client owners | Presentation and mixed ownership |
| --- | --- | --- |
| Identity | `IdentityState`, configured providers/session/message in [identity-controller.ts](../../apps/web/src/lib/identity-controller.ts), bound by [use-identity.ts](../../apps/web/src/lib/use-identity.ts); [client](../../apps/web/src/lib/identity-client.ts)/[proxy](../../apps/web/src/lib/identity-proxy.ts) own protocol | [page](../../apps/web/src/app/identity/page.tsx) and [identity-view.tsx](../../apps/web/src/app/identity/identity-view.tsx). View includes action/focus effects: appearance is Astra-owned; effect/handler changes require SOL |
| Workspaces | `WorkspaceSummary`, `WorkspaceMember`, `WorkspaceInvitation`, `WorkspaceCommand`/`WorkspaceResult` in [contracts](../../packages/contracts/src/index.ts). [use-workspaces.ts](../../apps/web/src/lib/use-workspaces.ts) binds one [workspace-controller.ts](../../apps/web/src/lib/workspace-controller.ts); [client](../../apps/web/src/lib/workspace-client.ts)/[proxy](../../apps/web/src/lib/workspace-proxy.ts) validate/transport | [workspace-view.tsx](../../apps/web/src/app/workspaces/workspace-view.tsx), [screen model](../../apps/web/src/app/workspaces/workspace-screen-model.ts), [screen actions](../../apps/web/src/app/workspaces/use-workspace-screen-actions.ts), feature leaves below. Screen actions and command construction are SOL-owned |
| Projects/tasks | `Project`, `Task`, `TaskPage`, `TaskView`, `ProjectAccessPage`, `ProjectAssigneePage`, `ProjectCommand`, capabilities and results in [project contracts](../../packages/contracts/src/project-tasks.ts). One [use-project-tasks.ts](../../apps/web/src/lib/use-project-tasks.ts)/[project-task-controller.ts](../../apps/web/src/lib/project-task-controller.ts); [client](../../apps/web/src/lib/project-task-client.ts)/[proxy](../../apps/web/src/lib/project-task-proxy.ts) retain protocol | [projects-view.tsx](../../apps/web/src/app/projects/projects-view.tsx) still prepares policy/move commands and coordinates local state. [content forms hook](../../apps/web/src/app/projects/use-project-content-forms.ts), [content model](../../apps/web/src/app/projects/project-content-model.ts), [interaction effects](../../apps/web/src/app/projects/use-project-interaction-effects.ts), [DOM hooks](../../apps/web/src/app/projects/project-dom-hooks.ts), [navigation focus](../../apps/web/src/app/projects/use-project-navigation-focus.ts) and [result focus](../../apps/web/src/app/projects/use-task-result-focus.ts) remain SOL-owned |
| Collaboration/discovery | [Collaboration DTOs/commands](../../packages/contracts/src/task-collaboration.ts), [independent collaboration slots](../../apps/web/src/lib/task-collaboration-state.ts), [discovery DTO/query](../../packages/contracts/src/task-discovery.ts), [event client](../../apps/web/src/lib/task-events-client.ts), same project controller | [collaboration projections](../../apps/web/src/app/projects/task-collaboration-view.ts) feed leaves; discovery uses the same detail and recovery composition. No additional controller, stream or task store |

All server capability and permission decisions remain canonical. Active human
workspace owners/admins have automatic private-content access; Agents and
delegated execution gain no human administration. A custodian lends no authority.
Use the ratified [project policy](project-access.md), not older proposal wording.

## Surface map

Copy ownership: **I** is inline bilingual identity page/view copy; **W** is
[workspace strings](../../apps/web/src/app/workspaces/strings.ts); **P** is
[project strings](../../apps/web/src/app/projects/strings.ts). W/P each use one
ES-default locale provider and a localized subtree, not separate controllers per
language. Authored names, descriptions and comments are not translated.

| Surface, role and requirements | Source/intent mapping | Current states, adaptation and copy |
| --- | --- | --- |
| `/identity`; anonymous or signed-in human. P01, US01, UX05/07/09 | I; configured `google`/`github` buttons, check, sign-in, sign-out through identity owner above | `loading`, `unavailable`, `disabled`, `signed-out` with zero/configured providers, `signed-in`; sign-in/out pending and incomplete/failed messages. Buttons stay focusable with `aria-disabled` plus handler guard. Inline ES then EN spans; long identity wraps. Separate-tab return/Refresh guidance preserves the originating tab's memory; provider completion remains deferred |
| `/workspaces` entry; signed-in human with returned capabilities. P02, US02, UX01/09 | W; [workspace-entry.tsx](../../apps/web/src/app/workspaces/workspace-entry.tsx), `create-workspace`, select/clear, workspace pager. Selection storage contains only an untrusted per-user ID | `loading`, `disabled`, `signed-out`, `empty`, `ready`, `forbidden`, `error`. Selected workspace can be outside first loaded page. Forbidden/error retain authorized switching/create where permitted. Single column at narrow widths; invitation rows split at 768 and workspace bar at 1024 CSS px. Draft hydration/trim/validation timing stays intact |
| Human members and Agents; readable membership plus human-admin actions. P03/P38, US03/24/25, UX06/11 | W; [members](../../apps/web/src/app/workspaces/workspace-members.tsx), [Agents](../../apps/web/src/app/workspaces/workspace-agents.tsx); `update-member`, `register-agent`, `manage-agent` | Owner protection, role/state/removal and custodian confirmations; member state and Agent principal state remain distinct. Agent allowed roles/custodian candidates remain supplied by existing rules. Pending/invalid/denied/conflict/unknown states use shared operation feedback. Wrapped cards preserve textual kind, role, state and custodian; never present a personal connection as a member |
| Invitations; recipient Accept/Dismiss; human-admin create/revoke. P03, US03, UX05/09 | W; [invitations](../../apps/web/src/app/workspaces/workspace-invitations.tsx), [feedback](../../apps/web/src/app/workspaces/workspace-feedback.tsx), [invitation location](../../apps/web/src/lib/workspace-invitation-location.ts); `invite`, `revoke-invitation`, `accept-invitation` | Inbound fragment is captured into memory and removed from current history; arrival never accepts. Generated-link Copy/Done has a separate lifetime; copy failure retains manual-copy field. `invitation-link-unavailable` has explicit recovery. Independent member/workspace/invitation pagers, long links/emails and pending/recovery remain reachable on mobile |
| `/projects` shell, project entry/create/settings/archive/restore; authorized readers and capability-gated writers. P04, US02, UX01/09 | P; [shell](../../apps/web/src/app/projects/project-shell.tsx), [work area](../../apps/web/src/app/projects/project-work-area.tsx), [project forms](../../apps/web/src/app/projects/project-forms.tsx), [content dialog](../../apps/web/src/app/projects/project-content-dialog.tsx); create/edit/archive/restore-project | No workspace, empty, loading, disabled, signed-out, denied/error, active/archived. Persistent rail from 1024; drawer below; narrow Options disclosure. Creation/private choice and lifecycle controls follow capabilities. Bare `/projects` still chooses the first project; explicit My tasks navigation is already available. No new default-route behavior |
| Access and assignees; human-web administrators versus authorized readers. P03/04/38, US03/24/25, UX05/06/11 | P; [project-access.tsx](../../apps/web/src/app/projects/project-access.tsx), [task-forms.tsx](../../apps/web/src/app/projects/task-forms.tsx); `change-visibility`, `change-access`, eligible-assignee pages | Explicit/effective/automatic access differ; confirmations explain the actual consequence. Archived visibility/grants are frozen while explicit revoke remains available. Independent access/assignee first-page and continuation errors, changed-page Refresh and exact-target conflict review. Historical unavailable assignee stays labelled. Access dialog is full-screen below 768; rows/actions wrap |
| Task list/board and capture; readers, permitted editors, archived/viewer read-only. P05/07/08, US04/05/08, UX01/02/03 | P; [view bar](../../apps/web/src/app/projects/task-view-bar.tsx), [list](../../apps/web/src/app/projects/task-list.tsx), [board](../../apps/web/src/app/projects/task-board.tsx), [move](../../apps/web/src/app/projects/task-move.tsx); `create-task`, `move-task`, existing status/assignee/priority/archive filters | Default list, five semantic statuses, authoritative counts/paging, empty versus filtered-empty, partial/changed/unavailable columns. Native status select and before-task/end-of-full-column menu remain drag alternatives. Mobile board shows selected column; desktop board scrolls locally. No assignment on capture; no sprint/label filter invented from broader P05/US05 |
| Task detail/edit/archive/restore; authorized reader, capability-gated editor. P05/38, US04/08/11/12, UX05/06/11 | P; [detail](../../apps/web/src/app/projects/task-detail.tsx), [description](../../apps/web/src/app/projects/task-description.tsx), task forms/content owners; existing create/edit/archive/restore-task commands | Title/Markdown/properties; immutable creator, provenance and assignee are separate. Current fields: title, description, type, priority, status, assignee, due date. Captured target/version survives same-target refresh; close retains staged draft, explicit discard clears. Contextual detail at 1280+, 30rem overlay at 768-1279, full-screen below 768. URL, opener/fallback focus and safe Markdown stay intact |
| Relations/checklist/comments/history; authorized readers and per-item capabilities. P05/06/10/38, US07/11/12/24/25, UX05/06/09/11 | P; [collaboration](../../apps/web/src/app/projects/task-collaboration.tsx), [relations](../../apps/web/src/app/projects/task-relations.tsx), [checklist](../../apps/web/src/app/projects/task-checklist.tsx), [comments](../../apps/web/src/app/projects/task-comments.tsx), [history](../../apps/web/src/app/projects/task-history.tsx) | Independent idle/loading/ready/empty/error/changed slots and pagers. Parent candidates load on demand; one-level links, child capture returns to parent, close warning rechecks child revision. Checklist canonical move anchors/two-step remove; own-author comment edit/exact-current review; read-only history. Wrap long text, scroll code locally; reuse the sole detail panel and recovery lifecycle |
| My tasks/Search in `/projects`; current principal's authorized workspace scope. P11/33/38, US02/04/05/08/12/25, UX01/03/05/09/11 | P; [task-discovery.tsx](../../apps/web/src/app/projects/task-discovery.tsx), same shell/detail/controller; `taskScope=mine\|search`, literal query and project/status/priority/archive filters | My tasks is current assignee, never creator. Project-grouped rows, loaded/server-total, first-page versus continuation error, changed revision, true empty versus no matches, 1,000-row memory-only return limit. Creation chooses an authorized project then existing capture. No workspace-wide assignee catalog. Live/connecting/reconnecting/offline/deferred refresh are distinct; live does not mean current |
| Shared and diagnostic `/`, `/prototype`; no production task authority | [layout](../../apps/web/src/app/layout.tsx)/[global CSS](../../apps/web/src/app/globals.css), [fixture page](../../apps/web/src/app/page.tsx), [prototype](../../apps/web/src/app/prototype/prototype-app.tsx)/[adapter](../../apps/web/src/lib/task-prototype/controller.ts) | Global light/dark follows system preference. Root document is ES; product subtrees switch language. Fixture/identity remain bilingual. Prototype has its own strings/styles and fictional memory-only tasks/sprints. No custom `error.tsx`, `global-error.tsx` or `not-found.tsx` appears in current `src/app`; framework fallback presentation needs future verification, not an invented current design |

## Recovery invariants and the two project debts

| Situation | Preserve or explicitly hand off |
| --- | --- |
| Pending versus unknown | Pending blocks duplicate commands. An interrupted submission is unconfirmed; Retry uses the original payload/key/target. Off-context recovery requires Return first. Refresh never resubmits a mutation |
| Conflict | Show draft and authorized current data. Access needs exact-target review; comment needs exact-comment review; checklist needs the complete current checklist. Move/reparent/reorder requires a fresh deliberate destination, not generic version rebase |
| Navigation/session | Preserve one controller and locale lifetime, same-human session-replacement fences, abort/stream cleanup and workspace isolation. Guard restores old URL before destination reads. Stay restores form; Discard cannot undo a server write and is disabled while pending |
| Memory | Drafts/keys/inbound tokens are memory-only, never a reload backup. Separate-tab sign-in plus return/Refresh is different from changing account/logout clearing. Workspace selection ID storage conveys no authority |
| Counts and independent failures | Use returned totals/revisions and collection-specific recovery. Missing/changed pages are not empty/zero; feedback dismissal cannot erase independent pager errors. Discovery return context is kept only while authorized revision/total match |
| **Project confirmed write then follow-up read 503** | **Inherited PR42 observation:** visible success becomes hidden; Load again/Workspaces are offered, with no automatic mutation resubmission. Proposed T37.4 change: retain a confirmed-operation message separately from read failure. Astra owns placement/copy; SOL owns state lifetime, integration and regression tests |
| **Project mutation 403** | **Inherited PR42 observation:** the form disappears and Refresh/Workspaces remain. Proposed T37.4 change: explain denial and whether recoverable local input remains, using only currently authorized data. SOL must define/test safe draft visibility, focus and reauthorization; do not keep forbidden record data on screen to preserve a form |
| **Workspace confirmed write then read 403/503** | **Inherited PR43 observation:** success stays visible, scoped rows clear, and follow-up failure is explained separately. Preserve this distinct baseline. Do not apply project hidden-success behavior to workspaces or call both a single defect |

Canonical selectors remain `/projects?workspace=W&project=P&task=T`, plus validated
`projectsView`, `tasksView`, `taskLayout`, `status`, `assignee`, `priority`, `column`,
`taskScope`, `q` and `searchProject`. Keep native modified-click/new-tab links.
URL validation/history belongs to the controller; task descriptions use
[safe-markdown.ts](../../apps/web/src/lib/safe-markdown.ts), not HTML injection.

## Baseline evidence and gaps

These are inherited records, not executions on this research head. Older UI guides
describe their original file owners; PR42/43 and the source map above supersede
those paths (notably the removed `workspace-admin.tsx`).

| Baseline | Reusable evidence | Limit / next owner |
| --- | --- | --- |
| [Identity UI](identity-ui.md) | PR4 live disabled/API-down paths at 320; temporary props focus cases; earlier dark-only 12-state Firefox captures at 320/390/768/1440 | Fixture states are not provider proof. Astra repeats affected visual states; SOL validates session/action behavior; real OAuth remains deferred |
| [Workspace extraction](workspace-interactions-extraction.md) | PR43 actual BEFORE `89316c4` on build `-q-Zrv3gK2KajB3sK7iT_`, AFTER `nbS-P6wEpvwQK1PQi8-K8`; six paired observations and 24 AFTER-only language/theme/reduced-motion viewport observations. Four emitted CSS files retained; global `efd33ab7` then workspace `ea9e16e7` | BEFORE is not a merge-head capture. HTTP fixtures do not establish persistence/security. SOL owns persisted parity; Astra owns new responsive/focus review |
| [Project extraction](project-interactions-extraction.md) | PR42 retained BEFORE `xiokvhnTJbbHM4SpTsbJf`, actual AFTER `-q-Zrv3gK2KajB3sK7iT_`; four byte-identical CSS files, global `efd33ab7` then project `6857b04`, paired native schedules and 17 AFTER responsive scenarios | No invented BEFORE screenshots or universal pixel/a11y claim. Two recovery debts above remain; partial-board/device/AT limits remain |
| [Project/task UI](project-task-ui.md), [access UI](project-access-ui.md), [views UI](task-views-ui.md) | Recorded real local API/PG journeys, role/access cases, list/board move/menu/return and responsive observations | Reuse exact historical claims only. New visual head needs affected persisted-flow and denial/retry checks; do not relabel emulated zoom or screenshots as physical-device proof |
| [Collaboration UI](task-collaboration-ui.md), [discovery UI](task-discovery-ui.md) | Recorded independent section recovery, own-author and conflict paths, grouped discovery/URL return, session guards and stream feedback | No fresh app, AT, provider or user review here. SOL owns regression/persistence; Astra checks placement and intelligible complete states |
| [Stable contract](t36-stable-ui-contract.md) / [unit guide](unit-coverage.md) | 145 web / 216 API / 7 contracts / 19 prototype cases, 387 total over 124 inputs, 68 web; existing numerical/per-file/nonregression gates | Historical implementation accounting, not tests run here. Maintained zero units, source-map/null/type-only debt remain SOL-owned; no threshold waiver and no visual-brief blocker |

CSS remains rooted in workspace `.shell` and project `.app`, with modal/detail,
feedback and `.taskRow .moveMenuPanel` / `.boardCard .moveMenu` ancestry. T37 may
change appearance deliberately; it must recheck connected styles and behavior,
not assume class-name matches prove equivalent containment or scrolling.

Research acceptance consists of these two bounded documents, real source links,
reference provenance and owner assignments. This prose-only task needs local link
validation and `git diff --check`, not app tests. No install, build, server,
Docker, browser-runtime launch, audit refresh, push, PR, paid review or deployment
is performed. The coordinator integrates these documents, updates progress and
changelog, and owns current-head review/acceptance of the preparation batch.
