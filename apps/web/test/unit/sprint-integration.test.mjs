import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { act, getByRole, queryByRole, identitySession, fixedNow } from './dom-harness.mjs';
import { sprintIntegrationBrowser } from './sprint-integration-harness.mjs';
import { plannedSprint, deferred, closeResult, preview } from './sprint-client-fixtures.mjs';
import { createDraft } from './project-hook-harness.mjs';

const styles = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/link') return next('next/link.js', context);
    if (specifier.endsWith('.module.css'))
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.module.css'))
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    return next(url, context);
  },
});
const { ProjectsView } = await import('../../src/app/projects/projects-view.tsx');
styles.deregister();
const posts = (b) => b.sprintServer.requests.filter((r) => r.init.method === 'POST');
const dialog = (b) => getByRole(b.container, 'dialog');
async function openScreen(t, options) {
  const b = await sprintIntegrationBrowser(t, options);
  await b.screen(ProjectsView);
  return b;
}

test(
  'production sprint entry uses one identity/SSE owner, canonical scope/settings and real view hrefs',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    assert.ok(getByRole(b.container, 'heading', { name: 'Sprints' }));
    assert.ok(getByRole(b.container, 'heading', { name: 'Goal' }));
    assert.match(b.container.textContent, /UTC|End date \(exclusive\)|Human/);
    const identityReads = b.reads('/api/v1/identity/session').length;
    assert.ok(identityReads >= 1);
    assert.equal(b.server.streams.filter((s) => !s.request.options.signal.aborted).length, 1);
    const link = getByRole(b.container, 'link', { name: 'Tasks', exact: true });
    assert.equal(new URL(link.href).searchParams.has('projectView'), false);
    const modified = new b.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    link.dispatchEvent(modified);
    assert.equal(modified.defaultPrevented, false);
    assert.equal(posts(b).length, 0);
    assert.equal(
      b.reads('/api/v1/identity/session').length,
      identityReads,
      'view rendering/modified link starts no independent identity read',
    );
  },
);

test(
  'planned metadata fields validate/focus without save and explicitly submit captured local dates',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, {
      configure(_b, s) {
        s.sprint = { ...plannedSprint('s'), workspaceId: 'a' };
        s.scope.sprintVersion = 1;
      },
    });
    await b.click('Edit sprint');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Name', exact: true }), ' ');
    await b.click('Save changes', dialog(b));
    assert.equal(posts(b).length, 0);
    assert.equal(b.document.activeElement.getAttribute('aria-invalid'), 'true');
    await b.input(
      getByRole(dialog(b), 'textbox', { name: 'Name', exact: true }),
      ' Human revision ',
    );
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Goal', exact: true }), 'Ship safely');
    b.sprintServer.post = ({ init }) => {
      const input = JSON.parse(init.body);
      assert.equal(input.expectedVersion, 1);
      assert.equal(input.name, 'Human revision');
      assert.equal(input.goal, 'Ship safely');
      assert.equal(input.endDateExclusive, '2026-12-03');
      b.sprintServer.sprint = { ...b.sprintServer.sprint, ...input, version: 2 };
      return Response.json(b.sprintServer.sprint);
    };
    await b.click('Save changes', dialog(b));
    await b.clock.advance(500);
    await b.flush();
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.match(b.container.textContent, /Change confirmed by the server/);
    assert.match(b.container.textContent, /Human revision/);
    assert.equal(posts(b).length, 1);
  },
);

test(
  'start review captures complete scope, blocks stale confirm and never starts on selection or rebase',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, {
      configure(_b, s) {
        s.sprint = { ...plannedSprint('s'), workspaceId: 'a' };
        s.scope.sprintVersion = 1;
        s.scope.currentTotals.pending = 103;
      },
    });
    await b.click('Review start');
    assert.match(dialog(b).textContent, /103/);
    assert.equal(posts(b).length, 0);
    b.sprintServer.sprint.version = 2;
    b.sprintServer.scope.sprintVersion = 2;
    b.sprintServer.scope.taskRevision = 7;
    await act(async () => b.server.streams.at(-1).emit({ type: 'reset' }));
    await b.clock.advance(500);
    await b.flush();
    assert.equal(getByRole(dialog(b), 'button', { name: 'Confirm start' }).disabled, true);
    await b.click('Review again before saving', dialog(b));
    assert.equal(posts(b).length, 0);
    b.sprintServer.post = ({ init }) => {
      assert.deepEqual(JSON.parse(init.body), {
        expectedVersion: 2,
        expectedProjectVersion: b.sprintServer.planning.projectVersion,
        expectedTaskRevision: 7,
      });
      b.sprintServer.sprint = {
        ...b.sprintServer.sprint,
        state: 'active',
        version: 3,
        startedAt: '2026-11-20T00:00:00.000Z',
        capabilities: { canEdit: true, canStart: false, canClose: true, canChangeScope: true },
      };
      b.sprintServer.scope.sprintVersion = 3;
      return Response.json({
        operation: {
          activityId: 'a',
          type: 'start-sprint',
          sprintId: 's',
          enteredVisitId: null,
          exitedVisitId: null,
        },
        current: b.sprintServer.sprint,
      });
    };
    await b.click('Confirm start', dialog(b));
    await b.clock.advance(500);
    assert.equal(posts(b).length, 1);
    assert.equal(queryByRole(b.container, 'dialog'), null);
  },
);

