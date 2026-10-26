import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnostic, fixture } from './helpers.mjs';

test('truncated HTTP fails promptly; an open stalled body reaches the deadline', async (t) => {
  for (const mode of ['length-fin', 'chunked-fin', 'length-reset', 'stalled']) {
    await t.test(mode, async (t) => {
      const { origin } = await fixture(t, (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json', ...(mode.startsWith('length') ? { 'Content-Length': '512' } : {}) });
        res.flushHeaders();
        res.write('{"status":');
        const socket = res.socket;
        if (mode !== 'stalled') setTimeout(() => mode.endsWith('reset') ? socket.destroy() : socket.end(), 20);
      });
      const peer = await diagnostic(t, origin);
      const before = Date.now();
      const { result } = await peer.request('tools/call', { name: 'rielia_health', arguments: {} }).answer;
      const expected = mode === 'stalled' ? 'LIVENESS_TIMEOUT' : 'LIVENESS_UNAVAILABLE';
      assert.deepEqual(result, { isError: true, content: [{ type: 'text', text: expected }] });
      const elapsed = Date.now() - before;
      assert(mode === 'stalled' ? elapsed >= 1900 && elapsed < 4000 : elapsed < 1000);
      t.diagnostic(`${mode}: ${expected} after ${elapsed} ms`);
      await peer.close();
    });
  }
});
