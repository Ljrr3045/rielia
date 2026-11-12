'use client';
import type { RefObject, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import {
  type TaskDiscoveryItem,
  type TaskView,
  type TaskFilters,
  type Project,
  type Task,
  type TaskStatus,
  type ProjectTaskCommand,
  type ProjectMoveCommand,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
import { copy, visibilityName, projectTaskCount, type Lang } from './strings';
import { FeedbackPanel } from './feedback';
import {
  Badge,
  EmptyState,
  IconAlert,
  IconArchive,
  IconChevron,
  IconProject,
  IconRestore,
  IconSettings,
  IconTask,
  IconUsers,
  StateCard,
  cx,
} from './project-ui';
import { TaskCaptureForm } from './task-forms';
import { TaskBoard } from './task-board';
import { TaskList } from './task-list';
import { TaskViewBar } from './task-view-bar';
import {
  TaskCreateShortcut,
  TaskDiscoveryBar,
  TaskDiscoveryList,
  LiveUpdateNotice,
} from './task-discovery';
import Link from 'next/link';
import styles from './projects.module.css';
export interface ProjectWorkAreaPorts {
  anyDraft: boolean;
  anyPending: boolean;
  assignees: ProjectTaskState['assignees'];
  beginColumnCapture: (status: TaskStatus) => void;
  blocked: boolean;
  canArchiveProject: boolean;
  canCapture: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canManageAccess: boolean;
  canMoveTask: (target: Task) => boolean;
  canRestoreProject: boolean;
  cancelColumnCapture: () => void;
  captureRef: RefObject<HTMLInputElement | null>;
  captureStatus: TaskStatus;
  captureTitle: string;
  changeDiscoveryScope: (scope: 'mine' | 'search') => void;
  chooseProjectForCapture: (projectId: string) => void;
  clearDiscoveryFilters: () => void;
  closeProjectOptions: (event: ReactMouseEvent<HTMLElement>) => void;
  columnCaptureOpen: boolean;
  detailOpen: boolean;
  discovery: ProjectTaskState['discovery'];
  discoveryContextLimitReached: ProjectTaskState['discoveryContextLimitReached'];
  discoveryHeadingRef: RefObject<HTMLHeadingElement | null>;
  discoveryProjectId: ProjectTaskState['discoveryProjectId'];
  discoveryProjectName: string | null;
  draft: ProjectTaskCommand | null;
  feedbackInForm: boolean;
  filtersActive: boolean;
  hasProjectActions: boolean;
  hasWorkspace: boolean;
  isArchivedProjects: boolean;
  isArchivedTasks: boolean;
  lang: Lang;
  loadDiscoveryMore: () => Promise<void>;
  loadMore: (
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees',
  ) => Promise<void>;
  loadTaskColumn: (status: TaskStatus) => Promise<void>;
  moveDraft: ProjectMoveCommand | null;
  moveRetryTarget: ProjectMoveCommand | null;
  narrow: boolean;
  openDiscoveryRow: (item: TaskDiscoveryItem, opener: HTMLElement) => void;
  openProjectAccess: (opener?: HTMLElement) => void;
  openProjectCreate: (opener?: HTMLElement) => void;
  openProjectSettings: (opener?: HTMLElement) => void;
  overlayOpen: boolean;
  pending: ProjectTaskCommand['type'] | null;
  pendingTaskId: string | null;
  performMove: (target: Task, status: TaskStatus, beforeTaskId?: string | null) => void;
  performMoveBefore: (target: Task, status: TaskStatus, beforeTaskId: string) => void;
  performMoveEnd: (target: Task, status: TaskStatus) => void;
  policyPageErrors: ProjectTaskState['policyPageErrors'];
  project: ProjectTaskState['project'];
  projectArchived: boolean;
  projectHeadingRef: RefObject<HTMLHeadingElement | null>;
  projectList: readonly Project[];

  readOnlyTasks: boolean;
  recoveryBlock: ReactNode;
  refresh: () => Promise<void>;
  refreshDeferred: ProjectTaskState['refreshDeferred'];
  refreshRequired: ProjectTaskState['refreshRequired'];
  renderTaskDetail: () => ReactNode;
  requestProjectArchive: (restore: boolean, opener?: HTMLElement) => void;
  requestTaskArchive: (
    restore: boolean,
    target?: Task | null,
    opener?: HTMLElement,
  ) => Promise<void>;
  searchQuery: ProjectTaskState['searchQuery'];
  selectTaskFromList: (taskId: string, opener: HTMLElement) => void;
  selectedTaskAssignee: ProjectTaskState['selectedTaskAssignee'];
  setDiscoveryProject: (projectId: string | null) => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  setTaskColumn: (status: TaskStatus) => Promise<void>;
  setTaskFilters: (filters: TaskFilters) => Promise<void>;
  setTaskLayout: (layout: TaskView['layout']) => Promise<void>;
  stageCapture: (title: string) => void;
  status: ProjectTaskState['status'];
  streamStatus: ProjectTaskState['streamStatus'];
  submitCapture: () => void;
  submitColumnCapture: () => void;
  taskColumnErrors: ProjectTaskState['taskColumnErrors'];
  taskColumns: ProjectTaskState['taskColumns'];
  taskColumnsChanged: ProjectTaskState['taskColumnsChanged'];
  taskFilterAssigneeStatus: ProjectTaskState['taskFilterAssigneeStatus'];
  taskList: readonly Task[];
  taskPageChanged: boolean;
  taskPageErrorBlock: ReactNode;
  taskPagePartial: boolean;
  taskScope: ProjectTaskState['taskScope'];
  taskSummary: ProjectTaskState['taskSummary'];
  taskView: ProjectTaskState['taskView'];
  tasks: ProjectTaskState['tasks'];
  toggleProjectsView: () => void;
  toggleTasksView: () => void;
  views: ProjectTaskState['views'];
  workspace: ProjectTaskState['workspace'];
}

export function renderProjectWorkArea({
  anyDraft,
  anyPending,
  assignees,
  beginColumnCapture,
  blocked,
  canArchiveProject,
  canCapture,
  canCreateProject,
  canEditProject,
  canManageAccess,
  canMoveTask,
  canRestoreProject,
  cancelColumnCapture,
  captureRef,
  captureStatus,
  captureTitle,
  changeDiscoveryScope,
  chooseProjectForCapture,
  clearDiscoveryFilters,
  closeProjectOptions,
  columnCaptureOpen,
  detailOpen,
  discovery,
  discoveryContextLimitReached,
  discoveryHeadingRef,
  discoveryProjectId,
  discoveryProjectName,
  draft,
  feedbackInForm,
  filtersActive,
  hasProjectActions,
  hasWorkspace,
  isArchivedProjects,
  isArchivedTasks,
  lang,
  loadDiscoveryMore,
  loadMore,
  loadTaskColumn,
  moveDraft,
  moveRetryTarget,
  narrow,
  openDiscoveryRow,
  openProjectAccess,
  openProjectCreate,
  openProjectSettings,
  overlayOpen,
  pending,
  pendingTaskId,
  performMove,
  performMoveBefore,
  performMoveEnd,
  policyPageErrors,
  project,
  projectArchived,
  projectHeadingRef,
  projectList,
  readOnlyTasks,
  recoveryBlock,
  refresh,
  refreshDeferred,
  refreshRequired,
  renderTaskDetail,
  requestProjectArchive,
  requestTaskArchive,
  searchQuery,
  selectTaskFromList,
  selectedTaskAssignee,
  setDiscoveryProject,
  setSearchQuery,
  setTaskColumn,
  setTaskFilters,
  setTaskLayout,
  stageCapture,
  status,
  streamStatus,
  submitCapture,
  submitColumnCapture,
  taskColumnErrors,
  taskColumns,
  taskColumnsChanged,
  taskFilterAssigneeStatus,
  taskList,
  taskPageChanged,
  taskPageErrorBlock,
  taskPagePartial,
  taskScope,
  taskSummary,
  taskView,
  tasks,
  toggleProjectsView,
  toggleTasksView,
  views,
  workspace,
}: ProjectWorkAreaPorts) {
  function renderProjectActions(compact: boolean) {
    const base = compact ? styles.projectMenuItem : styles.ghostButton;
    return (
      <>
        {canManageAccess && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={(event) => {
              if (compact) closeProjectOptions(event);
              openProjectAccess(event.currentTarget);
            }}
            type="button"
          >
            <IconUsers size={16} />
            {copy.access.button[lang]}
          </button>
        )}
        {canEditProject && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={(event) => {
              if (compact) closeProjectOptions(event);
              openProjectSettings(event.currentTarget);
            }}
            type="button"
          >
            <IconSettings size={16} />
            {copy.project.settingsTitle[lang]}
          </button>
        )}
        {canArchiveProject && (
          <button
            className={base}
            disabled={blocked || anyDraft}
            onClick={(event) => {
              if (compact) closeProjectOptions(event);
              requestProjectArchive(false, event.currentTarget);
            }}
            type="button"
          >
            <IconArchive size={16} />
            {copy.project.archive[lang]}
          </button>
        )}
        {canRestoreProject && (
          <button
            className={compact ? styles.projectMenuItem : styles.primary}
            disabled={blocked || anyDraft}
            onClick={(event) => {
              if (compact) closeProjectOptions(event);
              requestProjectArchive(true, event.currentTarget);
            }}
            type="button"
          >
            <IconRestore size={16} />
            {copy.project.restore[lang]}
          </button>
        )}
      </>
    );
  }
  return (
    <>
      {status === 'loading' && (
        <StateCard
          body={copy.status.loadingBody}
          busy
          icon={<IconTask size={22} />}
          title={copy.status.loadingTitle}
        >
          <div aria-hidden="true" className={styles.skeletonList}>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        </StateCard>
      )}

      {status === 'disabled' && (
        <StateCard
          body={copy.status.disabledBody}
          icon={<IconAlert size={22} />}
          title={copy.status.disabledTitle}
        />
      )}

      {status === 'signed-out' && (
        <StateCard
          actions={
            <>
              <a
                className={styles.primary}
                href="/identity"
                rel="noopener noreferrer"
                target="_blank"
              >
                {copy.status.signInNewTab[lang]}
              </a>
              <button
                className={styles.secondary}
                onClick={() => {
                  void refresh();
                }}
                type="button"
              >
                {copy.common.refresh[lang]}
              </button>
            </>
          }
          body={
            draft !== null || moveDraft !== null || moveRetryTarget !== null
              ? copy.status.signInReturnMemory
              : copy.status.signedOutBody
          }
          icon={<IconAlert size={22} />}
          title={copy.status.signedOutTitle}
        >
          {(draft !== null || moveDraft !== null || moveRetryTarget !== null) && (
            <p className={styles.stateHint}>{copy.status.memoryKept[lang]}</p>
          )}
        </StateCard>
      )}

      {status === 'forbidden' && (
        <StateCard
          actions={
            <>
              <button
                className={styles.primary}
                onClick={() => {
                  void refresh();
                }}
                type="button"
              >
                {copy.common.refresh[lang]}
              </button>
              <Link className={styles.secondary} href="/workspaces">
                {copy.common.workspaces[lang]}
              </Link>
            </>
          }
          body={copy.status.forbiddenBody}
          icon={<IconAlert size={22} />}
          title={copy.status.forbiddenTitle}
        />
      )}

      {status === 'error' && (
        <StateCard
          actions={
            <>
              <button
                className={styles.primary}
                onClick={() => {
                  void refresh();
                }}
                type="button"
              >
                {copy.status.retryLoad[lang]}
              </button>
              <Link className={styles.secondary} href="/workspaces">
                {copy.common.workspaces[lang]}
              </Link>
            </>
          }
          body={copy.status.errorBody}
          icon={<IconAlert size={22} />}
          title={copy.status.errorTitle}
        />
      )}

      {status === 'empty' && !hasWorkspace && (
        <StateCard
          actions={
            <>
              <Link className={styles.primary} href="/workspaces">
                {copy.status.goWorkspaces[lang]}
              </Link>
              <button
                className={styles.secondary}
                onClick={() => {
                  void refresh();
                }}
                type="button"
              >
                {copy.common.refresh[lang]}
              </button>
            </>
          }
          body={copy.status.emptyWorkspaceBody}
          icon={<IconProject size={22} />}
          title={copy.status.emptyWorkspaceTitle}
        />
      )}

      {status === 'empty' && hasWorkspace && taskScope === 'project' && project === null && (
        <section aria-labelledby="projects-empty-heading">
          <div className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <p className={styles.eyebrow}>{copy.header.eyebrow[lang]}</p>
              <h1
                className={styles.title}
                id="projects-empty-heading"
                ref={projectHeadingRef}
                tabIndex={-1}
              >
                {isArchivedProjects
                  ? copy.project.archivedHeading[lang]
                  : copy.header.projectsTitle[lang]}
              </h1>
              <p className={styles.lede}>{copy.header.projectsLede[lang]}</p>
            </div>
          </div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionHint}>{workspace?.name}</span>
            <button
              className={styles.secondary}
              disabled={anyPending}
              onClick={toggleProjectsView}
              type="button"
            >
              {isArchivedProjects ? copy.project.viewActive[lang] : copy.project.viewArchived[lang]}
            </button>
          </div>
          {recoveryBlock}
          <EmptyState
            actions={
              isArchivedProjects ? (
                <button
                  className={styles.secondary}
                  disabled={anyPending}
                  onClick={toggleProjectsView}
                  type="button"
                >
                  {copy.project.viewActive[lang]}
                </button>
              ) : canCreateProject ? (
                <button
                  className={styles.primary}
                  disabled={blocked || anyDraft}
                  onClick={(event) => openProjectCreate(event.currentTarget)}
                  type="button"
                >
                  {copy.project.createFirst[lang]}
                </button>
              ) : undefined
            }
            body={
              isArchivedProjects
                ? copy.status.emptyArchivedProjectsBody
                : canCreateProject
                  ? copy.status.emptyProjectsBody
                  : copy.status.emptyProjectsViewerBody
            }
            icon={isArchivedProjects ? <IconArchive size={22} /> : <IconProject size={22} />}
            title={
              isArchivedProjects
                ? copy.status.emptyArchivedProjectsTitle
                : copy.status.emptyProjectsTitle
            }
          />
        </section>
      )}

      {status === 'ready' && taskScope !== 'project' && (
        <div className={cx(styles.workLayout, detailOpen && styles.workLayoutOpen)}>
          <section className={styles.listColumn} inert={overlayOpen ? true : undefined}>
            <header className={styles.mainHeader}>
              <nav aria-label={copy.common.workspaces[lang]} className={styles.breadcrumb}>
                <Link href="/workspaces">{copy.common.workspaces[lang]}</Link>
                <span aria-hidden="true" className={styles.breadcrumbSeparator}>
                  /
                </span>
                <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
              </nav>
              <div className={styles.pageTitleRow}>
                <div className={styles.titleBlock}>
                  <h1 className={styles.title} ref={discoveryHeadingRef} tabIndex={-1}>
                    {taskScope === 'mine'
                      ? copy.discovery.myTasks[lang]
                      : copy.discovery.search[lang]}
                  </h1>
                  <p className={styles.lede}>
                    {taskScope === 'mine'
                      ? copy.discovery.myTasksLede[lang]
                      : copy.discovery.searchLede[lang]}
                  </p>
                  <div className={styles.metaLine}>
                    <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
                    <span>
                      {taskScope === 'mine'
                        ? copy.discovery.myTasksMeta[lang]
                        : copy.discovery.searchMeta[lang]}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <LiveUpdateNotice
              disabled={anyPending}
              onRefresh={() => {
                void refresh();
              }}
              refreshDeferred={refreshDeferred}
              refreshRequired={refreshRequired}
              status={streamStatus}
            />

            {!isArchivedTasks && (
              <TaskCreateShortcut
                disabled={blocked || anyDraft}
                onChoose={chooseProjectForCapture}
                projects={projectList}
              />
            )}

            <TaskDiscoveryBar
              archived={isArchivedTasks}
              disabled={anyPending}
              filters={taskView.filters}
              onClearFilters={clearDiscoveryFilters}
              onFilters={(filters) => {
                if (!anyPending) void setTaskFilters(filters);
              }}
              onProject={(projectId) => {
                if (!anyPending) void setDiscoveryProject(projectId);
              }}
              onScope={changeDiscoveryScope}
              onSearch={(value) => {
                if (!anyPending) void setSearchQuery(value);
              }}
              onToggleArchive={toggleTasksView}
              projects={projectList}
              projectId={discoveryProjectId}
              query={searchQuery}
              scope={taskScope}
              selectedProjectName={discoveryProjectName}
            />

            {!feedbackInForm && recoveryBlock}

            <h2 className={styles.srOnly}>{copy.discovery.resultsHeading[lang]}</h2>

            <TaskDiscoveryList
              archived={isArchivedTasks}
              contextLimit={discoveryContextLimitReached}
              disabled={anyPending}
              discovery={discovery}
              filters={taskView.filters}
              onClearFilters={clearDiscoveryFilters}
              onClearQuery={() => {
                if (!anyPending) void setSearchQuery('');
              }}
              onLoadMore={() => {
                void loadDiscoveryMore();
              }}
              onOpen={openDiscoveryRow}
              onRefresh={() => {
                void refresh();
              }}
              projectId={discoveryProjectId}
              query={searchQuery}
              scope={taskScope}
            />
          </section>

          {renderTaskDetail()}
        </div>
      )}

      {status === 'ready' && taskScope === 'project' && project !== null && (
        <div className={cx(styles.workLayout, detailOpen && styles.workLayoutOpen)}>
          <section className={styles.listColumn} inert={overlayOpen ? true : undefined}>
            <header className={styles.mainHeader}>
              <nav aria-label={copy.common.workspaces[lang]} className={styles.breadcrumb}>
                <Link href="/workspaces">{copy.common.workspaces[lang]}</Link>
                <span aria-hidden="true" className={styles.breadcrumbSeparator}>
                  /
                </span>
                <span>{workspace?.name ?? copy.header.workspaceFallback[lang]}</span>
              </nav>
              <div className={styles.pageTitleRow}>
                <div className={styles.titleBlock}>
                  <div className={styles.titleLine}>
                    <h1 className={styles.title} ref={projectHeadingRef} tabIndex={-1}>
                      {project.name}
                    </h1>
                    <span className={styles.titleKey}>{project.key}</span>
                    {projectArchived && (
                      <Badge tone="archived">{copy.project.archivedBadge[lang]}</Badge>
                    )}
                  </div>
                  {project.description.length > 0 && (
                    <p className={cx(styles.lede, styles.projectLede)}>{project.description}</p>
                  )}
                  <div className={styles.metaLine}>
                    <span className={styles.visibilityLine}>
                      <Badge tone={project.visibility === 'private' ? 'warning' : 'neutral'}>
                        {visibilityName(project.visibility)[lang]}
                      </Badge>
                      {project.visibility === 'workspace' ? null : (
                        <span>
                          {canManageAccess
                            ? copy.project.visibilityAutoAccess[lang]
                            : copy.project.visibilityGranted[lang]}
                        </span>
                      )}
                    </span>
                    <span>
                      {taskSummary.status === 'ready' && taskSummary.total !== null
                        ? projectTaskCount(taskSummary.total, lang)
                        : taskSummary.status === 'loading'
                          ? copy.common.loading[lang]
                          : taskSummary.status === 'changed'
                            ? copy.taskView.countChanged[lang]
                            : copy.taskView.countPartial[lang]}
                    </span>
                    <span>
                      {copy.task.creatorLabel[lang]}: {project.creator.name}
                      {project.creator.kind === 'agent' && (
                        <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>
                      )}
                    </span>
                  </div>
                </div>
                {hasProjectActions && (
                  <div className={cx(styles.pageActions, narrow && styles.pageActionsCompact)}>
                    {narrow ? (
                      <details
                        className={styles.projectOptions}
                        onKeyDown={(event) => {
                          if (event.key !== 'Escape') return;
                          event.currentTarget.removeAttribute('open');
                          event.currentTarget.querySelector<HTMLElement>('summary')?.focus();
                        }}
                      >
                        <summary
                          aria-label={copy.project.optionsMenu[lang]}
                          className={styles.projectOptionsSummary}
                          onClick={(event) => event.currentTarget.focus()}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter' && event.key !== ' ') return;
                            event.preventDefault();
                            const details = event.currentTarget.closest('details');
                            if (details !== null) details.open = !details.open;
                          }}
                        >
                          {copy.project.options[lang]}
                          <IconChevron size={16} />
                        </summary>
                        <div className={styles.projectOptionsMenu}>
                          {renderProjectActions(true)}
                        </div>
                      </details>
                    ) : (
                      renderProjectActions(false)
                    )}
                  </div>
                )}
              </div>
            </header>

            {projectArchived && (
              <FeedbackPanel
                actions={
                  canRestoreProject ? (
                    <button
                      className={styles.primary}
                      disabled={blocked || anyDraft}
                      onClick={(event) => requestProjectArchive(true, event.currentTarget)}
                      type="button"
                    >
                      {copy.project.restore[lang]}
                    </button>
                  ) : undefined
                }
                body={copy.project.archivedNotice}
                title={copy.project.archivedBadge}
                tone="warning"
              />
            )}

            {!project.capabilities.canEdit && !projectArchived && (
              <FeedbackPanel
                body={copy.task.viewerBody}
                title={copy.task.viewerTitle}
                tone="info"
              />
            )}

            <LiveUpdateNotice
              disabled={anyPending}
              onRefresh={() => {
                void refresh();
              }}
              refreshDeferred={refreshDeferred}
              refreshRequired={refreshRequired}
              status={streamStatus}
            />

            <TaskViewBar
              assigneeError={policyPageErrors.assignees !== undefined}
              assigneeLoading={assignees === null && policyPageErrors.assignees === undefined}
              assigneeStatus={taskFilterAssigneeStatus}
              assignees={assignees}
              assigneesNext={assignees !== null && assignees.nextCursor !== null}
              disabled={anyPending}
              onFilters={(filters) => {
                void setTaskFilters(filters);
              }}
              onLayout={(layout) => {
                void setTaskLayout(layout);
              }}
              onLoadMoreAssignees={() => {
                void loadMore('assignees');
              }}
              onRefresh={() => {
                void refresh();
              }}
              onToggleArchive={toggleTasksView}
              selectedTaskAssignee={selectedTaskAssignee}
              taskSummary={taskSummary}
              taskView={taskView}
              viewsTasks={views.tasks}
            />

            {!feedbackInForm && recoveryBlock}

            {taskView.layout === 'list' &&
              canCapture &&
              (draft === null ||
                (draft.type === 'create-task' && draft.projectId === project.id)) && (
                <TaskCaptureForm
                  disabled={!canCapture}
                  inputRef={captureRef}
                  onChange={stageCapture}
                  onSubmit={submitCapture}
                  pending={pending === 'create-task'}
                  value={captureTitle}
                />
              )}

            {taskView.layout === 'list' && tasks !== null && (
              <TaskList
                archivedView={isArchivedTasks}
                canCreate={canCapture}
                canMove={canMoveTask}
                changed={taskPageChanged}
                columnCounts={tasks.columnCounts}
                filtersActive={filtersActive}
                hasMore={tasks.nextCursor !== null}
                onClearFilters={() => {
                  void setTaskFilters({});
                }}
                onCreate={() => captureRef.current?.focus()}
                onLoadMore={() => {
                  void loadMore('tasks');
                }}
                onMove={(target, status) => performMove(target, status, null)}
                onMoveBefore={(target, beforeTaskId) =>
                  performMoveBefore(target, target.status, beforeTaskId)
                }
                onMoveEnd={(target) => performMoveEnd(target, target.status)}
                onOpen={selectTaskFromList}
                onRestore={(target, opener) => requestTaskArchive(true, target, opener)}
                partial={taskPagePartial}
                pending={blocked || anyDraft}
                pendingTaskId={pendingTaskId}
                readOnly={readOnlyTasks}
                tasks={taskList}
                total={taskSummary.status === 'ready' ? taskSummary.total : null}
              />
            )}

            {taskView.layout === 'board' && (
              <TaskBoard
                canCreate={canCapture && draft === null}
                canMove={canMoveTask}
                capture={
                  columnCaptureOpen &&
                  (taskView.filters.status === undefined ||
                    taskView.filters.status === captureStatus)
                    ? { status: captureStatus, title: captureTitle }
                    : null
                }
                capturePending={pending === 'create-task'}
                filtersActive={filtersActive}
                onBeginCapture={beginColumnCapture}
                onCancelCapture={cancelColumnCapture}
                onCaptureChange={stageCapture}
                onClearFilters={() => {
                  void setTaskFilters({});
                }}
                onLoadColumn={(status) => {
                  void loadTaskColumn(status);
                }}
                onMove={performMove}
                onMoveBefore={performMoveBefore}
                onMoveEnd={performMoveEnd}
                onOpenTask={selectTaskFromList}
                onRefresh={() => {
                  void refresh();
                }}
                onSetColumn={(status) => {
                  void setTaskColumn(status);
                }}
                onSubmitCapture={submitColumnCapture}
                pendingTaskId={pendingTaskId}
                readOnly={readOnlyTasks}
                taskColumnErrors={taskColumnErrors}
                taskColumns={taskColumns}
                taskColumnsChanged={taskColumnsChanged}
                taskView={taskView}
              />
            )}

            {taskView.layout === 'list' && taskPageErrorBlock}
          </section>

          {renderTaskDetail()}
        </div>
      )}
    </>
  );
}