test(
  'close confirmation uses the reviewed destination even after the raw select changes',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    await b.click('Review closure');
    await b.select('Pending work destination', 'backlog', dialog(b));
    assert.equal(
      b.sprintServer.requests.some((r) => r.path.endsWith('close-preview')),
      false,
    );
    await b.click('Get preview', dialog(b));
    assert.match(dialog(b).textContent, /Complete server totals/);
    await b.select('Pending work destination', 'target', dialog(b));
    assert.equal(b.sprintServer.requests.filter((r) => r.path.endsWith('close-preview')).length, 1);
    assert.equal(dialog(b).querySelector('select').value, 'target');
    b.sprintServer.post = ({ init }) => {
      const input = JSON.parse(init.body);
      assert.equal(input.destination, 'backlog');
      assert.equal(input.previewHash, 'a'.repeat(64));
      const result = closeResult({ ...preview('backlog'), workspaceId: 'a' });
      result.current.workspaceId = 'a';
      result.closure.workspaceId = 'a';
      b.sprintServer.sprint = result.current;
      b.sprintServer.closure = result.closure;
      return Response.json(result);
    };
    await b.click('Confirm closure', dialog(b));
    await b.clock.advance(500);
    assert.equal(posts(b).length, 1);
    assert.ok(getByRole(b.container, 'heading', { name: 'Results at closure' }));
    assert.equal(queryByRole(b.container, 'button', { name: 'Review closure' }), null);
  },
);

for (const raw of ['', '0', '13'])
  test(
    `Task detail has explicit independent estimate lifetime and submits raw '${raw}' distinctly`,
    { timeout: 10000 },
    async (t) => {
      const b = await openScreen(t, {
        search: '?workspace=a&project=p&task=t1',
        configure(_b, s) {
          s.task.snapshot.estimatePoints = 13;
        },
      });
      const section = getByRole(b.container, 'heading', {
        name: 'Task planning',
        exact: true,
      }).closest('section');
      assert.equal(section.querySelectorAll('form').length, 0);
      await b.click('Edit estimate', section);
      assert.equal(section.querySelectorAll('form').length, 1);
      assert.equal(queryByRole(section, 'button', { name: 'Change participation' }), null);
      assert.equal(b.document.activeElement.tagName, 'SELECT');
      await b.select('Estimate', raw, section);
      assert.equal(posts(b).length, 0);
      b.sprintServer.post = ({ init }) => {
        const input = JSON.parse(init.body);
        assert.deepEqual(input, {
          expectedVersion: 3,
          estimatePoints: raw === '' ? null : Number(raw),
        });
        b.sprintServer.task.snapshot = {
          ...b.sprintServer.task.snapshot,
          estimatePoints: input.estimatePoints,
          version: 4,
        };
        return Response.json(b.sprintServer.task);
      };
      await b.click('Save estimate', section);
      await b.clock.advance(500);
      assert.equal(posts(b).length, 1);
    },
  );

test(
  'read-only canonical Task planning/history has no edit button, mutation form or preview call',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, {
      search: '?workspace=a&project=p&task=t1',
      configure(_b, s) {
        s.task.capabilities = { canEstimate: false, canChangeScope: false };
      },
    });
    const section = getByRole(b.container, 'heading', {
      name: 'Task planning',
      exact: true,
    }).closest('section');
    assert.equal(section.querySelectorAll('form').length, 0);
    assert.equal(queryByRole(section, 'button', { name: 'Edit estimate' }), null);
    assert.equal(queryByRole(section, 'button', { name: 'Change participation' }), null);
    assert.match(section.textContent, /Planning history|Task planning history/);
    assert.equal(posts(b).length, 0);
    assert.equal(
      b.sprintServer.requests.some((r) => r.path.endsWith('close-preview')),
      false,
    );
  },
);

