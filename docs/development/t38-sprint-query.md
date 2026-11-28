# T38.4a initial sprint Query ownership

Status: local implementation and numerical gates complete; publication, current-head
CI/native review and coordinator acceptance remain pending. This is the initial
planning/list/create slice, not acceptance of all T38.4a or full T38. Base is accepted
T38.3 merge `70e323b2c7139f3ed3dc5ca50bb8545e5571c5a7`.

This supports existing T11/B1c, P09/US06/US12, UXR01 and UX01/04/05/07/09 behavior.
Presentation, editable form strings, public schemas, proxies and backend policy
retain their owners. No new private SSR/hydration or product workflow is added.

## Current local evidence

The coordinator adopted only exact web baseline **48,896 bytes**, SHA256
`2505df034cdb95c090ffcaf7e7a76bed6f7f169a9e3fbe9fd6369aea7e546eed`.
The other seven baseline files remain byte-identical. No floor reduction, source/test
omission, arbitrary extraction or PR65 exception applies.

| Check | Result and boundary |
| --- | --- |
| Stabilized standard | `pnpm check` passed in 111.509s with the single candidate native build, app typechecks, OpenAPI drift/probes, HTTP, MCP and smoke. This belongs to frozen production and the earlier tests; later test additions are not rebound to it. |
| Candidate 3 measurement | 971 cases: API 384, web 489, contracts 79, prototype 19; 198 maintained inputs. 46.116s. |
| Normal built-input replay | Same 971/198 passed in 45.766s; all 16 reports and status byte-identical to candidate 3. |
| Nonregression | All 804 retained exact-ratio/uncovered comparisons preserve or improve; zero covered S/F/B slot losses and six gains against candidate 1's identical production maps. |
| Infrastructure/artifacts | Post-adoption 20/20; all 17 bounded artifact payloads match candidate 3, without upload. |

Measured/normal count digest:
`d738085b046e6f7f691ec34d8cf7f722a3632d2dd49d89c4664fce8de4cd4b51`.
Web L/S/F/B: **3786/5110, 4175/5799, 862/1376, 4821/7089**; adopted basis-point
floors **7409/7199/6264/6800**. Global uncovered L/S/F/B moves
1324/1625/514/2271 → 1324/1624/514/2268, with every exact ratio improved.
API/contracts/prototype totals remain unchanged. The new Query source is included
in the denominator; all prior selected tests, sources and zero-unit N/A inputs remain.

Owned new-owner unit debt is explicit: Query L146/146, S166/167, F24/24, B105/106.
The defensive success-continuation return remains unexecuted. Actual public Query
cache-success retirement proves erasure/idle resources/every subsequent notification
through native cancellation/rejection; no internals are patched to force coverage.
This is not universal lifecycle or full branch coverage.

## Owners and erasure

| Resource or state                                                                                     | Sole owner in this slice                                                      |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `planning` DTO                                                                                        | Query, through `sprint-query-owner.ts`                                        |
| `sprints` DTOs                                                                                        | Query entries for each admitted cursor; public merged page is derived         |
| Create-sprint execution                                                                               | Explicit Query mutation; controller retains immutable command/key and outcome |
| `sprint`, `target`, `task`, `scope`, `sprintHistory`, `taskHistory`, `preview`, `closure`, `outcomes` | Existing sprint controller                                                    |
| Editable strings, captured versions, recovery, navigation and focus                                   | Existing controller/form/integration owners                                   |
| Session, identity verification, visibility/return and SSE                                             | Existing parent project owner                                                 |

The controller's writable resource type excludes both migrated resources. Its
stable immutable public snapshot derives them from Query; no setter or alternative
DTO ledger remains. Commands read that composed snapshot. The Query owner holds
subscribed public observers with `enabled:false` and initiates only explicit reads.
It does not mount a competing focus/reconnect/session adapter or a global cache.
Only DTOs/snapshots are frozen; Query clients, observers and native signals are not.

Keys contain an opaque verified-lifetime epoch, workspace/project, resource and
canonical all-state list selector/cursor. No credential or raw session ID is in a
key. The browser controller owns one lifetime client; there is no new server
prefetch/hydration. Any later server client must be per request.

Reads/writes use `retry:false`, `gcTime:0`, `networkMode:'always'`; reads also use
`staleTime:0`, no focus/reconnect/mount refetch or polling, and
`structuralSharing:false` to retain admitted original objects/extras. There is no
persistence/devtools, optimistic business write, paused reconnect mutation queue
or automatic retry. UI stale state follows explicit invalidation/request outcomes,
not Query's zero-time staleness flag.

