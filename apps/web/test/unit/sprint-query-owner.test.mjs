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
  remainingResources,
  resourceRoutes,
  resourcePage,
  closeResult,
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

function selectResources(b) {
  b.owner.select('s', 't');
  b.owner.selectTarget('target');
  b.owner.preview('backlog');
}
for (const name of remainingResources) {
  test(`${name} has one actual Query DTO owner with explicit selectors and no implicit fetch`, async (t) => {
    const b = fixture(t);
    selectResources(b);
    assert.equal(b.server.requests.length, 0);
    assert.equal(b.owner.resources()[name].data, null);
    if (name === 'outcomes') await b.owner.read('closure');
    await b.owner.read(name);
    const query = b.client
      .getQueryCache()
      .getAll()
      .find((q) => q.queryKey[4] === name);
    assert.ok(query);
    assert.equal(b.owner.resources()[name].status, 'ready');
    assert.equal(b.owner.resources()[name].data, query.state.data);
    assert.equal(Object.isFrozen(query.state.data), true);
    assert.equal(query.options.enabled, false);
    assert.equal(query.options.retry, false);
    assert.equal(query.options.gcTime, 0);
    assert.equal(query.options.staleTime, 0);
    assert.equal(query.options.networkMode, 'always');
    assert.equal(query.options.refetchOnWindowFocus, false);
    assert.equal(query.options.refetchOnReconnect, false);
    assert.equal(query.options.refetchOnMount, false);
    assert.equal(query.options.refetchInterval, false);
    assert.equal(query.options.structuralSharing, false);
    assert.equal(JSON.stringify(query.queryKey).includes(context.sessionId), false);
    assert.equal(JSON.stringify(query.queryKey).includes(context.userId), false);
    assert.deepEqual(
      query.queryKey[5],
      name === 'target'
        ? { targetId: 'target' }
        : name === 'task' || name === 'taskHistory'
          ? { taskId: 't' }
          : name === 'preview'
            ? { sprintId: 's', destination: 'backlog' }
            : { sprintId: 's' },
    );
    b.owner.clear();
    assert.equal(b.client.getQueryCache().getAll().length, 0);
    for (const value of Object.values(b.owner.resources())) assert.equal(value.data, null);
  });
  for (const status of [401, 403]) {
    test(`${name} terminal ${status} retires every real record without retry`, async (t) => {
      const b = fixture(t);
      selectResources(b);
      await b.owner.read('closure');
      await b.owner.read(name);
      b.server.get = ({ path }) =>
        path.endsWith(resourceRoutes[name])
          ? Response.json({ code: 'denied' }, { status })
          : undefined;
      await b.owner.read(name);
      assert.deepEqual(b.denied, [status === 401 ? 'signed-out' : 'forbidden']);
      assert.equal(b.client.getQueryCache().getAll().length, 0);
      assert.equal(b.client.getMutationCache().getAll().length, 0);
      const calls = b.server.requests.length;
      await b.owner.read(name);
      assert.equal(b.server.requests.length, calls);
    });
  }
  for (const completion of ['success', 'denied']) {
    test(`${name} selection retirement rejects a late ${completion} and leaves independent target intact`, async (t) => {
      const b = fixture(t);
      selectResources(b);
      await b.owner.read('target');
      await b.owner.read('closure');
      await b.owner.read(name);
      const original = b.owner.resources()[name].data;
      const held = deferred();
      const started = deferred();
      let signal;
      b.server.get = ({ path, init }) => {
        if (!path.endsWith(resourceRoutes[name])) return;
        signal = init.signal;
        started.resolve();
        return held.promise;
      };
      const reading = b.owner.read(name);
      await started.promise;
      if (name === 'target') b.owner.selectTarget(null);
      else if (name === 'preview') b.owner.preview('target');
      else b.owner.select(null, null);
      const index = b.renders.length;
      assert.equal(signal.aborted, true);
      assert.equal(b.owner.resources()[name].data, null);
      if (name !== 'target') assert.equal(b.owner.resources().target.data.id, 'target');
      held.resolve(
        completion === 'denied' ? Response.json({}, { status: 403 }) : Response.json(original),
      );
      await reading;
      assert.deepEqual(b.denied, []);
      assert.equal(b.owner.resources()[name].data, null);
      assert.ok(b.renders.slice(index).every((r) => r[name].data === null));
      assert.equal(
        b.client
          .getQueryCache()
          .getAll()
          .some((q) => q.queryKey[4] === name),
        false,
      );
    });
  }
}

