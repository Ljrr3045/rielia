# T37.4 project and task presentation checkpoint

**2026-11-11, America/Caracas — implementation checkpoint, not acceptance.**
This bounded advance uses `feat/t37-project-task-ui`, created from accepted
`origin/dev` at `8647f19fc3e359716d64eb649ff0ef79775cdf13`, then fast-forwarded to the
explicit corrected T37.3 checkpoint `5af198a009a7a9fbda19a9f0148eb68c89aaebb3`.
T37.1/2 are accepted; T37.3 remains in progress, including its independently
owned invitation feedback and validation. Publication waits for T37.3 acceptance
and base synchronization. No pending foundation is represented as accepted.

## Scope and composition

Follow the [design direction](t37-design-direction.md), [inventory](t37-ui-inventory.md),
[stable contract](t36-stable-ui-contract.md), [project owner map](project-interactions-extraction.md),
[foundations](t37-ui-foundations.md) and [shell checkpoint](t37-shell-entry.md).
Traceability: T37.4; existing P01–P11/P33/P38, US01–US08/US11–US12/US24–US25,
UXR01–04/06 and UX01–03/05–07/09/11. Sprint P09/US06/UX04, T11, UXR05 advanced
views, new routes/features, My tasks/Search interiors, identity/workspace work,
landing, prototype promotion and final brand/license remain excluded.

| Surface | Authored presentation change |
| --- | --- |
| Project header and capture | Existing administration buttons use the quieter ghost treatment; restore retains its primary treatment. The existing quick-capture label is visible, and capture has clear field/action spacing. No creation shortcut, handler or mount condition is added |
| Breadcrumb | Flex children have `min-width: 0`, `max-width: 100%` and inherited `overflow-wrap: anywhere`. Long unbroken context can wrap within the available work column without clipping or hiding the full text |
| Task list | One bordered list with row dividers replaces separate row cards. Project rows place title/key/metadata before the existing native status/Move control in both DOM and visual order. Wide standalone lists align assignee/date metadata; contextual and narrow rows wrap. Existing priority remains visible, and the capability-gated Restore control is now visible on narrow project rows; the duplicate mobile priority mark is hidden |
| Board | Muted columns distinguish grouping from task cards; 18rem authored column width, 16px default card title and consistent padding improve reading. Native column selection, local scrolling, add-in-status, canonical capture and always-present Move remain unchanged |
| Forms and access | Project name/key/description flow vertically; shared field spacing separates labels, inputs and hints. Existing native form disclosure regains its marker. Automatic-access explanation retains its semantic information treatment; permission sections and human/Agent rows use dividers instead of nested cards |
| Task detail and collaboration | Title and description remain first, with a 65ch description limit. Larger sentence-case section headings, grouped property rows, separate creator/provenance text, simple relation empty states, comment dividers and a quieter history rule establish reading order. Checklist progress, inline actions, own-author controls and independent errors retain their exact conditions |

The existing system font, semantic light/dark tokens, five textual statuses,
44px control minimum, 16px narrow/coarse-pointer fields, focus and reduced-motion
rules remain. All dimensions above describe source, not measured new rendering.
The 1024 rail, below-768 full-screen detail, 768–1279 overlay and 1280+ contextual
panel thresholds are unchanged. No image, font, icon or package is introduced.

## Exact ownership and invariants

Application edits are limited to `projects.module.css` and presentation-only
changes in `project-work-area.tsx`, `project-forms.tsx`, `task-forms.tsx` and
`task-list.tsx`. The first three TSX changes are class choices only. Task list
changes statically reorder the existing title/status sibling blocks and add
metadata classes; all existing handlers, props, keys, refs, URLs, conditions,
capabilities, pending/disabled rules and command preparation stay intact.
No hook/state/effect/controller/transport/proxy/test/contract/backend/tooling/
coverage/dependency/lockfile source is edited. Existing form keys and conditional
mount/reset lifetimes, selection independent of filters, URL/Back/draft protection
and the single focus trap remain owned by the established logic.

