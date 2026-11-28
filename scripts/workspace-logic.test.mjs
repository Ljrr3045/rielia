import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkspaceController } from '../apps/web/src/lib/workspace-controller.ts';
import { WorkspaceFailure } from '../apps/web/src/lib/workspace-client.ts';
import { observeWorkspaceInvitations } from '../apps/web/src/lib/workspace-invitation-location.ts';

const active = {
  user: { id: 'human', name: 'Human', email: 'human@example.test', emailVerified: true },
  session: { id: 'session', expiresAt: '2035-01-01T00:00:00.000Z' },
};
const workspace = (id, role = 'owner') => ({
  id,
  name: `Workspace ${id}`,
  ownerPrincipalId: 'human',
  role,
  createdAt: '2026-01-01T00:00:00Z',
});
const page = (items) => ({ items, total: items.length, nextCursor: null });
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function fixture(overrides = {}) {
  const values = {
    session: active,
    config: { enabled: true, providers: ['github'] },
    ...overrides.values,
  };
  const calls = [];
  let keys = 0;
  const transport = {
    workspaces: async () => page([workspace('a'), workspace('b', 'viewer')]),
    detail: async (id) => workspace(id, id === 'b' ? 'viewer' : 'owner'),
    members: async () => page([]),
    invitations: async () => page([]),
    mutate: async (command, key) => {
      calls.push({ command, key });
      return workspace('new');
    },
    ...overrides.transport,
  };
  const controller = createWorkspaceController({
    identity: { configuration: async () => values.config, session: async () => values.session },
    transport,
    key: () => `key-${++keys}`,
    origin: () => 'https://app.example.test',
    ...overrides.options,
  });
  return { controller, values, calls, transport };
}

test('disabled/signed-out/empty/malformed/unavailable states distinguish actual auth from failed data reads', async () => {
  const f = fixture({ values: { config: { enabled: false, providers: [] } } });
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'disabled');
  f.values.config.enabled = true;
  f.values.session = null;
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'signed-out');
  f.values.session = active;
  f.transport.workspaces = async () => page([]);
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'empty');
  assert.equal(f.controller.getState().capabilities.canCreateWorkspace, true);
  f.values.session = { user: { id: 'bad' } };
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'error');
  assert.equal(f.controller.getState().session, null);
  f.values.session = active;
  f.transport.workspaces = async () => {
    throw new Error();
  };
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'error');
});

test('workspace switching clears scoped data, reauthorizes stored selection, ignores stale reads and retains foreign recovery target', async () => {
  const old = deferred();
  let wait = false;
  const f = fixture({
    transport: {
      detail: async (id) =>
        id === 'a' && wait ? old.promise : workspace(id, id === 'b' ? 'viewer' : 'owner'),
    },
  });
  await f.controller.refresh();
  assert.equal(f.controller.getState().capabilities.canAdminister, true);
  wait = true;
  const stale = f.controller.selectWorkspace('a');
  await f.controller.selectWorkspace('b');
  old.resolve(workspace('a'));
  await stale;
  assert.equal(f.controller.getState().workspace.id, 'b');
  assert.equal(f.controller.getState().capabilities.canAdminister, false);
  assert.equal(f.controller.getState().invitations, null);
  f.transport.detail = async () => {
    throw new WorkspaceFailure(403);
  };
  await f.controller.selectWorkspace('foreign');
  assert.equal(f.controller.getState().status, 'forbidden');
  assert.equal(f.controller.getState().workspace, null);
  let saved;
  const stored = fixture({
    options: {
      selection: {
        read: () => 'b',
        write: (_user, id) => {
          saved = id;
        },
      },
    },
  });
  await stored.controller.refresh();
  assert.equal(stored.controller.getState().selectedWorkspaceId, 'b');
  assert.equal(saved, 'b');
});

