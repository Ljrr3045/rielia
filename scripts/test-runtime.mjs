import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'rielia-runtime-'));
const owner = randomBytes(12).toString('hex');
const project = `rielia-runtime-${owner}`;
const password = randomBytes(32).toString('hex');
const secretProbe = randomBytes(32).toString('hex');
const envFile = join(directory, 'local.env');
const override = join(directory, 'migration-failure.json');
const probes = ['api', 'web'].map((app) => join(root, `apps/${app}/.env.runtime-probe-${owner}`));
const abort = new AbortController();
const stop = () => abort.abort();
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
const env = { ...process.env, COMPOSE_PROJECT_NAME: project, COMPOSE_BAKE: 'false',
  LOCAL_POSTGRES_PASSWORD: password, LOCAL_API_PORT: '0', LOCAL_WEB_PORT: '0' };
const baseArgs = ['compose', '--project-name', project, '--env-file', envFile, '-f', 'compose.local.yml'];
let buildAttempted = false;
let resourcesAttempted = false;

function sanitize(value) {
  return String(value).replaceAll(password, '[redacted]').replaceAll(secretProbe, '[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[database URL redacted]');
}

async function command(label, args, { timeout = 120000, failure = false, cleanup = false } = {}) {
  let result;
  try {
    result = await execute('docker', args, { cwd: root, env, timeout,
      maxBuffer: 8 * 1024 * 1024, ...(cleanup ? {} : { signal: abort.signal }) });
  } catch (error) {
    if (failure && typeof error.code === 'number' && error.code !== 0 && !error.killed && !abort.signal.aborted) {
      return sanitize(`${error.stdout ?? ''}\n${error.stderr ?? ''}`);
    }
    // The operator's environment can contain credentials. Print only sanitized
    // bounded child output; never serialize a child_process error or its args.
    // eslint-disable-next-line preserve-caught-error -- Raw child errors can expose private environment values.
    throw new Error(`${label} failed.\n${sanitize(`${error.stdout ?? ''}\n${error.stderr ?? ''}`).slice(-12000)}`);
  }
  if (failure) throw new Error(`${label} unexpectedly succeeded.`);
  return result.stdout.trim();
}

const compose = (label, args, options) => command(label, [...baseArgs, ...args], options);
const sql = (text) => compose('Task-owned database query', ['exec', '-T', 'postgres', 'psql', '-X', '-U', 'rielia', '-d', 'rielia', '-v', 'ON_ERROR_STOP=1', '-Atc', text], { timeout: 10000 });
const diagnostic = async (action, id) => JSON.parse(await compose(`Diagnostic ${action}`, ['run', '--rm', '--no-deps', '-T', 'worker', 'node', 'dist/runtime/diagnostic.js', action, id]));

async function container(service) {
  const id = await compose('Container discovery', ['ps', '--all', '--quiet', service]);
  if (!id) return null;
  const [details] = JSON.parse(await command('Container inspection', ['inspect', id]));
  assert.equal(details.Config.Labels['com.docker.compose.project'], project);
  return details;
}

async function endpoint(service, port) {
  const published = await compose('Loopback port discovery', ['port', service, port]);
  assert.match(published, /^127\.0\.0\.1:\d+$/);
  return `http://${published}`;
}

async function response(url, status) {
  const result = await fetch(url, { signal: AbortSignal.any([AbortSignal.timeout(10000), abort.signal]) });
  assert.equal(result.status, status, url);
  return result;
}

async function eventually(label, operation, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (!abort.signal.aborted && Date.now() < deadline) {
    if (await operation()) return;
    await delay(250, undefined, { signal: abort.signal });
  }
  throw new Error(`${label} timed out.`);
}