Shared `.taskList`, `.taskRow`, breadcrumb, form and detail selectors also reach
My tasks/Search consumers. Their interiors are not redesigned here, but SOL must
check shared-style parity, restored focus and detail behavior there. Project-only
row composition uses `.projectTaskRow`; discovery retains its existing markup.
The narrow Restore visibility is a presentation correction, not a new permission.
The new title-first tab sequence needs native verification alongside Move menus.

These three inherited defects are deliberately **unchanged**, not hidden by CSS:

- Confirmed project write followed by read 503 hides visible success.
- Project mutation 403 removes the form.
- Pending checklist save can show unknown-outcome Retry/Discard alongside Saving.

SOL owns their logic and regression work. Workspace retained confirmation after
read 403/503 and T37.3 token-clearing semantics are outside this edit and unchanged.

## Baseline inspection and provenance

Five actual baseline PNGs were viewed. These are not captures of this checkpoint.
Exact file hashes and absolute local artifact locations are retained in the
external delivery manifest; portable repository provenance follows:

| Baseline source / build | Inspected image | Observation |
| --- | --- | --- |
| `fbc082975d2387748000d6fd303de18760247d56` / `B4VarUs7QHLK6SVdmvGsG` | `shell-1280-breadcrumb-boundary-dark-en.png` and `shell-1280x900-dark-en-detail.png` | Unbroken breadcrumb paints beneath the contextual panel; supplied native measurement is text-right 923.56 versus detail-left 824, with container 556 and text 675.56. The source correction above still needs after-change measurement |
| Same source/build | `project-long-list-light-1440.png` | Long titles wrap, while row cards and prominent administration compete with the work list; informs contiguous rows and quieter actions |
| `d533cc03b364fa31035a1a8398c3ebdaba71b3a1` / `s8nqehi89fhGwKchoacwA` | `project-board-dark-1440.png` | Original failed-column fixture shows truthful Unavailable/error panels; not populated-board evidence |
| Same source/build | `project-board-dark-1440-r2.png` | Corrected finite fixture shows populated status columns with title/key/metadata and native Move; its viewport does not show the offscreen fifth column |

Previously reviewed Mobbin patterns in the direction guide inform composition;
no fresh reference search/download or competitor asset is used. All three
explicit local frontend skills were read under their reviewed safety rules.
Impeccable context was read directly without its launcher/engine/hooks/Apply;
UI UX Pro Max's reviewed read-only search returned Long Token Wrapping guidance,
used only to support shrinking/wrapping rather than truncating primary content.

## Checkpoint evidence and next gates

The coordinator verified Astra high and auto_review/on-request/workspace-write
in the exact frontend cwd. One authorized cached offline frozen install reused
541 packages with zero downloads; Node 24.22.1 and pnpm 12.15.0 remain pinned.
No suggested package skill was approved and shared Git configuration was preserved.
Checkpoint checks cover adopted formatting, immutable handoff/local links, source
and whitespace review, and mandatory staged-source/commit-message hooks. The
external report records exact outcomes and source SHA-256 hashes.

No new functional test is added for presentation-only ownership. Independent SOL
validation must bind the committed bytes to functional/coverage and actual native
checks; no build/browser/server/Docker/full suite runs in this checkpoint. No new
rendering, persisted write, WCAG compliance or T37.4 acceptance is claimed.

SOL's next matrix must include ES/EN, both themes, 320/375/390/768/1024/1440,
844×390 and 767/768/1279/1280/1281 boundaries; long unbroken context at 1280,
0/1/large/paged lists, five statuses, partial columns, archived/read-only/Agent
states, native Move and Restore, capture/edit/privacy, parent/children/checklist,
comments/history and pending/error/conflict/unknown outcomes. Measure paint
bounds as well as document overflow, focus/44px targets/16px fields, current
counts and scoped scrolling. Verify URL/Back/selection/drafts, exact-key recovery,
session fences, shared discovery consumers and real API/PostgreSQL persistence.
Astra then reviews actual after-change images and corrects demonstrated defects.

Actual browser-chrome zoom, physical devices/virtual keyboard, manual AT, real
users and provider/staging evidence remain unperformed here. Current-head CI,
native Kilo, coordinator acceptance and eventual publication remain gates.
No push/PR/Ready/merge/deploy/worktree deletion occurs; T37 remains IN PROGRESS.
