'use client';
import { useState, useRef } from 'react';
import { taskStatuses, type TaskStatus } from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
export interface TaskResultFocusPorts {
  taskColumns: ProjectTaskState['taskColumns'];
  taskView: ProjectTaskState['taskView'];
  tasks: ProjectTaskState['tasks'];
}

export function useTaskResultFocus({ taskColumns, taskView, tasks }: TaskResultFocusPorts) {
  const [moveFocusId, setMoveFocusId] = useState<string | null>(null);

  const moveFocusCancelledRef = useRef(false);

  const [createFocusId, setCreateFocusId] = useState<string | null>(null);

  function taskStatusInDom(taskId: string): TaskStatus | null {
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')].find(
      (element) => element.dataset.taskId === taskId,
    );
    if (row === undefined) return null;
    const selected = row.querySelector<HTMLSelectElement>('select')?.value;
    if (selected !== undefined && taskStatuses.includes(selected as TaskStatus))
      return selected as TaskStatus;
    const marker = row
      .closest('section')
      ?.querySelector<HTMLElement>('[data-column-heading], [data-task-group]');
    const value = marker?.dataset.columnHeading ?? marker?.dataset.taskGroup;
    return value !== undefined && taskStatuses.includes(value as TaskStatus)
      ? (value as TaskStatus)
      : null;
  }

  function taskRowIsCanonical(taskId: string, status: TaskStatus, orderVersion: number): boolean {
    if (taskStatusInDom(taskId) !== status) return false;
    const pageVersion =
      taskView.layout === 'board' ? taskColumns[status]?.orderVersion : tasks?.orderVersion;
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
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')].find(
      (element) => element.dataset.taskId === taskId,
    );
    const link = row?.querySelector<HTMLElement>('[data-task-open]');
    if (link === null || link === undefined) return false;
    link.focus();
    return true;
  }

  function focusMoveControl(taskId: string): boolean {
    const row = [...document.querySelectorAll<HTMLElement>('[data-task-id]')].find(
      (element) => element.dataset.taskId === taskId,
    );
    const control = row?.querySelector<HTMLSelectElement>('select');
    if (control === null || control === undefined) return false;
    control.focus();
    return true;
  }

  function focusViewBar() {
    document.querySelector<HTMLElement>('[data-task-view-bar]')?.focus();
  }
  return {
    moveFocusId,
    setMoveFocusId,
    moveFocusCancelledRef,
    createFocusId,
    setCreateFocusId,
    taskRowIsCanonical,
    shouldRestoreMoveFocus,
    focusTask,
    focusMoveControl,
    focusViewBar,
  };
}
