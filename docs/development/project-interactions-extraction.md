# T36 project interaction and rendering ownership

This bounded T36.4 batch starts from merged PR #41 at
`26f6c57d46b280ecb196d0920f73ed2312e88002`. It separates existing project-screen
interaction lifecycles, content forms and rendering composition without changing
appearance, public API contracts or domain policy. Workspace extraction and
T36.6 acceptance remain open before T37, then T11.

Traceability: T36.4; existing T06–T10/T35, P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25, UXR01–UXR06 and UX01–UX11. This is a structural
continuation of the [quality roadmap](development-quality-roadmap.md), not T37
redesign or completed product acceptance. No schema, server policy, transport,
provider, runtime/dependency pin, identity or prototype change is included.

## Cohesive owners

| Owner | Preserved responsibility |
| --- | --- |
| `projects-view.tsx` | One actual `useProjectTasks` and locale lifetime; adapt current state and intents to feature owners |
| `project-dom-hooks.ts` | Actual media listener, focus trap/restore and shared body-lock singleton, including effect cleanup |
| `project-content-model.ts` | Form variants, defaults, editable field projection, exact target matching and form copy |
| `use-project-content-forms.ts` | Content/capture values, captured versions/targets and existing command staging, submission and recovery intents |
| `use-project-navigation-focus.ts` | Current navigation refs, opener/fallback selection and draft return/dismiss focus |
| `use-task-result-focus.ts` | Canonical move/create result focus and the existing fallback timers/cancellation |
| `use-project-interaction-effects.ts` | One controlled composition of all 20 original effects in their original registration order |
| `project-recovery.tsx` | One existing recovery discriminator, feedback placement and dialog assembly |
| `project-shell.tsx`, `project-work-area.tsx`, `project-content-dialog.tsx` | Rendering factories with unchanged JSX ancestry, keys, mounting conditions and no added DOM wrappers |
| `task-collaboration-view.ts` | Explicit type-only collaboration ports; actual projected props supply only each section's required operations |

Eight explicit owner call ports bound the extracted responsibilities. Five actual
collaboration projections replace broad hook `ReturnType` contracts. History receives no mutation methods. Controller/session/tenant fences,
URLs, idempotency keys, captured versions/targets, immutable creator/provenance,
current DTO/author/candidate pages and recovery remain owned by existing code.
The screen retains one controller; no second store, alternate policy or state
emulator is introduced. Existing action-requested uncancelled focus RAF behavior
is retained. CSS families remain explicit follow-up debt; no stylesheet moves.

## Characterization before moves, then separate coverage gains

The new public-behavior candidates were prepared before owner moves. The actual
baseline screen imports CSS/Next and is characterized through real Next/browser
rendering; no React/Next/CSS substitute makes it artificially unit-importable.
Seven baseline schedules were accepted on the unchanged web tree
`ec8049e207059352900734cd50e93cbd3328b7ed` and retained production build
`xiokvhnTJbbHM4SpTsbJf`: five initial passes and two affected fixture corrections.
The corrections preserve Next history state and wait for real source autofocus;
failed attempts remain evidence. They do not modify application behavior.

| Phase | Web / all cases | Web / all inputs | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A: accepted unchanged web | 114 / 356 | 51 / 107 | 1177/3779 | 1292/4255 | 230/1042 | 1300/5192 |
| B: extraction, retained selection | 114 / 356 | 62 / 118 | 1177/3791 | 1292/4267 | 230/1050 | 1300/5192 |
| C: same application, targeted additions | 136 / 378 | 62 / 118 | 1469/3791 | 1625/4267 | 303/1050 | 1487/5192 |
| Corrected C: Kilo test-fidelity batch | 138 / 380 | 62 / 118 | 1494/3791 | 1650/4267 | 305/1050 | 1507/5192 |

A reuses accepted PR #41 web raw/maps and corrected final reports. The original
global capture's API suite identity predates that PR's final test-only correction;
it is not represented as a fresh global A run. A's missing preinstrument text is
explicitly reconstructed using the exact maintained emission functions and pinned
TypeScript, with all 51 historical source maps exact. Reconstructed text is not
claimed to be an observed original artifact. No A application/test run repeats.

One B run retains all original 114 web cases and helper bytes. Independent review
accounts all 5,257 affected old raw units, all zero in A:
5,251 exact pairs, six bounded retained dispositions and 20 new wrapper units
(eight functions/twelve statements), with no unresolved outcomes. Original
implicit arms and unknown/null map endpoints remain explicit. All 38 untouched
web counter maps, including the existing covered outcomes, and the 12 nonweb report files stay exact. B's extra denominator
is structural ownership, not newly tested behavior.

