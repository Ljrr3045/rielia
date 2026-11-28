import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { workspaceMember, workspaceInvitation } from './workspace-screen-fixtures.mjs';
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
    configuration: () => Response.json({ enabled: true, providers: ['github'] }),
    workspaces: [workspace('a')],
    detail: (id) => Response.json(workspace(id)),
    mutate: () => Response.json(workspace('joined')),
  };
  browser.setFetch(async (request) => {
    const path = new URL(request.url, browser.window.location.origin).pathname;
    if (request.options.method === 'POST') return server.mutate(request);
    if (path === '/api/v1/identity/config') return server.configuration();
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
    assert.ok(
      browser.requests
        .filter(({ url }) => url.startsWith('/api/v1/workspaces'))
        .every(({ options }) => options.signal instanceof AbortSignal),
    );
    // Completed Query reads are settled; retirement need not abort an already completed signal.
    // The independent pending-read unmount case below checks actual abort and late completion.
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
  'unmount aborts a pending read and its late result cannot persist private selection',
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
    assert.equal(browser.window.sessionStorage.getItem('rielia.workspace.human'), null);
    // This fetch boundary deliberately resolves despite abort. Observe the
    // controller's persistence effect, which remains observable after React unmount.
    await act(async () => old.resolve(Response.json(workspace('a'))));
    assert.equal(browser.window.sessionStorage.getItem('rielia.workspace.human'), null);
  },
);

test(
  'workspace request trace exercises actual admin and viewer owners through paging, confirmation and verification',
  { timeout: 30_000 },
  async (t) => {
    const traces = [];
    for (const role of ['owner', 'viewer']) {
      await t.test(role, async (scene) => {
        const browser = browserFixture(scene, 'https://app.example.test/workspaces');
        let failedVerification = false;
        let heldMutation = null;
        const entries = [];
        const snapshots = [];
        browser.setFetch(async (request) => {
          const url = new URL(request.url, browser.window.location.origin);
          const path = url.pathname;
          const resource = path.endsWith('/config')
            ? 'configuration'
            : path.endsWith('/session')
              ? 'session'
              : path === '/api/v1/workspaces'
                ? 'workspaces'
                : path.endsWith('/members')
                  ? 'members'
                  : path.endsWith('/invitations')
                    ? 'invitations'
                    : 'workspace';
          const entry = {
            resource,
            method: request.options.method ?? 'GET',
            parsed: false,
            aborted: false,
          };
          entries.push(entry);
          request.options.signal?.addEventListener(
            'abort',
            () => {
              entry.aborted = true;
            },
            { once: true },
          );
          let value;
          if (entry.method === 'POST') value = await heldMutation.promise;
          else if (resource === 'configuration') {
            if (failedVerification) throw new Error('Synthetic unavailable identity verification');
            value = { enabled: true, providers: ['github'] };
          } else if (resource === 'session') value = identitySession();
          else if (resource === 'workspaces')
            value = url.searchParams.has('cursor')
              ? { ...page([workspace('c')]), total: 3 }
              : { items: [workspace('a'), workspace('b')], total: 3, nextCursor: 'next' };
          else if (resource === 'workspace') value = { ...workspace(path.split('/').at(-1)), role };
          else {
            const more = url.searchParams.has('cursor');
            const row =
              resource === 'members'
                ? workspaceMember(more ? 'second' : 'member')
                : workspaceInvitation({
                    id: more ? 'second-invitation' : 'invitation',
                    workspaceId: path.split('/')[4],
                  });
            value = { items: [row], total: 2, nextCursor: more ? null : 'next' };
          }
          const response = Response.json(value);
          const json = response.json.bind(response);
          response.json = async () => {
            const value = await json();
            entry.parsed = true;
            return value;
          };
          return response;
        });
        const hook = await mountHook(browser, useWorkspaces);
        const checkpoint = (name) =>
          snapshots.push({
            name,
            status: hook.state.status,
            resources: Object.fromEntries(
              ['configuration', 'session', 'workspaces', 'workspace', 'members', 'invitations'].map(
                (resource) => {
                  const rows = entries.filter(
                    (entry) => entry.resource === resource && entry.method === 'GET',
                  );
                  return [
                    resource,
                    {
                      starts: rows.length,
                      parsed: rows.filter((entry) => entry.parsed).length,
                      aborted: rows.filter((entry) => entry.aborted).length,
                    },
                  ];
                },
              ),
            ),
            posts: entries.filter((entry) => entry.method === 'POST').length,
          });
        assert.equal(hook.state.status, 'ready');
        checkpoint('initial');
        await act(async () => {
          await hook.state.loadMore('workspaces');
          await hook.state.loadMore('members');
          if (role === 'owner') await hook.state.loadMore('invitations');
        });
        checkpoint('paging');
        await act(async () => hook.state.selectWorkspace('b'));
        checkpoint('switch');
        if (role === 'owner') {
          for (const command of [
            {
              type: 'update-member',
              workspaceId: 'b',
              principalId: 'member',
              version: 4,
              role: 'viewer',
            },
            {
              type: 'invite',
              workspaceId: 'b',
              recipientEmail: 'recipient@example.test',
              role: 'viewer',
            },
          ]) {
            heldMutation = deferred();
            let saving;
            await act(async () => {
              hook.state.stage(command);
              saving = hook.state.submit();
            });
            const before = entries.length;
            await browser.event('pageshow');
            await browser.visibility('visible');
            assert.equal(
              entries.length,
              before,
              'return hints cannot read while the write is pending',
            );
            await act(async () => {
              heldMutation.resolve(
                command.type === 'invite'
                  ? {
                      invitation: workspaceInvitation({ id: 'created', workspaceId: 'b' }),
                      token: 'z'.repeat(43),
                    }
                  : workspaceMember(),
              );
              await saving;
            });
            assert.equal(hook.state.outcome, 'success');
            checkpoint(`confirmed-${command.type}`);
          }
        }
        failedVerification = true;
        await act(async () => hook.state.refresh());
        assert.equal(hook.state.session, null);
        assert.equal(hook.state.workspace, null);
        checkpoint('failed-verification');
        failedVerification = false;
        await act(async () => hook.state.refresh());
        assert.equal(hook.state.status, 'ready');
        checkpoint('verified-recovery');
        await browser.unmount();
        checkpoint('unmounted');
        traces.push({ role, snapshots });
      });
    }
    if (process.env.RIELIA_WORKSPACE_TRACE) {
      assert.match(
        process.env.RIELIA_WORKSPACE_TRACE,
        /^coverage\/t38-workspace-query-(?:implementation|correction)\/[a-z-]+\.json$/,
      );
      writeFileSync(process.env.RIELIA_WORKSPACE_TRACE, `${JSON.stringify(traces, null, 2)}\n`);
    }
  },
);

