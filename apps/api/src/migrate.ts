import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertIdentitySchema, assertRuntimeReady, databasePool } from './runtime/database.js';
import { diagnosticBoss, installDiagnosticQueue } from './runtime/queue.js';

const abort = new AbortController();
const stop = () => abort.abort();
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
const deadline = setTimeout(() => { stop(); process.exit(1); }, 90000);
const pool = databasePool('rielia-runtime-migrate');
const boss = diagnosticBoss(pool, true);

try {
  // Exactly one deployment process owns migrations. API/worker never run this.
  await promisify(execFile)(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    timeout: 60000, signal: abort.signal, maxBuffer: 1024 * 1024,
  });
  await assertIdentitySchema(pool);
  abort.signal.throwIfAborted();
  await boss.start();
  abort.signal.throwIfAborted();
  await installDiagnosticQueue(boss);
  await assertRuntimeReady(pool);
  console.log('Identity migrations and diagnostic queue are ready.');
} catch {
  console.error('Local migration failed; dependent services must remain stopped. Inspect database and migration history.');
  process.exitCode = 1;
} finally {
  await boss.stop({ graceful: false });
  await pool.end();
  clearTimeout(deadline);
  process.removeListener('SIGTERM', stop);
  process.removeListener('SIGINT', stop);
}
