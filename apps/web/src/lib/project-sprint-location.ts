export interface ProjectSprintLocation {
  view: 'tasks' | 'sprints';
  sprintId: string | null;
}
const id = (value: string | null): value is string =>
  value !== null && /^[A-Za-z0-9_-]{1,128}$/.test(value);

/** Additive to the existing project/task URL; task filters/layout and detail return are retained. */
export function readProjectSprintLocation(search: string): ProjectSprintLocation | null {
  const query = new URLSearchParams(search);
  const view = query.get('projectView') ?? 'tasks';
  const sprintId = query.get('sprint');
  if (
    ['workspace', 'project', 'projectView', 'sprint', 'taskScope'].some(
      (key) => query.getAll(key).length > 1,
    ) ||
    !['tasks', 'sprints'].includes(view) ||
    (sprintId !== null && !id(sprintId)) ||
    (view === 'tasks' && sprintId !== null) ||
    (view === 'sprints' &&
      (!id(query.get('workspace')) ||
        !id(query.get('project')) ||
        (query.get('taskScope') ?? 'project') !== 'project'))
  )
    return null;
  return { view: view as ProjectSprintLocation['view'], sprintId };
}

/** Produces a real href for native modified-link behavior; it never navigates or writes. */
export function writeProjectSprintLocation(
  href: string,
  selection: ProjectSprintLocation,
): string | null {
  const url = new URL(href, 'https://location.invalid');
  if (url.origin !== 'https://location.invalid' || url.pathname !== '/projects') return null;
  url.searchParams.delete('projectView');
  url.searchParams.delete('sprint');
  if (selection.view === 'sprints') {
    url.searchParams.set('projectView', 'sprints');
    if (selection.sprintId !== null) url.searchParams.set('sprint', selection.sprintId);
  } else if (selection.view !== 'tasks' || selection.sprintId !== null) return null;
  if (!readProjectSprintLocation(url.search)) return null;
  return url.pathname + url.search + url.hash;
}