test(
  'temporary failed verification masks private recovery and same-session renewal preserves exact original command',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(
      t,
      `https://app.example.test/workspaces#invitation=${'r'.repeat(43)}`,
    );
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    const epoch = hook.state.epoch;
    server.mutate = () => {
      throw new Error('Synthetic unknown outcome');
    };
    await act(async () => {
      hook.state.stage({ type: 'create-workspace', name: 'Private original' });
      await hook.state.submit();
    });
    const original = browser.requests.find(({ options }) => options.method === 'POST');
    const expiry = hook.state.memoryExpiresAt;
    server.configuration = () => {
      throw new Error('Synthetic verification failure');
    };
    const start = hook.renders.length;
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.status, 'error');
    for (const render of hook.renders.slice(start)) {
      assert.equal(render.workspace, null);
      assert.equal(render.draft, null);
      assert.equal(render.retryTarget, null);
      assert.equal(render.hasInvitation, false);
    }
    const count = browser.requests.length;
    await act(async () => {
      await hook.state.retrySave();
      await hook.state.selectWorkspace('b');
      await hook.state.acceptInvitation();
    });
    assert.equal(browser.requests.length, count);
    server.configuration = () => Response.json({ enabled: true, providers: ['github'] });
    server.session = identitySession('human', fixedNow + 120_000);
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.epoch, epoch);
    assert.equal(hook.state.draft.name, 'Private original');
    assert.equal(hook.state.memoryExpiresAt, expiry);
    server.mutate = () => Response.json(workspace('joined'));
    await act(async () => hook.state.retrySave());
    const posts = browser.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(posts.length, 2);
    assert.equal(posts[1].options.body, original.options.body);
    assert.equal(
      new globalThis.Headers(posts[1].options.headers).get('Idempotency-Key'),
      new globalThis.Headers(original.options.headers).get('Idempotency-Key'),
    );
    assert.equal(hook.state.outcome, 'success');
  },
);

test(
  'original memory expiry erases renewed-session draft and token before retry can execute',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(
      t,
      `https://app.example.test/workspaces#invitation=${'e'.repeat(43)}`,
    );
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    await act(async () => hook.state.stage({ type: 'create-workspace', name: 'Expires' }));
    const epoch = hook.state.epoch;
    server.session = identitySession('human', fixedNow + 120_000);
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.memoryExpiresAt, new Date(fixedNow + 60_000).toISOString());
    browser.setNow(fixedNow + 60_000);
    const timer = [...browser.timers.keys()][0];
    await browser.fireTimer(timer);
    assert.equal(hook.state.draft, null);
    assert.equal(hook.state.hasInvitation, false);
    assert.notEqual(hook.state.epoch, epoch);
    const count = browser.requests.length;
    await act(async () => {
      await hook.state.retrySave();
      await hook.state.acceptInvitation();
    });
    assert.equal(browser.requests.length, count);
  },
);

