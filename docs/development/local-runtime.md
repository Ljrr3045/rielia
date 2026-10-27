# T04.0 local runtime preparation

This coordinator-authorized T04/B0 preparatory split implements architecture
§1.2/§6.2 and the local build, migration and persistent-job portion of T04.
The source ticket is B1 with T02–T03 dependencies. Real T02 OAuth/HTTPS and T03
remote discovery remain pending; this reversible local experiment does not close
them, full T04, P34/self-hosting acceptance, or any product story. Stack and license
decisions remain open. There is no deployment, domain schema, task API, principal,
Redis, shared database package or UI redesign.

## Start and stop

Prerequisites: Docker Engine with Compose v2.24+ (or Compose v5), registry access,
and sufficient space for Node build dependencies. Host Node/pnpm are needed only
for the automated smoke. Commands run from the repository root.

1. Copy the **local Docker section** of [the root example](../../.env.example)
   into an untracked root `.env`. Generate a private hex password:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Set `LOCAL_POSTGRES_PASSWORD` to the result. Keep it URL-safe hex, as Compose
   embeds it in the local connection URL. Do not use real installation credentials.
   Optional `LOCAL_WEB_PORT`/`LOCAL_API_PORT` default to 3000/3001; both bind only
   `127.0.0.1`. Set either to `0` for an OS-assigned loopback port. Host development
   through `pnpm dev:web`/`pnpm dev:api` still uses its existing app-specific files.

2. Build the three image targets, then start the runtime:

   ```sh
   docker compose -p rielia-local -f compose.local.yml build api web migrate
   docker compose -p rielia-local -f compose.local.yml up -d --wait --wait-timeout 120
   docker compose -p rielia-local -f compose.local.yml ps --all
   docker compose -p rielia-local -f compose.local.yml port web 3000
   docker compose -p rielia-local -f compose.local.yml port api 3001
   ```

   Open the reported web address. `/identity` correctly reports disabled identity.
   Local containers use `NODE_ENV=production`; the existing requirement for HTTPS
   when production identity is enabled is preserved. No provider credentials,
   HTTP auth exception or authentication bypass is added.

3. Stop and remove containers/networks while retaining the database:

   ```sh
   docker compose -p rielia-local -f compose.local.yml down
   ```

   Repeating `up` recreates services with the same named database volume and runs
   the migration gate. Removing that project's local data is an explicit reset:

   ```sh
   docker compose -p rielia-local -f compose.local.yml down --volumes
   ```

   Keep the same project name and password when reusing a volume. Changing the
   environment does not change PostgreSQL's initialized password. No global prune,
   shared engine restart, external database or Dokploy resource is involved.

## Service and readiness contract

[Compose](../../compose.local.yml) has two networks: `frontend` connects web/API;
`data` is internal and connects PostgreSQL, migration, API and worker. PostgreSQL
and worker publish no ports. The database uses a project-scoped named volume at
`/var/lib/postgresql`, the official PostgreSQL 18 parent-volume location. It is
private local development data, with a single local role. Production migration/
runtime role separation, RLS, backups and restoration belong to later work.

The migration one-shot uses a backend variant with Prisma CLI tooling, applies the existing versioned
identity Prisma migration with `migrate deploy`, then installs/migrates pg-boss in
its own `rielia_diagnostics` schema and creates only `runtime-probe`. API and
worker require its successful completion, after PostgreSQL's `pg_isready` health
check. A failed one-shot exits nonzero; investigate and rerun it before starting
dependents. No reverse migration, reset or retry loop hides the failure.

```sh
docker compose -p rielia-local -f compose.local.yml run --rm --no-deps migrate
```

