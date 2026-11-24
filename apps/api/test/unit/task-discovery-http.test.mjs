import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProjectTaskHttp } from '../../dist/projects/project-task-http.js';
import { TaskDiscoveryController } from '../../dist/projects/task-discovery.controller.js';

const origin = 'https://app.example.test';
function fixture() {
  const calls = [];
  const context = Object.freeze({ verified: 'authority boundary' });
  const http = new ProjectTaskHttp(
    {
      webContext: async () => {
        calls.push('authority');
        return { context, headers: new globalThis.Headers({ 'set-cookie': 'fictional=renewed' }) };
      },
    },
    { config: { origin } },
  );
  const response = {
    headers: new Map([['X-Request-Id', 'correlation']]),
    setHeader(key, value) {
      this.headers.set(key, value);
    },
    getHeader(key) {
      return this.headers.get(key);
    },
    append(key, value) {
      this.headers.set(key, value);
    },
    json(value) {
      calls.push({ payload: value });
    },
  };
  const controller = new TaskDiscoveryController(
    http,
    {
      page: async (...args) => {
        calls.push({ discovery: args });
        return { canonical: 'page' };
      },
    },
    {
      serve: async (...args) => {
        calls.push({ stream: args });
      },
    },
  );
  const request = (query = {}, patch = {}) => ({
    method: 'GET',
    params: { workspaceId: 'w' },
    headers: {},
    query,
    ...patch,
  });
  return { controller, http, response, calls, context, request };
}
const failure = (status, message) => (error) =>
  error.getStatus() === status && error.message === message;

test('discovery HTTP admission retains raw defaults, separate cursor validation and canonical callback context', async () => {
  for (const params of [
    {},
    { scope: null, q: null, view: undefined, cursor: undefined },
    {
      scope: 'search',
      q: ' Title ',
      view: 'archived',
      project: 'p',
      status: 'done',
      priority: 'high',
      assignee: 'unassigned',
      cursor: 'x'.repeat(2048),
    },
  ]) {
    const f = fixture();
    await f.controller.page('w', f.request(params), f.response);
    const call = f.calls.find((call) => call.discovery).discovery;
    assert.equal(call[0], f.context);
    assert.equal(call[1], 'w');
    assert.equal(call[2].q, params.q ?? '');
    assert.equal(call[2].scope, params.scope ?? 'search');
    assert.equal(call[2].view, params.view ?? 'active');
    assert.equal(call[3], params.cursor);
    assert.equal(f.response.headers.get('Cache-Control'), 'no-store');
    assert.equal(f.response.headers.get('X-Request-Id'), 'correlation');
    assert.equal(f.response.headers.get('Set-Cookie'), 'fictional=renewed');
    assert.deepEqual(f.calls.at(-1), { payload: { canonical: 'page' } });
  }
  for (const params of [
    { view: null },
    { cursor: null },
    { cursor: [] },
    { cursor: '' },
    { cursor: 'bad cursor' },
    { cursor: 'x'.repeat(2049) },
    { scope: ['mine'] },
    { q: '\n' },
    { q: '😀'.repeat(50) + 'a' },
    { project: undefined },
    { scope: 'mine', assignee: 'human' },
    { status: undefined },
    { extra: undefined },
  ]) {
    const f = fixture();
    await assert.rejects(
      f.controller.page('w', f.request(params), f.response),
      failure(400, 'Invalid project/task query.'),
    );
    assert.deepEqual(f.calls, []);
  }
});

test('discovery and event protocol failures preserve header/path/query/body/origin precedence before authority', async () => {
  for (const [patch, mode, status, message] of [
    [
      {
        headers: { 'x-actor-principal-id': 'forged', 'content-length': '1' },
        params: { workspaceId: 'bad id' },
      },
      'discovery',
      400,
      'Execution identity is resolved by the server.',
    ],
    [
      {
        params: { workspaceId: 'bad id' },
        query: { extra: true },
        headers: { 'content-length': '1' },
      },
      'discovery',
      400,
      'Invalid resource identifier.',
    ],
    [
      { query: { cursor: null }, headers: { 'content-length': '1' } },
      'discovery',
      400,
      'Invalid project/task query.',
    ],
    [
      { headers: { 'content-length': '1', origin: 'https://foreign.test' } },
      'events',
      400,
      'Read requests have no payload.',
    ],
    [
      { query: { cursor: 'not-an-event-query' }, headers: { origin: 'https://foreign.test' } },
      'events',
      400,
      'Invalid project/task query.',
    ],
    [{ headers: { origin: 'https://foreign.test' } }, 'events', 403, 'Untrusted stream request.'],
    [{ headers: { 'sec-fetch-site': 'cross-site' } }, 'events', 403, 'Untrusted stream request.'],
    [{ headers: { 'last-event-id': 'x'.repeat(129) } }, 'events', 403, 'Untrusted stream request.'],
  ]) {
    const f = fixture();
    await assert.rejects(
      f.http.respond(f.request({}, patch), f.response, 'w', mode, async () => f.calls.push('work')),
      failure(status, message),
    );
    assert.deepEqual(f.calls, []);
    assert.equal(f.response.headers.get('Cache-Control'), 'no-store');
  }
  const f = fixture();
  const resume = 'opaque_1-Ab';
  await f.controller.stream(
    'w',
    f.request(
      {},
      { headers: { origin, 'sec-fetch-site': 'same-origin', 'last-event-id': resume } },
    ),
    f.response,
  );
  assert.deepEqual(f.calls, ['authority', { stream: [f.context, 'w', f.response, resume] }]);
});