for (const reason of ['replacement-session', 'disabled', 'signed-out', 'forbidden']) {
  test(
    `${reason} erases private intent and select cannot recreate authority before verification`,
    { timeout: 30_000 },
    async (t) => {
      const browser = browserFixture(
        t,
        `https://app.example.test/workspaces#invitation=${'d'.repeat(43)}`,
      );
      const server = workspaceHttp(browser);
      const hook = await mountHook(browser, useWorkspaces);
      await act(async () =>
        hook.state.stage({ type: 'create-workspace', name: 'Private old lifetime' }),
      );
      const epoch = hook.state.epoch;
      if (reason === 'replacement-session')
        server.session = {
          ...identitySession(),
          session: { ...identitySession().session, id: 'new-session-same-human' },
        };
      if (reason === 'disabled')
        server.configuration = () => Response.json({ enabled: false, providers: [] });
      if (reason === 'signed-out') server.session = null;
      if (reason === 'forbidden') server.detail = () => Response.json({}, { status: 403 });
      await act(async () => hook.state.refresh());
      assert.equal(hook.state.draft, null);
      assert.equal(hook.state.retryTarget, null);
      assert.equal(hook.state.hasInvitation, false);
      assert.notEqual(hook.state.epoch, epoch);
      if (reason !== 'replacement-session') {
        const count = browser.requests.length;
        await act(async () => {
          await hook.state.selectWorkspace('b');
          await hook.state.retrySave();
          await hook.state.acceptInvitation();
        });
        assert.equal(browser.requests.length, count);
        server.session = identitySession();
        server.configuration = () => Response.json({ enabled: true, providers: ['github'] });
        server.detail = (id) => Response.json(workspace(id));
        await act(async () => hook.state.refresh());
        assert.equal(hook.state.status, 'ready');
      }
    },
  );
}

const exactCommands = [
  { type: 'create-workspace', name: 'Original' },
  { type: 'invite', workspaceId: 'a', recipientEmail: 'recipient@example.test', role: 'viewer' },
  { type: 'accept-invitation', token: 'a'.repeat(43) },
  { type: 'revoke-invitation', workspaceId: 'a', invitationId: 'invite-1' },
  {
    type: 'register-agent',
    workspaceId: 'a',
    name: 'Agent',
    role: 'member',
    custodianPrincipalId: 'human',
  },
  {
    type: 'manage-agent',
    workspaceId: 'a',
    principalId: 'agent',
    version: 4,
    state: 'suspended',
    custodianPrincipalId: 'human',
  },
  { type: 'update-member', workspaceId: 'a', principalId: 'member', version: 4, role: 'viewer' },
];
for (const command of exactCommands) {
  test(
    `${command.type} has one explicit unknown recovery with the exact original wire body and key`,
    { timeout: 30_000 },
    async (t) => {
      const browser = browserFixture(
        t,
        `https://app.example.test/workspaces${command.type === 'accept-invitation' ? `#invitation=${command.token}` : ''}`,
      );
      const server = workspaceHttp(browser);
      const hook = await mountHook(browser, useWorkspaces);
      server.mutate = () => {
        throw new Error('Synthetic lost response');
      };
      await act(async () => {
        if (command.type === 'accept-invitation') await hook.state.acceptInvitation();
        else {
          hook.state.stage(command);
          await hook.state.submit();
        }
      });
      assert.equal(hook.state.outcome, 'error');
      assert.equal(hook.state.retryTarget.type, command.type);
      const original = browser.requests.find(({ options }) => options.method === 'POST');
      await act(async () => hook.state.refresh());
      assert.equal(browser.requests.filter(({ options }) => options.method === 'POST').length, 1);
      server.mutate = () =>
        Response.json(
          command.type === 'create-workspace' || command.type === 'accept-invitation'
            ? workspace('joined')
            : command.type === 'invite'
              ? { invitation: workspaceInvitation(), token: 'g'.repeat(43) }
              : command.type === 'revoke-invitation'
                ? workspaceInvitation()
                : workspaceMember(command.type === 'manage-agent' ? 'agent' : 'member'),
        );
      await act(async () => hook.state.retrySave());
      const posts = browser.requests.filter(({ options }) => options.method === 'POST');
      assert.equal(posts.length, 2);
      assert.equal(posts[1].options.body, original.options.body);
      assert.equal(
        new globalThis.Headers(posts[1].options.headers).get('Idempotency-Key'),
        new globalThis.Headers(original.options.headers).get('Idempotency-Key'),
      );
      assert.equal(hook.state.outcome, 'success');
      assert.equal(hook.state.retryTarget, null);
    },
  );
}

