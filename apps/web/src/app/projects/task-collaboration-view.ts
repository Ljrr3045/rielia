import type {
  ProjectCommand,
  ProjectTaskCommand,
  TaskCollaborationCommand,
  CollaborationCollection,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
import type { CollaborationState } from '../../lib/task-collaboration-state';

export interface CollaborationMutationView {
  mutationPending: ProjectCommand['type'] | null;
  collaborationDraft: TaskCollaborationCommand | null;
  collaborationRetryTarget: TaskCollaborationCommand | null;
  draftGuard: ProjectTaskState['draftGuard'];
  refresh: () => Promise<void>;
}
export interface TaskRelationsPort extends CollaborationMutationView {
  collaboration: Pick<CollaborationState, 'relations' | 'parent-candidates'>;
  draft: ProjectTaskCommand | null;
  retryTarget: ProjectTaskCommand | null;
  setParentCandidatesWanted: (wanted: boolean) => Promise<void>;
  loadCollaborationMore: (collection: 'relations' | 'parent-candidates') => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
}
export interface TaskChecklistPort extends CollaborationMutationView {
  collaboration: Pick<CollaborationState, 'checklist'>;
  loadCollaborationMore: (collection: 'checklist') => Promise<void>;
}
export interface TaskCommentsPort extends CollaborationMutationView {
  collaboration: Pick<CollaborationState, 'comments'>;
  loadCollaborationMore: (collection: 'comments') => Promise<void>;
}
export interface TaskHistoryPort {
  collaboration: Pick<CollaborationState, 'history'>;
  mutationPending: ProjectCommand['type'] | null;
  loadCollaborationMore: (collection: 'history') => Promise<void>;
  refresh: () => Promise<void>;
}
export interface TaskCollaborationPort extends CollaborationMutationView {
  collaboration: CollaborationState;
  draft: ProjectTaskCommand | null;
  retryTarget: ProjectTaskCommand | null;
  collaborationPending: ProjectCommand['type'] | null;
  closeWarning: ProjectTaskState['closeWarning'];
  commentConflict: ProjectTaskState['commentConflict'];
  checklistConflict: ProjectTaskState['checklistConflict'];
  outcome: ProjectTaskState['outcome'];
  conflict: ProjectTaskState['conflict'];
  result: ProjectTaskState['result'];
  task: ProjectTaskState['task'];
  tasks: ProjectTaskState['tasks'];
  taskColumns: ProjectTaskState['taskColumns'];
  selectTask: (taskId: string | null) => Promise<void>;
  returnToDraft: () => Promise<void>;
  rebaseDraft: () => void;
  dismissOutcome: () => void;
  setParentCandidatesWanted: (wanted: boolean) => Promise<void>;
  loadCollaborationMore: (collection: CollaborationCollection) => Promise<void>;
}
