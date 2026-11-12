# T37.4 project/task presentation and recovery

**2026-11-12 — implementation and bounded local validation complete; published in
[Draft PR #48](https://github.com/Ljrr3045/rielia/pull/48), T37.4 acceptance pending.** T37.1/2/3 are accepted in
merged [PR45](https://github.com/Ljrr3045/rielia/pull/45),
[PR46](https://github.com/Ljrr3045/rielia/pull/46) and
[PR47](https://github.com/Ljrr3045/rielia/pull/47#issuecomment-6814793798).
Accepted `dev` is `55f0f8d85521998d3d7ed883f387bd3c6cb664f8`. This batch includes
project/task presentation, four bounded recovery corrections and their evidence.
No T37.5 source, T11, landing, new domain/policy or whole-product acceptance.

Traceability: T37.4; existing T06–T10/T35, P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25, UXR01–04/06 and UX01–03/05–07/09/11.
Follow the [direction](t37-design-direction.md), [inventory](t37-ui-inventory.md),
[T36 contract](t36-stable-ui-contract.md) and [project owner map](project-interactions-extraction.md).
The imported handoff and existing server authorization remain authoritative.

## PR48 round2 form-modal focus correction

[Round2 warning](https://github.com/Ljrr3045/rielia/pull/48#discussion_r4547515533)
reproduces an omitted combination: selected task overlay plus Edit modal. The
first dialog in document order is the inert task detail at 390/768px. The exact
retained build `rnOoBwmdKkBln0mAz1EYY` reproduces actual focus on body after read
recovery while the real form remains open. Prior round1 matrices did not cover it;
those proofs remain historical for this changed focus path.

Only form-modal DOM focus targeting changes: ModalFrame exposes explicit optional
form ownership, its existing caller marks the form, and the effect uses that owner.
Connected/current reachability excludes inert, hidden, aria-hidden, disabled and
CSS-hidden ancestors. A deliberate reachable focus target is preserved; otherwise
an enabled autofocus child precedes the container fallback. No order/aria-modal
heuristic, new state, timeout, CSS, permission/controller or domain change.

Ten meaningful selected-task/priority-guard regressions retain 185 previous cases;
195 pass the revised measure and one normal gate. The initial 194-case candidate
is unapproved and preserved: an uncovered marker default reduced project-ui's
branch ratio. The coordinator authorized one real workspace-navigation guard
regression and one revised measure; source remained unchanged. The guard preserves
Stay focus and returns the original form/draft without a write. Exact revised
baseline `263d596f595c8cc89b7fecacde9ec7e0ad9d3be03483c8145a5c309f9e872a75`
was approved before writing. L/S/F/B floors rise to 6182/5960/4962/5601; no file
covered-count/ratio or stable-map covered path regresses. New defensive debt is
a net one uncovered line/two statements/one branch, with improved effect ratios.
68 inputs/24 test-helper entries/provider/config and seven other baselines remain
exact; 811/29,010 null-column points and type-only N/A remain explicit. A new
production build now passes: `mAp3WdSelNjHy1r1sa55S` from clean source
`57020a07359d0bbaa07a706a73fde3a8cb168580`, 92-source snapshot
`ce2b398f3567172c89fd047cf0d0fefd0ae009410b842c975361ec81c01e77c2`.
Three actual-browser schedules at 390/768/1280 pass opening, held/success and 503
recovery, real Tab/Escape/Cancel/Close, cancellation/late-read detail handoff,
private-field hiding and original captured intent/version with no automatic write.
390/768 have two dialog-role nodes; 1280 retains complementary detail as a control.
Focus belongs to the connected non-inert marked form and its enabled title field,
then to live detail after cancellation; only the detail lock remains until close.

Four current EN/light viewport PNGs were directly inspected by worker and
coordinator, with no new blocker; the concise index records source/build/runner/
fixture/image hashes and actual focus ownership.
390 crops omit lower fields/actions; dynamic assertions separately establish
keyboard reach and lifetimes. Both browser phases and exact owned server/PIDs
are stopped, port 43886 absent and the heavy lease released. Ten served assets
match compiled files. Node 24.22.1/pnpm 12.15.0, installed Brave 157.0.8103.39 and
Playwright 1.57.0 are reused without downloads. No source fix/rebuild during native
QA; the one before case reuses the prior exact build and only one new build runs.
No new PG/backend/container run is needed for this pure DOM targeting diff;
downstream composed-build integration remains separate. Older matrices are
historical for this changed overlap path, not proof it was previously covered.

Kilo's sandbox could not hash source; this is a reviewer limitation, not a source
defect or substitute for independently verified local/CI fingerprint integrity.
The prior three findings remain resolved; coordinator owns the current thread,
review/Ready and acceptance decisions. T37.5/downstream source remains separate.

## PR48 round1 recovery corrections — implementation checkpoint

The completed first native review reported three credible findings
([summary](https://github.com/Ljrr3045/rielia/pull/48#issuecomment-6816185604)):
read loading/error removed the only modal while its shell stayed inert; a denied
draft lost its cross-target Return; permission revocation closed a form without
restoring focus. All three are reproduced through the real screen/controller
before source correction. Earlier passing matrices did not cover these schedules.

The existing ModalFrame now remains mounted during loading/error with generic
FeedbackPanel recovery, reachable Cancel/Escape and read-only retry. Private fields
are absent until fresh same-target DTO/capability is available. Focus stays inside
the reachable modal across child replacement; closing it clears inert/body lock
without losing memory-local intent. The denial panel provides generic cross-target
Return without private labels. Failed or revoked return attempts cannot reopen
fields after a later read without a new deliberate Return; captured versions and
unknown keys retain their existing semantics. Revocation uses the established
focus-restoration path and rejects hidden/inert openers.

Eight meaningful schedules retain all 177 prior cases: **185 pass** one measure
and one normal web gate. Exact coordinator-approved current baseline
`560abd962881e8e3d93666919c8e190125f8a8e467a65af60bcf7078f88d41df`
raises L/S/F/B floors to **6072/5858/4825/5456**. Provider/config, 68 inputs, all prior
tests and seven other baselines remain exact; no per-file coverage regression or
increase in uncovered units. Mapping debt is now 811 null columns of 28,926, with
shifted-source mapping limits and the same type-only N/A owner retained.

The clean corrective source is `0c95bfd4d855055ed9793f938b4129b113243a19`.
Exactly one new Next 16.4.3 production build passes: `rnOoBwmdKkBln0mAz1EYY`,
92-source snapshot `52ade99f20abf051b818db0892626cdfcc74635fba5e31ccb54d07165b4bde53`.
Ten served client assets match compiled files byte-for-byte. Node 24.22.1/pnpm
12.15.0 build/units and installed Brave 157.0.8103.39/Playwright 1.57.0 native
runner are reused without downloads. No application source changes during QA.

**Ten focused native journeys pass with nine selected current images.** Actual
1440/768/390 widths and 844×390 sample ES/EN and both themes. They prove the held
access modal remains the same connected dialog through successful and failed
reads, exposes keyboard-reachable Close/Cancel/retry without private fields, and
releases inert/body lock after Escape even when a late read completes. A versioned
settings draft survives read503 and saves deliberately with its original version.
Cross-target denied Return checks fresh authority, still-denied/revoked/missing
outcomes and explicit restoration without automatic reopening; revocation restores
focus to a valid current heading/main. Related confirmed-write/read503 and pending
versus unknown checklist schedules retain once-only/exact-key behavior.

All nine selected states have no viewport overflow; relevant recovery targets
measure at least 44px and enabled text contrast at least 5.47:1. The coordinator
directly opened all nine SHA-verified images at this source/build and found no new
visual blocker. Revoked390 lower actions extend below its crop; activation/focus
claims come from separate native receipts. Images do not certify AT/accessibility
or prove current authority/database isolation. The concise selected-image index
records actual language/theme/role/data/viewport and per-image fixture/source/build
hashes; full computed observations and failed diagnostics are retained separately.
The first group hit private route-timing/localized-label/controlled-checkbox
assumptions; only affected cases reran on unchanged application source. Both
browser runs are closed, owned Next PID 8223 stopped and loopback 43885 is absent;
all recorded browser PIDs are absent and the heavy lease is released.

The ce607 build, 26 journeys/20 images and 14-state Astra subset below remain
**historical evidence for unchanged surfaces**, not exact-new-source proof. Final
real PostgreSQL/Nest/Next affected persisted QA follows separately in T37.5/6.
Actual browser zoom, physical devices/manual AT, users/providers/staging remain
unperformed/deferred. PR48 stays Draft for the corrective batch; current-head CI,
coordinator-controlled review and acceptance remain. No T37.5 source, Ready/Kilo
trigger or whole-T37 acceptance is included.

## Result and ownership

| Surface | Result |
| --- | --- |
| Project header/breadcrumb | Quieter existing administration; full long context wraps within its work column rather than crossing contextual detail |
| List and board | Contiguous title-first project rows with aligned/wrapping metadata, readable board grouping and native status/Move/reorder alternatives; existing capability-gated Restore is reachable on narrow rows |
| Forms/access | Vertical project fields and visible capture label, native disclosure/choice controls and readable automatic versus explicit human/Agent access sections |
| Detail/collaboration | Title/description first, grouped properties, creator/provenance distinct from assignee, readable hierarchy/checklist/comments/history with independent section states |
| Recovery | Confirmed writes remain visible through failed reads; denied memory-local intent has safe recovery; pending and unknown checklist outcomes are distinct; revoked create permission cannot remount a stale form |

Astra owns CSS and presentation classes/static title-status sibling composition.
SOL owns controller/lifecycle/conditional JSX, minimal localized recovery copy and
all functional tests. Existing URLs, capabilities, server counts/order, command
handlers, keys/refs, captured versions, idempotency, one controller/locale/detail
lifetime and current authorization fences remain. No backend, transport, public
contract, dependency, provider/config or historical baseline change is included.
Identity/workspace corrections already accepted in PR47 are retained, including
transition-specific invitation-clearing assertions; no secret retention is added.

## Bounded SOL recovery implementation — 2026-11-12

- Confirmed project writes show generic success separately from read503/read403.
  While current data/access are unavailable the notice contains no private target
  labels, and Load again/Refresh never repeats the write. Same-target read recovery
  retains confirmation; genuine navigation/session/expiry fences prevent stale
  results appearing elsewhere. Dismiss restores a valid focus destination.
- Mutation403 clears scoped data and removes private fields, while generic denial
  and memory-only intent remain recoverable. Fresh current DTOs/capability for the
  same target are required before deliberate Return. Revoked permission yields no
  form; Discard removes intent and focuses the current surface. Captured version N
  survives N+1 reads; unknown retry preserves the original payload/key. Definite
  denial is not treated as an unknown operation.
- Pending checklist saves show Saving with safe disabled actions. Unknown-outcome
  Retry/Discard appears only after the canonical mutation is no longer pending.
  Lost-response retry, success, 403 and 409 remain distinct without CSS hiding.
- A real regression exposed automatic create-form remount after permission was
  restored in an empty workspace. The existing unauthorized-form close condition
  now handles ready and empty; restored permission requires deliberate reopening.

Twenty-two meaningful real screen/hook/controller regressions extend all 155 prior
cases to 177. Retained positive create/move focus cases still enforce canonical
row/page revision barriers and fallback behavior. These tests assert public user
outcomes through established HTTP/browser seams, not a duplicated policy/store.

## Exact PR47 corrective-head integration — 2026-11-12

Astra presentation `0721c721` and recovery `39c72ebb` are combined with exact PR47
correction `b1f3ddec` at `ce60740f`. No semantic source conflict occurred; additive
portable docs retain both actual histories. The corrected invitation assertions
are exact, and no T37.5 source enters the branch. The later accepted-dev ancestry
merge is tree-equal to validated checkpoint `8d7b937`: all 92 compiled-source hashes,
24 test/helper fingerprints and baseline remain exact. Ancestry/documentation-only
updates do not require another unit/build/browser run.

The [reviewed current-web migrations](unit-coverage.md#t374-reviewed-recovery-baseline-migration)
retain 68 maintained inputs and every prior case/provider/config/tool identity.
Final current baseline is
`7e44c96c37036bff1e8aa65a01c1020b664a74ba411d238bcd3c82a2f63ff865`:
L2299/3835, S2500/4324, F500/1055, B2845/5305, with L/S/F/B floors
**5994/5781/4739/5362** basis points. Exact candidate review precedes each baseline
write; one normal integrated gate passes 177 and reproduces measured manifests,
normalized maps and hit vectors exactly. Seven other baselines are byte-identical.
No lowered threshold, ignore, exclusion, selected-test loss or silent rebaseline.

Remaining unexecuted paths and mapping precision remain explicit: 803 null-column
points of 28,798, implicit arms and the type-only collaboration port's zero-unit
N/A are not universal coverage. The first incomplete 160-pass loader attempt and
unapproved 171-case candidate remain separate historical evidence; the additional
capability journeys found the empty-create defect before the 177-case approval.
Original reports, failed/positive receipts and source/build bindings are preserved.

## Integrated native validation — 2026-11-12

Exactly one Next 16.4.3 production build passes:

- Build: `6QKhwGDQLKveEfZvAYWsS`, source `ce60740f1a58942add205679b348cf5e78bfe785`.
- 92-source SHA-256 snapshot:
  `ca6bfc2c75ff969680c1ead0c21a5fb2981e9274d1e4716f8cdaf2460ad16e92`.
- Build/units: Node 24.22.1/pnpm 12.15.0. Private native runner: existing Node 26.12.1,
  Playwright 1.57.0, installed Brave 157.0.8103.39, ephemeral headless profiles.

**26 unique native journeys pass, with 20 selected source-bound images.** They
cover title-first Tab order, native Move/reorder, mobile Restore, private creation
and lifecycle, current role/capability disclosures, detail/collaboration, nested
picker and workspace guard, URL/draft/focus/trap/body-lock lifetime, all three
recovery schedules and shared discovery-row/literal-query/current-assignee parity.
Five populated board columns load in the actual DOM; the selected board image
shows its visible locally scrolling portion, not all five columns simultaneously.

Samples span 320/375/390/768/1024/1279/1280/1281/1440 and 844×390, ES/EN and both
themes, real browser keyboard and synthesized touch. At 1280, full unbroken
breadcrumb text paints to 803.14px within 804px without clipping/hiding text.
At 1279 detail is an overlay/body lock; at 1280/1281 it is contextual. Selected
states have no viewport overflow. Sampled mobile targets meet 44px and text inputs
16px; enabled control text contrast is at least 5.23:1, and focus rings contrast
6.70 light/8.11 dark against adjacent pixels. Reduced motion and 200% enlarged
root-text reflow pass; root-text scaling is not browser-chrome zoom.

Private route/schema/selector/context errors are preserved as diagnostics, with
reruns limited to affected cases on unchanged source. A checkbox-only pending
capture was corrected before cleanup: `checklist-pending-visible-dark-390.png`
actually shows Saving at x16/y389.34, 358×65.73 within 390×844, held POST=1 and no
unknown Retry/Discard. Its SHA-256 is
`79039cd2dfba00f3e7c63264a11ccbb2f2730bf300383efcc51b240c8ad2e567`;
the old image remains diagnostic. No production fix was made during native QA.
Actual fixture hashes, per-case receipts, image index, computed measurements,
static-asset/source proof and cleanup are retained in the maintainer's evidence
bundle. No install/download, second build, Docker or foreign-service change.
All owned browser/Next PIDs and loopback listener are stopped; the lease is released.

## Astra visual review and remaining decisions

Astra opened 14 distinct selected image states bound to the same source/build,
including the corrected pending image and its identical uniquely named alias.
No new T37.4 blocking visual defect was found in that subset. This is neither an
independent rerun of SOL's 26 journeys nor review of all 20 images/every state.

| Actually inspected image state | Visible evidence and limit |
| --- | --- |
| `list-1440-light-en-keyboard.png` | Title/metadata/status and focus readable; static crop does not prove Tab order |
| `mobile-restore-375-light-en.png` | Restore visible with supplied 44px target; activation is separate native evidence |
| `breadcrumb-1280-dark-en.png` | Long context wraps before contextual detail, with supplied measured paint bound |
| `access-human-agent-768-dark-es.png` | Owner/Agent/access disclosure readable; lower content cropped |
| `detail-collaboration-768-dark-en.png` | Scrolled hierarchy/checklist/comments; top properties/history body outside crop |
| `project-create-private-1440-light-en.png` | Native labels/private choice; action footer partly visible, native lifecycle supplies reach proof |
| `checklist-pending-visible-dark-390.png` | Corrected blue Saving panel visible; no unknown actions in panel |
| `checklist-unknown-dark-390.png` | Readable uncertainty/Retry/Discard; exact-key behavior comes from native/unit receipts |
| `modal-keyboard-844-dark-en.png` | Save/Cancel and focus visible; trap/Escape are separate native evidence |
| `text-reflow-390-dark-en.png` | Enlarged root text; not browser zoom, rows outside crop |
| `board-five-statuses-1440-dark-es.png` | Four columns appear, one partial; fifth is offscreen |
| `confirmed-read503-390-light-en.png` | Confirmed-save notice distinct from read-error recovery |
| `denied-hidden-fields-false-390.png` | Generic denial/Discard and read recovery; no private fields shown |
| `long-metadata-320-light-en.png` | Complete long title/assignee wrap; reorder requires native evidence |

**F1, P2 — navigation fill ambiguity:** unconditional My tasks primary fill can
look active beside a selected project. Conditional aria-current/URLs/handlers are
correctly separate; this is not a routing or authorization finding. The coordinator
assigns a minimal Astra presentation correction to T37.5. Its separate source
must not enter this PR; F1 is not a T37.4 blocker.

[Draft PR #48](https://github.com/Ljrr3045/rielia/pull/48) targets `dev` from
`feat/t37-project-task-work`. Publication is not final T37.4 acceptance. Current-head CI/native Kilo,
coordinator review/acceptance and later publication decisions remain required.
Final real PostgreSQL/Nest/Next cross-surface persisted/security QA remains
scheduled in T37.5/6, using the existing QA machinery. Finite HTTP fixtures never
prove persistence, authorization isolation or one durable server effect. Actual
browser-chrome 200% zoom, physical devices/manual AT, users/providers/staging remain
unperformed/deferred. T11, landing and whole-product acceptance remain excluded.
