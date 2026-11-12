import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { useWorkspaces } from '../../src/lib/use-workspaces.ts';
import { useWorkspaceScreenActions } from '../../src/app/workspaces/use-workspace-screen-actions.ts';
import {
  act,
  browserFixture,
  createElement,
  deferred,
  getByRole,
  identitySession,
  page,
  queryByRole,
  workspace,
} from './dom-harness.mjs';
import { workspaceInvitation, workspaceMember } from './workspace-screen-fixtures.mjs';

// CSS is the only module boundary replaced. Real components, locale, hooks,
// controller and transport run unchanged; native layout is checked in Brave.
const css = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === './workspace.module.css')
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('/workspace.module.css'))
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    return next(url, context);
  },
});
const { OperationPanel } = await import('../../src/app/workspaces/workspace-feedback.tsx');
const { InvitationLinkPanel } = await import('../../src/app/workspaces/workspace-invitations.tsx');
const { LocaleProvider } = await import('../../src/app/workspaces/workspace-ui.tsx');
css.deregister();

const invite = {
  type: 'invite',
  workspaceId: 'a',
  recipientEmail: 'invitee@example.test',
  role: 'member',
};
const token = 'g'.repeat(43);
const inbound = 'i'.repeat(43);

async function mountFeedback(t, lang = 'en') {
  const browser = browserFixture(t, `https://app.example.test/workspaces#invitation=${inbound}`);
  const server = { session: identitySession(), readStatus: 200, heldRead: null };
  browser.setFetch(async ({ url, options }) => {
    if (options.method === 'POST')
      return Response.json({ invitation: workspaceInvitation(), token });
    if (url === '/api/v1/identity/config') return Response.json({ enabled: true, providers: [] });
    if (url === '/api/v1/identity/session') return Response.json(server.session);
    if (url === '/api/v1/workspaces') return Response.json(page([workspace('a'), workspace('b')]));
    if (/\/workspaces\/(a|b)$/.test(url)) {
      if (server.heldRead !== null) return server.heldRead.promise;
      return server.readStatus === 200
        ? Response.json(workspace(url.at(-1)))
        : Response.json(
            { code: 'READ_UNAVAILABLE', message: 'Read failed' },
            { status: server.readStatus },
          );
    }
    if (url.endsWith('/members')) return Response.json(page([workspaceMember()]));
    if (url.endsWith('/invitations')) return Response.json(page([workspaceInvitation()]));
    throw new Error(`Unexpected feedback request: ${url}`);
  });
  let latest;
  function Harness() {
    const ws = useWorkspaces();
    const screen = useWorkspaceScreenActions(ws);
    latest = { ...ws, screen };
    return createElement(
      LocaleProvider,
      { lang },
      createElement(OperationPanel, {
        ...ws,
        ...screen,
        onCancel: ws.cancelPending,
        onRetry: screen.retry,
        onDiscard: screen.discard,
        onDismiss: screen.dismiss,
        onRefresh: ws.refresh,
        onSwitch: ws.selectWorkspace,
      }),
      screen.invitationLinkVisible
        ? createElement(InvitationLinkPanel, {
            link: ws.invitationLink,
            onDone: screen.finishInvitationLink,
          })
        : null,
    );
  }
  await browser.render(createElement(Harness));
  return {
    ...browser,
    server,
    get state() {
      return latest;
    },
  };
}

const posts = (browser) => browser.requests.filter(({ options }) => options.method === 'POST');

