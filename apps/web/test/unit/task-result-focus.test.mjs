import assert from 'node:assert/strict';
import { test } from 'node:test';
import { act } from './dom-harness.mjs';
import { task } from './project-hook-harness.mjs';
import { mountProjectInteractions } from './project-interaction-harness.mjs';

function timerFor(browser, delay) {
  const match = [...browser.timers].find(([, timer]) => timer.delay === delay);
  assert.ok(match, `Expected controlled browser timeout ${delay}`);
  return match[0];
}
async function delayedMove(b) {
  b.server.mutate = () => Response.json({ ...task(1), status: 'todo', orderVersion: 2 });
  await act(async () => {
    b.state.result.setMoveFocusId('t1');
    assert.equal(b.state.canonical.stageMove('t1', 'todo', null), 'ready');
    await b.state.canonical.submit();
  });
  assert.equal(b.state.canonical.outcome, 'success');
  return timerFor(b, 4000);
}

test(
  'move waits for canonical status and page order version before falling back after 4000ms',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t);
    const timer = await delayedMove(b);
    assert.equal(b.state.result.moveFocusId, 't1');
    assert.notEqual(b.document.activeElement.getAttribute('data-task-open'), 'true');
    await b.fireTimer(timer);
    assert.equal(b.document.activeElement.hasAttribute('data-task-view-bar'), true);
    assert.equal(b.state.result.moveFocusId, null);
  },
);

test(
  'deliberate focus outside the moving row cancels delayed restoration',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t);
    const timer = await delayedMove(b);
    const elsewhere = b.document.body.appendChild(b.document.createElement('button'));
    elsewhere.textContent = 'Keep my focus';
    await act(async () => elsewhere.focus());
    await b.fireTimer(timer);
    assert.equal(b.document.activeElement, elsewhere);
    assert.equal(b.state.result.moveFocusId, null);
  },
);

test(
  'a filtered or paginated create result uses the existing 1500ms view-bar fallback',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t);
    await act(async () => b.state.content.stageCapture('Created outside visible page'));
    await act(async () => b.state.content.submitCapture());
    assert.equal(b.state.canonical.result.id, 't115');
    await b.fireTimer(timerFor(b, 1500));
    assert.equal(b.document.activeElement.hasAttribute('data-task-view-bar'), true);
  },
);
