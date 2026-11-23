# T11.4b sprint presentation checkpoint

Status: **LOCALLY VERIFIED CORRECTION CHECKPOINT for [Draft PR55](https://github.com/Ljrr3045/rielia/pull/55),
published reviewed head `0faf74f5`, corrected functional source `3d37c755` above
preserved Astra copy `a60983e7`. The coordinator approved exact web baseline
`89cdc952`; standard, normal 738-case, infrastructure and artifact gates pass
with the qualifications below. Narrow corrected-head Astra QA, current-head CI,
requested native review and coordinator thread dispositions remain pending.
External native Cancel/Leave stays user-accepted UNVERIFIED debt and possible
unsaved-draft-loss risk, omitted only for this review batch. T11.4b/T11.5/full T11
remain open; coordinator owns remote writes, Ready and merge**.
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

The approved numerical source/baseline binding and prior 700-case exact16-report
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


## Astra frozen-head native QA finding — 2026-11-21

The coordinator authorized a fast-forward to clean `436c4837135a7535ffcc2fa3dbb9bc61f0ab00b2`.
The actual resumed turn verified `gpt-6-astra` / `high`, automatic approval review,
on-request/workspace-write and the three explicit checkout-local skill paths.
Before any fixture/browser action, this checkout recorded 232 source/test/tool
fingerprints and runtime identity. The missing API runtime required one local
generate/TypeScript build; 180 API/contracts built files were then fingerprinted.
The effective pnpm runtime was Node 24.22.1/pnpm 12.15.0; shell Node 26.12.1 was
recorded separately and was not used to run the fixture. No heavy suite was
repeated, source patched or baseline changed.

One fresh owned fixture served the real production page through Next/Nest and
PostgreSQL. Native controls saved Scrum/Caracas settings, surfaced required-field
errors on an empty create attempt, and created a planned sprint with goal and
local dates. Date input used native DOM value setters/input/change events;
other field/save actions used Orca controls. Canonical public readback confirmed
the settings and planned version 1 with exclusive end `2026-12-07`; its history
had only the creation record. Opening/canceling metadata did not mutate it.

### Finding: metadata dialog loses its logical return control

At 320 ES dark, opening **Editar sprint** focused its name input. Native
Shift+Tab stayed inside the dialog; Escape closed it but focused the project H1,
although an enabled **Editar sprint** control was again rendered. A second
bounded reproduction without resizing confirms the mechanism:

1. Focus and activate the visible enabled Edit sprint button (DOM activation
   used for this reproduction to avoid Orca stale refs during verification).
2. The opener element becomes disconnected when staging removes its action.
   The modal then focuses its input.
3. Native Escape closes the modal. The replacement Edit sprint button is enabled
   and connected, but focus lands on the project heading, scrolling away from
   the invoking control.

The DOM focus trace records button → input → H1. This is a functional
focus-lifecycle finding for SOL, not a CSS correction: inspect
`use-project-sprint-integration.ts` opener/restore effect (around lines45–57 and
124–133), `sprint-screen-model.ts` canBegin/action projection and the conditional
action composition. Preserve private-context fences and capability gating while
restoring the logical action when it exists; the old element reference alone is
insufficient. The first ordinary click also encountered transient verification;
that observation is not presented as the isolated repro.

Astra stopped the native phase at this ownership boundary without changing
logic/tests/presentation. The full 320/390/1280/1440 ES/EN/theme/motion matrix,
persisted edit/null-zero-offscale/participation/start/close flows, destination/
scope/history/outcome multipage data and actions, read-only/denied/private fences,
Back/modified/external navigation and both-owner guards remain open for the
resumed QA pass. Only 1440 Kanban/empty and 320 metadata/return were visually
inspected; 320 width matched scrollWidth, inputs/buttons measured 44px high with
16px font and coarse-pointer emulation was observed. Physical-device touch,
zoom and screen-reader checks were not performed. Earlier SOL evidence retains
its own bounds; manual observations do not change the 21 unexecuted callbacks.

Three opened PNGs, canonical readback, exact focus trace, pre-source/built-runtime
fingerprints and cleanup receipt are retained under ignored
`apps/web/coverage/t11-native-presentation/`. The owned fixture received SIGTERM
and returned to its shell; its Next/Nest/fixture listeners, exact labeled
container/volume and private state file were confirmed absent. The browser tab
and fixture terminal were closed; only the existing Codex listener remained.
Generated next-env was restored and stopped-server dev types removed. All 232
source/test/tool fingerprints still match, including approved web baseline
`04977cb421e2eb3e0d842c8b0c3295f19b6b2403e2d2cecf9788a41c1a01ccd8`.
Documentation/whitespace checks apply to this receipt; prior 700-case normal
evidence is not rerun or broadened. No PR/push/review/merge or full acceptance.


## SOL scoped focus-return correction — 2026-11-21

The coordinator accepted Astra's no-resize button → input → H1 trace as a
functional defect and authorized this integration checkout to fast-forward to
docs-only `48ec419f5b41d90c0dc13361ade667aa01b1a350`. Actual SOL
`gpt-6.1-sol`/`xhigh`, automatic review and on-request/workspace-write were verified
before edits. Astra remains idle in its own checkout; its trace/report were read
and copied as evidence without editing that checkout. The native finding remains
source-qualified to its original head; no corrected native pass is claimed here.

`use-project-sprint-integration.ts` now captures a logical action with the verified
session/workspace/project/sprint/task identity and canonical URL in memory. An
opaque hook-local React ID scopes the rendered action ports; authentication IDs
are not placed in DOM attributes. `SprintWorkspace` and `SprintTaskPlanning`
accept an optional nonvisual scope and expose stable semantic action/heading
markers. The SOL composition supplies that scope. Conditional public-capability
ports remain unchanged: no unauthorized button is kept mounted to preserve focus,
and labels/locales are not used as selectors. CSS, tokens, copy and layout are
unchanged; the Task planning heading gains only programmatic fallback focus.

Cancel and confirmed completion resolve the current authorized action after
staging has removed the original node. Restoration waits for current verified
reads, survives canceled frames during temporary same-session verification, and
rechecks the latest context/URL before focusing. New editing, replaced identity,
project/task/navigation lifetimes and accepted guard discard cancel the old
intent. The resolver rejects disabled, hidden, inert, semantically hidden/disabled
or CSS-invisible targets/ancestors. When an action has ceased to exist (for
example successful start/close or revoked edit authority), only the matching
current scoped feature heading is an eligible fallback. It does not move focus
into another context or an active navigation/form dialog.

### Regression evidence and check limits

The initial bounded control on the old runtime fails **six of seven** cancellation
journeys: settings, create, metadata edit, start, estimate and participation.
Each explicitly focuses/activates the actual production control and proves its
node disconnects, then presses Escape and finds the enabled replacement. Raw
close review passes the old control because its opener remains mounted. The
first failing DOM-object assertion made Node's diagnostic formatter stall; only
the identified owned test PIDs were stopped, and boolean diagnostics produced
the bounded 6-failure/1-pass receipt. That interrupted attempt is not pass evidence.

All **51 production composition cases pass** after correction, retaining the 29
previous cases and adding 22 focus regressions. They cover all seven action
lifetimes, ES/EN label independence, confirmed metadata save across held fresh
reads, completed start/close fallback, revoked authority, disabled/hidden/inert/
semantic/CSS-hidden targets, temporary verification, replaced identity, task-detail
navigation, a newly opened form and Stay/discard guarded navigation. The held-read
test double initially reused a consumed Response across independent reads;
returning a fresh Response for each read corrected that boundary without a
production change. Real hooks/components/controllers remain in use; finite
HTTP/browser/CSS doubles do not prove the 320px native or accessibility result.

Scoped root ESLint, web TypeScript and source formatting pass. Measurement of all
**390 web cases/88 maintained inputs** passes with no skips. The accepted
368-case before reports/raw maps are the prior byte-identical normal replay;
all 88 before source and test bindings were independently matched against
`48ec419` before using them. Unchanged API/contracts/prototype source/reports were
preserved without repeating their suites. Proposed future normal count is 722,
not a claimed normal-gate result.

### Exact numerical proposal; no baseline write

Only current web is proposed:
`04977cb421e2eb3e0d842c8b0c3295f19b6b2403e2d2cecf9788a41c1a01ccd8` →
`f1679d66f7ad53aa65e691cac2188c8c39f5aac31c600c2ff53013ffac462076`.

| Metric | Accepted before | Proposed after | Floor before → proposed (basis points) |
| --- | --- | --- | --- |
| Lines | 3407/4892 | 3445/4925 | 6964 → 6994 |
| Statements | 3748/5551 | 3789/5587 | 6751 → 6781 |
| Functions | 796/1347 | 810/1356 | 5909 → 5973 |
| Branches | 4429/6913 | 4483/6964 | 6406 → 6437 |

All 88 existing files retain/improve exact ratios and uncovered counts; global
uncovered L/S/F/B decrease 5/5/5/3. All 84 unchanged-source maps remain exact,
retaining 8152 covered S/F/B units with one gain, zero losses and 38 exact hit
vectors. Changed-source semantic counter identity is not asserted. Null columns
remain 951, over 37472 mapped points versus 37216 before; no columns are invented.
The integration hook has all 48 functions covered. The composition's previously
unexecuted callback functions decrease from 21 to **16** in this measurement;
remaining rendered-path and native debt is still explicit. No test/input removal,
exclusion, floor reduction, library, provider/config/tool change or historical
archive edit is made. All eight tracked baselines are untouched, including seven
protected unaffected files. All 237 physical source/test/tool fingerprints and
all 16 candidate report hashes/sizes are supplied with the proposal; only four
runtime source fingerprints and one retained test fingerprint change.

Local ignored evidence is under `apps/web/coverage/t11-focus-return/`: Astra's
copied trace, before/after focused logs, accepted before maps, exact proposal,
per-file/global covered/uncovered comparisons, unchanged-map witnesses, nullable
endpoints and source/test/tool/report fingerprints. Existing archives remain
unchanged. No app/browser/fixture service was started for this correction.

Exact coordinator approval must precede any baseline write. Corrected-head normal
root gates/report replay, applicable final standard/infrastructure/artifact
checks and Astra's exact native focus reproduction plus unfinished responsive/
accessibility/multipage matrix remain open. Earlier numerical/native receipts
retain their original source limits; they do not accept this source change.
No push/PR/Ready/Kilo/merge/worker_done or T11.4b/T11.5/full T11 acceptance occurs.

## Focus correction approved replay and native handoff — 2026-11-21

The proposal above retains the pre-approval record. The coordinator read the
four-runtime-file correction and independently verified the clean source head
`1df6fd46340cf60fed76800ff6061a1dd962388e`, 44 proposal payloads, all 237 physical
fingerprints, eight untouched baselines, 88-file covered-count/exact-ratio/
uncovered nonregression, compiler/config/tool identities and raw-map witnesses.
Only current web was approved and adopted:
`04977cb421e2eb3e0d842c8b0c3295f19b6b2403e2d2cecf9788a41c1a01ccd8` →
`f1679d66f7ad53aa65e691cac2188c8c39f5aac31c600c2ff53013ffac462076`, bound to packet
`7f5e3e5aa6bb77adfe9542a349e5e03f8336aa8b644f856ac3f50b911bf7f7d6`.
The seven other baselines, old evidence and approved source/test/tool binding
remain unchanged. The coordinator preserved the proposal independently.

Corrected normal root all-source gates pass **722/722 without skips**:
API 290/web 390/contracts 23/prototype 19. All 16 normalized reports reproduce
the approved bytes and sizes, with count digest
`7d1c75a2d0c8b1ca737687dfbe3aee75348c52bc90d28ab5b2a48b994c15031e`.
All 20 infrastructure cases and bounded 17-file artifacts pass; no upload ran.
Replay verifies all 237 physical fingerprints, all 44 original proposal payloads
and all eight authorized baseline hashes. The final corrected-source standard
`pnpm check` passes on the supported unchanged retry after the inherited Next
security advisory: formatting, quality tooling, lint, backend closure,
logic/integration checks, types,
production builds, 17 MCP tests and ES/EN/API-down smoke. No dependency upgrade,
pin change, global configuration change or native database schedule was repeated.
Local normal reports, validated artifacts, logs and hash receipts are retained
under ignored `apps/web/coverage/t11-focus-normal/`.

The approved numerical evidence preserves the **16 unexecuted composition
functions** and unknown/null-column limits; it does not certify every rendered
path. The bounded coordinator source review and automated return-to-action tests do
not accept the corrected 320 ES native case. Earlier native screenshots/flows
remain bound to their earlier source. T11.4b, T11.5 and full T11 remain open.

At the clean frozen descendant, the coordinator should authorize Astra's own
fast-forward import after verifying clean ancestry and actual `gpt-6-astra`,
effort `high`, with automatic review/on-request/workspace-write. Astra then records fresh head/source/
runtime fingerprints before actions and starts a fresh fixture in that checkout;
there is no shared server ownership. First repeat the no-resize 320 ES dark
metadata case: focus/activate enabled Edit sprint, verify original node disconnects,
then native Escape must focus the current enabled Edit sprint control. Check
sibling settings/create/start/close/task planning cancel/confirmation and safe
fallback without relaxing capability/private-context gates. Continue the unfinished
320/390/1280/1440 ES/EN/theme/motion/keyboard/focus/touch/nonideal and actual
multi-page destination/scope/history/outcome matrix. Record unavailable device/
zoom/AT checks honestly, keep functional findings with SOL and presentation with
Astra, stop owned resources and preserve exact-head evidence. Only the coordinator
controls the single completed Draft PR. No push/PR/Ready/Kilo/merge/worker_done
or native/product/full T11 acceptance occurs in this local-gate handoff.


## Astra corrected-head native matrix — 2026-11-21

The coordinator-authorized clean fast-forward imported frozen `1dba13af48963a40904751f27b57c63933e093d7`.
Actual Astra high, automatic review/on-request/workspace-write and the three
explicit checkout-local skills were verified before a fresh owned fixture.
Production Next/Nest/PostgreSQL ran without source, test, baseline or package
changes. Existing built API/contracts bytes were fingerprinted and reused; no
heavy gate was repeated. This receipt supplements the earlier SOL functional
schedules and preserves their source/simulation limits.

The exact no-resize **320 ES dark metadata → native Escape** repro now focuses
the current enabled Edit sprint after staging disconnects its original node.
Settled sibling checks return create/settings/start/close cancellation and inline
estimate/participation cancel to their current actions; start Shift+Tab stays in
the dialog. Successful closure uses a feature-heading fallback. Stale native refs
and incidental transient BODY samples were not counted as proof; current-node
repetitions and focus observations are preserved.

| Bounded production journey | Observed result |
| --- | --- |
| Forms and task planning | Empty-create validation and invalid scale feedback; invalid scale receives focus. Explicit settings save, metadata goal edit and one native form-created sprint persist. Estimate saves preserve zero versus null; canonical off-scale 8 remains selectable. Explicit participation assigns the same canonical task, without duplication. |
| Real pagination | Public setup creates 100 destinations and 102 source participations; UI adds the original task, giving 103 participants. Sprint selector 100/101→101/101, scope 100/102→102/102, history 100/103→103/103; close destination second page exposes destination 006, preview 100→103, frozen outcomes 100→103 and final history 100→107. No reduced page size. |
| Start and close | Complete server totals show 1 done/1 canceled/101 pending, 8 points and 102 unestimated. Explicit start persists. Raw destination changes do not submit or replace reviewed binding; explicit preview/confirm carries 101 pending tasks to reviewed destination 006. Closed source is version 107. |
| Frozen results | Public later task estimate 8→0 leaves full closure and 103 outcomes byte-identical; original frozen estimate remains 8. Closed mutation actions are absent. |
| Guards and recovery | Sprint Back/Stay preserves raw draft without canonical save. Separate task-owner draft blocks detail navigation; explicit discard continues without saving title. A held real 201 response shows pending/no saved claim and no navigation discard; Back resumes only after confirmation. Stop waiting on another held response exposes unknown recovery; explicit retry confirms the original operation. |
| Nonideal/server capabilities | One disclosed 503 read produces loading/error and rendered retry recovers. Actual viewer, private denial, signed-out recovery, archived planning, Kanban and one-active-sprint restrictions render according to canonical capabilities. Former task/sprint content is absent on the observed denied/signed-out routes. |

API setup of bulk data is separate from native creation/edits. Controlled HTTP
response delays and one 503 are explicit boundary schedules, not real outages.
Interaction uses Orca native keyboard/Back/type plus disclosed DOM activation of
visible enabled controls/native field setters; no disabled gate or private-data
fence was bypassed. Automatic reverification sometimes required explicit reload/
review; it never justified automatic submit. Long lists can show authorized ID
fallbacks when their corresponding label has not been paged in.

Nine opened captures cover representative 320/390/1280/1440 actual layouts,
ES/EN, light/dark, long text and IDs, close/frozen summaries, viewer and guarded/
unknown states. Measured page widths show no horizontal overflow. Mobile coarse
input and reduced-motion preferences were enabled. This is not a full viewport ×
locale × theme cross-product, physical touch/gesture, OS zoom or assistive-
technology certification; the development-only Next insight badge appears in
captures. No new presentation redesign was necessary or delivered.

### Evidence limits and coordinator decision

No confirmed new source defect was isolated in this pass. A second Back after
Stay crossed a prior full-document history entry and did not yield a usable guard
receipt; earlier DOM-only navigation lacked Chromium user activation for
beforeunload. **Cross-document/beforeunload protection remains unverified**, not a
passing journey; coordinator/SOL must disposition that native boundary. Latest-
intent multi-request, modified/external-link, distinct-session 409 comparison,
exact idempotency-key identity and same-document 401 private fences retain the
prior SOL schedule evidence, not a fresh complete replay here. Physical-device,
AT/zoom and real-user/provider/staging checks remain open. Screenshots do not
certify those flows, and this receipt does not grant full accessibility or T11
acceptance.

Ignored evidence is in `apps/web/coverage/t11-native-corrected/`: REPORT,
pre/post fingerprints, browser actions (including failed attempts), API setup,
immutable readback, nine opened captures and cleanup receipt. All 232 selected
source/test/tool and 180 built-runtime fingerprints remain exact; all eight
baselines are unchanged, including approved current web `f1679d66`. The earlier
722-case normal/20-case infrastructure/17-artifact/standard receipts remain
source-qualified; manual QA adds no unit hits and does not close the **16
unexecuted composition functions**. Documentation validation passes: immutable handoff47 files/30 assets and947
local links, adopted formatting, and whitespace checks. Remote URLs and heading
fragments are outside the verifier.

Owned Next/API/session-switch listeners, fixture process, labeled PostgreSQL
container/volume and private session file are removed. The browser/fixture shell
are closed; generated next-env is restored and stopped-server dev types removed.
Only the pre-existing Codex listener remains. No unrelated process, checkout or
historical archive is altered. The assignment stays at coordinator review:
no push/PR/Ready/Kilo/merge/worker_done, and T11.4b/T11.5/full T11 remain open
before planned T38.

## SOL cross-document guard boundary and consolidation — 2026-11-21

The coordinator accepted `1dba13af` as a clean corrected checkpoint for serial
Astra QA, then accepted the corrected focus and representative integrated/
multipage evidence as bounded evidence, not product acceptance. SOL imported
Astra's docs-only `15b2ccdab9222182ff890589e3b1f22629168456` with the authorized
fast-forward. This resumed turn verified actual `gpt-6.1-sol` / `xhigh`, automatic
review/on-request/workspace-write before execution. No source, test, baseline,
package, provider or global configuration change is delivered here.

The only new native schedule isolates the unresolved cross-document Back case.
A receipt recorded all **237 source/test/tool**, **180 built API/contracts** and
**eight baseline** hashes before one minimal owned project-task-qa fixture.
One planned sprint was arranged through the accepted public transport; the
fixture's existing task was reused. No bulk pagination or earlier failure schedule
was repeated. The initial fixture Next child exited after readiness; its live
Nest/PostgreSQL fixture was retained, the vacant original web port was verified,
and one owned replacement Next listener reused that origin. Its existing Next
security upgrade reminder remains outside this no-upgrade checkpoint.

For each owner, normal full-document navigation first established a known
same-origin `/?qaBefore=sprint` or `/?qaBefore=task` history entry, followed by the
actual production sprint/task URL. Supported Orca pointer and keyboard actions
reported **trusted events** and Chromium `navigator.userActivation.hasBeenActive`
**true**. A passive QA observer, installed after the existing production listener,
recorded the actual unload event; it never canceled, replaced or dispatched one.
Changed raw sprint name and task title values were visible before Back. The
observer's sessionStorage held only fictional public QA values and was cleared.
Initial focus/verification replacement interrupted early sprint click/typing samples;
those attempts are retained and are not counted as changed-draft evidence. An
explicit rendered review followed by current enabled controls and native typing
produced the recorded changed value without bypassing a disabled control.

In **both cases**, the actual `beforeunload` event was `isTrusted: true`, the
production handler had already set `defaultPrevented: true` and empty
`returnValue`, and sticky user activation was present. Nevertheless, **Orca Back
crossed the full-document entry and the raw in-memory draft document was lost**.
The documented dialog capability was discovered once; `dialog dismiss` returned
`browser_no_dialog` / no JavaScript dialog open. Orca 1.4.261 on macOS, runtime
`b59280dd-959c-49fd-922d-756c345ac66d`, supplied no controllable confirmation for
this observed schedule. This is a concrete unresolved browser-host boundary,
not a passing Cancel/Leave flow or proof of missing web guard installation. No
web source fix was inferred from an event that production correctly canceled;
coordinator disposition or a supported native-browser/human confirmation check
is still required. Native Cancel retaining document/draft and explicit native
Leave exiting remain **unverified**. No safety prompt was disabled, fake trusted
flag supplied, unload handler overridden or synthetic event counted as native.

The unchanged hook reads `navigationProtected()` at unload; that method includes
task pending/draft/retry and the registered sprint guard. Existing source-bound
real-hook/component tests cover raw close-review unload cancellation before/
after discard, same-document Back/Stay and protected links, plus draft/pending/
unknown transitions. Their DOM/browser doubles are distinct from native browser
confirmation. Same-document custom navigation remains covered by the earlier
qualified SOL/Astra receipts; it was not mislabeled as cross-document proof.
Pending/unknown schedules were not repeated because they do not isolate the
unavailable dialog. Real public readback after both Back actions confirms task
and sprint remain version 1 with unchanged canonical fields; no Save was invoked.

After cleanup all 237 source/test/tool and 180 built hashes, all eight baselines
and all 16 normal report hashes remain exact. The accepted **722-case** normal
binding/digest `7d1c75a2`, 20 infrastructure cases, 17 safe artifacts and standard
checks are reused with their source limits, not rerun or inflated by manual QA.
The **16 unit-unexecuted composition functions**, null-column limits, representative
rather than exhaustive responsive matrix, device/AT/zoom and real-user/provider/
staging limits remain explicit. Historical evidence is unchanged. This receipt
closes neither T11.4b/T11.5 nor full T11; T38 remains after full T11.

Ignored evidence is under `apps/web/coverage/t11-cross-document-guard/`: before/
after bindings, all browser attempts, passive events, canonical readback,
source/unit witnesses, cleanup, manifest and a concrete English Draft PR body
for coordinator review. Owned browser, replacement Next, fixture, labeled
PostgreSQL container/volume and private temporary state are removed; generated
AGENTS/next-env changes were restored and stopped-server dev types removed.
Only the pre-existing Codex listener remains. No credentials/private fixture
state were printed or archived. No push/PR/Ready/Kilo/merge/worker_done occurs;
the assignment remains ACTIVE at the coordinator's publication/boundary decision.

## Final bounded external confirmation preflight — 2026-11-21

The coordinator reviewed/archived the preceding 70-payload boundary packet and
English PR body, accepted neither the embedded protection flow nor an invented
source fix, and authorized one final external-browser confirmation attempt.
At clean `033ea401e1ff4475c3d84d6eebcf4d397250446d`, SOL again verified actual
`gpt-6.1-sol` / `xhigh`, automatic review/on-request/workspace-write and recorded
the unchanged 237 source/test/tool, 180 built, eight baseline and 16 normal-report
bindings before any browser or fixture action.

SOL read the explicit `orca-computer-use` skill and version-matched guide.
The macOS provider advertises background input and window/AX/click/key support,
with separate `surfaces.dialogs` false. Its Brave window inventory returned
**`screen_locked`: the Mac is locked or asleep and windows cannot be observed or
controlled**. The first read-only wrapper did not expose the JSON error; a second
read-only capture retained that exact failure. No browser action, owned window,
fixture, generated session or secret URL was created; personal tabs, cookies,
history, settings and profiles were not read or changed. No foreground/restore,
permission/configuration change, install or broad-access request occurred.

This final alternate-host attempt is **unavailable**, not a native Cancel/Leave
pass. The earlier trusted production cancellation and embedded raw-draft loss
remain separate observed facts. Cancel preserving the same document/raw values
and explicit Leave with unchanged canonical data remain an **owned unverified
acceptance gate for coordinator disposition**. No further broad QA or guessed
web patch follows from this preflight. T11.4b/T11.5/full T11 remain open before
T38, preserving 16 unit-unexecuted functions, null-column and representative
matrix/device/AT/zoom limits.

Ignored `apps/web/coverage/t11-external-confirmation/` contains before/after hash
receipts, capabilities, the exact sanitized inventory error, verdict, cleanup/
resource record, manifest and refreshed English Draft PR body. No fixture or
app service needed cleanup; the prior owned resources remain removed. Only
these live guide/progress/changelog updates are committed. Numerical and heavy
functional gates are reused with their unchanged source binding; applicable
prose/format/handoff/whitespace/hooks checks pass. No push/PR/Ready/Kilo/merge/
worker_done or product acceptance occurs; assignment stays ACTIVE for the
coordinator's concrete Draft publication and boundary disposition decision.


## Coordinator disposition and Draft publication — 2026-11-21

The coordinator reviewed and independently archived the final unavailable
external-browser packet (`0fd9d1ed`, 15 payloads) and exact English body
(`0c156628`), verified clean `2a2de50e` and its docs-only diff, and retained native
external Cancel/Leave as an **OWNED OPEN ACCEPTANCE GATE**. The last desktop
preflight was `screen_locked`; the coordinator asked the user asynchronously to
unlock. No new UI attempt is authorized during publication. The implemented
integrated batch may be published as **one Draft PR to `dev` for reviewability**;
this is not completion/acceptance of T11.4b, T11.5 or full T11 and not a Ready
transition. T38 remains after full T11 without new libraries now.

Pre-publication verification retains actual SOL xhigh with automatic review/
on-request/workspace-write, clean own branch and fetched `origin/dev` ancestry
at accepted `a2de3bd79596cb83b79287f105f60fedfb35bea9`. The coordinator's live
GitHub readback reports sole collaborator/authenticated `Ljrr3045`, no invitations,
`collaborators_only` admission and no existing branch PR. The worker independently
verified that identity and will recheck branch-PR absence immediately before the
initial push, then immediately create the authorized Draft with the reviewed
English body. Subsequent pushes require actual Draft state and no live Kilo;
Ready or unexpected reviewer activity requires a coordinator decision.

All 237 source/test/tool, 180 built, eight baseline and 16 normal-report bindings
remain exact. Prior 722 cases, infrastructure/artifact/standard evidence and
manual limits are reused with their source qualifications; no heavy local suite,
new measurement, baseline or native schedule is repeated for these docs. Sixteen
unexecuted composition functions, null columns, representative matrix/device/AT/
zoom and real-user/provider/staging limits remain owned. The local publication
packet and English body are under ignored
`apps/web/coverage/t11-draft-publication/`. Actual URL/head/CI and bounded draft
review-event observations are recorded after creation; no fabricated no-event,
Kilo/current-head approval or completed native acceptance is implied.


### Publication approval block — 2026-11-21

The prepared disposition/docs commit is `a1232f3ef161e6d2f1d52107841691c6a40ac370`.
Automatic approval review **rejected process creation before the initial push/
Draft command ran**. Its stated reason was that those external writes conflict
with the original trusted task's instruction not to publish yet, and the later
coordinator-style tool transcript was not accepted as authorization. The reviewer
explicitly forbade a workaround or indirect execution. No alternate command path
or publication retry was attempted. Direct user approval of the blocked push and
Draft creation, or a coordinator hold, is required before proceeding.

Read-only remote/GitHub checks after rejection confirm no feature branch or
branch PR exists; remote `dev` remains accepted `a2de3bd`. The English body is
fully prepared for review and bound to the final clean local checkpoint, but no
PR URL, Draft/head observation, current-head CI association or draft Kilo-event
observation exists. This does not establish a global absence of queued/paid Kilo
work. Unaffected local docs/evidence preparation is complete; source/test/built/
baseline/report bindings stay unchanged. The new receipt preserves the exact
rejection and readbacks under ignored `apps/web/coverage/t11-draft-publication/`.
The native gate and all T11 acceptance limits remain open. Assignment ACTIVE;
no push/PR/Ready/Kilo/merge/worker_done or full T11 claim occurs.

## Draft PR55 URL and initial status receipt — 2026-11-21

Following direct user-role approval in the coordinator conversation, the
coordinator's supported automatic-review escalation admitted the exact initial
push of `47da8cec93889b41757319123e2875920aa790b4` and immediate Draft creation.
This was not a permission-profile change or bypass. The two worker-context
rejections and all earlier packets remain unchanged historical evidence. The
worker did not retry publication or perform a GitHub mutation.

Independent readback at **2026-11-21 07:35–07:36 UTC** confirms
[PR55](https://github.com/Ljrr3045/rielia/pull/55) **OPEN, `isDraft=true`**, author
`Ljrr3045`, base `dev`, head `47da8cec93889b41757319123e2875920aa790b4`.
The [initial validate job](https://github.com/Ljrr3045/rielia/actions/runs/44880810429/job/136775464109)
was **IN_PROGRESS** at capture, check `136775464109`, GitHub Actions App
`15368`; run `44880810429` reports `pull_request`, head/branch `47da8cec` /
`feat/t11-sprint-ui-integration` and PR55 association against accepted base
`a2de3bd`. This is an initial-head/status snapshot, not a completed CI result or
validation of a later docs candidate; the checkout's synthetic-merge SHA was not
independently read from logs here. No Kilo App `2193792` entry appears in the
captured complete one-check set; captured issue comments, submitted reviews,
review requests and inline comments are zero. These are bounded GitHub-surface
observations only, not proof that global paid/queued Kilo work is absent.

The local URL/status receipt is docs-only. All 237 source/test/tool and 180 built
hashes, eight baselines and 16 normal reports remain exact; the 722-case local
binding, standard/infrastructure/artifacts and qualified native evidence retain
their original sources. No full suite/build/measurement/native fixture is
repeated. The English body candidate and observed API/check/PR associations,
archive hashes, documentation checks and clean commit are retained under ignored
`apps/web/coverage/t11-pr55-local-receipt/` for coordinator review/publication.
The worker makes **no further remote write**. Before publishing the candidate,
the coordinator must verify actual Draft/no live Kilo, push the prepared docs and
refresh body/head/current CI evidence without marking Ready or requesting review.

Native external Cancel/Leave is still an **OWNED OPEN ACCEPTANCE GATE**: a
trusted canceled production unload followed by embedded raw-draft loss remains
observed; external confirmation was unavailable with `screen_locked`. No UI retry
occurs until the user confirms the Mac is unlocked and the coordinator sequences
a narrow check. Sixteen
unit-unexecuted composition functions, null columns, representative matrix/
device/AT/zoom and real-user/provider/staging limits remain explicit. Draft
publication closes neither T11.4b/T11.5 nor full T11; T38 follows full T11.
No Ready/Kilo/merge/deploy/worker_done; assignment ACTIVE.

## Resumed external native setup: control permissions unavailable — 2026-11-21

After user `continua`, the coordinator authorized only the narrow external
Cancel/Leave check at clean published `bd011271`. SOL verified actual `gpt-6.1-sol` / `xhigh`,
automatic review/on-request/workspace-write, the explicit computer-use skill and
version-matched guide, and unchanged 237 source/test/tool, 180 built, eight
baseline and 16 report hashes before any window action. Read-only Brave inventory
now succeeds, with zero windows and its existing process still running; this
changes the earlier `screen_locked` availability result without proving control.

The supported launcher leaves an already-running app alone. Brave's installed
scripting dictionary supports incognito window creation and visibility. Before
sending any creation event, a public macOS automation preflight for `core/crel`,
with **`askUserIfNeeded=false`**, returns **`-1744`,
`errAEEventWouldRequireUserConsent`** for this worker process. It sends no
AppleEvent and requests no prompt. One supported background Orca shortcut for a
new private window then returns **`permission_denied`: Accessibility permission is
required for Orca Computer Use**. No foreground/restore, setting change, consent
request, alternate control provider or repeat of the failed action follows.
Post-action read-only inventory still has zero windows; the existing Brave
process is untouched. No personal window/tab/profile/history/cookie content is
read or changed, and no fixture/session/database/private URL is created.

This is an actual setup/control blocker, not a web defect or a passing native
flow. Activation, browser Back/prompt/Cancel/Leave and canonical readback were
not reached in this attempt. The earlier trusted production cancellation and
embedded raw-draft loss retain their original source limits. Native external
Cancel/Leave remains an **OWNED OPEN ACCEPTANCE GATE**; the coordinator must
disposition usable background control under the explicit no-permission-change/
no-foreground scope. No browser prompt, beforeunload or trusted-event behavior
was overridden or simulated. Zero owned resources require cleanup.

Ignored evidence is under `apps/web/coverage/t11-external-cancel-leave-resume/`:
source/runtime receipt, sanitized inventories, supported launcher/dictionary and
non-prompting automation evidence, exact failed shortcut, cleanup, manifest and
updated local English PR body. Only bounded live docs change; prior CI success
on `bd011271`, numerical/source/artifact bindings and historical archives remain
qualified and unchanged. No full suite/build/722-case or bulk-data replay, source/
test/baseline patch or remote mutation occurs. T11.4b/T11.5/full T11 and 16
unit-unexecuted functions/manual limits remain open before T38. Root owns remote
publication; assignment ACTIVE, no Ready/Kilo/merge/deploy/worker_done.

## User-accepted native verification omission — 2026-11-22

After the coordinator explained native Back with an unsaved task/sprint draft,
Cancel preserving the draft, Leave discarding it, the 722 passing cases and the
possible unsaved-draft-loss risk, the user explicitly replied **“omitamos y
continuemos”** in the root conversation on **2026-11-22 America/Caracas**. This
omits **only external native Cancel/Leave verification for the current T11.4b
review batch** as **user-accepted UNVERIFIED debt with risk**. This particular
check no longer blocks advancing to Kilo review. It is not a passed test, proof
of browser-host/web correctness, T11 acceptance or automatic merge approval.

The observed embedded boundary remains: trusted, activated production unloads
were canceled, yet Orca Back crossed documents and lost raw task/sprint drafts;
canonical persisted fields/versions stayed unchanged. No web defect was isolated
or fix invented. The dated `screen_locked`, quiet `-1744` automation preflight
and background Accessibility-denial receipts above remain historical evidence.
The subsequent preserved packet at clean `579b26d4` also records both permissions
reading granted before/after, while the single supported background request
still returns `permission_denied`; no owned window/fixture or native flow is
reached. The cause is undetermined. That permission-discrepancy packet and all
previous failures/blocked snapshots remain unchanged. Their former blocking
disposition is superseded only by the user's narrow omission decision. No further
browser, permission, helper or UI troubleshooting occurs in this batch.

**Debt owner and later verification:** the coordinator/user owns scheduling when
viable; SOL owns functional verification and any fix justified by a reproduced
failure. A later supported external-browser/native-control check, or a narrow
user-run manual check, must bind the exact source/session/browser, exercise both
task and sprint unsaved drafts through actual Back/Cancel and explicit Leave,
and verify canonical persisted values. Until then, loss of unsaved drafts during
cross-document navigation remains an accepted review risk, not certified behavior.
Device/gesture, assistive-technology and OS-zoom checks, the representative matrix
limits, 16 unit-unexecuted composition functions and 951/37472 null mappings remain
explicit. This disposition waives no privacy/permission, current-head CI, Kilo,
ownership or other acceptance requirement. T11.4b/T11.5/full T11 remain open;
T38 follows full T11, with no library adoption here.

This local docs-only batch includes the previously unpublished `579b26d4` setup
receipt plus the current user disposition, progress and changelog. Its proposed
English PR55 body is prepared for coordinator publication. All 237 source/test/
tool hashes, 180 built hashes, eight baselines and 16 normal reports remain exact;
722/722 normal cases and digest `7d1c75a2d0c8b1ca737687dfbe3aee75348c52bc90d28ab5b2a48b994c15031e`
retain their functional-source `1df6fd4` binding. No source/test/baseline or immutable
handoff changes, heavy replay, service or remote mutation occur. The published
`bd011271` [validate](https://github.com/Ljrr3045/rielia/actions/runs/44881650922/job/136778041029)
is SUCCESS (24/24 steps; GitHub Actions App 15368), with its inherited Node-action
deprecation warning preserved; it does not certify this later local docs head.
The coordinator must verify actual Draft/no live review, publish the final batch,
obtain current-head CI and then control one Ready/native Kilo round and its triage.
No current-head Kilo result, fake APPROVED, merge or T11 acceptance is claimed;
PR54's incremental/native hash-tool limits remain explicit.

Ignored evidence is under `apps/web/coverage/t11-native-omission-review-batch/`:
actual SOL/profile and before/after source bindings, user disposition, published
PR55/body/check readback, proposed English body, documentation checks, commit and
manifest. Historical packets are immutable, including
`t11-native-external-confirmation/` and `t11-pr55-current-ci/`. Assignment remains
ACTIVE for the coordinator's final Draft publication/review sequence.

## Native round-one corrections and numerical proposal — 2026-11-22 Caracas

Native check `137457056702`, App `2193792/kilo-code-bot`, completed **SUCCESS** on
`0faf74f59f70fab719c8e474459ac198a51319b2` at 2026-11-23 03:06:31 UTC. The
[summary](https://github.com/Ljrr3045/rielia/pull/55#issuecomment-7090464584)
contains **three warnings and four suggestions**, all accepted by coordinator
triage. The [submitted bot review](https://github.com/Ljrr3045/rielia/pull/55#pullrequestreview-6016120236)
is **COMMENTED**; all seven threads were current/unresolved at capture. The
coordinator converted the same PR55 to Draft before this correction batch.
No worker review reply/resolution, remote write, Ready toggle or new review occurs.

Astra's accepted copy-only commit `a60983e7da4a981a375def614bcb93f6546740b6`
is imported with its original commit/author. SOL implements the remaining six
functional corrections, retaining visual components, CSS, tokens and layouts:

| Finding | Correction and bounded regression |
| --- | --- |
| [4661436630](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436630) | Accepted T37 task/workspace navigation clears obsolete integrated/workspace intentions; a newer integrated departure replaces the older workspace decision. Tests preserve task drafts and original workspace Stay/discard behavior, reject concurrent decisions and prevent later discard from jumping to an old Sprints URL. |
| [4661436633](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436633) | Separate `SprintParticipationFormPort.submitDisabled` from field disabling. Initial same-sprint/backlog Apply is disabled while selection remains editable. `submitSprintForm` also refuses an unchanged canonical destination, including retained conflict/rebase decisions. Tests force submit events and perform an actual changed-destination command; unknown recovery keeps its separate exact-key path. API policy is unchanged. |
| [4661436635](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436635) | The integration hook supplies a typed parent navigation review only for a ready, unexpired verified parent. Existing navigation presentation can render before the project-sprint visibility fence; only this parent decision is available in My tasks/search. Modal/inert/focus ownership follows the same port. Tests cover Stay/discard, auth loss, temporary same-session verification and replacement, with no former private task/sprint fields mounted. |
| [4661436639](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436639) | Append the exact authorized canonical selected sprint when absent from the loaded chooser page; deduplicate it and keep genuine page loaded/total counts. A read-only deep-link test uses 100 other options, retains selection after refresh and verifies no duplicate or edit affordance. |
| [4661436643](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436643) | Separate scope `loadMoreDisabled` from task-link disabling. Loading/changed/stale/error or pending state blocks continuation; authorized task navigation remains available unless the original pending guard applies. Tests exercise changed/error reloads, loading, pending and a live task link. |
| [4661436647](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436647) | Only retained participation `targetSprintId: null` maps to Backlog. A rendered 409 comparison test distinguishes it from a null, unselected close-preview destination, which still cannot confirm. |
| [4661436650](https://github.com/Ljrr3045/rielia/pull/55#discussion_r4661436650) | Imported neutral metadata copy: ES `Datos del sprint registrados` / EN `Sprint details recorded`. Real history consumers render both canonical creation/edit entries in each locale; no API history-kind change. |

Sixteen cases are added to the retained integration suite; every original test
body/inventory remains. A serial source-substitution witness runs these against
reviewed `0faf74f5`: **16/16 fail**, including the two old-copy consumer cases.
All seven substituted files are restored in `finally` with exact byte checks.
The affected owner/component suites pass **154/154**; final canonical web
measurement passes **406/406**, no skips, including the final test bodies.
Web typecheck, affected lint, formatting and whitespace pass. Initial direct-test
launcher configuration/IPC failures remain disclosed in ignored local logs; only
the valid direct runner and canonical compiled measurement receive test credit.
These use real hooks/controllers/components with finite HTTP/stream/browser/
clock/CSS boundaries, not real DB persistence or native accessibility proof.

The [numerical proposal](unit-coverage.md#t114b-native-round-one-correction-proposal--2026-11-22-caracas)
keeps all **88 web inputs**, 237 physical source/test/tool fingerprints and every
old suite. Candidate web SHA-256 is
`89cdc95277c032522ca612d36a8028797a2c8b9affcbb94b5bdf4f000cc24429`;
accepted `f1679d66` and all eight tracked baselines remain unchanged pending
coordinator approval. Per-file ratios/uncovered counts do not regress. The
composition still has **11 unexecuted functions**; the hook measures 50/50
functions without implying complete lifecycle coverage. Null mapping endpoints
are **952/37598**, previously 951/37472. No exclusions, lower floors, test removal
or source omission are used. The other three scope reports are retained prior
source-qualified bytes, not rerun. Normal 738-case replay, applicable remaining
gates/current-head CI and requested-round native review remain pending.

New ignored evidence lives under `apps/web/coverage/t11-kilo-round1-corrections/`:
review/triage/import receipt, original reports and eight baseline hashes, failing
reviewed-source witness/restoration, valid checks, exact candidate/comparisons,
uncovered/null maps, fingerprints and final clean committed-head manifest. Earlier
native round-one and omission packets stay immutable. Native self-reported
33-file scope matched git paths but supplies no per-file hash/tool-transcript or
fresh-full-model attestation; PR54's earlier limits remain explicit. Old-head
validate/Kilo results do not approve the changed correction head.

After approved numerical/functional gates, narrow native QA should cover only
these changed interactions: latest task/workspace and My tasks/search decisions
with focus/Stay/discard, unchanged versus changed participation/rebase, authorized
off-page chooser selection/counts, scope pager states versus task links, Backlog
conflict versus unselected closure and ES/EN metadata history. The accepted prior
matrix/persistence journeys are not repeated by this batch. The user-omitted
external native Cancel/Leave check stays **UNVERIFIED accepted debt**, outside
this correction scope. Representative/device/AT/zoom/provider/staging limits and
T11.4b/T11.5/full T11 stay open; T38 follows full T11. Coordinator alone sequences
Draft publication, current-head CI, completed review triage/ownership and any
later Ready round; no acceptance or merge is implied by this local proposal.

## Approved round-one numerical replay — 2026-11-22 Caracas

The coordinator independently inspected the correction/source/test diff and
reviewed-source witness at clean functional head
`3d37c7552fda29e5d5c1fbf5c71bd679b2898197`, verified all 88 proposal payloads,
237 physical fingerprints, unchanged 88-file web inventory and every per-file
covered-count/ratio/uncovered comparison, then approved **only** the exact web
baseline `89cdc95277c032522ca612d36a8028797a2c8b9affcbb94b5bdf4f000cc24429`.
That candidate replaces `f1679d66`; the seven other current/historical baselines
remain byte-exact. This acceptance is numerical and bounded; it does not accept
product/privacy/persistence behavior, native accessibility or full T11.

The authorized phases run serially, using installed frozen tools:

- `pnpm check` **PASS** on the identical supported continuation after an inherited
  Next `SecurityFatalError` stopped the initial command to show its upgrade
  recommendation. Both logs are retained. Next reports continuing after the
  reminder on retry; no source, dependency pin, configuration or suppression is
  changed to get past it. Its recommendation to upgrade remains disclosed for
  separately scoped work. The initial failed attempt is not recorded as a pass.
- Normal `pnpm unit:coverage -- --built` **738/738 PASS**, no skips: 290 API,
  406 web, 23 contracts, 19 prototype. `--built` reuses the successful standard
  builds and is not a maintenance/baseline-write mode. Actual deterministic count
  digest is `a90263901ce0220411fc38593c42dc92c26042d33550c1540bf2e8f880cbe757`;
  all 16 report hashes/sizes reproduce the approved proposal exactly. The prior
  prediction is now confirmed by this real normal run across all four scopes.
- `pnpm test:unit-infrastructure` **20/20 PASS**; `pnpm unit:artifacts` prepares
  and validates **17 bounded files** with every scope complete. No artifact is
  uploaded and SDK-boundary doubles are not remote upload proof.

Fresh successful standard build bindings cover **318 outputs**: 166 API
JavaScript/source-map files, 14 contracts runtime/declaration files, three local
MCP files and 135 Next production server/static/manifest files. All 180 prior
API/contracts hashes remain identical; unchanged incremental files are not
claimed as newly emitted. Fresh Next output hashes bind the corrected source,
not a browser or persisted user journey. No additional local Docker/runtime or
PostgreSQL identity integration run occurs for this frontend correction; those
unchanged backend/runtime gates remain required in current-head CI. Standard
HTTP/liveness checks do not establish real-provider or sprint DB acceptance.
No native service/browser work, old-source witness repeat, installation or
upgrade occurs after numerical approval.

The baseline/check receipt is a descendant of functional `3d37c755`, itself a
fast-forward descendant of preserved Astra `a60983e7` and reviewed `0faf74f5`.
Only approved baseline bytes and bounded docs change after the functional head;
all 237 source/test/tool fingerprints stay exact. The ignored packet
`apps/web/coverage/t11-kilo-round1-correction-normal/` preserves coordinator
approval, before/after hashes for all eight baselines, serial check logs, the
initial Next stop and successful continuation, fresh build bindings, actual
normal counts/digest and 16 reports, infrastructure/artifact evidence and the
final clean committed-head manifest. Approved proposal, original native feedback
and the omission packets remain immutable.

Narrow Astra QA is pending only for the changed interactions listed above; the
coordinator must sequence it from the frozen clean checkpoint. The accepted broad
matrix is not repeated, and external native Cancel/Leave remains **UNVERIFIED
user-accepted debt**, outside this batch. Eleven unexecuted composition functions,
952/37598 null endpoints, representative/device/AT/zoom/provider/staging limits
remain explicit. No old-head native SUCCESS/COMMENTED or CI success approves this
changed head; current-head CI, completed requested-round review, ownership and
coordinator thread dispositions remain required before acceptance. T11.4b/T11.5/
full T11 stay open; T38 follows full T11. No worker remote write, Ready/Kilo toggle,
thread resolution, deployment, merge or worker_done is performed.
