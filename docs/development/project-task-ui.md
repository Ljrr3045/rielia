# T06.1/B1a project and task presentation

Status: bounded presentation delivered on the merged T06 project/task contracts
and client logic ([PR #15](https://github.com/Ljrr3045/rielia/pull/15), merge
`e23d2e495a2e4c3dc499bcdde4ac8dd84d74fdad`). This document records UI-owned
decisions, integrated local evidence, and remaining limits. It does not complete
T06/P05, all of T06's original ticket scope, or real-user/provider/staging
acceptance.

## Scope and ownership

| Area | Implemented presentation | Requirement |
| --- | --- | --- |
| Projects | Workspace-visible project rail, create, settings, archive, archived view and restore | P04, US04, UX01/UX09 |
| Task list | Compact status/title/key/type/due/assignee/priority rows, active/archived views, pagination continuation | P05, US04/US08, UXR01/UXR03/UXR06 |
| Quick capture | Title plus current project only; no required form, no automatic assignee | US04, UX02 |
| Task detail | Own URL, desktop contextual panel, tablet overlay, full mobile detail, context-preserving return | P05, US08/US12, UXR01/UXR02, UX01/UX03 |
| Task editing | Title, description, status, type, priority, due date and explicit human/Agent assignee | P05, US08/US12, UX05 |
| Provenance | Immutable creator/source shown textually; autonomous Agent label; assignee separate | P05/P38, US24–US25, UX06/UX11 |
| Archive behavior | Archived project freezes task edits; individually archived tasks stay archived through project restore | P14, UX09 |
| Cross-cutting | Loading/empty/error/no-access, pending/success/conflict/unknown retry, ES/EN, light/dark, 44 px targets, responsive 320–1920 | P33, US08/US12, UX03/UX05/UX07/UX09 |

References used: P04/P05/P14/P33/P38; US04/US08/US12/US24–US25; UXR01/UXR02/
UXR03/UXR06; UX01/UX02/UX03/UX05/UX06/UX07/UX09/UX11. External reference
screenshots were not inspected for this delivery; the textual handoff and existing
Rielia tokens/components guided composition.

Explicit exclusions: private projects, sprints/board/ranking, advanced filters,
checklists/subtasks, comments/history timeline, credentials/MCP, email,
deployments/staging, permanent purge, owner/admin project policy beyond
workspace-visible projects, and the remaining T06/T09/T10/T14 scope.

## Composition and paths

- `apps/web/src/app/projects/page.tsx` supplies noindex route metadata.
  `projects-view.tsx` owns the URL-driven shell, project rail, project header,
  compact list, quick capture, detail/overlay composition, forms, confirmations
  and ES/EN shell. `project-ui.tsx` provides local presentation primitives and
  icons; `strings.ts` owns ES/EN copy and value labels.
- `task-list.tsx` renders the compact list and archived restore rows.
  `task-detail.tsx` renders the detail panel, properties and provenance.
  `task-forms.tsx` renders controlled edit/capture fields; `project-forms.tsx`
  renders project create/settings fields; `task-description.tsx` renders the
  Sol-owned safe Markdown AST with normal React text/elements and no HTML
  injection. `feedback.tsx` renders live status, retry and side-by-side conflict
  comparison. `projects.module.css` is scoped to the route.
- Production data comes only from `useProjectTasks()`. The presentation adds no
  HTTP, controller, database, auth/session, permission, URL, draft/retry/conflict,
  sanitization or functional-test logic. Commands, versions, stable keys,
  capabilities, archive state, URL helpers and pager failures remain
  contract/hook-authoritative. `apps/web/src/app/page.tsx` adds the development
  index link.
- Canonical route: `/projects?workspace=W&project=P&task=T`, using the contract
  URL helpers and the hook's scoped history. The page renders:
  - persistent sidebar from 1024 px;
  - list plus inline detail panel from 1280 px;
  - list with a 30 rem overlay detail from 768–1279 px;
  - full-screen detail below 768 px.
  Closing detail returns to the project URL and restores the launching task link
  or the project heading; browser Back/reload recover the scoped context.
- Quick capture is always the current project and only requires a title. The
  server supplies default type/priority/status and leaves the task unassigned.
  Project creation exposes name, immutable-in-practice key and optional
  description. Settings edit name/description only; key is shown read-only with
  the creation-time explanation. Workspace visibility is stated; private
  projects are marked unavailable rather than presented as working.

## State and recovery behavior

- Load states: loading skeleton, identity disabled, signed out, no workspace,
  empty project/archive/list, forbidden/no-access, transient error and ready.
  Signed out exposes sign-in in a new tab and an explicit **Actualizar** action
  that refreshes the hook without reloading the tab; copy warns that drafts are
  memory-only and a reload loses them.
- Drafts stage into `useProjectTasks` on every edit. Form fields hydrate from the
  captured command, preserve the original target/version, and survive modal
  dismissal, session loss in the same tab and project/task context changes.
  Another account clears private draft/selection state. A draft in another
  context shows its target, **Volver al borrador**, **Descartar borrador** and is
  never submitted against the visible project/task.
- Write feedback is operation-specific: pending; success with the affected
  project/task; validation/forbidden; unknown outcome with **Reintentar con la
  misma clave** and explicit discard; conflict with current-vs-draft columns.
  The draft is not silently overwritten. **Conservar mi borrador** adopts the
  current version explicitly and returns focus to the title field. Transient
  pager failures retain loaded lists/detail/draft and expose retry/dismiss beside
  the relevant projects/tasks pager.
- Archived projects show a visible archived state and freeze task edit/archive/
  capture controls. Restoring the project does not restore individually archived
  tasks. Archived tasks retain their URL and restore control. A previously
  inactive assignee stays visible as a historical assignee with text; the edit
  form offers the current inactive person with an explicit inactive label and
  does not choose a replacement automatically.
- Creator and provenance are read-only. Web, delegated-through-MCP and autonomous
  Agent cases use text plus a visible Agent badge; the assignee is always a
  separate property and creation does not assign.

## Accessibility and responsive decisions

- Native buttons, links, inputs, selects, textareas, fieldsets/sections and
  details; no drag-only or pointer-only action. Minimum 44 px targets for
  controls, 16 px mobile form text, visible focus tokens.
- Skip link; one main landmark; labelled lists/sections; status/alert live
  regions. Focus management covers:
  - mobile drawer opens on its close button and Escape returns to the menu;
  - detail opens on its heading, Escape closes only the active surface, and
    close returns to the launching task link or project heading;
  - modal focus is trapped, Escape closes the top dialog only, and the trigger
    is restored where it still exists;
  - conflict mount focuses the alert heading; after keeping the draft, focus
    returns to the title field; success/archive/restore completion focuses the
    live success heading.
- Status always has text plus a dot; priority has text plus bars; Agent and
  archived states are textual. Long titles, descriptions, unbroken strings and
  links wrap without hiding the primary action or causing horizontal page
  overflow.
- Scoped light/dark semantic pairs, reduced-motion animation suppression, ES
  default with EN selector and `lang` on the route subtree. Authored project/task
  content is not machine-translated.

## Validation

Repository checks (Node 24.22.1, pnpm 12.15.0):

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

- `pnpm check` passes lint, Express-free backend closure, process cleanup,
  7 identity logic/client, 16 workspace logic/client, 16 project/task logic/client
  (including transient pager retention, conflict/rebase, session/account clearing,
  stable URLs and safe Markdown), 19 prototype checks, strict typechecks, production
  builds, 17 MCP subprocess/Inspector checks and HTTP smoke. `/projects` builds as
  a static route.
- Audit reports no known vulnerabilities. Handoff verification passes 47 unchanged
  imported files, 30 matching assets and 405 local links. Whitespace checks pass.
- Real PostgreSQL/Nest/Next integrated QA used the T06 harness on a disposable
  database with the bounded project paging migration. It verified actual API
  client/migration/Next proxy behavior, not a fake adapter.

Integrated browser QA (headless Brave via a temporary CDP profile; actual native
viewport captures, no tiled images):

- Owner: create project; create task from title only; edit title/description/
  type/priority/status/assignee/date; verify Markdown/Agent/creator/provenance;
  reload persistence; archive/restore task; archive/restore project. The
  coordinator separately verified an archived task stayed archived through
  project archive/restore and restored with the same key.
- Two-tab conflict: tab B retained a stale captured version while tab A saved;
  B showed the newer current title side-by-side with the intact local draft,
  focused the alert, exposed one keep action inside the dialog, and explicit
  **Conservar mi borrador** returned focus to the title; the reviewed draft saved.
- Session recovery: staged edit, removed the cookie in the same tab, saw
  signed-out with explicit **Actualizar**, restored the same owner, returned to
  the draft and saved the exact unsaved title. Switching to the member account
  cleared the draft. A full tab reload remains documented memory loss.
- Unknown outcome: blocked API mutation, saw no-confirmation recovery with
  same-key retry and discard; unblocking and retrying created exactly one task.
  Pending create exposed a visible in-progress state and resolved to one task.
- Context switch: edit draft in QAT, switched to another project, saw the
  other-context notice/target, returned to the exact draft, discarded it
  explicitly. No cross-project submit occurred.
- Access: viewer read the project/task and saw no create/edit/archive controls;
  a direct viewer create returned 403. Outsider saw no QAT project, cross-tenant
  read returned 403, and the exact task URL showed Acceso no autorizado without
  data. Member retained edit/create controls.
- States/content: API-blocked load exposed error and recovery; delayed load
  exposed the skeleton; outsider empty workspace rendered; 290-character title,
  unbroken 240-character string, Markdown list/bold/link did not overflow at
  1440/390/320. Widths 320/375/390/768/1024/1440/1920 had
  `scrollWidth === innerWidth`; a 720 CSS-px viewport (1440 at 200% equivalent)
  and 32 px root text also did not overflow.
- Keyboard/focus: mobile drawer focus/return, detail heading/close-return,
  modal trap/Escape, conflict focus/rebase, archive/restore success focus checked
  with CDP key input. Native date keyboard edit was separately reproduced by the
  coordinator: ArrowUp after a typed date persisted through save.
- Screenshots inspected: 1440 light/dark, 1920, 1024, 768, 390, 375, 320, EN,
  200%-equivalent/32 px text, conflict, unknown/pending, archived, viewer,
  outsider empty and long content. The Next dev indicator appears in captures;
  it is development tooling, not product UI.

Coordinator browser QA (Brave, separate profile) additionally covered desktop
1920×878 readability after the shell-width correction, 390×844 detail/list with
no overflow, task archive → project archive → project restore preserving the task
archive, then independent task restore with the same ID, two-tab conflict, viewer/
tenant denial, stable same-tab session recovery, and native date keyboard
persistence. These are cited from the delivery handoff/report; the coordinator
owns the independent profile evidence.

## Limits and remaining work

- No full T06/P05, all original T06 acceptance, private projects, sprints,
  comments/checklist/history, advanced filters, credentials/MCP, deployment,
  provider/staging, or real-user acceptance is claimed.
- Physical touch-device interaction, Safari/Firefox cross-browser certification,
  screen-reader output, and real browser 200% zoom keyboard traversal were not
  performed. The 720 CSS-px viewport and 32 px root text are layout proxies, not a
  WCAG certification.
- Drafts are intentionally memory-only. A full tab reload, tab close or crash
  loses unsent input and the opaque idempotency retry; the signed-out copy says so.
  Session loss within the tab and context changes are covered.
- The transient pager-error UI path (`pageError` retry/dismiss) compiles and is
  covered by the Sol-owned logic/client tests; an actual next-page network
  failure was not induced in the browser because the fixture's pages did not
  exceed the server page size. Pagination continuation rendering beyond one page
  is likewise logic-tested rather than browser-exercised.
- Date automation through CDP/native value assignment did not reproduce React's
  observed native date event; the coordinator's keyboard path and the real
  client/API/PG logic tests establish persistence. No product date defect is
  claimed.
- The route is noindex metadata; authorization is server-enforced, not indexing.
  The Next dev indicator in captures is not part of the presentation.
- This delivery adds no repo test code, auth bypass, fake API/model, metrics,
  backend import, staging credential, or deployment.

## PR #16 review findings and dispositions

Kody's first PR #16 round raised two valid presentation findings:

- [Inline 4407004747](https://github.com/Ljrr3045/rielia/pull/16#discussion_r4407004747):
  a server-denied save in an already open project/task modal had no visible
  forbidden feedback; the status page changed behind the dialog. The dialog now
  renders a focused, assertive forbidden panel, hides its form fields, and exposes
  **Cerrar** and, when applicable, explicit **Descartar borrador**; closing reveals
  the forbidden page and focuses the main fallback. Real-browser after evidence:
  `95-forbidden-in-modal-1440.png`, `96-forbidden-after-close-1440.png`.
- [Inline 4407005097](https://github.com/Ljrr3045/rielia/pull/16#discussion_r4407005097):
  `draftInDetail` could suppress the global draft notice on narrow/tablet when
  `detailOverlay` matched but no task was mounted. It now requires a mounted task;
  after closing the form and detail at 390 px, the other-context draft notice,
  exact target, **Volver al borrador** and **Descartar borrador** remain visible,
  and return reopens the exact unsaved title. Real-browser after evidence:
  `97-narrow-draft-after-detail-close-390.png`,
  `98-narrow-draft-resumed-390.png`.
- Focused `pnpm check`, audit, handoff and whitespace checks pass again after both
  fixes. The transient pager UI remains honestly unexercised in the browser as
  documented above. A changed head requires a fresh coordinator Kody trigger; the
  prior-head review does not approve it.

## PR evidence

- UI PR: [#16](https://github.com/Ljrr3045/rielia/pull/16), English non-draft,
  targeting `dev` from merged T06.0 logic `e23d2e4`.
- The diff is presentation and delivery documentation only. Exact final head,
  CI and coordinator-triggered Kody rounds are recorded in the PR/external
  delivery report; this document is not updated after approval merely to append
  transient review state.
