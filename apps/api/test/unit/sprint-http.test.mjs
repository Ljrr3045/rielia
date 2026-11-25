import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { SprintController } from '../../dist/projects/sprint.controller.js';
import { SprintService } from '../../dist/projects/sprint.service.js';
import { ProjectTaskHttp } from '../../dist/projects/project-task-http.js';

const origin = 'https://app.example.test';
const context = Object.freeze({
  boundary: 'runtime verified execution, supplied by authority owner',
});
function fixture(options = {}) {
  const calls = [];
  const result = { implemented: 'planning result' };
  const service = Object.fromEntries(
    [
      'planning',
      'configure',
      'list',
      'get',
      'save',
      'closePreview',
      'close',
      'closure',
      'outcomes',
    ].map((name) => [
      name,
      async (...args) => {
        calls.push({ name, args });
        return result;
      },
    ]),
  );
  let authorities = 0;
  const http = new ProjectTaskHttp(
    {
      webContext: async (headers, w) => {
        authorities++;
        assert.equal(w, 'w');
        assert.equal(headers.cookie, 'fictional-cookie');
        if (options.denied) throw new UnauthorizedException('Authentication required.');
        return {
          context,
          headers: new globalThis.Headers({
            'set-cookie': 'fictional-renewal=1; HttpOnly; Secure',
          }),
        };
      },
    },
    { config: { origin } },
  );
  const response = {
    headers: new Map(),
    payload: null,
    setHeader(name, value) {
      this.headers.set(name, value);
    },
    getHeader(name) {
      return this.headers.get(name);
    },
    append(name, value) {
      this.headers.set(name, value);
    },
    json(value) {
      this.payload = value;
    },
  };
  const request = (method = 'GET', patch = {}) => ({
    method,
    params: { workspaceId: 'w', projectId: 'p' },
    query: {},
    headers: {
      cookie: 'fictional-cookie',
      ...(method === 'GET'
        ? {}
        : { origin, 'content-type': 'application/json', 'idempotency-key': 'original-key' }),
    },
    body: { expectedVersion: 3 },
    ...patch,
  });
  return {
    controller: new SprintController(service, http),
    response,
    request,
    http,
    calls,
    result,
    authorities: () => authorities,
  };
}
test('planned sprint routes preserve current context, target, request correlation, renewal and exact submitted body/key', async () => {
  assert.deepEqual(Reflect.getMetadata('design:paramtypes', SprintController), [
    SprintService,
    ProjectTaskHttp,
  ]);
  for (const [route, method, name, hasSprint] of [
    ['planning', 'GET', 'planning', false],
    ['configure', 'POST', 'configure', false],
    ['list', 'GET', 'list', false],
    ['get', 'GET', 'get', true],
    ['create', 'POST', 'save', false],
    ['edit', 'POST', 'save', true],
  ]) {
    const f = fixture(),
      req = f.request(method);
    if (route === 'list') req.query = { cursor: 'cursor' };
    await f.controller[route]('w', 'p', ...(hasSprint ? ['s'] : []), req, f.response);
    assert.equal(f.authorities(), 1);
    assert.equal(f.calls.length, 1);
    const call = f.calls[0];
    assert.equal(call.name, name);
    assert.equal(call.args[0], context);
    assert.deepEqual(call.args.slice(1, 3), ['w', 'p']);
    if (method === 'POST') {
      assert.equal(call.args[3], 'original-key');
      assert.match(call.args[4], /^[0-9a-f-]{36}$/);
      assert.equal(call.args[5], req.body);
      if (hasSprint) assert.equal(call.args[6], 's');
    } else if (route === 'get') assert.equal(call.args[3], 's');
    else if (route === 'list') assert.equal(call.args[3], 'cursor');
    assert.equal(f.response.payload, f.result);
    assert.equal(f.response.headers.get('Cache-Control'), 'no-store');
    assert.match(f.response.headers.get('X-Request-Id'), /^[0-9a-f-]{36}$/);
    assert.equal(f.response.headers.get('Set-Cookie'), 'fictional-renewal=1; HttpOnly; Secure');
  }
});
test('HTTP planning boundary rejects spoofed/unknown/repeated/non-scalar input before domain access', async () => {
  for (const patch of [
    { query: { view: 'active' } },
    { query: { cursor: ['a', 'b'] } },
    { query: { cursor: '!' } },
    { query: { cursor: 'x'.repeat(2049) } },
    { params: { workspaceId: 'w', projectId: 'foreign/id' } },
    { headers: { cookie: 'fictional-cookie', 'x-rielia-execution-mode': 'autonomous' } },
    { headers: { cookie: 'fictional-cookie', 'content-length': '1' } },
    { headers: { cookie: 'fictional-cookie', 'transfer-encoding': 'chunked' } },
  ]) {
    const f = fixture();
    await assert.rejects(
      f.controller.list('w', 'p', f.request('GET', patch), f.response),
      (error) => error.getStatus() === 400,
    );
    assert.equal(f.authorities(), 0);
    assert.deepEqual(f.calls, []);
    assert.equal(f.response.payload, null);
  }
  const f = fixture();
  await f.controller.list(
    'w',
    'p',
    f.request('GET', {
      query: { cursor: 'a'.repeat(2048) },
      headers: { cookie: 'fictional-cookie', 'content-length': '0' },
    }),
    f.response,
  );
  assert.equal(f.calls[0].args[3].length, 2048);
});
test('planning sidecar query schemas reject before authority and retain inherited cursor admission', async () => {
  for (const mode of ['planning-empty', 'planning-page']) {
    for (const query of [
      { view: 'active' },
      { cursor: ['one'] },
      { cursor: '!' },
      { actor: 'forged' },
    ]) {
      const f = fixture();
      await assert.rejects(
        f.http.respond(f.request('GET', { query }), f.response, 'w', mode, async () => {
          throw new Error('domain must not run');
        }),
        (error) => error.getStatus() === 400 && error.message === 'Invalid project/task query.',
      );
      assert.equal(f.authorities(), 0);
    }
    const f = fixture();
    const cursor = 'a'.repeat(mode === 'planning-empty' ? 128 : 2048);
    const query = Object.create({ cursor, view: 'active', destination: 'target', status: 'todo' });
    await f.http.respond(
      f.request('GET', { query }),
      f.response,
      'w',
      mode,
      async (c, _id, view, received) => {
        assert.equal(c, context);
        assert.equal(view, 'active');
        assert.equal(received, cursor);
        return 'ok';
      },
    );
    assert.equal(f.authorities(), 1);
    assert.equal(f.response.payload, 'ok');
  }
});
test('mutation origin/JSON/key and current session denial cannot invoke planning service', async () => {
  for (const [headers, status] of [
    [{ origin: 'https://hostile.example' }, 403],
    [{ 'sec-fetch-site': 'cross-site' }, 403],
    [{ 'content-type': 'text/plain' }, 400],
    [{ 'idempotency-key': undefined }, 400],
  ]) {
    const f = fixture(),
      req = f.request('POST');
    Object.assign(req.headers, headers);
    await assert.rejects(
      f.controller.create('w', 'p', req, f.response),
      (error) => error.getStatus() === status,
    );
    assert.equal(f.authorities(), 0);
    assert.deepEqual(f.calls, []);
  }
  const f = fixture({ denied: true });
  await assert.rejects(
    f.controller.get('w', 'p', 's', f.request(), f.response),
    (error) => error.getStatus() === 401,
  );
  assert.equal(f.authorities(), 1);
  assert.equal(f.response.payload, null);
  assert.deepEqual(f.calls, []);
});
test('close preview permits only scalar destination/cursor and forwards them after current authority', async () => {
  const f = fixture();
  let received;
  await f.http.respond(
    f.request('GET', { query: { destination: 'backlog', cursor: 'a'.repeat(2048) } }),
    f.response,
    'w',
    'close-preview',
    async (...args) => {
      received = args;
      return {};
    },
  );
  assert.equal(received[3].length, 2048);
  assert.equal(received[5], 'backlog');
  for (const query of [
    { destination: ['backlog', 'target'] },
    { destination: '' },
    { destination: '../bad' },
    { cursor: ['a', 'b'] },
    { actor: 'spoof' },
    { view: 'active' },
  ]) {
    const x = fixture();
    await assert.rejects(
      x.http.respond(x.request('GET', { query }), x.response, 'w', 'close-preview', async () => {}),
      (e) => e.getStatus() === 400,
    );
    assert.equal(x.authorities(), 0);
  }
});

