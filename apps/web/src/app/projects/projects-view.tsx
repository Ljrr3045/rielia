'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  isProject,
  isTask,
  type DomainPerson,
  type Project,
  type ProjectTaskCommand,
  type ProjectTaskResult,
  type Task,
  type TaskFields,
  type WorkspaceMember,
} from '@rielia/contracts';
import { useProjectTasks } from '../../lib/use-project-tasks';
import { ConflictPanel, FeedbackPanel, type ConflictFieldView } from './feedback';
import { ProjectForm, type ProjectFormValue } from './project-forms';
import {
  Badge,
  ConfirmBox,
  EmptyState,
  IconAlert,
  IconArchive,
  IconClose,
  IconMenu,
  IconPlus,
  IconProject,
  IconRestore,
  IconSettings,
  IconTask,
  LocaleProvider,
  ModalFrame,
  StateCard,
  cx,
  useBodyScrollLock,
  useFocusTrap,
  useIsDetailOverlay,
  useIsSidebarDrawer,
} from './project-ui';
import { TaskCaptureForm, TaskEditForm } from './task-forms';
import { TaskDetail } from './task-detail';
import { TaskDescription } from './task-description';
import { TaskList } from './task-list';
import {
  copy,
  formatDateOnly,
  priorityName,
  projectTaskCount,
  statusName,
  typeName,
  type Bilingual,
  type Lang,
} from './strings';
import styles from './projects.module.css';

type FormState =
  | { kind: 'project-create'; workspaceId: string }
  | { kind: 'project-edit'; workspaceId: string; projectId: string; version: number }
  | { kind: 'task-edit'; workspaceId: string; projectId: string; taskId: string; version: number }
  | { kind: 'project-archive' | 'project-restore'; workspaceId: string; projectId: string; version: number }
  | { kind: 'task-archive' | 'task-restore'; workspaceId: string; projectId: string; taskId: string; version: number };

const emptyProject: ProjectFormValue = { name: '', key: '', description: '' };
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

function memberActive(member: WorkspaceMember): boolean {
  return member.state === 'active' && member.principalState === 'active';
}

function memberPerson(member: WorkspaceMember): DomainPerson {
  return { principalId: member.principalId, name: member.name, kind: member.kind, active: memberActive(member) };
}

