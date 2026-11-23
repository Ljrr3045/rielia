import assert from 'node:assert/strict';
import { act, createElement, getByRole } from './dom-harness.mjs';
import { projectBrowser } from './project-hook-harness.mjs';
import { sprintServer, preview } from './sprint-client-fixtures.mjs';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { useProjectSprintIntegration } from '../../src/lib/use-project-sprint-integration.ts';

/** Real production owners/composition; only HTTP/stream/browser boundaries are finite fixtures. */
export async function sprintIntegrationBrowser(
  t,
  { search = '?workspace=a&project=p&projectView=sprints&sprint=s', configure = () => {} } = {},
) {
  const b = projectBrowser(t, search);
  b.server.rows = 2;
  const server = sprintServer();
  const scoped = (value) =>
    Array.isArray(value)
      ? value.map(scoped)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
              key,
              key === 'workspaceId' ? 'a' : key === 'taskId' && item === 't' ? 't1' : scoped(item),
            ]),
          )
        : value;
  for (const key of [
    'planning',
    'sprint',
    'task',
    'scope',
    'history',
    'list',
    'target',
    'closure',
    'outcomes',
  ])
    server[key] = scoped(server[key]);
  server.get = ({ path, query }) =>
    path.endsWith('/close-preview')
      ? Response.json(scoped(preview(query.get('destination'))))
      : undefined;
  const originalFetch = globalThis.fetch;
  const frames = new Map();
  let frame = 0;
  const restores = [
    b.replace(globalThis, 'fetch', (url, options) => {
      const path = new URL(String(url), b.window.location.origin).pathname;
      if (/\/(?:planning|sprints)(?:\/|$)|\/sprint-history$|\/tasks\/[^/]+\/sprint$/.test(path)) {
        return server.fetch(String(url).replace('/tasks/t1/', '/tasks/t/'), options);
      }
      return originalFetch(url, options);
    }),
    b.replace(b.window, 'matchMedia', (media) => ({
      media,
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    })),
    b.replace(globalThis, 'self', b.window),
    b.replace(b.window, 'setTimeout', globalThis.setTimeout),
    b.replace(b.window, 'clearTimeout', globalThis.clearTimeout),
    b.replace(globalThis, 'requestAnimationFrame', (callback) => {
      frames.set(++frame, callback);
      return frame;
    }),
    b.replace(globalThis, 'cancelAnimationFrame', (id) => frames.delete(id)),
    b.replace(b.window.HTMLElement.prototype, 'attachEvent', function () {
      this.detachEvent = () => {};
    }),
    b.replace(b.window.HTMLElement.prototype, 'detachEvent', () => {}),
  ];
  t.after(async () => {
    try {
      await b.unmount();
    } finally {
      restores.reverse().forEach((restore) => restore());
    }
  });
  async function flush() {
    for (let count = 0; frames.size; count++) {
      assert.ok(count < 20, 'composed focus frames converge');
      const callbacks = [...frames.values()];
      frames.clear();
      await act(async () => callbacks.forEach((callback) => callback(0)));
    }
  }
  async function click(name, root = b.container) {
    await act(async () => getByRole(root, 'button', { name, exact: true }).click());
    await flush();
  }
  async function select(name, value, root = b.container) {
    await act(async () => {
      const element = getByRole(root, 'combobox', { name, exact: true });
      element.value = value;
      element.dispatchEvent(new b.window.Event('change', { bubbles: true }));
    });
    await flush();
  }
  async function input(element, value) {
    await act(async () => {
      element.focus();
      const prototype =
        element.tagName === 'TEXTAREA'
          ? b.window.HTMLTextAreaElement.prototype
          : b.window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
      element.dispatchEvent(new b.window.Event('input', { bubbles: true }));
      element.dispatchEvent(new b.window.Event('change', { bubbles: true }));
      element.dispatchEvent(new b.window.KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    });
  }
  configure(b, server);
  return {
    ...b,
    sprintServer: server,
    flush,
    click,
    select,
    input,
    async screen(View, lang = 'en') {
      await b.render(createElement(View));
      await b.clock.advance(500);
      if (lang === 'en') await select('Idioma', 'en');
      await flush();
    },
    async owners() {
      let latest;
      const renders = [];
      function Harness() {
        const parent = useProjectTasks();
        latest = useProjectSprintIntegration(parent);
        renders.push(latest);
        return createElement('output', null, latest.parent.status);
      }
      await b.render(createElement(Harness));
      await b.clock.advance(500);
      return {
        get state() {
          return latest;
        },
        renders,
      };
    },
  };
}
