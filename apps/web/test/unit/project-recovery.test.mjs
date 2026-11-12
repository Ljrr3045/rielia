import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import {
  act,
  createElement,
  getByRole,
  queryByRole,
  deferred,
  identitySession,
} from './dom-harness.mjs';
import { projectBrowser, project, task } from './project-hook-harness.mjs';

// Only stylesheet loading and finite browser/HTTP boundaries are replaced.
// The actual screen, forms, focus hooks, controller and transports execute.
const css = registerHooks({
  resolve(specifier, context, next) {
    // Node ESM requires the extension; execute the real installed Next Link.
    if (specifier === 'next/link') return next('next/link.js', context);
    if (specifier === './projects.module.css')
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('/projects.module.css'))
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    return next(url, context);
  },
});
const { ProjectsView } = await import('../../src/app/projects/projects-view.tsx');
css.deregister();

async function mount(t, search = '?workspace=a&project=p', lang = 'en', configure = () => {}) {
  const b = projectBrowser(t, search);
  b.server.rows = 2;
  b.replace(b.window, 'matchMedia', (media) => ({
    media,
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  const frames = new Map();
  let frame = 0;
  const restores = [
    b.replace(globalThis, 'self', b.window),
    // Next idle scheduling uses self.setTimeout and global clearTimeout.
    b.replace(b.window, 'setTimeout', globalThis.setTimeout),
    b.replace(b.window, 'clearTimeout', globalThis.clearTimeout),
    b.replace(globalThis, 'requestAnimationFrame', (callback) => {
      frames.set(++frame, callback);
      return frame;
    }),
    b.replace(globalThis, 'cancelAnimationFrame', (id) => frames.delete(id)),
    // React DOM was imported before JSDOM; its legacy input focus seam is inert.
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
      assert.ok(count < 20, 'focus frames converge');
      const callbacks = [...frames.values()];
      frames.clear();
      await act(async () => callbacks.forEach((callback) => callback(0)));
    }
  }
  async function click(name, root = b.container) {
    await act(async () => getByRole(root, 'button', { name, exact: true }).click());
    await flush();
  }
  async function input(element, value) {
    await act(async () => {
      element.focus();
      Object.getOwnPropertyDescriptor(b.window.HTMLInputElement.prototype, 'value').set.call(
        element,
        value,
      );
      element.dispatchEvent(new b.window.KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    });
  }
  configure(b);
  await b.render(createElement(ProjectsView));
  if (lang === 'en') {
    const language = getByRole(b.container, 'combobox', { name: 'Idioma' });
    await act(async () => {
      language.value = 'en';
      language.dispatchEvent(new b.window.Event('change', { bubbles: true }));
    });
  }
  await flush();
  return { ...b, flush, click, input };
}

for (const lang of ['en', 'es'])
  test(`confirmed project write survives failed read and read-only reload, ${lang}`, async (t) => {
    const b = await mount(t, undefined, lang);
    await b.click(lang === 'en' ? 'Project settings' : 'Ajustes del proyecto');
    const dialog = getByRole(b.container, 'dialog');
    await b.input(
      getByRole(dialog, 'textbox', { name: /Project name|Nombre del proyecto/ }),
      'Private saved title',
    );
    b.server.mutate = () => Response.json({ ...project('p', 'a', 2), name: 'Private saved title' });
    const followup = b.server.holdNext(
      (request) =>
        request.options.method !== 'POST' && request.url === '/api/v1/workspaces/a/projects/p',
    );
    await b.click(lang === 'en' ? 'Save changes' : 'Guardar cambios', dialog);
    await act(async () =>
      followup.resolve(Response.json({ code: 'unavailable' }, { status: 503 })),
    );
    await b.flush();
    assert.equal(b.posts().length, 1);
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    assert.match(b.container.textContent, lang === 'en' ? /Changes saved/ : /Cambios guardados/);
    assert.match(
      b.container.textContent,
      lang === 'en' ? /could not refresh the view/ : /No pudimos actualizar la vista/,
    );
    assert.doesNotMatch(b.container.textContent, /Private saved title/);
    assert.equal(
      queryByRole(b.container, 'button', { name: /Retry save|Reintentar guardado/ }),
      null,
    );
    const failedAgain = b.server.holdNext(
      (request) =>
        request.options.method !== 'POST' && request.url === '/api/v1/workspaces/a/projects/p',
    );
    await b.click(lang === 'en' ? 'Load again' : 'Volver a cargar');
    await act(async () =>
      failedAgain.resolve(Response.json({ code: 'unavailable' }, { status: 503 })),
    );
    await b.flush();
    assert.match(b.container.textContent, lang === 'en' ? /Changes saved/ : /Cambios guardados/);
    await b.click(lang === 'en' ? 'Load again' : 'Volver a cargar');
    assert.match(
      b.container.textContent,
      lang === 'en' ? /Project updated/ : /Proyecto actualizado/,
    );
    assert.equal(b.posts().length, 1, 'read recovery never resubmits');
  });

for (const allowed of [false, true])
  test(`project denial hides private intent; fresh capability allows Return=${allowed}`, async (t) => {
    const b = await mount(t);
    await b.click('Project settings');
    await b.input(
      getByRole(b.container, 'textbox', { name: /Project name/ }),
      'Secret denied intent',
    );
    b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
    await b.click('Save changes', getByRole(b.container, 'dialog'));
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    assert.match(b.container.textContent, /The action is not allowed/);
    assert.doesNotMatch(b.container.textContent, /Secret denied intent/);
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }) === null, true);
    assert.match(b.document.activeElement.textContent, /The action is not allowed/);
    const read = b.server.holdNext(
      (request) =>
        request.options.method !== 'POST' && request.url === '/api/v1/workspaces/a/projects/p',
    );
    await b.click('Refresh');
    const current = project('p', 'a', 2);
    current.capabilities.canEdit = allowed;
    await act(async () => read.resolve(Response.json(current)));
    await b.flush();
    assert.doesNotMatch(b.container.textContent, /Secret denied intent/);
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }) !== null, allowed);
    assert.equal(b.posts().length, 1);
    if (allowed) {
      await b.click('Return to draft');
      assert.equal(
        getByRole(b.container, 'textbox', { name: /Project name/ }).value,
        'Secret denied intent',
      );
      b.server.mutate = () => Response.json(project('p', 'a', 3));
      await b.click('Save changes', getByRole(b.container, 'dialog'));
      assert.equal(b.posts().length, 2);
      assert.equal(
        JSON.parse(b.posts()[1].options.body).expectedVersion,
        1,
        'captured version is not silently rebased',
      );
      assert.notEqual(
        b.posts()[1].options.headers['Idempotency-Key'],
        b.posts()[0].options.headers['Idempotency-Key'],
        'a definite denied operation is deliberately resubmitted, not an unknown retry',
      );
    } else {
      await b.click('Discard draft');
      assert.equal(queryByRole(b.container, 'button', { name: 'Discard draft' }) === null, true);
      assert.equal(b.document.activeElement.isConnected, true);
      assert.equal(b.document.activeElement.matches('#projects-main, h1[tabindex="-1"]'), true);
    }
  });

