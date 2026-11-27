import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkspaceTransport, WorkspaceFailure } from '../../src/lib/workspace-client.ts';
import { proxyIdentity } from '../../src/lib/identity-proxy.ts';
import { proxyWorkspace } from '../../src/lib/workspace-proxy.ts';
import {
  parseIdentityConfiguration,
  parseIdentitySession,
} from '../../src/lib/identity-controller.ts';

const summary = {
  id: 'workspace',
  name: 'Workspace',
  ownerPrincipalId: 'human',
  role: 'owner',
  createdAt: '2026-01-01',
  extra: true,
};
const member = {
  principalId: 'human',
  kind: 'human',
  name: 'Human',
  role: 'member',
  state: 'active',
  principalState: 'active',
  custodianPrincipalId: null,
  version: 1,
  extra: true,
};
const invitation = {
  id: 'invitation',
  workspaceId: 'workspace',
  recipientEmail: 'a@b.co',
  role: 'viewer',
  issuerPrincipalId: 'human',
  createdAt: '2026-01-01',
  expiresAt: '2026-01-02',
  state: 'pending',
  extra: true,
};
const token = 'a'.repeat(43);
const signal = new AbortController().signal;
const failure =
  (status, code = null) =>
  (error) =>
    error instanceof WorkspaceFailure && error.status === status && error.code === code;
function fixture(t) {
  const replies = [];
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), ...init });
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return reply;
  });
  return { transport: createWorkspaceTransport(), calls, replies };
}
test('workspace transports retain command bodies, keys, scopes and loose successful outputs', async (t) => {
  const f = fixture(t);
  const cases = [
    [{ type: 'create-workspace', name: 'Name' }, summary, 'workspaces', { name: 'Name' }],
    [{ type: 'accept-invitation', token }, summary, 'workspace-invitations/accept', { token }],
    [
      { type: 'invite', workspaceId: 'workspace', recipientEmail: 'a@b.co', role: 'viewer' },
      { invitation, token, extra: 'drop' },
      'workspaces/workspace/invitations',
      { recipientEmail: 'a@b.co', role: 'viewer' },
    ],
    [
      { type: 'revoke-invitation', workspaceId: 'workspace', invitationId: 'invitation' },
      invitation,
      'workspaces/workspace/invitations/invitation/revoke',
      {},
    ],
    [
      {
        type: 'register-agent',
        workspaceId: 'workspace',
        name: 'Agent',
        role: 'viewer',
        custodianPrincipalId: 'human',
      },
      member,
      'workspaces/workspace/agents',
      { name: 'Agent', role: 'viewer', custodianPrincipalId: 'human' },
    ],
    [
      {
        type: 'update-member',
        workspaceId: 'workspace',
        principalId: 'human',
        version: 1,
        role: 'viewer',
      },
      member,
      'workspaces/workspace/members/human',
      { version: 1, role: 'viewer' },
    ],
    [
      {
        type: 'manage-agent',
        workspaceId: 'workspace',
        principalId: 'human',
        version: 1,
        state: 'suspended',
        custodianPrincipalId: 'other',
      },
      member,
      'workspaces/workspace/agents/human',
      { version: 1, state: 'suspended', custodianPrincipalId: 'other' },
    ],
  ];
  for (const [command, reply, path, body] of cases) {
    f.replies.push(Response.json(reply));
    const result = await f.transport.mutate(command, 'original-key', signal);
    assert.deepEqual(result, command.type === 'invite' ? { invitation, token } : reply);
    const call = f.calls.at(-1);
    assert.equal(call.url, '/api/v1/' + path);
    assert.equal(call.method, 'POST');
    assert.equal(call.headers['Idempotency-Key'], 'original-key');
    assert.equal(call.body, JSON.stringify(body));
    assert.equal(call.credentials, 'same-origin');
    assert.equal(call.cache, 'no-store');
    assert.equal(call.redirect, 'error');
  }
  for (const method of ['workspaces', 'members', 'invitations']) {
    const row = method === 'workspaces' ? summary : method === 'members' ? member : invitation;
    const page = { items: [row], total: 1, nextCursor: 'cursor', extra: true };
    f.replies.push(Response.json(page));
    assert.deepEqual(
      await (method === 'workspaces'
        ? f.transport[method](signal, 'a b')
        : f.transport[method]('workspace', signal, 'a b')),
      page,
    );
    assert.ok(f.calls.at(-1).url.endsWith('?cursor=a%20b'));
  }
  f.replies.push(Response.json(summary));
  assert.deepEqual(await f.transport.detail('workspace', signal), summary);
});
test('workspace command-specific target checks and malformed envelopes fail with 502', async (t) => {
  const f = fixture(t);
  const invite = {
    type: 'invite',
    workspaceId: 'workspace',
    recipientEmail: 'a@b.co',
    role: 'viewer',
  };
  const revoke = {
    type: 'revoke-invitation',
    workspaceId: 'workspace',
    invitationId: 'invitation',
  };
  for (const [command, reply] of [
    [invite, { invitation, token: 'short' }],
    [invite, { invitation: { ...invitation, workspaceId: 'foreign' }, token }],
    [revoke, { ...invitation, id: 'foreign' }],
    [revoke, { ...invitation, workspaceId: 'foreign' }],
    [
      {
        type: 'manage-agent',
        workspaceId: 'workspace',
        principalId: 'human',
        version: 1,
        state: 'active',
      },
      { ...member, principalId: 'other' },
    ],
    [
      {
        type: 'update-member',
        workspaceId: 'workspace',
        principalId: 'human',
        version: 1,
        role: 'viewer',
      },
      { ...member, kind: ['human'] },
    ],
    [{ type: 'create-workspace', name: 'Name' }, {}],
    [
      {
        type: 'register-agent',
        workspaceId: 'workspace',
        name: 'Agent',
        role: 'viewer',
        custodianPrincipalId: 'human',
      },
      {},
    ],
  ]) {
    f.replies.push(Response.json(reply));
    await assert.rejects(f.transport.mutate(command, 'key', signal), failure(502));
  }
  f.replies.push(Response.json({ ...summary, id: 'foreign' }));
  await assert.rejects(f.transport.detail('workspace', signal), failure(502));
  f.replies.push(Response.json({ items: [summary], total: 0, nextCursor: null }));
  await assert.rejects(f.transport.workspaces(signal), failure(502));
});
test('HTTP status/string-code and JSON parse precedence survive failed and unknown responses', async (t) => {
  const f = fixture(t);
  for (const code of ['invitation-link-unavailable', '', 'unknown']) {
    f.replies.push(Response.json({ code }, { status: 409 }));
    await assert.rejects(f.transport.detail('workspace', signal), failure(409, code));
  }
  for (const body of [null, {}, [], { code: 1 }]) {
    f.replies.push(Response.json(body, { status: 403 }));
    await assert.rejects(f.transport.workspaces(signal), failure(403));
  }
  f.replies.push(new Response('not json', { status: 401 }));
  await assert.rejects(f.transport.workspaces(signal), SyntaxError);
  const network = new Error('uncertain write');
  f.replies.push(network);
  await assert.rejects(
    f.transport.mutate({ type: 'create-workspace', name: 'Name' }, 'same-key', signal),
    (error) => error === network,
  );
  assert.equal(f.replies.length, 0);
});

