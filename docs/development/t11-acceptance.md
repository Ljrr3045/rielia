# T11 original lifecycle acceptance evidence

Status: **READY FOR REVIEW** on 2026-11-23 America/Caracas. T11.5 evidence is
complete, including the coordinator-accepted minimal Backlog witness. Final T11
lifecycle acceptance remains pending this documentation head's successful CI and
requested native Kilo, completed feedback/thread dispositions, ownership and
unchanged-head/base checks, then the coordinator's final acceptance and merge.
No source push follows final review merely to rewrite this status: the final PR
or external receipt will govern it. T38 waits for that decision; no adoption is
authorized here.

Scope: original **T11/B1c, P09/US06, UXR01/UX04**, with affected P05/P08/P10/P33,
US05/US08/US12 and UX01/03/05/06/07/09. Authority remains the immutable
[product rules and stories](../handoff/01-product.en.md#24-functional-rules-to-agree-before-coding),
[T11 and history contracts](../handoff/02-architecture-technical-plan.en.md#34-sprint-history-and-reports)
and [UI criteria](../handoff/04-ui-ux-development-guide.en.md#8-acceptance-criteria-and-evidence).
The coordinator bounds this decision to the original sprint lifecycle. Full
adjacent-ticket, US12/device/accessibility, product and public-launch acceptance
is separate.

## Accepted lineage

| Slice | Acceptance | Reviewed → merged |
| --- | --- | --- |
| T11.1 planning/settings | [PR50](https://github.com/Ljrr3045/rielia/pull/50#issuecomment-7025241040); [contract/evidence](sprint-planning.md) | `4ce5775` → `e215973` |
| T11.2 scope/start | [PR51](https://github.com/Ljrr3045/rielia/pull/51#issuecomment-7029096363); [contract/evidence](sprint-scope-start.md) | `a9664418` → `10f0e89` |
| T11.3 close/carryover | [PR52](https://github.com/Ljrr3045/rielia/pull/52#issuecomment-7052975664); [contract/evidence](sprint-closure.md) | `1256241b` → `6507e487` |
| T11.4a client/recovery | [PR54](https://github.com/Ljrr3045/rielia/pull/54#issuecomment-7055439065); [accepted receipt](sprint-client.md#t114a-acceptance--2026-11-20-caracas--november-21-utc) | `4fa0e034` → `a2de3bd` |
| T11.4b production presentation/integration | [PR55](https://github.com/Ljrr3045/rielia/pull/55#issuecomment-7112015425); [checkpoints](sprint-presentation.md) | `91008442511f7e3cccc6d3c5dcbc6080fbf18ec3` → `214d00b3ec3a4128edf43348fc42df05dec49b78` |

PR55's merge tree `8d5fc68eaef2bc113a6be750e91569c607a5f3bb` equals its reviewed
head's tree. Its acceptance covers bounded presentation/integration, not T11.5
or final T11. Earlier then-pending prose remains historical.

## Requirements and evidence

| Original requirement | Implemented and executed evidence | Boundary |
| --- | --- | --- |
| Goal, project-local dates/exclusive end, estimates; T11/P09/US06/UX04 | PR50 date/UTC/DST validation and captured zone; PR51 null/zero/off-scale estimates; PR54/55 forms and canonical totals | Backend owns policy. Native methods and representative layouts remain qualified below |
| One active sprint; one current visit; retained scope/start history; P09, affected P05/P08 | PR51 real constraints, races, complete start references and task observations; PR55 task participation/start and paged native readback | Children are independent/informational; top-level points only. No automatic scheduling or status reset |
| Explicit close with done/canceled/pending and chosen destination; US06/UX04 | PR52 real preview/hash/versions, both destinations, empty/archived/child rules, rollback and exact-key response-loss replay; native N planned-target closure and the minimal Backlog witness below | Complete server totals determine consequences; canceled work is separate from delivery; no reopening |
| Immutable outcome/history after later task changes; P09/P10 | PR51 start references; PR52 frozen closure/outcomes; native F/N later estimate changes leave outcomes fixed; exact-head CI persistence/readback | T22 charts/burndown/velocity and later reporting remain excluded |
| Version conflict, retry, current authority, clear save states; US12/UX05/06/09 | PR54 controller/hook regressions; native F distinct-session real409/rebase, scoped401, commit plus controlled response loss/exact-key retry and private-context replacement; C corrected participation201/409 and auth fences | Controlled transport/identity boundaries are disclosed, not spontaneous outages or provider sign-in; no full US12 conformity |
| Same task across views and usable planning; P05/P08/P33, US05/08, UX01/03/04/07/09 | PR55 canonical task/detail/sprint composition; N representative native forms/paging/capabilities; C changed navigation/chooser/paging/focus/history; minimal witness reload/list/board/detail | No separate task store; absent sprint filters and full device/accessibility acceptance remain separate debts |

### Source-qualified native packets

- **F, November 21:** [SOL recovery/persistence](sprint-presentation.md#sol-frozen-head-recovery-and-persistence--2026-11-21),
  native head `a00fd716`, functional `311cd060`. Real Next/Nest/PostgreSQL,
  enabled DOM activation/native field setters, disclosed held/dropped responses
  and controlled client lease; actual scoped401 separately proves server denial.
- **N, November 21:** [corrected native matrix](sprint-presentation.md#astra-corrected-head-native-matrix--2026-11-21),
  `1dba13af`. Representative 320/390/1280/1440, ES/EN, light/dark, coarse input/
  reduced motion, keyboard/focus, native forms and real 103-participant planned
  carryover/paging/frozen results. Public bulk setup is not UI creation evidence;
  some enabled DOM activation and controlled responses are disclosed.
- **C, November 23:** [seven-correction native checks](sprint-presentation.md#resumed-seven-correction-native-qa--2026-11-23-caracas),
  `379de0e8`, functional `3d37c755` with preserved copy `a60983e7`. All seven
  changed interaction areas passed; representative 390/1280 and controlled real
  201/409/read401/read-error boundaries retain their exact limits.

Seven runtime files and one regression file differ between the earlier F/N
source and accepted final source; N also precedes the approved web baseline.
Current regressions and C cover the corrections. Earlier native packets are not
relabeled as complete final-source replays; manual activity adds no unit hits.

### Minimal Backlog witness — November 23

The coordinator accepted one supplemental witness at exact `214d00b3`. One
existing disposable fixture served real PostgreSQL/Nest/Next. Minimal config/
session/project/task readiness preceded the browser. Canonical API setup arranged
one active Scrum sprint with one pending top-level task estimated at zero; this
is not native creation/start evidence.

At **320×844 ES**, observed-control focus and native Enter opened closure;
ArrowDown chose Backlog, Tab/Enter requested preview and confirmed the enabled
decision. During an observer pause, stale preview correctly disabled confirmation;
a fresh explicit preview was required. Two preview GET200s and one close POST201
were captured. No DOM click/input setter, synthetic event, disabled bypass or
mocked response substituted for the closure.

Public readback showed closed state, `destination=backlog`, one frozen Backlog
outcome and `currentParticipation=null`. The complete Task DTO, raw PostgreSQL
Task row, planning snapshot and `taskRevision` were unchanged: version 2, rank 1024,
estimate 0, content/status/assignment/dates/archive retained. Its initial semantic
status was already `backlog`; preservation of other pending categories retains
the accepted PG/API evidence. Reloaded closed results, list, board and detail
showed the same task/ID/status, zero estimate and unscheduled participation.

Both captures were opened; measured page width remained 320px with 44px dialog
buttons. Obsolete responsive refs/no-op observations and partial initial telemetry
are retained rather than credited. The final sanitized network capture has 288
entries, no truncation: 265 status200, one201 and 22 unknown, not successes. No
new 401/409/timeout or physical-device/AT/zoom claim is made.

The new checkout used one frozen cached bootstrap and only required contracts/API
generation/build, under pnpm's pinned Node24.22.1. All 237 source/test/tool, eight
baseline and 180 API/contracts output fingerprints matched before/after. No full
suite replay or baseline change occurred. Owned page/terminal/servers/labelled
container/volume/private state were removed; generated route imports restored.

External archive identity: `2026-11-23-t11-5/backlog-witness`; original witness
`REPORT.txt` SHA-256
`69688252b00e9a6d98ef92e4bc511eb49509ee8136811dedbb5f34db8cc5d2e8`.
The coordinator verified all 18 original manifest payloads and inspected both
captures. The original manifest, archived as `worker-manifest.json`, has SHA-256
`6b414aec16fa9e21fef04badacc3731d444f16a989baebd63e311fcc069b05c6`.
These portable identities locate preserved evidence without an installation-specific path.

## Exact merged-head checks and review

At `214d00b3`, [run45252075052 / validate137964072231](https://github.com/Ljrr3045/rielia/actions/runs/45252075052/job/137964072231),
App15368, passed all 24 steps: normal **738** (API290/web406/contracts23/prototype19),
infrastructure **20**, real PostgreSQL/HTTP **147**, and Docker migration gating/
reapply/readiness/recovery/queue and database restart. The 17-file artifact's
**16 reports** match approved proposal/normal hashes and sizes. These are
archived CI executions, not a new local replay or native/provider certification.

Approved web baseline is
`89cdc95277c032522ca612d36a8028797a2c8b9affcbb94b5bdf4f000cc24429`; all seven
others remain unchanged. Final PR55 [Kilo137956538828](https://github.com/Ljrr3045/rielia/runs/137956538828)
succeeded at `9100844`, confirming all seven corrected findings/no new issues;
all seven threads were resolved. It is incremental over 13 paths, not a fresh
33-path/per-file-hash/tool-transcript/full-model attestation. PR54/earlier native
hash-tool limits remain. No current-head GitHub APPROVED review is fabricated;
the coordinator used the own-PR ownership-layer exception, with no core bypass.
This documentation head still needs its own configured checks/review and decision.

## Retained scope, debt and decisions

- **Sprint filtering remains T08/T10/US05 work.** [TaskFilters](../../packages/contracts/src/project-tasks.ts),
  [discovery parsing](../../packages/contracts/src/task-discovery.ts), API scoped
  task reads, web transport/query/URL and [task-view-bar](../../apps/web/src/app/projects/task-view-bar.tsx)
  currently expose status/assignee/priority, not sprint filtering. The coordinator
  classifies this concrete gap outside original T11 lifecycle acceptance. Full
  US05/P08/T08/T10, labels and configurable workflows remain unaccepted; no debt
  is erased or filter implemented here.
- **External cross-document Cancel/Leave remains UNVERIFIED.** The user's
  [omission](sprint-presentation.md#user-accepted-native-verification-omission--2026-11-22)
  and possible unsaved-draft-loss risk are retained. Same-document guards do not
  satisfy it; no retest, passing result or universal UX waiver is claimed. The
  coordinator bounds final T11 to original lifecycle requirements, without
  implying full US12/device/accessibility conformity.
- **Evidence limits remain owned:** 11 unit-unexecuted composition functions,
  null952/37598 mappings, representative layouts and controlled native methods,
  unavailable physical touch/device/AT/zoom and the unexplained earlier native
  target loss despite later successful minimal/resumed runs. No universal
  lifecycle/source/AA/real-user certification follows from numerical gates.
- **Separate follow-up:** Next's security-upgrade recommendation, inherited
  Node-action deprecation warning, dated root one low/14 moderate and tooling two
  moderate audit findings. No dependency/security suppression or upgrade here.
- **Deferred/excluded:** real providers/staging/credentials/real-user scheduling
  stay deferred without requests or passed claims; T12/T13 credentials/MCP,
  T22 reporting, T38 libraries, landing, deployment and promotion to main remain
  outside this delivery. Existing dependencies and immutable handoff are unchanged.

Only documentation formatting, handoff/link/whitespace checks and normal commit
hooks apply to this consolidation. The current-head CI/Kilo and coordinator
publication/acceptance/merge gates remain required; accepted PR55 CI is not
substituted for them.
