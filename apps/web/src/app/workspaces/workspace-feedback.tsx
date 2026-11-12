'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Page, WorkspaceCommand, WorkspaceSummary } from '@rielia/contracts';
import { copy, pendingText, retryText, subjectLabel, successText } from './strings';
import { BilingualText, cx } from './workspace-ui';
import type { WorkspaceStatus, RetryTarget, LastAction } from './workspace-screen-model';
import { workspaceNameById } from './workspace-screen-model';
import type { Bilingual, CommandType, OutcomeKind } from './strings';
import styles from './workspace.module.css';
type Tone = 'brand' | 'info' | 'success' | 'warning' | 'danger';

const toneClass: Record<Tone, string | undefined> = {
  brand: styles.bannerBrand,
  info: styles.bannerInfo,
  success: styles.bannerSuccess,
  warning: styles.bannerWarning,
  danger: styles.bannerDanger,
};

export function StatusCard({
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
      <h2 id={titleId} className={styles.statusTitle}>
        <BilingualText value={title} />
      </h2>
      <p className={styles.statusBody}>
        <BilingualText value={body} />
      </p>
      {children}
      {actions !== undefined && <div className={styles.statusActions}>{actions}</div>}
    </section>
  );
}

export function InvitationPanel({
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

  const canAccept =
    sessionEmail !== null && status !== 'disabled' && status !== 'signed-out' && !blocked;
  const showSignIn = sessionEmail === null && status !== 'disabled';

  return (
    <section
      className={cx(styles.banner, styles.bannerBrand)}
      aria-labelledby="invitation-detected-heading"
    >
      <h2 id="invitation-detected-heading" className={styles.bannerTitle}>
        <BilingualText value={copy.invitations.detectedTitle} />
      </h2>
      <p className={styles.bannerBody}>
        <BilingualText
          value={
            status === 'disabled'
              ? copy.invitations.detectedDisabled
              : showSignIn
                ? copy.invitations.detectedSignedOut
                : copy.invitations.detectedBody
          }
        />
      </p>
      {(outcome === 'forbidden' || outcome === 'conflict') && (
        <p className={styles.bannerBody}>
          <BilingualText value={copy.invitations.checkAccount} />
        </p>
      )}
      {blocked &&
        pending === null &&
        sessionEmail !== null &&
        status !== 'disabled' &&
        status !== 'signed-out' && (
          <p className={styles.bannerBody}>
            <BilingualText value={copy.invitations.blockedByRecovery} />
          </p>
        )}
      <div className={styles.bannerActions}>
        {canAccept && (
          <button
            type="button"
            className={styles.primary}
            disabled={pending !== null}
            onClick={onAccept}
          >
            <BilingualText value={copy.invitations.accept} />
          </button>
        )}
        {showSignIn && (
          <a className={styles.primary} href="/identity" target="_blank" rel="noopener noreferrer">
            <BilingualText value={copy.status.signInNewTab} />
          </a>
        )}
        <button
          type="button"
          className={styles.secondary}
          disabled={pending !== null}
          onClick={onDismiss}
        >
          <BilingualText value={copy.invitations.dismiss} />
        </button>
      </div>
      <p className={styles.bannerHint}>
        <BilingualText value={copy.invitations.dismissWarning} />
      </p>
    </section>
  );
}

export function OperationPanel({
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
  const hiddenForbidden =
    status === 'forbidden' &&
    outcome === 'forbidden' &&
    pending === null &&
    retryTarget === null &&
    !recovery;
  const show =
    pending !== null || recovery || outcome !== null || retryTarget !== null || draftMismatch;

  useEffect(() => {
    if (!show) return;
    panelRef.current?.focus();
  }, [show, pending, outcome, retryTarget, draftMismatch]);

  if (!show || hiddenForbidden) return null;
  if (
    pending === null &&
    (status === 'signed-out' || status === 'disabled' || status === 'loading')
  )
    return null;

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
      <button
        type="button"
        className={styles.primary}
        disabled={status === 'loading'}
        onClick={onRefresh}
      >
        <BilingualText value={copy.operation.refreshList} />
      </button>
    );
  } else if (outcome === 'success') {
    tone = 'success';
    title = copy.operation.successTitle;
    body =
      lastAction === null
        ? copy.operation.successGeneric
        : lastAction.type === 'invite' && !invitationLinkVisible
          ? copy.operation.inviteLinkUnavailable
          : successText[lastAction.type];
    const refreshFailed = status === 'error' || status === 'forbidden';
    if (refreshFailed) {
      extra =
        status === 'forbidden'
          ? copy.operation.successRefreshForbidden
          : copy.operation.successRefreshFailed;
    }
    if (!invitationLinkVisible) {
      actions = (
        <>
          {refreshFailed && (
            <button type="button" className={styles.primary} onClick={onRefresh}>
              <BilingualText value={copy.common.refresh} />
            </button>
          )}
          <button
            type="button"
            className={refreshFailed ? styles.secondary : styles.primary}
            onClick={onDismiss}
          >
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
    actions =
      retryTarget === null ? (
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

  const scopeId = retryTarget?.workspaceId ?? (draftMismatch || recovery ? draftWorkspaceId : null);
  const scopeName = workspaceNameById(workspaces, scopeId);
  const scopeMismatch = scopeId !== null && scopeId !== selectedWorkspaceId;
  const subject: LastAction['subject'] =
    lastAction?.subject ??
    (recovery && draft?.type === 'invite'
      ? { kind: 'invitation', value: draft.recipientEmail }
      : null);

  if (retryTarget !== null) {
    tone = outcome === 'error' ? 'danger' : 'info';
    actions = (
      <>
        <button type="button" className={styles.primary} disabled={scopeMismatch} onClick={onRetry}>
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
      <h2 id="operation-heading" className={styles.bannerTitle}>
        <BilingualText value={title} />
      </h2>
      {pending !== null && (
        <p className={styles.bannerBody}>
          <BilingualText value={pendingText[pending]} />
        </p>
      )}
      <p className={styles.bannerBody}>
        <BilingualText value={body} />
      </p>
      {extra !== null && (
        <p className={styles.bannerBody}>
          <BilingualText value={extra} />
        </p>
      )}
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
            <BilingualText
              value={retryTarget !== null ? copy.operation.retryScope : copy.operation.scopeLabel}
            />
            {': '}
            <span className={styles.longValue}>{scopeName ?? scopeId}</span>
          </p>
          {scopeMismatch && retryTarget !== null && (
            <p className={styles.bannerBody}>
              <BilingualText value={copy.operation.retryOtherScope} />
            </p>
          )}
        </div>
      )}
      {actions !== null && <div className={styles.bannerActions}>{actions}</div>}
    </section>
  );
}
