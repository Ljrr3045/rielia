'use client';
import { useEffect } from 'react';
import type { Dispatch, SetStateAction, RefObject } from 'react';
import {
  type TaskStatus,
  type ProjectTaskCommand,
  type ProjectPolicyCommand,
  type ProjectMoveCommand,
} from '@rielia/contracts';
import type { MoveEligibility, ProjectTaskState } from '../../lib/project-task-controller';
import { useFocusTrap, useBodyScrollLock } from './project-dom-hooks';
import { commandMatches, isTaskResult, type FormState } from './project-content-model';
export interface ProjectInteractionEffectsPorts {
  captureFocusProjectId: string | null;
  captureRef: RefObject<HTMLInputElement | null>;
  closeDrawer: () => void;
  createFocusId: string | null;
  discoveryFocusTaskId: ProjectTaskState['discoveryFocusTaskId'];
  discoveryHeadingRef: RefObject<HTMLHeadingElement | null>;
  discoveryReturnRef: RefObject<boolean>;
  dismissFocusPendingRef: RefObject<boolean>;
  draft: ProjectTaskCommand | null;
  drawerOpen: boolean;
  focusDismissedSurface: (hadForm: boolean) => void;
  focusTask: (taskId: string) => boolean;
  focusViewBar: () => void;
  form: FormState | null;
  hadDetailRef: RefObject<boolean>;
  lastCommandRef: RefObject<ProjectTaskCommand | null>;
  modalOpenerRef: RefObject<HTMLElement | null>;
  moveDraft: ProjectMoveCommand | null;
  moveFocusCancelledRef: RefObject<boolean>;
  moveFocusId: string | null;
  movePending: 'move-task' | null;
  moveRetryTarget: ProjectMoveCommand | null;
  outcome: ProjectTaskState['outcome'];
  overlayOpen: boolean;
  policyDraft: ProjectPolicyCommand | null;
  policyRetryTarget: ProjectPolicyCommand | null;
  project: ProjectTaskState['project'];
  projectHeadingRef: RefObject<HTMLHeadingElement | null>;
  resolveWorkspaceNavigation: (choice: 'stay' | 'discard') => Promise<void>;
  result: ProjectTaskState['result'];
  resumeAccessOnReady: boolean;
  resumeDraft: (command: ProjectTaskCommand) => void;
  resumeDraftOnReady: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  selection: ProjectTaskState['selection'];
  setCaptureFocusProjectId: Dispatch<SetStateAction<string | null>>;
  setCaptureStatus: Dispatch<SetStateAction<TaskStatus>>;
  setCaptureTitle: Dispatch<SetStateAction<string>>;
  setColumnCaptureOpen: Dispatch<SetStateAction<boolean>>;
  setCreateFocusId: Dispatch<SetStateAction<string | null>>;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setForm: Dispatch<SetStateAction<FormState | null>>;
  setMoveFocusId: Dispatch<SetStateAction<string | null>>;
  setMoveNotice: Dispatch<
    SetStateAction<{
      reason: Exclude<MoveEligibility, 'ready'>;
      taskId: string;
    } | null>
  >;
  setResumeAccessOnReady: Dispatch<SetStateAction<boolean>>;
  setResumeDraftOnReady: Dispatch<SetStateAction<boolean>>;
  shouldRestoreMoveFocus: (taskId: string) => boolean;
  sidebarDrawer: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  status: ProjectTaskState['status'];
  task: ProjectTaskState['task'];
  taskColumns: ProjectTaskState['taskColumns'];
  taskRowIsCanonical: (taskId: string, status: TaskStatus, orderVersion: number) => boolean;
  taskScope: ProjectTaskState['taskScope'];
  taskView: ProjectTaskState['taskView'];
  tasks: ProjectTaskState['tasks'];
  views: ProjectTaskState['views'];
  workspaceNavigation: ProjectTaskState['workspaceNavigation'];
}

