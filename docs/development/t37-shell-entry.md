# T37.3 shell and entry-flow presentation checkpoint

## Current delivery status

T37.1 is accepted in merged [PR #45](https://github.com/Ljrr3045/rielia/pull/45);
T37.2 is accepted in merged [PR #46](https://github.com/Ljrr3045/rielia/pull/46) at
`8647f19fc3e359716d64eb649ff0ef79775cdf13`. **T37.3 remains IN PROGRESS**, prepared
for consolidated Draft publication to `dev`; current-head CI/native review and
coordinator acceptance remain required. Earlier dated pending/blocker statements
below retain their historical source and are superseded by the later evidence.

Integrated source/test/coverage head is
`d3cc5362aa0a0c4439b2d4b91c1c02d1b9b9fbc9`, fast-forwarded after the coordinator
accepted its exact baseline migration and one normal passing `pnpm unit:web` gate.
All 92 compiled-source and 23 test/helper hashes match the independently tested
source `9f9f07f7ae66917377b6bd5dfbe1f1f356eb51a2`; the production build originated
from working-tree snapshot `b93210f9f512ee6958941d199a18556f749a21b123fcfb1cb23932b7ffb27fa1`
and is **`exXrwr4o43S12E7dSkmxO`**. Commit equivalence was checked afterward;
the build is not relabelled as having run from a later commit. Publication changes
after integration are documentation only and preserve these bytes and the reviewed
web baseline `9e85d482a01099d38b2101cdcef6d83b57ba21722562239bf9c61c67f6f50f16`.

The delivered batch combines Astra shell/identity/workspace presentation, SOL's
minimal existing-prop invitation success discriminator and ES/EN wording, ten
real-hook/component regressions, and the explicitly reviewed current-web coverage
reconciliation. No controller/token policy, transport/backend, dependency/lock,
new route/capability, skill resource or immutable handoff changes. The initial
presentation-only statements below describe that earlier ownership checkpoint.

## Original implementation checkpoint

**2026-11-11, America/Caracas — implementation checkpoint, not acceptance.**
Prepared in `feat/t37-shell-entry` from frozen T37.2 PR #46 head
`1e2ed071283ad5da4d52f6658a75d2f87db62aee`, on the accepted T37.1 ancestry.
The coordinator authorized isolated work during PR #46 native review; this does
not accept or publish T37.2/T37.3. See the [direction](t37-design-direction.md),
[foundation evidence](t37-ui-foundations.md), [inventory](t37-ui-inventory.md)
and [stable behavioral contract](t36-stable-ui-contract.md).

## Scope and composition

This is T37.3 presentation under P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25 and UX01–03/05–07/09/11. UXR01 informs the
stable work rail; UXR03 supports readable narrow layouts. The recorded Linear
member/invitation pattern informs aligned rows, without importing its domain.
Existing reference observations are reused; no new Mobbin search or copied asset.
P09/US06/UX04 sprint work, T11, UXR05, task/list/board/detail/discovery interiors,
landing, new routes/capabilities and final branding remain excluded.

| Surface | Presentation intent |
| --- | --- |
| Identity | A 36rem maximum reading column with a compact session panel, vertically grouped configured-provider actions and separated return guidance. A plain text wrapper keeps bilingual button copy in one text flow. All original ES/EN words, English spans, states and action nodes remain |
| Project shell | A 14rem desktop rail at the existing 1024 CSS px threshold; sentence-case group labels, wrapping project names and separate secondary workspace administration. Work area gutters are 16px narrow/24px desktop at the default root. The secondary mobile context uses visual ellipsis beside the existing menu/create controls after the native correction below; complete DOM text and the full primary title remain. The existing drawer receives safe-area padding |
| Workspace entry | A 68rem content measure, visible wrapping current-workspace heading, selector and aligned role/owner summary. Projects is a global entry beside Back home; account, locale and Refresh remain in the existing header |
| Members and Agents | One contiguous list surface with row dividers, name/status alignment on wide screens and stacked narrow rows. Existing type/state badges, owner protection, inactive/revoked explanations, custodians and target-specific controls remain visible. Native disclosure markers return through list-item styling; no new disclosure state |
| Invitations and recovery | Form/list spacing and aligned recipient metadata; revoke confirmation spans its whole row. Inbound Accept/Dismiss, generated-link Copy/Done/manual-copy fallback and operation feedback retain their actual parents, conditions and lifetime. Read loading remains distinct from mutation feedback |

The existing global semantic palette, system fonts, 44px control minimum,
16px mobile fields, focus outlines and reduced-motion behavior are reused.
No new palette, icon, font, asset, package, theme preference or animation.
These dimensions describe authored CSS, not measurements of this checkpoint.

## Source boundaries and coordinator decision

Astra edits only the three existing CSS families, presentation markup in
`identity/page.tsx`, `identity-view.tsx`, `project-shell.tsx`,
`workspace-view.tsx`, `workspace-entry.tsx`, and one workspace copy entry.
All hooks, handler bodies, conditions/capabilities, keys, refs, IDs, existing
hrefs/queries, form submission, state and commands remain untouched.
The Bilingual helper gains a text span; no stateful component is replaced.
No test/controller/transport/proxy/service/contract/backend/dependency/lock/
coverage/tooling-policy source changes. `/` stays technical and `/prototype`
stays isolated. The 1280 contextual-detail threshold is unchanged.

Source inspection found **no Projects link in the workspace page**, despite the
dispatch's reference to an existing entry. The coordinator explicitly authorized
one additive plain Next Link to `/projects` as global navigation, with localized
Projects wording and no callback, query, selection persistence, guard or route
default change. It does not promise to open the currently displayed workspace.
Contextual workspace-to-project transfer and draft-safe route departure remain
SOL-owned; this new link has ordinary route-navigation semantics and does not
add draft retention. Existing memory/return disclosures are retained.

Generated invitation feedback keeps its existing placement outside ready-state
administration; moving it under InviteForm would change component lifetime.
This does **not** preserve the link across recovery: SOL verified that unchanged
`workspace-controller` readFailure clears `invitationLink` after both follow-up
403 and 503; refresh, selection and session recovery also clear it. Confirmed
write success survives, but the generated link and copy fallback do not.
The initial checkpoint's link-survival explanation was incorrect and is
superseded by this correction. Copy/Done and copy-failure text stay together only
while a link is present. Keep token clearing/security unchanged; truthful
conditional recovery messaging and any result relocation remain SOL-owned
follow-ups before acceptance as needed.
Workspace confirmed-write/read403/read503 success and scoped-row clearing retain
their source behavior. The three inherited project/collaboration recovery debts
remain SOL T37.4 work and are not concealed by CSS.

## Evidence and next validation

Coordinator verification binds the session to `gpt-6-astra` high,
auto_review/on-request/workspace-write and frontend cwd. All three intended local
`.agents/skills/<name>/SKILL.md` paths were explicitly loaded. Project context and
Impeccable Operate/craft references were read directly; no engine, launcher,
hooks, Apply, bundled agent, global duplicate or configuration change was used.

Three retained T37.2 images were inspected only as baseline evidence: workspace
populated light EN 1440, identity signed-out dark 390, and corrected board light
EN 1440. Their provenance remains in the foundation guide; none depicts this
checkpoint. The workspace capture shows separate member cards and the identity
capture shows bilingual button text splitting into parallel flex items, informing
the changes above. No new rendered result is claimed.

One authorized offline frozen install reused 541 packages with zero downloads;
pnpm 12.15.0/Node 24.22.1, lock unchanged, shared Git config preserved. No suggested
package skill was approved. Checkpoint verification is limited to source-diff
review, adopted formatting, immutable handoff/local links, whitespace and mandatory
staged-source/commit-message hooks. Exact command outcomes and changed-file SHA-256
hashes accompany the external delivery report. No functional unit is added for
this presentation-only ownership; independent SOL behavior validation is required.

SOL next validates the exact committed source in a separate checkout: identity
pending/unavailable/disabled/cancel/retry/sign-out; workspace roles/owner, long
names, membership/Agent states, invitations and copy failure; retained success
after read403/503; draft/session replacement; drawer inertness/focus return and
modal consumed Escape. Cover ES/EN, light/dark, 320/375/390/768/1024/1440 and
844×390, plus affected threshold crossings. Measure actual contrast, 44px targets,
16px fields, native disclosure behavior, wrapping, focus and reachable controls.
Check the narrower rail at 1280 contextual detail, long shell context and short
landscape. Astra then inspects the actual captures and corrects demonstrated issues.

No runtime/server/build/browser/Docker/full suite ran in this checkpoint.
Persistence, actual browser-chrome zoom, physical device/virtual keyboard, manual
AT, real OAuth/providers/staging and real-user acceptance are unperformed here.
Screenshots do not prove persistence. Coordinator base sync after PR #46,
independent SOL validation, later consolidated Draft publication, current-head
CI/native review and bounded acceptance remain required. No push, PR creation,
Ready/review/merge/deploy or worktree deletion is authorized in this checkpoint.


## Native visual review and bounded correction (2026-11-11)

This review inspected twelve actual images from immutable `fbc082975d2387748000d6fd303de18760247d56`,
compiled build `B4VarUs7QHLK6SVdmvGsG`, supplied by SOL. Exact filenames and
SHA-256 values are retained in the external visual-review manifest. Images
show viewport crops, not proof of below-fold states, focus behavior or persistence.

| Viewed capture(s) | Observation and disposition |
| --- | --- |
| `shell-390x844-light-en`, `shell-320x720-light-es` | Full long secondary mobile context repeats the primary title and consumes much of the first viewport. Correct only `.mobileTitle` to a single line with ellipsis; preserve complete DOM text, primary title, menu/add controls and callbacks |
| `shell-844x390-dark-en` | The same repeated context consumes several lines in short landscape. Apply the same secondary-only correction; full heading/breadcrumb interiors remain unchanged |
| `shell-1024x768-dark-en` | Rail, My tasks/Search/project entries and full long heading remain readable. The long rail item occupies substantial height but remains uncut; no further change in this batch |
| `shell-1280x900-dark-en-detail`, `shell-1440x960-light-en-detail` | Work and contextual detail remain distinct. At 1280, long unbroken breadcrumb text visibly continues beneath the detail edge; SOL reports text-right 923.56 versus panel-left 824. Protected interior source is unchanged: explicit Astra-owned T37.4 correction, not fixed here |
| `workspace-populated-light-1440` | Contiguous member rows, badges, protected-owner note and native disclosure markers are visible. Refresh unnecessarily wraps below the account controls. Give `.topbarActions` `flex: 1 1 36rem` so it uses remaining header width, while retaining wrapping |
| `workspace-long-dark-390` | Long workspace/owner text wraps; the short role value drifts vertically beside the tall owner value. Give each `.workspaceSummary div` `align-content: start` so label/value tracks stay together |
| `workspace-member-states-dark-320-en` | Long title, selector and unavailable-owner text remain readable; the crop ends at the member section introduction, so member-state rows are not visually established by this image. Summary alignment correction applies |
| `workspace-admin-states-dark-768-es` | Refresh also wraps at this width; the header allocation correction applies. First member row and disclosure remain readable; the crop does not establish all seven rows or Agent administration |
| `identity-signed-out-light-320` | Bilingual provider labels read as one wrapping text flow. Return guidance extends below the crop; no complete-flow claim |
| `identity-signed-in-dark-375` | Session identity, sign-out, return guidance and Workspaces entry are readable in the viewport. No identity CSS correction is justified by these selected images |

All listed filenames end in `.png`. No extra diagnostic images were inspected.
The three CSS corrections add no JS, condition, truncation logic, tooltip,
handler, ref, route, state or control-size change. Ellipsis is an explicit
exception for duplicated secondary navigation context only. No primary title,
task row or desktop project link is clipped by this correction.

PR #46 foundations are now coordinator-accepted and merged at
`8647f19fc3e359716d64eb649ff0ef79775cdf13`, with head/postmerge CI and native checks
reported passed. Local merge `ba4d59811cffdeb6ba514fa524a20b89158d4c7f` preserves
that ancestry without content conflicts; the initial review-pending statements
above describe the earlier checkpoint. T37.3 remains unaccepted and unpublished.

SOL's baseline validation results remain bound to `fbc0829`; they do not validate
this CSS correction. Targeted revalidation must cover 320/390 mobile and 844×390
landscape context, 44px menu/add controls, full DOM/accessible context and primary
title, plus workspace header grouping at 1440/768/390/320 with long account and
owner names, both locales/themes and existing focus/disabled states. Check no
new page overflow and top-aligned role/owner values, then retain corrected images
for Astra inspection. The 1024 rail/1280 detail semantics are unchanged.

Only low-cost format/handoff/diff and mandatory hooks run in this review task;
no install, build, runtime, browser, service or full test suite. Physical devices,
AT, actual browser-chrome zoom, provider/staging and persistence evidence remain
outside this visual review. No after-correction render or acceptance is claimed.


## Truthful invitation feedback and targeted revalidation (2026-11-11)

SOL's bounded correction starts from Astra `5af198a009a7a9fbda19a9f0148eb68c89aaebb3`.
`OperationPanel` uses its existing confirmed outcome, last-action type and
`invitationLinkVisible` to distinguish an available generated link from a cleared
temporary result. ES/EN copy confirms creation without promising a missing link,
explains that Refresh cannot restore it, and directs the user to review the list
once readable. Only if the link was not copied and current permission permits it
should the user explicitly revoke that invitation before choosing a replacement.
No automatic invite retry/action, token retention, state/effect/controller,
transport, policy, CSS or dependency change is introduced. Uncertain
`invitation-link-unavailable` recovery remains separate from confirmed success.

Ten new real-hook/component DOM regressions cover read403/503 in both languages,
visible-link/manual-copy/Done, read recovery and dismiss without another POST,
inbound separation, refresh/selection/account replacement/expiry clearing, and
unrelated success versus uncertain recovery. Only CSS and HTTP/browser boundaries
are controlled. All 155 frontend unit cases pass. **The initial unchanged coverage gate
failed** its exact source/test manifest comparison: six incoming T37.3 source
fingerprints already differed from accepted T36, and this correction adds the
feedback change and regression file. Read-only normalization of that same run
measures L1649/3793, S1818/4269, F335/1051, B1665/5196; its numerical comparator
also rejects the changed branch denominator (5196 versus 5192). At that checkpoint no baseline,
threshold, source selection, exclusion or policy was changed. The reviewed
reconciliation below supersedes that checkpoint blocker.

One production build, `exXrwr4o43S12E7dSkmxO`, passes alongside affected type/lint
checks. Nineteen targeted installed-Brave cases pass, with 23 captures bound to
exact source hashes; the build originates from the tested working-tree snapshot
and final commit equivalence is verified separately. These samples confirm:

- Secondary mobile context at 320/390 and 844×390 uses visual ellipsis while the
  complete DOM/accessibility text and primary h1 remain; menu/add are 44×44px,
  and keyboard menu return remains functional.
- Workspace header allocation at 1440/768/390/320 supports short/long account and
  owner names, ES/EN and light/dark; short-account controls share a row at 1440/768.
  Role/owner label/value tracks align at the top with long values.
- Failed follow-up 403/503 retains confirmed invitation success with truthful
  unavailable-link feedback, read recovery/dismiss and no mutation retry; successful
  reads do not restore the token. Original visible-link copy/manual fallback,
  Done and clearing remain. The pending header retains disabled Refresh.
- No sampled whole-page overflow/unresolved CSS variable; changed-surface control
  minimum is 44px and narrow fields are 16px. Sampled enabled-control text contrast
  is at least 5.231:1; this is computed evidence, not WCAG certification.

One cached offline isolated-unit-tool preparation reuses 406 packages with zero
downloads. Runtime/browser resources are stopped; foreign listeners remain.
The earlier `fbc0829` / `B4VarUs7QHLK6SVdmvGsG` baseline evidence is unchanged.
Astra must inspect corrected images. The inherited 1280 breadcrumb overlap stays
Astra-owned T37.4; all three project/collaboration recovery debts remain open.
Actual browser-chrome 200% zoom, physical device/AT/provider/staging and real
PostgreSQL/Nest/Next persisted/security QA are unperformed. The later reviewed migration below resolves the local coverage blocker;
current-head CI/native review, consolidated Draft publication and coordinator
acceptance remain required. This correction does not accept T37.3 or T37.


## Reviewed current-web coverage reconciliation (2026-11-11)

The coordinator approved the exact current-web candidate after reviewing retained
source/test fingerprints, per-file counters, provider/config equality and mapped
branch outcomes through a blocking decision. This explicit authorization and the
following passing normal gate supersede the earlier coverage-blocker statements;
those failures remain historical evidence, not a current unresolved local gate.

Only `scripts/unit/baselines/web.json` migrates. Accepted SHA-256
`15fd5321b42a3bcbc221aa72ceaba8355d7ea33f485794ef92a0a2e23b36fc35` becomes
`9e85d482a01099d38b2101cdcef6d83b57ba21722562239bf9c61c67f6f50f16`.
All seven other current/historical baselines, provider/compiler/runtime/tool-lock,
shared config, source selection, exclusions and gate implementations remain exact.
The [unit-guide addendum](unit-coverage.md#t373-reviewed-current-web-baseline-migration)
records all before/after counts, raised floors and retained mapping/zero-unit debt.

The candidate reuses the complete retained 155-pass report and the existing
`baselineFor`/manifest semantics; no measurement rerun was needed. All 68 original
source contents were verified against the retained instrumented source maps,
and every selected test/helper against the retained mirror. The 68-input inventory
is unchanged, 64 file counters are exact and four files improve. Seven expected
source fingerprints change; the sole added test fingerprint is the ten-regression
workspace-feedback suite, with every prior test/helper byte-identical.

One normal `pnpm unit:web` now passes all **155 cases**, exact manifests, all-source
L/S/F/B floors, per-file/nonregression gates and source-bound mapping checks. Its
counts, maps and hit vectors reproduce the retained run exactly:
L1649/3793, S1818/4269, F335/1051, B1665/5196. L/S/F/B floors rise to
4347/4258/3187/3204 basis points. No counter nondeterminism or regression was found.

No app/test source, build, browser or runtime changes occur in this migration.
The 92 compiled-source hashes from `9f9f07f` still match; existing build
`exXrwr4o43S12E7dSkmxO`, 19 native checks and 23 captures retain their original
provenance. No duplicate install/build/native matrix ran. Mapping precision debt
(797 current null-column points) and the type-only zero-unit collaboration-view
input remain explicit. Corrected-image/publication integration, current-head
CI/native review and coordinator T37.3 acceptance remain separate gates;
real persisted/security/device/AT/provider/staging/actual-zoom limits still apply.


## Corrected-source visual review and publication evidence (2026-11-11)

Astra independently viewed eleven corrected compiled-route PNGs and their
measurements from the build above. The external `final-visual-manifest.json`
retains exact PNG/metadata hashes; the source binding is independently rechecked
in the publication checkout. No further aesthetic/source correction was justified.

| Actual corrected images | Observed result |
| --- | --- |
| `mobile-title-320-light-es.png`, `mobile-title-390-dark-en.png`, `mobile-title-844-dark-en.png` | Secondary context is one line with visual ellipsis; full primary heading remains untruncated, with a visible focused menu boundary. SOL metadata/interaction assertions separately establish complete DOM/accessibility text, 44×44px menu/add targets and keyboard focus return; images alone do not prove these behaviors |
| `workspace-header-1440-light-en-short.png`, `workspace-header-768-dark-es-short.png` | Refresh remains in the account-action row; navigation/locale/account grouping is readable without the earlier isolated Refresh row |
| `workspace-summary-390-dark-es-long.png`, `workspace-summary-320-light-en-long.png` | Role and owner values start together; long account/email/owner text wraps. Some content continues below the crop, so this view does not prove below-fold reachability |
| `invitation-confirmed-read403-dark-320-es.png`, `invitation-confirmed-read503-light-390-en.png` | Saved creation is distinct from unavailable secret and follow-up read failure. Copy says Refresh cannot restore the link and makes review/revocation/replacement deliberate and permission-dependent |
| `invitation-after-read-recovery-503-light-390-en.png` | Unavailable-link confirmation remains truthful after successful read recovery, while the transient read-failure explanation is gone |
| `invitation-link-copied-light-390.png` | Visible one-time link, Copy/Done and copied feedback remain grouped; available-below success text is truthful while that link is present |

All selected metadata names the same build/snapshot and reports no whole-page
overflow. Actual visible product-language subtrees are described above; some
metadata still records the unchanged Spanish document-root language. Native
evidence uses installed Brave with controlled public HTTP DTO/clipboard fixtures;
it is separate from real PostgreSQL/Nest/Next persistence/security proof.

The normal frontend gate passes **155 cases**, including ten new regressions;
exact source/test manifests, all-source/per-file/nonregression checks and raised
floors pass. Nineteen targeted native cases and 23 retained captures cover the
corrected source. The 68-source inventory, seven protected baseline files,
provider/config/tool lock, prior tests and mapping-debt ownership remain intact;
see the [reviewed unit migration](unit-coverage.md#t373-reviewed-current-web-baseline-migration).
Affected lint/typecheck/build evidence belongs to SOL; this publication task runs
only documentation/format/handoff/diff checks and mandatory hooks, with no repeated
runtime/build/browser/install/Docker/full suite.

Remaining T37.4 work: Astra's long breadcrumb crossing beneath contextual detail
at 1280, plus SOL's project mutation403 recovery, confirmed project-write/read503
hidden success, and checklist pending-versus-unknown discriminator. The plain
Projects global link does not carry current-workspace selection or add draft-safe
departure; any contextual integration/result relocation remains separately scoped.
T37.3 does not accept these debts or close T37/T11. Actual browser-chrome 200%
zoom, physical devices/virtual keyboard, manual AT, real-user/provider/staging and
real persisted/security QA remain unperformed here. Current-head hosted CI/native
review and coordinator acceptance remain required; publication stays Draft.
