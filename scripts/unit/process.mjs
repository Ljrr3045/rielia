import { spawn } from 'node:child_process';

// A parent deadline kills the complete POSIX process group, including stuck traversal.
// Do not rely on glob's AbortSignal handling. Windows is intentionally unsupported.
export function runProcess(
  command,
  args,
  { cwd, env = process.env, deadline = 120000, maxBytes = 204800, group = false } = {},
) {
  if (process.platform === 'win32')
    throw new Error('Unit coverage requires a POSIX process-tree deadline');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      detached: group,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let size = 0;
    let failure;
    const hasPid = () => Number.isSafeInteger(child.pid) && child.pid > 0;
    function stop(reason) {
      failure ??= reason;
      try {
        if (hasPid()) {
          if (group) process.kill(-child.pid, 'SIGKILL');
          else child.kill('SIGKILL');
        }
      } catch (error) {
        if (error.code !== 'ESRCH') reject(error);
      }
    }
    const timer = setTimeout(() => stop('Process-tree deadline exceeded'), deadline);
    function collect(chunk) {
      size += chunk.length;
      if (size > maxBytes) stop('Bounded process log exceeded');
      else output += chunk.toString('utf8');
    }
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (group && hasPid()) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (error) {
          if (error.code !== 'ESRCH') return reject(error);
        }
      }
      if (failure) reject(new Error(failure));
      else resolve({ code, signal, output });
    });
  });
}
