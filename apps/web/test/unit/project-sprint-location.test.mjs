import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  readProjectSprintLocation,
  writeProjectSprintLocation,
} from '../../src/lib/project-sprint-location.ts';

test('sprint hrefs retain T37 board/filter/detail context and round-trip task-detail return', () => {
  const source =
    '/projects?workspace=w&project=p&task=t&taskLayout=board&priority=high&column=todo';
  const href = writeProjectSprintLocation(source, { view: 'sprints', sprintId: 's' });
  const url = new URL(href, 'https://app.test');
  assert.deepEqual(readProjectSprintLocation(url.search), { view: 'sprints', sprintId: 's' });
  assert.equal(url.searchParams.get('task'), 't');
  assert.equal(url.searchParams.get('taskLayout'), 'board');
  assert.equal(url.searchParams.get('priority'), 'high');
  url.searchParams.delete('task');
  assert.deepEqual(readProjectSprintLocation(url.search), { view: 'sprints', sprintId: 's' });
  const tasks = writeProjectSprintLocation(href, { view: 'tasks', sprintId: null });
  assert.equal(tasks, source);
  assert.deepEqual(readProjectSprintLocation(''), { view: 'tasks', sprintId: null });
});

test('sprint chooser can represent no selection and keeps valid encoded IDs without coercion', () => {
  const href = writeProjectSprintLocation('/projects?workspace=w&project=p', {
    view: 'sprints',
    sprintId: null,
  });
  assert.deepEqual(readProjectSprintLocation(new URL(href, 'https://app.test').search), {
    view: 'sprints',
    sprintId: null,
  });
  assert.deepEqual(
    readProjectSprintLocation('?workspace=w&project=p&projectView=sprints&sprint=s_1-2'),
    { view: 'sprints', sprintId: 's_1-2' },
  );
});

test('malformed, duplicate, orphan or discovery sprint URL state cannot select a private context', () => {
  for (const query of [
    '?projectView=sprints',
    '?workspace=w&projectView=sprints',
    '?workspace=w&project=p&projectView=other',
    '?workspace=w&project=p&sprint=s',
    '?workspace=w&project=p&projectView=sprints&sprint=',
    '?workspace=w&project=p&projectView=sprints&sprint=../s',
    '?workspace=w&project=p&projectView=sprints&sprint=s&sprint=t',
    '?workspace=w&project=p&projectView=sprints&projectView=tasks',
    '?workspace=w&workspace=x&project=p&projectView=sprints',
    '?workspace=w&project=p&project=p&projectView=sprints',
    '?workspace=w&project=p&projectView=sprints&taskScope=mine',
    '?workspace=w&project=p&projectView=sprints&taskScope=search',
    '?workspace=w&project=p&projectView=sprints&taskScope=project&taskScope=project',
  ])
    assert.equal(readProjectSprintLocation(query), null, query);
  for (const href of [
    'https://foreign.test/projects?workspace=w&project=p',
    '/identity',
    '/projects-other',
  ])
    assert.equal(writeProjectSprintLocation(href, { view: 'sprints', sprintId: 's' }), null);
  assert.equal(writeProjectSprintLocation('/projects', { view: 'tasks', sprintId: 's' }), null);
});