test(
  'sprint401 fences former project/task/sprint DOM until explicit parent verification',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    await b.click('Edit sprint');
    await b.input(
      getByRole(dialog(b), 'textbox', { name: 'Goal', exact: true }),
      'Private unsaved goal',
    );
    const verifiedReads = b.reads('/api/v1/identity/session').length;
    b.sprintServer.post = () => Response.json({ code: 'signed-out' }, { status: 401 });
    await b.click('Save changes', dialog(b));
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.doesNotMatch(b.container.textContent, /Private unsaved goal|Project p|Sprint time zone/);
    assert.equal(b.reads('/api/v1/identity/session').length, verifiedReads);
    await b.click('Verify session');
    await b.clock.advance(500);
    assert.ok(b.reads('/api/v1/identity/session').length > verifiedReads);
    assert.match(b.container.textContent, /Project p/);
    assert.doesNotMatch(b.container.textContent, /Private unsaved goal/);
  },
);

test(
  'composed unknown recovery protects Back/latest intent and retries the original body/key before navigation',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t);
    const h = await b.owners();
    await act(async () => h.state.begin('edit-sprint'));
    await act(async () => h.state.changeField('goal', 'Captured goal'));
    b.sprintServer.post = () => {
      throw new Error('Lost response');
    };
    await act(async () => h.state.submitForm());
    const recovery = h.state.sprints.recovery;
    assert.equal(h.state.sprints.mutation.status, 'unknown');
    await act(async () => h.state.parent.selectTask('t1'));
    await act(async () => h.state.selectSprint('target'));
    assert.equal(h.state.parent.selection.taskId, null);
    assert.equal(h.state.parent.sprintLocation.sprintId, 's');
    assert.match(h.state.parent.integratedNavigation.url, /sprint=target/);
    assert.equal(h.state.sprints.recovery, recovery);
    b.sprintServer.post = () => Response.json(b.sprintServer.sprint);
    await act(async () => h.state.sprints.retrySave());
    await b.clock.advance(500);
    assert.equal(posts(b).length, 2);
    assert.equal(posts(b)[1].init.body, posts(b)[0].init.body);
    assert.equal(
      posts(b)[1].init.headers['Idempotency-Key'],
      posts(b)[0].init.headers['Idempotency-Key'],
    );
    assert.equal(h.state.parent.sprintLocation.sprintId, 'target');
    assert.equal(h.state.parent.integratedNavigation, null);
  },
);

test(
  'both owners retain drafts across guarded view navigation; Stay preserves and discard is explicit',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t, { search: '?workspace=a&project=p' });
    const h = await b.owners();
    await act(async () => h.state.parent.stage(createDraft()));
    await act(async () => h.state.selectView('sprints'));
    assert.equal(h.state.parent.sprintLocation.view, 'tasks');
    assert.equal(h.state.parent.draft.fields.title, 'Retained intent');
    await act(async () => h.state.parent.resolveIntegratedNavigation('stay'));
    assert.equal(h.state.parent.draft.fields.title, 'Retained intent');
    await act(async () => h.state.selectView('sprints'));
    await act(async () => h.state.parent.resolveIntegratedNavigation('discard'));
    assert.equal(h.state.parent.sprintLocation.view, 'sprints');
    assert.equal(h.state.parent.draft, null);
    await act(async () => h.state.selectSprint('s'));
    await act(async () => h.state.begin('edit-sprint'));
    await act(async () => h.state.parent.stage(createDraft()));
    assert.equal(
      h.state.parent.draft,
      null,
      'task owner cannot replace the sprint editing lifetime',
    );
    assert.ok(h.state.sprints.draft);
    assert.equal(posts(b).length + b.posts().length, 0);
  },
);

test(
  'pending cannot be discarded and latest requested navigation releases only after confirmed success',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t);
    const h = await b.owners();
    const held = deferred();
    b.sprintServer.post = () => held.promise;
    await act(async () => h.state.begin('edit-sprint'));
    let saving;
    await act(async () => {
      saving = h.state.submitForm();
    });
    await act(async () => h.state.parent.selectTask('t1'));
    await act(async () => h.state.parent.resolveIntegratedNavigation('discard'));
    assert.equal(h.state.sprints.mutation.status, 'pending');
    assert.ok(h.state.editing);
    assert.equal(h.state.parent.selection.taskId, null);
    await act(async () => {
      held.resolve(Response.json(b.sprintServer.sprint));
      await saving;
    });
    await b.clock.advance(500);
    assert.equal(h.state.parent.selection.taskId, 't1');
    assert.equal(posts(b).length, 1);
  },
);

