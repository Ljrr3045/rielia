import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useWorkspaces } from '../../src/lib/use-workspaces.ts';
import { useWorkspaceScreenActions } from '../../src/app/workspaces/use-workspace-screen-actions.ts';
import {
  act,
  browserFixture,
  deferred,
  identitySession,
  mountHook,
  page,
  workspace,
} from './dom-harness.mjs';
import { workspaceInvitation, workspaceMember } from './workspace-screen-fixtures.mjs';

// Only HTTP answers are controlled. Both hooks, controller, transport, request
// keys, generation fences and session/selection lifetimes remain production code.
function workspaceHttp(browser) {
  const server = {
    session: identitySession(),
    workspaces: page([workspace('a'), workspace('b')]),
    members: page([workspaceMember()]),
    invitations: page([]),
    detail: (id) => Response.json(workspace(id)),
    more: () => {
      throw new Error('Unexpected cursor request');
    },
    mutate: () => {
      throw new Error('Unexpected mutation');
    },
  };
  browser.setFetch(async (request) => {
    const url = new URL(request.url, browser.window.location.origin);
    const path = url.pathname;
    if (request.options.method === 'POST') return server.mutate(request);
    if (url.searchParams.has('cursor')) return server.more(request);
    if (path === '/api/v1/identity/config')
      return Response.json({ enabled: true, providers: ['github'] });
    if (path === '/api/v1/identity/session') return Response.json(server.session);
    if (path === '/api/v1/workspaces') return Response.json(server.workspaces);
    if (/\/workspaces\/(a|b|replacement)\/members$/.test(path))
      return Response.json(server.members);
    if (/\/workspaces\/(a|b|replacement)\/invitations$/.test(path))
      return Response.json(server.invitations);
    const detail = /^\/api\/v1\/workspaces\/(a|b|replacement)$/.exec(path);
    if (detail) return server.detail(detail[1]);
    throw new Error(`Unexpected request path: ${path}`);
  });
  return server;
}

function useWorkspaceScreen() {
  const canonical = useWorkspaces();
  const screen = useWorkspaceScreenActions(canonical);
  return { ...canonical, screen };
}

const updateMember = {
  type: 'update-member',
  workspaceId: 'a',
  principalId: 'member',
  version: 4,
  role: 'viewer',
};
const posts = (browser) => browser.requests.filter(({ options }) => options.method === 'POST');
const body = (request) => JSON.parse(request.options.body);
const key = (request) => new globalThis.Headers(request.options.headers).get('Idempotency-Key');

test('screen pending guards retain the submitted member and prevent a second intent', async (t) => {
  const browser = browserFixture(t, 'https://app.example.test/workspaces');
  const server = workspaceHttp(browser);
  const response = deferred();
  server.mutate = () => response.promise;
  const hook = await mountHook(browser, useWorkspaceScreen);
  await act(async () => hook.state.screen.run(updateMember));
  assert.equal(hook.state.pending, 'update-member');
  assert.equal(hook.state.screen.busy, true);
  assert.equal(hook.state.screen.commandsDisabled, true);
  assert.deepEqual(hook.state.screen.lastAction, {
    type: 'update-member',
    subject: { kind: 'member', value: 'Ana Member' },
  });
  await act(async () => {
    hook.state.screen.stageDraft({ type: 'create-workspace', name: 'Do not stage' });
    hook.state.screen.run({ ...updateMember, principalId: 'other' });
    hook.state.screen.acceptInvitation();
  });
  assert.deepEqual(hook.state.draft, updateMember);
  assert.equal(posts(browser).length, 1);
  assert.deepEqual(body(posts(browser)[0]), { version: 4, role: 'viewer' });
  server.members = page([workspaceMember('member', { version: 5, role: 'viewer' })]);
  await act(async () => response.resolve(Response.json(server.members.items[0])));
  assert.equal(hook.state.outcome, 'success');
  assert.equal(hook.state.screen.busy, false);
  assert.equal(hook.state.draft, null);
  assert.equal(hook.state.members.items[0].version, 5);
});

