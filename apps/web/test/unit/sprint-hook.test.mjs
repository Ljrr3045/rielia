import assert from 'node:assert/strict';
import { onlineManager } from '@tanstack/react-query';
import { test } from 'node:test';
import {
  act,
  createElement,
  StrictMode,
  browserFixture,
  mountHook,
  identitySession,
  fixedNow,
} from './dom-harness.mjs';
import { projectBrowser } from './project-hook-harness.mjs';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { useProjectSprints } from '../../src/lib/use-project-sprints.ts';
import {
  fields,
  sprint,
  planning,
  plannedSprint,
  sprintServer,
  deferred,
} from './sprint-client-fixtures.mjs';

async function hookFixture(t, strict = false) {
  const browser = browserFixture(t);
  const server = sprintServer();
  browser.setFetch(({ url, options }) => server.fetch(url, options));
  const listeners = new Set();
  let refreshed = 0;
  let source = {
    session: identitySession(),
    status: 'ready',
    selection: { workspaceId: 'w', projectId: 'p', taskId: null },
    subscribeInvalidation(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh() {
      refreshed++;
    },
  };
  let selection = { sprintId: 's', taskId: 't' };
  let latest;
  const renders = [];
  function Harness() {
    latest = useProjectSprints(source, selection);
    renders.push(latest);
    return createElement('output', null, latest.status);
  }
  const render = () =>
    browser.render(
      strict ? createElement(StrictMode, null, createElement(Harness)) : createElement(Harness),
    );
  await render();
  const hook = {
    get state() {
      return latest;
    },
    renders,
  };
  return {
    browser,
    server,
    hook,
    listeners,
    refreshed: () => refreshed,
    async render(value, nextSelection = selection) {
      source = value;
      selection = nextSelection;
      await render();
    },
    async emit(event) {
      await act(async () => {
        listeners.forEach((listener) => listener(event));
      });
    },
    source: () => source,
  };
}

for (const operation of ['read', 'write']) {
  test(
    `PR54 ${operation} 401 remains signed-out with a locally valid parent and permits verified recovery`,
    { timeout: 30_000 },
    async (t) => {
      const b = await hookFixture(t);
      const parent = b.source();
      await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
      if (operation === 'read') {
        b.server.get = ({ path }) =>
          path.endsWith('/planning')
            ? Response.json({ code: 'signed-out' }, { status: 401 })
            : undefined;
        await act(async () => b.hook.state.refresh());
      } else {
        b.server.post = () => Response.json({ code: 'signed-out' }, { status: 401 });
        await act(async () => b.hook.state.submit());
      }
      assert.equal(b.source(), parent);
      assert.equal(parent.status, 'ready');
      assert.ok(Date.parse(parent.session.session.expiresAt) > fixedNow);
      assert.equal(b.hook.state.status, 'signed-out');
      assert.equal(b.hook.state.context, null);
      assert.equal(b.hook.state.draft, null);
      assert.equal(b.hook.state.recovery, null);
      for (const resource of Object.values(b.hook.state.resources))
        assert.equal(resource.data, null);
      const requests = b.server.requests.length;
      await b.render(parent);
      await act(async () => b.hook.state.refresh());
      assert.equal(b.hook.state.status, 'signed-out');
      assert.equal(
        b.server.requests.length,
        requests,
        'local parent validity cannot silently reauthorize a denied controller',
      );
      b.server.get = null;
      await b.render({ ...parent, status: 'loading', session: null });
      assert.equal(b.hook.state.resources.sprint.data, null);
      await b.render(parent);
      assert.equal(b.hook.state.status, 'ready');
      assert.equal(b.hook.state.resources.sprint.status, 'ready');
      assert.equal(b.hook.state.context.sessionId, parent.session.session.id);
      assert.equal(b.hook.state.draft, null);
      assert.equal(
        b.server.requests.filter((r) => r.init.method === 'POST').length,
        operation === 'write' ? 1 : 0,
      );
    },
  );
}

test(
  'PR54 controller403 remains forbidden and defers prop navigation until explicit access refresh',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    b.server.get = ({ path }) =>
      path.endsWith('/planning')
        ? Response.json({ code: 'forbidden' }, { status: 403 })
        : undefined;
    await act(async () => b.hook.state.refresh());
    assert.equal(b.source().status, 'ready');
    assert.equal(b.hook.state.status, 'forbidden');
    for (const resource of Object.values(b.hook.state.resources)) assert.equal(resource.data, null);
    const requests = b.server.requests.length;
    await b.render(b.source(), { sprintId: 's', taskId: null });
    assert.equal(b.hook.state.status, 'forbidden');
    assert.equal(b.hook.state.selection.sprintId, null);
    assert.equal(
      b.server.requests.length,
      requests,
      'a pending selection cannot bypass access denial',
    );
    b.server.get = null;
    await act(async () => b.hook.state.refresh());
    await b.emit({ type: 'reset' });
    assert.equal(b.hook.state.status, 'forbidden');
    assert.equal(
      b.server.requests.length,
      requests,
      'stale props, hints and child refresh cannot reauthorize',
    );
    await b.render({ ...b.source(), status: 'loading', session: null });
    await b.render({ ...b.source(), status: 'ready', session: identitySession() });
    assert.equal(b.hook.state.status, 'ready');
    assert.equal(b.hook.state.selection.sprintId, 's');
    assert.equal(b.hook.state.selection.taskId, null);
    assert.equal(b.hook.state.resources.sprint.status, 'ready');
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 0);
  },
);

