'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type {
  LimitedRole,
  MemberState,
  Page,
  WorkspaceCommand,
  WorkspaceMember,
} from '@rielia/contracts';
import {
  copy,
  countText,
  kindName,
  limitedRoleName,
  roleDescription,
  roleName,
  stateName,
} from './strings';
import {
  Badge,
  BilingualText,
  ConfirmBox,
  limitedRoles,
  stateTone,
  memberName,
  BilingualOption,
} from './workspace-ui';
import styles from './workspace.module.css';
type MemberAction = { kind: 'role'; role: LimitedRole } | { kind: 'state'; state: MemberState };

function HumanMemberCard({
  member,
  workspaceId,
  canAdminister,
  disabled,
  draft,
  onStage,
  onCommand,
}: {
  member: WorkspaceMember;
  workspaceId: string;
  canAdminister: boolean;
  disabled: boolean;
  draft: WorkspaceCommand | null;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const baseRole: LimitedRole = member.role === 'owner' ? 'member' : member.role;
  const [nextRole, setNextRole] = useState<LimitedRole>(baseRole);
  const [action, setAction] = useState<MemberAction | null>(null);
  const roleId = useId();
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const principalInactive = member.principalState !== 'active';

  useEffect(() => {
    if (
      draft?.type === 'update-member' &&
      draft.workspaceId === workspaceId &&
      draft.principalId === member.principalId &&
      draft.role !== undefined
    ) {
      setNextRole(draft.role);
    } else if (draft === null) {
      setNextRole(baseRole);
    }
  }, [baseRole, draft, member.principalId, workspaceId]);

  function changeRole(role: LimitedRole) {
    setNextRole(role);
    onStage({
      type: 'update-member',
      workspaceId,
      principalId: member.principalId,
      version: member.version,
      role,
    });
  }

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

  const actionTitle =
    action === null
      ? null
      : action.kind === 'role'
        ? copy.members.confirmRoleTitle
        : action.state === 'suspended'
          ? copy.members.confirmSuspendTitle
          : action.state === 'revoked'
            ? copy.members.confirmRemoveTitle
            : copy.members.confirmRestoreTitle;

  const actionConsequence =
    action === null
      ? null
      : action.kind === 'role'
        ? copy.members.roleConsequence
        : action.state === 'suspended'
          ? copy.members.suspendConsequence
          : action.state === 'revoked'
            ? copy.members.removeConsequence
            : copy.members.restoreConsequence;

  const controlsAvailable =
    canAdminister &&
    !disabled &&
    !principalInactive &&
    member.state !== 'revoked' &&
    member.role !== 'owner';

  return (
    <li className={styles.memberCard}>
      <div className={styles.memberHeader}>
        <h3 className={styles.memberName}>{member.name}</h3>
        <div className={styles.badgeRow}>
          <Badge tone="neutral">
            <BilingualText value={kindName.human} />
          </Badge>
          <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}>
            <BilingualText value={roleName[member.role]} />
          </Badge>
          <Badge tone={stateTone(member.state)}>
            <BilingualText value={stateName[member.state]} />
          </Badge>
          {member.principalState !== member.state && (
            <Badge tone={stateTone(member.principalState)}>
              <BilingualText value={copy.members.principalState} />
              {': '}
              <BilingualText value={stateName[member.principalState]} />
            </Badge>
          )}
        </div>
      </div>
      {member.role === 'owner' && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.members.ownerProtected} />
        </p>
      )}
      {member.role !== 'owner' && principalInactive && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.members.principalInactive} />
        </p>
      )}
      {member.role !== 'owner' && member.state === 'revoked' && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.members.revokedNote} />
        </p>
      )}
      {member.role !== 'owner' && member.state === 'suspended' && !principalInactive && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.members.suspendedNote} />
        </p>
      )}

      {controlsAvailable && (
        <details className={styles.details}>
          <summary>
            <BilingualText value={copy.members.manage} />
          </summary>
          <div className={styles.detailsBody}>
            {member.state === 'active' && (
              <>
                <div className={styles.field}>
                  <label htmlFor={roleId}>
                    <BilingualText value={copy.members.roleLabel} />
                  </label>
                  <select
                    id={roleId}
                    value={nextRole}
                    disabled={disabled || action !== null}
                    onChange={(event) => changeRole(event.currentTarget.value as LimitedRole)}
                  >
                    {limitedRoles.map((value) => (
                      <option key={value} value={value}>
                        <BilingualOption value={limitedRoleName[value]} />
                      </option>
                    ))}
                  </select>
                  <p className={styles.fieldHint}>
                    <BilingualText value={roleDescription[nextRole]} />
                  </p>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={disabled || action !== null || nextRole === member.role}
                    onClick={(event) =>
                      review({ kind: 'role', role: nextRole }, event.currentTarget)
                    }
                  >
                    <BilingualText value={copy.members.changeRole} />
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={disabled || action !== null}
                    onClick={(event) =>
                      review({ kind: 'state', state: 'suspended' }, event.currentTarget)
                    }
                  >
                    <BilingualText value={copy.members.suspend} />
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={disabled || action !== null}
                    onClick={(event) =>
                      review({ kind: 'state', state: 'revoked' }, event.currentTarget)
                    }
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
                  onClick={(event) =>
                    review({ kind: 'state', state: 'active' }, event.currentTarget)
                  }
                >
                  <BilingualText value={copy.members.restore} />
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={disabled || action !== null}
                  onClick={(event) =>
                    review({ kind: 'state', state: 'revoked' }, event.currentTarget)
                  }
                >
                  <BilingualText value={copy.members.remove} />
                </button>
              </div>
            )}
            {action !== null && actionTitle !== null && actionConsequence !== null && (
              <ConfirmBox
                title={actionTitle}
                consequence={actionConsequence}
                confirmLabel={
                  action.kind === 'role'
                    ? copy.common.confirm
                    : action.state === 'revoked'
                      ? copy.members.remove
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
                  <div>
                    <dt>
                      <BilingualText value={copy.common.current} />
                    </dt>
                    <dd>
                      <BilingualText
                        value={
                          action.kind === 'role' ? roleName[member.role] : stateName[member.state]
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <BilingualText value={copy.common.newValue} />
                    </dt>
                    <dd>
                      <BilingualText
                        value={
                          action.kind === 'role' ? roleName[action.role] : stateName[action.state]
                        }
                      />
                    </dd>
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
        <BilingualText value={copy.members.custodian} />
        {': '}
        <span className={styles.longValue}>
          {custodian ?? member.custodianPrincipalId ?? (
            <BilingualText value={copy.members.custodianUnavailable} />
          )}
        </span>
      </p>
      {member.principalState !== 'active' && (
        <p className={styles.ownerNote}>
          <BilingualText value={copy.members.principalState} />
          {': '}
          <BilingualText value={stateName[member.principalState]} />
        </p>
      )}
      {canAdminister && (
        <a className={styles.inlineLink} href="#agents">
          <BilingualText value={copy.members.manageInAgents} />
        </a>
      )}
    </li>
  );
}

export function MembersSection({
  workspaceId,
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
  members: Page<WorkspaceMember>;
  canAdminister: boolean;
  disabled: boolean;
  busy: boolean;
  draft: WorkspaceCommand | null;
  loadingMore: boolean;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
  onLoadMore: () => void;
}) {
  return (
    <section className={styles.section} aria-labelledby="members-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="members-heading" className={styles.sectionTitle}>
            <BilingualText value={copy.members.title} />
          </h2>
          <p className={styles.sectionBody}>
            <BilingualText value={copy.members.body} />
          </p>
          <p className={styles.sectionHint}>
            <BilingualText
              value={countText(members.total, copy.members.countOne, copy.members.countMany)}
            />
          </p>
        </div>
      </div>
      {members.items.length === 0 ? (
        <p className={styles.emptyNote}>
          <BilingualText value={copy.members.empty} />
        </p>
      ) : (
        <ul className={styles.memberGrid}>
          {members.items.map((member) =>
            member.kind === 'human' ? (
              <HumanMemberCard
                key={`${member.principalId}:${member.version}:${member.state}:${member.role}`}
                member={member}
                workspaceId={workspaceId}
                canAdminister={canAdminister}
                disabled={disabled}
                draft={draft}
                onStage={onStage}
                onCommand={onCommand}
              />
            ) : (
              <AgentMemberRow
                key={member.principalId}
                member={member}
                members={members}
                canAdminister={canAdminister}
              />
            ),
          )}
        </ul>
      )}
      {members.nextCursor !== null && (
        <button
          type="button"
          className={styles.secondary}
          disabled={busy || loadingMore}
          onClick={onLoadMore}
        >
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.members.loadMore} />
        </button>
      )}
    </section>
  );
}
