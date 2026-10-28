'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  LimitedRole,
  MemberState,
  Page,
  WorkspaceCommand,
  WorkspaceInvitation,
  WorkspaceMember,
} from '@rielia/contracts';
import {
  agentRoleName,
  copy,
  countText,
  invitationStateName,
  kindName,
  limitedRoleName,
  roleDescription,
  roleName,
  stateName,
  type CommandType,
  type OutcomeKind,
} from './strings';
import { Badge, BilingualText, ConfirmBox, cx, formatDate, phrase } from './workspace-ui';
import styles from './workspace.module.css';

const limitedRoles: readonly LimitedRole[] = ['admin', 'member', 'viewer'];

function stateTone(state: MemberState): 'neutral' | 'warning' | 'danger' | 'success' {
  if (state === 'active') return 'success';
  if (state === 'suspended') return 'warning';
  return 'danger';
}

function memberName(members: Page<WorkspaceMember> | null, principalId: string | null): string | null {
  if (principalId === null || members === null) return null;
  return members.items.find(member => member.principalId === principalId)?.name ?? null;
}

function BilingualOption({ value }: { value: { es: string; en: string } }) {
  return <>{phrase(value)}</>;
}

export function CreateWorkspaceForm({
  empty,
  disabled,
  pending,
  outcome,
  onCommand,
}: {
  empty: boolean;
  disabled: boolean;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!submitted || pending !== null) return;
    if (outcome === 'success') setName('');
    if (outcome !== null) setSubmitted(false);
  }, [outcome, pending, submitted]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
    onCommand({ type: 'create-workspace', name: value });
  }

  const form = (
    <>
      <p className={styles.sectionBody}><BilingualText value={copy.workspace.createBody} /></p>
      <form onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor={inputId}><BilingualText value={copy.workspace.nameLabel} /></label>
          <input
            id={inputId}
            name="workspace-name"
            type="text"
            value={name}
            maxLength={200}
            autoComplete="off"
            required
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={cx(hintId, error ? errorId : null)}
            onChange={event => {
              setName(event.currentTarget.value);
              if (error) setError(false);
            }}
          />
          <p id={hintId} className={styles.fieldHint}><BilingualText value={copy.workspace.nameHint} /></p>
          {error && (
            <p id={errorId} className={styles.fieldError} role="alert">
              <BilingualText value={copy.workspace.nameRequired} />
            </p>
          )}
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.primary} disabled={disabled}>
            <BilingualText value={copy.workspace.create} />
          </button>
        </div>
      </form>
    </>
  );

  if (empty) {
    return (
      <div className={styles.emptyForm}>
        <h3 className={styles.subheading}><BilingualText value={copy.workspace.createTitle} /></h3>
        {form}
      </div>
    );
  }

  return (
    <details className={styles.disclosure}>
      <summary><BilingualText value={copy.workspace.createDisclosure} /></summary>
      <div className={styles.disclosureBody}>
        <h2 className={styles.sectionTitle}><BilingualText value={copy.workspace.createTitle} /></h2>
        {form}
      </div>
    </details>
  );
}