test('screen recovery keeps the original member label, body and key across workspace switching', async (t) => {
  const browser = browserFixture(t, 'https://app.example.test/workspaces');
  const server = workspaceHttp(browser);
  server.mutate = () => {
    throw new Error('Synthetic response lost after submission');
  };
  const hook = await mountHook(browser, useWorkspaceScreen);
  await act(async () => hook.state.screen.run(updateMember));
  assert.equal(hook.state.outcome, 'error');
  assert.deepEqual(hook.state.retryTarget, { type: 'update-member', workspaceId: 'a' });
  const original = posts(browser)[0];
  assert.ok(key(original));
  await act(async () => hook.state.selectWorkspace('b'));
  assert.equal(hook.state.screen.draftMismatch, true);
  assert.equal(hook.state.screen.draftScopeName, 'Workspace a');
  assert.deepEqual(hook.state.screen.lastAction.subject, { kind: 'member', value: 'Ana Member' });
  await act(async () => {
    hook.state.screen.stageDraft({ type: 'create-workspace', name: 'Blocked by recovery' });
    hook.state.screen.run({ ...updateMember, workspaceId: 'b', principalId: 'other' });
    hook.state.screen.retry();
  });
  assert.equal(posts(browser).length, 1, 'canonical scope fence prevents wrong-workspace retry');
  assert.deepEqual(hook.state.draft, updateMember);
  await act(async () => hook.state.selectWorkspace('a'));
  server.members = page([
    workspaceMember('member', { name: 'Loaded newer name', version: 5, role: 'viewer' }),
  ]);
  server.mutate = () => Response.json(server.members.items[0]);
  await act(async () => hook.state.screen.retry());
  assert.equal(posts(browser).length, 2);
  assert.equal(posts(browser)[1].url, original.url);
  assert.deepEqual(body(posts(browser)[1]), body(original));
  assert.equal(key(posts(browser)[1]), key(original));
  assert.equal(hook.state.outcome, 'success');
  assert.equal(hook.state.retryTarget, null);
  assert.deepEqual(hook.state.screen.lastAction.subject, { kind: 'member', value: 'Ana Member' });
});

test('generated invitation Done clears its display without clearing a received invitation', async (t) => {
  const inbound = 'a'.repeat(43);
  const generated = 'g'.repeat(43);
  const browser = browserFixture(t, `https://app.example.test/workspaces#invitation=${inbound}`);
  const server = workspaceHttp(browser);
  server.mutate = (request) => {
    if (request.url === '/api/v1/workspaces/a/invitations')
      return Response.json({ invitation: workspaceInvitation(), token: generated });
    assert.equal(request.url, '/api/v1/workspace-invitations/accept');
    return Response.json(workspace('a'));
  };
  const hook = await mountHook(browser, useWorkspaceScreen);
  assert.equal(hook.state.hasInvitation, true);
  assert.equal(browser.window.location.hash, '');
  await act(async () =>
    hook.state.screen.run({
      type: 'invite',
      workspaceId: 'a',
      recipientEmail: 'invitee@example.test',
      role: 'member',
    }),
  );
  assert.equal(hook.state.screen.invitationLinkVisible, true);
  assert.equal(new URL(hook.state.invitationLink).hash, `#invitation=${generated}`);
  await act(async () => hook.state.screen.finishInvitationLink());
  assert.equal(hook.state.invitationLink, null);
  assert.equal(hook.state.outcome, null);
  assert.equal(hook.state.screen.lastAction, null);
  assert.equal(hook.state.hasInvitation, true);
  assert.equal(hook.state.screen.memoryPresent, true);
  assert.ok(!JSON.stringify(hook.state).includes(inbound));
  await act(async () => hook.state.screen.acceptInvitation());
  assert.equal(posts(browser).length, 2);
  assert.deepEqual(body(posts(browser)[1]), { token: inbound });
  assert.notEqual(key(posts(browser)[1]), key(posts(browser)[0]));
  assert.equal(hook.state.hasInvitation, false);
  assert.ok(
    browser.requests.every(({ url }) => !url.includes(inbound) && !url.includes(generated)),
  );
  assert.ok(
    [...Array(browser.window.sessionStorage.length)].every((_, i) => {
      const value = browser.window.sessionStorage.getItem(browser.window.sessionStorage.key(i));
      return !value.includes(inbound) && !value.includes(generated);
    }),
  );
});