test('closure controllers preserve query admission before authority and original body forwarding', async () => {
  for (const [route, method, query] of [
    ['closePreview', 'GET', { destination: 'backlog', cursor: 'a'.repeat(2048) }],
    ['close', 'POST', {}],
    ['closure', 'GET', {}],
    ['outcomes', 'GET', { cursor: 'a'.repeat(2048) }],
  ]) {
    const f = fixture();
    const request = f.request(method, { query });
    await f.controller[route]('w', 'p', 's', request, f.response);
    assert.equal(f.calls[0].name, route);
    assert.equal(f.calls[0].args[0], context);
    assert.deepEqual(f.calls[0].args.slice(1, 4), ['w', 'p', 's']);
    assert.equal(f.authorities(), 1);
    assert.equal(f.response.payload, f.result);
    if (route === 'close') {
      assert.equal(f.calls[0].args[4], 'original-key');
      assert.equal(f.calls[0].args[6], request.body);
    }
    for (const badQuery of [{ view: 'active' }, { cursor: ['a'] }, { author: 'forged' }]) {
      const denied = fixture();
      await assert.rejects(
        denied.controller[route](
          'w',
          'p',
          's',
          denied.request(method, { query: badQuery }),
          denied.response,
        ),
        (error) => error.getStatus() === 400 && error.message === 'Invalid project/task query.',
      );
      assert.equal(denied.authorities(), 0);
    }
  }
  for (const mode of ['closure-empty', 'closure-page', 'close-preview']) {
    const f = fixture();
    const query = Object.create({
      cursor: 'inherited',
      destination: 'target',
      view: 'active',
      status: 'todo',
    });
    let forwarded;
    await f.http.respond(f.request('GET', { query }), f.response, 'w', mode, async (...args) => {
      forwarded = args;
      return f.result;
    });
    assert.equal(forwarded[3], 'inherited');
    assert.equal(forwarded[5], 'target');
    assert.equal(f.authorities(), 1);
  }
});