test('denied draft is cleared on replacement session and never remounts private fields', async (t) => {
  const b = await mount(t);
  await b.click('Project settings');
  await b.input(getByRole(b.container, 'textbox', { name: /Project name/ }), 'Old private draft');
  b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
  await b.click('Save changes', getByRole(b.container, 'dialog'));
  b.server.session = identitySession();
  b.server.session.session.id = 'replacement';
  await b.click('Refresh');
  assert.doesNotMatch(b.container.textContent, /Old private draft|The action is not allowed/);
  assert.equal(queryByRole(b.container, 'dialog') === null, true);
  assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }) === null, true);
  assert.equal(b.posts().length, 1);
});

const checklist = () => ({
  workspaceId: 'a',
  projectId: 'p',
  taskId: 't1',
  revision: 1,
  items: [
    {
      id: 'item',
      text: 'Canonical step',
      completed: false,
      position: 1,
      version: 1,
      moveUpBeforeItemId: null,
      moveDownBeforeItemId: null,
      capabilities: { canEdit: true, canRemove: true, canMoveUp: false, canMoveDown: false },
    },
  ],
  total: 1,
  nextCursor: null,
  capabilities: { canCreate: true, canEdit: true },
});

for (const response of ['success', 'lost', 'forbidden', 'conflict'])
  test(`checklist held pending is distinct from ${response} response`, async (t) => {
    const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', (browser) => {
      browser.server.checklist = checklist();
    });
    await b.flush();
    const write = deferred();
    b.server.mutate = () => write.promise;
    const toggle = getByRole(b.container, 'checkbox', { name: 'Checklist item: Canonical step' });
    await act(async () => toggle.click());
    await b.flush();
    assert.equal(b.posts().length, 1);
    assert.match(b.container.textContent, /Saving change…/);
    assert.doesNotMatch(b.container.textContent, /The outcome could not be confirmed/);
    assert.equal(queryByRole(b.container, 'button', { name: 'Retry save' }) === null, true);
    assert.equal(queryByRole(b.container, 'button', { name: 'Discard' }) === null, true);
    assert.equal(toggle.disabled, true);
    await act(async () => toggle.click());
    assert.equal(b.posts().length, 1);
    const first = b.posts()[0];
    assert.deepEqual(JSON.parse(first.options.body), { expectedVersion: 1, completed: true });
    if (response === 'lost') await act(async () => write.reject(new Error('Lost HTTP response')));
    else
      await act(async () =>
        write.resolve(
          response === 'success'
            ? Response.json(task(1, 'a', 'p', 2))
            : Response.json({ code: response }, { status: response === 'forbidden' ? 403 : 409 }),
        ),
      );
    await b.flush();
    assert.doesNotMatch(b.container.textContent, /Saving change…/);
    if (response === 'lost') {
      assert.match(b.container.textContent, /The outcome could not be confirmed/);
      assert.equal(getByRole(b.container, 'button', { name: 'Retry save' }).disabled, false);
      b.server.mutate = () => Response.json(task(1, 'a', 'p', 2));
      await b.click('Retry save');
      assert.equal(b.posts().length, 2);
      assert.equal(b.posts()[1].options.body, first.options.body);
      assert.equal(
        b.posts()[1].options.headers['Idempotency-Key'],
        first.options.headers['Idempotency-Key'],
      );
      assert.match(b.container.textContent, /Change saved/);
    } else if (response === 'success') {
      assert.match(b.container.textContent, /Change saved/);
      assert.equal(b.posts().length, 1);
    } else {
      assert.equal(queryByRole(b.container, 'button', { name: 'Retry save' }) === null, true);
      assert.match(
        b.container.textContent,
        response === 'forbidden' ? /The action is not allowed/ : /A newer version exists/,
      );
      assert.equal(b.posts().length, 1);
    }
  });

