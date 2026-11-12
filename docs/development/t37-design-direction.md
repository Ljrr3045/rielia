# T37 design direction and implementation handoff

**Discovery addendum — 2026-11-11 America/Caracas:** subsequent fresh-session
discovery at `bc2fb2e` loaded the three intended local entries, while also exposing
a preserved-source SKILL.md with broken relative resources. Its non-discoverable
`SKILL.md.txt` replacement preserves source bytes; post-fix fresh verification is
pending. Future dispatches explicitly select local top-level paths and do not
claim an automatic override of global skills. See
[discovery evidence](frontend-skills.md#safe-discovery-and-precedence).
The original research proposal and source/base status below remain unchanged.

**Proposal dated 2026-11-11, America/Caracas.** This translates the authorized
T37 scope into bounded presentation decisions; it is not a final mockup, brand
ratification or measured usability result. Read the [current-source inventory](t37-ui-inventory.md)
for source/base provenance, roles, DTOs, behavior and inherited evidence.
T36 acceptance in [PR44](https://github.com/Ljrr3045/rielia/pull/44) is supplied by
the dispatch. Historical PROPOSED snapshots remain intact.

**Local frontend skill discovery is PENDING.** SOL owns the separate installation
of `frontend-design`, `impeccable` and `ui-ux-pro-max`; the coordinator must arrange
a fresh session that discovers the committed frontend-local paths before visual
implementation. Global availability is not proof. Optional Impeccable engines,
hooks and live-copy Apply are excluded. Skill suggestions remain subordinate to
[product](../handoff/01-product.en.md), [UI/UX](../handoff/04-ui-ux-development-guide.en.md),
[branding](../handoff/03-branding.en.md) and current contracts/policy.

## Recommended composition

Keep one work hierarchy: workspace, project, task, one level of children. Make the
task title and next permitted action easy to find, with comparison metadata aligned
below the view controls. Use rows for work lists, cards only for board items,
and readable sections for detail and administration. Preserve explicit My tasks
and Search entries, current project navigation, and the technical home. Do not add
a dashboard, metrics tiles, greeting area, future navigation or a new default route.

| Decision | Concrete proposal for implementation | Ownership / acceptance |
| --- | --- | --- |
| Work shell | Desktop rail starts at 1024 CSS px; use a roughly 14rem rail and let the work area grow. Header order: workspace/project context, title, primary action, then List/Board and filters. Keep administration secondary. Avoid repeating project identity in several large cards | Astra T37.2/3. Retain existing links/callbacks and one locale/controller; SOL owns any responsive event/focus change |
| Detail fit | Retain the current 1280+ contextual panel threshold, 768-1279 overlay and full-screen detail below 768. Keep title/description first, properties grouped, then relations/checklist/comments/history. Limit description measure to about 65 characters when width permits | Astra T37.4. Recheck useful list width at 1280/1440 and localized long titles; changing mount/trap/return behavior requires SOL |
| Density and spacing | Comfortable default: 48px minimum task row, 44px minimum interactive target, 16px mobile text/input, 14-16px desktop task text, metadata at least 12px. Use 4/8/12/16/24/32/48 spacing; 16px narrow and 24px wide content gutters. Wrap instead of fixed-height clipping | Astra T37.2. These are design targets, not measurements of current UI. No density preference/store is added |
| Typography | Use the existing system fallback consistently; Inter remains a candidate. Page headings 24-32px, section headings 18-20px, body line height about 1.5. IDs use monospace; counters/dates use tabular numerals. Task names remain visually stronger than keys or badges | Astra proposes T37.2 typography. Loading a self-hosted font needs separately reviewed assets/notices and SOL integration; this research installs nothing |
| Surfaces and theme | Use proposed slate background/white or dark slate surface; dividers separate rows, borders define controls. Keep green/teal for primary actions and selection. Success/status have their own semantic names and textual marks, even if colors are related. Reserve shadow for overlays and elevation that explains overlap | Astra T37.2 uses the proposed branding pairs as candidates. Validate real light/dark default/hover/focus/disabled/error states; no final color or license approval. Keep system theme behavior; a persistent theme switch would be SOL scope |
| Controls | Reuse existing native button/link/select/input/checkbox/details behavior, consistent primary/secondary/destructive styling, field label/hint/error placement, status mark, assignee/provenance, pager and feedback panel. Use 8px control and 12px panel radius as proposed starting values | Promote a shared primitive only for demonstrated shared responsibility. No UI package, global reset rewrite or replacement headless library required. SOL reviews interactive primitives and effects |
| Mobile navigation | Keep the current labelled menu/drawer and visible workspace context; expose existing My tasks, Projects and Search links without an invented destination. On narrow screens show the view title, one primary action and Filters. Board uses a native selected-column control with an honest count | Astra T37.3/4. Preserve focus return, inert background, safe-area room and native links. New navigation mechanics, sticky behavior affecting keyboard reach, or route defaults require SOL review |

These decisions apply UXR01 stable work structure, UXR02 card/collaboration
clarity, UXR03 personal/mobile reading, UXR04 understandable board columns, and
UXR06 current-list comparison. They implement UX01-03/05-07/09/11 within existing
P01-P11/P33/P38 and US01-US08/US11-US12/US24-US25 coverage. P09/US06/UX04, UXR05,
T11 and all later views/credentials/landing remain excluded.

## Reference record

Mobbin tools worked on November 11. The observations below come from actual
returned preview images inspected in this session. No competitor images/assets
are copied into the repository. Captures show visual arrangement only; they do
not establish persistence, keyboard behavior, accessibility, permissions or
usability. Unshown flow screens were not inspected.

| Query and inspected result | Visible pattern used | Boundary |
| --- | --- | --- |
| `Linear creating an issue`, web, flow preview positions **1, 3, 5 of 5**: [Creating an issue](https://mobbin.com/flows/b49200b2-cfac-4c16-aae9-55aecdb91d09?tab=screens&utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp) | Stable list/sidebar context; capture dialog places title/description above properties; final preview shows the item in the list. Supports task capture without moving to a separate page | Same flow inspected in November 5/6 roadmap research, freshly re-inspected only at these three preview positions. Do not infer server success or import Save as draft, estimates, labels, cycles or Linear branding |
| `Linear inviting workspace members`, web, preview positions **1, 3, 5 of 5**: [Inviting team members](https://mobbin.com/flows/44413772-2ae1-4a33-85e7-df96010438b9?tab=screens&utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp) | Member rows keep names and status aligned; the invitation form remains over member context; final preview labels invited rows | Use grouping/status placement only. Rielia retains its single-recipient/link/token/role contracts; no email sending, teams hierarchy, batch invitations or new modal lifecycle is implied |
| `ClickUp task list`, web: [Task rows](https://mobbin.com/screens/fcd7d80b-ab9c-4d07-8429-1bd6d77fbc83?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp), [selected rows](https://mobbin.com/screens/fc8a346b-6a8f-46c5-9f46-856389eec373?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp) | Title column carries most width; assignee, due date and priority align for comparison within a status group. Supports current list metadata alignment | UXR06 list comparison only. Do not import the many navigation levels/views, bulk actions, floating selection bar, tags or product colors |
| `Todoist task detail`, iOS, returned **lists**, not detail: [sparse Inbox](https://mobbin.com/screens/ff08723d-19d9-49dd-b38b-4e6a0a1749fe?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp), [populated Inbox](https://mobbin.com/screens/f0a29ccb-611d-4f46-a806-f741c8489ae9?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp) | Task title precedes quieter date/context text; populated list exposes child indentation; add is visible near the bottom | Useful for UXR03 list reading only; no fresh task-detail reference obtained. The sparse screen was also inspected in November 5/6. Do not adopt Todoist completion rules, reminders, floating-button placement or native bottom navigation without web verification |
| `Asana project board`, then `Asana Kanban board`, web: [section setup](https://mobbin.com/screens/f63e21e2-d07e-4752-a856-ae5e6163f013?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp), [template editing](https://mobbin.com/screens/f486a09c-4506-4720-8124-a052e5109115?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp), [home/help panel](https://mobbin.com/screens/fc214162-cbcd-4ca4-ae4f-2f49299053b3?utm_source=codex&utm_medium=ai-assistant&utm_source_platform=mcp) | Inspected and rejected as board evidence: results show setup/templates/home, not the requested working board | Search mismatch, not connector failure. UXR02 continues from approved textual direction and historical reference status; no fresh Asana-board claim |

Carry forward, without fresh inspection, the November 5/6
[Trello board](https://mobbin.com/screens/ff8199fb-ba6c-4460-989c-2a0ba4126ed2)
observation recorded in the [roadmap](development-quality-roadmap.md): named
columns and local creation inform UXR04. Omit its photographic background and
premium views. Other October 24 UXR links retain their original status; this
document does not recertify all references. Plane/marketing reference observations
are not used to broaden this task.

## Surface decisions and implementation order

| Batch | Presentation decision | Required SOL handoff and evidence |
| --- | --- | --- |
| T37.2 foundations | Establish the token/control treatments above first on real existing identity, workspace and task controls. Normalize visual rhythm, wrapping and semantic feedback across both themes before changing whole screens | Review global CSS consumers, actual ancestry and interactive primitive effects. Keep existing controller/lifecycle contracts. Contrast/focus/target measurements plus current-state visual comparisons; no source-map/coverage reset |
| T37.3 identity/workspace/shell | Identity uses a compact session panel, configured provider buttons and plain experimental/return guidance. Keep current bilingual identity copy initially; W/P continue one-language subtrees. Workspace selector/role/owner precede member rows; Agent and invitation administration remain distinct, with permitted actions next to their targets. Keep inbound invitation and generated-link feedback visible near their actions | Preserve token lifetimes, owner protection, admin-only controls, member-version timing, drafts and session recovery. Do not turn the Linear invite example into a bulk/email feature. Any shared locale behavior or modal conversion needs SOL work |
| T37.4 project/list/board/detail | Project title and view controls lead; access/settings/archive stay secondary. List prioritizes title, key/status, then assignee/priority/due date; on mobile metadata wraps below title. Board cards use title, key, assignee and meaningful priority/date, with Move accessible without hover. Show selected task independently of filters. Detail groups properties and separates creator/provenance from assignee | Preserve server counts/filter/pagers, selected-column state, canonical move anchors, captured versions, capabilities and URL return. SOL owns command preparation, forms and interaction handlers even inside TSX. Validate all five statuses and 0/1/large/paged data, not a few attractive cards |
| T37.4 collaboration and recovery | Preserve parent reference/child rows, checklist progress and inline controls, comments with author/edited/date and separate readable history. Keep section-level failures beside their section and one recovery message for the active operation | No change to comment ordering, close semantics, own-author rules, safe Markdown, parent-candidate loading or canonical checklist order. SOL implements/tests the two project recovery proposals below as explicitly scoped changes |
| T37.5 My tasks/search and QA | Use the same task row, status/provenance and detail treatment. Lead with scope/query, then relevant filters and project groups. Keep true-empty, no-match, partial-load and context-limit guidance distinct. Place connection/freshness feedback near the results, not as a save-success signal | Preserve current-assignee semantics, literal query, authorized totals, 1,000-row return cap, clearable inherited assignee, choose-project capture and independent live/deferred state. SOL verifies two-session invalidation, return context and no duplicate detail/trap; Astra verifies the complete daily journey |

For mixed files, the coordinator assigns exact edits before dispatch: Astra owns
JSX composition/styles/copy, SOL owns handlers/state/effects/command construction
and all tests. This includes `projects-view.tsx`, task/workspace forms,
`identity-view.tsx`, shared modal/confirmation helpers and board/move handlers.
Do not infer ownership from a `.tsx` extension or concurrently edit one checkout.
Use [project](project-interactions-extraction.md) and
[workspace](workspace-interactions-extraction.md) owner maps rather than a new
generic abstraction. Each batch requires a separate explicit implementation scope.

## Complete states and recovery copy

Use concise ES/EN copy in the existing dictionaries. Retain controller meanings
and distinguish action feedback from data-read status. The following examples are
proposed wording, not proof that a state has been implemented.

| State | Placement and message/action treatment |
| --- | --- |
| Loading / pending | Reserve the work region and label loading; keep pending action text beside the initiating control. Decorative skeletons stay hidden from AT. Do not replace pending with success before confirmation |
| Empty / no match | True empty offers the permitted next action (first task or choose project). No match explains filters/query and offers their existing clear action. Denied/missing data never becomes an empty state |
| Invalid / save failed | Field error next to its label/input, plus one summary if needed. Retain existing recoverable draft and focus semantics. Do not imply a stored backup or offer a new-key retry |
| Unknown outcome | ES: “No pudimos confirmar el cambio.” EN: “We could not confirm the change.” Explain retained draft and existing Retry/Return/Discard options. Only use this wording when the result is genuinely unknown |
| Conflict | ES: “La tarea cambió mientras la editabas. Revisa la versión actual.” EN: “The task changed while you were editing. Review the current version.” Show the appropriate exact-current review; move/reparent/reorder still needs a new destination |
| Forbidden / revoked / signed out | Explain the state and authorized next actions. Use separate-tab sign-in/return guidance where memory remains. Clear inaccessible scoped rows. Preserve historical authorship only where the record is still authorized |
| Partial / stale / reconnecting | Keep readable authorized rows and explain which page or freshness update failed. Distinguish connection live from refresh deferred. Refresh is a read, not a repeated save |
| Archived / read-only | Visible textual state near the title; allowed Restore remains distinct from Edit. Keep attribution and readable content. Do not use disabled controls to imply actions unsupported by current capabilities |

Two proposed T37.4 recovery changes must be assigned to SOL with regressions:

1. **Confirmed project write, follow-up read 503:** keep confirmation visible and
   separately state “El cambio se guardó. No pudimos actualizar la vista.” /
   “The change was saved. We could not refresh the view.” Offer read recovery,
   without inviting duplicate mutation. Test target/outcome binding, one mutation
   only, failed/successful reload and navigation/session clearing. The current
   PR42 baseline hides success; this proposal deliberately changes that behavior.
2. **Project mutation 403:** explain denial when the form disappears, retain only
   safe recoverable local intent under current authorization, and give a valid
   focus/recovery destination. SOL must specify and test authorized versus revoked
   data visibility, Return/Discard availability and reauthorization; a design
   request does not authorize showing private fields after access loss.

**Workspace writes already retain success after follow-up read 403/503.** Preserve
that observed behavior with a separate regression; do not describe it as the
project defect or copy the project recovery state machine into workspace forms.

## Future evidence matrix

All entries below are **required future checks**, not results of this research.
Bind captures and behavioral evidence to the exact implementation head/build,
role, data, language, theme and viewport. Reuse inherited evidence as a baseline
with its original labels; new acceptance needs evidence of the changed surface.

| Coverage | Representative journey and pass condition | Owner / honest limit |
| --- | --- | --- |
| 320 / 375 / 390 CSS px | ES/EN and both themes: menu, select workspace, create/edit task, move without drag, comment, search, return and recovery. No whole-page horizontal overflow; 44px targets; 16px inputs; selected board column and full detail remain usable | Astra visual/native interaction, SOL functional integration. Browser viewport emulation is not a physical phone |
| 768 / 1024 / 1440 CSS px | Collapsible versus persistent rail, overlay versus contextual detail, keyboard board scroll, long rows/access forms and independent page errors. At 1024 do not force a cramped split detail; at 1440 retain useful list context | Astra composition; SOL media/effect/focus integration. Also inspect threshold crossings around 768/1024/1280 if changed |
| Landscape / reflow / 200% zoom | Short-height landscape, reflow to 320 CSS px and actual desktop browser 200% zoom. Reach dialog actions, menus and detail close without clipping; local code/board scroll does not force page overflow | Record actual browser zoom separately from viewport resizing or doubled root font. Physical keyboard/safe-area/OS virtual-keyboard evidence remains pending unless explicitly exercised |
| Keyboard / focus / AT | Tab/Shift+Tab, native selects/Move alternatives, consumed nested Escape, single trap, opener/fallback return, guarded navigation, result focus without background refresh theft. Labels, errors and announcements remain meaningful | SOL tests behavior; Astra observes native flows. Automated semantics do not establish screen-reader behavior; manual AT/browser/version must be recorded separately |
| Theme / motion / content stress | Both actual theme pairs across normal/hover/focus/pending/invalid/denied/disabled states; normal text at least 4.5:1 and visible control/focus contrast; reduced motion. Long ES copy, names, keys, unassigned/Agent/historical assignees, long Markdown/URLs and paged data | Astra component measurements and captures. Proposed token pair calculations alone are not interface-wide WCAG evidence |
| Persistence / permission / recovery | Disposable local PostgreSQL/Nest/Next create/edit/move/comment/checklist/privacy/search; viewer/archived/admin/Agent boundaries, two sessions, access revoke, replacement/logout, 409, unknown outcome exact retry, both project debts and workspace retained success | SOL owns tests, real API/persistence/security evidence and applicable CI. Screenshot or HTTP fixture cannot prove database writes/atomicity |
| Isolation / regressions | `/identity`, `/workspaces`, `/projects`, technical `/`, fictional `/prototype`, default not-found/error presentation; verify shared-style consumers without promoting prototype or changing home routing | Astra appearance, SOL functional boundaries. Do not add branded error routes or product redirects implicitly |
| External acceptance | Physical devices, mobile Safari/Chrome, desktop browser versions, screen readers, real people, real OAuth/HTTPS/provider/staging | Maintainer/QA/product schedule these; OPEN/DEFERRED until performed. No credentials or staging requested now; no WCAG certification claim |

T37.6 coordinator acceptance follows the bounded visual/state review, SOL parity
evidence and current-head CI/native Kilo/ownership gates. Source-map/null/implicit
branch/type-only and zero-unit coverage debt stays with SOL quality maintenance;
it neither disappears nor blocks this design brief. T11 follows accepted T37.
