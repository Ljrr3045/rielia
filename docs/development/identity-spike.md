# T02 identity and proxy spike

Research and implementation: 2026-10-25 UTC. The coordinator authorized T02.1 as a
bounded, reversible experiment before user stack approval. The
[2026-10-27 decision](stack-validation-decisions.md) now approves the current
stack except Express; its removal is the first technical follow-up before new
backend/domain expansion, with no replacement adapter selected. The Express
integration below records current code and historical evidence, not the approved
target. Real provider/HTTPS/staging acceptance is OPEN/DEFERRED until an advanced
product slice and user scheduling; local security/integration checks remain
required. License selection remains open. This document supplements the unchanged
[architecture identity proposal](../handoff/02-architecture-technical-plan.en.md#2-identity-permissions-and-isolation).

## Scope and acceptance

Internal B0 scope: a reproducible identity-only portion of T02, tracing
[P01 and US01](../handoff/01-product.en.md), architecture §2.2–2.4, and T02.
Preserve the existing fixture's general API parsing and liveness. T02.1 includes
web protocol/state logic, with a typed hook for separately owned T02.2 UI work.
The latter follows the [UI guide](../handoff/04-ui-ux-development-guide.en.md),
particularly UX07/UX09. No new page, component layout, or CSS ships in T02.1.

The implementation mounts Better Auth in Nest's Express adapter at
`/api/auth/*`, resolves database sessions through supported library APIs, and
provides a same-origin Next client route. Persistence contains only the identity
models required by the selected library. Google/GitHub are configured separately
for each installation. No credentials belong in source, logs, screenshots, or PRs.

Excluded: domain principals/memberships/roles, workspaces, tasks, authorization
grants, MCP catalog, worker/queue, full T04 migrations/tooling, landing, license
adoption, deployment, and full stack ratification beyond the recorded decision.
Social login does not grant domain access or implement T35/T05.

Full T02 additionally requires real Google/GitHub login (including GitHub private
email), staging HTTPS callbacks, sessions, logout, expiry, and access removal.
Simulated provider fixtures can establish bounded integration behavior; they
cannot satisfy real provider or deployed Traefik acceptance.

## Current primary research

Exact registry metadata was checked before implementation; these versions are
pinned in the lockfile and exercised together:

| Package or service | Pin | Evidence and constraint |
| --- | --- | --- |
| Better Auth | `1.7.12` | [Official docs](https://better-auth.com/docs/integrations/express) and [registry metadata](https://registry.npmjs.org/better-auth/1.7.12); declared peers support Next 16, React 19, and Prisma 7 |
| Prisma CLI/client/PG adapter | `7.10.1` | [CLI registry](https://registry.npmjs.org/prisma/7.10.1), [client](https://registry.npmjs.org/@prisma/client/7.10.1), [adapter](https://registry.npmjs.org/@prisma/adapter-pg/7.10.1); use matching versions |
| PostgreSQL | `18.6` | [Official supported-version table](https://www.postgresql.org/support/versioning/); coordinator authorized disposable test infrastructure |
| `pg` | `8.23.1` | [Registry](https://registry.npmjs.org/pg/8.23.1); compatible with the adapter's `^8.16.3` range |
| `@types/pg` | `8.23.1` | [Registry](https://registry.npmjs.org/@types/pg/8.23.1) |
| `@types/express` | `5.0.6` | [Registry](https://registry.npmjs.org/@types/express/5.0.6); existing Nest adapter uses Express `5.3.0` |

The registry's `prisma@latest` is `8.0.0-rc.27`; it is not a suitable unexamined
replacement for the supported Prisma 7 peer range. [Prisma's current quickstart](https://www.prisma.io/docs/prisma-orm/quickstart/postgresql)
labels version 8 a release candidate and points version 7 users to its maintained
documentation. The [v7 PostgreSQL guide](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql)
requires an explicit datasource URL in CLI configuration and a PostgreSQL driver
adapter for the generated ESM client. Never let a missing URL fall back to the
driver's default connection settings.

The [Better Auth Prisma guide](https://better-auth.com/docs/adapters/prisma)
documents schema generation separately from applying Prisma migrations. Keep
generated identity models and a reviewable migration together; do not copy the
proposed product schema into this spike. Reuse one runtime Prisma client and close
it with the API lifecycle.

The exact Docker image is
`postgres:18.6@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6`.
Prisma's exactly pinned engine downloader and CLI compatibility script are the
only allowed dependency lifecycle scripts. `bun-types@1.4.4` supplies only the
`bun-types/sqlite` declaration referenced by Better Auth's public types; there is
no Bun runtime, no global Bun override, and `skipLibCheck` remains `false`.

## Integration decisions

- Use documented `toNodeHandler` from `better-auth/node`. [Express integration](https://better-auth.com/docs/integrations/express)
  requires mounting before body parsers and uses a named wildcard for Express 5.
  JSON/urlencoded parsing follows it for other Nest routes. A test-only module
  verifies both parsers without adding a public echo route.
- The [Nest-specific integration](https://better-auth.com/docs/integrations/nestjs)
  is community maintained. Direct documented Express mounting avoids adding a
  wrapper before its value and compatibility are established. Verify this with
  the fixture's exact Nest 12.2.0/Express 5.3.0 versions.
- Use `auth.api.getSession` and `fromNodeHeaders`, with a required configured
  database. [Session documentation](https://better-auth.com/docs/concepts/session-management)
  explains that omitting the database enables stateless behavior and that cookie
  caching can delay revocation. Disable that cache and test the next request
  after revocation, logout, expiry, and API restart against real PostgreSQL.
- Fix the canonical public origin and auth base path; do not infer callback URLs
  or secure-cookie policy from arbitrary incoming host/forwarded headers. The
  [options reference](https://better-auth.com/docs/reference/options) documents
  `baseURL`, exact trusted origins, and forwarded-header controls. Retain origin
  and CSRF checks, host-only HttpOnly cookies, and secure cookies for HTTPS.
- Keep Express proxy trust off by default. If forwarding is needed, require known
  proxy addresses and document header replacement and private backend reachability
  according to [Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/).
  Broad trust of all proxies is outside the proposed setup.
- Explicitly disable implicit account linking. [Account documentation](https://better-auth.com/docs/concepts/users-accounts)
  states that trusted providers can otherwise link matching unverified emails.
  Test matching email across different provider subjects with no silent linkage.
  A future explicit linking/recovery UX needs separate verification.
- Use the [official web client](https://better-auth.com/docs/integrations/next)
  with browser-relative auth requests; keep backend/database imports out of web.
  Test proxy route priority, callback redirects, cookie forwarding, and no caching
  of identity responses.

`IdentityService` forwards the library's renewal/clearing `Set-Cookie` headers as
well as returning a minimal session DTO. All identity routes use `no-store`.
Non-GET/HEAD auth requests outside provider callbacks require the exact configured
`Origin`, including the first social sign-in. Both library origin/CSRF checks are
explicitly enabled; the suite uses production mode because Better Auth's test mode
otherwise skips origin validation by default.

At the Node boundary, Express computes `req.ip` from the socket peer and the
explicit proxy list. Raw `Forwarded`, `X-Forwarded-*`, `X-Real-IP`, and incoming
`X-Rielia-Client-IP` are removed before the library sees them. Only the derived IP
is supplied through the library's configured IP header. See its
[IP/proxy controls](https://better-auth.com/docs/reference/security).

### Google token verification and strict declaration compatibility

A signed simulated Google token with a wrong audience initially created a
session through the redirect callback. The pinned
[Google provider source](https://github.com/better-auth/better-auth/blob/v1.7.12/packages/core/src/social-providers/google.ts)
decodes callback profile claims; its direct ID-token sign-in path has a separate
verifier. The supported `getUserInfo` extension now invokes exported
`verifyGoogleIdToken` before delegating to the built-in mapper. It checks issuer,
audience, signature, expiry and token age using library code. Positive and four
negative fixtures pass; no custom production crypto or OAuth engine was added.
Actual authorization-code exchange uses authenticated HTTPS to Google. The
simulated response failure is **not evidence of an external account takeover**.
[Google's token requirements](https://developers.google.com/identity/sign-in/web/backend-auth#verify-the-integrity-of-the-id-token)
provide the validation criteria. Library state/PKCE behavior is retained; no
unsupported nonce guarantee is claimed for its redirect flow.

With strict `exactOptionalPropertyTypes` and `skipLibCheck: false`, the published
client `config.d.mts` produces TS2344: emitted `mode?: RequestMode | undefined`
does not satisfy the fetch option constraint. Published Better Fetch `1.3.3`
declarations were inspected and are identical to pinned `1.3.2`; changing to that
stable artifact does not resolve this. Related upstream history:
[issue #86](https://github.com/better-auth/better-fetch/issues/86) and
[PR #133](https://github.com/better-auth/better-fetch/pull/133).

The reproducible [Better Auth 1.7.12 patch](../../patches/better-auth@1.7.12.patch)
changes one declaration line: intersect the emitted options with their existing
`CreateFetchOption` bound, omitting `schema` so the original schema inference is
preserved. It changes no JavaScript, endpoint, credential, or security behavior
and introduces no `any`, ignore directive, or relaxed compiler setting. Frozen
installs apply the exact hashed patch. Remove it when a supported stable artifact
passes the unchanged strict web/API checks without it. These compatibility costs
remain spike evidence rather than full stack ratification.

### PR #3 findings and dispositions

Kody's [origin exemption finding](https://github.com/Ljrr3045/rielia/pull/3#discussion_r4369344549)
was accepted. A Node raw HTTP target retaining
`/api/auth/callback/../sign-in/social` bypassed the raw-prefix exemption and returned
200 with no Origin, while Better Auth normalized it to a mutation. The boundary
now compares a WHATWG-normalized pathname against the two exact callback paths;
malformed percent encoding returns 400 before library dispatch. Missing/hostile
Origin requests using plain/encoded dot segments or backslash paths return 403
without creating OAuth state. A real callback POST without cookies still redirects
to a GET that must pass the library's state-cookie validation. The regression failed
before the fix and passes after it; browser/fetch normalization alone was insufficient.

The [parser-argument finding](https://github.com/Ljrr3045/rielia/pull/3#discussion_r4369344677)
was not applied. Pinned Nest 12.2.0's
[public application interface](https://github.com/nestjs/nest/blob/v12.2.0/packages/platform-express/interfaces/nest-express-application.interface.ts)
takes parser and options; its
[core delegation](https://github.com/nestjs/nest/blob/v12.2.0/packages/core/nest-application.ts)
inserts the raw-body flag before invoking the adapter's internal three-argument
method. The existing call is correct. The integration test now verifies nested
URL-encoded fields as well as JSON, retaining full strict typechecking. Each
changed head still requires fresh coordinator-requested Kody review; an earlier
approval does not approve the origin fix.

## Operator configuration prerequisites

Operators create their own applications and supply client IDs/secrets through
private runtime configuration. [Google's provider guide](https://better-auth.com/docs/authentication/google)
requires a Web application OAuth client with the exact redirect URI
`https://app.example.com/api/auth/callback/google`; local development must register
its actual loopback origin separately. The configured canonical origin must match.

[GitHub's provider guide](https://better-auth.com/docs/authentication/github)
uses `https://app.example.com/api/auth/callback/github`. An OAuth App needs email
scope; a GitHub App additionally needs Email addresses read permission. A private
primary email can make the profile endpoint return no email; test the real
provider's email response and permissions rather than inventing a verified email.
Provider credentials authorize social login only, not agent OAuth/integrations.

### Configure, migrate, and start

The default fixture keeps identity disabled and needs no secrets or database.
For an explicitly configured experiment, supply a dedicated PostgreSQL database
and copy the [API template](../../apps/api/.env.example) to `apps/api/.env`.
Do not reuse production data for this spike. The API loads that ignored file;
Prisma generation needs no live database, while migrations require its URL.

```sh
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
chmod 600 apps/api/.env
```

Generate a secret directly into the private file, without printing it:

```sh
node --input-type=module -e 'import {randomBytes} from "node:crypto"; import {readFileSync,writeFileSync} from "node:fs"; const p="apps/api/.env"; writeFileSync(p,readFileSync(p,"utf8").replace(/^BETTER_AUTH_SECRET=.*$/m,()=>"BETTER_AUTH_SECRET="+randomBytes(48).toString("base64")),{mode:0o600});'
```

Edit the private file using an editor that does not record its contents to shared
logs. Required when enabled:

| Variable | Meaning |
| --- | --- |
| `IDENTITY_ENABLED=true` | Explicit opt-in; missing/false exposes no auth handler |
| `DATABASE_URL` | PostgreSQL URL for this identity database; no driver-default fallback |
| `BETTER_AUTH_SECRET` | Stable random secret of at least 32 characters; keep private and preserve across restarts |
| `BETTER_AUTH_URL` | Exact canonical origin such as `https://app.example.com`, without path/query/userinfo |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Both present to enable Google, both empty to omit it |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Both present to enable GitHub, both empty to omit it |
| `IDENTITY_TRUSTED_PROXIES` | Empty by default; otherwise only actual proxy IPs/CIDRs, separated by commas |
| `IDENTITY_ALLOW_HTTP_LOOPBACK` | Explicit development-only exception; rejected with HTTP in production |

Both providers may be absent for infrastructure inspection; this enables no
login method. Partial provider credentials fail startup. Never set auth secrets
as `NEXT_PUBLIC_*` values or include them in shell arguments/chat/PRs.

```sh
pnpm --filter @rielia/api db:migrate
pnpm dev:api
```

Migration deploy is repeatable and generates no domain tables. API development
builds once; restart after source/config changes. For a production-mode local
process, build first and set `NODE_ENV=production` in the process environment;
HTTPS origin is mandatory. This guide does not deploy anything.

Local HTTP requires `NODE_ENV` other than production,
`IDENTITY_ALLOW_HTTP_LOOPBACK=true`, and a canonical `http://localhost:<port>`,
`http://127.0.0.1:<port>` or `http://[::1]:<port>` origin. Register that exact origin's
callbacks separately with providers. Use the public web origin when the web owns
the same-origin entry point; never register the private backend port by accident.

### HTTPS and route ordering

One public HTTPS origin owns both services. At the existing proxy, give
`/api/auth/*` and `/api/v1/*` priority to Nest; pages/assets go to Next. Preserve
paths, query strings, `Origin`, cookies and each `Set-Cookie`; do not cache identity
responses. TLS termination and private backend connectivity are operator duties.
Do not expose the backend publicly while trusting proxy addresses.

The last trusted proxy must replace client-supplied forwarding headers. Configure
only its actual addresses and verify the full chain; avoid `true`, hop counts or
broad networks containing clients. Canonical callback origin and cookie security
do not depend on forwarded host/protocol. Behind HTTPS, cookies are `Secure`,
`HttpOnly`, host-only and `SameSite=Lax`; cross-subdomain cookies are disabled.

Next also contains a bounded same-origin protocol proxy using server-only
`API_BASE_URL` (default `http://127.0.0.1:3001`). It streams auth requests, preserves
separate cookies/redirects and returns 503 when Nest is unavailable. It intentionally
forwards no client IP header: when traffic traverses Next, Nest sees the Next peer,
so rate limiting is conservative/shared. Production edge-to-Nest routing is needed
for individually attributable proxy IPs; that deployed topology remains unverified.

### Client contract and failure recovery

`useIdentity` in `apps/web/src/lib/use-identity.ts` supplies state and actions to
T02.2 presentation. Status is `loading`, `disabled`, `signed-out`, `signed-in`, or
`unavailable`; pending is `sign-in`, `sign-out`, or null. Providers are Google/GitHub
only. Messages are typed codes for incomplete sign-in, sign-in failure, or sign-out
failure. `refresh`, `signIn`, `signOut`, and `dismissMessage` own requests/transitions.
UI owns localized labels/layout, with no duplicate auth/session logic.

The session endpoint returns JSON null or minimal user/session metadata, forwarding
renewal/clear cookies without exposing a raw session token in this DTO. Disabled
identity and failed lookup return 503. Failed reads never become a false signed-out
state, duplicate mutations are blocked, and stale responses cannot overwrite newer
state. Reads and SDK mutations have 15-second deadlines; mutations use `retry: 0`
so retry is explicit. The SDK initializes only on a browser action using its actual
origin. Success/error callback targets are `/identity` and `/identity?auth=error`;
the presentation route is separate work and is **not shipped in T02.1**.

For diagnosis, inspect status codes/configuration names privately rather than
printing values. Disabled config: enable explicitly after setup. Startup failure:
check complete provider pairs, URL form and secret length. 503 session: check DB
connectivity/migration. Provider `redirect_uri_mismatch`: compare exact canonical
origin/path with registration. Missing GitHub email: check email permission/scope;
no fictional email is substituted. Sign-out failure means revocation was not
confirmed; retain uncertainty and retry. Server error logs omit raw library/DB
causes, trading detailed diagnostics for avoiding credential leakage in this spike.

## Preflight and validation evidence

Read-only preflight found no DB/OAuth variable names or local environment files,
no local PostgreSQL tools, and no loopback listener on port 5432. Docker engine
`29.9.2` was available with no running containers at preflight.
The existing fixture pins Node `24.22.1`/pnpm `12.15.0`; the ambient shell Node is
`26.12.1`, so commands must use the fixture's managed runtime.

After coordinator authorization, tests used a dedicated disposable PostgreSQL
instance with a random loopback port, an in-memory filesystem, unique ownership
label/name, and private generated values. Each run verified ownership and removed
only its own container and temporary file. No system service, production data,
shared database, or unrelated Docker resource was changed.

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:identity
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

`pnpm test:identity` passed 20 tests/subtests with the real pinned library, Nest,
Prisma and PostgreSQL. It applies migrations twice, tests parsing/health, disabled
identity, origin/return URL/state/rate-limit rejection, Google PKCE and token
validation, GitHub private/missing email, same/cross-provider no-linking, encrypted
provider token storage, signed-cookie/session lookup, restart, renewal-cookie
forwarding, tampering, expiry, logout, revocation, derived proxy IP, failed DB
lookup, and web proxy session/logout. Provider HTTP/JWKS are simulated only in the
test process. No production mock route or test login bypass exists. Date is advanced
between simulated login attempts to isolate process-wide limiter windows; the
separate repeated-request test verifies real 429 behavior in one window.

Seven browser state/proxy/SDK tests cover malformed responses, unavailability, cancellation
message, permitted providers, duplicate actions, stale responses, real HTTP timeout,
explicit retry, cookie/redirect forwarding and server-render initialization.
`pnpm check` also builds both apps and runs actual Next routing/disabled/API-down
HTTP smoke. A fresh temporary copy without dependencies/build/generated files
passed frozen installation (including the hashed declaration patch) and complete
`pnpm check`. The high-level audit reported no known vulnerabilities. Handoff
verification passed 47 unchanged imported files, 30 matching assets and 292 local
file links at the clean-install checkpoint; the review disposition adds one link
(293 in the final verifier run). Whitespace passed. Final PR/CI/Kody evidence is recorded in
[progress](progress.md) and the delivery PR.

Still required for full T02: real Google and GitHub consent/cancellation/retry,
private-email accounts, browser cookie persistence/renewal/expiry/logout/revocation,
operator callback registration, and deployed HTTPS/Traefik routes/header trust.
Record environment/version/time and redacted results, never values. No real provider
or browser/staging acceptance is claimed here. T02.2 must verify the presentation
at required widths, keyboard/touch, accessible status/focus, and failure recovery;
T02.1 has no new visual interface to validate. Full T02/T03/T04 remain partial/open.
