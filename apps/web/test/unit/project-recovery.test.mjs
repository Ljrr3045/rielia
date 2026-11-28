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
    if (specifier.endsWith('/projects.module.css') || specifier.endsWith('/sprints.module.css'))
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('/projects.module.css') || url.endsWith('/sprints.module.css'))
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    return next(url, context);
  },
});
const { ProjectsView } = await import('../../src/app/projects/projects-view.tsx');
css.deregister();

// A contractual HTTP400 reaches the real invalid-content feedback; dismissing it
// keeps the task's typed intent and never resubmits a rejected command.
test('R1 task400 feedback dismiss', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  await b.clock.advance(500);
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  const title = getByRole(form, 'textbox', { name: /^Title/ });
  await b.input(title, 'Retained rejected task text');
  b.server.mutate = () => Response.json({ code: 'INVALID_INPUT' }, { status: 400 });
  await b.click('Save changes', form);
  assert.equal(b.posts().length, 1);
  assert.equal(JSON.parse(b.posts()[0].options.body).expectedVersion, 1);
  assert.match(form.textContent, /Review the information/);
  assert.equal(title.value, 'Retained rejected task text');
  await b.click('Dismiss notice', form);
  assert.doesNotMatch(form.textContent, /Review the information/);
  assert.equal(title.value, 'Retained rejected task text');
  assert.equal(b.posts().length, 1);
  await b.clock.advance(500);
  assert.equal(b.posts().length, 1, 'dismissal cannot queue a replacement save');
});

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
  test(`terminal project denial erases private intent; only a new authorized form can save, allowed=${allowed}`, async (t) => {
    const b = await mount(t);
    await b.click('Project settings');
    await b.input(
      getByRole(b.container, 'textbox', { name: /Project name/ }),
      'Secret denied intent',
    );
    b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
    await b.click('Save changes', getByRole(b.container, 'dialog'));
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.doesNotMatch(b.container.textContent, /Secret denied intent/);
    const read = b.server.holdNext(projectPath);
    await b.click('Refresh');
    const current = project('p', 'a', 2);
    current.capabilities.canEdit = allowed;
    b.server.responses.set(projectPath, current);
    await act(async () => read.resolve(Response.json(current)));
    await b.flush();
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }), null);
    assert.equal(queryByRole(b.container, 'button', { name: 'Discard draft' }), null);
    assert.doesNotMatch(b.container.textContent, /Secret denied intent/);
    assert.equal(b.posts().length, 1);
    if (allowed) {
      await b.click('Project settings');
      const dialog = getByRole(b.container, 'dialog');
      assert.equal(getByRole(dialog, 'textbox', { name: /Project name/ }).value, 'Project p');
      await b.input(getByRole(dialog, 'textbox', { name: /Project name/ }), 'New verified intent');
      b.server.mutate = () => Response.json(project('p', 'a', 3));
      await b.click('Save changes', dialog);
      assert.equal(b.posts().length, 2);
      assert.equal(JSON.parse(b.posts()[1].options.body).expectedVersion, 2);
      assert.notEqual(
        b.posts()[1].options.headers['Idempotency-Key'],
        b.posts()[0].options.headers['Idempotency-Key'],
      );
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
  test(`${operation} terminal denial needs a new current authorized intent`, async (t) => {
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
    await b.event('focus');
    await b.clock.advance(500);
    await b.flush();
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }), null);
    assert.equal(queryByRole(b.container, 'dialog') === null, true);
    const action = [...b.container.querySelectorAll('button')].find(
      (button) => button.textContent === label && !button.disabled,
    );
    assert.ok(action);
    await act(async () => action.click());
    await b.flush();
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
      2,
      'a new intent captures the new authorized version after terminal erasure',
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
  test(`a terminally denied draft cannot return across targets even after ${access} reads`, async (t) => {
    const b = await mount(t);
    await b.click('Project settings');
    await b.input(
      getByRole(b.container, 'textbox', { name: /Project name/ }),
      'Secret original intent',
    );
    b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
    await b.click('Save changes', getByRole(b.container, 'dialog'));
    b.server.responses.set('/api/v1/workspaces/a/projects/q', project('q'));
    const page = b.server.taskPage();
    b.server.responses.set('/api/v1/workspaces/a/projects/q/tasks', {
      ...page,
      items: page.items.map((row) => ({ ...row, projectId: 'q' })),
    });
    b.window.history.pushState({}, '', '/projects?workspace=a&project=q');
    await b.event('popstate');
    await b.flush();
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }), null);
    const target = b.server.holdNext(projectPath);
    b.window.history.pushState({}, '', '/projects?workspace=a&project=p');
    await b.event('popstate');
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
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.equal(queryByRole(b.container, 'button', { name: 'Return to draft' }), null);
    assert.doesNotMatch(b.container.textContent, /Secret original intent/);
    assert.equal(b.posts().length, 1);
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