const paged = ['scope', 'sprintHistory', 'taskHistory', 'preview', 'outcomes'];
function pagesFixture(t, name) {
  const b = fixture(t);
  selectResources(b);
  b.server.closure.total = 3;
  b.server.get = ({ path, query }) =>
    path.endsWith(resourceRoutes[name])
      ? Response.json(
          resourcePage(name, query.get('cursor') === 'a' ? 1 : query.get('cursor') === 'b' ? 2 : 0),
        )
      : undefined;
  return b;
}
for (const name of paged) {
  test(`${name} keeps complete last-good rows on failure and atomically replaces root and old tails`, async (t) => {
    const b = pagesFixture(t, name);
    if (name === 'outcomes') await b.owner.read('closure');
    await b.owner.read(name);
    const held = deferred();
    const started = deferred();
    const normal = b.server.get;
    b.server.get = (r) => {
      if (r.path.endsWith(resourceRoutes[name]) && r.query.has('cursor')) {
        started.resolve();
        return held.promise;
      }
      return normal(r);
    };
    const more = b.owner.read(name, true);
    await started.promise;
    const count = b.server.requests.length;
    await b.owner.read(name, true);
    assert.equal(b.server.requests.length, count);
    assert.equal(b.owner.resources()[name].loadingMore, true);
    held.resolve(Response.json(resourcePage(name, 1)));
    await more;
    b.server.get = normal;
    await b.owner.read(name, true);
    assert.equal(b.owner.resources()[name].data.items.length, 3);
    const all = b.owner.resources()[name].data;
    const noMore = b.server.requests.length;
    await b.owner.read(name, true);
    assert.equal(b.server.requests.length, noMore);
    b.server.get = () => Response.json({}, { status: 503 });
    await b.owner.read(name);
    assert.deepEqual(b.owner.resources()[name].data, all);
    assert.equal(b.owner.resources()[name].status, 'error');
    assert.equal(b.owner.resources()[name].stale, true);
    b.server.get = ({ path }) =>
      path.endsWith(resourceRoutes[name])
        ? Response.json({ ...resourcePage(name, 2), nextCursor: null, total: 3 })
        : undefined;
    const start = b.renders.length;
    await b.owner.read(name);
    assert.equal(b.owner.resources()[name].status, 'ready');
    assert.equal(b.owner.resources()[name].data.items.length, 1);
    const ready = b.owner.resources()[name].data;
    assert.ok(
      b.renders
        .slice(start)
        .every(
          (r) =>
            JSON.stringify(r[name].data) === JSON.stringify(all) ||
            JSON.stringify(r[name].data) === JSON.stringify(ready),
        ),
    );
    assert.equal(
      b.client
        .getQueryCache()
        .getAll()
        .filter((q) => q.queryKey[4] === name).length,
      1,
    );
  });
  for (const mismatch of ['binding', 'duplicate', 'nonprogress', 'overflow']) {
    test(`${name} rejects ${mismatch} before successful Query publication`, async (t) => {
      const b = pagesFixture(t, name);
      if (name === 'outcomes') await b.owner.read('closure');
      await b.owner.read(name);
      const before = b.owner.resources()[name].data;
      const next = resourcePage(name, mismatch === 'duplicate' ? 0 : 1);
      next.nextCursor = mismatch === 'nonprogress' ? 'a' : null;
      if (mismatch === 'binding') {
        if (name === 'preview') next.previewHash = 'b'.repeat(64);
        else if (name === 'outcomes') {
          next.closureId = 'other';
          next.items = next.items.map((v) => ({ ...v, closureId: 'other' }));
        } else next.taskRevision++;
      }
      if (mismatch === 'overflow')
        next.items = [resourcePage(name, 1), resourcePage(name, 2), resourcePage(name, 3)].flatMap(
          (v) => v.items,
        );
      b.server.get = () => Response.json(next);
      const success = [];
      const unsubscribe = b.client.getQueryCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.action.type === 'success' &&
          event.query.queryKey[4] === name
        )
          success.push(event.query.state.data);
      });
      t.after(unsubscribe);
      await b.owner.read(name, true);
      assert.deepEqual(success, []);
      assert.equal(b.owner.resources()[name].status, 'changed');
      assert.equal(b.owner.resources()[name].failure.code, 'page-changed');
      assert.deepEqual(b.owner.resources()[name].data, before);
      const count = b.server.requests.length;
      await b.owner.read(name, true);
      assert.equal(b.server.requests.length, count);
    });
  }
  test(`${name} detects a longer cursor cycle before reusing an admitted record`, async (t) => {
    const b = pagesFixture(t, name);
    if (name === 'outcomes') await b.owner.read('closure');
    await b.owner.read(name);
    await b.owner.read(name, true);
    const last = resourcePage(name, 2);
    last.nextCursor = 'a';
    b.server.get = () => Response.json(last);
    await b.owner.read(name, true);
    const count = b.server.requests.length;
    await b.owner.read(name, true);
    assert.equal(b.server.requests.length, count);
    assert.equal(b.owner.resources()[name].status, 'changed');
    assert.equal(b.owner.resources()[name].data.items.length, 2);
  });
}

