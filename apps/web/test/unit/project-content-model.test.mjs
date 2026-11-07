import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commandMatches, taskFields } from '../../src/app/projects/project-content-model.ts';
import { task } from './project-hook-harness.mjs';

test('editable task fields exclude immutable creator, provenance, version, identity and parent linkage', () => {
  const dto = {
    ...task(1),
    description: 'Public description',
    parentTaskId: 'parent',
    assigneePrincipalId: 'agent',
  };
  const fields = taskFields(dto);
  assert.deepEqual(Object.keys(fields).sort(), [
    'assigneePrincipalId',
    'description',
    'dueDate',
    'priority',
    'status',
    'title',
    'type',
  ]);
  assert.equal(fields.description, 'Public description');
  assert.equal(fields.assigneePrincipalId, 'agent');
  assert.equal('parentTaskId' in fields, false);
});

test('content target matching keeps workspace, project and task identities distinct', () => {
  const selected = { workspaceId: 'a', projectId: 'p', taskId: 't1' };
  const draft = {
    type: 'edit-task',
    workspaceId: 'a',
    projectId: 'p',
    taskId: 't1',
    expectedVersion: 1,
    fields: { title: 'Draft' },
  };
  assert.equal(commandMatches(draft, selected), true);
  for (const [key, value] of [
    ['workspaceId', 'b'],
    ['projectId', 'other'],
    ['taskId', null],
  ]) {
    assert.equal(commandMatches(draft, { ...selected, [key]: value }), false);
  }
  assert.equal(
    commandMatches(
      { type: 'create-project', workspaceId: 'a', name: 'New', key: 'NEW' },
      { ...selected, projectId: null, taskId: null },
    ),
    true,
  );
});