for (const lang of ['en', 'es']) {
  for (const status of [403, 503]) {
    test(`confirmed invite after read ${status} gives truthful ${lang} feedback without resubmission`, async (t) => {
      const browser = await mountFeedback(t, lang);
      const held = deferred();
      browser.server.heldRead = held;
      await act(async () => browser.state.screen.run(invite));
      const link = getByRole(browser.container, 'textbox');
      assert.equal(new URL(link.value).hash, `#invitation=${token}`);
      assert.match(
        browser.container.textContent,
        lang === 'en' ? /available below once/ : /disponible abajo una sola vez/,
      );
      browser.server.heldRead = null;
      browser.server.readStatus = status;
      await act(async () =>
        held.resolve(
          Response.json({ code: 'READ_UNAVAILABLE', message: 'Read failed' }, { status }),
        ),
      );
      assert.equal(browser.state.outcome, 'success');
      assert.equal(browser.state.invitationLink, null);
      assert.equal(queryByRole(browser.container, 'textbox'), null);
      const notice = getByRole(browser.container, 'status');
      assert.match(
        notice.textContent,
        lang === 'en'
          ? /Invitation created\. Its temporary link is not available in this tab/
          : /Invitación creada\. Su enlace temporal no está disponible en esta pestaña/,
      );
      assert.doesNotMatch(notice.textContent, /available below|disponible abajo/);
      assert.match(
        notice.textContent,
        lang === 'en'
          ? /If you did not copy the link and still have permission/
          : /Si no copiaste el enlace y aún tienes permiso/,
      );
      assert.match(
        notice.textContent,
        lang === 'en' ? /Refresh does not restore the link/ : /Actualizar no recupera el enlace/,
      );
      assert.match(notice.textContent, /invitee@example\.test/);
      assert.equal(browser.document.activeElement, notice);
      assert.equal(queryByRole(browser.container, 'button', { name: /Retry|Reintentar/ }), null);
      assert.match(
        notice.textContent,
        status === 403
          ? lang === 'en'
            ? /can no longer read/
            : /ya no puede leer/
          : lang === 'en'
            ? /list could not refresh/
            : /lista no se pudo actualizar/,
      );
      browser.server.readStatus = 200;
      await act(async () =>
        getByRole(notice, 'button', {
          name: lang === 'en' ? 'Refresh' : 'Actualizar',
          exact: true,
        }).click(),
      );
      assert.equal(browser.state.status, 'ready');
      assert.equal(browser.state.invitationLink, null, 'read recovery cannot resurrect the secret');
      assert.doesNotMatch(
        getByRole(browser.container, 'status').textContent,
        /available below|disponible abajo/,
      );
      await act(async () =>
        getByRole(browser.container, 'button', {
          name: lang === 'en' ? 'Dismiss notice' : 'Cerrar aviso',
          exact: true,
        }).click(),
      );
      assert.equal(queryByRole(browser.container, 'status'), null);
      assert.equal(
        browser.state.hasInvitation,
        true,
        'dismissing success preserves the inbound invitation',
      );
      assert.equal(posts(browser).length, 1, 'refresh and dismiss are not invite retries');
    });
  }
}

test('visible invitation success preserves manual copy fallback and Done keeps the inbound token', async (t) => {
  const browser = await mountFeedback(t);
  const restore = browser.replace(browser.window.navigator, 'clipboard', {
    async writeText() {
      throw new Error('Clipboard denied');
    },
  });
  t.after(restore);
  await act(async () => browser.state.screen.run(invite));
  assert.match(
    getByRole(browser.container, 'status', { name: 'Change saved' }).textContent,
    /available below once/,
  );
  const link = getByRole(browser.container, 'textbox');
  // React loads before jsdom in the shared harness and detects its legacy input
  // event path. Supply only those missing browser event bindings for this field.
  for (const name of ['attachEvent', 'detachEvent']) t.after(browser.replace(link, name, () => {}));
  await act(async () =>
    getByRole(browser.container, 'button', { name: 'Copy link', exact: true }).click(),
  );
  assert.equal(browser.document.activeElement, link);
  assert.equal(link.selectionStart, 0);
  assert.equal(link.selectionEnd, link.value.length);
  assert.match(browser.container.textContent, /copy it manually/);
  await act(async () =>
    getByRole(browser.container, 'button', { name: 'Done', exact: true }).click(),
  );
  assert.equal(queryByRole(browser.container, 'textbox'), null);
  assert.equal(queryByRole(browser.container, 'status'), null);
  assert.equal(browser.state.hasInvitation, true);
  assert.equal(posts(browser).length, 1);
});