`GET /api/v1/health` remains the exact public process-liveness contract consumed
by the local MCP wrapper. New `GET /api/v1/readiness` returns 200 with
`{"status":"ready"}` only when opt-in `LOCAL_RUNTIME_ENABLED=true`, PostgreSQL is
reachable, every checked-in identity migration has a finished matching checksum
and no incompatible unrolled history, the identity tables exist, and pg-boss's
schema version and diagnostic queue match. Otherwise it returns sanitized 503.
It checks expected objects/history, not arbitrary schema drift or product health.
API startup also validates those conditions when the local runtime is enabled.
The ordinary DB-free fixture retains its liveness behavior; readiness is 503 when
diagnostics are disabled. No public route enqueues work.

The worker loads the same compiled backend runtime without Nest HTTP bootstrap.
Its pg-boss constructor sets `migrate: false`, `createSchema: false`; startup
cannot install or upgrade queue storage. Each process uses one bounded `pg` pool
(two connections and two-second acquisition). API/worker/diagnostic queries have
two-second client/server-statement limits; the migration one-shot uses a separate
30-second DDL query budget under its 90-second process limit. Worker
readiness writes a temporary heartbeat only after successful DB/schema queries,
including oldest pending diagnostic-job age. Its container health check requires
a heartbeat no older than 20 seconds. DB failure removes readiness and exits
nonzero; the operator can restart after recovery. SIGTERM/SIGINT wait for pending
startup/heartbeat before closing queue/pool, with a ten-second shutdown limit.
Worker startup has a 15-second deadline, diagnostic CLI a 45-second process limit
and 30-second consumption wait, and migration a 60-second Prisma child limit plus
90-second whole-process limit. Compose is startup coordination, not automatic
dependency supervision or a production scheduler.

## Prove one persistent diagnostic job

Stop the worker, enqueue through the operator CLI and save the returned UUID:

```sh
docker compose -p rielia-local -f compose.local.yml stop worker
docker compose -p rielia-local -f compose.local.yml run --rm --no-deps worker node dist/runtime/diagnostic.js enqueue
```

Use that UUID in place of `JOB_UUID`:

```sh
docker compose -p rielia-local -f compose.local.yml run --rm --no-deps worker node dist/runtime/diagnostic.js status JOB_UUID
docker compose -p rielia-local -f compose.local.yml down
docker compose -p rielia-local -f compose.local.yml up -d --wait --wait-timeout 120 api web
docker compose -p rielia-local -f compose.local.yml run --rm --no-deps worker node dist/runtime/diagnostic.js status JOB_UUID
docker compose -p rielia-local -f compose.local.yml up -d --wait --wait-timeout 60 worker
docker compose -p rielia-local -f compose.local.yml run --rm --no-deps worker node dist/runtime/diagnostic.js wait JOB_UUID
```

Both pre-worker status calls report `created`; after worker startup the bounded
wait reports `completed` with `{"diagnostic":"ok"}`. The fixed payload has no
user data. The handler validates it and returns that constant; no business rows,
email, network call or fabricated task is involved. Repeated execution is harmless.
pg-boss owns its job-state writes. Delivery is at least once, not a guarantee of
exactly-once effects. Jobs/results are retained for one day, with maintenance by
the worker; this is no audit trail or product retry policy.

## Build pins and primary research

Researched 2026-10-27; existing application pins are preserved:

| Input | Exact selection and reason |
| --- | --- |
| Node | `24.22.1-bookworm-slim`, multi-platform index `sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205`; existing LTS fixture runtime |
| PostgreSQL | `18.6`, index `sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6`; same as existing identity integration |
| pnpm | `12.15.0`; frozen workspace install and frozen modern production deploy, preserving workspace and patched dependencies |
| pg-boss | `12.38.0`, Node `>=22.12.0`, compatible `pg ^8.23.1`; existing `pg 8.23.1` retained. Published queue schema version 46 |
| OpenTelemetry API | `1.10.0`, satisfying pg-boss's required `^1.9.0` peer. No exporter, SDK or telemetry service is configured |
| Prisma/Next | Existing `7.10.1`/`16.4.3`; no stack upgrade. A separate migration image carries Prisma CLI; API/worker share the production runtime target |
| Debian runtime support | `openssl`/`libssl3 3.0.22-1~deb12u2`, `ca-certificates 20250419~deb12u2`, no recommended packages or retained apt lists |