test(
  'temporary verification masks raw fields and private parent projections; replacement cannot restore them',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t);
    const h = await b.owners();
    await act(async () => h.state.begin('edit-sprint'));
    await act(async () => h.state.changeField('goal', 'Private local field'));
    const hold = b.server.holdNext('/api/v1/identity/session');
    let checking;
    await act(async () => {
      checking = h.state.parent.refresh();
    });
    assert.equal(h.state.editing, null);
    assert.equal(h.state.model.resources, null);
    assert.equal(h.state.parent.project, null);
    await act(async () => {
      hold.resolve(Response.json(b.server.session));
      await checking;
    });
    assert.equal(h.state.editing.form.fields.goal, 'Private local field');
    b.server.session = identitySession('replacement');
    await act(async () => h.state.parent.refresh());
    assert.equal(h.state.editing, null);
    assert.equal(h.state.sprints.draft, null);
  },
);

test(
  'a pending task write protects every composed navigation intent and unknown retry releases only the latest one',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t, { search: '?workspace=a&project=p' });
    const h = await b.owners();
    await act(async () => h.state.parent.stage(createDraft()));
    const held = b.server.holdNext((request) => request.options.method === 'POST');
    let saving;
    await act(async () => {
      saving = h.state.parent.submit();
    });
    const originalURL = h.state.parent.url;
    for (const request of [
      () => h.state.parent.setTaskScope('mine'),
      () => h.state.parent.setSearchQuery('retained search'),
      () => h.state.parent.setDiscoveryProject('p'),
      () => h.state.parent.setTaskLayout('board'),
      () => h.state.parent.setTaskFilters({ status: 'todo' }),
      () => h.state.parent.setTaskColumn('done'),
    ]) {
      await act(async () => request());
      assert.equal(h.state.parent.url, originalURL);
      assert.equal(h.state.parent.mutationPending, 'create-task');
      assert.equal(b.posts().length, 1);
      assert.ok(h.state.parent.integratedNavigation);
    }
    assert.match(h.state.parent.integratedNavigation.url, /column=done/);
    await act(async () => h.state.parent.resolveIntegratedNavigation('discard'));
    assert.equal(h.state.parent.mutationPending, 'create-task');
    await act(async () => {
      held.reject(new Error('Lost task write response'));
      await saving;
    });
    assert.ok(h.state.parent.retryTarget);
    assert.equal(h.state.parent.url, originalURL);
    await act(async () => h.state.parent.retrySave());
    await b.clock.advance(500);
    assert.equal(h.state.parent.taskView.column, 'done');
    assert.equal(h.state.parent.taskScope, 'project');
    assert.equal(h.state.parent.integratedNavigation, null);
    assert.equal(h.state.parent.retryTarget, null);
    const [first, retry] = b.posts();
    assert.equal(b.posts().length, 2);
    assert.equal(retry.options.body, first.options.body);
    assert.equal(
      new globalThis.Headers(retry.options.headers).get('idempotency-key'),
      new globalThis.Headers(first.options.headers).get('idempotency-key'),
    );
  },
);

for (const verification of ['loading', 'error'])
  test(
    `raw integration drafts expire while parent verification is ${verification} and cannot return on same-session renewal`,
    { timeout: 10000 },
    async (t) => {
      const b = await sprintIntegrationBrowser(t);
      const h = await b.owners();
      await act(async () => h.state.begin('edit-sprint'));
      await act(async () => h.state.changeField('goal', 'Expired private buffer'));
      const held = b.server.holdNext('/api/v1/identity/session');
      let refreshing;
      await act(async () => {
        refreshing = h.state.parent.refresh();
      });
      if (verification === 'error')
        await act(async () => {
          held.reject(new Error('Verification unavailable'));
          await refreshing;
        });
      assert.equal(h.state.parent.status, verification);
      assert.equal(h.state.editing, null);
      assert.equal(h.state.parent.navigationProtected(), true);
      await b.clock.advance(60001);
      assert.equal(h.state.sprints.status, 'signed-out');
      assert.equal(
        h.state.parent.navigationProtected(),
        false,
        'expiry must clear the hidden raw buffer as well as the controller draft',
      );
      b.server.session = identitySession('human', fixedNow + 120000);
      if (verification === 'loading')
        await act(async () => {
          held.resolve(Response.json(b.server.session));
          await refreshing;
        });
      else await act(async () => h.state.parent.refresh());
      assert.equal(h.state.model.visible, true);
      assert.equal(
        h.state.editing,
        null,
        'renewal after original expiry cannot revive the private field values',
      );
      assert.equal(h.state.sprints.draft, null);
      assert.equal(posts(b).length, 0);
    },
  );