test('current access and assignee HTTP roots expose reachable loading and failure states without authorizing a write', async (t) => {
  let access, assignees;
  const record = project();
  record.capabilities.canManageAccess = true;
  const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', (browser) => {
    browser.server.responses.set(projectPath, record);
    browser.server.responses.set(`${projectPath}/assignees`, {});
  });
  await b.click('Access');
  const panel = getByRole(b.container, 'dialog');
  access = b.server.holdNext(`${projectPath}/access`);
  await b.click('Retry loading', panel);
  assert.match(panel.textContent, /Loading people|Loading project access/);
  await act(async () => access.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
  await b.flush();
  assert.match(panel.textContent, /could not|Could not|unable|Unable/);
  assert.equal(b.posts().length, 0);
  await b.click('Close', panel);
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  assignees = b.server.holdNext(`${projectPath}/assignees`);
  await b.click('Retry loading', form);
  assert.match(form.textContent, /Loading people/);
  await act(async () =>
    assignees.resolve(
      Response.json({ workspaceId: 'a', projectId: 'p', items: [], total: 0, nextCursor: null }),
    ),
  );
  await b.flush();
  assert.doesNotMatch(form.textContent, /Loading people/);
  await b.click('Cancel', form);
  assert.equal(b.posts().length, 0);
});

test('live notices reflect actual offline and guarded invalidation without auto-saving', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  await b.event('offline');
  await b.flush();
  assert.match(b.container.textContent, /offline|Offline/);
  await b.event('online');
  await b.flush();
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Keep this exact unsent text');
  await act(async () =>
    b.server.streams
      .at(-1)
      .emit({ type: 'invalidate', entity: 'task', id: 't1', projectId: 'p', version: 2 }),
  );
  await b.clock.advance(500);
  await b.flush();
  assert.match(b.container.textContent, /finish|Finish|changes|Changes/);
  assert.equal(b.posts().length, 0);
  await b.click('Cancel', form);
  await b.click('Discard draft');
  assert.equal(b.posts().length, 0);
});

function discoveryPageForScreen(
  items = [],
  query = { scope: 'search', q: '', view: 'active', filters: {} },
) {
  return {
    workspaceId: 'a',
    principalId: 'domain-human',
    query,
    revision: 'a'.repeat(64),
    items,
    total: items.length,
    nextCursor: null,
  };
}

