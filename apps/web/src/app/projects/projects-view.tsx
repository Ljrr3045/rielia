'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  isProject,
  isTask,
  taskStatuses,
  type DomainPerson,
  type Project,
  type ProjectAccessMember,
  type ProjectCommand,
  type ProjectMoveCommand,
  type ProjectPolicyCommand,
  type ProjectTaskCommand,
  type ProjectTaskResult,
  type ProjectVisibility,
  type Task,
  type TaskDiscoveryItem,
  type TaskFields,
  type TaskStatus,
} from '@rielia/contracts';
import type { MoveEligibility } from '../../lib/project-task-controller';
import { useProjectTasks } from '../../lib/use-project-tasks';
import { ConflictPanel, FeedbackPanel, type ConflictFieldView } from './feedback';
import { ProjectAccessPanel, projectPolicyConflictFields } from './project-access';
import { ProjectForm, type ProjectFormValue } from './project-forms';
import {
  Badge,
  ConfirmBox,
  EmptyState,
  IconAlert,
  IconArchive,
  IconChevron,
  IconClose,
  IconMenu,
  IconPlus,
  IconProject,
  IconRestore,
  IconSearch,
  IconSettings,
  IconTask,
  IconUsers,
  LocaleProvider,
  ModalFrame,
  StateCard,
  cx,
  useBodyScrollLock,
  useFocusTrap,
  useIsDetailOverlay,
  useIsNarrow,
  useIsSidebarDrawer,
} from './project-ui';
import { TaskBoard } from './task-board';
import { TaskCaptureForm, TaskEditForm } from './task-forms';
import { TaskDetail } from './task-detail';
import { TaskCreateShortcut, TaskDiscoveryBar, TaskDiscoveryList, LiveUpdateNotice } from './task-discovery';
import { TaskCollaboration } from './task-collaboration';
import { TaskDescription } from './task-description';
import { TaskList } from './task-list';
import { TaskViewBar } from './task-view-bar';
import {
  copy,
  formatDateOnly,
  priorityName,
  projectTaskCount,
  statusName,
  typeName,
  visibilityName,
  type Bilingual,
  type Lang,
} from './strings';
import styles from './projects.module.css';

type FormState =
  | { kind: 'project-create'; workspaceId: string }
  | { kind: 'project-edit'; workspaceId: string; projectId: string; version: number }
  | { kind: 'project-access'; workspaceId: string; projectId: string }
  | { kind: 'task-edit'; workspaceId: string; projectId: string; taskId: string; version: number }
  | { kind: 'project-archive' | 'project-restore'; workspaceId: string; projectId: string; version: number }
  | { kind: 'task-archive' | 'task-restore'; workspaceId: string; projectId: string; taskId: string; version: number };

const emptyProject: ProjectFormValue = { name: '', key: '', description: '', visibility: 'workspace' };
const emptyTask: TaskFields = {
  title: '',
  description: '',
  type: 'task',
  priority: 'none',
  status: 'backlog',
  assigneePrincipalId: null,
  dueDate: null,
};