test(
  'PR54 latest prop selection reconciles after discard without repeated effects or writes',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const draft = b.hook.state.draft;
    await b.render(b.source(), { sprintId: 's', taskId: null });
    await b.render(b.source(), { sprintId: null, taskId: null });
    assert.deepEqual(b.hook.state.selection, { sprintId: 's', taskId: 't', targetId: null });
    assert.equal(b.hook.state.draft, draft);
    await act(async () => b.hook.state.discardDraft());
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.hook.state.resources.sprint.data, null);
    assert.equal(b.hook.state.resources.task.data, null);
    const requests = b.server.requests.length;
    await b.render(b.source());
    await b.render(b.source());
    assert.equal(
      b.server.requests.length,
      requests,
      'settled navigation must not start a render/refetch loop',
    );
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 0);
  },
);

test(
  'PR54 pending write retains its target and reconciles prop navigation only after confirmed success',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const held = deferred();
    b.server.post = () => held.promise;
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    let saving;
    await act(async () => {
      saving = b.hook.state.submit();
    });
    const recovery = b.hook.state.recovery;
    await b.render(b.source(), { sprintId: null, taskId: null });
    assert.equal(b.hook.state.mutation.status, 'pending');
    assert.equal(b.hook.state.selection.sprintId, 's');
    assert.equal(b.hook.state.recovery, recovery);
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
    await act(async () => {
      held.resolve(Response.json(sprint));
      await saving;
    });
    assert.ok(b.hook.renders.some((render) => render.mutation.status === 'confirmed'));
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.hook.state.recovery, null);
    assert.equal(b.refreshed(), 1);
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  },
);

test(
  'PR54 ambiguous recovery blocks prop navigation until the exact original retry confirms',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    b.server.post = () => {
      throw new Error('Committed response lost');
    };
    await act(async () =>
      b.hook.state.stage({ type: 'edit-sprint', fields: { ...fields, goal: 'Captured goal' } }),
    );
    await act(async () => b.hook.state.submit());
    const recovery = b.hook.state.recovery;
    const posts = () => b.server.requests.filter((r) => r.init.method === 'POST');
    assert.equal(b.hook.state.mutation.status, 'unknown');
    await b.render(b.source(), { sprintId: null, taskId: null });
    assert.equal(b.hook.state.selection.sprintId, 's');
    assert.equal(b.hook.state.recovery, recovery);
    assert.equal(b.hook.state.recovery.command.fields.goal, 'Captured goal');
    await act(async () => b.hook.state.cancelPending());
    assert.equal(b.hook.state.selection.sprintId, 's');
    assert.equal(posts().length, 1);
    b.server.post = () => Response.json(sprint);
    await act(async () => b.hook.state.retrySave());
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.hook.state.recovery, null);
    assert.equal(posts().length, 2);
    assert.equal(posts()[1].init.body, posts()[0].init.body);
    assert.equal(
      posts()[1].init.headers['Idempotency-Key'],
      posts()[0].init.headers['Idempotency-Key'],
    );
  },
);

