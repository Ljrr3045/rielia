import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { TextEncoder } from 'node:util';
import {
  act,
  browserFixture,
  deferred,
  fixedNow,
  identitySession,
  page,
  workspace,
} from './dom-harness.mjs';

const date = '2026-01-01T00:00:00.000Z';
const creator = { principalId: 'human', name: 'Human', kind: 'human', active: true };
export function project(id = 'p', workspaceId = 'a', version = 1) {
  return {
    id,
    workspaceId,
    key: 'QA',
    name: `Project ${id}`,
    description: '',
    version,
    visibility: 'workspace',
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    creator,
    provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null },
    capabilities: {
      canEdit: true,
      canArchive: true,
      canRestore: false,
      canManageAccess: false,
      canChangeVisibility: false,
      canGrantAccess: false,
      canRevokeAccess: false,
    },
    url: `/projects?workspace=${workspaceId}&project=${id}`,
  };
}
export function task(index = 1, workspaceId = 'a', projectId = 'p', version = 1) {
  return {
    id: `t${index}`,
    workspaceId,
    projectId,
    projectKey: 'QA',
    number: index,
    key: `QA-${index}`,
    version,
    orderVersion: 1,
    title: `Task ${index}`,
    description: '',
    type: 'task',
    priority: 'none',
    status: 'backlog',
    assigneePrincipalId: null,
    assignee: null,
    dueDate: null,
    parentTaskId: null,
    projectArchivedAt: null,
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    creator,
    provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null },
    capabilities: { canEdit: true, canArchive: true, canRestore: false },
    url: `/projects?workspace=${workspaceId}&project=${projectId}&task=t${index}`,
  };
}
export const createDraft = (workspaceId = 'a', projectId = 'p') => ({
  type: 'create-task',
  workspaceId,
  projectId,
  fields: { title: 'Retained intent' },
});

