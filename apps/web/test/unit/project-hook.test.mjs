import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { act, mountHook, identitySession, workspace } from './dom-harness.mjs';
import { projectBrowser, createDraft, project } from './project-hook-harness.mjs';

const tasksPath = '/api/v1/workspaces/a/projects/p/tasks';

test(
  'a quiet real hook preserves its loaded task page after the initial stream reset',
  { timeout: 30_000 },
  async (t) => {
    const browser = projectBrowser(t);
    const hook = await mountHook(browser, useProjectTasks);
    await browser.clock.advance(500);
    assert.equal(hook.state.status, 'ready');
    await act(async () => hook.state.loadMore('tasks'));
    assert.equal(hook.state.tasks.items.length, 114);
    const reads = browser.reads(tasksPath).length;
    await browser.clock.advance(500);
    assert.equal(
      hook.state.tasks.items.length,
      114,
      'quiet invalidation cannot reset a loaded task page',
    );
    assert.equal(
      browser.reads(tasksPath).length,
      reads,
      'a settled refresh must not request another first page without a new hint',
    );
    assert.equal(hook.state.refreshRequired, false);
  },
);

async function mounted(t, strict = false) {
  const browser = projectBrowser(t);
  const hook = await mountHook(browser, useProjectTasks, strict);
  await browser.clock.advance(500);
  assert.equal(hook.state.status, 'ready');
  return { browser, hook };
}
const hint = (version) => ({
  type: 'invalidate',
  entity: 'task',
  projectId: 'p',
  id: 't1',
  version,
});
const emit = (browser, value) => act(async () => browser.server.streams.at(-1).emit(value));

test(
  'real stream hints during a held page coalesce and retain the latest reset',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const before = browser.reads(tasksPath).length;
    browser.server.title = 'Earlier commit';
    browser.server.version = 2;
    const snapshot = browser.server.taskPage();
    const held = browser.server.holdNext(tasksPath);
    await emit(browser, hint(2));
    assert.ok(held.request);
    const sessions = browser.reads('/api/v1/identity/session').length;
    browser.server.title = 'Latest committed';
    browser.server.version = 3;
    await emit(browser, { type: 'reset' });
    await emit(browser, hint(3));
    assert.equal(
      browser.reads('/api/v1/identity/session').length,
      sessions,
      'new hints do not start parallel refresh work',
    );
    await act(async () => held.resolve(Response.json(snapshot)));
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'Latest committed 1');
    assert.equal(hook.state.tasks.items[0].version, 3);
    assert.equal(
      browser.reads(tasksPath).length,
      before + 2,
      'one held read and one coalesced follow-up',
    );
    assert.equal(hook.state.refreshRequired, false);
    const settled = browser.requests.length;
    await browser.clock.advance(500);
    assert.equal(browser.requests.length, settled);
  },
);

test(
  'a reset received during initial loading is flushed when the actual hook becomes ready',
  { timeout: 30_000 },
  async (t) => {
    const browser = projectBrowser(t);
    const oldPage = browser.server.taskPage();
    const held = browser.server.holdNext(tasksPath);
    const hook = await mountHook(browser, useProjectTasks);
    assert.equal(hook.state.status, 'loading');
    assert.ok(held.request);
    assert.equal(
      browser.server.streams.filter((stream) => !stream.request.options.signal.aborted).length,
      1,
    );
    browser.server.title = 'After initial reset';
    browser.server.version = 2;
    await act(async () => held.resolve(Response.json(oldPage)));
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'After initial reset 1');
    assert.equal(hook.state.tasks.items[0].version, 2);
    assert.equal(hook.state.refreshRequired, false);
  },
);

