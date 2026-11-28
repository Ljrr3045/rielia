import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTask } from '@rielia/contracts';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { act, mountHook, identitySession, workspace } from './dom-harness.mjs';
import { projectBrowser, createDraft, project, task } from './project-hook-harness.mjs';

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

for (const phase of ['workspace', 'project', 'task'])
  for (const failure of ['503', 'offline'])
    // Original case description: R1 W1 unknown retry workspace probe 503 settles with feedback and preserves its exact native intent
    // Original case description: R1 W1 unknown retry workspace probe offline settles with feedback and preserves its exact native intent
    // Original case description: R1 W1 unknown retry project probe 503 settles with feedback and preserves its exact native intent
    // Original case description: R1 W1 unknown retry project probe offline settles with feedback and preserves its exact native intent
    // Original case description: R1 W1 unknown retry task probe 503 settles with feedback and preserves its exact native intent
    // Original case description: R1 W1 unknown retry task probe offline settles with feedback and preserves its exact native intent
    test(`R1 W1 ${phase} ${failure} retry`, async (t) => {
      const browser = projectBrowser(t, '?workspace=a&project=p&task=t1');
      const hook = await mountHook(browser, useProjectTasks);
      await browser.clock.advance(500);
      await act(async () =>
        hook.state.stage({
          type: 'edit-task',
          workspaceId: 'a',
          projectId: 'p',
          taskId: 't1',
          expectedVersion: 1,
          fields: { title: 'Captured retry version' },
        }),
      );
      browser.server.mutate = () => {
        throw new Error('Unknown durable outcome');
      };
      await act(async () => hook.state.submit());
      const captured = hook.state.retryTarget;
      const original = browser.posts()[0];
      const path =
        phase === 'workspace'
          ? '/api/v1/workspaces/a'
          : phase === 'project'
            ? '/api/v1/workspaces/a/projects/p'
            : '/api/v1/workspaces/a/projects/p/tasks/t1';
      const held = browser.server.holdNext(path);
      let settled;
      await act(async () => {
        settled = hook.state.retrySave().then(
          () => null,
          (error) => error,
        );
      });
      assert.ok(held.request);
      let rejection;
      await act(async () => {
        if (failure === '503')
          held.resolve(
            Response.json(
              { code: 'unavailable' },
              { status: 503, headers: { 'x-request-id': 'retry-authority' } },
            ),
          );
        else held.reject(new Error('Native offline authority GET'));
        rejection = await settled;
      });
      assert.equal(
        rejection,
        null,
        'a public explicit retry must settle rather than leak a rejected probe',
      );
      assert.equal(hook.state.outcome, 'error');
      assert.deepEqual(hook.state.retryTarget, captured);
      assert.equal(browser.posts().length, 1);
      browser.server.mutate = () => Response.json(task(1, 'a', 'p', 2));
      await act(async () => hook.state.retrySave());
      assert.equal(browser.posts().length, 2);
      assert.equal(browser.posts()[1].options.body, original.options.body);
      assert.equal(
        browser.posts()[1].options.headers['Idempotency-Key'],
        original.options.headers['Idempotency-Key'],
      );
    });

test(
  'standalone task navigation retains its page while a write is pending without queuing a later view',
  { timeout: 30000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    await act(async () => hook.state.stage(createDraft()));
    const held = browser.server.holdNext((request) => request.options.method === 'POST');
    let saving;
    await act(async () => {
      saving = hook.state.submit();
    });
    const originalURL = hook.state.url;
    await act(async () => {
      await hook.state.setTaskScope('mine');
      await hook.state.setSearchQuery('pending search');
      await hook.state.setDiscoveryProject('p');
      await hook.state.setTaskLayout('board');
      await hook.state.setTaskFilters({ status: 'todo' });
      await hook.state.setTaskColumn('done');
    });
    assert.equal(hook.state.url, originalURL);
    assert.equal(hook.state.integratedNavigation, null);
    assert.equal(hook.state.mutationPending, 'create-task');
    assert.equal(browser.posts().length, 1);
    await act(async () => {
      held.resolve(Response.json(task(115), { status: 201 }));
      await saving;
    });
    await browser.clock.advance(500);
    assert.equal(hook.state.taskScope, 'project');
    assert.equal(hook.state.taskView.layout, 'list');
    assert.equal(hook.state.taskView.column, 'backlog');
    assert.deepEqual(hook.state.taskView.filters, {});
    assert.equal(hook.state.integratedNavigation, null);
    assert.equal(browser.posts().length, 1);
  },
);

