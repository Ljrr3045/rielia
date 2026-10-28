import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkspaceController } from '../apps/web/src/lib/workspace-controller.ts';
import { WorkspaceFailure } from '../apps/web/src/lib/workspace-client.ts';
import { observeWorkspaceInvitations } from '../apps/web/src/lib/workspace-invitation-location.ts';

const active = { user: { id: 'human', name: 'Human', email: 'human@example.test', emailVerified: true }, session: { id: 'session', expiresAt: '2035-01-01T00:00:00.000Z' } };
const workspace = (id, role = 'owner') => ({ id, name: `Workspace ${id}`, ownerPrincipalId: 'human', role, createdAt: '2026-01-01T00:00:00Z' });
const page = items => ({ items, total: items.length, nextCursor: null });
function deferred() { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function fixture(overrides = {}) {
  const values = { session: active, config: { enabled: true, providers: ['github'] }, ...overrides.values };
  const calls = []; let keys = 0;
  const transport = { workspaces: async () => page([workspace('a'), workspace('b', 'viewer')]), detail: async id => workspace(id, id === 'b' ? 'viewer' : 'owner'),
    members: async () => page([]), invitations: async () => page([]), mutate: async (command, key) => { calls.push({ command, key }); return workspace('new'); }, ...overrides.transport };
  const controller = createWorkspaceController({ identity: { configuration: async () => values.config, session: async () => values.session }, transport, key: () => `key-${++keys}`,
    origin: () => 'https://app.example.test', ...overrides.options });
  return { controller, values, calls, transport };
}

test('disabled/signed-out/empty/malformed/unavailable states distinguish actual auth from failed data reads', async () => {
  const f = fixture({ values: { config: { enabled: false, providers: [] } } }); await f.controller.refresh(); assert.equal(f.controller.getState().status, 'disabled');
  f.values.config.enabled = true; f.values.session = null; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'signed-out');
  f.values.session = active; f.transport.workspaces = async () => page([]); await f.controller.refresh(); assert.equal(f.controller.getState().status, 'empty'); assert.equal(f.controller.getState().capabilities.canCreateWorkspace, true);
  f.values.session = { user: { id: 'bad' } }; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().session, null);
  f.values.session = active; f.transport.workspaces = async () => { throw new Error(); }; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'error');
});

test('workspace switching clears scoped data, reauthorizes stored selection, ignores stale reads and retains foreign recovery target', async () => {
  const old = deferred(); let wait = false;
  const f = fixture({ transport: { detail: async id => id === 'a' && wait ? old.promise : workspace(id, id === 'b' ? 'viewer' : 'owner') } });
  await f.controller.refresh(); assert.equal(f.controller.getState().capabilities.canAdminister, true);
  wait = true; const stale = f.controller.selectWorkspace('a'); await f.controller.selectWorkspace('b');
  old.resolve(workspace('a')); await stale; assert.equal(f.controller.getState().workspace.id, 'b'); assert.equal(f.controller.getState().capabilities.canAdminister, false); assert.equal(f.controller.getState().invitations, null);
  f.transport.detail = async () => { throw new WorkspaceFailure(403); }; await f.controller.selectWorkspace('foreign');
  assert.equal(f.controller.getState().status, 'forbidden'); assert.equal(f.controller.getState().workspace, null);
  let saved; const stored = fixture({ options: { selection: { read: () => 'b', write: (_user, id) => { saved = id; } } } });
  await stored.controller.refresh(); assert.equal(stored.controller.getState().selectedWorkspaceId, 'b'); assert.equal(saved, 'b');
});

test('unknown commit retry keeps draft/key, duplicate submit blocked and a new draft cannot discard captured recovery', async () => {
  const pending = deferred(); const calls = [];
  const f = fixture({ transport: { mutate: async (command, key) => { calls.push({ command, key }); if (calls.length === 1) return pending.promise; return workspace('new'); } } });
  await f.controller.refresh(); const draft = { type: 'create-workspace', name: 'Original' }; f.controller.stage(draft); draft.name = 'Mutated by caller';
  const first = f.controller.submit(); await f.controller.submit(); assert.equal(calls.length, 1);
  pending.reject(new Error()); await first; assert.equal(f.controller.getState().draft.name, 'Original'); assert.equal(f.controller.getState().outcome, 'error');
  f.controller.stage({ type: 'create-workspace', name: 'New draft' }); assert.equal(f.controller.getState().draft.name, 'Original');
  await f.controller.submit(); assert.equal(calls.length, 2); assert.equal(calls[0].key, calls[1].key); assert.equal(calls[1].command.name, 'Original'); assert.equal(f.controller.getState().outcome, 'success');
});

