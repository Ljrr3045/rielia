'use client';

import { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  isTask,
  type DomainPerson,
  type ProjectAccessMember,
  type ProjectCommand,
  type ProjectMoveCommand,
  type ProjectPolicyCommand,
  type ProjectTaskCommand,
  type ProjectVisibility,
  type Task,
  type TaskStatus,
} from '@rielia/contracts';
import type { MoveEligibility } from '../../lib/project-task-controller';
import { useProjectTasks } from '../../lib/use-project-tasks';

import { LocaleProvider } from './project-ui';

import { TaskDetail } from './task-detail';

import { TaskCollaboration } from './task-collaboration';
import { TaskDescription } from './task-description';

import { copy, statusName, type Lang } from './strings';

import { useIsDetailOverlay, useIsNarrow, useIsSidebarDrawer } from './project-dom-hooks';
import { useProjectContentForms } from './use-project-content-forms';
import { useProjectNavigationFocus } from './use-project-navigation-focus';
import { useTaskResultFocus } from './use-task-result-focus';
import { useProjectInteractionEffects } from './use-project-interaction-effects';
import { isTaskResult } from './project-content-model';
import { createProjectRecoveryView } from './project-recovery';
import { renderProjectWorkArea } from './project-work-area';
import { renderProjectDialogs } from './project-content-dialog';
import { renderProjectShell } from './project-shell';

export function ProjectsView() {
  const [lang, setLang] = useState<Lang>('es');
  return (
    <LocaleProvider lang={lang}>
      <ProjectsScreen lang={lang} onLanguage={setLang} />
    </LocaleProvider>
  );
}