test('a fresh read revoking edit permission closes the form; restored permission needs deliberate Return', async (t) => {
  const b = await mount(t);
  await b.click('Project settings');
  await b.input(
    getByRole(b.container, 'textbox', { name: /Project name/ }),
    'Unsent private intent',
  );
  const read = b.server.holdNext(
    (request) =>
      request.options.method !== 'POST' && request.url === '/api/v1/workspaces/a/projects/p',
  );
  await b.event('popstate');
  const current = project('p', 'a', 2);
  current.capabilities.canEdit = false;
  await act(async () => read.resolve(Response.json(current)));
  await b.flush();
  assert.equal(queryByRole(b.container, 'dialog') === null, true);
  assert.doesNotMatch(b.container.textContent, /Unsent private intent/);
  assert.equal(getByRole(b.container, 'button', { name: 'Return to draft' }).disabled, true);
  assert.equal(
    b.document.activeElement.matches('#projects-main, h1[tabindex="-1"]'),
    true,
    'revocation restores focus to a reachable current surface',
  );
  assert.equal(b.document.activeElement.closest('[inert]'), null);
  await b.event('popstate');
  await b.flush();
  assert.equal(
    queryByRole(b.container, 'dialog') === null,
    true,
    'grant restoration cannot automatically remount the old form',
  );
  await b.click('Return to draft');
  assert.equal(
    getByRole(b.container, 'textbox', { name: /Project name/ }).value,
    'Unsent private intent',
  );
  assert.equal(b.posts().length, 0);
});