test(
  'PR54 explicit unknown-outcome discard releases requested navigation without replaying a mutation',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    b.server.post = () => {
      throw new Error('Unknown response');
    };
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    await act(async () => b.hook.state.submit());
    await b.render(b.source(), { sprintId: null, taskId: null });
    assert.equal(b.hook.state.mutation.status, 'unknown');
    assert.equal(b.hook.state.selection.sprintId, 's');
    await act(async () => b.hook.state.discardDraft());
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.hook.state.recovery, null);
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  },
);

test(
  'PR54 definitive write failure retains draft and navigation guard until explicit discard',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    b.server.post = () => Response.json({ code: 'validation-error' }, { status: 400 });
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    await act(async () => b.hook.state.submit());
    const draft = b.hook.state.draft;
    await b.render(b.source(), { sprintId: null, taskId: null });
    assert.equal(b.hook.state.mutation.status, 'failed');
    assert.equal(b.hook.state.draft, draft);
    assert.equal(b.hook.state.selection.sprintId, 's');
    await act(async () => b.hook.state.discardDraft());
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  },
);

test(
  'PR54 context replacement clears blocked navigation and rejects an obsolete pending completion',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const held = deferred();
    let signal;
    b.server.post = ({ init }) => {
      signal = init.signal;
      return held.promise;
    };
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    let saving;
    await act(async () => {
      saving = b.hook.state.submit();
    });
    await b.render(b.source(), { sprintId: null, taskId: null });
    const index = b.hook.renders.length;
    b.server.get = () => Response.json({ code: 'unavailable' }, { status: 503 });
    await b.render({ ...b.source(), session: identitySession('replacement') });
    assert.equal(signal.aborted, true);
    assert.equal(b.hook.state.context.userId, 'replacement');
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    for (const render of b.hook.renders.slice(index)) {
      assert.equal(render.draft, null);
      assert.equal(render.recovery, null);
      assert.equal(render.resources.sprint.data, null);
    }
    await act(async () => {
      held.resolve(Response.json(sprint));
      await saving;
    });
    assert.equal(b.hook.state.mutation.result, null);
    assert.equal(b.hook.state.recovery, null);
    assert.equal(b.refreshed(), 0);
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  },
);

test(
  'PR54 same-session verification retains blocked intent and reconciles props after discard',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const parent = b.source();
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const draft = b.hook.state.draft;
    await b.render(parent, { sprintId: null, taskId: null });
    await b.render({ ...parent, status: 'loading', session: null });
    assert.equal(b.hook.state.status, 'verifying');
    assert.equal(b.hook.state.draft, null);
    await b.render(parent);
    assert.deepEqual(b.hook.state.draft, draft);
    assert.equal(b.hook.state.selection.sprintId, 's');
    assert.equal(b.hook.state.needsReview, true);
    await act(async () => b.hook.state.discardDraft());
    assert.deepEqual(b.hook.state.selection, { sprintId: null, taskId: null, targetId: null });
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 0);
  },
);

