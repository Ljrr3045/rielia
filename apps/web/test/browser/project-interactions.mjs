import assert from 'node:assert/strict';
import { copy } from '../../src/app/projects/strings.ts';
import { fixedNow, identitySession, page as publicPage, workspace } from '../unit/dom-harness.mjs';
import { project, task } from '../unit/project-hook-harness.mjs';

/**
 * Browser characterization candidate for a REAL Next /projects screen.
 * The caller owns a fresh browser page and a running local QA Next origin.
 * No React, Next, CSS, screen, hook or controller replacement is used.
 * HTTP is the only controlled application boundary. Run before moving owners,
 * then unchanged after extraction; this module is not a unit-coverage source.
 */
export async function projectScreenBoundary(page, origin) {
  const writes = [];
  const reads = [];
  const streamRoutes = new Set();
  let version = 1;
  let outcome = 'success';
  let readFailureAfterWrite = false;
  let failProjectReads = false;
  let releaseMutation = null;
  let pendingMutation = null;
  const rows = Array.from({ length: 3 }, (_, i) => task(i + 1));
  const route = async (requestRoute) => {
    const request = requestRoute.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() === 'POST') {
      writes.push({ path, body: request.postDataJSON(), headers: request.headers() });
      if (outcome === 'pending') {
        pendingMutation = new Promise((resolve) => {
          releaseMutation = resolve;
        });
        await pendingMutation;
      }
      if (outcome === 'unknown') return requestRoute.abort('failed');
      if (outcome === 'forbidden')
        return requestRoute.fulfill({
          status: 403,
          json: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      failProjectReads = readFailureAfterWrite;
      return requestRoute.fulfill({
        status: 200,
        json: { ...task(1, 'a', 'p', version + 1), title: 'Changed title' },
      });
    }
    reads.push(path);
    if (failProjectReads && path.includes('/projects/p') && !path.endsWith('/events'))
      return requestRoute.fulfill({
        status: 503,
        json: { code: 'service-unavailable', message: 'Read boundary unavailable' },
      });
    if (path.endsWith('/events')) {
      // Held at the transport boundary. Real SSE ownership remains in retained lifecycle units.
      streamRoutes.add(requestRoute);
      return;
    }
    if (path === '/api/v1/identity/config')
      return requestRoute.fulfill({ json: { enabled: true, providers: [] } });
    if (path === '/api/v1/identity/session')
      return requestRoute.fulfill({ json: identitySession('human', fixedNow + 86_400_000_000) });
    if (path === '/api/v1/workspaces')
      return requestRoute.fulfill({ json: publicPage([workspace('a'), workspace('b')]) });
    if (path === '/api/v1/workspaces/a' || path === '/api/v1/workspaces/b')
      return requestRoute.fulfill({ json: workspace(path.split('/').at(-1)) });
    if (path.endsWith('/members')) return requestRoute.fulfill({ json: publicPage([]) });
    if (path.endsWith('/projects'))
      return requestRoute.fulfill({
        json: { ...publicPage([project('p')]), capabilities: { canCreate: true } },
      });
    if (path.endsWith('/projects/p'))
      return requestRoute.fulfill({ json: project('p', 'a', version) });
    if (path.endsWith('/assignees'))
      return requestRoute.fulfill({
        json: { ...publicPage([]), workspaceId: 'a', projectId: 'p' },
      });
    if (path.endsWith('/tasks'))
      return requestRoute.fulfill({
        json: {
          ...publicPage(rows.map((row) => ({ ...row, version }))),
          capabilities: { canCreate: true },
          orderVersion: 1,
          columnCounts: { backlog: 3, todo: 0, in_progress: 0, done: 0, canceled: 0 },
          selectedAssignee: null,
        },
      });
    if (/\/tasks\/t\d+$/.test(path))
      return requestRoute.fulfill({
        json: task(Number(path.match(/t(\d+)$/)[1]), 'a', 'p', version),
      });
    const collection = path.split('/').at(-1);
    const common = {
      ...publicPage([]),
      workspaceId: 'a',
      projectId: 'p',
      taskId: 't1',
      revision: version,
    };
    if (collection === 'relations')
      return requestRoute.fulfill({
        json: {
          ...common,
          parent: null,
          open: 0,
          archivedOpen: 0,
          capabilities: { canCreate: true, canLink: true, canUnlink: false },
        },
      });
    if (collection === 'checklist')
      return requestRoute.fulfill({
        json: { ...common, capabilities: { canCreate: true, canEdit: true } },
      });
    if (collection === 'comments')
      return requestRoute.fulfill({ json: { ...common, capabilities: { canCreate: true } } });
    if (collection === 'history') return requestRoute.fulfill({ json: common });
    if (collection === 'parent-candidates')
      return requestRoute.fulfill({ json: { ...common, capabilities: { canSelect: true } } });
    throw new Error(`Unconfigured public HTTP boundary: ${request.method()} ${path}`);
  };
  await page.route('**/api/v1/**', route);
  return {
    writes,
    reads,
    async open(search = '?workspace=a&project=p&task=t1') {
      await page.goto(`${origin}/projects${search}`);
      await page.locator('#projects-locale').selectOption('en');
      await page
        .getByRole('heading', {
          name: new URLSearchParams(search).has('task') ? 'Task 1' : 'Project p',
          exact: true,
        })
        .waitFor();
    },
    async refreshAt(nextVersion) {
      version = nextVersion;
      const refreshed = page.waitForResponse(
        (response) =>
          /\/tasks\/t1$/.test(new URL(response.url()).pathname) &&
          response.request().method() === 'GET',
      );
      await page.evaluate(() =>
        globalThis.window.dispatchEvent(new globalThis.PopStateEvent('popstate')),
      );
      assert.equal((await (await refreshed).json()).version, nextVersion);
    },
    setReadFailureAfterWrite(value) {
      readFailureAfterWrite = value;
    },
    setOutcome(value) {
      outcome = value;
    },
    release() {
      releaseMutation?.();
    },
    async close() {
      releaseMutation?.();
      await page.goto('about:blank');
      for (const held of streamRoutes) await held.abort().catch(() => {});
      await page.unroute('**/api/v1/**', route);
    },
  };
}

export async function characterizeCapturedTaskVersion(page, origin) {
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await boundary.open();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const title = dialog.getByRole('textbox', { name: /^Title/ });
    await title.fill('Changed title');
    await boundary.refreshAt(2);
    await page.getByRole('heading', { name: 'Task 1', exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(boundary.writes.length, 1);
    assert.equal(boundary.writes[0].body.expectedVersion, 1);
    assert.equal(boundary.writes[0].body.title, 'Changed title');
    assert.equal(boundary.writes[0].path, '/api/v1/workspaces/a/projects/p/tasks/t1');
  } finally {
    await boundary.close();
  }
}

export async function characterizeWorkspaceGuardAndFocus(page, origin) {
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await boundary.open();
    const opener = page.getByRole('button', { name: 'Edit', exact: true });
    await opener.click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^Title/ }).fill('Retained title');
    // Navigation comes from actual history, since the background selector is correctly inert.
    await page.evaluate(() => {
      globalThis.history.pushState(globalThis.history.state, '', '/projects?workspace=b');
      globalThis.window.dispatchEvent(
        new globalThis.PopStateEvent('popstate', { state: globalThis.history.state }),
      );
    });
    await page.getByRole('button', { name: 'Stay in this workspace', exact: true }).click();
    dialog = page.getByRole('dialog');
    assert.equal(
      await dialog.getByRole('textbox', { name: /^Title/ }).inputValue(),
      'Retained title',
    );
    assert.equal(new URL(page.url()).searchParams.get('workspace'), 'a');
    assert.equal(boundary.reads.includes('/api/v1/workspaces/b'), false);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.waitForFunction(
      () => globalThis.document.activeElement?.textContent?.trim() === 'Edit',
    );
    await opener.click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await opener.evaluate((node) => globalThis.document.activeElement === node), true);
  } finally {
    await boundary.close();
  }
}

