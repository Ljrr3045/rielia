'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { MemberState, Page, WorkspaceCommand, WorkspaceMember } from '@rielia/contracts';
import { agentRoleName, copy, countText, kindName, roleName, stateName } from './strings';
import {
  Badge,
  BilingualText,
  ConfirmBox,
  cx,
  stateTone,
  memberName,
  BilingualOption,
} from './workspace-ui';
import styles from './workspace.module.css';
type AgentAction =
  { kind: 'state'; state: MemberState } | { kind: 'custodian'; custodianPrincipalId: string };

function AgentRegistrationForm({
  workspaceId,
  custodians,
  disabled,
  draft,
  onStage,
  onCommand,
}: {
  workspaceId: string;
  custodians: readonly WorkspaceMember[];
  disabled: boolean;
  draft: WorkspaceCommand | null;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');
  const [custodian, setCustodian] = useState('');
  const [error, setError] = useState(false);
  const nameId = useId();
  const roleId = useId();
  const custodianId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (draft?.type === 'register-agent' && draft.workspaceId === workspaceId) {
      setName(draft.name);
      setRole(draft.role);
      setCustodian(draft.custodianPrincipalId);
      setError(false);
    } else if (draft === null) {
      setName('');
      setRole('member');
      setCustodian('');
      setError(false);
    }
  }, [draft, workspaceId]);

  function change(next: { name: string; role: 'member' | 'viewer'; custodian: string }) {
    setName(next.name);
    setRole(next.role);
    setCustodian(next.custodian);
    if (error) setError(false);
    onStage({
      type: 'register-agent',
      workspaceId,
      name: next.name,
      role: next.role,
      custodianPrincipalId: next.custodian,
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (!value || !custodian) {
      setError(true);
      return;
    }
    setError(false);
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
      <h3 className={styles.subheading}>
        <BilingualText value={copy.agents.registerTitle} />
      </h3>
      <p className={styles.sectionBody}>
        <BilingualText value={copy.agents.registerBody} />
      </p>
      {custodians.length === 0 ? (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.agents.noCustodians} />
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor={nameId}>
                <BilingualText value={copy.agents.nameLabel} />
              </label>
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
                onChange={(event) => change({ name: event.currentTarget.value, role, custodian })}
              />
              <p id={hintId} className={styles.fieldHint}>
                <BilingualText value={copy.agents.nameHint} />
              </p>
              {error && (
                <p id={errorId} className={styles.fieldError} role="alert">
                  <BilingualText
                    value={name.trim() ? copy.agents.custodianRequired : copy.agents.nameRequired}
                  />
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor={roleId}>
                <BilingualText value={copy.agents.roleLabel} />
              </label>
              <select
                id={roleId}
                value={role}
                disabled={disabled}
                onChange={(event) =>
                  change({
                    name,
                    role: event.currentTarget.value as 'member' | 'viewer',
                    custodian,
                  })
                }
              >
                <option value="member">
                  <BilingualOption value={agentRoleName.member} />
                </option>
                <option value="viewer">
                  <BilingualOption value={agentRoleName.viewer} />
                </option>
              </select>
              <p className={styles.fieldHint}>
                <BilingualText value={copy.agents.roleHint} />
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor={custodianId}>
                <BilingualText value={copy.agents.custodianLabel} />
              </label>
              <select
                id={custodianId}
                value={custodian}
                disabled={disabled}
                required
                onChange={(event) => change({ name, role, custodian: event.currentTarget.value })}
              >
                <option value="">
                  <BilingualOption value={copy.agents.custodianPlaceholder} />
                </option>
                {custodians.map((member) => (
                  <option key={member.principalId} value={member.principalId}>
                    {member.name}
                  </option>
                ))}
              </select>
              <p className={styles.fieldHint}>
                <BilingualText value={copy.agents.custodianHint} />
              </p>
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
  draft,
  onStage,
  onCommand,
}: {
  member: WorkspaceMember;
  workspaceId: string;
  members: Page<WorkspaceMember> | null;
  custodians: readonly WorkspaceMember[];
  canAdminister: boolean;
  disabled: boolean;
  draft: WorkspaceCommand | null;
  onStage: (command: WorkspaceCommand) => void;
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
  const otherCustodians = custodians.filter(
    (memberOption) => memberOption.principalId !== member.custodianPrincipalId,
  );

  useEffect(() => {
    if (
      draft?.type === 'manage-agent' &&
      draft.workspaceId === workspaceId &&
      draft.principalId === member.principalId &&
      draft.custodianPrincipalId !== undefined
    ) {
      setNextCustodian(draft.custodianPrincipalId);
    } else if (draft === null) {
      setNextCustodian('');
    }
  }, [draft, member.principalId, workspaceId]);

  function changeCustodian(custodianPrincipalId: string) {
    setNextCustodian(custodianPrincipalId);
    onStage({
      type: 'manage-agent',
      workspaceId,
      principalId: member.principalId,
      version: member.version,
      custodianPrincipalId,
    });
  }

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
      return {
        type: 'manage-agent',
        workspaceId,
        principalId: member.principalId,
        version: member.version,
        state: next.state,
      };
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

  const title =
    action === null
      ? null
      : action.kind === 'state'
        ? action.state === 'suspended'
          ? copy.agents.confirmSuspendTitle
          : action.state === 'revoked'
            ? copy.agents.confirmRetireTitle
            : copy.agents.confirmRestoreTitle
        : copy.agents.confirmCustodianTitle;

  const consequence =
    action === null
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
          <Badge tone="brand">
            <BilingualText value={kindName.agent} />
          </Badge>
          <Badge tone="neutral">
            <BilingualText value={roleName[member.role]} />
          </Badge>
          <Badge tone={stateTone(member.principalState)}>
            <BilingualText value={stateName[member.principalState]} />
          </Badge>
          {member.state !== member.principalState && (
            <Badge tone={stateTone(member.state)}>
              <BilingualText value={copy.members.membership} />
              {': '}
              <BilingualText value={stateName[member.state]} />
            </Badge>
          )}
        </div>
      </div>
      <p className={styles.memberMeta}>
        <BilingualText value={copy.agents.currentCustodian} />
        {': '}
        <span className={styles.longValue}>
          {custodian ?? member.custodianPrincipalId ?? (
            <BilingualText value={copy.members.custodianUnavailable} />
          )}
        </span>
      </p>

      {retired && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.agents.revokedNote} />
        </p>
      )}
      {!retired && !membershipActive && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.agents.membershipNotActive} />
        </p>
      )}

      {controlsAvailable && (
        <div className={styles.controlGroup}>
          <div className={styles.formActions}>
            {member.principalState === 'active' && (
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null}
                onClick={(event) =>
                  review({ kind: 'state', state: 'suspended' }, event.currentTarget)
                }
              >
                <BilingualText value={copy.agents.suspend} />
              </button>
            )}
            {member.principalState === 'suspended' && (
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null}
                onClick={(event) => review({ kind: 'state', state: 'active' }, event.currentTarget)}
              >
                <BilingualText value={copy.agents.restore} />
              </button>
            )}
            <button
              type="button"
              className={styles.dangerButton}
              disabled={disabled || action !== null}
              onClick={(event) => review({ kind: 'state', state: 'revoked' }, event.currentTarget)}
            >
              <BilingualText value={copy.agents.retire} />
            </button>
          </div>

          {otherCustodians.length > 0 ? (
            <div className={styles.field}>
              <label htmlFor={custodianId}>
                <BilingualText value={copy.agents.newCustodian} />
              </label>
              <select
                id={custodianId}
                value={nextCustodian}
                disabled={disabled || action !== null}
                onChange={(event) => changeCustodian(event.currentTarget.value)}
              >
                <option value="">
                  <BilingualOption value={copy.agents.changeCustodian} />
                </option>
                {otherCustodians.map((memberOption) => (
                  <option key={memberOption.principalId} value={memberOption.principalId}>
                    {memberOption.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.secondary}
                disabled={disabled || action !== null || nextCustodian === ''}
                onClick={(event) =>
                  review(
                    { kind: 'custodian', custodianPrincipalId: nextCustodian },
                    event.currentTarget,
                  )
                }
              >
                <BilingualText value={copy.common.reviewChange} />
              </button>
            </div>
          ) : (
            <p className={styles.fieldHint}>
              <BilingualText value={copy.agents.noOtherCustodian} />
            </p>
          )}

          {action !== null && title !== null && consequence !== null && (
            <ConfirmBox
              title={title}
              consequence={consequence}
              confirmLabel={
                action.kind === 'state' && action.state === 'revoked'
                  ? copy.agents.retire
                  : copy.common.confirm
              }
              danger={action.kind === 'state' && action.state !== 'active'}
              disabled={disabled}
              onConfirm={confirmAction}
              onCancel={cancel}
            >
              <dl className={styles.metaGrid}>
                <div>
                  <dt>
                    <BilingualText value={copy.common.name} />
                  </dt>
                  <dd className={styles.longValue}>{member.name}</dd>
                </div>
                {action.kind === 'state' ? (
                  <div>
                    <dt>
                      <BilingualText value={copy.common.newValue} />
                    </dt>
                    <dd>
                      <BilingualText value={stateName[action.state]} />
                    </dd>
                  </div>
                ) : (
                  <div>
                    <dt>
                      <BilingualText value={copy.agents.newCustodian} />
                    </dt>
                    <dd className={styles.longValue}>
                      {memberName(members, action.custodianPrincipalId) ??
                        action.custodianPrincipalId}
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
  draft,
  loadingMore,
  onStage,
  onCommand,
  onLoadMore,
}: {
  workspaceId: string;
  members: Page<WorkspaceMember>;
  custodians: readonly WorkspaceMember[];
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
  const agents = members.items.filter((member) => member.kind === 'agent');

  return (
    <section className={styles.section} aria-labelledby="agents-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="agents-heading" className={styles.sectionTitle}>
            <BilingualText value={copy.agents.title} />
          </h2>
          <p className={styles.sectionBody}>
            <BilingualText value={copy.agents.body} />
          </p>
          <p className={styles.sectionHint}>
            <BilingualText
              value={countText(agents.length, copy.agents.countOne, copy.agents.countMany)}
            />
          </p>
        </div>
      </div>

      <AgentRegistrationForm
        workspaceId={workspaceId}
        custodians={custodians}
        disabled={disabled || custodians.length === 0}
        draft={draft}
        onStage={onStage}
        onCommand={onCommand}
      />

      {members.nextCursor !== null && (
        <p className={styles.fieldHint}>
          <BilingualText value={copy.agents.moreMembers} />
        </p>
      )}
      {agents.length === 0 ? (
        <p className={styles.emptyNote}>
          <BilingualText value={copy.agents.empty} />
        </p>
      ) : (
        <ul className={styles.memberGrid}>
          {agents.map((member) => (
            <AgentCard
              key={`${member.principalId}:${member.version}:${member.state}:${member.principalState}`}
              member={member}
              workspaceId={workspaceId}
              members={members}
              custodians={custodians}
              canAdminister={canAdminister}
              disabled={disabled}
              draft={draft}
              onStage={onStage}
              onCommand={onCommand}
            />
          ))}
        </ul>
      )}
      {members.nextCursor !== null && (
        <button
          type="button"
          className={styles.secondary}
          disabled={busy || loadingMore}
          onClick={onLoadMore}
        >
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.agents.loadMore} />
        </button>
      )}
    </section>
  );
}