for (const clear of ['refresh', 'selection', 'replacement', 'expiry']) {
  test(`${clear} clears the generated result without replaying the invitation`, async (t) => {
    const browser = await mountFeedback(t);
    await act(async () => browser.state.screen.run(invite));
    assert.equal(browser.state.outcome, 'success');
    assert.ok(getByRole(browser.container, 'status', { name: 'Change saved' }));
    assert.equal(
      new URL(getByRole(browser.container, 'textbox').value).hash,
      `#invitation=${token}`,
    );
    if (clear === 'refresh') await act(async () => browser.state.refresh());
    if (clear === 'selection') await act(async () => browser.state.selectWorkspace('b'));
    if (clear === 'replacement') {
      browser.server.session = identitySession('replacement');
      await act(async () => browser.state.refresh());
      assert.equal(browser.state.hasInvitation, false);
    }
    if (clear === 'expiry') {
      browser.server.session = null;
      browser.setNow(Date.parse(browser.state.session.session.expiresAt));
      await browser.fireTimer([...browser.timers.keys()][0]);
      assert.equal(browser.state.status, 'signed-out');
    }
    assert.equal(browser.state.invitationLink, null);
    if (clear === 'refresh') {
      assert.equal(browser.state.status, 'ready');
      assert.equal(browser.state.outcome, 'success');
      const notice = getByRole(browser.container, 'status', { name: 'Change saved' });
      assert.match(notice.textContent, /Invitation created\. Its temporary link is not available/);
      assert.match(notice.textContent, /Refresh does not restore the link/);
      assert.doesNotMatch(notice.textContent, /available below once/);
      assert.equal(queryByRole(browser.container, 'textbox'), null);
    } else {
      if (clear === 'selection' || clear === 'replacement') {
        assert.equal(browser.state.status, 'ready');
        assert.equal(browser.state.outcome, null);
      }
      if (clear === 'selection') assert.equal(browser.state.selectedWorkspaceId, 'b');
      if (clear === 'replacement') assert.equal(browser.state.session.user.id, 'replacement');
      assert.equal(queryByRole(browser.container, 'status'), null);
      assert.equal(queryByRole(browser.container, 'alert'), null);
      assert.equal(browser.container.childElementCount, 0, `${clear} removes the feedback panels`);
    }
    assert.equal(posts(browser).length, 1);
  });
}

test('unrelated success and uncertain invitation-link recovery keep their distinct messages and actions', async (t) => {
  const browser = browserFixture(t);
  const props = {
    status: 'ready',
    pending: null,
    outcome: 'success',
    retryTarget: null,
    draft: null,
    workspaces: page([workspace('a')]),
    selectedWorkspaceId: 'a',
    lastAction: { type: 'update-member', subject: { kind: 'member', value: 'Ana' } },
    invitationLinkVisible: false,
    onCancel() {},
    onRetry() {},
    onDiscard() {},
    onDismiss() {},
    onRefresh() {},
    onSwitch() {},
  };
  const render = (value) =>
    browser.render(
      createElement(LocaleProvider, { lang: 'en' }, createElement(OperationPanel, value)),
    );
  await render(props);
  assert.match(getByRole(browser.container, 'status').textContent, /Member updated/);
  assert.doesNotMatch(browser.container.textContent, /temporary link/);
  await render({
    ...props,
    outcome: 'invitation-link-unavailable',
    lastAction: { type: 'invite', subject: { kind: 'invitation', value: invite.recipientEmail } },
    draft: invite,
  });
  const warning = getByRole(browser.container, 'alert');
  assert.match(warning.textContent, /server may have created the invitation/);
  assert.doesNotMatch(warning.textContent, /Invitation created\. Its temporary link/);
  assert.ok(getByRole(warning, 'button', { name: 'Refresh list', exact: true }));
});
