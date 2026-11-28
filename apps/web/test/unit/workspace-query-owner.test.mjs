import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { createWorkspaceQueryOwner } from '../../src/lib/workspace-query-owner.ts';
import { createWorkspaceTransport } from '../../src/lib/workspace-client.ts';
import { workspaceMember, workspaceInvitation } from './workspace-screen-fixtures.mjs';

const workspace = (id) => ({
  id,
  name: `Workspace ${id}`,
  ownerPrincipalId: 'human',
  role: 'owner',
  createdAt: '2026-01-01T00:00:00Z',
});
const page = (items, total = items.length, nextCursor = null) => ({ items, total, nextCursor });
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture(t, bind = true) {
  const calls = [];
  const responses = {
    workspaces: page([workspace('a')]),
    workspace: workspace('a'),
    members: page([workspaceMember()]),
    invitations: page([workspaceInvitation()]),
  };
  let allowed = true;
  let reply = null;
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(String(input), 'https://app.example.test');
    const name =
      url.pathname === '/api/v1/workspaces'
        ? 'workspaces'
        : url.pathname.endsWith('/members')
          ? 'members'
          : url.pathname.endsWith('/invitations')
            ? 'invitations'
            : 'workspace';
    const call = { name, cursor: url.searchParams.get('cursor'), signal: init.signal };
    calls.push(call);
    return reply?.(call) ?? Response.json(responses[name]);
  });
  const client = new QueryClient();
  const denied = [];
  const projections = [];
  const owner = createWorkspaceQueryOwner({
    client,
    transport: createWorkspaceTransport(),
    authorized: () => allowed,
    changed: () => projections.push(owner.resources()),
    denied: (reason) => {
      denied.push(reason);
      allowed = false;
      owner.clear();
    },
  });
  if (bind) {
    owner.bind('opaque');
    owner.select('a');
    owner.administer(true);
  }
  t.after(() => owner.clear());
  return {
    owner,
    client,
    calls,
    responses,
    projections,
    denied,
    reply(value) {
      reply = value;
    },
    allow(value) {
      allowed = value;
    },
  };
}
const names = ['workspaces', 'workspace', 'members', 'invitations'];

test('four explicit workspace resources have one canonical Query owner and private disabled defaults', async (t) => {
  const f = fixture(t, false);
  for (const name of names) await f.owner.read(name);
  f.owner.select('a');
  f.owner.administer(true);
  assert.equal(f.calls.length, 0);
  assert.equal(f.client.getQueryCache().getAll().length, 0);
  f.owner.bind('opaque');
  f.owner.bind('opaque');
  f.owner.select('a');
  f.owner.administer(true);
  for (const name of names) await f.owner.read(name);
  assert.equal(f.calls.length, 4);
  for (const query of f.client.getQueryCache().getAll()) {
    const name = query.queryKey[3];
    assert.equal(f.owner.resources()[name].data, query.state.data);
    assert.equal(Object.isFrozen(query.state.data), true);
    assert.deepEqual(
      {
        enabled: query.options.enabled,
        retry: query.options.retry,
        gcTime: query.options.gcTime,
        staleTime: query.options.staleTime,
        networkMode: query.options.networkMode,
        structuralSharing: query.options.structuralSharing,
        mount: query.options.refetchOnMount,
        focus: query.options.refetchOnWindowFocus,
        reconnect: query.options.refetchOnReconnect,
        interval: query.options.refetchInterval,
      },
      {
        enabled: false,
        retry: false,
        gcTime: 0,
        staleTime: 0,
        networkMode: 'always',
        structuralSharing: false,
        mount: false,
        focus: false,
        reconnect: false,
        interval: false,
      },
    );
    assert.equal(JSON.stringify(query.queryKey).includes('session-human'), false);
  }
  assert.equal(f.client.getMutationCache().getAll().length, 0);
  f.owner.select('b');
  f.owner.administer(false);
  assert.equal(f.owner.resources().workspaces.data.items[0].id, 'a');
  assert.equal(f.owner.resources().workspace.data, null);
  assert.equal(f.owner.resources().members.data, null);
  await f.owner.read('invitations');
  assert.equal(f.calls.length, 4);
  assert.equal(f.client.getQueryCache().getAll().length, 1);
  f.owner.clear();
  assert.equal(f.client.getQueryCache().getAll().length, 0);
});