test('confirmed read403 has only generic confirmation; dismissal focuses main and later reads cannot resurrect it', async (t) => {
  const b = await mount(t);
  await b.click('Project settings');
  b.server.mutate = () =>
    Response.json({ ...project('p', 'a', 2), name: 'Revoked private result' });
  const read = b.server.holdNext(
    (request) =>
      request.options.method !== 'POST' && request.url === '/api/v1/workspaces/a/projects/p',
  );
  await b.click('Save changes', getByRole(b.container, 'dialog'));
  await act(async () => read.resolve(Response.json({ code: 'FORBIDDEN' }, { status: 403 })));
  await b.flush();
  assert.match(b.container.textContent, /Changes saved/);
  assert.doesNotMatch(b.container.textContent, /Revoked private result/);
  await b.click('Dismiss notice');
  assert.equal(b.document.activeElement.id, 'projects-main');
  await b.click('Refresh');
  assert.doesNotMatch(b.container.textContent, /Changes saved|Project updated/);
  assert.equal(b.posts().length, 1);
});

const projectPath = '/api/v1/workspaces/a/projects/p';
const projectsPath = '/api/v1/workspaces/a/projects';
const taskPath = `${projectPath}/tasks/t1`;
const emptyProjects = (allowed) => ({
  items: [],
  total: 0,
  nextCursor: null,
  capabilities: { canCreate: allowed },
});

for (const empty of [false, true])
  test(`authorized project creation resumes in ${empty ? 'empty' : 'ready'} workspace without losing entered fields`, async (t) => {
    const b = await mount(t, empty ? '?workspace=a' : undefined, 'en', (browser) => {
      if (empty) browser.server.responses.set(projectsPath, emptyProjects(true));
    });
    await b.click(empty ? 'Create the first project' : 'Create project');
    await b.input(getByRole(b.container, 'textbox', { name: /Project name/ }), 'New local project');
    await b.input(getByRole(b.container, 'textbox', { name: /Key/ }), 'NEW');
    if (empty) {
      b.server.responses.set(projectsPath, emptyProjects(false));
      await b.event('popstate');
      await b.flush();
      assert.equal(queryByRole(b.container, 'dialog') === null, true);
      b.server.responses.set(projectsPath, emptyProjects(true));
      await b.event('popstate');
      await b.flush();
      assert.equal(
        queryByRole(b.container, 'dialog') === null,
        true,
        'restored create permission must not remount stale fields automatically',
      );
    } else await b.click('Cancel', getByRole(b.container, 'dialog'));
    await b.click('Return to draft');
    assert.equal(
      getByRole(b.container, 'textbox', { name: /Project name/ }).value,
      'New local project',
    );
    assert.equal(getByRole(b.container, 'textbox', { name: /Key/ }).value, 'NEW');
    b.server.mutate = () => {
      b.server.responses.delete(projectsPath);
      return Response.json(
        { ...project(), key: 'NEW', name: 'New local project' },
        { status: 201 },
      );
    };
    await b.click('Create project', getByRole(b.container, 'dialog'));
    assert.equal(b.posts().length, 1);
    assert.equal(JSON.parse(b.posts()[0].options.body).name, 'New local project');
    assert.match(b.container.textContent, /Project created/);
  });

for (const operation of ['project-restore', 'task-archive', 'task-restore'])
  test(`${operation} denial resumes only with current capability and original captured version`, async (t) => {
    const projectOperation = operation === 'project-restore';
    const restore = operation !== 'task-archive';
    const record = projectOperation ? project() : task();
    if (restore) record.archivedAt = '2026-01-01T00:00:00.000Z';
    record.capabilities.canRestore = restore;
    record.capabilities.canArchive = !restore;
    record.capabilities.canEdit = !restore;
    const path = projectOperation ? projectPath : taskPath;
    const label = projectOperation ? 'Restore project' : restore ? 'Restore task' : 'Archive task';
    const b = await mount(
      t,
      projectOperation ? undefined : '?workspace=a&project=p&task=t1',
      'en',
      (browser) => browser.server.responses.set(path, record),
    );
    if (projectOperation) {
      const restoreButton = [...b.container.querySelectorAll('button')].find(
        (button) => button.textContent === label,
      );
      assert.ok(restoreButton);
      await act(async () => restoreButton.click());
      await b.flush();
    } else await b.click(label);
    b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
    await b.click(label, getByRole(b.container, 'dialog'));
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    assert.match(b.container.textContent, /The action is not allowed/);
    record.version = 2;
    const capability = restore ? 'canRestore' : 'canArchive';
    record.capabilities[capability] = false;
    await b.click('Refresh');
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }) === null, true);
    assert.equal(b.posts().length, 1);
    record.capabilities[capability] = true;
    await b.click('Refresh');
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    await b.click('Return to draft');
    assert.equal(queryByRole(b.container, 'dialog') !== null, true);
    b.server.mutate = () => {
      record.version = 3;
      record.archivedAt = restore ? null : '2026-11-06T12:00:00.000Z';
      return Response.json(record);
    };
    await b.click(label, getByRole(b.container, 'dialog'));
    assert.equal(b.posts().length, 2);
    assert.equal(
      JSON.parse(b.posts()[1].options.body).expectedVersion,
      1,
      'fresh read never silently rebases the captured version',
    );
  });

