# T07.1/B1b private-project access presentation

Status: bounded presentation delivered on the merged T07.0 privacy/access logic
([PR #17](https://github.com/Ljrr3045/rielia/pull/17), merge
`c72831c1be4ca2332a6162adc2af85d529b441b8`). This document records UI-owned
decisions, integrated local evidence, and remaining limits. It does not complete
T07/P02/P03/P04/P14 or real-user/provider/staging acceptance.

## Scope and ownership

| Area | Implemented presentation | Requirement |
| --- | --- | --- |
| Project creation | Visibility choice when `projects.capabilities.canCreatePrivate`; read-only workspace visibility otherwise | P04, US02, UX01/UX09 |
| Project header | Textual private/workspace visibility, automatic-admin disclosure, read-only granted access, human-admin **Access** entry | P03/P04/P38, UX06 |
| Access administration | Automatic owner/admin disclosure; visibility change with consequences; paginated people/Agent list; explicit grant/re-grant/revoke with consequence-specific confirmation | P03/P04/P38, US03/US24–US25 |
| Retained rights | Explicit rows survive visibility transitions; workspace membership and automatic admin access remain effective; revoke copy never claims a losing admin/workspace member actually loses access | P03/P04, US25 |
| Archived projects | Visibility and grants frozen; explicit revocation remains available | P04/P14, UX09 |
| Assignees | Server-eligible paginated people/Agents only; historical unavailable assignee retained and labelled | P05/P38, US08/US24–US25, UX11 |
| Recovery | Shared content/policy draft and key; pending versus unknown outcome; conflict/access-current review; stale access page refresh; independent access/assignee page retries | US12, UX05/UX09 |
| Cross-cutting | ES/EN, light/dark, 44 px targets, 320–1440 responsive, focus trap/restoration, no color-only state | P33, US08, UX03/UX07 |

References used: P02/P03/P04/P14/P33/P38; US02/US03/US08/US12/US24–US25;
UXR01/UXR02/UXR03; UX01/UX03/UX05/UX06/UX07/UX09/UX11. The textual handoff and
existing Rielia tokens/components guided composition; external comparison screens
were not re-inspected for this delivery.

Explicit exclusions: invitations, guests, project leads, Kanban/sprints/comments/
history/search/SSE, credentials/MCP authorization, SMTP, RLS/deployment, real
OAuth/staging and real users/projects. No server policy is reimplemented in JSX;
the UI consumes server capabilities, access projections and eligible-assignee
pages. Functional test source remains logic-owned.

## Composition and paths

- `apps/web/src/app/projects/projects-view.tsx` wires the visibility filter,
  project header, access modal, policy/content recovery projections, assignee
  paging and shared guards. It retains the canonical
  `/projects?workspace=W&project=P&task=T` URL and T06 focus recovery.
- `project-access.tsx` owns the human-admin access panel: automatic-access
  disclosure, visibility confirmation, paginated people/Agents, explicit/
  automatic/effective explanation, grant/re-grant/revoke confirmation, archived
  freeze and policy pager recovery.
- `project-forms.tsx` adds the create-time visibility choice; settings show
  visibility read-only and point administration to Access.
- `task-forms.tsx` consumes server eligible-assignee pages, retains the current
  historical assignee and exposes load-more/independent retry.
- `project-ui.tsx` adds `IconUsers`, a wide modal variant, and preserves the
  existing trap/restore helpers. `strings.ts` and `projects.module.css` own ES/EN
  copy and scoped responsive/theme styles.

## Interaction and policy presentation

- Create default is workspace visibility. Private creation is offered only when
  the server page capability allows it; members see a read-only workspace
  explanation. Creation never assigns or grants explicit access.
- Project header shows workspace/public or private visibility textually. Private
  administrators see automatic-administration text; non-admin private readers see
  only “access granted”; neither implies explicit access without the access page.
- The access panel always discloses that active human workspace owners/admins see
  private content. The installation-operator caveat remains in technical docs,
  not in this compact task UI.
- People and Agents are listed from the server page; each row leads with name,
  role/Agent/inactive labels and a plain effective explanation (administrator
  role, workspace membership, access granted, no access or inactive). Retained
  explicit state appears only where it explains an action, especially admin
  explicit removal and workspace-visible projects.
- Row actions render only from server `canGrant`/`canRevoke`. Grant/re-grant and
  revoke confirmations name the target and state the actual consequence:
  automatic admin access or workspace membership is preserved where applicable;
  revoke never claims that an administrator/workspace member loses access when
  only an explicit row is removed. Historical authorship/assignment is untouched.
- Visibility changes require confirmation. Private→workspace exposes the project
  to active members; workspace→private reapplies retained explicit rows and keeps
  automatic admin access. Archived state freezes visibility/grants but permits
  explicit revocation.
- A row action stages the exact `ProjectPolicyCommand` (target/version) when
  review opens; Confirm only submits that captured draft. Rebase after a 409
  adopts the reviewed current version; access rebase requires the exact current
  target member (`accessConflict`/`accessCurrent`, exact-target reload), never a
  version-only or malformed conflict. Change-access success is labelled as an
  explicit permission change, with retained automatic/workspace access explained.
- Policy pending is distinct from an unknown outcome. Confirm shows pending only
  while the request is active; after an interruption it is disabled and a plain
  **Retry**/**Discard** is enabled. Retry keeps the original key/target internally
  and states that a retry will not duplicate the operation. If the captured
  context was left, **Return to the pending change** first restores the project
  and access modal; Retry is not offered in the wrong scope.
- Policy page errors are independent for access and assignees. A missing first
  page shows its own Retry while project/task content remains usable; simultaneous
  failures remain independently recoverable. A changed access-page version keeps
  the loaded rows and offers full **Refresh list**, never an infinite stale
  Load more. Shared feedback dismissal does not erase those collection errors.
- Content and policy drafts share one controller lifecycle. An unresolved policy
  draft disables content staging/navigation controls that could replace it while
  preserving explicit Resume/Discard; policy pending disables the same controls as
  content pending. Same-context resumed modals still clear any stale opener.

## Accessibility and responsive decisions

- One labelled dialog with the existing single focus trap. Access open focuses the
  dialog; Escape closes only it and restores the **Access** opener. Confirmations
  move focus to their heading; Cancel returns to the initiating row action or
  visibility heading. Success/conflict alerts take focus as in T06.
- Native buttons, radio inputs, selects and links; 44 px minimum targets; visible
  focus tokens; textual Agent/inactive/retained states; no hover- or color-only
  disclosure. Pagination is a real button and status changes use live regions.
- The access modal is full-screen below 768 px and wide on desktop. Rights/actions
  stack without page overflow at 320/375/390/768/1024/1440 px. Long names and
  labels wrap; the compact intro keeps the private-access decision visible without
  consuming the mobile viewport.
- Scoped light/dark semantic pairs, reduced-motion behavior inherited from the
  route, ES default with EN selector and `lang` on the route subtree. Authored
  names/descriptions are not translated.

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

- Frozen install completed. `pnpm check` passed lint, Express-free backend closure,
  process cleanup, 7 identity, 16 workspace, 28 project/task, 19 prototype,
  strict typechecks, production builds (`/projects` static), 17 MCP
  subprocess/Inspector checks and HTTP smoke. Focused policy/page logic remains in
  the merged T07.0 suite.
- Real PostgreSQL/Nest/Next QA used `apps/api/test/project-task-qa.mjs` with
  `--large-members` (fixture mode 0600; no product login bypass, no copied
  cookies/state). The browser exercised the actual API/proxy and disposable DB.

Integrated browser QA (headless Brave/CDP, native viewport captures outside the
repository):

- Owner/admin baseline: private header and automatic-access text; full 107-person
  access page; first page plus Load more; 44 px row action; confirmation focus;
  Cancel returns to the exact row action; Escape returns to Access; focus trap.
- Member/viewer: member lost access after explicit revoke (direct URL 403) and
  regained it after re-grant; viewer could read but saw no edit/access controls.
- Visibility: private→workspace exposed the project to the member; revoking the
  member's retained explicit row while workspace-visible kept effective access and
  said so; private again removed access because the retained row was revoked;
  re-grant restored it. A separately created private project stayed absent from the
  member's list and direct URL; member creation showed read-only workspace only.
- Admin explicit removal: the row kept automatic administrator access after its
  explicit row was revoked; success said “Permiso explícito revocado” and explained
  that automatic access remained.
- Access paging: a stale second-page fetch after another tab changed visibility kept
  the loaded rows, hid the stale Load-more control, and exposed **Actualizar
  lista**; refresh recovered the page and a subsequent next page loaded normally
  (`36`/`37`).
- Conflict: a staged visibility change submitted after another admin changed the
  version produced the side-by-side conflict; explicit rebase focused the
  confirmation and the reviewed retry succeeded.
- Unknown outcome: a blocked access mutation showed pending only while active, then
  no pending label with an enabled plain Retry. In-app navigation to another project
  exposed **Volver al cambio pendiente**; return restored the access modal and the
  same-key retry revoked exactly once.
- Archived: visibility/grant controls were absent, explicit revoke remained, and
  restore returned normal controls. A two-tab stale revoke against the archived
  project produced a 409; Review/Rebase stayed available for the allowed revoke,
  rebase focused the confirmation and the retried revoke succeeded.
- Missing-current conflict: a controlled 409 without `current`/`accessCurrent`
  showed the no-blind-rebase warning with exact-target **Revisar acceso actual**
  and explicit discard; review restored the current-vs-requested compare and
  reviewed rebase affordance.
- Header consistency: a workspace-visible project’s access modal used the generic
  **Proyecto/Project** eyebrow and workspace intro, not “Private project”.
- Assignees: historical unavailable assignee stayed selected and labelled
  “Responsable anterior”; first page was bounded and **Cargar más personas**
  produced 102 options in the QA workspace.
- Auxiliary failures: access and assignee first pages failed independently while
  project/task content and capture stayed usable; each Retry recovered only its own
  collection.
- Content/policy coexistence: with more than 100 tasks, a blocked task-cursor page
  showed the content pager error while the access first page also failed. The
  policy Retry remained available inside Access after closing/reopening, the
  content Retry stayed available outside, and disabling the block recovered both
  independently without clearing loaded content.
- Responsive/theme: 1440/1024/768/390/375/320 px had no page/dialog horizontal
  overflow; measured interactive targets were at least 44 px; ES/EN and light/dark
  were reviewed; final Escape restored Access.
- Final screenshots include `01`–`37` (private header, access panel, confirmations,
  retained/admin rights, changed page/refresh, conflict, unknown/cross-context,
  archive, create visibility, member read-only, historical assignee, paging,
  auxiliary errors, width set, EN/dark, archived-revoke conflict/rebase,
  missing-current review, workspace-visible header and changed-page no-load-more).

## Limits and remaining work

- No full T07/P02/P03/P04/P14/T35 or real-user acceptance is claimed. Invitations,
  guests, project leads, full collaboration and credentials/MCP remain separate.
- Physical touch-device interaction, Safari/Firefox certification, real screen
  reader output and browser 200% zoom traversal were not performed. Width captures
  and measured target sizes are layout/implementation evidence, not WCAG
  certification.
- Access, assignee and content-pager failures were browser-induced; their combined
  content/policy recovery is recorded above. The missing-current 409 branch used
  controlled browser fault injection, not a backend defect; the archived-revoke
  conflict used a real two-tab version race. The fixture used local disposable
  data, not a real project/user or staging environment.
- The Next dev indicator appears in captures; it is development tooling, not product
  UI. QA state/screenshots live outside the repository and are not committed.
- No functional test source, auth bypass, fake API/model, metrics, backend import,
  secrets or deployment was added. The transient app-generated `apps/web/AGENTS.md`
  and dev route-type cache were verified as Next dev artifacts and removed before
  final checks; the synchronized instructions and handoff were not modified.

## T07.0 logic evidence and cleanup

- [PR #17](https://github.com/Ljrr3045/rielia/pull/17) merged 2026-10-29T16:51:39Z
  as `c72831c1be4ca2332a6162adc2af85d529b441b8`; final reviewed head
  `bf9e6fcf`, CI SUCCESS and Kody approval `5701623155`.
- The coordinator verified the logic worktree was clean/settled, preserved the
  external logic delivery report and removed `feat-t07-project-access-logic`
  through Orca. Delegated decisions, contracts and limits remain in
  [project-access.md](project-access.md).

## PR #18 review findings and dispositions

- [Inline 4415985054](https://github.com/Ljrr3045/rielia/pull/18#discussion_r4415985054):
  the access panel kept rendering **Load more** with the preserved stale
  `nextCursor` while `policyPageError.reason === 'changed'`, so activating it
  re-requested the rejected cursor and repeated the failure. The button is now
  suppressed for the changed-version state while the loaded rows, changed warning
  and full **Actualizar lista** remain. A focused real PG/Nest/Next browser run
  induced the stale second page (another tab changed visibility), asserted no
  Load-more button beside the full Refresh, refreshed, then loaded the next page
  successfully; output `CHANGED LOADMORE PASS`, screenshots
  `36-changed-page-no-loadmore-1440.png` and `37-changed-page-refreshed-1440.png`.
  Focused typecheck, lint, production build and document checks pass for this
  presentation-only fix; the changed head needs a fresh coordinator-triggered Kody
  review because a prior-head review does not approve it.

## PR evidence

- UI PR: [#18](https://github.com/Ljrr3045/rielia/pull/18), presentation/docs PR
  opened from `feat/t07-project-access-ui` against `dev`, based on merged logic
  `c72831c`. Final head/checks/review state are recorded in the external delivery
  report and GitHub; this document is not updated merely to append transient
  review state.