test(
  'settings and creation are separate explicit commands; malformed scales and empty dates do not save',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, { search: '?workspace=a&project=p&projectView=sprints' });
    await b.click('Planning settings');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Point scale' }), '0,,2');
    await b.click('Save changes', dialog(b));
    assert.equal(posts(b).length, 0);
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Point scale' }), '0, 2, 8');
    await b.input(
      getByRole(dialog(b), 'textbox', { name: 'Project time zone' }),
      'America/Caracas',
    );
    b.sprintServer.post = ({ init }) => {
      const input = JSON.parse(init.body);
      assert.deepEqual(input, {
        expectedVersion: 2,
        mode: 'scrum',
        timeZone: 'America/Caracas',
        pointScale: [0, 2, 8],
      });
      b.sprintServer.planning = { ...b.sprintServer.planning, ...input, projectVersion: 3 };
      return Response.json(b.sprintServer.planning);
    };
    await b.click('Save changes', dialog(b));
    await b.clock.advance(500);
    await b.click('Create sprint');
    await b.click('Create sprint', dialog(b));
    assert.equal(posts(b).length, 1);
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Name' }), 'Next sprint');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Goal' }), 'Complete the next slice');
    await b.input(dialog(b).querySelector('input[type="date"]'), '2026-12-04');
    await b.input(dialog(b).querySelectorAll('input[type="date"]')[1], '2026-12-18');
    b.sprintServer.post = ({ init }) => {
      const input = JSON.parse(init.body);
      assert.equal(input.expectedProjectVersion, 3);
      assert.equal(input.endDateExclusive, '2026-12-18');
      const sprint = {
        ...plannedSprint('next'),
        ...input,
        workspaceId: 'a',
        timeZone: 'America/Caracas',
      };
      b.sprintServer.list.items.push(sprint);
      b.sprintServer.list.total++;
      return Response.json(sprint);
    };
    await b.click('Create sprint', dialog(b));
    await b.clock.advance(500);
    assert.equal(posts(b).length, 2);
    assert.match(b.container.textContent, /Next sprint/);
  },
);

test(
  'participation saves only after an explicit destination read/submit, and Escape cancels inline editing',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, { search: '?workspace=a&project=p&task=t1' });
    let section = getByRole(b.container, 'heading', { name: 'Task planning', exact: true }).closest(
      'section',
    );
    await b.click('Change participation', section);
    await b.select('Sprint participation', 'target', section);
    assert.equal(posts(b).length, 0);
    b.sprintServer.post = ({ init }) => {
      assert.deepEqual(JSON.parse(init.body), {
        expectedTaskVersion: 3,
        expectedCurrentParticipationId: 'visit',
        expectedSourceVersion: 2,
        targetSprintId: 'target',
        expectedTargetVersion: 1,
      });
      b.sprintServer.task.currentParticipation = { id: 'new', sprint: b.sprintServer.target };
      return Response.json({
        operation: {
          type: 'set-task-sprint',
          activityId: 'a',
          sprintId: 'target',
          enteredVisitId: 'new',
          exitedVisitId: 'visit',
        },
        current: b.sprintServer.task,
      });
    };
    await b.click('Save participation', section);
    await b.clock.advance(500);
    await b.flush();
    assert.equal(posts(b).length, 1);
    section = getByRole(b.container, 'heading', { name: 'Task planning', exact: true }).closest(
      'section',
    );
    await b.click('Edit estimate', section);
    await act(async () =>
      b.document.activeElement.dispatchEvent(
        new b.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      ),
    );
    await b.flush();
    assert.equal(section.querySelectorAll('form').length, 0);
    assert.equal(posts(b).length, 1);
  },
);

test(
  '409 comparison retains human fields separately and requires reload/rebase plus a separate save',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    await b.click('Edit sprint');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Goal' }), 'My retained goal');
    b.sprintServer.sprint.goal = 'Another author goal';
    b.sprintServer.sprint.version = 7;
    b.sprintServer.post = () =>
      Response.json({ code: 'version-conflict', current: b.sprintServer.sprint }, { status: 409 });
    await b.click('Save changes', dialog(b));
    assert.match(dialog(b).textContent, /My retained goal/);
    assert.match(dialog(b).textContent, /Another author goal/);
    assert.equal(
      queryByRole(dialog(b), 'button', { name: 'Keep my changes on the reviewed data' }),
      null,
    );
    await b.click('Reload', dialog(b));
    await b.click('Keep my changes on the reviewed data', dialog(b));
    assert.equal(posts(b).length, 1);
    assert.equal(getByRole(dialog(b), 'textbox', { name: 'Goal' }).value, 'My retained goal');
    b.sprintServer.post = ({ init }) => {
      const input = JSON.parse(init.body);
      assert.equal(input.expectedVersion, 7);
      assert.equal(input.goal, 'My retained goal');
      b.sprintServer.sprint = { ...b.sprintServer.sprint, ...input, version: 8 };
      return Response.json(b.sprintServer.sprint);
    };
    await b.click('Save changes', dialog(b));
    await b.clock.advance(500);
    assert.equal(posts(b).length, 2);
  },
);