test(
  'hidden browser events avoid reads while visible return reconnects and refreshes current data',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const before = browser.requests.length;
    const oldStream = browser.server.streams.at(-1);
    await browser.visibility('hidden');
    for (const event of ['focus', 'pageshow', 'online']) await browser.event(event);
    await browser.clock.advance(500);
    assert.equal(browser.requests.length, before);
    browser.server.title = 'Visible return';
    await browser.visibility('visible');
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'Visible return 1');
    assert.equal(oldStream.request.options.signal.aborted, true);
    assert.equal(hook.state.streamStatus, 'live');
    const settled = browser.requests.length;
    await browser.clock.advance(500);
    assert.equal(browser.requests.length, settled);
  },
);

test(
  'dirty drafts defer invalidation data replacement until explicit discard',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    await act(async () => hook.state.loadMore('tasks'));
    const oldPage = hook.state.tasks;
    const verification = browser.reads('/api/v1/workspaces/a/projects/p').length;
    await act(async () => hook.state.stage(createDraft()));
    browser.server.title = 'Committed while editing';
    browser.server.version = 2;
    await emit(browser, { type: 'reset' });
    assert.equal(hook.state.refreshDeferred, true);
    assert.equal(hook.state.tasks, oldPage);
    assert.equal(hook.state.draft.fields.title, 'Retained intent');
    assert.ok(
      browser.reads('/api/v1/workspaces/a/projects/p').length > verification,
      'current project authority is verified before deferral',
    );
    assert.equal(browser.posts().length, 0);
    await act(async () => hook.state.discardDraft());
    await browser.clock.advance(500);
    assert.equal(hook.state.draft, null);
    assert.equal(hook.state.tasks.items[0].title, 'Committed while editing 1');
    assert.equal(hook.state.refreshRequired, false);
  },
);

test(
  'pending and unknown intents survive resets and retry the original key and body once',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    await act(async () =>
      hook.state.stage({
        type: 'edit-project',
        workspaceId: 'a',
        projectId: 'p',
        expectedVersion: 1,
        name: 'Retained project edit',
        description: '',
      }),
    );
    const held = browser.server.holdNext((request) => request.options.method === 'POST');
    let saving;
    await act(async () => {
      saving = hook.state.submit();
      void hook.state.submit();
    });
    assert.equal(browser.posts().length, 1);
    assert.equal(hook.state.mutationPending, 'edit-project');
    assert.equal(hook.state.draftGuard.canDiscard, false);
    await emit(browser, { type: 'reset' });
    assert.equal(hook.state.refreshDeferred, true);
    await act(async () => {
      held.reject(new Error('Lost HTTP response'));
      await saving;
    });
    assert.equal(hook.state.mutationPending, null);
    assert.equal(hook.state.draftGuard.kind, 'recovery');
    assert.equal(hook.state.outcome, 'error');
    await emit(browser, hint(3));
    assert.equal(
      browser.posts().length,
      1,
      'background invalidation never resubmits an unknown command',
    );
    browser.server.mutate = () => Response.json(project('p', 'a', 2), { status: 201 });
    await act(async () => hook.state.retrySave());
    assert.equal(browser.posts().length, 2);
    const [first, retry] = browser.posts();
    assert.equal(retry.options.body, first.options.body);
    assert.equal(
      new globalThis.Headers(retry.options.headers).get('idempotency-key'),
      new globalThis.Headers(first.options.headers).get('idempotency-key'),
    );
    assert.equal(hook.state.outcome, 'success');
    assert.equal(hook.state.retryTarget, null);
    await browser.clock.advance(500);
    assert.equal(browser.posts().length, 2);
  },
);