test('workspace reads preserve truthy cursor omission, any-ok JSON and raw body cancellation', async (t) => {
  const f = fixture(t);
  for (const cursor of [undefined, '']) {
    f.replies.push(
      Response.json(
        { items: [summary], total: 1, nextCursor: null },
        { status: 202, headers: { 'content-type': 'text/plain' } },
      ),
    );
    await f.transport.workspaces(signal, cursor);
    assert.equal(f.calls.at(-1).url, '/api/v1/workspaces');
  }
  f.replies.push(new Response(null, { status: 204 }));
  await assert.rejects(f.transport.detail('workspace', signal), SyntaxError);
  const caller = new AbortController();
  const bodyError = new Error('cancelled body');
  let admitted;
  const headersSeen = new Promise((resolve) => {
    admitted = resolve;
  });
  t.mock.method(
    globalThis,
    'fetch',
    async (_url, init) =>
      new Response(
        new globalThis.ReadableStream({
          start(controller) {
            const abort = () => {
              init.signal.removeEventListener('abort', abort);
              controller.error(bodyError);
            };
            init.signal.addEventListener('abort', abort, { once: true });
            admitted();
          },
        }),
        { status: 201, headers: { 'x-request-id': 'not-a-workspace-field' } },
      ),
  );
  const pending = f.transport.detail('workspace', caller.signal);
  await headersSeen;
  caller.abort();
  await assert.rejects(pending, (error) => error === bodyError);
});
test('identity parser facades retain exact errors, projections, provider order and nullable session', () => {
  assert.deepEqual(
    parseIdentityConfiguration({
      enabled: true,
      providers: ['github', 'google', 'github'],
      extra: true,
    }),
    { enabled: true, providers: ['github', 'google'] },
  );
  assert.throws(() => parseIdentityConfiguration({ enabled: true, providers: ['other'] }), {
    message: 'Invalid identity configuration response.',
  });
  assert.throws(() => parseIdentitySession({}), { message: 'Invalid identity session response.' });
  assert.equal(parseIdentitySession(null), null);
  assert.deepEqual(
    parseIdentitySession({
      user: { id: '', name: '', email: '', emailVerified: true, extra: true },
      session: { id: '', expiresAt: '2026-01-01', extra: true },
      extra: true,
    }),
    {
      user: { id: '', name: '', email: '', emailVerified: true },
      session: { id: '', expiresAt: '2026-01-01' },
    },
  );
});