for (const strict of [false, true]) {
  test(
    `sprint hook uses real transports/controller, shared invalidation and confirmed parent refresh; StrictMode=${strict}`,
    { timeout: 30_000 },
    async (t) => {
      const b = await hookFixture(t, strict);
      assert.equal(b.hook.state.resources.sprint.status, 'ready');
      assert.equal(b.hook.state.resources.task.status, 'ready');
      assert.equal(b.listeners.size, 1);
      assert.equal(b.browser.requests.filter((r) => r.url.endsWith('/events')).length, 0);
      await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
      const original = b.hook.state.draft;
      b.server.sprint.version = 3;
      await b.emit({ type: 'reset' });
      assert.equal(b.hook.state.draft, original);
      assert.equal(b.hook.state.needsReview, true);
      await act(async () => b.hook.state.rebaseDraft());
      b.server.post = () => Response.json(b.server.sprint);
      await act(async () => b.hook.state.submit());
      assert.equal(b.hook.state.mutation.status, 'confirmed');
      assert.equal(b.refreshed(), 1);
      await b.browser.unmount();
      assert.equal(b.listeners.size, 0);
    },
  );
}

test(
  'sprint hook expires sensitive state with its exact owned timer and removes the subscription',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    b.browser.setNow(fixedNow + 60_001);
    const timer = [...b.browser.timers.keys()][0];
    await b.browser.fireTimer(timer);
    assert.equal(b.hook.state.status, 'signed-out');
    assert.equal(b.hook.state.draft, null);
    assert.equal(b.hook.state.resources.sprint.data, null);
    await b.browser.unmount();
    assert.equal(b.listeners.size, 0);
  },
);

test(
  'hook context replacement masks previous data on every render and aborts obsolete reads/events',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const held = deferred();
    let signal;
    b.server.get = ({ path, init }) => {
      if (path.endsWith('/planning')) {
        signal = init.signal;
        return held.promise;
      }
    };
    const oldListener = [...b.listeners][0];
    await act(async () => {
      void b.hook.state.refresh();
    });
    const index = b.hook.renders.length;
    b.server.get = () => Response.json({ unavailable: true }, { status: 503 });
    await b.render({ ...b.source(), session: identitySession('replacement') });
    assert.equal(signal.aborted, true);
    assert.equal(b.hook.state.draft, null);
    assert.equal(b.hook.state.context.userId, 'replacement');
    for (const render of b.hook.renders.slice(index)) {
      assert.equal(
        render.resources.sprint.data,
        null,
        'old project data must not appear before effects clear the owner',
      );
      assert.equal(render.draft, null);
    }
    await act(async () => {
      held.resolve(Response.json(planning));
      oldListener({ type: 'denied', reason: 'signed-out' });
    });
    assert.equal(b.hook.state.status, 'ready');
    assert.equal(b.hook.state.resources.planning.data, null);
    await b.render({ ...b.source(), session: null, status: 'signed-out' });
    assert.equal(b.hook.state.resources.sprint.data, null);
    assert.equal(b.listeners.size, 0);
  },
);

test(
  'same-session renewal retains intent only before the original deadline and cannot extend its owned timer',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const draft = b.hook.state.draft;
    const requests = b.server.requests.length;
    await b.render({ ...b.source(), session: identitySession('human', fixedNow + 120_000) });
    assert.equal(b.hook.state.draft, draft);
    assert.equal(b.server.requests.length, requests);
    assert.equal(b.browser.timers.size, 1);
    const [id, timer] = [...b.browser.timers.entries()][0];
    assert.equal(timer.delay, 60_000);
    b.browser.setNow(fixedNow + 60_001);
    await b.browser.fireTimer(id);
    assert.equal(b.hook.state.status, 'signed-out');
    assert.equal(b.hook.state.draft, null);
    assert.equal(b.hook.state.recovery, null);
    assert.equal(b.hook.state.mutation.result, null);
    const atExpiry = b.server.requests.length;
    await act(async () => {
      assert.equal(b.hook.state.stage({ type: 'edit-sprint', fields }), 'unavailable');
      assert.equal(await b.hook.state.submit(), 'unavailable');
    });
    assert.equal(b.server.requests.length, atExpiry);
    assert.ok(b.browser.timers.size <= 1);
    await b.browser.unmount();
    assert.equal(b.browser.timers.size, 0);
  },
);