test('discovery root retry renders a real loading skeleton and creation follows the refreshed project catalogue', async (t) => {
  let initial;
  const path = '/api/v1/workspaces/a/task-discovery';
  const b = await mount(t, '?workspace=a&taskScope=search', 'en', (browser) => {
    initial = browser.server.holdNext(path);
  });
  await act(async () => initial.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
  await b.flush();
  const retry = b.server.holdNext(path);
  const candidates = [...b.container.querySelectorAll('button')].filter((el) =>
    /Try again|Retry|Reintentar/.test(el.textContent),
  );
  assert.ok(candidates.length);
  await act(async () => candidates[0].click());
  await b.flush();
  assert.ok(b.container.querySelector('[aria-busy="true"][role="status"]'));
  b.server.responses.set(path, discoveryPageForScreen());
  await act(async () => retry.resolve(Response.json(discoveryPageForScreen())));
  await b.flush();
  const catalogue = '/api/v1/workspaces/a/projects';
  b.server.responses.set(catalogue, {
    items: [project('q')],
    total: 1,
    nextCursor: null,
    capabilities: { canCreate: true },
  });
  await b.event('popstate');
  await b.flush();
  const creation = b.container.querySelector('details form select');
  assert.ok(creation);
  assert.equal(creation.value, 'q');
  b.server.responses.set(catalogue, {
    items: [],
    total: 0,
    nextCursor: null,
    capabilities: { canCreate: true },
  });
  await b.event('popstate');
  await b.flush();
  assert.match(b.container.textContent, /No project|no project|Choose a project|create a project/);
  assert.equal(b.posts().length, 0);
});

test('same-session off-target task draft returns explicitly and survives a failed selected read without resubmission', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  await b.click('Edit');
  const dialog = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(dialog, 'textbox', { name: /^Title/ }), 'Captured return decision');
  await b.click('Cancel', dialog);
  b.window.history.pushState({}, '', '/projects?workspace=a&project=p&task=t2');
  await b.event('popstate');
  await b.flush();
  assert.equal(queryByRole(b.container, 'dialog', { name: 'Edit task', exact: true }), null);
  assert.match(b.container.textContent, /Return to draft/);
  await b.click('Return to draft');
  const returned = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  assert.equal(
    getByRole(returned, 'textbox', { name: /^Title/ }).value,
    'Captured return decision',
  );
  assert.equal(b.posts().length, 0);
  await b.click('Cancel', returned);
  const failed = b.server.holdNext(projectPath);
  await b.event('popstate');
  await act(async () => failed.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
  await b.flush();
  const recovery = [...b.container.querySelectorAll('button')].find(
    (el) => el.textContent === 'Load again',
  );
  assert.ok(recovery);
  await act(async () => recovery.click());
  await b.flush();
  assert.equal(b.posts().length, 0);
  assert.match(b.container.textContent, /Return to draft/);
});

for (const missing of [false, true])
  test(`discovery Back revalidates and restores ${missing ? 'heading fallback after row removal' : 'the current row focus'} without a copied page`, async (t) => {
    const path = '/api/v1/workspaces/a/task-discovery';
    const { description, ...row } = task(1);
    assert.equal(typeof description, 'string');
    const item = { ...row, projectName: 'Project p' };
    const b = await mount(t, '?workspace=a&taskScope=search', 'en', (browser) =>
      browser.server.responses.set(path, discoveryPageForScreen([item])),
    );
    const opener = b.container.querySelector('[data-discovery-open]');
    assert.ok(opener);
    await act(async () => opener.click());
    await b.flush();
    assert.match(b.window.location.search, /task=t1/);
    if (missing)
      b.server.responses.set(path, { ...discoveryPageForScreen(), revision: 'b'.repeat(64) });
    await b.click('Back to the search results');
    await b.flush();
    assert.equal(new URL(b.window.location.href).searchParams.get('task'), null);
    assert.equal(
      b.document.activeElement ===
        (missing
          ? getByRole(b.container, 'heading', { name: 'Search tasks', exact: true })
          : b.container.querySelector('[data-discovery-open]')),
      true,
    );
    assert.equal(b.posts().length, 0);
  });

test('rendered move recovery preserves original order/key and a changed destination needs deliberate discard', async (t) => {
  const b = await mount(t);
  b.server.mutate = () => {
    throw new Error('Lost move response');
  };
  const menu = b.container.querySelector('summary[aria-label^="Move QA-2"]')?.closest('details');
  assert.ok(menu);
  await act(async () => {
    menu.open = true;
  });
  await b.click('Before QA-1 · Task 1', menu);
  assert.equal(b.posts().length, 1);
  const original = b.posts()[0];
  assert.equal(JSON.parse(original.options.body).beforeTaskId, 't1');
  assert.match(b.container.textContent, /The move could not be confirmed/i);
  b.server.mutate = () => Response.json({ ...task(2), version: 2 });
  await b.click('Retry');
  assert.equal(b.posts().length, 2);
  assert.equal(b.posts()[1].options.body, original.options.body);
  assert.equal(
    b.posts()[1].options.headers['Idempotency-Key'],
    original.options.headers['Idempotency-Key'],
  );
  const control = getByRole(b.container, 'combobox', { name: 'Move QA-1 to status' });
  b.server.mutate = () =>
    Response.json(
      { code: 'version-conflict', current: { ...task(1), status: 'todo', version: 3 } },
      { status: 409 },
    );
  await act(async () => {
    control.value = 'todo';
    control.dispatchEvent(new b.window.Event('change', { bubbles: true }));
  });
  await b.flush();
  assert.equal(b.posts().length, 3);
  assert.match(b.container.textContent, /destination|Destination/);
  await b.click('Discard move');
  assert.equal(b.posts().length, 3);
  assert.equal(queryByRole(b.container, 'button', { name: 'Discard move' }), null);
});