test('switch/cancel during mutation ignores old completion and retry stays bound to original key and workspace', async () => {
  const pending = deferred(); const calls = [];
  const f = fixture({ transport: { mutate: async (command, key) => { calls.push({ command, key }); return calls.length === 1 ? pending.promise : { principalId: 'member', version: 2 }; } } });
  await f.controller.refresh(); f.controller.stage({ type: 'update-member', workspaceId: 'a', principalId: 'member', version: 1, role: 'viewer' });
  const saving = f.controller.submit(); await f.controller.selectWorkspace('b'); pending.resolve({ principalId: 'member', version: 2 }); await saving;
  assert.equal(f.controller.getState().workspace.id, 'b'); assert.deepEqual(f.controller.getState().retryTarget, { type: 'update-member', workspaceId: 'a' });
  await f.controller.retrySave(); assert.equal(calls.length, 1); assert.equal(f.controller.getState().outcome, 'invalid');
  await f.controller.selectWorkspace('a'); await f.controller.retrySave(); assert.equal(calls.length, 2); assert.equal(calls[0].key, calls[1].key);
});

test('expiry/logout preserves recoverable draft for same user, account switch clears private recovery', async () => {
  const f = fixture({ transport: { mutate: async () => { throw new WorkspaceFailure(401); } } });
  await f.controller.refresh(); f.controller.stage({ type: 'create-workspace', name: 'Recover' }); await f.controller.submit();
  assert.equal(f.controller.getState().status, 'signed-out'); assert.equal(f.controller.getState().workspaces, null); assert.equal(f.controller.getState().draft.name, 'Recover');
  await f.controller.refresh(); assert.equal(f.controller.getState().draft.name, 'Recover'); assert.ok(f.controller.getState().retryTarget);
  f.values.session = { ...active, user: { ...active.user, id: 'other' } }; await f.controller.refresh();
  assert.equal(f.controller.getState().draft, null); assert.equal(f.controller.getState().retryTarget, null);
});

test('invitation fragment is never sent on GET, explicit accept is recoverable and created link uses browser origin', async () => {
  const token = 'x'.repeat(43); const calls = [];
  const f = fixture({ values: { session: null }, transport: { mutate: async (command, key) => { calls.push({ command, key }); return command.type === 'invite' ? { invitation: { id: 'invite' }, token } : workspace('joined'); } } });
  assert.equal(f.controller.captureInvitation(`#invitation=${token}`), true); await f.controller.refresh(); assert.equal(f.controller.getState().status, 'signed-out'); assert.equal(calls.length, 0);
  assert.ok(!JSON.stringify(f.controller.getState()).includes(token));
  f.values.session = active; await f.controller.refresh(); await f.controller.acceptInvitation();
  assert.equal(calls[0].command.token, token); assert.equal(f.controller.getState().hasInvitation, false); assert.equal(f.controller.getState().workspace.id, 'joined');
  await f.controller.selectWorkspace('a'); f.controller.stage({ type: 'invite', workspaceId: 'a', recipientEmail: 'recipient@example.test', role: 'member' }); await f.controller.submit();
  assert.equal(f.controller.getState().invitationLink, `https://app.example.test/workspaces#invitation=${token}`);
  f.controller.clearInvitation(); assert.equal(f.controller.getState().invitationLink, null);
});

test('conflict retains editable draft, invite-link-unavailable disallows blind retry; successful write survives failed reload', async () => {
  const f = fixture({ transport: { mutate: async () => { throw new WorkspaceFailure(409); } } });
  await f.controller.refresh(); f.controller.stage({ type: 'create-workspace', name: 'Draft' }); await f.controller.submit();
  assert.equal(f.controller.getState().outcome, 'conflict'); assert.ok(f.controller.getState().draft); assert.equal(f.controller.getState().retryTarget, null);
  f.transport.mutate = async () => { throw new WorkspaceFailure(409, 'invitation-link-unavailable'); }; await f.controller.submit(); assert.equal(f.controller.getState().outcome, 'invitation-link-unavailable');
  f.transport.mutate = async () => workspace('new'); f.transport.workspaces = async () => { throw new Error(); }; await f.controller.submit();
  assert.equal(f.controller.getState().outcome, 'success'); assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().draft, null); assert.equal(f.controller.getState().retryTarget, null);
});

test('clearing a generated invitation link preserves a received token for explicit acceptance', async () => {
  const received = 'r'.repeat(43); const generated = 'g'.repeat(43); const calls = [];
  const f = fixture({ transport: { mutate: async command => {
    calls.push(command);
    return command.type === 'invite' ? { invitation: { id: 'created' }, token: generated } : workspace('joined');
  } } });
  f.controller.captureInvitation(`#invitation=${received}`); await f.controller.refresh();
  f.controller.stage({ type: 'invite', workspaceId: 'a', recipientEmail: 'other@example.test', role: 'viewer' }); await f.controller.submit();
  assert.equal(f.controller.getState().hasInvitation, true); assert.ok(f.controller.getState().invitationLink.includes(generated));
  f.controller.clearGeneratedInvitationLink();
  assert.equal(f.controller.getState().invitationLink, null); assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.deepEqual(calls[1], { type: 'accept-invitation', token: received });
  assert.equal(f.controller.getState().hasInvitation, false); assert.equal(f.controller.getState().workspace.id, 'joined');
});

