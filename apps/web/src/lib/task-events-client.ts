import { isTaskInvalidation, type TaskInvalidation } from '@rielia/contracts';
export type TaskStreamStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline' | 'signed-out' | 'forbidden';
/** One session/workspace, bounded retry and parser memory, no durable storage. */
export function connectTaskEvents(options: { workspaceId: string; onEvent: (event: TaskInvalidation) => void; onStatus: (status: TaskStreamStatus) => void;
  baseURL?: string; fetch?: typeof fetch; retryDelays?: readonly number[]; idleTimeout?: number }) {
  const abort = new AbortController(); let cursor: string | null = null; let stopped = false;
  const delays = options.retryDelays ?? [1000, 2000, 4000, 8000, 15000];
  const sleep = (ms: number) => new Promise<void>(resolve => { if (abort.signal.aborted) { resolve(); return; } const done = () => { clearTimeout(timer); abort.signal.removeEventListener('abort', done); resolve(); }; const timer = setTimeout(done, ms); abort.signal.addEventListener('abort', done, { once: true }); });
  async function run() {
    let failures = 0;
    while (!stopped) {
      options.onStatus(failures ? 'reconnecting' : 'connecting');
      const connection = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
      const watchdog = () => { clearTimeout(timer); timer = setTimeout(() => connection.abort(), options.idleTimeout ?? 35000); };
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined; const started = Date.now();
      try {
        watchdog();
        const path = `/api/v1/workspaces/${encodeURIComponent(options.workspaceId)}/events`;
        const response = await (options.fetch ?? fetch)(options.baseURL ? new URL(path, options.baseURL) : path, { cache: 'no-store', redirect: 'error', credentials: 'same-origin',
          headers: { Accept: 'text/event-stream', ...(cursor ? { 'Last-Event-ID': cursor } : {}) }, signal: AbortSignal.any([abort.signal, connection.signal]) });
        if (stopped) { await response.body?.cancel(); return; }
        if ([401, 403].includes(response.status)) { options.onStatus(response.status === 401 ? 'signed-out' : 'forbidden'); options.onEvent({ type: 'denied', reason: response.status === 401 ? 'signed-out' : 'forbidden' }); await response.body?.cancel(); return; }
        if (!response.ok || !response.headers.get('content-type')?.startsWith('text/event-stream') || !response.body) { await response.body?.cancel(); throw new Error('Stream unavailable.'); }
        reader = response.body.getReader(); options.onStatus('live'); options.onEvent({ type: 'reset' });
        const decoder = new TextDecoder('utf-8', { fatal: true }); let buffer = ''; let frame: string[] = [];
        while (!stopped) {
          const value = await reader.read(); if (value.done || stopped) break; watchdog(); buffer += decoder.decode(value.value, { stream: true });
          if (buffer.length > 65536) throw new Error('Oversized stream chunk.');
          let end: number;
          while ((end = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, end).replace(/\r$/, ''); buffer = buffer.slice(end + 1);
            if (line) { frame.push(line); if (frame.join('\n').length > 4096) throw new Error('Oversized stream frame.'); continue; }
            if (!frame.length) continue;
            const data = frame.filter(row => row.startsWith('data:')).map(row => row.slice(5).trimStart()).join('\n');
            const event = frame.find(row => row.startsWith('event:'))?.slice(6).trim(); const id = frame.find(row => row.startsWith('id:'))?.slice(3).trim(); frame = [];
            if (!data || event !== 'update') continue;
            const parsed: unknown = JSON.parse(data); if (!isTaskInvalidation(parsed) || id !== undefined && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid stream event.');
            if (id) cursor = id;
            options.onEvent(parsed); if (parsed.type === 'denied') { options.onStatus(parsed.reason); return; }
          }
          if (buffer.length > 4096) throw new Error('Oversized stream line.');
        }
        if (Date.now() - started >= 15000) failures = 0;
      } catch { /* Network/parser failure follows bounded recovery. */ }
      finally { clearTimeout(timer); connection.abort(); try { await reader?.cancel(); } catch { /* Socket already closed. */ } }
      if (stopped) return;
      if (failures >= delays.length) { options.onStatus('offline'); return; }
      options.onStatus('reconnecting'); await sleep(delays[failures++]!);
    }
  }
  void run();
  return () => { stopped = true; cursor = null; abort.abort(); };
}