C uses identical B application/prebuild bytes and retains every normalized covered
outcome. Its 22 additions use actual React hooks, the real `useProjectTasks`,
controller and clients with established HTTP/stream/clock seams. Geometry doubles
in JSDOM are declared; they do not prove browser layout or durable server effects.

| Added cases | Public outcomes |
| --- | --- |
| DOM effects: 7 | Nested StrictMode locks/final restore, media replacement/cleanup, native-event focus trap seams, callback freshness, Escape consumption/inactivity, empty trap and disconnected opener/RAF cleanup |
| Content forms: 7 | Version N captured across N+1 reads, workspace Stay, exact-key unknown retry, duplicate pending guard, list/board capture, target/session replacement fences |
| Navigation focus: 3 | Direct-detail fallback, replacement href anchor and resumed draft return/dismiss lifecycle |
| Result focus: 3 | Canonical status/order barrier, 4000ms fallback/outside cancellation and 1500ms off-page create fallback |
| Content model: 2 | Editable projection excludes author/provenance/identity/version/parent; exact workspace/project/task matching |

Every new production helper enters the maintained denominator. The type-only port
emits exactly `export {};`, remains among the 62 inputs and is explicitly reconciled
as zero units, N/A rather than 100%. The pipeline now applies its existing declared
zero-owner check consistently after instrumentation and after normalization;
unexpected missing inputs still fail closed. No provider, exclusion or comparator
waiver is introduced. The coordinator accepted only the exact current-web baseline
with L/S/F/B floors 38.74/38.08/28.85/28.64 percent. Seven other baselines stay exact.

## Actual browser and cascade evidence

The same seven AFTER schedules pass on production build `-q-Zrv3gK2KajB3sK7iT_`,
using installed Playwright 1.57.0 and ephemeral headless Brave 157.0.8103.39. They
check captured version submission, workspace guard/remount/URL/focus, explicit
unknown-key retry, nested candidate Escape, native Tab/Shift+Tab and layered
body-lock release. The two recovery observation objects are deep-equal to BEFORE.

Existing recovery debt remains visible for T37: a mutation 403 removes the form
and exposes Refresh/Workspaces; confirmed success followed by project-read 503
hides visible success and exposes Load again/Workspaces. Neither automatically
resubmits the write. The coordinator explicitly requires preserving these states
in this structural batch; they are not newly fixed or represented as ideal flows.

All four emitted CSS files are byte-identical to the retained baseline. Projects'
entry CSS and actual HTML order remain global `efd33ab7` then project `6857b04`.
Independent expanded JSX ancestry plus actual connected selectors support the
unchanged cascade; this is not a new visual design or blanket pixel-equivalence
claim. No invented BEFORE screenshots are used.

Seventeen AFTER scenarios cover widths 320/375/390, 767/768/769,
1023/1024/1025, 1279/1280/1281 and 1440, landscape 844×390, Spanish/dark desktop
and touch mobile, reduced motion and 200% root text at 720px. All retain one main
and no document overflow in list/board; five screenshots were inspected. These
observations include real partial-column error composition because the first
HTTP fixture returned backlog DTOs to other status requests. A private broad
summary selector initially reached narrow project Options, so it supplies no
narrow-card Move proof; focused exact row/card selectors provide that evidence
separately. All four focused row/card schedules pass at touch 375 and keyboard
1440: correct Move ancestry, disclosure/Escape and restored summary focus, native
date input, modal geometry/body lock and retained title after closing/reopening.
The first focused attempt had ambiguous nested-dialog/board-heading selectors and
an incorrect assumption that closing discards a staged draft. Actual old/new
`closeForm` and `openTaskEdit` preserve that draft; only the private selectors and
expectation were corrected. The focused desktop board still displays partial
non-backlog columns, so no all-column success composition is claimed. Original
failures, four focused screenshots and fixture limitations remain recorded.

Physical devices, OS virtual keyboards, assistive technology and actual desktop
browser zoom are unverified. Enlarged root text is not claimed as browser zoom.
HTTP-controlled browser results do not establish SQL isolation, authorized replay,
one durable effect, real two-session SSE, restart or persistence. Existing logic/
client/lifecycle cases remain, and current-head hosted CI owns retained real
PostgreSQL/security/HTTP/Docker/runtime closure; no new local Docker result is claimed.

## Validation and remaining acceptance