test('accepting invitation A cannot discard invitation B captured while A is pending', async () => {
  const first = 'a'.repeat(43); const second = 'b'.repeat(43); const pending = deferred(); const calls = [];
  const f = fixture({ transport: { mutate: async command => { calls.push(command); return calls.length === 1 ? pending.promise : workspace('second'); } } });
  f.controller.captureInvitation(`#invitation=${first}`); await f.controller.refresh();
  const acceptance = f.controller.acceptInvitation();
  f.controller.captureInvitation(`#invitation=${second}`);
  pending.resolve(workspace('first')); await acceptance;
  assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.deepEqual(calls.map(command => command.token), [first, second]);
  assert.equal(f.controller.getState().hasInvitation, false);
});

test('location lifecycle captures mount and same-document invitation fragments, clears history, and cleans up listeners', async () => {
  const f = fixture(); await f.controller.refresh();
  f.controller.stage({ type: 'create-workspace', name: 'Unsent draft' });
  const first = 'a'.repeat(43); const next = 'b'.repeat(43); const listeners = new Set(); const historyState = { navigation: 1 };
  let location = new URL(`https://app.example.test/workspaces?view=members#invitation=${first}`); const replacements = [];
  const browser = {
    get location() { return location; },
    history: { state: historyState, replaceState(state, _title, url) { replacements.push({ state, url }); location = new URL(url, location); } },
    addEventListener(type, listener) { assert.equal(type, 'hashchange'); listeners.add(listener); },
    removeEventListener(type, listener) { assert.equal(type, 'hashchange'); listeners.delete(listener); },
  };
  const stop = observeWorkspaceInvitations(f.controller, browser);
  assert.equal(f.controller.getState().hasInvitation, true); assert.equal(location.hash, '');
  f.controller.clearInvitation();
  location.hash = `invitation=${next}`; for (const listener of listeners) listener();
  assert.equal(f.controller.getState().hasInvitation, true); assert.equal(location.hash, '');
  assert.deepEqual(replacements, [{ state: historyState, url: '/workspaces?view=members' }, { state: historyState, url: '/workspaces?view=members' }]);
  assert.equal(f.controller.getState().draft.name, 'Unsent draft'); assert.equal(f.controller.getState().selectedWorkspaceId, 'a');
  await f.controller.acceptInvitation(); assert.equal(f.calls[0].command.token, next);
  stop(); assert.equal(listeners.size, 0);
  location.hash = `invitation=${first}`; for (const listener of listeners) listener();
  assert.equal(f.controller.getState().hasInvitation, false);
});

test('Accept after an unknown committed outcome reuses its captured receipt key', async () => {
  const token = 'a'.repeat(43); const calls = []; const receipts = new Map(); let consumed = false;
  const f = fixture({ transport: { mutate: async (command, key) => {
    calls.push({ command, key });
    if (receipts.has(key)) return receipts.get(key);
    if (consumed) throw new WorkspaceFailure(409);
    consumed = true; receipts.set(key, workspace('joined'));
    throw new Error('Committed response lost');
  } } });
  f.controller.captureInvitation(`#invitation=${token}`); await f.controller.refresh();
  await f.controller.acceptInvitation(); assert.ok(f.controller.getState().retryTarget);
  await f.controller.acceptInvitation();
  assert.equal(calls[1].key, calls[0].key); assert.equal(f.controller.getState().outcome, 'success');
  assert.equal(f.controller.getState().hasInvitation, false); assert.equal(f.controller.getState().workspace.id, 'joined');
});

test('a new received invitation cannot overwrite another acceptance recovery key', async () => {
  const first = 'a'.repeat(43); const second = 'b'.repeat(43); const calls = [];
  const f = fixture({ transport: { mutate: async (command, key) => {
    calls.push({ command, key }); if (calls.length === 1) throw new Error('Unknown outcome'); return workspace('joined');
  } } });
  f.controller.captureInvitation(`#invitation=${first}`); await f.controller.refresh(); await f.controller.acceptInvitation();
  f.controller.captureInvitation(`#invitation=${second}`); await f.controller.acceptInvitation();
  assert.equal(calls.length, 1); assert.equal(f.controller.getState().outcome, 'invalid');
  await f.controller.retrySave();
  assert.equal(calls[1].key, calls[0].key); assert.equal(calls[1].command.token, first); assert.equal(f.controller.getState().hasInvitation, true);
  await f.controller.acceptInvitation();
  assert.equal(calls[2].command.token, second); assert.notEqual(calls[2].key, calls[0].key); assert.equal(f.controller.getState().hasInvitation, false);
});

test('pagination completion from a previous workspace is discarded', async () => {
  const old = deferred();
  const f = fixture({ transport: { members: async (id, _signal, cursor) => cursor ? old.promise : { items: [], total: 1, nextCursor: 'next' } } });
  await f.controller.refresh(); const paging = f.controller.loadMore('members'); await f.controller.selectWorkspace('b');
  old.resolve(page([{ principalId: 'old-tenant' }])); await paging; assert.deepEqual(f.controller.getState().members.items, []);
});
