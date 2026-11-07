# T36 stable UI contract — closure proposal

Status: **proposed T36.6 closure**, not acceptance or a fresh app/audit run.
Agreed implementation is delivered through [PR41](https://github.com/Ljrr3045/rielia/pull/41),
[corrected PR42](https://github.com/Ljrr3045/rielia/pull/42) and
[PR43](https://github.com/Ljrr3045/rielia/pull/43), merged at
`05e9defe645ed9c238f61c5be00ed9c67f50f56d`. This closure still needs current-head
CI/native review, merge and explicit coordinator acceptance. T37/T11 have not
started; no frontend skill is installed or visual redesign made.

Scope follows the [quality roadmap](development-quality-roadmap.md), existing
T05–T10/T35 foundations, P01–P11/P33/P38, US01–US08/US11–US12/US24–US25,
UXR01–UXR04/UXR06 and UX01–UX03/UX05–UX07/UX09/UX11. Full T01–T35 acceptance
is not implied; UX04/sprints and later features remain deferred. The immutable
handoff, existing wire names/error codes, server policy and runtime pins govern.

This inventory binds current source/behavior for migration; it does not claim
direct browser evidence for every cell or complete product/a11y acceptance.

## Current surfaces and intent contract

| Existing surface | State, data and user intents to preserve | Current owners and evidence |
| --- | --- | --- |
| `/identity` | Loading/disabled/unavailable/signed-out/configured providers/signed-in; explicit check/sign-in/sign-out, pending and cancellation/retry feedback. Only configured providers appear. Separate-tab sign-in plus return/Refresh preserves another tab's memory-only work; no real-provider acceptance is implied | `identity/page.tsx` → props-only `identity-view.tsx`; `use-identity.ts`, `identity-controller.ts`, `identity-client.ts` and same-origin proxy. [Presentation](identity-ui.md), [experiment](identity-spike.md) |
| `/workspaces` entry | Create/select/clear, authorized paged workspaces, current role/owner and selected workspace outside the loaded first page. Loading/disabled/signed-out/empty/ready/forbidden/error remain distinct. Existing draft hydration, trimming, validation and confirmations keep their timing | One `workspace-view.tsx`/`use-workspaces.ts` lifetime; `workspace-entry.tsx`, `use-workspace-screen-actions.ts`, `workspace-screen-model.ts` and shared `workspace-ui.tsx`; canonical controller/client/proxy. [Extraction](workspace-interactions-extraction.md), [UI](workspace-ui.md), [logic](workspace-flows.md) |
| Workspace membership/Agents | Human role/state/removal and owner protection; Agent registration with allowed role and active human custodian, state/custodian confirmations. Principal state differs from membership state; custodian is not an authority donor. Existing row keys/version timing are preserved, not standardized to project-form timing | `workspace-members.tsx` and `workspace-agents.tsx` consume public command/capability DTOs; canonical `WorkspaceService`/`PrincipalService` retain policy. The obsolete admin module is removed |
| Invitations | Explicit create/copy/Done/revoke/Accept/Dismiss, independent pagers and received-token versus generated-link lifetimes. Inbound `#invitation` is captured into hook/controller memory and removed from the current history entry; no acceptance on arrival. Done clears only the generated link; copy failure keeps the manual-copy field | `workspace-invitation-location.ts`, controller, `workspace-invitations.tsx` and `workspace-feedback.tsx`. Tokens/keys/drafts are not persisted or logged by the UI |
| `/projects` shell/project administration | Workspace/project rail and mobile drawer; create/settings/archive/restore/active/archived; capability-driven visibility/access entry. Retain no-workspace/empty/loading/denied/error states and exact target/author/candidate projections | One `useProjectTasks`; PR42 `project-shell.tsx`, `project-work-area.tsx`, content model/forms and controlled effects; [project UI](project-task-ui.md), [access UI](project-access-ui.md) |
| Project access/assignees | Automatic active-human administration disclosure, explicit versus effective access, paginated human/Agent rows and eligible assignees. Grant/revoke/visibility confirmations use server consequences; archived grants/visibility stay frozen where required, explicit revoke remains available. Historical unavailable assignee remains labelled | `project-access.tsx`, `task-forms.tsx`, canonical controller/transport/contracts and backend policy. Exact target-current review before access rebase; pager errors remain independent |
| Task list/board | Default list, semantic five-status board, server counts/filter/paging, quick/column capture without automatic assignment. Native status select and before-task/end-of-full-column menu remain drag alternatives. Missing/changed column pages are unavailable, never zero; no fabricated sum or canonical order | `task-view-bar.tsx`, `task-list.tsx`, `task-board.tsx`, `task-move.tsx`; PR42 workarea/forms/result-focus owners; [views contract](task-views.md), [UI](task-views-ui.md) |
| Task detail/forms | URL-addressable contextual desktop panel, tablet overlay/full mobile detail, safe Markdown/properties, immutable creator/source/Agent provenance distinct from assignee. Editable fields and actual form keys/mounting stay exact. Dismissal retains a staged draft; explicit discard clears it | `task-detail.tsx`, `task-description.tsx`, `task-forms.tsx`, PR42 content dialog/model/forms/navigation/DOM owners. No client author/policy or second task store |
| Collaboration | Independent relations/checklist/comments/history and their idle/loading/empty/ready/error/changed/pagers. Server-filtered parent candidates load only on demand; child creation returns to parent. Closing parent warning rechecks child revision; checklist uses canonical anchors/two-step remove; own-author comments require current exact-comment/full-checklist review as applicable. History is read-only | `task-collaboration.tsx` plus relation/checklist/comment/history leaves and five explicit collaboration projections; backend collaboration service and `task-collaboration-state.ts`. [Logic](task-collaboration.md), [UI](task-collaboration-ui.md) |
| My tasks/Search | Explicit scope links, current assignee rather than creator, literal ID/title query, project-grouped authorized pages, server totals and existing filters/archive context. No workspace-wide assignee catalog or cross-project create command. Detail/Back/Refresh retain exact context only when its authorized revision/total still match | `task-discovery.tsx`, PR42 shell/workarea/recovery/navigation, `project-task-controller.ts`, discovery/events backend. [Logic](task-discovery.md), [UI](task-discovery-ui.md) |
| Shared/diagnostic | ES/EN subtree language, light/dark/reduced motion, native controls, meaningful feedback and error/not-found. `/` stays the technical fixture; `/prototype` stays a separately labelled memory-only demo. No marketing home, sprint/calendar/report/credential placeholder becomes productive | `layout.tsx`, `globals.css`, route styles/strings and isolated prototype adapter. Auth/API routes are SOL protocol boundaries, not T37 presentation work |

Canonical project selectors remain `/projects?workspace=W&project=P&task=T`,
plus controller-validated `projectsView`, `tasksView`, `taskLayout`, `status`,
`assignee`, `priority` and `column`. Discovery uses explicit `taskScope=mine|search`,
`q` and `searchProject`; bare `/projects` keeps first-project behavior. Native
links preserve modified-click/new-tab semantics. Query/selector validation and
history are controller-owned; JSX must not introduce a competing parser/store.

Discovery retains its existing maximum 1,000-row memory-only return context.
Account/workspace/denial/reset fences clear or revalidate it; a changed authorized
revision drops old pages. Counts are never inferred from the visible rows. A
stream can be live while refresh is deferred; connection is not freshness proof.

## Shared lifecycle, version and recovery boundaries

- Preserve one controller and one locale lifetime per screen. Same-human session
  replacement still changes execution context; stale requests, old streams and
  sibling callbacks cannot repopulate the new session/workspace. Preserve abort,
  generation/controller fencing, reset clearing and blocked-refresh last-release.
- Drafts/keys/tokens are memory-only. Session loss/another-tab sign-in guidance
  is distinct from another-account clearing. A reload is not a draft backup.
  Unresolved content/policy/move/collaboration work shares the existing controller
  protocol; local form owners cannot replace it or invent another key/target.
- Project forms capture the target and expected version when opened/staged and
  retain them across same-target refresh. Unknown outcome Retry uses the exact
  original payload/key and scope; Return first restores off-context recovery.
  Pending duplicate submissions are blocked; background reads never resubmit,
  discard or silently rebase captured work.
- Access conflict adopts an explicitly reviewed exact current target. Move and
  parent/reorder conflict require deliberate fresh destination selection; parent
  close acknowledgment does not close children. Workspace controls retain their
  current loaded `member.version` command construction on edits and confirmation
  and version/state/role-based remount keys; do not infer earlier capture timing.
- Guarded workspace navigation restores the old URL before destination reads;
  Stay restores the form/draft, Discard removes local state and cannot undo an
  accepted server write, and Discard stays disabled while pending. Exactly one
  guard/content trap is active; discovery/project detail composition is exclusive.
- Media listeners and focus cleanup retain registration order and current callback
  semantics. Shared nested body locks restore the original overflow after the last
  owner. Modal/detail/drawer focus traps, nested consumed Escape, opener fallback
  and result focus retain actual mounting and cancellation; background refresh
  does not steal deliberate outside focus.
- Feedback has one controller recovery discriminator and the existing home, with
  independent collection errors retained. PR42's observed baseline debt is explicit:
  mutation 403 removes the form and offers Refresh/Workspaces; confirmed success
  followed by project-read 503 hides visible success and offers Load again/
  Workspaces, without automatic mutation resubmission. Preserve this accepted
  structural baseline; any later recovery UX change needs T37 scope and tests.
  Workspace confirmed writes instead retain visible success after follow-up read
  403/503, with cleared scoped rows and distinct explanations. Preserve that
  independently observed behavior rather than imposing project feedback on it.

The backend remains canonical: current authorization before replay/receipt,
workspace/project consistency, immutable authorship versus assignee, transaction/
lock/query order, expected-version/request-hash idempotency and awaited activity →
outbox → receipt remain within existing feature services and PrincipalService.
Unit/browser fixtures cannot establish those SQL/atomicity/security properties.

## CSS consumers and ancestry debt

| Family | Frozen consumer/ancestry boundary | Owned follow-up |
| --- | --- | --- |
| Global/identity | `layout.tsx` loads `globals.css`; fixture and identity controls consume global tokens/classes. Keep identity focus/status semantics and fixture/prototype isolation | Astra T37.2/T37.3 presentation with SOL integration/logic after accepted T36; no broad shared reset migration |
| Workspaces | `workspace.module.css` remains rooted in `.shell` with scoped resets/controls/tokens, focus-visible and current form/card/confirmation ancestry; existing strings/locale singleton remain local | Delivered PR43 proves exact emission/order, ancestry and native flow parity. SOL owns behavioral integration; Astra T37.2/T37.3 owns scoped visual work; retained cohesive CSS remains explicit debt |
| Projects shell/detail/forms/recovery | `projects.module.css` remains under `.app`; shell/workarea/render factories add no DOM wrappers. Preserve root resets, modal-layer/modal/detail ancestry, feedback descendants, inertness, body-lock and breakpoint/overflow relationships | Astra T37.2/T37.4 presentation with SOL behavioral integration; no mandatory family split or file-size quota; explicit consumer debt remains |
| List/board Move | `.taskRow .moveMenuPanel`, `.boardCard .moveMenu` and its open/summary/panel descendants depend on actual row/card/footer ancestry; desktop row panel is absolute while card/narrow panels remain in flow | Astra T37.4 presentation and SOL move/keyboard logic preserve connected styles, native alternatives and local scrolling; no class-search-only extraction |
| Discovery/collaboration | Existing discovery groups/details and relation/checklist/comment/history descendants consume the same project module/theme tokens; safe Markdown nodes/code scroll locally | Astra T37.4/T37.5 presentation with SOL logic/tests; no duplicated detail/trap or independent canonical store |

PR42 reuses the retained BEFORE build `xiokvhnTJbbHM4SpTsbJf`; actual AFTER build
`-q-Zrv3gK2KajB3sK7iT_` has four byte-identical emitted CSS files, identical project
entry CSS and actual HTML order (global `efd33ab7`, then project `6857b04`).
Expanded JSX ancestry and connected browser styles support this bounded parity;
there are no invented BEFORE screenshots or universal pixel/accessibility claims.
PR43 workspace BEFORE remains the actual `89316c4` capture on build `-q-Zrv3gK2KajB3sK7iT_`,
reused through exact source binding rather than relabelled as a merge capture.
AFTER `nbS-P6wEpvwQK1PQi8-K8` preserves four emitted CSS files and global→workspace
order (`efd33ab7`, then `ea9e16e7`). Six paired behavior/computed observations and
24 AFTER-only ES/EN/theme/reduced-motion viewport observations are recorded with
retained capture/sandbox/metadata diagnostics in the [workspace guide](workspace-interactions-extraction.md).

## Delivered implementation evidence

| Scope | Accepted evidence | Explicit limit |
| --- | --- | --- |
| Tooling/format | Pinned format/lint/staged/commit/CI policy, all-source numerical gates and 242/242 eligible maintained inputs; [inventory](formatting-inventory.json) | Legacy Markdown/manual formats and generated/vendor/immutable exclusions retain owners; no universal conformity claim |
| Backend | [Values/policy/DTO](project-values-policy-extraction.md) and [reads/commands](project-flow-extraction.md), 216 API cases; retained facade/transaction/query/lock/await/runtime closure | Other services/variants retain coupling/unit debt; no universal repository rewrite or full T01–T35 closure |
| Project frontend | Corrected PR42 head `3b3c18cdd5020960b9024883aa6d62fca27de894`, merged `3fb40583dc0a212faf7d38e02348565df729bf78`; 138 web/380 total over 118 inputs and retained finite/native/CSS proof | Historical 136/378/049 is superseded for current accounting; partial-board/device/AT/persistence limits remain |
| Workspace frontend | PR43 head `7404d4175d990223298e0da2a1c1f99ffee6bc7f`, merged `05e9defe645ed9c238f61c5be00ed9c67f50f56d` at 20:54:55 UTC; B retains 380, C reaches 145 web/387 total over 124 inputs (68 web) | [Covered/zero/new-unit/null ownership](workspace-interactions-extraction.md) remains phase-specific; fixtures do not prove persisted security/replay |
| Current gates | API L782/1491 S859/1637 F202/416 B645/1228, L/S/F/B floors 5244/5247/4855/5252 basis points, baseline `6c2e0399…bfca59`; web L1567/3793 S1734/4269 F323/1051 B1588/5192, floors 4131/4061/3073/3058, baseline `15fd5321…b36fc35` | Eight manifest keys, all-source/per-file/nonregression gates and type-only N/A/unknown precision remain mandatory. Seven unrelated baselines are unchanged; 7 contract/19 prototype cases remain separate |
| Hosted implementation | [Run 42412029803/job 128522082738](https://github.com/Ljrr3045/rielia/actions/runs/42412029803/job/128522082738) passed full PG/security/runtime/Docker checks at 20:46:14 UTC; artifact 13590385764 digest `149284d8c94bcaa30233cacc4ef72a66b470cdb58ea3789701a801be6c365f9d`, all 17 reports byte-exact C | This is implementation-head evidence; this later documentation head requires its own CI/native/merge/coordinator decision |
| Native implementation | [PR43 summary](https://github.com/Ljrr3045/rielia/pull/43#issuecomment-6712870408), check 128524600753/App 2193792 completed at 20:52:36 UTC, NoIssuesFound/Merge, 19 files/zero threads | Native check success is not a fabricated formal approval or acceptance of a different head |

Physical devices, OS virtual keyboard, screen-reader/AT, cross-browser
certification, real 200% desktop browser zoom and real-person usability are not
claimed. Enlarged root text and touch emulation are separately labelled. Real
OAuth/HTTPS callbacks/provider/staging/user scheduling remain OPEN/DEFERRED;
do not request credentials. WCAG 2.2 AA, 44px targets and contrast remain goals
and retained guidelines, not certification from screenshots or unit coverage.

## Owned debt and final decision

| Debt | Owner role and bounded existing follow-up |
| --- | --- |
| Cohesive CSS families/ancestry above | SOL behavioral integration; Astra T37.2–T37.5 scoped visual/token work after accepted T36. No arbitrary split required |
| Project 403 form-removal/read503 hidden-success feedback | Astra T37.4 interaction design with SOL logic/regression cases; preserve the accepted baseline until authorized changes |
| Unexecuted variants and remaining backend coupling | SOL ongoing T36 quality maintenance and scoped T37 functional work; retain every maintained zero unit and add behavior cases when affected |
| Source-map/null/implicit/empty endpoints and type-only N/A | SOL tooling/provider owner under continuing T36 maintenance; linked formatting/extraction inventories bind exact losses. No fabricated columns, dropped source or provider-wide waiver |
| Moderate tooling exposure | SOL tooling owner/coordinator; [official refresh and separate CI counts](unit-coverage.md#final-t36-advisory-recheck-and-conditions) record the pre-acceptance recheck. Recheck at provider refresh; source-symlink/file/size/depth/artifact/deadline guards are conditions, not patches |
| Device/AT/user/provider/staging and full T01–T35 | Maintainer/product/QA under existing deferred scope; no credentials, date or compliance result invented |

Current workspace raw unknowns 162→163→163 and 797 normalized null endpoints remain
bound in finite evidence. Earlier formatting/API precision losses remain explicitly
owned in their linked guides, without a blanket future exception. The stable
contract consolidates bounded semantics/debt, not a universal accessibility audit.

The coordinator must bind this proposed closure head to successful current-head
CI/native Kilo, required ownership/core protections, resolved findings, merge and
an explicit T36 decision in its delivery PR. Earlier green checks do not accept
another head. This proposal alone does not close T36. T37.1 skill adoption/research
and Astra redesign require separate scope after that decision; T11 follows T37.