async function withDatabaseLock(table, operation) {
  const name = `runtime-lock-${owner}`;
  const lock = execute('docker', [...baseArgs, 'exec', '-T', 'postgres', 'psql', '-X', '-U', 'rielia', '-d', 'rielia', '-v', 'ON_ERROR_STOP=1', '-c',
    `SET application_name = '${name}'; BEGIN; LOCK TABLE ${table} IN ACCESS EXCLUSIVE MODE; SELECT pg_sleep(30); ROLLBACK;`],
  { cwd: root, env, timeout: 45000, signal: abort.signal }).then(() => {}, () => {});
  try {
    await eventually('Task-owned database lock acquisition', async () =>
      await sql(`SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.application_name='${name}' AND l.relation='${table}'::regclass AND l.mode='AccessExclusiveLock' AND l.granted`) === '1');
    await operation();
  } finally {
    await sql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='${name}'`);
    await lock;
  }
}

try {
  await writeFile(envFile, '', { mode: 0o600 });
  await writeFile(override, JSON.stringify({ services: { migrate: { environment: {
    DATABASE_URL: `postgresql://missing_role:${password}@postgres:5432/rielia`,
  } } } }), { mode: 0o600 });
  for (const probe of probes) await writeFile(probe, `BUILD_SECRET_PROBE=${secretProbe}\n`, { mode: 0o600, flag: 'wx' });
  const config = JSON.parse(await compose('Compose configuration', ['config', '--format', 'json']));
  assert.equal(config.networks.data.internal, true);
  assert.equal(config.services.postgres.ports, undefined);
  assert.equal(config.services.worker.ports, undefined);
  for (const service of ['api', 'web']) assert.equal(config.services[service].ports[0].host_ip, '127.0.0.1');
  for (const service of ['api', 'worker', 'migrate', 'web']) {
    assert.deepEqual(config.services[service].tmpfs, ['/tmp:rw,noexec,nosuid,size=32m,mode=1777']);
  }
  assert.equal(config.services.api.image, config.services.worker.image);
  buildAttempted = true;
  console.log(`Building local images for isolated project ${project} (15-minute deadline).`);
  await compose('Frozen multi-stage image build', ['build', 'api', 'web', 'migrate'], { timeout: 900000 });
  const closureCheck = await readFile(join(root, 'scripts/assert-backend-closure.mjs'), 'utf8');
  for (const service of ['api', 'web', 'migrate']) {
    const image = config.services[service].image;
    const [details] = JSON.parse(await command('Image configuration', ['image', 'inspect', image]));
    assert.equal(details.Config.User, 'node');
    assert(!details.Config.Env.some((value) => /DATABASE_URL|POSTGRES_PASSWORD|AUTH_SECRET|CLIENT_SECRET|BUILD_SECRET_PROBE/.test(value)));
    const check = `const fs=require('node:fs');const assert=require('node:assert/strict');
      assert.equal(process.getuid(),1000);for(const p of ['/app/.git','/app/.env','/app/src','/app/test','/app/apps/api/test','/app/node_modules/typescript','/app/node_modules/eslint'])assert(!fs.existsSync(p),p);
      for(const p of ['/app','/app/apps/api','/app/apps/web'])if(fs.existsSync(p))assert(!fs.readdirSync(p).some(n=>n.startsWith('.env')),p);
      ${service !== 'web' ? `assert(fs.existsSync('/app/dist/generated/prisma/client.js'));assert(fs.existsSync('/app/prisma/migrations/20261025000000_identity/migration.sql'));assert(fs.existsSync('/app/prisma/migrations/20261028000000_principal_foundations/migration.sql'));assert.equal(fs.existsSync('/app/node_modules/prisma/build/index.js'),${service === 'migrate'});assert.equal(require('pg-boss/package.json').pgboss.schema,46);require('pg');` : "assert(fs.existsSync('/app/apps/web/server.js'));assert(fs.existsSync('/app/apps/web/.next/static'));assert(fs.existsSync('/app/apps/web/public'));"}
      if(fs.existsSync('/app/node_modules/.pnpm'))console.log('Retained optional tooling peers: '+fs.readdirSync('/app/node_modules/.pnpm').filter(n=>/^(prisma@|typescript@|@prisma\\+studio-core@)/.test(n)).map(n=>n.split('_')[0]).join(', '));
      console.log('nonroot runtime files and exclusions verified');`;
    const inspection = await command('Nonroot image usability and exclusions', ['run', '--rm', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--entrypoint', 'node', image, '-e', check]);
    console.log(`${service} image: ${details.Size} bytes; nonroot runtime files and exclusions verified.`);
    console.log(inspection);
    if (service !== 'web') {
      await command('Deployed backend dependency closure', ['run', '--rm', '--network', 'none', '--read-only',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--entrypoint', 'node', image,
        '--input-type=module', '-e', `${closureCheck}\nassertBackendClosure('/app', { deployed: true });`]);
      console.log(`${service}${service === 'api' ? '/worker' : ''}: resolved closure and complete deployed store contain no Express.`);
    }
  }

  resourcesAttempted = true;
  await compose('Private database startup', ['up', '-d', '--wait', '--wait-timeout', '60', 'postgres']);
  // A direct worker launch on a clean DB must fail without installing pg-boss.
  assert.match(await compose('Unmigrated worker rejection', ['run', '--rm', '--no-deps', '-T', 'worker'], { failure: true, timeout: 20000 }), /Diagnostic worker startup failed/);
  assert.equal(await sql("SELECT count(*) FROM pg_namespace WHERE nspname = 'rielia_diagnostics'"), '0');
  const migrationFailure = await command('Failed migration blocks dependent API and worker', [...baseArgs, '-f', override, 'up', '-d', 'api', 'worker'], { failure: true, timeout: 45000 });
  for (const service of ['api', 'worker']) assert.notEqual((await container(service))?.State.Running, true);
  const failedMigration = await container('migrate');
  assert(failedMigration, `Expected failed migration container: ${migrationFailure}`);
  assert.equal(failedMigration.State.ExitCode, 1, migrationFailure);
  assert.match(await compose('Migration failure evidence', ['logs', '--no-color', 'migrate']), /Local migration failed/);
  console.log('Unmigrated worker failed without schema writes; failed migration blocked API and worker.');

  // Model cold/slow schema DDL on the real database, only for this one-shot's
  // connection. Readiness/worker/diagnostic query deadlines must stay short.
  await sql(`CREATE FUNCTION public.runtime_smoke_delay() RETURNS event_trigger LANGUAGE plpgsql AS $$
    BEGIN IF current_setting('application_name') = 'rielia-runtime-migrate' THEN PERFORM pg_sleep(3); END IF; END $$;
    CREATE EVENT TRIGGER runtime_smoke_delay ON ddl_command_start WHEN TAG IN ('CREATE SCHEMA')
    EXECUTE FUNCTION public.runtime_smoke_delay();`);
  await compose('Migrated API/web startup', ['up', '-d', '--wait', '--wait-timeout', '90', 'api', 'web']);
  await sql('DROP EVENT TRIGGER runtime_smoke_delay; DROP FUNCTION public.runtime_smoke_delay()');
  assert.equal((await container('migrate')).State.ExitCode, 0);
  console.log('Migration succeeded with a controlled 3-second pg-boss schema DDL delay; temporary helper removed.');
  const api = await endpoint('api', '3001');
  const web = await endpoint('web', '3000');
  assert.deepEqual(await (await response(`${api}/api/v1/health`, 200)).json(), { status: 'ok', service: 'rielia-api' });
  assert.deepEqual(await (await response(`${api}/api/v1/readiness`, 200)).json(), { status: 'ready' });
  assert.match(await (await response(web, 200)).text(), /data-api-status="available"/);
  await response(`${api}/api/v1/jobs`, 404);
  const identity = await response(`${web}/api/v1/identity/config`, 200);
  assert.equal((await identity.json()).enabled, false);
  const disabledContext = await response(`${api}/api/v1/workspaces/unprovisioned/execution-context`, 503);
  assert.equal(disabledContext.headers.get('cache-control'), 'no-store');
  for (const service of ['postgres', 'worker']) assert.equal(Object.keys((await container(service)).HostConfig.PortBindings ?? {}).length, 0);

  // Repeated deploys preserve history; the one-shot is never an HTTP listener.
  const migrationHistory = await sql('SELECT migration_name || checksum FROM public._prisma_migrations ORDER BY migration_name');
  await compose('Repeated local migration', ['run', '--rm', '--no-deps', '-T', 'migrate']);
  assert.equal(await sql('SELECT migration_name || checksum FROM public._prisma_migrations ORDER BY migration_name'), migrationHistory);
  for (const migration of ['20261025000000_identity', '20261028000000_principal_foundations', '20261028190000_workspace_flows', '20261028220000_project_task_flows', '20261028230000_project_task_paging', '20261029160000_project_access', '20261030180000_task_views', '20261031170000_task_collaboration']) {
    const migrationPath = join(root, `apps/api/prisma/migrations/${migration}/migration.sql`);
    const checksum = createHash('sha256').update(await readFile(migrationPath)).digest('hex');
    await sql(`UPDATE public._prisma_migrations SET checksum = repeat('0',64) WHERE migration_name = '${migration}'`);
    await response(`${api}/api/v1/readiness`, 503);
    await response(`${api}/api/v1/health`, 200);
    await sql(`UPDATE public._prisma_migrations SET checksum = '${checksum}' WHERE migration_name = '${migration}'`);
  }
  assert.equal(await sql('SELECT migration_name || checksum FROM public._prisma_migrations ORDER BY migration_name'), migrationHistory);
  await sql('UPDATE rielia_diagnostics.version SET version = 45');
  await response(`${api}/api/v1/readiness`, 503);
  assert.match(await compose('Incompatible queue worker rejection', ['run', '--rm', '--no-deps', '-T', 'worker'], { failure: true, timeout: 20000 }), /Diagnostic worker startup failed/);
  assert.equal(await sql('SELECT version FROM rielia_diagnostics.version'), '45');
  await sql('UPDATE rielia_diagnostics.version SET version = 46');
  console.log('Repeated migration preserved history; mismatched identity/queue schemas fail readiness without worker migration.');

  await withDatabaseLock('rielia_diagnostics.job', async () => {
    const started = Date.now();
    await compose('Locked diagnostic enqueue fails within query deadline', ['run', '--rm', '--no-deps', '-T', 'worker', 'node', 'dist/runtime/diagnostic.js', 'enqueue', randomUUID()], { failure: true, timeout: 15000 });
    assert(Date.now() - started < 12000);
  });
  await withDatabaseLock('rielia_diagnostics.queue', async () => {
    const id = await compose('Worker startup during DB lock', ['run', '--no-deps', '-d', 'worker']);
    try {
      await eventually('Worker startup query waiting on lock', async () => await sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='rielia-runtime-worker' AND wait_event_type='Lock'") === '1', 5000);
      await command('Signal worker during pending startup', ['stop', '--time', '10', id], { timeout: 15000 });
      const [details] = JSON.parse(await command('Startup signal exit inspection', ['inspect', id]));
      assert.equal(details.State.Running, false);
      assert.equal(details.State.ExitCode, 0);
      assert.equal(await sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='rielia-runtime-worker'"), '0');
    } finally { await command('Task-owned startup probe cleanup', ['rm', '--force', id]); }
  });
  console.log('Real locked enqueue respected query deadline; SIGTERM during blocked worker startup closed connections and exited cleanly.');

  await compose('Database outage', ['stop', '-t', '10', 'postgres']);
  await response(`${api}/api/v1/health`, 200);
  const unavailable = await response(`${api}/api/v1/readiness`, 503);
  assert(!JSON.stringify(await unavailable.json()).includes(password));
  await compose('Database restart', ['up', '-d', '--wait', '--wait-timeout', '60', 'postgres']);
  await eventually('API database reconnection', async () => (await fetch(`${api}/api/v1/readiness`, { signal: AbortSignal.timeout(10000) })).status === 200);
  console.log('DB outage returned readiness 503 with liveness 200; readiness recovered after restart.');

  const id = randomUUID();
  await compose('Ensure worker is stopped', ['stop', '-t', '10', 'worker']);
  assert.deepEqual(await diagnostic('enqueue', id), { id, state: 'created' });
  assert.equal((await diagnostic('status', id)).state, 'created');
  const volume = (await container('postgres')).Mounts.find((mount) => mount.Type === 'volume').Name;
  await compose('Stop/remove stack while preserving volume', ['down', '--timeout', '15']);
  await compose('Stack recreation with persistent database', ['up', '-d', '--wait', '--wait-timeout', '90', 'api', 'web']);
  assert.equal((await container('postgres')).Mounts.find((mount) => mount.Type === 'volume').Name, volume);
  assert.equal((await diagnostic('status', id)).state, 'created');
  assert.equal(await sql('SELECT migration_name || checksum FROM public._prisma_migrations ORDER BY migration_name'), migrationHistory);
  await compose('Worker startup', ['up', '-d', '--wait', '--wait-timeout', '60', 'worker']);
  assert.deepEqual(await diagnostic('wait', id), { id, state: 'completed', output: { diagnostic: 'ok' } });
  const worker = await container('worker');
  const apiContainer = await container('api');
  assert.equal(worker.Image, apiContainer.Image);
  assert.equal(worker.Config.User, 'node');
  assert.equal(worker.HostConfig.ReadonlyRootfs, true);
  // Docker's embedded DNS can listen in the same network namespace. Inspect
  // sockets owned by the actual worker process, not that engine-owned resolver.
  const listeners = `const fs=require('node:fs');const sockets=new Set();let found=false;
    for(const pid of fs.readdirSync('/proc').filter(n=>/^\\d+$/.test(n))){
      let args;try{args=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').split('\\0')}catch{continue}
      if(!args.includes('dist/worker.js'))continue;found=true;
      for(const fd of fs.readdirSync('/proc/'+pid+'/fd')){let target;try{target=fs.readlinkSync('/proc/'+pid+'/fd/'+fd)}catch{continue}const match=/^socket:\\[(\\d+)\\]$/.exec(target);if(match)sockets.add(match[1])}
    }if(!found)process.exit(1);
    for(const p of ['/proc/net/tcp','/proc/net/tcp6']){const rows=fs.readFileSync(p,'utf8').trim().split('\\n').slice(1).map(r=>r.trim().split(/\\s+/));if(rows.some(r=>r[3]==='0A'&&sockets.has(r[9])))process.exit(1)}`;
  await compose('Worker has no TCP listener', ['exec', '-T', 'worker', 'node', '-e', listeners]);
  await compose('Graceful worker stop', ['stop', '-t', '15', 'worker']);
  assert.equal((await container('worker')).State.ExitCode, 0);
  assert.match(await compose('Worker graceful shutdown evidence', ['logs', '--no-color', 'worker']), /Diagnostic worker stopped/);
  await compose('Worker restart', ['up', '-d', '--wait', '--wait-timeout', '60', 'worker']);
  assert.deepEqual(await diagnostic('status', id), { id, state: 'completed', output: { diagnostic: 'ok' } });
  console.log('Job remained created with worker stopped across stack/DB recreation; restarted worker completed it and retained result across graceful restart.');
  console.log('Local runtime smoke passed; identity stays disabled and no external provider was used.');
} catch (error) {
  console.error(sanitize(error instanceof Error ? error.message : 'Runtime smoke failed.'));
  process.exitCode = 1;
} finally {
  try {
    if (resourcesAttempted) {
      await compose('Task-owned Compose resource cleanup', ['down', '--volumes', '--remove-orphans', '--timeout', '15'], { cleanup: true });
      const remaining = await command('Owned resource cleanup verification', ['ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`], { cleanup: true });
      assert.equal(remaining, '');
      assert.equal(await command('Owned volume cleanup verification', ['volume', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`], { cleanup: true }), '');
      assert.equal(await command('Owned network cleanup verification', ['network', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`], { cleanup: true }), '');
    }
    if (buildAttempted) {
      // Exact unique task image tags only. Never prune or remove shared bases.
      for (const image of [`${project}-api:local`, `${project}-web:local`, `${project}-migrate:local`]) {
        const exists = await execute('docker', ['image', 'inspect', image], { timeout: 10000 }).then(() => true, () => false);
        if (exists) await command('Task-owned image cleanup', ['image', 'rm', image], { cleanup: true });
      }
    }
    console.log(`Owned containers, networks, volume and image tags cleaned for ${project}.`);
  } catch (error) {
    console.error(`Cleanup failed for ${project}: ${sanitize(error.message)}`);
    process.exitCode = 1;
  }
  for (const probe of probes) await rm(probe, { force: true });
  await rm(directory, { recursive: true, force: true });
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