test(
  'expiry timer clamps long lifetimes and reschedules until actual expiry',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const fresh = identitySession('human', fixedNow + 2147483647 + 60_000);
    fresh.session.id = 'fresh-long-lifetime';
    await b.render({
      ...b.source(),
      session: fresh,
    });
    let [id, timer] = [...b.browser.timers.entries()][0];
    assert.equal(timer.delay, 2147483647);
    b.browser.setNow(fixedNow + 2147483647);
    await b.browser.fireTimer(id);
    [id, timer] = [...b.browser.timers.entries()][0];
    assert.equal(timer.delay, 60_000);
    assert.equal(b.hook.state.status, 'ready');
    b.browser.setNow(fixedNow + 2147483647 + 60_000);
    await b.browser.fireTimer(id);
    assert.equal(b.hook.state.status, 'signed-out');
  },
);

test(
  'temporary parent verification hides data and preserves same-session drafts across ordinary failure',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const originalSource = b.source();
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const draft = b.hook.state.draft;
    await b.render({ ...originalSource, status: 'loading', session: null });
    assert.equal(b.hook.state.status, 'verifying');
    assert.equal(b.hook.state.resources.sprint.data, null);
    assert.equal(b.hook.state.draft, null, 'an unverified parent cannot expose private drafts');
    assert.equal(b.listeners.size, 0);
    assert.equal(b.browser.timers.size, 1, 'the suspended execution still expires');
    await b.render({ ...originalSource, status: 'error', session: null });
    assert.equal(b.hook.state.resources.sprint.data, null);
    await b.render(originalSource);
    assert.deepEqual(b.hook.state.draft, draft);
    assert.equal(b.hook.state.needsReview, true);
    assert.equal(b.hook.state.resources.sprint.status, 'ready');
    await b.render({ ...originalSource, status: 'forbidden', session: null });
    assert.equal(b.hook.state.status, 'forbidden');
    assert.equal(b.hook.state.resources.sprint.data, null);
    await b.render(originalSource);
    assert.equal(b.hook.state.draft, null, 'confirmed access loss clears the suspended draft');
  },
);

test(
  'a suspended parent verification cannot retain private data beyond session expiry',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const originalSource = b.source();
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    await b.render({ ...originalSource, status: 'loading', session: null });
    b.browser.setNow(fixedNow + 60_001);
    await b.browser.fireTimer([...b.browser.timers.keys()][0]);
    assert.equal(b.hook.state.status, 'signed-out');
    const renewed = { ...originalSource, session: identitySession('human', fixedNow + 120_000) };
    await b.render(renewed);
    assert.equal(b.hook.state.draft, null);
  },
);

test(
  'unmount aborts a pending write without leaving timers or subscriptions',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    const held = deferred();
    let signal;
    b.server.post = ({ init }) => {
      signal = init.signal;
      return held.promise;
    };
    await act(async () => {
      b.hook.state.stage({ type: 'edit-sprint', fields });
    });
    await act(async () => {
      void b.hook.state.submit();
    });
    assert.equal(b.hook.state.mutation.status, 'pending');
    await b.browser.unmount();
    assert.equal(signal.aborted, true);
    assert.equal(b.listeners.size, 0);
    held.resolve(Response.json(sprint));
  },
);