Native Query read signals pass through the existing validated transport, including
its body deadline. Generation/completion checks remain. Context mismatch hides
private content synchronously before React effects. Terminal clearing retires the
visible context before cancellation, detaches observers and removes query/mutation
records; cancellation alone can revert cached state and is not erasure. The
existing write AbortController cancels network execution; removing a mutation
record itself does not. Late callbacks cannot restore a retired epoch or refresh
its parent. Temporary verification exposes no private DTO/draft; only the existing
bounded memory draft/recovery contract may resume for the same verified session
before original expiry. Renewal alone does not reset fields or reread resources.

Terminal 401/403 does not retry and cannot be reopened by unchanged parent props,
child Refresh or SSE hints. The existing parent verification action establishes
fresh authority before recovery. This fixes the former child-403 Refresh shortcut;
no server permission policy changes.

## Paging, writes and shared invalidation

Query retains admitted cursor pages; the aggregate preserves server totals and
binding. Changed revision, duplicate rows, cursor repetition/cycle or overflow
cannot enter the visible chain. A cursor cycle cannot overwrite an earlier Query
entry and duplicate its rows. Failed load-more/root refresh retains old rows as
stale; successful first-page reload drops obsolete tails. In-progress projection
never joins pages from different bindings. Selection/detail and the other nine
resources retain their independent owners and version/recovery semantics.

Create uses the already normalized immutable command/key through a public
MutationObserver. Mutation results are receipts, never seeds for canonical reads.
An ambiguous failure/cancellation retains exact original body/order/key/versions;
only explicit Retry can resend. Ordinary corrected validation failure still permits
a new explicit command/key. Query mutation records are cleared after settlement.

Existing heartbeat/unrelated-project hints cause no sprint reads. Matching hints
and reset immediately stale the authorized scope and close preview, abort obsolete
reads and require review of captured drafts. Pending writes defer/coalesce reads.
Confirmation requests one parent refresh and one authorized child drain shared
with parent verification/resume. The bridge applies to all existing sprint
commands, while only create uses Query mutation execution. Parent/read failure
cannot turn confirmation into unknown; a former confirmation's delayed parent
refresh cannot block or read into a replacement lifetime. Close still requires
fresh explicit preview/confirmation and canonical server totals.

## Dependency and authorization boundary

Only web runtime `@tanstack/react-query` 5.108.4 and exact transitive
`@tanstack/query-core` 5.108.4 were added. Lock inspection found only the web
importer, two package records and their snapshots. Existing pins/patches/peers,
allowBuilds/exclusions and isolated unit/generator graphs remain unchanged.
Coordinator-fetched exact npm metadata and in-memory tarball SHA512 checks preceded
resolution. Both packages declare MIT, no engines/deprecation/install lifecycle;
React/types peers accept 18/19 with optional types; core has no dependencies.
Their November 23 publication ages exceeded 1440 minutes; no production age exception.
Invocation-local 1440/strict age remains supplied to pnpm verification commands,
with no global configuration or newer CLI flag. The actual candidate-lock audit
passed: 1 low, 7 moderate, 0 high/critical. An absent engines field is not compiler
compatibility proof; the actual app typecheck/build evidence above supplies the
bounded production compatibility check.

The original sandbox install failed DNS. Automatic approval review rejected the
first network escalation over the conditional discovery authorization. After
checking the **original task's conditional coordinator gate**, one disclosed fresh
review approved the identical frozen install. No new direct user message or global
approval was injected into this worker; no alternate execution path, shared graph,
policy suppression or install followed an outstanding rejection. Existing tooling
graphs were provisioned frozen separately. This history does not authorize future
scope expansion or bypass a later native security/age gate.

## Preserved numerical chronology

| Candidate | Execution | Numerical disposition |
| --- | --- | --- |
| 1 | 968/198; digest `8622180dbcf48965344d3474b36b843d388ccba4bd8c8daac2f95aa0888657cc`; web SHA `28d9a1c1893cc771dab8eb57b0df6a41b3bae79f8011cd3fbbb665031525f431` | Rejected: three comparisons failed, including global uncovered lines/statements and controller line ratio/uncovered count. |
| 2 | 971/198; digest `3758c037333c05e79095d5646e325dba780ca589084c1c8b2216c91b1c25aa68`; web SHA `10385f63b7cc00321915fad68cbc4f78cb1ce8c701e11d84055404521e306918` | Rejected: the two physical-line comparisons remained. Its exact measured tests are preserved separately from the later prepared scope-tail assertions. |
| 3 | 971/198, final digest and exact adopted SHA above | Root independently reviewed and adopted exact web bytes; normal replay and post-adoption infrastructure/artifacts passed. |