const rows = {
  workspaces: [workspace('a'), workspace('b'), workspace('c')],
  members: [workspaceMember(), workspaceMember('second'), workspaceMember('third')],
  invitations: [
    workspaceInvitation(),
    workspaceInvitation({ id: 'second' }),
    workspaceInvitation({ id: 'third' }),
  ],
};
for (const name of ['workspaces', 'members', 'invitations']) {
  test(`${name} pages preserve last-good rows, coalesce append and atomically replace old tails`, async (t) => {
    const f = fixture(t);
    const [first, second] = rows[name];
    f.responses[name] = page([first], 2, 'next');
    await f.owner.read(name);
    const pending = deferred();
    f.reply((call) => (call.name === name && call.cursor ? pending.promise : null));
    const more = f.owner.read(name, true);
    await f.owner.read(name, true);
    assert.equal(f.calls.length, 2);
    pending.resolve(Response.json(page([second], 2)));
    await more;
    assert.deepEqual(f.owner.resources()[name].data.items, [first, second]);
    await f.owner.read(name, true);
    assert.equal(f.calls.length, 2);
    f.reply(() => Response.json({}, { status: 503 }));
    await f.owner.read(name);
    assert.equal(f.owner.resources()[name].status, 'error');
    assert.equal(f.owner.resources()[name].stale, true);
    assert.deepEqual(f.owner.resources()[name].data.items, [first, second]);
    f.reply(null);
    f.responses[name] = page([second]);
    const start = f.projections.length;
    await f.owner.read(name);
    assert.deepEqual(f.owner.resources()[name].data.items, [second]);
    for (const snapshot of f.projections.slice(start)) {
      const items = snapshot[name].data?.items;
      assert.ok(
        !items ||
          items.length === 1 ||
          (items.length === 2 &&
            items[0].id === first.id &&
            items[0].principalId === first.principalId),
      );
    }
    assert.equal(f.client.getQueryCache().getAll().length, 1);
  });

  for (const scenario of [
    'duplicate-root',
    'duplicate-tail',
    'overlap',
    'total-drift',
    'overflow',
    'cycle',
  ]) {
    test(`${name} rejects ${scenario} before page admission`, async (t) => {
      const f = fixture(t);
      const [first, second, third] = rows[name];
      f.responses[name] = page([first], 3, 'next');
      if (scenario === 'duplicate-root') f.responses[name] = page([first, first], 3, 'next');
      await f.owner.read(name);
      if (scenario === 'duplicate-root') {
        assert.equal(f.owner.resources()[name].data, null);
      } else {
        let tail = page([second], 3);
        if (scenario === 'duplicate-tail') tail = page([second, second], 3);
        if (scenario === 'overlap') tail = page([first], 3);
        if (scenario === 'total-drift') tail = page([second], 4);
        if (scenario === 'overflow')
          tail = page(
            [
              second,
              third,
              name === 'members' ? { ...third, principalId: 'fourth' } : { ...third, id: 'fourth' },
            ],
            3,
          );
        if (scenario === 'cycle') tail = page([second], 3, 'next');
        f.reply(() => Response.json(tail));
        await f.owner.read(name, true);
        assert.deepEqual(f.owner.resources()[name].data.items, [first]);
        assert.equal(f.client.getQueryCache().getAll().length, 1);
      }
      assert.equal(f.owner.resources()[name].status, 'changed');
      assert.equal(f.owner.resources()[name].failure.code, 'page-changed');
      const count = f.calls.length;
      await f.owner.read(name, true);
      assert.equal(f.calls.length, count);
    });
  }
}

for (const name of names) {
  for (const status of [401, 403]) {
    test(`${name} terminal${status} clears the actual lifetime and cannot retry from an unbound intent`, async (t) => {
      const f = fixture(t);
      f.reply(() => Response.json({}, { status }));
      await f.owner.read(name);
      assert.deepEqual(f.denied, [status === 401 ? 'signed-out' : 'forbidden']);
      assert.equal(f.client.getQueryCache().getAll().length, 0);
      for (const resource of Object.values(f.owner.resources())) assert.equal(resource.data, null);
      await f.owner.read(name);
      assert.equal(f.calls.length, 1);
    });
  }
}

test('retired native signals and late denial cannot affect a replacement scope or epoch', async (t) => {
  const f = fixture(t);
  const pending = deferred();
  f.reply((call) => (call.name === 'members' ? pending.promise : null));
  const old = f.owner.read('members');
  const signal = f.calls.at(-1).signal;
  f.owner.bind('replacement-opaque');
  f.owner.select('b');
  assert.equal(signal.aborted, true);
  f.responses.workspace = workspace('b');
  await f.owner.read('workspace');
  pending.resolve(Response.json({}, { status: 403 }));
  await old;
  assert.equal(f.owner.resources().workspace.data.id, 'b');
  assert.deepEqual(f.denied, []);
  assert.equal(f.client.getQueryCache().getAll().length, 1);
});