test(
  'parent and sprint hook share one real session/SSE lifetime and visibility reset',
  { timeout: 30_000 },
  async (t) => {
    const browser = projectBrowser(t, '?workspace=a&project=p');
    const server = sprintServer();
    function scopeValue(value) {
      if (Array.isArray(value)) return value.map(scopeValue);
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            key === 'workspaceId' ? 'a' : scopeValue(item),
          ]),
        );
      return value;
    }
    for (const key of ['planning', 'list', 'sprint', 'task', 'scope', 'history', 'target'])
      server[key] = scopeValue(server[key]);
    // Keep the existing project HTTP/stream fixture; intercept only the new sidecars.
    const originalFetch = globalThis.fetch;
    // Intercept at the outer fetch boundary, preserving projectBrowser's original handler.
    globalThis.fetch = (url, options) => {
      const path = new URL(String(url), 'https://app.example.test').pathname;
      if (/\/(planning|sprints)(?:\/|$)/.test(path)) return server.fetch(url, options);
      return originalFetch(url, options);
    };
    let confirmations = 0;
    const hook = await mountHook(browser, () => {
      const project = useProjectTasks();
      const sprints = useProjectSprints(
        {
          ...project,
          refresh: async () => {
            confirmations++;
            await project.refresh();
          },
        },
        { sprintId: 's', taskId: null },
      );
      return { ...sprints, project };
    });
    await browser.clock.advance(500);
    assert.equal(hook.state.project.status, 'ready');
    assert.equal(hook.state.resources.sprint.status, 'ready');
    assert.equal(browser.server.streams.filter((s) => !s.request.options.signal.aborted).length, 1);
    const before = server.requests.length;
    await browser.visibility('hidden');
    await browser.event('focus');
    assert.equal(server.requests.length, before);
    server.sprint.version = 3;
    await browser.visibility('visible');
    await browser.clock.advance(500);
    assert.equal(hook.state.resources.sprint.data.version, 3);
    server.post = () => Response.json(server.sprint);
    await act(async () => hook.state.stage({ type: 'edit-sprint', fields }));
    await act(async () => hook.state.submit());
    await browser.clock.advance(500);
    assert.equal(hook.state.project.status, 'ready');
    assert.equal(
      hook.state.mutation.status,
      'confirmed',
      'the real parent Refresh cannot erase the confirmed sprint result',
    );
    assert.equal(hook.state.resources.sprint.status, 'ready');
    assert.equal(server.requests.filter((r) => r.init.method === 'POST').length, 1);
    assert.equal(confirmations, 1, 'a confirmed write requests exactly one parent refresh');
    await act(async () =>
      browser.server.streams.at(-1).emit({ type: 'denied', reason: 'forbidden' }),
    );
    await browser.clock.advance(500);
    assert.equal(hook.state.resources.sprint.data, null);
  },
);

for (const status of [401, 403]) {
  test(`Query create ${status} stays denied through stale props/hints/refresh until parent verification`, async (t) => {
    const b = await hookFixture(t);
    const parent = b.source();
    b.server.post = () => Response.json({ code: 'denied' }, { status });
    await act(async () => b.hook.state.stage({ type: 'create-sprint', fields }));
    await act(async () => b.hook.state.submit());
    const denied = status === 401 ? 'signed-out' : 'forbidden';
    assert.equal(b.hook.state.status, denied);
    const start = b.hook.renders.length;
    const requests = b.server.requests.length;
    await b.emit({ type: 'reset' });
    await b.render(parent);
    await act(async () => b.hook.state.refresh());
    assert.equal(b.server.requests.length, requests);
    assert.ok(
      b.hook.renders
        .slice(start)
        .every((r) => Object.values(r.resources).every((v) => v.data === null)),
    );
    await b.render({ ...parent, status: 'loading', session: null });
    await b.render(parent);
    assert.equal(b.hook.state.status, 'ready');
    assert.equal(b.hook.state.resources.planning.status, 'ready');
    assert.equal(b.hook.state.resources.sprints.status, 'ready');
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  });
}

test('Query create offline/reconnect/read refresh keeps exact unknown command and only explicit Retry sends it', async (t) => {
  const b = await hookFixture(t);
  onlineManager.setOnline(false);
  t.after(() => onlineManager.setOnline(true));
  b.server.post = () => {
    throw new Error('response lost');
  };
  await act(async () =>
    b.hook.state.stage({ type: 'create-sprint', fields: { ...fields, name: '  Original  ' } }),
  );
  await act(async () => b.hook.state.submit());
  const recovery = b.hook.state.recovery;
  assert.equal(b.hook.state.mutation.status, 'unknown');
  assert.equal(recovery.command.expectedProjectVersion, 2);
  const original = b.server.requests.find((r) => r.init.method === 'POST');
  onlineManager.setOnline(true);
  b.server.planning.projectVersion = 7;
  await b.emit({ type: 'reset' });
  await act(async () => b.hook.state.reload('planning'));
  assert.equal(b.hook.state.recovery, recovery);
  assert.equal(b.hook.state.resources.planning.data.projectVersion, 7);
  assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  b.server.post = () => Response.json(sprint);
  await act(async () => b.hook.state.retrySave());
  const posts = b.server.requests.filter((r) => r.init.method === 'POST');
  assert.equal(posts.length, 2);
  assert.equal(posts[1].init.body, original.init.body);
  assert.equal(posts[1].init.headers['Idempotency-Key'], original.init.headers['Idempotency-Key']);
  assert.equal(b.hook.state.mutation.status, 'confirmed');
  assert.equal(b.refreshed(), 1);
});