// Preserve the original screen effect registration order across responsibility moves.
export function useProjectInteractionEffects({
  captureFocusProjectId,
  captureRef,
  closeDrawer,
  createFocusId,
  discoveryFocusTaskId,
  discoveryHeadingRef,
  discoveryReturnRef,
  dismissFocusPendingRef,
  draft,
  drawerOpen,
  focusDismissedSurface,
  focusTask,
  focusViewBar,
  form,
  hadDetailRef,
  lastCommandRef,
  modalOpenerRef,
  moveDraft,
  moveFocusCancelledRef,
  moveFocusId,
  movePending,
  moveRetryTarget,
  outcome,
  overlayOpen,
  policyDraft,
  policyRetryTarget,
  project,
  projectHeadingRef,
  resolveWorkspaceNavigation,
  result,
  resumeAccessOnReady,
  resumeDraft,
  resumeDraftOnReady,
  returnFocusRef,
  selection,
  setCaptureFocusProjectId,
  setCaptureStatus,
  setCaptureTitle,
  setColumnCaptureOpen,
  setCreateFocusId,
  setDrawerOpen,
  setForm,
  setMoveFocusId,
  setMoveNotice,
  setResumeAccessOnReady,
  setResumeDraftOnReady,
  shouldRestoreMoveFocus,
  sidebarDrawer,
  sidebarRef,
  status,
  task,
  taskColumns,
  taskRowIsCanonical,
  taskScope,
  taskView,
  tasks,
  views,
  workspaceNavigation,
}: ProjectInteractionEffectsPorts) {
  useBodyScrollLock(drawerOpen || overlayOpen || form !== null);

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
        const replacement =
          href === null
            ? undefined
            : [...document.querySelectorAll<HTMLAnchorElement>('a')].find(
                (anchor) => anchor.getAttribute('href') === href,
              );
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
    if (
      status === 'error' ||
      status === 'forbidden' ||
      status === 'signed-out' ||
      status === 'disabled'
    ) {
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
      const row = [...document.querySelectorAll<HTMLElement>('[data-discovery-task-id]')].find(
        (element) => element.dataset.discoveryTaskId === discoveryFocusTaskId,
      );
      const target =
        row?.querySelector<HTMLElement>('[data-discovery-open]') ?? discoveryHeadingRef.current;
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [taskScope, selection.taskId, status, discoveryFocusTaskId]);

  useEffect(() => {
    if (!form) return;
    if (
      form.workspaceId !== selection.workspaceId ||
      ('projectId' in form && form.projectId !== selection.projectId) ||
      ('taskId' in form && form.taskId !== selection.taskId)
    ) {
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
    if (
      outcome !== 'success' ||
      moveFocusId === null ||
      result === null ||
      !isTaskResult(result) ||
      result.id !== moveFocusId
    )
      return;
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
      const heading = [...document.querySelectorAll<HTMLElement>('[data-column-heading]')].find(
        (element) => element.dataset.columnHeading === status,
      );
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
      const created =
        tasks?.items.find((item) => item.id === createFocusId) ??
        Object.values(taskColumns)
          .flatMap((page) => page?.items ?? [])
          .find((item) => item.id === createFocusId);
      const heading =
        created === undefined
          ? undefined
          : [...document.querySelectorAll<HTMLElement>('[data-column-heading]')].find(
              (element) => element.dataset.columnHeading === created.status,
            );
      if (heading !== undefined) heading.focus();
      else focusViewBar();
      setCreateFocusId(null);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [createFocusId, taskColumns, tasks, taskView.layout]);

  useEffect(() => {
    if (!resumeDraftOnReady || !draft) return;
    if (
      draft.type === 'create-project'
        ? status !== 'ready' && status !== 'empty'
        : status !== 'ready'
    )
      return;
    if (!commandMatches(draft, selection)) return;
    setResumeDraftOnReady(false);
    resumeDraft(draft);
  }, [resumeDraftOnReady, draft, status, selection, project, task, tasks, views.tasks]);

  useEffect(() => {
    const command = policyDraft ?? policyRetryTarget;
    if (!resumeAccessOnReady || command === null || status !== 'ready') return;
    if (command.workspaceId !== selection.workspaceId || command.projectId !== selection.projectId)
      return;
    setResumeAccessOnReady(false);
    modalOpenerRef.current = null;
    setForm({
      kind: 'project-access',
      workspaceId: command.workspaceId,
      projectId: command.projectId,
    });
  }, [
    resumeAccessOnReady,
    policyDraft,
    policyRetryTarget,
    status,
    selection.workspaceId,
    selection.projectId,
  ]);

  useEffect(() => {
    if (
      captureFocusProjectId === null ||
      status !== 'ready' ||
      selection.projectId !== captureFocusProjectId
    )
      return;
    setCaptureFocusProjectId(null);
    const frame = requestAnimationFrame(() => {
      if (captureRef.current !== null) captureRef.current.focus();
      else projectHeadingRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [captureFocusProjectId, status, selection.projectId]);

  useEffect(() => {
    if (form !== null || !dismissFocusPendingRef.current) return;
    dismissFocusPendingRef.current = false;
    focusDismissedSurface(true);
  }, [form]);
}