test('retiring a target inside real Query success cannot project or remove its replacement', async (t) => {
  const b = fixture(t);
  selectResources(b);
  const unsubscribe = b.client.getQueryCache().subscribe((event) => {
    if (
      event.type !== 'updated' ||
      event.action.type !== 'success' ||
      event.query.queryKey[4] !== 'target'
    )
      return;
    unsubscribe();
    b.owner.selectTarget(null);
    b.owner.selectTarget('target');
  });
  t.after(unsubscribe);
  await b.owner.read('target');
  assert.equal(b.owner.resources().target.data, null);
  await b.owner.read('target');
  assert.equal(b.owner.resources().target.data.id, 'target');
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .filter((q) => q.queryKey[4] === 'target').length,
    1,
  );
});

test('concurrent canonical closure replacement hides old outcomes and rejects their pending continuation', async (t) => {
  const b = pagesFixture(t, 'outcomes');
  await b.owner.read('closure');
  await b.owner.read('outcomes');
  const held = deferred();
  const started = deferred();
  b.server.get = ({ path, query }) => {
    if (path.endsWith('/outcomes') && query.has('cursor')) {
      started.resolve();
      return held.promise;
    }
  };
  const more = b.owner.read('outcomes', true);
  await started.promise;
  b.server.closure = { ...closeResult().closure, id: 'replacement', total: 3 };
  await b.owner.read('closure');
  assert.equal(b.owner.resources().outcomes.data, null);
  const success = [];
  const unsubscribe = b.client.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.queryKey[4] === 'outcomes'
    )
      success.push(event.query.state.data);
  });
  t.after(unsubscribe);
  held.resolve(Response.json(resourcePage('outcomes', 1)));
  await more;
  assert.deepEqual(success, []);
  assert.equal(b.owner.resources().outcomes.data, null);
  assert.equal(b.owner.resources().outcomes.status, 'changed');
  b.server.get = ({ path }) =>
    path.endsWith('/outcomes')
      ? Response.json({
          ...resourcePage('outcomes'),
          closureId: 'replacement',
          items: resourcePage('outcomes').items.map((v) => ({ ...v, closureId: 'replacement' })),
        })
      : undefined;
  await b.owner.read('outcomes');
  assert.equal(b.owner.resources().outcomes.data.closureId, 'replacement');
});

