# Bounded T37 acceptance proposal and T11 handoff

Status: **T37 IN PROGRESS; T37.6 consolidation prepared, acceptance pending the
final delivery PR**. This document consolidates evidence; it is not an acceptance
decision. The coordinator's current-head delivery-PR acceptance comment is
authoritative after CI, completed native Kilo feedback, ownership and merge gates.
PR48 still awaits its final review/acceptance; no final delivery PR URL exists yet.

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
| T37.4 projects/tasks/recovery | [PR48](https://github.com/Ljrr3045/rielia/pull/48) pending final native/coordinator acceptance; source `ce60740f`, final local `8d7b937`; 177 frontend cases, 26 native journeys, 20 selected images, 14-image Astra subset; [project/task guide](t37-project-task-ui.md) | Coordinator-supplied test-only infrastructure correction `1f101d2e` passes 20 cases against exact CI reports with source/tests/baselines unchanged. Accepted ancestry/current-head gates still need sync; no claim of PR48 acceptance |
| T37.5 discovery/cross-surface | [Independent QA](t37-discovery-ui.md#independent-final-source-qa--2026-11-12): source `81b5180a`, production build `VWkjHy07GXvUgC1LMg5D8`, 16 unique native cases, 18 actual Astra-inspected images, 12 real persisted journeys and owned cleanup | Finite-DTO production images and actual PostgreSQL/Nest/Next dev evidence are distinct. No blocking visual finding in inspected subset; three 320 message panels remain below crop |
| T37.6 consolidation | This evidence matrix, preserved contracts, remaining gaps and T11 handoff are prepared for the same final delivery PR | Proposal only; coordinator acceptance/current-head CI/native feedback/ownership/merge remain required |

## Preserved contracts and measured limits

The server owns policy, transactions, current access and canonical records. UI
consumes public DTOs and emits explicit intents; controllers/hooks/transports keep
their established direction and lifetimes. Creator/comment author remain separate
from assignee. Delegated and autonomous actors retain distinct authorship and
restricted grants; Agent execution gains no human-only administration.

T37 recovery keeps pending, confirmed, failed, forbidden, conflict and unknown
outcomes distinguishable. The [T37.4 implementation guide](t37-project-task-ui.md#bounded-sol-recovery-implementation--2026-11-12)
records the authorized-form/generic recovery outlets, captured versions, current
capability checks and hidden denied fields. Final real QA proves one durable effect
for an actual committed checklist response loss followed by exact-key retry;
screenshots and HTTP doubles alone never establish this. Workspace Done dismisses
link/success, while Refresh's retained invitation success correctly explains a
cleared link. Secrets and drafts remain transient, with no archive of signed
session state/cookies/fixture login URLs.

Current web coverage retains 68 inputs/all 177 cases and L/S/F/B floors
5994/5781/4739/5362, with totals 2299/3835, 2500/4324, 500/1055, 2845/5305.
All counters/hit vectors remain exact; only the approved discovery fingerprint
and physical locations migrate. The [unit guide](unit-coverage.md#t375-reviewed-discovery-manifest-reconciliation)
records the candidate and nullable precision 804/28798 versus 803 before, plus the
type-only zero-unit N/A input. Seven other baselines and backend guardrails remain
unchanged; owned lifecycle/coverage/CSS debt is not declared solved by T37.

## Evidence gaps with owners

| Gap or limit | Owner and next action |
| --- | --- |
| Final source/base ancestry and hosted review | Coordinator syncs accepted PR48/docs/test-only fix, preserves source/baseline proof, freezes final delivery once and verifies all current-head CI/Kilo/ownership surfaces before acceptance |
| Crop-limited empty states and mobile literal row | SOL native text/API assertions pass; Astra records the exact visually unverified panels/rows. Coordinator accepts this bounded evidence limit; no extra runtime solely for a crop |
| Actual browser-chrome 200% zoom, physical devices/OS virtual keyboard, manual AT | SOL/Astra record unperformed checks; later validation uses actual supported controls/devices/AT. Root-font enlargement and synthesized touch remain separately labelled |
| Real users, providers/HTTPS/staging and scale/performance | User scheduling and applicable later work; no credentials requested now. No usability/performance/WCAG certification is inferred |
| Existing structural/coverage/CSS debt | Existing owners and [stable contract](t36-stable-ui-contract.md); no arbitrary universal migration or coverage waiver |

## T11 handoff after explicit T37 acceptance

The existing workspace/project/list/board/detail/discovery shell and stable
presentation → hook/controller → transport/public-contract boundaries form the
bounded foundation. T11 retains its original sprint, UTC/DST, history, permission
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
