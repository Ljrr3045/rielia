import { spawn } from 'node:child_process';
import { once } from 'node:events';

export function startProcess(name, args, cwd, env) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ...env },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const entry = { name, child, log: '', stopped: false, error: undefined };
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => { entry.log = (entry.log + chunk.toString()).slice(-16000); });
  }
  child.on('error', (error) => { entry.error = error; });
  return entry;
}

function signal(entry, name) {
  const pid = entry.child.pid;
  if (typeof pid !== 'number') return;
  try {
    if (process.platform === 'win32') entry.child.kill(name);
    else process.kill(-pid, name);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

export async function stopProcess(entry) {
  if (entry.stopped) return;
  entry.stopped = true;
  if (typeof entry.child.pid !== 'number'
    || entry.child.exitCode !== null || entry.child.signalCode !== null) return;
  const exited = once(entry.child, 'exit');
  signal(entry, 'SIGTERM');
  let timer;
  const timedOut = new Promise((resolve) => { timer = setTimeout(() => resolve(true), 5000); });
  if (await Promise.race([exited.then(() => false), timedOut])) {
    signal(entry, 'SIGKILL');
    await exited;
  }
  clearTimeout(timer);
}
