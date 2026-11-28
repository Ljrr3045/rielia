'use client';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  isCollaborationCommand,
  type ProjectCommand,
  type ProjectPolicyCommand,
  type ProjectTaskCommand,
  type TaskInvalidation,
} from '@rielia/contracts';
const policy = (command: ProjectCommand | null): command is ProjectPolicyCommand =>
  command?.type === 'change-visibility' || command?.type === 'change-access';
function contentPending(value: ProjectCommand['type'] | null): ProjectTaskCommand['type'] | null {
  return value === null ||
    value === 'change-visibility' ||
    value === 'change-access' ||
    value === 'move-task' ||
    isCollaborationCommand({ type: value })
    ? null
    : (value as ProjectTaskCommand['type']);
}
import { createIdentityTransport } from './identity-client';
import { createWorkspaceTransport } from './workspace-client';
import { createProjectTaskTransport } from './project-task-client';
import { createProjectTaskController } from './project-task-controller';
import type { ProjectTaskState } from './project-task-controller';
import { connectTaskEvents } from './task-events-client';
function contentPageError(error: ProjectTaskState['pageError']): {
  collection: 'workspaces' | 'members' | 'projects' | 'tasks';
  requestId: string | null;
  reason?: 'changed';
} | null {
  if (!error || error.collection === 'projectAccess' || error.collection === 'assignees')
    return null;
  return {
    collection: error.collection,
    requestId: error.requestId,
    ...(error.reason ? { reason: error.reason } : {}),
  };
}