test('rendered policy unknown retry keeps its exact target then a new visibility review uses current version', async (t) => {
  const record = project();
  record.capabilities = {
    ...record.capabilities,
    canManageAccess: true,
    canChangeVisibility: true,
    canGrantAccess: true,
    canRevokeAccess: true,
  };
  const access = {
    ...accessPage(),
    total: 1,
    nextCursor: null,
    items: [
      {
        ...accessPage().items[0],
        explicitAccess: null,
        effectiveAccess: false,
        capabilities: { canGrant: true, canRevoke: false },
      },
    ],
  };
  const b = await mount(t, undefined, 'en', (browser) => {
    browser.server.responses.set(projectPath, record);
    browser.server.responses.set(`${projectPath}/access`, access);
  });
  await b.click('Access');
  let panel = getByRole(b.container, 'dialog');
  await b.click('Grant access to Private access member', panel);
  b.server.mutate = () => {
    throw new Error('Unknown access result');
  };
  await b.click('Grant access', panel);
  assert.equal(b.posts().length, 1);
  const original = b.posts()[0];
  assert.match(original.url, /access\/person$/);
  assert.equal(JSON.parse(original.options.body).expectedVersion, 1);
  await b.click('Close', panel);
  b.server.responses.set('/api/v1/workspaces/a/projects/q', project('q'));
  const qpage = b.server.taskPage('a');
  b.server.responses.set('/api/v1/workspaces/a/projects/q/tasks', {
    ...qpage,
    items: qpage.items.map((row) => ({ ...row, projectId: 'q' })),
  });
  b.window.history.pushState({}, '', '/projects?workspace=a&project=q');
  await b.event('popstate');
  await b.flush();
  await b.click('Return to the pending change');
  panel = getByRole(b.container, 'dialog');
  b.server.mutate = () => {
    record.version = 2;
    access.projectVersion = 2;
    b.server.responses.set(projectPath, record);
    b.server.responses.set(`${projectPath}/access`, access);
    return Response.json(record);
  };
  await b.click('Retry', panel);
  assert.equal(b.posts().length, 2);
  assert.equal(b.posts()[1].options.body, original.options.body);
  assert.equal(
    b.posts()[1].options.headers['Idempotency-Key'],
    original.options.headers['Idempotency-Key'],
  );
  await act(async () => getByRole(panel, 'radio', { name: /Private/ }).click());
  const review = [...panel.querySelectorAll('button')].find((el) =>
    /Review visibility|Review change/.test(el.textContent),
  );
  assert.ok(review);
  await act(async () => review.click());
  await b.flush();
  assert.equal(b.posts().length, 2);
  await b.click('Cancel', panel);
  assert.equal(b.posts().length, 2);
});

test('collaboration return banner keeps an unsent comment reachable in its exact task and supports deliberate discard', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  const editor = getByRole(b.container, 'textbox', { name: 'Write a comment…' });
  await act(async () => {
    editor.focus();
    Object.getOwnPropertyDescriptor(b.window.HTMLTextAreaElement.prototype, 'value').set.call(
      editor,
      'Captured comment body',
    );
    editor.dispatchEvent(new b.window.KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  });
  b.window.history.pushState({}, '', '/projects?workspace=a&project=p');
  await b.event('popstate');
  await b.flush();
  assert.match(b.container.textContent, /Return to|Unsent|unsent/);
  const back = [...b.container.querySelectorAll('button')].find((el) =>
    /Return to draft|Return to.*change|Return to.*task/.test(el.textContent),
  );
  assert.ok(back);
  await act(async () => back.click());
  await b.flush();
  assert.match(b.window.location.search, /task=t1/);
  assert.equal(
    getByRole(b.container, 'textbox', { name: 'Write a comment…' }).value,
    'Captured comment body',
  );
  b.window.history.pushState({}, '', '/projects?workspace=a&project=p');
  await b.event('popstate');
  await b.flush();
  const discard = [...b.container.querySelectorAll('button')].find((el) =>
    /Discard.*change|Discard.*draft/.test(el.textContent),
  );
  assert.ok(discard);
  await act(async () => discard.click());
  await b.flush();
  assert.equal(b.posts().length, 0);
});