for (const differentAccount of [false, true]) {
  test(
    `${differentAccount ? 'account' : 'same-human session'} replacement clears pending private state and rejects the old late result`,
    { timeout: 30_000 },
    async (t) => {
      const { browser, hook } = await mounted(t);
      await act(async () => hook.state.stage(createDraft()));
      const held = browser.server.holdNext((request) => request.options.method === 'POST');
      let saving;
      await act(async () => {
        saving = hook.state.submit();
      });
      browser.server.session = identitySession(differentAccount ? 'other-human' : 'human');
      browser.server.session.session.id = 'replacement-session';
      browser.server.workspaces = [workspace('b')];
      await emit(browser, { type: 'reset' });
      await browser.clock.advance(500);
      assert.equal(hook.state.selection.workspaceId, 'b');
      assert.equal(hook.state.draft, null);
      assert.equal(hook.state.retryTarget, null);
      assert.equal(hook.state.result, null);
      assert.ok(hook.state.tasks.items.every((row) => row.workspaceId === 'b'));
      assert.equal(held.request.options.signal.aborted, true);
      const reads = browser.requests.length;
      await act(async () => {
        held.resolve(Response.json(project('old-private', 'a'), { status: 201 }));
        await saving;
      });
      assert.equal(hook.state.selection.workspaceId, 'b');
      assert.equal(hook.state.result, null);
      assert.equal(
        browser.requests.length,
        reads,
        'the old mutation cannot trigger a former-workspace reload',
      );
      assert.equal(browser.window.location.search.includes('workspace=a'), false);
    },
  );
}

test(
  'workspace navigation aborts and ignores an old background page that resolves late',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const oldPage = browser.server.taskPage();
    const held = browser.server.holdNext(tasksPath);
    await emit(browser, hint(2));
    assert.ok(held.request);
    await act(async () => hook.state.selectWorkspace('b'));
    assert.equal(held.request.options.signal.aborted, true);
    assert.equal(hook.state.selection.workspaceId, 'b');
    await act(async () => held.resolve(Response.json(oldPage)));
    await browser.clock.advance(500);
    assert.equal(hook.state.selection.workspaceId, 'b');
    assert.ok(hook.state.tasks.items.every((row) => row.workspaceId === 'b'));
  },
);

test(
  'a failed background read stays recoverable without a hot loop and a later hint still refreshes',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const oldPage = hook.state.tasks;
    const held = browser.server.holdNext('/api/v1/workspaces/a/projects/p');
    await emit(browser, hint(2));
    await act(async () => held.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
    assert.equal(hook.state.tasks, oldPage);
    assert.equal(hook.state.refreshRequired, true);
    const reads = browser.requests.length;
    await browser.clock.advance(1000);
    assert.equal(
      browser.requests.length,
      reads,
      'read failure must not start an unbounded retry loop',
    );
    browser.server.title = 'Recovered through new hint';
    await emit(browser, hint(3));
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'Recovered through new hint 1');
    assert.equal(hook.state.refreshRequired, false);
  },
);

test(
  'a reset rechecks current denial even while a local draft is deferred',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    await act(async () => hook.state.stage(createDraft()));
    const held = browser.server.holdNext('/api/v1/workspaces/a/projects/p');
    await emit(browser, { type: 'reset' });
    await act(async () => held.resolve(Response.json({ code: 'forbidden' }, { status: 403 })));
    assert.equal(hook.state.status, 'forbidden');
    assert.equal(hook.state.project, null);
    assert.equal(hook.state.tasks, null);
    assert.equal(hook.state.draft.fields.title, 'Retained intent');
    assert.equal(browser.server.streams.at(-1).request.options.signal.aborted, true);
  },
);

test(
  'stream reconnect resumes its opaque cursor, refreshes once, and unmount owns every listener and timer',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const stream = browser.server.streams.at(-1);
    const count = browser.requests.length;
    await act(async () => stream.emit({ type: 'heartbeat' }, 'resume_marker'));
    assert.equal(browser.requests.length, count, 'heartbeats are not task invalidations');
    await act(async () => stream.disconnect());
    assert.equal(hook.state.streamStatus, 'reconnecting');
    browser.server.title = 'After reconnect';
    await browser.clock.advance(1000);
    await browser.clock.advance(500);
    const next = browser.server.streams.at(-1);
    assert.notEqual(next, stream);
    assert.equal(
      new globalThis.Headers(next.request.options.headers).get('last-event-id'),
      'resume_marker',
    );
    assert.equal(hook.state.tasks.items[0].title, 'After reconnect 1');
    assert.equal(hook.state.streamStatus, 'live');
    await browser.unmount();
    assert.equal(next.request.options.signal.aborted, true);
    const settled = browser.requests.length;
    for (const type of ['focus', 'online', 'offline', 'pageshow', 'popstate'])
      await browser.event(type);
    await browser.visibility('visible');
    await browser.clock.advance(5000);
    assert.equal(browser.requests.length, settled);
  },
);