test('current project access capability mounts real administration; revoked and restored capability cannot remount it automatically', async (t) => {
  const record = project();
  record.capabilities.canManageAccess = true;
  const b = await mount(t, undefined, 'en', (browser) => {
    browser.server.responses.set(projectPath, record);
    browser.server.responses.set(`${projectPath}/access`, {
      workspaceId: 'a',
      projectId: 'p',
      projectVersion: 1,
      items: [],
      total: 0,
      nextCursor: null,
    });
  });
  await b.click('Access');
  assert.match(getByRole(b.container, 'dialog').textContent, /Project access/);
  assert.equal(b.reads(`${projectPath}/access`).length > 0, true);
  assert.equal(b.posts().length, 0);
  record.capabilities.canManageAccess = false;
  await b.event('popstate');
  await b.flush();
  assert.equal(queryByRole(b.container, 'dialog') === null, true);
  record.capabilities.canManageAccess = true;
  await b.event('popstate');
  await b.flush();
  assert.equal(queryByRole(b.container, 'dialog') === null, true);
  await b.click('Access');
  assert.equal(queryByRole(b.container, 'dialog') !== null, true);
  await b.click('Close', getByRole(b.container, 'dialog'));
  assert.equal(b.posts().length, 0);
});

const accessPage = (version = 1) => ({
  workspaceId: 'a',
  projectId: 'p',
  projectVersion: version,
  items: [
    {
      principalId: 'person',
      name: 'Private access member',
      kind: 'human',
      active: true,
      role: 'member',
      explicitAccess: 'active',
      implicitAccess: false,
      effectiveAccess: true,
      capabilities: { canGrant: false, canRevoke: false },
    },
  ],
  total: 2,
  nextCursor: 'tail',
});

