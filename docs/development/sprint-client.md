# T11.4a sprint client logic and presentation handoff

## Current publication and local evidence

[Draft PR73](https://github.com/Ljrr3045/rielia/pull/73) targets `dev` from initial implementation head [23d01e8](https://github.com/Ljrr3045/rielia/commit/23d01e88c11ffdc1c3cc590573f2b142a4ffd105).
Local gates are complete: normal **1,066 tests / 199 inputs**, sixteen exact
reports plus status, infrastructure **20/20** and **17** bounded artifact payloads,
without upload. Root adopted only web baseline `30fbe046`; seven other baselines
remain exact. The [resource guide](t38-sprint-query.md) records detailed evidence,
source-qualified costs, rejected/corrected chronology and retained limits.

[PR72's final decision](https://github.com/Ljrr3045/rielia/pull/72) accepts only the
initial planning/list/create slice. The remaining nine resources are published
and locally verified, pending final reference-head CI, native review and coordinator
acceptance. Full T38.4a/T38 remains open. Earlier checkpoints below preserve their
original source identities and do not override this publication/local status.

## Historical candidate1 numerical correction gate

The [resource batch](t38-sprint-query.md) passes its one complete standard/sole
candidate build and1060/199 all-scope measurement. The first numerical candidate
is rejected: eight protected comparisons miss, including global uncoveredL/S/B
+5/+8/+9; better aggregate ratios do not waive them. All tracked baselines and
production remain frozen. A bounded public-witness correction proposal awaits
root; no normal replay, infrastructure/artifacts, additional measure or delivery
is released. The earlier implementation checkpoint below retains its actual
source/run chronology; fullT38.4a/T38 acceptance remains open.

## Historical remaining-resource Query implementation checkpoint

PR72's final **Coordinator acceptance — T38.4a initial slice ACCEPTED**
[decision](https://github.com/Ljrr3045/rielia/pull/72) accepts planning/list/create only,
reviewed `26ac8d7d5292500e169223518630ab3be5be2ef5`, merged
`fe9e53c7be172e0da7bca34b4685054b36af8a14`. Its reviewed-head/exact-merge
CI passed 26/26 and native Kilo found no issues across 21 paths. Earlier pending
labels below are frozen source snapshots, superseded only for that bounded slice.

The [next resource batch](t38-sprint-query.md) removes the remaining nine controller
DTO caches/read executors. Query alone owns all11 resources through typed selected
slots and cursor chains in the existing lifetime/client. The controller retains
captured versions, exact retry/recovery, navigation and scheduling; forms, focus,
transport/policy and parent verification/SSE retain their accepted owners. Explicit
preview and canonical closure/outcome relations remain. Focused270/native HTTP4
pass; standard/build/numerical and final coordinator gates remain open. Earlier
current/pending paragraphs below are preserved snapshots, not new acceptance.

## Current T38.4a local ownership and numerical state

The [initial Query slice](t38-sprint-query.md) moves canonical `planning` and
`sprints` pages to Query alone. The controller retains nine other resources,
versions, draft/recovery/navigation and confirmation; its public snapshot derives
the migrated DTOs. Only create-sprint executes through a Query mutation. The
parent retains session/SSE and is refreshed once after confirmation, sharing one
authorized child drain with verification/resume. Terminal 401/403 cannot reopen
through stale props, hints or child Refresh; the existing parent verifies recovery.

Exact root-only web adoption and normal 971/198/all 16 report bytes, infrastructure 20
and bounded artifacts 17 pass. The guide preserves rejected candidates, residual
unit debt and actual check/cost limits. Forms, presentation, backend and wire policy
stay unchanged. Publication/current-head CI/native review/coordinator acceptance
remain open; no full T38.4a/T38 acceptance. Historical T11 receipts below retain
their accepted scope and original source identities.

Status: ACCEPTED in merged [PR54](https://github.com/Ljrr3045/rielia/pull/54#issuecomment-7055439065).
The acceptance receipt below governs the historical pre-acceptance records. This is the logic prerequisite for separately owned T11.4b
presentation, addressing T11/B1c, P09/US06, affected P05/P08/P10 and US05/US12,
UX04/UXR01 and existing recovery/localization requirements. It starts from
accepted [T11.3 PR52](https://github.com/Ljrr3045/rielia/pull/52#issuecomment-7052975664),
reviewed `1256241b9f26baf60484db302e4df2d6bc35c5d7`, merged
`6507e487954fc411b11f807e0eddf850fd223805`. The
[closure guide](sprint-closure.md) records incremental native round 2, fixed/resolved
full-round findings, absent formal APPROVED and exact successful postmerge CI.
Earlier then-pending records remain historical.

No JSX, CSS, route composition or new product/API flow was added by T11.4a.
Original T11/T11.5 and bounded T11.4b presentation were subsequently
[accepted in PR56](https://github.com/Ljrr3045/rielia/pull/56#issuecomment-7114539999),
reviewed `a9d159f`, merged `f020a423`. The user authorized
[T38's staged engineering work](t38-tooling-plan.md) on 2026-11-23; this guide's
dated receipts and T11.4a-only scope remain historical. No T12/T13, T22 reports,
prototype policy, landing, deployment or provider/staging/user acceptance is implied.

## T11.4a acceptance — 2026-11-20 Caracas / November 21 UTC

The coordinator accepted [PR54](https://github.com/Ljrr3045/rielia/pull/54#issuecomment-7055439065),
reviewed `4fa0e0346d2260a7a87d31cd6685456b27146061`, merged as
`a2de3bd79596cb83b79287f105f60fedfb35bea9` at `2026-11-21T01:51:21Z`.
Coordinator-supplied exact postmerge [CI44852600065 / validate136687219095](https://github.com/Ljrr3045/rielia/actions/runs/44852600065/job/136687219095)
from App15368 succeeded with all 24 steps. Native second-round
[check136681052403](https://github.com/Ljrr3045/rielia/runs/136681052403), App2193792,
succeeded with No Issues / Merge over seven incremental files after the full
20-file first round; both findings were fixed/resolved. No formal APPROVED is
claimed. Kilo could not recompute hashes; the coordinator independently checked
source/test/baseline/CI-artifact identity and retained that limitation.

Accepted current-web baseline is
`e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c`, with 639 normal
cases, 307 web. These are accepted T11.4a receipts, not new presentation checks.
The dated pending sections below remain historical. [T11.4b presentation](sprint-presentation.md)
is in progress; T11.5 and full T11 remain open before planned T38.

## Owners and integration

| Owner under `apps/web/src/lib` | Responsibility |
| --- | --- |
| `sprint-client-state.ts` | Typed resource/draft/result contracts, empty state, immutable memory snapshots, page binding and projection of the exact server close binding |
| `sprint-commands.ts` | Capture public concurrency versions/capabilities, edit values without replacing preconditions, explicit review/rebase, public field validation |
| `sprint-controller.ts` | Scoped reads/pagination, abort and completion fences, recoverable commands, authorization loss and preview invalidation |
| `use-project-sprints.ts` | React lifecycle, execution-context render fence, expiry timer and subscription to the existing project event owner |
| `use-project-tasks.ts` | Existing sole identity/project/SSE lifetime; additive `subscribeInvalidation` port distributes existing stream and visible-return hints |
| Existing `sprint-client.ts` / `task-planning-client.ts` | Unchanged production HTTP/protocol/scoped-response boundaries |

The later Astra screen mounts `useProjectSprints(project, selection)` beside its
single existing `useProjectTasks()` instance. `project` is the typed
`SprintProjectPort` projection of that hook; `selection` explicitly supplies
`sprintId` and `taskId` (both nullable). No second session fetch, event connection,
global store or persistent cache is introduced. Unmount aborts owned requests,
clears private state and removes only its subscription/timer. Confirmed sprint
writes request a canonical parent refresh once; parent failures never relabel a
confirmed write as unknown. This batch does not choose the later URL/layout.

Render `resources` as typed canonical DTOs with `status`, `stale`, `loadingMore`
and sanitized `failure` (`status`, protocol `code`, `requestId`). Resource names:
`planning`, `sprints`, `sprint`, `target`, `task`, `scope`, `sprintHistory`,
`taskHistory`, `preview`, `closure`, `outcomes`. Initial/context reads load settings
and the supported all-state sprint list. Selection loads detail/scope/history and
task sidecars; closed selection additionally loads immutable closure/outcomes.
`selectTarget(id)` explicitly reads a task-participation destination's current
version and capabilities. Server capabilities govern controls, including Kanban,
archived/read-only contexts and current active-Sprint restrictions.

`select(sprintId, taskId)` returns false during a draft, pending write or unknown
recovery; presentation retains the current view or asks the user to resolve that
draft. Context/principal/session replacement forcibly clears sensitive state,
including keys, results, previews, selections and drafts. Ordinary read/network
errors retain memory drafts. A temporary null session during the parent identity
verification suspends requests and hides all private state, retaining drafts only
until the same verified session resumes or its original expiry is reached. A
failed verification remains hidden; confirmed logout/access loss or a different
context clears that retained state. No local/session storage is used. All user-facing
copy belongs to the later ES/EN presentation; logic exposes only typed states,
reason discriminators and public DTOs.

## Intents and failure recovery

1. `stage(intent)` captures the current versions once and returns a typed
   eligibility reason. Intents cover configure/create/edit/estimate/participation/
   start/close. Presentation supplies only editable values and explicit target
   choices; versions, actor and policy are not form fields. `changeDraft(intent)`
   updates editable values without replacing the captured source preconditions.
   Open the draft before editing if a form needs to retain version N across later
   reads. Field-level touched/focus/copy remains presentation-owned.
2. `submit()` validates public settings/fields and normalizes name/goal whitespace
   before capturing an immutable key/command. No optimistic success is published.
   Duplicate pending writes, replacement intents and navigation are guarded.
   A definite 400 retains the editable draft; a corrected submit uses a new key.
3. Transport/network/408/5xx or malformed-success ambiguity exposes `unknown`
   with `recovery.command` and `recovery.key`. `retrySave()` alone resends that
   exact original normalized command/key, even after later authorized reads or
   invalidation. `cancelPending()` is also unknown, not rollback. Explicit discard
   abandons only local recovery and cannot undo a possibly committed operation.
4. A 409 exposes authorized `mutation.current` separately from the user's draft,
   invalidates resources, and sets `needsReview`. Refresh then `rebaseDraft()` is
   an explicit user decision; it retains editable values while capturing fresh
   preconditions. Conflict values never overwrite the form silently. Close has
   stricter preview rules below. Protocol codes remain available for specific
   archived/transition/idempotency messages.
5. 401/403 and stream denial abort obsolete work and clear private content,
   results and keys. 403 exposes a forbidden state with only context IDs retained;
   explicit refresh rechecks access. 401 needs a new authenticated parent context.
   Expiry, logout, principal/session/workspace/project change and unmount prevent
   late completions from restoring content. The hook masks old data during the
   render before effects switch the owner.

`refresh()` and matching project/task/reset hints abort obsolete reads and mark
loaded snapshots stale. Drafts retain captured values; writes pending at the time
defer new reads until a confirmed result, while previews become stale immediately.
Heartbeat/unrelated-project hints do nothing. SSE carries invalidation only, not
Sprint content or success authority. Visible return uses the parent's existing
visibility behavior. `reload(name)` retries a first page/read; `loadMore(name)`
appends only a consistent revision/binding and suppresses simultaneous paging.
`page-changed`, changed metadata, duplicate identities, cursor nonprogress and
total overflow retain old rows as stale with a `changed` state. Refresh the first
page explicitly; no silent continuation rebase or automatic write retry occurs.

## Explicit close review

`preview(destination)` is an explicit write-authorized read, where null means
unselected, `backlog` means unscheduled, or an ID means the chosen planned Sprint.
The server's complete `pendingParticipants`, totals, `canClose`, versions, schema
and hash are authoritative. A preview for a newer Sprint version cannot confirm
metadata the client has not yet read and reviewed. The client does not count visible rows to decide
whether pending work exists, derive points, resolve dates/DST or simulate policy.

`stage({type: 'close-sprint'})` requires a fresh server preview and close
capability. It projects only the exact binding fields into the command. Review
pages cannot mix hashes, destinations or revisions. Any invalidation/relevant
read retry makes the old preview stale; a staged close cannot be rebased. Discard
that decision, obtain a new explicit preview and stage/confirm again. Unknown
close recovery still retains its original destination/hash/versions/key, because
an already committed original operation may be replayed. No implicit carryover,
Sprint creation/start, Task reset or closed-Sprint reopening exists.

Closure/outcome/history reads work for authorized read-only viewers without
calling close-preview. Immutable outcome pages bind the closure identity/total,
retain original snapshots and distinguish done/canceled/backlog/carried. Live
task state is not substituted for those frozen facts.

## Validation and delivery gates

The new deterministic suites use the real controller, transports, React hook and
existing project session/event owner with finite HTTP/stream/browser boundaries.
They cover success/capabilities, captured versions, editable recovery, exact-key
ambiguity, 409 comparison/review, denial/expiry/context clearing, obsolete reads/
writes, pagination and close decisions. Boundary doubles claim no SQL/security/
durability/native layout proof. The focused logic entrypoint includes the new
controller suite; hook suites remain in the existing all-source unit selection.

Validation results, exact numerical proposal/approval and Draft PR publication
are appended after the final source is frozen. No baseline is written without
the coordinator's exact-candidate approval. Historical baselines, source inclusion,
thresholds and existing meaningful tests remain protected. Backend/contracts/
proxies/dependencies are unchanged; PR52's real PG/security/restart/runtime proof
retains its original source limits. New-head CI still owns its full configured
checks. Native persisted desktop/mobile/keyboard/touch/accessibility/ES/EN journeys
belong to T11.4b/T11.5 and are not claimed by this dormant logic batch.


## Frozen local candidate — 2026-11-20

This is the pre-approval snapshot; the subsequent approval and replay below
govern current numerical status. Earlier failures remain failures.

Final-source `pnpm check` passes formatting/tooling, lint, the 286-package
Express-free backend closure, focused logic and six real HTTP integration cases,
strict types, production builds, 17 MCP cases and production ES/EN/API-down smoke.
The inherited Next security notice first stops the command; its supported same-
command retry passes without pin changes or security suppression. Next recommends
an upgrade in a separate approved dependency batch. Current high/critical audits
pass: root 14 moderate/one low, isolated tools two moderate findings. Frozen root
and isolated tooling installs retain all dependency bytes.

The final measurement retains 290 API, 23 contracts and 19 prototype cases from
unchanged scopes and reruns only affected web source: **297 web cases**, including
59 new controller and 10 real-hook cases, for 629 across the composed reports.
This is measurement, not normal-gate acceptance. The first full measurement had
296 web cases before the final explicit context-projection regression; its web
report is superseded, while unchanged-scope reports remain fingerprint-verified.
All prior cases remain. No maintained source or test is removed; unit compiler/
provider/configuration and exclusions stay unchanged.

The exact current-web baseline proposal is
`da5d187c9ba70631b9f4ae29180a69862bbde7b59f973448bbd046075866db73`, replacing
`a8d147e915f14f62bbaf80288f508adb51e4be54ffa59bb544af52d46ee5afbd` only after
coordinator approval. Seven other baseline proposals are byte-identical to their
accepted files, including all four historical baselines. The proposal packet at
`coverage/t11-client-proposal/` retains candidate bytes, all 16 reports, exact
per-file deltas, 204 distinct source/test/config fingerprints and raw nullable
endpoints. No tracked baseline has been written.

| Scope | Inputs | L/S/F/B covered/total | Proposed floors L/S/F/B (basis points) |
| --- | ---: | --- | --- |
| API | 52 | 1391/2067; 1511/2253; 383/592; 1216/1763 | 6729/6706/6469/6897 (unchanged) |
| Web | 74 | 2867/4339; 3157/4928; 641/1174; 3535/5906 | 6607/6406/5459/5985 |
| Contracts | 7 | 186/186; 213/213; 118/118; 782/790 | 10000/10000/10000/9898 (unchanged) |
| Prototype | 16 | 238/853; 269/984; 87/368; 194/954 | 2790/2733/2364/2033 (unchanged) |

Existing files retain or improve exact covered counts, ratios and uncovered
counts. Four new runtime owners add explicit uncovered unit debt: three lines,
18 statements and 22 branch arms; all new functions execute. Global uncovered
statements/branches increase by 12/14 after retained-source gains; higher
percentages do not erase this debt. Existing unexecuted inputs remain API20/
web19/contracts0/prototype12 and the three type/reexport N/A inputs remain.
Nullable columns are API199/12286, web823/32296, contracts24/2780 and
prototype133/6372; no columns are fabricated. Historical raw maps are unavailable
in this fresh checkout, so changed-source old/new semantic unit identities are
not asserted. Final raw maps/hits and exact fingerprints remain inspectable.

An early infrastructure run after scoped measurement reports 19/20: the first
case fails ENOENT on the intentionally absent API report. It is a failure, not a
passed gate or skipped case. After exact approval, the normal complete run must
regenerate all four reports, reproduce the candidates, pass numerical gates,
then rerun infrastructure/artifact checks. These remain publication gates.
No local PostgreSQL/security/runtime sequence is repeated for unchanged backend,
contracts, transports and pins; accepted PR52 proof retains its source limits and
new-head CI still requires the full configured suites. No application server or
Docker fixture remains; the only observed workspace listener belongs to this
active Codex session and is left intact.


## Exact approval and normal replay — 2026-11-20

The coordinator approved only current `web.json` from
`a8d147e915f14f62bbaf80288f508adb51e4be54ffa59bb544af52d46ee5afbd` to
`da5d187c9ba70631b9f4ae29180a69862bbde7b59f973448bbd046075866db73`, bound to
source checkpoint `de6d6c5542c60cf3ccdc9ccfd8afff247b7846b0` and proposal
`6a7c61ab73abfd802fdf7d768cdc1c694f22cbab080095433a4e245cb02de9b6`.
Independent review checked eight hash pairs, 16 report hashes/sizes, 203 physical
fingerprints plus the explicitly synthetic unchanged compiler witness, every
existing file's exact counts/ratios, manifest projection and unchanged compiler/
provider/configuration/tool identities. The documented L3/S18/F0/B22 new debt,
net S+12/B+14, nullable limits and unavailable historical raw identity are bounded
owned debt. This is numerical approval, not source/product/full T11 acceptance.

Before adoption, the packet, all physical fingerprints and eight original
baseline hashes were verified again. Only the exact approved web bytes were
written. Seven other files, including all historical baselines, remain exact.
No source/test/tool changes followed approval.

Normal `pnpm unit:coverage -- --built` passes **629/629** without skips:
290 API, 297 web, 23 contracts and 19 isolated prototype. All 16 normal report
files reproduce approved candidates byte-for-byte; count digest is
`44598bc87c50777826c81e2515f9b6fc7f202d6ff42fb82515ddb6d059d43091`.
The numerical/per-file/nonregression gates pass with the proposed table's exact
counts/floors. All 20 infrastructure checks now pass on the complete report set,
and bounded artifact validation reports every scope complete. The earlier 19/20
missing-report failure is corrected by the complete run, not waived or hidden.

The [unit ledger](unit-coverage.md#t114a-client-coverage--2026-11-20) records the
same limits. Final documentation/baseline commits use mandatory staged/commit
hooks, handoff/local-link and whitespace checks. Source-bound standard build/
HTTP smoke and audits are reused without repeating unchanged heavy phases.
Publication remains Draft; coordinator owns Ready, native Kilo, thread disposition,
acceptance and merge. T11.4b/T11.5, full T11 and planned T38 remain open.


## Draft publication

[PR54](https://github.com/Ljrr3045/rielia/pull/54) is OPEN and Draft against `dev`,
initially published at `6db9db1dc8159b2faa86fe13eaba2179001932c3`. Actual Draft
state is verified before the documentation URL push. `origin/dev` remains
`6507e487` and is an ancestor; only Ljrr3045 is a collaborator, no invitations or
external open PRs were found, and collaborators-only admission remains active.
Only hosted validate is observed in progress at initial publication; no native
review is requested or paid-job absence certified. Coordinator owns that gate.

This URL/progress update changes documentation only. Source/tests/tools, all eight
baselines and all 16 reproduced reports remain exactly bound to the approved
checkpoint. Prose/handoff/whitespace and mandatory hooks cover the update; no
unchanged build/unit/PG/runtime phase repeats. Current-head CI/native feedback
and coordinator acceptance remain pending; T11.4b/T11.5 and full T11 remain open.


## PR54 round 1 correction — 2026-11-20

Native [Kilo check 136657775593](https://github.com/Ljrr3045/rielia/runs/136657775593)
from App2193792 completed SUCCESS on `957de8c6ea842ef4ff7096b650f106990b39b592`,
covering 20 files with one warning and one suggestion. Formal review 6001405118
is COMMENTED, not APPROVED. The coordinator
[accepted both findings](https://github.com/Ljrr3045/rielia/pull/54#issuecomment-7054425637)
and returned the same PR54 to Draft after the completed review. Earlier
publication/validation records remain source-qualified historical evidence;
that old-head successful check does not accept this correction or full T11.

| Finding | Corrected behavior and regression proof |
| --- | --- |
| [Cleared signed-out state masked as inactive](https://github.com/Ljrr3045/rielia/pull/54#discussion_r4649380503) | When a sprint read or write returns 401, the hook exposes the controller's cleared `signed-out` state even while the parent session is locally valid. A null controller context has no private data left to mask. Non-null contexts still require exact user/session/workspace/project identity before rendering; temporary verification and expiry semantics remain. |
| [Refused prop navigation dropped](https://github.com/Ljrr3045/rielia/pull/54#discussion_r4649380508) | The latest selection props remain a pending read/navigation intent. The hook reconciles them once the matching controller is ready and draft/pending/recovery guards clear. A changed prop cannot discard a draft, clear an unknown command/key, or submit a write. No extra queue/store is introduced. |

For 401 recovery, presentation can now render the explicit signed-out condition
and use its existing parent identity/reauthentication flow. An unchanged locally
valid parent is not sufficient to silently reauthorize the denied sprint owner:
blind controller refresh stays signed-out. A fresh parent verification cycle or
new authenticated context initializes authorized sprint reads again, with the
old draft/key/data already cleared.403 remains forbidden with no private content;
the existing explicit access-refresh behavior is unchanged.

For prop navigation, the latest prop value wins after explicit discard or a
confirmed write/retry. A definitive failed write retains the editable draft and
therefore keeps navigation blocked. Unknown recovery keeps its exact original
body/key and target until explicit retry confirmation or explicit local discard;
canceling a pending write does not release that protection. Same-session
verification retains hidden recoverable state until resumed/expired, and a
different context clears it and rejects old completions. An imperative `select`
still returns false while protected; declarative prop reconciliation does not
require presentation to recreate a dropped intent. Unchanged settled dependencies
do not re-run selection or create a refetch/effect loop.

Ten added real-hook cases reproduce nine failures and one preserved context
control against the untouched reviewed hook, including both accepted findings.
After correction all 20 hook cases pass, retaining the original ten. They cover
read/write 401, explicit 403 access refresh, verified recovery, latest-prop discard, pending success, exact-key
ambiguous retry, explicit unknown discard, ordinary failed-draft protection,
obsolete context completion and same-session verification. Finite HTTP/browser
boundaries exercise real React/controller/transports, without SQL/native UI
credit. Original/corrected logs live separately under
`coverage/t11-client-round1-proposal/`; the earlier proposal/archive stays exact.

Status: locally verified with exact numerical approval and normal complete
gate/infrastructure/artifact replay. The correction remains on the same Draft PR54; new-head hosted/native review
and coordinator acceptance remain pending. No baseline is changed before coordinator approval. Only the
hook, its regression suite and correction documentation change behavior/evidence;
no UI, backend/contracts, pins, tool migrations or T38 work is included.


### Corrective measurement proposal

This is the pre-approval snapshot; the exact approval and normal replay below
govern current numerical status. Candidate logs and hashes remain unchanged.

The final formatted hook test is bound to SHA-256
`ed51f29d537aba2c3f81fcc03ad0e80abbf8badeb13a2aaba189c874f993f7eb`.
With the exact reviewed hook in an isolated finite test fixture it reports nine
expected failures and one passing context control; with the corrective hook it
passes all 20 retained/new cases. The earlier nine-case log remains a separate
preliminary witness. No copied controller/policy substitute or new Git worktree
is used: React/controllers/transports remain real with finite HTTP/browser seams.

Standard `pnpm check` passes after its inherited Next security notice stops the
first invocation; the failed log is preserved and the unchanged-command retry
passes without upgrades or suppression. After final guard ordering and the 403
control, affected frontend typecheck/lint and the complete hook suite pass again.
Unchanged backend/build phases are not repeated. Both high audits pass, retaining
root 14 moderate/one low and tools 2 moderate findings; Next still recommends a
separately approved security upgrade. No PG/runtime repeat is justified by this
hook-only correction; prior source-qualified proof and new-head CI remain.

The exact proposed current-web baseline is
`e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c`, replacing
`da5d187c9ba70631b9f4ae29180a69862bbde7b59f973448bbd046075866db73` only after
coordinator approval. The separate packet at `coverage/t11-client-round1-proposal/`
has proposal hash
`1aebdfb08dccc1aa26cffcb0cce1e5e15863ed3711e07f203344f7a30031ddfb`.
It retains all eight baseline pairs, all 16 reports, 203 physical fingerprints and
the unchanged synthetic compiler witness, exact file deltas and raw-map/hit
comparison. No tracked baseline has been changed; all 45 historical proposal files
and seven unaffected baselines remain byte-exact.

Final web measurement passes 307 cases over the same 74 inputs. Composed with
unchanged fingerprint-verified API290/contracts23/prototype19 reports, this is
639 measured cases, not normal-gate acceptance. Web L/S/F/B moves from
2867/4339,3157/4928,641/1174,3535/5906 to
**2869/4341,3159/4929,641/1174,3545/5915**, and proposed floors are
**6609/6409/5459/5993** versus 6607/6406/5459/5985. Every existing file retains/
improves exact covered counts, ratios and uncovered counts; no new uncovered
units are introduced. Aggregate uncovered S/B decrease 1/1, L/F stay equal.

All 73 unchanged web source maps preserve 7210 covered S/F/B units and add two;
66 hit vectors remain exact. Changed-hook maps are retained without inventing
old/new semantic unit identity across new guards/locations. All 52 API, seven
contracts and 16 prototype maps/hits stay exact. Nullable columns are
web 823/32322 (previously 823/32296), API 199/12286, contracts 24/2780 and
prototype 133/6372; missing precision is not fabricated. Original source/test
inventories, provider/compiler/config/tool identities, unexecuted inputs and N/A
owners remain protected. After exact approval the complete normal639-case gate
must reproduce all 16 reports, then pass infrastructure/artifacts before push.


### Corrective approval and normal replay

The coordinator approved only current `web.json` from
`da5d187c9ba70631b9f4ae29180a69862bbde7b59f973448bbd046075866db73` to
`e311dac02f34422ace8ad0bf4c1a1ae80a41b9dcfbc77c8c341e4b3e4bf3857c`, bound to
checkpoint `038538d4f6bcbef0179b768d6f461621986a7fae` and proposal
`1aebdfb08dccc1aa26cffcb0cce1e5e15863ed3711e07f203344f7a30031ddfb`.
Independent review checked all eight baseline pairs/current files, all 16 report
hashes/sizes, 203 physical fingerprints and unchanged compiler/provider/config/
tools; every existing file's counts/exact ratios/uncovered counts; all 45
historical artifacts; exact reviewed/corrective hook, final test/helper bindings;
the nine-failure/one-control negative witness and 20-case passing hook run; and
the raw map/hit comparison. The unchanged synthetic compiler witness remains
explicit. This is exact numerical approval, not PR/source/full T11 acceptance.

Before adoption, all bound fingerprints, eight original baseline hashes and
historical artifacts were verified again. Only the approved web bytes were
written; seven other baselines remain byte-exact. No source/test/tool changes
followed approval. Normal `pnpm unit:coverage -- --built` passes **639/639** without
skips: API290/web307/contracts23/prototype19. All 16 reports reproduce approved
candidates byte-for-byte; deterministic count digest is
`120a967b40d226f5ae0d7db162b879463ef626c13d32a431ada955d7ad32b049`.
All numerical/per-file/nonregression gates pass. Infrastructure passes 20/20 and
bounded artifact validation reports all scopes complete.

The prior Next-notice failure remains retained alongside the supported unchanged
retry success. No local PG/runtime or unchanged heavy build repeats after the
affected verification. New-head hosted CI/native review and coordinator thread
disposition/acceptance remain required. The same PR54 stays Draft through the
corrective commits, base verification and push; no Ready/Kilo/comment/resolution/
merge or worktree cleanup is performed by this worker. T11.4b/T11.5 remain open.
