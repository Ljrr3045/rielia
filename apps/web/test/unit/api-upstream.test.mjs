import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiUpstream } from '../../src/lib/server/api-upstream.ts';
import { proxyIdentity } from '../../src/lib/identity-proxy.ts';
import { proxyWorkspace } from '../../src/lib/workspace-proxy.ts';
import { proxyProjectTask } from '../../src/lib/project-task-proxy.ts';

function upstream(t, value) {
  const previous = process.env.API_BASE_URL;
  if (value === undefined) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = value;
  t.after(() => {
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
}

test('server upstream keeps native resolution and reads operator configuration per call', (t) => {
  upstream(t, undefined);
  assert.equal(apiUpstream('/api/v1/health').href, 'http://127.0.0.1:3001/api/v1/health');
  for (const [base, expected] of [
    [
      ' HTTPS://API.EXAMPLE.TEST:443/root?ignored=1#old ',
      'https://api.example.test/api/v1/health?x=1&x=2',
    ],
    ['http://api:3001/root', 'http://api:3001/api/v1/health?x=1&x=2'],
    [
      'https://unit:fictional@api.example.test',
      'https://unit:fictional@api.example.test/api/v1/health?x=1&x=2',
    ],
    ['file:///tmp/base', 'file:///api/v1/health?x=1&x=2'],
    ['ftp://api.example.test/root', 'ftp://api.example.test/api/v1/health?x=1&x=2'],
  ]) {
    process.env.API_BASE_URL = base;
    assert.equal(apiUpstream('/api/v1/health?x=1&x=2').href, expected);
  }
  for (const value of ['', 'bad', 'about:blank']) {
    process.env.API_BASE_URL = value;
    assert.throws(() => apiUpstream('/api/v1/health'), TypeError);
  }
});

test('proxy-specific rejection and sanitized failures precede or contain invalid configuration', async (t) => {
  upstream(t, 'fictional-private-invalid-base');
  const fetch = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('Fetch must not run.');
  });
  for (const [proxy, path, status, message] of [
    [proxyWorkspace, '/api/v1/workspaces/invalid/path', 400, 'Workspace request unavailable.'],
    [
      proxyProjectTask,
      '/api/v1/workspaces/w/projects?p=bad',
      400,
      'Project/task request unavailable.',
    ],
    [proxyWorkspace, '/api/v1/workspaces', 503, 'Workspace request unavailable.'],
    [proxyProjectTask, '/api/v1/workspaces/w/projects', 503, 'Project/task request unavailable.'],
    [proxyIdentity, '/api/auth/get-session', 503, 'Identity API is unavailable. Try again.'],
  ]) {
    const response = await proxy(new Request(`https://app.example.test${path}`));
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { message });
  }
  const denied = await proxyProjectTask(
    new Request('https://app.example.test/api/v1/workspaces/w/events', {
      headers: { origin: 'https://hostile.example.test' },
    }),
  );
  assert.equal(denied.status, 403);
  assert.equal(fetch.mock.callCount(), 0);
});

test('browser host and forwarding values cannot select the shared configured upstream', async (t) => {
  upstream(t, 'https://fixed-api.example.test/base');
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url.href);
    return Response.json({ status: 'ok' });
  });
  for (const [proxy, path] of [
    [proxyIdentity, '/api/auth/get-session'],
    [proxyWorkspace, '/api/v1/workspaces'],
    [proxyProjectTask, '/api/v1/workspaces/w/projects'],
  ]) {
    const response = await proxy(
      new Request(`https://browser.example.test${path}`, {
        headers: {
          host: 'other.example.test',
          'x-forwarded-host': 'other.example.test',
          'x-api-base-url': 'https://other.example.test',
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(calls.at(-1), `https://fixed-api.example.test${path}`);
  }
});
