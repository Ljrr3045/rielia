# T08.1/B1b task views presentation

Status: bounded presentation on the merged T08 persistent list/Kanban logic
([PR #19](https://github.com/Ljrr3045/rielia/pull/19), merge
`f8895709f881df18a4d2d4a33483dab5add0e51e`). It implements the existing-field
subset of P05/P08, supports P14/P33/P38 and US04/US05/US08/US12/US24–US25, and
uses UXR01/02/03/04/06 with UX01/02/03/05/06/07/09/11. It does not complete full
T08/US05, P07 configurable workflows, labels or sprint filters, T09/T10, B2
advanced views, real OAuth/staging/users or deployment.

The presentation is owned by the UI worker. All contracts, hooks, controllers,
proxies, backend behavior and functional-test source remain logic-owned. This
delivery consumes the merged `useProjectTasks` surface and adds no HTTP, task
store, sorting/filtering/ranking policy, URL parser, auth path or test harness.

## Scope and paths

| Area | Presentation delivered | Requirement |
| --- | --- | --- |
| View/filter bar | List/Board switch, status/assignee (including unassigned)/priority filters, active-filter count, clear, archive switch, authoritative summary | P08, US05, UX01/UX03 |
| List | Status-grouped rows, status quick move, precise before-task/end-of-column menu, compact capture, pager/changed states | P05/P08, US04/US05, UXR01/UXR03/UXR06 |
| Board | Five semantic columns, names/counts, cards, column capture, outer horizontal navigation, per-column vertical scroll/paging | P07 existing statuses/P08, US05, UXR01/UXR02/UXR04 |
| Movement | Drag-only enhancement, native status select, keyboard/touch menu, same-column end, persisted order, conflict recovery | P08, US05/US08/US12, UX03/UX05 |
| Detail/context | Same URL-addressable detail, list/board consistency, selected detail outside filters, Back/reload, focus return | P05/P14, US08/US12, UX01/UX03 |
| Mobile | Default list; board selected-column pattern at 320; compact project Options menu; visible capture/first task; no page overflow | P33, US08, UXR03, UX03/UX07 |
| Read-only | Viewer and archived task/project surfaces; explicit archived board URL; historical authorship/assignee labels | P14/P38, US24–US25, UX06/UX09/UX11 |

Key files:

- `apps/web/src/app/projects/projects-view.tsx` wires `taskView`, filters,
  layout/column, capture, move recovery, read-only/value guards, focus and
  announcements while preserving the T06/T07 shell.
- `task-view-bar.tsx` owns the compact view/filter/archive bar and the mobile
  filter disclosure. `task-list.tsx` owns the status-grouped list.
- `task-board.tsx` owns five columns, counts/paging/errors, column capture,
  outer horizontal navigation, bounded column scrolling and drag enhancement.
- `task-move.tsx` owns the compact status select and accessible
  before-task/end-of-column menu.
- `strings.ts` and `projects.module.css` own ES/EN copy and scoped responsive,
  theme and focus styles.

Canonical route: `/projects?workspace=W&project=P&task=T`, with `tasksView`,
`taskLayout`, `status`, `assignee`, `priority` and `column` as supplied and
validated by the hook. Defaults are list, empty filters and backlog. The UI does
not parse or write these selectors itself.

## Interaction and recovery

- `useProjectTasks` exposes content-only `draft`/`pending`/`retryTarget`,
  separate `moveDraft`/`movePending`/`moveRetryTarget` projections over the same
  lifecycle, and the existing policy projections. The UI composes guards from
  all three; no form overwrites another outstanding draft. `submit`,
  `retrySave`, `returnToDraft` and `discardDraft` remain shared.
- `taskSummary` controls the honest total/create state. A missing column page is
  loading/unavailable, never zero. Per-column errors remain independent of
  `taskColumnsChanged`; mixed/changed pages are readable but cannot stage
  moves or capture, and require Refresh. Counts are never computed from loaded
  rows; no global sum is shown across failed or mixed pages.
- `stageMove` is the only movement path. A status select moves to the end of the
  full target column; the compact menu offers precise `Before <task>` anchors
  and explicit end-of-full-column. `beforeTaskId=null` is never described as the
  end of a loaded/filtered page. Same-status end is allowed and persists.
- A named anchor is used only from the loaded matching page. Board columns are
  272 px wide with vertical scrolling; only the outer board scrolls horizontally.
  The board frame is a labelled keyboard region: focus it and use
  ArrowLeft/ArrowRight/Home/End. A short hint makes the outer navigation
  discoverable.
- Move conflict is a fresh-destination decision. The panel shows the requested
  semantic status and neutral former placement, plus the authorized current
  task; it offers Discard and Refresh, never a version-only rebase. After
  discard/Refresh, the user chooses a destination again. Unknown outcomes offer
  the same-key Retry or explicit Discard; Return restores an off-context move.
- Selected detail survives filters and is never inserted into a filtered list or
  board. Closing returns to the exact visible opener, then the group/column
  heading or view bar. Focus after a move/create is retried after the canonical
  follow-up read; success is not claimed before the response.
- Mobile project administration is collapsed into an accessible `Options`
  disclosure containing Access/settings/archive. The disclosure is 44 px,
  keyboard operable, closes on Escape and returns focus to its summary. The
  task view bar remains in normal flow; only one board column is shown, with a
  native column selector and count.
- Archived viewer/project surfaces keep a read-only list or board; explicit
  `taskLayout=board` URLs are honored. Capture, status selects, move menus,
  drag and edit controls are absent. Historical creator/assignee/Agent labels
  remain textual.

## Accessibility and responsive decisions

- Native buttons, links, selects, inputs and details/summary; 44 px targets,
  visible focus, 16 px mobile inputs, no color-only status/priority, reduced
  motion, and textual Agent/inactive/archived states.
- Board frame is focusable with a region label and explicit keyboard horizontal
  navigation. Column menus open by keyboard (Enter/Space) and close on Escape
  with focus returned to the summary. No menu is clipped horizontally by a
  column scroll container.
- Board columns are 272 px wide; cards contain the localized status/priority
  and Move controls without inner horizontal scrolling. Column content scrolls
  vertically inside a bounded board height; the page itself does not grow with
  a 100-card backlog.
- At 320 px the project description/breadcrumb are suppressed, the three admin
  actions become `Options`, the view bar uses a short archive label, and the
  first column heading (board) or visible capture (list) appears in the initial
  740 px viewport. Tested widths: 320, 375, 390, 768, 1024, 1440; ES/EN;
  light/dark; long titles, unassigned/Agent assignees, 0/1/100/205+ data and
  paged columns.
- Localized subtree `lang` changes with the ES/EN selector; the existing page
  shell is preserved. The browser document language may remain the shell value.

## Validation evidence

Integrated local QA used the T08 test-only fixture on real PostgreSQL, Nest,
Better Auth and Next (`project-task-qa.mjs --task-views`), with fictional signed
sessions and no product auth bypass. Screenshots, CDP scripts and private state
remain outside the repository; no cookies or secrets are committed.

Observed presentation evidence:

- Board/list same task set; five columns with authoritative counts; 100-item
  pages with Load more; status-grouped list.
- Desktop 1440: 272 px columns, outer scroll 319 px, canceled column reachable
  via keyboard End; no inner column/card horizontal overflow; page height about
  1055 px with a 100-card backlog.
- Desktop 1024: outer scroll 724 px, keyboard End/Home; canceled column fully
  reachable; page height about 970 px; column cards scroll vertically.
- Mobile 320: default list; board selected-column pattern; no page overflow;
  first column heading at about 677 px and list capture at about 641 px in the
  initial viewport; Options menu items and Escape/focus verified.
- Same-column end persisted in board and status-filtered list. Unknown outcome
  kept navigation enabled; Return to the pending move and same-key Retry
  persisted one move. Filtered-board movement removed the card from the visible
  status and reached the hidden destination. Move conflict offered Discard and
  Refresh (no ordinary rebase) and resolved through a fresh destination.
- Column capture created in the target status, focused the new card after the
  canonical follow-up read, and survived reload. Archived board and viewer
  surfaces were read-only. Long ES status and Move controls fit 272 px cards;
  keyboard-opened menus stayed inside the card. Localized subtree `lang`
  changed between `en` and `es`.
- Final independent validation (Codex validator dispatch
  `ctx_603bf34ae047`, task `task_74a22b577a49`) recorded **19 passing latest
  cases and no unresolved observed defect**. It reproduced and the UI owner fixed
  three presentation defects: pre-canonical move focus (status + page-order
  gating), delayed different-row focus intent (focusin cancellation ref; a
  remount may end on BODY without stealing to the moved task, and restoring the
  other row is not claimed), and mobile list Move-menu overflow (narrow rows use
  normal-flow full-width menus). Passing evidence includes exact keyboard
  reorder/persistence, same/cross-column canonical order, committed-response
  loss with original key/payload (version 2, order revision 120, one row),
  conflict + fresh canceled destination, filtered/detail retention, coherent
  focus (forced reload, same-column, filtered fallback, toolbar no-steal,
  delayed different-row), independent column recovery, real mixed revisions with
  114 retained observations and no movable controls, named-assignee fallback,
  100+14 loaded rows with no duplicates, en/es localized subtree, menu/card
  containment with native Tab/Escape, mobile touch End, native desktop drag, and
  320/390 mobile menu reachability. Scripts, screenshots, JSON and fingerprint
  evidence remain outside the repository.

Final checks after runtime handback:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

`pnpm check` passes lint, Express-free backend closure, process cleanup, 7
identity, 16 workspace, 36 project/task, 19 prototype, strict typechecks,
production builds (`/projects` static), 17 MCP subprocess/Inspector checks and
HTTP smoke. `pnpm audit --audit-level=high` passes the required high/critical
gate; one moderate dev-tooling advisory remains (`minimatch`,
GHSA-g3hv-75wg-m249, via typescript-eslint/eslint; no production runtime path).
The handoff verifier passes 47 imported files, 30 assets and 434 local links
without rewriting the handoff; `git diff --check` and `git diff --cached --check`
pass.
`pnpm test:identity`/`pnpm test:runtime` belong to the merged T08.0 logic PR and
are not rerun for this presentation-only diff. Exact PR/CI/Kody state remains on
the PR; a prior-head review never approves a changed head.

Final source fingerprints used by the validator:

| File | SHA-256 |
| --- | --- |
| `projects-view.tsx` | `69e59f5c3e0d995970888a0cf5fe93270c36fa80e67d8c536fcad5e8ea3b5889` |
| `projects.module.css` | `d373f205d7f39f1db1449e082ba325150e8a56159f0563d03d68ff1f759089e6` |
| `strings.ts` | `5a6af47f6f2d323d0ac4fd99d108848490e2e545c80f748bfac754c6dbfbfb4e` |
| `task-list.tsx` | `6aaefe89f2546a5b4a2e63002d82f8cb1b33e399cdfbc1a608b6c03ea32801c6` |
| `task-board.tsx` | `481e1faa80ccd6a51618f3a8297458c51a604dd7ffc52f1fa66da689ba9a196b` |
| `task-move.tsx` | `1cec0911b058af39259b5924ab3eed5d47446c532ce557c2983e014ad0c8d90d` |
| `task-view-bar.tsx` | `2b26edb87b426261d8c7951b0bd890785d6037867124e92b1afdd612b0f614e2` |

## PR19 logic merge and outstanding operations backlog

PR #19 merged on 2026-10-30T18:31:57Z as
`f8895709f881df18a4d2d4a33483dab5add0e51e`; reviewed source
`b2dbc55e9ad1383612e16d1ccaed79f5336ec7a4`, CI run 41106175856 / exact-head
`validate` check 124237103945, Kody check 124240156276 and approval 5716919765.
The coordinator confirmed the logic terminal/worktree were settled and removed
and the external logic report preserved. The main `dev` checkout retains the
user's `next-env.d.ts` modification.

The merged logic PR records two accepted operational/performance limitations:

- The additive migration is offline/local and atomic. It can hold ACCESS
  EXCLUSIVE locks through validation/backfill; a live application must be
  quiesced. No online/zero-downtime migration guarantee is made. A split
  installation requires a future staged compatibility design.
- Board responses are independently bounded/revision-checked across five status
  partitions. An unfiltered list request may perform up to five ordered
  per-status reads (101 rows total). This is deliberately unoptimized; future
  profiling/coalescing must preserve explicit semantic status order and a
  matching keyset predicate. No cross-request policy cache or throughput claim
  is introduced.

These remain backlog items, not work performed by this presentation PR.

## Limits and remaining work

- No full T08/US05, P07 configurable workflow, labels, sprint filters, T09
  comments/subtasks/history, T10 search/My tasks/SSE, B2 saved/table/calendar,
  real OAuth/staging/users, deployment or real-user acceptance is claimed.
- Physical touch devices, real screen-reader output, Safari/Firefox and real
  200% browser zoom were not certified. CDP keyboard/touch emulation and width
  screenshots are implementation evidence, not WCAG certification. The English
  locale changes the route subtree to `lang=en`; the document shell remains
  `es`, which is recorded rather than presented as a full-page locale change.
- A user who explicitly focuses another row while a move's canonical read is
  pending ends on BODY after remount, without focus being stolen to the moved
  task; restoring focus to the other row is not claimed.
- No backend/controller/contract/test-harness source is changed by this PR.
- Final CI/Kody state is recorded on the PR; a prior-head review never approves
  a changed head.