test(
  'real stream hints supersede an aborted page and preserve the latest authorized reset',
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
      sessions + 1,
      'the reset verifies once after cancelling the obsolete native-signal read',
    );
    assert.equal(held.request.options.signal.aborted, true);
    await act(async () => held.resolve(Response.json(snapshot)));
    await browser.clock.advance(500);
    assert.equal(hook.state.tasks.items[0].title, 'Latest committed 1');
    assert.equal(hook.state.tasks.items[0].version, 3);
    assert.equal(
      browser.reads(tasksPath).length,
      before + 2,
      'one obsolete held request and one authorized coalesced follow-up',
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
    assert.deepEqual(hook.state.tasks, oldPage);
    assert.equal(
      hook.state.tasks.items[0],
      oldPage.items[0],
      'derived aggregate keeps the original admitted row',
    );
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
    `${differentAccount ? 'account' : 'same-human session'} replacement clears pending private state and ignores a valid old late success`,
    { timeout: 30_000 },
    async (t) => {
      const { browser, hook } = await mounted(t);
      const command = createDraft();
      const lateSuccess = {
        ...task(115, command.workspaceId, command.projectId),
        ...command.fields,
      };
      assert.ok(isTask(lateSuccess), 'late success fixture must satisfy the public task contract');
      await act(async () => hook.state.stage(command));
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
        held.resolve(Response.json(lateSuccess, { status: 201 }));
        await saving;
      });
      assert.equal(
        hook.state.selection.workspaceId,
        'b',
        'late successful old task must not replace the current workspace',
      );
      assert.equal(
        hook.state.result,
        null,
        'late successful old task must not publish a stale private result',
      );
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
    assert.equal(hook.state.tasks, null, 'error screen does not expose the stale flat projection');
    assert.deepEqual(hook.state.resources.tasks.data, oldPage);
    assert.equal(
      hook.state.resources.tasks.data.items[0],
      oldPage.items[0],
      'Query retains the original admitted row as stale',
    );
    assert.equal(hook.state.resources.tasks.stale, true);
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
    assert.equal(hook.state.draft, null, 'terminal denial erases private intent');
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

// Original case description: a fresh long-lived project session retains exact unknown intent across timer clamps until its real expiry
test('project expiry: long unknown retry', async (t) => {
  const browser = projectBrowser(t);
  const started = Date.now();
  const maximumDelay = 2147483647;
  const expires = started + maximumDelay * 2 + 5000;
  browser.server.session = identitySession('human', expires);
  const hook = await mountHook(browser, useProjectTasks);
  await browser.clock.advance(500);
  assert.equal(hook.state.status, 'ready');
  await act(async () => hook.state.stage(createDraft()));
  const held = browser.server.holdNext((request) => request.options.method === 'POST');
  let saving;
  await act(async () => {
    saving = hook.state.submit();
  });
  await act(async () => {
    held.reject(new Error('Lost long-lived command response'));
    await saving;
  });
  assert.equal(hook.state.draftGuard.kind, 'recovery');
  assert.equal(hook.state.retryTarget.type, 'create-task');
  const intent = hook.state.retryTarget;
  const epoch = hook.state.privateLifetime.epoch;
  const original = browser.posts()[0];
  const requests = browser.requests.length;
  for (const now of [started + maximumDelay, started + maximumDelay * 2]) {
    assert.equal(browser.timers.size, 1);
    const [timer, scheduled] = [...browser.timers][0];
    assert.equal(scheduled.delay, maximumDelay);
    browser.setNow(now);
    await browser.fireTimer(timer);
    assert.equal(
      hook.state.privateLifetime.epoch,
      epoch,
      'a clamp cannot retire an unexpired lifetime',
    );
    assert.equal(hook.state.privateLifetime.expiresAt, new Date(expires).toISOString());
    assert.deepEqual(hook.state.retryTarget, intent);
    assert.equal(hook.state.draftGuard.kind, 'recovery');
    assert.equal(
      browser.requests.length,
      requests,
      'rescheduling neither verifies nor starts a command',
    );
  }
  assert.equal(browser.timers.size, 1);
  const [finalTimer, finalSchedule] = [...browser.timers][0];
  assert.equal(finalSchedule.delay, 5000);
  const retryHold = browser.server.holdNext((request) => request.options.method === 'POST');
  let retrying;
  await act(async () => {
    retrying = hook.state.retrySave();
  });
  await act(async () => {
    retryHold.reject(new Error('Explicit retry response also lost'));
    await retrying;
  });
  assert.equal(browser.posts().length, 2);
  const retry = browser.posts()[1];
  assert.equal(retry.options.body, original.options.body);
  assert.equal(
    new globalThis.Headers(retry.options.headers).get('idempotency-key'),
    new globalThis.Headers(original.options.headers).get('idempotency-key'),
  );
  assert.deepEqual(hook.state.retryTarget, intent);
  const verification = browser.server.holdNext('/api/v1/identity/session');
  browser.setNow(expires);
  await browser.fireTimer(finalTimer);
  assert.ok(verification.request, 'actual expiry enters the explicit verification path');
  assert.equal(hook.state.privateLifetime, null);
  assert.equal(hook.state.retryTarget, null);
  assert.equal(hook.state.draft, null);
  assert.equal(hook.state.tasks, null);
  assert.equal(browser.timers.size, 0);
  browser.server.session = identitySession('human', expires + 60_000);
  await act(async () => verification.resolve(Response.json(browser.server.session)));
  assert.equal(hook.state.status, 'ready');
  assert.notEqual(hook.state.privateLifetime.epoch, epoch);
  assert.equal(
    hook.state.retryTarget,
    null,
    'a fresh verified lifetime cannot revive the expired intent',
  );
  assert.equal(hook.state.draft, null);
  assert.equal(hook.state.result, null);
  assert.equal(browser.posts().length, 2);
  assert.equal(browser.posts()[0], original);
});

