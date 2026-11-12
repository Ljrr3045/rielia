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


## Bounded SOL recovery implementation — 2026-11-12

The coordinator assigned three inherited recovery defects to SOL xhigh, starting
from T37.3 local checkpoint `d3cc536`. Exact Astra presentation `0721c721` is
integrated by merge `0b874e3`; the progress-only conflict retains both actual
histories. This section supersedes the three unchanged-debt statements above for
the new logic checkpoint, without rewriting Astra's original evidence.

- Confirmed writes retain their result through same-target read recovery. A
  separate error/forbidden outlet shows generic confirmation and explains the
  failed read, with read recovery and dismissal. It contains no private target
  labels while authorization/data are unavailable and never repeats the mutation.
  Genuine target/workspace navigation, session replacement and expiry fence old
  results; existing successful create/move focus and page-revision barriers remain.
- A denied content operation retains only memory-local intent. Scoped rows clear,
  dialogs cannot render without current authorized DTOs/capabilities, and denial
  feedback stays outside the removed form. Refresh checks access. Return requires
  the same current target and allowed capability, preserves the captured version,
  and explicitly restores the draft; Discard removes the intent and focuses the
  current surface. A fresh read revoking edit permission closes an existing form;
  restored permission cannot automatically remount stale fields. Backend policy
  and exact-key unknown retry remain canonical.
- Pending checklist feedback and unknown-outcome recovery are mutually exclusive.
  The original retry record remains internal during the write, without Retry or
  Discard actions. A genuinely lost response exposes the original-key retry;
  confirmed success, denial and conflict retain their existing distinct outcomes.

SOL owns conditional JSX, the existing controller/forms/lifecycle owners and
localized recovery copy. Astra's CSS, form classes and title/status sibling order
remain intact. No transport, auth policy, public contract, backend, dependency,
provider, shared unit configuration or historical baseline changes are included.
T37.3 invitation feedback/token clearing and workspace retained confirmation are
preserved.

Twenty-two added real component/hook regressions cover the bounded outcomes;
all prior tests remain selected. The first focused 46-case schedule and the
subsequent 29-case affected schedule pass, as do frontend strict typecheck and
affected lint. A first instrumented attempt hit a file-local Node ESM import
resolution failure before the new rendered file could execute; 160 other cases
passed. The coordinator authorized mapping `next/link` to the real installed
`next/link.js` in this test only. No component or shared loader was replaced.
The corrected 171-pass checkpoint is preserved, but its candidate was not
approved: source review required actual create/restore/access capability journeys.
Six added screen journeys reproduce an empty-workspace create-form remount bug,
then prove the corrected ready-or-empty close condition, current permission,
deliberate restoration and captured lifecycle versions. Retained target/session
replacement and positive create/move focus tests remain selected.

The complete final measured run passes **177 cases over the same 68 inputs**:
L2299/3835, S2500/4324, F500/1055, B2845/5305. The approved current-web baseline
`c69839c025e8cab983ef0c9366d92e75139989dc61c1fd86b446d119cf1b26e4`
raises L/S/F/B floors to 5994/5781/4739/5362 basis points from
4347/4258/3187/3204. No file loses covered counts or increases uncovered counts.
Provider/config/tool identities, every prior selected case and all other baselines
are retained. Fifty-six unchanged source files preserve exact maps and previously
covered endpoints. Mapping precision remains explicit: 803 null-column points
of 28,798; the type-only collaboration port remains zero-unit N/A. This is not
universal coverage or closure of unexecuted paths. The coordinator approved that
exact current-web candidate before writing it.
One normal `pnpm unit:web` gate passes all 177 cases, reproducing the measured
summary, manifest, normalized maps and hit vectors exactly. Thirty-nine file
counter sets remain exact and 29 improve; all seven other baseline files stay
byte-identical. See the [coverage addendum](unit-coverage.md#t374-reviewed-recovery-baseline-migration).

The screen test executes the actual screen, Next Link, forms, locale, focus hooks,
controller and transports. Its only seams are stylesheet loading, finite public
HTTP responses and controlled browser/media/clock/RAF/idle scheduling. These JSDOM
observations do not establish native focus/geometry, SQL isolation, durable writes
or security. No install, production frontend build, browser, Docker or persisted
journey runs here. Later SOL native/persisted QA, Astra actual-image review,
current-head CI/native review, publication and coordinator acceptance remain open.
The original T37.3 source/build/capture artifacts remain immutable and do not prove
this new source. Actual chrome zoom/device/AT/provider/staging remain unperformed.


Final local scope remains an implementation checkpoint. Native paint/reflow,
keyboard/focus, title-first tab order, mobile Restore, shared discovery rows and
real persisted/security journeys still need independent current-source QA and
Astra image review. No new source-build/native binding is claimed. Later accepted
PR47 corrections must be integrated through a fresh explicit manifest comparison;
this checkpoint cannot overwrite their corrected source/tests.


## Exact PR47 corrective-head integration — 2026-11-12

The coordinator supplied exact clean correction `b1f3ddec` for integration into
recovery `39c72ebb`. Both histories and all 177 cases are retained, including
transition-specific invitation assertions. Only additive changelog/progress/unit
guide conflicts needed resolution; there was no semantic source conflict. The
removed dead identity hooks remain exact to the corrective commit; T37.4 source
and Astra presentation are unchanged. No T37.5 source is integrated.

The [reviewed manifest-only migration](unit-coverage.md#t374-exact-pr47-corrective-head-integration)
and one normal gate pass with identical 177-case counters/maps/hits and unchanged
higher floors. This source-integration authorization does not accept PR47 or
replace current-head CI/native review. The next bounded native group uses one
production build of this exact integrated source; results must be recorded with
actual build, source/fixture hashes, browser version and cleanup. No new native
or persisted proof is claimed by this integration entry.