function InviteForm({
  workspaceId,
  disabled,
  pending,
  outcome,
  onCommand,
}: {
  workspaceId: string;
  disabled: boolean;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<LimitedRole>('member');
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const emailId = useId();
  const roleId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!submitted || pending !== null) return;
    if (outcome === 'success') {
      setEmail('');
      setSubmitted(false);
    } else if (outcome !== null) {
      setSubmitted(false);
    }
  }, [outcome, pending, submitted]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
    onCommand({ type: 'invite', workspaceId, recipientEmail: value, role });
  }

  return (
    <form onSubmit={submit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={emailId}><BilingualText value={copy.invitations.emailLabel} /></label>
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
            onChange={event => {
              setEmail(event.currentTarget.value);
              if (error) setError(false);
            }}
          />
          <p id={hintId} className={styles.fieldHint}><BilingualText value={copy.invitations.emailHint} /></p>
          {error && (
            <p id={errorId} className={styles.fieldError} role="alert">
              <BilingualText value={copy.invitations.emailRequired} />
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor={roleId}><BilingualText value={copy.invitations.roleLabel} /></label>
          <select
            id={roleId}
            name="invitation-role"
            value={role}
            disabled={disabled}
            onChange={event => setRole(event.currentTarget.value as LimitedRole)}
          >
            {limitedRoles.map(value => (
              <option key={value} value={value}><BilingualOption value={limitedRoleName[value]} /></option>
            ))}
          </select>
          <p className={styles.fieldHint}><BilingualText value={roleDescription[role]} /></p>
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

function InvitationLinkPanel({ link, onDone }: { link: string; onDone: () => void }) {
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
    <section className={cx(styles.banner, styles.bannerBrand)} aria-labelledby="invitation-link-heading">
      <h2 id="invitation-link-heading" className={styles.bannerTitle}><BilingualText value={copy.invitations.linkTitle} /></h2>
      <p className={styles.bannerBody}><BilingualText value={copy.invitations.linkBody} /></p>
      <div className={styles.field}>
        <label htmlFor={linkId}><BilingualText value={copy.invitations.linkLabel} /></label>
        <input
          ref={inputRef}
          id={linkId}
          className={styles.linkInput}
          type="text"
          readOnly
          value={link}
          onFocus={event => event.currentTarget.select()}
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
        {copied === 'copied' && <p className={styles.bannerBody}><BilingualText value={copy.invitations.copied} /></p>}
        {copied === 'failed' && <p className={styles.fieldError}><BilingualText value={copy.invitations.copyFailed} /></p>}
      </div>
    </section>
  );
}

function invitationTone(state: WorkspaceInvitation['state']): 'neutral' | 'warning' | 'danger' | 'success' {
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
    onCommand({ type: 'revoke-invitation', workspaceId: invitation.workspaceId, invitationId: invitation.id });
  }

  return (
    <li className={styles.invitationRow}>
      <div className={styles.invitationMain}>
        <p className={styles.invitationEmail}>{invitation.recipientEmail}</p>
        <div className={styles.badgeRow}>
          <Badge tone="neutral"><BilingualText value={limitedRoleName[invitation.role]} /></Badge>
          <Badge tone={invitationTone(invitation.state)}><BilingualText value={invitationStateName[invitation.state]} /></Badge>
        </div>
        <dl className={styles.metaGrid}>
          <div>
            <dt><BilingualText value={copy.invitations.issuer} /></dt>
            <dd className={styles.longValue}>{issuer ?? invitation.issuerPrincipalId}</dd>
          </div>
          <div>
            <dt><BilingualText value={copy.invitations.expires} /></dt>
            <dd><time dateTime={invitation.expiresAt}>{formatDate(invitation.expiresAt)}</time></dd>
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
              <dt><BilingualText value={copy.common.email} /></dt>
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
  pending,
  outcome,
  loadingMore,
  onCommand,
  onLoadMore,
}: {
  workspaceId: string;
  invitations: Page<WorkspaceInvitation>;
  members: Page<WorkspaceMember> | null;
  canAdminister: boolean;
  disabled: boolean;
  busy: boolean;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  loadingMore: boolean;
  onCommand: (command: WorkspaceCommand) => void;
  onLoadMore: () => void;
}) {
  if (!canAdminister) return null;

  return (
    <section className={styles.section} aria-labelledby="invitations-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="invitations-heading" className={styles.sectionTitle}><BilingualText value={copy.invitations.title} /></h2>
          <p className={styles.sectionBody}><BilingualText value={copy.invitations.body} /></p>
          <p className={styles.sectionHint}><BilingualText value={countText(invitations.total, copy.invitations.countOne, copy.invitations.countMany)} /></p>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.noEmailNote}><BilingualText value={copy.invitations.noEmailNote} /></p>
        <p className={styles.fieldHint}><BilingualText value={copy.invitations.pendingNote} /></p>
        <InviteForm
          workspaceId={workspaceId}
          disabled={disabled}
          pending={pending}
          outcome={outcome}
          onCommand={onCommand}
        />
      </div>

      {invitations.items.length === 0 ? (
        <p className={styles.emptyNote}><BilingualText value={copy.invitations.empty} /></p>
      ) : (
        <ul className={styles.list}>
          {invitations.items.map(invitation => (
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
        <button type="button" className={styles.secondary} disabled={busy || loadingMore} onClick={onLoadMore}>
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.invitations.loadMore} />
        </button>
      )}
    </section>
  );
}

type MemberAction =
  | { kind: 'role'; role: LimitedRole }
  | { kind: 'state'; state: MemberState };

function HumanMemberCard({
  member,
  workspaceId,
  canAdminister,
  disabled,
  onCommand,
}: {
  member: WorkspaceMember;
  workspaceId: string;
  canAdminister: boolean;
  disabled: boolean;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const baseRole: LimitedRole = member.role === 'owner' ? 'member' : member.role;
  const [nextRole, setNextRole] = useState<LimitedRole>(baseRole);
  const [action, setAction] = useState<MemberAction | null>(null);
  const roleId = useId();
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const principalInactive = member.principalState !== 'active';

  function review(next: MemberAction, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setAction(next);
  }

  function cancel() {
    setAction(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  function commandFor(next: MemberAction): WorkspaceCommand {
    if (next.kind === 'role') {
      return {
        type: 'update-member',
        workspaceId,
        principalId: member.principalId,
        version: member.version,
        role: next.role,
      };
    }
    return {
      type: 'update-member',
      workspaceId,
      principalId: member.principalId,
      version: member.version,
      state: next.state,
    };
  }

  function confirmAction() {
    if (action === null) return;
    const command = commandFor(action);
    setAction(null);
    onCommand(command);
  }

  const actionTitle = action === null
    ? null
    : action.kind === 'role'
      ? copy.members.confirmRoleTitle
      : action.state === 'suspended'
        ? copy.members.confirmSuspendTitle
        : action.state === 'revoked'
          ? copy.members.confirmRemoveTitle
          : copy.members.confirmRestoreTitle;

  const actionConsequence = action === null
    ? null
    : action.kind === 'role'
      ? copy.members.roleConsequence
      : action.state === 'suspended'
        ? copy.members.suspendConsequence
        : action.state === 'revoked'
          ? copy.members.removeConsequence
          : copy.members.restoreConsequence;

  const controlsAvailable = canAdminister && !disabled && !principalInactive && member.state !== 'revoked' && member.role !== 'owner';

  return (
    <li className={styles.memberCard}>
      <div className={styles.memberHeader}>
        <h3 className={styles.memberName}>{member.name}</h3>
        <div className={styles.badgeRow}>
          <Badge tone="neutral"><BilingualText value={kindName.human} /></Badge>
          <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}><BilingualText value={roleName[member.role]} /></Badge>
          <Badge tone={stateTone(member.state)}><BilingualText value={stateName[member.state]} /></Badge>
          {member.principalState !== member.state && (
            <Badge tone={stateTone(member.principalState)}>
              {copy.members.principalState.es} / <span lang="en">{copy.members.principalState.en}: {stateName[member.principalState].es} / {stateName[member.principalState].en}</span>
            </Badge>
          )}
        </div>
      </div>
      <dl className={styles.metaGrid}>
        <div>
          <dt><BilingualText value={copy.common.role} /></dt>
          <dd><BilingualText value={roleName[member.role]} /></dd>
        </div>
        <div>
          <dt><BilingualText value={copy.members.membership} /></dt>
          <dd><BilingualText value={stateName[member.state]} /></dd>
        </div>
      </dl>

      {member.role === 'owner' && (
        <p className={styles.ownerNote}><BilingualText value={copy.members.ownerProtected} /></p>
      )}
      {member.role !== 'owner' && principalInactive && (
        <p className={styles.ownerNote}><BilingualText value={copy.members.principalInactive} /></p>
      )}
      {member.role !== 'owner' && member.state === 'revoked' && (
        <p className={styles.ownerNote}><BilingualText value={copy.members.revokedNote} /></p>
      )}
      {member.role !== 'owner' && member.state === 'suspended' && !principalInactive && (
        <p className={styles.ownerNote}><BilingualText value={copy.members.suspendedNote} /></p>
      )}

      {controlsAvailable && (
        <details className={styles.details}>
          <summary><BilingualText value={copy.members.manage} /></summary>
          <div className={styles.detailsBody}>
            {member.state === 'active' && (
              <>
                <div className={styles.field}>
                  <label htmlFor={roleId}><BilingualText value={copy.members.roleLabel} /></label>
                  <select
                    id={roleId}
                    value={nextRole}
                    disabled={disabled || action !== null}
                    onChange={event => setNextRole(event.currentTarget.value as LimitedRole)}
                  >
                    {limitedRoles.map(value => (
                      <option key={value} value={value}><BilingualOption value={limitedRoleName[value]} /></option>
                    ))}
                  </select>
                  <p className={styles.fieldHint}><BilingualText value={roleDescription[nextRole]} /></p>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={disabled || action !== null || nextRole === member.role}
                    onClick={event => review({ kind: 'role', role: nextRole }, event.currentTarget)}
                  >
                    <BilingualText value={copy.members.changeRole} />
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={disabled || action !== null}
                    onClick={event => review({ kind: 'state', state: 'suspended' }, event.currentTarget)}
                  >
                    <BilingualText value={copy.members.suspend} />
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={disabled || action !== null}
                    onClick={event => review({ kind: 'state', state: 'revoked' }, event.currentTarget)}
                  >
                    <BilingualText value={copy.members.remove} />
                  </button>
                </div>
              </>
            )}
            {member.state === 'suspended' && (
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={disabled || action !== null}
                  onClick={event => review({ kind: 'state', state: 'active' }, event.currentTarget)}
                >
                  <BilingualText value={copy.members.restore} />
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={disabled || action !== null}
                  onClick={event => review({ kind: 'state', state: 'revoked' }, event.currentTarget)}
                >
                  <BilingualText value={copy.members.remove} />
                </button>
              </div>
            )}
            {action !== null && actionTitle !== null && actionConsequence !== null && (
              <ConfirmBox
                title={actionTitle}
                consequence={actionConsequence}
                confirmLabel={action.kind === 'role'
                  ? copy.common.confirm
                  : action.state === 'revoked'
                    ? copy.members.remove
                    : copy.common.confirm}
                danger={action.kind === 'state' && action.state !== 'active'}
                disabled={disabled}
                onConfirm={confirmAction}
                onCancel={cancel}
              >
                <dl className={styles.metaGrid}>
                  <div>
                    <dt><BilingualText value={copy.common.name} /></dt>
                    <dd className={styles.longValue}>{member.name}</dd>
                  </div>
                  <div>
                    <dt><BilingualText value={copy.common.current} /></dt>
                    <dd><BilingualText value={action.kind === 'role' ? roleName[member.role] : stateName[member.state]} /></dd>
                  </div>
                  <div>
                    <dt><BilingualText value={copy.common.newValue} /></dt>
                    <dd><BilingualText value={action.kind === 'role' ? roleName[action.role] : stateName[action.state]} /></dd>
                  </div>
                </dl>
              </ConfirmBox>
            )}
          </div>
        </details>
      )}
    </li>
  );
}

function AgentMemberRow({
  member,
  members,
  canAdminister,
}: {
  member: WorkspaceMember;
  members: Page<WorkspaceMember> | null;
  canAdminister: boolean;
}) {
  const custodian = memberName(members, member.custodianPrincipalId);
  return (
    <li className={styles.memberCard}>
      <div className={styles.memberHeader}>
        <h3 className={styles.memberName}>{member.name}</h3>
        <div className={styles.badgeRow}>
          <Badge tone="brand"><BilingualText value={kindName.agent} /></Badge>
          <Badge tone="neutral"><BilingualText value={roleName[member.role]} /></Badge>
          <Badge tone={stateTone(member.state)}><BilingualText value={stateName[member.state]} /></Badge>
        </div>
      </div>
      <dl className={styles.metaGrid}>
        <div>
          <dt><BilingualText value={copy.common.role} /></dt>
          <dd><BilingualText value={roleName[member.role]} /></dd>
        </div>
        <div>
          <dt><BilingualText value={copy.members.custodian} /></dt>
          <dd className={styles.longValue}>{custodian ?? member.custodianPrincipalId ?? phrase(copy.members.custodianUnavailable)}</dd>
        </div>
      </dl>
      {member.principalState !== 'active' && (
        <p className={styles.ownerNote}>
          {copy.members.principalState.es} / <span lang="en">{copy.members.principalState.en}</span>: {stateName[member.principalState].es} / {stateName[member.principalState].en}
        </p>
      )}
      {canAdminister && <a className={styles.inlineLink} href="#agents"><BilingualText value={copy.members.manageInAgents} /></a>}
    </li>
  );
}

export function MembersSection({
  workspaceId,
  members,
  canAdminister,
  disabled,
  busy,
  loadingMore,
  onCommand,
  onLoadMore,
}: {
  workspaceId: string;
  members: Page<WorkspaceMember>;
  canAdminister: boolean;
  disabled: boolean;
  busy: boolean;
  loadingMore: boolean;
  onCommand: (command: WorkspaceCommand) => void;
  onLoadMore: () => void;
}) {
  return (
    <section className={styles.section} aria-labelledby="members-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="members-heading" className={styles.sectionTitle}><BilingualText value={copy.members.title} /></h2>
          <p className={styles.sectionBody}><BilingualText value={copy.members.body} /></p>
          <p className={styles.sectionHint}><BilingualText value={countText(members.total, copy.members.countOne, copy.members.countMany)} /></p>
        </div>
      </div>
      {members.items.length === 0 ? (
        <p className={styles.emptyNote}><BilingualText value={copy.members.empty} /></p>
      ) : (
        <ul className={styles.memberGrid}>
          {members.items.map(member => member.kind === 'human' ? (
            <HumanMemberCard
              key={`${member.principalId}:${member.version}:${member.state}:${member.role}`}
              member={member}
              workspaceId={workspaceId}
              canAdminister={canAdminister}
              disabled={disabled}
              onCommand={onCommand}
            />
          ) : (
            <AgentMemberRow
              key={member.principalId}
              member={member}
              members={members}
              canAdminister={canAdminister}
            />
          ))}
        </ul>
      )}
      {members.nextCursor !== null && (
        <button type="button" className={styles.secondary} disabled={busy || loadingMore} onClick={onLoadMore}>
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.members.loadMore} />
        </button>
      )}
    </section>
  );
}

type AgentAction =
  | { kind: 'state'; state: MemberState }
  | { kind: 'custodian'; custodianPrincipalId: string };

function AgentRegistrationForm({
  workspaceId,
  custodians,
  disabled,
  pending,
  outcome,
  onCommand,
}: {
  workspaceId: string;
  custodians: readonly WorkspaceMember[];
  disabled: boolean;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');
  const [custodian, setCustodian] = useState('');
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameId = useId();
  const roleId = useId();
  const custodianId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!submitted || pending !== null) return;
    if (outcome === 'success') {
      setName('');
      setCustodian('');
      setSubmitted(false);
    } else if (outcome !== null) {
      setSubmitted(false);
    }
  }, [outcome, pending, submitted]);

  useEffect(() => {
    if (custodian && !custodians.some(member => member.principalId === custodian)) setCustodian('');
  }, [custodian, custodians]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (!value || !custodian) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
    onCommand({
      type: 'register-agent',
      workspaceId,
      name: value,
      role,
      custodianPrincipalId: custodian,
    });
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.subheading}><BilingualText value={copy.agents.registerTitle} /></h3>
      <p className={styles.sectionBody}><BilingualText value={copy.agents.registerBody} /></p>
      {custodians.length === 0 ? (
        <p className={styles.ownerNote}><BilingualText value={copy.agents.noCustodians} /></p>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor={nameId}><BilingualText value={copy.agents.nameLabel} /></label>
              <input
                id={nameId}
                type="text"
                value={name}
                maxLength={200}
                autoComplete="off"
                required
                disabled={disabled}
                aria-invalid={error}
                aria-describedby={cx(hintId, error ? errorId : null)}
                onChange={event => {
                  setName(event.currentTarget.value);
                  if (error) setError(false);
                }}
              />
              <p id={hintId} className={styles.fieldHint}><BilingualText value={copy.agents.nameHint} /></p>
              {error && (
                <p id={errorId} className={styles.fieldError} role="alert">
                  <BilingualText value={name.trim() ? copy.agents.custodianRequired : copy.agents.nameRequired} />
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor={roleId}><BilingualText value={copy.agents.roleLabel} /></label>
              <select
                id={roleId}
                value={role}
                disabled={disabled}
                onChange={event => setRole(event.currentTarget.value as 'member' | 'viewer')}
              >
                <option value="member"><BilingualOption value={agentRoleName.member} /></option>
                <option value="viewer"><BilingualOption value={agentRoleName.viewer} /></option>
              </select>
              <p className={styles.fieldHint}><BilingualText value={copy.agents.roleHint} /></p>
            </div>
            <div className={styles.field}>
              <label htmlFor={custodianId}><BilingualText value={copy.agents.custodianLabel} /></label>
              <select
                id={custodianId}
                value={custodian}
                disabled={disabled}
                required
                onChange={event => {
                  setCustodian(event.currentTarget.value);
                  if (error) setError(false);
                }}
              >
                <option value=""><BilingualOption value={copy.agents.custodianPlaceholder} /></option>
                {custodians.map(member => (
                  <option key={member.principalId} value={member.principalId}>{member.name}</option>
                ))}
              </select>
              <p className={styles.fieldHint}><BilingualText value={copy.agents.custodianHint} /></p>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primary} disabled={disabled}>
              <BilingualText value={copy.agents.register} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AgentCard({
  member,
  workspaceId,
  members,
  custodians,
  canAdminister,
  disabled,
  onCommand,
}: {
  member: WorkspaceMember;
  workspaceId: string;
  members: Page<WorkspaceMember> | null;
  custodians: readonly WorkspaceMember[];
  canAdminister: boolean;
  disabled: boolean;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const custodian = memberName(members, member.custodianPrincipalId);
  const [action, setAction] = useState<AgentAction | null>(null);
  const [nextCustodian, setNextCustodian] = useState('');
  const custodianId = useId();
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const retired = member.principalState === 'revoked';
  const membershipActive = member.state === 'active';
  const controlsAvailable = canAdminister && !disabled && membershipActive && !retired;
  const otherCustodians = custodians.filter(memberOption => memberOption.principalId !== member.custodianPrincipalId);

  function review(next: AgentAction, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setAction(next);
  }

  function cancel() {
    setAction(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  function commandFor(next: AgentAction): WorkspaceCommand {
    if (next.kind === 'state') {
      return { type: 'manage-agent', workspaceId, principalId: member.principalId, version: member.version, state: next.state };
    }
    return {
      type: 'manage-agent',
      workspaceId,
      principalId: member.principalId,
      version: member.version,
      custodianPrincipalId: next.custodianPrincipalId,
    };
  }

  function confirmAction() {
    if (action === null) return;
    const command = commandFor(action);
    setAction(null);
    setNextCustodian('');
    onCommand(command);
  }

  const title = action === null
    ? null
    : action.kind === 'state'
      ? action.state === 'suspended'
        ? copy.agents.confirmSuspendTitle
        : action.state === 'revoked'
          ? copy.agents.confirmRetireTitle
          : copy.agents.confirmRestoreTitle
      : copy.agents.confirmCustodianTitle;

  const consequence = action === null
    ? null
    : action.kind === 'state'
      ? action.state === 'suspended'
        ? copy.agents.suspendConsequence
        : action.state === 'revoked'
          ? copy.agents.retireConsequence
          : copy.agents.restoreConsequence
      : copy.agents.custodianConsequence;

  return (
    <li className={styles.memberCard}>
      <div className={styles.memberHeader}>
        <h3 className={styles.memberName}>{member.name}</h3>
        <div className={styles.badgeRow}>
          <Badge tone="brand"><BilingualText value={kindName.agent} /></Badge>
          <Badge tone="neutral"><BilingualText value={roleName[member.role]} /></Badge>
          <Badge tone={stateTone(member.principalState)}><BilingualText value={stateName[member.principalState]} /></Badge>
        </div>
      </div>
      <dl className={styles.metaGrid}>
        <div>
          <dt><BilingualText value={copy.common.role} /></dt>
          <dd><BilingualText value={roleName[member.role]} /></dd>
        </div>
        <div>
          <dt><BilingualText value={copy.agents.currentCustodian} /></dt>
          <dd className={styles.longValue}>{custodian ?? member.custodianPrincipalId ?? phrase(copy.members.custodianUnavailable)}</dd>
        </div>
      </dl>

      {retired && <p className={styles.ownerNote}><BilingualText value={copy.agents.revokedNote} /></p>}
      {!retired && !membershipActive && (
        <p className={styles.ownerNote}><BilingualText value={copy.agents.membershipNotActive} /></p>
      )}

      {controlsAvailable && (
        <div className={styles.controlGroup}>
          <div className={styles.formActions}>
            {member.principalState === 'active' && (
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null}
                onClick={event => review({ kind: 'state', state: 'suspended' }, event.currentTarget)}
              >
                <BilingualText value={copy.agents.suspend} />
              </button>
            )}
            {member.principalState === 'suspended' && (
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null}
                onClick={event => review({ kind: 'state', state: 'active' }, event.currentTarget)}
              >
                <BilingualText value={copy.agents.restore} />
              </button>
            )}
            <button
              type="button"
              className={styles.dangerButton}
              disabled={disabled || action !== null}
              onClick={event => review({ kind: 'state', state: 'revoked' }, event.currentTarget)}
            >
              <BilingualText value={copy.agents.retire} />
            </button>
          </div>

          {otherCustodians.length > 0 ? (
            <div className={styles.field}>
              <label htmlFor={custodianId}><BilingualText value={copy.agents.newCustodian} /></label>
              <select
                id={custodianId}
                value={nextCustodian}
                disabled={disabled || action !== null}
                onChange={event => setNextCustodian(event.currentTarget.value)}
              >
                <option value=""><BilingualOption value={copy.agents.changeCustodian} /></option>
                {otherCustodians.map(memberOption => (
                  <option key={memberOption.principalId} value={memberOption.principalId}>{memberOption.name}</option>
                ))}
              </select>
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null || nextCustodian === ''}
                onClick={event => review({ kind: 'custodian', custodianPrincipalId: nextCustodian }, event.currentTarget)}
              >
                <BilingualText value={copy.common.reviewChange} />
              </button>
            </div>
          ) : (
            <p className={styles.fieldHint}><BilingualText value={copy.agents.noOtherCustodian} /></p>
          )}

          {action !== null && title !== null && consequence !== null && (
            <ConfirmBox
              title={title}
              consequence={consequence}
              confirmLabel={action.kind === 'state' && action.state === 'revoked' ? copy.agents.retire : copy.common.confirm}
              danger={action.kind === 'state' && action.state !== 'active'}
              disabled={disabled}
              onConfirm={confirmAction}
              onCancel={cancel}
            >
              <dl className={styles.metaGrid}>
                <div>
                  <dt><BilingualText value={copy.common.name} /></dt>
                  <dd className={styles.longValue}>{member.name}</dd>
                </div>
                {action.kind === 'state' ? (
                  <div>
                    <dt><BilingualText value={copy.common.newValue} /></dt>
                    <dd><BilingualText value={stateName[action.state]} /></dd>
                  </div>
                ) : (
                  <div>
                    <dt><BilingualText value={copy.agents.newCustodian} /></dt>
                    <dd className={styles.longValue}>
                      {memberName(members, action.custodianPrincipalId) ?? action.custodianPrincipalId}
                    </dd>
                  </div>
                )}
              </dl>
            </ConfirmBox>
          )}
        </div>
      )}
    </li>
  );
}

export function AgentsSection({
  workspaceId,
  members,
  custodians,
  canAdminister,
  disabled,
  busy,
  pending,
  outcome,
  loadingMore,
  onCommand,
  onLoadMore,
}: {
  workspaceId: string;
  members: Page<WorkspaceMember>;
  custodians: readonly WorkspaceMember[];
  canAdminister: boolean;
  disabled: boolean;
  busy: boolean;
  pending: CommandType | null;
  outcome: OutcomeKind | null;
  loadingMore: boolean;
  onCommand: (command: WorkspaceCommand) => void;
  onLoadMore: () => void;
}) {
  if (!canAdminister) return null;
  const agents = members.items.filter(member => member.kind === 'agent');

  return (
    <section className={styles.section} aria-labelledby="agents-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="agents-heading" className={styles.sectionTitle}><BilingualText value={copy.agents.title} /></h2>
          <p className={styles.sectionBody}><BilingualText value={copy.agents.body} /></p>
          <p className={styles.sectionHint}><BilingualText value={countText(agents.length, copy.agents.countOne, copy.agents.countMany)} /></p>
        </div>
      </div>

      <AgentRegistrationForm
        workspaceId={workspaceId}
        custodians={custodians}
        disabled={disabled || custodians.length === 0}
        pending={pending}
        outcome={outcome}
        onCommand={onCommand}
      />

      {members.nextCursor !== null && (
        <p className={styles.fieldHint}><BilingualText value={copy.agents.moreMembers} /></p>
      )}
      {agents.length === 0 ? (
        <p className={styles.emptyNote}><BilingualText value={copy.agents.empty} /></p>
      ) : (
        <ul className={styles.memberGrid}>
          {agents.map(member => (
            <AgentCard
              key={`${member.principalId}:${member.version}:${member.state}:${member.principalState}`}
              member={member}
              workspaceId={workspaceId}
              members={members}
              custodians={custodians}
              canAdminister={canAdminister}
              disabled={disabled}
              onCommand={onCommand}
            />
          ))}
        </ul>
      )}
      {members.nextCursor !== null && (
        <button type="button" className={styles.secondary} disabled={busy || loadingMore} onClick={onLoadMore}>
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.agents.loadMore} />
        </button>
      )}
    </section>
  );
}

export { InvitationLinkPanel };
