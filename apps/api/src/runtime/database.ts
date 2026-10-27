import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';

export const QUEUE_SCHEMA = 'rielia_diagnostics';
// pg-boss 12.38.0's published pgboss.schema. Update with its dependency pin.
export const QUEUE_SCHEMA_VERSION = 46;
export const DIAGNOSTIC_QUEUE = 'runtime-probe';

export function runtimeDatabaseUrl(): string {
  if (process.env['LOCAL_RUNTIME_ENABLED'] !== 'true' || !process.env['DATABASE_URL']) {
    throw new Error('Local diagnostic runtime requires explicit enablement and DATABASE_URL.');
  }
  return process.env['DATABASE_URL'];
}

export function databasePool(applicationName = 'rielia-runtime-api', queryTimeoutMillis = 2000): pg.Pool {
  const pool = new pg.Pool({
    connectionString: runtimeDatabaseUrl(), max: 2,
    connectionTimeoutMillis: 2000, query_timeout: queryTimeoutMillis,
    statement_timeout: queryTimeoutMillis, idleTimeoutMillis: 1000,
    application_name: applicationName,
  });
  // An idle connection can fail when PostgreSQL is restarted. Readiness handles
  // the next query failure; never emit driver messages containing configuration.
  pool.on('error', () => {});
  return pool;
}

const migrationDirectory = new URL('../../prisma/migrations/', import.meta.url);
const expectedMigrations = (async () => {
  const entries = await readdir(migrationDirectory, { withFileTypes: true });
  return Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => ({
    name: entry.name,
    checksum: createHash('sha256').update(await readFile(new URL(`${entry.name}/migration.sql`, migrationDirectory))).digest('hex'),
  })));
})();

export async function assertIdentitySchema(pool: pg.Pool): Promise<void> {
  const expected = await expectedMigrations;
  const { rows } = await pool.query<{ migration_name: string; checksum: string; finished: boolean; rolled_back: boolean }>(
    'SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM public._prisma_migrations',
  );
  if (rows.some((row) => !row.rolled_back && (!row.finished || !expected.some((migration) => migration.name === row.migration_name && migration.checksum === row.checksum)))
    || expected.some((migration) => !rows.some((row) => row.finished && !row.rolled_back && row.migration_name === migration.name && row.checksum === migration.checksum))) {
    throw new Error('Identity migration history is incompatible.');
  }
  const tables = await pool.query<{ valid: boolean }>(`SELECT
    to_regclass('public.user') IS NOT NULL AND to_regclass('public.session') IS NOT NULL
    AND to_regclass('public.account') IS NOT NULL AND to_regclass('public.verification') IS NOT NULL AS valid`);
  if (!tables.rows[0]?.valid) throw new Error('Identity schema is unavailable.');
}

export async function assertRuntimeReady(pool: pg.Pool): Promise<void> {
  await assertIdentitySchema(pool);
  const version = await pool.query<{ version: number }>(`SELECT version FROM ${QUEUE_SCHEMA}.version`);
  if (version.rows.length !== 1 || version.rows[0]?.version !== QUEUE_SCHEMA_VERSION) {
    throw new Error('Diagnostic queue schema is incompatible.');
  }
  const queue = await pool.query(`SELECT name FROM ${QUEUE_SCHEMA}.queue WHERE name = $1`, [DIAGNOSTIC_QUEUE]);
  if (queue.rowCount !== 1) throw new Error('Diagnostic queue is unavailable.');
}
