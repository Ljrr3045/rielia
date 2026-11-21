# T11.4a sprint client logic and presentation handoff

Status: implemented and locally verified; exact numerical approval and normal
coverage/infrastructure/artifact gates pass. Published as
[Draft PR54](https://github.com/Ljrr3045/rielia/pull/54) to `dev`; current-head
CI/native/coordinator acceptance remain pending. This is the logic prerequisite for separately owned T11.4b
presentation, addressing T11/B1c, P09/US06, affected P05/P08/P10 and US05/US12,
UX04/UXR01 and existing recovery/localization requirements. It starts from
accepted [T11.3 PR52](https://github.com/Ljrr3045/rielia/pull/52#issuecomment-7052975664),
reviewed `1256241b9f26baf60484db302e4df2d6bc35c5d7`, merged
`6507e487954fc411b11f807e0eddf850fd223805`. The
[closure guide](sprint-closure.md) records incremental native round 2, fixed/resolved
full-round findings, absent formal APPROVED and exact successful postmerge CI.
Earlier then-pending records remain historical.

No JSX, CSS, route composition or new product/API flow is added. T11.4b native/
responsive/localized presentation, T11.5 persisted integrated acceptance and full
T11 acceptance remain open. No T12/T13, T22 reports, prototype policy, landing,
deployment or provider/staging/user acceptance. Planned
[T38 issue 53](https://github.com/Ljrr3045/rielia/issues/53) follows full T11;
no schema/query/form library adoption or dependency upgrade occurs here.

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