test('unknown commit retry keeps draft/key, duplicate submit blocked and a new draft cannot discard captured recovery', async () => {
  const pending = deferred();
  const calls = [];
  const f = fixture({
    transport: {
      mutate: async (command, key) => {
        calls.push({ command, key });
        if (calls.length === 1) return pending.promise;
        return workspace('new');
      },
    },
  });
  await f.controller.refresh();
  const draft = { type: 'create-workspace', name: 'Original' };
  f.controller.stage(draft);
  draft.name = 'Mutated by caller';
  const first = f.controller.submit();
  await f.controller.submit();
  assert.equal(calls.length, 1);
  pending.reject(new Error());
  await first;
  assert.equal(f.controller.getState().draft.name, 'Original');
  assert.equal(f.controller.getState().outcome, 'error');
  f.controller.stage({ type: 'create-workspace', name: 'New draft' });
  assert.equal(f.controller.getState().draft.name, 'Original');
  await f.controller.submit();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(calls[1].command.name, 'Original');
  assert.equal(f.controller.getState().outcome, 'success');
});

test('switch/cancel during mutation ignores old completion and retry stays bound to original key and workspace', async () => {
  const pending = deferred();
  const calls = [];
  const f = fixture({
    transport: {
      mutate: async (command, key) => {
        calls.push({ command, key });
        return calls.length === 1 ? pending.promise : { principalId: 'member', version: 2 };
      },
    },
  });
  await f.controller.refresh();
  f.controller.stage({
    type: 'update-member',
    workspaceId: 'a',
    principalId: 'member',
    version: 1,
    role: 'viewer',
  });
  const saving = f.controller.submit();
  await f.controller.selectWorkspace('b');
  pending.resolve({ principalId: 'member', version: 2 });
  await saving;
  assert.equal(f.controller.getState().workspace.id, 'b');
  assert.deepEqual(f.controller.getState().retryTarget, {
    type: 'update-member',
    workspaceId: 'a',
  });
  await f.controller.retrySave();
  assert.equal(calls.length, 1);
  assert.equal(f.controller.getState().outcome, 'invalid');
  await f.controller.selectWorkspace('a');
  await f.controller.retrySave();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
});

test('terminal401 erases recovery and same-user verification cannot resurrect the old intent', async () => {
  const f = fixture({
    transport: {
      mutate: async () => {
        throw new WorkspaceFailure(401);
      },
    },
  });
  await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'Recover' });
  await f.controller.submit();
  assert.equal(f.controller.getState().status, 'signed-out');
  assert.equal(f.controller.getState().workspaces, null);
  assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().retryTarget, null);
  await f.controller.refresh();
  assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().retryTarget, null);
  f.values.session = { ...active, user: { ...active.user, id: 'other' } };
  await f.controller.refresh();
  assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().retryTarget, null);
});

test('invitation fragment is never sent on GET, explicit accept is recoverable and created link uses browser origin', async () => {
  const token = 'x'.repeat(43);
  const calls = [];
  const f = fixture({
    values: { session: null },
    transport: {
      mutate: async (command, key) => {
        calls.push({ command, key });
        return command.type === 'invite'
          ? { invitation: { id: 'invite' }, token }
          : workspace('joined');
      },
    },
  });
  assert.equal(f.controller.captureInvitation(`#invitation=${token}`), true);
  await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'signed-out');
  assert.equal(calls.length, 0);
  assert.ok(!JSON.stringify(f.controller.getState()).includes(token));
  f.values.session = active;
  await f.controller.refresh();
  await f.controller.acceptInvitation();
  assert.equal(calls[0].command.token, token);
  assert.equal(f.controller.getState().hasInvitation, false);
  assert.equal(f.controller.getState().workspace.id, 'joined');
  await f.controller.selectWorkspace('a');
  f.controller.stage({
    type: 'invite',
    workspaceId: 'a',
    recipientEmail: 'recipient@example.test',
    role: 'member',
  });
  await f.controller.submit();
  assert.equal(
    f.controller.getState().invitationLink,
    `https://app.example.test/workspaces#invitation=${token}`,
  );
  f.controller.clearInvitation();
  assert.equal(f.controller.getState().invitationLink, null);
});

