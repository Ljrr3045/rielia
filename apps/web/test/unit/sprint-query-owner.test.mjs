import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient, onlineManager, isCancelledError } from '@tanstack/react-query';
import { createSprintQueryOwner } from '../../src/lib/sprint-query-owner.ts';
import { createSprintPlanningTransport } from '../../src/lib/sprint-client.ts';
import {
  context,
  fields,
  planning,
  list,
  sprint,
  plannedSprint,
  deferred,
  sprintServer,
} from './sprint-client-fixtures.mjs';

function fixture(t, bind = true) {
  const server = sprintServer();
  t.mock.method(globalThis, 'fetch', server.fetch);
  const client = new QueryClient();
  const denied = [];
  const renders = [];
  const owner = createSprintQueryOwner({
    transport: createSprintPlanningTransport(),
    client,
    changed: () => renders.push(owner.resources()),
    authorized: () => true,
    denied: (reason) => {
      denied.push(reason);
      owner.clear();
    },
  });
  t.after(() => owner.clear());
  if (bind) owner.bind(context);
  return { owner, server, client, denied, renders };
}
const command = {
  type: 'create-sprint',
  workspaceId: 'w',
  projectId: 'p',
  fields,
  expectedProjectVersion: 2,
};

test('disabled real observers read only on explicit intent and retain exact admitted cache objects', async (t) => {
  const b = fixture(t, false);
  await b.owner.read('planning');
  assert.equal(b.server.requests.length, 0);
  await assert.rejects(b.owner.create(command, 'key', new AbortController().signal));
  b.owner.bind(context);
  b.owner.bind(context);
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.owner.resources().planning.data, null);
  await b.owner.read('planning');
  await b.owner.read('sprints');
  const queries = b.client.getQueryCache().getAll();
  assert.equal(queries.length, 2);
  const stored = queries.find((q) => q.queryKey.at(-1) === 'planning');
  assert.equal(b.owner.resources().planning.data, stored.state.data);
  assert.equal(Object.isFrozen(stored.state.data), true);
  assert.equal(b.owner.resources().planning.stale, false);
  assert.equal(b.server.requests.length, 2);
  for (const query of queries) {
    assert.equal(query.options.enabled, false);
    assert.equal(query.options.retry, false);
    assert.equal(query.options.gcTime, 0);
    assert.equal(query.options.networkMode, 'always');
    assert.equal(query.options.structuralSharing, false);
    assert.equal(JSON.stringify(query.queryKey).includes(context.sessionId), false);
    assert.equal(JSON.stringify(query.queryKey).includes(context.userId), false);
  }
  assert.equal(
    b.owner.resources().sprints.data,
    queries.find((q) => q.queryKey.includes('sprints')).state.data,
  );
});

test('cursor pages live in Query, compose stable canonical totals, and reload removes obsolete tails', async (t) => {
  const b = fixture(t);
  b.server.list = { ...list, items: [sprint], total: 2, nextCursor: 'next' };
  await b.owner.read('sprints');
  const held = deferred();
  b.server.get = ({ query }) => (query.has('cursor') ? held.promise : undefined);
  const more = b.owner.read('sprints', true);
  await b.owner.read('sprints', true);
  assert.equal(b.owner.resources().sprints.loadingMore, true);
  assert.equal(b.server.requests.length, 2);
  held.resolve(Response.json({ ...list, items: [plannedSprint()], total: 2, nextCursor: null }));
  await more;
  assert.deepEqual(
    b.owner.resources().sprints.data.items.map((s) => s.id),
    ['s', 'target'],
  );
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .filter((q) => q.queryKey.includes('sprints')).length,
    2,
  );
  await b.owner.read('sprints', true);
  assert.equal(b.server.requests.length, 2);
  b.server.get = () => Response.json({ code: 'offline' }, { status: 503 });
  await b.owner.read('sprints');
  assert.equal(b.owner.resources().sprints.data.items.length, 2);
  assert.equal(b.owner.resources().sprints.status, 'error');
  b.server.get = null;
  b.server.list = { ...list, revision: 9, items: [sprint], total: 1 };
  await b.owner.read('sprints');
  assert.equal(b.owner.resources().sprints.data.items.length, 1);
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .filter((q) => q.queryKey.includes('sprints')).length,
    1,
  );
  assert.equal(
    b.renders.some((r) => r.sprints.data?.revision === 9 && r.sprints.data.items.length > 1),
    false,
  );
});