for (const result of ['success', '503', 'cancel'])
  test(`access Refresh retains one reachable dialog through held read and ${result}`, async (t) => {
    const record = project();
    record.capabilities.canManageAccess = true;
    const b = await mount(t, undefined, 'en', (browser) => {
      browser.server.responses.set(projectPath, record);
      browser.server.responses.set(`${projectPath}/access`, accessPage());
    });
    await b.click('Access');
    const dialog = getByRole(b.container, 'dialog');
    b.server.responses.set(`${projectPath}/access`, accessPage(2));
    await b.click('Load more people', dialog);
    assert.match(dialog.textContent, /The access list changed/);
    const read = b.server.holdNext(projectPath);
    await b.click('Refresh list', dialog);
    assert.equal(queryByRole(b.container, 'dialog'), dialog, 'modal and trap remain mounted');
    assert.match(dialog.textContent, /Checking the session/);
    assert.equal(
      dialog.contains(b.document.activeElement),
      true,
      'held refresh keeps focus in the reachable dialog',
    );
    assert.doesNotMatch(dialog.textContent, /Private access member/);
    assert.equal(queryByRole(dialog, 'radio'), null, 'unverified policy fields are absent');
    assert.equal(getByRole(dialog, 'button', { name: 'Cancel', exact: true }).disabled, false);
    if (result === 'cancel') {
      await act(async () =>
        b.document.dispatchEvent(
          new b.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        ),
      );
      await b.flush();
      assert.equal(queryByRole(b.container, 'dialog') === null, true);
      assert.equal(b.document.body.style.overflow, '');
      assert.equal(b.container.querySelector('main').hasAttribute('inert'), false);
    }
    await act(async () =>
      read.resolve(
        result === '503'
          ? Response.json({ code: 'unavailable' }, { status: 503 })
          : Response.json({ ...record, version: 2 }),
      ),
    );
    await b.flush();
    if (result === '503') {
      assert.equal(queryByRole(b.container, 'dialog'), dialog);
      assert.match(dialog.textContent, /Projects could not be loaded/);
      assert.doesNotMatch(dialog.textContent, /Private access member/);
      await b.click('Load again', dialog);
      assert.equal(queryByRole(b.container, 'dialog'), dialog);
      assert.match(dialog.textContent, /Private access member/);
      assert.equal(dialog.contains(b.document.activeElement), true);
      await b.click('Close', dialog);
    } else if (result === 'success') {
      assert.equal(queryByRole(b.container, 'dialog'), dialog);
      assert.match(dialog.textContent, /Private access member/);
      assert.equal(dialog.contains(b.document.activeElement), true);
      await b.click('Close', dialog);
    } else
      assert.equal(
        queryByRole(b.container, 'dialog') === null,
        true,
        'late read cannot remount a cancelled dialog',
      );
    assert.equal(b.container.querySelector('main').hasAttribute('inert'), false);
    assert.equal(b.document.body.style.overflow, '');
    assert.equal(b.posts().length, 0);
  });

