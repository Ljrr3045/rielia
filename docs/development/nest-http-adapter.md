# Nest HTTP adapter migration

Implementation/research: 2026-10-27. This is the authorized T02/T04 technical
follow-up to [the stack decision](stack-validation-decisions.md), based on `dev`
`3efb49fde4f43d9d58964510c3ef61f744bea062`. It preserves P01/US01 identity and
P38/US24–US25 boundaries. No UI, domain feature, schema, workflow, deployment or
full-ticket acceptance is added. The immutable source handoff is unchanged.

## Adapter and package decision

Use the official `@nestjs/platform-node` **12.3.2**, with matching Nest common/core
**12.3.2**. Node remains **24.22.1**, pnpm **12.15.0**, Better Auth **1.7.12**,
Prisma CLI/client/PG adapter **7.10.1**, pg **8.23.1**, pg-boss **12.38.0** and
OpenTelemetry API **1.10.0**. Existing declaration-only patches and strict types
remain. No application dependency upgrade beyond the coherent Nest minor is needed.

[Nest's official guide](https://docs.nestjs.com/http/performance) recommends
NodeAdapter from 12.3; it is explicitly selected in `NestFactory.create`, keeping
controllers/modules/providers and supported Nest routing/parsers. Fastify is an
official alternative, but adds a framework/plugin integration surface for this
small Node-handler-based fixture. The Node adapter needs fewer application changes
and no custom compatibility layer. This is a maintenance/compatibility judgment,
not a measured performance claim.

Verified actual [registry metadata](https://registry.npmjs.org/@nestjs/platform-node/12.3.2)
and the published tarball, not only the documentation. Its `NodeRouter` has an
ordered middleware/route stack; route groups are separated by parser middleware.
Its request class derives IP using `@fastify/proxy-addr` and the constructor's
`trustProxy`. Its public application interface accepts parser/options and Nest
core inserts the raw-body flag. Multer is already **2.5.0**, so the old
platform-express-scoped override is removed without downgrading the fix.
Shared helpers such as Multer, qs, send and serve-static remain legitimate
dependencies; their API styles do not imply the Express framework is installed.

Advisory review found its exact qs **6.16.0** pin affected by
[GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw).
A narrow `@nestjs/platform-node>qs: 6.16.1` override retains the prior backend's
patched floor. The fix was published 2026-10-14 and needs no age exception.
The fixture uses parsing, not the advisory's comma-stringification sink, but
shipping the known affected dependency is unnecessary. Remove the override when
the supported adapter pins a patched release and revalidate parsing/audit.

The adapter is new: registry publication times are **2026-10-27T09:03:09.669Z**
(12.3.0), **09:59:57.450Z** (12.3.1), and **12:03:34.617Z** (12.3.2).
There is no older NodeAdapter release outside the default pnpm waiting period.
pnpm automatically added three exact-version `minimumReleaseAgeExclude` entries;
the coordinator explicitly accepted retaining them after source/parity review.
No blanket age-policy disablement, package metadata stripping or peer suppression
is used. New-adapter maturity remains a risk, bounded by pinned source/integrity,
security regressions and local/CI checks. The platform-node tarball integrity is
`sha512-woyG5CMX5E0PXiXk5RvObQ8GddG2WXVA9kjgf10c2lmEnSv16D8QarMmf8mKOOa460JPAWoC3Ycmd12zOFWJPg==`.

## Identity and HTTP behavior

Production bootstrap and integration tests share `createHttpAdapter()`. Proxy
trust defaults to false and accepts only the existing validated explicit IP/CIDR
list. Before Better Auth, the adapter derives the nearest untrusted IP, then the
boundary removes all `X-Forwarded-*`, `Forwarded`, `X-Real-IP` and incoming
`X-Rielia-Client-IP`, supplying only the derived address. Canonical origin,
callback URLs and cookie security never depend on spoofed host/protocol headers.

The existing documented [Better Auth Node handler](https://github.com/better-auth/better-auth/blob/v1.7.12/packages/better-auth/src/integrations/node.ts)
uses Node request/response directly. Nest adapter `all('/api/auth/*splat')` is
registered before explicit JSON/nested-form parsers, preserving the raw stream
required by [Better Auth integration guidance](https://better-auth.com/docs/integrations/express).
The documentation illustrates Express, but the exported Node handler itself has
no Express dependency. No community Nest wrapper or replacement OAuth engine is added.

Exact WHATWG-normalized Google/GitHub callback paths retain state/PKCE validation;
all other mutations require the configured exact Origin. Malformed percent
encoding fails closed. Auth/session/config responses retain no-store, sanitized
failure handling, renewal/clearing cookies and existing web protocol semantics.
Identity remains opt-in; the default production-mode HTTP containers keep it off.
Liveness, readiness and Nest shutdown hooks remain intact.

Documented adapter differences: routes are case-sensitive and matched by
specificity, `req.path` is router-decoded, parameter length defaults to 100, and
parsers reject prototype keys. Callback exemptions use `originalUrl`, not decoded
router paths. New regressions cover encoded mutation paths, callback lookalikes,
invalid UTF-8, untrusted socket/proxy spoofing, malformed/oversized JSON and JSON/
form prototype pollution. Valid nested forms and real raw auth JSON still pass.
Rejecting dangerous form keys with 400 is a deliberate stricter parser behavior.

## Dependency and deployed closure

The first ordinary install retained an old optional platform-express peer binding
from the previous lock. A fresh manifest-only resolution (without an old lock or
node_modules) removed it. Frozen install then passed. Direct Express, adapter and
type dependencies are gone. Nest core still declares a legitimate optional
platform-express peer; it is unresolved. `autoInstallPeers: false` and
`strictPeerDependencies: true` remain unchanged.

`pnpm check:backend-closure` traverses actual installed Node dependency/optional-peer
resolution from the API. It rejects Express/platform-express and their Express
request types anywhere in that graph. `pnpm test:runtime` repeats the traversal
inside the frozen API/worker and migration targets and scans their entire deployed
stores for orphan Express packages. API and worker use the same image. No deployed
package's metadata or source is pruned to create an absence result.
The fresh lock has no Express package resolution; historical documentation,
optional-peer declarations and dependency compatibility text may still name it.
The claim is backend runtime/deployment closure, not that the word is absent from
every repository/tooling source.

## Validation and remaining work

Run frozen install, `pnpm check`, `pnpm test:identity`, `pnpm test:runtime`,
`pnpm audit --audit-level=high`, the handoff/link verifier and whitespace checks.
The identity suite uses real Better Auth/Nest/Prisma/PostgreSQL with simulated
Google/GitHub HTTP/JWKS only; the Docker suite covers migration gating/slow DDL,
readiness/DB recovery, persistent diagnostic consumption, signal cleanup and
nonroot package/image closure. Actual results and PR evidence belong in
[progress](progress.md). Every changed ready head requires CI and a fresh
coordinator-triggered Kody review across all three surfaces.

Corrected-lock local results: frozen install, full `pnpm check`, all 23 identity
tests, complete Docker smoke, audit (no known vulnerabilities), handoff/link and
whitespace checks pass. ARM64 images measured 1,265,513,560 bytes API/worker,
1,294,915,499 migration and 421,924,768 web, uncompressed. Installed/deployed-store
Express absence passed in both backend targets; owned containers, networks,
volume and image tags were cleaned. Nested Prisma tooling remains, so this is
no general image-footprint reduction claim.

Real Google/GitHub, HTTPS/Traefik/staging, staging-dependent remote discovery and
real-project/user acceptance stay OPEN/DEFERRED. Do not request credentials or
provision staging for this migration. No full T02/T03/T04 or launch acceptance is
closed. Under the user's local sequencing override, **T35 principal/authorship
foundations follows this migration**, after preparatory T04 and before T05/T06/T12.
The later [T35.0 slice](principal-foundations.md) adds bounded storage/policy/context;
this adapter migration itself added none of that domain implementation. Full T35
authorship, credential and domain integration remains incomplete.
