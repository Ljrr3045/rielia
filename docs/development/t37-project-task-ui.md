# T37.4 project/task presentation and recovery

**2026-11-12 — implementation and bounded local validation complete; Draft
publication authorized, T37.4 acceptance pending.** T37.1/2/3 are accepted in
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

Draft publication is not final T37.4 acceptance. Current-head CI/native Kilo,
coordinator review/acceptance and later publication decisions remain required.
Final real PostgreSQL/Nest/Next cross-surface persisted/security QA remains
scheduled in T37.5/6, using the existing QA machinery. Finite HTTP fixtures never
prove persistence, authorization isolation or one durable server effect. Actual
browser-chrome 200% zoom, physical devices/manual AT, users/providers/staging remain
unperformed/deferred. T11, landing and whole-product acceptance remain excluded.