Production remained frozen through correction. Exactly three meaningful cases were
added: duplicate pending legacy scope paging; already-aborted create with zero
transport/cache effects; and retirement through actual public Query cache success
before projection continuation. The same scope case then checked that canonical
`nextCursor:null` sends no further request and preserves ready rows and independently
owned planning/list DTOs. Focused controller/Query 88, affected format/lint and the
final normal run cover that exact prepared source. No fourth test, source-layout
assertion or synthetic counter exercise was added.

Infrastructure was invoked prematurely before adoption: 19/20, with the actual-report
manifest guard rejecting the intentionally unadopted fingerprints. That failed
receipt remains distinct from the final 20/20. Earlier focused 178 and ordinary
lint/type/harness corrections retain their source checkpoints in the preserved
packets. No passing execution alone was treated as numerical adoption, and neither
rejected candidate was used to rewrite a baseline.

## Production costs and request observations

One pre-edit Next 16.4.6 build emitted baseline artifacts. Its timing wrapper recorded
25.91s wall then exited 1 on sandbox-denied sysctl; no successful wrapper exit or
baseline RSS is claimed. No baseline rebuild followed. The candidate build was
inside the single successful standard; its whole-standard maximum child RSS was
1,261,518,848 bytes, not an isolated Next measurement. Warm build cache and strict
install-policy environment differences preclude a controlled speed comparison.

| Artifact inventory | Baseline | Candidate | Delta |
| --- | --- | --- | --- |
| All browser JS | 30 files; 1,670,923 raw / 477,086 gzip9 bytes | 31 files; 1,709,831 raw / 488,854 gzip9 bytes | **+38,908 raw / +11,768 gzip9 bytes** |
| Literal /projects client references plus shared build-manifest runtime | 10 files; 998,651 raw / 275,112 gzip9 bytes | 11 files; 1,037,559 raw / 286,880 gzip9 bytes | Same byte delta |

Chunk inventories deduplicate shared assets; conditional polyfills are listed
separately. Identical Python gzip9/mtime0 encoding was used on both snapshots.
These are artifact observations, not measured initial/lazy requests or wire transfer.
Candidate standalone is 2,161 regular files / 48,594,027 bytes, absolute only;
baseline standalone/RSS and a before/after deployed-image delta are unavailable.
API/MCP direct resolution finds neither Query package. Unchanged backend/PG/runtime
receipts remain source-qualified; full current-head CI still runs its required gates.

The same finite real-parent fixture records migrated GETs **10→4** on initial
mounting and a confirmation increment **6→2** after a pending-reset burst; POST
remains exactly one. Baseline checkpoint-aborted signals are 6 initially / 10 after
confirmation, versus candidate 0/0. Historical body-completion timestamps were not
captured, so no baseline completed-request count is invented. Maintained real-hook
cases assert ready completion after the one authorized pair, one SSE lifetime,
hidden data/no reads during failed parent verification and verified recovery
without resubmission. These are controlled fixtures, not a real-user performance study.

## Retained limits

Bounded T38.3 is accepted by the coordinator's 2026-11-27 consolidation of
[PR68](https://github.com/Ljrr3045/rielia/pull/68#issuecomment-7215920026),
[PR69](https://github.com/Ljrr3045/rielia/pull/69#issuecomment-7226805575) and final
body decisions in [PR70](https://github.com/Ljrr3045/rielia/pull/70) and
[PR71](https://github.com/Ljrr3045/rielia/pull/71): canonical generation/drift and
62 browser JSON operations plus four explicit exclusions. Generated types retain
runtime scalar/refinement/provenance/current-authority and error/unknown admission
limits; generator 7.13.0/TS5.9.3 remains isolated from app TS6.0.3. Later Query
resources/forms/tools/diagnostics/T38.6 remain separate gates.

Retain contracts distribution 1,621,219-byte/four-group packaging and S01 debt,
G06/dense/T04, application 1 low/7 moderate and unit 2 moderate advisories, and
action/runtime warnings. Controlled DOM/HTTP fixtures do not establish native
device/a11y, provider/staging or real-product acceptance. External Cancel/Leave
remains user-omitted UNVERIFIED with possible draft loss; sprint filters/T08/T10/
US05 and other original-ticket debts are not accepted here. No deployment, final
native review or acceptance of this Query slice/full T38 is implied.
