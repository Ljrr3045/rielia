'use client';
import type { RefObject, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import {
  type Project,
  type ProjectTaskCommand,
  type ProjectPolicyCommand,
  type ProjectMoveCommand,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
import { type FormState } from './project-content-model';
import { copy, type Lang } from './strings';
import {
  IconArchive,
  IconClose,
  IconMenu,
  IconPlus,
  IconProject,
  IconSearch,
  IconTask,
  cx,
} from './project-ui';
import Link from 'next/link';
import styles from './projects.module.css';
export interface ProjectShellPorts {
  activeProjectId: string | null;
  anyPending: boolean;
  blocked: boolean;
  canCreateProject: boolean;
  changeDiscoveryScope: (scope: 'mine' | 'search') => void;
  closeDrawer: () => void;
  discoveryLink: (scope: 'mine' | 'search') => string;
  draft: ProjectTaskCommand | null;
  drawerOpen: boolean;
  form: FormState | null;
  isArchivedProjects: boolean;
  lang: Lang;
  loadMore: (
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees',
  ) => Promise<void>;
  moveDraft: ProjectMoveCommand | null;
  onLanguage: (lang: Lang) => void;
  openDrawer: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  openProject: (projectId: string) => void;
  openProjectCreate: (opener?: HTMLElement) => void;
  overlayOpen: boolean;
  pageError: {
    collection: 'workspaces' | 'members' | 'projects' | 'tasks';
    requestId: string | null;
    reason?: 'changed';
  } | null;
  pageErrorBlock: ReactNode;
  policyDraft: ProjectPolicyCommand | null;
  project: ProjectTaskState['project'];
  projectList: readonly Project[];
  projects: ProjectTaskState['projects'];
  selectWorkspace: (workspaceId: string | null) => Promise<void>;
  selection: ProjectTaskState['selection'];
  sidebarDrawer: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  status: ProjectTaskState['status'];
  taskScope: ProjectTaskState['taskScope'];
  toggleProjectsView: () => void;
  workspace: ProjectTaskState['workspace'];
  workspaceNavigation: ProjectTaskState['workspaceNavigation'];
  workspaces: ProjectTaskState['workspaces'];
}

export function renderProjectShell({
  activeProjectId,
  anyPending,
  blocked,
  canCreateProject,
  changeDiscoveryScope,
  closeDrawer,
  discoveryLink,
  draft,
  drawerOpen,
  form,
  isArchivedProjects,
  lang,
  loadMore,
  moveDraft,
  onLanguage,
  openDrawer,
  openProject,
  openProjectCreate,
  overlayOpen,
  pageError,
  pageErrorBlock,
  policyDraft,
  project,
  projectList,
  projects,
  selectWorkspace,
  selection,
  sidebarDrawer,
  sidebarRef,
  status,
  taskScope,
  toggleProjectsView,
  workspace,
  workspaceNavigation,
  workspaces,
  workArea,
  dialogs,
}: ProjectShellPorts & { workArea: ReactNode; dialogs: ReactNode }) {
  function renderWorkspaceOptions() {
    const list = workspaces?.items ?? [];
    const currentMissing = workspace !== null && !list.some((item) => item.id === workspace.id);
    return (
      <>
        {selection.workspaceId === null && (
          <option value="">{copy.header.noWorkspace[lang]}</option>
        )}
        {currentMissing && workspace !== null && (
          <option value={workspace.id}>{workspace.name}</option>
        )}
        {list.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </>
    );
  }
  return (
    <div className={styles.app} lang={lang}>
      <a className={styles.skipLink} href="#projects-main">
        {copy.common.skip[lang]}
      </a>

      <header
        className={styles.topbar}
        inert={
          overlayOpen || drawerOpen || form !== null || workspaceNavigation !== null
            ? true
            : undefined
        }
      >
        <Link className={styles.brand} href="/">
          <span aria-hidden="true" className={styles.brandMark} />
          <span className={styles.brandText}>Rielia</span>
        </Link>

        <div className={styles.topbarWorkspace}>
          <label className={styles.srOnly} htmlFor="projects-workspace-select">
            {copy.header.workspaceSelector[lang]}
          </label>
          {workspaces !== null && workspaces.items.length > 0 ? (
            <select
              aria-label={copy.header.workspaceSelector[lang]}
              disabled={anyPending}
              id="projects-workspace-select"
              onChange={(event) => {
                void selectWorkspace(
                  event.currentTarget.value.length === 0 ? null : event.currentTarget.value,
                );
              }}
              value={selection.workspaceId ?? ''}
            >
              {renderWorkspaceOptions()}
            </select>
          ) : (
            <span className={styles.workspaceName}>
              {workspace?.name ?? copy.header.workspaceFallback[lang]}
            </span>
          )}
          <Link className={styles.workspaceLink} href="/workspaces">
            {copy.common.workspaces[lang]}
          </Link>
        </div>

        <div className={styles.topbarActions}>
          <label className={styles.localeField} htmlFor="projects-locale">
            <span>{copy.common.language[lang]}</span>
            <select
              id="projects-locale"
              onChange={(event) => onLanguage(event.currentTarget.value === 'en' ? 'en' : 'es')}
              value={lang}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
          <a
            className={styles.accountLink}
            href="/identity"
            rel="noopener noreferrer"
            target="_blank"
          >
            {copy.common.account[lang]}
          </a>
        </div>
      </header>

      <div className={styles.shell}>
        <aside
          aria-label={copy.project.navLabel[lang]}
          className={cx(styles.sidebar, drawerOpen && styles.open)}
          inert={
            sidebarDrawer
              ? !drawerOpen
                ? true
                : undefined
              : overlayOpen || form !== null || workspaceNavigation !== null
                ? true
                : undefined
          }
          ref={sidebarRef}
          tabIndex={-1}
        >
          <div className={styles.sidebarHeader}>
            <div>
              <p className={styles.sidebarEyebrow}>{copy.common.workspace[lang]}</p>
              <h2 className={styles.sidebarTitle}>
                {workspace?.name ?? copy.header.workspaceFallback[lang]}
              </h2>
            </div>
            {sidebarDrawer && (
              <button
                aria-label={copy.common.closeMenu[lang]}
                className={styles.iconButton}
                data-autofocus
                onClick={closeDrawer}
                type="button"
              >
                <IconClose size={20} />
              </button>
            )}
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>
              <span>{copy.discovery.navLabel[lang]}</span>
            </div>
            <nav aria-label={copy.discovery.navLabel[lang]}>
              <ul className={styles.projectNav}>
                <li>
                  <a
                    aria-current={taskScope === 'mine' ? 'page' : undefined}
                    className={cx(
                      styles.navItem,
                      styles.navItemPrimary,
                      taskScope === 'mine' && styles.navItemActive,
                    )}
                    href={discoveryLink('mine')}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      changeDiscoveryScope('mine');
                    }}
                  >
                    <span aria-hidden="true" className={styles.navItemIcon}>
                      <IconTask size={18} />
                    </span>
                    <span className={styles.navItemMain}>
                      <span className={styles.navItemTitle}>{copy.discovery.myTasks[lang]}</span>
                      <span className={styles.navItemMeta}>{copy.discovery.myTasksMeta[lang]}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    aria-current={taskScope === 'search' ? 'page' : undefined}
                    className={cx(styles.navItem, taskScope === 'search' && styles.navItemActive)}
                    href={discoveryLink('search')}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      changeDiscoveryScope('search');
                    }}
                  >
                    <span aria-hidden="true" className={styles.navItemIcon}>
                      <IconSearch size={18} />
                    </span>
                    <span className={styles.navItemMain}>
                      <span className={styles.navItemTitle}>{copy.discovery.search[lang]}</span>
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>
              <span id="projects-nav-heading">
                {isArchivedProjects
                  ? copy.project.archivedHeading[lang]
                  : copy.project.activeHeading[lang]}
              </span>
              <span>{projects?.total ?? '—'}</span>
            </div>
            <nav aria-labelledby="projects-nav-heading">
              <ul className={styles.projectNav}>
                {projectList.map((item) => {
                  const current = item.id === activeProjectId;
                  return (
                    <li key={item.id}>
                      <a
                        aria-current={current ? 'page' : undefined}
                        className={cx(styles.navItem, current && styles.navItemActive)}
                        href={item.url}
                        onClick={(event) => {
                          if (
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey ||
                            event.button !== 0
                          )
                            return;
                          event.preventDefault();
                          openProject(item.id);
                        }}
                      >
                        <span aria-hidden="true" className={styles.navItemIcon}>
                          <IconProject size={18} />
                        </span>
                        <span className={styles.navItemMain}>
                          <span className={styles.navItemTitle}>{item.name}</span>
                          <span className={styles.navItemMeta}>
                            <span className={styles.taskKey}>{item.key}</span>
                            {item.archivedAt !== null && (
                              <span>{copy.project.archivedBadge[lang]}</span>
                            )}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {projects !== null && projectList.length === 0 && status !== 'loading' && (
              <p className={styles.sidebarEmpty}>
                {isArchivedProjects
                  ? copy.status.emptyArchivedProjectsTitle[lang]
                  : copy.status.emptyProjectsTitle[lang]}
              </p>
            )}
            {projects?.nextCursor !== null && projects !== null && (
              <button
                className={styles.navArchivedLink}
                disabled={anyPending}
                onClick={() => {
                  void loadMore('projects');
                }}
                type="button"
              >
                {copy.common.loadMore[lang]}
              </button>
            )}
            {pageError?.collection === 'projects' && pageErrorBlock}
            <button
              aria-pressed={isArchivedProjects}
              className={styles.navArchivedLink}
              disabled={anyPending}
              onClick={toggleProjectsView}
              type="button"
            >
              <IconArchive size={16} />
              {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
            </button>
            {canCreateProject && (
              <button
                className={styles.navCreateLink}
                disabled={
                  blocked ||
                  policyDraft !== null ||
                  moveDraft !== null ||
                  (draft !== null && draft.type !== 'create-project')
                }
                onClick={(event) => openProjectCreate(event.currentTarget)}
                type="button"
              >
                <IconPlus size={16} />
                {copy.project.createDisclosure[lang]}
              </button>
            )}
          </div>

          <div className={styles.sidebarAdministration}>
            <Link className={styles.navWorkspacesLink} href="/workspaces">
              {copy.common.workspaces[lang]}
            </Link>
          </div>
        </aside>

        {drawerOpen && (
          <button
            aria-label={copy.common.closeMenu[lang]}
            className={styles.sidebarBackdrop}
            onClick={closeDrawer}
            type="button"
          />
        )}

        <main
          className={styles.main}
          id="projects-main"
          inert={drawerOpen || form !== null || workspaceNavigation !== null ? true : undefined}
          tabIndex={-1}
        >
          <div className={styles.mobileHeader}>
            <button
              aria-label={copy.common.menu[lang]}
              className={styles.mobileMenuButton}
              onClick={openDrawer}
              type="button"
            >
              <IconMenu size={20} />
            </button>
            <span className={styles.mobileTitle}>
              {taskScope === 'mine'
                ? copy.discovery.myTasks[lang]
                : taskScope === 'search'
                  ? copy.discovery.search[lang]
                  : (project?.name ?? copy.header.projectsTitle[lang])}
            </span>
            {workspace !== null && (
              <button
                aria-label={copy.project.newProject[lang]}
                className={styles.mobileMenuButton}
                disabled={
                  !canCreateProject ||
                  blocked ||
                  policyDraft !== null ||
                  moveDraft !== null ||
                  (draft !== null && draft.type !== 'create-project')
                }
                onClick={(event) => openProjectCreate(event.currentTarget)}
                type="button"
              >
                <IconPlus size={20} />
              </button>
            )}
          </div>

          {form === null &&
            pageError !== null &&
            (pageError.collection === 'workspaces' || pageError.collection === 'members') &&
            pageErrorBlock}

          {workArea}
        </main>
      </div>

      {dialogs}
    </div>
  );
}
