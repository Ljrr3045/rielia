# T38 tool decisions and compatibility pilot

**T38.1/T38.2a/T38.2b ACCEPTED; T38.2c LOCAL GATES COMPLETE,
2026-11-24 America/Caracas.**
[T38.2b acceptance in PR59](https://github.com/Ljrr3045/rielia/pull/59#issuecomment-7122689772)
reviewed `d9699cf`, merged `c655f0f0`, identical tree `08a8a7c7`; reviewed-head
CI45328949033 and exact-merge CI45331394020 passed 24 steps each, with clean
37-file native Kilo review. Its settled clean checkout was removed through Orca,
branch/evidence retained and all 93 foreign coordinator entries preserved.
[Its dated receipt](t38-workspace-schemas.md) is not rebound to later docs.
[PR58 acceptance](https://github.com/Ljrr3045/rielia/pull/58#issuecomment-7120471111)
reviewed `5e2671bd`, merged `e1ebe3ac`, identical tree `2e8086cc`, with reviewed/
exact-merge CI and native Kilo passed.
The released [H05–22/G02/bounded X03 migration](t38-project-task-schemas.md)
now has strict input/shared inferred schemas, explicit scalar/capability/dense
array decisions, approved numerical adoption and fresh normal786/infra20/
artifacts17 proof. Selected real PG/HTTP57 and runtime/closure/recovery/high
audits pass with cleanup. Publication/current-head review/final acceptance remain;
full T38.2/T38 and configuration/private JSON owners stay open. Next security
recommendation remains unresolved. Historical receipts below keep their dates.
[PR57 acceptance](https://github.com/Ljrr3045/rielia/pull/57#issuecomment-7118652391)
reviewed `b12e3220`, merged `4dab8594`, with identical reviewed/merged tree
`8573ea3d`; [exact-merge CI](https://github.com/Ljrr3045/rielia/actions/runs/45301675698/job/138135467847)
passed 24 steps and native Kilo round two was clean. The coordinator released
[H30–35/G03/X04 production schema work](t38-sprint-schemas.md), with numerical
adoption separately gated. This current disposition supersedes formal-delivery
pending wording in the historical P1 receipt below, without rebinding its runs.
The
user authorized starting T38 that day. Original T11/T11.5 was
[accepted in PR56](https://github.com/Ljrr3045/rielia/pull/56#issuecomment-7114539999),
reviewed `a9d159f0115258aee76b2b02fef733ab53fd22ee`, merged
`f020a423e43380f908ad876a76ece65faa24a031`, this inventory's base. The final
decision supersedes the deliberately frozen READY FOR REVIEW matrix. Reviewed
CI/Kilo and [exact-merge CI138028155905](https://github.com/Ljrr3045/rielia/actions/runs/45270336784/job/138028155905)
passed (readback: App15368, exact `f020a423`); this planning phase does
not rerun T11 proof or accept adjacent tickets.

[Issue 53](https://github.com/Ljrr3045/rielia/issues/53) governs T38.1–6. Sequence:
**accepted T36 → accepted T37 → accepted T11 → T38 → remaining dependencies**.
Traceability: T05–T11/T35, P01–P11/P33/P38, US01–US08/US11–US12/US24–US25,
existing UX/UXR including sprint UX04. [The finite inventory](t38-boundary-inventory.md)
defines maintained adoption surfaces. Initial research was read-only; the
coordinator subsequently released the isolated P1 below. P1 changed no production
manifests, locks, source, tests or coverage. Each released schema slice changes
only its named owners; neither the pilot nor local production evidence is full
T38 acceptance.

## Baseline and decision status

Observed manifests retain Node **24.22.1**, pnpm **12.15.0**, TS **6.0.3**,
Next **16.4.3**, React/DOM **19.3.1**, React types **19.3.0**, Nest
common/core/platform-node **12.3.2**, Better Auth **1.7.12**, Prisma/adapter
**7.10.1**, pg **8.23.1**, pg-boss **12.38.0**, OTel API **1.10.0**. MCP already
used Zod **4.6.7**; T38.2a adds that exact direct contracts runtime edge only.
The separate unit graph already includes DOM Testing
Library **10.4.2**, jsdom **31.0.0**, nyc **18.0.0**, tsx **4.23.15**. Keep node:test,
strict peers, no automatic peer installation, existing patches and build-script
allowlist. These are observed pins, not a request to upgrade them.

The table records **proposed decisions**, not accepted ADRs or installation
authority. Exact versions were retrieved from npm's public registry on November
23; links address the exact version. “None declared” is metadata absence, not
verified compatibility. The P1 receipt below supplies bounded TS6/Next evidence;
production ownership, NodeAdapter and deployment closure remain separate gates.

| Candidate pin / primary metadata | Engine / peer requirements | Proposed decision and remaining evidence |
| --- | --- | --- |
| [zod 4.6.7](https://registry.npmjs.org/zod/4.6.7) | No engine/peers/dependencies declared; MIT | **Select for pilot/shared schemas**; matches current MCP pin. [Zod requirements](https://zod.dev/) say TS5.5+. Preserve UTF-16/date/presence behavior, output compatibility and strict input rejection |
| [@tanstack/react-query 5.108.4](https://registry.npmjs.org/@tanstack%2Freact-query/5.108.4), [query-core 5.108.4](https://registry.npmjs.org/@tanstack%2Fquery-core/5.108.4) | React `^18 \|\| ^19`; optional React types same range; no engine declared; MIT | **Select for pilot/server state**; core exact dependency. P1 TS6/Next fixture passes; production owner replacement/security fences remain unproved. Two exact pilot-only age exceptions are recorded below; no production age exception is accepted |
| [react-hook-form 7.92.0](https://registry.npmjs.org/react-hook-form/7.92.0), [@hookform/resolvers 7.0.8](https://registry.npmjs.org/@hookform%2Fresolvers/7.0.8) | RHF Node>=18, React16.8/17/18/19, optional React types; resolver RHF `^7.55.0`, optional Zod `^3.25.0 \|\| ^4.0.0`; resolver engine absent; MIT | **Defer installation to a form parity gate** in T38.4. Optional resolver peers cover many validators: install only Zod subpath/selected dependencies. No blanket peer activation. One draft owner, retained captured versions/focus/navigation required |
| [openapi-typescript 7.13.0](https://registry.npmjs.org/openapi-typescript/7.13.0), [openapi-fetch 0.17.0](https://registry.npmjs.org/openapi-fetch/0.17.0) | Generator peer **TS `^5.x` excludes TS6**; engines absent. Fetch has no peers/engine; MIT | **Defer production client** pending canonical OpenAPI and supported compiler evidence. Do not bypass strict peers or downgrade app TS. A separate TS5 generator graph is an explicit alternative requiring a later gate, not selected here |
| [@testing-library/react 16.3.3](https://registry.npmjs.org/@testing-library%2Freact/16.3.3) | Node>=18; React/DOM/types18 or19; DOM Testing Library `^10`; type peers optional; MIT | **Select targeted T38.5 evaluation** with existing DOM10.4.2/jsdom31/node:test. Prove cleanup, act scheduling, instrumented module resolution and coverage attribution; no Jest/Vitest replacement |
| [msw 3.0.7](https://registry.npmjs.org/msw/3.0.7) | Node>=22.12; optional TS>=5.9.x, Vite>=6, GraphQL>=16; MIT | **Defer unless shared network cases reduce existing double complexity**. Start Node-only; no browser service worker asset, Vite or GraphQL installation. Preserve actual HTTP abort/deadline tests |
| [@playwright/test 1.65.1](https://registry.npmjs.org/@playwright%2Ftest/1.65.1) | Node>=20; depends on playwright1.65.1; Apache-2.0 | **Select bounded T38.5 browser evaluation**, separate graph, one worker/Chromium first, no automatic retries. Browser binaries/platform support and real fixture cost remain unmeasured |
| [@axe-core/playwright 4.14.0](https://registry.npmjs.org/@axe-core%2Fplaywright/4.14.0), [axe-core 4.14.1](https://registry.npmjs.org/axe-core/4.14.1) | Integration Node>=22.12, playwright-core>=1; axe Node>=4; integration depends on axe `~4.14.0`; MPL-2.0 | **Pair with browser evaluation**, lock exact axe/core/playwright-core resolutions and retain notices. Automated scanning supplements keyboard/manual AT evidence |
| [fast-check 4.11.0](https://registry.npmjs.org/fast-check/4.11.0) | Node>=12.17; no peers; pure-rand `^8`; MIT | **Select targeted T38.5 malformed-contract properties**, fixed seed/path, <=100 runs/property, no broad random DB/load suite |
| [pino 10.4.0](https://registry.npmjs.org/pino/10.4.0) | No engine/peers declared; MIT | **Defer runtime addition until T38.5 diagnostic scope review**. Direct logger/NodeAdapter seam, no Express/Nest wrapper. Validate Node24, redaction, safe serializers, output/shutdown/backpressure and closure |
| [@opentelemetry/api 1.10.0](https://registry.npmjs.org/@opentelemetry%2Fapi/1.10.0) | Node>=8; Apache-2.0 | **Retain existing pin**; API package presence does not prove active spans/metrics or an exporter |
| [@opentelemetry/sdk-node 0.301.2](https://registry.npmjs.org/@opentelemetry%2Fsdk-node/0.301.2), [instrumentation-http 0.301.2](https://registry.npmjs.org/@opentelemetry%2Finstrumentation-http/0.301.2) | Node>=22.15; SDK API>=1.10<1.11, HTTP instrumentation API `^1.10`; Apache-2.0 | **Defer**. Declared API/Node ranges fit, but SDK brings a large exporter graph; ESM startup, NodeAdapter hooks, sampling, data policy, shutdown and closure need separate proof. No collector/hosted exporter or auto-instrumentation bundle selected |

Metadata also records optional peers, direct dependency ranges and distribution
integrity. The advisory request covered 18 exact direct versions: the 17 package
pins in the table plus existing `@testing-library/dom@10.4.2`. It returned `{}`
from npm's
[bulk advisory API](https://docs.npmjs.com/cli/v11/commands/npm-audit#bulk-advisory-endpoint)
at **2026-11-23 23:26:50 UTC**. This is a direct-version snapshot only, not a
resolved transitive-graph audit, current-lock audit or safety guarantee. Pilot
lockfiles must capture transitive integrity/license/advisory findings before
acceptance; retain inherited audit/deprecation/Next upgrade reminder debt. No
repository license is selected by recording dependency license identifiers.

**Reject for this scope:** Redux/Zustand, Axios, a second query/form validation
stack, new router, ORM/queue replacement, blanket UI kit, Nest/Express convenience
integrations and automatic full OTel instrumentation. No demonstrated gap warrants
their additional owners/dependencies. Retain native fetch, existing routes,
Prisma, pg-boss and the current UI system.

Primary capability guidance read on the same date: [RTL runner-independent
setup](https://testing-library.com/docs/react-testing-library/setup/),
[MSW Node interception/lifecycle](https://mswjs.io/guides/integrations/node),
[Playwright accessibility checks and limits](https://playwright.dev/docs/accessibility-testing),
[fast-check runners](https://fast-check.dev/docs/core-blocks/runners/) and
[RHF Zod resolvers](https://github.com/react-hook-form/resolvers). These are
candidate capabilities; local integration remains unproved.

## Proposed ADR constraints

**A38.1 — shared schemas, proposed.** Contracts owns JSON shapes and inferred
`z.input`/`z.output` types, without Nest/Prisma imports. HTTP adapters map validation
failure to existing stable status/error behavior, not raw Zod errors. Use strict
objects for allowlisted request bodies/query shapes; [Zod strips unknown object
keys by default](https://zod.dev/api#objects). Keep explicit presence/null/scalar
checks and safe integer limits. No generic `z.coerce` for JSON. Existing UI string
conversion and service normalization remain explicit and separate.

Zod documents code-point string lengths; existing sprint/project input bounds
use UTF-16 `.length`. Preserve those bounds explicitly, and preserve the current
trim/default/null behavior instead of swapping in a similar-looking validator.
Keep exact Gregorian/UTC formats; retain backend IANA/DST, permission, version,
idempotency hash, transaction, activity/outbox and current-authority logic.
Never parse a public execution projection into trusted backend context.

**A38.2 — contract generation, proposed.** No canonical OpenAPI or generated
client exists today. Evaluate an OpenAPI **3.1.2** document assembled from named
shared wire schemas plus explicit route/status/header/security metadata. The
[specification](https://spec.openapis.org/oas/v3.1.2.html) and
[generator](https://openapi-ts.dev/introduction) support that family; newest 3.2
is not selected merely for being newer. [Zod JSON Schema conversion](https://zod.dev/json-schema)
does not automatically represent transforms, runtime checks or relational
refinements. Generate strict structural unions for null/backlog/carried cases
where possible; document remaining cross-record/date/authority semantics and
test them at runtime. Fail unsupported export rather than emit `{}`/`any`.
Reproducible generation and a drift check precede client adoption. Static
[openapi-fetch typing](https://openapi-ts.dev/openapi-fetch/) never substitutes
for unknown-response parsing, scoped checks or current authorization.

**A38.3 — Query ownership, proposed.** Migrate server DTO ownership by resource;
do not put Query around an independently writable controller cache. Controllers
retain captured commands, pending/unknown/conflict recovery and navigation;
forms retain editable strings and touched/error/focus state. Start with no
optimistic business writes, persisted cache, devtools, background mutation queue
or second SSE/session connection.

Create a QueryClient per server request, and an authenticated lifetime owner in
the browser. Keys include an opaque identity/session epoch bound to the verified
user/session, workspace/project, resource and canonical selectors/filters/cursors;
never credentials. Do not hydrate identity/session payloads or data for another
epoch. Product routes currently do not prefetch private domain SSR data: the
pilot tests two independent request clients without adding production hydration.
See [advanced SSR ownership](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).

Pilot defaults are explicit: `retry:false` for reads and writes, `staleTime:0`,
`gcTime:0`, `refetchOnWindowFocus:false`, `refetchOnReconnect:false`,
`refetchOnMount:false`, no polling/persistence. Existing visibility/return/event
owner triggers canonical reads; do not install a competing listener. Revisit
latency/cache retention only with measured evidence. Query functions consume
the [provided AbortSignal](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
through existing transports and retain completion/render fences.

Hide old data synchronously before effects on verification/context mismatch;
then cancel and remove queries/mutations on logout/revocation/expiry/replacement.
Cancellation can revert query state, so cancellation alone is not an erasure
boundary. Same-session verification preserves only the existing memory-only
draft contract. Late responses must not repopulate a cleared epoch. 401/403 are
terminal access outcomes, not retry candidates. No previous/placeholder data
crosses context. Record the adopted owner for every resource in the inventory.

SSE heartbeat does nothing; reset invalidates current authorized scope; matching
task/project hints invalidate affected resources and stale any close preview
immediately. Coalesce/defer refetch during pending writes, retain captured draft
versions, and refetch once after confirmation. Unrelated-project hints do
nothing. Server events remain invalidation, not DTOs or success authority.
Unknown mutations retry only by explicit intent with the exact original
idempotency key/body/versions; no refetch, new key or form reset can repeat a
business operation. Close requires fresh explicit preview/confirmation; visible
row counts cannot stand in for server totals.

**A38.4 — forms, proposed evaluation.** If RHF passes the later gate, it alone
owns editable field values/dirty/touched/errors for each migrated form. The
controller alone retains immutable command/recovery. Do not bind reactive RHF
`values` directly to refreshed DTOs: [RHF documents resets on values changes](https://react-hook-form.com/docs/useform).
Stage versions before editing, reset only on confirmed discard/context change
or explicit reviewed rebase, preserve error focus/modal return/guarded
navigation. No dependency adoption itself resolves existing native debt.

**A38.5 — diagnostics, proposed evaluation.** Use a data allowlist before
[Pino redaction](https://github.com/pinojs/pino/blob/main/docs/redaction.md): stable
request/operation correlation, route template, status, duration and bounded
outcome, without cookie/token/provider secret/invitation token/query string,
task/comment body, email or raw exception/SQL. Principal correlation needs an
explicit access/retention decision; never log entire request/context objects.
[OTel supports Node24](https://github.com/open-telemetry/opentelemetry-js), but
its SDK/exporter is not present just because the API package is installed.

Map diagnostics to existing tickets: T04 owns current readiness/diagnostic-worker
preparation; T06/T11 retain mutation correlation and atomic activity/outbox;
T15 owns deployment/runbook/backups and operational retention; T17 owns quotas/
registration/isolation signals; T19 owns durable notification-worker age/retry
signals; T20 owns remote MCP/OAuth signals; T24 owns launch/load/operational
verification. T38.5 may add bounded local redacted diagnostics for migrated
boundaries after a separate gate; it completes none of those tickets. Product
audit history remains distinct. No SaaS, collector, credentials or deployment.

## Representative pilot and release request

**P1, isolated compatibility only.** A temporary standalone package, outside
maintained production source, pins the observed Node/pnpm/TS/Next/React/types
and only Zod4.6.7 + Query5.108.4/core5.108.4. Copy the strict peer/build-script
policy; no app lock edit, peer bypass, unrelated upgrade or Prisma download.
Proposed files: pilot package/lock/workspace policy, strict TS probe config,
minimal Next app/provider, wire-schema candidates and node:test probes. Record
exact manifests, source inputs and tool versions. This does not change coverage
denominators or execute the accepted application suites.

Probe (1) strict configure/create/edit planned-sprint JSON versus current
validation, the eight G03 entries and their output inference; (2) the five G07
close shapes and existing malformed scalar/correlated-outcome cases as schema
stress evidence; (3) Query cancellation, two request-client isolation, two browser
identity epochs, revoke/logout late completion, SSE/write/refetch ordering and
exact-command explicit retry. Use bounded fictional DTOs/controlled promises,
not a fake claim of real persistence or native behavior. Retain legacy acceptance
fixtures and explicit valid historical shapes. Any mismatch stops adoption.

For reproduction **only under a coordinator release**, inspect direct pinned
executables and set task-local `T38_PINNED_NODE`, `T38_PINNED_PNPM` and
`T38_PILOT_DIR`. Use a standalone package outside any workspace. Do not invoke
project `pnpm exec` to discover its runtime: it can implicitly install the app.
The commands below describe the bounded probe sequence; baseline/candidate
fixture inputs and build directories must be recorded separately:

```sh
cd "$T38_PILOT_DIR"
"$T38_PINNED_PNPM" install --ignore-scripts
"$T38_PINNED_PNPM" install --frozen-lockfile --ignore-scripts
"$T38_PINNED_NODE" node_modules/typescript/bin/tsc -p tsconfig.probe.json --extendedDiagnostics
"$T38_PINNED_NODE" --test --test-concurrency=1 test/compatibility.test.mjs
"$T38_PINNED_NODE" node_modules/next/dist/bin/next build --webpack
"$T38_PINNED_PNPM" audit --audit-level=high
```

The first install creates only the pilot lock, then inspect peer closure/integrity/
licenses and verify frozen reproduction. Use one baseline minimal Next fixture
and one candidate fixture build serially, retaining identical non-tool inputs;
report raw/gzip emitted client chunks, build wall/RSS and TS diagnostics separately
from registry unpacked sizes. A fixture delta is not the production app delta.
Budget: one active process, no DB/server/browser/container; <=20 minutes total,
<=5 minutes per build (two builds max), <=2 minutes per probe/typecheck, <=20 MiB
retained sanitized evidence, no automatic build retries. Stop on failure or
budget overrun and report the precise gap. These were planning budgets, not
predicted measurements; the receipt below records the executed fixture costs.

**P2, first production vertical slice, proposed after P1 evidence.** Configure
planning → create/edit a planned sprint → validated settings/list/detail →
confirmed mutation/reload. Start at H30–35/G03/X04, preserving server policy and
existing form/draft owner; no close execution migration in that first batch.
Retain G07/PR52 parity as a prerequisite before later closure migration. Query
production work follows shared schemas/transport phases, initially `planning`
and `sprints` plus explicit create-sprint mutation, with owner replacement and
parent invalidation rather than two caches. Later RHF parity trial uses the
create/edit sprint form only, after its separately reviewed ownership design.

**Next production compatibility decision — selected by the coordinator on
November 23, not permission to start P2.** Migrated Sprint DTOs will require
strict scalar `person.kind` and `provenance.executionMode`, rejecting coercible
arrays/objects as malformed responses. Preserve valid scalar wire/API outputs
and the existing response extra-key policy. Retain negative cases demonstrating
legacy acceptance and intentional new rejection; do not use casts/custom
validators to claim inferred enums are sound. This first slice does **not**
authorize changing shared G02 `isDomainPerson`/global consumers or G06 historical
action checks. If clean schema ownership requires that wider change, present
the exact affected callers/tests for a coordinated scope decision first.

**Later T38.2c disposition, November 24.** The coordinator explicitly released
global G02 person-kind hardening after a complete caller census, plus G02-only
project/task provenance mode/source, known optional private-page boolean and
non-JSON sparse task-page rejection. The [bounded guide](t38-project-task-schemas.md)
records source-bound legacy/current witnesses, inferred types and actual affected
G04/G05/G06 consumer checks. Their other private mode/action checks remain deferred;
the earlier Sprint-only decision did not itself authorize this later work.

Production validation is scoped to changed behavior: retained contracts/affected
client/API units, meaningful negative/401/403/409/unknown/SSE cases, applicable
real PostgreSQL/HTTP and NodeAdapter runtime/closure checks, one full check and
normal coverage/CI at the appropriate batch gate. New source/tests/provider
fingerprints require comparable measured proposals and exact coordinator
approval before any baseline write; no ignore/exclusion/floor weakening. Real
browser/keyboard/mobile checks apply to later form/query integration. Do not
rerun unchanged T11 native or historical acceptance merely to reproduce counts.

Rollback: P1 has no production effect; retain its report/lock/hashes and remove
only owned scratch after coordinator handoff. Each later production batch must
be revertible with its matching manifests/lock/schema/client changes, without
DB migration or wire-format changes. Keep compatibility wrappers until their
callers migrate, but only one schema/cache owner. No silent runtime fallback to
old validation/cache. Reverts of reviewed remote changes remain coordinator-owned.

## Executed P1 receipt — November 23

The coordinator released standalone P1 and this documentation batch after reading
both full drafts. It independently verified actual task turn
`01a20ab8-e123-7311-a235-21902d303d21`: SOL `gpt-6.1-sol`/`xhigh`,
`approvals_reviewer=auto_review`, `approval_policy=on-request`, workspace-write.
No title-only profile inference is used for the verified worker setup.

**Operational incidents, separate from compatibility proof.** Discovering pinned
Node with project `pnpm exec node --version` unexpectedly bootstrapped 541 cached
app packages and ran existing Prisma preinstall/Husky prepare. This exceeded the
released scope; the worker stopped/reported it. Tracked source/manifests/locks/
baselines were unchanged. The coordinator inspected the linked-worktree Husky
early return, required no cleanup/global change, preserved the incident and
released direct-executable standalone continuation. Shared hooks configuration
has no before/after baseline; zero shared-store/configuration side effects are
not asserted. Bootstrap is not authorized P1 evidence. Ignored dependencies
remain for ordinary worktree cleanup.

The isolated install then automatically added two version-specific age exceptions.
The worker stopped before probes; the coordinator accepted exactly Query/core
**5.108.4 for the temporary pilot only**, then required local
`minimumReleaseAgeStrict:true`. Frozen reproduction passed with strict peers,
`autoInstallPeers:false`, `allowBuilds:{}` and `--ignore-scripts`, without another
exception/package-script execution. No production age bypass is accepted.
Registry publication times: Zod4.6.7 **October 12 16:29:37.778 UTC**,
react-query5.108.4 **November 23 13:20:10.775 UTC**, query-core5.108.4
**November 23 13:22:07.083 UTC**. All 840/410/365 installed candidate files matched
official tarballs byte-for-byte; tarball SHA-512 matched registry integrity.
Exact metadata, lock, source bindings, commands and notices are retained in the
evidence packet, not established by version names alone.

| Probe / measurement | Actual result | Limit |
| --- | --- | --- |
| Strict TS6 compile | Passed; final 289 compiler program files, 301674 instantiations, 415332K compiler-reported memory, 1.82s TS total / 2.016s command wall | Copied legacy contracts/parsers and independent candidate schemas; not maintained-source coverage accounting or production Next/API typecheck |
| Retained source-bound suite variants | 10 legacy + 10 candidate variant cases passed | Import-specifier changes only; candidate G03/G07/history schemas are independent. G06 scope/transition remain explicit legacy reexports, not new schema proof |
| Added contract/Query probes | 8 passed: three differential/schema cases and five using real QueryClient/observer/mutation APIs | Controlled promises/fictional data; no native browser/security/persistence proof |
| Added exact parser/date probes | 3 passed: planning/create/edit parser comparison, UTF-16 and existing DST policy | Parser copies change imports only; minimal Error stub replaces Nest's BadRequestException. No Nest/HTTP mapping or adapter proof |
| Baseline minimal Next build | Passed once; 8.972s wall, 869138432 bytes child max RSS | One static fixture, cold output directory |
| Candidate minimal Next build | Passed once; 7.760s wall, 993067008 bytes child max RSS | Only probe component source differs; separate cold output directory, same config/lock/other inputs |
| All emitted static JS chunks | Baseline 18: 923536 raw / 283585 gzip9 bytes; candidate 19: 1042742 / 318393 | Delta **+119206 raw / +34808 gzip**; includes shared/not-found JS, not production bundle, route network transfer, request count or CI cost |
| Resolved advisory checks | Installed host graph: 31 packages; lockfile audit exit0, seven moderate / zero high/critical | Lock audit reports 78 entries including optional packages; these units differ. Neither proves production backend/deployed closure |

The parser probe was added after the first successful compile/probes to compare
actual backend parser bodies; only that changed type/probe surface then ran.
Total distinct bounded cases: **31**, no failures/skips. No build retry,
application suite, server, browser, DB or container ran. Builds disabled telemetry,
used one page-data/static worker (`cpus:1`), disabled webpack build worker/worker
threads and used directly inspected Node24.22.1. Measured child commands total
**31.631s**; first isolated install to final audit spanned under ten minutes even
including the age-policy coordinator wait, below the 20-minute budget. Timings
are single observations, not a controlled speed comparison. Candidate extra max
RSS was 123928576 bytes. Production build/CI/request costs remain **unmeasured**.

Resolved Next16.4.3 findings are inherited moderate advisories
[mfr8](https://github.com/advisories/GHSA-mfr8-8qww-v76h),
[vc7v](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8),
[7qx7](https://github.com/advisories/GHSA-7qx7-33qx-rqx2),
[f3mh](https://github.com/advisories/GHSA-f3mh-rxg3-f5g2),
[pc58](https://github.com/advisories/GHSA-pc58-hwjq-p385),
[rhh4](https://github.com/advisories/GHSA-rhh4-g77r-r9qj),
[vvgp](https://github.com/advisories/GHSA-vvgp-ww4w-46vf). No pin change/security
waiver follows P1. Host manifests declare MIT, Apache-2.0, BSD-3-Clause, ISC,
0BSD, CC-BY-4.0 and LGPL-3.0-or-later. Notice hashes are retained; four packages
have no detected license/notice filename in their installed tree
(`@img/sharp-libvips-darwin-arm64`, `@next/env`, `@next/swc-darwin-arm64`,
`client-only`). This is a bounded notice-scan gap, not a legal incompatibility
finding. Full distribution/other-platform license review and repository license
choice remain open; the three selected candidates declare/include MIT.

Parity exposed retained output debt: shared person kind/provenance mode and
historical action checks stringify some values. The candidate preserves these
legacy cases explicitly rather than silently tightening wire compatibility;
their inferred scalar types are not claimed sound. The selected next-slice
Sprint-only hardening disposition above does not rewrite this historical pilot
or authorize shared/global/history migration.
Tolerated output extra keys remain preserved; strict requests reject extra
identity fields. Actual Query cancellation restored prior cached data before
removal, demonstrating why render fences and cache discard are separate.
SSR isolation, epoch masking, late completion, denial cleanup, SSE/write
coalescing and exact-command retry passed only the controlled schedules listed,
not application integration.

The coordinator **accepted P1 as bounded LOCAL compatibility evidence** after
reviewing its schemas/tests, measurements and complete packet. Preserved evidence
identity: `2026-11-23-t38/consolidated-p1`; original `worker-manifest.json` SHA-256
`16af2e7ff06ae058f13c8b9b7b37137f1e9e094fc57d4970840ff472e4585415`.
It binds this source-bound pilot and its prepublication documentation snapshot,
not later source/documentation heads. The PR57 publication reference does not
rebind prior pilot runs to this documentation head. Formal T38.1 delivery is
pending current-head CI/native Kilo, feedback/ownership/base checks and
coordinator acceptance. No production migration, NodeAdapter closure, full
generator compatibility or native UX acceptance is implied. The next release
request remains P2/H30–35/G03/X04 and its exact schema/type/test/coverage plan;
Query production/RHF/other tools remain separately gated.

## Phased PRs and acceptance accounting

| Phase | Proposed bounded PR scope | Exit evidence |
| --- | --- | --- |
| T38.1 | ACCEPTED in PR57, reviewed `b12e3220`, merged `4dab8594`; inventory/decisions/LOCAL P1 only | Native review and exact-merge CI passed; historical P1 limits retained |
| T38.2a | ACCEPTED in PR58: H30–35/G03/X04 Sprint schemas | Reviewed `5e2671bd`, merged `e1ebe3ac`; reviewed/exact-merge CI and native Kilo passed; original local source/run limits retained |
| T38.2b | ACCEPTED in PR59: H01–04/H55–66/G01/X01–02 | Reviewed `d9699cf`, merged `c655f0f0`; reviewed/exact-merge CI and native Kilo passed; receipts retain source identities |
| T38.2c | LOCAL GATES COMPLETE: H05–22/G02 and project/task/access/assignee X03 only | [Exact schema receipt](t38-project-task-schemas.md), approved migration, normal786/infra20/artifacts17 and real HTTP57/runtime; publication/current-head CI/native review/acceptance pending |
| T38.2 remaining | Discovery/SSE, collaboration, scope/start/close/history, encoded/private JSON and configuration | Each remaining H/G/X/C owner needs a separate release or explicit accepted debt/exclusion before T38.6; no universal policy rewrite |
| T38.3 | Canonical OpenAPI generation/drift first; generated transport adoption only after TS6/generator decision | Reproducible schema/type generation, unsupported-refinement list, unknown-response and same-origin/cancellation/error parity; no second hand-maintained definition |
| T38.4a | Two sprint resource caches and create mutation, then remaining enumerated server resources in bounded batches | Query becomes sole DTO owner; identity/render/abort/discard/SSE/version/recovery checks and production bundle/request costs |
| T38.4b | RHF trial then separately agreed F01–12 expansion or explicit exclusions | One field owner, draft/focus/navigation/validation parity, responsive/keyboard/nonideal/persistence evidence; no presentation redesign implied |
| T38.5 | Only selected RTL/property/browser tooling and separately approved bounded diagnostics | Retained deterministic units/real PG/runtime, reproducible failure probes, redaction/cleanup/budget evidence; no automatic telemetry or observability-ticket completion |
| T38.6 | Remove superseded validators/cache owners after parity; final inventory, examples, rules, measured costs and acceptance matrix | Every row accounted, retained debts explicit, current-head CI/native Kilo dispositions/ownership/base checks and coordinator acceptance |

This documentation batch contains these two guides; root/web/API AGENTS,
CONTRIBUTING, progress + new T38 ledger/subdelivery tracker, roadmap and unreleased
CHANGELOG; current summary paragraphs in sprint planning/scope-start/closure/
client/presentation guides as needed to remove live contradictions. Link PR56's
decision without rewriting dated receipts or the deliberately frozen
`t11-acceptance.md`. Preserve original T01–35, all imported handoff bytes, all
eight numerical baselines and existing review policy. Root alone publishes,
controls Draft/Ready, reviews and merges. Ready-for-PR-review documentation does
not replace the required current-head review or accept a T38 subdelivery.

Retained limits: omitted external Cancel/Leave remains **UNVERIFIED, possible
draft loss**; sprint filtering remains T08/T10/US05; full US05/P08/T08/T10,
US12/device/accessibility/provider/staging/real-user acceptance remains separate.
No source-conformity or all-app production-readiness claim follows tool adoption.
