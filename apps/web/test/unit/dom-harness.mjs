import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export { act, createElement, StrictMode };
const tools = createRequire(
  new URL('../../../../scripts/unit/tools/package.json', import.meta.url),
);
const { JSDOM } = tools('jsdom');
export const { getByRole, queryByRole } = tools('@testing-library/dom');

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

export const fixedNow = Date.parse('2026-11-06T12:00:00.000Z');
export function identitySession(userId = 'human', expiresAt = fixedNow + 60_000) {
  return {
    user: {
      id: userId,
      name: `Human ${userId}`,
      email: `${userId}@example.test`,
      emailVerified: true,
    },
    session: { id: `session-${userId}`, expiresAt: new Date(expiresAt).toISOString() },
  };
}
export const page = (items) => ({ items, total: items.length, nextCursor: null });
export const workspace = (id) => ({
  id,
  name: `Workspace ${id}`,
  ownerPrincipalId: 'human',
  role: 'owner',
  createdAt: '2026-01-01T00:00:00.000Z',
});

/** Browser-boundary doubles only: hooks, controllers, transports and React stay real. */
export function browserFixture(t, url = 'https://app.example.test/identity') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url });
  const saved = new Map();
  function replace(target, key, value) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { configurable: true, writable: true, value });
    return () => {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete target[key];
    };
  }
  for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Node',
    'Event',
    'MouseEvent',
  ]) {
    saved.set(key, replace(globalThis, key, dom.window[key]));
  }
  saved.set('act', replace(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true));
  let now = fixedNow;
  saved.set(
    'date',
    replace(Date, 'now', () => now),
  );
  let uuid = 0;
  saved.set(
    'uuid',
    replace(
      globalThis.crypto,
      'randomUUID',
      () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, '0')}`,
    ),
  );
  let fetchHandler = () => {
    throw new Error('Unexpected fetch: configure the fixture boundary.');
  };
  const requests = [];
  saved.set(
    'fetch',
    replace(globalThis, 'fetch', (input, options = {}) => {
      const request = { url: String(input), options };
      requests.push(request);
      return fetchHandler(request);
    }),
  );
  const timers = new Map();
  let timerId = 0;
  dom.window.setTimeout = (callback, delay) => {
    const id = ++timerId;
    timers.set(id, { callback, delay });
    return id;
  };
  dom.window.clearTimeout = (id) => timers.delete(id);
  let visibility = 'visible';
  Object.defineProperty(dom.window.document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  });
  const listeners = new Map();
  for (const [target, types] of [
    [dom.window, ['pageshow', 'hashchange']],
    [dom.window.document, ['visibilitychange']],
  ]) {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    for (const type of types) listeners.set(type, new Set());
    target.addEventListener = (type, listener, options) => {
      if (types.includes(type)) listeners.get(type).add(listener);
      return add(type, listener, options);
    };
    target.removeEventListener = (type, listener, options) => {
      if (types.includes(type)) listeners.get(type).delete(listener);
      return remove(type, listener, options);
    };
  }
  const container = dom.window.document.body.appendChild(dom.window.document.createElement('div'));
  const root = createRoot(container);
  let mounted = true;
  async function unmount() {
    if (mounted) {
      await act(async () => root.unmount());
      mounted = false;
    }
  }
  t.after(async () => {
    try {
      await unmount();
      assert.equal(timers.size, 0, 'unmount must cancel browser expiry timers');
      for (const [type, active] of listeners) {
        assert.equal(active.size, 0, `unmount must remove ${type} listeners`);
      }
    } finally {
      dom.window.close();
      for (const restore of [...saved.values()].reverse()) restore();
    }
  });
  return {
    window: dom.window,
    document: dom.window.document,
    container,
    requests,
    timers,
    listeners,
    replace,
    setNow(value) {
      now = value;
    },
    setFetch(handler) {
      fetchHandler = handler;
    },
    async render(element) {
      await act(async () => root.render(element));
    },
    unmount,
    async visibility(value) {
      visibility = value;
      await act(async () =>
        dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange')),
      );
    },
    async event(type) {
      await act(async () => dom.window.dispatchEvent(new dom.window.Event(type)));
    },
    async fireTimer(id) {
      assert.ok(timers.has(id), `No scheduled timer ${id}`);
      const { callback } = timers.get(id);
      timers.delete(id);
      await act(async () => callback());
    },
  };
}

export function controlledFetch(browser) {
  const calls = [];
  browser.setFetch((request) => {
    const response = deferred();
    calls.push({ ...request, ...response, settled: false });
    return response.promise;
  });
  return {
    calls,
    async reply(index, value, status = 200) {
      assert.ok(calls[index], `Missing request ${index}`);
      assert.equal(calls[index].settled, false);
      calls[index].settled = true;
      await act(async () => calls[index].resolve(Response.json(value, { status })));
    },
    async reject(index) {
      assert.ok(calls[index], `Missing request ${index}`);
      assert.equal(calls[index].settled, false);
      calls[index].settled = true;
      await act(async () => calls[index].reject(new Error('Synthetic offline boundary')));
    },
  };
}

export async function mountHook(browser, useHook, strict = false) {
  let latest;
  const renders = [];
  function Harness() {
    latest = useHook();
    renders.push(latest);
    return createElement('output', null, latest.status);
  }
  await browser.render(
    strict ? createElement(StrictMode, null, createElement(Harness)) : createElement(Harness),
  );
  return {
    get state() {
      return latest;
    },
    renders,
  };
}