export async function characterizeUnknownRetry(page, origin) {
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await boundary.open();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^Title/ }).fill('Changed title');
    boundary.setOutcome('unknown');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await dialog.getByRole('button', { name: 'Retry', exact: true }).waitFor();
    assert.equal(
      await page.getByText(copy.feedback.unknownTitle.en, { exact: true }).count(),
      1,
      'one public recovery announcement home',
    );
    const first = boundary.writes[0];
    boundary.setOutcome('success');
    await dialog.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(boundary.writes.length, 2);
    assert.deepEqual(boundary.writes[1].body, first.body);
    assert.equal(boundary.writes[1].headers['idempotency-key'], first.headers['idempotency-key']);
    assert.ok(first.headers['idempotency-key']);
  } finally {
    await boundary.close();
  }
}

export async function characterizeNestedCandidateEscape(page, origin) {
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await boundary.open();
    assert.equal(
      boundary.reads.some((path) => path.endsWith('/parent-candidates')),
      false,
    );
    await page.getByRole('button', { name: 'Link to a parent task', exact: true }).click();
    const picker = page.getByRole('group', { name: 'Choose a parent task', exact: true });
    await picker.getByRole('button', { name: 'Close parent task picker', exact: true }).focus();
    await page.keyboard.press('Escape');
    await picker.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('[data-detail-heading]').count(), 1);
    assert.equal(
      await page
        .locator('[data-collab-link-opener]')
        .evaluate((node) => globalThis.document.activeElement === node),
      true,
    );
    assert.equal(boundary.reads.filter((path) => path.endsWith('/parent-candidates')).length, 1);
    assert.equal(boundary.writes.length, 0);
  } finally {
    await boundary.close();
  }
}