// Original case description: an early expiry callback after wall-clock rollback reschedules without losing a draft and unmount cancels that timer
test('project expiry: rollback and cleanup', async (t) => {
  const { browser, hook } = await mounted(t);
  await act(async () => hook.state.stage(createDraft()));
  const lifetime = hook.state.privateLifetime;
  const draft = hook.state.draft;
  const [timer] = browser.timers.keys();
  browser.setNow(Date.now() - 20_000);
  const requests = browser.requests.length;
  await browser.fireTimer(timer);
  assert.deepEqual(hook.state.privateLifetime, lifetime);
  assert.deepEqual(hook.state.draft, draft);
  assert.equal(browser.requests.length, requests);
  assert.equal(browser.posts().length, 0);
  assert.equal(browser.timers.size, 1);
  const [rescheduled, pending] = [...browser.timers][0];
  assert.notEqual(rescheduled, timer);
  assert.equal(pending.delay, Date.parse(lifetime.expiresAt) - Date.now());
  await browser.unmount();
  assert.equal(browser.timers.size, 0, 'cleanup cancels the latest rescheduled timer');
  await act(async () => pending.callback());
  assert.equal(browser.timers.size, 0, 'a callback already queued before cleanup stays retired');
  assert.equal(browser.requests.length, requests);
});

for (const sameDeadline of [false, true])
  // Original case description: an obsolete queued expiry callback cannot erase or refresh a replacement project lifetime with a later deadline
  // Original case description: an obsolete queued expiry callback cannot erase or refresh a replacement project lifetime with the same deadline
  test(`project expiry: replacement ${sameDeadline ? 'equal' : 'later'}`, async (t) => {
    const { browser, hook } = await mounted(t);
    await act(async () => hook.state.stage(createDraft()));
    const previous = hook.state.privateLifetime;
    const [oldTimer, queued] = [...browser.timers][0];
    const oldExpiry = Date.parse(previous.expiresAt);
    browser.server.session = identitySession(
      'replacement',
      oldExpiry + (sameDeadline ? 0 : 60_000),
    );
    await browser.event('focus');
    await browser.clock.advance(500);
    assert.equal(hook.state.status, 'ready');
    assert.notEqual(hook.state.privateLifetime.epoch, previous.epoch);
    assert.equal(browser.timers.has(oldTimer), false);
    await act(async () => hook.state.stage(createDraft()));
    const replacement = hook.state.privateLifetime;
    const draft = hook.state.draft;
    const [currentTimer] = browser.timers.keys();
    const requests = browser.requests.length;
    browser.setNow(oldExpiry - (sameDeadline ? 1000 : 0));
    await act(async () => queued.callback());
    assert.deepEqual(hook.state.privateLifetime, replacement);
    assert.deepEqual(hook.state.draft, draft);
    assert.equal(browser.timers.size, 1);
    assert.equal(browser.timers.has(currentTimer), true);
    assert.equal(browser.requests.length, requests);
    assert.equal(browser.posts().length, 0);
  });

