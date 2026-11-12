'use client';
import { useState, useRef } from 'react';
import type { Dispatch, SetStateAction, RefObject } from 'react';
import {
  type ArchiveView,
  type Task,
  type TaskFields,
  type TaskStatus,
  type ProjectCommand,
  type ProjectTaskCommand,
  type ProjectPolicyCommand,
  type ProjectMoveCommand,
  type TaskCollaborationCommand,
} from '@rielia/contracts';
import type { MoveEligibility, ProjectTaskState } from '../../lib/project-task-controller';
import {
  emptyProject,
  emptyTask,
  taskFields,
  commandMatches,
  type FormState,
  type ProjectFormValue,
} from './project-content-model';
export interface ProjectContentFormsPorts {
  blocked: boolean;
  mutationPending: ProjectCommand['type'] | null;
  canArchiveProject: boolean;
  canCapture: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canManageAccess: boolean;
  canRestoreProject: boolean;
  captureRef: RefObject<HTMLInputElement | null>;
  collaborationDraft: TaskCollaborationCommand | null;
  discardDraft: () => void;
  dismissOutcome: () => void;
  draft: ProjectTaskCommand | null;
  focusViewBar: () => void;
  lastCommandRef: RefObject<ProjectTaskCommand | null>;
  lastOutcomeSourceRef: RefObject<'content' | 'policy' | 'move' | 'collaboration'>;
  moveDraft: ProjectMoveCommand | null;
  policyDraft: ProjectPolicyCommand | null;
  policyRetryTarget: ProjectPolicyCommand | null;
  project: ProjectTaskState['project'];
  projectArchived: boolean;
  projectHeadingRef: RefObject<HTMLHeadingElement | null>;
  projects: ProjectTaskState['projects'];
  rebaseDraft: () => void;
  returnToDraft: () => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  selection: ProjectTaskState['selection'];
  setMoveFocusId: Dispatch<SetStateAction<string | null>>;
  setMoveNotice: Dispatch<
    SetStateAction<{
      reason: Exclude<MoveEligibility, 'ready'>;
      taskId: string;
    } | null>
  >;
  setView: (collection: 'projects' | 'tasks', view: ArchiveView) => Promise<void>;
  stage: (command: ProjectCommand) => void;
  status: ProjectTaskState['status'];
  submit: () => Promise<void>;
  task: ProjectTaskState['task'];
  taskView: ProjectTaskState['taskView'];
  tasks: ProjectTaskState['tasks'];
  views: ProjectTaskState['views'];
  workspace: ProjectTaskState['workspace'];
}

