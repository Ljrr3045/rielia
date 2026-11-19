# T11.1 persistent sprint planning

Status: implemented and locally verified in
[Draft PR50](https://github.com/Ljrr3045/rielia/pull/50); current-head CI/native
review and coordinator acceptance remain pending. This bounded API/proxy slice
starts from accepted T37 [PR49](https://github.com/Ljrr3045/rielia/pull/49#issuecomment-6819605884),
reviewed `5d3637b`, merged `20a257c`, under the user's 2026-11-19 authorization.
It addresses T11/B1c, P09/US06 and affected P05/P08/P10. UXR01 and
UX04/UX01/UX03/UX07 govern later presentation; this batch adds no sprint UI.
Full T11 remains IN PROGRESS. The immutable product/architecture/UI handoff is
unchanged; T12/T13 credentials/MCP, T22 charts/reports, estimates, membership,
start/close, bulk, landing, deployment and real-user/provider/staging validation
are excluded here.

## API and stored rules

Paths below are relative to `/api/v1/workspaces/:workspaceId/projects/:projectId`.
The existing NodeAdapter, verified execution/current grants, same-origin
JSON/Origin/Fetch-Site boundary, no-store/request IDs and UUID-v4 idempotency keys
remain. New public validators/types live in `packages/contracts/src/sprints.ts`;
the new web transport and existing proxy validate paths and scoped responses.
No presentation, alternative task store or credential verifier is introduced.

| Route | Contract |
| --- | --- |
| `GET /planning` | Mode, project IANA zone, point scale, Project version, sprint revision and implemented capabilities |
| `POST /planning` | Complete `{expectedVersion,mode,timeZone,pointScale}`; returns current planning settings |
| `GET /sprints` | Planned sprints only, at most 100 rows, canonical total, revision/version-bound opaque cursor; only scalar `cursor` allowed |
| `POST /sprints` | `{expectedProjectVersion,name,goal,startDate,endDateExclusive}`; creates a planned sprint in the current project zone |
| `GET /sprints/:sprintId` | Current authorized planned sprint and its immutable creator/provenance |
| `POST /sprints/:sprintId` | `{expectedVersion,name,goal,startDate,endDateExclusive}`; retains the sprint's captured zone |

Mode is Kanban by default; this is independent of the existing list/board layout.
Scrum enables creation. Returning to Kanban retains and permits editing existing
planned sprints. Existing records default to UTC and scale `[0,1,2,3,5,8,13,21]`;
these settings are public and editable through the API, with UI controls deferred.
Scale has 1–32 strictly increasing integer values from 0 through 1000. There are
no estimates yet. Name is trimmed nonblank single-line text up to 200 UTF-16
units; goal is trimmed nonblank text up to 2000; IANA identifiers are bounded to 100.

Dates are strict Gregorian `YYYY-MM-DD`, local and UTC years 0001–9999, with an exclusive end
after start. An offset that converts a boundary outside the supported UTC range
is a validation error before any write. Local midnight must round-trip to exactly one instant in the chosen
zone; nonexistent/skipped/ambiguous midnight is rejected. Local dates use SQL
`date`; instants use `timestamptz(3)` and UTC wire strings. New York
`[2026-03-08,2026-03-09)` is 23 hours and `[2026-11-01,2026-11-02)` is 25 hours.
Project-zone changes never shift an existing sprint. No automatic scheduling,
start/close transition or future lifecycle capability is exposed.

## Owners, migration and recovery

`SprintService` composes focused input/policy/read/mutation owners. ProjectTaskService
retains Project writes and supplies a narrow shared-transaction planning seam;
PrincipalService retains verified authority and the transaction/fence. Reads take
the shared fence; writes take the exclusive fence, reauthorize project access,
lock Project before Sprint writes, then inspect the receipt before old versions
or archive/mode checks. No nested independent transaction or service cycle exists.

The additive `20261119210000_sprint_planning` migration adds Project settings and
sprint revision, the planned Sprint table, composite scope/creator/grant FKs,
date/scale/state/immutability/archive guards, activity linkage/actions and statement
policy fences. Older migrations remain exact. Backfill adds defaults without
updating legacy/archived rows or their versions. Sprint writes advance only
`sprintRevision`, preserving Project content version, Task revision and allocation.
Setting edits advance Project version. Task wire payloads/replay remain unchanged.
Only the explicit migration one-shot migrates; quiesce writers before applying
the table-locking migration to a running installation.

Every successful command awaits mutation → activity → minimal outbox → tagged
reference receipt in one transaction. Original-key replay checks current authority
and fetches current authorized content/capabilities, including after later edits
or archive; it never returns stored content as authorization. Same key/different
normalized request gives409 `idempotency-conflict`; stale versions give
`version-conflict`. Invalid mode for creation gives `invalid-transition`;
archived projects give `archived`; changed continuation gives `page-changed`.
Missing/foreign/denied resources use uniform403. New sprint outbox events keep
the existing project invalidation wire and use current Project version, never a
Sprint version mislabeled as Project. SSE carries no name/goal or raw outbox data.

Owner/admin private content access, explicit access for others, read-only roles,
actual delegated/autonomous subjects and revocation are the existing policies.
No agent gains human administration or the custodian's permissions. Internal
grant tests do not implement T12 authentication or expose an MCP catalog.

## Original implementation verification at `9133c79`

Frozen workspace/unit-tool installs preserve existing dependency pins. Current
lint and normal deterministic coverage pass: API 236 cases, web 198,
contracts 8 and isolated prototype 19. Direct controller/HTTP units exercise
implemented routes, renewal/correlation and denied/invalid boundaries. The
coordinator approved exactly the current API/web/contracts baseline migration
after reviewing fingerprints, numerical comparisons and mapping debt. The normal
461-case coverage gate, all 20 infrastructure checks and artifact validation pass;
the prototype and four historical baselines remain byte-for-byte unchanged.
The [unit guide](unit-coverage.md#t111-planning-coverage--2026-11-19) records totals,
floors and remaining branch/null mapping debt. This is numerical approval, not
product or full T11 acceptance.

The original full retained PostgreSQL/HTTP suite passed, including the nine-table
restart digest and Sprint API readback, before the Gregorian/UTC storage-boundary
correction. Focused current planning checks pass all 10 cases
after the Gregorian/UTC storage-boundary correction: actual migration/reapply,
legacy/archive preservation, scoped settings, DST/invalid dates, tenants/private/
viewer/grant/revocation, version/key races, paging, real committed-response loss,
atomic rollback at four durable stages and minimal Project SSE invalidation.
The final positive-only cursor guard is additionally covered by deterministic
service units. Unit doubles do not establish these PostgreSQL properties.

The complete standard check passes, including formatting/tooling/lint, backend
dependency closure, logic/integration units, strict types, production builds,
17 MCP checks and production HTTP smoke. Next's advisory notice initially stopped
the build; a retry receipt expired across the session handoff, and the unchanged
complete command passed within its supported five-minute retry window. No
advisory suppression, pin or security-setting change was used. The runtime suite
passes pinned API/web/migrator images, nonroot/Express exclusion, explicit
migration gating/reapply, lock deadlines, signal cleanup, DB readiness recovery
and queue persistence across stack recreation/restart. It cleaned its owned
containers, networks, volume, image tags and private fixtures. Current-head
CI/native review and coordinator acceptance remain pending.

The original local high/critical audit passed with zero high/critical findings; this
is historical evidence before the Effect advisory update below. The retained
graph has nine moderate and one low finding. Next 16.4.3 is within two moderate
cache advisory ranges, both patched in 16.4.5:
[root-param cache interaction](https://github.com/advisories/GHSA-mfr8-8qww-v76h)
and [nested cache stream metadata](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8).
An installed-source search found no `use cache`, `unstable_cache` or
`cacheComponents` use in maintained web source/config; that is not an
exploitability certification. A separate dependency upgrade is recommended;
those original checks changed no pins or security settings. The correction below
retains the Next pin and its advisory debt.

## Effect audit correction — 2026-11-19

Hosted [validate at `9133c79`](https://github.com/Ljrr3045/rielia/actions/runs/44626674850/job/135922411632)
failed the unchanged high audit gate after
[GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw)
was updated on November 19. It affects Effect through 3.22.0 and is fixed in
3.22.1. The pinned `@prisma/config@7.10.1` requires Effect 3.20.0 exactly.
The current pre-fix local audit reproduces one high, nine moderate and one low
finding; the earlier zero-high result does not describe that updated audit.

The coordinator authorized only the parent-scoped
`'@prisma/config>effect': 3.22.1` override and minimal root lock regeneration.
All ten resolved API/web paths through Prisma config now use Effect 3.22.1.
Prisma/client 7.10.1 and every other direct pin, both patches, the qs override,
strict peers, script allowlists and age policy remain unchanged. No audit ignore,
threshold relaxation, blanket age exception or nonfrozen CI install is used.
Remove this override when a separately approved supported Prisma config pins a
patched Effect release, then revalidate the complete graph and migration/runtime
closure before removal.

Official [Prisma config metadata](https://registry.npmjs.org/@prisma%2Fconfig/7.10.1)
and Effect [3.20.0](https://registry.npmjs.org/effect/3.20.0)/[3.22.1](https://registry.npmjs.org/effect/3.22.1)
manifests show unchanged transitive dependency ranges, no new engine/peer/lifecycle
requirements, and the consumed `effect/Function` export remains available.
The [upstream release](https://github.com/Effect-TS/effect/releases/tag/effect%403.22.1)
includes the [linear matcher fix](https://github.com/Effect-TS/effect/commit/3cc3c6e1a64cbdc360e9d28e44f3ec3ce0ece6e3).
Metadata compatibility is supplemented by the dependency-sensitive checks below;
this is not an application exploitability assessment.

The corrected root audit passes the existing high/critical gate with zero
high/critical, nine moderate and one low finding. The isolated unit-tool graph
is unchanged and its gate passes with zero high/critical and two moderate
findings. These are dated advisory results, not universal vulnerability absence.
Source, tests, schema/migrations and all eight approved coverage baselines remain
byte-for-byte identical to `9133c79`. Current dependency-sensitive validation passes:
frozen install; complete standard checks with Prisma config/generation and backend
closure; normal 461-case coverage with the identical count digest; all 20
infrastructure checks and artifact validation; the full real PostgreSQL/HTTP/
identity/planning suite with migration reapply and nine-table restart/readback;
and fresh API/worker, web and migrator image/recovery checks. This new full PG run
uses final application source, including both storage-boundary and cursor guards;
it does not relabel the original source-qualified proof above. No baseline write
or source behavior change was needed. The existing Next notice required its
supported unchanged-command retry. Owned fixture processes, containers, networks,
volumes and image tags are cleaned; current-head hosted CI/native/coordinator
acceptance remains pending on the same Draft PR50.

Use existing contribution commands: `pnpm test:projects:logic`, `pnpm check`,
`pnpm unit:coverage`, unit infrastructure/artifacts, `pnpm test:identity`,
`pnpm test:runtime`, backend closure, audit, handoff and whitespace checks.
The identity harness includes the new real PostgreSQL/Nest planning suite and
extends its restart digest/readback to Sprint storage. Source/test/map changes
require coordinator-approved numerical coverage migration before baseline writes.
After the normal API build, `pnpm exec node scripts/test-identity.mjs --sprints`
runs only the planning suite in the same owned disposable migration fixture;
the default full command retains all prior suites and restart/identity checks.
No browser/native sprint QA applies to this API-only slice; later full UI flows
must prove desktop/mobile, keyboard/touch and persisted/error recovery.

Coordinator-ratified T11.2–4 rules: backlog carryover means unscheduled while
preserving status/rank/archive; children participate independently and count only
as informational work; top-level points only; archived participants remain in
close summary and later close changes membership without editing Task content.
Start references and close outcomes remain immutable; no closed Sprint reopening.
Kanban retains management/closure of an existing active sprint but disables new
creation/start. These are future contracts, not implemented capabilities here.
