'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ProjectCommand, ProjectPolicyCommand, ProjectTaskCommand } from '@rielia/contracts';
const policy = (command: ProjectCommand | null): command is ProjectPolicyCommand => command?.type === 'change-visibility' || command?.type === 'change-access';
function contentPending(value: ProjectCommand['type'] | null): ProjectTaskCommand['type'] | null { return value === 'change-visibility' || value === 'change-access' ? null : value; }
import { createIdentityTransport } from './identity-client';
import { createWorkspaceTransport } from './workspace-client';
import { createProjectTaskTransport } from './project-task-client';
import { createProjectTaskController } from './project-task-controller';
import type { ProjectTaskState } from './project-task-controller';
function contentPageError(error: ProjectTaskState['pageError']): { collection: 'workspaces' | 'members' | 'projects' | 'tasks'; requestId: string | null } | null {
  if (!error || error.collection === 'projectAccess' || error.collection === 'assignees') return null;
  return { collection: error.collection, requestId: error.requestId };
}

export function useProjectTasks() {
  const [controller] = useState(() => createProjectTaskController({ identity: createIdentityTransport(), workspaces: createWorkspaceTransport(), transport: createProjectTaskTransport(),
    navigate: url => { window.history.pushState(window.history.state, '', url); } }));
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => {
    void controller.openLocation(window.location.search);
    const location = () => { void controller.openLocation(window.location.search); };
    const refresh = () => { if (document.visibilityState === 'visible') void controller.refresh(); };
    window.addEventListener('popstate', location); window.addEventListener('pageshow', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('popstate', location); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', refresh); controller.cancelPending(); };
  }, [controller]);
  useEffect(() => {
    if (!state.session) return;
    const timer = window.setTimeout(() => { controller.cancelPending(); void controller.refresh(); }, Math.min(2147483647, Math.max(0, Date.parse(state.session.session.expiresAt) - Date.now())));
    return () => window.clearTimeout(timer);
  }, [controller, state.session]);
  // Preserve the existing content-form contract; policy drafts use the same
  // controller/key lifecycle and are exposed separately for the privacy panel.
  return { ...state, draft: policy(state.draft) ? null : state.draft, pending: contentPending(state.pending), retryTarget: policy(state.retryTarget) ? null : state.retryTarget,
    policyDraft: policy(state.draft) ? state.draft : null, policyPending: state.pending === 'change-access' || state.pending === 'change-visibility' ? state.pending : null,
    policyRetryTarget: policy(state.retryTarget) ? state.retryTarget : null,
    pageError: contentPageError(state.pageError),
    policyPageError: state.pageError?.collection === 'projectAccess' || state.pageError?.collection === 'assignees' ? state.pageError : null,
    refresh: controller.refresh, selectWorkspace: controller.selectWorkspace, selectProject: controller.selectProject, selectTask: controller.selectTask,
    setView: controller.setView, loadMore: controller.loadMore, stage: controller.stage, submit: controller.submit, retrySave: controller.retrySave, discardDraft: controller.discardDraft,
    cancelPending: controller.cancelPending, returnToDraft: controller.returnToDraft, reloadConflict: controller.reloadConflict, rebaseDraft: controller.rebaseDraft,
    dismissOutcome: controller.dismissOutcome, dismissPageError: controller.dismissPageError };
}
