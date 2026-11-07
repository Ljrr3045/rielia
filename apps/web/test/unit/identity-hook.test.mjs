import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useIdentity } from '../../src/lib/use-identity.ts';
import {
  act,
  browserFixture,
  controlledFetch,
  identitySession,
  mountHook,
} from './dom-harness.mjs';

test(
  'auth-error mount remains recoverable through configured signed-out, signed-in and disabled reads',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t, 'https://app.example.test/identity?auth=error');
    const fetch = controlledFetch(browser);
    const hook = await mountHook(browser, useIdentity);
    assert.equal(hook.state.status, 'loading');
    assert.equal(hook.state.message, 'sign-in-incomplete');
    assert.equal(browser.container.textContent, 'loading');
    await fetch.reply(0, { enabled: true, providers: ['github'] });
    assert.equal(fetch.calls[1].url, '/api/v1/identity/session');
    await fetch.reply(1, null);
    assert.equal(hook.state.status, 'signed-out');
    assert.deepEqual(hook.state.providers, ['github']);
    assert.equal(hook.state.message, 'sign-in-incomplete');
    await act(async () => hook.state.dismissMessage());
    assert.equal(hook.state.message, null);
    let refresh;
    await act(async () => {
      refresh = hook.state.refresh();
    });
    await fetch.reply(2, { enabled: true, providers: ['google'] });
    const session = identitySession();
    await fetch.reply(3, session);
    await refresh;
    assert.equal(hook.state.status, 'signed-in');
    assert.deepEqual(hook.state.session, session);
    assert.deepEqual(hook.state.providers, ['google']);
    await act(async () => {
      refresh = hook.state.refresh();
    });
    assert.equal(hook.state.session, null);
    await fetch.reply(4, { enabled: false, providers: ['github'] });
    await refresh;
    assert.equal(hook.state.status, 'disabled');
    assert.deepEqual(hook.state.providers, []);
    assert.equal(hook.state.session, null);
    assert.equal(fetch.calls.length, 5, 'disabled configuration must not request a session');
  },
);

test(
  'failed and malformed reads are unavailable, with an explicit successful retry',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t);
    const fetch = controlledFetch(browser);
    const hook = await mountHook(browser, useIdentity);
    await fetch.reject(0);
    assert.equal(hook.state.status, 'unavailable');
    assert.equal(hook.state.session, null);
    let refresh;
    await act(async () => {
      refresh = hook.state.refresh();
    });
    await fetch.reply(1, { enabled: true, providers: ['github'] });
    await fetch.reply(2, { user: { id: 'invalid' } });
    await refresh;
    assert.equal(hook.state.status, 'unavailable');
    assert.deepEqual(hook.state.providers, []);
    await act(async () => {
      refresh = hook.state.refresh();
    });
    await fetch.reply(3, { enabled: true, providers: ['github'] });
    await fetch.reply(4, null);
    await refresh;
    assert.equal(hook.state.status, 'signed-out');
    assert.equal(browser.container.textContent, 'signed-out');
  },
);

test(
  'StrictMode cleanup invalidates old loads, and unmount prevents late publication',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t);
    const fetch = controlledFetch(browser);
    const hook = await mountHook(browser, useIdentity, true);
    assert.equal(fetch.calls.length, 2, 'StrictMode replays effect setup after cleanup');
    await fetch.reply(1, { enabled: true, providers: ['github'] });
    await fetch.reply(2, identitySession('current'));
    assert.equal(hook.state.session.user.id, 'current');
    await fetch.reply(0, { enabled: true, providers: ['google'] });
    await fetch.reply(3, identitySession('former'));
    assert.equal(hook.state.session.user.id, 'current');
    assert.deepEqual(hook.state.providers, ['github']);
    let refresh;
    await act(async () => {
      refresh = hook.state.refresh();
    });
    await fetch.reply(4, { enabled: true, providers: ['github'] });
    await browser.unmount();
    const renders = hook.renders.length;
    await fetch.reply(5, identitySession('after-unmount'));
    await refresh;
    assert.equal(hook.renders.length, renders);
    assert.equal(hook.state.session, null);
    assert.equal(browser.container.textContent, '');
  },
);
