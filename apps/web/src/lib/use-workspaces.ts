'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createIdentityTransport } from './identity-client';
import { createWorkspaceTransport } from './workspace-client';
import { createWorkspaceController } from './workspace-controller';
import { observeWorkspaceInvitations } from './workspace-invitation-location';

/** Presentation imports only this hook and public contract types. */
export function useWorkspaces() {
  const [controller] = useState(() => createWorkspaceController({ identity: createIdentityTransport(), transport: createWorkspaceTransport(),
    origin: () => window.location.origin, selection: {
      read: userId => window.sessionStorage.getItem(`rielia.workspace.${userId}`),
      write: (userId, id) => { if (id) window.sessionStorage.setItem(`rielia.workspace.${userId}`, id); else window.sessionStorage.removeItem(`rielia.workspace.${userId}`); },
    } }));
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => {
    const stopInvitations = observeWorkspaceInvitations(controller, window);
    void controller.refresh();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.refresh(); };
    window.addEventListener('pageshow', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { stopInvitations(); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', refresh); controller.cancelPending(); };
  }, [controller]);
  useEffect(() => {
    if (!state.session) return;
    const timeout = window.setTimeout(() => { controller.cancelPending(); void controller.refresh(); }, Math.min(2147483647, Math.max(0, Date.parse(state.session.session.expiresAt) - Date.now())));
    return () => window.clearTimeout(timeout);
  }, [controller, state.session]);
  return { ...state, refresh: controller.refresh, selectWorkspace: controller.selectWorkspace, stage: controller.stage, submit: controller.submit,
    retrySave: controller.retrySave, loadMore: controller.loadMore, acceptInvitation: controller.acceptInvitation, clearInvitation: controller.clearInvitation,
    clearGeneratedInvitationLink: controller.clearGeneratedInvitationLink,
    discardDraft: controller.discardDraft, cancelPending: controller.cancelPending, dismissOutcome: controller.dismissOutcome };
}
