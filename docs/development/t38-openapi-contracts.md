# T38.3a canonical OpenAPI contracts

## Current phase decision — T38.3 accepted; initial Query local gates complete

The coordinator accepted bounded T38.3 on 2026-11-27 America/Caracas at
`70e323b2c7139f3ed3dc5ca50bb8545e5571c5a7`, consolidating accepted
[PR68](https://github.com/Ljrr3045/rielia/pull/68#issuecomment-7215920026),
[PR69](https://github.com/Ljrr3045/rielia/pull/69#issuecomment-7226805575) and the
final body decisions in [PR70](https://github.com/Ljrr3045/rielia/pull/70) and
[PR71](https://github.com/Ljrr3045/rielia/pull/71). Canonical generation/drift,
isolated generator TS5/application TS6 and **62 browser JSON operations plus four
explicit exclusions** are accounted for. H01 server/MCP liveness, H04 no browser
caller, H50 SSE and H55 readiness retain their owners; H24/H54 are accepted.
Runtime parsing, error/current/operation correlation and backend authority remain.

The [initial T38.4a slice](t38-sprint-query.md) gives Query sole ownership of
`planning` and admitted `sprints` cursor pages; create-sprint alone uses Query
mutation execution, with the other nine resources retained by the controller.
Root adopted exact web baseline `2505df034cdb95c090ffcaf7e7a76bed6f7f169a9e3fbe9fd6369aea7e546eed`;
normal 971/198 reproduces all 16 measured reports/status, with infrastructure 20
and bounded artifacts 17 passed. Seven other baselines stay exact. The guide
records both rejected candidates, source-qualified checks/costs and one unexecuted
Query statement/branch. Current-head CI/native review and coordinator acceptance
remain pending; this is not full T38.4a/T38 acceptance. Dated snapshots below
retain their actual source/run identities and do not override this current summary.
Packaging/S01/runtime/provenance and UNVERIFIED Cancel/Leave with possible draft
loss, filters/provider/staging/device/a11y/real-product debts remain explicit.

## Current local transport boundary — T38.3b

Generated declarations now have a types-only public export consumed by six
[contract-derived Sprint request calls](t38-contract-transport.md). Existing guarded
DTO responses and the one-way type limit remain. [PR68 final acceptance](https://github.com/Ljrr3045/rielia/pull/68#issuecomment-7215920026)
governs T38.3a; its original pending/nonconsumed paragraphs below are historical
snapshots. The separate Next16.4.6 patch passes native/resumed standard and
selectedPG; one transport runtime/deployed attempt passes with owned cleanup.
Expanded local review precedes [Draft PR69](https://github.com/Ljrr3045/rielia/pull/69);
final-head CI/native Kilo review/coordinator acceptance remain pending. The
[transport guide](t38-contract-transport.md#draft-publication-and-remaining-gates)
records the initial head/base and publication snapshot.

Published in [Draft PR68](https://github.com/Ljrr3045/rielia/pull/68), targeting
`dev` at initial implementation head `dcf942802a0d545b8372ebd3baa6c1cf254fc50c`,
based on accepted PR67 merge `f4cba904`. Exact numerical adoption and local checks
are complete. Initial CI run 45966884416 was in progress at publication; the
[progress record](progress.md#2026-11-27-t383a-published-in-draft-pr68) preserves
that snapshot. Current-head CI, native review and acceptance remain coordinator
gates. No T38.3 transport or full T38.2/T38 acceptance is implied.

Traceability: additive T38.3 and architecture §§1.4/1.5/4.1; bounded existing
T02/T04/T05–T11/T35 interfaces, P01–P11/P38 and US01–US07/US11–US12/US24–US25.
P33/US08 compatibility is retained. Product and architecture own authorization;
there is no UI, policy, SQL, worker, MCP catalog, landing or deployment scope.
The [maintained inventory](t38-boundary-inventory.md) remains the H/G/X/C ledger.

## Local coordinator C01 correction and adopted numerical state

The coordinator approved only the exact16435byte contracts candidate/SHA256
`8f9617a4613880251ddb23bd4643d9cd6114d14b55a614b64678a579250a2976`,
retaining all four10000 floors and seven byte-exact other baselines. One fresh
normal911/911 passes all four scopes and reproduces all16 frozen reports byte for
byte with count digest
`55fb1d6873f720da326da1f6d3b68ef05f6e5718fb9a975644ebfde2ce064967`.
Unchanged infrastructure20/20 and bounded artifact checks pass. This is local
numerical adoption, not PR/T38 acceptance or a provider/comparator waiver.

Local coordinator finding **C01** (not Kilo) showed that the source helper's global
whitespace removal accepted mismatched string, regexp and template values through
the real `assertSemanticSources` seam. Initial four-case acceptance and corrected
rejection are preserved separately. The helper now compares emitted TypeScript6
syntax trees, retaining literal leaf text, regexp bodies, template parts and
operator tokens while ignoring positions, formatting and comments. Real function
declarations are converted to expressions for this comparison, retaining async/
generator/body details without module-only export modifiers; declaration-only
signatures cannot identify a runtime callback. No runtime contract or binding
allowlist is widened and no parser/dependency is added.

Finished-source tests15/15 cover literal/regexp/template whitespace, operators,
optional access, exported typed functions and a formatting/comment-only positive
case; source census128, byte drift and appTS6 probe pass. Preserve the first lint
fixture failure and the stricter parser's initial exported-declaration failure as
separate correction receipts. All196 unit inputs and285 input/test/config rows,
including the separately reconstructed compiler fixture, remain exact, so no
new measure or unrelated successful PG/runtime/standard rerun is claimed. The
original frozen proposal and its failure/run identities remain unchanged.

The coordinator accepted the disclosed1621219byte four-group packaging cost plus
the separately shipped test for this slice. Distribution cleanup stays explicit
T38.6 debt; no Docker/package-files policy change or zero-startup/bundle claim.

## Scope and owners

The API remains Nest12.3.2 with the official NodeAdapter. Controllers, services,
guards, current authority, transactions and admission/error order remain canonical.
Contracts import neither Nest nor Prisma. There is no Swagger package, Express
wrapper, alternate router, new endpoint or generated fetch caller.

| Inventory | Existing endpoint family | Named shared wire roots |
| --- | --- | --- |
| H01–04/H55–66, G01 | Liveness, identity, execution, readiness, workspaces/members/invitations | healthResponse, readinessResponse, identityConfiguration, identitySession, executionContextResponse, workspaceSummary/Member/Invitation/CreatedInvitation and concrete pages plus seven write roots |
| H05–22, G02 | Project/access/assignee/task reads and commands | project/Page/AccessPage/AccessReview/AssigneePage, task/Page and create/edit/version/move/access/visibility roots |
| H30–35, G03 | Project planning and Sprint lifecycle configuration | projectPlanning, sprint/Page, configure/create/edit Sprint roots |
| H36–48, G04 | Relations, checklist, comments and activity | taskRelations/ParentCandidates/Checklist/Comments/History/CommentReview and seven collaboration write roots |
| H49–50, G05 | Discovery and invalidation stream | taskDiscoveryPage and taskInvalidation |
| H27–29/H51–54, G06 | Participation, scope, start and planning history | taskPlanning, sprintScopePage, planningHistoryPage, sprintTransitionResult and estimate/start/setSprint roots |
| H23–26, G07 | Close preview, closure and outcomes | sprintClosePreview/Closure/ClosingOutcomePage/CloseResult, closeSprintInput and nested closeSprintBinding |

Names in this table omit the `Schema` suffix. The exact maintained mapping is
[operations.ts](../../packages/contracts/src/openapi/operations.ts):66 operations
(34GET/32POST) in10 controllers, including every method/full path/controller and
body/success key. [wire-schemas.ts](../../packages/contracts/src/openapi/wire-schemas.ts)
allowlists67 concrete shared roots, rather than exporting every schema-named
symbol. Generation rejects missing/mismatched/duplicated roots and operations.
The AST [route census](../../scripts/openapi/route-census.mjs) scans all maintained
API TypeScript, discovers new controllers/routes and rejects unsupported dynamic,
namespace, inherited/computed or raw routing. It verifies the single `api/v1`
prefix and only permits the existing raw Better Auth wildcard outside this set.
Changing the routing model requires an explicit census update and review.

The canonical artifact is
[rielia.openapi.json](../../packages/contracts/openapi/rielia.openapi.json),
OpenAPI3.1.2 using the OAS3.1 JSON Schema2020-12 dialect. It has local component
refs, stable code-unit key ordering, no timestamp/environment/absolute path and a
relative API-origin server. GET200/POST201 reflect existing Nest defaults, not
proposed PATCH/404 examples in the immutable architecture handoff.

Explicit route metadata preserves successful no-store headers, project/discovery
request IDs, conditional session cookies, write Origin/optional Fetch-Site/UUIDv4
idempotency headers and existing scalar/query admission differences. Cookie
schemes describe configured HTTPS (`__Secure-better-auth.session_token`) and the
existing opt-in nonproduction HTTP-loopback configuration
(`better-auth.session_token`). They do not grant interchangeable request-selected
modes. H03 permits anonymous/null; H01/H02/H55 are public. Session authentication
never supplies domain membership or human administration authority.

H50 is `text/event-stream`, a string HTTP body with `event:update`, optional opaque
id and separate JSON `taskInvalidationSchema` data references. It is not a JSON
HTTP response or a generated EventSource implementation. Existing denied/reset/
heartbeat/replay/capacity, no-transform, X-Accel-Buffering and abort cleanup remain
runtime-owned. API routes and Next proxy routes are distinct surfaces: X07–13
retain same-origin allowlists, cookies/redirects,15s deadlines, cancellation,
bounded admission and error behavior. No Next route is added or bypassed.

## Export policy and runtime semantics

[The exporter](../../packages/contracts/src/openapi/schema-export.ts) uses exact
Zod4.6.7 conversion hooks and a fresh registry per document. Both request and
response wire views use `io: input`: requests describe values before trim/defaults;
responses describe received JSON before stripping/projection/deduplication.
Strict requests retain `additionalProperties:false`; regular/loose outputs retain
accepted extras. Defaulted create fields stay optional. Dates remain strings;
TypeScript Readonly is not converted into a new wire restriction.

The finite [binding owner](../../packages/contracts/src/openapi/schema-bindings.ts)
records88 concrete custom checks,26 admission views (24custom plus two snapshot
unknown/parent views) and14 normalizers. Each binding includes a reachable schema
path and actual source location. The source census compares normalized callback
ASTs with the bound runtime functions. Preflight and conversion-time checks reject
new nested refinements, unknown/custom structural nodes, arbitrary normalization,
`any`, unsupported types and custom conversion overrides. Unsupported export
fails; it never silently produces an empty schema or an `any` fallback.
Explicit loose catchalls are intentional additional-property compatibility.
Zod metadata navigation is version-bound; upgrading Zod requires a new audit.

Admission views reuse actual pipe/output schema objects for dense arrays,
discovery projections, activity changes, invalidation and snapshots. They do not
copy DTO definitions. Structural relations reuse actual canonical predicates and
field schemas for parent/version presence, participation null pairs, null/backlog/
other close destinations, carried targets, patch presence, state-specific forbidden
fields, provenance and consequence alternatives. Three narrow owner factorizations
share existing activity value domains, closed false capabilities and transition
operation/current shapes between runtime and export. Original public inferred
input/output types and guard stages remain; these helpers are absent from the
production barrel. The registry and relation functions are generation-only owners,
not a general relation language or global runtime registry.

Finite remaining runtime semantics are:

| Group | Retained owner/meaning |
| --- | --- |
| Text and normalization | UTF-16 bounds, trim/control/email distinctions, lowercasing, null fallback and provider deduplication. JSON Schema code-point length would change existing behavior; no misleading maxLength is added. |
| Dates and chronology | Existing Date.parse compatibility, Gregorian/year validity, exact UTC round trips, IANA zone availability, DST midnight uniqueness and interval order. No new RFC3339 restriction. |
| Non-JSON admission | Own/enumerable/inherited/accessor/symbol properties, dense executable traversal, original-object identity and ignored historical slots. JSON/static types cannot model these. |
| Correlations | Creator/author/actor/source/grant, page scope/duplicates/totals/revisions, eligible assignees, snapshot/visit/status/estimate, close/operation/current IDs and versions, hashes and requested filter/principal/entity matching. |
| Protocol and backend | Origin/CSRF/admission order, cookie handling, explicit same-key recovery, deadlines/abort/SSE, current authority, transactions/replay/outbox and private persisted/configuration checks. |

The document embeds concrete semantic IDs/source paths, not a universal claim of
JSON Schema equivalence. Generated static types are not validation. All existing
unknown-response guards and scoped correlations remain active. TypeScript cannot
subtract the literal `backlog` from an arbitrary string: the generated declaration
can admit that string with an incompatible target version, while JSON Schema and
runtime reject it. A later transport gate must retain runtime checks.

## Deliberate exclusions and inventory reconciliation

PR65 accepted three private Sprint receipt owners; PR66 accepted the other five
persisted owners and all six opaque decoders; PR67 accepted the C01–12 assessment.
C01–03/C05/C07–09 use staged private schemas, C04 uses native upstream parsing,
and C06 Prisma/C10–12 build/operator/protected-tooling exclusions retain owners
and checks. These accepted dispositions account for the enumerated families;
historical pending text does not reopen them.

Private receipt/cursor interiors/configuration/diagnostics, raw `/api/auth/*splat`
Better Auth/OAuth internals, framework/Prisma internals, frontend drafts/commands
and the fictional prototype are outside public generation. Public opaque cursor
strings and public success projections remain included. Inline X03–X05 record/
code/error-envelope and some HTTP path/query/header gates remain transport-owned.
Errors are description-only400/401/403/409/503 where source-qualified plus default;
there is no invented shared error schema or body constraint. Generator output may
say `content?: never`; this records absent modeled content, not an empty HTTP
body. Existing current/accessCurrent/closeWarning admission remains canonical.
This finite exclusion was explicitly released; full T38.2 phase closure is open.

## Compiler graph and reproducible commands

Current exact [openapi-typescript7.13.0 metadata](https://registry.npmjs.org/openapi-typescript/7.13.0)
and the official [TS6 support issue](https://github.com/openapi-ts/openapi-typescript/issues/2723)
were read on2026-11-27. Its peer `typescript:^5.x` excludes app TS6.0.3; no supported
same-TS6 release in the selected published family was found. The selected
[standalone graph](../../scripts/openapi/tools/package.json) pins generator7.13.0
and TypeScript5.9.3, with33 exact locked package versions/integrities. No app
compiler downgrade, peer suppression, age exception or lifecycle allowlist change.
The graph uses strict peers, no automatic peers,24h strict age and ignored scripts.
The registry/archive for debug4.4.3 has optional-peer metadata for supports-color
without explicit peerDependencies. Pnpm12.15.0 normalizes that optional edge to
`supports-color:*`, bound to already selected10.2.2; the coordinator approved this
exact lock delta. Discovery's earlier “TS only peer” statement remains a dated
metadata observation, not the final resolved peer claim.

```sh
pnpm --dir scripts/openapi/tools install --frozen-lockfile --ignore-scripts
pnpm openapi:generate
pnpm openapi:check
pnpm test:openapi
```

Use pinned Node24.22.1 and pnpm12.15.0. Root scripts explicitly rebuild contracts;
outputs live outside `src`, avoiding stale dist and generation/build cycles.
The parent uses app TS6 only for source AST/probes. A bounded separate subprocess
imports generator7.13.0 and its own TS5.9.3, with explicit Redocly config/options;
only local JSON enters and declarations leave. External refs fail before generator
resolution; no implicit network/config discovery. A120s process-group deadline,
2MiB declaration bound, bounded diagnostics and owned temporary cleanup apply.
Check mode compares both artifacts byte-for-byte without writing them. Missing,
changed or symlinked outputs fail. No network/server/browser is needed after install.

[openapi.d.ts](../../packages/contracts/generated/openapi.d.ts) is nonconsumed and
outside public package exports. Root `pnpm check` includes focused tests, drift
and a strict application TS6 declaration probe. CI installs/audits the isolated
graph explicitly. Exact generated JSON/declaration/lock exclusions have quality
failure tests; all maintained generator TS remains in contracts numerical source
accounting. Node filesystem/AST/process bridges remain C12-owned tooling with
focused positive/negative witnesses, under the existing source scope policy.
No runtime dependency or application/unit-lock change is intended.

## Validation and release limits

Retained contract tests pass72/72 on preserved baseline source and72/72 on factored
source, including getters, hidden/inherited/sparse values, date/null/correlation
cases. These receipts retain their original source fingerprints. Public runtime
export-name parity retains all204 names, and a one-time strict appTS6 probe proves
bidirectional input/output compatibility for the three factored schemas plus
their three public DTOs (nine assertions). Its first scratch import could not
resolve Zod from the nonpackage evidence folder; the corrected probe explicitly
uses the existing contracts pin, without an install or resolution-policy change. Focused tests
exercise all66 routes/32 bodies/67 roots, finite JSON/runtime partitions, missing/
duplicate/private schemas, unsupported nested export, changed source bindings,
external/dangling refs, AST route additions, drift/symlinks and real generator/
application compiler failures. JSON Schema UTF-16/date subset witnesses explicitly
show why runtime validation is retained. One early census witness found dynamic
empty controllers were not inspected; the census now discovers/validates them.
Failed fixtures and the initial CJS/ESM import mismatch remain separate receipts.

Source-qualified local checks are complete through the numerical proposal:
formatting, quality24, lint, installed backend closure286/no Express, OpenAPI14,
strict appTS6 declaration probes, existing protocol/Sprint logic and web HTTP
integration, all typechecks, builds, MCP20 and API/web HTTP/SSR smoke. This is a
resumed standard sequence, not an uninterrupted `pnpm check` pass. Preserve the
misplaced type-probe directive correction and sandbox loopback EPERM receipts.
The original Next16.4.3 build stopped with native SecurityFatalError; one fresh
coordinator-approved web-only continuation passed while retaining its upgrade
warning. No upgrade, suppression, clock/receipt/configuration manipulation or
future retry permission is implied. Two census hardenings and their real-domain
false-positive correction have fresh affected checks, separate from earlier14.

The first measure stopped because the existing unit mirror flattened nested
contract paths by basename. Its one-line relative-output correction retains
all source/provider/denominator safeguards. Real compilation, imports and map
reconciliation now account for all six nested owners. The next coherent911 run
measured533/534 contract branches; a meaningful missing-properties failure witness
then closes the remaining branch. Final coherent911/911 (API384/web429/contracts79/
prototype19) covers196 maintained inputs. Contracts is709/709 lines,779/779
statements,250/250 functions and534/534 branches. All new counters are covered;
original retained nonzero per-file ratios stay100%; type-only zero units remain N/A. Owner branch denominators39→36,
26→20 and46→41 reflect shared capability/value/transition schemas, with no uncovered
growth. The other three scopes retain exact accepted candidate bytes.

The exact coordinator-approved contracts baseline is16435bytes/SHA256
`8f9617a4613880251ddb23bd4643d9cd6114d14b55a614b64678a579250a2976`;
all four floors stay10000. Combined deterministic count digest is
`55fb1d6873f720da326da1f6d3b68ef05f6e5718fb9a975644ebfde2ce064967`.
Only that approved contracts baseline is adopted; the other seven remain exact.
The normal all-scope gate, exact16-report reproduction, infrastructure20 and
artifact checks pass as recorded above. Measurement remains a separate source-
qualified receipt. No comparator/exclusion/provider weakening or reuse of PR65's
one-time exception. Original failed/partial measures stay separate.

Selected real PostgreSQL18.6/NodeAdapter HTTP suites pass with disposable database
cleanup. Runtime/migration failure/readiness/job recovery and full deployed
API/worker/migration closure pass, with owned containers/networks/volume/image tags
cleaned. Real providers/staging/browser/device/product acceptance are outside this
slice; unchanged authentication/SQL policy is not reaccepted by implication.
High audits pass: app1low/14moderate, unit tools2moderate, generator0 findings;
no high/critical findings at the2026-11-27 snapshot. Next's native recommendation
and prior action warning remain explicit, separate from the advisory snapshot.

Generated JSON is931456bytes and declarations345132bytes. Repeated check-mode
runs generate in owned scratch and match exact maintained bytes without writes;
the final isolated generator takes191.2ms with194544KiB child maxRSS. Contracts
build/test/check/type time is recorded separately, not inferred from that child.
The installed33-package graph measures39356668 package-file bytes, with shipped
notices plus pinned source MIT notices for the two packages lacking root notices.
No install hooks execute; frozen ignored-script reproduction and isolated audit pass.

There is no runtime dependency or active transport addition. Read-only inspection
of each actual API/migration image finds78853bytes source,265778bytes compiled
modules,931456bytes JSON and345132bytes declarations in the contracts package:
these four groups total1621219bytes. This is packaging cost, not a complete image
delta or startup benchmark. Existing packaging also carries the added contract
test. The three owner-local helper schemas instantiate with their existing modules;
no zero memory/startup cost is claimed. Both deployed stores contain no generator,
openapi-fetch or generator TS5.9.3. The separate tooling graph is outside Docker's
input allowlist; runtime consumers do not import the generation owners/artifacts.
A later packaging extraction can reduce unused files without changing this slice's
wire contract; no deployment-policy edit is included here.

Rollback removes the two artifacts, generation/tooling integration and isolated
graph, reverting only the three narrow schema owner factorizations if needed.
There is no storage migration, persisted rewrite, active transport or cache change.
Root owns remote revert/publication. T38.3 transport adoption, Query/forms T38.4,
targeted testing/diagnostics T38.5 and final removal/accounting T38.6 remain gated.
Retain Next16.4.3's security recommendation, dated lower advisories/action warning,
G06 optional historical-slot/dense-helper debt, T04 diagnostic CLI unit gap,
user-omitted UNVERIFIED cross-document Cancel/Leave with possible draft loss,
sprint filters and real provider/staging/native/device/a11y/product acceptance.