export function useProjectTasks() {
  const [streamEpoch, setStreamEpoch] = useState(0);
  const [invalidationListeners] = useState(() => new Set<(event: TaskInvalidation) => void>());
  const subscribeInvalidation = useCallback(
    (listener: (event: TaskInvalidation) => void) => {
      invalidationListeners.add(listener);
      return () => {
        invalidationListeners.delete(listener);
      };
    },
    [invalidationListeners],
  );
  const [controller] = useState(() =>
    createProjectTaskController({
      identity: createIdentityTransport(),
      workspaces: createWorkspaceTransport(),
      transport: createProjectTaskTransport(),
      navigate: (url, replace) => {
        if (replace) window.history.replaceState(window.history.state, '', url);
        else window.history.pushState(window.history.state, '', url);
      },
    }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  useEffect(() => {
    void controller.openLocation(window.location.search);
    const location = () => {
      void controller.openLocation(window.location.search);
    };
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        invalidationListeners.forEach((listener) => listener({ type: 'reset' }));
        void controller.backgroundRefresh(true);
        setStreamEpoch((value) => value + 1);
      }
    };
    const offline = () => controller.setStreamStatus('offline');
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!controller.navigationProtected()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('popstate', location);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', offline);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('popstate', location);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', offline);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', refresh);
      controller.cancelPending();
      controller.dispose();
    };
  }, [controller, invalidationListeners]);
  const visible = controller.getVisibleState();
  const workspaceId = visible.selection.workspaceId;
  const privateEpoch = visible.privateLifetime?.epoch;
  const streamAllowed =
    !!workspaceId &&
    !!privateEpoch &&
    Date.parse(visible.privateLifetime?.expiresAt ?? '') > Date.now() &&
    !['forbidden', 'signed-out', 'disabled'].includes(visible.status) &&
    (visible.status !== 'error' || visible.refreshRequired);
  useEffect(() => {
    if (!streamAllowed || !workspaceId) return;
    return connectTaskEvents({
      workspaceId,
      onStatus: (status) => {
        if (controller.getState().privateLifetime?.epoch === privateEpoch)
          controller.setStreamStatus(status);
      },
      onEvent: (event) => {
        const current = controller.getState();
        if (
          current.selection.workspaceId !== workspaceId ||
          current.privateLifetime?.epoch !== privateEpoch
        )
          return;
        invalidationListeners.forEach((listener) => listener(event));
        void controller.handleInvalidation(event);
      },
    });
  }, [controller, workspaceId, streamAllowed, streamEpoch, privateEpoch, invalidationListeners]);
  useEffect(() => {
    if (
      state.refreshRequired &&
      !state.refreshDeferred &&
      (state.status === 'ready' || state.status === 'empty')
    )
      void controller.flushBackgroundRefresh();
  }, [controller, state.refreshRequired, state.refreshDeferred, state.status]);
  const expiresAt = state.privateLifetime?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    let active = true;
    let timer: number | undefined;
    const expire = () => {
      if (!active || controller.getState().privateLifetime?.epoch !== privateEpoch) return;
      const remaining = Date.parse(expiresAt) - Date.now();
      if (remaining > 0) timer = window.setTimeout(expire, Math.min(2147483647, remaining));
      else {
        controller.expire();
        void controller.refresh();
      }
    };
    expire();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [controller, expiresAt, privateEpoch]);
  // Preserve the existing content-form contract; policy drafts use the same
  // controller/key lifecycle and are exposed separately for the privacy panel.
  return {
    subscribeInvalidation,
    ...visible,
    mutationPending: visible.pending,
    draft:
      policy(visible.draft) ||
      visible.draft?.type === 'move-task' ||
      isCollaborationCommand(visible.draft)
        ? null
        : visible.draft,
    pending: contentPending(visible.pending),
    retryTarget:
      policy(visible.retryTarget) ||
      visible.retryTarget?.type === 'move-task' ||
      isCollaborationCommand(visible.retryTarget)
        ? null
        : visible.retryTarget,
    collaborationDraft: isCollaborationCommand(visible.draft) ? visible.draft : null,
    collaborationPending:
      visible.pending && isCollaborationCommand({ type: visible.pending }) ? visible.pending : null,
    collaborationRetryTarget: isCollaborationCommand(visible.retryTarget)
      ? visible.retryTarget
      : null,
    moveDraft: visible.draft?.type === 'move-task' ? visible.draft : null,
    movePending: visible.pending === 'move-task' ? visible.pending : null,
    moveRetryTarget: visible.retryTarget?.type === 'move-task' ? visible.retryTarget : null,
    policyDraft: policy(visible.draft) ? visible.draft : null,
    policyPending:
      visible.pending === 'change-access' || visible.pending === 'change-visibility'
        ? visible.pending
        : null,
    policyRetryTarget: policy(visible.retryTarget) ? visible.retryTarget : null,
    pageError: contentPageError(visible.pageError),
    policyPageError:
      visible.pageError?.collection === 'projectAccess' ||
      visible.pageError?.collection === 'assignees'
        ? visible.pageError
        : null,
    refresh: controller.refresh,
    setSprintLocation: controller.setSprintLocation,
    registerNavigationBlocker: controller.registerNavigationBlocker,
    resumeNavigation: controller.resumeNavigation,
    resolveIntegratedNavigation: controller.resolveIntegratedNavigation,
    navigateAway: controller.navigateAway,
    navigationProtected: controller.navigationProtected,
    selectWorkspace: controller.selectWorkspace,
    selectProject: controller.selectProject,
    selectTask: controller.selectTask,
    setTaskScope: controller.setTaskScope,
    setSearchQuery: controller.setSearchQuery,
    setDiscoveryProject: controller.setDiscoveryProject,
    loadDiscoveryMore: controller.loadDiscoveryMore,
    openDiscoveryTask: controller.openDiscoveryTask,
    returnToDiscovery: controller.returnToDiscovery,
    resolveWorkspaceNavigation: controller.resolveWorkspaceNavigation,
    setView: controller.setView,
    setTaskLayout: controller.setTaskLayout,
    setTaskFilters: controller.setTaskFilters,
    setTaskColumn: controller.setTaskColumn,
    loadMore: controller.loadMore,
    loadTaskColumn: controller.loadTaskColumn,
    stageMove: controller.stageMove,
    moveEligibility: controller.moveEligibility,
    stage: controller.stage,
    submit: controller.submit,
    retrySave: controller.retrySave,
    discardDraft: controller.discardDraft,
    loadCollaborationMore: controller.loadCollaborationMore,
    acknowledgeClose: controller.acknowledgeClose,
    setParentCandidatesWanted: controller.setParentCandidatesWanted,
    cancelPending: controller.cancelPending,
    returnToDraft: controller.returnToDraft,
    reloadConflict: controller.reloadConflict,
    rebaseDraft: controller.rebaseDraft,
    dismissOutcome: controller.dismissOutcome,
    dismissPageError: controller.dismissPageError,
  };
}