function formCommandType(kind: FormState['kind']): ProjectTaskCommand['type'] {
  switch (kind) {
    case 'project-create': return 'create-project';
    case 'project-edit': return 'edit-project';
    case 'project-archive': return 'archive-project';
    case 'project-restore': return 'restore-project';
    case 'task-edit': return 'edit-task';
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
    status, workspaces, workspace, members, projects, project, tasks, task,
    selection, views, draft, pending, outcome, retryTarget, conflict, result, pageError,
    refresh, selectWorkspace, selectProject, selectTask, setView, loadMore,
    stage, submit, retrySave, discardDraft, returnToDraft, reloadConflict, rebaseDraft, dismissOutcome, dismissPageError,
  } = projectTasks;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [projectValue, setProjectValue] = useState<ProjectFormValue>(emptyProject);
  const [taskValue, setTaskValue] = useState<TaskFields>(emptyTask);
  const [captureTitle, setCaptureTitle] = useState('');
  const [resumeDraftOnReady, setResumeDraftOnReady] = useState(false);
  const captureRef = useRef<HTMLInputElement>(null);
  const projectHeadingRef = useRef<HTMLHeadingElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const drawerOpenerRef = useRef<HTMLElement | null>(null);
  const modalOpenerRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lastCommandRef = useRef<ProjectTaskCommand | null>(null);
  const hadDetailRef = useRef(false);

  const sidebarDrawer = useIsSidebarDrawer();
  const detailOverlay = useIsDetailOverlay();
  const detailOpen = task !== null && selection.taskId !== null;
  const overlayOpen = detailOverlay && detailOpen;
  const blocked = pending !== null || retryTarget !== null;
  const activeProjectId = project?.id ?? selection.projectId;
  const projectArchived = project?.archivedAt != null;
  const canCreateProject = projects?.capabilities.canCreate === true && views.projects === 'active';
  const canCapture = tasks?.capabilities.canCreate === true
    && project !== null
    && !projectArchived
    && project.capabilities.canEdit
    && views.tasks === 'active';
  const canEditProject = project?.capabilities.canEdit === true && !projectArchived;
  const canArchiveProject = project?.capabilities.canArchive === true && !projectArchived;
  const canRestoreProject = project?.capabilities.canRestore === true && projectArchived;

  const membersList: readonly WorkspaceMember[] = members?.items ?? [];
  const assigneeMembers: readonly DomainPerson[] = (() => {
    const list: DomainPerson[] = [];
    const seen = new Set<string>();
    for (const member of membersList) {
      if (member.kind !== 'human' && member.kind !== 'agent') continue;
      const person = memberPerson(member);
      if (!person.active && person.principalId !== taskValue.assigneePrincipalId) continue;
      if (seen.has(person.principalId)) continue;
      seen.add(person.principalId);
      list.push(person);
    }
    const current = task?.assignee;
    if (current !== undefined && current !== null) {
      if (!seen.has(current.principalId)) list.push(current);
    }
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
    if (!form) return;
    if (form.workspaceId !== selection.workspaceId
      || ('projectId' in form && form.projectId !== selection.projectId)
      || ('taskId' in form && form.taskId !== selection.taskId)) {
      setForm(null);
    }
  }, [form, selection.workspaceId, selection.projectId, selection.taskId]);

  useEffect(() => {
    if (outcome === 'success' && form !== null) setForm(null);
    if (outcome === 'success') setCaptureTitle('');
  }, [outcome, form]);

  useEffect(() => {
    if (status === 'signed-out' && form !== null) setForm(null);
  }, [status, form]);

  useEffect(() => {
    if (form !== null) return;
    if (draft?.type === 'create-task' && draft.projectId === selection.projectId) {
      setCaptureTitle(draft.fields.title);
      return;
    }
    if (draft === null || draft.type !== 'create-task' || draft.projectId !== selection.projectId) {
      setCaptureTitle('');
    }
  }, [draft, form, selection.projectId]);

  useEffect(() => {
    if (!resumeDraftOnReady || !draft) return;
    if (draft.type === 'create-project' ? status !== 'ready' && status !== 'empty' : status !== 'ready') return;
    if (!commandMatches(draft, selection)) return;
    setResumeDraftOnReady(false);
    resumeDraft(draft);
  }, [resumeDraftOnReady, draft, status, selection, project, task, tasks, views.tasks]);

  function resumeDraft(command: ProjectTaskCommand) {
    // Resumed forms have no user-clicked opener. Never restore focus to a
    // control left behind by a previously closed modal.
    modalOpenerRef.current = null;
    if (command.type === 'create-project') {
      setProjectValue({ name: command.name, key: command.key, description: command.description ?? '' });
      setForm({ kind: 'project-create', workspaceId: command.workspaceId });
      return;
    }
    if (command.type === 'edit-project') {
      const key = project?.id === command.projectId
        ? project.key
        : projects?.items.find(item => item.id === command.projectId)?.key ?? '';
      setProjectValue({ name: command.name, key, description: command.description });
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
    requestAnimationFrame(() => {
      if (hadForm) {
        const opener = modalOpenerRef.current;
        if (opener !== null && opener.isConnected) {
          opener.focus();
          return;
        }
      }
      const detailHeading = document.querySelector<HTMLElement>('[data-detail-heading]');
      const fallback = detailHeading ?? projectHeadingRef.current ?? document.getElementById('projects-main');
      fallback?.focus();
    });
  }

  function closeForm() {
    setForm(null);
    focusDismissedSurface(true);
  }

  function openProjectCreate(opener?: HTMLElement) {
    if (!workspace || !canCreateProject || blocked) return;
    if (draft !== null && draft.type !== 'create-project') return;
    rememberOpener(opener);
    const value = draft?.type === 'create-project'
      ? { name: draft.name, key: draft.key, description: draft.description ?? '' }
      : emptyProject;
    setProjectValue(value);
    setForm({ kind: 'project-create', workspaceId: workspace.id });
    dismissOutcome();
  }

  function openProjectSettings(opener?: HTMLElement) {
    if (!project || !canEditProject || blocked) return;
    if (draft !== null && !(draft.type === 'edit-project' && draft.projectId === project.id)) return;
    rememberOpener(opener);
    const value = draft?.type === 'edit-project'
      ? { name: draft.name, key: project.key, description: draft.description }
      : { name: project.name, key: project.key, description: project.description };
    setProjectValue(value);
    setForm({ kind: 'project-edit', workspaceId: project.workspaceId, projectId: project.id, version: project.version });
    dismissOutcome();
  }

  function openTaskEdit(opener?: HTMLElement) {
    if (!task || blocked || !task.capabilities.canEdit || task.archivedAt !== null || projectArchived) return;
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
    if (!project || blocked || draft !== null) return;
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
    if (!target || blocked || draft !== null) return;
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

  function stageCapture(title: string) {
    setCaptureTitle(title);
    if (!canCapture || !project || blocked) return;
    stage({ type: 'create-task', workspaceId: project.workspaceId, projectId: project.id, fields: { title } });
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
      };
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
      fields: { title },
    };
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
    discardDraft();
    setForm(null);
    setCaptureTitle('');
    setResumeDraftOnReady(false);
    focusDismissedSurface(hadForm);
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
            : assigneeMembers.find(member => member.principalId === nextFields.assigneePrincipalId)?.name ?? nextFields.assigneePrincipalId),
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

  const draftMatches = draft === null ? true : commandMatches(draft, selection);
  const retryMatches = retryTarget === null ? true : commandMatches(retryTarget, selection);
  const draftVisibleInCapture = draft?.type === 'create-task'
    && draft.projectId === selection.projectId
    && views.tasks === 'active'
    && canCapture
    && form === null;
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
  const feedbackInForm = form !== null;

  const feedbackNode: ReactNode = (() => {
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

  const recoveryBlock = (
    <>
      {draftInDetail ? null : draftBanner}
      {feedbackInDetail ? null : feedbackNode}
    </>
  );

  const pageErrorBlock: ReactNode = pageError === null
    ? null
    : (
      <FeedbackPanel
        actions={(
          <>
            <button className={styles.secondary} disabled={pending !== null} onClick={() => { void loadMore(pageError.collection); }} type="button">
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

  function openProject(projectId: string) {
    if (pending !== null) return;
    void selectProject(projectId);
    closeDrawer();
  }

  function toggleProjectsView() {
    if (pending !== null) return;
    void setView('projects', views.projects === 'active' ? 'archived' : 'active');
    closeDrawer();
  }

  function toggleTasksView() {
    if (pending !== null) return;
    void setView('tasks', views.tasks === 'active' ? 'archived' : 'active');
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

  const projectList = projects?.items ?? [];
  const taskList = tasks?.items ?? [];
  const isArchivedProjects = views.projects === 'archived';
  const isArchivedTasks = views.tasks === 'archived';
  const hasWorkspace = workspace !== null || (workspaces?.items.length ?? 0) > 0;

  return (
    <div className={styles.app} lang={lang}>
      <a className={styles.skipLink} href="#projects-main">{copy.common.skip[lang]}</a>

      <header
        className={styles.topbar}
        inert={overlayOpen || drawerOpen || form !== null ? true : undefined}
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
                disabled={pending !== null}
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
            : (overlayOpen || form !== null ? true : undefined)}
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
              <button className={styles.navArchivedLink} disabled={pending !== null} onClick={() => { void loadMore('projects'); }} type="button">
                {copy.common.loadMore[lang]}
              </button>
            )}
            {pageError?.collection === 'projects' && pageErrorBlock}
            <button
              aria-pressed={isArchivedProjects}
              className={styles.navArchivedLink}
              disabled={pending !== null}
              onClick={toggleProjectsView}
              type="button"
            >
              <IconArchive size={16} />
              {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
            </button>
            {canCreateProject && (
              <button
                className={styles.navCreateLink}
                disabled={blocked || (draft !== null && draft.type !== 'create-project')}
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

        <main className={styles.main} id="projects-main" inert={drawerOpen || form !== null ? true : undefined} tabIndex={-1}>
          <div className={styles.mobileHeader}>
            <button aria-label={copy.common.menu[lang]} className={styles.mobileMenuButton} onClick={openDrawer} type="button">
              <IconMenu size={20} />
            </button>
            <span className={styles.mobileTitle}>{project?.name ?? copy.header.projectsTitle[lang]}</span>
            {workspace !== null && (
              <button
                aria-label={copy.project.newProject[lang]}
                className={styles.mobileMenuButton}
                disabled={!canCreateProject || blocked || (draft !== null && draft.type !== 'create-project')}
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
              body={draft !== null ? copy.status.signInReturnMemory : copy.status.signedOutBody}
              icon={<IconAlert size={22} />}
              title={copy.status.signedOutTitle}
            >
              {draft !== null && <p className={styles.stateHint}>{copy.status.memoryKept[lang]}</p>}
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

          {status === 'empty' && hasWorkspace && project === null && (
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
                <button className={styles.secondary} onClick={toggleProjectsView} type="button">
                  {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
                </button>
              </div>
              {recoveryBlock}
              <EmptyState
                actions={isArchivedProjects
                  ? <button className={styles.secondary} onClick={toggleProjectsView} type="button">{copy.project.viewActive[lang]}</button>
                  : canCreateProject
                    ? <button className={styles.primary} onClick={event => openProjectCreate(event.currentTarget)} type="button">{copy.project.createFirst[lang]}</button>
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

          {status === 'ready' && project !== null && (
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
                      {project.description.length > 0 && <p className={styles.lede}>{project.description}</p>}
                      <div className={styles.metaLine}>
                        <span>{copy.project.visibilityWorkspace[lang]}</span>
                        {tasks !== null && <span>{projectTaskCount(tasks.total, lang)}</span>}
                        <span>
                          {copy.task.creatorLabel[lang]}: {project.creator.name}
                          {project.creator.kind === 'agent' && <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>}
                        </span>
                      </div>
                    </div>
                    <div className={styles.pageActions}>
                      {canEditProject && (
                        <button className={styles.secondary} disabled={blocked || (draft !== null && !(draft.type === 'edit-project' && draft.projectId === project.id))} onClick={event => openProjectSettings(event.currentTarget)} type="button">
                          <IconSettings size={16} />
                          {copy.project.settingsTitle[lang]}
                        </button>
                      )}
                      {canArchiveProject && (
                        <button className={styles.secondary} disabled={blocked || draft !== null} onClick={event => requestProjectArchive(false, event.currentTarget)} type="button">
                          <IconArchive size={16} />
                          {copy.project.archive[lang]}
                        </button>
                      )}
                      {canRestoreProject && (
                        <button className={styles.primary} disabled={blocked || draft !== null} onClick={event => requestProjectArchive(true, event.currentTarget)} type="button">
                          <IconRestore size={16} />
                          {copy.project.restore[lang]}
                        </button>
                      )}
                    </div>
                  </div>
                </header>

                {projectArchived && (
                  <FeedbackPanel
                    actions={canRestoreProject
                      ? <button className={styles.primary} disabled={blocked || draft !== null} onClick={event => requestProjectArchive(true, event.currentTarget)} type="button">{copy.project.restore[lang]}</button>
                      : undefined}
                    body={copy.project.archivedNotice}
                    title={copy.project.archivedBadge}
                    tone="warning"
                  />
                )}

                {!project.capabilities.canEdit && !projectArchived && (
                  <FeedbackPanel body={copy.task.viewerBody} title={copy.task.viewerTitle} tone="info" />
                )}

                <div className={styles.toolbar}>
                  <div className={styles.toolbarCount}>
                    <IconTask size={16} />
                    <span>
                      {isArchivedTasks
                        ? copy.project.archivedTaskCount[lang](tasks?.total ?? 0)
                        : copy.project.taskCount[lang](tasks?.total ?? 0)}
                    </span>
                  </div>
                  <div className={styles.toolbarActions}>
                    <button className={styles.secondary} disabled={pending !== null} onClick={toggleTasksView} type="button">
                      <IconArchive size={16} />
                      {isArchivedTasks ? copy.task.viewActive[lang] : copy.task.viewArchived[lang]}
                    </button>
                  </div>
                </div>

                {!feedbackInForm && recoveryBlock}

                {canCapture && (draft === null || draft.type === 'create-task' && draft.projectId === project.id) && (
                  <TaskCaptureForm
                    disabled={retryTarget !== null}
                    inputRef={captureRef}
                    onChange={stageCapture}
                    onSubmit={submitCapture}
                    pending={pending === 'create-task'}
                    value={captureTitle}
                  />
                )}

                {tasks !== null && (
                  <TaskList
                    archivedView={isArchivedTasks}
                    canCreate={canCapture}
                    hasMore={tasks.nextCursor !== null}
                    onCreate={() => captureRef.current?.focus()}
                    onLoadMore={() => { void loadMore('tasks'); }}
                    onOpen={selectTaskFromList}
                    onRestore={(task, opener) => requestTaskArchive(true, task, opener)}
                    pending={pending !== null}
                    tasks={taskList}
                  />
                )}
                {pageError?.collection === 'tasks' && pageErrorBlock}
              </section>

              {task !== null && (
                <div>
                  <TaskDetail
                    description={task.description.length > 0 ? <TaskDescription source={task.description} /> : undefined}
                    feedback={form === null && (feedbackInDetail || draftInDetail)
                      ? (
                        <>
                          {draftInDetail ? draftBanner : null}
                          {feedbackInDetail ? feedbackNode : null}
                        </>
                      )
                      : undefined}
                    onArchive={opener => requestTaskArchive(false, task, opener)}
                    onClose={() => { void selectTask(null); }}
                    onEdit={openTaskEdit}
                    onRestore={opener => requestTaskArchive(true, task, opener)}
                    modalOpen={form !== null}
                    overlay={detailOverlay}
                    projectArchived={projectArchived}
                    task={task}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {form !== null && (
        <ModalFrame
          busy={pending !== null}
          eyebrow={form.kind === 'project-create' || form.kind === 'project-edit'
            ? copy.common.project
            : form.kind === 'task-edit' || form.kind === 'task-archive' || form.kind === 'task-restore'
              ? copy.common.task
              : copy.common.project}
          onClose={closeForm}
          small={form.kind === 'project-archive' || form.kind === 'project-restore' || form.kind === 'task-archive' || form.kind === 'task-restore'}
          title={modalTitle(form)}
        >
          {feedbackNode}
          {pageError?.collection === 'members' && pageErrorBlock}
          {outcome !== 'forbidden' && (form.kind === 'project-create' || form.kind === 'project-edit') && (
            <>
              <p className={styles.stateHint}>
                {form.kind === 'project-create' ? copy.project.createBody[lang] : copy.project.settingsBody[lang]}
              </p>
              <ProjectForm
                mode={form.kind === 'project-create' ? 'create' : 'edit'}
                onChange={stageProject}
                onCancel={closeForm}
                onSubmit={submitProjectForm}
                pending={pending !== null}
                disabled={retryTarget !== null}
                value={projectValue}
              />
            </>
          )}
          {outcome !== 'forbidden' && form.kind === 'task-edit' && project !== null && (
            <TaskEditForm
              members={assigneeMembers}
              onChange={stageTask}
              onCancel={closeForm}
              onSubmit={submitTaskForm}
              pending={pending !== null}
              disabled={retryTarget !== null}
              projectKey={project.key}
              projectName={project.name}
              value={taskValue}
            />
          )}
          {outcome !== 'forbidden' && (form.kind === 'project-archive' || form.kind === 'project-restore') && (
            <ConfirmBox
              busy={pending !== null}
              disabled={retryTarget !== null}
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
    </div>
  );
}

function modalTitle(form: FormState): Bilingual {
  switch (form.kind) {
    case 'project-create': return copy.project.createTitle;
    case 'project-edit': return copy.project.settingsTitle;
    case 'task-edit': return copy.task.editTitle;
    case 'project-archive': return copy.project.archiveTitle;
    case 'project-restore': return copy.project.restore;
    case 'task-archive': return copy.task.archiveTitle;
    case 'task-restore': return copy.task.restore;
  }
}