// Failed same-session verification keeps captured hint debt and exact hidden intent;
// a newer hint during the explicit read survives until explicit command confirmation.
test('R1 captured debt verification', async (t) => {
  const { browser, hook } = await r1UnknownTask(t);
  const captured = hook.state.retryTarget;
  const original = browser.posts()[0];
  const lifetime = hook.state.privateLifetime;
  await emit(browser, hint(2));
  assert.equal(hook.state.refreshRequired, true);
  assert.equal(hook.state.refreshDeferred, true);
  const session = browser.server.holdNext('/api/v1/identity/session');
  let verifying;
  await act(async () => {
    verifying = hook.state.refresh();
  });
  assert.ok(session.request);
  assert.equal(hook.state.retryTarget, null);
  assert.equal(hook.state.task, null);
  await act(async () => {
    session.resolve(Response.json({ code: 'unavailable' }, { status: 503 }));
    await verifying;
  });
  assert.equal(hook.state.status, 'error');
  assert.equal(hook.state.resources, null);
  assert.equal(hook.state.retryTarget, null);
  assert.equal(hook.state.privateLifetime.epoch, lifetime.epoch);
  assert.equal(hook.state.privateLifetime.expiresAt, lifetime.expiresAt);
  assert.equal(hook.state.privateLifetime.verified, false);
  assert.equal(hook.state.refreshRequired, true);
  assert.equal(browser.posts().length, 1);

  const workspaceRead = browser.server.holdNext('/api/v1/workspaces/a');
  let recovering;
  await act(async () => {
    recovering = hook.state.refresh();
  });
  assert.ok(workspaceRead.request);
  await emit(browser, hint(3));
  await act(async () => {
    workspaceRead.resolve(Response.json(workspace('a')));
    await recovering;
  });
  assert.equal(hook.state.status, 'ready');
  assert.deepEqual(hook.state.retryTarget, captured);
  assert.equal(
    hook.state.refreshRequired,
    true,
    'the later hint was not acknowledged by the earlier read',
  );
  assert.equal(hook.state.refreshDeferred, true);
  assert.equal(browser.posts().length, 1);
  const taskReads = browser.reads(tasksPath).length;
  browser.server.mutate = () => Response.json(task(1, 'a', 'p', 2));
  await act(async () => hook.state.retrySave());
  assert.equal(browser.posts().length, 2);
  assert.equal(browser.posts()[1].options.body, original.options.body);
  assert.equal(
    browser.posts()[1].options.headers['Idempotency-Key'],
    original.options.headers['Idempotency-Key'],
  );
  assert.ok(
    browser.reads(tasksPath).length > taskReads,
    'confirmed recovery performs the authorized current read',
  );
  assert.equal(hook.state.refreshRequired, false);
  await browser.clock.advance(500);
  assert.equal(browser.posts().length, 2, 'no queued mutation follows confirmation');
});

