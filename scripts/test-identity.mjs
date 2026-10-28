import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const image = 'postgres:18.6@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6';
const owner = randomBytes(12).toString('hex');
const name = `rielia-identity-${owner}`;
const directory = await mkdtemp(join(tmpdir(), 'rielia-identity-'));
const abort = new AbortController();
const privateValues = [];
let started = false;
const stop = () => abort.abort();
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

async function command(label, executable, args, options = {}) {
  try {
    return await execute(executable, args, { cwd: root, timeout: 120000, maxBuffer: 4 * 1024 * 1024, ...options });
  } catch (error) {
    if (label === 'Identity integration suite') {
      let diagnostics = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      for (const value of privateValues) diagnostics = diagnostics.replaceAll(value, '[redacted]');
      diagnostics = diagnostics.replace(/[A-Za-z0-9+/_=-]{30,}/g, '[redacted]');
      process.stdout.write(diagnostics);
    }
    // Child diagnostics can include credentials supplied through the environment.
    // eslint-disable-next-line preserve-caught-error -- Raw child errors can expose private environment values.
    throw new Error(`${label} failed; details withheld to protect runtime configuration.`);
  }
}

try {
  const password = randomBytes(36).toString('hex');
  privateValues.push(password);
  const file = join(directory, 'database.env');
  await writeFile(file, `POSTGRES_USER=identity\nPOSTGRES_DB=identity_spike\nPOSTGRES_PASSWORD=${password}\n`, { mode: 0o600 });
  await command('Disposable database startup', 'docker', ['run', '--detach', '--rm', '--name', name,
    '--label', `rielia.identity-test=${owner}`, '--publish', '127.0.0.1::5432',
    '--tmpfs', '/var/lib/postgresql', '--env-file', file, image], { signal: abort.signal });
  started = true;
  let ready = false;
  for (let attempt = 0; attempt < 60 && !abort.signal.aborted; attempt++) {
    // The image's temporary initialization server accepts Unix sockets before
    // its final TCP server starts. Wait for TCP before running direct PG fixtures.
    const result = await execute('docker', ['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'identity', '-d', 'identity_spike'], { timeout: 3000 }).catch(() => null);
    if (result) { ready = true; break; }
    await delay(250, undefined, { signal: abort.signal });
  }
  if (!ready) throw new Error('Disposable PostgreSQL readiness timed out.');
  const { stdout } = await command('Database port discovery', 'docker', ['port', name, '5432/tcp']);
  const port = /^127\.0\.0\.1:(\d+)\s*$/.exec(stdout)?.[1];
  if (!port) throw new Error('Disposable database did not expose a loopback-only port.');
  const env = {
    ...process.env, NODE_ENV: 'production', IDENTITY_ENABLED: 'true',
    DATABASE_URL: `postgresql://identity:${password}@127.0.0.1:${port}/identity_spike`,
    BETTER_AUTH_URL: 'https://identity.example.test', BETTER_AUTH_SECRET: randomBytes(48).toString('base64'),
    GOOGLE_CLIENT_ID: 'simulated-google-client', GOOGLE_CLIENT_SECRET: randomBytes(24).toString('hex'),
    GITHUB_CLIENT_ID: 'simulated-github-client', GITHUB_CLIENT_SECRET: randomBytes(24).toString('hex'),
    IDENTITY_TRUSTED_PROXIES: '', IDENTITY_ALLOW_HTTP_LOOPBACK: 'false',
  };
  privateValues.push(env.DATABASE_URL, env.BETTER_AUTH_SECRET, env.GOOGLE_CLIENT_SECRET, env.GITHUB_CLIENT_SECRET);
  await command('Legacy identity fixture', process.execPath, ['apps/api/test/prepare-principal-backfill.mjs'], { env, signal: abort.signal });
  await command('Legacy migration history', 'pnpm', ['--filter', '@rielia/api', 'exec', 'prisma', 'migrate', 'resolve', '--applied', '20261025000000_identity'], { env, signal: abort.signal });
  await command('Identity migration', 'pnpm', ['--filter', '@rielia/api', 'exec', 'prisma', 'migrate', 'deploy'], { env, signal: abort.signal });
  // A second deployment proves the checked-in migration is safely repeatable.
  await command('Repeated identity migration', 'pnpm', ['--filter', '@rielia/api', 'exec', 'prisma', 'migrate', 'deploy'], { env, signal: abort.signal });
  console.log('Disposable PostgreSQL 18.6 ready; identity migration applied twice.');
  const principals = await command('Identity integration suite', process.execPath,
    ['--test', '--test-reporter=spec', 'apps/api/test/principals.test.mjs'], { env, signal: abort.signal });
  process.stdout.write(principals.stdout);
  const workspaces = await command('Identity integration suite', process.execPath,
    ['--test', '--test-reporter=spec', 'apps/api/test/workspaces.test.mjs'], { env, signal: abort.signal });
  process.stdout.write(workspaces.stdout);
  const tests = await command('Identity integration suite', process.execPath,
    ['--test', '--test-reporter=spec', 'apps/api/test/identity.test.mjs'], { env, signal: abort.signal });
  process.stdout.write(tests.stdout);
  // Successful Node tests must not emit private runtime diagnostics on stderr.
  if (tests.stderr) console.log('Identity tests emitted diagnostics; inspect privately before delivery.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Identity validation failed.');
  process.exitCode = 1;
} finally {
  try {
    const owned = await execute('docker', ['inspect', '--format', '{{index .Config.Labels "rielia.identity-test"}}', name], { timeout: 10000 }).catch(() => null);
    if (started && owned?.stdout.trim() !== owner) {
      console.error('Task-owned database cleanup could not be verified.');
      process.exitCode = 1;
    } else if (owned?.stdout.trim() === owner) {
      await command('Disposable database cleanup', 'docker', ['rm', '--force', name]);
      console.log('Disposable identity database removed.');
    }
  } catch { console.error('Disposable database cleanup failed; inspect the task-owned identity test container.'); process.exitCode = 1; }
  await rm(directory, { recursive: true, force: true });
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