test('an explicitly rejected comment remains editable under current authority and discard clears it without replay', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  const editor = getByRole(b.container, 'textbox', { name: 'Write a comment…' });
  await act(async () => {
    editor.focus();
    Object.getOwnPropertyDescriptor(b.window.HTMLTextAreaElement.prototype, 'value').set.call(
      editor,
      'Review this rejected comment',
    );
    editor.dispatchEvent(new b.window.KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  });
  b.server.mutate = () => Response.json({ code: 'INVALID_INPUT' }, { status: 400 });
  await b.click('Comment');
  assert.equal(b.posts().length, 1);
  assert.match(b.container.textContent, /Review the|review the|invalid|Invalid/);
  const section = editor.closest('section');
  const cancel = [...section.querySelectorAll('button')].find((el) =>
    /Discard draft|Cancel/.test(el.textContent),
  );
  assert.ok(cancel);
  await act(async () => cancel.click());
  await b.flush();
  assert.equal(b.posts().length, 1);
  assert.equal(editor.value, '');
});

test('compact project actions return focus and discovery quick capture waits for the actual selected project', async (t) => {
  const b = await mount(t, undefined, 'en', overlayAt(390));
  const summary = b.container.querySelector('summary[aria-label]');
  assert.ok(summary);
  await act(async () => summary.click());
  await b.click('Project settings');
  assert.equal(summary.closest('details').open, false);
  await b.click('Cancel', getByRole(b.container, 'dialog'));
  assert.equal(b.posts().length, 0);
});

test('a discovered project selection moves focus into current quick capture without copying discovery DTOs', async (t) => {
  const path = '/api/v1/workspaces/a/task-discovery';
  const b = await mount(t, '?workspace=a&taskScope=search', 'en', (browser) =>
    browser.server.responses.set(path, discoveryPageForScreen()),
  );
  const selector = getByRole(b.container, 'combobox', {
    name: 'Project for the new task',
    hidden: true,
  });
  await act(async () => {
    selector.closest('details').open = true;
  });
  await b.click('Open quick capture');
  await b.flush();
  assert.equal(new URL(b.window.location.href).searchParams.get('project'), 'p');
  assert.equal(
    b.document.activeElement === getByRole(b.container, 'textbox', { name: 'New task title' }),
    true,
  );
  assert.equal(b.posts().length, 0);
});

function r1Board(b, total) {
  b.server.taskPage = (workspaceId = 'a', cursor = false) => {
    const status =
      new URL(b.requests.at(-1).url, b.window.location.origin).searchParams.get('status') ??
      'backlog';
    if (status === b.server.failedBoardStatus)
      throw new Error('Finite native board-column failure');
    const count = status === 'backlog' ? total : 0;
    const offset = cursor ? 100 : 0;
    return {
      items: Array.from({ length: Math.max(0, Math.min(100, count - offset)) }, (_, i) => ({
        ...task(offset + i + 1, workspaceId),
        title: `Board task ${offset + i + 1}`,
        status,
      })),
      total,
      nextCursor: offset + 100 < count ? 'board-tail' : null,
      capabilities: { canCreate: true },
      orderVersion: 1,
      columnCounts: { backlog: total, todo: 0, in_progress: 0, done: 0, canceled: 0 },
      selectedAssignee: null,
    };
  };
}

