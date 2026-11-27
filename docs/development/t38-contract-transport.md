# T38.3b contract-derived Sprint planning requests

## Draft publication and remaining gates

Published in [Draft PR69](https://github.com/Ljrr3045/rielia/pull/69), targeting
`dev` at initial implementation head
`835a9dbbd7880d4a51aa3d148967f3185e426c00`, based on
`8f4fb854b4b2ab058a2e3311009db971fc5c3e58`. Expanded local review and C01 correction
preceded publication. PR69 was verified OPEN/Draft at that head before this
reference-only batch. Initial [CI46001126144](https://github.com/Ljrr3045/rielia/actions/runs/46001126144)
was in progress at publication; final-head CI, native Kilo review and coordinator
acceptance remain pending. No initial CI pass, formal approval, PR/full-T38
acceptance or universal external-event claim is implied. The local source/run
checkpoints below retain their dated limits; this update supersedes their
publication status only. No application, test, dependency or numerical changes
or validation-suite rerun accompanies these references.

## Local scope and status

This bounded implementation adopts generated request types for **H30–35/G03/X04**:
project planning GET/configure, Sprint list/detail GET, and Sprint create/edit POST.
It supports T38.3 and existing P09/US06/T11 behavior. It adds no product workflow,
UI change, cache, retry, backend policy, Next route or API-client package.
T38.3a is [accepted in PR68](https://github.com/Ljrr3045/rielia/pull/68#issuecomment-7215920026);
that final decision supersedes its frozen pending-review paragraphs.
The coordinator reviewed the implementation without a blocking finding and approved
its exact web-only numerical adoption. The separately released **Next 16.4.6**
security patch has a successful native build, corrected post-build HTTP witness,
resumed standard tail and selected PostgreSQL checks. One Docker runtime attempt and deployed inspection pass with owned cleanup.
Expanded coordinator review accepts this local evidence and authorizes a local
commit after the C01 correction below. Publication, CI/review and acceptance remain
coordinator gates.

Strict application TS6 NodeNext/Bundler probes pass. The initial focused transport,
controller and real loopback HTTP run passes 76/76; patched-graph standard project
logic 172/172 and web integration 10/10 pass. One coherent all-source measurement,
the original normal replay and the patched normal replay each pass 920/920.
All 16 patched reports byte-match the frozen measurement/normal; all eight adopted
baselines remain exact. Prior infrastructure 20/20 remains source-qualified and
was not repeated; the patched graph's 17 bounded artifacts validate without upload.

## Exact framework security patch

The initial Next 16.4.3 build and one separately authorized unchanged continuation
each exited 1 with SecurityFatalError and an upgrade recommendation. Those failed
receipts remain historical. The coordinator then released only Next **16.4.6**,
matching root ESLint plugin **16.4.6**, @next/env and eight SWC lock entries.
No security receipt, clock, suppression or global configuration was changed.
React/DOM 19.3.1, application TS6.0.3, Node24.22.1, pnpm12.15.0 and unrelated
pins remain unchanged; strict peers/lifecycle/release-age policy remains active.

Primary-source research on **2026-11-27** identifies the fetched-response framing
and binary cache-key issues patched at16.4.5, followed by16.4.6's route-handler
compression correction. This motivates the exact patch, not a claim of universal
security. See the official [framing advisory](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385),
[cache-key advisory](https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj),
[16.4.6 release](https://github.com/vercel/next.js/releases/tag/v16.4.6) and
[published metadata](https://registry.npmjs.org/next/16.4.6).
The engine/peer metadata and other direct dependency pins match16.4.3. Lock-only
resolution was inspected before frozen installation: only11 family versions/SRIs,
importers and necessary Better Auth peer snapshot keys changed. No unit/generator
lock, peer suppression, lifecycle approval or unrelated dependency changed.

The new [production Next HTTP fixture](../../scripts/next-proxy.integration.test.mjs)
runs through the existing route after `pnpm build`, using an owned mock upstream.
It verifies gzip JSON bytes/framing with201 and409, request IDs, two separate
renewed Set-Cookie headers (including an Expires comma), no-store, and identity
encoding without stale gzip headers. SSE delivers its first frame before close;
caller abort closes upstream before fixture teardown. The initial fixture's
explicit SSE Origin was rejected by existing admission; the corrected same-origin
GET shape omits Origin and asserts Fetch-Site forwarding. That corrected witness
passes against the same successful build. This is neither an exploit test nor
real-browser cookie/identity/provider acceptance. All fixture ports, process
readiness, deadlines and cleanup are bounded; no production proxy code changed.

Expanded root review found **C01** in the new fixture: one fetch read need not
contain one complete SSE event. The fixture now accumulates streaming-decoded
bytes until the first LF/LF frame delimiter, rejects premature EOF or more than
4KiB, and retains the existing5s first-event deadline. Its mock splits the frame
delimiter across writes; the assembled first heartbeat is asserted before caller
abort and upstream-close-before-teardown. The affected `pnpm test:web:next-http`
passes1/1 against the existing successful16.4.6 build. Prior passing fixture bytes
remain historical evidence. This is test robustness, not an application behavior
failure. No build/full check/PG/runtime/normal measurement was repeated for C01;
all8 baselines and measured source/test/provider bindings remain unchanged.


## Owners and generated boundary

The [contracts package](../../packages/contracts/package.json) exposes
`@rielia/contracts/openapi` through a **types-only** export of the unchanged
[generated declaration](../../packages/contracts/generated/openapi.d.ts).
The runtime contracts barrel and canonical OpenAPI JSON are unchanged.
[api-contract-client.ts](../../apps/web/src/lib/api-contract-client.ts) uses
`import type` and derives method/path inputs, path/query values, JSON bodies and
the captured idempotency-key scalar from those declarations. Its type-level
selection is exactly the existing three Sprint planning path templates, giving
six GET/POST pairs. It is not a universal 66-operation serializer.

[sprint-client.ts](../../apps/web/src/lib/sprint-client.ts) supplies the actual
literal templates and three existing command branches. The shared helper returns
`Promise<Response>`; this is network data, not a validated generated DTO.
The feature still parses unknown JSON and applies the original G03 Zod-backed
guards and workspace/project/entity correlations before returning existing public
DTOs. It retains original accepted objects and unknown extra keys. Success-type
compatibility witnesses belong to the [test-only type probe](../../scripts/openapi/transport-type-probe.ts),
not production helpers without a consumer.

Generated-success → current DTO/predicate-result compatibility is proved for
these six operations. **The reverse Sprint/SprintPage direction fails**: generated
provenance is a correlated human/web/null or delegated/autonomous/mcp/string
union, while the existing exported DTO represents those fields with broader
individual unions. The coordinator accepted this one-way relation after the
isolated proof. This is contract-derived requests with existing runtime-validated
domain responses, not an exact generated-success parser or bidirectional output
equivalence. No success cast, DTO rewrite or duplicate runtime validation bridges
that difference. Readonly input views permit existing immutable command snapshots.

The helper is web-local for this first browser consumer. A neutral
`packages/api-client` remains a later concrete-consumer/package-accounting decision
under architecture §§1.5/4.1. The diagnostic local MCP client has separate bounded
Node HTTP behavior; it does not use this cookie/session adapter. No openapi-fetch
or other transport dependency is installed/adopted. The separate framework patch
above changes only its exact application lock family; unit/generator locks,
strict peers, lifecycle policy and application TS6.0.3 remain unchanged. Existing
isolated generator 7.13.0/TS5.9.3 remains generation-only.

## Preserved protocol and recovery

- Once-only encodeURIComponent path/scalar cursor encoding, omitted versus empty
  cursor, JSON property order/values and captured mutation key remain. No editable
  Origin/Cookie/Fetch-Site/header or actor channel is exposed. Browser credentials
  stay same-origin; API/Next admission and current authority are unchanged.
- Native fetch retains no-store, redirect:error and caller abort combined with a
  default 15s deadline through response-body consumption. The helper neither parses
  nor clones a response, narrows HTTP success statuses or retries a request.
- X04 still accepts any response.ok status only after its actual guards, and
  response.json remains independent of Content-Type. Malformed JSON/body-read
  rejection maps to502 for ok responses or the actual error status, retaining
  x-request-id. Invalid successful shapes still produce502 without that header.
  Pre-header network/abort failures remain raw.
- On every non-ok status, string code and valid scoped Sprint or ProjectPlanning
  current retain their original admission and object semantics. Errors remain
  unmodeled in OpenAPI; content?:never does not mean an empty HTTP body.
- Existing controller/hook owners retain pending/unknown/conflict/confirmation,
  exact-key/body explicit retry, immutable versions/drafts, session/tenant/render
  fences and one parent SSE/identity lifetime. X03 accessCurrent/closeWarning,
  X05 start/scope/participation/close correlations and their original errors are
  outside this transport migration. No universal error parser is introduced.

## Targeted evidence and remaining checks

[Shared helper units](../../apps/web/test/unit/api-contract-client.test.mjs)
exercise options/encoding/JSON bytes, raw identity/status/headers, no parser/clone/
retry, missing captured-key programmer misuse and combined signals.
[Actual Sprint transport tests](../../apps/web/test/unit/sprint-planning.test.mjs)
retain the six wire calls and add original-object identity, runtime provenance,
foreign/current, any2xx/content-type, malformed/empty/primitive/body-failure and
request-ID distinctions. Existing actual controller tests pass in the76-case
focused run; hook/composed lifecycle evidence is included in the coherent all-source run.

[Owned loopback HTTP tests](../../scripts/sprint-client.integration.test.mjs)
pass 4/4: already-aborted requests send nothing; live caller abort disconnects one
write; pre-header real deadline preserves raw timeout; a stalled body after201
headers still times out to the original feature failure with request ID; redirect
rejection neither follows nor replays. These are ephemeral Node HTTP fixtures,
not Nest/PostgreSQL or native-browser cookie/Origin acceptance. Cleanup closes
only their server/connections. Existing web integration checks remain present.

The maintained strict [NodeNext](../../scripts/openapi/tsconfig.transport.nodenext.json)
and [Bundler](../../scripts/openapi/tsconfig.transport.bundler.json) probes consume
39 expected negative witnesses, including predeclared extra keys, wrong scalars,
GET bodies, manual browser headers, uncorrelated method/path unions and readonly
mutation. Intentional union choices require explicit narrowing. Formatting moved
some negative comments away from their diagnostic lines during initial preparation;
those failed receipts are retained separately from the corrected passing probes.

All-source accounting retains the new helper in the web denominator and all four
scopes/16 reports. The coordinator adopted only the exact candidate below; no
ignore, exclusion, lowered floor or PR65 exception is used. The new standalone
post-build HTTP fixture is outside the existing fixed unit test selection and
adds no exclusion or numerical input. Patched-graph input/test/provider/config
fingerprints are unchanged, including the finite generated Nest metadata witness.

## Final local measurement and standard limits

The new helper is 100% covered at L/S/F/B 15/18/2/13. Its only changed retained
production owner, sprint-client.ts, stays 100% at 41/44/8/47, versus 40/43/9/59.
Removing the old per-call HTTP/URL conditionals and adding the reusable constructor
explains the net +16 lines/+19 statements/+1 function/+1 branch. All added counters
are covered. Retained per-file exact ratios do not regress and uncovered counts
never increase; source/provider/config scope is unchanged apart from the one new
web owner and its two changed/new unit files.

| Scope | Tests | Lines / statements / functions / branches |
| --- | --- | --- |
| API | 384 | 1698/2200 · 1857/2411 · 478/643 · 1262/1637 |
| Web | 438 | 3620/4956 · 3989/5631 · 837/1356 · 4674/6966 |
| Contracts | 79 | 709/709 · 779/779 · 250/250 · 534/534 |
| Prototype | 19 | 238/853 · 269/984 · 87/368 · 194/954 |

The coordinator adopted only the exact reviewed web baseline, 48,306 bytes/SHA256
`ec0402f900da889f31a7e3febff87d254df4c8fa1900ad6ce8333101cd37b3f1`,
compared with previously accepted 47,723 bytes/`482fe5bf87242c344629c78420e0f69c77afc785d30c47668514c11b55fad407`.
Adopted L/S/F/B floors are 7304/7083/6172/6709 (previous 7295/7074/6169/6709).
The other seven current/historical baselines remain byte-identical and were not regenerated.
All 16 measured reports/maps/LCOV/summaries are preserved with exact source/test/config
fingerprints and count digest
`36731c18e6d206b3c6ea1ec3337d2c261c455ee720ad1b5a6e5ae02f8fe8c275`.
Measurement used --built after current contracts/API builds. The original and
patched normal --built replays each pass API384/web438/contracts79/prototype19
(920 total) and reproduce all16 report bytes/digest above. All8 adopted baselines
remain exact through the framework patch. Prior infrastructure20/20 has unchanged
maintained sources and remains source-qualified; patched artifact validation
passes all17 files without upload. No new maintenance measurement was needed.

The first16.4.3 standard attempt stopped initially on test-global/type-import lint;
corrected source-qualified stages then reached the native security stop. The one
unchanged continuation failed the same security gate. The fresh16.4.6 check passes
format/quality24, lint, backend closure, OpenAPI15/census128/drift/public-export and
both transport probes, smoke-process1, identity5, workspace16, project172,
prototype19, integration10, app typechecks and the complete recursive native build.
It then stops at the new fixture's initial SSE admission assertion. Corrected
fixture1, unreached MCP20 and final HTTP smoke pass separately, without repeating
the successful build or claiming an uninterrupted successful `pnpm check`.
The exact final test edit is formatting/lint checked separately. All ordinary
initial failures and sandbox/native failures retain their own source/run identities.

Selected current-build PostgreSQL Sprint integration passes47/47 across planning,
scope/start and close, with disposable database removal. The single Docker runtime attempt passes frozen image build, migration failure/
delay/repetition, schema mismatch, readiness outage/recovery, durable diagnostic
job, shutdown and corrupt heartbeat/result checks. Its owned containers, networks,
volume and image tags are removed. No staging, deployment or real-product
acceptance is inferred.
The patched application audit reports1 low/7 moderate/0 high/critical, versus the
prior graph's1 low/14 moderate. Isolated unit tools retain2 moderate and generator0
on unchanged locks; those prior audit receipts were not rebound or repeated.

The actual helper TS6 ES2023 emit is1,409 JavaScript/2,308 declaration bytes with
no runtime import of generated contracts/JSON/generator/TS5/Zod. The successful
host build has30 browser JS files/1,667,108 bytes (34 static files/1,814,615 bytes)
and2,161 standalone regular files/48,554,084 bytes. The standalone package inventory
contains Next/@next/env16.4.6; no generator/TS5/canonical OpenAPI JSON path or exact
marker occurs in the inspected static JS or13 NFT manifests/4,076 entries.
These are absolute bytes and bounded artifact observations, not an accepted-base
bundle delta or a universal package-equivalence/security proof.

## Deployed cost observations

Read-only, network-disabled probes ran against the same owned runtime images;
no second runtime build or accepted-base rebuild was run. Absolute Docker image
sizes and regular `/app` file totals are:

| Image | Image bytes | `/app` bytes / regular files |
| --- | --- | --- |
| API/worker | 1,269,647,721 | 650,375,457 / 28,664 |
| Web | 424,070,389 | 50,696,803 / 2,195 |
| Migration | 1,299,033,444 | 674,763,474 / 28,814 |

The web has Next/@next/env16.4.6 with no canonical OAS JSON, generator or TS5
package. API/worker and migration retain Next16.4.6 through the existing optional
peer graph; migration retains existing TS6.0.3. No generator/TS5 transport edge
was found in those deployed package inventories. Existing backend closure checks
also pass in the actual API/worker and migration images without Express.

Backend contracts still ship931,456 JSON +345,132 generated declarations +78,853
source OpenAPI +265,778 emitted OpenAPI bytes: exactly the accepted **1,621,219**
four-group debt in each backend image. The separately shipped contracts test set
has9 files/131,664 bytes. An initial metadata probe omitted the emitted group;
two small follow-up read-only probes of the same owned API/migration images
completed it before cleanup. Nothing was removed or repackaged. All byte counts
are absolute inventory observations, not transport/framework size deltas, startup
measurements or a zero-cost claim. Distribution cleanup remains T38.6.

## Accounting and retained debt

Only six canonical operations are locally migrated here; 60 remain outside this
transport adoption. The [H/G/X inventory](t38-boundary-inventory.md) and
[canonical guide](t38-openapi-contracts.md) retain all 66 route families, unmodeled
errors, runtime scalar/refinement/correlation authority, raw Better Auth and SSE
exclusions. This does not close full T38.2/T38, T38.4 Query/forms, T38.5 tools,
original ticket/device/a11y/provider/staging/real-product acceptance or landing.

Generated type erasure is not zero runtime/deployed cost. Final emitted/browser
artifact observations must distinguish absolute bytes from a before/after delta;
no accepted-base rebuild is requested. Retain PR68's accepted 1,621,219-byte backend
contracts packaging cost and S01's missing CONTRIBUTING prose space for T38.6.
The earlier Next16.4.3 stop is superseded only by the exact patch evidence above.
Lower app/unit advisories/action warnings,
G06/dense/T04 unit gaps, user-omitted UNVERIFIED Cancel/Leave with possible draft
loss and Sprint filters remain explicit owned debt.