test('an outcome cannot repeat a participation under a new outcome ID across pages', async (t) => {
  const b = pagesFixture(t, 'outcomes');
  await b.owner.read('closure');
  await b.owner.read('outcomes');
  const next = resourcePage('outcomes', 1);
  next.items[0].participationId = 'visit-0';
  b.server.get = () => Response.json(next);
  await b.owner.read('outcomes', true);
  assert.equal(b.owner.resources().outcomes.status, 'changed');
  assert.equal(b.owner.resources().outcomes.data.items[0].id, 'outcome-0');
});

test('a root replacement cancels only its own continuation and preserves an unrelated selected request', async (t) => {
  const b = pagesFixture(t, 'scope');
  await b.owner.read('scope');
  const continuation = deferred();
  const target = deferred();
  const scopeStarted = deferred();
  const targetStarted = deferred();
  let scopeSignal, targetSignal;
  b.server.get = ({ path, query, init }) => {
    if (path.endsWith('/scope') && query.has('cursor')) {
      scopeSignal = init.signal;
      scopeStarted.resolve();
      return continuation.promise;
    }
    if (path.endsWith('/sprints/target')) {
      targetSignal = init.signal;
      targetStarted.resolve();
      return target.promise;
    }
    if (path.endsWith('/scope')) return Response.json(resourcePage('scope', 2));
  };
  const more = b.owner.read('scope', true);
  const readingTarget = b.owner.read('target');
  await Promise.all([scopeStarted.promise, targetStarted.promise]);
  await b.owner.read('scope');
  assert.equal(scopeSignal.aborted, true);
  assert.equal(targetSignal.aborted, false);
  target.resolve(Response.json(plannedSprint()));
  continuation.resolve(Response.json(resourcePage('scope', 1)));
  await Promise.all([more, readingTarget]);
  assert.equal(b.owner.resources().scope.data.items[0].id, 'visit-2');
  assert.equal(b.owner.resources().scope.data.items.length, 1);
  assert.equal(b.owner.resources().target.data.id, 'target');
});

test('a cache-added callback can retire a target before request admission without leaking a record', async (t) => {
  const b = fixture(t);
  selectResources(b);
  const unsubscribe = b.client.getQueryCache().subscribe((event) => {
    if (event.type !== 'added' || event.query.queryKey[4] !== 'target') return;
    unsubscribe();
    b.owner.selectTarget(null);
  });
  t.after(unsubscribe);
  await b.owner.read('target');
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.owner.resources().target.data, null);
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .some((q) => q.queryKey[4] === 'target'),
    false,
  );
});

test('unbound selected-resource intents send nothing and cannot allocate private queries', async (t) => {
  const b = fixture(t, false);
  b.owner.select('s', 't');
  b.owner.selectTarget('target');
  b.owner.preview('backlog');
  await b.owner.read('task');
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.client.getQueryCache().getAll().length, 0);
  b.owner.bind(context);
  selectResources(b);
  await b.owner.read('target');
  const target = b.owner.resources().target.data;
  b.owner.select('s', 't');
  assert.equal(b.owner.resources().target.data, target);
});

test('resource correction: retired invalidation and an unselected read cannot restore private Query data', async (t) => {
  const b = fixture(t);
  selectResources(b);
  await b.owner.read('planning');
  await b.owner.read('sprints');
  await b.owner.read('task');
  const count = b.server.requests.length;
  b.owner.clear();
  const start = b.renders.length;
  b.owner.invalidate();
  await b.owner.read('task');
  assert.equal(b.server.requests.length, count);
  assert.equal(b.client.getQueryCache().getAll().length, 0);
  assert.ok(b.renders.slice(start).every((r) => Object.values(r).every((v) => v.data === null)));
  b.owner.bind(context);
  await b.owner.read('scope');
  assert.equal(b.server.requests.length, count, 'no selected sprint means no scope request');
  assert.equal(b.owner.resources().scope.data, null);
  assert.ok(
    b.client
      .getQueryCache()
      .getAll()
      .every((q) => q.state.data === undefined),
  );
  assert.deepEqual(b.denied, []);
});