function ProjectsScreen({ lang, onLanguage }: { lang: Lang; onLanguage: (lang: Lang) => void }) {
  const projectTasks = useProjectTasks();

  const {
    status,
    workspaces,
    workspace,
    projects,
    project,
    tasks,
    task,
    taskScope,
    searchQuery,
    discoveryProjectId,
    discovery,
    discoveryFocusTaskId,
    discoveryContextLimitReached,
    streamStatus,
    refreshRequired,
    refreshDeferred,
    workspaceNavigation,
    taskView,
    taskColumns,
    taskColumnErrors,
    taskColumnsChanged,
    taskSummary,
    selectedTaskAssignee,
    taskFilterAssigneeStatus,
    selection,
    views,
    draft,
    pending,
    outcome,
    retryTarget,
    conflict,
    result,
    pageError,
    moveDraft,
    movePending,
    moveRetryTarget,
    moveNeedsDestination,
    projectAccess,
    assignees,
    policyPageErrors,
    accessConflict,
    policyDraft,
    policyPending,
    policyRetryTarget,
    closeWarning,
    draftGuard,
    mutationPending,
    collaborationDraft,
    collaborationRetryTarget,
    refresh,
    selectWorkspace,
    selectProject,
    selectTask,
    setView,
    setTaskScope,
    setSearchQuery,
    setDiscoveryProject,
    loadDiscoveryMore,
    openDiscoveryTask,
    returnToDiscovery,
    resolveWorkspaceNavigation,
    setTaskLayout,
    setTaskFilters,
    setTaskColumn,
    loadMore,
    loadTaskColumn,
    stageMove,
    stage,
    submit,
    retrySave,
    discardDraft,
    returnToDraft,
    reloadConflict,
    rebaseDraft,
    dismissOutcome,
    dismissPageError,
    setParentCandidatesWanted,
    acknowledgeClose,
  } = projectTasks;

  const [moveNotice, setMoveNotice] = useState<{
    reason: Exclude<MoveEligibility, 'ready'>;
    taskId: string;
  } | null>(null);

  const captureRef = useRef<HTMLInputElement>(null);

  const projectHeadingRef = useRef<HTMLHeadingElement>(null);

  const lastCommandRef = useRef<ProjectTaskCommand | null>(null);

  const lastPolicyCommandRef = useRef<ProjectPolicyCommand | null>(null);

  const lastPolicyMemberRef = useRef<ProjectAccessMember | null>(null);

  const lastOutcomeSourceRef = useRef<'content' | 'policy' | 'move' | 'collaboration'>('content');

  const sidebarDrawer = useIsSidebarDrawer();

  const detailOverlay = useIsDetailOverlay();

  const narrow = useIsNarrow();

  const contentBlocked = pending !== null || retryTarget !== null;

  const policyBlocked = policyPending !== null || policyRetryTarget !== null;

  const moveBlocked = movePending !== null || moveRetryTarget !== null;

  const blocked = contentBlocked || policyBlocked || moveBlocked || mutationPending !== null;

  const anyPending = mutationPending !== null;

  const anyDraft =
    draft !== null || moveDraft !== null || policyDraft !== null || collaborationDraft !== null;

  const activeProjectId = project?.id ?? selection.projectId;

  const projectArchived = project?.archivedAt != null;

  const canCreateProject = projects?.capabilities.canCreate === true && views.projects === 'active';

  const canCreatePrivate = projects?.capabilities.canCreatePrivate === true;

  const canCapture =
    taskSummary.canCreate &&
    project !== null &&
    !projectArchived &&
    project.capabilities.canEdit &&
    views.tasks === 'active' &&
    !blocked &&
    policyDraft === null &&
    moveDraft === null &&
    collaborationDraft === null &&
    (draft === null || draft.type === 'create-task');

  const readOnlyTasks =
    views.tasks === 'archived' || projectArchived || project?.capabilities.canEdit !== true;

  const filtersActive = Object.keys(taskView.filters).length > 0;

  const taskPageChanged = pageError?.collection === 'tasks' && pageError.reason === 'changed';

  const taskPagePartial = pageError?.collection === 'tasks' && pageError.reason !== 'changed';

  const pendingTaskId =
    movePending !== null ? (moveDraft?.taskId ?? moveRetryTarget?.taskId ?? null) : null;

  const moveSource = lastOutcomeSourceRef.current === 'move';

  const moveCommand: ProjectMoveCommand | null = moveDraft ?? moveRetryTarget;

  const moveTaskId =
    moveCommand?.taskId ??
    (moveSource && result !== null && isTaskResult(result) ? result.id : null) ??
    (moveNeedsDestination && conflict !== null && isTask(conflict) ? conflict.id : null);

  const moveRetryMatches =
    moveRetryTarget === null
      ? true
      : moveRetryTarget.workspaceId === selection.workspaceId &&
        moveRetryTarget.projectId === selection.projectId &&
        (selection.taskId === null || selection.taskId === moveRetryTarget.taskId);

  const moveDraftMatches =
    moveDraft === null
      ? true
      : moveDraft.workspaceId === selection.workspaceId &&
        moveDraft.projectId === selection.projectId &&
        (selection.taskId === null || selection.taskId === moveDraft.taskId);

  function findTaskById(taskId: string): Task | null {
    if (task?.id === taskId) return task;
    const listed = tasks?.items.find((item) => item.id === taskId);
    if (listed !== undefined) return listed;
    for (const page of Object.values(taskColumns)) {
      const found = page?.items.find((item) => item.id === taskId);
      if (found !== undefined) return found;
    }
    if (conflict !== null && isTask(conflict) && conflict.id === taskId) return conflict;
    if (result !== null && isTaskResult(result) && result.id === taskId) return result;
    return null;
  }

  function canMoveTask(target: Task): boolean {
    return (
      views.tasks === 'active' &&
      !projectArchived &&
      target.archivedAt === null &&
      target.capabilities.canEdit &&
      !blocked &&
      draft === null &&
      moveDraft === null &&
      policyDraft === null &&
      collaborationDraft === null &&
      !taskColumnsChanged &&
      !taskPageChanged &&
      taskColumnErrors[target.status] === undefined
    );
  }

  const canEditProject = project?.capabilities.canEdit === true && !projectArchived;

  const canArchiveProject = project?.capabilities.canArchive === true && !projectArchived;

  const canRestoreProject = project?.capabilities.canRestore === true && projectArchived;

  const canManageAccess = project?.capabilities.canManageAccess === true;

  const hasProjectActions =
    canManageAccess || canEditProject || canArchiveProject || canRestoreProject;

  const assigneeOptions: readonly DomainPerson[] = (() => {
    const list: DomainPerson[] = [];
    const seen = new Set<string>();
    for (const person of assignees?.items ?? []) {
      if (seen.has(person.principalId)) continue;
      seen.add(person.principalId);
      list.push(person);
    }
    const current = task?.assignee;
    if (current !== null && current !== undefined && !seen.has(current.principalId))
      list.push(current);
    return list;
  })();
  const {
    moveFocusId,
    setMoveFocusId,
    moveFocusCancelledRef,
    createFocusId,
    setCreateFocusId,
    taskRowIsCanonical,
    shouldRestoreMoveFocus,
    focusTask,
    focusMoveControl,
    focusViewBar,
  } = useTaskResultFocus({ taskColumns, taskView, tasks });
  const {
    drawerOpen,
    setDrawerOpen,
    captureFocusProjectId,
    setCaptureFocusProjectId,
    discoveryHeadingRef,
    discoveryReturnRef,
    sidebarRef,
    returnFocusRef,
    hadDetailRef,
    openDrawer,
    closeDrawer,
    selectTaskFromList,
    discoveryLink,
    openDiscoveryRow,
    changeDiscoveryScope,
    clearDiscoveryFilters,
    chooseProjectForCapture,
    openProject,
    toggleProjectsView,
    toggleTasksView,
  } = useProjectNavigationFocus({
    anyPending,
    discoveryProjectId,
    openDiscoveryTask,
    selectProject,
    selectTask,
    selection,
    setDiscoveryProject,
    setTaskFilters,
    setTaskScope,
    setView,
    views,
  });
  const {
    form,
    setForm,
    projectValue,
    taskValue,
    captureTitle,
    setCaptureTitle,
    captureStatus,
    setCaptureStatus,
    columnCaptureOpen,
    setColumnCaptureOpen,
    resumeDraftOnReady,
    setResumeDraftOnReady,
    resumeAccessOnReady,
    setResumeAccessOnReady,
    modalOpenerRef,
    dismissFocusPendingRef,
    resumeDraft,
    focusDismissedSurface,
    closeForm,
    openProjectCreate,
    openProjectSettings,
    openProjectAccess,
    openTaskEdit,
    requestProjectArchive,
    requestTaskArchive,
    stageProject,
    stageTask,
    stageCapture,
    beginColumnCapture,
    cancelColumnCapture,
    submitColumnCapture,
    submitProjectForm,
    submitTaskForm,
    submitCapture,
    confirmLifecycle,
    keepDraftAfterConflict,
    discardCurrentDraft,
    discardPolicyDraft,
    handlePolicyResume,
    handleReturnToDraft,
    resumeCurrentDraft,
    canResumeDraft,
    formAuthorized,
  } = useProjectContentForms({
    blocked,
    mutationPending,
    canArchiveProject,
    canCapture,
    canCreateProject,
    canEditProject,
    canManageAccess,
    canRestoreProject,
    captureRef,
    collaborationDraft,
    discardDraft,
    dismissOutcome,
    draft,
    focusViewBar,
    lastCommandRef,
    lastOutcomeSourceRef,
    moveDraft,
    policyDraft,
    policyRetryTarget,
    project,
    projectArchived,
    projectHeadingRef,
    projects,
    rebaseDraft,
    returnToDraft,
    selectTask,
    selection,
    setMoveFocusId,
    setMoveNotice,
    setView,
    stage,
    status,
    submit,
    task,
    taskView,
    tasks,
    views,
    workspace,
  });
  const detailOpen = task !== null && selection.taskId !== null;

  const overlayOpen = detailOverlay && detailOpen;

  function closeProjectOptions(event: ReactMouseEvent<HTMLElement>) {
    const details = event.currentTarget.closest('details');
    const summary = details?.querySelector<HTMLElement>('summary');
    details?.removeAttribute('open');
    summary?.focus();
  }

  function performMove(target: Task, status: TaskStatus, beforeTaskId: string | null = null) {
    if (!canMoveTask(target)) return;
    lastOutcomeSourceRef.current = 'move';
    setMoveNotice(null);
    moveFocusCancelledRef.current = false;
    setMoveFocusId(target.id);
    const reason = stageMove(target.id, status, beforeTaskId);
    if (reason !== 'ready') {
      setMoveFocusId(null);
      setMoveNotice({ reason, taskId: target.id });
      return;
    }
    void submit();
  }

  function performMoveBefore(target: Task, status: TaskStatus, beforeTaskId: string) {
    performMove(target, status, beforeTaskId);
  }

  function performMoveEnd(target: Task, status: TaskStatus) {
    performMove(target, status, null);
  }

  function moveCommandLabel(command: ProjectMoveCommand): string {
    const target = findTaskById(command.taskId);
    const taskLabel =
      target === null ? copy.move.selectedTask[lang] : `${target.key} · ${target.title}`;
    const placement =
      command.beforeTaskId === null
        ? copy.move.placementEnd[lang]
        : copy.move.placementBefore[lang];
    return `${taskLabel} → ${statusName(command.status)[lang]} · ${placement}`;
  }

  function moveConflictTarget(command: ProjectMoveCommand): string {
    const requested = `${copy.move.requestedTarget[lang]}: ${statusName(command.status)[lang]} · ${command.beforeTaskId === null ? copy.move.placementEnd[lang] : copy.move.placementBefore[lang]}`;
    if (conflict !== null && isTask(conflict)) {
      return `${requested} · ${copy.move.currentTarget[lang]}: ${conflict.key} · ${statusName(conflict.status)[lang]}`;
    }
    return requested;
  }

  function discardMove(focus: 'task' | 'view' = 'task') {
    const taskId = moveCommand?.taskId ?? moveFocusId;
    discardDraft();
    setMoveNotice(null);
    setMoveFocusId(null);
    if (focus === 'view') {
      void refresh();
      requestAnimationFrame(focusViewBar);
      return;
    }
    requestAnimationFrame(() => {
      if (taskId !== null && focusMoveControl(taskId)) return;
      focusViewBar();
    });
  }

  function refreshMove() {
    discardMove('view');
  }

  function retryMove() {
    lastOutcomeSourceRef.current = 'move';
    void retrySave();
  }

  function returnMove() {
    lastOutcomeSourceRef.current = 'move';
    void returnToDraft();
  }

  function resumeMove() {
    lastOutcomeSourceRef.current = 'move';
    if (moveDraft !== null) setMoveFocusId(moveDraft.taskId);
    void submit();
  }

  function closeCurrentTaskForMove() {
    const taskId = moveNotice?.taskId ?? null;
    setMoveNotice(null);
    void selectTask(null).then(() => {
      requestAnimationFrame(() => {
        if (taskId !== null && focusMoveControl(taskId)) return;
        focusViewBar();
      });
    });
  }

  function stageCollaboration(command: ProjectCommand) {
    lastOutcomeSourceRef.current = 'collaboration';
    stage(command);
  }

  function submitCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    void submit();
  }

  function retryCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    void retrySave();
  }

  function reloadCollaborationConflict() {
    lastOutcomeSourceRef.current = 'collaboration';
    void reloadConflict();
  }

  function discardCollaboration() {
    lastOutcomeSourceRef.current = 'collaboration';
    discardDraft();
  }

  function collabCommandLabel(command: ProjectCommand | null): string | null {
    if (command === null) return null;
    const action = copy.collaboration.activityActions[command.type];
    const label = action === undefined ? command.type : action[lang];
    if ('taskId' in command) {
      const target =
        task?.id === command.taskId
          ? task
          : tasks?.items.find((item) => item.id === command.taskId);
      return target === undefined || target === null
        ? label
        : `${copy.feedback.targetTask[lang]}: ${target.key} · ${label}`;
    }
    return label;
  }

  function stageVisibilityChange(visibility: ProjectVisibility) {
    if (!project || !canManageAccess || blocked || policyDraft !== null || moveDraft !== null)
      return;
    const command: ProjectPolicyCommand = {
      type: 'change-visibility',
      workspaceId: project.workspaceId,
      projectId: project.id,
      expectedVersion: projectAccess?.projectVersion ?? project.version,
      visibility,
    };
    lastPolicyCommandRef.current = command;
    lastOutcomeSourceRef.current = 'policy';
    stage(command);
  }

  function reviewAccess(member: ProjectAccessMember, state: 'active' | 'revoked') {
    if (!project || !canManageAccess || blocked || policyDraft !== null || moveDraft !== null)
      return;
    const command: ProjectPolicyCommand = {
      type: 'change-access',
      workspaceId: project.workspaceId,
      projectId: project.id,
      expectedVersion: projectAccess?.projectVersion ?? project.version,
      principalId: member.principalId,
      state,
    };
    lastPolicyCommandRef.current = command;
    lastPolicyMemberRef.current = member;
    lastOutcomeSourceRef.current = 'policy';
    stage(command);
  }

  function submitPolicy() {
    if (policyDraft === null || blocked || moveDraft !== null) return;
    lastOutcomeSourceRef.current = 'policy';
    void submit();
  }

  function retryPolicySave() {
    if (policyRetryTarget === null || policyPending !== null) return;
    lastOutcomeSourceRef.current = 'policy';
    void retrySave();
  }

  function rebasePolicyDraft() {
    lastOutcomeSourceRef.current = 'policy';
    rebaseDraft();
    requestAnimationFrame(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const target = dialog?.querySelector<HTMLElement>(
        '[data-access-confirm] h3, [data-access-confirm] [tabindex="-1"]',
      );
      target?.focus();
    });
  }

  const {
    policyMember,
    feedbackInDetail,
    moveFeedbackInDetail,
    feedbackInForm,
    feedbackNode,
    moveFeedbackNode,
    closeWarningNode,
    taskPageErrorBlock,
    policyFeedbackNode,
    draftBanner,
    draftInDetail,
    recoveryBlock,
    statusRecoveryBlock,
    pageErrorBlock,
  } = createProjectRecoveryView({
    status,
    canResumeDraft,
    focusDismissedSurface,
    accessConflict,
    acknowledgeClose,
    assigneeOptions,
    blocked,
    canCapture,
    captureStatus,
    closeCurrentTaskForMove,
    closeForm,
    closeWarning,
    collabCommandLabel,
    collaborationDraft,
    collaborationRetryTarget,
    columnCaptureOpen,
    conflict,
    detailOverlay,
    discardCollaboration,
    discardCurrentDraft,
    discardMove,
    discardPolicyDraft,
    dismissOutcome,
    dismissPageError,
    draft,
    draftGuard,
    findTaskById,
    focusViewBar,
    form,
    handlePolicyResume,
    handleReturnToDraft,
    keepDraftAfterConflict,
    lang,
    lastCommandRef,
    lastOutcomeSourceRef,
    lastPolicyCommandRef,
    lastPolicyMemberRef,
    loadMore,
    moveCommand,
    moveCommandLabel,
    moveConflictTarget,
    moveDraft,
    moveDraftMatches,
    moveNeedsDestination,
    moveNotice,
    movePending,
    moveRetryMatches,
    moveRetryTarget,
    moveSource,
    moveTaskId,
    mutationPending,
    outcome,
    pageError,
    pending,
    policyDraft,
    policyPending,
    policyRetryTarget,
    project,
    projectAccess,
    projects,
    rebasePolicyDraft,
    refresh,
    refreshMove,
    reloadConflict,
    result,
    resumeCurrentDraft,
    resumeMove,
    retryMove,
    retryPolicySave,
    retrySave,
    retryTarget,
    returnMove,
    returnToDraft,
    selectTask,
    selection,
    setMoveNotice,
    submit,
    task,
    taskView,
    tasks,
    views,
  });

  function resolveWorkspaceChoice(choice: 'stay' | 'discard') {
    if (choice === 'discard' && mutationPending !== null) return;
    void resolveWorkspaceNavigation(choice);
  }

  function renderTaskDetail() {
    if (task === null) return null;
    return (
      <div>
        <TaskDetail
          actionsDisabled={
            blocked || policyDraft !== null || moveDraft !== null || collaborationDraft !== null
          }
          backLabel={
            taskScope === 'mine'
              ? copy.discovery.backToMine
              : taskScope === 'search'
                ? copy.discovery.backToSearch
                : copy.common.backToProject
          }
          collaboration={
            <TaskCollaboration
              collaborationSource={lastOutcomeSourceRef.current === 'collaboration'}
              hook={{
                collaboration: projectTasks.collaboration,
                mutationPending: projectTasks.mutationPending,
                collaborationDraft: projectTasks.collaborationDraft,
                collaborationRetryTarget: projectTasks.collaborationRetryTarget,
                draftGuard: projectTasks.draftGuard,
                refresh: projectTasks.refresh,
                draft: projectTasks.draft,
                retryTarget: projectTasks.retryTarget,
                collaborationPending: projectTasks.collaborationPending,
                closeWarning: projectTasks.closeWarning,
                commentConflict: projectTasks.commentConflict,
                checklistConflict: projectTasks.checklistConflict,
                outcome: projectTasks.outcome,
                conflict: projectTasks.conflict,
                result: projectTasks.result,
                task: projectTasks.task,
                tasks: projectTasks.tasks,
                taskColumns: projectTasks.taskColumns,
                selectTask: projectTasks.selectTask,
                returnToDraft: projectTasks.returnToDraft,
                rebaseDraft: projectTasks.rebaseDraft,
                dismissOutcome: projectTasks.dismissOutcome,
                setParentCandidatesWanted: projectTasks.setParentCandidatesWanted,
                loadCollaborationMore: projectTasks.loadCollaborationMore,
              }}
              onDiscard={discardCollaboration}
              onReloadConflict={reloadCollaborationConflict}
              onRetry={retryCollaboration}
              onStage={stageCollaboration}
              onSubmit={submitCollaboration}
              projectArchived={projectArchived}
              task={task}
            />
          }
          description={
            task.description.length > 0 ? <TaskDescription source={task.description} /> : undefined
          }
          feedback={
            form === null &&
            (feedbackInDetail ||
              draftInDetail ||
              moveFeedbackInDetail ||
              closeWarningNode !== null) ? (
              <>
                {closeWarningNode}
                {draftInDetail ? draftBanner : null}
                {feedbackInDetail ? feedbackNode : null}
                {moveFeedbackInDetail ? moveFeedbackNode : null}
              </>
            ) : undefined
          }
          onArchive={(opener) => requestTaskArchive(false, task, opener)}
          onClose={() => {
            void setParentCandidatesWanted(false);
            if (taskScope === 'project') void selectTask(null);
            else void returnToDiscovery();
          }}
          onEdit={openTaskEdit}
          onRestore={(opener) => requestTaskArchive(true, task, opener)}
          modalOpen={form !== null}
          overlay={detailOverlay}
          projectArchived={projectArchived}
          task={task}
        />
      </div>
    );
  }

  const projectList = projects?.items ?? [];

  const taskList = tasks?.items ?? [];

  const isArchivedProjects = views.projects === 'archived';

  const isArchivedTasks = views.tasks === 'archived';

  const hasWorkspace = workspace !== null || (workspaces?.items.length ?? 0) > 0;

  const discoveryProjectName =
    discoveryProjectId === null
      ? null
      : (discovery.page?.items.find((item) => item.projectId === discoveryProjectId)?.projectName ??
        null);
  useProjectInteractionEffects({
    captureFocusProjectId,
    captureRef,
    closeDrawer,
    createFocusId,
    discoveryFocusTaskId,
    discoveryHeadingRef,
    discoveryReturnRef,
    dismissFocusPendingRef,
    draft,
    drawerOpen,
    focusDismissedSurface,
    focusTask,
    focusViewBar,
    form,
    formAuthorized,
    hadDetailRef,
    lastCommandRef,
    modalOpenerRef,
    moveDraft,
    moveFocusCancelledRef,
    moveFocusId,
    movePending,
    moveRetryTarget,
    outcome,
    overlayOpen,
    policyDraft,
    policyRetryTarget,
    project,
    projectHeadingRef,
    resolveWorkspaceNavigation,
    result,
    resumeAccessOnReady,
    resumeDraft,
    resumeDraftOnReady,
    returnFocusRef,
    selection,
    setCaptureFocusProjectId,
    setCaptureStatus,
    setCaptureTitle,
    setColumnCaptureOpen,
    setCreateFocusId,
    setDrawerOpen,
    setForm,
    setMoveFocusId,
    setMoveNotice,
    setResumeAccessOnReady,
    setResumeDraftOnReady,
    shouldRestoreMoveFocus,
    sidebarDrawer,
    sidebarRef,
    status,
    task,
    taskColumns,
    taskRowIsCanonical,
    taskScope,
    taskView,
    tasks,
    views,
    workspaceNavigation,
  });

  return renderProjectShell({
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
    workArea: renderProjectWorkArea({
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
      statusRecoveryBlock,
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
    }),
    dialogs: renderProjectDialogs({
      status,
      anyPending,
      assigneeOptions,
      assignees,
      canCreatePrivate,
      closeForm,
      closeWarningNode,
      confirmLifecycle,
      discardCurrentDraft,
      discardDraft,
      feedbackNode,
      form,
      formAuthorized,
      lang,
      loadMore,
      mutationPending,
      outcome,
      pageError,
      pageErrorBlock,
      pending,
      policyBlocked,
      policyDraft,
      policyFeedbackNode,
      policyMember,
      policyPageErrors,
      policyPending,
      policyRetryTarget,
      project,
      projectAccess,
      projectValue,
      refresh,
      resolveWorkspaceChoice,
      retryTarget,
      reviewAccess,
      stageProject,
      stageTask,
      stageVisibilityChange,
      submitPolicy,
      submitProjectForm,
      submitTaskForm,
      taskValue,
      workspaceNavigation,
      workspaces,
    }),
  });
}