test('an open versioned draft survives read503 in a reachable modal without stale fields or duplicate save', async (t) => {
  const b = await mount(t);
  await b.click('Project settings');
  const dialog = getByRole(b.container, 'dialog');
  await b.input(getByRole(dialog, 'textbox', { name: /Project name/ }), 'Memory only edit');
  const read = b.server.holdNext(projectPath);
  await b.event('popstate');
  await act(async () => read.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
  await b.flush();
  assert.equal(queryByRole(b.container, 'dialog'), dialog);
  assert.equal(queryByRole(dialog, 'textbox'), null);
  assert.doesNotMatch(b.container.textContent, /Memory only edit/);
  assert.equal(b.posts().length, 0);
  b.server.responses.set(projectPath, project('p', 'a', 2));
  await b.click('Load again', dialog);
  assert.equal(getByRole(dialog, 'textbox', { name: /Project name/ }).value, 'Memory only edit');
  b.server.mutate = () => Response.json(project('p', 'a', 3));
  await b.click('Save changes', dialog);
  assert.equal(b.posts().length, 1);
  assert.equal(JSON.parse(b.posts()[0].options.body).expectedVersion, 1);
});

for (const access of ['authorized', 'forbidden', 'revoked', 'gone'])
  test(`denied draft returns across same-workspace targets with fresh ${access} target authority`, async (t) => {
    const b = await mount(t);
    await b.click('Project settings');
    await b.input(
      getByRole(b.container, 'textbox', { name: /Project name/ }),
      'Secret original intent',
    );
    b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
    await b.click('Save changes', getByRole(b.container, 'dialog'));
    const first = b.posts()[0];
    b.server.responses.set('/api/v1/workspaces/a/projects/q', project('q'));
    const page = b.server.taskPage();
    b.server.responses.set('/api/v1/workspaces/a/projects/q/tasks', {
      ...page,
      items: page.items.map((row) => ({ ...row, projectId: 'q' })),
    });
    b.window.history.pushState({}, '', '/projects?workspace=a&project=q');
    await b.event('popstate');
    await b.flush();
    assert.match(b.window.location.search, /project=q/);
    assert.doesNotMatch(b.container.textContent, /Secret original intent/);
    const target = b.server.holdNext(projectPath);
    await b.click('Return to draft');
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    assert.doesNotMatch(b.container.textContent, /Secret original intent/);
    const current = project('p', 'a', 2);
    current.capabilities.canEdit = access !== 'revoked';
    await act(async () =>
      target.resolve(
        access === 'forbidden' || access === 'gone'
          ? Response.json({ code: access }, { status: access === 'gone' ? 404 : 403 })
          : Response.json(current),
      ),
    );
    await b.flush();
    assert.equal(b.posts().length, 1, 'context return never submits');
    if (access !== 'authorized') {
      assert.equal(queryByRole(b.container, 'dialog') === null, true);
      assert.doesNotMatch(b.container.textContent, /Secret original intent/);
      b.server.responses.set(projectPath, project('p', 'a', 3));
      await b.click(access === 'gone' ? 'Load again' : 'Refresh');
      assert.equal(
        queryByRole(b.container, 'dialog') === null,
        true,
        'a failed/revoked return cannot remount later without a new explicit Return',
      );
      await b.click('Return to draft');
    }
    assert.equal(
      getByRole(b.container, 'textbox', { name: /Project name/ }).value,
      'Secret original intent',
    );
    b.server.mutate = () => Response.json(project('p', 'a', 4));
    await b.click('Save changes', getByRole(b.container, 'dialog'));
    assert.equal(b.posts().length, 2);
    assert.equal(JSON.parse(b.posts()[1].options.body).expectedVersion, 1);
    assert.notEqual(
      b.posts()[1].options.headers['Idempotency-Key'],
      first.options.headers['Idempotency-Key'],
    );
  });

function overlayAt(width) {
  return (browser) =>
    browser.replace(browser.window, 'matchMedia', (media) => ({
      media,
      matches: media.includes('79.9375rem')
        ? width < 1280
        : media.includes('63.9375rem')
          ? width < 1024
          : media.includes('47.9375rem')
            ? width < 768
            : false,
      addEventListener() {},
      removeEventListener() {},
    }));
}

for (const width of [390, 768, 1280])
  for (const response of ['success', '503'])
    test(`selected task form focus stays reachable after ${response} recovery at ${width}`, async (t) => {
      const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', overlayAt(width));
      await b.click('Edit');
      const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
      const openingFocus = form.contains(b.document.activeElement);
      const dialogs = [...b.container.querySelectorAll('[role="dialog"]')];
      assert.equal(dialogs.length, width < 1280 ? 2 : 1);
      if (width < 1280) {
        assert.equal(dialogs[0] === form, false, 'task-detail dialog precedes the form');
        assert.equal(dialogs[0].closest('[inert]') !== null, true);
      }
      await b.input(
        getByRole(form, 'textbox', { name: /^Title/ }),
        'Original selected-task intent',
      );
      b.server.version = 2;
      const read = b.server.holdNext(projectPath);
      await b.event('popstate');
      await b.flush();
      assert.equal(
        form.contains(b.document.activeElement),
        true,
        'loading focus belongs to the form modal',
      );
      assert.equal(queryByRole(form, 'textbox') === null, true);
      assert.doesNotMatch(form.textContent, /Original selected-task intent/);
      await act(async () =>
        read.resolve(
          response === '503'
            ? Response.json({ code: 'unavailable' }, { status: 503 })
            : Response.json(project('p', 'a', 2)),
        ),
      );
      await b.flush();
      if (response === '503') {
        assert.equal(form.contains(b.document.activeElement), true);
        assert.equal(queryByRole(form, 'textbox') === null, true);
        await b.click('Load again', form);
      }
      assert.equal(
        getByRole(b.container, 'dialog', { name: 'Edit task', exact: true }) === form,
        true,
      );
      assert.equal(
        form.contains(b.document.activeElement),
        true,
        'ready focus cannot fall behind the form into the inert detail or body',
      );
      assert.equal(b.document.activeElement.closest('[inert],[hidden],[aria-hidden="true"]'), null);
      assert.equal(
        b.document.activeElement === getByRole(form, 'textbox', { name: /^Title/ }),
        true,
        'prefer the current enabled autofocus field',
      );
      assert.equal(openingFocus, true);
      assert.equal(
        getByRole(form, 'textbox', { name: /^Title/ }).value,
        'Original selected-task intent',
      );
      assert.equal(b.posts().length, 0);
      b.server.mutate = () => Response.json(task(1, 'a', 'p', 3));
      await b.click('Save changes', form);
      assert.equal(b.posts().length, 1);
      assert.equal(JSON.parse(b.posts()[0].options.body).expectedVersion, 1);
    });

test('selected task preserves deliberate current focus while the recovery frame is pending', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', overlayAt(768));
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  const read = b.server.holdNext(projectPath);
  await b.event('popstate');
  await act(async () => read.resolve(Response.json(project('p', 'a', 2))));
  const cancel = getByRole(form, 'button', { name: 'Cancel', exact: true });
  cancel.focus();
  await b.flush();
  assert.equal(
    b.document.activeElement === cancel,
    true,
    'a pending fallback cannot steal a deliberate reachable modal target',
  );
  assert.equal(b.posts().length, 0);
});