for (const mismatch of ['revision', 'duplicate', 'cursor', 'overflow', 'transport']) {
  test(`changed ${mismatch} page cannot enter the admitted cursor chain`, async (t) => {
    const b = fixture(t);
    b.server.list = { ...list, items: [sprint], total: 2, nextCursor: 'next' };
    await b.owner.read('sprints');
    b.server.get = () =>
      mismatch === 'transport'
        ? Response.json({}, { status: 409 })
        : Response.json({
            ...list,
            total: 2,
            revision: mismatch === 'revision' ? 9 : list.revision,
            items:
              mismatch === 'duplicate'
                ? [sprint]
                : mismatch === 'overflow'
                  ? [plannedSprint(), plannedSprint('other')]
                  : [plannedSprint()],
            nextCursor: mismatch === 'cursor' ? 'next' : null,
          });
    await b.owner.read('sprints', true);
    assert.equal(b.owner.resources().sprints.status, 'changed');
    assert.equal(b.owner.resources().sprints.stale, true);
    assert.equal(b.owner.resources().sprints.data.items.length, 1);
    const count = b.server.requests.length;
    await b.owner.read('sprints', true);
    assert.equal(b.server.requests.length, count);
  });
}

for (const resource of ['planning', 'sprints']) {
  for (const status of [401, 403]) {
    test(`${resource} ${status} removes actual caches and never automatically retries`, async (t) => {
      const b = fixture(t);
      await b.owner.read('planning');
      await b.owner.read('sprints');
      b.server.get = () => Response.json({ code: 'denied' }, { status });
      await b.owner.read(resource);
      assert.deepEqual(b.denied, [status === 401 ? 'signed-out' : 'forbidden']);
      assert.equal(b.client.getQueryCache().getAll().length, 0);
      assert.equal(b.client.getMutationCache().getAll().length, 0);
      assert.equal(b.owner.resources().planning.data, null);
      await b.owner.read(resource);
      assert.equal(b.server.requests.length, 3);
    });
  }
}

test('malformed success, read failure and explicit recovery preserve the existing feature error contract', async (t) => {
  const b = fixture(t);
  await b.owner.read('planning');
  b.server.get = () => Response.json({ ...planning, projectId: 'foreign' });
  await b.owner.read('planning');
  assert.equal(b.owner.resources().planning.failure.status, 502);
  assert.equal(b.owner.resources().planning.data.projectId, 'p');
  b.server.get = () => {
    throw new Error('offline');
  };
  await b.owner.read('sprints');
  assert.deepEqual(b.owner.resources().sprints.failure, { status: 0, code: null, requestId: null });
  b.server.get = null;
  await b.owner.read('planning');
  assert.equal(b.owner.resources().planning.stale, false);
  assert.equal(b.owner.resources().planning.failure, null);
});

test('native read cancellation cannot revert or repopulate retired epochs or expose them during notifications', async (t) => {
  const b = fixture(t);
  await b.owner.read('planning');
  const held = deferred();
  const started = deferred();
  let signal;
  b.server.get = ({ init }) => {
    signal = init.signal;
    started.resolve();
    return held.promise;
  };
  const reading = b.owner.read('planning');
  await started.promise;
  const start = b.renders.length;
  b.owner.clear();
  assert.equal(signal.aborted, true);
  assert.equal(b.client.getQueryCache().getAll().length, 0);
  held.resolve(Response.json(planning));
  await reading;
  assert.equal(b.client.getQueryCache().getAll().length, 0);
  assert.ok(
    b.renders.slice(start).every((r) => r.planning.data === null && r.sprints.data === null),
  );
  b.server.get = null;
  b.owner.bind({ ...context, sessionId: 'replacement' });
  await b.owner.read('planning');
  assert.equal(b.client.getQueryCache().getAll().length, 1);
});

test('cancelled scheduled reads cannot start in a newly bound lifetime', async (t) => {
  const b = fixture(t);
  const reading = b.owner.read('planning');
  b.owner.clear();
  b.owner.bind({ ...context, projectId: 'new' });
  await reading;
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.owner.resources().planning.data, null);
});

test('offline writes execute once without a paused reconnect queue and clear settled Query mutation records', async (t) => {
  const b = fixture(t);
  onlineManager.setOnline(false);
  t.after(() => onlineManager.setOnline(true));
  b.server.post = () => {
    throw new Error('offline');
  };
  const signal = new AbortController().signal;
  await assert.rejects(b.owner.create(command, 'original', signal));
  assert.equal(b.server.requests.length, 1);
  assert.equal(b.client.getMutationCache().getAll().length, 0);
  onlineManager.setOnline(true);
  await b.owner.read('planning');
  assert.equal(b.server.requests.filter((r) => r.init.method === 'POST').length, 1);
  b.server.post = () => Response.json(sprint);
  const result = await b.owner.create(command, 'original', signal);
  assert.equal(result.id, 's');
  const posts = b.server.requests.filter((r) => r.init.method === 'POST');
  assert.equal(posts[1].init.body, posts[0].init.body);
  assert.equal(posts[1].init.headers['Idempotency-Key'], posts[0].init.headers['Idempotency-Key']);
  assert.equal(
    b.owner.resources().sprints.data,
    null,
    'a mutation receipt cannot seed the read cache',
  );
  assert.equal(b.client.getMutationCache().getAll().length, 0);
});