test('resource correction: observerAdded retirement detaches the target before transport admission', async (t) => {
  const b = fixture(t);
  b.owner.selectTarget('target');
  let retired;
  const unsubscribe = b.client.getQueryCache().subscribe((event) => {
    if (event.type !== 'observerAdded' || event.query.queryKey[4] !== 'target') return;
    unsubscribe();
    retired = event.query;
    b.owner.selectTarget(null);
  });
  t.after(unsubscribe);
  const start = b.renders.length;
  await b.owner.read('target');
  assert.ok(retired);
  assert.equal(retired.getObserversCount(), 0);
  assert.equal(b.server.requests.length, 0);
  assert.equal(b.owner.resources().target.data, null);
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .some((q) => q.queryKey[4] === 'target'),
    false,
  );
  assert.ok(b.renders.slice(start).every((r) => r.target.data === null));
  b.owner.selectTarget('target');
  await b.owner.read('target');
  assert.equal(b.server.requests.length, 1);
  assert.equal(b.owner.resources().target.data.id, 'target');
  assert.equal(
    b.client
      .getQueryCache()
      .getAll()
      .filter((q) => q.queryKey[4] === 'target').length,
    1,
  );
});

test('a network failure through the shared selected-resource owner retains admitted sprint scope without false denial', async (t) => {
  const b = fixture(t);
  selectResources(b);
  await b.owner.read('scope');
  const admitted = b.owner.resources().scope.data;
  b.server.get = () => {
    throw new Error('Synthetic network failure before a response');
  };
  await b.owner.read('scope');
  assert.equal(b.owner.resources().scope.status, 'error');
  assert.equal(b.owner.resources().scope.failure.status, 0);
  assert.equal(b.owner.resources().scope.data, admitted);
  assert.equal(b.owner.resources().scope.stale, true);
  assert.deepEqual(b.denied, []);
});

for (const withCapability of [false, true])
  test(`validated Query create cannot become a receipt after ${withCapability ? 'exact-completion capability rejection' : 'live authorization loss'}`, async (t) => {
    const server = sprintServer();
    t.mock.method(globalThis, 'fetch', server.fetch);
    const held = deferred();
    server.post = () => held.promise;
    let allowed = true;
    const client = new QueryClient();
    const owner = createSprintQueryOwner({
      transport: createSprintPlanningTransport(),
      client,
      changed() {},
      authorized: () => allowed,
      denied: () => assert.fail(),
      ...(withCapability
        ? {
            completionCurrent: (request) =>
              request.key === 'current-execution-key' &&
              request.command === command &&
              request.context === context,
          }
        : {}),
    });
    t.after(() => owner.clear());
    owner.bind(context);
    const saving = owner.create(command, 'retired-execution-key', new AbortController().signal);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
    allowed = false;
    held.resolve(Response.json(plannedSprint('created')));
    await assert.rejects(saving, (error) => isCancelledError(error));
    assert.equal(client.getMutationCache().getAll().length, 0);
    assert.equal(owner.resources().sprints.data, null);
    assert.equal(server.requests.filter((r) => r.init.method === 'POST').length, 1);
  });

test('a held canonical sprint catalogue response loses read authority before admission and cannot enter the live Query chain', async (t) => {
  const server = sprintServer();
  t.mock.method(globalThis, 'fetch', server.fetch);
  const held = deferred(),
    started = deferred();
  let allowed = true;
  server.get = ({ path }) => {
    if (path.endsWith('/sprints')) {
      started.resolve();
      return held.promise;
    }
  };
  const client = new QueryClient();
  const owner = createSprintQueryOwner({
    transport: createSprintPlanningTransport(),
    client,
    changed() {},
    authorized: () => allowed,
    denied: () => assert.fail('authority refusal is not a fabricated server denial'),
  });
  t.after(() => owner.clear());
  owner.bind(context);
  const reading = owner.read('sprints');
  await started.promise;
  allowed = false;
  held.resolve(Response.json(list));
  await reading;
  assert.equal(owner.resources().sprints.data, null);
  assert.equal(owner.resources().sprints.stale, true);
  assert.notEqual(owner.resources().sprints.status, 'ready');
  assert.equal(server.requests.length, 1);
  assert.equal(
    client
      .getQueryCache()
      .getAll()
      .some((query) => query.state.data !== undefined),
    false,
  );
});
