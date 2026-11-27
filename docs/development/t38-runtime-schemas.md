# T38.2j configuration and diagnostic schemas

## PR67 round1 correction — isolated HTTP deadline witness

The completed first native round on `ae95a9c6` reports0critical/1warning/0suggestion.
The coordinator validated [W01](https://github.com/Ljrr3045/rielia/pull/67#discussion_r4715751704) and returned [PR67](https://github.com/Ljrr3045/rielia/pull/67)
to Draft. The maintained scratch witness omitted the new server helper; one run
reproduced ERR_MODULE_NOT_FOUND. Its explicit copy list now includes that exact
dependency. One corrected real run proves baseline exit0 and the intended
missing-body-deadline mutant exit1, preserving all original assertions, deadlines,
isolation and mutation text. Both owned scratch receipts/inputs were archived
before cleanup. Other maintained witness source has no identical defect.

Kilo lists23 reviewed code/test files, eight documentation consistency skims and
two baselines not line-reviewed. The coordinator separately reviewed the docs and
verified exact baseline/raw-map/source/provider/all16-normal evidence; no full33-file
Kilo line review or gate waiver is claimed. Production/unit source, dependencies,
locks and all eight baselines are unchanged. Only affected witness/doc checks are
needed here; original receipts retain their source SHA. Root reply/resolution and
corrected-head CI/native review remain pending, with no final acceptance implied.

## Current publication — Draft PR67

[Draft PR67](https://github.com/Ljrr3045/rielia/pull/67) targets `dev` at initial
implementation head `19e7daf4`. Current-head CI, native review, Ready/merge and
acceptance remain pending; no current-head success or billing evidence is claimed.
This reference-only update preserves earlier local/pending checkpoints and their
source/run identities without re-execution or rebinding. Full T38 remains open.

Coordinator-released implementation from accepted T38.2i merge `a9fa0047` on
2026-11-26 America/Caracas. Exact API/web numerical adoption is coordinator-approved;
fresh normal904/infra20/artifact validation passes, reproducing all16 measured
reports. The other six baselines remain byte-exact. Publication, current-head CI,
native review and acceptance remain coordinator gates. Full T38 remains open.

Traceability: T38.2/C01–12 in the [maintained inventory](t38-boundary-inventory.md),
supporting existing B0 T02 identity/proxy, T03 public process liveness, T04
runtime/migration/recovery and T35 authority foundations. P01/US01 governs
installation/provider settings; P02/P03/P38 and US02/US03/US11/US24–25 preserve
isolation, server-derived authority and provenance. P34 and architecture
§§2.3–2.4/2.7/6.2–6.4/8.2–8.3 govern private configuration and safe recovery.
No original ticket or authenticated MCP catalog/credentials/authorization is
accepted. Web changes are logic only; existing UX07/UX09 behavior remains.

## Owners and preserved admission

| Boundary | Maintained owner and behavior |
| --- | --- |
| C01 identity | API `identity/config.ts` has local field/provider schemas consumed in the existing ordered adapter. `IdentityConfig` remains an independent interface; provider schema output is inferred. No whole-process environment parser or global registry. |
| C02 runtime | API-private `runtime/config.ts` owns exact diagnostic opt-in and nonempty untrimmed database pass-through. `database.ts` preserves its reader export; RuntimeService reuses enablement. Existing checksum/table/version/queue readiness, pools, signals and migration-only storage installation stay unchanged. |
| C03 listen | The same API runtime owner validates the result of `Number(PORT ?? 3001)` as integer1..65535 before Nest creation. HOST still reads at the existing listen call after setup, defaults only on absence, and otherwise passes through unchanged. |
| C04 upstream | Web `lib/server/api-upstream.ts` shares the existing native URL construction across identity/workspace/project proxies and fixture SSR liveness. Configuration is read per call at each original admission stage. Native parser reuse is the approved disposition; no web Zod dependency/lock change. |
| C05 MCP | MCP-local `config.ts` uses staged raw-setting and parsed-origin schemas, with native URL parsing between them. Keep fixed health path, exact flags, HTTPS/numeric-loopback rules and generic pre-protocol failure. |
| C07 CLI | API-private `runtime/diagnostic-schemas.ts` admits exact action/UUIDv4/arity. Caller retains lowercase and enqueue-only missing-ID generation, resource-before-admission ordering, pg-boss states, abort/wait/query budgets and generic usage error. |
| C08 payload/result | That diagnostic owner has literal schemas and inferred types. Payload requires its two own enumerable keys; completed results require only the diagnostic literal. Known-field copies preserve ignored hidden/symbol values without reading them. |
| C09 heartbeat | The same owner validates only numeric `at`, ignoring queue-age metadata/extras, then preserves the two clock comparisons and inclusive20s limit. Worker SQL/write/startup/shutdown ownership and private file remain unchanged. |

Identity's eleven named keys retain distinct rules. `IDENTITY_ENABLED` is exact
`true`, `false`, empty or absent; only true reads the other settings. HTTPS does
not read the HTTP exception. `NODE_ENV=production` prevents the exception;
`IDENTITY_ALLOW_HTTP_LOOPBACK=true` permits nonproduction parsed localhost,
127.0.0.1 or [::1]. Unknown allowance strings do not grant HTTP, but are not
independently invalid on HTTPS. No broad truthy conversion is used.

`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` and `DATABASE_URL` trim before their
existing checks. Native URL canonicalization and origin output remain; secret
minimum32 uses UTF-16 `.length`. Identity DB requires a PostgreSQL scheme/host
and returns the trimmed original connection text. Proxies split/trim commas,
drop empty entries, retain order/duplicates, and require explicit IP or decimal
CIDR masks in family bounds. Optional Google and GitHub values trim; each needs
both ID/secret or neither, with Google checked first.

Failure order remains enabled flag, URL parse/components/transport, secret,
database, proxies, Google, GitHub. Missing URL still maps to the canonical-origin
error; missing secret/database retain their required-setting messages. Errors
name settings without supplied values, raw schema issues or causes. Disabled
configuration returns empty credentials/proxies/providers without inspecting them.

Runtime DB parsing is deliberately different: exact LOCAL_RUNTIME_ENABLED=true
and a nonempty string are required, without trimming or imposing identity's URL
policy. RuntimeService is disabled for every other flag, while explicit
worker/migration/diagnostic entrypoints reject missing opt-in. Prisma tooling
retains its independent pass-through/default-empty behavior.

MCP requires a raw lower-case http/https origin with optional trailing slash and
allowance absent/true/false. Unlike identity it rejects raw whitespace,
backslashes, any userinfo marker, paths/query/hash and localhost HTTP. Only
explicit allowance plus parsed numeric127.0.0.1/[::1] permits HTTP; existing native
numeric aliases remain. There is no NODE_ENV rule here. The native malformed-URL
stage and both existing safe configuration messages remain; main exposes only
generic stderr/exit1 with zero protocol stdout.

Web upstream validation remains native URL resolution followed by each caller's
fetch/error handling, without a new HTTPS/origin-only policy or normalization.
Workspace/project admission still rejects before reading configuration, and
identity retains its library/backend-owned admission. Each caller retains its
own failure message/status, allowlisted headers, cookies, manual redirects,
timeouts, caller cancellation and SSE cleanup. The page returns its existing
boolean liveness fallback with no markup/copy change. Client inputs never supply
the configured base; no client module imports the server owner.

## Two approved diagnostic corrections

Completed CLI output formerly printed arbitrary pg-boss `job.output`. It now
requires `{diagnostic:'ok'}` with no extra enumerable keys, then prints only that
bounded result. Missing/null/malformed/extra data fails through the existing
generic usage stderr/exit1. Noncompleted status keeps output:null, and payload
validation still precedes result inspection. No raw rejected value escapes.

Payload JSON compatibility remains exactly `{kind:'runtime-probe',version:1}`.
The approved JavaScript correction rejects arrays with custom fields, missing
own keys, inherited literals and hidden required fields that the old count/`in`
guard could accidentally admit. Correct own enumerable fields work on ordinary,
custom and null prototypes; unrelated nonenumerable/symbol fields remain ignored.
No plain-prototype requirement, deep freeze, business effect or storage format
change is added. Worker output is the canonical result; duplicate delivery
remains harmless and pg-boss owns queue writes/states/retries.

Heartbeat health consumes only `at`. Missing/bad JSON, nonnumeric time, stale or
future time fail without output. Equal-now/equal20s/fractional timestamps retain
compatibility. Age metadata may be missing or any JSON value and stays ignored;
worker DB clock skew/negative/fractional queue ages do not become a new failure.
Clock reads keep their original order/short circuit, without date normalization.

## Assessed exclusions and canonical reuse

| Inventory | Disposition, owner and retained validation |
| --- | --- |
| C06 Prisma config | Tooling pass-through `DATABASE_URL ?? ''`; Prisma owns migration connection errors and generation stays DB-free. Retain frozen generation/type/build and real migrations. No identity/runtime policy imported. |
| C10 typed/build/dependencies | Next/build/backend package owners retain strict TS, tracing/build config, exact pins/frozen locks, strict peers/no auto peers, lifecycle allowlist, patches/overrides and installed/deployed NodeAdapter closure. Typecheck/build/closure/audits remain required. |
| C11 operator/container | T04/runtime owns examples, required Compose password, loopback ports/private networks, explicit one-shot, pinned nonroot/read-only images and upstream Postgres/Next settings. Existing real migration/failure/readiness/restart/credential/closure tests remain. No actual environment files or credentials are read. |
| C12 protected tooling | Quality/repository owners retain Git/index/event/commit validation, immutable handoff/skill integrity, source maps/all-source baselines/comparators, artifact bounds/allowlists and upload safety. Retain quality/unit/infrastructure/artifact/integrity checks; no Zod conversion or tooling-policy change. |

These are assessed exclusions from runtime schema replacement, not universal
source conformity or waived validation. `scripts/test-runtime.mjs` adds bounded
regressions in disposable resources without changing protected tooling adapters.

MCP already uses `z.strictObject({})` for tool input and canonical
`healthResponseSchema.strict()` for output. Its bounded REST guard already calls
that same canonical contracts schema loosely, then projects status/service only.
The inventory's earlier duplication note is historical; retain all three roles.
No new health parser, public config DTO, production MCP surface, API/DB import or
protocol/transport rewrite is needed.

## Verification and limits

Implementation regression cases cover positive/negative defaults, exact strings,
ordering/unread settings, URL/CIDR/provider distinctions, UTF-16 length, Number
aliases, native upstream parity/failure/authority, action/UUID/arity, payload/
result JavaScript ownership and heartbeat clock/metadata behavior. Existing real
identity/proxy/session/security/SSE assertions remain. Runtime regressions use
only owned diagnostic rows and a separate ephemeral heartbeat container, with
bounded fictional corruption and recovered readback. They never replace the
running worker or host heartbeat file.

Frozen app/tools installs passed with copy imports after offline cache misses;
locks, dependencies, peers, lifecycle policy and patches are unchanged. Failed
install logs remain evidence, not completed offline-install claims.

The initial `pnpm check` passed formatting/quality/lint/installed closure, focused
logic/prototype/web HTTP integration, strict typechecks and contracts/API builds.
Web compile/type/page generation completed, then the pinned native Next security
recommendation stopped the build. The coordinator separately authorized bounded
native continuation: the first unchanged web-only build passed, so no second was
run. Actual MCP build/tests20 and final HTTP/SSR smoke then passed using existing
outputs. The original failed log remains a partial standard receipt; no
uninterrupted `pnpm check` pass or security remediation is claimed.

Independent strict TS6 input/output probes passed. Static local-import analysis
found only the four intended server importers, no client reachability, and no
configuration marker in28 actual production browser chunks. This is bounded
import/bundle evidence, not universal data-flow conformity.

The first coherent measure passed901 tests and remains preserved. Review exposed
missing malformed-native-DB and default process-environment/clock cases; adding
those substantive regressions and affected lint produced the proposed coherent
measure: **904/904**, no skips (API384/web429/contracts72/prototype19), over190
maintained inputs (62/89/23/16). New API config and diagnostic schema modules and
the native web helper are fully covered across their nonzero metrics. No
maintained owner was excluded; inherited type-only N/A remains.

The existing selected real-PG command
`node scripts/test-identity.mjs --workspaces` passed48 tests (12 principal,
13 workspace,23 identity), including actual Better Auth/NodeAdapter/Prisma/PG
with simulated provider HTTP and twice-applied migrations. Default CI selections
remain unchanged; no unrelated full T11 rerun was added.

The initial runtime proof passed through migration gating/schema compatibility,
lock/signal and DB recovery, then a new test assertion incorrectly combined
Compose launcher messages with application stderr. The harness now asserts exact
application exit1, empty stdout and fixed stderr inside the disposable container;
no application check was weakened. The affected runtime suite then passed all
existing lifecycle/closure/restart assertions plus CLI/corruption/heartbeat cases.
Both attempts and their distinct source identities remain preserved. All four
Docker ID sets matched before/after the selected PG and each runtime attempt;
owned containers/networks/volumes/image tags were removed, preserving foreign
resources. Existing optional nested tooling/image-footprint limits remain.

App/tools high audits passed with1low/14moderate and2moderate respectively, no
high/critical findings. Artifact packaging validated the measured reports without
upload. Before numerical adoption, infrastructure was19/20: the unchanged actual-report
policy guard rejected the measured test manifest against the frozen baseline.
That failed receipt is preserved. After exact approved adoption, fresh normal
coverage passes904/904 with all numerical/per-file gates and the expected count
digest, all16 reports reproduce the frozen measurement byte for byte, and the
unchanged infrastructure suite passes20/20. Final artifact validation passes
without upload. No guard was waived or rewritten.

## Coordinator-approved exact numerical adoption

| Scope | Before L/S/F/B covered/total | Adopted L/S/F/B covered/total | Adopted floors |
| --- | --- | --- | --- |
| API |1658/2164;1811/2367;463/629;1245/1643|1698/2200;1857/2411;478/643;1262/1637|7718/7702/7433/7709|
| Web |3602/4940;3968/5612;835/1354;4674/6971|3604/4940;3970/5612;836/1355;4673/6965|7295/7074/6169/6709|

All aggregate ratios improve and no retained file ratio decreases. API uncovered
counts506/556/166/398 become502/554/165/375; web1338/1644/519/2297 become
1336/1642/519/2292. Native upstream default branches are shared rather than
counted four times; absolute covered web branches fall by1 as the denominator
falls by6. Identity branches38/40 become35/36, with uncovered2 becoming1.
Counts on52 unchanged API,84 web,23 contracts and16 prototype source files remain
equal. This is covered/total evidence, not an unverified claim of identical raw
hit vectors. Provider/compiler/config/tool-lock inputs remain exact.

The CLI bridge retains its owned unit gap: lines0/39→0/41 and statements0/42→0/45
add2/3 uncovered units for result admission. Real runtime negative/positive
coverage proves its behavior separately; integration is not relabeled as units.
Unexecuted nonzero-unit owners remain API12/web16/prototype12, with existing
web1/contracts1/prototype2 type-only N/A. New helpers all enter the denominator.

Only the exact current API/web candidates were approved and adopted:
API33092bytes/SHA256 `49408578441f802c856a6a5c1ddf33e0513103dd9155fdd01e429670cb837d8e`;
web47723bytes/SHA256 `482fe5bf87242c344629c78420e0f69c77afc785d30c47668514c11b55fad407`.
Contracts/prototype and all four historical baselines remain byte-exact. The
coordinator checked current/prior raw maps and explicitly dispositioned the exact
CLI bridge gap as owned T04/runtime test debt for this candidate only; its separate
integration evidence is not unit coverage or a general waiver. Full raw maps/
manifests/LCOV, both measures/candidates, independent fixtures, decreases and
source-qualified failed/passing receipts remain preserved. No floor reduction,
exclusion, comparator/provider change or inherited T38.2h/2i disposition was used.

Fresh normal count digest is
`72e3147ba61818b7753734b112b382b69d61a14a96d0e2d338ed2541978b7636`;
all16 summary/manifest/map/LCOV files reproduce the approved measure. Production
source, selected tests and provider/config/lock fingerprints match; only these
two baselines and current evidence docs changed for adoption. Normal/infra/
artifact receipts remain separate from both measurements and original failures.
Current-head CI/native review/publication/acceptance remain open.

Next16.4.3's security recommendation, dated app1low/14moderate/tools2moderate audit
findings, pinned pnpm action warning, G06 optional/dense helper, user-omitted
cross-document Cancel/Leave (possible draft loss), sprint filters and broader
native/provider/staging/device/product limitations remain. The first authorized
unchanged native web retry succeeded; no unauthorized retry, receipt manipulation,
suppression or upgrade occurred. No live-provider request, deployment or
full-ticket acceptance is claimed.