test('remaining HTTP fallback validates inherited destination before authority and body checks', async () => {
  for (const mode of [false, 'sprints', 'events']) {
    const valid = fixture();
    let received;
    await valid.http.respond(
      valid.request('GET', { query: Object.create({ destination: 'target' }) }),
      valid.response,
      'w',
      mode,
      async (...args) => {
        received = args;
        return valid.result;
      },
    );
    assert.equal(valid.authorities(), 1);
    assert.equal(received[5], 'target');
    for (const destination of ['../bad', ['target'], null]) {
      const f = fixture();
      await assert.rejects(
        f.http.respond(
          f.request('GET', {
            query: Object.create({ destination }),
            headers: { 'content-length': '1' },
          }),
          f.response,
          'w',
          mode,
          async () => {
            throw new Error('handler must not run');
          },
        ),
        (error) => error.getStatus() === 400 && error.message === 'Invalid project/task query.',
      );
      assert.equal(f.authorities(), 0);
    }
    const spoofed = fixture();
    await assert.rejects(
      spoofed.http.respond(
        spoofed.request('GET', {
          query: Object.create({ destination: '../bad' }),
          headers: { 'x-actor-principal-id': 'forged' },
        }),
        spoofed.response,
        'w',
        mode,
        async () => {},
      ),
      (error) =>
        error.getStatus() === 400 &&
        error.message === 'Execution identity is resolved by the server.',
    );
    assert.equal(spoofed.authorities(), 0);
  }
});