test('reentrant actual observer registration and success retirement cannot revive or delete replacement records', async (t) => {
  const f = fixture(t);
  let retire = 'observerAdded';
  const stop = f.client.getQueryCache().subscribe((event) => {
    if (
      (retire === 'observerAdded' && event.type === 'observerAdded') ||
      (retire === 'success' && event.type === 'updated' && event.action.type === 'success')
    ) {
      retire = null;
      f.owner.clear();
      f.owner.bind('new-epoch');
      f.owner.select('b');
    }
  });
  await f.owner.read('members');
  assert.equal(f.calls.length, 0);
  assert.equal(f.owner.resources().members.data, null);
  retire = 'success';
  await f.owner.read('members');
  assert.equal(f.owner.resources().members.data, null);
  stop();
  f.responses.workspace = workspace('b');
  await f.owner.read('workspace');
  assert.equal(f.owner.resources().workspace.data.id, 'b');
  assert.equal(f.client.getQueryCache().getAll().length, 1);
});

test('wrong detail and invitation scope never enter canonical resources; independent catalogue remains', async (t) => {
  const f = fixture(t);
  await f.owner.read('workspaces');
  f.responses.workspace = workspace('foreign');
  await f.owner.read('workspace');
  assert.equal(f.owner.resources().workspace.failure.status, 502);
  f.responses.invitations = page([workspaceInvitation({ workspaceId: 'foreign' })]);
  await f.owner.read('invitations');
  assert.equal(f.owner.resources().invitations.failure.status, 502);
  assert.equal(f.owner.resources().invitations.data, null);
  assert.equal(f.owner.resources().workspaces.data.items[0].id, 'a');
});

test('invalidating a pending append retires it without erasing its admitted chain or unrelated detail', async (t) => {
  const f = fixture(t);
  f.responses.members = page([workspaceMember()], 2, 'next');
  await f.owner.read('members');
  await f.owner.read('workspace');
  const pending = deferred();
  f.reply(() => pending.promise);
  const more = f.owner.read('members', true);
  f.owner.invalidate();
  assert.equal(f.calls.at(-1).signal.aborted, true);
  pending.resolve(Response.json(page([workspaceMember('second')], 2)));
  await more;
  assert.deepEqual(
    f.owner.resources().members.data.items.map((row) => row.principalId),
    ['member'],
  );
  assert.equal(f.owner.resources().members.stale, true);
  assert.equal(f.owner.resources().workspace.data.id, 'a');
  assert.equal(f.owner.resources().workspace.stale, true);
});

test('an unknown network error preserves the last-good workspace page without granting a false denial', async (t) => {
  const f = fixture(t);
  await f.owner.read('members');
  const admitted = f.owner.resources().members.data;
  f.reply(() => {
    throw new Error('Synthetic network failure');
  });
  await f.owner.read('members');
  assert.equal(f.owner.resources().members.failure.status, 0);
  assert.equal(f.owner.resources().members.data, admitted);
  assert.equal(f.owner.resources().members.stale, true);
  assert.deepEqual(f.denied, []);
});

test('a malformed root total is rejected by the real transport before Query can admit the page', async (t) => {
  const f = fixture(t);
  f.responses.members = page([workspaceMember()], 0);
  await f.owner.read('members');
  assert.equal(f.owner.resources().members.data, null);
  assert.equal(f.owner.resources().members.failure.status, 502);
});

for (const phase of ['before-admission', 'after-transport', 'after-cache-success']) {
  test(`authority withdrawal ${phase} cannot admit a workspace DTO or false denial`, async (t) => {
    const f = fixture(t);
    let stop = () => {};
    const held = deferred();
    if (phase === 'before-admission') f.allow(false);
    if (phase === 'after-transport') f.reply(() => held.promise);
    if (phase === 'after-cache-success')
      stop = f.client.getQueryCache().subscribe((event) => {
        if (event.type === 'updated' && event.action.type === 'success') f.allow(false);
      });
    const reading = f.owner.read('members');
    if (phase === 'after-transport') {
      f.allow(false);
      held.resolve(Response.json(page([workspaceMember()])));
    }
    await reading;
    stop();
    assert.equal(f.owner.resources().members.data, null);
    assert.notEqual(f.owner.resources().members.status, 'ready');
    assert.equal(f.client.getQueryCache().getAll().length, 0);
    assert.deepEqual(f.denied, []);
    assert.equal(f.calls.length, phase === 'before-admission' ? 0 : 1);
  });
}
