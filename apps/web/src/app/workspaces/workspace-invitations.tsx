'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  LimitedRole,
  Page,
  WorkspaceCommand,
  WorkspaceInvitation,
  WorkspaceMember,
} from '@rielia/contracts';
import { copy, countText, invitationStateName, limitedRoleName, roleDescription } from './strings';
import {
  Badge,
  BilingualText,
  ConfirmBox,
  cx,
  formatDate,
  limitedRoles,
  memberName,
  BilingualOption,
} from './workspace-ui';
import styles from './workspace.module.css';
function InviteForm({
  workspaceId,
  disabled,
  draft,
  onStage,
  onCommand,
}: {
  workspaceId: string;
  disabled: boolean;
  draft: WorkspaceCommand | null;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<LimitedRole>('member');
  const [error, setError] = useState(false);
  const emailId = useId();
  const roleId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (draft?.type === 'invite' && draft.workspaceId === workspaceId) {
      setEmail(draft.recipientEmail);
      setRole(draft.role);
      setError(false);
    } else if (draft === null) {
      setEmail('');
      setRole('member');
      setError(false);
    }
  }, [draft, workspaceId]);

  function change(next: { email: string; role: LimitedRole }) {
    setEmail(next.email);
    setRole(next.role);
    if (error) setError(false);
    onStage({ type: 'invite', workspaceId, recipientEmail: next.email, role: next.role });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      setError(true);
      return;
    }
    setError(false);
    onCommand({ type: 'invite', workspaceId, recipientEmail: value, role });
  }

  return (
    <form onSubmit={submit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={emailId}>
            <BilingualText value={copy.invitations.emailLabel} />
          </label>
          <input
            id={emailId}
            name="invitation-email"
            type="email"
            value={email}
            maxLength={254}
            autoComplete="email"
            required
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={cx(hintId, error ? errorId : null)}
            onChange={(event) => change({ email: event.currentTarget.value, role })}
          />
          <p id={hintId} className={styles.fieldHint}>
            <BilingualText value={copy.invitations.emailHint} />
          </p>
          {error && (
            <p id={errorId} className={styles.fieldError} role="alert">
              <BilingualText value={copy.invitations.emailRequired} />
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor={roleId}>
            <BilingualText value={copy.invitations.roleLabel} />
          </label>
          <select
            id={roleId}
            name="invitation-role"
            value={role}
            disabled={disabled}
            onChange={(event) => change({ email, role: event.currentTarget.value as LimitedRole })}
          >
            {limitedRoles.map((value) => (
              <option key={value} value={value}>
                <BilingualOption value={limitedRoleName[value]} />
              </option>
            ))}
          </select>
          <p className={styles.fieldHint}>
            <BilingualText value={roleDescription[role]} />
          </p>
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.primary} disabled={disabled}>
          <BilingualText value={copy.invitations.create} />
        </button>
      </div>
    </form>
  );
}

export function InvitationLinkPanel({ link, onDone }: { link: string; onDone: () => void }) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const linkId = useId();

  useEffect(() => {
    setCopied('idle');
  }, [link]);

  async function copyLink() {
    try {
      if (navigator.clipboard === undefined) throw new Error('Clipboard unavailable.');
      await navigator.clipboard.writeText(link);
      setCopied('copied');
    } catch {
      setCopied('failed');
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  return (
    <section
      className={cx(styles.banner, styles.bannerBrand)}
      aria-labelledby="invitation-link-heading"
    >
      <h2 id="invitation-link-heading" className={styles.bannerTitle}>
        <BilingualText value={copy.invitations.linkTitle} />
      </h2>
      <p className={styles.bannerBody}>
        <BilingualText value={copy.invitations.linkBody} />
      </p>
      <div className={styles.field}>
        <label htmlFor={linkId}>
          <BilingualText value={copy.invitations.linkLabel} />
        </label>
        <input
          ref={inputRef}
          id={linkId}
          className={styles.linkInput}
          type="text"
          readOnly
          value={link}
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>
      <div className={styles.bannerActions}>
        <button type="button" className={styles.primary} onClick={() => void copyLink()}>
          <BilingualText value={copy.invitations.copy} />
        </button>
        <button type="button" className={styles.secondary} onClick={onDone}>
          <BilingualText value={copy.invitations.done} />
        </button>
      </div>
      <div role="status" aria-live="polite">
        {copied === 'copied' && (
          <p className={styles.bannerBody}>
            <BilingualText value={copy.invitations.copied} />
          </p>
        )}
        {copied === 'failed' && (
          <p className={styles.fieldError}>
            <BilingualText value={copy.invitations.copyFailed} />
          </p>
        )}
      </div>
    </section>
  );
}

function invitationTone(
  state: WorkspaceInvitation['state'],
): 'neutral' | 'warning' | 'danger' | 'success' {
  if (state === 'pending') return 'warning';
  if (state === 'accepted') return 'success';
  if (state === 'revoked') return 'danger';
  return 'neutral';
}

function InvitationRow({
  invitation,
  members,
  disabled,
  onCommand,
}: {
  invitation: WorkspaceInvitation;
  members: Page<WorkspaceMember> | null;
  disabled: boolean;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const issuer = memberName(members, invitation.issuerPrincipalId);

  function closeConfirm() {
    setConfirming(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  function confirmRevoke() {
    setConfirming(false);
    onCommand({
      type: 'revoke-invitation',
      workspaceId: invitation.workspaceId,
      invitationId: invitation.id,
    });
  }

  return (
    <li className={styles.invitationRow}>
      <div className={styles.invitationMain}>
        <p className={styles.invitationEmail}>{invitation.recipientEmail}</p>
        <div className={styles.badgeRow}>
          <Badge tone="neutral">
            <BilingualText value={limitedRoleName[invitation.role]} />
          </Badge>
          <Badge tone={invitationTone(invitation.state)}>
            <BilingualText value={invitationStateName[invitation.state]} />
          </Badge>
        </div>
        <dl className={styles.metaGrid}>
          <div>
            <dt>
              <BilingualText value={copy.invitations.issuer} />
            </dt>
            <dd className={styles.longValue}>{issuer ?? invitation.issuerPrincipalId}</dd>
          </div>
          <div>
            <dt>
              <BilingualText value={copy.invitations.expires} />
            </dt>
            <dd>
              <time dateTime={invitation.expiresAt}>{formatDate(invitation.expiresAt)}</time>
            </dd>
          </div>
        </dl>
      </div>
      {invitation.state === 'pending' && (
        <div className={styles.invitationActions}>
          <button
            ref={openerRef}
            type="button"
            className={styles.dangerButton}
            disabled={disabled || confirming}
            onClick={() => setConfirming(true)}
          >
            <BilingualText value={copy.invitations.revoke} />
          </button>
        </div>
      )}
      {confirming && (
        <ConfirmBox
          title={copy.invitations.confirmRevokeTitle}
          consequence={copy.invitations.revokeConsequence}
          confirmLabel={copy.invitations.revoke}
          danger
          disabled={disabled}
          onConfirm={confirmRevoke}
          onCancel={closeConfirm}
        >
          <dl className={styles.metaGrid}>
            <div>
              <dt>
                <BilingualText value={copy.common.email} />
              </dt>
              <dd className={styles.longValue}>{invitation.recipientEmail}</dd>
            </div>
          </dl>
        </ConfirmBox>
      )}
    </li>
  );
}

export function InvitationsSection({
  workspaceId,
  invitations,
  members,
  canAdminister,
  disabled,
  busy,
  draft,
  loadingMore,
  onStage,
  onCommand,
  onLoadMore,
}: {
  workspaceId: string;
  invitations: Page<WorkspaceInvitation>;
  members: Page<WorkspaceMember> | null;
  canAdminister: boolean;
  disabled: boolean;
  busy: boolean;
  draft: WorkspaceCommand | null;
  loadingMore: boolean;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
  onLoadMore: () => void;
}) {
  if (!canAdminister) return null;

  return (
    <section className={styles.section} aria-labelledby="invitations-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="invitations-heading" className={styles.sectionTitle}>
            <BilingualText value={copy.invitations.title} />
          </h2>
          <p className={styles.sectionBody}>
            <BilingualText value={copy.invitations.body} />
          </p>
          <p className={styles.sectionHint}>
            <BilingualText
              value={countText(
                invitations.total,
                copy.invitations.countOne,
                copy.invitations.countMany,
              )}
            />
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.noEmailNote}>
          <BilingualText value={copy.invitations.noEmailNote} />
        </p>
        <p className={styles.fieldHint}>
          <BilingualText value={copy.invitations.pendingNote} />
        </p>
        <InviteForm
          workspaceId={workspaceId}
          disabled={disabled}
          draft={draft}
          onStage={onStage}
          onCommand={onCommand}
        />
      </div>

      {invitations.items.length === 0 ? (
        <p className={styles.emptyNote}>
          <BilingualText value={copy.invitations.empty} />
        </p>
      ) : (
        <ul className={styles.list}>
          {invitations.items.map((invitation) => (
            <InvitationRow
              key={`${invitation.id}:${invitation.state}`}
              invitation={invitation}
              members={members}
              disabled={busy || disabled}
              onCommand={onCommand}
            />
          ))}
        </ul>
      )}
      {invitations.nextCursor !== null && (
        <button
          type="button"
          className={styles.secondary}
          disabled={busy || loadingMore}
          onClick={onLoadMore}
        >
          <BilingualText
            value={loadingMore ? copy.common.loadingMore : copy.invitations.loadMore}
          />
        </button>
      )}
    </section>
  );
}
