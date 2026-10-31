# T09.1/B1b task collaboration presentation

Status: bounded presentation on the merged T09.0 collaboration logic
([PR #21](https://github.com/Ljrr3045/rielia/pull/21), merge
`76d7d31bce1e61e46dcab632fb5b53e50d564ce2`). Presentation PR
[#22](https://github.com/Ljrr3045/rielia/pull/22) targets `dev`; exact final
head/CI/Kody state remains on the PR and in the external delivery report. It
implements the presentation
portion of P05/P06/P10/P14/P33/P38; supports US07/US08/US11/US12/US24–US25; and
uses UXR01/UXR02/UXR03/UXR04/UXR06 with UX01/UX02/UX03/UX05/UX06/UX07/UX09/
UX11. It does not complete full T09, T10/T11/T12, B2 mentions/notifications/
attachments, real OAuth/staging/users, or public-launch acceptance.

The logic contract, backend, migration, public types, hook/controller/proxy and
functional tests are owned by T09.0. This delivery consumes the merged
`useProjectTasks` and `@rielia/contracts` surface and adds only JSX, CSS, ES/EN
copy, local disclosure/focus/confirmation state and the requested presentation
navigation. It adds no HTTP path, task/comment/history store, permission rule,
sorting/ranking policy, Markdown parser or functional assertion script.

## Scope and paths

| Area | Presentation delivered | Requirement |
| --- | --- | --- |
| Detail composition | Existing description/properties/provenance shell, then relations, checklist, comments and separate history; desktop contextual panel and full-screen mobile | P05/P06/P10, US07/US08, UX01/UX03/UX09 |
| Parent/child | Parent reference, child rows, child quick-add, child-centric link/reparent and unlink; archived children remain visible | P06, US07/US11, UX01/UX06/UX09 |
| Parent close | Edit/move into done/canceled warns with open/archived-open counts; explicit acknowledgment retains the intended close and children are never changed | P06, US07, UX05/UX06 |
| Checklist | Complete progress, add, inline edit, toggle, two-step remove, keyboard/touch Move up/down with canonical anchors | P05, US07, UX02/UX03/UX07 |
| Comments | Markdown composer, safe rendering, immutable author/provenance/date, own-author edit with version/edited marker, Load older | P10, US07/US11/US12, UX05/UX06/UX09 |
| History | Typed readable activity, actor/Agent/System/provenance/date, Load older, no raw event JSON | P10/P38, US11, UX06/UX09 |
| Draft/recovery | Staged comment/checklist/parent drafts survive navigation; Return/Discard; unknown-key retry; conflict review | US12, UX05/UX09 |
| Read-only | Archived task/project and viewer surfaces show collaboration without mutation controls | P14/P33/P38, US24–25, UX09/UX11 |

Key files:

- `apps/web/src/app/projects/task-collaboration.tsx` composes the sections,
  collaboration draft/recovery/conflict status and success/announcement state.
- `task-relations.tsx`, `task-checklist.tsx`, `task-comments.tsx` and
  `task-history.tsx` own their section composition and accessible controls.
- `projects-view.tsx` wires the existing hook, close-warning action, source
  routing and collaboration draft banner; `task-detail.tsx` inserts the section
  node in the existing detail shell.
- `task-collaboration-shared.tsx`, `strings.ts` and `projects.module.css` own
  date/provenance helpers, ES/EN copy and scoped tokens/responsive styles.

Canonical route remains `/projects?workspace=W&project=P&task=T`; the UI does not
parse or write selectors. Parent/child links are real task URLs intercepted for
same-tab navigation through `selectTask`, so modified clicks and browser Back
work. No new URL parameters or parallel history state were added.

## Interaction decisions

- The visible detail keeps title/description first, grouped properties, then
  collaboration. Relations/checklist/comments/history are independent pages;
  missing pages are loading/error, never zero rows. `parent-candidates` stays
  idle until the link/change-parent picker opens and is closed/cleared on demand
  off, navigation or account change.
- Quick-add child uses the existing content `create-task` draft with parent
  fields. Link/reparent/unlink are performed from the task that receives the
  parent; the parent section only lists children and quick-adds. The link picker
  uses server-filtered candidates and never computes cycles or levels.
- The first close attempt is sent normally. A `409 open-children` with
  `closeWarning` produces one explicit warning above the edit/move surface;
  confirming calls `acknowledgeClose()` and a fresh `submit()`. A changed child
  revision warns again. Cancel discards the close draft. Children remain
  independently visible/writable.
- Comment creation and own-author editing stage the same shared command/key slot
  as other collaboration work. Editing requires `canEdit`, `expectedCommentVersion`
  and preserves creation author/provenance; `version > 1`/`editedAt` show an
  Edited marker. Comment pages are most-recently-updated first with Load older;
  history is newest-event first with Load older activity.
- Checklist completion never changes task status. Removal is retained by the
  server but leaves the active list; the UI uses a two-step inline confirmation.
  Reorder uses the canonical `moveUpBeforeItemId`/`moveDownBeforeItemId` anchors;
  no drag requirement was added.
- Markdown is untrusted data. Comment and description bodies use the existing
  bounded `parseSafeMarkdown` React-node path with no `dangerouslySetInnerHTML`;
  raw HTML/images remain text, unsafe schemes do not become links, and external
  links use `rel="noopener noreferrer"`.
- The collaboration draft banner is separate from the existing content draft
  because `useProjectTasks` projects collaboration commands out of `draft`.
  `draftGuard`, `collaborationDraft`/`collaborationRetryTarget` and mutation
  pending state drive Return/Discard/Retry. Child `create-task` drafts use their
  `parentTaskId` to return to the original parent without a new key.
- Conflicts show a review state: comments use exact-comment comparison after
  `reloadConflict`; checklist conflicts require the complete current checklist
  before rebase; parent/checklist move destinations require discard, refresh and
  a fresh deliberate selection. No generic rebase or optimistic canonical order.

## States, accessibility and responsive behavior

- Each section renders `idle`/`loading`, `ready`, `error`, `changed` and empty
  states independently. `changed` requires Refresh and disables stale writes;
  transient auxiliary errors preserve readable content and drafts.
- Read-only archived/viewer surfaces keep the section content, checkbox state and
  historical attribution while removing create/edit/remove/reorder controls.
  Current policy keeps viewers read-only; the future guest “comments if granted”
  exception is not presented.
- Native buttons, links, inputs, selects, checkboxes, `<progress>`, `<time>` and
  section headings are used. Touch targets are at least 44px as a design
  guideline, mobile inputs inherit 16px base text, focus is visible, Escape
  closes the link picker, and close/remove/reorder/edit forms return or retain
  their initiating context as far as the existing detail focus model allows.
  Success/warning/error feedback uses announced status/alert panels.
- Sections wrap long titles, keys, URLs and comment text; code blocks scroll
  locally; the detail panel remains the only page scroll at 320px. No horizontal
  page overflow was introduced. Light/dark tokens and reduced-motion behavior
  reuse the existing app system.
- Presentation review targets 320/375/390/768/1024/1440px, landscape and 200%
  zoom, ES/EN, keyboard-only and touch. These are not physical-device, assistive-
  technology or WCAG certification claims.

## Validation status and limits

Source checks at the initial presentation head `89144e1`:

- `pnpm --filter @rielia/web typecheck` — passed before the live runtime started.
- `pnpm lint` — passed with `--max-warnings=0`.
- `pnpm --filter @rielia/web build` — passed before the live runtime started.
- `pnpm test:projects:logic` — 46/46 passed, including T09 transport, draft,
  close acknowledgment, comment/checklist conflict, candidate demand and
  Markdown safety regressions.
- `python3 scripts/verify-handoff.py` — passed; `git diff --check` — clean.

The separate Sol functional validator used the single real PG/Nest/Next runtime
against the frozen checkout. Its bounded cases passed hierarchy/parent/child
create-link-unlink, checklist add/edit/toggle/reorder/remove, close-warning
acknowledgment including changed revisions, parent archive/child independence,
comment/checklist conflict review, lost-response original-key recovery, paging
and attribution, independent section failure, auth loss, viewer/archive
read-only and content-scoped hostile Markdown. A failed-checklist-read scenario
first exposed a lost success notice; the presentation fix at `bfefde6` preserved
the confirmed notice without a second mutation, and the focused success retest
passed. Unrelated-task success suppression and no pre-confirmation success were
also checked. The validator's detailed report and attempts remain outside the
repository.

The independent responsive/keyboard validator covered CSS viewports 1440, 1024,
768, 390, 375 and 320, landscape 844×390, ES/EN and emulated light/dark. Its
initial 28 layout records found no page/detail horizontal overflow, no unnamed
visible controls, no effective targets below 44×44 CSS px and 16px
inputs/textareas; native roles, relation/parent navigation, focus containment and
safe emulated-touch picker disclosure passed. It found the nested picker Escape
and edit-cancel focus defects, then passed the affected retests: nine focus cases
on `9b0f8c9`, and the final four consumed-Escape/normal-Escape/Tab regressions on
`c9d8f53`. The success-notice fix was reviewed on `bfefde6`. The initial content
had inline Markdown/code and inert raw HTML text but no rendered PRE block, so no
code-block scrolling claim is made.

The final standard `pnpm check` after the validator stopped its runtime passes
lint, Express-free backend closure, smoke-process cleanup, 7 identity-logic,
16 workspace, 46 project/task (T09), 19 prototype, strict typechecks, production
builds (`/projects` static), 17 local MCP subprocess/Inspector checks and HTTP
smoke. `pnpm audit --audit-level=high` passes the high/critical gate; the inherited
development-only `minimatch` moderate advisory remains as documented in PR #20.
The handoff verifier passes 47 imported files, 30 assets and the updated local
links; whitespace checks are clean. No workaround typecheck pass is claimed for
the narrow fix heads; this is the standard post-runtime run.

Review fixes after the first presentation head: a child quick-add 409 now renders
the child conflict branch with retained title/parent context and explicit
Discard + Refresh only (no automatic rebase/new key/retry), retested at 390/1440
on `d98fdbb`; and the conflict panel now requires `!offTarget` so a switched-task
child conflict shows only the single Return banner, retested at 390 on
`38285df`. Both review findings were replied to with the focused evidence. Exact
current-head CI/Kody and merge state live in GitHub and the external report;
there is no claim that merge has completed.

No physical-device, virtual-keyboard, real 200% browser zoom, screen-reader, AT
or WCAG certification is claimed. No real provider/staging, real-user validation,
full T09/P05/P14/P38, T10/T11/T12, B2 or deployment is claimed.

## T09.0 merge evidence

- Logic PR: [#21](https://github.com/Ljrr3045/rielia/pull/21), merged
  2026-10-31T17:52:53Z as `76d7d31bce1e61e46dcab632fb5b53e50d564ce2`.
- Reviewed head: `0e4784c3d41ddd095c69f61b49489e9a78065347`; root Kody trigger
  `6546958383`; final Kody check `124610642083` SUCCESS/no-issues comment
  `6546960524`; CI `41226123949` / check `124610518385` SUCCESS.
- Coordinator confirmed the completed logic worktree removed. The portable
  contract is [task-collaboration.md](task-collaboration.md).