for (const count of [1, 102])
  // Original case description: R1 W3 rendered board Retry makes a root GET after a retained 1-row root failure
  // Original case description: R1 W3 rendered board Retry makes a root GET after a retained 102-row root failure
  test(`R1 W3 board root ${count}`, async (t) => {
    const b = await mount(t, '?workspace=a&project=p&taskLayout=board', 'en', (browser) =>
      r1Board(browser, count),
    );
    await b.clock.advance(500);
    const column = () => getByRole(b.container, 'region', { name: /^Backlog/ });
    if (count > 100) await b.click('Load more in this column', column());
    assert.ok(getByRole(column(), 'link', { name: `Board task ${count}`, exact: true }));
    const match = (request) => {
      const url = new URL(request.url, b.window.location.origin);
      return (
        url.pathname === `${projectPath}/tasks` && url.searchParams.get('status') === 'backlog'
      );
    };
    const failed = b.server.holdNext(match);
    await act(async () =>
      b.server.streams
        .at(-1)
        .emit({ type: 'invalidate', entity: 'task', projectId: 'p', id: 't1', version: 2 }),
    );
    assert.ok(failed.request);
    await act(async () => failed.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
    await b.flush();
    assert.ok(
      getByRole(column(), 'link', { name: `Board task ${count}`, exact: true }),
      'last-good tail is retained as stale',
    );
    const retry = b.server.holdNext(match);
    await b.click('Retry', column());
    assert.ok(retry.request, 'visible Retry must start an actual HTTP root request');
    assert.equal(
      new URL(retry.request.url, b.window.location.origin).searchParams.has('cursor'),
      false,
    );
    await act(async () => retry.resolve(Response.json(b.server.taskPage('a', false))));
    await b.flush();
    assert.equal(queryByRole(column(), 'button', { name: 'Retry', exact: true }), null);
    if (count > 100) {
      assert.equal(
        queryByRole(column(), 'link', { name: `Board task ${count}`, exact: true }),
        null,
        'new root drops the obsolete admitted tail',
      );
      const append = b.server.holdNext(match);
      await b.click('Load more in this column', column());
      assert.equal(
        new URL(append.request.url, b.window.location.origin).searchParams.get('cursor'),
        'board-tail',
      );
      await act(async () =>
        append.resolve(Response.json({ code: 'unavailable' }, { status: 503 })),
      );
      const retryAppend = b.server.holdNext(match);
      await b.click('Retry', column());
      assert.ok(retryAppend.request);
      assert.equal(
        new URL(retryAppend.request.url, b.window.location.origin).searchParams.get('cursor'),
        'board-tail',
        'eligible failed append keeps its actual continuation identity',
      );
      await act(async () => retryAppend.resolve(Response.json(b.server.taskPage('a', true))));
      await b.flush();
      assert.ok(getByRole(column(), 'link', { name: `Board task ${count}`, exact: true }));
    }
    assert.equal(b.posts().length, 0);
  });

// Original case description: R1 W4 rendered task Save stays disabled while held authority is stale without losing typed intent
test('R1 W4 stale Save', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&task=t1');
  await b.clock.advance(500);
  await b.click('Edit');
  const form = getByRole(b.container, 'dialog', { name: 'Edit task', exact: true });
  await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Preserved stale task form');
  const held = b.server.holdNext(taskPath);
  await act(async () =>
    b.server.streams
      .at(-1)
      .emit({ type: 'invalidate', entity: 'task', projectId: 'p', id: 't1', version: 2 }),
  );
  assert.ok(held.request);
  assert.equal(getByRole(b.container, 'dialog', { name: 'Edit task', exact: true }), form);
  assert.equal(getByRole(form, 'textbox', { name: /^Title/ }).value, 'Preserved stale task form');
  assert.equal(
    getByRole(form, 'button', { name: 'Save changes', exact: true }).disabled,
    true,
    'stale capability must not enable Save',
  );
  await b.click('Save changes', form);
  assert.equal(b.posts().length, 0);
  await act(async () => held.resolve(Response.json(task(1))));
  await b.flush();
  assert.equal(getByRole(form, 'textbox', { name: /^Title/ }).value, 'Preserved stale task form');
  assert.equal(getByRole(form, 'button', { name: 'Save changes', exact: true }).disabled, false);
  await b.click('Save changes', form);
  assert.equal(b.posts().length, 1);
  assert.equal(JSON.parse(b.posts()[0].options.body).title, 'Preserved stale task form');
});

// Original case description: R1 W2 rendered move readiness follows the whole board and recovers after the unrelated failed column
test('R1 W2 partial board UI', async (t) => {
  const b = await mount(t, '?workspace=a&project=p&taskLayout=board', 'en', (browser) => {
    browser.server.failedBoardStatus = 'canceled';
    r1Board(browser, 1);
  });
  await b.clock.advance(500);
  const move = () =>
    getByRole(b.container, 'combobox', { name: 'Move QA-1 to status', exact: true });
  assert.equal(move().disabled, true);
  assert.equal(b.posts().length, 0);
  b.server.failedBoardStatus = null;
  await b.click('Retry', getByRole(b.container, 'region', { name: /^Canceled/ }));
  assert.equal(move().disabled, false, 'a fully recovered board restores the real move control');
  assert.equal(b.posts().length, 0, 'read recovery never performs a move');
});

