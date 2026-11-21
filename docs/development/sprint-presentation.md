# T11.4b sprint presentation checkpoint

Status: **IN PROGRESS, unintegrated checkpoint; no PR or product acceptance**.
Base: accepted T11.4a merge `a2de3bd79596cb83b79287f105f60fedfb35bea9`.
The [client guide](sprint-client.md#t114a-acceptance--2026-11-20-caracas--november-21-utc)
records PR54 acceptance and its review/hash limits. T11.5 and full T11 remain
open; planned [T38](https://github.com/Ljrr3045/rielia/issues/53) follows full T11.

Scope: T11/B1c, P09/US06; affected P05/P08/P10/P33, US05/US08/US12;
UXR01 and UX01/03/04/05/07/09. Existing T37 project shell, tokens, locale and
modal controls govern. No new policy, transport, hook, route, test, dependency,
prototype state, T12/T13, T22 chart/report, landing or deployment is introduced.

## Presentation and typed ports

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
