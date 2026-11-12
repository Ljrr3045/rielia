# Bounded T37 acceptance proposal and T11 handoff

Status: **T37 IN PROGRESS; T37.5 implementation/bounded QA and T37.6 consolidation
complete, final acceptance pending**. The coordinator's current-head delivery-PR
acceptance comment governs after CI, completed native Kilo feedback, ownership and
merge gates. Final delivery: [Draft PR49](https://github.com/Ljrr3045/rielia/pull/49) targets `dev`; current-head delivery gates remain pending.

T37.1–4 are accepted. [PR48 acceptance](https://github.com/Ljrr3045/rielia/pull/48#issuecomment-6818479075) covers the bounded T37.4
batch at `9e9c68bf1564f4a00862363637ff97e00313e66c`, merged into `dev` at
`f628fd3f77bdf3468cf4cd9003ca4ca1091ffea1`; that exact ancestry is integrated here.
Validate check `131053543922` passes in 7m42s; native round3 check `131057532217`
passes in 2m46s with No Issues Found / Merge, and all four finding threads resolved.
The native reviewer could not recompute hashes in its sandbox; independently
verified local fingerprints and CI provide integrity evidence with that limitation.
This accepts neither T37.5/6 nor full T37 or any original T01–T35 ticket.

The user sequence remains T36 → T37 → T11 → other work under existing dependencies.
T36.1–T36.6 were accepted for the bounded scope in [PR44](https://github.com/Ljrr3045/rielia/pull/44);
its [stable contract and owned debt](t36-stable-ui-contract.md) remain historical
and applicable. This work covers existing P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25, UXR01–UXR04/UXR06 and
UX01–UX03/UX05–UX07/UX09/UX11. UX04/sprints are T11 work. No full original
T01–T35, future capability, universal source conformity or public launch is implied.

## Ordered evidence and decision matrix

| Subdelivery | Evidence and actual decision | Remaining boundary |
| --- | --- | --- |
| T37.1 skills/inventory | Accepted [PR45](https://github.com/Ljrr3045/rielia/pull/45); pinned frontend-local packages, corrected fresh discovery and explicit local paths in [frontend skills](frontend-skills.md) and [inventory](t37-ui-inventory.md) | No global/backend skill changes or automatic duplicate-name override |
| T37.2 foundations | Accepted [PR46](https://github.com/Ljrr3045/rielia/pull/46); [tokens/base controls and bounded native evidence](t37-ui-foundations.md) | Proposed brand/name/logo and unperformed device/AT/zoom evidence stay explicit |
| T37.3 shell/identity/workspaces | Accepted [PR47](https://github.com/Ljrr3045/rielia/pull/47), reviewed corrective `b1f3ddec`, merged `55f0f8d`; [shell guide](t37-shell-entry.md) | Real provider/staging/users remain deferred; actual invitation feedback is also exercised in final persisted QA |
| T37.4 projects/tasks/recovery | [Accepted PR48](https://github.com/Ljrr3045/rielia/pull/48#issuecomment-6818479075), reviewed `9e9c68bf`, merge `f628fd3`; focus source `57020a0`, 195 cases, three focused overlap cases and four coordinator-opened corrected4 images; [project/task guide](t37-project-task-ui.md) | Earlier 185-case/10-native and 177-case/26-native/Astra subsets retain their historical sources; this acceptance is bounded to T37.4 |
| T37.5 discovery/cross-surface | [Composed focus QA](t37-discovery-ui.md#composed-modal-focus-integration--2026-11-12): source `fe0bdc9`, build `FS64cq9CNxiMpNAUJK4si`, 195 cases, three overlap viewport cases and one discovery smoke; five SOL-opened PNGs | Coordinator verifies five hashes, opens two changed desktop/discovery PNGs and reuses three identical corrected4 images. Historical `2edecbe` 185/11/3 and `81b` durable-checklist proof keep source/provenance/crop limits; no new DB run |
| T37.6 consolidation | Evidence matrix, preserved contracts, source-qualified limits and T11 handoff are complete for the same final delivery PR | Final T37 acceptance remains pending coordinator decision/current-head CI/native feedback/ownership/merge; T11 remains unstarted and user-scheduled |

Current composed supplement: exact focus source `57020a0` plus final PR48 docs
`9e9c68bf` are locally merged. Source `fe0bdc9`/build `FS64cq9CNxiMpNAUJK4si`
passes **195** frontend cases, three selected-detail/edit-modal viewport cases and
one discovery smoke; SOL actually opens five current focused images. Only DOM
focus ownership changes. Previous 185-case/11-native/3-persisted results remain historical to `2edecbe`;
no new DB run is claimed. Current candidate `c7e1a528`, floors6182/5960/4962/5601
and nullable debt812/29010 preserve the accepted guard debt and all seven other
baselines. Lower form actions/second result remain below crop. Cleanup verifies
six owned PIDs/one port absent. Accepted PR48 ancestry is integrated; final T37 acceptance remains open.

## Preserved contracts and measured limits

The server owns policy, transactions, current access and canonical records. UI
consumes public DTOs and emits explicit intents; controllers/hooks/transports keep
their established direction and lifetimes. Creator/comment author remain separate
from assignee. Delegated and autonomous actors retain distinct authorship and
restricted grants; Agent execution gains no human-only administration.

T37 recovery keeps pending, confirmed, failed, forbidden, conflict and unknown
outcomes distinguishable. The [T37.4 implementation guide](t37-project-task-ui.md#bounded-sol-recovery-implementation--2026-11-12)
records the authorized-form/generic recovery outlets, captured versions, current
capability checks and hidden denied fields. Historical source `81b5180a` persisted
QA proves one durable effect
for an actual committed checklist response loss followed by exact-key retry; this
is not evidence from the later three focused cases or the current DOM-focus head;
screenshots and HTTP doubles alone never establish this. Workspace Done dismisses
link/success, while Refresh's retained invitation success correctly explains a
cleared link. Secrets and drafts remain transient, with no archive of signed
session state/cookies/fixture login URLs.

Historical `2edecbe` web coverage retains 68 inputs, 24 helper/test entries and all **185**
cases, with L/S/F/B floors **6072/5858/4825/5456** and totals 2336/3847,
2542/4339, 511/1059, 2910/5333. Integrated counters/hits equal corrected PR48;
only discovery fingerprint/physical locations differ. The
[unit guide](unit-coverage.md#t375-corrective-integration-baseline) records exact
approved candidate `be0f904d`, nullable debt **812/28926** versus corrected PR48
811/28926 and historical discovery 804/28798, and type-only zero-unit N/A.
Seven other baselines/backend guardrails remain unchanged; existing debt remains.

At historical source `2edecbe`, three targeted actual persisted corrections prove
current authority, safe read503
recovery, original version1/actual409 and zero unintended writes. SSE is held for
these windows; synthetic popstate triggers existing real session/capability reads.
The earlier actual committed checklist exact-key retry remains source-qualified
history. Some earlier persisted records have null runner SHA; their exact script
provenance is unavailable. Both historical persisted-attempt hashes are recorded, and no
retroactive hash or extra runtime is used to conceal that historical limit.
That historical QA made two production build attempts for one completed build after stale owned
generated dev types are removed. The owned helper exits 0, container/volume/state
are absent, four ports and 17 recorded PIDs are closed; heavy lease released.

## Evidence gaps with owners

| Gap or limit | Owner and next action |
| --- | --- |
| Final source/base ancestry and hosted review | Accepted PR48 merge `f628fd3` is integrated with all tested source/tests/eight baselines exact; coordinator freezes final delivery and verifies current-head CI/Kilo/ownership before acceptance |
| Crop-limited empty states/mobile controls | Historical three 320 message panels/mobile literal row and 390×844 denial/revocation lower actions/conflict lower form remain below crop; current focused forms and second discovery row also have lower cropped content. DOM/API results are separate; no full visual coverage claim or extra runtime solely for crops |
| Historical persisted runner provenance | Earlier runner-SHA-null records remain explicit. Historical `2edecbe` helper and both pre-execution runner hashes are captured; the first runner source was revised in place, with its hash/receipts retained and no original source copy. No retroactive exact-script claim |
| Actual browser-chrome 200% zoom, physical devices/OS virtual keyboard, manual AT | SOL/Astra record unperformed checks; later validation uses actual supported controls/devices/AT. Root-font enlargement and synthesized touch remain separately labelled |
| Real users, providers/HTTPS/staging and scale/performance | User scheduling and applicable later work; no credentials requested now. No usability/performance/WCAG certification is inferred |
| Existing structural/coverage/CSS debt | Existing owners and [stable contract](t36-stable-ui-contract.md); no arbitrary universal migration or coverage waiver |

## T11 handoff after explicit T37 acceptance

The existing workspace/project/list/board/detail/discovery shell and stable
presentation → hook/controller → transport/public-contract boundaries form the
bounded foundation. T11 is unstarted and retains its original sprint, UTC/DST, history, permission
and dependency requirements in the immutable architecture/product handoff; no
sprint placeholder is delivered here. The user chooses when to start T11.

Use the [web rules](../../apps/web/AGENTS.md),
[project owners](project-interactions-extraction.md),
[workspace owners](workspace-interactions-extraction.md),
[project/task flows](project-task-flows.md) and [discovery contract](task-discovery.md).
Frontend dispatches explicitly load local
[`frontend-design`](../../apps/web/.agents/skills/frontend-design/SKILL.md),
[`impeccable`](../../apps/web/.agents/skills/impeccable/SKILL.md) and
[`ui-ux-pro-max`](../../apps/web/.agents/skills/ui-ux-pro-max/SKILL.md)
under their [usage restrictions](../../apps/web/.agents/README.md).
Verified Astra high presentation and SOL xhigh logic ownership, separate checkouts
and auto-review/workspace/on-request permissions remain the [workflow](frontend-agent.md).
Third-party provenance/licenses select neither the project license nor final brand.
No landing, waitlist/access calendar, deployment, production publication or T11
implementation is authorized by this consolidation.