test(
  'unmount rejects a late initial session before any private collection can load',
  { timeout: 30_000 },
  async (t) => {
    const browser = projectBrowser(t);
    const held = browser.server.holdNext('/api/v1/identity/session');
    const hook = await mountHook(browser, useProjectTasks);
    assert.equal(hook.state.status, 'loading');
    await browser.unmount();
    const requests = browser.requests.length;
    await act(async () => held.resolve(Response.json(identitySession())));
    await browser.clock.advance(500);
    assert.equal(
      browser.requests.length,
      requests,
      'late initial identity cannot load private workspace data after cleanup',
    );
    assert.equal(browser.server.streams.length, 0);
  },
);

test(
  'StrictMode effect replay keeps subsequent real invalidations active',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t, true);
    browser.server.title = 'After StrictMode replay';
    browser.server.version = 2;
    await emit(browser, hint(2));
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'After StrictMode replay 1');
    assert.equal(hook.state.tasks.items[0].version, 2);
    assert.equal(hook.state.refreshRequired, false);
  },
);

test(
  'the current expiry schedule replaces the old one and clears private state at expiry',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    assert.equal(browser.timers.size, 1);
    const [oldTimer] = browser.timers.keys();
    const expires = Date.now() + 2000;
    browser.server.session = identitySession('human', expires);
    await browser.event('focus');
    await browser.clock.advance(500);
    assert.equal(browser.timers.has(oldTimer), false);
    assert.equal(browser.timers.size, 1);
    const [newTimer] = browser.timers.keys();
    browser.setNow(expires);
    await browser.fireTimer(newTimer);
    assert.equal(hook.state.status, 'signed-out');
    assert.equal(hook.state.session, null);
    assert.equal(hook.state.tasks, null);
    assert.equal(browser.timers.size, 0);
    assert.equal(browser.server.streams.at(-1).request.options.signal.aborted, true);
  },
);

for (const queuedBeforeFailure of [false, true]) {
  test(
    `task-page refresh failure is disclosed and ${queuedBeforeFailure ? 'an already queued' : 'a later'} hint can recover`,
    { timeout: 30_000 },
    async (t) => {
      const { browser, hook } = await mounted(t);
      const held = browser.server.holdNext(tasksPath);
      await emit(browser, hint(2));
      assert.ok(held.request);
      if (queuedBeforeFailure) await emit(browser, hint(3));
      await act(async () => held.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
      assert.equal(
        hook.state.status,
        'error',
        'failed task-page refresh exposes recoverable error instead of loading',
      );
      assert.equal(
        hook.state.tasks,
        null,
        'a failed full read is not presented as fresh task data',
      );
      assert.equal(hook.state.refreshRequired, true);
      assert.equal(
        browser.server.streams.at(-1).request.options.signal.aborted,
        false,
        'transient refresh failure keeps invalidation recovery available',
      );
      browser.server.title = 'Recovered task page';
      browser.server.version = 3;
      if (!queuedBeforeFailure) {
        const count = browser.requests.length;
        await browser.clock.advance(1000);
        assert.equal(
          browser.requests.length,
          count,
          'failed read alone cannot cause a retry hot loop',
        );
        await emit(browser, hint(3));
      }
      await browser.clock.advance(500);
      assert.equal(hook.state.status, 'ready');
      assert.equal(hook.state.tasks.items[0].title, 'Recovered task page 1');
      assert.equal(hook.state.tasks.items[0].version, 3);
      assert.equal(hook.state.refreshRequired, false);
      const count = browser.requests.length;
      await browser.clock.advance(500);
      assert.equal(browser.requests.length, count);
    },
  );
}