Exact apt versions intentionally fail if Debian mirrors retire those versions;
the mutable repository's retention is a rebuild boundary, not an indefinite
hermetic-build promise. Refresh base/OS pins together with a new build/smoke and
advisory review. Registries, apt availability and build-time supply-chain checks
still require network access. No floating application or base-image tag is used.

Primary references: [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/),
[Docker build practices](https://docs.docker.com/build/building/best-practices/),
[Compose startup conditions](https://docs.docker.com/compose/how-tos/startup-order/),
[official PostgreSQL image](https://hub.docker.com/_/postgres),
[Node 24.22.1 release](https://nodejs.org/en/blog/release/v24.22.1),
[Next standalone/tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output),
[pnpm deploy](https://pnpm.io/cli/deploy),
[pg-boss constructor](https://pgboss.io/api/constructor),
[workers](https://pgboss.io/api/workers), [jobs](https://pgboss.io/api/jobs) and
[tagged source types](https://github.com/timgit/pg-boss/blob/12.38.0/src/types.ts).

The published pg-boss declarations reference `ResolvedConstructorOptions` even
though declaration generation stripped it. A [declaration-only pnpm patch](../../patches/pg-boss@12.38.0.patch)
restores the two matching tagged-source interfaces. The unpatched strict build
failed with TS2724; patched compilation retains `skipLibCheck: false`. No pg-boss
JavaScript is altered. Remove this patch when a verified upstream version fixes
the declarations. The existing Better Auth patch is retained.

[The Dockerfile](../../docker/Dockerfile) uses nonroot multi-stage runtimes.
Backend production deployment carries compiled output, generated Prisma code,
schema/migrations/config and its dependency closure. The migration variant adds
Prisma CLI and the API's tool dependencies. Web uses Next standalone
with repository-root tracing, copied static output and public assets. Root build
tools, Git, local `.env` files and reports are excluded from runtime inputs.
Containers have read-only roots, bounded `/tmp`, dropped capabilities and no
privilege escalation. Migration tooling has a separate lifecycle and image target;
it is not a second API/worker runtime. Modern frozen pnpm deploy retains optional
Prisma/TypeScript peer bindings in its dependency closure: the split does **not**
currently reduce that closure's footprint. Observed ARM64 images were about
1.28 GB API/worker, 1.31 GB migration, and 422 MB web (uncompressed Docker size).
This is a known local-fixture packaging limit; API retains nested Prisma/Studio
tooling and the migration variant additionally includes TypeScript. No dependency internals are manually
pruned and strict peer/frozen-lock checks remain enabled. Root compiler/lint
entrypoints are excluded; this is not a claim that all nested tooling is absent.

## Automated evidence and limits

```sh
pnpm test:runtime
```

The smoke creates a cryptographically unique Compose project, generated private
password, temporary env file, random loopback application ports and owned image
tags. Build has a 15-minute deadline; lifecycle commands, HTTP and polling have
explicit bounds. It checks nonroot images/runtime files, credential exclusions,
missing migrations, failed migration gating, delayed schema DDL, repeat deployment, migration/schema
mismatch, DB outage versus liveness/recovery, real lock timeout and signal during
blocked worker startup, job persistence through full stack recreation, consumption,
worker socket absence and graceful restart. Cleanup removes only that project's
containers, networks, named volume, image tags and temporary files, then verifies
no project containers/volumes/networks remain. Shared base images and build cache
remain available; no engine or global prune is used. CI runs this separately from
`pnpm check`, alongside the existing provider-free identity suite.

Validation results and current PR evidence are recorded in [progress](progress.md).
Initial sandbox/build failures are debugging evidence, never successful checks.
Real OAuth/provider/HTTPS, remote MCP, product authorization/persistence, durable
business effects/outbox, load, backup/restore and production deployment remain
unverified. ARM64 local and AMD64 CI evidence are recorded only when actually run.