test('Query create confirmation survives parent refresh failure and never retries the accepted write', async (t) => {
  const b = await hookFixture(t);
  await b.render({
    ...b.source(),
    refresh: async () => {
      throw new Error('verification unavailable');
    },
  });
  b.server.post = () => {
    b.server.get = () => Response.json({ code: 'unavailable' }, { status: 503 });
    return Response.json(sprint);
  };
  await act(async () => b.hook.state.stage({ type: 'create-sprint', fields }));
  await act(async () => b.hook.state.submit());
  assert.equal(b.hook.state.mutation.status, 'confirmed');
  assert.equal(b.hook.state.resources.planning.status, 'error');
  assert.equal(b.hook.state.resources.sprints.status, 'error');
  assert.equal(await b.hook.state.retrySave(), 'unavailable');
  assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
});

for (const [name, path, status] of [
  ['task', '/tasks/t/planning', 401],
  ['scope', '/sprints/s/scope', 403],
]) {
  test(`Query ${name} ${status} stays terminal through unchanged props and hints until parent verification`, async (t) => {
    const b = await hookFixture(t);
    const parent = b.source();
    b.server.get = ({ path: url }) =>
      url.endsWith(path) ? Response.json({}, { status }) : undefined;
    await act(async () => b.hook.state.reload(name));
    const denied = status === 401 ? 'signed-out' : 'forbidden';
    assert.equal(b.hook.state.status, denied);
    const start = b.hook.renders.length;
    const calls = b.server.requests.length;
    await b.render(parent);
    await b.emit({ type: 'reset' });
    await act(async () => b.hook.state.refresh());
    assert.equal(b.server.requests.length, calls);
    assert.ok(
      b.hook.renders
        .slice(start)
        .every((r) => Object.values(r.resources).every((v) => v.data === null)),
    );
    b.server.get = null;
    await b.render({ ...parent, status: 'loading', session: null });
    await b.render(parent);
    assert.equal(b.hook.state.status, 'ready');
    assert.equal(b.hook.state.resources[name].status, 'ready');
    assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 0);
  });
}