test('conflict retains editable draft, invite-link-unavailable disallows blind retry; successful write survives failed reload', async () => {
  const f = fixture({
    transport: {
      mutate: async () => {
        throw new WorkspaceFailure(409);
      },
    },
  });
  await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'Draft' });
  await f.controller.submit();
  assert.equal(f.controller.getState().outcome, 'conflict');
  assert.ok(f.controller.getState().draft);
  assert.equal(f.controller.getState().retryTarget, null);
  f.transport.mutate = async () => {
    throw new WorkspaceFailure(409, 'invitation-link-unavailable');
  };
  await f.controller.submit();
  assert.equal(f.controller.getState().outcome, 'invitation-link-unavailable');
  f.transport.mutate = async () => workspace('new');
  f.transport.workspaces = async () => {
    throw new Error();
  };
  await f.controller.submit();
  assert.equal(f.controller.getState().outcome, 'success');
  assert.equal(f.controller.getState().status, 'error');
  assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().retryTarget, null);
});

test('clearing a generated invitation link preserves a received token for explicit acceptance', async () => {
  const received = 'r'.repeat(43);
  const generated = 'g'.repeat(43);
  const calls = [];
  const f = fixture({
    transport: {
      mutate: async (command) => {
        calls.push(command);
        return command.type === 'invite'
          ? { invitation: { id: 'created' }, token: generated }
          : workspace('joined');
      },
    },
  });
  f.controller.captureInvitation(`#invitation=${received}`);
  await f.controller.refresh();
  f.controller.stage({
    type: 'invite',
    workspaceId: 'a',
    recipientEmail: 'other@example.test',
    role: 'viewer',
  });
  await f.controller.submit();
  assert.equal(f.controller.getState().hasInvitation, true);
  assert.ok(f.controller.getState().invitationLink.includes(generated));
  f.controller.clearGeneratedInvitationLink();
  assert.equal(f.controller.getState().invitationLink, null);
  assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.deepEqual(calls[1], { type: 'accept-invitation', token: received });
  assert.equal(f.controller.getState().hasInvitation, false);
  assert.equal(f.controller.getState().workspace.id, 'joined');
});

test('accepting invitation A cannot discard invitation B captured while A is pending', async () => {
  const first = 'a'.repeat(43);
  const second = 'b'.repeat(43);
  const pending = deferred();
  const calls = [];
  const f = fixture({
    transport: {
      mutate: async (command) => {
        calls.push(command);
        return calls.length === 1 ? pending.promise : workspace('second');
      },
    },
  });
  f.controller.captureInvitation(`#invitation=${first}`);
  await f.controller.refresh();
  const acceptance = f.controller.acceptInvitation();
  f.controller.captureInvitation(`#invitation=${second}`);
  pending.resolve(workspace('first'));
  await acceptance;
  assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.deepEqual(
    calls.map((command) => command.token),
    [first, second],
  );
  assert.equal(f.controller.getState().hasInvitation, false);
});

