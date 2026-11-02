# Stack approval and validation sequencing

Decision date: **2026-10-27**. Authority: the user's explicit stack and testing
direction, recorded separately from the unchanged handoff. This supersedes active
claims that the current stack awaits user confirmation; it does not rewrite past
experimental authorizations or turn missing acceptance evidence into a pass.

Scope: T01–T04 sequencing and architecture §1.3/§7.2–7.3; P01/US01 identity,
P34 self-hosting, and P38/US24–US25 identity/permission boundaries remain intact.
PR #10 recorded this decision without runtime changes. The subsequently authorized
[NodeAdapter migration](nest-http-adapter.md) implements its technical follow-up;
no product behavior, staging environment or full-ticket acceptance is added.

## Original 2026-10-27 decision and migration acceptance

The user approves the current stack: Next.js/React, NestJS, PostgreSQL/Prisma,
Better Auth, and current tooling, **except Express**. The backend must use NestJS
without Express at all. Business logic, controllers, providers, and guards stay
in Nest; no separate Express routing layer is authorized. Stack approval does
not pre-approve every future dependency, proposed ADR, or unimplemented feature.

**Original requirement: remove Express before new backend/domain expansion.**
PR #10 did not implement it. Historical inventory on base `7477994` (superseded
by the current migration below):

| Surface | Current coupling to address in the migration |
| --- | --- |
| `apps/api/package.json` | Nest `12.2.0`, `@nestjs/platform-express` `12.2.0`, `express` `5.3.0`, and `@types/express` `5.0.6` |
| `apps/api/src/main.ts` | `NestExpressApplication` and implicit default adapter in `NestFactory.create` |
| `apps/api/src/application.ts` | Express request/response types, adapter instance/settings, proxy trust, auth wildcard route, callback path/origin checks, raw Better Auth handler and parser ordering |
| `apps/api/src/identity/identity.controller.ts` | Express request/response types used by identity session responses |
| `apps/api/test/identity.test.mjs` | Shared application setup and adapter-dependent identity/security regressions |
| `pnpm-workspace.yaml`, `pnpm-lock.yaml`, backend images | Adapter-scoped Multer override and resolved/deployed dependency closure; audit again after migration rather than dropping safeguards speculatively |

The user had **not selected a replacement HTTP adapter in PR #10**. The
[official Nest HTTP-adapter guide](https://docs.nestjs.com/http/performance),
checked 2026-10-27, describes Fastify and the native NodeAdapter available from
Nest `12.3`. At that decision the repository pinned Nest `12.2.0`; the document
selected neither Fastify nor NodeAdapter. The authorized implementation selects
the official NodeAdapter as recorded below, without changing this dated history.

Migration acceptance must include:

- Explicit non-Express Nest bootstrap and removal of Express-specific imports,
  APIs, routing and direct dependencies. Verify the actual running backend and
  its complete transitive production dependency closure, including deployed
  API/worker/migration targets; manifest edits alone cannot prove removal.
- Identity/security parity: raw auth-handler/body-parser order, JSON and nested
  form parsing, normalized callback paths and malformed-path rejection, exact
  origin/CSRF checks, trusted-proxy/client-IP handling and spoofed-header removal,
  no-store/error responses, secure cookie/redirect forwarding, sessions, logout,
  expiry/revocation, account-linking protections, and disabled-identity behavior.
  Preserve web protocol contracts, liveness/readiness and graceful shutdown.
- Passing applicable unit, integration, security, real-library/database and local
  Docker regressions, advisory review, CI, and current-head coordinator-triggered
  Kody review. Local simulated-provider checks remain required; deferred live
  provider/staging parity stays explicitly open for the later acceptance round.

## Current technical follow-up: NodeAdapter

The backend now explicitly selects official Nest NodeAdapter **12.3.2**, with
matching common/core pins. Express adapter/framework/types and their retained
optional-peer bindings are removed. The old scoped Multer override is unnecessary:
the Node adapter already pins patched Multer **2.5.0**. Strict peers and disabled
automatic peer installation remain. Supported Nest controllers/modules/providers,
Better Auth raw Node integration and the public web protocol are preserved.

[Implementation rationale, actual package-source/integrity research, new-adapter
maturity and narrow release-age exceptions](nest-http-adapter.md) explain the
choice over Fastify. Installed resolution and complete API/worker/migration
deployed-store checks guard Express absence. Current check/PR/review evidence is
in [progress](progress.md); full provider/staging acceptance remains deferred.

T35 follows that adapter migration under the user's sequencing override, before
T05/T06/T12. The later [T35.0 foundations](principal-foundations.md) now implement
bounded storage/policy/context; full T35 and those dependent workflows remain open.

## Deferred validation backlog

The user postpones real testing/staging until an advanced end-to-end product
slice exists and the user schedules it. The following remain **OPEN / DEFERRED**:

| Backlog | Required later evidence |
| --- | --- |
| Staging provisioning and HTTPS/proxy validation | Scheduled environment, trusted proxy/canonical origin, HTTPS cookies and callback behavior |
| Real Google/GitHub identity | Consent, GitHub private email, real web/API sessions, logout, expiry and access removal |
| Staging-dependent remote OAuth discovery | Real discovery/provider/client evidence for the applicable T02/T03/T20 remote profile |
| T01 and real-project/user acceptance | Representative project/backlog, mobile/desktop journeys and recorded user friction; later product acceptance remains required |

These items are not immediate blockers to authorized local implementation under
the user's sequencing override. Retain the original dependency ledger and
history: T02/T03 → T04 → T35 → T05/T06/T12 still describes the source plan, and
the override defers the listed environment/user evidence without claiming any
dependency or ticket complete. Local contract, isolation, authorization,
security, persistence and recovery prerequisites still apply to each slice.
No full T01/B0, T02, T03 or T04 acceptance is granted. Automated unit/integration/
security/local Docker checks, existing CI, and
[current automated review](opencode-review.md) remain required for relevant
implementation. PR #10 required documentation checks only; the adapter migration
requires the full applicable checks. Existing CI is unchanged.

Do not request credentials or provision staging now. No test date, launch date,
or invented result is recorded. Resume the deferred backlog when the advanced
slice and user scheduling are available. The single public launch and its T24/
applicable T34 acceptance gates remain unchanged.

License and final name/logo/brand remain undecided. The separate
[2026-10-29 private-project decision](project-access.md) ratifies automatic content
access for active human workspace owners/admins; stack approval itself did not
resolve that policy or supply OAuth credentials. Historical pins, adapter rationale and test results in the guides
describe delivered code until the separately reviewed migration replaces it.
