# Delivery progress and decisions

Updated: 2026-11-01 UTC. This is repository delivery tracking, separate from the
unchanged [handoff](../handoff/00-START-HERE.md). Plans describe intended outcomes,
not completed implementation. This checkout has the T02.0 fixture, merged T02.1/
T02.2 identity experiment, and a fictional T01/B0 task-prototype logic adapter plus
its responsive presentation, the merged T03.0 experimental local MCP health wrapper,
and T04.0's opt-in preparatory local Docker runtime/diagnostic worker. T35.0 now
adds bounded principal/minimal workspace/membership foundations and verified
execution. T06 adds actual task attribution; T09.0 adds bounded collaboration logic
and T09.1 adds its presentation. T10.0 adds bounded workspace search,
current-assignee My tasks and session invalidation logic. The T10.1 presentation
candidate consumes that merged logic through explicit My tasks/Search entries,
project-grouped results, live-status feedback and workspace-draft protection;
export remains separate.
T05.0 adds actual workspace/membership/invitation backend and frontend logic with
merged T05.1 presentation. T06.0 adds bounded persisted project/task backend and
frontend logic, and merged T06.1 adds its presentation. T07.0 adds bounded private
project/access logic under the ratified administrative visibility policy; T07.1
adds its presentation on that logic. T08.0 adds persistent status ordering,
allowlisted task filters and versioned list/Kanban query/move logic; T08.1 adds
its list/board presentation on that merged logic. T09.0 adds one-level hierarchy,
checklist, own-author comments, safe typed history and frontend lifecycle contracts;
T09.1 consumes that logic for the detail, draft/recovery, attribution and history
presentation. Invitations/guests, full
T06/P05/T07/T08/T09/US05 and integration scope remain open. It has no
deployed task product, deployment or software release. The coordinator owns
integration and status across workers.

The user's [2026-10-27 stack and sequencing decision](stack-validation-decisions.md)
approves the current stack except Express. The [authorized migration](nest-http-adapter.md)
now uses official Nest NodeAdapter 12.3.2 and checks actual API/worker/migration
dependency closure. [T35.0 foundations](principal-foundations.md) follow it under
the sequencing override; full T35 and T05/T06/T12 remain incomplete.
Real provider/staging, staging-dependent remote OAuth discovery and
real-project/user acceptance are OPEN/DEFERRED until an advanced end-to-end slice
and user scheduling. This overrides their immediate scheduling gate for local
implementation, without completing tickets or weakening automated checks/launch gates.

## Current delivery

