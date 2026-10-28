'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Page, WorkspaceCommand, WorkspaceInvitation, WorkspaceMember, WorkspaceSummary } from '@rielia/contracts';
import { useWorkspaces } from '../../lib/use-workspaces';
import {
  AgentsSection,
  CreateWorkspaceForm,
  InvitationLinkPanel,
  InvitationsSection,
  MembersSection,
} from './workspace-admin';
import {
  commandName,
  copy,
  pendingText,
  retryText,
  roleName,
  subjectLabel,
  successText,
  type CommandType,
  type OutcomeKind,
} from './strings';
import { BilingualText, cx, LocaleProvider, type Lang } from './workspace-ui';
import type { Bilingual } from './strings';
import styles from './workspace.module.css';

type WorkspaceStatus = 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
type RetryTarget = { type: CommandType; workspaceId: string | null };
type LoadMoreKind = 'workspaces' | 'members' | 'invitations';
type Tone = 'brand' | 'info' | 'success' | 'warning' | 'danger';
type SubjectKind = 'workspace' | 'member' | 'agent' | 'invitation';
type LastAction = { type: CommandType; subject: { kind: SubjectKind; value: string } | null };

function commandSubject(
  command: WorkspaceCommand,
  members: Page<WorkspaceMember> | null,
  invitations: Page<WorkspaceInvitation> | null,
): LastAction['subject'] {
  if (command.type === 'create-workspace') return { kind: 'workspace', value: command.name };
  if (command.type === 'invite') return { kind: 'invitation', value: command.recipientEmail };
  if (command.type === 'register-agent') return { kind: 'agent', value: command.name };
  if (command.type === 'revoke-invitation') {
    const invitation = invitations?.items.find(item => item.id === command.invitationId);
    return invitation === undefined ? null : { kind: 'invitation', value: invitation.recipientEmail };
  }
  if (command.type === 'update-member' || command.type === 'manage-agent') {
    const member = members?.items.find(item => item.principalId === command.principalId);
    return member === undefined ? null : { kind: command.type === 'update-member' ? 'member' : 'agent', value: member.name };
  }
  return null;
}

const toneClass: Record<Tone, string | undefined> = {
  brand: styles.bannerBrand,
  info: styles.bannerInfo,
  success: styles.bannerSuccess,
  warning: styles.bannerWarning,
  danger: styles.bannerDanger,
};