test('location lifecycle captures mount and same-document invitation fragments, clears history, and cleans up listeners', async () => {
  const f = fixture();
  await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'Unsent draft' });
  const first = 'a'.repeat(43);
  const next = 'b'.repeat(43);
  const listeners = new Set();
  const historyState = { navigation: 1 };
  let location = new URL(`https://app.example.test/workspaces?view=members#invitation=${first}`);
  const replacements = [];
  const browser = {
    get location() {
      return location;
    },
    history: {
      state: historyState,
      replaceState(state, _title, url) {
        replacements.push({ state, url });
        location = new URL(url, location);
      },
    },
    addEventListener(type, listener) {
      assert.equal(type, 'hashchange');
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'hashchange');
      listeners.delete(listener);
    },
  };
  const stop = observeWorkspaceInvitations(f.controller, browser);
  assert.equal(f.controller.getState().hasInvitation, true);
  assert.equal(location.hash, '');
  f.controller.clearInvitation();
  location.hash = `invitation=${next}`;
  for (const listener of listeners) listener();
  assert.equal(f.controller.getState().hasInvitation, true);
  assert.equal(location.hash, '');
  assert.deepEqual(replacements, [
    { state: historyState, url: '/workspaces?view=members' },
    { state: historyState, url: '/workspaces?view=members' },
  ]);
  assert.equal(f.controller.getState().draft.name, 'Unsent draft');
  assert.equal(f.controller.getState().selectedWorkspaceId, 'a');
  await f.controller.acceptInvitation();
  assert.equal(f.calls[0].command.token, next);
  stop();
  assert.equal(listeners.size, 0);
  location.hash = `invitation=${first}`;
  for (const listener of listeners) listener();
  assert.equal(f.controller.getState().hasInvitation, false);
});

test('Accept after an unknown committed outcome reuses its captured receipt key', async () => {
  const token = 'a'.repeat(43);
  const calls = [];
  const receipts = new Map();
  let consumed = false;
  const f = fixture({
    transport: {
      mutate: async (command, key) => {
        calls.push({ command, key });
        if (receipts.has(key)) return receipts.get(key);
        if (consumed) throw new WorkspaceFailure(409);
        consumed = true;
        receipts.set(key, workspace('joined'));
        throw new Error('Committed response lost');
      },
    },
  });
  f.controller.captureInvitation(`#invitation=${token}`);
  await f.controller.refresh();
  await f.controller.acceptInvitation();
  assert.ok(f.controller.getState().retryTarget);
  await f.controller.acceptInvitation();
  assert.equal(calls[1].key, calls[0].key);
  assert.equal(f.controller.getState().outcome, 'success');
  assert.equal(f.controller.getState().hasInvitation, false);
  assert.equal(f.controller.getState().workspace.id, 'joined');
});

test('a new received invitation cannot overwrite another acceptance recovery key', async () => {
  const first = 'a'.repeat(43);
  const second = 'b'.repeat(43);
  const calls = [];
  const f = fixture({
    transport: {
      mutate: async (command, key) => {
        calls.push({ command, key });
        if (calls.length === 1) throw new Error('Unknown outcome');
        return workspace('joined');
      },
    },
  });
  f.controller.captureInvitation(`#invitation=${first}`);
  await f.controller.refresh();
  await f.controller.acceptInvitation();
  f.controller.captureInvitation(`#invitation=${second}`);
  await f.controller.acceptInvitation();
  assert.equal(calls.length, 1);
  assert.equal(f.controller.getState().outcome, 'invalid');
  await f.controller.retrySave();
  assert.equal(calls[1].key, calls[0].key);
  assert.equal(calls[1].command.token, first);
  assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.equal(calls[2].command.token, second);
  assert.notEqual(calls[2].key, calls[0].key);
  assert.equal(f.controller.getState().hasInvitation, false);
});

test('pagination completion from a previous workspace is discarded', async () => {
  const old = deferred();
  const f = fixture({
    transport: {
      members: async (id, _signal, cursor) =>
        cursor ? old.promise : { items: [], total: 1, nextCursor: 'next' },
    },
  });
  await f.controller.refresh();
  const paging = f.controller.loadMore('members');
  await f.controller.selectWorkspace('b');
  old.resolve(page([{ principalId: 'old-tenant' }]));
  await paging;
  assert.deepEqual(f.controller.getState().members.items, []);
});

