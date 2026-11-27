import { readFile } from 'node:fs/promises';
import { isWorkerHeartbeatFresh } from './diagnostic-schemas.js';

try {
  const heartbeat: unknown = JSON.parse(
    await readFile('/tmp/rielia-worker-heartbeat.json', 'utf8'),
  );
  if (!isWorkerHeartbeatFresh(heartbeat)) throw new Error('Stale heartbeat.');
} catch {
  process.exitCode = 1;
}
