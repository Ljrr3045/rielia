'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type {
  Project,
  ProjectAccessMember,
  ProjectAccessPage,
  ProjectPolicyCommand,
  ProjectVisibility,
} from '@rielia/contracts';
import { Badge, ConfirmBox, useLocale } from './project-ui';
import { FeedbackPanel } from './feedback';
import type { ConflictFieldView } from './feedback';
import { copy, roleName, visibilityName } from './strings';
import type { Bilingual } from './strings';
import styles from './projects.module.css';

export interface PolicyPageFailure {
  requestId: string | null;
  reason?: 'changed';
}

function accessExplanation(member: ProjectAccessMember, visibility: ProjectVisibility): Bilingual {
  if (!member.active) return copy.access.inactiveMember;
  if (member.implicitAccess) return copy.access.adminAutomatic;
  if (visibility === 'workspace') return copy.access.workspaceAccess;
  if (member.effectiveAccess) return copy.access.grantedAccess;
  return copy.access.noAccess;
}

function requestedExplanation(member: ProjectAccessMember, visibility: ProjectVisibility, state: 'active' | 'revoked'): Bilingual {
  if (!member.active) return copy.access.inactiveMember;
  if (member.implicitAccess) return copy.access.adminAutomatic;
  if (visibility === 'workspace') return copy.access.workspaceAccess;
  if (state === 'active') return copy.access.grantedAccess;
  return copy.access.noAccess;
}

function explicitText(value: 'active' | 'revoked' | null): Bilingual {
  if (value === 'active') return copy.access.explicitActive;
  if (value === 'revoked') return copy.access.explicitRevoked;
  return copy.access.explicitNone;
}

function retainedLabel(member: ProjectAccessMember, visibility: ProjectVisibility): Bilingual | null {
  if (member.explicitAccess === 'revoked') return copy.access.retainedRevoked;
  if (member.explicitAccess === 'active' && (visibility === 'workspace' || member.implicitAccess)) return copy.access.retainedActive;
  return null;
}

function join(parts: string[]): string {
  return parts.filter(part => part.length > 0).join(' ');
}

