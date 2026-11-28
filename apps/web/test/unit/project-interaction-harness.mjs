import { useRef, useState } from 'react';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { useProjectContentForms } from '../../src/app/projects/use-project-content-forms.ts';
import { useProjectNavigationFocus } from '../../src/app/projects/use-project-navigation-focus.ts';
import { useTaskResultFocus } from '../../src/app/projects/use-task-result-focus.ts';
import { useProjectInteractionEffects } from '../../src/app/projects/use-project-interaction-effects.ts';
import { act, createElement, StrictMode } from './dom-harness.mjs';
import { projectBrowser } from './project-hook-harness.mjs';

/** Real feature hooks, lifecycle, controller and HTTP clients; only browser/HTTP boundaries vary. */
export async function mountProjectInteractions(
  t,
  { search, strict = false, sidebarDrawer = false } = {},
) {
  const browser = projectBrowser(t, search);
  const restoreAttach = browser.replace(
    browser.window.HTMLElement.prototype,
    'attachEvent',
    function () {
      this.detachEvent = () => {};
    },
  );
  const restoreDetach = browser.replace(
    browser.window.HTMLElement.prototype,
    'detachEvent',
    () => {},
  );
  const frames = new Map();
  let nextFrame = 0;
  const restoreRequest = browser.replace(globalThis, 'requestAnimationFrame', (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  const restoreCancel = browser.replace(globalThis, 'cancelAnimationFrame', (id) =>
    frames.delete(id),
  );
  let latest;
  function Harness() {
    const canonical = useProjectTasks();
    const [rowEpoch, setRowEpoch] = useState(0);
    const captureRef = useRef(null);
    const projectHeadingRef = useRef(null);
    const lastCommandRef = useRef(null);
    const lastOutcomeSourceRef = useRef('content');
    const [moveNotice, setMoveNotice] = useState(null);
    const result = useTaskResultFocus(canonical);
    const navigation = useProjectNavigationFocus({
      ...canonical,
      anyPending: canonical.mutationPending !== null,
    });
    const blocked =
      canonical.mutationPending !== null ||
      canonical.retryTarget !== null ||
      canonical.moveRetryTarget !== null ||
      canonical.policyRetryTarget !== null;
    // Actual canonical affordances supplied to the feature hook, without a second DTO owner.
    const project = canonical.project;
    const projectReady =
      canonical.resources?.project.status === 'ready' && !canonical.resources.project.stale;
    const archived = project?.archivedAt != null;
    const content = useProjectContentForms({
      ...canonical,
      blocked,
      canCreateProject: canonical.projects?.capabilities.canCreate === true,
      canEditProject: projectReady && project?.capabilities.canEdit === true && !archived,
      canManageAccess: projectReady && project?.capabilities.canManageAccess === true,
      canArchiveProject: projectReady && project?.capabilities.canArchive === true && !archived,
      canRestoreProject: projectReady && project?.capabilities.canRestore === true && archived,
      canCapture: !blocked && canonical.taskSummary.canCreate && projectReady && !archived,
      projectArchived: archived,
      captureRef,
      projectHeadingRef,
      lastCommandRef,
      lastOutcomeSourceRef,
      focusViewBar: result.focusViewBar,
      setMoveFocusId: result.setMoveFocusId,
      setMoveNotice,
    });
    useProjectInteractionEffects({
      ...canonical,
      ...result,
      ...navigation,
      ...content,
      captureRef,
      projectHeadingRef,
      lastCommandRef,
      setMoveNotice,
      overlayOpen: false,
      sidebarDrawer,
    });
    latest = {
      canonical,
      content,
      navigation,
      result,
      moveNotice,
      lastCommandRef,
      remountTaskRows: () => setRowEpoch((epoch) => epoch + 1),
    };
    return createElement(
      'main',
      { id: 'projects-main', tabIndex: -1 },
      createElement('h1', { ref: projectHeadingRef, tabIndex: -1 }, 'Project heading'),
      canonical.task !== null
        ? createElement('h2', { 'data-detail-heading': true, tabIndex: -1 }, canonical.task.title)
        : null,
      createElement('input', { ref: captureRef, 'aria-label': 'Capture' }),
      createElement(
        'aside',
        { ref: navigation.sidebarRef, tabIndex: -1 },
        createElement('button', { 'data-autofocus': true }, 'Drawer close'),
      ),
      createElement('div', { 'data-task-view-bar': true, tabIndex: -1 }, 'View bar'),
      ...(canonical.tasks?.items ?? []).map((task) =>
        createElement(
          'section',
          { key: `${rowEpoch}:${task.id}` },
          createElement('h2', { 'data-column-heading': task.status, tabIndex: -1 }, task.status),
          createElement(
            'div',
            { 'data-task-id': task.id },
            createElement('a', { href: task.url, 'data-task-open': true }, task.title),
            createElement(
              'select',
              { value: task.status, onChange() {} },
              createElement('option', { value: task.status }, task.status),
            ),
          ),
        ),
      ),
    );
  }
  t.after(async () => {
    try {
      await browser.unmount();
    } finally {
      restoreCancel();
      restoreRequest();
      restoreDetach();
      restoreAttach();
    }
  });
  await browser.render(
    strict ? createElement(StrictMode, null, createElement(Harness)) : createElement(Harness),
  );
  return {
    ...browser,
    get state() {
      return latest;
    },
    frames,
    remountTaskRows() {
      latest.remountTaskRows();
    },
    async framesUntilIdle() {
      for (let count = 0; frames.size > 0; count++) {
        if (count > 10) throw new Error('Focus frames did not converge');
        const pending = [...frames.values()];
        frames.clear();
        await act(async () => pending.forEach((callback) => callback(0)));
      }
    },
  };
}