for (const operation of ['edit', 'archive', 'restore'])
  for (const result of ['503', 'capability-loss'])
    // Original case description: R1 W4 rendered edit retains its modal through held authority and 503
    // Original case description: R1 W4 rendered edit retains its modal through held authority and capability-loss
    // Original case description: R1 W4 rendered archive retains its modal through held authority and 503
    // Original case description: R1 W4 rendered archive retains its modal through held authority and capability-loss
    // Original case description: R1 W4 rendered restore retains its modal through held authority and 503
    // Original case description: R1 W4 rendered restore retains its modal through held authority and capability-loss
    test(`R1 W4 ${operation} UI ${result === 'capability-loss' ? 'cap-loss' : result}`, async (t) => {
      const record = task(1);
      if (operation === 'restore') {
        record.archivedAt = '2026-01-01T00:00:00.000Z';
        record.capabilities.canRestore = true;
        record.capabilities.canArchive = false;
        record.capabilities.canEdit = false;
      }
      const b = await mount(t, '?workspace=a&project=p&task=t1', 'en', (browser) =>
        browser.server.responses.set(taskPath, record),
      );
      await b.clock.advance(500);
      await b.click(
        operation === 'edit' ? 'Edit' : operation === 'archive' ? 'Archive task' : 'Restore task',
      );
      const form = getByRole(b.container, 'dialog', {
        name:
          operation === 'edit'
            ? 'Edit task'
            : operation === 'archive'
              ? 'Archive task'
              : 'Restore task',
        exact: true,
      });
      const action =
        operation === 'edit'
          ? 'Save changes'
          : operation === 'archive'
            ? 'Archive task'
            : 'Restore task';
      if (operation === 'edit')
        await b.input(getByRole(form, 'textbox', { name: /^Title/ }), 'Held form text survives');
      const held = b.server.holdNext(taskPath);
      await act(async () =>
        b.server.streams
          .at(-1)
          .emit({ type: 'invalidate', entity: 'task', projectId: 'p', id: 't1', version: 2 }),
      );
      assert.ok(held.request);
      assert.equal(getByRole(b.container, 'dialog'), form);
      assert.equal(getByRole(form, 'button', { name: action, exact: true }).disabled, true);
      await b.click(action, form);
      assert.equal(b.posts().length, 0);
      if (result === 'capability-loss') {
        const denied = globalThis.structuredClone(record);
        denied.capabilities[
          operation === 'edit' ? 'canEdit' : operation === 'archive' ? 'canArchive' : 'canRestore'
        ] = false;
        await act(async () => held.resolve(Response.json(denied)));
        await b.flush();
        assert.equal(
          queryByRole(b.container, 'dialog'),
          null,
          'fresh capability loss retires the form rather than retaining write permission',
        );
        assert.equal(b.posts().length, 0);
        return;
      }
      await act(async () => held.resolve(Response.json({ code: 'unavailable' }, { status: 503 })));
      await b.flush();
      assert.equal(getByRole(b.container, 'dialog'), form);
      const unavailable = queryByRole(form, 'button', { name: action, exact: true });
      assert.ok(
        unavailable === null || unavailable.disabled,
        'failure exposes no enabled commit action',
      );
      assert.equal(b.posts().length, 0);
      await b.click('Load again', form);
      await b.flush();
      assert.equal(getByRole(b.container, 'dialog'), form);
      assert.equal(getByRole(form, 'button', { name: action, exact: true }).disabled, false);
      if (operation === 'edit')
        assert.equal(
          getByRole(form, 'textbox', { name: /^Title/ }).value,
          'Held form text survives',
        );
      b.server.mutate = () =>
        Response.json({
          ...record,
          version: 2,
          archivedAt: operation === 'archive' ? '2026-11-06T12:00:00.000Z' : null,
        });
      await b.click(action, form);
      assert.equal(b.posts().length, 1);
      assert.equal(
        JSON.parse(b.posts()[0].options.body).expectedVersion,
        1,
        'the captured version is preserved through authority recovery',
      );
    });
