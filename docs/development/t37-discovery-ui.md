# T37.5 My tasks and Search presentation checkpoint

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