// A captured create-project command has workspace authority and no project target;
// both explicit retry probes precede its one exact body/key resubmission.
test('R1 workspace create retry', async (t) => {
  const browser = projectBrowser(t, '?workspace=a');
  const cataloguePath = '/api/v1/workspaces/a/projects';
  browser.server.rows = 0;
  browser.server.responses.set(cataloguePath, {
    items: [],
    total: 0,
    nextCursor: null,
    capabilities: { canCreate: true },
  });
  const hook = await mountHook(browser, useProjectTasks);
  await browser.clock.advance(500);
  await act(async () =>
    hook.state.stage({
      type: 'create-project',
      workspaceId: 'a',
      name: 'Captured project',
      key: 'CP',
      description: '',
      visibility: 'workspace',
    }),
  );
  browser.server.mutate = () => {
    throw new Error('Unknown project creation');
  };
  await act(async () => hook.state.submit());
  const captured = hook.state.retryTarget;
  const original = browser.posts()[0];
  assert.equal(captured.type, 'create-project');
  assert.equal(hook.state.selection.projectId, null);
  await browser.clock.advance(500);
  assert.equal(browser.posts().length, 1);
  const start = browser.requests.length;
  const held = browser.server.holdNext('/api/v1/workspaces/a');
  const created = { ...project(), name: captured.name, key: captured.key };
  browser.server.mutate = () => {
    browser.server.responses.set(cataloguePath, {
      items: [created],
      total: 1,
      nextCursor: null,
      capabilities: { canCreate: true },
    });
    browser.server.responses.set('/api/v1/workspaces/a/projects/p', created);
    return Response.json(created, { status: 201 });
  };
  let retrying;
  await act(async () => {
    retrying = hook.state.retrySave();
  });
  assert.ok(held.request);
  assert.deepEqual(hook.state.retryTarget, captured);
  assert.equal(browser.posts().length, 1);
  await act(async () => {
    held.resolve(Response.json(workspace('a')));
    await retrying;
  });
  assert.equal(browser.posts().length, 2);
  const replay = browser.posts()[1];
  const probes = browser.requests.slice(start, browser.requests.indexOf(replay));
  assert.deepEqual(
    probes.map((request) => request.url),
    ['/api/v1/workspaces/a', '/api/v1/workspaces/a'],
  );
  assert.equal(replay.options.body, original.options.body);
  assert.equal(
    replay.options.headers['Idempotency-Key'],
    original.options.headers['Idempotency-Key'],
  );
  assert.equal(hook.state.retryTarget, null);
});

// Original case description: a queued old timer delivered during replacement navigation cannot reenter verification before effect cleanup
test('project expiry: navigation reentrancy', async (t) => {
  const { browser, hook } = await mounted(t);
  await act(async () => hook.state.stage(createDraft()));
  const previous = hook.state.privateLifetime;
  const [, queued] = [...browser.timers][0];
  const verification = browser.server.holdNext('/api/v1/identity/session');
  let refreshing;
  await act(async () => {
    refreshing = hook.state.refresh();
  });
  const sessions = browser.reads('/api/v1/identity/session').length;
  const replace = browser.window.history.replaceState.bind(browser.window.history);
  let delivered = false;
  const restore = browser.replace(browser.window.history, 'replaceState', (...args) => {
    replace(...args);
    if (!delivered) {
      delivered = true;
      const requests = browser.requests.length;
      queued.callback();
      assert.equal(
        browser.requests.length,
        requests,
        'the obsolete timer starts no verification or domain HTTP',
      );
    }
  });
  t.after(restore);
  const oldExpiry = Date.parse(previous.expiresAt);
  browser.setNow(oldExpiry);
  browser.server.session = identitySession('replacement', oldExpiry + 60_000);
  await act(async () => {
    verification.resolve(Response.json(browser.server.session));
    await refreshing;
  });
  assert.equal(
    delivered,
    true,
    'native navigation delivers the queued callback before React cleanup',
  );
  assert.equal(hook.state.status, 'ready');
  assert.notEqual(hook.state.privateLifetime.epoch, previous.epoch);
  assert.equal(hook.state.session.user.id, 'replacement');
  assert.equal(hook.state.draft, null);
  assert.equal(
    browser.reads('/api/v1/identity/session').length,
    sessions + 1,
    'the replacement workspace stream performs its one normal initial reset',
  );
  assert.equal(browser.posts().length, 0);
  assert.equal(browser.timers.size, 1);
});

// Original case description: terminal stream cleanup cannot let an already queued expiry callback reopen a retired project lifetime
test('project expiry: terminal reentrancy', async (t) => {
  const { browser, hook } = await mounted(t);
  await act(async () => hook.state.stage(createDraft()));
  const [, queued] = [...browser.timers][0];
  let delivered = false;
  browser.server.streams.at(-1).request.options.signal.addEventListener(
    'abort',
    () => {
      delivered = true;
      queued.callback();
    },
    { once: true },
  );
  const denial = browser.server.holdNext('/api/v1/workspaces/a/projects/p');
  const sessions = browser.reads('/api/v1/identity/session').length;
  let refreshing;
  await act(async () => {
    refreshing = hook.state.refresh();
  });
  await act(async () => {
    denial.resolve(Response.json({ code: 'forbidden' }, { status: 403 }));
    await refreshing;
  });
  assert.equal(delivered, true);
  assert.equal(hook.state.status, 'forbidden');
  assert.equal(hook.state.privateLifetime, null);
  assert.equal(hook.state.draft, null);
  assert.equal(browser.timers.size, 0);
  assert.equal(browser.reads('/api/v1/identity/session').length, sessions + 1);
  assert.equal(browser.posts().length, 0);
});

