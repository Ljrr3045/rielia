import {
  isProject,
  isTask,
  type Project,
  type ProjectTaskCommand,
  type ProjectTaskResult,
  type ProjectVisibility,
  type Task,
  type TaskFields,
} from '@rielia/contracts';
import { copy, type Bilingual } from './strings';
export interface ProjectFormValue {
  name: string;
  key: string;
  description: string;
  visibility: ProjectVisibility;
}
export type FormState =
  | { kind: 'project-create'; workspaceId: string }
  | { kind: 'project-edit'; workspaceId: string; projectId: string; version: number }
  | { kind: 'project-access'; workspaceId: string; projectId: string }
  | { kind: 'task-edit'; workspaceId: string; projectId: string; taskId: string; version: number }
  | {
      kind: 'project-archive' | 'project-restore';
      workspaceId: string;
      projectId: string;
      version: number;
    }
  | {
      kind: 'task-archive' | 'task-restore';
      workspaceId: string;
      projectId: string;
      taskId: string;
      version: number;
    };

export const emptyProject: ProjectFormValue = {
  name: '',
  key: '',
  description: '',
  visibility: 'workspace',
};
export const emptyTask: TaskFields = {
  title: '',
  description: '',
  type: 'task',
  priority: 'none',
  status: 'backlog',
  assigneePrincipalId: null,
  dueDate: null,
};

export function taskFields(task: Task): TaskFields {
  return {
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status,
    assigneePrincipalId: task.assigneePrincipalId,
    dueDate: task.dueDate,
  };
}

export function commandMatches(
  command: ProjectTaskCommand,
  selection: { workspaceId: string | null; projectId: string | null; taskId: string | null },
): boolean {
  if (command.workspaceId !== selection.workspaceId) return false;
  if (!('projectId' in command)) return true;
  if (command.projectId !== selection.projectId) return false;
  if ('taskId' in command) return command.taskId === selection.taskId;
  return true;
}

export function isTaskResult(value: ProjectTaskResult): value is Task {
  return isTask(value);
}

export function isProjectResult(value: ProjectTaskResult): value is Project {
  return isProject(value);
}

export type LifecycleFormState = Extract<
  FormState,
  { kind: 'project-archive' | 'project-restore' | 'task-archive' | 'task-restore' }
>;

export function formCommandType(kind: LifecycleFormState['kind']): ProjectTaskCommand['type'] {
  switch (kind) {
    case 'project-archive':
      return 'archive-project';
    case 'project-restore':
      return 'restore-project';
    case 'task-archive':
      return 'archive-task';
    case 'task-restore':
      return 'restore-task';
  }
}

export function pendingCopy(type: ProjectTaskCommand['type']): Bilingual {
  switch (type) {
    case 'create-project':
      return copy.project.creating;
    case 'edit-project':
      return copy.common.saving;
    case 'archive-project':
      return copy.project.archiving;
    case 'restore-project':
      return copy.project.restoring;
    case 'create-task':
      return copy.task.capturing;
    case 'edit-task':
      return copy.common.saving;
    case 'archive-task':
      return copy.task.archiving;
    case 'restore-task':
      return copy.task.restoring;
  }
}

export function successCopy(type: ProjectTaskCommand['type']): Bilingual {
  switch (type) {
    case 'create-project':
      return copy.feedback.successCreatedProject;
    case 'edit-project':
      return copy.feedback.successUpdatedProject;
    case 'archive-project':
      return copy.feedback.successArchivedProject;
    case 'restore-project':
      return copy.feedback.successRestoredProject;
    case 'create-task':
      return copy.feedback.successCreatedTask;
    case 'edit-task':
      return copy.feedback.successUpdatedTask;
    case 'archive-task':
      return copy.feedback.successArchivedTask;
    case 'restore-task':
      return copy.feedback.successRestoredTask;
  }
}

export function modalTitle(form: FormState): Bilingual {
  switch (form.kind) {
    case 'project-create':
      return copy.project.createTitle;
    case 'project-edit':
      return copy.project.settingsTitle;
    case 'project-access':
      return copy.access.title;
    case 'task-edit':
      return copy.task.editTitle;
    case 'project-archive':
      return copy.project.archiveTitle;
    case 'project-restore':
      return copy.project.restore;
    case 'task-archive':
      return copy.task.archiveTitle;
    case 'task-restore':
      return copy.task.restore;
  }
}
