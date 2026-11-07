import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useWorkspaces } from '../../src/lib/use-workspaces.ts';
import {
  act,
  browserFixture,
  deferred,
  fixedNow,
  identitySession,
  mountHook,
  page,
  workspace,
} from './dom-harness.mjs';

function workspaceHttp(browser) {
  const server = {
    session: identitySession(),
    workspaces: [workspace('a')],
    detail: (id) => Response.json(workspace(id)),
    mutate: () => Response.json(workspace('joined')),
  };
  browser.setFetch(async (request) => {
    const path = new URL(request.url, browser.window.location.origin).pathname;
    if (request.options.method === 'POST') return server.mutate(request);
    if (path === '/api/v1/identity/config')
      return Response.json({ enabled: true, providers: ['github'] });
    if (path === '/api/v1/identity/session') return Response.json(server.session);
    if (path === '/api/v1/workspaces') return Response.json(page(server.workspaces));
    if (/\/workspaces\/[^/]+\/(members|invitations)$/.test(path)) return Response.json(page([]));
    const detail = /^\/api\/v1\/workspaces\/([^/]+)$/.exec(path);
    if (detail) return server.detail(decodeURIComponent(detail[1]));
    throw new Error(`Unexpected request path: ${path}`);
  });
  return server;
}

test(
  'StrictMode captures and scrubs mount/hashchange invitations until explicit acceptance',
  { timeout: 30_000 },
  async (t) => {
    const first = 'a'.repeat(43);
    const second = 'b'.repeat(43);
    const browser = browserFixture(
      t,
      `https://app.example.test/workspaces?view=members#invitation=${first}`,
    );
    browser.window.history.replaceState({ navigation: 7 }, '', browser.window.location.href);
    workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces, true);
    assert.equal(hook.state.status, 'ready');
    assert.equal(hook.state.hasInvitation, true);
    assert.equal(browser.window.location.hash, '');
    assert.equal(
      browser.window.location.pathname + browser.window.location.search,
      '/workspaces?view=members',
    );
    assert.deepEqual(browser.window.history.state, { navigation: 7 });
    assert.ok(!JSON.stringify(hook.state).includes(first));
    assert.ok(
      browser.requests.every(
        ({ url, options }) => !url.includes(first) && options.method !== 'POST',
      ),
    );
    await act(async () => hook.state.clearInvitation());
    browser.window.history.replaceState(browser.window.history.state, '', `#invitation=${second}`);
    await browser.event('hashchange');
    assert.equal(hook.state.hasInvitation, true);
    assert.equal(browser.window.location.hash, '');
    await act(async () => hook.state.acceptInvitation());
    const posts = browser.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(posts.length, 1);
    assert.equal(posts[0].url, '/api/v1/workspace-invitations/accept');
    assert.deepEqual(JSON.parse(posts[0].options.body), { token: second });
    assert.equal(hook.state.hasInvitation, false);
    assert.equal(hook.state.workspace.id, 'joined');
    assert.ok(!JSON.stringify(hook.state).includes(second));
    assert.deepEqual(
      [...browser.listeners.values()].map((listeners) => listeners.size),
      [1, 1, 1],
    );
    await browser.unmount();
    assert.deepEqual(
      [...browser.listeners.values()].map((listeners) => listeners.size),
      [0, 0, 0],
    );
    assert.equal(browser.timers.size, 0);
    const count = browser.requests.length;
    await browser.event('pageshow');
    await browser.event('hashchange');
    await browser.visibility('visible');
    assert.equal(browser.requests.length, count);
  },
);

test(
  'only visible pageshow and visibility changes refresh the real hook',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    assert.equal(hook.state.status, 'ready');
    const configReads = () =>
      browser.requests.filter(({ url }) => url === '/api/v1/identity/config').length;
    const before = configReads();
    await browser.visibility('hidden');
    await browser.event('pageshow');
    assert.equal(configReads(), before);
    await browser.visibility('visible');
    assert.equal(configReads(), before + 1);
    assert.equal(hook.state.status, 'ready');
    await browser.event('pageshow');
    assert.equal(configReads(), before + 2);
    assert.equal(hook.state.status, 'ready');
  },
);

test(
  'expiry timer clamps long sessions, replaces the schedule, refreshes at expiry and clears on unmount',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    const server = workspaceHttp(browser);
    server.session = identitySession('human', fixedNow + 2_147_483_647 + 10_000);
    const hook = await mountHook(browser, useWorkspaces, true);
    assert.equal(browser.timers.size, 1);
    const [longId, longTimer] = [...browser.timers.entries()][0];
    assert.equal(longTimer.delay, 2_147_483_647);
    server.session = identitySession('human', fixedNow + 5_000);
    await act(async () => hook.state.refresh());
    assert.equal(browser.timers.has(longId), false);
    assert.equal(browser.timers.size, 1);
    const [shortId, shortTimer] = [...browser.timers.entries()][0];
    assert.equal(shortTimer.delay, 5_000);
    const count = browser.requests.length;
    browser.setNow(fixedNow + 5_000);
    await browser.fireTimer(shortId);
    assert.equal(hook.state.status, 'signed-out');
    assert.equal(hook.state.session, null);
    assert.equal(hook.state.workspace, null);
    assert.equal(browser.timers.size, 0);
    assert.deepEqual(
      browser.requests.slice(count).map(({ url }) => url),
      ['/api/v1/identity/config', '/api/v1/identity/session'],
    );
    server.session = identitySession('human', fixedNow + 20_000);
    await act(async () => hook.state.refresh());
    assert.equal(browser.timers.size, 1);
    await browser.unmount();
    assert.equal(browser.timers.size, 0);
    for (const { options } of browser.requests.filter(({ url }) =>
      url.startsWith('/api/v1/workspaces'),
    )) {
      assert.equal(options.signal.aborted, true, 'cleanup aborts every workspace load generation');
    }
  },
);

