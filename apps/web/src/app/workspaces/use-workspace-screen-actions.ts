'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkspaceCommand } from '@rielia/contracts';
import type { WorkspaceState } from '../../lib/workspace-controller';
import {
  commandSubject,
  workspaceNameById,
  type LastAction,
  type LoadMoreKind,
} from './workspace-screen-model';

type WorkspaceScreenPort = Pick<
  WorkspaceState,
  | 'draft'
  | 'selectedWorkspaceId'
  | 'pending'
  | 'retryTarget'
  | 'session'
  | 'workspace'
  | 'members'
  | 'workspaces'
  | 'invitations'
  | 'invitationLink'
  | 'outcome'
  | 'hasInvitation'
> & {
  stage: (command: WorkspaceCommand) => void;
  submit: () => Promise<void>;
  acceptInvitation: () => Promise<void>;
  retrySave: () => Promise<void>;
  discardDraft: () => void;
  dismissOutcome: () => void;
  clearGeneratedInvitationLink: () => void;
  loadMore: (kind: LoadMoreKind) => Promise<void>;
};

export function useWorkspaceScreenActions(ws: WorkspaceScreenPort) {
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [loadingMore, setLoadingMore] = useState<LoadMoreKind | null>(null);
  const knownWorkspaceNames = useRef<Record<string, string>>({});

  useEffect(() => {
    if (ws.workspaces === null) return;
    for (const item of ws.workspaces.items) knownWorkspaceNames.current[item.id] = item.name;
  }, [ws.workspaces]);

  const draftWorkspaceId =
    ws.draft !== null && 'workspaceId' in ws.draft ? ws.draft.workspaceId : null;
  const draftMismatch = draftWorkspaceId !== null && draftWorkspaceId !== ws.selectedWorkspaceId;
  const commandsDisabled = ws.pending !== null || ws.retryTarget !== null || draftMismatch;
  const busy = ws.pending !== null;
  const sessionEmail = ws.session?.user.email ?? null;
  const session = ws.session;
  const workspace = ws.workspace;
  const members = ws.members;
  const workspaces = ws.workspaces;
  const invitations = ws.invitations;
  const invitationLink = ws.invitationLink;
  const custodians =
    members?.items.filter(
      (member) =>
        member.kind === 'human' &&
        member.state === 'active' &&
        member.principalState === 'active' &&
        (member.role === 'owner' || member.role === 'admin'),
    ) ?? [];

  function stageDraft(command: WorkspaceCommand) {
    if (ws.pending !== null || ws.retryTarget !== null || draftMismatch) return;
    ws.stage(command);
  }

  function run(command: WorkspaceCommand) {
    if (ws.pending !== null || ws.retryTarget !== null || draftMismatch) return;
    setLastAction({ type: command.type, subject: commandSubject(command, members, invitations) });
    ws.stage(command);
    void ws.submit();
  }

  function acceptInvitation() {
    if (ws.pending !== null || ws.retryTarget !== null || draftMismatch) return;
    setLastAction({ type: 'accept-invitation', subject: null });
    void ws.acceptInvitation();
  }

  function retry() {
    const target = ws.retryTarget;
    if (target === null) return;
    setLastAction(
      (current) =>
        current ?? {
          type: target.type,
          subject: ws.draft === null ? null : commandSubject(ws.draft, members, invitations),
        },
    );
    void ws.retrySave();
  }

  function discard() {
    ws.discardDraft();
    setLastAction(null);
  }

  function dismiss() {
    ws.dismissOutcome();
    setLastAction(null);
  }

  function finishInvitationLink() {
    ws.clearGeneratedInvitationLink();
    ws.dismissOutcome();
    setLastAction(null);
  }

  async function loadMore(kind: LoadMoreKind) {
    if (loadingMore !== null || ws.pending !== null || ws.retryTarget !== null) return;
    setLoadingMore(kind);
    try {
      await ws.loadMore(kind);
    } finally {
      setLoadingMore(null);
    }
  }

  const invitationLinkVisible = invitationLink !== null && ws.outcome === 'success';
  const draftMemory = ws.draft !== null || ws.retryTarget !== null;
  const memoryPresent = ws.hasInvitation || draftMemory;
  const draftType = ws.draft?.type ?? ws.retryTarget?.type ?? null;
  const draftScopeId = draftWorkspaceId ?? ws.retryTarget?.workspaceId ?? null;
  const draftScopeName =
    workspaceNameById(workspaces, draftScopeId) ??
    (draftScopeId === null ? null : (knownWorkspaceNames.current[draftScopeId] ?? null));

  return {
    lastAction,
    loadingMore,
    draftMismatch,
    commandsDisabled,
    busy,
    sessionEmail,
    session,
    workspace,
    members,
    workspaces,
    invitations,
    invitationLink,
    custodians,
    stageDraft,
    run,
    acceptInvitation,
    retry,
    discard,
    dismiss,
    finishInvitationLink,
    loadMore,
    invitationLinkVisible,
    draftMemory,
    memoryPresent,
    draftType,
    draftScopeId,
    draftScopeName,
  };
}
