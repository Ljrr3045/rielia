'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createIdentityTransport } from './identity-client';
import { createWorkspaceTransport } from './workspace-client';
import { createProjectTaskTransport } from './project-task-client';
import { createProjectTaskController } from './project-task-controller';

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
  return { ...state, refresh: controller.refresh, selectWorkspace: controller.selectWorkspace, selectProject: controller.selectProject, selectTask: controller.selectTask,
    setView: controller.setView, loadMore: controller.loadMore, stage: controller.stage, submit: controller.submit, retrySave: controller.retrySave, discardDraft: controller.discardDraft,
    cancelPending: controller.cancelPending, returnToDraft: controller.returnToDraft, reloadConflict: controller.reloadConflict, rebaseDraft: controller.rebaseDraft,
    dismissOutcome: controller.dismissOutcome, dismissPageError: controller.dismissPageError };
}