test(
  'an expiry render hides private fields before the browser timer performs erasure',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(
      t,
      `https://app.example.test/workspaces#invitation=${'x'.repeat(43)}`,
    );
    workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    await act(async () => hook.state.stage({ type: 'create-workspace', name: 'Private' }));
    browser.setNow(fixedNow + 60_000);
    const start = hook.renders.length;
    await act(async () => hook.state.dismissOutcome());
    for (const render of hook.renders.slice(start)) {
      assert.equal(render.status, 'signed-out');
      assert.equal(render.verified, false);
      assert.equal(render.draft, null);
      assert.equal(render.workspace, null);
      assert.equal(render.hasInvitation, false);
      assert.ok(Object.values(render.resources).every((resource) => resource.data === null));
    }
    await browser.fireTimer([...browser.timers.keys()][0]);
    assert.equal(hook.state.epoch, null);
  },
);

test(
  'a newly captured post-expiry pre-auth invitation is distinct from the erased authenticated token',
  { timeout: 30_000 },
  async (t) => {
    const oldToken = 'o'.repeat(43),
      newToken = 'n'.repeat(43);
    const browser = browserFixture(t, `https://app.example.test/workspaces#invitation=${oldToken}`);
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    browser.setNow(fixedNow + 60_000);
    browser.window.history.replaceState(null, '', `#invitation=${newToken}`);
    await browser.event('hashchange');
    assert.equal(browser.window.location.hash, '');
    assert.equal(hook.state.status, 'signed-out');
    assert.equal(hook.state.hasInvitation, true);
    server.session = {
      ...identitySession('human', fixedNow + 120_000),
      session: { id: 'new-session', expiresAt: new Date(fixedNow + 120_000).toISOString() },
    };
    await act(async () => hook.state.refresh());
    await act(async () => hook.state.acceptInvitation());
    const posts = browser.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(posts.length, 1);
    assert.deepEqual(JSON.parse(posts[0].options.body), { token: newToken });
  },
);

for (const status of [408, 429]) {
  test(
    `${status} requires an explicit original-wire retry after verification and never takes a fresh key`,
    { timeout: 30_000 },
    async (t) => {
      const browser = browserFixture(t, 'https://app.example.test/workspaces');
      const server = workspaceHttp(browser);
      const hook = await mountHook(browser, useWorkspaces);
      server.mutate = () => Response.json({ code: 'temporary' }, { status });
      await act(async () => {
        hook.state.stage({
          type: 'update-member',
          workspaceId: 'a',
          principalId: 'member',
          version: 4,
          role: 'viewer',
        });
        await hook.state.submit();
      });
      assert.equal(hook.state.retryTarget.type, 'update-member');
      const original = browser.requests.find(({ options }) => options.method === 'POST');
      await act(async () => hook.state.refresh());
      assert.equal(browser.requests.filter(({ options }) => options.method === 'POST').length, 1);
      server.mutate = () =>
        Response.json(workspaceMember('member', { version: 5, role: 'viewer' }));
      await act(async () => hook.state.retrySave());
      const posts = browser.requests.filter(({ options }) => options.method === 'POST');
      assert.equal(posts.length, 2);
      assert.equal(posts[1].options.body, original.options.body);
      assert.equal(
        new globalThis.Headers(posts[1].options.headers).get('Idempotency-Key'),
        new globalThis.Headers(original.options.headers).get('Idempotency-Key'),
      );
      assert.equal(hook.state.outcome, 'success');
      assert.equal(hook.state.retryTarget, null);
      assert.deepEqual(
        hook.state.members.items,
        [],
        'a write receipt never seeds the canonical member page',
      );
    },
  );
}

test(
  'memory expiring during verification is erased even when the returned same session has renewed',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(
      t,
      `https://app.example.test/workspaces#invitation=${'e'.repeat(43)}`,
    );
    const server = workspaceHttp(browser);
    const hook = await mountHook(browser, useWorkspaces);
    await act(async () =>
      hook.state.stage({ type: 'create-workspace', name: 'Original expiring memory' }),
    );
    const epoch = hook.state.epoch;
    const held = deferred();
    server.configuration = () => held.promise;
    let verifying;
    await act(async () => {
      verifying = hook.state.refresh();
    });
    assert.equal(hook.state.draft, null);
    browser.setNow(fixedNow + 60_000);
    server.session = identitySession('human', fixedNow + 120_000);
    await act(async () => {
      held.resolve(Response.json({ enabled: true, providers: ['github'] }));
      await verifying;
    });
    assert.equal(hook.state.status, 'ready');
    assert.notEqual(hook.state.epoch, epoch);
    assert.equal(hook.state.draft, null);
    assert.equal(hook.state.retryTarget, null);
    assert.equal(hook.state.hasInvitation, false);
  },
);