for (const queuedBeforeFailure of [false, true]) {
  test(
    `task-page refresh failure is disclosed and ${queuedBeforeFailure ? 'an already queued' : 'a later'} hint can recover`,
    { timeout: 30_000 },
    async (t) => {
      const { browser, hook } = await mounted(t);
      const held = browser.server.holdNext(tasksPath);
      await emit(browser, hint(2));
      assert.ok(held.request);
      if (queuedBeforeFailure) {
        browser.server.title = 'Recovered task page';
        browser.server.version = 3;
        await emit(browser, hint(3));
        assert.equal(held.request.options.signal.aborted, true);
        await act(async () =>
          held.resolve(Response.json({ code: 'unavailable' }, { status: 503 })),
        );
        await browser.clock.advance(500);
        assert.equal(
          hook.state.status,
          'ready',
          'an obsolete cancelled error cannot replace a newer authorized page',
        );
        assert.equal(hook.state.tasks.items[0].title, 'Recovered task page 1');
        assert.equal(hook.state.refreshRequired, false);
        const settled = browser.requests.length;
        await browser.clock.advance(1000);
        assert.equal(browser.requests.length, settled);
        return;
      }
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

test(
  'unmount cancels an owed coalesced refresh before its queued timer can run',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const snapshot = browser.server.taskPage();
    const held = browser.server.holdNext(tasksPath);
    await emit(browser, hint(2));
    await emit(browser, hint(3));
    await act(async () => held.resolve(Response.json(snapshot)));
    assert.equal(hook.state.refreshRequired, true);
    await browser.unmount();
    assert.equal(browser.clock.timers.size, 0, 'unmount must cancel the queued refresh timer');
    const count = browser.requests.length;
    await browser.clock.advance(1000);
    assert.equal(browser.requests.length, count);
  },
);

test(
  'persistent task-page failures retry only in response to a genuine new hint',
  { timeout: 30_000 },
  async (t) => {
    const { browser, hook } = await mounted(t);
    const before = browser.reads(tasksPath).length;
    for (let index = 0; index < 12; index++) {
      browser.server
        .holdNext(tasksPath)
        .resolve(Response.json({ code: 'unavailable' }, { status: 503 }));
    }
    await emit(browser, hint(2));
    await browser.clock.advance(1000);
    assert.equal(
      browser.reads(tasksPath).length,
      before + 1,
      'persistent errors cannot invent background retries',
    );
    assert.equal(hook.state.status, 'error');
    assert.equal(hook.state.refreshRequired, true);
    await emit(browser, hint(3));
    await browser.clock.advance(1000);
    assert.equal(
      browser.reads(tasksPath).length,
      before + 2,
      'one genuine hint permits exactly one further failed read',
    );
    assert.equal(hook.state.status, 'error');
    assert.equal(hook.state.tasks, null);
  },
);

for (const navigation of ['task', 'project', 'workspace'])
  test(`confirmed result clears on ${navigation} navigation and survives same-target read recovery`, async (t) => {
    const { browser, hook } = await mounted(t);
    browser.server.mutate = () => Response.json(task(115), { status: 201 });
    await act(async () => {
      hook.state.stage(createDraft());
      await hook.state.submit();
    });
    assert.equal(hook.state.outcome, 'success');
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.outcome, 'success');
    assert.equal(hook.state.result.id, 't115');
    await act(async () =>
      navigation === 'task'
        ? hook.state.selectTask('t2')
        : navigation === 'project'
          ? hook.state.selectProject(null)
          : hook.state.selectWorkspace('b'),
    );
    assert.equal(hook.state.outcome, null);
    assert.equal(hook.state.result, null);
    assert.equal(browser.posts().length, 1);
  });

test('confirmed result clears at expiry and cannot return after same-session reauthentication', async (t) => {
  const { browser, hook } = await mounted(t);
  await act(async () => {
    hook.state.stage(createDraft());
    await hook.state.submit();
  });
  assert.equal(hook.state.outcome, 'success');
  const [expiry] = browser.timers.keys();
  browser.setNow(Date.parse(browser.server.session.session.expiresAt));
  await browser.fireTimer(expiry);
  assert.equal(hook.state.status, 'signed-out');
  assert.equal(hook.state.result, null);
  assert.equal(hook.state.outcome, null);
  browser.server.session.session.expiresAt = new Date(Date.now() + 60_000).toISOString();
  await act(async () => hook.state.refresh());
  assert.equal(hook.state.outcome, null);
  assert.equal(hook.state.result, null);
  assert.equal(browser.posts().length, 1);
});

for (const failure of ['503', 'changed'])
  test(`public task append ${failure} retains last-good rows and exposes a content error until explicit recovery`, async (t) => {
    const { browser, hook } = await mounted(t);
    const before = hook.state.tasks.items.length;
    const held = browser.server.holdNext(tasksPath);
    let reading;
    await act(async () => {
      reading = hook.state.loadMore('tasks');
    });
    const tail = browser.server.taskPage('a', true);
    if (failure === 'changed') {
      tail.orderVersion = 2;
      tail.items = tail.items.map((row) => ({ ...row, orderVersion: 2 }));
    }
    await act(async () => {
      held.resolve(
        failure === '503'
          ? Response.json(
              { code: 'unavailable' },
              { status: 503, headers: { 'x-request-id': 'content-append' } },
            )
          : Response.json(tail),
      );
      await reading;
    });
    assert.equal(hook.state.status, 'ready');
    assert.equal(hook.state.tasks.items.length, before);
    assert.equal(hook.state.resources.tasks.stale, true);
    assert.equal(hook.state.pageError?.collection, 'tasks');
    assert.equal(hook.state.pageError.reason, failure === 'changed' ? 'changed' : undefined);
    assert.equal(hook.state.taskSummary.canCreate, false);
    await act(async () => {
      hook.state.stage(createDraft());
      await hook.state.submit();
    });
    assert.equal(browser.posts().length, 0, 'stale pages cannot authorize a new task');
    await act(async () => hook.state.discardDraft());
    if (failure === '503') await act(async () => hook.state.loadMore('tasks'));
    else await act(async () => hook.state.refresh());
    assert.equal(hook.state.pageError, null);
    assert.equal(hook.state.resources.tasks.stale, false);
    assert.equal(browser.posts().length, 0, 'read recovery does not replay a command');
  });

test('a failed task root hides old DTO authority and recovers only after another actual verification/read', async (t) => {
  const { browser, hook } = await mounted(t);
  const held = browser.server.holdNext(tasksPath);
  let reading;
  await act(async () => {
    reading = hook.state.refresh();
  });
  await act(async () => {
    held.resolve(Response.json({ code: 'unavailable' }, { status: 503 }));
    await reading;
  });
  assert.equal(hook.state.status, 'error');
  assert.equal(hook.state.tasks, null);
  assert.equal(hook.state.privateLifetime.verified, false);
  assert.equal(hook.state.taskSummary.canCreate, false);
  assert.equal(browser.posts().length, 0);
  await act(async () => hook.state.refresh());
  assert.equal(hook.state.status, 'ready');
  assert.ok(hook.state.tasks);
  assert.equal(hook.state.pageError, null);
  assert.equal(browser.posts().length, 0);
});

async function r1UnknownTask(t) {
  const browser = projectBrowser(t, '?workspace=a&project=p&task=t1');
  const hook = await mountHook(browser, useProjectTasks);
  await browser.clock.advance(500);
  await act(async () =>
    hook.state.stage({
      type: 'edit-task',
      workspaceId: 'a',
      projectId: 'p',
      taskId: 't1',
      expectedVersion: 1,
      fields: { title: 'Original unknown authority' },
    }),
  );
  browser.server.mutate = () => {
    throw new Error('Unknown original write');
  };
  await act(async () => hook.state.submit());
  return { browser, hook };
}

for (const status of [401, 403])
  // Original case description: R1 W1 terminal retry probe401 erases the old lifetime without a rejection or replay
  // Original case description: R1 W1 terminal retry probe403 erases the old lifetime without a rejection or replay
  test(`R1 W1 terminal ${status}`, async (t) => {
    const { browser, hook } = await r1UnknownTask(t);
    const held = browser.server.holdNext('/api/v1/workspaces/a/projects/p');
    let retrying;
    await act(async () => {
      retrying = hook.state.retrySave();
    });
    await act(async () => {
      held.resolve(Response.json({ code: 'denied' }, { status }));
      await retrying;
    });
    assert.equal(hook.state.status, status === 401 ? 'signed-out' : 'forbidden');
    assert.equal(hook.state.privateLifetime, null);
    assert.equal(hook.state.retryTarget, null);
    assert.equal(hook.state.draft, null);
    assert.equal(browser.posts().length, 1);
    await act(async () => hook.state.refresh());
    assert.equal(hook.state.retryTarget, null);
    assert.equal(hook.state.draft, null);
    assert.equal(browser.posts().length, 1);
  });

// Original case description: R1 W1 an obsolete probe failure cannot overwrite a replacement captured command
test('R1 W1 obsolete retry', async (t) => {
  const { browser, hook } = await r1UnknownTask(t);
  const held = browser.server.holdNext('/api/v1/workspaces/a');
  let retrying;
  await act(async () => {
    retrying = hook.state.retrySave();
  });
  await act(async () => {
    hook.state.discardDraft();
    hook.state.stage({
      type: 'edit-task',
      workspaceId: 'a',
      projectId: 'p',
      taskId: 't1',
      expectedVersion: 1,
      fields: { title: 'New deliberate intent' },
    });
  });
  const replacement = hook.state.draft;
  assert.equal(replacement.fields.title, 'New deliberate intent');
  await act(async () => {
    held.resolve(Response.json({ code: 'unavailable' }, { status: 503 }));
    await retrying;
  });
  assert.deepEqual(hook.state.draft, replacement);
  assert.equal(hook.state.outcome, null);
  assert.equal(hook.state.retryTarget, null);
  assert.equal(browser.posts().length, 1);
});

for (const collection of ['assignees', 'projectAccess'])
  // Original case description: R1 W3 assignees explicit retry re-reads a retained failed root and coalesces a duplicate click
  // Original case description: R1 W3 projectAccess explicit retry re-reads a retained failed root and coalesces a duplicate click
  test(`R1 W3 ${collection} root retry`, async (t) => {
    const browser = projectBrowser(t);
    const record = project();
    record.capabilities.canManageAccess = true;
    browser.server.responses.set('/api/v1/workspaces/a/projects/p', record);
    const path = `/api/v1/workspaces/a/projects/p/${collection === 'projectAccess' ? 'access' : 'assignees'}`;
    const value = {
      items: [],
      total: 0,
      nextCursor: null,
      workspaceId: 'a',
      projectId: 'p',
      ...(collection === 'projectAccess' ? { projectVersion: 1 } : {}),
    };
    browser.server.responses.set(path, value);
    const hook = await mountHook(browser, useProjectTasks);
    await browser.clock.advance(500);
    assert.deepEqual(hook.state.resources[collection].data, value);
    const failed = browser.server.holdNext(path);
    let refreshing;
    await act(async () => {
      refreshing = hook.state.refresh();
    });
    assert.ok(failed.request);
    await act(async () => {
      failed.resolve(Response.json({ code: 'unavailable' }, { status: 503 }));
      await refreshing;
    });
    assert.equal(hook.state.status, 'ready');
    assert.equal(hook.state.resources[collection].stale, true);
    assert.ok(hook.state.policyPageErrors[collection]);
    const held = browser.server.holdNext(path);
    let retrying;
    await act(async () => {
      retrying = hook.state.loadMore(collection);
    });
    assert.ok(held.request);
    assert.equal(
      new URL(held.request.url, browser.window.location.origin).searchParams.has('cursor'),
      false,
    );
    const reads = browser.reads(path).length;
    await act(async () => hook.state.loadMore(collection));
    assert.equal(
      browser.reads(path).length,
      reads,
      'a second actual Retry call cannot duplicate a pending root',
    );
    await act(async () => {
      held.resolve(Response.json(value));
      await retrying;
    });
    assert.equal(hook.state.resources[collection].stale, false);
    assert.equal(hook.state.policyPageErrors[collection], undefined);
    assert.equal(browser.posts().length, 0);
  });