test(
  'complete pending preview and changed continuation cannot confirm an obsolete close decision',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    const original = b.sprintServer.get;
    b.sprintServer.get = (request) => {
      if (!request.path.endsWith('/close-preview')) return original(request);
      const page = {
        ...preview('backlog'),
        workspaceId: 'a',
        total: 103,
        pendingParticipants: 103,
        nextCursor: 'tail',
      };
      page.items = [{ ...page.items[0], taskId: 't1' }];
      if (request.query.has('cursor'))
        return Response.json({
          ...page,
          previewHash: 'b'.repeat(64),
          items: [{ ...page.items[0], participationId: 'second' }],
          nextCursor: null,
        });
      return Response.json(page);
    };
    await b.click('Review closure');
    await b.select('Pending work destination', 'backlog', dialog(b));
    await b.click('Get preview', dialog(b));
    assert.match(dialog(b).textContent, /103/);
    const before = b.sprintServer.requests.filter((r) => r.path.endsWith('close-preview')).length;
    await b.click('Load more', getByRole(dialog(b), 'region', { name: 'Closure consequences' }));
    assert.equal(getByRole(dialog(b), 'button', { name: 'Confirm closure' }).disabled, true);
    assert.match(dialog(b).textContent, /needs refreshing|no longer current/);
    assert.equal(
      b.sprintServer.requests.filter((r) => r.path.endsWith('close-preview')).length,
      before + 1,
    );
    assert.equal(posts(b).length, 0);
    await b.click('Get preview', dialog(b));
    assert.equal(getByRole(dialog(b), 'button', { name: 'Confirm closure' }).disabled, false);
  },
);

function historyEntry(id, kind = 'entry') {
  return {
    id,
    sprintId: 's',
    taskId: 't1',
    participationId: 'visit',
    ordinal: Number(id.slice(1)),
    kind,
    action: 'set-task-sprint',
    occurredAt: '2026-11-20T00:00:00.000Z',
    before: null,
    after: { version: 1, status: 'todo', estimatePoints: 0, parentTaskId: null, archivedAt: null },
    actor: {
      principalId: 'agent',
      kind: 'agent',
      name: 'Builder from public history',
      active: false,
    },
    provenance: {
      actorPrincipalId: 'agent',
      executionMode: 'autonomous',
      source: 'mcp',
      grantId: 'grant',
    },
  };
}
test(
  'canonical history paging retains actor/provenance and changed pages require a deliberate first-page reload',
  { timeout: 10000 },
  async (t) => {
    let changed = true;
    const b = await openScreen(t, {
      configure(_b, s) {
        const original = s.get;
        s.history = { ...s.history, items: [historyEntry('h1')], total: 2, nextCursor: 'tail' };
        s.get = (request) => {
          if (!request.path.endsWith('/history')) return original(request);
          if (request.query.has('cursor'))
            return Response.json({
              ...s.history,
              taskRevision: changed ? 99 : s.history.taskRevision,
              items: [historyEntry('h2', 'task-change')],
              nextCursor: null,
            });
        };
      },
    });
    let section = getByRole(b.container, 'heading', {
      name: 'Sprint history',
      exact: true,
    }).closest('section');
    assert.match(section.textContent, /Builder from public history|Agent|MCP/);
    await b.click('Load more', section);
    assert.match(section.textContent, /History changed/);
    assert.equal(section.querySelectorAll('ol > li').length, 1);
    changed = false;
    await b.click('Reload', section);
    await b.click('Load more', section);
    assert.equal(section.querySelectorAll('ol > li').length, 2);
    assert.equal(posts(b).length, 0);
  },
);