export async function characterizeNativeDialogKeyboard(page, origin) {
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await boundary.open();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Edit task', exact: true }) });
    const autofocusTitle = dialog.getByRole('textbox', { name: /^Title/ });
    await page.waitForFunction(
      (id) => globalThis.document.activeElement?.id === id,
      await autofocusTitle.getAttribute('id'),
    );
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Cancel', exact: true })
        .evaluate((node) => globalThis.document.activeElement === node),
      true,
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Close', exact: true })
        .evaluate((node) => globalThis.document.activeElement === node),
      true,
    );
    assert.equal(await page.evaluate(() => globalThis.document.body.style.overflow), 'hidden');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    // The still-open mobile detail remains a separate legitimate lock owner.
    assert.equal(await page.evaluate(() => globalThis.document.body.style.overflow), 'hidden');
    await page.getByRole('button', { name: 'Close task detail', exact: true }).click();
    await page.waitForFunction(() => globalThis.document.body.style.overflow !== 'hidden');
    assert.equal(await page.locator('#projects-main').count(), 1);
  } finally {
    await boundary.close();
  }
}

/** Record A, then compare B exactly. This characterizes current exits/visibility,
 * without making the plan's unverified recovery expectation a passing assertion. */
export async function characterizeRecoveryBaseline(page, origin, scenario) {
  assert.ok(['mutation-forbidden', 'success-then-read-failure'].includes(scenario));
  const boundary = await projectScreenBoundary(page, origin);
  try {
    await boundary.open();
    await page.getByRole('button', { name: copy.common.edit.en, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^Title/ }).fill('Changed title');
    if (scenario === 'mutation-forbidden') boundary.setOutcome('forbidden');
    else boundary.setReadFailureAfterWrite(true);
    await dialog.getByRole('button', { name: copy.task.saveChanges.en, exact: true }).click();
    await page
      .getByRole('heading', {
        name:
          scenario === 'mutation-forbidden'
            ? copy.status.forbiddenTitle.en
            : copy.status.errorTitle.en,
        exact: true,
      })
      .waitFor();
    assert.equal(
      boundary.writes.length,
      1,
      'neither follow-up failure automatically resubmits a mutation',
    );
    return {
      scenario,
      visibleDialogs: await page.getByRole('dialog').count(),
      visibleDraftFields: await page.getByRole('textbox', { name: /^Title/ }).count(),
      visibleStatuses: await page.getByRole('status').allTextContents(),
      visibleAlerts: await page.getByRole('alert').allTextContents(),
      visibleSuccessCount: await page
        .getByText(copy.feedback.successUpdatedTask.en, { exact: true })
        .count(),
      exits: await page.locator('main button, main a').evaluateAll((nodes) =>
        nodes
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => ({
            role: node.tagName.toLowerCase(),
            text: node.textContent.trim(),
            href: node.getAttribute('href'),
            disabled: node.matches(':disabled'),
          })),
      ),
      mainText: await page.locator('#projects-main').innerText(),
    };
  } finally {
    await boundary.close();
  }
}