function StatusCard({
  title,
  body,
  busy = false,
  actions,
  children,
}: {
  title: Bilingual;
  body: Bilingual;
  busy?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const titleId = useId();
  return (
    <section className={styles.statusCard} aria-labelledby={titleId} aria-busy={busy}>
      <h2 id={titleId} className={styles.statusTitle}><BilingualText value={title} /></h2>
      <p className={styles.statusBody}><BilingualText value={body} /></p>
      {children}
      {actions !== undefined && <div className={styles.statusActions}>{actions}</div>}
    </section>
  );
}

function workspaceNameById(workspaces: Page<WorkspaceSummary> | null, workspaceId: string | null): string | null {
  if (workspaceId === null || workspaces === null) return null;
  return workspaces.items.find(workspace => workspace.id === workspaceId)?.name ?? null;
}

function ownerName(members: Page<WorkspaceMember> | null, ownerPrincipalId: string): string | null {
  if (members === null) return null;
  return members.items.find(member => member.principalId === ownerPrincipalId)?.name ?? null;
}

function InvitationPanel({
  status,
  sessionEmail,
  pending,
  blocked,
  outcome,
  onAccept,
  onDismiss,
}: {
  status: WorkspaceStatus;
  sessionEmail: string | null;
  pending: CommandType | null;
  blocked: boolean;
  outcome: OutcomeKind | null;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (status === 'loading') return null;

  const canAccept = sessionEmail !== null && status !== 'disabled' && status !== 'signed-out' && !blocked;
  const showSignIn = sessionEmail === null && status !== 'disabled';

  return (
    <section className={cx(styles.banner, styles.bannerBrand)} aria-labelledby="invitation-detected-heading">
      <h2 id="invitation-detected-heading" className={styles.bannerTitle}>
        <BilingualText value={copy.invitations.detectedTitle} />
      </h2>
      <p className={styles.bannerBody}>
        <BilingualText
          value={status === 'disabled'
            ? copy.invitations.detectedDisabled
            : showSignIn
              ? copy.invitations.detectedSignedOut
              : copy.invitations.detectedBody}
        />
      </p>
      {(outcome === 'forbidden' || outcome === 'conflict') && (
        <p className={styles.bannerBody}><BilingualText value={copy.invitations.checkAccount} /></p>
      )}
      {blocked && pending === null && sessionEmail !== null && status !== 'disabled' && status !== 'signed-out' && (
        <p className={styles.bannerBody}><BilingualText value={copy.invitations.blockedByRecovery} /></p>
      )}
      <div className={styles.bannerActions}>
        {canAccept && (
          <button type="button" className={styles.primary} disabled={pending !== null} onClick={onAccept}>
            <BilingualText value={copy.invitations.accept} />
          </button>
        )}
        {showSignIn && (
          <a className={styles.primary} href="/identity" target="_blank" rel="noopener noreferrer">
            <BilingualText value={copy.status.signInNewTab} />
          </a>
        )}
        <button type="button" className={styles.secondary} disabled={pending !== null} onClick={onDismiss}>
          <BilingualText value={copy.invitations.dismiss} />
        </button>
      </div>
      <p className={styles.bannerHint}><BilingualText value={copy.invitations.dismissWarning} /></p>
    </section>
  );
}

function OperationPanel({
  status,
  pending,
  outcome,
  retryTarget,
  draft,
  workspaces,
  selectedWorkspaceId,
  lastAction,
  invitationLinkVisible,
  onCancel,
  onRetry,
  onDiscard,
  onDismiss,
  onRefresh,
  onSwitch,
}: {
  status: WorkspaceStatus;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  retryTarget: RetryTarget | null;
  draft: WorkspaceCommand | null;
  workspaces: Page<WorkspaceSummary> | null;
  selectedWorkspaceId: string | null;
  lastAction: LastAction | null;
  invitationLinkVisible: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
  onRefresh: () => void;
  onSwitch: (workspaceId: string) => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const draftWorkspaceId = draft !== null && 'workspaceId' in draft ? draft.workspaceId : null;
  const draftMismatch = draftWorkspaceId !== null && draftWorkspaceId !== selectedWorkspaceId;
  const recovery = outcome === 'invitation-link-unavailable';
  const hiddenForbidden = status === 'forbidden' && outcome === 'forbidden' && pending === null && retryTarget === null && !recovery;
  const show = pending !== null || recovery || outcome !== null || retryTarget !== null || draftMismatch;

  useEffect(() => {
    if (!show) return;
    panelRef.current?.focus();
  }, [show, pending, outcome, retryTarget, draftMismatch]);

  if (!show || hiddenForbidden) return null;
  if (pending === null && (status === 'signed-out' || status === 'disabled' || status === 'loading')) return null;

  let tone: Tone = 'info';
  let title: Bilingual = copy.operation.pendingTitle;
  let body: Bilingual = copy.operation.pendingBody;
  let extra: Bilingual | null = null;
  let actions: ReactNode = null;

  if (pending !== null) {
    tone = 'info';
    title = copy.operation.pendingTitle;
    body = copy.operation.pendingBody;
    actions = (
      <button type="button" className={styles.secondary} onClick={onCancel}>
        <BilingualText value={copy.common.cancelWaiting} />
      </button>
    );
  } else if (recovery) {
    tone = 'warning';
    title = copy.operation.inviteRecoveryTitle;
    body = copy.operation.inviteRecoveryBody;
    extra = copy.operation.inviteRecoveryReload;
    actions = (
      <button type="button" className={styles.primary} disabled={status === 'loading'} onClick={onRefresh}>
        <BilingualText value={copy.operation.refreshList} />
      </button>
    );
  } else if (outcome === 'success') {
    tone = 'success';
    title = copy.operation.successTitle;
    body = lastAction === null ? copy.operation.successGeneric : successText[lastAction.type];
    const refreshFailed = status === 'error' || status === 'forbidden';
    if (refreshFailed) {
      extra = status === 'forbidden' ? copy.operation.successRefreshForbidden : copy.operation.successRefreshFailed;
    }
    if (!invitationLinkVisible) {
      actions = (
        <>
          {refreshFailed && (
            <button type="button" className={styles.primary} onClick={onRefresh}>
              <BilingualText value={copy.common.refresh} />
            </button>
          )}
          <button type="button" className={refreshFailed ? styles.secondary : styles.primary} onClick={onDismiss}>
            <BilingualText value={copy.common.dismiss} />
          </button>
        </>
      );
    }
  } else if (outcome === 'invalid') {
    tone = 'warning';
    title = copy.operation.invalidTitle;
    body = copy.operation.invalidBody;
    actions = (
      <button type="button" className={styles.primary} onClick={onDismiss}>
        <BilingualText value={copy.common.dismiss} />
      </button>
    );
  } else if (outcome === 'forbidden') {
    tone = 'danger';
    title = copy.operation.forbiddenTitle;
    body = copy.operation.forbiddenBody;
    actions = (
      <>
        <button type="button" className={styles.primary} onClick={onRefresh}>
          <BilingualText value={copy.common.refresh} />
        </button>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          <BilingualText value={copy.common.dismiss} />
        </button>
      </>
    );
  } else if (outcome === 'conflict') {
    tone = 'warning';
    title = copy.operation.conflictTitle;
    body = copy.operation.conflictBody;
    actions = (
      <>
        <button type="button" className={styles.primary} onClick={onRefresh}>
          <BilingualText value={copy.common.refresh} />
        </button>
        <button type="button" className={styles.secondary} onClick={onDiscard}>
          <BilingualText value={copy.common.discardDraft} />
        </button>
      </>
    );
  } else if (outcome === 'error') {
    tone = 'danger';
    title = copy.operation.errorTitle;
    body = copy.operation.errorBody;
    actions = retryTarget === null ? (
      <>
        <button type="button" className={styles.primary} onClick={onRefresh}>
          <BilingualText value={copy.common.refresh} />
        </button>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          <BilingualText value={copy.common.dismiss} />
        </button>
      </>
    ) : null;
  } else if (retryTarget !== null) {
    tone = 'info';
    title = copy.operation.canceledTitle;
    body = copy.operation.canceledBody;
  } else if (draftMismatch) {
    tone = 'warning';
    title = copy.operation.draftScopeTitle;
    body = copy.operation.draftScope;
  }

  const scopeId = retryTarget?.workspaceId ?? ((draftMismatch || recovery) ? draftWorkspaceId : null);
  const scopeName = workspaceNameById(workspaces, scopeId);
  const scopeMismatch = scopeId !== null && scopeId !== selectedWorkspaceId;
  const subject: LastAction['subject'] = lastAction?.subject
    ?? (recovery && draft?.type === 'invite' ? { kind: 'invitation', value: draft.recipientEmail } : null);

  if (retryTarget !== null) {
    tone = outcome === 'error' ? 'danger' : 'info';
    actions = (
      <>
        <button
          type="button"
          className={styles.primary}
          disabled={scopeMismatch}
          onClick={onRetry}
        >
          <BilingualText value={retryText[retryTarget.type]} />
        </button>
        {scopeMismatch && scopeId !== null && (
          <button type="button" className={styles.secondary} onClick={() => onSwitch(scopeId)}>
            <BilingualText value={copy.common.switchWorkspace} />
          </button>
        )}
        <button type="button" className={styles.secondary} onClick={onDiscard}>
          <BilingualText value={copy.common.discardDraft} />
        </button>
      </>
    );
  } else if (draftMismatch && scopeId !== null) {
    actions = (
      <>
        <button type="button" className={styles.primary} onClick={() => onSwitch(scopeId)}>
          <BilingualText value={copy.common.switchWorkspace} />
        </button>
        <button type="button" className={styles.secondary} onClick={onDiscard}>
          <BilingualText value={copy.common.discardDraft} />
        </button>
      </>
    );
  }

  const role = tone === 'success' || tone === 'info' ? 'status' : 'alert';

  return (
    <section
      ref={panelRef}
      className={cx(styles.banner, toneClass[tone], styles.focusPanel)}
      role={role}
      tabIndex={-1}
      aria-labelledby="operation-heading"
    >
      <h2 id="operation-heading" className={styles.bannerTitle}><BilingualText value={title} /></h2>
      {pending !== null && (
        <p className={styles.bannerBody}><BilingualText value={pendingText[pending]} /></p>
      )}
      <p className={styles.bannerBody}><BilingualText value={body} /></p>
      {extra !== null && <p className={styles.bannerBody}><BilingualText value={extra} /></p>}
      {subject !== null && (
        <p className={styles.bannerHint}>
          <BilingualText value={subjectLabel[subject.kind]} />
          {': '}
          <span className={styles.longValue}>{subject.value}</span>
        </p>
      )}
      {scopeId !== null && (retryTarget !== null || draftMismatch || recovery) && (
        <div className={styles.scopeBlock}>
          <p className={styles.bannerHint}>
            <BilingualText value={retryTarget !== null ? copy.operation.retryScope : copy.operation.scopeLabel} />
            {': '}
            <span className={styles.longValue}>{scopeName ?? scopeId}</span>
          </p>
          {scopeMismatch && retryTarget !== null && (
            <p className={styles.bannerBody}><BilingualText value={copy.operation.retryOtherScope} /></p>
          )}
        </div>
      )}
      {actions !== null && <div className={styles.bannerActions}>{actions}</div>}
    </section>
  );
}

function WorkspaceChooser({
  workspaces,
  selectedWorkspaceId,
  pending,
  onSelect,
}: {
  workspaces: Page<WorkspaceSummary>;
  selectedWorkspaceId: string | null;
  pending: CommandType | null;
  onSelect: (workspaceId: string | null) => void;
}) {
  const id = useId();
  const knownSelection = selectedWorkspaceId === null || workspaces.items.some(item => item.id === selectedWorkspaceId);
  const value = selectedWorkspaceId ?? '';

  return (
    <div className={styles.workspaceChooser}>
      <label htmlFor={id}><BilingualText value={copy.workspace.selectorLabel} /></label>
      <select
        id={id}
        value={value}
        disabled={pending !== null}
        onChange={event => onSelect(event.currentTarget.value === '' ? null : event.currentTarget.value)}
      >
        {selectedWorkspaceId === null && (
          <option value="" disabled><BilingualText value={copy.workspace.chooseWorkspace} /></option>
        )}
        {selectedWorkspaceId !== null && (
          <option value=""><BilingualText value={copy.workspace.clearSelection} /></option>
        )}
        {!knownSelection && selectedWorkspaceId !== null && (
          <option value={selectedWorkspaceId}><BilingualText value={copy.workspace.currentSelection} /></option>
        )}
        {workspaces.items.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  );
}

function WorkspaceBar({
  workspaces,
  workspace,
  members,
  pending,
  loadingMore,
  onSelect,
  onLoadMore,
}: {
  workspaces: Page<WorkspaceSummary>;
  workspace: WorkspaceSummary;
  members: Page<WorkspaceMember> | null;
  pending: CommandType | null;
  loadingMore: boolean;
  onSelect: (workspaceId: string) => void;
  onLoadMore: () => void;
}) {
  const selectorId = useId();
  const owner = ownerName(members, workspace.ownerPrincipalId);

  return (
    <section className={styles.workspaceBar} aria-labelledby="workspace-bar-heading">
      <h2 id="workspace-bar-heading" className={styles.srOnly}><BilingualText value={copy.workspace.selectorLabel} /></h2>
      <div className={styles.field}>
        <label htmlFor={selectorId}><BilingualText value={copy.workspace.selectorLabel} /></label>
        <select
          id={selectorId}
          value={workspace.id}
          disabled={pending !== null}
          onChange={event => onSelect(event.currentTarget.value)}
        >
          {!workspaces.items.some(item => item.id === workspace.id) && (
            <option value={workspace.id}>{workspace.name}</option>
          )}
          {workspaces.items.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <dl className={styles.workspaceSummary}>
        <div>
          <dt><BilingualText value={copy.workspace.roleLabel} /></dt>
          <dd><BilingualText value={roleName[workspace.role]} /></dd>
        </div>
        <div>
          <dt><BilingualText value={copy.workspace.ownerLabel} /></dt>
          <dd className={styles.longValue}>{owner ?? <BilingualText value={copy.workspace.ownerUnavailable} />}</dd>
        </div>
      </dl>
      {workspaces.nextCursor !== null && (
        <button type="button" className={styles.secondary} disabled={pending !== null || loadingMore} onClick={onLoadMore}>
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.workspace.loadMore} />
        </button>
      )}
    </section>
  );
}

export function WorkspaceView() {
  const [lang, setLang] = useState<Lang>('es');
  return (
    <LocaleProvider lang={lang}>
      <WorkspaceScreen lang={lang} onLangChange={setLang} />
    </LocaleProvider>
  );
}

function WorkspaceScreen({ lang, onLangChange }: { lang: Lang; onLangChange: (lang: Lang) => void }) {
  const localeId = useId();
  const ws = useWorkspaces();
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [loadingMore, setLoadingMore] = useState<LoadMoreKind | null>(null);
  const knownWorkspaceNames = useRef<Record<string, string>>({});

  useEffect(() => {
    if (ws.workspaces === null) return;
    for (const item of ws.workspaces.items) knownWorkspaceNames.current[item.id] = item.name;
  }, [ws.workspaces]);

  const draftWorkspaceId = ws.draft !== null && 'workspaceId' in ws.draft ? ws.draft.workspaceId : null;
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
  const custodians = members?.items.filter(member =>
    member.kind === 'human'
    && member.state === 'active'
    && member.principalState === 'active'
    && (member.role === 'owner' || member.role === 'admin')) ?? [];

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
    setLastAction(current => current ?? {
      type: target.type,
      subject: ws.draft === null ? null : commandSubject(ws.draft, members, invitations),
    });
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
  const draftScopeName = workspaceNameById(workspaces, draftScopeId)
    ?? (draftScopeId === null ? null : knownWorkspaceNames.current[draftScopeId] ?? null);

  return (
    <>
      <a className={styles.skipLink} href="#main"><BilingualText value={copy.common.skip} /></a>
      <main id="main" tabIndex={-1} className={styles.shell} lang={lang}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.backLink}><BilingualText value={copy.common.backHome} /></Link>
          <div className={styles.topbarActions}>
            <div className={styles.localeField}>
              <label className={styles.srOnly} htmlFor={localeId}><BilingualText value={copy.common.language} /></label>
              <select
                id={localeId}
                value={lang}
                onChange={event => onLangChange(event.currentTarget.value as Lang)}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            {session !== null && (
              <span className={styles.account}>
                <span className={styles.accountName}>{session.user.name}</span>
                <span className={styles.accountEmail}>{session.user.email}</span>
              </span>
            )}
            {session !== null && (
              <Link
                href="/identity"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.accountLink}
              >
                <BilingualText value={copy.common.account} />
              </Link>
            )}
            <button
              type="button"
              className={styles.secondary}
              disabled={ws.pending !== null || ws.status === 'loading'}
              onClick={() => void ws.refresh()}
            >
              <BilingualText value={copy.common.refresh} />
            </button>
          </div>
        </header>

        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}><BilingualText value={copy.header.eyebrow} /></p>
          <h1 className={styles.title}><BilingualText value={copy.header.title} /></h1>
          <p className={styles.lede}><BilingualText value={copy.header.lede} /></p>
        </div>

        {ws.hasInvitation && (
          <InvitationPanel
            status={ws.status}
            sessionEmail={sessionEmail}
            pending={ws.pending}
            blocked={commandsDisabled || ws.retryTarget !== null}
            outcome={ws.outcome}
            onAccept={acceptInvitation}
            onDismiss={ws.clearInvitation}
          />
        )}

        <OperationPanel
          status={ws.status}
          pending={ws.pending}
          outcome={ws.outcome}
          retryTarget={ws.retryTarget}
          draft={ws.draft}
          workspaces={workspaces}
          selectedWorkspaceId={ws.selectedWorkspaceId}
          lastAction={lastAction}
          invitationLinkVisible={invitationLinkVisible}
          onCancel={ws.cancelPending}
          onRetry={retry}
          onDiscard={discard}
          onDismiss={dismiss}
          onRefresh={() => void ws.refresh()}
          onSwitch={workspaceId => void ws.selectWorkspace(workspaceId)}
        />

        {invitationLinkVisible && invitationLink !== null && (
          <InvitationLinkPanel link={invitationLink} onDone={finishInvitationLink} />
        )}

        {ws.status === 'loading' && (
          <StatusCard title={copy.status.loadingTitle} body={copy.status.loadingBody} busy />
        )}

        {ws.status === 'disabled' && (
          <StatusCard
            title={copy.status.disabledTitle}
            body={copy.status.disabledBody}
            actions={(
              <button type="button" className={styles.secondary} onClick={() => void ws.refresh()}>
                <BilingualText value={copy.common.refresh} />
              </button>
            )}
          />
        )}

        {ws.status === 'signed-out' && (
          <StatusCard
            title={copy.status.signedOutTitle}
            body={copy.status.signedOutBody}
            actions={(
              <>
                {memoryPresent ? (
                  <a className={styles.primary} href="/identity" target="_blank" rel="noopener noreferrer">
                    <BilingualText value={copy.status.signInNewTab} />
                  </a>
                ) : (
                  <Link className={styles.primary} href="/identity">
                    <BilingualText value={copy.status.signIn} />
                  </Link>
                )}
                {draftMemory && (
                  <button type="button" className={styles.secondary} onClick={discard}>
                    <BilingualText value={copy.common.discardDraft} />
                  </button>
                )}
              </>
            )}
          >
            <p className={styles.statusBody}>
              <BilingualText value={memoryPresent ? copy.status.signInReturnMemory : copy.status.signInReturn} />
            </p>
            {memoryPresent && (
              <>
                <p className={styles.statusBody}><BilingualText value={copy.status.memoryKept} /></p>
                {draftMemory && draftType !== null && (
                  <div className={styles.draftNotice}>
                    <p>
                      <strong><BilingualText value={copy.operation.draftLabel} />:</strong>{' '}
                      <BilingualText value={commandName[draftType]} />
                    </p>
                    {draftScopeId !== null && (
                      <p className={styles.fieldHint}>
                        <BilingualText value={copy.operation.scopeLabel} />
                        {': '}
                        <span className={styles.longValue}>{draftScopeName ?? draftScopeId}</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </StatusCard>
        )}

        {ws.status === 'error' && (
          <StatusCard
            title={copy.status.errorTitle}
            body={copy.status.errorBody}
            actions={(
              <>
                <button type="button" className={styles.primary} onClick={() => void ws.refresh()}>
                  <BilingualText value={copy.status.retryLoad} />
                </button>
                <Link className={styles.secondary} href="/"><BilingualText value={copy.common.backHome} /></Link>
              </>
            )}
          />
        )}

        {ws.status === 'forbidden' && (
          <StatusCard
            title={copy.status.forbiddenTitle}
            body={copy.status.forbiddenBody}
            actions={(
              <>
                <button type="button" className={styles.primary} onClick={() => void ws.refresh()}>
                  <BilingualText value={copy.common.refresh} />
                </button>
                {session !== null && (
                  <a className={styles.secondary} href="/identity" target="_blank" rel="noopener noreferrer">
                    <BilingualText value={copy.common.account} />
                  </a>
                )}
                <Link className={styles.secondary} href="/"><BilingualText value={copy.common.backHome} /></Link>
              </>
            )}
          />
        )}

        {ws.status === 'empty' && (
          <section className={styles.emptyState} aria-labelledby="empty-heading">
            <h2 id="empty-heading" className={styles.sectionTitle}><BilingualText value={copy.status.emptyTitle} /></h2>
            <p className={styles.sectionBody}><BilingualText value={copy.status.emptyBody} /></p>
            {workspaces !== null && workspaces.items.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.subheading}><BilingualText value={copy.workspace.availableTitle} /></h3>
                <WorkspaceChooser
                  workspaces={workspaces}
                  selectedWorkspaceId={null}
                  pending={ws.pending}
                  onSelect={workspaceId => void ws.selectWorkspace(workspaceId)}
                />
              </div>
            )}
            {ws.capabilities.canCreateWorkspace ? (
              <CreateWorkspaceForm
                empty
                disabled={commandsDisabled}
                draft={ws.draft}
                onStage={stageDraft}
                onCommand={run}
              />
            ) : (
              <p className={styles.ownerNote}>
                <BilingualText value={copy.status.emptyBody} />
              </p>
            )}
          </section>
        )}

        {(ws.status === 'forbidden' || ws.status === 'error') && (
          <section className={styles.section} aria-labelledby="workspace-recovery-heading">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="workspace-recovery-heading" className={styles.sectionTitle}>
                  <BilingualText value={copy.workspace.switchTitle} />
                </h2>
                <p className={styles.sectionBody}><BilingualText value={copy.workspace.switchBody} /></p>
              </div>
            </div>
            {workspaces !== null && workspaces.items.length > 0 && (
              <div className={styles.card}>
                <WorkspaceChooser
                  workspaces={workspaces}
                  selectedWorkspaceId={ws.selectedWorkspaceId}
                  pending={ws.pending}
                  onSelect={workspaceId => void ws.selectWorkspace(workspaceId)}
                />
              </div>
            )}
            {ws.capabilities.canCreateWorkspace && (
              <CreateWorkspaceForm
                empty={false}
                disabled={commandsDisabled}
                draft={ws.draft}
                onStage={stageDraft}
                onCommand={run}
              />
            )}
          </section>
        )}

        {ws.status === 'ready' && workspace !== null && members !== null && workspaces !== null && (
          <>
            <WorkspaceBar
              workspaces={workspaces}
              workspace={workspace}
              members={members}
              pending={ws.pending}
              loadingMore={loadingMore === 'workspaces'}
              onSelect={workspaceId => void ws.selectWorkspace(workspaceId)}
              onLoadMore={() => void loadMore('workspaces')}
            />
            <MembersSection
              workspaceId={workspace.id}
              members={members}
              canAdminister={ws.capabilities.canAdminister}
              disabled={commandsDisabled}
              busy={busy}
              draft={ws.draft}
              loadingMore={loadingMore === 'members'}
              onStage={stageDraft}
              onCommand={run}
              onLoadMore={() => void loadMore('members')}
            />
            <AgentsSection
              workspaceId={workspace.id}
              members={members}
              custodians={custodians}
              canAdminister={ws.capabilities.canAdminister}
              disabled={commandsDisabled}
              busy={busy}
              draft={ws.draft}
              loadingMore={loadingMore === 'members'}
              onStage={stageDraft}
              onCommand={run}
              onLoadMore={() => void loadMore('members')}
            />
            {invitations !== null && (
              <InvitationsSection
                workspaceId={workspace.id}
                invitations={invitations}
                members={members}
                canAdminister={ws.capabilities.canAdminister}
                disabled={commandsDisabled}
                busy={busy || ws.retryTarget !== null}
                draft={ws.draft}
                loadingMore={loadingMore === 'invitations'}
                onStage={stageDraft}
                onCommand={run}
                onLoadMore={() => void loadMore('invitations')}
              />
            )}
            <CreateWorkspaceForm
              empty={false}
              disabled={commandsDisabled}
              draft={ws.draft}
              onStage={stageDraft}
              onCommand={run}
            />
          </>
        )}

      </main>
    </>
  );
}