export function useProjectContentForms({
  blocked,
  mutationPending,
  canArchiveProject,
  canCapture,
  canCreateProject,
  canEditProject,
  canManageAccess,
  canRestoreProject,
  captureRef,
  collaborationDraft,
  discardDraft,
  dismissOutcome,
  draft,
  focusViewBar,
  lastCommandRef,
  lastOutcomeSourceRef,
  moveDraft,
  policyDraft,
  policyRetryTarget,
  project,
  projectArchived,
  projectHeadingRef,
  projects,
  rebaseDraft,
  returnToDraft,
  selectTask,
  selection,
  setMoveFocusId,
  setMoveNotice,
  setView,
  stage,
  status,
  submit,
  task,
  taskView,
  tasks,
  views,
  workspace,
}: ProjectContentFormsPorts) {
  const [form, setForm] = useState<FormState | null>(null);

  const [projectValue, setProjectValue] = useState<ProjectFormValue>(emptyProject);

  const [taskValue, setTaskValue] = useState<TaskFields>(emptyTask);

  const [captureTitle, setCaptureTitle] = useState('');

  const [captureStatus, setCaptureStatus] = useState<TaskStatus>('backlog');

  const [columnCaptureOpen, setColumnCaptureOpen] = useState(false);

  const [resumeDraftOnReady, setResumeDraftOnReady] = useState(false);

  const [resumeAccessOnReady, setResumeAccessOnReady] = useState(false);

  const modalOpenerRef = useRef<HTMLElement | null>(null);

  const dismissFocusPendingRef = useRef(false);

  function canResume(command: ProjectTaskCommand): boolean {
    if (!commandMatches(command, selection) || mutationPending !== null) return false;
    if (command.type === 'create-project')
      return (status === 'ready' || status === 'empty') && workspace !== null && canCreateProject;
    if (status !== 'ready' || project === null || project.id !== selection.projectId) return false;
    if (command.type === 'edit-project') return canEditProject;
    if (command.type === 'archive-project') return canArchiveProject;
    if (command.type === 'restore-project') return canRestoreProject;
    if (command.type === 'create-task') return canCapture;
    if ('taskId' in command) {
      const target =
        task?.id === command.taskId
          ? task
          : tasks?.items.find((item) => item.id === command.taskId);
      if (!target) return false;
      if (command.type === 'archive-task') return target.capabilities.canArchive;
      if (command.type === 'restore-task') return target.capabilities.canRestore;
      return !projectArchived && target.capabilities.canEdit && target.archivedAt === null;
    }
    return false;
  }

  const formAuthorized = (() => {
    if (form === null || form.workspaceId !== selection.workspaceId) return false;
    if (form.kind === 'project-create') return canCreateProject;
    if (project === null || project.id !== form.projectId || project.id !== selection.projectId)
      return false;
    switch (form.kind) {
      case 'project-edit':
        return canEditProject;
      case 'project-access':
        return canManageAccess;
      case 'project-archive':
        return canArchiveProject;
      case 'project-restore':
        return canRestoreProject;
      default:
        if (task === null || task.id !== form.taskId || task.id !== selection.taskId) return false;
        return form.kind === 'task-edit'
          ? task.capabilities.canEdit && task.archivedAt === null && !projectArchived
          : form.kind === 'task-restore'
            ? task.capabilities.canRestore
            : task.capabilities.canArchive;
    }
  })();

  const canResumeDraft = draft !== null && canResume(draft);

  function resumeDraft(command: ProjectTaskCommand) {
    // Only current authorized DTOs may rehydrate a memory-local draft.
    if (!canResume(command)) return;
    dismissOutcome();
    // Resumed forms must not reuse a previous modal opener. Never restore
    // focus to a control left behind by a previously closed modal.
    modalOpenerRef.current = null;
    if (command.type === 'create-project') {
      setProjectValue({
        name: command.name,
        key: command.key,
        description: command.description ?? '',
        visibility: command.visibility ?? 'workspace',
      });
      setForm({ kind: 'project-create', workspaceId: command.workspaceId });
      return;
    }
    if (command.type === 'edit-project') {
      const key =
        project?.id === command.projectId
          ? project.key
          : (projects?.items.find((item) => item.id === command.projectId)?.key ?? '');
      const visibility =
        project?.id === command.projectId
          ? project.visibility
          : (projects?.items.find((item) => item.id === command.projectId)?.visibility ??
            'workspace');
      setProjectValue({ name: command.name, key, description: command.description, visibility });
      setForm({
        kind: 'project-edit',
        workspaceId: command.workspaceId,
        projectId: command.projectId,
        version: command.expectedVersion,
      });
      return;
    }
    if (command.type === 'edit-task') {
      const target =
        task?.id === command.taskId
          ? task
          : tasks?.items.find((item) => item.id === command.taskId);
      if (target === undefined || target === null) return;
      setTaskValue({ ...taskFields(target), ...command.fields });
      setForm({
        kind: 'task-edit',
        workspaceId: command.workspaceId,
        projectId: command.projectId,
        taskId: command.taskId,
        version: command.expectedVersion,
      });
      return;
    }
    if (command.type === 'archive-project' || command.type === 'restore-project') {
      setForm({
        kind: command.type === 'archive-project' ? 'project-archive' : 'project-restore',
        workspaceId: command.workspaceId,
        projectId: command.projectId,
        version: command.expectedVersion,
      });
      return;
    }
    if (command.type === 'archive-task' || command.type === 'restore-task') {
      setForm({
        kind: command.type === 'archive-task' ? 'task-archive' : 'task-restore',
        workspaceId: command.workspaceId,
        projectId: command.projectId,
        taskId: command.taskId,
        version: command.expectedVersion,
      });
      return;
    }
    if (command.type === 'create-task') {
      setCaptureTitle(command.fields.title ?? '');
      requestAnimationFrame(() => captureRef.current?.focus());
    }
  }

  function rememberOpener(opener?: HTMLElement) {
    if (opener !== undefined) modalOpenerRef.current = opener;
    else if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
    ) {
      modalOpenerRef.current = document.activeElement;
    }
  }

  function focusDismissedSurface(hadForm: boolean) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (hadForm) {
          const opener = modalOpenerRef.current;
          if (opener !== null && opener.isConnected && !opener.matches('[disabled]')) {
            opener.focus();
            if (document.activeElement === opener) return;
          }
        }
        const detailHeading = document.querySelector<HTMLElement>('[data-detail-heading]');
        const fallback =
          detailHeading ?? projectHeadingRef.current ?? document.getElementById('projects-main');
        fallback?.focus();
      }),
    );
  }

  function closeForm() {
    dismissFocusPendingRef.current = true;
    setForm(null);
  }

  function openProjectCreate(opener?: HTMLElement) {
    if (
      !workspace ||
      !canCreateProject ||
      blocked ||
      policyDraft !== null ||
      moveDraft !== null ||
      collaborationDraft !== null
    )
      return;
    if (draft !== null && draft.type !== 'create-project') return;
    rememberOpener(opener);
    const value =
      draft?.type === 'create-project'
        ? {
            name: draft.name,
            key: draft.key,
            description: draft.description ?? '',
            visibility: draft.visibility ?? 'workspace',
          }
        : emptyProject;
    setProjectValue(value);
    setForm({ kind: 'project-create', workspaceId: workspace.id });
    dismissOutcome();
  }

  function openProjectSettings(opener?: HTMLElement) {
    if (
      !project ||
      !canEditProject ||
      blocked ||
      policyDraft !== null ||
      moveDraft !== null ||
      collaborationDraft !== null
    )
      return;
    if (draft !== null && !(draft.type === 'edit-project' && draft.projectId === project.id))
      return;
    rememberOpener(opener);
    const value =
      draft?.type === 'edit-project'
        ? {
            name: draft.name,
            key: project.key,
            description: draft.description,
            visibility: project.visibility,
          }
        : {
            name: project.name,
            key: project.key,
            description: project.description,
            visibility: project.visibility,
          };
    setProjectValue(value);
    setForm({
      kind: 'project-edit',
      workspaceId: project.workspaceId,
      projectId: project.id,
      version: project.version,
    });
    dismissOutcome();
  }

  function openProjectAccess(opener?: HTMLElement) {
    if (
      !project ||
      !canManageAccess ||
      blocked ||
      draft !== null ||
      moveDraft !== null ||
      policyDraft !== null ||
      collaborationDraft !== null
    )
      return;
    rememberOpener(opener);
    setForm({ kind: 'project-access', workspaceId: project.workspaceId, projectId: project.id });
    dismissOutcome();
  }

  function openTaskEdit(opener?: HTMLElement) {
    if (
      !task ||
      blocked ||
      policyDraft !== null ||
      moveDraft !== null ||
      collaborationDraft !== null ||
      !task.capabilities.canEdit ||
      task.archivedAt !== null ||
      projectArchived
    )
      return;
    if (draft !== null && !(draft.type === 'edit-task' && draft.taskId === task.id)) return;
    rememberOpener(opener);
    const value =
      draft?.type === 'edit-task' ? { ...taskFields(task), ...draft.fields } : taskFields(task);
    setTaskValue(value);
    setForm({
      kind: 'task-edit',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      version: task.version,
    });
    dismissOutcome();
  }

  function requestProjectArchive(restore: boolean, opener?: HTMLElement) {
    if (
      !project ||
      blocked ||
      draft !== null ||
      policyDraft !== null ||
      moveDraft !== null ||
      collaborationDraft !== null
    )
      return;
    if (restore ? !canRestoreProject : !canArchiveProject) return;
    rememberOpener(opener);
    setForm({
      kind: restore ? 'project-restore' : 'project-archive',
      workspaceId: project.workspaceId,
      projectId: project.id,
      version: project.version,
    });
    dismissOutcome();
  }

  async function requestTaskArchive(
    restore: boolean,
    target: Task | null = task,
    opener?: HTMLElement,
  ) {
    if (
      !target ||
      blocked ||
      draft !== null ||
      policyDraft !== null ||
      moveDraft !== null ||
      collaborationDraft !== null
    )
      return;
    if (restore ? !target.capabilities.canRestore : !target.capabilities.canArchive) return;
    rememberOpener(opener);
    if (selection.taskId !== target.id) await selectTask(target.id);
    setForm({
      kind: restore ? 'task-restore' : 'task-archive',
      workspaceId: target.workspaceId,
      projectId: target.projectId,
      taskId: target.id,
      version: target.version,
    });
    dismissOutcome();
  }

  function stageProject(fields: Partial<ProjectFormValue>) {
    if (!form || blocked) return;
    const next = { ...projectValue, ...fields };
    setProjectValue(next);
    if (form.kind === 'project-create') {
      stage({
        type: 'create-project',
        workspaceId: form.workspaceId,
        name: next.name,
        key: next.key,
        description: next.description,
        visibility: next.visibility,
      });
    } else if (form.kind === 'project-edit') {
      stage({
        type: 'edit-project',
        workspaceId: form.workspaceId,
        projectId: form.projectId,
        expectedVersion: form.version,
        name: next.name,
        description: next.description,
      });
    }
  }

  function stageTask(fields: Partial<TaskFields>) {
    if (!form || form.kind !== 'task-edit' || blocked) return;
    const next = { ...taskValue, ...fields };
    setTaskValue(next);
    stage({
      type: 'edit-task',
      workspaceId: form.workspaceId,
      projectId: form.projectId,
      taskId: form.taskId,
      expectedVersion: form.version,
      fields: next,
    });
  }

  function captureTargetStatus(): TaskStatus {
    if (draft?.type === 'create-task' && draft.projectId === project?.id)
      return draft.fields.status ?? captureStatus;
    return taskView.layout === 'list' ? (taskView.filters.status ?? 'backlog') : captureStatus;
  }

  function stageCapture(title: string) {
    setCaptureTitle(title);
    if (!canCapture || !project || blocked) return;
    stage({
      type: 'create-task',
      workspaceId: project.workspaceId,
      projectId: project.id,
      fields: { title, status: captureTargetStatus() },
    });
  }

  function beginColumnCapture(status: TaskStatus) {
    if (!canCapture || blocked || draft !== null || collaborationDraft !== null) return;
    setCaptureStatus(status);
    setCaptureTitle('');
    setColumnCaptureOpen(true);
  }

  function cancelColumnCapture() {
    if (draft?.type === 'create-task') discardDraft();
    setColumnCaptureOpen(false);
    setCaptureTitle('');
    requestAnimationFrame(() => {
      const heading = [...document.querySelectorAll<HTMLElement>('[data-column-heading]')].find(
        (element) => element.dataset.columnHeading === captureStatus,
      );
      if (heading !== undefined) heading.focus();
      else focusViewBar();
    });
  }

  function submitColumnCapture() {
    submitCapture();
  }

  function submitProjectForm() {
    if (!form || blocked) return;
    if (form.kind === 'project-create') {
      const command: ProjectTaskCommand = {
        type: 'create-project',
        workspaceId: form.workspaceId,
        name: projectValue.name.trim(),
        key: projectValue.key.trim(),
        description: projectValue.description,
        visibility: projectValue.visibility,
      };
      lastOutcomeSourceRef.current = 'content';
      stage(command);
      lastCommandRef.current = command;
      void submit();
      return;
    }
    if (form.kind === 'project-edit') {
      const command: ProjectTaskCommand = {
        type: 'edit-project',
        workspaceId: form.workspaceId,
        projectId: form.projectId,
        expectedVersion: form.version,
        name: projectValue.name.trim(),
        description: projectValue.description,
      };
      lastOutcomeSourceRef.current = 'content';
      stage(command);
      lastCommandRef.current = command;
      void submit();
    }
  }

  function submitTaskForm() {
    if (!form || form.kind !== 'task-edit' || blocked) return;
    const command: ProjectTaskCommand = {
      type: 'edit-task',
      workspaceId: form.workspaceId,
      projectId: form.projectId,
      taskId: form.taskId,
      expectedVersion: form.version,
      fields: { ...taskValue, title: taskValue.title.trim() },
    };
    lastOutcomeSourceRef.current = 'content';
    stage(command);
    lastCommandRef.current = command;
    void submit();
  }

  function submitCapture() {
    if (!project || !canCapture || blocked) return;
    const title = captureTitle.trim();
    if (title.length === 0) return;
    const command: ProjectTaskCommand = {
      type: 'create-task',
      workspaceId: project.workspaceId,
      projectId: project.id,
      fields: { title, status: captureTargetStatus() },
    };
    lastOutcomeSourceRef.current = 'content';
    stage(command);
    lastCommandRef.current = command;
    void submit();
  }

  function confirmLifecycle() {
    if (!form || blocked) return;
    let command: ProjectTaskCommand | null = null;
    if (form.kind === 'project-archive' || form.kind === 'project-restore') {
      command = {
        type: form.kind === 'project-archive' ? 'archive-project' : 'restore-project',
        workspaceId: form.workspaceId,
        projectId: form.projectId,
        expectedVersion: form.version,
      };
    } else if (form.kind === 'task-archive' || form.kind === 'task-restore') {
      command = {
        type: form.kind === 'task-archive' ? 'archive-task' : 'restore-task',
        workspaceId: form.workspaceId,
        projectId: form.projectId,
        taskId: form.taskId,
        expectedVersion: form.version,
      };
    }
    if (command === null) return;
    lastOutcomeSourceRef.current = 'content';
    stage(command);
    lastCommandRef.current = command;
    void submit();
  }

  function focusFormStart() {
    requestAnimationFrame(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const target = dialog?.querySelector<HTMLElement>('[data-autofocus]');
      target?.focus();
    });
  }

  function keepDraftAfterConflict() {
    rebaseDraft();
    focusFormStart();
  }

  function discardCurrentDraft() {
    const hadForm = form !== null;
    if (hadForm) dismissFocusPendingRef.current = true;
    else focusDismissedSurface(false);
    discardDraft();
    setForm(null);
    setCaptureTitle('');
    setColumnCaptureOpen(false);
    setMoveNotice(null);
    setMoveFocusId(null);
    setResumeDraftOnReady(false);
    setResumeAccessOnReady(false);
  }

  function discardPolicyDraft() {
    discardDraft();
    setResumeAccessOnReady(false);
    requestAnimationFrame(() => {
      const fallback = projectHeadingRef.current ?? document.getElementById('projects-main');
      fallback?.focus();
    });
  }

  function handlePolicyResume() {
    const command = policyDraft ?? policyRetryTarget;
    if (command === null) return;
    if (
      command.workspaceId === selection.workspaceId &&
      command.projectId === selection.projectId &&
      status === 'ready'
    ) {
      modalOpenerRef.current = null;
      setForm({
        kind: 'project-access',
        workspaceId: command.workspaceId,
        projectId: command.projectId,
      });
      return;
    }
    setResumeAccessOnReady(true);
    void returnToDraft();
  }

  function handleReturnToDraft() {
    if (draft?.type === 'create-project' && views.projects !== 'active') {
      void setView('projects', 'active').then(() => {
        setResumeDraftOnReady(true);
        void returnToDraft();
      });
      return;
    }
    if (draft?.type === 'create-task' && views.tasks !== 'active') {
      void setView('tasks', 'active').then(() => {
        setResumeDraftOnReady(true);
        void returnToDraft();
      });
      return;
    }
    setResumeDraftOnReady(true);
    void returnToDraft();
  }

  function resumeCurrentDraft() {
    if (draft === null) return;
    if (commandMatches(draft, selection)) resumeDraft(draft);
    else handleReturnToDraft();
  }
  return {
    canResumeDraft,
    formAuthorized,
    form,
    setForm,
    projectValue,
    taskValue,
    captureTitle,
    setCaptureTitle,
    captureStatus,
    setCaptureStatus,
    columnCaptureOpen,
    setColumnCaptureOpen,
    resumeDraftOnReady,
    setResumeDraftOnReady,
    resumeAccessOnReady,
    setResumeAccessOnReady,
    modalOpenerRef,
    dismissFocusPendingRef,
    resumeDraft,
    focusDismissedSurface,
    closeForm,
    openProjectCreate,
    openProjectSettings,
    openProjectAccess,
    openTaskEdit,
    requestProjectArchive,
    requestTaskArchive,
    stageProject,
    stageTask,
    stageCapture,
    beginColumnCapture,
    cancelColumnCapture,
    submitColumnCapture,
    submitProjectForm,
    submitTaskForm,
    submitCapture,
    confirmLifecycle,
    keepDraftAfterConflict,
    discardCurrentDraft,
    discardPolicyDraft,
    handlePolicyResume,
    handleReturnToDraft,
    resumeCurrentDraft,
  };
}