export function ProjectAccessPanel({
  project,
  access,
  accessError,
  feedback,
  policyDraft,
  policyPending,
  policyRetryTarget,
  policyMember,
  onStageVisibility,
  onSubmitVisibility,
  onReviewAccess,
  onDiscard,
  onSubmit,
  onLoadMore,
  onRefresh,
}: {
  project: Project;
  access: ProjectAccessPage | null;
  accessError: PolicyPageFailure | null;
  feedback: React.ReactNode;
  policyDraft: ProjectPolicyCommand | null;
  policyPending: 'change-access' | 'change-visibility' | null;
  policyRetryTarget: ProjectPolicyCommand | null;
  policyMember: ProjectAccessMember | null;
  onStageVisibility: (visibility: ProjectVisibility) => void;
  onSubmitVisibility: () => void;
  onReviewAccess: (member: ProjectAccessMember, state: 'active' | 'revoked') => void;
  onDiscard: () => void;
  onSubmit: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
}) {
  const lang = useLocale();
  const accessHeadingId = useId();
  const visibilityHeadingId = useId();
  const peopleHeadingId = useId();
  const visibilityGroupId = useId();
  const visibilityHeadingRef = useRef<HTMLHeadingElement>(null);
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());
  const [visibilityChoice, setVisibilityChoice] = useState<ProjectVisibility>(project.visibility);

  const archived = project.archivedAt !== null;
  const pending = policyPending !== null;
  const unknown = policyRetryTarget !== null && !pending;
  const controlsDisabled = pending || unknown;
  const draftVisibility = policyDraft?.type === 'change-visibility' ? policyDraft : null;
  const draftAccess = policyDraft?.type === 'change-access' ? policyDraft : null;
  const reachedConfirm = policyDraft !== null;

  useEffect(() => {
    if (draftVisibility === null) setVisibilityChoice(project.visibility);
  }, [draftVisibility, project.visibility, project.id]);

  function focusRow(principalId: string) {
    requestAnimationFrame(() => {
      const button = rowButtons.current.get(principalId);
      if (button !== undefined && button.isConnected) button.focus();
      else visibilityHeadingRef.current?.focus();
    });
  }

  function cancelAccess(principalId: string) {
    onDiscard();
    focusRow(principalId);
  }

  function cancelVisibility() {
    onDiscard();
    requestAnimationFrame(() => visibilityHeadingRef.current?.focus());
  }

  function confirmTarget(): { member: ProjectAccessMember | null; state: 'active' | 'revoked'; name: string } | null {
    if (draftAccess === null) return null;
    return { member: policyMember, state: draftAccess.state, name: policyMember?.name ?? copy.access.selectedMember[lang] };
  }

  function grantConsequence(member: ProjectAccessMember | null): Bilingual {
    if (project.visibility === 'workspace') return copy.access.grantWorkspace;
    if (member === null) return copy.access.grantPrivate;
    const parts: string[] = [copy.access.grantPrivate[lang]];
    if (member.implicitAccess) parts.push(copy.access.grantAdmin[lang]);
    if (member.kind === 'agent') parts.push(copy.access.grantAgent[lang]);
    if (member.role === 'viewer') parts.push(copy.access.grantViewer[lang]);
    return { es: join(parts), en: join(parts) } as Bilingual;
  }

  function revokeConsequence(member: ProjectAccessMember | null): Bilingual {
    if (member === null) return copy.access.revokePrivate;
    if (member.implicitAccess) return copy.access.revokeAdmin;
    if (!member.active) return copy.access.revokeInactive;
    if (project.visibility === 'workspace') return copy.access.revokeWorkspace;
    return copy.access.revokePrivate;
  }

  const target = confirmTarget();
  const targetGrantConsequence = grantConsequence(target?.member ?? null);
  const targetRevokeConsequence = revokeConsequence(target?.member ?? null);
  const targetTitle: Bilingual = (() => {
    if (target === null) return copy.access.targetMember;
    const name = target.name;
    const member = target.member;
    if (target.state === 'active') {
      return member?.explicitAccess === 'revoked'
        ? { es: copy.access.regrantTitle.es(name), en: copy.access.regrantTitle.en(name) }
        : { es: copy.access.grantTitle.es(name), en: copy.access.grantTitle.en(name) };
    }
    return { es: copy.access.revokeTitle.es(name), en: copy.access.revokeTitle.en(name) };
  })();
  const targetConfirmLabel: Bilingual = target?.state === 'active'
    ? (target.member?.explicitAccess === 'revoked' ? copy.access.regrant : copy.access.grant)
    : copy.access.revoke;
  const targetPendingLabel = copy.access.changingAccess;

  const visibilityConfirm = draftVisibility !== null;

  return (
    <div className={styles.accessPanel}>
      <section aria-labelledby={accessHeadingId} className={styles.accessIntro}>
        <h3 className={styles.accessSectionTitle} id={accessHeadingId}>{copy.access.introTitle[lang]}</h3>
        <p className={styles.accessBody}>{project.visibility === 'workspace' ? copy.access.workspaceNote[lang] : copy.access.introBody[lang]}</p>
      </section>

      {feedback}

      <section aria-labelledby={visibilityHeadingId} className={styles.accessSection}>
        <div className={styles.accessSectionHeader}>
          <h3 className={styles.accessSectionTitle} id={visibilityHeadingId} ref={visibilityHeadingRef} tabIndex={-1}>
            {copy.access.visibilitySection[lang]}
          </h3>
          <Badge tone={project.visibility === 'private' ? 'warning' : 'neutral'}>
            {visibilityName(project.visibility)[lang]}
          </Badge>
        </div>
        {archived ? (
          <>
            <p className={styles.accessBody}>{copy.access.visibilityFrozen[lang]}</p>
            {draftVisibility !== null && (
              <div className={styles.formActions}>
                <button className={styles.secondary} onClick={cancelVisibility} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              </div>
            )}
          </>
        ) : !project.capabilities.canChangeVisibility ? (
          <p className={styles.accessBody}>{copy.project.visibilityReadOnlyHint[lang]}</p>
        ) : visibilityConfirm ? (
          <div data-access-confirm>
            <ConfirmBox
              busy={pending}
              disabled={unknown}
              consequence={draftVisibility.visibility === 'private' ? copy.access.toPrivateConsequence : copy.access.toWorkspaceConsequence}
              confirmLabel={copy.access.visibilityChange}
              danger={draftVisibility.visibility === 'private'}
              onCancel={cancelVisibility}
              onConfirm={onSubmitVisibility}
              pendingLabel={copy.access.changingVisibility}
              title={draftVisibility.visibility === 'private' ? copy.access.toPrivateTitle : copy.access.toWorkspaceTitle}
            />
          </div>
        ) : (
          <div className={styles.visibilityEditor}>
            {draftAccess !== null && <p className={styles.fieldHint}>{copy.access.finishAccessDraft[lang]}</p>}
            <p className={styles.fieldLabel} id={visibilityGroupId}>{copy.access.visibilityCurrent[lang]}</p>
            <div aria-labelledby={visibilityGroupId} className={styles.choiceGroup} role="radiogroup">
              <label className={styles.choice} htmlFor={visibilityGroupId + '-workspace'}>
                <input
                  checked={visibilityChoice === 'workspace'}
                  disabled={controlsDisabled || draftAccess !== null}
                  id={visibilityGroupId + '-workspace'}
                  name="project-visibility-change"
                  onChange={() => setVisibilityChoice('workspace')}
                  type="radio"
                  value="workspace"
                />
                <span>
                  <span className={styles.choiceTitle}>{copy.project.visibilityWorkspace[lang]}</span>
                  <span className={styles.fieldHint}>{copy.project.visibilityWorkspaceHint[lang]}</span>
                </span>
              </label>
              <label className={styles.choice} htmlFor={visibilityGroupId + '-private'}>
                <input
                  checked={visibilityChoice === 'private'}
                  disabled={controlsDisabled || draftAccess !== null}
                  id={visibilityGroupId + '-private'}
                  name="project-visibility-change"
                  onChange={() => setVisibilityChoice('private')}
                  type="radio"
                  value="private"
                />
                <span>
                  <span className={styles.choiceTitle}>{copy.project.visibilityPrivate[lang]}</span>
                  <span className={styles.fieldHint}>{copy.project.visibilityPrivateHint[lang]}</span>
                </span>
              </label>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.secondary}
                disabled={controlsDisabled || draftAccess !== null || visibilityChoice === project.visibility}
                onClick={() => onStageVisibility(visibilityChoice)}
                type="button"
              >
                {copy.access.visibilityReview[lang]}
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby={peopleHeadingId} className={styles.accessSection}>
        <div className={styles.accessSectionHeader}>
          <h3 className={styles.accessSectionTitle} id={peopleHeadingId}>{copy.access.peopleSection[lang]}</h3>
          {access !== null && <span className={styles.accessCount}>{copy.access.peopleCount[lang](access.total)}</span>}
        </div>
        {access === null && accessError === null && (
          <p className={styles.accessLoading} role="status">{copy.access.loadingPeople[lang]}</p>
        )}
        {access === null && accessError !== null && (
          <FeedbackPanel
            actions={accessError.reason === 'changed'
              ? (
                <button className={styles.secondary} disabled={controlsDisabled} onClick={onRefresh} type="button">
                  {copy.access.refreshPeople[lang]}
                </button>
              )
              : (
                <button className={styles.secondary} disabled={controlsDisabled} onClick={onLoadMore} type="button">
                  {copy.access.retryPeople[lang]}
                </button>
              )}
            body={accessError.reason === 'changed' ? copy.access.changedBody : copy.access.pageErrorBody}
            title={accessError.reason === 'changed' ? copy.access.changedTitle : copy.feedback.pageErrorTitle}
            tone="warning"
          />
        )}
        {access !== null && access.items.length === 0 && (
          <p className={styles.accessEmpty}>{copy.access.emptyPeople[lang]}</p>
        )}
        {access !== null && access.items.length > 0 && (
          <ul className={styles.accessList}>
            {access.items.map(member => {
              const explanation = accessExplanation(member, project.visibility);
              const retained = retainedLabel(member, project.visibility);
              const showGrant = member.capabilities.canGrant;
              const showRevoke = member.capabilities.canRevoke;
              const rowConfirmState: 'active' | 'revoked' | null = draftAccess?.principalId === member.principalId
                ? draftAccess.state
                : null;
              return (
                <li className={styles.accessRow} key={member.principalId}>
                  <div className={styles.accessRowMain}>
                    <div className={styles.accessNameLine}>
                      <span className={styles.accessName}>{member.name}</span>
                      {member.kind === 'agent' && <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>}
                      <Badge tone="neutral">{roleName(member.role)[lang]}</Badge>
                      {!member.active && <Badge tone="archived">{copy.access.inactiveMember[lang]}</Badge>}
                    </div>
                    <p className={styles.accessRights}>{explanation[lang]}</p>
                    {retained !== null && <p className={styles.accessRetained}>{retained[lang]}</p>}
                    {!member.active && <p className={styles.fieldHint}>{copy.access.inactiveHint[lang]}</p>}
                  </div>
                  {(showGrant || showRevoke) && (
                    <div className={styles.accessActions}>
                      {showGrant && (
                        <button
                          aria-label={member.explicitAccess === 'revoked'
                            ? copy.access.regrantActionLabel[lang](member.name)
                            : copy.access.grantActionLabel[lang](member.name)}
                          className={styles.secondary}
                          data-access-action={member.principalId}
                          disabled={controlsDisabled || reachedConfirm}
                          onClick={() => onReviewAccess(member, 'active')}
                          ref={button => {
                            if (button === null) rowButtons.current.delete(member.principalId);
                            else rowButtons.current.set(member.principalId, button);
                          }}
                          type="button"
                        >
                          {member.explicitAccess === 'revoked' ? copy.access.regrant[lang] : copy.access.grant[lang]}
                        </button>
                      )}
                      {showRevoke && (
                        <button
                          aria-label={copy.access.revokeActionLabel[lang](member.name)}
                          className={styles.secondary}
                          data-access-action={member.principalId}
                          disabled={controlsDisabled || reachedConfirm}
                          onClick={() => onReviewAccess(member, 'revoked')}
                          ref={button => {
                            if (button === null) rowButtons.current.delete(member.principalId);
                            else rowButtons.current.set(member.principalId, button);
                          }}
                          type="button"
                        >
                          {copy.access.revoke[lang]}
                        </button>
                      )}
                    </div>
                  )}
                  {rowConfirmState !== null && (
                    <div className={styles.accessConfirm} data-access-confirm>
                      <ConfirmBox
                        busy={pending}
                        disabled={unknown}
                        consequence={rowConfirmState === 'active' ? grantConsequence(member) : revokeConsequence(member)}
                        confirmLabel={rowConfirmState === 'active'
                          ? (member.explicitAccess === 'revoked' ? copy.access.regrant : copy.access.grant)
                          : copy.access.revoke}
                        danger={rowConfirmState === 'revoked'}
                        onCancel={() => cancelAccess(member.principalId)}
                        onConfirm={onSubmit}
                        pendingLabel={copy.access.changingAccess}
                        title={rowConfirmState === 'active'
                          ? (member.explicitAccess === 'revoked'
                            ? { es: copy.access.regrantTitle.es(member.name), en: copy.access.regrantTitle.en(member.name) }
                            : { es: copy.access.grantTitle.es(member.name), en: copy.access.grantTitle.en(member.name) })
                          : { es: copy.access.revokeTitle.es(member.name), en: copy.access.revokeTitle.en(member.name) }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {access !== null && accessError !== null && (
          <FeedbackPanel
            actions={accessError.reason === 'changed'
              ? (
                <button className={styles.secondary} disabled={controlsDisabled} onClick={onRefresh} type="button">
                  {copy.access.refreshPeople[lang]}
                </button>
              )
              : (
                <button className={styles.secondary} disabled={controlsDisabled} onClick={onLoadMore} type="button">
                  {copy.access.retryPeople[lang]}
                </button>
              )}
            body={accessError.reason === 'changed' ? copy.access.changedBody : copy.access.pageErrorBody}
            title={accessError.reason === 'changed' ? copy.access.changedTitle : copy.feedback.pageErrorTitle}
            tone="warning"
          />
        )}
        {access !== null && access.nextCursor !== null && accessError?.reason !== 'changed' && (
          <button className={styles.loadMoreButton} disabled={controlsDisabled} onClick={onLoadMore} type="button">
            {copy.access.loadMorePeople[lang]}
          </button>
        )}
      </section>

      {draftAccess !== null && target !== null && !access?.items.some(member => member.principalId === draftAccess.principalId) && (
        <section aria-label={copy.access.targetMember[lang]} className={styles.accessSection} data-access-confirm>
          <ConfirmBox
            busy={pending}
            disabled={unknown}
            consequence={draftAccess.state === 'active' ? targetGrantConsequence : targetRevokeConsequence}
            confirmLabel={targetConfirmLabel}
            danger={draftAccess.state === 'revoked'}
            onCancel={() => cancelAccess(draftAccess.principalId)}
            onConfirm={onSubmit}
            pendingLabel={targetPendingLabel}
            title={targetTitle}
          />
        </section>
      )}

    </div>
  );
}

export function projectPolicyConflictFields(
  conflict: Project,
  draft: ProjectPolicyCommand,
  accessConflict: ProjectAccessMember | null,
  lang: 'es' | 'en',
): ConflictFieldView[] {
  if (draft.type === 'change-visibility') {
    return [
      {
        key: 'visibility',
        label: copy.access.visibilityCurrent[lang],
        current: visibilityName(conflict.visibility)[lang],
        draft: visibilityName(draft.visibility)[lang],
        changed: conflict.visibility !== draft.visibility,
      },
    ];
  }
  const member = accessConflict;
  if (member === null) return [];
  const currentEffective = accessExplanation(member, conflict.visibility)[lang];
  const requestedEffective = requestedExplanation(member, conflict.visibility, draft.state)[lang];
  const currentExplicit = explicitText(member.explicitAccess)[lang];
  const requestedExplicit = explicitText(draft.state)[lang];
  return [
    {
      key: 'effective',
      label: copy.access.conflictEffective[lang],
      current: currentEffective,
      draft: requestedEffective,
      changed: currentEffective !== requestedEffective,
    },
    {
      key: 'explicit',
      label: copy.access.conflictExplicit[lang],
      current: currentExplicit,
      draft: requestedExplicit,
      changed: member.explicitAccess !== draft.state,
    },
  ];
}