test('selected task unknown retry keeps its key and uses a reachable modal fallback when fields are disabled', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', overlayAt(768));
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Unknown original intent');
  b.server.mutate = () => Promise.reject(new Error('Lost response'));
  await b.click('Save changes', form);
  const first = b.posts()[0];
  await b.event('popstate');
  await b.flush();
  assert.equal(getByRole(form, 'textbox', { name: /^Title/ }).disabled, true);
  assert.equal(form.contains(b.document.activeElement), true);
  assert.equal(
    b.document.activeElement.closest('[inert],[hidden],[aria-hidden="true"],[disabled]'),
    null,
  );
  assert.equal(b.document.activeElement === getByRole(form, 'textbox', { name: /^Title/ }), false);
  assert.equal(b.posts().length, 1, 'focus recovery cannot resubmit');
  b.server.mutate = () => Response.json(task(1, 'a', 'p', 2));
  await b.click('Retry', form);
  assert.equal(b.posts().length, 2);
  assert.equal(b.posts()[1].options.body, first.options.body);
  assert.equal(
    b.posts()[1].options.headers['Idempotency-Key'],
    first.options.headers['Idempotency-Key'],
  );
});

test('selected task cancellation during a read cannot remount the form and returns focus to the live detail', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', overlayAt(390));
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Retained after cancel');
  const read = b.server.holdNext(projectPath);
  await b.event('popstate');
  await b.flush();
  await act(async () =>
    b.document.dispatchEvent(
      new b.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  await b.flush();
  assert.equal(form.isConnected, false);
  await act(async () => read.resolve(Response.json(project('p', 'a', 2))));
  await b.flush();
  assert.equal(
    queryByRole(b.container, 'dialog', { name: 'Edit task', exact: true }) === null,
    true,
  );
  const detail = getByRole(b.container, 'dialog', { name: 'Task 1', exact: true });
  assert.equal(detail.contains(b.document.activeElement), true);
  assert.equal(b.document.activeElement.closest('[inert]'), null);
  assert.equal(
    b.document.body.style.overflow,
    'hidden',
    'only the underlying live detail lock remains',
  );
  await b.click('Close task detail');
  assert.equal(b.document.body.style.overflow, '');
  assert.equal(b.posts().length, 0);
});

test('selected task navigation guard owns focus before an outstanding form-recovery frame', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', overlayAt(768));
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Stay with original local work');
  const read = b.server.holdNext(projectPath);
  await b.event('popstate');
  await act(async () => read.resolve(Response.json(project('p', 'a', 2))));
  // Browser-level navigation can occur even while the document background is inert.
  // Leave the ready-state recovery frame pending while the real controller raises its guard.
  b.window.history.pushState({}, '', '/projects?workspace=b');
  await b.event('popstate');
  await b.flush();
  const guard = getByRole(b.container, 'dialog', {
    name: 'Switch workspace with pending work',
    exact: true,
  });
  assert.equal(guard.contains(b.document.activeElement), true);
  assert.equal(
    b.document.activeElement ===
      getByRole(guard, 'button', { name: 'Stay in this workspace', exact: true }),
    true,
  );
  assert.equal(b.document.activeElement.closest('[inert],[hidden],[aria-hidden="true"]'), null);
  assert.equal(
    queryByRole(b.container, 'dialog', { name: 'Edit task', exact: true }) === null,
    true,
  );
  assert.match(b.window.location.search, /workspace=a/);
  await b.click('Stay in this workspace', guard);
  const resumed = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  assert.equal(resumed.contains(b.document.activeElement), true);
  assert.equal(
    getByRole(resumed, 'textbox', { name: /^Title/ }).value,
    'Stay with original local work',
  );
  assert.equal(b.posts().length, 0);
});