| Field | Evidence/state |
| --- | --- |
| Scope | T10.1/B1b presentation on merged T10.0 logic: explicit workspace **My tasks** (`taskScope=mine`, current assignee) and ID/title **Search tasks** (`taskScope=search`), project-grouped results with project name/key, status/priority/project/archive filters, canonical totals/paging and bound, loading/empty/error/changed states, visible live/pending/reconnecting/offline feedback, context-preserving detail navigation, existing draft/retry/conflict recovery and a workspace-navigation Stay/Discard guard. P11/P02/P33/P38; US02/05/08/12/25; UXR01/03; UX01/03/05/06/07/09/11. No JSX logic/hooks/controllers/proxies/session policy/functional tests, labels/sprints, exports, coediting, credentials, staging or deployment |
| Base | `origin/dev`, T10.0 [PR #23](https://github.com/Ljrr3045/rielia/pull/23), verified merged as `6bde444cd4e69115bc7004cf8d58c229ee7c55a7` |
| Branch | `feat/t10-search-my-tasks-ui`, one English non-draft presentation/docs PR to `dev` |
| Worktree | Isolated `feat-t10-search-my-tasks-ui`; OpenCode Go `opencode-go/deepseek-v4.1-flash` variant `max` verified by the coordinator's terminal footer; no helpers or shared checkout |
| Current PR | T10.1 presentation PR pending after independent SOL validation; T10.0 logic [PR #23](https://github.com/Ljrr3045/rielia/pull/23) is merged as `6bde444cd4e69115bc7004cf8d58c229ee7c55a7` |
| T10.1 evidence | [Search and My tasks UI guide](task-discovery-ui.md): combined source `29601ac17965f7038c397e95fa8773eb9fdd4798` (presentation corrections plus two exact root-reviewed SOL controller/test commits). Full `pnpm check`, 63 focused project/client/proxy/controller checks including T10, web typecheck, targeted ESLint and production build pass; independent responsive seven-width/recovery evidence accepted; final functional 390 regression/report pending. Audit/handoff/whitespace, PR/CI/Kody evidence remain pending |
| T10 evidence | [Discovery/SSE contract](task-discovery.md): 61 focused client/proxy/state checks; full standard check; real PostgreSQL search/authority/rollback/commit-order/replay/revocation plus eight-table restart witness; real Nest→Next 105-row search and two-session streaming QA; Docker runtime smoke; audit high/critical, handoff and whitespace pass. Independent denial/deferral/page-two return findings fixed with regressions; Kody hydration and SSE metadata findings addressed by one bounded shared hydration and id/version-only polling, with 12 T10 PG tests. T10.0 [PR #23](https://github.com/Ljrr3045/rielia/pull/23) merged as `6bde444cd4e69115bc7004cf8d58c229ee7c55a7` |
| T09 evidence | Frozen install, full `pnpm check`, 46 focused project/client/proxy/XSS checks, real PG migration/permission/race/rollback/aborted-HTTP tests and eight-table PostgreSQL-restart witness pass. Actual archived-row migration preservation, >100 paging and new/edited-comment discovery, final-migration Docker runtime, expanded real Next proxy QA, audit high/critical gate, handoff and whitespace pass. PR #21 reviewed head `0e4784c3d41ddd095c69f61b49489e9a78065347`; root Kody trigger `6546958383`, final Kody check `124610642083` SUCCESS/no-issues comment `6546960524`, CI `41226123949` / check `124610518385` SUCCESS. Logic worktree removed by coordinator |
| T09.1 presentation | [Task collaboration UI](task-collaboration-ui.md), [PR #22](https://github.com/Ljrr3045/rielia/pull/22), verified merged 2026-10-31T20:10:22Z as `8d51135af5260bdb8773863a4a7fb8ff6a966f8e`. Functional/responsive validators and final standard checks passed their documented bounded cases; historical CI/Kody evidence remains on the PR/external report. No full T09/P05/P14/P38, real-user/AT/WCAG, staging or deployment claim |
| T09 contract | [Task collaboration](task-collaboration.md): archived children remain independent, removal retains checklist rows, comments editable only by current authorized original author, latest-update-first comments and newest-event-first history; no fabricated legacy before/after values or raw JSON |
| Audit | `pnpm audit --audit-level=high` passes with 0 high/critical; inherited development-only minimatch 10.2.6 moderate GHSA-g3hv-75wg-m249 remains as already documented in PR #20; no dependency/lockfile changes |
| T08.1 presentation PR | [#20](https://github.com/Ljrr3045/rielia/pull/20) merged as `a93cb85e1e4a4175b1ea7a93ca89d922032fa3fa`; reviewed `a46a5e47`, Kody approval `5723763333` / check `124591980449`, CI check `124590250125`; both completed worktrees removed |
| T08.0 logic PR | [#19](https://github.com/Ljrr3045/rielia/pull/19) merged 2026-10-30T18:31:57Z as `f8895709f881df18a4d2d4a33483dab5add0e51e`; reviewed source `b2dbc55e9ad1383612e16d1ccaed79f5336ec7a4`, CI run 41106175856 / exact-head check 124237103945, Kody check 124240156276 and approval 5716919765; logic terminal/worktree settlement confirmed and external report preserved |
| T07.1 presentation PR | [#18](https://github.com/Ljrr3045/rielia/pull/18) merged as `ac3de5351e49b8b60bf3b2bbb55b8d695899f68d`; final review/CI evidence remains in GitHub and the external report; its completed worktree is absent from Orca inventory |
| T07.0 logic PR | [#17](https://github.com/Ljrr3045/rielia/pull/17) merged 2026-10-29T16:51:39Z as `c72831c1be4ca2332a6162adc2af85d529b441b8`; final reviewed head `bf9e6fcf`, CI SUCCESS and Kody approval `5701623155`; coordinator verified clean settlement, preserved the external logic report and removed its worktree |
| T06.1 presentation PR | [#16](https://github.com/Ljrr3045/rielia/pull/16) merged as `545473c3d381a7a532e8f5b9ad77f30d6b5a70bc`; prior final review/CI evidence remains in GitHub and its external delivery report; both T06 worktrees removed |
| T06.0 logic PR | [#15](https://github.com/Ljrr3045/rielia/pull/15) merged 2026-10-28T22:51:16Z as `e23d2e495a2e4c3dc499bcdde4ac8dd84d74fdad`; reviewed source `338fc64725aa8448cd4512c3c3952d53f394e45d`, CI 40781598293 SUCCESS, Kody review 5690694480/check 123144649000 complete with all three threads resolved. Coordinator confirms the logic worktree was removed |
| T05.1 presentation PR | [#14](https://github.com/Ljrr3045/rielia/pull/14) merged 2026-10-28T20:57:11Z as `d27e3302a059cda6ef570c75efed42deda188a39`; reviewed source `6c0e64952129b10c25f195443f88ec7331ef1a02`, [CI 40764734574](https://github.com/Ljrr3045/rielia/actions/runs/40764734574) SUCCESS, [final Kody 6480178609](https://github.com/Ljrr3045/rielia/pull/14#issuecomment-6480178609) complete and exact-head check SUCCESS. Both findings resolved; coordinator reports completed worktrees removed |
| T05.0 logic PR | [#13](https://github.com/Ljrr3045/rielia/pull/13) merged 2026-10-28T20:21:29Z as `01c9cc168bb9dde62b4290c049b982d62952c9a5`; reviewed source `11f886a4cbc28ab6d2e59c91a7aae096a9fefddd`, CI 40761116202, Kody completed; withdrawn fourth recovery finding resolved; coordinator merge only |
| Principal foundations PR | [#12](https://github.com/Ljrr3045/rielia/pull/12) merged 2026-10-28T18:36:55Z as `b87dadb165971d0594429f6a08c047626f9d596e`; reviewed head `6c841a334987a51977af41d4fe19e0a151e1394e`, [Kody approval 5687764538](https://github.com/Ljrr3045/rielia/pull/12#pullrequestreview-5687764538), [CI 40745500251](https://github.com/Ljrr3045/rielia/actions/runs/40745500251). Both findings fixed; coordinator verified merge, preserved evidence and completed worktree removal |
| Adapter migration PR | [#11](https://github.com/Ljrr3045/rielia/pull/11) merged 2026-10-27T20:30:56Z as `70314c550b643fd5678375939535cdb93331c9b2`; final reviewed head `eb8b19c91cd065b4308af2025f5d16d2533d6ea3`, [Kody approval 5673819042](https://github.com/Ljrr3045/rielia/pull/11#pullrequestreview-5673819042), [CI 40577221864](https://github.com/Ljrr3045/rielia/actions/runs/40577221864). Coordinator confirms its completed worktree removed |
| Stack decision PR | [#10](https://github.com/Ljrr3045/rielia/pull/10) merged 2026-10-27T19:58:09Z as `3efb49fde4f43d9d58964510c3ef61f744bea062`; final reviewed head `81f884122dd0ab99e0a73c767b99d7aa7db6ba64`, Kody approved that head and [CI 40571647316](https://github.com/Ljrr3045/rielia/actions/runs/40571647316) passed. Fresh GitHub reads confirm merge/review/checks; coordinator reports its completed worktree removed |
| T04.0 PR | [#9](https://github.com/Ljrr3045/rielia/pull/9) merged 2026-10-27T19:25:58Z as `74779941905937ca7c05217169b0ef3028c10b9c`; final reviewed head `0fcd6c4ea9b2aa05940b795c871d2d30ec3f4742`, [Kody approval 5672890614](https://github.com/Ljrr3045/rielia/pull/9#pullrequestreview-5672890614), [CI 40565906228](https://github.com/Ljrr3045/rielia/actions/runs/40565906228). Fresh GitHub reads confirm merge/approval/passing checks; coordinator confirms prior worktree removed |
| T03.0 PR | [#8](https://github.com/Ljrr3045/rielia/pull/8) merged 2026-10-26T19:31:05Z as `cb92d90f433873c4e98f2a3b6a2401cc6ddad48b`; final reviewed head `7ead11bb6f333d017ff12a6cd5998c972a8bfbaf`, [Kody approval 5657821543](https://github.com/Ljrr3045/rielia/pull/8#pullrequestreview-5657821543). Fresh GitHub reads confirm merge/approval; Orca inventory confirms completed worktree removed |
| T01 presentation PR | [#6](https://github.com/Ljrr3045/rielia/pull/6) merged 2026-10-25T08:13:36Z as `a869e317fd05e87d9afd62597842e5fc125e57ee`; reviewed head `043c4507eb385e43720849f43fc1812f43689ce0`, [Kody approval 5642187480](https://github.com/Ljrr3045/rielia/pull/6#pullrequestreview-5642187480), [CI 40175255312](https://github.com/Ljrr3045/rielia/actions/runs/40175255312). Fresh GitHub reads confirm PRs #5/#7/#6 all merged; full T01/B0 real-user acceptance remains open |
| T01 logic PR | [#5](https://github.com/Ljrr3045/rielia/pull/5) merged 2026-10-25T06:01:32Z as `5099b39aef53d5b7e2f0205f3168727cb1dc9471`; reviewed head `55481ffb3613ccaadcb37f3e6dd3ad3118afb8c3`, [Kody approval 5641785181](https://github.com/Ljrr3045/rielia/pull/5#pullrequestreview-5641785181), [CI 40166748588](https://github.com/Ljrr3045/rielia/actions/runs/40166748588); logic worktree removed |
| T01 context PR | [#7](https://github.com/Ljrr3045/rielia/pull/7) merged 2026-10-25T07:25:09Z as `bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f`; reviewed head `c90b437ca5948301b790b655256c8a460b3bef21`, [Kody approval 5642060409](https://github.com/Ljrr3045/rielia/pull/7#pullrequestreview-5642060409), [CI 40172013213](https://github.com/Ljrr3045/rielia/actions/runs/40172013213) |
| T02.2 PR | [#4](https://github.com/Ljrr3045/rielia/pull/4) merged 2026-10-25T02:57:42Z as `ae67fcc321a0cbb152a0137141d8d6a05abae631` after reviewed head `f9c4cc70e51cadf7722dcac775b402f926fbf9a8`, [Kody approval 5641248403](https://github.com/Ljrr3045/rielia/pull/4#pullrequestreview-5641248403), and [CI 40156199016](https://github.com/Ljrr3045/rielia/actions/runs/40156199016); live PR evidence reread during this reconciliation |
| T02.1 PR | [#3](https://github.com/Ljrr3045/rielia/pull/3) merged 2026-10-25T02:33:47Z as `096a1a31bd45a536017bffb4a424cd4c50062101` after reviewed head `b0dc76a062f301433b25fcf583f28aa125602eb3`, Kody approval [5641185728](https://github.com/Ljrr3045/rielia/pull/3#pullrequestreview-5641185728), and CI run [40154146443](https://github.com/Ljrr3045/rielia/actions/runs/40154146443) |
| Fixture PR | [#2](https://github.com/Ljrr3045/rielia/pull/2) merged 2026-10-25T01:10:25Z as `629932ad282c27c0b71c6b8d5daf15e3cc199965`; [Kody approval](https://github.com/Ljrr3045/rielia/pull/2#pullrequestreview-5640882613), [CI](https://github.com/Ljrr3045/rielia/actions/runs/40148711191) |
| T00 | Complete: [PR #1](https://github.com/Ljrr3045/rielia/pull/1) merged 2026-10-24T23:56:43Z as `8dd7c31f454c1989d017dbf7b40e6646112d2d2a` after final-head Kody SUCCESS/APPROVED |
| T01–T35 | No full ticket complete; T01 logic and presentation are bounded partial evidence only |
| Prior resource cleanup | Coordinator reports all prior completed worktrees removed, preview stopped and evidence preserved outside the repository; current worker never deletes its active checkout |
| Automated review | Kody AI: coordinator alone posts exact root `@kody start-review` for each ready head; prior-head evidence never approves changed code |

T00 acceptance: complete byte-identical import with links/assets/hashes/proposal
status; practical repository instructions and docs; truthful dependency/state
tracking; passing whitespace/integrity checks; one non-draft PR to `dev`; latest
head Kody review handled with passing applicable checks. The user retired OpenCode
and requested deletion of its entire workflow, including the inherited version.
The coordinator alone posts each ready head's Kody trigger and merges after
validation and feedback handling. T00 itself added no app/scaffold scope; its
final Kody approval covered head `53243fbea2ae6c4f5a1ab3e47d6e1dc8cc296cec`.

## T08.0 persistent list/Kanban logic

The [T08 guide](task-views.md) records the accepted bounded contract. PostgreSQL
remains the only task source. A new additive migration backfills positive gapped
bigint ranks within each of five existing statuses and adds a monotonic project
task revision. List order groups semantic statuses then rank; board partitions
query exactly that order. Create/status edits append, archive retains rank and
restore retains position. Normal midpoint moves and rare transactional compaction
preserve authorship, task versions and the separate project edit/access version.
Compaction conservatively bumps affected row versions; one aggregate move event,
outbox and receipt commit with all rank/status/revision effects or roll back.

Status, assignee (including unassigned) and priority are scalar allowlisted
filters. At most 100 rows per page, scoped counts and opaque query/revision-bound
cursors prevent mixed-version append; any task mutation requires Refresh before
continuing an older page. Selected assignee names are server-resolved from current
project eligibility or historical assignment, independently of assignment options;
foreign/unrelated identities receive the same unavailable metadata. Every
read/count/cursor/move/conflict/replay rechecks current T07 private entitlement,
membership/grant ceilings and archives under the existing fence.

The production hook adds validated view/filter/column URLs, independent board
pages/errors, honest coherent totals/capture eligibility, explicit move eligibility
and projections over the same draft/key lifecycle. Status-filtered boards retain
authorized hidden destinations. Mixed revisions remain readable but unmovable.
Move conflicts require discard, Refresh and an explicitly fresh destination;
ordinary version-only rebase is disabled. Selected detail survives filters and
committed success survives a failed follow-up read. Auxiliary policy failures,
session/account clearing and stale-response guards remain independent.

Final-source frozen install, 36 focused project/client/controller/proxy checks,
full `pnpm check`, real PG/Nest suites (32 domain, 12 principal, 12 workspace,
23 identity), six-table digest/count container-restart witness, seven-migration
Docker runtime smoke, populated real PG/Nest/Next QA smoke, audit, handoff and
whitespace checks pass. Real aborted HTTP commit/retry, within/cross-column races,
query-bound paging, actual migration preservation, forced compaction and deferred
rollback of task/event/outbox/receipt are covered. Audit reports no known
vulnerabilities. QA/runtime/identity clean their owned servers/containers/volumes
and private state. The initial sandbox QA failure and temporary generated
Next-dev route-type collision were corrected; generated Next instructions/types
are excluded from this scoped PR. No JSX/CSS, screen-reader/physical-touch,
real OAuth/staging/user or scale certification is claimed. Full T08/US05 remains
open for separate presentation and absent configurable workflows/labels/sprints.
PR #19 merged on 2026-10-30T18:31:57Z as
`f8895709f881df18a4d2d4a33483dab5add0e51e`; reviewed source
`b2dbc55e9ad1383612e16d1ccaed79f5336ec7a4`, CI run 41106175856 / exact-head
check 124237103945, Kody check 124240156276 and approval 5716919765. The
coordinator confirmed the logic terminal/worktree were settled and removed and
the external report preserved. The merged PR records two accepted operational
limits: the additive migration is offline/local and atomic (ACCESS EXCLUSIVE
locks; quiesce a live app; no online/zero-downtime or split-install guarantee),
and an unfiltered list can perform up to five ordered per-status reads (101
rows) pending future profiling/coalescing that preserves semantic status order
and keyset predicates. No throughput or cross-request policy-cache claim is
made.

## T09.1 task collaboration presentation

The [T09 UI guide](task-collaboration-ui.md) records the presentation on merged
T09.0 logic. The existing task detail now adds one-level parent/child relations
with quick-add and child-centric link/reparent/unlink, open-child close warnings
with explicit acknowledgment, checklist progress/add/edit/toggle/reorder/remove,
attributed safe-Markdown comments with own-author versioned editing and edited
marker, and separate typed history. Shared staged collaboration drafts survive
navigation with Return/Discard, unknown-key retry and exact comment/checklist
review; parent/checklist move conflicts require refreshed deliberate selection.
Archived projects/tasks and viewer surfaces remain read-only, including comments.

Mobile uses the existing full-screen detail from 320px; desktop keeps the
contextual panel. ES/EN, light/dark, 44px targets, focus restoration, native
labels/roles and safe Markdown React nodes are included. No hook/controller/
proxy/contract or backend change was made.

The separate Sol functional validator used the single real PG/Nest/Next runtime
and passed bounded hierarchy, checklist, close-warning/changed-revision, parent/
archive, attribution/paging, conflict, lost-response, auth and content-only XSS
cases. It confirmed an off-target draft label defect and a lost success notice;
the UI fixed both and focused retests passed on the final presentation source.
The independent responsive/keyboard validator passed CSS viewport, native role,
relation navigation and emulated-touch checks, found nested picker Escape and
edit-cancel focus defects, and passed the affected retests on the corrected
source. Later review found and the UI fixed two recovery-presentation gaps:
child quick-add 409 now uses the child draft conflict branch with retained
title/parent and explicit Discard + Refresh (retested at 390/1440), and an
off-target child conflict now suppresses the at-target panel in favor of the
single Return banner (retested at 390 on the final head). No actual PRE block,
real 200% zoom, physical device, screen-reader/AT or WCAG certification is
claimed; private reports and attempts stay outside the repository.

Final standard `pnpm check`, audit/handoff/whitespace and the presentation PR
[#22](https://github.com/Ljrr3045/rielia/pull/22) are recorded here; PR #22 merged
2026-10-31T20:10:22Z as `8d51135af5260bdb8773863a4a7fb8ff6a966f8e`; its
historical CI/Kody evidence remains in GitHub and the external final report. No
full T09/P05/P14/P38,
T10/T11/T12/B2, credentials, staging/OAuth, real-user or deployment acceptance is
claimed.

## T10.1/B1b search and My tasks presentation

The [T10 UI guide](task-discovery-ui.md) records the bounded presentation on
merged T10.0 logic `6bde444cd4e69115bc7004cf8d58c229ee7c55a7`. `/projects` now
offers explicit **My tasks** (`taskScope=mine`) and **Search tasks**
(`taskScope=search`) entries without changing the bare project-route default.
Discovery results are grouped by project with visible project name/key and task
key, title, type, status, priority, due date, human/Agent assignee and archive
state. Search accepts a literal ID, project key/number or title fragment (100
UTF-16 units maximum); status/priority/project/archive filters, canonical totals
and next cursors, loaded/total summaries, a 1,000-row context limit and
loading/empty/error/changed states are presented from the merged hook.

Rows open the existing URL-addressable detail through `openDiscoveryTask` and
return through `returnToDiscovery`, preserving scope/query/filters across Back
and reload and restoring focus only after an actual detail return. Discovery and
legacy project/detail rendering are mutually exclusive, so an open discovery
detail cannot mount a second detail or focus trap. The existing
draft/retry/conflict/close-warning/policy/collaboration panels remain in the
discovery route. A workspace change with local unsaved or recovery state opens an
explicit Stay/Discard dialog in place of an open form, preserving retained form
state with one focus trap; Discard is disabled while a save is pending and
explains that it removes local state but cannot undo a server write. Live status
distinguishes connected, pending refresh, deferred refresh, reconnecting and
offline states; a live connection is never described as already up to date.

The project-filter criterion is included in the active-filter count and the
explicit all-filter clear; the query stays separately clearable. An assignee
criterion inherited from the URL or project scope is shown as a clearable selected
value without inventing a workspace-wide people catalog. Discovery does not
invent an assignee catalog: the approved full selector remains in the project
view. The development home task-work entry and the primary styled sidebar My tasks
entry use the explicit My tasks URL, preserving the selected workspace where
available. A visible "Choose a project to create a task" disclosure lists editable
non-archived visible projects and routes to that project's existing quick capture,
without cross-project creation or auto-assignment.

Committed combined source `29601ac17965f7038c397e95fa8773eb9fdd4798` passes
`pnpm check`, 63 focused project/client/proxy/controller checks including T10,
web typecheck, targeted ESLint and production build. The two exact accepted
SOL controller/test commits (`f1435b17` guarded-history URL repair and `f67fc41b`
session-replacement URL clearing) are included and documented as logic-owned, not
UI-authored. Independent responsive validation accepted the seven-width matrix,
44 px targets, single detail/focus, guard/Stay/Escape and long-feedback fixes; the
final existing-390 functional regression/report, audit/handoff/whitespace and
PR/CI/Kody evidence remain pending and are coordinated by the root. No full
T10/P11/US05, labels/sprints, exports, coediting, real OAuth/staging/users,
physical-device/AT/WCAG or deployment acceptance is claimed.

## T08.1 task views presentation

The [T08 UI guide](task-views-ui.md) records the presentation on merged T08.0
logic. `/projects` now provides a status-grouped list and five-column board from
one `useProjectTasks` source, supported status/assignee (including unassigned)/
priority filters, authoritative per-column counts, column quick capture, native
status movement, precise before-task/end-of-column menus, outer keyboard board
navigation and persisted order. The list and board preserve the T06/T07 project
shell, detail URL/focus, private access, archive restrictions, historical
authorship/assignee labels and the single canonical pending/draft/retry/conflict
lifecycle. Move conflicts require Discard + Refresh + a fresh destination; no
version-only or former-anchor rebase is exposed.

Mobile defaults to list; board uses one selected column at 320 px with a native
column selector. Project administration is collapsed into an accessible
`Options` disclosure (Access/settings/archive), the view bar uses a short archive
label, and the initial 320×740 viewport shows the first board column heading or
the list capture. Board columns are 272 px wide, contain localized status/Move
controls without inner horizontal overflow, scroll vertically inside a bounded
height and use only the outer board horizontal scroll. The outer frame is a
keyboard region with Arrow/Home/End support; the canceled column is reachable
and 1440/1024 geometry was measured. ES/EN localized subtrees set `lang`
correctly; light/dark, keyboard menus, Escape/focus return, reduced-motion CSS
and 44 px targets are included.

Independent Codex validation (`ctx_603bf34ae047`, task `task_74a22b577a49`)
recorded 19 passing latest cases and no unresolved observed defect. It
reproduced and the UI owner fixed three presentation-only defects: pre-canonical
move focus now waits for target status plus page order version; delayed
different-row focus intent is cancelled through a focusin ref (remount may end
on BODY without stealing to the moved task); and the 320px list Move menu now
flows full-width instead of overflowing. Passing evidence includes exact native
keyboard reorder/persistence, same/cross-column canonical order, committed-
response-loss original-key/payload replay (task version 2, order revision 120,
one row), conflict + fresh canceled destination, filtered/selected-detail
retention, coherent focus, independent column/mixed recovery, named fallback,
100+14 paging without duplicates, en/es localized subtree, menu/card containment
with native Tab/Escape, mobile touch End, native desktop drag and 320/390 menu
reachability. External validator scripts/screenshots/private state remain outside
the repository.

Final frozen install and full `pnpm check` pass lint, Express-free closure,
process cleanup, 7 identity, 16 workspace, 36 project/task, 19 prototype,
strict typechecks, production builds (`/projects` static), 17 MCP
subprocess/Inspector checks and HTTP smoke. `pnpm audit --audit-level=high`
passes the high/critical gate; one moderate dev-tooling `minimatch` advisory
(GHSA-g3hv-75wg-m249 via typescript-eslint/eslint) remains, with no production
runtime path. Handoff integrity passes 47 imported files, 30 assets and 434
local links; whitespace checks pass. The UI PR is
[#20](https://github.com/Ljrr3045/rielia/pull/20) from
`feat/t08-task-views-ui`; source commit `54828fa`, with exact final
head/CI/Kody state in GitHub and the external report. No full T08/US05/P07,
T09/T10/B2, real-user, staging/OAuth,
deployment, physical-device, AT/WCAG or 200%-zoom certification is claimed; the
English subtree is `lang=en` while the document shell remains `es`, and the
delayed-different-row remount may end on BODY without restoring the other row.

## T07.0 project privacy and explicit access

The [project access guide](project-access.md) records the 2026-10-29 user
ratification: active human workspace owner/admin automatically reads all scoped
private projects. Delegated human content uses that subject's entitlement under
its grant ceiling; autonomous Agents require their own explicit access and never
inherit custodian/issuer rights. Only human web owner/admin can create private
projects, change visibility or manage explicit entries. T05 invitations/roles and
membership lifecycle remain canonical. Member/Agent workspace-visible project
creation remains authorized; no project-lead role is introduced.

Current policy filters every existing read/count/cursor/detail/write/assignment/
conflict/replay under the transaction fence. Explicit access survives visibility
transitions but does not revive membership. Project aggregate versions serialize
policy edits; immutable subject-specific activity, outbox and receipt commit with
the business effect. Archived access revocation is allowed; granting and visibility
changes require restore. Historical attribution and assignment remain immutable.

The production hook adds server access/eligible-assignee pages and policy command
recovery while preserving existing content presentation types. Read-side 403
clears prior full result/conflict/policy data. Access pages with changed aggregate
versions cannot append stale rows under a new version; target access review is
available beyond page one before explicit conflict rebase. No JSX/CSS is changed.

Local frozen install, full `pnpm check`, 28 focused project client/proxy checks,
real PG/Nest suites (24 domain, 12 principal, 12 workspace, 23 identity), six-table
container-restart witness, final-migration Docker runtime smoke, enlarged
101-extra-member QA smoke, audit, handoff and whitespace checks pass. Audit has
no known vulnerabilities; handoff retains 47 files/30 assets and verifies 418
local links. Owned test servers/databases/volumes/runtime tags and private QA state
are removed. The guide records intermediate upsert-version, concurrent migration
edit and generated Next dev-cache failures and their verified resolutions.
Implementation is in [PR #17](https://github.com/Ljrr3045/rielia/pull/17);
exact ready head/CI/Kody evidence is being recorded before delivery.
Real OAuth/HTTPS/staging/users, new MCP
credentials, SSE, RLS/deployment and full T07/T35 acceptance remain open. The
coordinator owns every review trigger, merge and finished-worktree cleanup.

## T06.0 project and task logic

The [project/task guide](project-task-flows.md) records the bounded contract and
decisions. Real workspace-visible projects retain immutable uppercase keys;
task numbering is allocated transactionally without reuse. Create/read/edit/
archive/restore enforce current workspace/grant policy and captured versions.
Creator and creation provenance stay immutable and independent of the nullable
human/Agent assignee. Historical inactive assignees remain readable without
allowing new inactive assignment. Project archive freezes child writes; project
restore preserves each task's own archive state.

Business writes, minimal immutable activity/outbox and actor/workspace/channel/key
receipts commit together or all roll back. Same-key replay rechecks current access
before returning the current authorized target. Composite constraints prevent
cross-workspace/project relationships; prior migrations/handoff remain unchanged.
No dispatcher, business worker, private-project policy or new authentication
adapter is added. Current operation grants narrow both actual access and returned
capabilities. The existing singleton fence remains an explicit internal scale limit.

`useProjectTasks` exposes production paging/detail selection, server capabilities,
captured drafts/versions/targets, explicit original-key retry/discard and conflict
compare/reload/rebase. Same-project task A/B saves require an explicit return to
the original target. URL state preserves scoped project/task IDs and archived
list context through reload/Back. Safe Markdown AST logic leaves raw HTML/images
inert. No JSX/CSS, fake-data path or product page is included in this logic PR.

Local frozen install, full `pnpm check`, 16 focused controller/client/proxy/
Markdown checks, audit (no known vulnerabilities), handoff and whitespace checks
pass. The real-PG/HTTP run passes 15 domain, 12 principal, 12 workspace and 23
identity checks plus a five-table digest/count witness across actual PostgreSQL
container restart and a subsequent real Nest read/number allocation. Actual
100-record page boundaries, two tenants, assignments/provenance, grant removal,
key/number/version races and deferred rollback of each event/receipt stage are
covered. Docker runtime packaging/migration/checksum/readiness/worker/restart/
lock/signal/nonroot checks pass with all five migrations, including a final-source
repeat after the parser/correlation change; owned resources removed.
The final narrow parser/request-correlation change passed full check and the PG
suite. Test-only real PG/Nest/Next QA harness passed
actual proxy detail readiness with fictional signed sessions and cleaned its
labelled container/volume/processes, including separate loopback browser session
switch fixtures. Initial harness restart/port/shadowing and
concurrent dev-generated-type failures were corrected before the passing runs.
No real OAuth/HTTPS/staging, browser presentation/assistive/touch or real-user
acceptance is claimed. Full T06/T35/P05/P14 remains open.

PR #15's initial two inline findings were accepted: random UUID pagination could
miss late low-ID inserts and a transient next-page failure cleared already loaded
data. The real-PG regression failed with three versus four tail records; an
actual-controller regression failed with a null project instead of its retained
detail. Monotonic project-sequence/task-number cursors and labelled page errors
fix both. The new paging migration deterministically backfills existing projects
and preserves every prior SQL checksum. Live totals remain explicitly nonsnapshot.
Transient errors retain loaded lists/details/cursors and mutation success while
401/403 still clear private data. Findings/dispositions are linked in the
[guide](project-task-flows.md); the changed head requires fresh CI/root Kody.

The next review's global cursor disclosure finding was valid. The internal
monotonic project sequence now stays private: public cursor is an already visible
project ID resolved only through the current workspace/ID fence. Foreign and
missing anchors have identical generic denial; archived anchors remain valid.
The real-PG regression failed pre-fix with numeric cursor `105` instead of the
visible ID, then covers private DTOs, scoped anchors and late insert continuity.

Final packaging inspection found that default API deployment included test files.
An explicit runtime/schema/config package allowlist now excludes the signed-session
QA harness and all tests. Dry-run packaging retains generated Prisma/runtime and
all migrations; deployed-image smoke additionally rejects `/app/test`.

## T05.0 workspace and membership logic

The [workspace flow guide](workspace-flows.md) records scope/requirements, API,
storage, invitation/rejoin decisions, policy, idempotency and the UI integration
contract. Humans create/list/select persisted workspaces and view scoped human/
Agent members. Human owner/admin can issue/revoke limited, expiring invitations,
manage versioned roles/state and register/manage bounded agents. Acceptance
requires the verified recipient and current issuer rights. Revoked membership
stays terminal; suspended membership is explicitly restored by an administrator.
Custodian departure requires transfer or agent suspension first. Owner transfer/
deletion, email and agent credentials are excluded.

Invitation hashes, composite issuer membership references, versions, authority
invalidation and actor/key receipts are additive. Every operation reloads current
session/policy under the fence; membership/consumption/receipt commit together or
roll back. Removal revokes subject grants; viewer demotion revokes write grants,
preserving legitimate read grants and independent autonomous-agent authority.

Production-data `useWorkspaces` and same-origin Next proxy add no JSX/CSS or fake
adapter. They distinguish auth/loading/empty/forbidden/error/pending/success/
conflict, invalidate stale scope/page responses and preserve same-human memory
drafts plus original-target/key recovery. Another account clears recovery.
Invitation links use memory-only fragments, immediate history clearing and
explicit POST acceptance. Signed-out recipients sign in in a separate tab, then
Refresh the original tab; reloading needs the original invite link. Separate UI
delivery owns responsive/keyboard/touch/accessibility/real-user evidence.

Local Node 24.22.1/pnpm 12.15.0 validation passes: frozen install, full `pnpm check`
(workspace client/proxy, existing suites, strict types/builds, Express-free
closure and actual Next route smoke), real PG/HTTP workspace suite (12 checks),
12 principal and original 23 identity checks. Two tenants, roles/owner/custodian,
malformed/forged context, origin, hash-only tokens, wrong/unverified recipient,
expiry/concurrent single use, issuer/session-removal races, grants/versions and
rollback are covered; disposable PG was removed. Full Docker migration/checksum/
readiness/worker/restart/lock/signal/nonroot checks pass; owned resources were
removed. Audit reports no known vulnerabilities. Handoff integrity (47 files,
30 assets, 387 local links) and whitespace checks pass. Exact-head CI/Kody
evidence is recorded in [PR #13](https://github.com/Ljrr3045/rielia/pull/13) before handoff.
No full T05/T07/T35, projects/tasks,
real OAuth/staging/users, RLS/deployment or launch acceptance is claimed.

Self-review added a real-PG receipt regression: after a consistent external
ownership/membership change, replaying workspace creation returned the historical
owner summary (201). It now reloads the scoped current summary and denies lost
membership (403), just as accepted-invitation replay does. The regression failed
before the fix and passes afterwards; no ownership-transfer endpoint was added.

UI integration added a narrow `clearGeneratedInvitationLink` hook action. A
regression verifies that closing the created outbound link preserves a separately
received token and its later explicit acceptance. Clearing both tokens remains
the separate explicit `clearInvitation` action; presentation adds no token state
machine or functional helper.

The final focused client/proxy suite has 16 checks. Integrated browser QA found
that same-document invite fragments needed capture after mount; the hook now
observes `hashchange`, clears token history immediately and removes its listener
on cleanup. A pending acceptance clears only its own token, retaining a newer
received invitation. The A/B race regression failed before the fix and passes
afterwards, alongside lifecycle, draft/selection preservation and cleanup checks.

PR #13's initial inline findings were valid: member pagination re-queried each
row, principal revocation was misclassified as forbidden, and the Accept action
could replace an unknown-outcome request key. The new real-PG/HTTP regressions
failed pre-fix with four individual member lookups instead of one and 403 instead
of 409. Eager principal loading now keeps lookup count bounded; terminal agent
checks use both membership and principal state. Client regression failed pre-fix
with `key-2` instead of `key-1`; Accept now reuses matching captured recovery and
cannot overwrite another token's recovery. All three fixes and the integration
patch share one changed head requiring fresh coordinator review; earlier approval
on `efb4bda5` does not approve that head.

## T05.1 workspace and membership UI

The [workspace UI guide](workspace-ui.md) records the bounded `/workspaces`
presentation for P02/P03/P33/P38 and US02/US03/US24–US25 (UXR01/UXR03;
UX03/UX05/UX07/UX09/UX11): workspace selection/creation, compact human/Agent
members, admin invitations/revocation, explicit acceptance, versioned member role/
suspend/restore/remove, owner protection, and agent registration/state/custodian
controls. It uses only `useWorkspaces` production data; no fake adapter, metrics,
credentials, SMTP, owner transfer/deletion or rejoin is presented as working.

Forms hydrate from `ws.draft` and stage edits so Refresh/remount/session loss keeps
unsent input and scoped versions. Recovery shows the affected subject and original
workspace, preserves success when a follow-up read fails, keeps conflict drafts,
and directs invitation-link-unavailable to Refresh/explicit revoke. The route is
single-language Spanish default with an EN selector, uses the shared semantic
tokens and scoped responsive CSS, and provides light/dark, visible focus, live
feedback and compact mobile rows. Local browser QA covered create/select,
invite/accept, agent register/suspend/restore/custodian, owner protection, session
loss with draft restoration, blocked-API recovery, ES/EN, dark/light and 320/390/
768 no-horizontal-overflow; root Brave QA covered 1440/mobile and keyboard. The
branch is rebased onto `origin/dev` at `01c9cc168bb9dde62b4290c049b982d62952c9a5`,
the [PR #13](https://github.com/Ljrr3045/rielia/pull/13) merge (reviewed source
`11f886a4`, CI 40761116202, Kody complete; fourth recovery finding withdrawn and
resolved). Final UI `pnpm check`, audit, handoff and whitespace evidence plus the
one English non-draft [PR #14](https://github.com/Ljrr3045/rielia/pull/14)/CI/Kody
rounds are recorded in the [workspace UI guide](workspace-ui.md). The first Kody
round found two valid presentation bindings: agent member badges now distinguish
principal/membership state accurately, and the workspace selector synthesizes the
current workspace when it is outside the loaded page. Both are fixed with focused
lint/type/build evidence. Final source `6c0e64952129b10c25f195443f88ec7331ef1a02`
passed CI 40764734574 and the fresh coordinator-triggered Kody completion
6480178609; both findings are resolved. PR #14 merged 2026-10-28T20:57:11Z as
`d27e3302a059cda6ef570c75efed42deda188a39`, and the coordinator reports the
completed worktrees removed. No full
T05/T07/T35 or real-user acceptance is claimed.

## T07.1/B1b private-project access UI

The [project access UI guide](project-access-ui.md) records the bounded
presentation on merged T07.0 logic `c72831c` for P02/P03/P04/P14/P33/P38,
US02/US03/US08/US12/US24–US25 and UX01/UX03/UX05/UX06/UX07/UX09/UX11. It adds
create-time visibility, private/workspace header disclosure, a human-admin
access/visibility panel with automatic owner/admin disclosure, paginated
people/Agents, explicit grant/re-grant/revoke with consequence-specific copy and
retained automatic/workspace access, archived revoke-only behavior, and
server-eligible paginated assignees with the historical unavailable assignee
retained.

Policy and content drafts share the canonical controller. Row actions stage the
captured target/version when review opens; Confirm submits that draft. Pending is
distinct from unknown outcome (disabled Confirm, plain Retry/Discard, no spinning
success). Conflict review uses the exact current target member; access pages keep
rows on a changed version and require full refresh; access/assignee first-page
failures retry independently while content stays usable; cross-context unknown
outcomes require Return before Retry. Workspace selector, view toggles, create/
restore and task/detail controls honor policy pending/draft without replacing the
outstanding command.

Validation: frozen install, full `pnpm check` (lint, Express-free closure, 7
identity, 16 workspace, 28 project/task, 19 prototype, typechecks, production
builds, 17 MCP checks and HTTP smoke), real PG/Nest/Next browser QA with
`--large-members`, audit, handoff verifier and whitespace checks. Browser flows
covered owner/admin automatic access, member/viewer grant/revoke/re-grant,
visibility transitions and retained rows, admin explicit removal with automatic
access preserved, stale access paging, visibility conflict/rebase, pending versus
unknown outcome, cross-context return and same-key retry, archived revoke-only,
eligible-assignee paging/historical assignee, independent auxiliary failures,
content-pager plus policy-error coexistence/recovery, archived-revoke conflict/
rebase and missing-current exact-target review, 320–1440 responsive, EN/ES,
light/dark, 44 px targets and focus trap/restoration.
Screenshots are external to the repository; no screenshot alone is treated as
flow proof. Kody inline 4415985054 was valid and fixed: a changed-version access
page now hides stale Load more and keeps full Refresh over the loaded rows
(`36`/`37`). Physical touch, screen-reader and cross-browser certification remain
unavailable. No functional test source, auth bypass, fake API/model, secrets or
deployment was added.

PR #17 merged 2026-10-29T16:51:39Z as
`c72831c1be4ca2332a6162adc2af85d529b441b8` after final head `bf9e6fcf`, CI
SUCCESS and Kody approval `5701623155`; the coordinator verified settlement,
preserved the external logic report and removed its worktree. The UI PR
[#18](https://github.com/Ljrr3045/rielia/pull/18) from `feat/t07-project-access-ui`
merged as `ac3de5351e49b8b60bf3b2bbb55b8d695899f68d`; final head and review state
remain in GitHub and the external delivery report. Both completed T07 worktrees
are absent from current Orca inventory. No
full T07/T35, invitation/guest/lead, collaboration or real-user acceptance is
claimed.

## T06.1/B1a project and task UI

The [project/task UI guide](project-task-ui.md) records the bounded `/projects`
presentation for P04/P05/P14/P33/P38 and US04/US08/US12/US24–US25
(UXR01/UXR02/UXR03/UXR06; UX01/UX02/UX03/UX05/UX06/UX07/UX09/UX11). It covers
workspace-visible project creation/settings/archive/restore, compact task lists,
title-plus-current-project capture, URL-addressable detail (inline desktop panel,
tablet overlay and full mobile), task edit/status/type/priority/date/assignee,
immutable creator/provenance with textual Agent labeling, archived state, and
active/archived views. It uses only the T06 production client/hook and safe Markdown
AST; no fake API, model, metrics or backend import is added.

Drafts stage into the Sol-owned hook so same-tab session loss and context changes
retain the captured target/version; another account clears private recovery.
Pending/success, invalid, forbidden, transient load/pager errors, unknown-outcome
same-key Retry/Discard and current-vs-draft conflict comparison are presented.
Archived projects freeze task edits; restoring a project does not restore
individually archived tasks. A historical inactive assignee stays visible and is
not silently replaced. ES is the default language with an EN selector; light/dark,
44 px targets, visible focus, live feedback and responsive 320–1920 layouts are
included.

Root-browser findings during integration were fixed and reverified: the scoped
page no longer inherits the global narrow `main` width (1920 now uses full readable
columns); copy/attributes match the API limits (project name 1–200, key 2–10,
description 20000, task title 1–300); viewer/date copy no longer exposes
implementation language; drawer, detail, modal, conflict/rebase and success
completion now keep meaningful focus; signed-out state exposes the promised
**Actualizar** action; and one mobile route crash from a `find()` undefined focus
fallback was fixed before handoff. Kody PR #16 found three further valid
presentation issues: forbidden feedback was missing in an open modal; a narrow
unmounted-detail draft banner was suppressed; and shared modal discard bypassed
focus restoration. All are fixed with focused browser evidence and fresh checks in
the [UI guide findings
section](project-task-ui.md#pr-16-review-findings-and-dispositions); the changed
head requires a fresh review round.

Final local evidence: `pnpm check` passes lint, Express-free closure, process
cleanup, 7 identity, 16 workspace, 16 project/task, 19 prototype, strict
typechecks, production builds, 17 MCP checks and HTTP smoke; audit reports no known
vulnerabilities; handoff integrity passes 47 files/30 assets/405 local links;
whitespace checks pass. The disposable real PostgreSQL/Nest/Next harness exercised
actual migrations/client/proxy and owner, conflict, session, unknown-outcome,
viewer/tenant, keyboard and long-content journeys; native-viewport screenshots and
external coordinator Brave QA are recorded in the UI guide. Full `pnpm test:identity`
/Docker runtime were not rerun for the presentation-only diff; the T06 logic PR owns
those checks and CI/Kody. No full T06/P05, real provider/staging/user, physical
touch, screen-reader, Safari or real 200% browser-zoom acceptance is claimed.
Full-ticket merge/review state remains in GitHub and the external delivery report.

## T35.0 principal/authorship foundations

The [focused guide](principal-foundations.md) records exact scope, service trust
boundaries, migration/backfill, acceptance and limits. PostgreSQL checks enforce
human User linkage/uniqueness, immutable identity, workspace-bound member/viewer
agents, retained historical references and active human owner/admin custodians.
Minimal workspace/membership storage is prerequisite substrate, not full T05.
An additive migration backfills existing users and atomically maps new users;
prior SQL remains byte-identical. A reserved System identity has no login or
ordinary assignment. Internal immutable policy grants distinguish own-human
delegation and autonomous subjects without implementing credentials.

The read-only context endpoint verifies actual Better Auth sessions and current
membership. Internal opaque contexts revalidate under the same SQL fence as
policy mutations and session revocation. Custodian departure requires explicit
transfer or suspension; creator/author attribution remains independent from
nullable assignee. This is a foundation helper, not actual task/comment/history/
export persistence. T06 project access, immutable domain authorship and atomic
activity/outbox integration, plus T12 credential verification, remain incomplete.

Local Node 24.22.1/pnpm 12.15.0 evidence: frozen install and final-source
`pnpm check` pass (lint, 286-package Express-free backend closure, process cleanup,
seven identity logic/client, 19 prototype and 17 MCP checks, strict types/builds
and production HTTP smoke). `pnpm test:identity` passes 12 principal checks and
all original 23 identity checks on real PostgreSQL 18.6; provider HTTP is simulated.
Existing-user backfill and repeated deploy, direct SQL negative constraints,
same-workspace delegated equality, viewer scope ceiling after promotion,
two-workspace/forged context rejection, assignment independence, expiry/revocation
and issuer/custodian independence are covered. Direct SQL races observe actual
blocking at READ COMMITTED/REPEATABLE READ/SERIALIZABLE and recover after rollback
and explicit transfer. A service mutation waits behind session revocation then
denies without writing. The disposable database was removed.

Complete Docker regression passes for the additive migration packaging/checksum
gate, delayed DDL, readiness/DB recovery, durable diagnostic job/restart, lock and
signal cleanup, nonroot image exclusions and deployed-store Express absence.
The final-source Docker rerun also passes and removes its owned containers,
networks, volume and image tags. Audit reports no known vulnerabilities.
Handoff/link and whitespace checks pass;
no dependency or source-handoff change was included. Final reviewed head,
CI/Kody approval, merge and coordinator cleanup are recorded in the table above.

The singleton policy/session write fence and deferred table scans deliberately
favor correctness for this small substrate; pure context reads use compatible
shared locks. No scale/performance claim is made.
User deletion/terminal revocation retention policy, project policy, full T35,
T05/T06/T12, RLS/least-privilege deployment roles and real provider/HTTPS/staging/
real-project/user acceptance remain open. No UI, main-checkout file, credentials,
staging or production deployment is touched.

PR #12's first Kody round found valid [permanent-error classification](https://github.com/Ljrr3045/rielia/pull/12#discussion_r4404439258)
and [exclusive context-read locking](https://github.com/Ljrr3045/rielia/pull/12#discussion_r4404439735)
issues. Both added regressions fail pre-fix and pass with generic 400/409 mapping,
explicit terminal-state conflict and shared read fences. Real Prisma/PG constraints
are covered alongside an actual HTTP unavailable-storage 503 and observed
read/write synchronization; original revocation/concurrent-write tests remain
passing. Initial reviews bind `25b91add`. Final reviewed head `6c841a334987a51977af41d4fe19e0a151e1394e`
passed CI/Kody above; both findings were fixed before PR #12 merged.

## T02.0 technical fixture

T02.0 (Orca task `task_cfe35a018420`) adds an executable Next/Nest/pnpm fixture
after the coordinator's explicit T00-merged authorization. It includes a bilingual
development page, live/API-down status, Nest liveness endpoint, shared public
health contract, strict TypeScript, lint/build/typecheck/HTTP smoke, and CI with
handoff integrity plus dependency advisory checks. The root/three workspace
packages contain only used tooling/dependencies. See the
[fixture guide](technical-fixture.md) for exact versions, primary research,
commands, boundaries, and detailed evidence.

The original PR #2 used Node 24.22.1 LTS, pnpm 12.15.0, Next 16.4.3/React 19.3.1,
Nest 12.2.0 with Express 5.3.0, TypeScript 6.0.3, and ESLint 10.13.0. Its scoped
Multer 2.5.0 override addressed the Nest adapter's affected 2.4.0 pin
([GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m)).
Audit subsequently reported no known vulnerabilities. Source handoff and inventory
baselines are preserved; the retired OpenCode workflow is not restored.
The current backend instead uses NodeAdapter 12.3.2; the migration guide records
the supported minor update and removal of that obsolete Multer override.

This was not full T02/T03/T04 completion or complete stack ratification. At T02.0 no
DB/schema, identity, OAuth, worker/queue, MCP, sprint, deployment, or product
functionality was implemented. At that delivery, license, complete stack, and
OAuth user answers were pending; the 2026-10-27 decision above supersedes the
stack-confirmation status. UI DOM checks are bounded: screenshots and native Tab traversal
were unreliable in the background Orca browser and remain unverified, not passed.

## Dependency-based first wave

T00, T02.0, T02.1 and T02.2 are accepted/merged. The user resumed development on
2026-10-25 with the bounded T01/B0 fictional prototype, keeping logic/presentation
ownership separate. The coordinator can
assign/continue bounded local work under the 2026-10-27 sequencing override;
the following records preserve the original first-wave scope and acceptance:

1. **T01 / B0, UX prototype:** no ticket prerequisite. Real project/backlog selection
   and review of the five mobile/desktop journeys/friction are OPEN/DEFERRED. The authorized
   fictional slice has merged logic/context (PRs #5/#7) and presentation (PR #6);
   its demo journeys are not real-project or real-person evidence. Use
   P/US and UXR/UX criteria; this is prototype validation, not a complete app or
   landing design.
2. **T02 / B0, identity/proxy spike:** no source ticket prerequisite. Stack approval
   excludes Express; the current NodeAdapter migration fulfills that technical follow-up. Later
   record real Google/GitHub, private-email, session, expiry/logout, and HTTPS/proxy evidence.
   An offline/mocked result cannot complete its real OAuth acceptance; those real
   checks are OPEN/DEFERRED, not immediate local implementation blockers.
3. **T03 / B0, local MCP portion:** coordinator originally authorized the reversible
   T03.0 diagnostic-only stdio split before user stack approval. The
   [local MCP guide](local-mcp.md) records bounded public
   liveness, exact versions, real terminal-client and negative/lifecycle evidence.
   Staging-dependent remote discovery/auth evidence is deferred with real T02;
   this split completes no full T03.
4. **T04.0 / B0, local runtime preparation:** coordinator explicitly authorized
   reproducible local images/Compose, the existing identity migration, and one
   durable diagnostic worker/job while real T02/T03 and stack confirmation were
   open. PR #9 is merged; see [runtime scope and evidence](local-runtime.md). This is a preparatory
   split of the B1 T04 ticket, without business effects, deployment or full acceptance.

Current bounded product step: **T10.1** My tasks/search presentation on the merged
T10.0 logic. T10.0 is merged in
[PR #23](https://github.com/Ljrr3045/rielia/pull/23) at `6bde444c`; the T10.1
presentation candidate `c1a2a1d` is in independent functional/responsive
validation with its PR pending. The bounded slice covers workspace-authorized
ID/title search, current-assignee My tasks, existing filters, SSE status feedback
and context-preserving detail/recovery presentation. Invitations/guests, full
T06/T07/T08/T09/T10/T35, labels/sprints, exports, coediting, MCP/history
integration, real-user/staging and deployment remain incomplete.

Convergence: T02 + T03 → T04 → **T35** → T05 → T06. The principal/authorship model
must precede workspaces/tasks/credentials despite T35's number. T01 supplies UI
evidence; the source B0 exit still requires the reviewed prototype and technical vertical.
The dated user override permits local implementation while the listed real
environment/user checks remain deferred; it does not mark this convergence complete.
T02.0 is separately authorized supporting scope, not T00 expansion. Full source acceptance remains in
[Architecture §7.3](../handoff/02-architecture-technical-plan.en.md#73-execution-ready-engineering-backlog).

## Ticket ledger

`Not started` means no full-ticket implementation or acceptance evidence is
recorded here. T02.0's fixture does not satisfy the full identity spike.
Dependencies below reproduce the plan, not inferred completion. B labels
are internal sequencing; T30–T34 form a separate future marketing track. T35 is a
foundational prerequisite within the B1 track, not the final ticket to execute.

| Ticket | Internal batch/track | Planned outcome | Dependencies | State |
| --- | --- | --- | --- | --- |
| T00 | Pre-B0 governance | Import, instructions, contribution/review process, ledger, Kody adoption/OpenCode removal | None | Complete, merged PR #1; final-head Kody success/approval |
| T02.0 | B0 supporting scope | Runnable Next/Nest fixture and partial T04 tooling | T00 merge gate | Complete bounded scope; merged PR #2 with Kody approval and passing CI |
| T02.1 | B0 experiment | Backend identity, minimal auth persistence, web protocol/state logic | Coordinator experimental gate; does not ratify full stack | Merged in PR #3; see [identity evidence](identity-spike.md) |
| T02.2 | B0 presentation | Experimental identity page consuming T02.1 hook | T02.1 merge; UI/UX ownership | Merged PR #4 with exact-head Kody approval and passing CI; see [identity presentation](identity-ui.md); real-provider/HTTPS and documented browser limits remain |
| T03.0 | B0 experiment | Runnable diagnostic-only local MCP stdio wrapper | Coordinator's original provisional-stack experimental authorization | Merged PR #8 at `cb92d90` after final-head CI/Kody approval; [guide](local-mcp.md), without closing T03 |
| T04.0 | B0 preparation | Local images/Compose, migration gate and durable diagnostic job/worker | Coordinator's original reversible provisional-stack authorization despite pending full T02/T03 | Merged [PR #9](https://github.com/Ljrr3045/rielia/pull/9) at `7477994`, final-head CI/Kody passed; [guide](local-runtime.md); no full T04 acceptance |
| T01 | B0 | Navigation and task prototype validation | None | Bounded fictional frontend logic/context/presentation merged in PRs #5/#7/#6; [logic contract](task-prototype.md) and [presentation evidence](task-prototype-ui.md) record states, demo journeys, checks and limits. Full ticket and real-person validation remain incomplete |
| T02 | B0 | Identity/proxy integration spike | None | T02.1/T02.2 merged partial evidence; current NodeAdapter migration preserves local parity; real provider/staging acceptance OPEN/DEFERRED under user sequencing |
| T03 | B0 | MCP SDK/wrapper/minimal remote profile spike | T02 for remote auth | Partial T03.0 local public liveness only; staging-dependent discovery/auth OPEN/DEFERRED; product catalog/credentials and full acceptance remain open |
| T04 | B1 foundations | Monorepo, images, worker/queue, initial migration | T02–T03 | Partial T04.0 merged; full acceptance/dependencies stay open. Dated user override permits local implementation with listed real validation deferred |
| T05 | B1a | Auth, workspaces, principal memberships | T04, T35 | T05.0 logic merged in PR #13; T05.1 [presentation](workspace-ui.md) merged in PR #14. Full T05/T07/T35 acceptance remains open |
| T06 | B1a | Projects/tasks, versions, idempotency, atomic activity/outbox | T05 | Bounded T06.0 real backend/client logic merged in [PR #15](https://github.com/Ljrr3045/rielia/pull/15); T06.1 [presentation](project-task-ui.md) delivered in the UI PR against disposable real PG/Nest/Next QA. Full ticket (all version/activity/outbox slices, collaboration) remains open |
| T07 | B1b | Invitations, revocation, roles/private projects | T06 | Invitation/role subset remains in T05.0; bounded [T07.0 privacy/access logic](project-access.md) merged in PR #17 and [T07.1 presentation](project-access-ui.md) delivered in the UI PR. Full T07 acceptance remains open |
| T08 | B1b | List/Kanban, filters, ranking | T06 | [T08.0 logic](task-views.md) merged in PR #19 at `f8895709`; [T08.1 presentation](task-views-ui.md) in [PR #20](https://github.com/Ljrr3045/rielia/pull/20). Configurable workflows/labels/sprints and full US05/T08 remain open |
| T09 | B1b | Subtasks, checklists, comments, history | T06 | T09.0 bounded collaboration logic merged in [PR #21](https://github.com/Ljrr3045/rielia/pull/21) at `76d7d31b`; T09.1 [presentation](task-collaboration-ui.md) delivered in [PR #22](https://github.com/Ljrr3045/rielia/pull/22) with standard checks and targeted functional/responsive QA passed. Exact current-head CI/Kody/merge evidence remains in GitHub/external final report. Full T09/P05/P14/P38, credentials and real-user/staging acceptance remain open |
| T10 | B1b | Search, My tasks, responsive layout, SSE | T07–T09 | T10.0 bounded logic merged in [PR #23](https://github.com/Ljrr3045/rielia/pull/23) at `6bde444c`; T10.1 [presentation](task-discovery-ui.md) combined candidate `29601ac` includes exact root-reviewed SOL controller/test URL corrections and is in final functional validation, PR pending. Full T10/P11/US05, labels/sprints, exports, coediting, credentials, real-user/staging and deployment remain open |
| T11 | B1c | Sprint lifecycle and scope history | T08–T09 | Not started |
| T12 | B1c | Personal/service credentials, explicit-subject grants | T07, T35 | Not started |
| T13 | B1c | Local MCP catalog/client/guide | T03, T11–T12 | Not started |
| T14 | B1d | JSON/CSV export and archive recovery | T09, T12 | Not started |
| T15 | B1d | Private deployment, backups, runbook | T04, T13–T14 | Not started |
| T16 | B1d | Two real work cycles, contribution readiness | T10–T15 | Not started; T00 docs do not complete it |
| T17 | B2a | RLS, quotas, registration hardening | T16 | Not started |
| T18 | B2a | Private attachments/storage driver | T17 | Not started |
| T19 | B2a | Inbox/mentions/SMTP via durable outbox/worker | T09, T15, T17 | Not started |
| T20 | B2b | Remote OAuth MCP and reviewable ChangeSets | T03, T12–T13, T17 | Not started |
| T21 | B2b | Saved views, table/calendar, guest, batches | T17, T19 | Not started |
| T22 | B2b | Dependencies and sprint reports | T11, T17 | Not started |
| T23 | B2b | CSV/JSON import, dry run/deduplication | T14, T19 | Not started |
| T24 | B2b launch readiness | Single-launch operations/accessibility/compatibility verification | T18–T23, T35; T34 for marketing | Not started |
| T25 | B3 | Epics, milestones, roadmap | T24 and actual demand | Not started |
| T26 | B3 | Typed fields and templates | T24 and actual demand | Not started |
| T27 | B3 | Automation and recurrence | T19, T26 | Not started |
| T28 | B3 | GitHub and outgoing webhooks | T19, T24 | Not started |
| T29 | B3 | Time/workload/docs/specific importers; split by capability | T24 and actual-use evidence | Not started |
| T30 | Marketing (future) | Integrate selected brand assets/tokens | T04; kit and identity review | Not started |
| T31 | Marketing (future) | ES/EN landing with stable CTA | T30 | Not started; implementation outside T00 |
| T32 | Marketing (optional capture) | Confirmed leads/backend/worker/SMTP | T04, T31 | Not started; no waitlist/access staging |
| T33 | Marketing (future) | Metadata, localized SEO, minimal measurement | T31; T32 if capture active | Not started |
| T34 | Marketing launch gate | Verify/enable public marketing launch | T31, T33; T32 if capture active | Not started |
| T35 | B1 foundations | Principal model, immutable authorship, autonomous memberships | T04; precedes T05/T06/T12 | T35.0 bounded storage/policy/context implemented; full authorship/domain/export/credential integration incomplete |

Public release is one launch followed by continuous updates. Internal B1 readiness,
private T15 deployment, and marketing T34 do not substitute for T24. B3 follows
actual use/demand; no launch date or public capacity has been established.

## Decisions and blockers

| Item | Current status | Owner / next evidence |
| --- | --- | --- |
| License | Pending user answer; Apache-2.0 remains a proposal; no LICENSE adopted | User/maintainer records selection and notice/dependency review |
| Stack | User approved current stack except Express, 2026-10-27 | [Dated decision](stack-validation-decisions.md); no automatic ratification of future dependencies/ADRs |
| Express removal | Merged PR #11 with coherent Nest NodeAdapter 12.3.2 and exact-head CI/Kody | [Adapter rationale, source/integrity, security and closure evidence](nest-http-adapter.md); T35.0 preserves runtime/deployed backend closure |
| Real validation sequencing | OPEN/DEFERRED until advanced end-to-end product slice and user scheduling; no immediate blocker to authorized local implementation | Retain staging/provider/HTTPS, staging-dependent discovery and real-project/user backlog; automated checks/CI/Kody and public-launch gates still apply |
| Local MCP split | Coordinator originally authorized T03.0 public health-only stdio before stack approval | [Versions, actual terminal-client matrix and limits](local-mcp.md); no remote OAuth/credential/domain acceptance |
| Branch names | User requires `feat/**`, `fix/**`, `refactor/**`, `docs/**`, `chore/**`, `test/**` by purpose, never username prefixes | Worktree names correspond; coordinator renamed the empty Orca-created branch before development and verified `feat/t03-local-mcp` |
| OAuth credentials/callbacks | OPEN/DEFERRED with real provider validation; no request for credentials/staging now | Installation operator configures secrets when user schedules later acceptance; no test date invented |
| Name/logo and identity | Rielia working name and v0.1 kit remain proposals, not final approval | User/brand review; availability not recertified by import |
| Landing | Current request is design planning for later development; no final design approved | Separate authorized design/implementation scope; use document 05 |
| Launch | One public launch, continuous updates; no access calendar/waitlist | Maintainer verifies T24 and applicable T34 checks before public access |
| Principal/authorship | T35.0 implements bounded identity/membership/policy and server-derived context; delegated user and autonomous Agent remain distinct | [Scope and local evidence](principal-foundations.md); actual task/comment/export and verified credential adapters remain future work |
| Private-project admin visibility | Ratified 2026-10-29: active human workspace owners/admins automatically read every scoped private project; delegated content keeps grant ceilings and privacy administration remains human web only | [Decision and bounded T07 contract](project-access.md); presentation must disclose automatic administrative access |
| Operations/public service | VPS capacity, budget/date, registration policy, public obligations not established | Maintainer records decisions and measured readiness in later tickets |
| Automated review | Kody AI replaces OpenCode; every ready PR/head needs an explicit root `@kody start-review` request | Coordinator alone posts trigger; worker verifies reviewed head, issue comments, formal reviews, inline comments, and applicable checks |
| Development models | User's 2026-10-25 rule: UI/UX presentation uses OpenCode Go DeepSeek V4.1 Flash 1017 (`opencode-go/deepseek-v4.1-flash`, `max`); all logic uses Codex `gpt-6.1-sol` `xhigh`, including browser auth/data/hooks/proxy/tests | [Model evidence and limits](frontend-agent.md); verify effective sessions and isolated worktrees. User resumed bounded T01/B0 development after the model-only pause checkpoint; OpenCode development does not restore its retired review workflow |
| Completed worktree cleanup | User explicitly requested removal after PR merge and finished delivery, without recurring confirmation | Coordinator verifies merged PR, clean tree, and preserved evidence, safely stops/settles task resources, then removes via Orca; workers never delete active/coordinator checkouts |
| Retired reviewer | User explicitly requested full OpenCode workflow deletion, including the inherited version; no further repairs/runs or secret changes | Deletion merged in PR #1; keep it absent and preserve the historical handoff |

Remaining product decisions did not block T00; current stack approval is bounded
by the Express exclusion and does not resolve license/brand/admin policy.
Record coordinator answers here without changing the historical source proposals.
No credentials should be pasted into this ledger, PR comments, or validation logs.

## 2026-10-27 NodeAdapter migration

The official NodeAdapter replaces Express in the real bootstrap and shared test
factory; controllers/modules/providers, Better Auth's raw Node handler, explicit
JSON/nested-form parsers, normalized callback/origin boundary and derived IP/header
sanitization remain. Session cookies, refresh/logout/revocation/expiry, linking
safeguards, disabled identity, liveness/readiness and shutdown contracts remain.
Three new security cases extend the real-library/PostgreSQL suite to 23 tests.
Prototype-key form rejection is stricter (400), with valid forms preserved.

The first install retained a stale optional Express peer; fresh manifest-only
resolution removed it without altering package metadata. Unrelated compatible
baseline-browser-mapping, ignore and undici-types locked versions are preserved.
New Nest common legitimately uses file-type 22.2.0/inflate 0.5.2. Strict peers and
disabled automatic peers remain; installed and full deployed-store guards cover
API/worker and migration images. The adapter itself pins Multer 2.5.0, so its
obsolete predecessor's override is removed. Advisory review identified its qs
6.16.0 pin; a scoped 6.16.1 override preserves the prior patched floor.

Coherent Nest 12.3.2 pins and exact automatic release-age exclusions are narrowly
accepted by the coordinator after published source/integrity/parity inspection;
the first NodeAdapter release was on the same day. [Rationale and maturity limits](nest-http-adapter.md)
remain explicit. No manual package pruning, relaxed strict types, new framework,
provider credential or staging request is introduced.

Corrected-lock frozen install, `pnpm check` (lint, installed closure guard,
one process-cleanup regression, seven identity logic/client tests, 19 prototype
tests, strict checks/builds, 17 MCP checks and real HTTP smoke), and all 23
PostgreSQL/real-library identity tests pass. Identity migrations were deployed
twice; the disposable database was removed. Advisory review reports no known
vulnerabilities. Handoff verification passed 47 unchanged imported files, 30
matching assets and 363 local file links across 44 documents at this checkpoint;
whitespace passes. Corrected-lock `pnpm test:runtime` also passes: actual graph
and complete deployed-store scans contain no Express in API/worker or migration;
nonroot runtime files/exclusions, failed/repeated/slow-DDL migration, readiness
versus liveness/DB recovery, bounded lock/startup signal cleanup and durable-job
retention/consumption/graceful restart all pass. ARM64 uncompressed image sizes
were 1,265,513,560 bytes API/worker, 1,294,915,499 migration and 421,924,768 web.
All owned containers, networks, volume and image tags were removed and absence
verified; shared base images/cache remain. No task-local servers remain.
CI/current-head Kody evidence is recorded in the PR before delivery. Initial
parser-test expectation correction and pre-qs-override Docker success are interim
evidence, not final corrected-lock proof.

## Historical PR #10 documentation validation (2026-10-27)

- `python3 scripts/verify-handoff.py`: PASS, all 47 imported files and 30 asset
  hashes/sizes unchanged; 347 local file links checked across 43 documents.
- `git diff --check` and `git diff --cached --check`: PASS. The PR diff is limited
  to ten documentation files; protected paths are unchanged. Remote CI/review evidence belongs in
  PR #10, without self-referential commit updates here.
- Read actual backend manifests/bootstrap/auth setup and the official Nest
  HTTP-adapter guide for the inventory and unselected-adapter follow-up. Fresh
  GitHub reads confirm PR #9 merge, exact-head approval and passing CI above.
- Documentation only: no unrelated local application suites rerun, no runtime/
  dependency/test/workflow edits, no provider credentials or staging requested.
  Existing CI and current-head coordinator-triggered Kody remain required.

## T00 validation and merged PR evidence

- Import: 47 files and four subdirectories copied; 2,435,020 bytes. Source-relative
  names/hashes captured before copy; source and destination rechecked immediately
  after copy. See [import record](handoff-import.md) and [inventory](handoff-files.sha256).
- `python3 scripts/verify-handoff.py --source <original-directory>`: passed,
  including direct byte/directory comparison, all 47 inventory entries, 30 asset
  manifest hashes/sizes, and 272 local file links across 34 documents.
- Verifier portability/rejection checks in a disposable copy: passed from an
  unrelated working directory; altered asset, extra imported file, and broken
  local link correctly rejected. The original source was untouched.
- `git diff --check` and `git diff --cached --check`: passed at the import checkpoint.
  High-confidence credential-pattern scan
  found no matches; this is a bounded scan, not a comprehensive security audit.
- Coordinator independently reported the same direct-source/hash/asset/link
  results and no blocking documentation findings at the pre-PR checkpoint.
- Historical OpenCode runs failed before a completed review: [40140474241](https://github.com/Ljrr3045/rielia/actions/runs/40140474241)
  had invalid model configuration; [40140743384 attempt 2](https://github.com/Ljrr3045/rielia/actions/runs/40140743384/attempts/2)
  reached GitHub reaction/comment 403s after an earlier version-fetch failure.
  Coordinator-authorized configuration/permission repairs were locally validated,
  but are superseded by the user's retirement/removal decision.
- On head `fbc969eea29db86292340b4f09fb098932fb409e`, [run 40140951885](https://github.com/Ljrr3045/rielia/actions/runs/40140951885)
  posted a bot reaction, then waited on an unattended external-directory permission
  prompt. The coordinator cancelled it when the user paused work to replace the
  reviewer; it produced no completed review. That cancellation is historical
  evidence, not a clean review or a current OpenCode gate.
- Kody's [prior-head review 5640595445](https://github.com/Ljrr3045/rielia/pull/1#pullrequestreview-5640595445)
  covered `fbc969eea29db86292340b4f09fb098932fb409e`. Its [inline finding](https://github.com/Ljrr3045/rielia/pull/1#discussion_r4368936447)
  correctly identified mutable third-party action execution with a write-scoped
  token. The user-directed full workflow deletion removes that executable path;
  pinning a retired action is unnecessary. A substantive thread reply follows the
  pushed deletion. This prior-head review does not approve the replacement head.
- After reviewer replacement, direct-source/inventory comparison (47 files),
  manifest checks (30 assets), and local file links (272 across 34 documents) pass
  again. Worktree and staged whitespace checks pass; the retired workflow is
  absent. The final [Kody approval](https://github.com/Ljrr3045/rielia/pull/1#pullrequestreview-5640660780)
  applies to head `53243fbea2ae6c4f5a1ab3e47d6e1dc8cc296cec`, with `Kody Code Review`
  SUCCESS on the same head. PR #1 is merged as
  `8dd7c31f454c1989d017dbf7b40e6646112d2d2a`.
- [Non-draft PR #1 to dev](https://github.com/Ljrr3045/rielia/pull/1) is the single
  T00 PR. Its review evidence section records the final head/Kody round and inspection of
  issue comments, submitted reviews, inline comments, and technical dispositions
  before worker handoff. Check current PR evidence; this file does not assert
  successful review merely because a PR exists.
- At T00, application, OAuth, runtime, UI, database, recovery, load, accessibility,
  and deployment tests were not run; T00 contained no application. No remote URL/heading
  fragment validation or fresh stack/brand research claimed.

## T02.0 validation and PR evidence

- Clean temporary copy without `node_modules`, `dist`, or `.next`:
  `pnpm install --frozen-lockfile` and complete `pnpm check` passed with
  Node 24.22.1 / pnpm 12.15.0. The latter covers lint, strict typechecks,
  contracts/API/web production builds, and actual production HTTP smoke.
- Smoke confirms exact API health JSON, content type/no-store, no task route,
  bilingual web HTML, live API status, and API-down fallback. Temporary API/web
  processes are stopped in cleanup; the separate visual-check server and browser
  tab were also stopped/closed. No existing developer server is used or killed.
- `pnpm audit --audit-level=high` reported no known vulnerabilities after the
  scoped Multer patch. This is dated registry evidence, not a security guarantee.
- DOM checks: one main region; no horizontal overflow at 320/375/768/1440 and
  812×375 CSS px, or 375 px with 200% root text; button height ≥50 px. Computed
  light palette matched intended background. Screenshot stitching/theme capture
  and native Tab traversal were unreliable; no full visual/keyboard/AA acceptance
  is claimed. See the fixture guide for exact limitations.
- Post-T00 integration adds `python3 scripts/verify-handoff.py` to CI and updates
  active docs without modifying the import/inventory. Post-integration `pnpm check`,
  `pnpm audit --audit-level=high`, `python3 scripts/verify-handoff.py`, and
  `git diff --check` passed. The verifier reports 47 unchanged imported files,
  30 matching assets, and 278 local file links across 35 documents. The fixture
  [non-draft PR #2](https://github.com/Ljrr3045/rielia/pull/2) records current-head
  CI/Kody request, outcome, and any findings/dispositions before coordinator acceptance.
- Real OAuth/provider/proxy/session flows, MCP clients/discovery, DB/migration,
  worker/queue persistence/restart, Docker/deployment, load, and full accessibility
  acceptance: not run/not implemented. Full T02/T03/T04 remain unverified.
- Kody's [CI action pin finding](https://github.com/Ljrr3045/rielia/pull/2#discussion_r4369146492)
  and [failed-spawn cleanup finding](https://github.com/Ljrr3045/rielia/pull/2#discussion_r4369146777)
  were accepted. Actions now use full verified upstream commit SHAs. Smoke lifecycle
  helpers guard missing PID before signal/wait setup; a focused built-in Node
  regression failed on same-tick shutdown before the asynchronous spawn error and
  passes after the guard, preserving `ENOENT` and stopping the live sibling.
  This is defensive cleanup hardening, not a claimed production startup failure.
  A changed head requires fresh CI and the coordinator's new Kody request.

The PR's checks/comments supply current-head evidence without a self-referential
commit hash in this file. After a pushed fix, this record's prior review evidence
does not imply approval of the new head; wait for the coordinator-requested Kody
round for that head. Workers do not post duplicate trigger comments.

## T02.1 scope and validation

The coordinator originally approved a reversible experiment while user stack/OAuth
answers were pending. The dated decision above supersedes that stack status.
[Identity research/operator/evidence](identity-spike.md) records
the exact pins, supported Node-handler mounting (originally Nest/Express), identity-only migration, DB-backed
session/cookie/origin/proxy behavior, Google verifier hook, browser state logic,
and declaration-only compatibility patch. No domain principal, role, workspace,
task, MCP catalog, deployment, license, or full T04 acceptance is included.

Local real-library/PostgreSQL tests pass, including repeated migration deployment,
simulated Google and GitHub responses, private-email handling, no implicit linking,
session persistence/restart/refresh/logout/revocation/expiry, failed DB lookup,
malicious return URLs/origins, forwarded-header spoofing, and disabled identity.
Browser logic/proxy tests pass, including stalled-request timeout and retry recovery.
Provider HTTP/JWKS responses are test fixtures; no production test login bypass exists.
Real Google/GitHub consent/private-email flows and deployed HTTPS/Traefik behavior
remain **unverified**, so full T02 is partial. T02.2 owns presentation and its
keyboard/touch/mobile/accessibility checks. A fresh copy without dependencies,
build output or generated code passed frozen install and complete `pnpm check`,
including the declaration patch, strict checks and actual Next proxy smoke.
The source checkout passed 20 real-library/DB tests and seven browser logic/client
tests. Final audit reported no known vulnerabilities; handoff and whitespace
checks passed. CI and exact-head Kody evidence for
[PR #3](https://github.com/Ljrr3045/rielia/pull/3) were recorded in its review
surfaces before the coordinator merged it. A previous-head result never approves a
changed head.

PR #3's first Kody round exposed a valid raw-path normalization bypass in the
callback origin exemption. A raw Node HTTP regression failed with 200 instead of
403 before the fix; normalized exact callback matching and malformed-path rejection
now pass, with state-validated callback behavior preserved. The parser argument
suggestion was a false positive against the public Nest 12.2.0 application API;
core inserts the adapter's raw-body argument, and nested URL-encoded parsing passes.
See [technical dispositions](identity-spike.md#pr-3-findings-and-dispositions) and
the PR threads. The changed code head needs a fresh coordinator-triggered round.

## T02.2 presentation

The UI-only slice adds the experimental `/identity` page and its presentation
component on the merged T02.1 `useIdentity` contract. The component renders only
server-agreed state and calls hook actions; it adds no HTTP, session, or
validation logic and no dependency. Unconfigured providers are hidden, and
bilingual states cover loading, unavailable API, disabled identity, no providers,
signed-out, signed-in, pending sign-in/sign-out, and the typed sign-in/sign-out
messages. Keyboard focus moves to the section heading only after a user action
removes its control. Evidence, limits, and unverified checks are in
[identity presentation](identity-ui.md). Full T02/US01 acceptance remains open
pending real Google/GitHub consent, private-email flows, HTTPS/staging, and
the remaining documented browser/assistive checks. The bounded presentation was
merged as recorded above; this does not close real T02/US01 acceptance.

## T01/B0 prototype logic

The [typed prototype contract](task-prototype.md) records the fictional hierarchy,
18 seeded tasks, independent assignee/creator/provenance, shared selectors,
draft/create/edit/status/filter actions, planned sprint scope, one-active-sprint
guard, explicit unfinished-work destination and frozen done/canceled summary.
The adapter is isolated from identity, backend and public contracts, and keeps no
durable data. Reset invalidates in-flight saves and can restore seeded/empty data.
Deterministic pre-commit failure preserves drafts and the captured retry without
duplicate creation. A local stale task draft receives a version conflict.

`pnpm install --frozen-lockfile` passed. Thirteen action/invariant tests pass
through `pnpm test:prototype` and `pnpm check`; the full check also passes lint,
process cleanup, seven identity logic/client checks, strict types, production
builds and real production HTTP smoke. The existing `pnpm test:identity` suite
also passes 20 real-library/PostgreSQL tests with simulated provider HTTP; its
disposable database is removed afterwards. Audit reports no known vulnerabilities.
Handoff verification confirms all 47 imported files, 30 asset hashes/sizes and 311
local links; whitespace checks pass. No route, JSX, CSS, identity/backend logic,
credentials, DB or MCP change is included in the logic PR. Mobile/desktop,
keyboard/touch, screen-reader behavior and real-person journeys remain outside that
logic evidence and are handled separately by the presentation slice.

PR #5's malformed-collection and captured-retry findings were fixed with
actual-action regressions. The final reviewed head `55481ff` passed CI and Kody
approval [5641785181](https://github.com/Ljrr3045/rielia/pull/5#pullrequestreview-5641785181)
and was merged as `5099b39`; a prior-head result does not approve changed code.
No full T01/B0 or later ticket is completed by these tests.

The requested round then found a valid [captured-retry loss](https://github.com/Ljrr3045/rielia/pull/5#discussion_r4369810021)
after rejecting a malformed patch. A real failed task/sprint save followed by a
rejected patch and retry failed pre-fix. Rejected/no-op actions now retain the
unchanged draft and captured retry; current field feedback is independent of
`canRetry`. The contract tells presentation to label this "Retry previous save".
The regression verifies eventual single creation/scope update and that a valid
new edit clears the old retry. This fix is included in the merged final head.

## T01/B0 prototype presentation

The [presentation evidence](task-prototype-ui.md) records composition, states,
accessibility decisions, browser evidence, commands and limits for the responsive
`/prototype` route. It covers default My tasks, project list/board/sprints, detail,
minimal capture/edit, visible simulated save failure and draft-preserving retry,
closed-sprint retained/current versus frozen summary wording, and seeded/empty
reset. The UI imports the merged adapter/hook, `getSprintSummary`, and the typed
save/retry context; it adds no business rules, controller, API, identity,
persistence or functional tests.

The current presentation also consumes the PR #7 `save.context`/`retryContext`
contract: current feedback and captured retry are rendered independently by target,
close destination is restored only for a matching captured close retry, and global
current/retry outcomes are labelled with the task key or sprint name. This is the
presentation fix for PR #6's two Kody findings; the focused post-fix regressions
passed on local head `eddbd84` (RIE-12→RIE-15 foreign feedback/retry removed,
unrelated retry leaves close destination enabled, own close retry restores/uses
the captured destination and moves the expected unfinished tasks).

A later same-head round found that wide-desktop foreign feedback was hidden while a
detail remained open. The global strip now renders unmatched current/retry outcomes
with their target, while matching detail feedback stays only in the detail; the
recovery-only panel can appear when the current outcome is handled locally but the
captured retry is not. A third-round comment described the global strip as inert on
narrow. Analysis found no functional defect: the 69dd narrow modal contract never
claimed recovery behind the modal, and root's 390 check confirmed background inert,
close/back exposing the labelled RIE-12 retry, and own-task retry reachable inside
detail. The final head adds shared `backgroundInert` mount suppression as optional
structural cleanup (DOM mounting only), preserving the documented close/back
contract. Root's earlier 1920/390 evidence applies to the 69dd interaction; final
code-tree QA on 411ab8c separately confirmed desktop labelled global recovery,
narrow main inert with zero global retry DOM and no overflow, close/back restoring
the RIE-12 retry successfully, and own-detail status failure/retry remaining
reachable and succeeding. Final reviewed head `043c4507` subsequently passed
CI and Kody approval and merged as recorded above.

Local validation on the integrated branch: full `pnpm check` passes, including 19
prototype tests, strict types, production builds and HTTP smoke; `/prototype` is
statically generated. Handoff integrity, advisory audit and whitespace checks pass.
Independent coordinator Brave QA exercised all five demo journeys at 1440, 390,
320 and 768 px before the context follow-up, including failure/retry,
filtered-detail focus return, keyboard sidebar isolation, search recovery and
reset; its report is preserved outside the repository and summarized without
claiming real-person validation. The UI owner added light-theme 1440,
32 px-default-font (200% text) 1440/390, English, desktop drag, closed-sprint
retention and search-label checks. Orca viewport captures that tiled were
excluded. Safari, screen readers, real touch hardware, real 200% browser zoom
traversal and long-session persistence remain unverified, as do all product flows
outside the fictional adapter.

The presentation PR #6 merged after exact-head CI/Kody approval recorded above.
Its review surfaces preserve the coordinator trigger and technical dispositions.
Full T01/B0 remains open.

## T01/B0 save/retry context follow-up

PR #6 review found that failed task A feedback/retry could appear in task B's
detail, and an unrelated task retry could lock sprint closure destination. The
coordinator accepted an additive `SaveContext` contract: latest `save.context`
and independently captured `retryContext`, with task/sprint ID, status-operation
value and copied close destination as applicable. Navigation preserves the
original target; unbound validation has no target. Rejected/no-op actions preserve
captured recovery, accepted edits/new valid saves clear/replace it, and reset
invalidates pending context. See the [integration contract](task-prototype.md#feedback-and-retry-targets).

Six new actual-action tests bring the prototype suite to 19 passing tests. The
first five failed against the pre-fix adapter (13 old passed, five missing-context
failures); the sixth checks malformed runtime target/status/destination values.
No JSX/CSS, identity/backend, dependencies, production policy or source-handoff
changes are included. This prerequisite merged via PR #7 at
`bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f` after reviewed head `c90b437`,
Kody approval [5642060409](https://github.com/Ljrr3045/rielia/pull/7#pullrequestreview-5642060409)
and [CI 40172013213](https://github.com/Ljrr3045/rielia/actions/runs/40172013213).
Presentation consumes it; focused post-fix browser regressions passed on local
head `eddbd84`, followed by final-head validation and the PR #6 merge above.

Local checks pass on Node 24.22.1/pnpm 12.15.0: frozen install, 19 prototype
tests, full `pnpm check`, 20 existing PostgreSQL/real-library identity tests,
advisory audit (no known vulnerabilities), handoff integrity (47 files, 30 assets,
313 local links), and whitespace. The initial sandboxed identity loopback tests
were blocked by `EPERM`; the authorized full-check rerun passed. Identity removed
its disposable database and smoke servers exited. Exact-head CI and coordinator
Kody review on the presentation head subsequently passed; all three surfaces
were handled before its merged delivery.

## T03.0 local MCP transport

The [local MCP guide](local-mcp.md) records official SDK server/client/core 2.4.0,
Inspector 2.12.0 (its own SDK 2.3.1), Zod 4.6.7, operator setup and compatibility
limits. One strict argument-free `rielia_health` calls the fixed public Nest
`/api/v1/health`, validates/projects two literals and explicitly disclaims auth,
database health, product readiness and capabilities. The wrapper has no listening
socket, backend/database import, credential or task endpoint. Explicit numeric
loopback development HTTP is the only plaintext allowance; HTTPS retains normal
certificate validation. Bounded total deadline/body/header sizes, no redirects,
sanitized errors, EOF/signal/client cancellation and stdout discipline are covered.

Seventeen focused checks pass locally: real Nest through SDK child processes and
independent official Inspector CLI initialize/list/call, actual `2025-11-25` and
`2026-07-28`, invalid tool/arguments/config, malicious/malformed upstream data,
HTTP failure, oversized body, redirect, refusal, timeout, recovery and active
request shutdown. Self-signed HTTPS is rejected; no trusted remote HTTPS or remote
MCP/OAuth discovery was exercised. The coordinator independently reran all 12
successfully before the additional lifecycle regression. Initial sandbox-denied listeners and a corrected test cleanup-hook
ordering failure are not passing evidence. `pnpm check` includes this real client
suite after builds. Frozen install, full `pnpm check`, 20 existing real-library/
PostgreSQL identity tests with simulated provider HTTP and database cleanup,
audit (no known vulnerabilities), handoff integrity (47 files/30 assets/327 links)
and whitespace pass locally; current-head CI/Kody evidence is recorded in the PR
before delivery. No full ticket, real-user acceptance,
license or provider decision was closed by that delivery; current stack approval
is recorded separately above.

Kody's truncated-response timeout claim did not reproduce: real wrapper wire
probes return unavailable promptly for fixed-length/chunked FIN and mid-body
reset; an open stalled stream instead times out. A focused retained regression
guards that documented contract; the existing Node response error handler is
sufficient. See the [measured disposition](local-mcp.md#observed-evidence-and-limits)
and PR review surfaces. No speculative runtime handler or auth scope was added.

## T04.0 local runtime preparation

The coordinator authorized a reversible T04/B0 preparatory split while full T02
real-provider/HTTPS, T03 remote discovery and complete stack confirmation were
open. [Local runtime scope/operator/evidence](local-runtime.md) records exact
pins and commands for web/API/private PostgreSQL, a migration one-shot, and a
single fixed diagnostic pg-boss job. API and worker share a nonroot backend image;
the migration variant exposes Prisma CLI tooling. Worker starts without Nest HTTP,
has no listening socket, and cannot install or migrate queue storage. Production
identity remains disabled in the default local HTTP containers; existing HTTPS,
cookie, origin and provider requirements were not weakened. There is no domain
policy, principal, public enqueue, business effect, Redis, shared database
extraction, deployment or full T04/P34/product-story acceptance.

Local ARM64 Docker Engine 29.9.2 / Compose 5.6.1 validation passed:

- `pnpm test:runtime` built all three pinned image targets through frozen install
  and frozen production deployment. Actual nonroot uid 1000 execution verified
  runtime/generated Prisma/migration/static files and credential/Git/root-tool
  exclusions. Normalized tmpfs settings are asserted before build. A recorded passing run
  measured 1,280,859,801 bytes API/worker, 1,310,649,182 migration and 421,962,904
  web (uncompressed Docker sizes). Frozen optional peer bindings retain nested
  Prisma/Studio in API, plus TypeScript in the migration target; the target split
  is lifecycle separation, with no footprint-reduction claim or manual pruning.
- A worker on an unmigrated DB failed without creating queue schema. A migration
  using a nonexistent database role exited 1 and prevented API/worker startup.
  Repeated successful deploy preserved identity migration history; corrupted
  identity checksum and incompatible queue version returned readiness 503, and
  the worker rejected the queue version without migrating it.
- A real PostgreSQL table lock made diagnostic enqueue fail within its query
  deadline. SIGTERM during blocked worker startup waited for pending work,
  exited 0, and left no worker DB connections. A DB outage returned readiness
  503 while exact liveness stayed 200; API readiness recovered after DB restart.
  Skipped heartbeat ticks retain the actual pending promise so shutdown waits for
  that work before closing the shared pool.
- Enqueue while worker stopped stayed `created` across full Compose down/up with
  the same named volume. Starting the worker completed that UUID with only
  `{"diagnostic":"ok"}`; graceful stop/restart preserved the completed result.
  Worker/API image identity, read-only root, worker-owned TCP socket absence and
  successful shutdown were asserted. All owned containers, networks, volume and
  image tags were removed and their absence verified; shared bases/cache remain.
- Frozen host install, full `pnpm check` (strict checks/builds, 17 MCP checks,
  seven identity logic/client checks, 19 prototype tests and real HTTP smoke),
  the separate 20-test PostgreSQL/real-library identity suite with simulated
  provider HTTP, advisory audit (no known vulnerabilities), handoff verification
  (47 files, 30 assets, 338 local links) and whitespace passed. Identity removed
  its disposable DB and all test servers exited. CI also runs the Docker smoke
  without real provider credentials; current-head remote evidence belongs in
  the PR before final handoff.

Initial sandbox restrictions, pg-boss's published missing declaration (fixed by
a declaration-only pin-specific patch), missing slim OpenSSL, legacy deployment
peer errors, empty public-directory packaging, unquoted tmpfs mount parsing,
an unsuitable negative DB-name fixture and partition-lock harness detection
were corrected before the passing run. None of those failures are reported as
successful runtime evidence. The optional further footprint probe was cancelled
by the coordinator; supported frozen packaging and strict peers are retained.
Exact apt pins can fail when mirrors retire packages; the guide records this
rebuild/update boundary. [PR #9](https://github.com/Ljrr3045/rielia/pull/9) merged
with AMD64 CI [40565906228](https://github.com/Ljrr3045/rielia/actions/runs/40565906228)
and exact-final-head [Kody approval 5672890614](https://github.com/Ljrr3045/rielia/pull/9#pullrequestreview-5672890614)
on `0fcd6c4ea9b2aa05940b795c871d2d30ec3f4742`; all review-surface dispositions
are preserved there. The coordinator removed the completed worktree.

The initial automatic Kody round identified a valid [migration DDL timeout](https://github.com/Ljrr3045/rielia/pull/9#discussion_r4392869741):
reusing the two-second readiness budget can abort a slow pg-boss schema install.
A real PostgreSQL event-trigger delay of three seconds during only the one-shot's
`CREATE SCHEMA` reproduced startup failure before the fix. The one-shot now has
a separate 30-second client/server SQL budget, retaining two-second connection
acquisition and the 90-second whole-process limit. API/worker/diagnostic query
budgets remain two seconds. The same delayed-DDL regression and the complete
runtime smoke pass afterwards, including short locked-enqueue failure, startup
SIGTERM, persistence/consumption/restart and owned-resource cleanup. The helper
is removed immediately and exists only in the disposable test database, never in
runtime migrations. Lint/backend build passed; subsequent final-head CI and
coordinator-triggered Kody review passed as recorded above.
