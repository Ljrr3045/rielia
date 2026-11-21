# T11.4b sprint presentation checkpoint

Status: **IN PROGRESS, approved numerical migration and normal replay complete;
bounded SOL frozen-head recovery/persistence evidence recorded; Astra integrated
responsive/accessibility QA pending; no PR or product acceptance**.
Base: accepted T11.4a merge `a2de3bd79596cb83b79287f105f60fedfb35bea9`.
The [client guide](sprint-client.md#t114a-acceptance--2026-11-20-caracas--november-21-utc)
records PR54 acceptance and its review/hash limits. T11.5 and full T11 remain
open; planned [T38](https://github.com/Ljrr3045/rielia/issues/53) follows full T11.

Scope: T11/B1c, P09/US06; affected P05/P08/P10/P33, US05/US08/US12;
UXR01 and UX01/03/04/05/07/09. Existing T37 project shell, tokens, locale and
modal controls govern. The dated Astra handoffs below introduce presentation
ports only; the current SOL integration section records production wiring and
functional tests. No new backend policy, API, dependency, prototype state,
T12/T13, T22 chart/report, landing or deployment is introduced.

The earlier checkpoints below retain their original evidence limits. The current
production integration section at the end supersedes their pending wiring status.

## Initial presentation and typed ports

All new source is under `apps/web/src/app/projects/sprints/`. Components render
public DTOs and emit explicit user intents. They are not yet imported by the
production route. Keep them inside the existing `projects.module.css` `.app`
ancestry and `LocaleProvider`; use the existing `ModalFrame` for protected forms.
No second locale, focus trap, identity owner or task store is added.

| Owner | Contract supplied to the integration owner |
| --- | --- |
| `sprint-workspace.tsx` | `SprintWorkspace` takes canonical `SprintPage`, selected ID/detail, disabled/loading flags, guarded select/paging callbacks and nullable create/settings/edit/start/close callbacks; children host scope/history/results. `SprintScope` takes canonical visit page, authorized task labels and task/paging callbacks. `SprintTotalsView` renders only server totals; it explicitly identifies top-level accounting. `SprintNotice` renders localized status copy plus supplied recovery controls. |
| `sprint-forms.tsx` | `SprintFieldsForm` takes `SprintFields`, captured zone, localized field errors, disabled/pending flags and raw `(field, string)` changes. `SprintSettingsForm` accepts string fields for mode/zone/comma-separated scale; it does not parse or validate. Both take `FormEventHandler<HTMLFormElement>` and cancel callbacks. |
| `sprint-task-planning.tsx` | Canonical task planning/history with independent nullable edit callbacks and nullable `SprintEstimateFormPort` / `SprintParticipationFormPort`. Forms take raw strings, authorized options, disabled/pending flags, errors, feedback and explicit submit/cancel handlers. Null ports show no mutation form/buttons; SOL owns capture-before-edit and conversion. |
| `sprint-close-review.tsx` | `SprintCloseReview` takes raw destination, authorized destination options, canonical preview, separately supplied reviewed-destination label, disabled/confirmDisabled/pending flags, and explicit preview/confirm/cancel callbacks. `SprintClosedResults` renders frozen closure totals and outcome snapshots, independent of current task status. |
| `sprint-copy.ts`, `sprints.module.css` | ES/EN copy, responsive feature styles, existing semantic theme tokens; no new assets/packages. |

End dates are visibly exclusive; no date subtraction, UTC conversion or new
scheduling rule is introduced. The preview displays `pendingParticipants`
separately from top-level `totals.pending`; visible rows never determine a close
decision. Outcome labels are secondary current authorized task labels, not frozen
title snapshots (the public snapshot has no title); missing labels retain IDs.

## Required SOL integration, serially in its own checkout

1. Add one controlled composition owner beside the existing `useProjectTasks()`
   in `projects-view.tsx`; mount `useProjectSprints(projectPort, selection)` with
   that owner's session/status/selection/refresh/invalidation port. Use existing
   shell/work-area/dialog owners, not a second route or fixture. Define/validate
   URL representation and preserve modified links, task-detail return and focus.
2. Coordinate every project/workspace/view/task/sprint navigation with both
   owners' draft/pending/unknown guards. Keep the latest blocked intent without
   automatic submit. Session/context replacement must hide all former private
   content before effects; do not mount these data views for inactive/verifying/
   signed-out/forbidden states. A notice alone is not a security boundary.
3. Stage before editing to capture versions; own string parsing, scale options
   (including retained off-scale estimates), validation/error localization,
   `preventDefault`, command preparation, dirty/cancel behavior and focus on
   validation failure. Pass final disabled flags including pending/recovery/
   stale/denied state. Nullable action callbacks reflect actual server capabilities,
   including Kanban and archived contexts; do not infer rights from state labels.
4. Wire resource initial/error/changed/stale/paging and mutation feedback with
   explicit reload, exact-key retry, comparison/rebase and local-discard controls.
   Signed-out recovery must use parent identity verification, not blind sprint
   refresh. Confirmed success remains distinct from a failed subsequent read.
5. Close selection only edits the raw field. Explicit Get preview calls the
   accepted preview method with the chosen destination; reviewedDestination must
   describe the preview binding, not the newly edited field. Gate confirmation
   with fresh matching server preview/capability and stage/submit explicitly.
   Invalidated close decisions require discard/new preview, not rebase. Unknown
   close retries retain the original binding/key. Complete destination paging and
   preview consequence paging can be supplied through the close component's
   children slot. Never use loaded-row counts as total pending work.
6. Integrate the review/history/navigation presentation ports completed below,
   including source-specific resource recovery. Production compositions remain
   unfinished; coordinate any additional presentation ports with Astra. Closed views use immutable results,
   not live scope as a substitute. Keep existing task detail available for explicit
   estimates/scope assignment and preserve public canonical task identity.
7. Add meaningful component/real-hook/integrated regressions and all-source
   coverage measurement before the single completed Draft PR. Nine presentation
   TS/TSX runtime inputs plus three SOL contract owners now enter the web denominator.
   No baseline/floor/exclusion/test change or numerical acceptance occurs here.

## Checkpoint evidence and limits

The actual turn verified `gpt-6-astra` / `high`, `auto_review`, `on-request`,
`workspace-write`, fresh cwd `apps/web` and clean accepted base. The injected
catalog and explicit reads selected this checkout's three local
`.agents/skills/{frontend-design,impeccable,ui-ux-pro-max}/SKILL.md` entries.
The global duplicate did not override the explicit local choice. Existing T37
reference decisions were reused; no fresh competitor-image inspection is claimed.
Only the reviewed read-only UX search ran; no Impeccable engine or setup ran.

Frozen install reused pinned bytes. Narrow source Prettier and root-config ESLint
pass; contracts build, route type generation and web TypeScript check pass.
No functional tests, coverage gate, production build, backend/PG/security/runtime
or full `pnpm check` is claimed for this unintegrated checkpoint. These remain
completed-batch gates under SOL/coordinator ownership.

A disposable Next development harness rendered the actual components with
explicit illustrative DTOs and intent-only callbacks, without API/persistence/
authorization emulation. Native Orca inspection covered 390 ES dark scope,
1440 EN dark scope, 1280 EN dark metadata form, 320 ES dark close review, and
320 EN light/reduced-motion metadata/settings/task-planning/frozen-outcome views.
Long task/sprint names wrapped. Observed 320/390 page widths had no horizontal
overflow; 320 fields were 16px and inputs 44px high. At 320 the existing modal
focused destination, Shift+Tab remained inside, Escape closed it and restored
Review closure focus. Raw name editing updated the harness input only. Empty,
forbidden and unknown notice text was inspected as isolated rendering, not actual
denial/recovery behavior. The harness intentionally allowed independent status
and action props; captures do not certify capability gating or private-data fences.

Eight opened PNGs, the discarded harness and hashes are retained locally in the
ignored `apps/web/coverage/t11-presentation-checkpoint/`. Scope captures precede
the final top-level-total qualifier; the final 320 frozen capture includes it.
The preview route was removed and its server/tab stopped. Next's initial security
notice stopped the first server; the unchanged retry worked. The recommendation
for a separately approved security upgrade remains; no upgrade/suppression ran.
An initial underscore-prefixed private preview route returned 404, corrected only
in the disposable harness. Auto-generated AGENTS/next-env edits were restored. After removing the harness,
the first final typecheck found stale duplicate development route declarations;
removing only the stopped preview server's generated `.next/dev/types` and using
fresh production route types corrected it, and the final web typecheck passed.

Remaining acceptance: actual integrated shell widths 320/390/1280/1440, ES/EN,
keyboard/touch/zoom/AT/device, field errors, all resource and mutation states,
focus/return across composed overlays, navigation/draft guards, reauthentication,
real persistence/failure/concurrency/close/history journeys, full gates and review.
A screenshot or fixture callback does not close any of those checks.


## SOL functional-contract checkpoint — 2026-11-20 Caracas / November 21 UTC

The coordinator-authorized integration checkout started clean at accepted
`a2de3bd79596cb83b79287f105f60fedfb35bea9` and fast-forwarded to Astra's original
`b6c1faa2dca57cb1453540be9b4045b35d36e937`, preserving its author and commit.
The active turn verified actual `gpt-6.1-sol` / `xhigh`, `auto_review`,
`on-request`, `workspace-write` and cwd `apps/web`; no other worker was started.
This is a **dormant functional-contract checkpoint at the missing-presentation
boundary**, not production integration or T11.4b acceptance. Existing presentation,
CSS, controllers, transports, shell and route behavior are unchanged.

New SOL-owned contracts under `apps/web/src/lib`:

| Owner | Behavior and presentation handoff |
| --- | --- |
| `sprint-screen-model.ts` | Projects exact verified parent/controller identity and loaded Project before exposing resources, drafts/recovery feedback or actions; hides during loading/error/denial/replacement/expiry. Task planning also requires matching selected canonical Task. Action availability consumes fresh public capabilities. Supplies `SprintStartReview`, `SprintConflictReview`, `SprintHistoryPort`, `SprintCloseReviewBinding` and `SprintNavigationReviewPort`. |
| `sprint-form-state.ts` | `beginSprintForm` stages before editing, capturing original concurrency preconditions. Raw fields retain null versus zero and canonical off-scale options. Public validators and field error discriminators prepare explicit submit; no date/time-zone policy is reimplemented. Source participation versions are captured at opening; an explicit target read precedes target conversion. `submitSprintForm` cannot replace pending/unknown commands, rebase or retry automatically. |
| `project-sprint-location.ts` | Additive `/projects?workspace=…&project=…&projectView=sprints&sprint=…` representation; sprint selection may be absent. Existing task/filter/layout parameters survive, including `task` for contextual detail and return. Scalar/ID/orphan/discovery errors are rejected. Serializer emits a real href without navigation, preserving native modified-link handling for the later composition. |

The projection is a contract for conditional mounting, not an implemented render
fence in `ProjectsScreen`. The existing production screen does not import these
owners yet. Form buffers must be held inside the eventual single integration
owner, hidden during verification and cleared on confirmed identity/context loss
or original expiry; the accepted hook retains its existing verification behavior.
No second session fetch, SSE connection, hook instance, store or task copy exists.

### Concrete missing presentation requested from Astra

- Start review must display the captured `SprintStartReview` (goal, local dates,
  exclusive end, captured zone, canonical totals and preconditions) in the existing
  `ModalFrame`, with explicit confirm/cancel and stale/review feedback. Capture
  this review when opening; later reads cannot silently replace that decision.
- Sprint and Task planning history consume `SprintHistoryPort` and the complete
  public `PlanningHistoryPage` items, including effective actor/provenance,
  initial/error/changed/stale/paging states and independent reload/load-more.
- Conflict comparison consumes `SprintConflictReview`: editable captured command
  and authorized current DTO remain separate. `canRebase` stays false until an
  explicit canonical refresh; close decisions instead require discard/new preview.
- Blocked navigation renders `SprintNavigationReviewPort` for both owner guards.
  The destination URL is the latest requested intent. Pending has no discard;
  unknown recovery explains that local discard cannot undo a possibly committed
  write. SOL still owns interception, Back reconciliation and callbacks.
- Task planning needs a read-only data/history composition with **no mutation
  form/buttons** when the corresponding callbacks are absent. The current imported
  `SprintTaskPlanning` always renders both forms, so disabled flags alone do not
  meet this contract. Preserve its visual system while adding nullable form/action
  ports and explicit edit/cancel affordances for capture-before-edit lifetimes.

These are requested typed presentation seams, not dead production controls.
Destination/preview consequence paging, source-specific recovery/error controls,
validation focus and composed modal focus/return still need integration and QA.

### Focused verification and remaining gates

Both frozen installs (workspace and isolated unit tools) reused the existing
store without downloads or pin/lock changes. The first attempted focused command
triggered pnpm's automatic dependency install in the empty checkout and was
stopped after sandbox DNS failures; it is not test evidence. Explicit authorized
frozen installation corrected that prerequisite.

The final focused run passes **110/110**, no skips: 59 retained controller cases,
20 retained real-hook cases (including both PR54 corrections), 28 new screen/form
contract cases and three new URL cases. New witnesses exercise verified-context
projection, read-only capabilities, source/version capture, invalid raw fields,
null/zero/off-scale, explicit target reads, complete canonical start totals,
reviewed close destination, stale decisions, 401 parent verification, 409
refresh/compare/rebase and same-body/key unknown recovery. Boundary HTTP/browser
doubles provide no SQL/persistence/native accessibility or production-render credit.
The 31-case unmodified control also passes in a disposable copy; deliberate
removal of the session fence, substitution of the reviewed close destination and
blank-estimate conversion to zero each fail the expected assertions. Only copied
source is mutated and the scratch copy is removed. These witnesses strengthen
the contract tests without claiming production composition proof.
Contracts build, scoped root-config ESLint/Prettier, adopted `pnpm format:check`
and web route-types/TypeScript pass. Local ignored evidence and source/test/baseline fingerprints are retained
under `apps/web/coverage/t11-integration-contracts/`.

No numerical baseline is written or proposed here. The accepted current-web hash
remains `e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c`.
Five imported presentation runtime inputs plus these three new functional owners
must all enter the final all-source denominator. Full `pnpm check`, all-source
measurement/approved migration/normal gates/infrastructure/artifacts, real local
PostgreSQL/Nest/Next integrated journeys and native integrated QA remain pending
for the completed batch. No services were started for this checkpoint. No push,
PR, Ready/Kilo/review action or full T11 claim occurs. T11.4b/T11.5/full T11 stay
open; T38 follows full T11 without new libraries now.


## Astra review/history presentation checkpoint — 2026-11-20 Caracas / November 21 UTC

At the coordinator's direction, this presentation checkout fast-forwarded from
`b6c1faa` to SOL's `7348beabee7d9ab17325464da7aef2d040886837`, preserving the
original commit and author. The resumed turn verified Astra high with automatic
approval review, on-request/workspace-write and the same explicit local skills.
SOL's three logic owners and tests remain unchanged. This supersedes the missing
presentation list above; **production integration and acceptance remain open**.

| Presentation owner | Integration contract |
| --- | --- |
| `sprint-start-review.tsx` | `SprintStartDialog` takes the captured `SprintStartReview`, pending/confirmDisabled flags, feedback and explicit confirm/cancel callbacks. Existing `ModalFrame` shows goal, local dates, exclusive end, captured zone and canonical totals; command preconditions remain internal. |
| `sprint-history.tsx` | `SprintHistory` consumes `SprintHistoryPort`, sprint/task scope and optional authorized task labels. It renders canonical order, actor/agent identity and provenance, before/after snapshots, outcomes, server total, initial/loading/error/changed/stale/empty states and supplied reload/load-more actions. `SprintPlanningSnapshot` is shared only with conflict comparison. |
| `sprint-conflict-review.tsx` | `SprintConflictComparison` renders retained command values and current authorized DTO separately. Parent supplies nullable reload/rebase/discard callbacks and a retained-decision destination label. Rebase reflects `canRebase`; close has no rebase control and requires discard/new preview. Parent chooses the existing modal/inline host. |
| `sprint-navigation-review.tsx` | `SprintNavigationDialog` consumes both guards in `SprintNavigationReviewPort`, with explicit stay and nullable discard. Parent supplies a human-readable label bound to the exact latest `destinationURL`; presentation does not parse, link to, or navigate it. Unknown copy explains that local discard cannot undo a possibly committed write. |
| `sprint-task-planning.tsx` | Canonical data/history is always separate from independently nullable edit/form ports. Each raw-string form has errors, feedback, pending/disabled state, explicit submit and cancel; participation also accepts destination-paging content. Null edit/form ports render no mutation controls. |

The parent still owns command capture, freshness, capabilities, field conversion,
validation, submission, pending/unknown recovery, destination binding, latest
navigation guards and context fences. Do not pass editable API versions/hashes
or infer authority in JSX. Start and navigation use an introductory focus target
inside the existing modal trap so narrow-screen opening retains the review text;
no focus lifecycle code changed. Task form autofocus markers are hooks for the
existing integration focus owner, not an implemented inline-focus lifecycle.
The task-history fallback uses canonical IDs when no authorized label is supplied.

### Native evidence and bounded validation

A disposable local Next route rendered these real components with illustrative
typed inputs and intent-only callbacks, visibly labelled as lacking server or
persistence. Native Orca inspection opened ES dark history/start at 1440,
EN light conflict at 1280, read-only/editable task planning at 390, and stale
start, unknown/draft/pending navigation, close conflict and changed history at
320; ES pending navigation was also opened at 390. Long text wrapped and measured
320/390 document widths matched the viewport. Mobile coarse-pointer and reduced
motion were observed. No actual phone, screen reader or integrated touch journey
is claimed.

The first 320 start capture revealed opening at the footer hid the review text;
the autofocus marker moved to the introduction. The corrected capture and DOM
inspection show that target inside the dialog. Shift+Tab moved to Back, Tab
wrapped to Close, and Escape restored the Start review trigger. Pending navigation
omitted discard while retaining both owner explanations. Read-only task DOM had
zero forms and only the read-only history Load more button. Changing estimate
and destination selections did not increment the intent counter; keyboard Save
incremented only the corresponding explicit submit callback. Cancel removed the
form. A pointer Save attempt was intercepted by the Next development badge;
keyboard activation verified the control without hiding or changing that badge.
This proves presentation callback wiring only, not policy, persistence or recovery.
Idle/loading/error/changed/stale/empty history messages and action availability
were inspected independently from the harness state selector.

Twelve opened PNGs, discarded harness, source fingerprints and a concise report
are retained locally under ignored
`apps/web/coverage/t11-presentation-reviews/`. Two start captures are explicitly
pre-correction evidence. The preview route was removed, its owned server/tab
closed, generated next-env restored and stopped-server dev types removed.
No production route, temporary store, dependency, generated file, logic/test
owner or numerical baseline is changed.

Scoped Prettier/ESLint, fresh route types and web TypeScript are the validation
scope; documentation/integrity and whitespace checks also apply. An initial
TypeScript check rejected a nonexistent system actor branch; removing it to match
the public human/agent union corrected the issue. No unit suite, full check,
build, coverage gate or real API/SQL/native integrated acceptance is claimed.
Four new runtime component owners bring presentation from five to **nine** inputs;
with SOL's three new logic owners, this batch currently adds **twelve** runtime
inputs to the web denominator. SOL must cover presentation behavior and measure
the completed source inventory; no floor/exclusion/baseline workaround is made.

Next: SOL imports this committed descendant, composes the single production
owner, implements capture/edit/focus/guard lifetimes and meaningful component/
integrated regressions, then completes required local/native/persisted/numerical
gates before the coordinator-directed single Draft PR. Signed-out recovery,
private-context replacement, confirmed versus unknown outcomes, all close-preview
bindings/paging and complete persistent journeys remain explicit integrated
checks. T11.4b, T11.5 and full T11 remain open; T38 still follows full T11.


## SOL production functional checkpoint — 2026-11-21 Caracas / November 21 UTC

The integration checkout fast-forwarded to Astra's reviewed presentation descendant
`64664613de5796ff0264ff554edc02b5c748c67e`, preserving both authors' original
commits. SOL's actual resumed turn verifies `gpt-6.1-sol` / `xhigh`, automatic
review, on-request/workspace-write and cwd `apps/web`. All functional changes,
including mixed TSX and tests, belong to SOL. Astra's nine presentation inputs,
CSS, tokens, copy and layout are retained; native integrated presentation QA is
still Astra/coordinator work.

### Production owners and behavior

`use-project-sprint-integration.ts` mounts exactly one `useProjectSprints` beside
the existing `useProjectTasks` owner. It consumes that owner's verified session,
selection and invalidation port; it adds no session request, event connection,
store or task copy. `sprint-integration-view.tsx` supplies functional composition
through the existing shell, work area, ModalFrame and Task detail. The existing
locale lifetime, modified links and Task detail return remain in place.

The canonical URL representation is
`/projects?workspace=…&project=…&projectView=sprints&sprint=…`; an optional `task`
preserves contextual detail. Selection transitions clear former private resources
before publishing the new context. The synchronous parent and sprint projections
prevent former project/task/sprint data, drafts and feedback from mounting during
verification, signed-out/forbidden states or identity/context replacement. A
sprint401 removes the former private parent DOM and offers explicit parent session
verification. Temporary verification retains raw drafts only for the same
verified session until its original expiry; replacement and denial clear them.

Both owners protect drafts, pending writes and unknown outcomes across sprint,
project, workspace, view, ordinary links, Back and beforeunload. The latest
blocked destination is retained. Stay keeps local decisions; explicit discard
clears local recovery without claiming to undo a possible server commit. Pending
has no discard. Confirmed completion or explicit discard releases the deferred
intent; field changes, invalidation, refresh and rebase never submit. Task-only
same-workspace browsing and the existing workspace guard retain accepted T37
behavior when no sprint lifetime is protected.

Forms stage before editing, capture versions and retain raw strings. Public
validators convert settings, planned metadata, null/zero/off-scale estimates and
explicit participation. Start displays captured canonical goal/dates/exclusive
end/zone/totals and requires review plus explicit command. Close loads complete
server pending totals and authorized destination/consequence pages; confirmation
uses the reviewed preview binding even if the raw select changes. Changed/stale
decisions require a new preview. Public capabilities control nullable mutation
ports, including archived/Kanban/read-only limits. Unknown retries use the same
key and body; 409 retains separate captured/current values for explicit canonical
reload, comparison and rebase. Closed views consume frozen outcomes and public
actor/provenance history, with independent resource and paging recovery.

### Functional and persisted evidence

All **368 web cases pass without skips**: the retained 307 plus 31 screen/form/URL
contracts, 29 production component/real-hook journeys and one standalone task-owner
compatibility case. The latter and the composed pending-task case cover both
directions of shared navigation protection. Tests also cover signed-out private
DOM fences, read-only forms, temporary verification/replacement, capability loss,
null/zero/off-scale, captured start, exact unknown recovery, 409 comparison/rebase,
complete close count 103, reviewed destination, changed pages, frozen outcomes,
actor history, ordinary/modified links, Back, discarded/confirmed deferred
navigation, narrow sidebar/modal inertness and focus. All old tests and source
inputs remain. The test-only CSS loader now recognizes the imported sprint styles.
Two added
expiry cases first reproduce a raw-buffer retention failure during stalled/error
parent verification; after correction, expiry clears the buffer and a later
same-session renewal cannot revive it. Two external projects-shaped URL cases
first reproduce lost-origin/task-guard bypass; after correction, both owners keep
the full external destination and their local work. The production dialog also
identifies the actual external URL. These are integration corrections, not
changes to the accepted backend policy.
Finite HTTP/browser/stream doubles do not prove SQL persistence or native access.

Three copied-source production witnesses pass their unmodified control and fail
their expected assertions after removing the parent private-data fence, removing
the raw close-review guard or adding automatic repreview on a raw destination
change. The temporary copies are removed; production source is never mutated.
An initial direct focused invocation lacked the TSX loader and could not resolve
extensionless imports; the established loader retry passes both added cases.

The existing disposable fixture supplied real Next proxies, Nest and PostgreSQL.
Orca's actual production page saved Scrum/Caracas settings, created a planned
goal/date sprint, saved estimate zero, explicitly assigned the task, reviewed and
started the sprint, reviewed closure and confirmed it. Two extra done/canceled
participants and a planned destination were arranged through the real public
transports; their arrangement is not a UI-creation claim. Complete preview scope
was three, with one done, one canceled and one pending participant. Changing the
raw select to backlog after reviewing the planned destination still committed
that reviewed destination. Public readback confirms the carried participation
and separate immutable done/canceled/carried outcomes. A later real estimate
change from zero to eight left the closed outcome at zero. Reloaded owner and
viewer pages expose canonical dates, exclusive end, frozen results and actor
history; the viewer's sprint panel has no mutation controls.

The persisted run used the uncommitted integration snapshot before the later
expiry and external-link corrections; it does not certify the final frozen head,
and no pre-run runtime fingerprint receipt is claimed. Repeat relevant journeys
on that frozen head during integrated QA.

This is bounded native functional evidence, not Astra's full visual/accessibility
acceptance. Date fields used native value setters with DOM input/change events.
Orca focus/refresh verification invalidated dialog references during start/close;
bounded DOM activation of the visible enabled review/confirm controls completed
those actions. Disabled controls were never bypassed. Native persisted 401/409/
timeout/concurrent-session journeys, all specified widths/locales, touch, zoom,
screen reader and actual-device acceptance remain explicit follow-up work.
The fixture's initial Next child exited; one owned replacement used the same
origin/API. All owned servers, QA database/container/volume, private fixture file
and browser tab were stopped/removed. No hidden persistent service remains.

### Numerical proposal and remaining gates

A temporary archive of accepted `a2de3bd` reproduces the exact 307-case web baseline
`e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c` and its raw maps.
Current measurement includes **88 inputs**: 74 retained plus nine Astra inputs,
three SOL contract inputs and two SOL production owners. No exclusion, ignore,
test removal, tool change or tracked baseline write occurs.

| Metric     | Accepted  | Proposed  | Floor before → proposed (basis points) |
| ---------- | --------- | --------- | -------------------------------------- |
| Lines      | 2869/4341 | 3407/4892 | 6609 → 6964                            |
| Statements | 3159/4929 | 3748/5551 | 6409 → 6751                            |
| Functions  | 641/1174  | 796/1347  | 5459 → 5909                            |
| Branches   | 3545/5915 | 4429/6913 | 5993 → 6406                            |

Ignored candidate current-web SHA-256 is
`04977cb421e2eb3e0d842c8b0c3295f19b6b2403e2d2cecf9788a41c1a01ccd8`.
Every existing file retains/improves exact ratio and uncovered count. All 68
unchanged-source maps remain exact with no loss of a previously covered S/F/B
unit. Changed-source counter IDs are not claimed semantically identical. New
inputs still have 40 uncovered lines, 68 statements, 26 functions and 150 branches;
after existing-file gains, global uncovered counts rise 13/33/18/114 respectively.
This is disclosed new UI debt for explicit review, not a reduction of old gates.
Null columns remain unknown: 951/37216 mapped points versus 823/32322 before.
The type-only zero-unit reconciliation remains unchanged.

Separate unchanged API 290/contracts 23/prototype 19 measurements pass and reproduce
their accepted current baseline bytes; combined serial measurements comprise 700
cases. All eight tracked baselines, locks, tooling and historical archives stay
unchanged. Normal root all-source gates, byte-identical candidate replay,
infrastructure/artifact validation and numerical acceptance remain pending exact
coordinator approval. Candidate reports, per-file/global ratios/uncovered maps,
nullable endpoints, source/test/tool fingerprints, witnesses and source-qualified
persisted evidence are retained under ignored
`apps/web/coverage/t11-integration-contracts/`; the older manifest there describes
only the dormant contract checkpoint, while `proposal/` describes this integration.

The first final check found an unqualified test Headers reference, corrected to
`globalThis.Headers`; the next reached typechecking and found duplicate route
declarations left by the stopped QA server. Removing only `.next/dev/types`
corrected that generated-cache issue. The final frozen-source `pnpm check` passes
on the supported unchanged retry after the inherited Next security advisory:
formatting, quality tooling, lint, backend closure, logic/integration checks,
strict types, production builds, 17 MCP checks and ES/EN/API-down smoke. Next
recommends a separate security upgrade; no upgrade, pin or suppression is part
of this batch. Offline handoff verification passes 47 files, 30 assets and 935
local links in 87 documents; whitespace and commit hooks apply before the ask.
No PR/push/Ready/Kilo/merge or fake APPROVED evidence occurs. The coordinator must
approve the exact numerical replacement, then obtain Astra integrated native QA
on a frozen committed integration head before publishing the single completed
Draft PR. T11.4b, T11.5 and full T11 remain open; T38 follows full T11.


## Approved numerical migration and normal replay — 2026-11-21

The proposal above preserves the pre-approval checkpoint. The coordinator approved
only current-web baseline
`e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c` →
`04977cb421e2eb3e0d842c8b0c3295f19b6b2403e2d2cecf9788a41c1a01ccd8`, bound to
clean source head `311cd0601b08af7b065b0cd3aed80510dc660709` and packet
`2585983abc005c9d0e291ce31fba91ee10e9589b6baec8faf24b37371f549bb5`.
Independent coordinator review verified all 237 physical fingerprints, eight
original baseline hashes, all 74 existing per-file exact ratios and uncovered
counts, 88 inputs, compiler/config/provider/runtime/tool identities and raw maps.
The coordinator archived the numerical proposal and its review separately.
Only those approved web bytes were adopted; the other seven baselines, tools,
floors and exclusions are unchanged. No source or test changed after approval.

Normal root all-source gates pass **700/700 without skips**: API 290, web 368,
contracts 23 and isolated prototype 19. All 16 normalized reports reproduce the
approved candidate bytes and sizes. Count digest is
`14a4847e4c684f5f22e7543615c7392026b2c6aba960289b5a7e853d2f83cb53`.
The 20 infrastructure cases and bounded artifact validation pass; all 16 report
payloads remain exact in the 17-file artifact set. No upload/publication ran.
The normal replay rechecks all 237 source/test/tool fingerprints, all 86 original
packet payloads and all eight authorized baseline hashes. Local receipts and
copied normal reports/artifacts are retained under ignored
`apps/web/coverage/t11-integration-normal/`. The completed final-source standard
check remains applicable to this documentation/baseline-only descendant.

The coordinator accepted **bounded numerical debt only**: new-input uncovered
L/S/F/B 40/68/26/150, net global increases 13/33/18/114, and retained null-column
limits. In particular, `sprint-integration-view.tsx` has **21 unexecuted callback
functions**, including retry, paging, cancel and selection wrappers. Hook coverage
does not prove those rendered action paths. This migration does not establish
complete rendered-path, source, product, privacy, persistence, accessibility,
native QA, PR or full T11 acceptance. The earlier uncommitted persisted browser
snapshot is not final-head evidence. T11.4b, T11.5 and full T11 remain open.

### Serial frozen-head integrated QA handoff

1. The coordinator freezes the clean delivered descendant and, after checking
   ancestry/cleanliness, imports it into Astra's separate presentation checkout.
   Verify actual Astra high and automatic-review/on-request/workspace-write;
   SOL logic remains SOL xhigh. Keep one active worker/heavy phase at a time.
2. Before any native action, record the actual checked-out head and runtime/source
   fingerprints. Use the existing disposable `apps/api/test/project-task-qa.mjs`
   with a fresh private fixture-state path; read only necessary nonsecret ports
   and IDs. Verify the actual Next/Nest listeners, one fixture and one web owner.
   Do not reuse an illustrative presentation harness or expose fixture cookies.
3. SOL owns the serial final-head persisted 401/reverification, 409 comparison/
   explicit rebase, timeout/unknown exact-key recovery and concurrent-session
   schedules. Record actual commands, statuses, binding/key identity, canonical
   readback and cleanup, distinguishing any controlled network boundary from
   real SQL persistence. No credential/provider/staging or API expansion follows.
4. Astra checks the frozen production composition at 320/390/1280/1440, ES/EN,
   themes/reduced motion, keyboard/focus/return, overlays, touch and nonideal
   states, including the unexecuted callback paths. Exercise planning/settings,
   null/zero/off-scale estimate, explicit participation, captured start, complete
   close-preview paging/binding, frozen history/outcomes, read-only/denied fences,
   Back/modified/external links and both-owner draft/recovery protection. Record
   unavailable actual-device/zoom/AT checks honestly. Screenshots alone do not
   prove workflows. Route functional findings to SOL and presentation findings
   to Astra through the coordinator; no silent mixed ownership.
5. Stop owned services, browser tabs and disposable database resources, preserve
   evidence with exact source bindings, then report complete/remaining UI parts.
   Source/test/measurement changes require a refreshed exact numerical proposal
   before another baseline edit. The coordinator controls the single completed
   Draft PR and later CI/native review; no worker push/PR/Ready/Kilo/merge or
   full acceptance is authorized by this handoff.


## SOL frozen-head recovery and persistence — 2026-11-21

The coordinator kept Astra idle and authorized SOL alone to use the existing
disposable fixture in the integration checkout. Before fixture/native actions,
SOL recorded clean head `a00fd7161972386eacb22409e7e6851656ed4d01`, all 237 exact
source/test/tool fingerprints, runtime and actual SOL xhigh with automatic review,
on-request/workspace-write. The same fingerprints remain exact after cleanup.
No runtime source, functional test, tool, measurement or baseline changed in this
phase; no new numerical approval or duplicate full suite/build was needed.

One owned PostgreSQL/Nest fixture served the production Next proxy/page. Its
initial Next child exited after readiness; listener inspection confirmed that
before one replacement reused the same origin/API. Public transports arranged
Scrum/Caracas, two planned sprints and three participants (pending/done/canceled;
zero/zero/null estimates). This is API arrangement, not native creation evidence.
The production page used its real controllers, one session/event owner, actual
rendered dialogs/buttons and public DTOs. Native automation used enabled DOM
button activation and native value setters/events; no disabled control, hook
method, prototype store, preview route or backend policy was substituted.

| Journey | Observed outcome and boundary |
| --- | --- |
| Real concurrent sessions and 409 | A rendered owner Save captured version4; only its outgoing HTTP delivery was paused. A distinct generated admin session committed version5 through the public API. Releasing the original command received real server409. The dialog displayed both decisions. Rendered Reload and explicit rebase made no write; the separate Save persisted the owner goal at version6. Public history identifies QA Administrator separately from immutable creator/provenance. |
| Real authentication loss and parent reverify | Only the generated owner's database session was expired. Shared authentication/stream loss canceled the held mutation before delivery, so this is **not** a claimed401 POST response. A real scoped read returned401, the former private project/task/sprint/draft DOM disappeared, and Verify session was present. Canonical auth removed the expired session row. Private fixture reauthentication restored only that generated session, using private stdin without printing/archiving its token. Clicking rendered Verify session recovered the original canonical version6 without reviving or saving the denied draft. No provider flow is claimed. |
| Real commit plus controlled response timeout | Rendered Save committed version7 through Next/Nest/PostgreSQL. Only browser response delivery was held. The actual product deadline fired at **15,004 ms** and the rendered unknown state offered recovery. Clicking Retry the same operation sent byte-identical body/key; real historical replay returned201 and canonical version remained7. This proves recovery around a simulated lost response, not a naturally occurring network outage. |
| Unknown local discard | A separate real commit reached version8 before a controlled response drop. Clicking rendered Discard local work closed recovery without resubmission or undoing that committed goal/version. |
| Original client expiry during verification error | Better Auth canonically renewed a short database session, so the bounded client-lease test instead shortened one public identity response to20 seconds and paused later identity delivery. Controlled popstate delivery invoked production verification and hid private DOM. Its real15-second identity transport timed out; the original20-second client lease cleared the hidden raw buffer/navigation protection. Explicit rendered Verify session then consumed genuine same-session server context without reviving/submitting the draft. This is a disclosed identity HTTP/browser boundary, **not SQL session-expiry evidence**; the separate real401 journey covers server authentication loss. |
| External navigation guard | A temporary DOM anchor supplied an external projects-shaped URL. The actual document capture and rendered navigation dialog retained its full origin/URL. Stay preserved the raw decision and rendered Back discarded it. No external network navigation or physical modified-click/device proof is claimed. |
| Explicit start and reviewed closure | Actual review/confirmation controls changed planned version8 → active9 → closed10. The server preview reported all three participants and complete pending count1. Changing only the raw select to backlog requested no new preview; Confirm closure still sent/persisted the reviewed planned destination. Canonical readback contains done, canceled and carried outcomes; the pending task's real participation points to that target. |
| Frozen readback/history | A later real public task estimate changed from0 to8. All three closing outcome snapshots remained byte-equivalent and the done outcome stayed0. Reloaded production results still use frozen totals/outcomes. History proves the distinct admin actor; a Sprint DTO's immutable creator/provenance is not treated as its latest command actor. |
| Replaced private context and read-only viewer | The fixture initially grants its viewer explicit private access. After revoking only that fictional grant through the canonical public owner transport, a real unsaved owner-only private-project form was replaced by the generated viewer session. Production verification removed the old private project and raw draft; the viewer's actual private read returned403. The viewer then loaded the public closed sprint's canonical results/history with no sprint mutation affordances. |

The observation scripts initially assumed a fixed dialog lifetime, a403 from the
fixture's still-granted viewer, and the wrong English closure heading. Temporary
render fences invalidated those dialog references; canonical session renewal and
the explicit fixture grant explained the other schedules. The observers/fixture
arrangements were corrected, not production source. A held verification request
correctly required explicit recovery after its own timeout. Failed observation
receipts and final qualified outcomes are retained; none is relabeled as a passing
production assertion. No functional source finding was identified in these
bounded journeys, and no source/test/baseline correction was made.

Hash-bound local evidence is retained under ignored
`apps/web/coverage/t11-native-functional/`: pre-native fingerprints/resource
ownership, public HTTP/key/body/result traces, DOM text, canonical history/frozen
readback, journey outcomes, observation limits and cleanup receipt. No cookie,
token, password or private fixture-state object is archived. The fixture exits0
after cleanup, the replacement Next exits143, all owned tabs close, and the
private state file, exact labeled container/volume and app listeners are removed.
Only stopped-server generated AGENTS/next-env additions/dev route types were
restored/removed. The existing Codex listener and all foreign resources remain.

The approved numerical source/baseline binding and prior700-case exact16-report
normal replay remain unchanged. The **21 callback functions unexecuted in unit
measurement remain explicit debt**; manually exercising some controls does not
change those counters or prove all rendered paging/cancel/selection paths.
Native pages here had only two sprints and three closure outcomes, so complete
multi-page native workflows are still open despite automated count103/paging
coverage. Astra must still inspect the frozen integrated composition in its own
checkout/fresh fixture at all specified widths/locales/themes, keyboard/focus,
touch/reduced-motion/nonideal states and remaining action paths. Actual-device,
zoom, screen-reader and unavailable checks remain explicit. This bounded SOL
evidence does not accept the source/product/privacy/persistence/accessibility as
a whole, T11.4b, T11.5 or full T11. The coordinator controls Astra's next import
and the single completed Draft PR; no push/PR/Ready/Kilo/merge occurred here.