test(
  'sessionStorage read, write and removal failures leave selection usable',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    workspaceHttp(browser);
    const attempts = [];
    const storage = browser.window.Storage.prototype;
    for (const name of ['getItem', 'setItem', 'removeItem']) {
      browser.replace(storage, name, (...args) => {
        attempts.push({ name, args });
        throw new Error('Synthetic storage denial');
      });
    }
    const hook = await mountHook(browser, useWorkspaces);
    assert.equal(hook.state.status, 'ready');
    assert.equal(hook.state.selectedWorkspaceId, 'a');
    await act(async () => hook.state.selectWorkspace(null));
    assert.equal(hook.state.status, 'empty');
    await act(async () => hook.state.selectWorkspace('b'));
    assert.equal(hook.state.workspace.id, 'b');
    assert.equal(hook.state.status, 'ready');
    assert.deepEqual(
      new Set(attempts.map(({ name }) => name)),
      new Set(['getItem', 'setItem', 'removeItem']),
    );
    assert.ok(attempts.every(({ args }) => args[0] === 'rielia.workspace.human'));
  },
);

test(
  'account replacement clears private draft/retry/invitation state and rejects former-user late loads',
  { timeout: 30_000 },
  async (t) => {
    const token = 'c'.repeat(43);
    const browser = browserFixture(t, `https://app.example.test/workspaces#invitation=${token}`);
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    await act(async () =>
      hook.state.stage({ type: 'create-workspace', name: 'Private former-user draft' }),
    );
    server.mutate = () => {
      throw new Error('Synthetic lost mutation response');
    };
    await act(async () => hook.state.submit());
    assert.equal(hook.state.outcome, 'error');
    assert.ok(hook.state.retryTarget);
    assert.equal(hook.state.hasInvitation, true);
    const old = deferred();
    server.detail = (id) => (id === 'a' ? old.promise : Response.json(workspace(id)));
    let selection;
    await act(async () => {
      selection = hook.state.selectWorkspace('a');
    });
    const formerRequest = browser.requests.at(-1);
    server.session = identitySession('replacement');
    server.workspaces = [workspace('replacement-workspace')];
    await act(async () => hook.state.refresh());
    assert.equal(formerRequest.options.signal.aborted, true);
    assert.equal(hook.state.session.user.id, 'replacement');
    assert.equal(hook.state.workspace.id, 'replacement-workspace');
    assert.equal(hook.state.draft, null);
    assert.equal(hook.state.retryTarget, null);
    assert.equal(hook.state.hasInvitation, false);
    assert.equal(hook.state.invitationLink, null);
    assert.equal(hook.state.outcome, null);
    await act(async () => {
      old.resolve(Response.json(workspace('a')));
      await selection;
    });
    assert.equal(hook.state.session.user.id, 'replacement');
    assert.equal(hook.state.workspace.id, 'replacement-workspace');
    const posts = browser.requests.filter(({ options }) => options.method === 'POST').length;
    await act(async () => {
      await hook.state.retrySave();
      await hook.state.acceptInvitation();
    });
    assert.equal(
      browser.requests.filter(({ options }) => options.method === 'POST').length,
      posts,
      'former private intents cannot execute as the replacement account',
    );
  },
);

test(
  'account replacement clears an already generated private invitation link',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    const token = 'd'.repeat(43);
    server.mutate = () =>
      Response.json({
        invitation: {
          id: 'invitation',
          workspaceId: 'a',
          recipientEmail: 'recipient@example.test',
          role: 'viewer',
          issuerPrincipalId: 'human',
          createdAt: '2026-11-06T12:00:00.000Z',
          expiresAt: '2026-11-13T12:00:00.000Z',
          state: 'pending',
        },
        token,
      });
    await act(async () =>
      hook.state.stage({
        type: 'invite',
        workspaceId: 'a',
        recipientEmail: 'recipient@example.test',
        role: 'viewer',
      }),
    );
    await act(async () => hook.state.submit());
    assert.equal(
      hook.state.invitationLink,
      `https://app.example.test/workspaces#invitation=${token}`,
    );
    server.session = identitySession('replacement');
    server.workspaces = [workspace('replacement-workspace')];
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.status, 'ready');
    assert.equal(hook.state.session.user.id, 'replacement');
    assert.equal(hook.state.invitationLink, null);
    assert.ok(!JSON.stringify(hook.state).includes(token));
  },
);

test(
  'unmount aborts a pending workspace read and its late result cannot render',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/workspaces');
    const server = workspaceHttp(browser);
    const old = deferred();
    server.detail = () => old.promise;
    const hook = await mountHook(browser, useWorkspaces);
    assert.equal(hook.state.status, 'loading');
    const request = browser.requests.at(-1);
    await browser.unmount();
    assert.equal(request.options.signal.aborted, true);
    assert.equal(browser.timers.size, 0);
    assert.ok([...browser.listeners.values()].every((listeners) => listeners.size === 0));
    const count = hook.renders.length;
    await act(async () => old.resolve(Response.json(workspace('a'))));
    assert.equal(hook.renders.length, count);
    assert.equal(hook.state.workspace, null);
    assert.equal(browser.container.textContent, '');
  },
);
