import { readFile } from 'node:fs/promises';

try {
  const heartbeat: unknown = JSON.parse(await readFile('/tmp/rielia-worker-heartbeat.json', 'utf8'));
  if (typeof heartbeat !== 'object' || heartbeat === null || !('at' in heartbeat)
    || typeof heartbeat.at !== 'number' || Date.now() - heartbeat.at > 20000
    || heartbeat.at > Date.now()) throw new Error('Stale heartbeat.');
} catch { process.exitCode = 1; }
