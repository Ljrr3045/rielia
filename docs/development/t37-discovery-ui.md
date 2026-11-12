# T37.5 My tasks and Search presentation checkpoint

## Independent final-source QA — 2026-11-12

Status: **local functional/native/persisted evidence complete; T37.5 acceptance
pending the final delivery PR**. This integrates exact T37.4 `8d7b937` and Astra
finish `ad61925`, preserving both histories and accepted dev ancestry. Only additive
changelog/progress conflicts required resolution. Build/source head is
`81b5180af65247ae154906cabf34a1cfcf05f6df`; Next production build is
`VWkjHy07GXvUgC1LMg5D8`. No application fix was made during QA. The later accepted
PR48 ancestry and infrastructure-only correction still need coordinator sync before
publication; unchanged application bytes do not need another runtime or 177-case run.

The scope is existing P01–P11/P33/P38, US01–US08/US11–US12/US24–US25 and
UX01–UX03/UX05–UX07/UX09/UX11, using existing UXR01–UXR04/UXR06 direction.
UX04/sprints, T11, landing, new domain policy, prototype promotion, final brand,
deployment and whole-product acceptance remain excluded.

### Coverage and source binding

One full web `--measure` and one normal `pnpm unit:web -- --built` gate each pass
**177/177**, over the same **68** maintained inputs and **24** test fingerprints.
All per-file counters and hit vectors remain exact to accepted T37.4:
L2299/3835, S2500/4324, F500/1055, B2845/5305; L/S/F/B floors remain
**5994/5781/4739/5362**. Blocking coordinator review approves exact current-web
candidate `cb65f8fdf2b9badef8350d4b5e4b68f75ebfdfa560cb9f093f95bc221fe914c6`
before baseline replacement. Seven other baselines, provider/config/runtime/tools,
inventory and tests remain byte-identical. Normal reports reproduce measured maps,
manifest, summary and hits exactly; see the [coverage addendum](unit-coverage.md#t375-reviewed-discovery-manifest-reconciliation).

Only the discovery TSX source fingerprint changes. Its reviewed physical map
locations move with title-first markup/classes; IDs, shapes, branch types and hit
vectors remain. Nullable-column precision is **804 of 28,798 points**, versus
803 before: branch 79's outer end moves from line 732/column 98 to line 733/null.
This does not remove a unit or alter a provider/gate. Type-only zero-unit
`task-collaboration-view.ts` stays in the denominator with N/A zero-unit metrics.

The 91-file build snapshot SHA-256 is
`3ad0f2e58c8191c0a56e5890ae077d4c4d916599e3d9f516fde0335d62e5cf4c`.
It contains 88 common web inputs plus next-env/package/tsconfig; prior T37.4's
92-file inventory instead adds four contracts sources. A supplemental exact
four-contract/compiled-import proof preserves both inventories and confirms only
discovery TSX and project CSS differ in the common set. All 33 emitted production
JS/CSS assets are bound. The helper's required Next dev runtime is separate;
its automatic owned AGENTS advisory and next-env dev imports were restored to
exact tracked bytes after shutdown. API/Prisma compiled outputs and helper/browser
fingerprints are retained separately. Source typecheck, affected TSX lint,
formatting, handoff/links and whitespace pass, with mandatory commit hooks.

### Native discovery and navigation

**16 unique final journeys pass** on the one production build, using installed
Brave 157/Playwright 1.57 with finite disposable public HTTP DTO fixtures, without a
database. Seven navigation samples cover project/My tasks/Search, normal/hover/focus,
light/dark, EN/ES, narrow drawer, the 1024 rail and landscape. Exactly one current
destination has selected fill; inactive My tasks retains neutral hover and visible
focus. Sampled navigation targets are at least 44px high; selected enabled-control
text contrast is at least 5.231:1. These computed samples are not a WCAG audit.

Other journeys cover labelled literal query, project groups and title-first rows,
all five status labels/metadata, current-assignee request semantics, authorized
project capture entry, loaded/server totals, continuation loading/error/retry,
changed revision, page-two detail/Back/URL/focus, inherited-assignee clearing,
first loading, empty/no-results/archive and read-only capture absence. The cap
stops at 1000 loaded of 1001 with explicit guidance. Actual bounded fetch retries
show reconnecting and offline/stale feedback distinctly from mutation success.
Live/deferred-refresh behavior is additionally exercised with the real runtime below.

Samples are 320/390/768/1024/1280/1440 and 844×390, both themes/languages,
keyboard, synthesized touch and reduced motion. All 18 selected captures have no
viewport overflow. SOL directly inspects seven native images; Astra independently
opens all 18 and reports no blocking visual finding, with F1 resolved in the
inspected subset. The three 320 empty/no-results/archived-empty message panels are
below their crops: native text presence passes, but their panels are visually
unverified. The coordinator accepts this explicit evidence limit without another
runtime solely for recapture. Images/DOM/source identity alone do not prove saving
or authorization.

### Real persisted cross-surface journeys

**12 representative journeys pass**, serialized after the production fixture
server stops. The maintained disposable QA helper runs pinned PostgreSQL 18.6,
actual migrations, Nest/Better Auth and Next **development** routes on owned
loopback ports. Frozen root/unit-tool installs reuse cache with zero downloads;
contracts/API and Prisma prerequisites use existing pins. Seeded fictional users,
signed sessions and service-created seed records are test setup. Daily-work UI
commands and the helper's proxy probes perform actual HTTP/SQL effects, separately
from real OAuth/provider acceptance. A private same-human replacement-session
fixture adds no production route or login bypass.

| Journey | Actual evidence |
| --- | --- |
| Workspace/project creation | Browser creates workspace/project; PostgreSQL readback confirms owner/name/visibility/version. Workspace selection uses its actual selector, not an invented query contract |
| Task capture/edit/assignment/move | UI title-only capture; original committed receipt proves version 1, null assignee and immutable human creator. UI edit selects another human; native status select moves to In progress. Reload, SQL and one move activity confirm the same record. A feedback-wording locator failure is completed by independent persisted UI/DB readback |
| Collaboration/history | One Markdown comment, two distinct checklist items and one child relationship persist. Canonical history API and actual History DOM heading are checked; not every history entry is newly captured visually. Independent actions use confirmed fresh snapshots; a scripted premature draft's real 409 remains a diagnostic, never silent rebase |
| Search/My tasks/paging | Actual 105-record search loads 100+5 without duplicates; page-two detail/Back retains 105. Current-assignee My tasks includes a task created by someone else. Literal `%_` matches exactly one task through actual UI/API |
| Two-session live/draft/conflict | A second session commits an update and the first UI refreshes through real SSE. A later update defers refresh while a local draft remains. Actual stale save returns 409; current value is not overwritten |
| Unknown checklist outcome | Hold the browser POST before execution: Saving alone, no unknown Retry. Then let the actual backend commit and deliberately abort response delivery. SQL items 0→1, activities 6→7 and outbox 6→7 prove the commit. Retry uses the identical key hash/body/expectedVersion 6; version 7 and all three counts remain unchanged |
| Confirmed save/read failure | Actual project write commits; only subsequent GETs are deliberately 503 at the browser boundary. Generic confirmed success remains separate; read recovery sends no second mutation |
| Private-access denial | Owner revokes actual explicit access; the member's actual POST returns 403 and private draft fields disappear. SSE delivery is deliberately held for this submitted-denial case; the maintained helper separately proves real SSE private revocation. Explicit discard and current-authority regrant are checked |
| Session replacement/account/logout | Operator endpoints switch private fictional cookies. A synthetic window-focus event invokes the existing real-hook lifecycle: same-human replacement clears draft; another account clears scoped rows. Real Better Auth sign-out is awaited before null-session readback. One consumed disposable replacement fixture is restored between attempts; this is simulated login setup |
| Membership revocation | Real owner revocation clears a second session's live assigned row and makes subsequent discovery 403. Historical creator remains unchanged. The completed UI case uses the fictional administrator after an earlier member probe had already committed revocation |
| Invitation lifetime | Actual invitation writes persist once each. Done clears link and dismisses success; Refresh clears link while retained success truthfully explains its absence. No token, signed fixture URL or cookie is captured in evidence |

The helper also passes its maintained real-proxy 105-row paging, two-session
committed invalidation, deferred rollback silence, heartbeat beyond the JSON
deadline, private revocation, resume/reset and abort-cleanup checks. This targeted
work does not repeat or replace the full unchanged backend security/runtime suites
or required current-head hosted CI. Native/persisted attempts retain all failures:
fixture DTOs, strict/localized selectors, response-await handling, async readiness,
actual 201 versus expected 200, and premature probes. Only final observed outcomes
are aggregated as passing. No application defect is silently fixed or waived.

### Cleanup and remaining gates

The helper exits 0 after SIGTERM and removes its owned container/volume/private
state. All four owned listeners and 62 recorded owned PIDs are absent; foreign
resources remain untouched. Private helper/browser logs stay 0600 outside the
allowlisted evidence. The heavy lease is explicitly released. Ten persisted
supporting images have source/helper/runtime hashes; five are directly inspected.
The mobile literal-search capture shows the query/header, with its matched row
below crop; the real DOM/API assertions independently prove that result.

Physical devices/virtual keyboards, manual AT, genuine browser-chrome 200% zoom,
real users/providers/HTTPS/staging, performance and blanket WCAG certification
remain unperformed/deferred. Earlier enlarged-root-text evidence is not browser
zoom. Final PR48 acceptance/ancestry sync, final delivery CI/Kilo/ownership and
coordinator acceptance remain gates. See the [bounded T37.6 closure proposal](t37-ui-acceptance.md).
No push/PR/Ready/Kilo/merge-to-dev/deployment or T11 implementation occurs here.

## 2026-11-12 integrated presentation finish — source checkpoint

Branch `feat/t37-discovery-finish` starts from the exact tested T37.4 application
source `ce60740f1a58942add205679b348cf5e78bfe785` and merges the exact discovery
checkpoint `abf343e84a82503583805a1da6397fa841b2f30e`, preserving both histories.
Only additive progress/changelog conflicts require resolution; discovery TSX
remains byte-identical to `abf343e`. Existing SOL recovery and PR47 correction
source is retained. [PR #47](https://github.com/Ljrr3045/rielia/pull/47) is now
accepted/merged at `55f0f8d85521998d3d7ed883f387bd3c6cb664f8`; T37.4 current-head
review/publication and acceptance remain open. SOL will integrate final accepted
T37.4 ancestry/documentation before T37.5 validation/publication.

The coordinator explicitly extends this task's presentation ownership to the
shared sidebar F1 finding: My tasks previously had the same unconditional filled
appearance as the active project. Remove the background/foreground overrides from
`.app a.navItemPrimary` and its hover rule, plus its icon/meta color overrides.
Keep primary emphasis solely through `.navItemPrimary .navItemTitle` at weight
700. Existing `.navItemActive` rules now solely own selected brand fill/foreground;
unselected My tasks uses the ordinary text/icon/meta colors and neutral hover.
The active My tasks hover cannot be overridden by a later primary fill rule.
This uses established tokens and changes no target size, focus outline, theme,
route/aria-current/condition/handler or capability. It is a bounded shell CSS
exception, not a broader redesign.

Source comparison retains the discovery checkpoint's 182 non-class JSX attributes
and 106 conditions, all query/filter/paging/form/URL/ref semantics, and every other
application source from `ce60740f`. All CSS outside discovery and the explicit
primary-navigation block remains unchanged. Source comparison is not a behavioral
test. Formatting, handoff/link, whitespace and mandatory staged/commit hooks use
existing dependencies; no install, unit/build/browser/Docker or coverage run occurs.

The reviewed `ce60740f` images from build `6QKhwGDQLKveEfZvAYWsS`, snapshot
`ca6bfc2c75ff969680c1ead0c21a5fb2981e9274d1e4716f8cdaf2460ad16e92`, are **before-change
references**, including light EN list and dark ES board views showing F1. They
prove neither this new navigation treatment nor rendered discovery behavior.
This finish remains source-only, not rendered or accepted.

SOL must validate current My tasks/project/Search selection separately from hover
and keyboard focus in both themes and ES/EN, including the narrow drawer and 1024
rail boundary; only the active destination should receive selected fill. Exercise
grouped results, canonical loaded/server totals, paging, inherited-assignee
clearing, authorized capture, detail return/Back/focus/drafts and independent
connection/freshness feedback. Apply explicit current-web manifest reconciliation
and one normal scoped gate to final integrated source; old fingerprints are not
passing evidence. Final native captures, real PostgreSQL/Nest/Next journeys and
Astra actual-image review remain SOL/coordinator-scheduled gates. Actual browser
zoom, physical device, AT, provider/staging and real-user checks remain deferred.
T11/sprint, landing, policy, prototype promotion, new routes and final brand/license
remain excluded. No publication or complete T37.5/T37 acceptance is claimed.

## Original isolated checkpoint — historical context

**2026-11-11, America/Caracas — source-only checkpoint, not T37.5 acceptance.**
Branch `feat/t37-discovery-ui` starts at the preserved T37.4 presentation commit
`0721c721db32ed9b1c4dfdaa930af7b71eb48f23`. The coordinator authorized this isolated
next-surface work while SOL corrects T37.4 recovery in another checkout. T37.3
PR #47 remains Draft with CI/review pending; T37.4 logic, validation and acceptance
remain open. No in-progress SOL source is merged here. Later integration and base
synchronization precede validation/publication.

## Scope and presentation

Traceability: T37.5, P11/P33/P38, US02/04/05/08/12/25, UXR01–04/06 and
UX01/03/05/09/11. Follow the [direction](t37-design-direction.md),
[stable contract](t36-stable-ui-contract.md), [discovery contract](task-discovery-ui.md)
and [T37.4 presentation](t37-project-task-ui.md). No new route/default destination,
query engine, filter dimension, sorting, bulk action, task store, sprint/T11,
landing or final brand decision is included.

| Area | Authored change |
| --- | --- |
| Scope and query | Existing scope buttons occupy their own row. The existing search label is visible, the Search button uses the primary treatment, and archive remains secondary beside the query on wide layouts and below it on narrow layouts |
| Filters | A discovery-scoped divider and grid separate the existing project/status/priority and inherited-assignee criteria from the query. Narrow filters retain their exact conditional panel and existing toggle. Nothing is automatically opened or cleared |
| Results and grouping | Canonical loaded/server-total text gains wrapping, tabular numerals and stronger weight. Larger wrapping project headings separate contiguous shared task lists. Each row still includes project identity, task key/type, human/Agent assignee, priority/date and textual archive states |
| Row reading order | Existing title/metadata block precedes the existing read-only status block in DOM and visual order. Wide rows align status/priority beside the title; narrow and contextual layouts wrap below it. Only `.discoveryRow` overrides are added; shared T37.4 row declarations remain exact |
| Continuation and limits | Existing loading-more text wraps, Load more has a separated footer with a full-width narrow button, and the existing 1,000-row context-limit message has a distinct neutral panel. Counts, conditions, loading/error/revision branches and actions are unchanged |
| Choose-project capture | Existing native disclosure and authorized-project form gain consistent spacing and a wide-screen field/action row. Eligible choices, form lifetime, callback and lack of automatic assignment are unchanged |

All new presentation uses existing semantic tokens/system fonts/native controls.
The established 44px minimum, 16px narrow/coarse-pointer fields, focus outlines,
theme and reduced-motion treatment are inherited. Authored dimensions are not
measurements. Detail thresholds remain below 768 full-screen, 768–1279 overlay
and 1280+ contextual; the 1024 rail is untouched.

## Ownership and preserved behavior

Only `task-discovery.tsx` and discovery-owned selectors in `projects.module.css`
change. No dictionaries required edits. JSX edits add/change classes and statically
reorder two existing sibling blocks. Every hook/state/effect/handler, query/form
submission, key/ref/ID/URL, condition, capability, disabled rule, pager and mount
lifetime is retained. All shared CSS outside discovery is preserved, including
live-update notices consumed by projects. No tests/controllers/proxies/auth/
contracts/backend/tooling/baselines/dependencies/locks are edited.

My tasks remains the current assignee's authorized work, independent of creator.
Search remains literal ID/key/title with canonical project grouping/totals and the
1,000-row memory-only return cap. Inherited assignee stays clearable without a
new people catalog. Choose-project capture retains current capabilities. Selected
detail, return/focus/draft protection, session/account clearing and single-trap
ownership stay with existing logic. Live/connecting/reconnecting/offline/deferred
refresh messages remain separate from mutation success; neither their source nor
shared styling changes.

First-load failure, continuation failure with retained rows, changed revision,
true empty, no match, loading-new-context, loading-more and context-limit branches
are untouched. Existing semantic feedback/empty components are reused; no CSS
conceals their recovery actions or T37.4's three SOL-owned defects.

## Evidence and remaining gates

The reused Astra high / Approve for me session and exact new branch/base were
verified through the dispatch and local Git state. The three explicitly local
frontend skills and project guidance were already loaded; the craft reference
was reread directly. No engine, hook installation, Apply, research pass, asset
search/download, package installation or global setting change occurred.
No new baseline or after-change image was inspected or produced in this task.
Historical linked evidence keeps its original source/build and is not a render
of this checkpoint.

Existing installed dependencies serve explicit two-file formatting and mandatory
staged-source/commit-message hooks. Handoff/local-link and whitespace checks,
source diff review and exact changed-file SHA-256 hashes accompany the external
report. A static source inventory compares non-class JSX attributes and conditions;
it is not a functional test. No install/build/browser/server/Docker/test/coverage
suite runs here, and no rendered, persisted, performance, zoom, AT or WCAG result
is claimed. No unit is authored for this presentation-only assignment.

Every maintained source fingerprint change requires SOL's explicit current-web
manifest migration and one normal scoped gate after final integration. An older
baseline passing elsewhere does not validate these bytes. Independent SOL must
validate the final source with affected functional checks, one production build
and capture, plus real PostgreSQL/Nest/Next cross-surface persistence/recovery QA.
Cover ES/EN and both themes at 320/390/768/1024/1280/1440, keyboard/touch, long
names/query/IDs, 0/1/paged data, all five statuses, missing/historical/Agent assignees,
archive/read-only, inherited-assignee clearing, changed/error/context-limit states,
URL/Back/focus/drafts, authorized project capture and connection/freshness distinctions.
Astra then reviews actual images and corrects demonstrated presentation defects.

Current-head CI/native Kilo, coordinator acceptance, accepted T37.4 integration
and later publication remain open. No push/PR/Ready/Kilo/merge/deploy occurs here.
T37.5 and overall T37 remain IN PROGRESS; source-only checkpoint completion is
not acceptance of the complete discovery journey.