/** Actual hook/controller/clients; only HTTP, stream bytes, browser and clocks are controlled. */
export function projectBrowser(t, search = '?workspace=a&project=p') {
  const browser = browserFixture(t, `https://app.example.test/projects${search}`);
  const timers = new Map();
  let now = fixedNow;
  let timerId = 0;
  const restoreSet = browser.replace(globalThis, 'setTimeout', (callback, delay = 0, ...args) => {
    const id = ++timerId;
    timers.set(id, { at: now + Number(delay), callback: () => callback(...args) });
    return id;
  });
  const restoreClear = browser.replace(globalThis, 'clearTimeout', (id) => timers.delete(id));
  const ownedListeners = new Map();
  for (const [target, types] of [[browser.window, ['focus', 'online', 'offline', 'popstate']]]) {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    for (const type of types) ownedListeners.set(type, new Set());
    target.addEventListener = (type, listener, options) => {
      if (types.includes(type)) ownedListeners.get(type).add(listener);
      return add(type, listener, options);
    };
    target.removeEventListener = (type, listener, options) => {
      if (types.includes(type)) ownedListeners.get(type).delete(listener);
      return remove(type, listener, options);
    };
  }
  const clock = {
    timers,
    async advance(milliseconds) {
      const end = now + milliseconds;
      let fired = 0;
      while (true) {
        const next = [...timers]
          .filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        assert.ok(++fired <= 100, 'controlled timers must converge');
        now = next[1].at;
        browser.setNow(now);
        timers.delete(next[0]);
        await act(async () => next[1].callback());
      }
      now = end;
      browser.setNow(now);
      await act(async () => {});
    },
  };
  const holds = [];
  const server = {
    session: identitySession(),
    workspaces: [workspace('a'), workspace('b')],
    title: 'Task',
    version: 1,
    rows: 114,
    streams: [],
    mutate: () => Response.json(task(115), { status: 201 }),
    taskPage(w = 'a', cursor = false) {
      const offset = cursor ? 100 : 0;
      const items = Array.from({ length: server.rows }, (_, i) => ({
        ...task(i + 1, w),
        title: `${server.title} ${i + 1}`,
        version: server.version,
      }));
      return {
        items: items.slice(offset, offset + 100),
        total: items.length,
        nextCursor: offset + 100 < items.length ? 'tail' : null,
        capabilities: { canCreate: true },
        orderVersion: 1,
        columnCounts: { backlog: items.length, todo: 0, in_progress: 0, done: 0, canceled: 0 },
        selectedAssignee: null,
      };
    },
    holdNext(match) {
      const hold = { ...deferred(), match, request: null };
      holds.push(hold);
      return hold;
    },
    stream(request) {
      let controller;
      let closed = false;
      const stream = { request, aborted: false, canceled: false };
      const cleanup = () => request.options.signal.removeEventListener('abort', abort);
      const abort = () => {
        stream.aborted = true;
        cleanup();
        if (!closed) {
          closed = true;
          controller.error(new Error('HTTP stream aborted'));
        }
      };
      const body = new ReadableStream({
        start(value) {
          controller = value;
        },
        cancel() {
          stream.canceled = true;
          closed = true;
          cleanup();
        },
      });
      request.options.signal.addEventListener('abort', abort, { once: true });
      if (request.options.signal.aborted) abort();
      stream.emit = (value, id = 'hint') => {
        assert.equal(closed, false, 'cannot emit to a closed HTTP stream');
        controller.enqueue(
          new TextEncoder().encode(`event: update\nid: ${id}\ndata: ${JSON.stringify(value)}\n\n`),
        );
      };
      stream.disconnect = () => {
        if (!closed) {
          closed = true;
          cleanup();
          controller.close();
        }
      };
      server.streams.push(stream);
      return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
    },
  };
  browser.setFetch(async (request) => {
    const url = new URL(request.url, browser.window.location.origin);
    const path = url.pathname;
    const held = holds.find(
      (hold) =>
        hold.request === null &&
        (typeof hold.match === 'function' ? hold.match(request) : path === hold.match),
    );
    if (held) {
      held.request = request;
      return held.promise;
    }
    if (request.options.method === 'POST') return server.mutate(request);
    if (path === '/api/v1/identity/config') return Response.json({ enabled: true, providers: [] });
    if (path === '/api/v1/identity/session') return Response.json(server.session);
    if (path === '/api/v1/workspaces') return Response.json(page(server.workspaces));
    if (/\/events$/.test(path)) return server.stream(request);
    const scope = /^\/api\/v1\/workspaces\/([^/]+)(.*)$/.exec(path);
    assert.ok(scope, `Unexpected HTTP path ${path}`);
    const [, w, tail] = scope;
    if (tail === '') return Response.json(workspace(w));
    if (tail === '/members') return Response.json(page([]));
    if (tail === '/projects')
      return Response.json({ ...page([project('p', w)]), capabilities: { canCreate: true } });
    if (tail === '/projects/p') return Response.json(project('p', w, server.version));
    if (tail === '/projects/p/assignees')
      return Response.json({ ...page([]), workspaceId: w, projectId: 'p' });
    if (tail === '/projects/p/tasks')
      return Response.json(server.taskPage(w, url.searchParams.has('cursor')));
    const detail =
      /^\/projects\/p\/tasks\/t(\d+)(?:\/(relations|parent-candidates|checklist|comments|history))?$/.exec(
        tail,
      );
    if (detail) {
      const [, index, collection] = detail;
      if (!collection)
        return Response.json({
          ...task(Number(index), w, 'p', server.version),
          title: `${server.title} ${index}`,
        });
      const common = {
        ...page([]),
        workspaceId: w,
        projectId: 'p',
        taskId: `t${index}`,
        revision:
          collection === 'relations' || collection === 'parent-candidates' ? 1 : server.version,
      };
      if (collection === 'relations')
        return Response.json({
          ...common,
          parent: null,
          open: 0,
          archivedOpen: 0,
          capabilities: { canCreate: true, canLink: true, canUnlink: false },
        });
      if (collection === 'parent-candidates')
        return Response.json({ ...common, capabilities: { canSelect: true } });
      if (collection === 'checklist')
        return Response.json({ ...common, capabilities: { canCreate: true, canEdit: true } });
      if (collection === 'comments')
        return Response.json({ ...common, capabilities: { canCreate: true } });
      return Response.json(common);
    }
    throw new Error(`Unexpected HTTP path ${path}`);
  });
  const reads = (path) =>
    browser.requests.filter(
      (request) =>
        request.options.method !== 'POST' &&
        new URL(request.url, browser.window.location.origin).pathname === path,
    );
  const posts = () => browser.requests.filter((request) => request.options.method === 'POST');
  t.after(async () => {
    try {
      await browser.unmount();
      await act(async () => {});
      assert.equal(timers.size, 0, 'unmount cancels owned refresh, retry and stream timers');
      for (const [type, listeners] of ownedListeners)
        assert.equal(listeners.size, 0, `unmount removes ${type}`);
    } finally {
      restoreClear();
      restoreSet();
    }
  });
  return { ...browser, server, clock, reads, posts, ownedListeners };
}
