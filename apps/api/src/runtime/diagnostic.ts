import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { DIAGNOSTIC_QUEUE, assertRuntimeReady, databasePool } from './database.js';
import { diagnosticBoss, diagnosticPayload, isDiagnosticPayload } from './queue.js';

const [action, argument, ...extra] = process.argv.slice(2);
const id = (argument ?? (action === 'enqueue' ? randomUUID() : '')).toLowerCase();
const pool = databasePool('rielia-runtime-diagnostic');
const boss = diagnosticBoss(pool);
const abort = new AbortController();
const stop = () => abort.abort();
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
const deadlineTimer = setTimeout(() => { stop(); process.exit(1); }, 45000);

try {
  if (!['enqueue', 'status', 'wait'].includes(action ?? '') || extra.length || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid diagnostic command.');
  }
  await assertRuntimeReady(pool);
  await boss.start();
  abort.signal.throwIfAborted();
  if (action === 'enqueue') {
    const created = await boss.send(DIAGNOSTIC_QUEUE, diagnosticPayload, { id });
    if (created !== id) throw new Error('Diagnostic enqueue was not accepted.');
    console.log(JSON.stringify({ id, state: 'created' }));
  } else {
    const deadline = Date.now() + 30000;
    for (;;) {
      abort.signal.throwIfAborted();
      const job = await boss.getJobById(DIAGNOSTIC_QUEUE, id);
      if (!job || !isDiagnosticPayload(job.data)) throw new Error('Diagnostic job is unavailable.');
      if (action === 'status' || job.state === 'completed') {
        console.log(JSON.stringify({ id, state: job.state, output: job.state === 'completed' ? job.output : null }));
        break;
      }
      if (job.state === 'failed' || Date.now() >= deadline) throw new Error('Diagnostic consumption failed or timed out.');
      await delay(250, undefined, { signal: abort.signal });
    }
  }
} catch {
  console.error('Diagnostic command failed. Usage: enqueue [UUIDv4] | status UUIDv4 | wait UUIDv4; check local migrations and database.');
  process.exitCode = 1;
} finally {
  await boss.stop({ graceful: false });
  await pool.end();
  clearTimeout(deadlineTimer);
  process.removeListener('SIGTERM', stop);
  process.removeListener('SIGINT', stop);
}
