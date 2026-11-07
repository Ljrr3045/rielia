import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useState } from 'react';
import { IdentityView } from '../../src/app/identity/identity-view.tsx';
import { act, browserFixture, createElement, getByRole, queryByRole } from './dom-harness.mjs';

function props(overrides = {}) {
  return {
    status: 'signed-out',
    providers: ['github'],
    user: null,
    pending: null,
    message: null,
    onRetry() {},
    onSignIn() {},
    onSignOut() {},
    ...overrides,
  };
}

test(
  'only configured providers render and their controls emit the selected provider',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t);
    const calls = [];
    for (const [provider, name, absent] of [
      ['github', 'GitHub', 'Google'],
      ['google', 'Google', 'GitHub'],
    ]) {
      await browser.render(
        createElement(
          IdentityView,
          props({ providers: [provider], onSignIn: (value) => calls.push(value) }),
        ),
      );
      assert.equal(queryByRole(browser.container, 'button', { name: new RegExp(absent) }), null);
      await act(async () =>
        getByRole(browser.container, 'button', {
          name: new RegExp(`Continue with ${name}`),
        }).click(),
      );
    }
    assert.deepEqual(calls, ['github', 'google']);
    await browser.render(createElement(IdentityView, props({ providers: [] })));
    assert.equal(queryByRole(browser.container, 'button'), null);
    assert.match(
      getByRole(browser.container, 'status').textContent,
      /No sign-in providers are configured/,
    );
  },
);

for (const [status, pending, name, callback] of [
  ['signed-out', 'sign-in', /Continue with GitHub/, 'onSignIn'],
  ['signed-in', 'sign-out', /Sign out/, 'onSignOut'],
]) {
  test(
    `${pending} pending control announces progress and ignores repeated activation`,
    { timeout: 30_000 },
    async (t) => {
      const browser = browserFixture(t);
      const calls = [];
      function Parent() {
        const [action, setAction] = useState(null);
        return createElement(
          IdentityView,
          props({
            status,
            pending: action,
            user: { name: 'Human', email: 'human@example.test' },
            [callback]: (...args) => {
              calls.push(args);
              setAction(pending);
            },
          }),
        );
      }
      await browser.render(createElement(Parent));
      const button = getByRole(browser.container, 'button', { name });
      button.focus();
      await act(async () => button.click());
      assert.equal(calls.length, 1);
      assert.equal(button.getAttribute('aria-disabled'), 'true');
      assert.equal(browser.container.querySelector('section').getAttribute('aria-busy'), 'true');
      assert.match(
        getByRole(browser.container, 'status').textContent,
        pending === 'sign-in' ? /Starting sign-in/ : /Signing out/,
      );
      await act(async () => {
        button.click();
        button.click();
      });
      assert.equal(calls.length, 1, 'pending intent must not reach the callback twice');
      assert.equal(browser.document.activeElement, button);
    },
  );
}

test('unavailable Retry emits once before loading replaces it', { timeout: 30_000 }, async (t) => {
  const browser = browserFixture(t);
  let retries = 0;
  function Parent() {
    const [status, setStatus] = useState('unavailable');
    return createElement(
      IdentityView,
      props({
        status,
        onRetry() {
          retries++;
          setStatus('loading');
        },
      }),
    );
  }
  await browser.render(createElement(Parent));
  assert.match(getByRole(browser.container, 'status').textContent, /Session status is unavailable/);
  const retry = getByRole(browser.container, 'button', { name: /Check again/ });
  retry.focus();
  await act(async () => retry.click());
  assert.equal(retries, 1);
  assert.equal(queryByRole(browser.container, 'button'), null);
  assert.match(getByRole(browser.container, 'status').textContent, /Checking session/);
  assert.equal(
    browser.document.activeElement,
    getByRole(browser.container, 'heading', { name: /Session/ }),
  );
});

test(
  'recoverable failures remain announced while pending changes',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t);
    for (const [message, text] of [
      ['sign-in-incomplete', /Sign-in was cancelled or incomplete/],
      ['sign-in-failed', /Sign-in could not start/],
      ['sign-out-failed', /Sign-out could not be confirmed/],
    ]) {
      await browser.render(createElement(IdentityView, props({ message })));
      assert.match(getByRole(browser.container, 'alert').textContent, text);
      assert.equal(getByRole(browser.container, 'status').getAttribute('aria-live'), 'polite');
      await browser.render(createElement(IdentityView, props({ message, pending: 'sign-in' })));
      assert.match(getByRole(browser.container, 'alert').textContent, text);
    }
  },
);

test(
  'completed action restores Session focus only when its removed control lost focus',
  { timeout: 30_000 },
  async (t) => {
    const browser = browserFixture(t);
    const signedIn = props({
      status: 'signed-in',
      user: { name: 'Human', email: 'human@example.test' },
    });
    await browser.render(createElement(IdentityView, props()));
    let button = getByRole(browser.container, 'button', { name: /Continue with GitHub/ });
    button.focus();
    await act(async () => button.click());
    await browser.render(createElement(IdentityView, props({ pending: 'sign-in' })));
    assert.equal(browser.document.activeElement, button, 'a connected control retains focus');
    await browser.render(createElement(IdentityView, signedIn));
    const heading = getByRole(browser.container, 'heading', { name: /Session/ });
    assert.equal(browser.document.activeElement, heading);
    assert.equal(heading.tabIndex, -1);

    await browser.render(createElement(IdentityView, props()));
    button = getByRole(browser.container, 'button', { name: /Continue with GitHub/ });
    button.focus();
    await act(async () => button.click());
    await browser.render(createElement(IdentityView, props({ pending: 'sign-in' })));
    const elsewhere = browser.document.body.appendChild(browser.document.createElement('button'));
    elsewhere.textContent = 'Other control';
    elsewhere.focus();
    await browser.render(createElement(IdentityView, signedIn));
    assert.equal(
      browser.document.activeElement,
      elsewhere,
      'completion must preserve deliberate focus elsewhere',
    );
  },
);