for (const status of [401, 403, 503]) {
  test(`a confirmed workspace write remains successful after follow-up${status} without private receipt seeding`, async () => {
    const f = fixture();
    await f.controller.refresh();
    f.controller.stage({ type: 'create-workspace', name: 'Confirmed' });
    f.transport.detail = async () => {
      throw new WorkspaceFailure(status);
    };
    await f.controller.submit();
    const value = f.controller.getState();
    assert.equal(value.outcome, 'success');
    assert.equal(value.retryTarget, null);
    assert.equal(value.draft, null);
    assert.equal(
      value.status,
      status === 401 ? 'signed-out' : status === 403 ? 'forbidden' : 'error',
    );
    if (status !== 503) {
      assert.equal(value.workspaces, null);
      assert.equal(value.workspace, null);
      assert.ok(Object.values(value.resources).every((resource) => resource.data === null));
    }
    await f.controller.retrySave();
    assert.equal(f.calls.length, 1);
  });
}

test('late denial from a retired selection cannot erase a replacement verified session', async () => {
  const f = fixture();
  await f.controller.refresh();
  const pending = deferred();
  f.transport.detail = async (id) => (id === 'a' ? pending.promise : workspace(id));
  const old = f.controller.selectWorkspace('a');
  f.values.session = { ...active, session: { ...active.session, id: 'new-session' } };
  f.transport.workspaces = async () => page([workspace('b')]);
  await f.controller.refresh();
  pending.reject(new WorkspaceFailure(403));
  await old;
  assert.equal(f.controller.getState().workspace.id, 'b');
  assert.equal(f.controller.getState().status, 'ready');
});

test('confirmation blocks reentrant commands until canonical reload and the next intent keeps its original expiry', async () => {
  const f = fixture();
  await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'First' });
  let observed = false,
    readyAtConfirmation;
  const stop = f.controller.subscribe(() => {
    const value = f.controller.getState();
    if (!observed && value.outcome === 'success') {
      observed = true;
      readyAtConfirmation = value.commandReady;
      f.controller.stage({ type: 'create-workspace', name: 'Premature' });
    }
  });
  await f.controller.submit();
  stop();
  assert.equal(
    readyAtConfirmation,
    false,
    'success cannot admit a new command against the old canonical snapshot',
  );
  assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().commandReady, true);
  f.controller.stage({ type: 'create-workspace', name: 'Next explicit intent' });
  const expiry = f.controller.getState().memoryExpiresAt;
  assert.equal(expiry, active.session.expiresAt);
  f.values.session = {
    ...active,
    session: { ...active.session, expiresAt: '2036-01-01T00:00:00.000Z' },
  };
  await f.controller.refresh();
  assert.equal(f.controller.getState().draft.name, 'Next explicit intent');
  assert.equal(f.controller.getState().memoryExpiresAt, expiry);
  assert.equal(f.calls.length, 1);
});

for (const phase of ['invalidation', 'success']) {
  for (const change of ['scope', 'dispose', 'replacement']) {
    test(`${phase} reentrancy to ${change} fences the completed write from replacement state and reads`, async () => {
      const f = fixture();
      await f.controller.refresh();
      let catalogueReads = 0;
      f.transport.workspaces = async () => {
        catalogueReads++;
        return page([workspace('replacement')]);
      };
      f.controller.stage({ type: 'create-workspace', name: 'Completed old intent' });
      let acted = false,
        continuation;
      const stop = f.controller.subscribe(() => {
        const value = f.controller.getState();
        const boundary =
          phase === 'invalidation'
            ? value.pending === 'create-workspace' && value.resources.workspaces.stale
            : value.outcome === 'success' && value.pending === null;
        if (acted || !boundary) return;
        acted = true;
        if (change === 'dispose') f.controller.dispose();
        else if (change === 'scope') continuation = f.controller.selectWorkspace('b');
        else {
          f.controller.cancelPending();
          f.values.session = {
            ...active,
            user: { ...active.user, id: 'replacement-human' },
            session: { ...active.session, id: 'replacement-session' },
          };
          continuation = f.controller.refresh();
        }
      });
      await f.controller.submit();
      await continuation;
      stop();
      assert.equal(acted, true, 'the actual public transition was observed');
      const value = f.controller.getState();
      if (change === 'dispose') {
        assert.equal(value.epoch, null);
        assert.equal(value.workspace, null);
        assert.ok(
          Object.values(value.resources).every(
            (resource) => resource.data === null && !resource.stale,
          ),
        );
        assert.equal(catalogueReads, 0);
      } else if (change === 'scope') {
        assert.equal(value.status, 'ready');
        assert.equal(value.workspace.id, 'b');
        assert.equal(value.outcome, null);
        assert.equal(catalogueReads, 0);
      } else {
        assert.equal(value.status, 'ready');
        assert.equal(value.workspace.id, 'replacement');
        assert.equal(value.session.user.id, 'replacement-human');
        assert.equal(value.outcome, null);
        assert.equal(catalogueReads, 1);
        f.controller.stage({ type: 'create-workspace', name: 'Replacement intent' });
        assert.equal(f.controller.getState().draft.name, 'Replacement intent');
        assert.equal(f.controller.getState().memoryExpiresAt, active.session.expiresAt);
      }
      assert.equal(value.retryTarget, null);
      assert.equal(f.calls.length, 1);
    });
  }
}

