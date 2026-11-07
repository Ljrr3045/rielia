import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useProjectTasks } from '../../src/lib/use-project-tasks.ts';
import { act, mountHook } from './dom-harness.mjs';
import { projectBrowser } from './project-hook-harness.mjs';

const tasksPath = '/api/v1/workspaces/a/projects/p/tasks';

test(
  'a quiet real hook preserves its loaded task page after the initial stream reset',
  { timeout: 30_000 },
  async (t) => {
    const browser = projectBrowser(t);
    const hook = await mountHook(browser, useProjectTasks);
    assert.equal(hook.state.status, 'ready');
    await act(async () => hook.state.loadMore('tasks'));
    assert.equal(hook.state.tasks.items.length, 114);
    const reads = browser.reads(tasksPath).length;
    await browser.clock.advance(500);
    assert.equal(
      hook.state.tasks.items.length,
      114,
      'quiet invalidation cannot reset a loaded task page',
    );
    assert.equal(
      browser.reads(tasksPath).length,
      reads,
      'a settled refresh must not request another first page without a new hint',
    );
    assert.equal(hook.state.refreshRequired, false);
  },
);
