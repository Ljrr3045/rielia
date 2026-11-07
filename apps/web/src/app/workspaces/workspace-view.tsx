'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { useWorkspaces } from '../../lib/use-workspaces';
import { WorkspaceChooser, WorkspaceBar, CreateWorkspaceForm } from './workspace-entry';
import { InvitationLinkPanel, InvitationsSection } from './workspace-invitations';
import { MembersSection } from './workspace-members';
import { AgentsSection } from './workspace-agents';
import { StatusCard, InvitationPanel, OperationPanel } from './workspace-feedback';
import { useWorkspaceScreenActions } from './use-workspace-screen-actions';
import { commandName, copy } from './strings';
import { BilingualText, LocaleProvider, type Lang } from './workspace-ui';
import styles from './workspace.module.css';

export function WorkspaceView() {
  const [lang, setLang] = useState<Lang>('es');
  return (
    <LocaleProvider lang={lang}>
      <WorkspaceScreen lang={lang} onLangChange={setLang} />
    </LocaleProvider>
  );
}

function WorkspaceScreen({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
}) {
  const localeId = useId();
  const ws = useWorkspaces();
  const {
    lastAction,
    loadingMore,
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
  } = useWorkspaceScreenActions(ws);

  return (
    <>
      <a className={styles.skipLink} href="#main">
        <BilingualText value={copy.common.skip} />
      </a>
      <main id="main" tabIndex={-1} className={styles.shell} lang={lang}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.backLink}>
            <BilingualText value={copy.common.backHome} />
          </Link>
          <div className={styles.topbarActions}>
            <div className={styles.localeField}>
              <label className={styles.srOnly} htmlFor={localeId}>
                <BilingualText value={copy.common.language} />
              </label>
              <select
                id={localeId}
                value={lang}
                onChange={(event) => onLangChange(event.currentTarget.value as Lang)}
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
          <p className={styles.eyebrow}>
            <BilingualText value={copy.header.eyebrow} />
          </p>
          <h1 className={styles.title}>
            <BilingualText value={copy.header.title} />
          </h1>
          <p className={styles.lede}>
            <BilingualText value={copy.header.lede} />
          </p>
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
          onSwitch={(workspaceId) => void ws.selectWorkspace(workspaceId)}
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
            actions={
              <button type="button" className={styles.secondary} onClick={() => void ws.refresh()}>
                <BilingualText value={copy.common.refresh} />
              </button>
            }
          />
        )}

        {ws.status === 'signed-out' && (
          <StatusCard
            title={copy.status.signedOutTitle}
            body={copy.status.signedOutBody}
            actions={
              <>
                {memoryPresent ? (
                  <a
                    className={styles.primary}
                    href="/identity"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
            }
          >
            <p className={styles.statusBody}>
              <BilingualText
                value={memoryPresent ? copy.status.signInReturnMemory : copy.status.signInReturn}
              />
            </p>
            {memoryPresent && (
              <>
                <p className={styles.statusBody}>
                  <BilingualText value={copy.status.memoryKept} />
                </p>
                {draftMemory && draftType !== null && (
                  <div className={styles.draftNotice}>
                    <p>
                      <strong>
                        <BilingualText value={copy.operation.draftLabel} />:
                      </strong>{' '}
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
            actions={
              <>
                <button type="button" className={styles.primary} onClick={() => void ws.refresh()}>
                  <BilingualText value={copy.status.retryLoad} />
                </button>
                <Link className={styles.secondary} href="/">
                  <BilingualText value={copy.common.backHome} />
                </Link>
              </>
            }
          />
        )}

        {ws.status === 'forbidden' && (
          <StatusCard
            title={copy.status.forbiddenTitle}
            body={copy.status.forbiddenBody}
            actions={
              <>
                <button type="button" className={styles.primary} onClick={() => void ws.refresh()}>
                  <BilingualText value={copy.common.refresh} />
                </button>
                {session !== null && (
                  <a
                    className={styles.secondary}
                    href="/identity"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BilingualText value={copy.common.account} />
                  </a>
                )}
                <Link className={styles.secondary} href="/">
                  <BilingualText value={copy.common.backHome} />
                </Link>
              </>
            }
          />
        )}

        {ws.status === 'empty' && (
          <section className={styles.emptyState} aria-labelledby="empty-heading">
            <h2 id="empty-heading" className={styles.sectionTitle}>
              <BilingualText value={copy.status.emptyTitle} />
            </h2>
            <p className={styles.sectionBody}>
              <BilingualText value={copy.status.emptyBody} />
            </p>
            {workspaces !== null && workspaces.items.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.subheading}>
                  <BilingualText value={copy.workspace.availableTitle} />
                </h3>
                <WorkspaceChooser
                  workspaces={workspaces}
                  selectedWorkspaceId={null}
                  pending={ws.pending}
                  onSelect={(workspaceId) => void ws.selectWorkspace(workspaceId)}
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
                <p className={styles.sectionBody}>
                  <BilingualText value={copy.workspace.switchBody} />
                </p>
              </div>
            </div>
            {workspaces !== null && workspaces.items.length > 0 && (
              <div className={styles.card}>
                <WorkspaceChooser
                  workspaces={workspaces}
                  selectedWorkspaceId={ws.selectedWorkspaceId}
                  pending={ws.pending}
                  onSelect={(workspaceId) => void ws.selectWorkspace(workspaceId)}
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
              onSelect={(workspaceId) => void ws.selectWorkspace(workspaceId)}
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
