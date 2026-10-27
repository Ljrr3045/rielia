import { rm, writeFile } from 'node:fs/promises';
import { DIAGNOSTIC_QUEUE, QUEUE_SCHEMA, assertRuntimeReady, databasePool } from './runtime/database.js';
import { diagnosticBoss, isDiagnosticPayload } from './runtime/queue.js';

const heartbeatPath = '/tmp/rielia-worker-heartbeat.json';
const pool = databasePool('rielia-runtime-worker');
const boss = diagnosticBoss(pool, false, true);
let timer: NodeJS.Timeout | undefined;
let stopping = false;
let heartbeatRunning = false;
let activeHeartbeat: Promise<void> | undefined;

async function shutdown(failed = false): Promise<void> {
  if (stopping) return;
  stopping = true;
  if (failed) process.exitCode = 1;
  clearInterval(timer);
  const deadline = setTimeout(() => process.exit(1), 10000);
  try {
    // Startup and an in-flight heartbeat must finish before closing the shared
    // pool. Otherwise a late boss.start()/write could outlive signal cleanup.
    await startup;
    await activeHeartbeat;
    await rm(heartbeatPath, { force: true });
    try { await boss.stop({ graceful: true, timeout: 5000 }); }
    finally { await pool.end(); }
    console.log('Diagnostic worker stopped.');
  } catch {
    process.exitCode = 1;
    console.error('Diagnostic worker cleanup failed.');
  } finally { clearTimeout(deadline); }
}

async function heartbeat(): Promise<void> {
  if (stopping || heartbeatRunning) return;
  heartbeatRunning = true;
  try {
    await assertRuntimeReady(pool);
    const { rows } = await pool.query<{ oldest_pending_seconds: number | null }>(`SELECT
      EXTRACT(EPOCH FROM (now() - min(created_on)))::float AS oldest_pending_seconds
      FROM ${QUEUE_SCHEMA}.job WHERE name = $1 AND state IN ('created', 'retry')`, [DIAGNOSTIC_QUEUE]);
    if (!stopping) await writeFile(heartbeatPath, JSON.stringify({ at: Date.now(), oldestPendingSeconds: rows[0]?.oldest_pending_seconds ?? null }));
  } finally { heartbeatRunning = false; }
}

async function bootstrap(): Promise<void> {
  await assertRuntimeReady(pool);
  if (stopping) return;
  await boss.start();
  if (stopping) return;
  await boss.work(DIAGNOSTIC_QUEUE, { pollingIntervalSeconds: 1, batchSize: 1 }, async ([job]) => {
    if (!job || !isDiagnosticPayload(job.data)) throw new Error('Invalid diagnostic payload.');
    // No product writes or external effects. Repeated delivery is harmless.
    return { diagnostic: 'ok' };
  });
  await heartbeat();
  if (stopping) return;
  timer = setInterval(() => {
    if (stopping || heartbeatRunning) return;
    activeHeartbeat = heartbeat().catch(() => {
      console.error('Diagnostic worker readiness failed.');
      void shutdown(true);
    });
  }, 5000);
  console.log('Diagnostic worker ready; no HTTP listener.');
}

process.once('SIGTERM', () => { void shutdown(); });
process.once('SIGINT', () => { void shutdown(); });
const startupDeadline = setTimeout(() => { void shutdown(true); }, 15000);
const startup = bootstrap().catch(() => {
  if (!stopping) {
    console.error('Diagnostic worker startup failed; check database and migrations.');
    process.exitCode = 1;
  }
});
void startup.then(() => {
  clearTimeout(startupDeadline);
  if (process.exitCode === 1) void shutdown(true);
});