for (const type of ['create-sprint', 'edit-sprint']) {
  test(`public ${type} completion stays hidden through failed verification and confirms once after actual resume`, async (t) => {
    const b = await hookFixture(t);
    const original = b.source(),
      held = deferred();
    b.server.post = () => held.promise;
    await act(async () => {
      assert.equal(b.hook.state.stage({ type, fields }), 'ready');
    });
    let saving;
    await act(async () => {
      saving = b.hook.state.submit();
    });
    const posts = () => b.server.requests.filter((r) => r.init.method === 'POST');
    assert.equal(posts().length, 1);
    const post = posts()[0],
      body = post.init.body,
      key = post.init.headers['Idempotency-Key'];
    const before = b.server.requests.length;
    const renders = b.hook.renders.length;
    const oldListener = [...b.listeners][0];
    await b.render({ ...original, status: 'loading', session: null });
    await b.render({ ...original, status: 'error', session: null });
    await act(async () => {
      oldListener({ type: 'reset' });
      assert.equal(await b.hook.state.retrySave(), 'unavailable');
      assert.equal(b.hook.state.stage({ type, fields }), 'unavailable');
      assert.equal(b.hook.state.rebaseDraft(), 'unavailable');
    });
    assert.equal(post.init.signal.aborted, false);
    assert.equal(b.server.requests.length, before);
    await act(async () => {
      held.resolve(Response.json(type === 'create-sprint' ? plannedSprint('created') : sprint));
      await saving;
    });
    assert.equal(b.refreshed(), 0);
    assert.equal(b.hook.state.status, 'verifying');
    assert.equal(b.listeners.size, 0);
    for (const render of b.hook.renders.slice(renders)) {
      assert.equal(render.draft, null);
      assert.equal(render.recovery, null);
      assert.equal(render.mutation.current, null);
      assert.equal(render.mutation.result, null);
      assert.ok(Object.values(render.resources).every((resource) => resource.data === null));
    }
    await b.render({ ...original, session: identitySession('human', fixedNow + 120_000) });
    assert.equal(b.hook.state.context.expiresAt, original.session.session.expiresAt);
    assert.equal(b.refreshed(), 1);
    assert.equal(b.hook.state.mutation.status, 'confirmed');
    assert.ok(b.hook.state.mutation.result);
    const reads = b.server.requests.slice(before).filter((r) => r.init.method !== 'POST');
    assert.equal(reads.length, 7);
    assert.equal(new Set(reads.map((r) => r.path)).size, 7);
    assert.equal(posts().length, 1);
    assert.equal(posts()[0].init.body, body);
    assert.equal(posts()[0].init.headers['Idempotency-Key'], key);
    await b.emit({ type: 'reset' });
    assert.equal(b.refreshed(), 1);
    assert.equal(posts().length, 1);
    await b.browser.unmount();
    assert.equal(b.browser.timers.size, 0);
    assert.equal(b.listeners.size, 0);
  });
  for (const retire of ['expiry', 'replacement', 'denial']) {
    test(`public suspended ${type} hard ${retire} retires native write and cannot publish a late receipt`, async (t) => {
      const b = await hookFixture(t),
        original = b.source(),
        held = deferred();
      b.server.post = () => held.promise;
      await act(async () => b.hook.state.stage({ type, fields }));
      let saving;
      await act(async () => {
        saving = b.hook.state.submit();
      });
      const signal = b.server.requests.find((r) => r.init.method === 'POST').init.signal;
      await b.render({ ...original, status: 'loading', session: null });
      if (retire === 'expiry') {
        b.browser.setNow(fixedNow + 60_001);
        await b.browser.fireTimer([...b.browser.timers.keys()][0]);
      } else if (retire === 'denial')
        await b.render({ ...original, status: 'forbidden', session: null });
      else {
        const session = identitySession();
        session.session.id = 'replacement';
        await b.render({ ...original, session });
      }
      assert.equal(signal.aborted, true);
      const since = b.hook.renders.length;
      await act(async () => {
        held.resolve(Response.json(type === 'create-sprint' ? plannedSprint('created') : sprint));
        await saving;
      });
      for (const render of b.hook.renders.slice(since)) {
        assert.equal(render.mutation.result, null);
        assert.equal(render.draft, null);
        assert.equal(render.recovery, null);
      }
      assert.equal(b.refreshed(), 0);
      assert.equal(b.hook.state.mutation.result, null);
      assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
    });
  }
  test(`public ${type} confirmation callback replacement rejects the old child drain`, async (t) => {
    const b = await hookFixture(t),
      source = b.source();
    let callbacks = 0;
    source.refresh = async () => {
      callbacks++;
      await b.render({ ...source, status: 'forbidden', session: null });
    };
    b.server.post = () =>
      Response.json(type === 'create-sprint' ? plannedSprint('created') : sprint);
    await act(async () => b.hook.state.stage({ type, fields }));
    const before = b.server.requests.length;
    await act(async () => b.hook.state.submit());
    assert.equal(callbacks, 1);
    assert.equal(b.hook.state.status, 'forbidden');
    assert.equal(b.hook.state.mutation.result, null);
    assert.equal(
      b.server.requests.length,
      before + 1,
      'retired receipt cannot start canonical child reads',
    );
  });
}