Pinned Node 24.22.1, pnpm 12.15.0, TypeScript 6.0.3 and Prettier 3.9.10 are unchanged.
One heavy local group at a time, verify-deps `error`, workspace concurrency 1 and
15-second phase cooling are retained. No install/cache repair or frozen-host write
occurs. Ordinary port typing, finite fixture and lint issues were corrected with
original diagnostics preserved and only affected checks repeated. Source typecheck,
source lint, all 378 maintained cases and one production frontend build pass.
Eighteen new supported paths reach 234/234 formatting adoption.

All normal-check constituents pass: format, quality tests, lint, backend closure,
smoke-process tests, identity/workspace/project logic, prototype, web integration,
strict workspace typechecks, the retained web build plus remaining workspace
builds, MCP tests and HTTP smoke. These are recorded as constituent commands,
not a whole `pnpm check` invocation; no duplicate frontend build runs.

Infrastructure passes all 20 cases after including the actual declared zero owner
in its isolated never-imported witness and preserving denominator/floor/unexpected
missing-file rejections. The original 19/20 failure remains. Final affected
format/lint pass. All four production comparable/nonregression gates and bounded
artifact packaging pass against the exact 17 actual C reports, with all 118
application-input hashes and seven protected baselines still exact; no application
measurement repeats. The initially accepted baseline serialization had three
report-only manifest keys and failed formatting; the coordinator accepted its
exact lean production-manifest/pinned-format correction without any metric,
source, test, provider or floor change. Both candidates/failure evidence remain. Offline handoff verification passes all
47 imported files, 30 assets and 622 local links in 72 documents; whitespace passes. Hosted final-head CI/native Kilo, coordinator
publication and delivery acceptance remain required. Workspace extraction, CSS
ownership debt, T36.6 and full T36/T37/T11 acceptance remain open.


## PR #42 test-fidelity correction

The completed first native Kilo round found five valid test-fidelity issues and
reported faithful production extraction. The coordinator returned the same PR to
Draft before this test-only batch; all production inputs, effect/JSX ownership,
provider/configuration and original 114 web cases/helpers remain unchanged.

The actual hook fixture now renders the selected task's detail heading, so resumed
edit dismissal asserts that preferred current target. A separate no-selected-task
project-settings draft verifies the legitimate project-heading fallback. The row
replacement case explicitly remounts React rows and asserts the disconnected old
opener differs from the exact current focused anchor. The workspace Stay unit is
renamed to the retained form-state/destination-read contract it actually tests;
real dialog mounting remains the already accepted browser schedule. The model
case asserts parent linkage is absent from the actual projection. A new canonical
move case supplies matching returned row/page revisions and asserts immediate
row-link focus/reset without firing the 4000ms timer; delayed and outside-focus
cancellation cases remain.

Sixteen affected cases passed initially. The new canonical move fixture first
failed the real page validator because its row revisions differed from the page
revision; the finite response was corrected and only that case reran, passing.
Five-file lint/format pass and original diagnostics are retained. One corrected
maintained C run passes 138 web/380 total cases in 19.63 seconds: 24 frontend
additions in total, including four navigation and four result-focus cases.

All 118 application inputs, prebuilt bytes and 62 normalized source maps are
exact to original C. Every 3,415 previously covered normalized S/F/B outcome stays
covered; 47 additional outcomes are covered. Independent emitted-raw comparison
retains all 3,708 covered units and adds 53, with all 62 emitted texts/maps exact.
Twelve nonweb report files and seven
other baselines remain byte-identical. The corrected eight-key lean production
baseline proposal has L/S/F/B floors 39.40/38.66/29.04/29.02 percent, with only five
affected test/helper fingerprints changed; the coordinator accepted the exact
formatted candidate before its tracked write.
Original A/B/C/raw/browser/CSS/normal-check evidence remains preserved. No build,
browser, A/B, negative-control or unchanged infrastructure run repeats; only
corrected-C comparable/numerical/artifact and affected documentation/format/
whitespace checks are required. New-head hosted CI and completed native Kilo
feedback remain coordinator delivery gates.

Affected closing format/lint, all four production comparable/nonregression gates
against the exact 17 corrected-C reports, bounded artifacts and protected-baseline
checks pass. A private closing-wrapper receipt-path error occurred after passing
format/gates; only that private path and remaining artifact closure were corrected,
with no format/application replay. The fresh task-owned tools link is removed by
its recorded identity; the frozen tooling host is untouched. Handoff/whitespace
and tracked hooks govern the correction commit. Current-head CI/Kilo remain open.
