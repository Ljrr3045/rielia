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
    ['planning', 'configure', 'list', 'get', 'save'].map((name) => [
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