test(
  'read-only closed results page frozen outcomes independently of live Task changes',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, {
      configure(_b, s) {
        const closed = closeResult(preview('target'));
        s.sprint = { ...closed.current, workspaceId: 'a' };
        s.closure = { ...closed.closure, workspaceId: 'a', total: 2 };
        s.outcomes = {
          ...s.outcomes,
          total: 2,
          items: [
            {
              ...s.outcomes.items[0],
              disposition: 'done',
              snapshot: { ...s.task.snapshot, status: 'done', estimatePoints: 0 },
            },
          ],
          nextCursor: 'tail',
        };
        s.task.snapshot = { ...s.task.snapshot, status: 'in_progress', estimatePoints: 13 };
        const original = s.get;
        s.get = (request) =>
          request.path.endsWith('/outcomes') && request.query.has('cursor')
            ? Response.json({
                ...s.outcomes,
                items: [
                  {
                    ...s.outcomes.items[0],
                    id: 'outcome2',
                    taskId: 't2',
                    participationId: 'visit2',
                    disposition: 'carried',
                    targetSprintId: 'target',
                    targetParticipationId: 'target-visit',
                    snapshot: { ...s.task.snapshot, status: 'todo' },
                  },
                ],
                nextCursor: null,
              })
            : original(request);
      },
    });
    const section = getByRole(b.container, 'heading', { name: 'Results at closure' }).closest(
      'section',
    );
    assert.match(section.textContent, /Done/);
    await b.click('Load more', section);
    assert.match(section.textContent, /Carried to another sprint/);
    assert.equal(section.querySelectorAll('ul > li').length, 2);
    assert.equal(queryByRole(b.container, 'button', { name: 'Edit sprint' }), null);
    assert.equal(queryByRole(b.container, 'button', { name: 'Review start' }), null);
    assert.equal(queryByRole(b.container, 'button', { name: 'Review closure' }), null);
    assert.equal(
      b.sprintServer.requests.some((r) => r.path.endsWith('close-preview')),
      false,
    );
  },
);

test(
  'capability loss removes an open mutation form; restored authority does not remount it until explicit review',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    await b.click('Edit sprint');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Goal' }), 'Retained private decision');
    b.sprintServer.sprint.capabilities.canEdit = false;
    await act(async () => b.server.streams.at(-1).emit({ type: 'reset' }));
    await b.clock.advance(500);
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.doesNotMatch(b.container.textContent, /Retained private decision/);
    b.sprintServer.sprint.capabilities.canEdit = true;
    await act(async () => b.server.streams.at(-1).emit({ type: 'reset' }));
    await b.clock.advance(500);
    assert.equal(queryByRole(b.container, 'dialog'), null);
    await b.click('Review again before saving');
    assert.equal(
      getByRole(dialog(b), 'textbox', { name: 'Goal' }).value,
      'Retained private decision',
    );
    assert.equal(posts(b).length, 0);
  },
);

test(
  'Back and beforeunload protect a raw close-review lifetime before any preview/write',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t);
    const h = await b.owners();
    await act(async () => h.state.beginClose());
    const before = new b.window.Event('beforeunload', { cancelable: true });
    b.window.dispatchEvent(before);
    assert.equal(before.defaultPrevented, true);
    b.window.history.pushState({}, '', '/projects?workspace=a&project=p&task=t1');
    await b.event('popstate');
    assert.equal(h.state.parent.selection.taskId, null);
    assert.match(b.window.location.search, /projectView=sprints/);
    await act(async () => h.state.parent.resolveIntegratedNavigation('stay'));
    assert.ok(h.state.editing.close);
    await act(async () => h.state.discard());
    const after = new b.window.Event('beforeunload', { cancelable: true });
    b.window.dispatchEvent(after);
    assert.equal(after.defaultPrevented, false);
    assert.equal(posts(b).length, 0);
  },
);

