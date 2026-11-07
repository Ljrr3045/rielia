import assert from 'node:assert/strict';
import { test } from 'node:test';
import { act } from './dom-harness.mjs';
import { mountProjectInteractions } from './project-interaction-harness.mjs';

test(
  'direct detail return focuses the project heading when no opener was captured',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    await act(async () => b.state.canonical.selectTask(null));
    assert.equal(b.document.activeElement.textContent, 'Project heading');
  },
);

test(
  'detail return finds a replacement with the same href when its original row was unmounted',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t);
    const opener = b.container.querySelector('[data-task-id="t1"] [data-task-open]');
    const href = opener.getAttribute('href');
    await act(async () => b.state.navigation.selectTaskFromList('t1', opener));
    await act(async () => b.state.canonical.selectTask(null));
    const returned = b.document.activeElement;
    assert.equal(returned.getAttribute('href'), href);
    assert.equal(returned.isConnected, true);
  },
);

test(
  'a resumed draft clears a stale modal opener and dismissal uses the current surface fallback',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    const stale = b.document.body.appendChild(b.document.createElement('button'));
    stale.textContent = 'Previous modal opener';
    await act(async () => b.state.content.openTaskEdit(stale));
    await act(async () => b.state.content.stageTask({ title: 'Retained draft' }));
    await act(async () => b.state.content.closeForm());
    await b.framesUntilIdle();
    assert.equal(b.document.activeElement, stale);
    await act(async () => b.state.content.resumeCurrentDraft());
    await act(async () => b.state.content.closeForm());
    await b.framesUntilIdle();
    assert.equal(b.document.activeElement.textContent, 'Project heading');
    assert.notEqual(b.document.activeElement, stale);
  },
);