for (const failure of ['offline', 'forbidden']) {
  test(`screen paging suppresses concurrent collections and clears loading after ${failure}`, async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    const server = workspaceHttp(browser);
    server.members = { items: [workspaceMember()], total: 2, nextCursor: 'member-page-2' };
    server.invitations = { items: [], total: 1, nextCursor: 'invitation-page-2' };
    const response = deferred();
    server.more = () => response.promise;
    const hook = await mountHook(browser, useWorkspaceScreen);
    let loading;
    await act(async () => {
      loading = hook.state.screen.loadMore('members');
    });
    assert.equal(hook.state.screen.loadingMore, 'members');
    await act(async () => hook.state.screen.loadMore('invitations'));
    const cursorRequests = browser.requests.filter(({ url }) =>
      new URL(url, browser.window.location.origin).searchParams.has('cursor'),
    );
    assert.equal(cursorRequests.length, 1);
    assert.equal(
      new URL(cursorRequests[0].url, browser.window.location.origin).searchParams.get('cursor'),
      'member-page-2',
    );
    await act(async () => {
      if (failure === 'offline') response.reject(new Error('Synthetic page boundary offline'));
      else
        response.resolve(Response.json({ code: 'FORBIDDEN', message: 'Denied' }, { status: 403 }));
      await loading;
    });
    assert.equal(hook.state.screen.loadingMore, null);
    assert.equal(hook.state.status, failure === 'offline' ? 'error' : 'forbidden');
    assert.equal(hook.state.members, null);
    assert.equal(hook.state.invitations, null);
    assert.equal(hook.state.workspace, null);
    assert.equal(posts(browser).length, 0);
  });
}

test('a retained draft uses its previously loaded workspace label outside the current page', async (t) => {
  const browser = browserFixture(t, 'https://app.example.test/workspaces');
  const server = workspaceHttp(browser);
  const hook = await mountHook(browser, useWorkspaceScreen);
  await act(async () => hook.state.screen.stageDraft(updateMember));
  server.workspaces = page([workspace('b')]);
  await act(async () => hook.state.refresh());
  assert.equal(
    hook.state.selectedWorkspaceId,
    'a',
    'selection is reauthorized outside first discovery page',
  );
  assert.deepEqual(
    hook.state.workspaces.items.map(({ id }) => id),
    ['b'],
  );
  assert.equal(hook.state.screen.draftScopeName, 'Workspace a');
  assert.equal(hook.state.screen.draftMemory, true);
  await act(async () => hook.state.selectWorkspace('b'));
  assert.equal(hook.state.screen.draftMismatch, true);
  assert.equal(hook.state.screen.draftScopeName, 'Workspace a');
  server.session = identitySession('replacement');
  server.workspaces = page([workspace('replacement')]);
  await act(async () => hook.state.refresh());
  assert.equal(hook.state.session.user.id, 'replacement');
  assert.equal(hook.state.draft, null);
  assert.equal(hook.state.screen.draftScopeName, null);
  assert.equal(hook.state.screen.draftMemory, false);
  assert.equal(posts(browser).length, 0);
});

test('screen dismiss keeps the invalid draft while discard clears it', async (t) => {
  const browser = browserFixture(t, 'https://app.example.test/workspaces');
  const server = workspaceHttp(browser);
  server.mutate = () =>
    Response.json({ code: 'INVALID_INPUT', message: 'Invalid change' }, { status: 400 });
  const hook = await mountHook(browser, useWorkspaceScreen);
  await act(async () => hook.state.screen.run(updateMember));
  assert.equal(hook.state.outcome, 'invalid');
  assert.equal(hook.state.retryTarget, null);
  assert.ok(hook.state.screen.lastAction);
  await act(async () => hook.state.screen.dismiss());
  assert.equal(hook.state.outcome, null);
  assert.equal(hook.state.screen.lastAction, null);
  assert.deepEqual(hook.state.draft, updateMember);
  assert.equal(hook.state.screen.draftMemory, true);
  await act(async () => hook.state.screen.discard());
  assert.equal(hook.state.draft, null);
  assert.equal(hook.state.screen.draftMemory, false);
  assert.equal(posts(browser).length, 1);
});
