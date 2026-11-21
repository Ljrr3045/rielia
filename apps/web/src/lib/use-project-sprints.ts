'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { TaskInvalidation } from '@rielia/contracts';
import type { ProjectTaskState } from './project-task-controller.ts';
import { createSprintPlanningTransport } from './sprint-client.ts';
import { createTaskPlanningTransport } from './task-planning-client.ts';
import { createSprintController } from './sprint-controller.ts';
import { emptySprintState, type SprintClientContext } from './sprint-client-state.ts';

export interface SprintProjectPort extends Pick<
  ProjectTaskState,
  'session' | 'status' | 'selection'
> {
  subscribeInvalidation: (listener: (event: TaskInvalidation) => void) => () => void;
  refresh: () => Promise<void>;
}
/** Mount beside useProjectTasks only when the sprint surface is wanted. No second identity or SSE owner. */
export function useProjectSprints(
  project: SprintProjectPort,
  selection: { sprintId: string | null; taskId: string | null },
) {
  const [controller] = useState(() =>
    createSprintController({
      planning: createSprintPlanningTransport(),
      tasks: createTaskPlanningTransport(),
    }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const latestProject = useRef(project);
  latestProject.current = project;
  const session = project.session;
  const { workspaceId, projectId } = project.selection;
  const allowed = !['disabled', 'signed-out', 'forbidden'].includes(project.status);
  const denied =
    project.status === 'forbidden' || project.status === 'signed-out' ? project.status : null;
  const userId = session?.user.id;
  const sessionId = session?.session.id;
  const expiresAt = session?.session.expiresAt;
  const expired = expiresAt
    ? !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now()
    : false;
  const context: SprintClientContext | null =
    !expired && allowed && userId && sessionId && expiresAt && workspaceId && projectId
      ? { userId, sessionId, expiresAt, workspaceId, projectId }
      : null;
  const verifying =
    !session && allowed && (project.status === 'loading' || project.status === 'error');
  const identity = context ? JSON.stringify([userId, sessionId, workspaceId, projectId]) : null;
  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    if (denied) {
      controller.deny(denied);
      return;
    }
    if (verifying) {
      controller.suspend();
      return;
    }
    void controller.setContext(
      allowed && userId && sessionId && expiresAt && workspaceId && projectId
        ? { userId, sessionId, expiresAt, workspaceId, projectId }
        : null,
    );
  }, [
    controller,
    allowed,
    denied,
    verifying,
    userId,
    sessionId,
    expiresAt,
    workspaceId,
    projectId,
  ]);
  useEffect(() => {
    if (!context) return;
    void controller.select(selection.sprintId, selection.taskId);
  }, [controller, identity, selection.sprintId, selection.taskId]);
  useEffect(() => {
    if (!context) return;
    let active = true;
    const unsubscribe = project.subscribeInvalidation((event) => {
      if (active) void controller.handleEvent(event);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [controller, identity, project.subscribeInvalidation]);
  const lifetimeExpiry = state.context?.expiresAt ?? expiresAt;
  useEffect(() => {
    if (!lifetimeExpiry) return;
    const expire = () => {
      const remaining = Date.parse(lifetimeExpiry) - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) controller.deny('signed-out');
      else timer = window.setTimeout(expire, Math.min(2147483647, remaining));
    };
    let timer: number;
    expire();
    return () => window.clearTimeout(timer);
  }, [controller, lifetimeExpiry]);
  useEffect(() => {
    if (state.mutation.status === 'confirmed') void latestProject.current.refresh();
  }, [state.mutation]);
  // Effects run after render: never expose a former execution context during that interval.
  const currentIdentity = state.context
    ? JSON.stringify([
        state.context.userId,
        state.context.sessionId,
        state.context.workspaceId,
        state.context.projectId,
      ])
    : null;
  const visible =
    identity === currentIdentity
      ? state
      : {
          ...emptySprintState(),
          status: denied ?? (verifying ? ('verifying' as const) : ('inactive' as const)),
        };
  return {
    ...visible,
    select: controller.select,
    selectTarget: controller.selectTarget,
    preview: controller.preview,
    stage: controller.stage,
    changeDraft: controller.changeDraft,
    rebaseDraft: controller.rebaseDraft,
    discardDraft: controller.discardDraft,
    submit: controller.submit,
    retrySave: controller.retrySave,
    cancelPending: controller.cancelPending,
    refresh: controller.refresh,
    reload: controller.reload,
    loadMore: controller.loadMore,
    dismissResult: controller.dismissResult,
  };
}