function taskFields(task: Task): TaskFields {
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

function commandMatches(command: ProjectTaskCommand, selection: { workspaceId: string | null; projectId: string | null; taskId: string | null }): boolean {
  if (command.workspaceId !== selection.workspaceId) return false;
  if (!('projectId' in command)) return true;
  if (command.projectId !== selection.projectId) return false;
  if ('taskId' in command) return command.taskId === selection.taskId;
  return true;
}

function isTaskResult(value: ProjectTaskResult): value is Task {
  return isTask(value);
}

function isProjectResult(value: ProjectTaskResult): value is Project {
  return isProject(value);
}

type LifecycleFormState = Extract<FormState, { kind: 'project-archive' | 'project-restore' | 'task-archive' | 'task-restore' }>;

function formCommandType(kind: LifecycleFormState['kind']): ProjectTaskCommand['type'] {
  switch (kind) {
    case 'project-archive': return 'archive-project';
    case 'project-restore': return 'restore-project';
    case 'task-archive': return 'archive-task';
    case 'task-restore': return 'restore-task';
  }
}

function pendingCopy(type: ProjectTaskCommand['type']): Bilingual {
  switch (type) {
    case 'create-project': return copy.project.creating;
    case 'edit-project': return copy.common.saving;
    case 'archive-project': return copy.project.archiving;
    case 'restore-project': return copy.project.restoring;
    case 'create-task': return copy.task.capturing;
    case 'edit-task': return copy.common.saving;
    case 'archive-task': return copy.task.archiving;
    case 'restore-task': return copy.task.restoring;
  }
}

function successCopy(type: ProjectTaskCommand['type']): Bilingual {
  switch (type) {
    case 'create-project': return copy.feedback.successCreatedProject;
    case 'edit-project': return copy.feedback.successUpdatedProject;
    case 'archive-project': return copy.feedback.successArchivedProject;
    case 'restore-project': return copy.feedback.successRestoredProject;
    case 'create-task': return copy.feedback.successCreatedTask;
    case 'edit-task': return copy.feedback.successUpdatedTask;
    case 'archive-task': return copy.feedback.successArchivedTask;
    case 'restore-task': return copy.feedback.successRestoredTask;
  }
}

export function ProjectsView() {
  const [lang, setLang] = useState<Lang>('es');
  return (
    <LocaleProvider lang={lang}>
      <ProjectsScreen lang={lang} onLanguage={setLang} />
    </LocaleProvider>
  );
}

function ProjectsScreen({ lang, onLanguage }: { lang: Lang; onLanguage: (lang: Lang) => void }) {
  const projectTasks = useProjectTasks();
  const {
    status, workspaces, workspace, projects, project, tasks, task,
    taskScope, searchQuery, discoveryProjectId, discovery, discoveryFocusTaskId, discoveryContextLimitReached,
    streamStatus, refreshRequired, refreshDeferred, workspaceNavigation,
    taskView, taskColumns, taskColumnErrors, taskColumnsChanged, taskSummary, selectedTaskAssignee, taskFilterAssigneeStatus,
    selection, views, draft, pending, outcome, retryTarget, conflict, result, pageError,
    moveDraft, movePending, moveRetryTarget, moveNeedsDestination,
    projectAccess, assignees, policyPageErrors, accessConflict,
    policyDraft, policyPending, policyRetryTarget,
    closeWarning, draftGuard, mutationPending, collaborationDraft, collaborationRetryTarget,
    refresh, selectWorkspace, selectProject, selectTask, setView,
    setTaskScope, setSearchQuery, setDiscoveryProject, loadDiscoveryMore, openDiscoveryTask, returnToDiscovery, resolveWorkspaceNavigation,
    setTaskLayout, setTaskFilters, setTaskColumn, loadMore, loadTaskColumn, stageMove,
    stage, submit, retrySave, discardDraft, returnToDraft, reloadConflict, rebaseDraft, dismissOutcome, dismissPageError,
    setParentCandidatesWanted, acknowledgeClose,
  } = projectTasks;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [projectValue, setProjectValue] = useState<ProjectFormValue>(emptyProject);
  const [taskValue, setTaskValue] = useState<TaskFields>(emptyTask);
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureStatus, setCaptureStatus] = useState<TaskStatus>('backlog');
  const [columnCaptureOpen, setColumnCaptureOpen] = useState(false);
  const [moveNotice, setMoveNotice] = useState<{ reason: Exclude<MoveEligibility, 'ready'>; taskId: string } | null>(null);
  const [moveFocusId, setMoveFocusId] = useState<string | null>(null);
  const moveFocusCancelledRef = useRef(false);
  const [createFocusId, setCreateFocusId] = useState<string | null>(null);
  const [resumeDraftOnReady, setResumeDraftOnReady] = useState(false);
  const [resumeAccessOnReady, setResumeAccessOnReady] = useState(false);
  const [captureFocusProjectId, setCaptureFocusProjectId] = useState<string | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const projectHeadingRef = useRef<HTMLHeadingElement>(null);
  const discoveryHeadingRef = useRef<HTMLHeadingElement>(null);
  const discoveryReturnRef = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const drawerOpenerRef = useRef<HTMLElement | null>(null);
  const modalOpenerRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lastCommandRef = useRef<ProjectTaskCommand | null>(null);
  const lastPolicyCommandRef = useRef<ProjectPolicyCommand | null>(null);
  const lastPolicyMemberRef = useRef<ProjectAccessMember | null>(null);
  const lastOutcomeSourceRef = useRef<'content' | 'policy' | 'move' | 'collaboration'>('content');
  const hadDetailRef = useRef(false);
  const dismissFocusPendingRef = useRef(false);

  const sidebarDrawer = useIsSidebarDrawer();
  const detailOverlay = useIsDetailOverlay();
  const narrow = useIsNarrow();
  const detailOpen = task !== null && selection.taskId !== null;
  const overlayOpen = detailOverlay && detailOpen;
  const contentBlocked = pending !== null || retryTarget !== null;
  const policyBlocked = policyPending !== null || policyRetryTarget !== null;
  const moveBlocked = movePending !== null || moveRetryTarget !== null;
  const blocked = contentBlocked || policyBlocked || moveBlocked || mutationPending !== null;
  const anyPending = mutationPending !== null;
  const anyDraft = draft !== null || moveDraft !== null || policyDraft !== null || collaborationDraft !== null;
  const activeProjectId = project?.id ?? selection.projectId;
  const projectArchived = project?.archivedAt != null;
  const canCreateProject = projects?.capabilities.canCreate === true && views.projects === 'active';
  const canCreatePrivate = projects?.capabilities.canCreatePrivate === true;
  const canCapture = taskSummary.canCreate
    && project !== null
    && !projectArchived
    && project.capabilities.canEdit
    && views.tasks === 'active'
    && !blocked
    && policyDraft === null
    && moveDraft === null
    && collaborationDraft === null
    && (draft === null || draft.type === 'create-task');
  const readOnlyTasks = views.tasks === 'archived' || projectArchived || project?.capabilities.canEdit !== true;
  const filtersActive = Object.keys(taskView.filters).length > 0;
  const taskPageChanged = pageError?.collection === 'tasks' && pageError.reason === 'changed';
  const taskPagePartial = pageError?.collection === 'tasks' && pageError.reason !== 'changed';
  const pendingTaskId = movePending !== null ? (moveDraft?.taskId ?? moveRetryTarget?.taskId ?? null) : null;
  const moveSource = lastOutcomeSourceRef.current === 'move';
  const moveCommand: ProjectMoveCommand | null = moveDraft ?? moveRetryTarget;
  const moveTaskId = moveCommand?.taskId
    ?? (moveSource && result !== null && isTaskResult(result) ? result.id : null)
    ?? (moveNeedsDestination && conflict !== null && isTask(conflict) ? conflict.id : null);
  const moveRetryMatches = moveRetryTarget === null
    ? true
    : moveRetryTarget.workspaceId === selection.workspaceId
      && moveRetryTarget.projectId === selection.projectId
      && (selection.taskId === null || selection.taskId === moveRetryTarget.taskId);
  const moveDraftMatches = moveDraft === null
    ? true
    : moveDraft.workspaceId === selection.workspaceId
      && moveDraft.projectId === selection.projectId
      && (selection.taskId === null || selection.taskId === moveDraft.taskId);

  function findTaskById(taskId: string): Task | null {
    if (task?.id === taskId) return task;
    const listed = tasks?.items.find(item => item.id === taskId);
    if (listed !== undefined) return listed;
    for (const page of Object.values(taskColumns)) {
      const found = page?.items.find(item => item.id === taskId);
      if (found !== undefined) return found;
    }
    if (conflict !== null && isTask(conflict) && conflict.id === taskId) return conflict;
    if (result !== null && isTaskResult(result) && result.id === taskId) return result;
    return null;
  }

  function taskStatusInDom(taskId: string): TaskStatus | null {
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')]
      .find(element => element.dataset.taskId === taskId);
    if (row === undefined) return null;
    const selected = row.querySelector<HTMLSelectElement>('select')?.value;
    if (selected !== undefined && taskStatuses.includes(selected as TaskStatus)) return selected as TaskStatus;
    const marker = row.closest('section')?.querySelector<HTMLElement>('[data-column-heading], [data-task-group]');
    const value = marker?.dataset.columnHeading ?? marker?.dataset.taskGroup;
    return value !== undefined && taskStatuses.includes(value as TaskStatus) ? value as TaskStatus : null;
  }

  function taskRowIsCanonical(taskId: string, status: TaskStatus, orderVersion: number): boolean {
    if (taskStatusInDom(taskId) !== status) return false;
    const pageVersion = taskView.layout === 'board' ? taskColumns[status]?.orderVersion : tasks?.orderVersion;
    return pageVersion !== undefined && pageVersion >= orderVersion;
  }

  function shouldRestoreMoveFocus(taskId: string): boolean {
    if (moveFocusCancelledRef.current) return false;
    const active = document.activeElement;
    if (active === null || active === document.body) return true;
    if (!(active instanceof HTMLElement)) return false;
    return active.closest<HTMLElement>('[data-task-id]')?.dataset.taskId === taskId;
  }

  function focusTask(taskId: string): boolean {
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')]
      .find(element => element.dataset.taskId === taskId);
    const link = row?.querySelector<HTMLElement>('[data-task-open]');
    if (link === null || link === undefined) return false;
    link.focus();
    return true;
  }

  function focusMoveControl(taskId: string): boolean {
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')]
      .find(element => element.dataset.taskId === taskId);
    const control = row?.querySelector<HTMLSelectElement>('select');
    if (control === null || control === undefined) return false;
    control.focus();
    return true;
  }

  function focusViewBar() {
    document.querySelector<HTMLElement>('[data-task-view-bar]')?.focus();
  }

  function canMoveTask(target: Task): boolean {
    return views.tasks === 'active'
      && !projectArchived
      && target.archivedAt === null
      && target.capabilities.canEdit
      && !blocked
      && draft === null
      && moveDraft === null
      && policyDraft === null
      && collaborationDraft === null
      && !taskColumnsChanged
      && !taskPageChanged
      && taskColumnErrors[target.status] === undefined;
  }
  const canEditProject = project?.capabilities.canEdit === true && !projectArchived;
  const canArchiveProject = project?.capabilities.canArchive === true && !projectArchived;
  const canRestoreProject = project?.capabilities.canRestore === true && projectArchived;
  const canManageAccess = project?.capabilities.canManageAccess === true;
  const hasProjectActions = canManageAccess || canEditProject || canArchiveProject || canRestoreProject;

  const assigneeOptions: readonly DomainPerson[] = (() => {
    const list: DomainPerson[] = [];
    const seen = new Set<string>();
    for (const person of assignees?.items ?? []) {
      if (seen.has(person.principalId)) continue;
      seen.add(person.principalId);
      list.push(person);
    }
    const current = task?.assignee;
    if (current !== null && current !== undefined && !seen.has(current.principalId)) list.push(current);
    return list;
  })();

  useBodyScrollLock(drawerOpen || overlayOpen || form !== null);

  function openDrawer(event: ReactMouseEvent<HTMLButtonElement>) {
    drawerOpenerRef.current = event.currentTarget;
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      const opener = drawerOpenerRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    });
  }

  useFocusTrap(sidebarRef, sidebarDrawer && drawerOpen, closeDrawer);

  useEffect(() => {
    if (!sidebarDrawer) setDrawerOpen(false);
  }, [sidebarDrawer]);

  useEffect(() => {
    if (selection.taskId !== null) {
      hadDetailRef.current = true;
      return;
    }
    if (hadDetailRef.current && status === 'ready') {
      hadDetailRef.current = false;
      const opener = returnFocusRef.current;
      if (opener !== null && opener.isConnected) {
        opener.focus();
      } else {
        const href = opener?.getAttribute('href') ?? null;
        const replacement = href === null
          ? undefined
          : [...document.querySelectorAll<HTMLAnchorElement>('a')].find(anchor => anchor.getAttribute('href') === href);
        if (replacement !== undefined) replacement.focus();
        else projectHeadingRef.current?.focus();
      }
    }
  }, [selection.taskId, status]);

  useEffect(() => {
    if (taskScope === 'project') {
      discoveryReturnRef.current = false;
      return;
    }
    if (status === 'error' || status === 'forbidden' || status === 'signed-out' || status === 'disabled') {
      discoveryReturnRef.current = false;
      return;
    }
    if (selection.taskId !== null) {
      discoveryReturnRef.current = true;
      return;
    }
    if (!discoveryReturnRef.current || status !== 'ready') return;
    discoveryReturnRef.current = false;
    const frame = requestAnimationFrame(() => {
      if (discoveryFocusTaskId === null) {
        discoveryHeadingRef.current?.focus();
        return;
      }
      const row = [...document.querySelectorAll<HTMLElement>('[data-discovery-task-id]')]
        .find(element => element.dataset.discoveryTaskId === discoveryFocusTaskId);
      const target = row?.querySelector<HTMLElement>('[data-discovery-open]') ?? discoveryHeadingRef.current;
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [taskScope, selection.taskId, status, discoveryFocusTaskId]);

  useEffect(() => {
    if (!form) return;
    if (form.workspaceId !== selection.workspaceId
      || ('projectId' in form && form.projectId !== selection.projectId)
      || ('taskId' in form && form.taskId !== selection.taskId)) {
      setForm(null);
    }
  }, [form, selection.workspaceId, selection.projectId, selection.taskId]);

  useEffect(() => {
    if (outcome === 'success' && form !== null && form.kind !== 'project-access') setForm(null);
    if (outcome === 'success') {
      setCaptureTitle('');
      setColumnCaptureOpen(false);
    }
  }, [outcome, form]);

  useEffect(() => {
    if (status !== 'signed-out' && status !== 'forbidden') return;
    if (form !== null) setForm(null);
    if (workspaceNavigation !== null) void resolveWorkspaceNavigation('stay');
  }, [status, form, workspaceNavigation, resolveWorkspaceNavigation]);

  useEffect(() => {
    if (form !== null) return;
    if (draft?.type === 'create-task' && draft.projectId === selection.projectId) {
      setCaptureTitle(draft.fields.title);
      setCaptureStatus(draft.fields.status ?? 'backlog');
      if (taskView.layout === 'board') setColumnCaptureOpen(true);
      return;
    }
    if (draft !== null && draft.type !== 'create-task') {
      setCaptureTitle('');
      setColumnCaptureOpen(false);
      return;
    }
    if (draft === null || draft.type !== 'create-task' || draft.projectId !== selection.projectId) {
      setCaptureTitle('');
      if (taskView.layout === 'list') {
        setCaptureStatus(taskView.filters.status ?? 'backlog');
        setColumnCaptureOpen(false);
      }
    }
  }, [draft, form, selection.projectId, taskView.layout, taskView.filters.status]);

  useEffect(() => {
    if (taskView.layout === 'list') setColumnCaptureOpen(false);
  }, [taskView.layout]);

  useEffect(() => {
    if (moveDraft !== null || movePending !== null || moveRetryTarget !== null) setMoveNotice(null);
  }, [moveDraft, movePending, moveRetryTarget]);

  useEffect(() => {
    if (moveFocusId === null) return;
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target === document.body || target === document.documentElement) return;
      const row = target.closest<HTMLElement>('[data-task-id]');
      moveFocusCancelledRef.current = row?.dataset.taskId !== moveFocusId;
    }
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [moveFocusId]);

  useEffect(() => {
    if (outcome !== 'success' || moveFocusId === null || result === null || !isTaskResult(result) || result.id !== moveFocusId) return;
    const taskId = moveFocusId;
    const status = result.status;
    const orderVersion = result.orderVersion;
    if (!shouldRestoreMoveFocus(taskId)) {
      setMoveFocusId(null);
      return;
    }
    if (taskRowIsCanonical(taskId, status, orderVersion) && focusTask(taskId)) {
      setMoveFocusId(null);
      return;
    }
    const timer = window.setTimeout(() => {
      if (!shouldRestoreMoveFocus(taskId)) {
        setMoveFocusId(null);
        return;
      }
      if (taskRowIsCanonical(taskId, status, orderVersion) && focusTask(taskId)) {
        setMoveFocusId(null);
        return;
      }
      const heading = [...document.querySelectorAll<HTMLElement>('[data-column-heading]')]
        .find(element => element.dataset.columnHeading === status);
      if (heading !== undefined) heading.focus();
      else focusViewBar();
      setMoveFocusId(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [outcome, result, moveFocusId, taskColumns, tasks, taskView.layout]);

  useEffect(() => {
    if (moveFocusId !== null && outcome !== null && outcome !== 'success') setMoveFocusId(null);
  }, [outcome, moveFocusId]);

  useEffect(() => {
    if (outcome !== 'success' || result === null || !isTaskResult(result)) return;
    if (lastCommandRef.current?.type !== 'create-task') return;
    setCreateFocusId(result.id);
  }, [outcome, result]);

  useEffect(() => {
    if (createFocusId === null) return;
    if (focusTask(createFocusId)) {
      setCreateFocusId(null);
      return;
    }
    const timer = window.setTimeout(() => {
      if (focusTask(createFocusId)) {
        setCreateFocusId(null);
        return;
      }
      const created = tasks?.items.find(item => item.id === createFocusId)
        ?? Object.values(taskColumns).flatMap(page => page?.items ?? []).find(item => item.id === createFocusId);
      const heading = created === undefined
        ? undefined
        : [...document.querySelectorAll<HTMLElement>('[data-column-heading]')]
          .find(element => element.dataset.columnHeading === created.status);
      if (heading !== undefined) heading.focus();
      else focusViewBar();
      setCreateFocusId(null);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [createFocusId, taskColumns, tasks, taskView.layout]);

  useEffect(() => {
    if (!resumeDraftOnReady || !draft) return;
    if (draft.type === 'create-project' ? status !== 'ready' && status !== 'empty' : status !== 'ready') return;
    if (!commandMatches(draft, selection)) return;
    setResumeDraftOnReady(false);
    resumeDraft(draft);
  }, [resumeDraftOnReady, draft, status, selection, project, task, tasks, views.tasks]);

  useEffect(() => {
    const command = policyDraft ?? policyRetryTarget;
    if (!resumeAccessOnReady || command === null || status !== 'ready') return;
    if (command.workspaceId !== selection.workspaceId || command.projectId !== selection.projectId) return;
    setResumeAccessOnReady(false);
    modalOpenerRef.current = null;
    setForm({ kind: 'project-access', workspaceId: command.workspaceId, projectId: command.projectId });
  }, [resumeAccessOnReady, policyDraft, policyRetryTarget, status, selection.workspaceId, selection.projectId]);

  useEffect(() => {
    if (captureFocusProjectId === null || status !== 'ready' || selection.projectId !== captureFocusProjectId) return;
    setCaptureFocusProjectId(null);
    const frame = requestAnimationFrame(() => {
      if (captureRef.current !== null) captureRef.current.focus();
      else projectHeadingRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [captureFocusProjectId, status, selection.projectId]);

  function resumeDraft(command: ProjectTaskCommand) {
    // Resumed forms must not reuse a previous modal opener. Never restore
    // focus to a control left behind by a previously closed modal.
    modalOpenerRef.current = null;
    if (command.type === 'create-project') {
      setProjectValue({ name: command.name, key: command.key, description: command.description ?? '', visibility: command.visibility ?? 'workspace' });
      setForm({ kind: 'project-create', workspaceId: command.workspaceId });
      return;
    }
    if (command.type === 'edit-project') {
      const key = project?.id === command.projectId
        ? project.key
        : projects?.items.find(item => item.id === command.projectId)?.key ?? '';
      const visibility = project?.id === command.projectId
        ? project.visibility
        : projects?.items.find(item => item.id === command.projectId)?.visibility ?? 'workspace';
      setProjectValue({ name: command.name, key, description: command.description, visibility });
      setForm({ kind: 'project-edit', workspaceId: command.workspaceId, projectId: command.projectId, version: command.expectedVersion });
      return;
    }
    if (command.type === 'edit-task') {
      const target = task?.id === command.taskId
        ? task
        : tasks?.items.find(item => item.id === command.taskId);
      if (target === undefined || target === null) return;
      setTaskValue({ ...taskFields(target), ...command.fields });
      setForm({ kind: 'task-edit', workspaceId: command.workspaceId, projectId: command.projectId, taskId: command.taskId, version: command.expectedVersion });
      return;
    }
    if (command.type === 'create-task') {
      setCaptureTitle(command.fields.title ?? '');
      requestAnimationFrame(() => captureRef.current?.focus());
    }
  }

  function rememberOpener(opener?: HTMLElement) {
    if (opener !== undefined) modalOpenerRef.current = opener;
    else if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      modalOpenerRef.current = document.activeElement;
    }
  }

  function focusDismissedSurface(hadForm: boolean) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (hadForm) {
        const opener = modalOpenerRef.current;
        if (opener !== null && opener.isConnected && !opener.matches('[disabled]')) {
          opener.focus();
          if (document.activeElement === opener) return;
        }
      }
      const detailHeading = document.querySelector<HTMLElement>('[data-detail-heading]');
      const fallback = detailHeading ?? projectHeadingRef.current ?? document.getElementById('projects-main');
      fallback?.focus();
    }));
  }

  useEffect(() => {
    if (form !== null || !dismissFocusPendingRef.current) return;
    dismissFocusPendingRef.current = false;
    focusDismissedSurface(true);
  }, [form]);

  function closeForm() {
    dismissFocusPendingRef.current = true;
    setForm(null);
  }

  function closeProjectOptions(event: ReactMouseEvent<HTMLElement>) {
    const details = event.currentTarget.closest('details');
    const summary = details?.querySelector<HTMLElement>('summary');
    details?.removeAttribute('open');
    summary?.focus();
  }

  function openProjectCreate(opener?: HTMLElement) {
    if (!workspace || !canCreateProject || blocked || policyDraft !== null || moveDraft !== null || collaborationDraft !== null) return;
    if (draft !== null && draft.type !== 'create-project') return;
    rememberOpener(opener);
    const value = draft?.type === 'create-project'
      ? { name: draft.name, key: draft.key, description: draft.description ?? '', visibility: draft.visibility ?? 'workspace' }
      : emptyProject;
    setProjectValue(value);
    setForm({ kind: 'project-create', workspaceId: workspace.id });
    dismissOutcome();
  }

  function openProjectSettings(opener?: HTMLElement) {
    if (!project || !canEditProject || blocked || policyDraft !== null || moveDraft !== null || collaborationDraft !== null) return;
    if (draft !== null && !(draft.type === 'edit-project' && draft.projectId === project.id)) return;
    rememberOpener(opener);
    const value = draft?.type === 'edit-project'
      ? { name: draft.name, key: project.key, description: draft.description, visibility: project.visibility }
      : { name: project.name, key: project.key, description: project.description, visibility: project.visibility };
    setProjectValue(value);
    setForm({ kind: 'project-edit', workspaceId: project.workspaceId, projectId: project.id, version: project.version });
    dismissOutcome();
  }

  function openProjectAccess(opener?: HTMLElement) {
    if (!project || !canManageAccess || blocked || draft !== null || moveDraft !== null || policyDraft !== null || collaborationDraft !== null) return;
    rememberOpener(opener);
    setForm({ kind: 'project-access', workspaceId: project.workspaceId, projectId: project.id });
    dismissOutcome();
  }

  function openTaskEdit(opener?: HTMLElement) {
    if (!task || blocked || policyDraft !== null || moveDraft !== null || collaborationDraft !== null || !task.capabilities.canEdit || task.archivedAt !== null || projectArchived) return;
    if (draft !== null && !(draft.type === 'edit-task' && draft.taskId === task.id)) return;
    rememberOpener(opener);
    const value = draft?.type === 'edit-task'
      ? { ...taskFields(task), ...draft.fields }
      : taskFields(task);
    setTaskValue(value);
    setForm({ kind: 'task-edit', workspaceId: task.workspaceId, projectId: task.projectId, taskId: task.id, version: task.version });
    dismissOutcome();
  }

  function requestProjectArchive(restore: boolean, opener?: HTMLElement) {
    if (!project || blocked || draft !== null || policyDraft !== null || moveDraft !== null || collaborationDraft !== null) return;
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

  async function requestTaskArchive(restore: boolean, target: Task | null = task, opener?: HTMLElement) {
    if (!target || blocked || draft !== null || policyDraft !== null || moveDraft !== null || collaborationDraft !== null) return;
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
    if (draft?.type === 'create-task' && draft.projectId === project?.id) return draft.fields.status ?? captureStatus;
    return taskView.layout === 'list' ? (taskView.filters.status ?? 'backlog') : captureStatus;
  }

  function stageCapture(title: string) {
    setCaptureTitle(title);
    if (!canCapture || !project || blocked) return;
    stage({ type: 'create-task', workspaceId: project.workspaceId, projectId: project.id, fields: { title, status: captureTargetStatus() } });
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
      const heading = [...document.querySelectorAll<HTMLElement>('[data-column-heading]')]
        .find(element => element.dataset.columnHeading === captureStatus);
      if (heading !== undefined) heading.focus();
      else focusViewBar();
    });
  }

  function submitColumnCapture() {
    submitCapture();
  }

  function performMove(target: Task, status: TaskStatus, beforeTaskId: string | null = null) {
    if (!canMoveTask(target)) return;
    lastOutcomeSourceRef.current = 'move';
    setMoveNotice(null);
    moveFocusCancelledRef.current = false;
    setMoveFocusId(target.id);
    const reason = stageMove(target.id, status, beforeTaskId);
    if (reason !== 'ready') {
      setMoveFocusId(null);
      setMoveNotice({ reason, taskId: target.id });
      return;
    }
    void submit();
  }

  function performMoveBefore(target: Task, status: TaskStatus, beforeTaskId: string) {
    performMove(target, status, beforeTaskId);
  }

  function performMoveEnd(target: Task, status: TaskStatus) {
    performMove(target, status, null);
  }

  function moveCommandLabel(command: ProjectMoveCommand): string {
    const target = findTaskById(command.taskId);
    const taskLabel = target === null ? copy.move.selectedTask[lang] : `${target.key} · ${target.title}`;
    const placement = command.beforeTaskId === null ? copy.move.placementEnd[lang] : copy.move.placementBefore[lang];
    return `${taskLabel} → ${statusName(command.status)[lang]} · ${placement}`;
  }

  function moveConflictTarget(command: ProjectMoveCommand): string {
    const requested = `${copy.move.requestedTarget[lang]}: ${statusName(command.status)[lang]} · ${command.beforeTaskId === null ? copy.move.placementEnd[lang] : copy.move.placementBefore[lang]}`;
    if (conflict !== null && isTask(conflict)) {
      return `${requested} · ${copy.move.currentTarget[lang]}: ${conflict.key} · ${statusName(conflict.status)[lang]}`;
    }
    return requested;
  }

  function discardMove(focus: 'task' | 'view' = 'task') {
    const taskId = moveCommand?.taskId ?? moveFocusId;
    discardDraft();
    setMoveNotice(null);
    setMoveFocusId(null);
    if (focus === 'view') {
      void refresh();
      requestAnimationFrame(focusViewBar);
      return;
    }
    requestAnimationFrame(() => {
      if (taskId !== null && focusMoveControl(taskId)) return;
      focusViewBar();
    });
  }

  function refreshMove() {
    discardMove('view');
  }

  function retryMove() {
    lastOutcomeSourceRef.current = 'move';
    void retrySave();
  }

  function returnMove() {
    lastOutcomeSourceRef.current = 'move';
    void returnToDraft();
  }

  function resumeMove() {
    lastOutcomeSourceRef.current = 'move';
    if (moveDraft !== null) setMoveFocusId(moveDraft.taskId);
    void submit();
  }

  function closeCurrentTaskForMove() {
    const taskId = moveNotice?.taskId ?? null;
    setMoveNotice(null);
    void selectTask(null).then(() => {
      requestAnimationFrame(() => {
        if (taskId !== null && focusMoveControl(taskId)) return;
        focusViewBar();
      });
    });
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

  function stageCollaboration(command: ProjectCommand) {
    lastOutcomeSourceRef.current = 'collaboration';
    stage(command);
  }

  function submitCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    void submit();
  }

  function retryCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    void retrySave();
  }

  function reloadCollaborationConflict() {
    lastOutcomeSourceRef.current = 'collaboration';
    void reloadConflict();
  }

  function discardCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    discardDraft();
  }

  function collabCommandLabel(command: ProjectCommand | null): string | null {
    if (command === null) return null;
    const action = copy.collaboration.activityActions[command.type];
    const label = action === undefined ? command.type : action[lang];
    if ('taskId' in command) {
      const target = task?.id === command.taskId
        ? task
        : tasks?.items.find(item => item.id === command.taskId);
      return target === undefined || target === null ? label : `${copy.feedback.targetTask[lang]}: ${target.key} · ${label}`;
    }
    return label;
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

  function stageVisibilityChange(visibility: ProjectVisibility) {
    if (!project || !canManageAccess || blocked || policyDraft !== null || moveDraft !== null) return;
    const command: ProjectPolicyCommand = {
      type: 'change-visibility',
      workspaceId: project.workspaceId,
      projectId: project.id,
      expectedVersion: projectAccess?.projectVersion ?? project.version,
      visibility,
    };
    lastPolicyCommandRef.current = command;
    lastOutcomeSourceRef.current = 'policy';
    stage(command);
  }

  function reviewAccess(member: ProjectAccessMember, state: 'active' | 'revoked') {
    if (!project || !canManageAccess || blocked || policyDraft !== null || moveDraft !== null) return;
    const command: ProjectPolicyCommand = {
      type: 'change-access',
      workspaceId: project.workspaceId,
      projectId: project.id,
      expectedVersion: projectAccess?.projectVersion ?? project.version,
      principalId: member.principalId,
      state,
    };
    lastPolicyCommandRef.current = command;
    lastPolicyMemberRef.current = member;
    lastOutcomeSourceRef.current = 'policy';
    stage(command);
  }

  function submitPolicy() {
    if (policyDraft === null || blocked || moveDraft !== null) return;
    lastOutcomeSourceRef.current = 'policy';
    void submit();
  }

  function retryPolicySave() {
    if (policyRetryTarget === null || policyPending !== null) return;
    lastOutcomeSourceRef.current = 'policy';
    void retrySave();
  }

  function rebasePolicyDraft() {
    lastOutcomeSourceRef.current = 'policy';
    rebaseDraft();
    requestAnimationFrame(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const target = dialog?.querySelector<HTMLElement>('[data-access-confirm] h3, [data-access-confirm] [tabindex="-1"]');
      target?.focus();
    });
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
    if (command.workspaceId === selection.workspaceId && command.projectId === selection.projectId && status === 'ready') {
      modalOpenerRef.current = null;
      setForm({ kind: 'project-access', workspaceId: command.workspaceId, projectId: command.projectId });
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

  function commandLabel(command: ProjectTaskCommand): string {
    if (command.type === 'create-project') return `${copy.feedback.targetProject[lang]}: ${command.name}`;
    if (command.type === 'edit-project' || command.type === 'archive-project' || command.type === 'restore-project') {
      const name = project?.id === command.projectId
        ? project.name
        : projects?.items.find(item => item.id === command.projectId)?.name ?? command.projectId;
      return `${copy.feedback.targetProject[lang]}: ${name}`;
    }
    if (command.type === 'create-task') return `${copy.feedback.targetTask[lang]}: ${command.fields.title}`;
    if (!('taskId' in command)) return `${copy.feedback.targetProject[lang]}: ${command.projectId}`;
    const target = task?.id === command.taskId
      ? task
      : tasks?.items.find(item => item.id === command.taskId);
    const label = target?.key ?? command.taskId;
    return `${copy.feedback.targetTask[lang]}: ${label}`;
  }

  function resultLabel(value: ProjectTaskResult | null): string | null {
    if (value === null) return null;
    if (isProjectResult(value)) return `${copy.feedback.targetProject[lang]}: ${value.key} · ${value.name}`;
    return `${copy.feedback.targetTask[lang]}: ${value.key} · ${value.title}`;
  }

  function conflictFields(): ConflictFieldView[] {
    if (draft === null || conflict === null) return [];
    if (draft.type === 'edit-task' && isTask(conflict)) {
      const currentFields = taskFields(conflict);
      const nextFields = { ...currentFields, ...draft.fields };
      const assigneeName = (person: DomainPerson | null) => person === null ? copy.task.unassigned[lang] : person.name;
      const pair = (key: string, label: Bilingual, current: string, next: string): ConflictFieldView => ({
        key, label: label[lang], current, draft: next, changed: current !== next,
      });
      return [
        pair('title', copy.task.titleLabel, currentFields.title, nextFields.title),
        pair('description', copy.task.descriptionLabel, currentFields.description, nextFields.description),
        pair('status', copy.task.statusLabel, statusName(currentFields.status)[lang], statusName(nextFields.status)[lang]),
        pair('type', copy.task.typeLabel, typeName(currentFields.type)[lang], typeName(nextFields.type)[lang]),
        pair('priority', copy.task.priorityLabel, priorityName(currentFields.priority)[lang], priorityName(nextFields.priority)[lang]),
        pair('assignee', copy.task.assigneeLabel, assigneeName(conflict.assignee), conflict.assigneePrincipalId === nextFields.assigneePrincipalId
          ? assigneeName(conflict.assignee)
          : nextFields.assigneePrincipalId === null
            ? copy.task.unassigned[lang]
            : assigneeOptions.find(member => member.principalId === nextFields.assigneePrincipalId)?.name ?? nextFields.assigneePrincipalId),
        pair('due', copy.task.dueDateLabel, formatDateOnly(currentFields.dueDate, lang) || copy.task.noDueDate[lang], formatDateOnly(nextFields.dueDate, lang) || copy.task.noDueDate[lang]),
      ];
    }
    if (draft.type === 'edit-project' && isProject(conflict)) {
      return [
        { key: 'name', label: copy.project.nameLabel[lang], current: conflict.name, draft: draft.name, changed: conflict.name !== draft.name },
        { key: 'description', label: copy.project.descriptionLabel[lang], current: conflict.description, draft: draft.description, changed: conflict.description !== draft.description },
      ];
    }
    return [];
  }

  function policyMemberFor(principalId: string | null): ProjectAccessMember | null {
    if (principalId === null) return null;
    const fromPage = projectAccess?.items.find(member => member.principalId === principalId) ?? null;
    if (fromPage !== null) return fromPage;
    if (accessConflict !== null && accessConflict.principalId === principalId) return accessConflict;
    const remembered = lastPolicyMemberRef.current;
    return remembered !== null && remembered.principalId === principalId ? remembered : null;
  }

  function policyCommandLabel(command: ProjectPolicyCommand | null): string | null {
    if (command === null) return null;
    if (command.type === 'change-visibility') {
      return `${copy.access.targetVisibility[lang]}: ${visibilityName(command.visibility)[lang]}`;
    }
    const member = policyMemberFor(command.principalId);
    return `${copy.access.targetMember[lang]}: ${member?.name ?? copy.access.selectedMember[lang]}`;
  }

  const policyMember = policyDraft?.type === 'change-access' ? policyMemberFor(policyDraft.principalId) : null;
  const policySource = lastOutcomeSourceRef.current === 'policy';
  const policyMatches = policyDraft !== null
    && policyDraft.workspaceId === selection.workspaceId
    && policyDraft.projectId === selection.projectId;
  const showPolicyBanner = policyDraft !== null && form === null && outcome === null && policyRetryTarget === null;
  const draftMatches = draft === null ? true : commandMatches(draft, selection);
  const retryMatches = retryTarget === null ? true : commandMatches(retryTarget, selection);
  const draftVisibleInCapture = draft?.type === 'create-task'
    && draft.projectId === selection.projectId
    && views.tasks === 'active'
    && canCapture
    && form === null
    && (taskView.layout === 'list'
      || (columnCaptureOpen
        && captureStatus === (draft.fields.status ?? 'backlog')
        && (taskView.filters.status === undefined || taskView.filters.status === captureStatus)));
  const showDraftBanner = draft !== null && form === null && retryTarget === null && !draftVisibleInCapture;
  const taskFeedbackId = outcome === 'success' && result !== null && isTaskResult(result)
    ? result.id
    : retryTarget !== null && 'taskId' in retryTarget
      ? retryTarget.taskId
      : conflict !== null && isTask(conflict)
        ? conflict.id
        : draft !== null && 'taskId' in draft
          ? draft.taskId
          : pending !== null && lastCommandRef.current !== null && 'taskId' in lastCommandRef.current
            ? lastCommandRef.current.taskId
            : null;
  const feedbackInDetail = task !== null && taskFeedbackId === task.id;
  const moveFeedbackInDetail = task !== null && moveTaskId === task.id;
  const feedbackInForm = form !== null;

  const feedbackNode: ReactNode = (() => {
    if ((policySource || moveSource) && outcome !== null) return null;
    if (closeWarning !== null || lastOutcomeSourceRef.current === 'collaboration') return null;
    if (pending !== null) {
      const command = draft ?? lastCommandRef.current;
      return (
        <FeedbackPanel
          busy
          target={command === null ? null : commandLabel(command)}
          title={pendingCopy(pending)}
          tone="info"
        />
      );
    }
    if (outcome === 'success') {
      return (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          )}
          autoFocus
          target={resultLabel(result)}
          title={lastCommandRef.current === null ? copy.feedback.saved : successCopy(lastCommandRef.current.type)}
          tone="success"
        />
      );
    }
    if (outcome === 'conflict' && conflict !== null) {
      const fields = conflictFields();
      if (fields.length > 0) {
        return (
          <ConflictPanel
            actions={(
              <>
                {draft !== null && 'expectedVersion' in draft && (
                  <button className={styles.secondary} onClick={keepDraftAfterConflict} type="button">
                    {copy.feedback.conflictKeepDraft[lang]}
                  </button>
                )}
                <button className={styles.ghostButton} onClick={() => { discardCurrentDraft(); void refresh(); }} type="button">
                  {copy.feedback.discard[lang]}
                </button>
              </>
            )}
            body={copy.feedback.conflictBody}
            currentLabel={copy.feedback.conflictCurrentLabel}
            draftLabel={copy.feedback.conflictDraftLabel}
            fields={fields}
            title={copy.feedback.conflictTitle}
          />
        );
      }
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={() => { void reloadConflict(); }} type="button">
                {copy.feedback.conflictReview[lang]}
              </button>
              <button className={styles.ghostButton} onClick={() => { discardCurrentDraft(); void refresh(); }} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          )}
          body={copy.feedback.conflictBody}
          target={resultLabel(conflict)}
          title={copy.feedback.conflictTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={() => { dismissOutcome(); closeForm(); }} type="button">
                {copy.common.close[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.forbiddenBody}
          target={draft === null ? null : commandLabel(draft)}
          title={copy.feedback.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.invalidBody}
          target={draft === null ? null : commandLabel(draft)}
          title={copy.feedback.invalidTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error' && retryTarget !== null) {
      return (
        <FeedbackPanel
          actions={(
            <>
              {retryMatches
                ? (
                  <button
                    className={styles.primary}
                    disabled={pending !== null}
                    onClick={() => {
                      lastCommandRef.current = retryTarget;
                      void retrySave();
                    }}
                    type="button"
                  >
                    {copy.feedback.retrySame[lang]}
                  </button>
                )
                : (
                  <button className={styles.primary} onClick={handleReturnToDraft} type="button">
                    {copy.feedback.draftContextReturn[lang]}
                  </button>
                )}
              <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.feedback.unknownBody}
          target={commandLabel(retryTarget)}
          title={copy.feedback.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.errorBody}
          title={copy.feedback.errorTitle}
          tone="danger"
        />
      );
    }
    return null;
  })();

  const moveNoticeNode: ReactNode = moveNotice === null
    ? null
    : (
      <FeedbackPanel
        actions={(
          <>
            {moveNotice.reason === 'different-detail' && (
              <button className={styles.secondary} onClick={closeCurrentTaskForMove} type="button">
                {copy.move.closeCurrentTask[lang]}
              </button>
            )}
            {(moveNotice.reason === 'changed' || moveNotice.reason === 'unavailable') && (
              <button className={styles.secondary} onClick={() => { setMoveNotice(null); void refresh(); requestAnimationFrame(focusViewBar); }} type="button">
                {copy.common.refresh[lang]}
              </button>
            )}
            <button className={styles.ghostButton} onClick={() => setMoveNotice(null)} type="button">
              {copy.common.dismiss[lang]}
            </button>
          </>
        )}
        autoFocus
        body={copy.move.blockedReasons[moveNotice.reason]}
        target={findTaskById(moveNotice.taskId)?.key ?? copy.move.selectedTask[lang]}
        title={copy.move.blockedTitle}
        tone="warning"
      />
    );

  const moveFeedbackNode: ReactNode = (() => {
    if (closeWarning !== null) return null;
    if (movePending !== null) {
      return (
        <FeedbackPanel
          busy
          target={moveCommand === null ? null : moveCommandLabel(moveCommand)}
          title={copy.move.pendingTitle}
          tone="info"
        />
      );
    }
    if (moveSource && outcome === 'success' && result !== null && isTaskResult(result)) {
      return (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          )}
          target={resultLabel(result)}
          title={copy.move.successTitle}
          tone="success"
        />
      );
    }
    if (moveNeedsDestination && moveDraft !== null) {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
              <button className={styles.ghostButton} onClick={refreshMove} type="button">
                {copy.common.refresh[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.move.conflictBody}
          target={moveConflictTarget(moveDraft)}
          title={copy.move.conflictTitle}
          tone="warning"
        />
      );
    }
    if (moveDraft !== null && outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
              <button className={styles.ghostButton} onClick={refreshMove} type="button">
                {copy.common.refresh[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.move.invalidBody}
          target={moveCommandLabel(moveDraft)}
          title={copy.move.invalidTitle}
          tone="warning"
        />
      );
    }
    if (moveRetryTarget !== null && outcome === 'error') {
      return (
        <FeedbackPanel
          actions={(
            <>
              {moveRetryMatches
                ? (
                  <button className={styles.primary} onClick={retryMove} type="button">
                    {copy.feedback.retrySame[lang]}
                  </button>
                )
                : (
                  <button className={styles.primary} onClick={returnMove} type="button">
                    {copy.move.returnToMove[lang]}
                  </button>
                )}
              <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.move.unknownBody}
          target={moveCommandLabel(moveRetryTarget)}
          title={copy.move.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden' && (moveSource || moveDraft !== null)) {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.close[lang]}
              </button>
              {moveDraft !== null && (
                <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                  {copy.move.discard[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.move.forbiddenBody}
          target={moveCommand === null ? null : moveCommandLabel(moveCommand)}
          title={copy.move.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (moveSource && outcome === 'error') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {moveDraft !== null && (
                <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                  {copy.move.discard[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.move.errorBody}
          title={copy.move.errorTitle}
          tone="danger"
        />
      );
    }
    if (moveDraft !== null && outcome === null && movePending === null && moveRetryTarget === null) {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={moveDraftMatches ? resumeMove : returnMove} type="button">
                {moveDraftMatches ? copy.feedback.draftReturn[lang] : copy.move.returnToMove[lang]}
              </button>
              <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
            </>
          )}
          body={copy.move.draftBody}
          target={moveCommandLabel(moveDraft)}
          title={copy.move.draftTitle}
          tone={moveDraftMatches ? 'info' : 'warning'}
        />
      );
    }
    return null;
  })();

  const closeWarningNode: ReactNode = closeWarning === null
    ? null
    : (
      <FeedbackPanel
        actions={(
          <>
            <button
              className={styles.primary}
              disabled={mutationPending !== null}
              onClick={() => {
                lastOutcomeSourceRef.current = moveDraft !== null ? 'move' : 'content';
                acknowledgeClose();
                void submit();
              }}
              type="button"
            >
              {copy.collaboration.closeWarningConfirm[lang]}
            </button>
            <button className={styles.ghostButton} disabled={mutationPending !== null} onClick={discardCurrentDraft} type="button">
              {copy.collaboration.closeWarningCancel[lang]}
            </button>
          </>
        )}
        autoFocus
        body={{
          es: copy.collaboration.closeWarningBody.es(closeWarning.open, closeWarning.archivedOpen),
          en: copy.collaboration.closeWarningBody.en(closeWarning.open, closeWarning.archivedOpen),
        }}
        target={(() => {
          const target = conflict !== null && isTask(conflict) ? conflict : task;
          const status = draft !== null && draft.type === 'edit-task' ? draft.fields.status ?? null : moveDraft?.status ?? null;
          if (target === null) return null;
          return `${target.key} · ${status === null ? copy.common.task[lang] : statusName(status)[lang]}`;
        })()}
        title={copy.collaboration.closeWarningTitle}
        tone="warning"
      />
    );

  const taskPageErrorBlock: ReactNode = pageError?.collection !== 'tasks'
    ? null
    : (
      <FeedbackPanel
        actions={pageError.reason === 'changed'
          ? (
            <button className={styles.secondary} disabled={blocked} onClick={() => { void refresh(); }} type="button">
              {copy.common.refresh[lang]}
            </button>
          )
          : (
            <>
              <button className={styles.secondary} disabled={blocked} onClick={() => { void loadMore('tasks'); }} type="button">
                {copy.feedback.pageErrorRetry[lang]}
              </button>
              <button className={styles.ghostButton} onClick={dismissPageError} type="button">
                {copy.common.dismiss[lang]}
              </button>
            </>
          )}
        body={pageError.reason === 'changed' ? copy.taskView.listChangedBody : copy.feedback.pageErrorBody}
        target={copy.feedback.pageErrorTargets.tasks[lang]}
        title={pageError.reason === 'changed' ? copy.taskView.listChangedTitle : copy.feedback.pageErrorTitle}
        tone="warning"
      />
    );

  const policyFeedbackNode: ReactNode = (() => {
    if (policyPending !== null) {
      return (
        <FeedbackPanel
          busy
          target={policyCommandLabel(policyDraft ?? lastPolicyCommandRef.current)}
          title={policyPending === 'change-visibility' ? copy.access.changingVisibility : copy.access.changingAccess}
          tone="info"
        />
      );
    }
    if (!policySource) return null;
    if (outcome === 'success') {
      const command = lastPolicyCommandRef.current;
      const member = lastPolicyMemberRef.current;
      const title = command?.type === 'change-access'
        ? (command.state === 'active' ? copy.access.successGrant : copy.access.successRevoke)
        : copy.access.successVisibility;
      const body = command?.type === 'change-access' && member !== null
        ? (command.state === 'revoked'
          ? (member.implicitAccess
            ? copy.access.successAdminRetained
            : project?.visibility === 'workspace' && member.active
              ? copy.access.successWorkspaceRetained
              : undefined)
          : member.implicitAccess
            ? copy.access.successAdminGranted
            : project?.visibility === 'workspace'
              ? copy.access.successWorkspaceGranted
              : undefined)
        : undefined;
      return (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          )}
          autoFocus
          {...(body !== undefined ? { body } : {})}
          target={policyCommandLabel(command)}
          title={title}
          tone="success"
        />
      );
    }
    if (outcome === 'conflict' && policyDraft !== null) {
      if (conflict === null || !isProject(conflict)) {
        return (
          <FeedbackPanel
            actions={(
              <>
                <button className={styles.secondary} onClick={() => { void reloadConflict(); }} type="button">
                  {policyDraft.type === 'change-access' ? copy.access.reviewAccess[lang] : copy.feedback.conflictReview[lang]}
                </button>
                <button className={styles.ghostButton} onClick={() => { discardPolicyDraft(); void refresh(); }} type="button">
                  {copy.feedback.discard[lang]}
                </button>
              </>
            )}
            body={copy.access.conflictMissingCurrent}
            target={policyCommandLabel(policyDraft)}
            title={copy.feedback.conflictTitle}
            tone="warning"
          />
        );
      }
      const archivedConflict = conflict.archivedAt !== null;
      const needsReview = policyDraft.type === 'change-access'
        && (accessConflict === null || accessConflict.principalId !== policyDraft.principalId);
      const fields = needsReview ? [] : projectPolicyConflictFields(conflict, policyDraft, accessConflict, lang);
      const rebaseAllowed = policyDraft.type === 'change-access'
        ? policyDraft.state === 'revoked' || !archivedConflict
        : !archivedConflict;
      const reviewAllowed = policyDraft.type === 'change-access' || !archivedConflict;
      const title = policyDraft.type === 'change-access' ? copy.access.conflictAccessTitle : copy.feedback.conflictTitle;
      const body = policyDraft.type === 'change-access' ? copy.access.conflictAccessBody : copy.feedback.conflictBody;
      if (fields.length > 0) {
        return (
          <ConflictPanel
            actions={(
              <>
                {rebaseAllowed && (
                  <button className={styles.secondary} onClick={rebasePolicyDraft} type="button">
                    {copy.feedback.conflictKeepDraft[lang]}
                  </button>
                )}
                <button className={styles.ghostButton} onClick={() => { discardPolicyDraft(); void refresh(); }} type="button">
                  {copy.feedback.discard[lang]}
                </button>
              </>
            )}
            body={body}
            currentLabel={copy.feedback.conflictCurrentLabel}
            draftLabel={copy.feedback.conflictDraftLabel}
            fields={fields}
            title={title}
          />
        );
      }
      return (
        <FeedbackPanel
          actions={(
            <>
              {reviewAllowed && (
                <button className={styles.secondary} onClick={() => { void reloadConflict(); }} type="button">
                  {policyDraft.type === 'change-access' ? copy.access.reviewAccess[lang] : copy.feedback.conflictReview[lang]}
                </button>
              )}
              <button className={styles.ghostButton} onClick={() => { discardPolicyDraft(); void refresh(); }} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          )}
          body={needsReview ? copy.access.conflictMissingTarget : body}
          target={policyCommandLabel(policyDraft)}
          title={title}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={() => { dismissOutcome(); closeForm(); }} type="button">
                {copy.common.close[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.forbiddenBody}
          target={policyDraft === null ? null : policyCommandLabel(policyDraft)}
          title={copy.feedback.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.invalidBody}
          target={policyDraft === null ? null : policyCommandLabel(policyDraft)}
          title={copy.feedback.invalidTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error' && policyRetryTarget !== null) {
      const policyRetryMatches = policyRetryTarget.workspaceId === selection.workspaceId
        && policyRetryTarget.projectId === selection.projectId;
      return (
        <FeedbackPanel
          actions={(
            <>
              {policyRetryMatches
                ? (
                  <button className={styles.primary} onClick={retryPolicySave} type="button">
                    {copy.feedback.retrySame[lang]}
                  </button>
                )
                : (
                  <button className={styles.primary} onClick={handlePolicyResume} type="button">
                    {copy.access.returnToChange[lang]}
                  </button>
                )}
              <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.feedback.unknownBody}
          target={policyCommandLabel(policyRetryTarget)}
          title={copy.feedback.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error') {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.feedback.errorBody}
          title={copy.feedback.errorTitle}
          tone="danger"
        />
      );
    }
    return null;
  })();

  const policyDraftBanner: ReactNode = showPolicyBanner && policyDraft !== null
    ? (
      <FeedbackPanel
        actions={(
          <>
            <button className={styles.secondary} onClick={handlePolicyResume} type="button">
              {copy.access.draftResume[lang]}
            </button>
            <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
              {copy.common.discardDraft[lang]}
            </button>
          </>
        )}
        body={copy.access.draftBody}
        target={policyCommandLabel(policyDraft)}
        title={copy.access.draftTitle}
        tone={policyMatches ? 'info' : 'warning'}
      />
    )
    : null;

  const draftBanner: ReactNode = showDraftBanner && draft !== null
    ? (
      <FeedbackPanel
        actions={(
          <>
            <button className={styles.secondary} onClick={resumeCurrentDraft} type="button">
              {draftMatches ? copy.feedback.draftReturn[lang] : copy.feedback.draftContextReturn[lang]}
            </button>
            <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
              {copy.common.discardDraft[lang]}
            </button>
          </>
        )}
        body={draftMatches ? copy.feedback.draftBody : copy.feedback.draftContextBody}
        target={commandLabel(draft)}
        title={draftMatches ? copy.feedback.draftTitle : copy.feedback.draftContextTitle}
        tone={draftMatches ? 'info' : 'warning'}
      />
    )
    : null;

  const draftInDetail = task !== null && draftBanner !== null
    && (detailOverlay || draft?.type === 'edit-task' && draft.taskId === task.id);

  const collabGlobalChild = draft?.type === 'create-task' && draft.fields.parentTaskId !== undefined ? draft : null;
  const collabGlobalChildRetry = retryTarget?.type === 'create-task' && retryTarget.fields.parentTaskId !== undefined ? retryTarget : null;
  const collabGlobalCommand = collaborationRetryTarget ?? collabGlobalChildRetry ?? collaborationDraft ?? collabGlobalChild;
  const collabGlobalParentId = collabGlobalChild?.fields.parentTaskId ?? collabGlobalChildRetry?.fields.parentTaskId ?? null;
  const collabGlobalBanner = collabGlobalCommand !== null && task === null
    ? (
      <FeedbackPanel
        actions={(
          <>
            {(draftGuard.canReturn || collabGlobalParentId !== null) && (
              <button
                className={styles.secondary}
                onClick={() => {
                  if (collabGlobalParentId !== null) void selectTask(collabGlobalParentId);
                  else void returnToDraft();
                }}
                type="button"
              >
                {copy.collaboration.draftReturn[lang]}
              </button>
            )}
            {draftGuard.canDiscard && (
              <button className={styles.ghostButton} onClick={discardCollaboration} type="button">
                {copy.collaboration.draftDiscard[lang]}
              </button>
            )}
          </>
        )}
        body={copy.collaboration.draftBody}
        target={collabCommandLabel(collabGlobalCommand)}
        title={copy.collaboration.draftTitle}
        tone="warning"
      />
    )
    : null;

  const recoveryBlock = (
    <>
      {task === null ? closeWarningNode : null}
      {collabGlobalBanner}
      {moveNoticeNode}
      {moveFeedbackInDetail ? null : moveFeedbackNode}
      {draftInDetail ? null : draftBanner}
      {policyDraftBanner}
      {feedbackInDetail ? null : feedbackNode}
      {form === null ? policyFeedbackNode : null}
    </>
  );

  const pageErrorBlock: ReactNode = pageError === null
    ? null
    : (
      <FeedbackPanel
        actions={(
          <>
            <button className={styles.secondary} disabled={blocked} onClick={() => { void loadMore(pageError.collection); }} type="button">
              {copy.feedback.pageErrorRetry[lang]}
            </button>
            <button className={styles.ghostButton} onClick={dismissPageError} type="button">
              {copy.common.dismiss[lang]}
            </button>
          </>
        )}
        body={copy.feedback.pageErrorBody}
        target={copy.feedback.pageErrorTargets[pageError.collection][lang]}
        title={copy.feedback.pageErrorTitle}
        tone="warning"
      />
    );

  function selectTaskFromList(taskId: string, opener: HTMLElement) {
    returnFocusRef.current = opener;
    void selectTask(taskId);
    closeDrawer();
  }

  function discoveryLink(scope: 'mine' | 'search'): string {
    const params = new URLSearchParams();
    if (selection.workspaceId !== null) params.set('workspace', selection.workspaceId);
    params.set('taskScope', scope);
    return `/projects?${params.toString()}`;
  }

  function openDiscoveryRow(item: TaskDiscoveryItem, opener: HTMLElement) {
    returnFocusRef.current = opener;
    void openDiscoveryTask(item);
    if (drawerOpen) closeDrawer();
  }

  function changeDiscoveryScope(scope: 'mine' | 'search') {
    if (anyPending) return;
    void setTaskScope(scope);
    if (drawerOpen) closeDrawer();
  }

  function clearDiscoveryFilters() {
    if (anyPending) return;
    void setTaskFilters({});
    if (discoveryProjectId !== null) void setDiscoveryProject(null);
  }

  function chooseProjectForCapture(projectId: string) {
    if (anyPending) return;
    setCaptureFocusProjectId(projectId);
    void selectProject(projectId);
  }

  function resolveWorkspaceChoice(choice: 'stay' | 'discard') {
    if (choice === 'discard' && mutationPending !== null) return;
    void resolveWorkspaceNavigation(choice);
  }

  function openProject(projectId: string) {
    if (anyPending) return;
    void selectProject(projectId);
    closeDrawer();
  }

  function toggleProjectsView() {
    if (anyPending) return;
    void setView('projects', views.projects === 'active' ? 'archived' : 'active');
    closeDrawer();
  }

  function toggleTasksView() {
    if (anyPending) return;
    void setView('tasks', views.tasks === 'active' ? 'archived' : 'active');
  }

  function renderProjectActions(compact: boolean) {
    const base = compact ? styles.projectMenuItem : styles.secondary;
    return (
      <>
        {canManageAccess && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={event => {
              if (compact) closeProjectOptions(event);
              openProjectAccess(event.currentTarget);
            }}
            type="button"
          >
            <IconUsers size={16} />
            {copy.access.button[lang]}
          </button>
        )}
        {canEditProject && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={event => {
              if (compact) closeProjectOptions(event);
              openProjectSettings(event.currentTarget);
            }}
            type="button"
          >
            <IconSettings size={16} />
            {copy.project.settingsTitle[lang]}
          </button>
        )}
        {canArchiveProject && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={event => {
              if (compact) closeProjectOptions(event);
              requestProjectArchive(false, event.currentTarget);
            }}
            type="button"
          >
            <IconArchive size={16} />
            {copy.project.archive[lang]}
          </button>
        )}
        {canRestoreProject && (
          <button
            className={compact ? styles.projectMenuItem : styles.primary}
            disabled={blocked || anyDraft}
            onClick={event => {
              if (compact) closeProjectOptions(event);
              requestProjectArchive(true, event.currentTarget);
            }}
            type="button"
          >
            <IconRestore size={16} />
            {copy.project.restore[lang]}
          </button>
        )}
      </>
    );
  }

  function renderWorkspaceOptions() {
    const list = workspaces?.items ?? [];
    const currentMissing = workspace !== null && !list.some(item => item.id === workspace.id);
    return (
      <>
        {selection.workspaceId === null && <option value="">{copy.header.noWorkspace[lang]}</option>}
        {currentMissing && workspace !== null && <option value={workspace.id}>{workspace.name}</option>}
        {list.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </>
    );
  }

  function renderTaskDetail() {
    if (task === null) return null;
    return (
      <div>
        <TaskDetail
          actionsDisabled={blocked || policyDraft !== null || moveDraft !== null || collaborationDraft !== null}
          backLabel={taskScope === 'mine'
            ? copy.discovery.backToMine
            : taskScope === 'search'
              ? copy.discovery.backToSearch
              : copy.common.backToProject}
          collaboration={(
            <TaskCollaboration
              collaborationSource={lastOutcomeSourceRef.current === 'collaboration'}
              hook={projectTasks}
              onDiscard={discardCollaboration}
              onReloadConflict={reloadCollaborationConflict}
              onRetry={retryCollaboration}
              onStage={stageCollaboration}
              onSubmit={submitCollaboration}
              projectArchived={projectArchived}
              task={task}
            />
          )}
          description={task.description.length > 0 ? <TaskDescription source={task.description} /> : undefined}
          feedback={form === null && (feedbackInDetail || draftInDetail || moveFeedbackInDetail || closeWarningNode !== null)
            ? (
              <>
                {closeWarningNode}
                {draftInDetail ? draftBanner : null}
                {feedbackInDetail ? feedbackNode : null}
                {moveFeedbackInDetail ? moveFeedbackNode : null}
              </>
            )
            : undefined}
          onArchive={opener => requestTaskArchive(false, task, opener)}
          onClose={() => {
            void setParentCandidatesWanted(false);
            if (taskScope === 'project') void selectTask(null);
            else void returnToDiscovery();
          }}
          onEdit={openTaskEdit}
          onRestore={opener => requestTaskArchive(true, task, opener)}
          modalOpen={form !== null}
          overlay={detailOverlay}
          projectArchived={projectArchived}
          task={task}
        />
      </div>
    );
  }

  const projectList = projects?.items ?? [];
  const taskList = tasks?.items ?? [];
  const isArchivedProjects = views.projects === 'archived';
  const isArchivedTasks = views.tasks === 'archived';
  const hasWorkspace = workspace !== null || (workspaces?.items.length ?? 0) > 0;
  const discoveryProjectName = discoveryProjectId === null
    ? null
    : discovery.page?.items.find(item => item.projectId === discoveryProjectId)?.projectName ?? null;

  return (
    <div className={styles.app} lang={lang}>
      <a className={styles.skipLink} href="#projects-main">{copy.common.skip[lang]}</a>

      <header
        className={styles.topbar}
        inert={overlayOpen || drawerOpen || form !== null || workspaceNavigation !== null ? true : undefined}
      >
        <Link className={styles.brand} href="/">
          <span aria-hidden="true" className={styles.brandMark} />
          <span className={styles.brandText}>Rielia</span>
        </Link>

        <div className={styles.topbarWorkspace}>
          <label className={styles.srOnly} htmlFor="projects-workspace-select">{copy.header.workspaceSelector[lang]}</label>
          {workspaces !== null && workspaces.items.length > 0
            ? (
              <select
                aria-label={copy.header.workspaceSelector[lang]}
                disabled={anyPending}
                id="projects-workspace-select"
                onChange={event => { void selectWorkspace(event.currentTarget.value.length === 0 ? null : event.currentTarget.value); }}
                value={selection.workspaceId ?? ''}
              >
                {renderWorkspaceOptions()}
              </select>
            )
            : <span className={styles.workspaceName}>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>}
          <Link className={styles.workspaceLink} href="/workspaces">{copy.common.workspaces[lang]}</Link>
        </div>

        <div className={styles.topbarActions}>
          <label className={styles.localeField} htmlFor="projects-locale">
            <span>{copy.common.language[lang]}</span>
            <select id="projects-locale" onChange={event => onLanguage(event.currentTarget.value === 'en' ? 'en' : 'es')} value={lang}>
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
          <a className={styles.accountLink} href="/identity" rel="noopener noreferrer" target="_blank">
            {copy.common.account[lang]}
          </a>
        </div>
      </header>

      <div className={styles.shell}>
        <aside
          aria-label={copy.project.navLabel[lang]}
          className={cx(styles.sidebar, drawerOpen && styles.open)}
          inert={sidebarDrawer
            ? (!drawerOpen ? true : undefined)
            : (overlayOpen || form !== null || workspaceNavigation !== null ? true : undefined)}
          ref={sidebarRef}
          tabIndex={-1}
        >
          <div className={styles.sidebarHeader}>
            <div>
              <p className={styles.sidebarEyebrow}>{copy.common.workspace[lang]}</p>
              <h2 className={styles.sidebarTitle}>{workspace?.name ?? copy.header.workspaceFallback[lang]}</h2>
            </div>
            {sidebarDrawer && (
              <button aria-label={copy.common.closeMenu[lang]} className={styles.iconButton} data-autofocus onClick={closeDrawer} type="button">
                <IconClose size={20} />
              </button>
            )}
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>
              <span>{copy.discovery.navLabel[lang]}</span>
            </div>
            <nav aria-label={copy.discovery.navLabel[lang]}>
              <ul className={styles.projectNav}>
                <li>
                  <a
                    aria-current={taskScope === 'mine' ? 'page' : undefined}
                    className={cx(styles.navItem, styles.navItemPrimary, taskScope === 'mine' && styles.navItemActive)}
                    href={discoveryLink('mine')}
                    onClick={event => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      changeDiscoveryScope('mine');
                    }}
                  >
                    <span aria-hidden="true" className={styles.navItemIcon}><IconTask size={18} /></span>
                    <span className={styles.navItemMain}>
                      <span className={styles.navItemTitle}>{copy.discovery.myTasks[lang]}</span>
                      <span className={styles.navItemMeta}>{copy.discovery.myTasksMeta[lang]}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    aria-current={taskScope === 'search' ? 'page' : undefined}
                    className={cx(styles.navItem, taskScope === 'search' && styles.navItemActive)}
                    href={discoveryLink('search')}
                    onClick={event => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      changeDiscoveryScope('search');
                    }}
                  >
                    <span aria-hidden="true" className={styles.navItemIcon}><IconSearch size={18} /></span>
                    <span className={styles.navItemMain}>
                      <span className={styles.navItemTitle}>{copy.discovery.search[lang]}</span>
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>
              <span id="projects-nav-heading">{isArchivedProjects ? copy.project.archivedHeading[lang] : copy.project.activeHeading[lang]}</span>
              <span>{projects?.total ?? '—'}</span>
            </div>
            <nav aria-labelledby="projects-nav-heading">
              <ul className={styles.projectNav}>
                {projectList.map(item => {
                  const current = item.id === activeProjectId;
                  return (
                    <li key={item.id}>
                      <a
                        aria-current={current ? 'page' : undefined}
                        className={cx(styles.navItem, current && styles.navItemActive)}
                        href={item.url}
                        onClick={event => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                          event.preventDefault();
                          openProject(item.id);
                        }}
                      >
                        <span aria-hidden="true" className={styles.navItemIcon}><IconProject size={18} /></span>
                        <span className={styles.navItemMain}>
                          <span className={styles.navItemTitle}>{item.name}</span>
                          <span className={styles.navItemMeta}>
                            <span className={styles.taskKey}>{item.key}</span>
                            {item.archivedAt !== null && <span>{copy.project.archivedBadge[lang]}</span>}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {projects !== null && projectList.length === 0 && status !== 'loading' && (
              <p className={styles.sidebarEmpty}>
                {isArchivedProjects ? copy.status.emptyArchivedProjectsTitle[lang] : copy.status.emptyProjectsTitle[lang]}
              </p>
            )}
            {projects?.nextCursor !== null && projects !== null && (
              <button className={styles.navArchivedLink} disabled={anyPending} onClick={() => { void loadMore('projects'); }} type="button">
                {copy.common.loadMore[lang]}
              </button>
            )}
            {pageError?.collection === 'projects' && pageErrorBlock}
            <button
              aria-pressed={isArchivedProjects}
              className={styles.navArchivedLink}
              disabled={anyPending}
              onClick={toggleProjectsView}
              type="button"
            >
              <IconArchive size={16} />
              {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
            </button>
            {canCreateProject && (
              <button
                className={styles.navCreateLink}
                disabled={blocked || policyDraft !== null || moveDraft !== null || (draft !== null && draft.type !== 'create-project')}
                onClick={event => openProjectCreate(event.currentTarget)}
                type="button"
              >
                <IconPlus size={16} />
                {copy.project.createDisclosure[lang]}
              </button>
            )}
          </div>

          <div className={styles.navGroup}>
            <Link className={styles.navWorkspacesLink} href="/workspaces">
              {copy.common.workspaces[lang]}
            </Link>
          </div>
        </aside>

        {drawerOpen && (
          <button aria-label={copy.common.closeMenu[lang]} className={styles.sidebarBackdrop} onClick={closeDrawer} type="button" />
        )}

        <main className={styles.main} id="projects-main" inert={drawerOpen || form !== null || workspaceNavigation !== null ? true : undefined} tabIndex={-1}>
          <div className={styles.mobileHeader}>
            <button aria-label={copy.common.menu[lang]} className={styles.mobileMenuButton} onClick={openDrawer} type="button">
              <IconMenu size={20} />
            </button>
            <span className={styles.mobileTitle}>
              {taskScope === 'mine'
                ? copy.discovery.myTasks[lang]
                : taskScope === 'search'
                  ? copy.discovery.search[lang]
                  : project?.name ?? copy.header.projectsTitle[lang]}
            </span>
            {workspace !== null && (
              <button
                aria-label={copy.project.newProject[lang]}
                className={styles.mobileMenuButton}
                disabled={!canCreateProject || blocked || policyDraft !== null || moveDraft !== null || (draft !== null && draft.type !== 'create-project')}
                onClick={event => openProjectCreate(event.currentTarget)}
                type="button"
              >
                <IconPlus size={20} />
              </button>
            )}
          </div>

          {form === null && pageError !== null && (pageError.collection === 'workspaces' || pageError.collection === 'members') && pageErrorBlock}

          {status === 'loading' && (
            <StateCard
              body={copy.status.loadingBody}
              busy
              icon={<IconTask size={22} />}
              title={copy.status.loadingTitle}
            >
              <div aria-hidden="true" className={styles.skeletonList}>
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
              </div>
            </StateCard>
          )}

          {status === 'disabled' && (
            <StateCard body={copy.status.disabledBody} icon={<IconAlert size={22} />} title={copy.status.disabledTitle} />
          )}

          {status === 'signed-out' && (
            <StateCard
              actions={(
                <>
                  <a className={styles.primary} href="/identity" rel="noopener noreferrer" target="_blank">
                    {copy.status.signInNewTab[lang]}
                  </a>
                  <button className={styles.secondary} onClick={() => { void refresh(); }} type="button">
                    {copy.common.refresh[lang]}
                  </button>
                </>
              )}
              body={draft !== null || moveDraft !== null || moveRetryTarget !== null ? copy.status.signInReturnMemory : copy.status.signedOutBody}
              icon={<IconAlert size={22} />}
              title={copy.status.signedOutTitle}
            >
              {(draft !== null || moveDraft !== null || moveRetryTarget !== null) && <p className={styles.stateHint}>{copy.status.memoryKept[lang]}</p>}
            </StateCard>
          )}

          {status === 'forbidden' && (
            <StateCard
              actions={(
                <>
                  <button className={styles.primary} onClick={() => { void refresh(); }} type="button">{copy.common.refresh[lang]}</button>
                  <Link className={styles.secondary} href="/workspaces">{copy.common.workspaces[lang]}</Link>
                </>
              )}
              body={copy.status.forbiddenBody}
              icon={<IconAlert size={22} />}
              title={copy.status.forbiddenTitle}
            />
          )}

          {status === 'error' && (
            <StateCard
              actions={(
                <>
                  <button className={styles.primary} onClick={() => { void refresh(); }} type="button">{copy.status.retryLoad[lang]}</button>
                  <Link className={styles.secondary} href="/workspaces">{copy.common.workspaces[lang]}</Link>
                </>
              )}
              body={copy.status.errorBody}
              icon={<IconAlert size={22} />}
              title={copy.status.errorTitle}
            />
          )}

          {status === 'empty' && !hasWorkspace && (
            <StateCard
              actions={(
                <>
                  <Link className={styles.primary} href="/workspaces">{copy.status.goWorkspaces[lang]}</Link>
                  <button className={styles.secondary} onClick={() => { void refresh(); }} type="button">{copy.common.refresh[lang]}</button>
                </>
              )}
              body={copy.status.emptyWorkspaceBody}
              icon={<IconProject size={22} />}
              title={copy.status.emptyWorkspaceTitle}
            />
          )}

          {status === 'empty' && hasWorkspace && taskScope === 'project' && project === null && (
            <section aria-labelledby="projects-empty-heading">
              <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                  <p className={styles.eyebrow}>{copy.header.eyebrow[lang]}</p>
                  <h1 className={styles.title} id="projects-empty-heading" ref={projectHeadingRef} tabIndex={-1}>
                    {isArchivedProjects ? copy.project.archivedHeading[lang] : copy.header.projectsTitle[lang]}
                  </h1>
                  <p className={styles.lede}>{copy.header.projectsLede[lang]}</p>
                </div>
              </div>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionHint}>{workspace?.name}</span>
                <button className={styles.secondary} disabled={anyPending} onClick={toggleProjectsView} type="button">
                  {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
                </button>
              </div>
              {recoveryBlock}
              <EmptyState
                actions={isArchivedProjects
                  ? <button className={styles.secondary} disabled={anyPending} onClick={toggleProjectsView} type="button">{copy.project.viewActive[lang]}</button>
                  : canCreateProject
                    ? <button className={styles.primary} disabled={blocked || anyDraft} onClick={event => openProjectCreate(event.currentTarget)} type="button">{copy.project.createFirst[lang]}</button>
                    : undefined}
                body={isArchivedProjects
                  ? copy.status.emptyArchivedProjectsBody
                  : canCreateProject
                    ? copy.status.emptyProjectsBody
                    : copy.status.emptyProjectsViewerBody}
                icon={isArchivedProjects ? <IconArchive size={22} /> : <IconProject size={22} />}
                title={isArchivedProjects ? copy.status.emptyArchivedProjectsTitle : copy.status.emptyProjectsTitle}
              />
            </section>
          )}

          {status === 'ready' && taskScope !== 'project' && (
            <div className={cx(styles.workLayout, detailOpen && styles.workLayoutOpen)}>
              <section className={styles.listColumn} inert={overlayOpen ? true : undefined}>
                <header className={styles.mainHeader}>
                  <nav aria-label={copy.common.workspaces[lang]} className={styles.breadcrumb}>
                    <Link href="/workspaces">{copy.common.workspaces[lang]}</Link>
                    <span aria-hidden="true" className={styles.breadcrumbSeparator}>/</span>
                    <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
                  </nav>
                  <div className={styles.pageTitleRow}>
                    <div className={styles.titleBlock}>
                      <h1 className={styles.title} ref={discoveryHeadingRef} tabIndex={-1}>
                        {taskScope === 'mine' ? copy.discovery.myTasks[lang] : copy.discovery.search[lang]}
                      </h1>
                      <p className={styles.lede}>
                        {taskScope === 'mine' ? copy.discovery.myTasksLede[lang] : copy.discovery.searchLede[lang]}
                      </p>
                      <div className={styles.metaLine}>
                        <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
                        <span>{taskScope === 'mine' ? copy.discovery.myTasksMeta[lang] : copy.discovery.searchMeta[lang]}</span>
                      </div>
                    </div>
                  </div>
                </header>

                <LiveUpdateNotice
                  disabled={anyPending}
                  onRefresh={() => { void refresh(); }}
                  refreshDeferred={refreshDeferred}
                  refreshRequired={refreshRequired}
                  status={streamStatus}
                />

                {!isArchivedTasks && (
                  <TaskCreateShortcut
                    disabled={blocked || anyDraft}
                    onChoose={chooseProjectForCapture}
                    projects={projectList}
                  />
                )}

                <TaskDiscoveryBar
                  archived={isArchivedTasks}
                  disabled={anyPending}
                  filters={taskView.filters}
                  onClearFilters={clearDiscoveryFilters}
                  onFilters={filters => { if (!anyPending) void setTaskFilters(filters); }}
                  onProject={projectId => { if (!anyPending) void setDiscoveryProject(projectId); }}
                  onScope={changeDiscoveryScope}
                  onSearch={value => { if (!anyPending) void setSearchQuery(value); }}
                  onToggleArchive={toggleTasksView}
                  projects={projectList}
                  projectId={discoveryProjectId}
                  query={searchQuery}
                  scope={taskScope}
                  selectedProjectName={discoveryProjectName}
                />

                {!feedbackInForm && recoveryBlock}

                <h2 className={styles.srOnly}>{copy.discovery.resultsHeading[lang]}</h2>

                <TaskDiscoveryList
                  archived={isArchivedTasks}
                  contextLimit={discoveryContextLimitReached}
                  disabled={anyPending}
                  discovery={discovery}
                  filters={taskView.filters}
                  onClearFilters={clearDiscoveryFilters}
                  onClearQuery={() => { if (!anyPending) void setSearchQuery(''); }}
                  onLoadMore={() => { void loadDiscoveryMore(); }}
                  onOpen={openDiscoveryRow}
                  onRefresh={() => { void refresh(); }}
                  projectId={discoveryProjectId}
                  query={searchQuery}
                  scope={taskScope}
                />
              </section>

              {renderTaskDetail()}
            </div>
          )}

          {status === 'ready' && taskScope === 'project' && project !== null && (
            <div className={cx(styles.workLayout, detailOpen && styles.workLayoutOpen)}>
              <section className={styles.listColumn} inert={overlayOpen ? true : undefined}>
                <header className={styles.mainHeader}>
                  <nav aria-label={copy.common.workspaces[lang]} className={styles.breadcrumb}>
                    <Link href="/workspaces">{copy.common.workspaces[lang]}</Link>
                    <span aria-hidden="true" className={styles.breadcrumbSeparator}>/</span>
                    <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
                  </nav>
                  <div className={styles.pageTitleRow}>
                    <div className={styles.titleBlock}>
                      <div className={styles.titleLine}>
                        <h1 className={styles.title} ref={projectHeadingRef} tabIndex={-1}>{project.name}</h1>
                        <span className={styles.titleKey}>{project.key}</span>
                        {projectArchived && <Badge tone="archived">{copy.project.archivedBadge[lang]}</Badge>}
                      </div>
                      {project.description.length > 0 && <p className={cx(styles.lede, styles.projectLede)}>{project.description}</p>}
                      <div className={styles.metaLine}>
                        <span className={styles.visibilityLine}>
                          <Badge tone={project.visibility === 'private' ? 'warning' : 'neutral'}>
                            {visibilityName(project.visibility)[lang]}
                          </Badge>
                          {project.visibility === 'workspace'
                            ? null
                            : <span>{canManageAccess ? copy.project.visibilityAutoAccess[lang] : copy.project.visibilityGranted[lang]}</span>}
                        </span>
                        <span>
                          {taskSummary.status === 'ready' && taskSummary.total !== null
                            ? projectTaskCount(taskSummary.total, lang)
                            : taskSummary.status === 'loading'
                              ? copy.common.loading[lang]
                              : taskSummary.status === 'changed'
                                ? copy.taskView.countChanged[lang]
                                : copy.taskView.countPartial[lang]}
                        </span>
                        <span>
                          {copy.task.creatorLabel[lang]}: {project.creator.name}
                          {project.creator.kind === 'agent' && <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>}
                        </span>
                      </div>
                    </div>
                    {hasProjectActions && (
                      <div className={cx(styles.pageActions, narrow && styles.pageActionsCompact)}>
                        {narrow
                          ? (
                            <details
                              className={styles.projectOptions}
                              onKeyDown={event => {
                                if (event.key !== 'Escape') return;
                                event.currentTarget.removeAttribute('open');
                                event.currentTarget.querySelector<HTMLElement>('summary')?.focus();
                              }}
                            >
                              <summary
                                aria-label={copy.project.optionsMenu[lang]}
                                className={styles.projectOptionsSummary}
                                onClick={event => event.currentTarget.focus()}
                                onKeyDown={event => {
                                  if (event.key !== 'Enter' && event.key !== ' ') return;
                                  event.preventDefault();
                                  const details = event.currentTarget.closest('details');
                                  if (details !== null) details.open = !details.open;
                                }}
                              >
                                {copy.project.options[lang]}
                                <IconChevron size={16} />
                              </summary>
                              <div className={styles.projectOptionsMenu}>
                                {renderProjectActions(true)}
                              </div>
                            </details>
                          )
                          : renderProjectActions(false)}
                      </div>
                    )}
                  </div>
                </header>

                {projectArchived && (
                  <FeedbackPanel
                    actions={canRestoreProject
                      ? <button className={styles.primary} disabled={blocked || anyDraft} onClick={event => requestProjectArchive(true, event.currentTarget)} type="button">{copy.project.restore[lang]}</button>
                      : undefined}
                    body={copy.project.archivedNotice}
                    title={copy.project.archivedBadge}
                    tone="warning"
                  />
                )}

                {!project.capabilities.canEdit && !projectArchived && (
                  <FeedbackPanel body={copy.task.viewerBody} title={copy.task.viewerTitle} tone="info" />
                )}

                <LiveUpdateNotice
                  disabled={anyPending}
                  onRefresh={() => { void refresh(); }}
                  refreshDeferred={refreshDeferred}
                  refreshRequired={refreshRequired}
                  status={streamStatus}
                />

                <TaskViewBar
                  assigneeError={policyPageErrors.assignees !== undefined}
                  assigneeLoading={assignees === null && policyPageErrors.assignees === undefined}
                  assigneeStatus={taskFilterAssigneeStatus}
                  assignees={assignees}
                  assigneesNext={assignees !== null && assignees.nextCursor !== null}
                  disabled={anyPending}
                  onFilters={filters => { void setTaskFilters(filters); }}
                  onLayout={layout => { void setTaskLayout(layout); }}
                  onLoadMoreAssignees={() => { void loadMore('assignees'); }}
                  onRefresh={() => { void refresh(); }}
                  onToggleArchive={toggleTasksView}
                  selectedTaskAssignee={selectedTaskAssignee}
                  taskSummary={taskSummary}
                  taskView={taskView}
                  viewsTasks={views.tasks}
                />

                {!feedbackInForm && recoveryBlock}

                {taskView.layout === 'list' && canCapture && (draft === null || draft.type === 'create-task' && draft.projectId === project.id) && (
                  <TaskCaptureForm
                    disabled={!canCapture}
                    inputRef={captureRef}
                    onChange={stageCapture}
                    onSubmit={submitCapture}
                    pending={pending === 'create-task'}
                    value={captureTitle}
                  />
                )}

                {taskView.layout === 'list' && tasks !== null && (
                  <TaskList
                    archivedView={isArchivedTasks}
                    canCreate={canCapture}
                    canMove={canMoveTask}
                    changed={taskPageChanged}
                    columnCounts={tasks.columnCounts}
                    filtersActive={filtersActive}
                    hasMore={tasks.nextCursor !== null}
                    onClearFilters={() => { void setTaskFilters({}); }}
                    onCreate={() => captureRef.current?.focus()}
                    onLoadMore={() => { void loadMore('tasks'); }}
                    onMove={(target, status) => performMove(target, status, null)}
                    onMoveBefore={(target, beforeTaskId) => performMoveBefore(target, target.status, beforeTaskId)}
                    onMoveEnd={target => performMoveEnd(target, target.status)}
                    onOpen={selectTaskFromList}
                    onRestore={(target, opener) => requestTaskArchive(true, target, opener)}
                    partial={taskPagePartial}
                    pending={blocked || anyDraft}
                    pendingTaskId={pendingTaskId}
                    readOnly={readOnlyTasks}
                    tasks={taskList}
                    total={taskSummary.status === 'ready' ? taskSummary.total : null}
                  />
                )}

                {taskView.layout === 'board' && (
                  <TaskBoard
                    canCreate={canCapture && draft === null}
                    canMove={canMoveTask}
                    capture={columnCaptureOpen && (taskView.filters.status === undefined || taskView.filters.status === captureStatus)
                      ? { status: captureStatus, title: captureTitle }
                      : null}
                    capturePending={pending === 'create-task'}
                    filtersActive={filtersActive}
                    onBeginCapture={beginColumnCapture}
                    onCancelCapture={cancelColumnCapture}
                    onCaptureChange={stageCapture}
                    onClearFilters={() => { void setTaskFilters({}); }}
                    onLoadColumn={status => { void loadTaskColumn(status); }}
                    onMove={performMove}
                    onMoveBefore={performMoveBefore}
                    onMoveEnd={performMoveEnd}
                    onOpenTask={selectTaskFromList}
                    onRefresh={() => { void refresh(); }}
                    onSetColumn={status => { void setTaskColumn(status); }}
                    onSubmitCapture={submitColumnCapture}
                    pendingTaskId={pendingTaskId}
                    readOnly={readOnlyTasks}
                    taskColumnErrors={taskColumnErrors}
                    taskColumns={taskColumns}
                    taskColumnsChanged={taskColumnsChanged}
                    taskView={taskView}
                  />
                )}

                {taskView.layout === 'list' && taskPageErrorBlock}
              </section>

              {renderTaskDetail()}
            </div>
          )}
        </main>
      </div>

      {form !== null && workspaceNavigation === null && (
        <ModalFrame
          busy={anyPending}
          eyebrow={form.kind === 'project-access'
            ? copy.common.project
            : form.kind === 'project-create' || form.kind === 'project-edit'
              ? copy.common.project
              : form.kind === 'task-edit' || form.kind === 'task-archive' || form.kind === 'task-restore'
                ? copy.common.task
                : copy.common.project}
          onClose={closeForm}
          small={form.kind === 'project-archive' || form.kind === 'project-restore' || form.kind === 'task-archive' || form.kind === 'task-restore'}
          title={modalTitle(form)}
          wide={form.kind === 'project-access'}
        >
          {closeWarningNode}
          {form.kind === 'project-access'
            ? (project === null || outcome === 'forbidden' ? policyFeedbackNode : null)
            : feedbackNode}
          {pageError?.collection === 'members' && pageErrorBlock}
          {form.kind === 'project-access' && project !== null && outcome !== 'forbidden' && (
            <ProjectAccessPanel
              access={projectAccess}
              accessError={policyPageErrors.projectAccess ?? null}
              feedback={policyFeedbackNode}
              onReviewAccess={reviewAccess}
              onDiscard={() => { discardDraft(); }}
              onLoadMore={() => { void loadMore('projectAccess'); }}
              onRefresh={() => { void refresh(); }}
              onStageVisibility={stageVisibilityChange}
              onSubmit={submitPolicy}
              onSubmitVisibility={submitPolicy}
              policyDraft={policyDraft}
              policyMember={policyMember}
              policyPending={policyPending}
              policyRetryTarget={policyRetryTarget}
              project={project}
            />
          )}
          {outcome !== 'forbidden' && (form.kind === 'project-create' || form.kind === 'project-edit') && (
            <>
              <p className={styles.stateHint}>
                {form.kind === 'project-create' ? copy.project.createBody[lang] : copy.project.settingsBody[lang]}
              </p>
              <ProjectForm
                canCreatePrivate={canCreatePrivate}
                mode={form.kind === 'project-create' ? 'create' : 'edit'}
                onChange={stageProject}
                onCancel={closeForm}
                onSubmit={submitProjectForm}
                pending={pending !== null}
                disabled={retryTarget !== null || policyBlocked}
                value={projectValue}
              />
            </>
          )}
          {outcome !== 'forbidden' && form.kind === 'task-edit' && project !== null && (
            <TaskEditForm
              assignees={assigneeOptions}
              assigneesError={policyPageErrors.assignees !== undefined}
              assigneesLoading={assignees === null && policyPageErrors.assignees === undefined}
              assigneesNext={assignees !== null && assignees.nextCursor !== null}
              assigneesPageMissing={assignees === null}
              onChange={stageTask}
              onCancel={closeForm}
              onLoadMoreAssignees={() => { void loadMore('assignees'); }}
              onSubmit={submitTaskForm}
              pending={pending !== null}
              disabled={retryTarget !== null || policyBlocked}
              projectKey={project.key}
              projectName={project.name}
              value={taskValue}
            />
          )}
          {outcome !== 'forbidden' && (form.kind === 'project-archive' || form.kind === 'project-restore') && (
            <ConfirmBox
              busy={pending !== null}
              disabled={retryTarget !== null || policyBlocked}
              consequence={form.kind === 'project-archive' ? copy.project.archiveConsequence : copy.project.restoreConsequence}
              confirmLabel={form.kind === 'project-archive' ? copy.project.archive : copy.project.restore}
              danger={form.kind === 'project-archive'}
              onCancel={() => { discardCurrentDraft(); closeForm(); }}
              onConfirm={confirmLifecycle}
              pendingLabel={pendingCopy(formCommandType(form.kind))}
              title={form.kind === 'project-archive' ? copy.project.archiveConfirmTitle : copy.project.restore}
            />
          )}
          {outcome !== 'forbidden' && (form.kind === 'task-archive' || form.kind === 'task-restore') && (
            <ConfirmBox
              busy={pending !== null}
              disabled={retryTarget !== null}
              consequence={form.kind === 'task-archive' ? copy.task.archiveConsequence : copy.task.restoreConsequence}
              confirmLabel={form.kind === 'task-archive' ? copy.task.archive : copy.task.restore}
              danger={form.kind === 'task-archive'}
              onCancel={() => { discardCurrentDraft(); closeForm(); }}
              onConfirm={confirmLifecycle}
              pendingLabel={pendingCopy(formCommandType(form.kind))}
              title={form.kind === 'task-archive' ? copy.task.archiveConfirmTitle : copy.task.restore}
            />
          )}
        </ModalFrame>
      )}

      {workspaceNavigation !== null && (
        <ModalFrame
          busy={mutationPending !== null}
          eyebrow={copy.common.workspace}
          onClose={() => resolveWorkspaceChoice('stay')}
          small
          title={copy.workspaceGuard.title}
        >
          <p className={styles.stateHint}>
            {copy.workspaceGuard.body[lang](
              workspaces?.items.find(item => item.id === workspaceNavigation.workspaceId)?.name
                ?? copy.workspaceGuard.targetFallback[lang],
            )}
          </p>
          {mutationPending !== null && (
            <p className={styles.stateHint} role="status">{copy.workspaceGuard.pending[lang]}</p>
          )}
          <div className={styles.formActions}>
            <button
              className={styles.primary}
              data-autofocus
              onClick={() => resolveWorkspaceChoice('stay')}
              type="button"
            >
              {copy.workspaceGuard.stay[lang]}
            </button>
            <button
              className={styles.dangerButton}
              disabled={mutationPending !== null}
              onClick={() => resolveWorkspaceChoice('discard')}
              type="button"
            >
              {copy.workspaceGuard.discard[lang]}
            </button>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}

function modalTitle(form: FormState): Bilingual {
  switch (form.kind) {
    case 'project-create': return copy.project.createTitle;
    case 'project-edit': return copy.project.settingsTitle;
    case 'project-access': return copy.access.title;
    case 'task-edit': return copy.task.editTitle;
    case 'project-archive': return copy.project.archiveTitle;
    case 'project-restore': return copy.project.restore;
    case 'task-archive': return copy.task.archiveTitle;
    case 'task-restore': return copy.task.restore;
  }
}