test('withdrawing authority at pending publication prevents transport submission', async () => {
  const f = fixture();
  await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'Withdrawn' });
  let withdrawn = false;
  const stop = f.controller.subscribe(() => {
    if (!withdrawn && f.controller.getState().pending) {
      withdrawn = true;
      f.controller.dispose();
    }
  });
  await f.controller.submit();
  stop();
  assert.equal(f.calls.length, 0);
  assert.equal(f.controller.getState().epoch, null);
  assert.equal(f.controller.getState().draft, null);
});

for (const completion of ['success', 'unknown']) {
  test(`expiry during a pending write erases recovery before its late ${completion}`, async (t) => {
    let now = Date.parse(active.session.expiresAt) - 1_000;
    t.mock.method(Date, 'now', () => now);
    const f = fixture();
    await f.controller.refresh();
    const held = deferred();
    f.transport.mutate = () => held.promise;
    f.controller.stage({ type: 'create-workspace', name: 'Expired original' });
    if (completion === 'success') {
      f.values.session = {
        ...active,
        session: { ...active.session, expiresAt: '2036-01-01T00:00:00.000Z' },
      };
      await f.controller.refresh();
    }
    const saving = f.controller.submit();
    now += 1_000;
    if (completion === 'success') held.resolve(workspace('new'));
    else held.reject(new Error('Synthetic response loss after original expiry'));
    await saving;
    assert.equal(f.controller.getState().status, 'signed-out');
    assert.equal(f.controller.getState().epoch, null);
    assert.equal(f.controller.getState().draft, null);
    assert.equal(f.controller.getState().retryTarget, null);
    assert.equal(f.controller.getState().hasInvitation, false);
  });
}

for (const phase of ['configuration', 'session']) {
  for (const completion of ['denied', 'failed']) {
    test(`stale ${phase} verification ${completion} cannot deny or restore memory into a replacement session`, async () => {
      const held = deferred();
      let waiting = false;
      const f = fixture({
        options: {
          identity: {
            configuration: async () =>
              waiting && phase === 'configuration' ? held.promise : f.values.config,
            session: async () => (waiting && phase === 'session' ? held.promise : f.values.session),
          },
        },
      });
      await f.controller.refresh();
      f.controller.stage({ type: 'create-workspace', name: 'Old private draft' });
      waiting = true;
      const old = f.controller.refresh();
      if (phase === 'session') await Promise.resolve();
      waiting = false;
      f.values.session = { ...active, session: { ...active.session, id: 'fresh-replacement' } };
      await f.controller.refresh();
      const epoch = f.controller.getState().epoch;
      if (completion === 'failed') held.reject(new Error('Retired verification failed'));
      else held.resolve(phase === 'configuration' ? { enabled: false, providers: [] } : null);
      await old;
      assert.equal(f.controller.getState().status, 'ready');
      assert.equal(f.controller.getState().epoch, epoch);
      assert.equal(f.controller.getState().draft, null);
      assert.equal(f.controller.getState().session.session.id, 'fresh-replacement');
    });
  }
}