function proxyOrigin(t, value) {
  const previous = process.env.API_BASE_URL;
  if (value === null) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = value;
  t.after(() => {
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
}
test('actual identity proxy keeps configured destination, raw query, body and renewal/redirect response', async (t) => {
  proxyOrigin(t, 'https://api.example.test');
  const f = fixture(t);
  const forwarded = {
    cookie: 'session=fictional',
    'content-type': 'application/json',
    origin: 'https://app.example.test',
    referer: 'https://app.example.test/identity',
    'user-agent': 'fictional-browser',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
  };
  for (const method of ['GET', 'HEAD', 'POST']) {
    const headers = new globalThis.Headers({
      'content-type': 'text/plain',
      location: '/identity',
      'cache-control': 'public',
      'x-upstream-private': 'omit',
    });
    headers.append('set-cookie', 'first=1; HttpOnly');
    headers.append('set-cookie', 'second=2; HttpOnly');
    f.replies.push(new Response('upstream', { status: 302, headers }));
    const response = await proxyIdentity(
      new Request('https://app.example.test/api/auth/callback/google?state=a&state=b', {
        method,
        headers: {
          ...forwarded,
          host: 'untrusted.example.test',
          'x-forwarded-for': '203.0.113.1',
          'x-rielia-source': 'forged',
          'idempotency-key': 'not-forwarded',
        },
        ...(method === 'POST' ? { body: '{"provider":"google"}' } : {}),
      }),
    );
    const call = f.calls.at(-1);
    assert.equal(call.url, 'https://api.example.test/api/auth/callback/google?state=a&state=b');
    assert.equal(call.method, method);
    for (const [name, value] of Object.entries(forwarded))
      assert.equal(call.headers.get(name), value);
    for (const name of ['host', 'x-forwarded-for', 'x-rielia-source', 'idempotency-key'])
      assert.equal(call.headers.get(name), null);
    assert.equal(call.cache, 'no-store');
    assert.equal(call.redirect, 'manual');
    assert.equal(call.duplex, 'half');
    if (method === 'POST')
      assert.equal(await new Response(call.body).text(), '{"provider":"google"}');
    else assert.equal('body' in call, false);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('location'), '/identity');
    assert.equal(response.headers.get('content-type'), 'text/plain');
    assert.equal(response.headers.get('x-upstream-private'), null);
    assert.deepEqual(response.headers.getSetCookie(), ['first=1; HttpOnly', 'second=2; HttpOnly']);
    assert.equal(await response.text(), 'upstream');
  }
});
test('identity proxy retains forwarding-only admission and default upstream rather than workspace checks', async (t) => {
  proxyOrigin(t, null);
  const f = fixture(t);
  f.replies.push(new Response(null, { status: 204 }));
  const response = await proxyIdentity(
    new Request('https://app.example.test/api/auth/library-owned-route', {
      method: 'DELETE',
      headers: { 'x-rielia-actor-principal-id': 'untrusted' },
      body: 'opaque-library-body',
    }),
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, 'http://127.0.0.1:3001/api/auth/library-owned-route');
  assert.equal(f.calls[0].headers.get('x-rielia-actor-principal-id'), null);
  assert.equal(f.calls[0].headers.get('origin'), null);
  assert.equal(await new Response(f.calls[0].body).text(), 'opaque-library-body');
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('content-type'), null);
});
test('actual workspace proxy forwards duplicate queries and allowed headers/body with bounded responses', async (t) => {
  proxyOrigin(t, 'https://api.example.test');
  const f = fixture(t);
  const forwarded = {
    cookie: 'session=fictional',
    'content-type': 'application/json',
    origin: 'https://app.example.test',
    'sec-fetch-site': 'same-origin',
    'idempotency-key': 'original-key',
  };
  for (const [path, method, body] of [
    ['/api/v1/workspaces?cursor=one&cursor=two', 'GET', undefined],
    ['/api/v1/workspaces/workspace/execution-context', 'GET', undefined],
    ['/api/v1/workspace-invitations/accept', 'POST', '{"token":"fictional"}'],
  ]) {
    const headers = new globalThis.Headers({
      'content-type': 'text/plain',
      'cache-control': 'public',
      location: '/not-forwarded',
    });
    headers.append('set-cookie', 'renewed=1; HttpOnly');
    f.replies.push(new Response('upstream', { status: 201, headers }));
    const response = await proxyWorkspace(
      new Request('https://app.example.test' + path, {
        method,
        headers: {
          ...forwarded,
          host: 'untrusted.example.test',
          'x-forwarded-for': '203.0.113.1',
          referer: 'https://app.example.test/workspaces',
        },
        ...(body === undefined ? {} : { body }),
      }),
    );
    const call = f.calls.at(-1);
    assert.equal(call.url, 'https://api.example.test' + path);
    assert.equal(call.method, method);
    for (const [name, value] of Object.entries(forwarded))
      assert.equal(call.headers.get(name), value);
    for (const name of ['host', 'x-forwarded-for', 'referer'])
      assert.equal(call.headers.get(name), null);
    assert.equal(call.cache, 'no-store');
    assert.equal(call.redirect, 'manual');
    assert.equal(call.duplex, 'half');
    if (body === undefined) assert.equal('body' in call, false);
    else assert.equal(await new Response(call.body).text(), body);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('content-type'), 'text/plain');
    assert.equal(response.headers.get('location'), null);
    assert.deepEqual(response.headers.getSetCookie(), ['renewed=1; HttpOnly']);
    assert.equal(await response.text(), 'upstream');
  }
});
test('workspace proxy rejects its path/method/actor fields and retains default empty-response type', async (t) => {
  proxyOrigin(t, null);
  const f = fixture(t);
  for (const [path, method, headers] of [
    ['/api/v1/workspaces/invalid/path', 'GET', {}],
    ['/api/v1/workspaces', 'DELETE', {}],
    ['/api/v1/workspaces', 'GET', { 'x-rielia-actor-principal-id': 'forged' }],
    ['/api/v1/workspaces', 'GET', { 'x-source': 'forged' }],
    ['/api/v1/workspaces', 'GET', { 'principal-kind': 'human' }],
  ]) {
    const response = await proxyWorkspace(
      new Request('https://app.example.test' + path, { method, headers }),
    );
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { message: 'Workspace request unavailable.' });
  }
  assert.equal(f.calls.length, 0);
  f.replies.push(new Response(null, { status: 204 }));
  const response = await proxyWorkspace(new Request('https://app.example.test/api/v1/workspaces'));
  assert.equal(f.calls[0].url, 'http://127.0.0.1:3001/api/v1/workspaces');
  assert.equal(f.calls[0].headers.get('cookie'), null);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('content-type'), 'application/json');
});
test('identity proxy controlled deadline returns sanitized no-store 503 without a timer wait', async (t) => {
  proxyOrigin(t, 'https://api.example.test');
  const deadline = new AbortController();
  t.mock.method(globalThis.AbortSignal, 'timeout', () => deadline.signal);
  let pendingSignal;
  t.mock.method(
    globalThis,
    'fetch',
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        pendingSignal = init.signal;
        init.signal.addEventListener(
          'abort',
          () => reject(new Error('fictional-private-deadline')),
          { once: true },
        );
      }),
  );
  t.after(() => t.mock.restoreAll());
  const pending = proxyIdentity(new Request('https://app.example.test/api/v1/identity/session'));
  assert.equal(pendingSignal.aborted, false);
  deadline.abort();
  const response = await pending;
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { message: 'Identity API is unavailable. Try again.' });
});
test('workspace proxy propagates caller abort and keeps fetch failures as controlled no-store 503', async (t) => {
  proxyOrigin(t, 'https://api.example.test');
  const abort = new AbortController();
  abort.abort();
  const signals = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    signals.push(init.signal);
    throw new Error('fictional-private-upstream');
  });
  t.after(() => t.mock.restoreAll());
  for (const signal of [abort.signal, new AbortController().signal]) {
    const response = await proxyWorkspace(
      new Request('https://app.example.test/api/v1/workspaces', { signal }),
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { message: 'Workspace request unavailable.' });
  }
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, false);
});
