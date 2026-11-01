'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { isCollaborationCommand, type ProjectCommand, type ProjectPolicyCommand, type ProjectTaskCommand } from '@rielia/contracts';
const policy = (command: ProjectCommand | null): command is ProjectPolicyCommand => command?.type === 'change-visibility' || command?.type === 'change-access';
function contentPending(value: ProjectCommand['type'] | null): ProjectTaskCommand['type'] | null { return value === null || value === 'change-visibility' || value === 'change-access' || value === 'move-task' || isCollaborationCommand({ type: value }) ? null : value as ProjectTaskCommand['type']; }
import { createIdentityTransport } from './identity-client';
import { createWorkspaceTransport } from './workspace-client';
import { createProjectTaskTransport } from './project-task-client';
import { createProjectTaskController } from './project-task-controller';
import type { ProjectTaskState } from './project-task-controller';
import { connectTaskEvents } from './task-events-client';
function contentPageError(error: ProjectTaskState['pageError']): { collection: 'workspaces' | 'members' | 'projects' | 'tasks'; requestId: string | null; reason?: 'changed' } | null {
  if (!error || error.collection === 'projectAccess' || error.collection === 'assignees') return null;
  return { collection: error.collection, requestId: error.requestId, ...(error.reason ? { reason: error.reason } : {}) };
}

export function useProjectTasks() {
  const [streamEpoch, setStreamEpoch] = useState(0);
  const [controller] = useState(() => createProjectTaskController({ identity: createIdentityTransport(), workspaces: createWorkspaceTransport(), transport: createProjectTaskTransport(),
    navigate: (url, replace) => { if (replace) window.history.replaceState(window.history.state, '', url); else window.history.pushState(window.history.state, '', url); } }));
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => {
    void controller.openLocation(window.location.search);
    const location = () => { void controller.openLocation(window.location.search); };
    const refresh = () => { if (document.visibilityState === 'visible') { void controller.backgroundRefresh(true); setStreamEpoch(value => value + 1); } };
    const offline = () => controller.setStreamStatus('offline');
    window.addEventListener('popstate', location); window.addEventListener('pageshow', refresh); window.addEventListener('focus', refresh); window.addEventListener('online', refresh); window.addEventListener('offline', offline); document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('popstate', location); window.removeEventListener('pageshow', refresh); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', refresh); controller.cancelPending(); controller.dispose(); };
  }, [controller]);
  const workspaceId = state.selection.workspaceId; const userId = state.session?.user.id; const sessionId = state.session?.session.id;
  const streamAllowed = !!workspaceId && !!sessionId && !['forbidden', 'signed-out', 'disabled', 'error'].includes(state.status);
  useEffect(() => {
    if (!streamAllowed || !workspaceId) return;
    return connectTaskEvents({ workspaceId, onStatus: controller.setStreamStatus, onEvent: event => {
      if (event.type === 'denied') controller.streamDenied(event.reason);
      else if (event.type !== 'heartbeat') void controller.backgroundRefresh(event.type === 'reset');
    } });
  }, [controller, workspaceId, userId, sessionId, streamAllowed, streamEpoch]);
  useEffect(() => {
    if (state.refreshRequired && !state.refreshDeferred && state.status === 'ready') void controller.backgroundRefresh();
  }, [controller, state.refreshRequired, state.refreshDeferred, state.status]);
  useEffect(() => {
    if (!state.session) return;
    const timer = window.setTimeout(() => { controller.cancelPending(); void controller.refresh(); }, Math.min(2147483647, Math.max(0, Date.parse(state.session.session.expiresAt) - Date.now())));
    return () => window.clearTimeout(timer);
  }, [controller, state.session]);
  // Preserve the existing content-form contract; policy drafts use the same
  // controller/key lifecycle and are exposed separately for the privacy panel.
  return { ...state, mutationPending: state.pending, draft: policy(state.draft) || state.draft?.type === 'move-task' || isCollaborationCommand(state.draft) ? null : state.draft, pending: contentPending(state.pending), retryTarget: policy(state.retryTarget) || state.retryTarget?.type === 'move-task' || isCollaborationCommand(state.retryTarget) ? null : state.retryTarget,
    collaborationDraft: isCollaborationCommand(state.draft) ? state.draft : null, collaborationPending: state.pending && isCollaborationCommand({ type: state.pending }) ? state.pending : null,
    collaborationRetryTarget: isCollaborationCommand(state.retryTarget) ? state.retryTarget : null,
    moveDraft: state.draft?.type === 'move-task' ? state.draft : null, movePending: state.pending === 'move-task' ? state.pending : null, moveRetryTarget: state.retryTarget?.type === 'move-task' ? state.retryTarget : null,
    policyDraft: policy(state.draft) ? state.draft : null, policyPending: state.pending === 'change-access' || state.pending === 'change-visibility' ? state.pending : null,
    policyRetryTarget: policy(state.retryTarget) ? state.retryTarget : null,
    pageError: contentPageError(state.pageError),
    policyPageError: state.pageError?.collection === 'projectAccess' || state.pageError?.collection === 'assignees' ? state.pageError : null,
    refresh: controller.refresh, selectWorkspace: controller.selectWorkspace, selectProject: controller.selectProject, selectTask: controller.selectTask,
    setTaskScope: controller.setTaskScope, setSearchQuery: controller.setSearchQuery, setDiscoveryProject: controller.setDiscoveryProject,
    loadDiscoveryMore: controller.loadDiscoveryMore, openDiscoveryTask: controller.openDiscoveryTask, returnToDiscovery: controller.returnToDiscovery,
    resolveWorkspaceNavigation: controller.resolveWorkspaceNavigation,
    setView: controller.setView, setTaskLayout: controller.setTaskLayout, setTaskFilters: controller.setTaskFilters, setTaskColumn: controller.setTaskColumn,
    loadMore: controller.loadMore, loadTaskColumn: controller.loadTaskColumn, stageMove: controller.stageMove, moveEligibility: controller.moveEligibility, stage: controller.stage, submit: controller.submit, retrySave: controller.retrySave, discardDraft: controller.discardDraft,
    loadCollaborationMore: controller.loadCollaborationMore, acknowledgeClose: controller.acknowledgeClose,
    setParentCandidatesWanted: controller.setParentCandidatesWanted,
    cancelPending: controller.cancelPending, returnToDraft: controller.returnToDraft, reloadConflict: controller.reloadConflict, rebaseDraft: controller.rebaseDraft,
    dismissOutcome: controller.dismissOutcome, dismissPageError: controller.dismissPageError };
}
