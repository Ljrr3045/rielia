import assert from 'node:assert/strict';
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
import { fields, sprint, planning, sprintServer, deferred } from './sprint-client-fixtures.mjs';

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
  'same-session renewal retains drafts and selection while replacing the owned expiry timer',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await act(async () => b.hook.state.stage({ type: 'edit-sprint', fields }));
    const draft = b.hook.state.draft;
    const oldTimer = [...b.browser.timers.keys()][0];
    const requests = b.server.requests.length;
    await b.render({ ...b.source(), session: identitySession('human', fixedNow + 120_000) });
    assert.equal(b.hook.state.draft, draft);
    assert.equal(b.server.requests.length, requests);
    assert.equal(b.browser.timers.has(oldTimer), false);
    assert.equal(b.browser.timers.size, 1);
  },
);

test(
  'expiry timer clamps long lifetimes and reschedules until actual expiry',
  { timeout: 30_000 },
  async (t) => {
    const b = await hookFixture(t);
    await b.render({
      ...b.source(),
      session: identitySession('human', fixedNow + 2147483647 + 60_000),
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
    const hook = await mountHook(browser, () => {
      const project = useProjectTasks();
      const sprints = useProjectSprints(project, { sprintId: 's', taskId: null });
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
    await act(async () =>
      browser.server.streams.at(-1).emit({ type: 'denied', reason: 'forbidden' }),
    );
    await browser.clock.advance(500);
    assert.equal(hook.state.resources.sprint.data, null);
  },
);
