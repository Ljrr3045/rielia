import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContractRequest } from '../../src/lib/api-contract-client.ts';

const planning = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/planning';
const sprints = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints';
const detail = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}';
const path = { workspaceId: 'w', projectId: 'p' };
const body = { expectedVersion: 2, mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 2] };
const signal = () => new AbortController().signal;

test('contract HTTP construction preserves native fetch defaults, scalar encoding and unread response identity', async (t) => {
  const response = new Response('{"unvalidated":true}', { headers: { 'x-request-id': 'raw-id' } });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return response;
  });
  const request = createContractRequest();
  assert.strictEqual(
    await request('get', detail, {
      path: { workspaceId: 'w/% 😀', projectId: 'p/子 ?', sprintId: 's/% ß' },
      signal: signal(),
    }),
    response,
  );
  assert.equal(
    calls[0].url,
    '/api/v1/workspaces/w%2F%25%20%F0%9F%98%80/projects/p%2F%E5%AD%90%20%3F/sprints/s%2F%25%20%C3%9F',
  );
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.headers, undefined);
  assert.equal(response.bodyUsed, false);
  assert.equal(response.headers.get('x-request-id'), 'raw-id');
  assert.deepEqual(await response.json(), { unvalidated: true });
  assert.equal(calls.length, 1);
});

test('contract HTTP keeps cursor omission distinct from an empty supplied cursor and encodes only once', async () => {
  const calls = [];
  const request = createContractRequest({
    fetch: async (url) => {
      calls.push(String(url));
      return new Response('{}');
    },
  });
  for (const [query, suffix] of [
    [undefined, ''],
    [{}, ''],
    [{ cursor: undefined }, ''],
    [{ cursor: '' }, '?cursor='],
    [{ cursor: 'a/% 子' }, '?cursor=a%2F%25%20%E5%AD%90'],
  ]) {
    await request('get', sprints, {
      path,
      signal: signal(),
      ...(query === undefined ? {} : { query }),
    });
    assert.equal(calls.at(-1), '/api/v1/workspaces/w/projects/p/sprints' + suffix);
  }
  // cursor:undefined above is a JavaScript robustness case; strict callers omit the property.
  assert.equal(calls.length, 5);
});

test('contract writes preserve captured JSON bytes/key and absolute-base path reset without editable browser headers', async () => {
  const calls = [];
  const request = createContractRequest({
    baseURL: 'https://app.example.test/discarded',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{}', { status: 201 });
    },
  });
  await request('post', planning, { path, body, key: 'original-key', signal: signal() });
  assert.equal(calls[0].url, 'https://app.example.test/api/v1/workspaces/w/projects/p/planning');
  assert.equal(
    calls[0].init.body,
    '{"expectedVersion":2,"mode":"scrum","timeZone":"UTC","pointScale":[0,1,2]}',
  );
  assert.deepEqual(calls[0].init.headers, {
    'Content-Type': 'application/json',
    'Idempotency-Key': 'original-key',
  });
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls.length, 1);
});

test('contract HTTP never parses, clones or narrows raw success/error/empty bodies', async () => {
  for (const [status, text] of [
    [200, 'broken'],
    [201, '{}'],
    [202, '{}'],
    [204, null],
    [409, '{"code":"conflict","current":{"unvalidated":true}}'],
    [503, 'broken'],
  ]) {
    const response = new Response(text, {
      status,
      headers: { 'x-request-id': 'raw-id', 'content-length': '0' },
    });
    let reads = 0;
    let clones = 0;
    let sends = 0;
    const json = response.json.bind(response);
    response.json = () => {
      reads++;
      return json();
    };
    response.clone = () => {
      clones++;
      throw new Error('Unexpected clone');
    };
    const request = createContractRequest({
      fetch: async () => {
        sends++;
        return response;
      },
    });
    const result = await request('get', planning, { path, signal: signal() });
    assert.strictEqual(result, response);
    assert.equal(result.status, status);
    assert.equal(result.headers.get('x-request-id'), 'raw-id');
    assert.equal(result.bodyUsed, false);
    assert.equal(reads, 0);
    assert.equal(clones, 0);
    assert.equal(sends, 1);
  }
});

test('contract HTTP preserves network error identity and never invents or retries a missing captured key', async () => {
  let calls = 0;
  const error = new Error('Lost network response');
  const request = createContractRequest({
    fetch: async () => {
      calls++;
      throw error;
    },
  });
  await assert.rejects(
    request('post', planning, { path, body, key: 'original-key', signal: signal() }),
    (value) => value === error,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    request('post', planning, { path, body, signal: signal() }),
    /captured idempotency key/,
  );
  assert.equal(calls, 1);
});

test('contract HTTP retains caller/default or configured deadline signals through caller body consumption', async (t) => {
  const deadlines = [];
  t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
    const controller = new AbortController();
    deadlines.push({ milliseconds, controller });
    return controller.signal;
  });
  for (const reason of ['caller', 'deadline']) {
    const caller = new AbortController();
    let cleanup = 0;
    let calls = 0;
    const request = createContractRequest({
      ...(reason === 'deadline' ? { timeout: 25 } : {}),
      fetch: async (_url, init) => {
        calls++;
        return new Response(
          new globalThis.ReadableStream({
            start(controller) {
              const abort = () => {
                init.signal.removeEventListener('abort', abort);
                cleanup++;
                controller.error(new Error('body aborted'));
              };
              init.signal.addEventListener('abort', abort, { once: true });
            },
          }),
        );
      },
    });
    const response = await request('get', planning, { path, signal: caller.signal });
    assert.equal(response.bodyUsed, false);
    assert.equal(deadlines.at(-1).milliseconds, reason === 'caller' ? 15000 : 25);
    const rejected = assert.rejects(response.json(), /body aborted/);
    if (reason === 'caller') caller.abort();
    else deadlines.at(-1).controller.abort();
    await rejected;
    assert.equal(calls, 1);
    assert.equal(cleanup, 1);
  }
});