test(
  'production guarded links mount one reachable decision and discard performs only the reviewed navigation',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t);
    await b.click('Edit sprint');
    await b.input(getByRole(dialog(b), 'textbox', { name: 'Goal' }), 'Keep until a decision');
    const tasks = getByRole(b.container, 'link', { name: 'Tasks', exact: true });
    await act(async () => tasks.click());
    await b.flush();
    assert.equal(dialog(b).getAttribute('aria-modal'), 'true');
    assert.match(dialog(b).textContent, /Resolve changes before leaving|unsaved draft/);
    assert.equal(dialog(b).contains(b.document.activeElement), true);
    assert.equal(b.container.querySelectorAll('[role="dialog"]').length, 1);
    assert.equal(b.container.querySelector('main').hasAttribute('inert'), true);
    await b.click('Stay here', dialog(b));
    assert.equal(getByRole(dialog(b), 'textbox', { name: 'Goal' }).value, 'Keep until a decision');
    const external = b.document.createElement('a');
    external.href = 'https://help.example.test/projects?workspace=a&project=p#sprint-guide';
    b.document.body.append(external);
    await act(async () => external.click());
    await b.flush();
    assert.ok(
      dialog(b).textContent.includes(external.href),
      'external review identifies its actual origin and full destination',
    );
    await b.click('Stay here', dialog(b));
    external.remove();
    assert.equal(getByRole(dialog(b), 'textbox', { name: 'Goal' }).value, 'Keep until a decision');
    for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
      const event = new b.window.MouseEvent('click', {
        [key]: true,
        bubbles: true,
        cancelable: true,
      });
      tasks.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false);
    }
    await act(async () => tasks.click());
    await b.flush();
    await b.click('Discard local work and continue', dialog(b));
    await b.clock.advance(500);
    await b.flush();
    assert.equal(queryByRole(b.container, 'dialog'), null);
    assert.equal(new URL(b.window.location.href).searchParams.has('projectView'), false);
    assert.equal(posts(b).length, 0);
  },
);

for (const owner of ['task', 'sprint'])
  test(
    `an external projects-shaped link retains its full destination and the ${owner} owner's work`,
    { timeout: 10000 },
    async (t) => {
      const b = await sprintIntegrationBrowser(
        t,
        owner === 'task' ? { search: '?workspace=a&project=p' } : {},
      );
      const h = await b.owners();
      await act(async () =>
        owner === 'task' ? h.state.parent.stage(createDraft()) : h.state.beginClose(),
      );
      const link = b.document.createElement('a');
      link.href = 'https://help.example.test/projects?workspace=a&project=p#sprint-guide';
      link.textContent = 'External planning guide';
      b.document.body.append(link);
      const click = new b.window.MouseEvent('click', { bubbles: true, cancelable: true });
      await act(async () => link.dispatchEvent(click));
      assert.equal(click.defaultPrevented, true);
      assert.equal(h.state.parent.integratedNavigation?.url, link.href);
      await act(async () => h.state.parent.resolveIntegratedNavigation('stay'));
      assert.equal(h.state.parent.integratedNavigation, null);
      assert.ok(owner === 'task' ? h.state.parent.draft : h.state.editing.close);
      assert.equal(b.posts().length + posts(b).length, 0);
      link.remove();
    },
  );

test(
  'discarded Back and invalid latest URL cannot submit or restore an old sprint draft',
  { timeout: 10000 },
  async (t) => {
    const b = await sprintIntegrationBrowser(t);
    const h = await b.owners();
    await act(async () => h.state.begin('edit-sprint'));
    b.window.history.pushState({}, '', '/projects?workspace=a&project=p&task=t1');
    await b.event('popstate');
    assert.equal(h.state.parent.selection.taskId, null);
    await act(async () => h.state.parent.resolveIntegratedNavigation('discard'));
    assert.equal(h.state.parent.selection.taskId, 't1');
    assert.equal(h.state.sprints.draft, null);
    await act(async () => h.state.selectView('sprints'));
    await act(async () => h.state.selectSprint('s'));
    await act(async () => h.state.begin('edit-sprint'));
    b.window.history.pushState(
      {},
      '',
      '/projects?workspace=a&project=p&projectView=sprints&sprint=../invalid',
    );
    await b.event('popstate');
    assert.ok(h.state.parent.integratedNavigation);
    await act(async () => h.state.parent.resolveIntegratedNavigation('discard'));
    assert.equal(h.state.parent.status, 'error');
    assert.equal(h.state.parent.project, null);
    assert.equal(h.state.model.resources, null);
    assert.equal(posts(b).length, 0);
  },
);

test(
  'narrow sprint modal and sidebar keep their existing independent focus and scroll ownership',
  { timeout: 10000 },
  async (t) => {
    const b = await openScreen(t, {
      configure(browser) {
        browser.replace(browser.window, 'matchMedia', (media) => ({
          media,
          matches: media.includes('max-width'),
          addEventListener() {},
          removeEventListener() {},
        }));
      },
    });
    await b.click('Planning settings');
    assert.equal(dialog(b).contains(b.document.activeElement), true);
    assert.equal(b.document.body.style.overflow, 'hidden');
    await b.click('Back', dialog(b));
    assert.equal(b.document.body.style.overflow, '');
    await b.click('Open navigation');
    assert.equal(b.document.activeElement.closest('aside') !== null, true);
    await b.click('Close navigation', b.container.querySelector('aside'));
    assert.equal(b.container.querySelector('main').hasAttribute('inert'), false);
  },
);