test('retired in-flight mutation completion cannot restore a cache or become a current receipt', async (t) => {
  const b = fixture(t);
  const held = deferred();
  const started = deferred();
  b.server.post = () => {
    started.resolve();
    return held.promise;
  };
  const abort = new AbortController();
  const creating = b.owner.create(command, 'original', abort.signal);
  await started.promise;
  b.owner.clear();
  abort.abort();
  held.resolve(Response.json(sprint));
  await assert.rejects(creating);
  assert.equal(b.client.getMutationCache().getAll().length, 0);
  assert.equal(b.client.getQueryCache().getAll().length, 0);
});

test('two concurrent authenticated lifetimes have independent DTOs and cache retirement', async (t) => {
  const a = fixture(t);
  const b = fixture(t);
  await a.owner.read('planning');
  await b.owner.read('planning');
  const first = a.client.getQueryCache().getAll()[0];
  const second = b.client.getQueryCache().getAll()[0];
  assert.notEqual(first.queryKey[1], second.queryKey[1]);
  a.owner.clear();
  assert.equal(b.owner.resources().planning.data.projectId, 'p');
  assert.equal(b.client.getQueryCache().getAll().length, 1);
});

test('a cursor cycle cannot replace an admitted Query page or duplicate its rows', async (t) => {
  const b = fixture(t);
  b.server.list = { ...list, items: [sprint], total: 4, nextCursor: 'a' };
  await b.owner.read('sprints');
  b.server.get = ({ query }) =>
    Response.json({
      ...list,
      total: 4,
      items: [plannedSprint(query.get('cursor'))],
      nextCursor: query.get('cursor') === 'a' ? 'b' : 'a',
    });
  await b.owner.read('sprints', true);
  await b.owner.read('sprints', true);
  assert.deepEqual(
    b.owner.resources().sprints.data.items.map((s) => s.id),
    ['s', 'a', 'b'],
  );
  const requests = b.server.requests.length;
  await b.owner.read('sprints', true);
  assert.equal(b.server.requests.length, requests);
  assert.equal(b.owner.resources().sprints.status, 'changed');
  assert.deepEqual(
    b.owner.resources().sprints.data.items.map((s) => s.id),
    ['s', 'a', 'b'],
  );
});

test('equal refreshed DTOs retain the newly admitted original object and tolerated extra fields', async (t) => {
  const b = fixture(t);
  const admitted = [];
  b.server.get = () => {
    const value = globalThis.structuredClone({ ...planning, extra: { retained: true } });
    admitted.push(value);
    const response = Response.json(value);
    response.json = async () => value;
    return response;
  };
  await b.owner.read('planning');
  assert.equal(b.owner.resources().planning.data, admitted[0]);
  await b.owner.read('planning');
  assert.equal(b.owner.resources().planning.data, admitted[1]);
  assert.notEqual(admitted[0], admitted[1]);
  assert.deepEqual(b.owner.resources().planning.data.extra, { retained: true });
});

test('already-aborted create is cancelled before transport and changes no canonical resource', async (t) => {
  const b = fixture(t);
  const before = b.owner.resources();
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(b.owner.create(command, 'original', abort.signal), (error) =>
    isCancelledError(error),
  );
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.client.getMutationCache().getAll().length, 0);
  assert.deepEqual(b.owner.resources(), before);
});

test('retirement on actual Query cache success prevents projection continuation from restoring ready state', async (t) => {
  const b = fixture(t);
  let retired = false;
  let retirement = -1;
  const unsubscribe = b.client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    assert.equal(event.query.state.data.projectVersion, planning.projectVersion);
    unsubscribe();
    retired = true;
    retirement = b.renders.length;
    b.owner.clear();
  });
  t.after(unsubscribe);
  await b.owner.read('planning');
  assert.equal(
    retired,
    true,
    'the validated response must reach real Query success before retirement',
  );
  assert.equal(b.server.requests.length, 1);
  assert.equal(b.client.getQueryCache().getAll().length, 0);
  assert.equal(b.client.getMutationCache().getAll().length, 0);
  for (const resource of Object.values(b.owner.resources())) {
    assert.equal(resource.status, 'idle');
    assert.equal(resource.data, null);
  }
  assert.ok(b.renders.slice(retirement).length > 0);
  for (const notification of b.renders.slice(retirement)) {
    for (const resource of Object.values(notification)) {
      assert.equal(resource.status, 'idle');
      assert.equal(resource.data, null);
    }
  }
  await b.owner.read('planning');
  await b.owner.read('sprints');
  assert.equal(
    b.server.requests.length,
    1,
    'settlement and later stale intents cannot restart a retired epoch',
  );
  assert.equal(b.client.getQueryCache().getAll().length, 0);
});