test('a role-loss notification cannot start replacement members before their selected detail is verified', async () => {
  const f = fixture();
  await f.controller.refresh();
  const target = deferred();
  const members = [];
  f.transport.detail = async (id) => (id === 'b' ? target.promise : workspace(id, 'viewer'));
  f.transport.members = async (id) => {
    members.push(id);
    return page([]);
  };
  f.transport.mutate = async () => ({
    principalId: 'member',
    kind: 'human',
    name: 'Member',
    role: 'viewer',
    state: 'active',
    principalState: 'active',
    custodianPrincipalId: null,
    version: 2,
  });
  f.controller.stage({
    type: 'update-member',
    workspaceId: 'a',
    principalId: 'member',
    version: 1,
    role: 'viewer',
  });
  let switched = false,
    navigating;
  const stop = f.controller.subscribe(() => {
    const value = f.controller.getState();
    if (
      !switched &&
      value.workspace?.id === 'a' &&
      value.workspace.role === 'viewer' &&
      value.invitations === null
    ) {
      switched = true;
      navigating = f.controller.selectWorkspace('b');
    }
  });
  await f.controller.submit();
  assert.equal(switched, true);
  assert.equal(f.controller.getState().selectedWorkspaceId, 'b');
  assert.equal(f.controller.getState().status, 'loading');
  assert.deepEqual(
    members,
    [],
    'the retired continuation cannot read into a scope awaiting detail authority',
  );
  target.resolve(workspace('b'));
  await navigating;
  stop();
  assert.equal(f.controller.getState().workspace.id, 'b');
  assert.equal(f.controller.getState().status, 'ready');
  assert.deepEqual(members, ['b']);
});

for (const completed of ['create-workspace', 'accept-invitation', 'invite']) {
  test(`${completed} confirmation preserves an independently captured invitation and generated-link erasure`, async () => {
    const a = 'a'.repeat(43),
      b = 'b'.repeat(43);
    const f = fixture();
    await f.controller.refresh();
    const invitation = {
      id: 'created',
      workspaceId: 'a',
      recipientEmail: 'recipient@example.test',
      role: 'viewer',
      issuerPrincipalId: 'human',
      createdAt: '2026-01-01T00:00:00Z',
      expiresAt: '2035-01-01T00:00:00Z',
      state: 'pending',
    };
    const calls = [];
    f.transport.mutate = async (command, key) => {
      calls.push({ command, key });
      return command.type === 'invite' ? { invitation, token: 'g'.repeat(43) } : workspace('new');
    };
    let captured = false;
    const stop = f.controller.subscribe(() => {
      const value = f.controller.getState();
      if (!captured && value.pending === completed && value.resources.workspaces.stale) {
        captured = true;
        f.controller.captureInvitation(`#invitation=${b}`);
        if (completed === 'invite') f.controller.clearGeneratedInvitationLink();
      }
    });
    if (completed === 'accept-invitation') {
      f.controller.captureInvitation(`#invitation=${a}`);
      await f.controller.acceptInvitation();
    } else {
      f.controller.stage(
        completed === 'invite'
          ? {
              type: 'invite',
              workspaceId: 'a',
              recipientEmail: 'recipient@example.test',
              role: 'viewer',
            }
          : { type: 'create-workspace', name: 'First' },
      );
      await f.controller.submit();
    }
    stop();
    assert.equal(captured, true);
    assert.equal(f.controller.getState().hasInvitation, true);
    assert.equal(f.controller.getState().invitationLink, null);
    assert.equal(f.controller.getState().memoryExpiresAt, active.session.expiresAt);
    await f.controller.acceptInvitation();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].command.token, b);
    assert.equal(f.controller.getState().hasInvitation, false);
  });
}
