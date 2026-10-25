# Task prototype presentation (T01/B0)

Status: presentation integrated on the merged T01/B0 logic and typed save/retry
context (PR #7 merged as `bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f`). This document
records UI-owned decisions and evidence for `/prototype`. It does not complete
T01/B0, provide production task/sprint policy, or claim real-user validation.

## Scope and ownership

- `apps/web/src/app/prototype/` contains the route, client presentation, view
  components, scoped CSS module, and ES/EN copy. `page.tsx` owns route metadata;
  `prototype-app.tsx` mounts `useTaskPrototype()` once and passes state/actions down.
- The presentation imports the published types, hook, `getSprintSummary`, and the
  typed `save.context`/`retryContext` fields from
  `apps/web/src/lib/task-prototype/`. It adds no controller, filtering, persistence,
  network, identity, API/database, or functional-test implementation.
- `apps/web/src/app/page.tsx` gains one development-index link and a corrected
  statement that the product is not implemented but a fictional prototype exists.
- No dependency, package manifest, lockfile, API route, `lib/` file, source handoff,
  or global stylesheet is changed. The visual tokens are scoped in
  `prototype.module.css`; existing Rielia semantic variables are reused.
- Merge base: PR #5 head `55481ffb3613ccaadcb37f3e6dd3ad3118afb8c3`, then
  `origin/dev` `5099b39aef53d5b7e2f0205f3168727cb1dc9471` (PR #5 merge). The typed
  context prerequisite merged as PR #7, `bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f`,
  from reviewed head `c90b437ca5948301b790b655256c8a460b3bef21`. The final PR is
  merged on that `dev` state and contains only the presentation/docs delta.

Applicable requirements: P04/P05/P07/P08/P09/P11/P33/P38; US04/US05/US06/US08/
US11/US12; UX01–UX05, UX07, UX09, UX11; UXR01–UXR04. This is a bounded subset,
not acceptance of those requirements as a whole.

## Composition and behavior

- Desktop ≥1200 px: persistent sidebar, project/view header, filter bar, list or
  board, and a contextual task detail column. 1024–1199 px keeps the sidebar and
  uses an overlay detail; 768–1023 px uses a collapsible/off-canvas sidebar; below
  768 px uses a top bar and four-destination bottom navigation.
- Default view is **My tasks**, filtered by assignee in the adapter. It is a vertical
  execution list, not a metrics dashboard. Project views are List, Board, and
  Sprints; no unimplemented settings/search/overview destinations are shown.
- List rows prioritize the title, then key/labels/due/points/assignee and a visible
  status control. Board columns show name/count, readable cards, add-within-status,
  a visible status control on every card, and desktop drag. Mobile board shows one
  selected column with a labelled column picker and the same status control.
- Task detail is a side panel on wide desktop, full-screen on mobile, and contains
  description first, grouped properties, creator/provenance, and a separate
  assignee. Creator and assignee are never merged. Delegated human and autonomous
  Agent provenance are shown textually.
- Current feedback and captured retry are separate presentation inputs. Detail,
  forms, and the close dialog show a current outcome only when `save.context`
  targets that record, and a retry only when `retryContext` targets it; the two are
  rendered independently. A matching captured close retry restores/locks its
  captured destination on dialog reopen. Global recovery and current sprint
  outcomes include the task key or sprint name, so an unrelated success/error is not
  presented as belonging to the record on screen.
- On wide desktop, an unmatched current outcome or captured retry keeps a global
  labelled home while another task's detail stays open; matching feedback remains
  in the detail to avoid duplication. On narrow/mobile detail the panel is modal
  and the workspace is inert, so an unrelated pre-existing recovery is reached by
  closing/backing out; focus never moves behind the detail.
- Capture uses title plus fixed project context, with optional details collapsed.
  Edit uses the same controlled draft. Sprint planning edits goal, dates, and full
  scope; start/close are confirmed by the adapter, and closure distinguishes done,
  canceled, and unfinished work with an explicit destination.
- A separate demo strip states that data is fictional and memory-only, offers an
  explicit simulated-failure control, and provides a two-step reset to seeded or
  empty example data. Normal product controls do not expose engineering detail.
- Spanish is the default UI language, with an ES/EN switch. Seed task/project
  content remains authored data and is not machine-translated.

## States and recovery

| State | Presentation |
| --- | --- |
| Empty project | Helpful first-task state with create action |
| Empty My tasks | Assignee explanation, view-all and create actions |
| No filter/search results | No-results copy plus clear-filters and create actions |
| Missing selected task | Recoverable missing-task panel |
| Pending | Operation-specific progress text; controls disabled where a write is in flight |
| Saved | Visible confirmation near the action/detail; never inferred from a click |
| Simulated save failure | Alert with draft retained; retry target is the captured operation, not the latest kind/error |
| Independent recovery | A captured retry remains reachable only by matching target even when latest feedback concerns another record; current outcome is hidden elsewhere |
| Unmatched while detail is open | Wide desktop: current/retry stays in a labelled global strip while detail remains scoped. Narrow: detail is modal/inert; close/back reveals pre-existing unrelated recovery |
| Field validation | Inline field error and field association; draft retained |
| Version conflict | Guidance to keep the draft and reopen current data |
| Sprint closure | Summary, done/canceled/unfinished distinction, required destination |
| Closed sprint | "Tasks still in this sprint" (current retained done/canceled records) separated from the frozen closing summary; unfinished destinations stated |
| Reset empty | Confirmation, then zero-task project state with first-task action |
| Loading | Route-level skeleton file; data is in-memory and synchronous, so no network loading state is simulated |

Retry rendering matches `state.retryContext` to the rendered task/sprint, not the
latest save kind/error; `canRetry` remains the adapter invariant. Close-sprint retry
also dismisses the closure dialog and restores focus through the saved action result.

## Accessibility decisions

- Native buttons, links, inputs, selects, checkboxes, radios, and `details`; no
  custom drag-only or pointer-only path for status movement.
- Mobile target sizes use the 44 px design guideline for primary controls, filters,
  form controls, and navigation; mobile form text is 16 px.
- Focus moves to the opened task heading, traps within full-screen detail/dialog
  panels, and returns to the launching control (or the main heading when that
  control is gone). Escape closes desktop detail and disclosure panels.
- While narrow detail is open, the workspace is inert and the detail is a modal
  region; unmatched pre-existing recovery is deliberately reached after close/back,
  not by moving focus behind the overlay.
- The closed off-canvas sidebar is `inert` and `aria-hidden` at the actual ≤1023 px
  breakpoint; its buttons are not in the accessibility tree or tab order. Open
  drawers and modal surfaces isolate the background; body scrolling is locked while
  an overlay is active.
- Status and priority always include text plus a dot/bar shape; color is not the
  sole signal. Assignee Agent identity is textual.
- Live regions announce pending/saved outcomes politely and errors assertively;
  local feedback is used in the active detail/dialog so it is reachable on mobile.
- Light/dark tokens are scoped and the prototype honors `prefers-reduced-motion`
  with a CSS override. Visible focus uses the shared focus token.
- Long titles, descriptions, names, labels, and metadata wrap without hiding the
  primary action. The work area and side panel use fluid columns.

## Evidence

Repository checks on the merged-dev branch:

- `PATH="$PWD/node_modules/.bin:$PATH" pnpm check` passed after integrating PR #7:
  lint; smoke-process; identity logic/client; 19 prototype invariant tests; strict
  typecheck for contracts, API, and web; production build; HTTP smoke. `/prototype`
  is generated as a static route.
- PR #7's reviewed head `c90b437` passed [Kody approval 5642060409](https://github.com/Ljrr3045/rielia/pull/7#pullrequestreview-5642060409)
  and [CI 40172013213](https://github.com/Ljrr3045/rielia/actions/runs/40172013213)
  before merge at `bfaf24d`.
- `git diff --check` and `git diff --cached --check` pass.
- No app-origin console errors were observed in independent QA; unrelated browser
  extension warnings were excluded.

Independent coordinator browser QA (Brave, actual rendered controls; report
preserved outside the repository):

- Desktop 1440: title-only create with armed failure retained the title; retry
  created exactly one RIE-19, unassigned, with human/web provenance.
- Edit, assignee change, My-tasks search, and status propagation to the shared
  board passed. Status mutation exposed pending, then confirmed state.
- Mobile 390: detail status failure showed a reachable retry in the overlay;
  retry succeeded; Escape closed detail and returned focus when the source card had
  disappeared.
- Sprint plan edit, start, second-active blocking, closure counts, destination
  selection, simulated closure failure, retry dismissal, and exact unfinished
  movement passed.
- Mobile 320: no document horizontal overflow in inspected sprint/list/empty
  states; no-match search exposed recovery and clearing filters restored 19 tasks.
- Reset empty confirmed, then showed zero tasks and the first-task action.
- Tablet 768: closed sidebar was inert; opening focused Close navigation; Shift+Tab
  wrapped; Escape restored Open navigation. No document horizontal overflow.
- Empty-title save exposed an `aria-describedby` field error; Escape showed discard
  confirmation, Keep editing retained the draft, and confirmed discard restored
  New-task focus.

Post-fix typed-context regressions (local head `eddbd84`, independent Brave QA and
UI-owner Orca checks):

- Armed failure on RIE-12, then opened RIE-15: no foreign error, pending, retry, or
  stale success appeared in RIE-15. Global and own-detail recovery named RIE-12;
  retry changed only RIE-12 and left RIE-15 unchanged.
- Unrelated RIE-15 failure, then opening Close sprint on active Clarity first: both
  destination radios remained enabled, with no frozen hint or foreign retry.
- Own close failure to Review and refine: failure feedback and retry named Clarity
  first; the captured destination remained selected and locked. Cancel/reopen
  restored that destination and retry. At 390 px, retry closed the dialog and sprint,
  restored Sprints focus, moved exactly RIE-1/2/4 (target scope 2→5), and retained
  two done + one canceled in the frozen closure. No horizontal overflow or app errors
  were observed. Malformed state injection was not browser-tested; it is covered by
  the adapter tests.
- Wide desktop detail-open recovery: with RIE-15's detail open at 1285 px, an armed
  RIE-12 status failure appeared in the labelled global strip while RIE-15 remained
  free of foreign error/retry; retry named RIE-12 and updated only RIE-12. A matching
  RIE-15 failure showed only in its detail with no duplicate global panel. The
  coordinator independently reproduced the pre-fix 1920 px defect and verified the
  rebuilt production head at 1920: labelled global pending/error/retry while RIE-15
  stayed open; retry changed only RIE-12; RIE-15 stayed todo with no foreign/stale
  local feedback. Opening RIE-12's own detail showed exactly one retry and zero main
  alerts. At 390, background remained inert, no overflow, closing detail exposed the
  correct RIE-12 recovery and it succeeded; a task recovery also remained reachable
  after navigating to Sprints. Narrow detail remains modal/inert; unrelated recovery
  is reached after close/back. App error logs were empty.

Additional UI-owner checks:

- 1440 dark and light screenshots; 390 and 320 mobile screenshots; 768 tablet
  header/filter layout. Orca viewport-override captures that tiled were excluded.
- Desktop drag was exercised with actual mouse drag at 1285 px: RIE-8 moved from
  Backlog to To do and the counts/status confirmation updated. Mobile uses the
  status select instead; its copy does not promise touch drag.
- Closed-sprint visual: after an actual start/close with destination, the card
  showed 2 retained done/canceled tasks under "Tasks still in this sprint" and a
  separate frozen closure summary of 1 done + 1 canceled + 4 unfinished. The
  destination sprint showed the 4 moved tasks.
- Search accessibility after a query resolves exactly as "Buscar" (ID
  `prototype-filter-search`), with the clear button outside the label; the
  coordinator independently verified this in live Brave.
- Large text: Firefox with a 32 px default font (200% text, not browser zoom) at
  1440 and 390 produced no document horizontal overflow and readable wrapped
  layout in inspected screenshots. Control-by-control traversal at enlarged text
  was not repeated.
- English switch was visually inspected on the sprint view; all chrome copy and
  date formatting changed, while authored sprint/task content stayed unchanged.
- Reduced-motion behavior is implemented as a scoped CSS override; runtime media
  emulation was not captured.

Capture commands used for the additional light and 32 px-default-font evidence
(the preview server must be running on port 4317):

```sh
FF=/Applications/Firefox.app/Contents/MacOS/firefox
$FF --headless --no-remote --profile /tmp/rielia-ff-1440 \
  --window-size 1440,1000 --screenshot /tmp/rielia-1440.png \
  http://127.0.0.1:4317/prototype
$FF --headless --no-remote --profile /tmp/rielia-ff-light \
  --window-size 1440,1000 --screenshot /tmp/rielia-1440-light.png \
  http://127.0.0.1:4317/prototype
$FF --headless --no-remote --profile /tmp/rielia-ff-big \
  --window-size 1440,1000 --screenshot /tmp/rielia-1440-big.png \
  http://127.0.0.1:4317/prototype
$FF --headless --no-remote --profile /tmp/rielia-ff-big \
  --window-size 390,844 --screenshot /tmp/rielia-390-big.png \
  http://127.0.0.1:4317/prototype
```

`/tmp/rielia-ff-light/user.js` set
`layout.css.prefers-color-scheme.content-override=1` and
`ui.systemUsesDarkTheme=0`; `/tmp/rielia-ff-big/user.js` set the variable/fixed
Western font size to 32 px. Orca viewport captures that tiled were not used for
these conclusions.

## Not verified / limits

- Full T01/B0, complete mobile touch-device behavior, Safari, screen-reader output,
  real-person usability, real 200% browser zoom keyboard traversal, and long-session
  persistence are not verified.
- The prototype is in-memory only: refresh/unmount/reset loses data. No backend,
  identity, permissions, URL/history restoration, export, notifications, comments,
  subtasks, checklist, table/calendar, saved views, sorting, reports, or real
  concurrent conflict resolution is implemented.
- Seed content is fictional and in English; the UI language switch does not
  translate authored data. New tasks are unassigned unless the author selects a
  responsible human/Agent, so they do not appear in My tasks.
- Light/dark, 320/390/768/1440, keyboard focus, filtered-detail return, status
  feedback, failure/retry, and closed-sprint wording received targeted checks; they
  are not a WCAG 2.2 AA certification.
- The route-level loading skeleton is not a simulated fetch state because the demo
  adapter initializes synchronously and `/prototype` builds statically.

## Review

Kody's PR #6 review found two high-severity issues:
[4369892911](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4369892911)
(global retry could disable the close-sprint destination) and
[4369892991](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4369892991)
(task detail B could display/retry task A's captured save because the save kind
was shared). Both were valid. The Sol-owned PR #7 now exposes `save.context` and
independent `retryContext`; this presentation consumes them without UI-owned
correlation logic.

A second round on `8b37a78` raised
[4370055482](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4370055482)
(global recovery branch unreachable/current-vs-retry target ambiguity) and
[4370055583](https://github.com/Ljrr3045/rielia/pull/6#discussion_r4370055583)
(foreign task feedback invisible while wide-desktop detail stays open). The second
is valid and fixed by the labelled unmatched global strip; matching detail
feedback is not duplicated. For the first, the global surface now separates
handled-local current feedback from unmatched current/retry, so the recovery-only
panel can render when current is handled elsewhere; when current and retry differ
globally, both are explicitly labelled with their own target rather than gated
away. Narrow detail stays modal/inert; unrelated recovery requires close/back.

Post-fix Brave and UI-owner regressions cover the reported A/B, stale-success,
unrelated-close, own-close/reopen, matching-detail non-duplication, wide
detail-open foreign recovery, and 390 px retry cases. The final presentation head
on `dev` still requires exact-head CI and a fresh coordinator Kody trigger, with all
three review surfaces inspected before merge. Earlier reviews do not approve the
changed head.
