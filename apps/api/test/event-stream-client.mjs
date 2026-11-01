import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { TextDecoder } from 'node:util';
import { isTaskInvalidation } from '@rielia/contracts';

export async function openEventStream(baseURL, workspaceId, cookie, resume) {
  const abort = new AbortController(); const response = await fetch(`${baseURL}/api/v1/workspaces/${workspaceId}/events`, { headers: { cookie, ...(resume ? { 'last-event-id': resume } : {}) }, signal: abort.signal });
  assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /^text\/event-stream/); assert.equal(response.headers.get('x-accel-buffering'), 'no');
  const reader = response.body.getReader(); let buffer = ''; const records = []; let ended = false;
  const reading = (async () => { try { while (true) { const value = await reader.read(); if (value.done) break; buffer += new TextDecoder().decode(value.value); let end; while ((end = buffer.indexOf('\n\n')) >= 0) { const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2); const raw = frame.split('\n').find(line => line.startsWith('data: ')); if (raw) { const data = JSON.parse(raw.slice(6)); assert.ok(isTaskInvalidation(data)); records.push({ data, id: frame.split('\n').find(line => line.startsWith('id: '))?.slice(4) }); } } } } catch (error) { if (!abort.signal.aborted) throw error; } finally { ended = true; } })();
  async function wait(predicate, timeout = 7000) { const end = Date.now() + timeout; while (Date.now() < end) { const found = records.find(predicate); if (found) return found; await delay(20); } assert.fail('Expected stream event was not delivered.'); }
  return { records, wait, get ended() { return ended; }, async close() { abort.abort(); await reading; } };
}
