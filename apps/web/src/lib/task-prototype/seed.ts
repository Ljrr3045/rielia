import type { DemoPrincipal, DemoProvenance, DemoSprint, DemoTask, TaskStatus } from './types.ts';

export const workspace = { id: 'demo-workspace', name: 'Rielia · Fictional workspace' } as const;
export const project = { id: 'demo-project', key: 'RIE', name: 'Rielia demo project',
  description: 'Fictional planning data for the T01 prototype. No real project records.', timeZone: 'UTC' } as const;
export const currentPrincipalId = 'demo-luis';
export const principals: readonly DemoPrincipal[] = [
  { id: currentPrincipalId, name: 'Luis (demo)', kind: 'human' },
  { id: 'demo-ana', name: 'Ana (demo)', kind: 'human' },
  { id: 'demo-builder', name: 'Rielia Builder · Agent (demo)', kind: 'agent' },
];
export const statuses: readonly { id: TaskStatus; name: string }[] = [
  { id: 'backlog', name: 'Backlog' }, { id: 'todo', name: 'To do' },
  { id: 'in_progress', name: 'In progress' }, { id: 'done', name: 'Done' }, { id: 'canceled', name: 'Canceled' },
];
export const labels = [{ id: 'design', name: 'Design' }, { id: 'engineering', name: 'Engineering' }, { id: 'research', name: 'Research' }];

/** Recreated per adapter/reset; never a shared mutable task store. */
export function createSeed(): { tasks: readonly DemoTask[]; sprints: readonly DemoSprint[] } {
  const titles = [
    'Sketch the daily work journey', 'Review task row metadata', 'Write a useful empty state',
    'Compare mobile status movement', 'Document sprint closure language', 'Retire the decorative dashboard concept',
    'Prepare keyboard review checklist', 'Keep agent attribution visible on a narrow screen',
    'Clarify the difference between creator and assignee', 'Check long task titles in list and detail without losing context or hiding essential actions',
    'Capture a small unassigned idea', 'Describe recoverable save failures', 'Review project naming',
    'Plan the next usability conversation', 'Check date-only field wording', 'Compare pending and confirmed feedback',
    'Collect fictional backlog examples', 'Review the prototype reset explanation',
  ];
  const taskStatuses: readonly TaskStatus[] = ['in_progress', 'todo', 'done', 'todo', 'done', 'canceled', 'todo', 'backlog', 'in_progress', 'backlog', 'backlog', 'todo', 'done', 'backlog', 'todo', 'canceled', 'backlog', 'todo'];
  const tasks = titles.map((title, index): DemoTask => {
    const authorIndex = index % 3;
    const creator = principals[authorIndex]!;
    const provenance: DemoProvenance = authorIndex === 0
      ? { mode: 'delegated', source: 'mcp', clientName: 'Cursor (demo)' }
      : authorIndex === 2 ? { mode: 'autonomous', source: 'mcp', clientName: 'Builder runner (demo)' }
        : { mode: 'human', source: 'web' };
    return {
      id: `demo-task-${index + 1}`, key: `RIE-${index + 1}`, workspaceId: workspace.id, projectId: project.id,
      title, description: index === 10 ? '' : 'Fictional sample content. Review this idea in the prototype; it is not a delivery commitment.',
      status: taskStatuses[index]!, priority: (['high', 'medium', 'low', 'urgent'] as const)[index % 4]!,
      // Deliberately different from creator: My tasks must never filter on authorship.
      assigneeId: index % 4 === 0 ? null : principals[(index + 1) % 3]!.id,
      createdByPrincipalId: creator.id, provenance,
      labelIds: index % 4 === 0 ? [] : [labels[index % labels.length]!.id],
      dueDate: index % 3 === 0 ? null : `2026-11-${String(2 + index).padStart(2, '0')}`,
      points: index % 4 === 0 ? null : [1, 2, 3, 5][index % 4]!,
      sprintId: index < 6 ? 'demo-sprint-1' : index < 8 ? 'demo-sprint-2' : null, version: 1,
    };
  });
  const sprints: readonly DemoSprint[] = [
    { id: 'demo-sprint-1', name: 'Clarity first', goal: 'Make daily task navigation understandable.', startsOn: '2026-11-02', endsOn: '2026-11-16', state: 'planned', closure: null },
    { id: 'demo-sprint-2', name: 'Review and refine', goal: 'Review the next set of fictional usability questions.', startsOn: '2026-11-16', endsOn: '2026-11-30', state: 'planned', closure: null },
  ];
  return { tasks, sprints };
}
