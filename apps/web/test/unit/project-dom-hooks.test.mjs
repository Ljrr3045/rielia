import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useRef } from 'react';
import {
  useBodyScrollLock,
  useFocusTrap,
  useMediaQuery,
} from '../../src/app/projects/project-dom-hooks.ts';
import { act, browserFixture, createElement, StrictMode } from './dom-harness.mjs';

// Real React/hooks and JSDOM. Geometry is an explicit boundary double, never native Tab proof.
function effectsFixture(t) {
  const browser = browserFixture(t);
  const frames = new Map();
  let nextFrame = 0;
  const restoreRequest = browser.replace(globalThis, 'requestAnimationFrame', (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  const restoreCancel = browser.replace(globalThis, 'cancelAnimationFrame', (id) =>
    frames.delete(id),
  );
  t.after(async () => {
    try {
      await browser.unmount();
      assert.equal(frames.size, 0, 'effect cleanup cancels pending initial focus');
    } finally {
      restoreCancel();
      restoreRequest();
    }
  });
  return {
    ...browser,
    frames,
    async frame() {
      const pending = [...frames];
      frames.clear();
      await act(async () => pending.forEach(([, callback]) => callback(0)));
    },
    async key(key, options = {}, consume = false) {
      const event = new browser.window.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      });
      if (consume) event.preventDefault();
      await act(async () => browser.document.activeElement.dispatchEvent(event));
      return event;
    },
  };
}

function Lock({ active }) {
  useBodyScrollLock(active);
  return null;
}

test(
  'nested locks survive StrictMode and restore the original overflow only after the final lock',
  { timeout: 30_000 },
  async (t) => {
    const b = effectsFixture(t);
    b.document.body.style.overflow = 'clip';
    const locks = (first, second) =>
      createElement(
        StrictMode,
        null,
        createElement(Lock, { key: 'first', active: first }),
        createElement(Lock, { key: 'second', active: second }),
      );
    await b.render(locks(true, true));
    assert.equal(b.document.body.style.overflow, 'hidden');
    await b.render(locks(false, true));
    assert.equal(b.document.body.style.overflow, 'hidden');
    await b.render(locks(false, false));
    assert.equal(b.document.body.style.overflow, 'clip');
    await b.render(locks(true, false));
    await b.unmount();
    assert.equal(b.document.body.style.overflow, 'clip');
  },
);

test(
  'media subscription switches query, reflects change and removes every listener',
  { timeout: 30_000 },
  async (t) => {
    const b = effectsFixture(t);
    const records = new Map();
    b.window.matchMedia = (query) => {
      if (!records.has(query)) records.set(query, { matches: false, listeners: new Set() });
      const record = records.get(query);
      return {
        get matches() {
          return record.matches;
        },
        addEventListener(type, listener) {
          assert.equal(type, 'change');
          record.listeners.add(listener);
        },
        removeEventListener(type, listener) {
          assert.equal(type, 'change');
          record.listeners.delete(listener);
        },
      };
    };
    function Probe({ query }) {
      return createElement('output', null, String(useMediaQuery(query)));
    }
    await b.render(
      createElement(StrictMode, null, createElement(Probe, { query: '(max-width: 47.9375rem)' })),
    );
    const old = records.get('(max-width: 47.9375rem)');
    assert.equal(old.listeners.size, 1);
    await act(async () => {
      old.matches = true;
      old.listeners.forEach((listener) => listener());
    });
    assert.equal(b.container.textContent, 'true');
    await b.render(
      createElement(StrictMode, null, createElement(Probe, { query: '(max-width: 79.9375rem)' })),
    );
    assert.equal(old.listeners.size, 0);
    assert.equal(b.container.textContent, 'false');
    await b.unmount();
    assert.ok([...records.values()].every((record) => record.listeners.size === 0));
  },
);

function Trap({ active = true, onEscape, empty = false }) {
  const ref = useRef(null);
  useFocusTrap(ref, active, onEscape);
  return createElement(
    'section',
    { ref, tabIndex: -1 },
    empty
      ? null
      : [
          createElement('button', { key: 'first', 'data-autofocus': true }, 'First'),
          createElement('button', { key: 'disabled', disabled: true }, 'Disabled'),
          createElement('button', { key: 'last' }, 'Last'),
        ],
  );
}

for (const strict of [false, true]) {
  test(
    `focus trap wraps both boundaries and restores a connected opener; StrictMode=${strict}`,
    { timeout: 30_000 },
    async (t) => {
      const b = effectsFixture(t);
      const opener = b.document.body.appendChild(b.document.createElement('button'));
      opener.focus();
      const element = createElement(Trap);
      await b.render(strict ? createElement(StrictMode, null, element) : element);
      for (const node of b.container.querySelectorAll('button')) {
        Object.defineProperty(node, 'offsetParent', {
          configurable: true,
          get: () => node.parentElement,
        });
      }
      await b.frame();
      const [first, , last] = b.container.querySelectorAll('button');
      assert.equal(b.document.activeElement, first);
      assert.equal((await b.key('Tab', { shiftKey: true })).defaultPrevented, true);
      assert.equal(b.document.activeElement, last);
      assert.equal((await b.key('Tab')).defaultPrevented, true);
      assert.equal(b.document.activeElement, first);
      await b.unmount();
      assert.equal(b.document.activeElement, opener);
    },
  );
}

test(
  'consumed Escape is ignored and a changed callback is used without reactivating the trap',
  { timeout: 30_000 },
  async (t) => {
    const b = effectsFixture(t);
    const calls = [];
    await b.render(createElement(Trap, { onEscape: () => calls.push('old') }));
    await b.frame();
    await b.key('Escape', {}, true);
    assert.deepEqual(calls, []);
    await b.render(createElement(Trap, { onEscape: () => calls.push('current') }));
    assert.equal(b.frames.size, 0);
    assert.equal((await b.key('Escape')).defaultPrevented, true);
    assert.deepEqual(calls, ['current']);
    await b.render(createElement(Trap, { active: false, onEscape: () => calls.push('inactive') }));
    await b.key('Escape');
    assert.deepEqual(calls, ['current']);
  },
);

test(
  'empty trap focuses its root and unmount before animation cancels focus',
  { timeout: 30_000 },
  async (t) => {
    const b = effectsFixture(t);
    await b.render(createElement(Trap, { empty: true }));
    await b.frame();
    const root = b.container.querySelector('section');
    assert.equal((await b.key('Tab')).defaultPrevented, true);
    assert.equal(b.document.activeElement, root);
    await b.render(createElement(Trap, { active: false }));
    await b.render(createElement(Trap));
    assert.equal(b.frames.size, 1);
    await b.unmount();
    assert.equal(b.frames.size, 0);
  },
);

test(
  'trap cleanup skips a disconnected opener and preserves deliberate connected focus',
  { timeout: 30_000 },
  async (t) => {
    const b = effectsFixture(t);
    const removed = b.document.body.appendChild(b.document.createElement('button'));
    removed.focus();
    await b.render(createElement(Trap));
    await b.frame();
    removed.remove();
    const elsewhere = b.document.body.appendChild(b.document.createElement('button'));
    elsewhere.focus();
    await b.unmount();
    assert.equal(b.document.activeElement, elsewhere);
  },
);
