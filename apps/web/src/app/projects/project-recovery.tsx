'use client';
import type { Dispatch, SetStateAction, RefObject, ReactNode } from 'react';
import {
  isTask,
  isProject,
  type Task,
  type TaskStatus,
  type ProjectCommand,
  type ProjectTaskCommand,
  type ProjectPolicyCommand,
  type ProjectMoveCommand,
  type TaskCollaborationCommand,
  type ProjectAccessMember,
  type DomainPerson,
  type ProjectTaskResult,
} from '@rielia/contracts';
import type { MoveEligibility, ProjectTaskState } from '../../lib/project-task-controller';
import {
  taskFields,
  commandMatches,
  isTaskResult,
  isProjectResult,
  pendingCopy,
  successCopy,
  type FormState,
} from './project-content-model';
import {
  copy,
  statusName,
  priorityName,
  typeName,
  visibilityName,
  formatDateOnly,
  type Bilingual,
  type Lang,
} from './strings';
import { ConflictPanel, FeedbackPanel, type ConflictFieldView } from './feedback';
import { projectPolicyConflictFields } from './project-access';
import styles from './projects.module.css';
export interface ProjectRecoveryPorts {
  accessConflict: ProjectTaskState['accessConflict'];
  acknowledgeClose: () => void;
  assigneeOptions: readonly DomainPerson[];
  blocked: boolean;
  canCapture: boolean;
  canResumeDraft: boolean;
  focusDismissedSurface: (hadForm: boolean) => void;
  status: ProjectTaskState['status'];
  captureStatus: TaskStatus;
  closeCurrentTaskForMove: () => void;
  closeForm: () => void;
  closeWarning: ProjectTaskState['closeWarning'];
  collabCommandLabel: (command: ProjectCommand | null) => string | null;
  collaborationDraft: TaskCollaborationCommand | null;
  collaborationRetryTarget: TaskCollaborationCommand | null;
  columnCaptureOpen: boolean;
  conflict: ProjectTaskState['conflict'];
  detailOverlay: boolean;
  discardCollaboration: () => void;
  discardCurrentDraft: () => void;
  discardMove: (focus?: 'task' | 'view') => void;
  discardPolicyDraft: () => void;
  dismissOutcome: () => void;
  dismissPageError: () => void;
  draft: ProjectTaskCommand | null;
  draftGuard: ProjectTaskState['draftGuard'];
  findTaskById: (taskId: string) => Task | null;
  focusViewBar: () => void;
  form: FormState | null;
  handlePolicyResume: () => void;
  handleReturnToDraft: () => void;
  keepDraftAfterConflict: () => void;
  lang: Lang;
  lastCommandRef: RefObject<ProjectTaskCommand | null>;
  lastOutcomeSourceRef: RefObject<'content' | 'policy' | 'move' | 'collaboration'>;
  lastPolicyCommandRef: RefObject<ProjectPolicyCommand | null>;
  lastPolicyMemberRef: RefObject<ProjectAccessMember | null>;
  loadMore: (
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees',
  ) => Promise<void>;
  moveCommand: ProjectMoveCommand | null;
  moveCommandLabel: (command: ProjectMoveCommand) => string;
  moveConflictTarget: (command: ProjectMoveCommand) => string;
  moveDraft: ProjectMoveCommand | null;
  moveDraftMatches: boolean;
  moveNeedsDestination: ProjectTaskState['moveNeedsDestination'];
  moveNotice: { reason: Exclude<MoveEligibility, 'ready'>; taskId: string } | null;
  movePending: 'move-task' | null;
  moveRetryMatches: boolean;
  moveRetryTarget: ProjectMoveCommand | null;
  moveSource: boolean;
  moveTaskId: string | null;
  mutationPending: ProjectCommand['type'] | null;
  outcome: ProjectTaskState['outcome'];
  pageError: {
    collection: 'workspaces' | 'members' | 'projects' | 'tasks';
    requestId: string | null;
    reason?: 'changed';
  } | null;
  pending: ProjectTaskCommand['type'] | null;
  policyDraft: ProjectPolicyCommand | null;
  policyPending: ProjectPolicyCommand['type'] | null;
  policyRetryTarget: ProjectPolicyCommand | null;
  project: ProjectTaskState['project'];
  projectAccess: ProjectTaskState['projectAccess'];
  projects: ProjectTaskState['projects'];
  rebasePolicyDraft: () => void;
  refresh: () => Promise<void>;
  refreshMove: () => void;
  reloadConflict: () => Promise<void>;
  result: ProjectTaskState['result'];
  resumeCurrentDraft: () => void;
  resumeMove: () => void;
  retryMove: () => void;
  retryPolicySave: () => void;
  retrySave: () => Promise<void>;
  retryTarget: ProjectTaskCommand | null;
  returnMove: () => void;
  returnToDraft: () => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  selection: ProjectTaskState['selection'];
  setMoveNotice: Dispatch<
    SetStateAction<{
      reason: Exclude<MoveEligibility, 'ready'>;
      taskId: string;
    } | null>
  >;

  submit: () => Promise<void>;
  task: ProjectTaskState['task'];
  taskView: ProjectTaskState['taskView'];
  tasks: ProjectTaskState['tasks'];
  views: ProjectTaskState['views'];
}

export function createProjectRecoveryView({
  accessConflict,
  acknowledgeClose,
  assigneeOptions,
  blocked,
  canCapture,
  canResumeDraft,
  focusDismissedSurface,
  status,
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
}: ProjectRecoveryPorts) {
  function commandLabel(command: ProjectTaskCommand): string {
    if (command.type === 'create-project')
      return `${copy.feedback.targetProject[lang]}: ${command.name}`;
    if (
      command.type === 'edit-project' ||
      command.type === 'archive-project' ||
      command.type === 'restore-project'
    ) {
      const name =
        project?.id === command.projectId
          ? project.name
          : (projects?.items.find((item) => item.id === command.projectId)?.name ??
            command.projectId);
      return `${copy.feedback.targetProject[lang]}: ${name}`;
    }
    if (command.type === 'create-task')
      return `${copy.feedback.targetTask[lang]}: ${command.fields.title}`;
    if (!('taskId' in command)) return `${copy.feedback.targetProject[lang]}: ${command.projectId}`;
    const target =
      task?.id === command.taskId ? task : tasks?.items.find((item) => item.id === command.taskId);
    const label = target?.key ?? command.taskId;
    return `${copy.feedback.targetTask[lang]}: ${label}`;
  }

  function resultLabel(value: ProjectTaskResult | null): string | null {
    if (value === null) return null;
    if (isProjectResult(value))
      return `${copy.feedback.targetProject[lang]}: ${value.key} · ${value.name}`;
    return `${copy.feedback.targetTask[lang]}: ${value.key} · ${value.title}`;
  }

  function conflictFields(): ConflictFieldView[] {
    if (draft === null || conflict === null) return [];
    if (draft.type === 'edit-task' && isTask(conflict)) {
      const currentFields = taskFields(conflict);
      const nextFields = { ...currentFields, ...draft.fields };
      const assigneeName = (person: DomainPerson | null) =>
        person === null ? copy.task.unassigned[lang] : person.name;
      const pair = (
        key: string,
        label: Bilingual,
        current: string,
        next: string,
      ): ConflictFieldView => ({
        key,
        label: label[lang],
        current,
        draft: next,
        changed: current !== next,
      });
      return [
        pair('title', copy.task.titleLabel, currentFields.title, nextFields.title),
        pair(
          'description',
          copy.task.descriptionLabel,
          currentFields.description,
          nextFields.description,
        ),
        pair(
          'status',
          copy.task.statusLabel,
          statusName(currentFields.status)[lang],
          statusName(nextFields.status)[lang],
        ),
        pair(
          'type',
          copy.task.typeLabel,
          typeName(currentFields.type)[lang],
          typeName(nextFields.type)[lang],
        ),
        pair(
          'priority',
          copy.task.priorityLabel,
          priorityName(currentFields.priority)[lang],
          priorityName(nextFields.priority)[lang],
        ),
        pair(
          'assignee',
          copy.task.assigneeLabel,
          assigneeName(conflict.assignee),
          conflict.assigneePrincipalId === nextFields.assigneePrincipalId
            ? assigneeName(conflict.assignee)
            : nextFields.assigneePrincipalId === null
              ? copy.task.unassigned[lang]
              : (assigneeOptions.find(
                  (member) => member.principalId === nextFields.assigneePrincipalId,
                )?.name ?? nextFields.assigneePrincipalId),
        ),
        pair(
          'due',
          copy.task.dueDateLabel,
          formatDateOnly(currentFields.dueDate, lang) || copy.task.noDueDate[lang],
          formatDateOnly(nextFields.dueDate, lang) || copy.task.noDueDate[lang],
        ),
      ];
    }
    if (draft.type === 'edit-project' && isProject(conflict)) {
      return [
        {
          key: 'name',
          label: copy.project.nameLabel[lang],
          current: conflict.name,
          draft: draft.name,
          changed: conflict.name !== draft.name,
        },
        {
          key: 'description',
          label: copy.project.descriptionLabel[lang],
          current: conflict.description,
          draft: draft.description,
          changed: conflict.description !== draft.description,
        },
      ];
    }
    return [];
  }

  function policyMemberFor(principalId: string | null): ProjectAccessMember | null {
    if (principalId === null) return null;
    const fromPage =
      projectAccess?.items.find((member) => member.principalId === principalId) ?? null;
    if (fromPage !== null) return fromPage;
    if (accessConflict !== null && accessConflict.principalId === principalId)
      return accessConflict;
    const remembered = lastPolicyMemberRef.current;
    return remembered !== null && remembered.principalId === principalId ? remembered : null;
  }

  function policyCommandLabel(command: ProjectPolicyCommand | null): string | null {
    if (command === null) return null;
    if (command.type === 'change-visibility') {
      return `${copy.access.targetVisibility[lang]}: ${visibilityName(command.visibility)[lang]}`;
    }
    const member = policyMemberFor(command.principalId);
    return `${copy.access.targetMember[lang]}: ${member?.name ?? copy.access.selectedMember[lang]}`;
  }

  const policyMember =
    policyDraft?.type === 'change-access' ? policyMemberFor(policyDraft.principalId) : null;

  const policySource = lastOutcomeSourceRef.current === 'policy';

  const policyMatches =
    policyDraft !== null &&
    policyDraft.workspaceId === selection.workspaceId &&
    policyDraft.projectId === selection.projectId;

  const showPolicyBanner =
    policyDraft !== null && form === null && outcome === null && policyRetryTarget === null;

  const draftMatches = draft === null ? true : commandMatches(draft, selection);

  const retryMatches = retryTarget === null ? true : commandMatches(retryTarget, selection);

  const draftVisibleInCapture =
    draft?.type === 'create-task' &&
    draft.projectId === selection.projectId &&
    views.tasks === 'active' &&
    canCapture &&
    form === null &&
    (taskView.layout === 'list' ||
      (columnCaptureOpen &&
        captureStatus === (draft.fields.status ?? 'backlog') &&
        (taskView.filters.status === undefined || taskView.filters.status === captureStatus)));

  const showDraftBanner =
    draft !== null &&
    form === null &&
    retryTarget === null &&
    !draftVisibleInCapture &&
    outcome !== 'forbidden';

  const taskFeedbackId =
    outcome === 'success' && result !== null && isTaskResult(result)
      ? result.id
      : retryTarget !== null && 'taskId' in retryTarget
        ? retryTarget.taskId
        : conflict !== null && isTask(conflict)
          ? conflict.id
          : draft !== null && 'taskId' in draft
            ? draft.taskId
            : pending !== null &&
                lastCommandRef.current !== null &&
                'taskId' in lastCommandRef.current
              ? lastCommandRef.current.taskId
              : null;

  const feedbackInDetail = task !== null && taskFeedbackId === task.id;

  const moveFeedbackInDetail = task !== null && moveTaskId === task.id;

  const feedbackInForm = form !== null;

  const feedbackNode: ReactNode = (() => {
    if ((policySource || moveSource) && outcome !== null) return null;
    if (closeWarning !== null || lastOutcomeSourceRef.current === 'collaboration') return null;
    if (pending !== null) {
      const command = draft ?? lastCommandRef.current;
      return (
        <FeedbackPanel
          busy
          target={command === null ? null : commandLabel(command)}
          title={pendingCopy(pending)}
          tone="info"
        />
      );
    }
    if (outcome === 'success') {
      return (
        <FeedbackPanel
          actions={
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          }
          autoFocus
          target={resultLabel(result)}
          title={
            lastCommandRef.current === null
              ? copy.feedback.saved
              : successCopy(lastCommandRef.current.type)
          }
          tone="success"
        />
      );
    }
    if (outcome === 'conflict' && conflict !== null) {
      const fields = conflictFields();
      if (fields.length > 0) {
        return (
          <ConflictPanel
            actions={
              <>
                {draft !== null && 'expectedVersion' in draft && (
                  <button
                    className={styles.secondary}
                    onClick={keepDraftAfterConflict}
                    type="button"
                  >
                    {copy.feedback.conflictKeepDraft[lang]}
                  </button>
                )}
                <button
                  className={styles.ghostButton}
                  onClick={() => {
                    discardCurrentDraft();
                    void refresh();
                  }}
                  type="button"
                >
                  {copy.feedback.discard[lang]}
                </button>
              </>
            }
            body={copy.feedback.conflictBody}
            currentLabel={copy.feedback.conflictCurrentLabel}
            draftLabel={copy.feedback.conflictDraftLabel}
            fields={fields}
            title={copy.feedback.conflictTitle}
          />
        );
      }
      return (
        <FeedbackPanel
          actions={
            <>
              <button
                className={styles.secondary}
                onClick={() => {
                  void reloadConflict();
                }}
                type="button"
              >
                {copy.feedback.conflictReview[lang]}
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => {
                  discardCurrentDraft();
                  void refresh();
                }}
                type="button"
              >
                {copy.feedback.discard[lang]}
              </button>
            </>
          }
          body={copy.feedback.conflictBody}
          target={resultLabel(conflict)}
          title={copy.feedback.conflictTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden') {
      return (
        <FeedbackPanel
          actions={
            <>
              {canResumeDraft && (
                <button className={styles.secondary} onClick={resumeCurrentDraft} type="button">
                  {copy.feedback.draftReturn[lang]}
                </button>
              )}
              <button
                className={styles.secondary}
                onClick={() => {
                  void refresh();
                }}
                type="button"
              >
                {copy.common.refresh[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.deniedDraftBody}
          title={copy.feedback.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.invalidBody}
          target={draft === null ? null : commandLabel(draft)}
          title={copy.feedback.invalidTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error' && retryTarget !== null) {
      return (
        <FeedbackPanel
          actions={
            <>
              {retryMatches ? (
                <button
                  className={styles.primary}
                  disabled={pending !== null}
                  onClick={() => {
                    lastCommandRef.current = retryTarget;
                    void retrySave();
                  }}
                  type="button"
                >
                  {copy.feedback.retrySame[lang]}
                </button>
              ) : (
                <button className={styles.primary} onClick={handleReturnToDraft} type="button">
                  {copy.feedback.draftContextReturn[lang]}
                </button>
              )}
              <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          }
          autoFocus
          body={copy.feedback.unknownBody}
          target={commandLabel(retryTarget)}
          title={copy.feedback.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {draft !== null && (
                <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.errorBody}
          title={copy.feedback.errorTitle}
          tone="danger"
        />
      );
    }
    return null;
  })();

  const moveNoticeNode: ReactNode =
    moveNotice === null ? null : (
      <FeedbackPanel
        actions={
          <>
            {moveNotice.reason === 'different-detail' && (
              <button className={styles.secondary} onClick={closeCurrentTaskForMove} type="button">
                {copy.move.closeCurrentTask[lang]}
              </button>
            )}
            {(moveNotice.reason === 'changed' || moveNotice.reason === 'unavailable') && (
              <button
                className={styles.secondary}
                onClick={() => {
                  setMoveNotice(null);
                  void refresh();
                  requestAnimationFrame(focusViewBar);
                }}
                type="button"
              >
                {copy.common.refresh[lang]}
              </button>
            )}
            <button
              className={styles.ghostButton}
              onClick={() => setMoveNotice(null)}
              type="button"
            >
              {copy.common.dismiss[lang]}
            </button>
          </>
        }
        autoFocus
        body={copy.move.blockedReasons[moveNotice.reason]}
        target={findTaskById(moveNotice.taskId)?.key ?? copy.move.selectedTask[lang]}
        title={copy.move.blockedTitle}
        tone="warning"
      />
    );

  const moveFeedbackNode: ReactNode = (() => {
    if (closeWarning !== null) return null;
    if (movePending !== null) {
      return (
        <FeedbackPanel
          busy
          target={moveCommand === null ? null : moveCommandLabel(moveCommand)}
          title={copy.move.pendingTitle}
          tone="info"
        />
      );
    }
    if (moveSource && outcome === 'success' && result !== null && isTaskResult(result)) {
      return (
        <FeedbackPanel
          actions={
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          }
          target={resultLabel(result)}
          title={copy.move.successTitle}
          tone="success"
        />
      );
    }
    if (moveNeedsDestination && moveDraft !== null) {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
              <button className={styles.ghostButton} onClick={refreshMove} type="button">
                {copy.common.refresh[lang]}
              </button>
            </>
          }
          autoFocus
          body={copy.move.conflictBody}
          target={moveConflictTarget(moveDraft)}
          title={copy.move.conflictTitle}
          tone="warning"
        />
      );
    }
    if (moveDraft !== null && outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
              <button className={styles.ghostButton} onClick={refreshMove} type="button">
                {copy.common.refresh[lang]}
              </button>
            </>
          }
          autoFocus
          body={copy.move.invalidBody}
          target={moveCommandLabel(moveDraft)}
          title={copy.move.invalidTitle}
          tone="warning"
        />
      );
    }
    if (moveRetryTarget !== null && outcome === 'error') {
      return (
        <FeedbackPanel
          actions={
            <>
              {moveRetryMatches ? (
                <button className={styles.primary} onClick={retryMove} type="button">
                  {copy.feedback.retrySame[lang]}
                </button>
              ) : (
                <button className={styles.primary} onClick={returnMove} type="button">
                  {copy.move.returnToMove[lang]}
                </button>
              )}
              <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
            </>
          }
          autoFocus
          body={copy.move.unknownBody}
          target={moveCommandLabel(moveRetryTarget)}
          title={copy.move.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden' && (moveSource || moveDraft !== null)) {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.close[lang]}
              </button>
              {moveDraft !== null && (
                <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                  {copy.move.discard[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.move.forbiddenBody}
          target={moveCommand === null ? null : moveCommandLabel(moveCommand)}
          title={copy.move.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (moveSource && outcome === 'error') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {moveDraft !== null && (
                <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                  {copy.move.discard[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.move.errorBody}
          title={copy.move.errorTitle}
          tone="danger"
        />
      );
    }
    if (
      moveDraft !== null &&
      outcome === null &&
      movePending === null &&
      moveRetryTarget === null
    ) {
      return (
        <FeedbackPanel
          actions={
            <>
              <button
                className={styles.secondary}
                onClick={moveDraftMatches ? resumeMove : returnMove}
                type="button"
              >
                {moveDraftMatches ? copy.feedback.draftReturn[lang] : copy.move.returnToMove[lang]}
              </button>
              <button className={styles.ghostButton} onClick={() => discardMove()} type="button">
                {copy.move.discard[lang]}
              </button>
            </>
          }
          body={copy.move.draftBody}
          target={moveCommandLabel(moveDraft)}
          title={copy.move.draftTitle}
          tone={moveDraftMatches ? 'info' : 'warning'}
        />
      );
    }
    return null;
  })();

  const closeWarningNode: ReactNode =
    closeWarning === null ? null : (
      <FeedbackPanel
        actions={
          <>
            <button
              className={styles.primary}
              disabled={mutationPending !== null}
              onClick={() => {
                lastOutcomeSourceRef.current = moveDraft !== null ? 'move' : 'content';
                acknowledgeClose();
                void submit();
              }}
              type="button"
            >
              {copy.collaboration.closeWarningConfirm[lang]}
            </button>
            <button
              className={styles.ghostButton}
              disabled={mutationPending !== null}
              onClick={discardCurrentDraft}
              type="button"
            >
              {copy.collaboration.closeWarningCancel[lang]}
            </button>
          </>
        }
        autoFocus
        body={{
          es: copy.collaboration.closeWarningBody.es(closeWarning.open, closeWarning.archivedOpen),
          en: copy.collaboration.closeWarningBody.en(closeWarning.open, closeWarning.archivedOpen),
        }}
        target={(() => {
          const target = conflict !== null && isTask(conflict) ? conflict : task;
          const status =
            draft !== null && draft.type === 'edit-task'
              ? (draft.fields.status ?? null)
              : (moveDraft?.status ?? null);
          if (target === null) return null;
          return `${target.key} · ${status === null ? copy.common.task[lang] : statusName(status)[lang]}`;
        })()}
        title={copy.collaboration.closeWarningTitle}
        tone="warning"
      />
    );

  const taskPageErrorBlock: ReactNode =
    pageError?.collection !== 'tasks' ? null : (
      <FeedbackPanel
        actions={
          pageError.reason === 'changed' ? (
            <button
              className={styles.secondary}
              disabled={blocked}
              onClick={() => {
                void refresh();
              }}
              type="button"
            >
              {copy.common.refresh[lang]}
            </button>
          ) : (
            <>
              <button
                className={styles.secondary}
                disabled={blocked}
                onClick={() => {
                  void loadMore('tasks');
                }}
                type="button"
              >
                {copy.feedback.pageErrorRetry[lang]}
              </button>
              <button className={styles.ghostButton} onClick={dismissPageError} type="button">
                {copy.common.dismiss[lang]}
              </button>
            </>
          )
        }
        body={
          pageError.reason === 'changed'
            ? copy.taskView.listChangedBody
            : copy.feedback.pageErrorBody
        }
        target={copy.feedback.pageErrorTargets.tasks[lang]}
        title={
          pageError.reason === 'changed'
            ? copy.taskView.listChangedTitle
            : copy.feedback.pageErrorTitle
        }
        tone="warning"
      />
    );

  const policyFeedbackNode: ReactNode = (() => {
    if (policyPending !== null) {
      return (
        <FeedbackPanel
          busy
          target={policyCommandLabel(policyDraft ?? lastPolicyCommandRef.current)}
          title={
            policyPending === 'change-visibility'
              ? copy.access.changingVisibility
              : copy.access.changingAccess
          }
          tone="info"
        />
      );
    }
    if (!policySource) return null;
    if (outcome === 'success') {
      const command = lastPolicyCommandRef.current;
      const member = lastPolicyMemberRef.current;
      const title =
        command?.type === 'change-access'
          ? command.state === 'active'
            ? copy.access.successGrant
            : copy.access.successRevoke
          : copy.access.successVisibility;
      const body =
        command?.type === 'change-access' && member !== null
          ? command.state === 'revoked'
            ? member.implicitAccess
              ? copy.access.successAdminRetained
              : project?.visibility === 'workspace' && member.active
                ? copy.access.successWorkspaceRetained
                : undefined
            : member.implicitAccess
              ? copy.access.successAdminGranted
              : project?.visibility === 'workspace'
                ? copy.access.successWorkspaceGranted
                : undefined
          : undefined;
      return (
        <FeedbackPanel
          actions={
            <button className={styles.secondary} onClick={dismissOutcome} type="button">
              {copy.common.dismiss[lang]}
            </button>
          }
          autoFocus
          {...(body !== undefined ? { body } : {})}
          target={policyCommandLabel(command)}
          title={title}
          tone="success"
        />
      );
    }
    if (outcome === 'conflict' && policyDraft !== null) {
      if (conflict === null || !isProject(conflict)) {
        return (
          <FeedbackPanel
            actions={
              <>
                <button
                  className={styles.secondary}
                  onClick={() => {
                    void reloadConflict();
                  }}
                  type="button"
                >
                  {policyDraft.type === 'change-access'
                    ? copy.access.reviewAccess[lang]
                    : copy.feedback.conflictReview[lang]}
                </button>
                <button
                  className={styles.ghostButton}
                  onClick={() => {
                    discardPolicyDraft();
                    void refresh();
                  }}
                  type="button"
                >
                  {copy.feedback.discard[lang]}
                </button>
              </>
            }
            body={copy.access.conflictMissingCurrent}
            target={policyCommandLabel(policyDraft)}
            title={copy.feedback.conflictTitle}
            tone="warning"
          />
        );
      }
      const archivedConflict = conflict.archivedAt !== null;
      const needsReview =
        policyDraft.type === 'change-access' &&
        (accessConflict === null || accessConflict.principalId !== policyDraft.principalId);
      const fields = needsReview
        ? []
        : projectPolicyConflictFields(conflict, policyDraft, accessConflict, lang);
      const rebaseAllowed =
        policyDraft.type === 'change-access'
          ? policyDraft.state === 'revoked' || !archivedConflict
          : !archivedConflict;
      const reviewAllowed = policyDraft.type === 'change-access' || !archivedConflict;
      const title =
        policyDraft.type === 'change-access'
          ? copy.access.conflictAccessTitle
          : copy.feedback.conflictTitle;
      const body =
        policyDraft.type === 'change-access'
          ? copy.access.conflictAccessBody
          : copy.feedback.conflictBody;
      if (fields.length > 0) {
        return (
          <ConflictPanel
            actions={
              <>
                {rebaseAllowed && (
                  <button className={styles.secondary} onClick={rebasePolicyDraft} type="button">
                    {copy.feedback.conflictKeepDraft[lang]}
                  </button>
                )}
                <button
                  className={styles.ghostButton}
                  onClick={() => {
                    discardPolicyDraft();
                    void refresh();
                  }}
                  type="button"
                >
                  {copy.feedback.discard[lang]}
                </button>
              </>
            }
            body={body}
            currentLabel={copy.feedback.conflictCurrentLabel}
            draftLabel={copy.feedback.conflictDraftLabel}
            fields={fields}
            title={title}
          />
        );
      }
      return (
        <FeedbackPanel
          actions={
            <>
              {reviewAllowed && (
                <button
                  className={styles.secondary}
                  onClick={() => {
                    void reloadConflict();
                  }}
                  type="button"
                >
                  {policyDraft.type === 'change-access'
                    ? copy.access.reviewAccess[lang]
                    : copy.feedback.conflictReview[lang]}
                </button>
              )}
              <button
                className={styles.ghostButton}
                onClick={() => {
                  discardPolicyDraft();
                  void refresh();
                }}
                type="button"
              >
                {copy.feedback.discard[lang]}
              </button>
            </>
          }
          body={needsReview ? copy.access.conflictMissingTarget : body}
          target={policyCommandLabel(policyDraft)}
          title={title}
          tone="warning"
        />
      );
    }
    if (outcome === 'forbidden') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button
                className={styles.secondary}
                onClick={() => {
                  dismissOutcome();
                  closeForm();
                }}
                type="button"
              >
                {copy.common.close[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.forbiddenBody}
          target={policyDraft === null ? null : policyCommandLabel(policyDraft)}
          title={copy.feedback.forbiddenTitle}
          tone="danger"
        />
      );
    }
    if (outcome === 'invalid') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.invalidBody}
          target={policyDraft === null ? null : policyCommandLabel(policyDraft)}
          title={copy.feedback.invalidTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error' && policyRetryTarget !== null) {
      const policyRetryMatches =
        policyRetryTarget.workspaceId === selection.workspaceId &&
        policyRetryTarget.projectId === selection.projectId;
      return (
        <FeedbackPanel
          actions={
            <>
              {policyRetryMatches ? (
                <button className={styles.primary} onClick={retryPolicySave} type="button">
                  {copy.feedback.retrySame[lang]}
                </button>
              ) : (
                <button className={styles.primary} onClick={handlePolicyResume} type="button">
                  {copy.access.returnToChange[lang]}
                </button>
              )}
              <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                {copy.feedback.discard[lang]}
              </button>
            </>
          }
          autoFocus
          body={copy.feedback.unknownBody}
          target={policyCommandLabel(policyRetryTarget)}
          title={copy.feedback.unknownTitle}
          tone="warning"
        />
      );
    }
    if (outcome === 'error') {
      return (
        <FeedbackPanel
          actions={
            <>
              <button className={styles.secondary} onClick={dismissOutcome} type="button">
                {copy.common.dismiss[lang]}
              </button>
              {policyDraft !== null && (
                <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
                  {copy.common.discardDraft[lang]}
                </button>
              )}
            </>
          }
          autoFocus
          body={copy.feedback.errorBody}
          title={copy.feedback.errorTitle}
          tone="danger"
        />
      );
    }
    return null;
  })();

  const policyDraftBanner: ReactNode =
    showPolicyBanner && policyDraft !== null ? (
      <FeedbackPanel
        actions={
          <>
            <button className={styles.secondary} onClick={handlePolicyResume} type="button">
              {copy.access.draftResume[lang]}
            </button>
            <button className={styles.ghostButton} onClick={discardPolicyDraft} type="button">
              {copy.common.discardDraft[lang]}
            </button>
          </>
        }
        body={copy.access.draftBody}
        target={policyCommandLabel(policyDraft)}
        title={copy.access.draftTitle}
        tone={policyMatches ? 'info' : 'warning'}
      />
    ) : null;

  const draftBanner: ReactNode =
    showDraftBanner && draft !== null ? (
      <FeedbackPanel
        actions={
          <>
            <button
              className={styles.secondary}
              disabled={draftMatches && !canResumeDraft}
              onClick={resumeCurrentDraft}
              type="button"
            >
              {draftMatches
                ? copy.feedback.draftReturn[lang]
                : copy.feedback.draftContextReturn[lang]}
            </button>
            <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
              {copy.common.discardDraft[lang]}
            </button>
          </>
        }
        body={
          draftMatches && !canResumeDraft
            ? copy.feedback.deniedDraftBody
            : draftMatches
              ? copy.feedback.draftBody
              : copy.feedback.draftContextBody
        }
        target={draftMatches && !canResumeDraft ? null : commandLabel(draft)}
        title={draftMatches ? copy.feedback.draftTitle : copy.feedback.draftContextTitle}
        tone={draftMatches ? 'info' : 'warning'}
      />
    ) : null;

  const draftInDetail =
    task !== null &&
    draftBanner !== null &&
    (detailOverlay || (draft?.type === 'edit-task' && draft.taskId === task.id));

  const collabGlobalChild =
    draft?.type === 'create-task' && draft.fields.parentTaskId !== undefined ? draft : null;

  const collabGlobalChildRetry =
    retryTarget?.type === 'create-task' && retryTarget.fields.parentTaskId !== undefined
      ? retryTarget
      : null;

  const collabGlobalCommand =
    collaborationRetryTarget ?? collabGlobalChildRetry ?? collaborationDraft ?? collabGlobalChild;

  const collabGlobalParentId =
    collabGlobalChild?.fields.parentTaskId ?? collabGlobalChildRetry?.fields.parentTaskId ?? null;

  const collabGlobalBanner =
    collabGlobalCommand !== null && task === null ? (
      <FeedbackPanel
        actions={
          <>
            {(draftGuard.canReturn || collabGlobalParentId !== null) && (
              <button
                className={styles.secondary}
                onClick={() => {
                  if (collabGlobalParentId !== null) void selectTask(collabGlobalParentId);
                  else void returnToDraft();
                }}
                type="button"
              >
                {copy.collaboration.draftReturn[lang]}
              </button>
            )}
            {draftGuard.canDiscard && (
              <button className={styles.ghostButton} onClick={discardCollaboration} type="button">
                {copy.collaboration.draftDiscard[lang]}
              </button>
            )}
          </>
        }
        body={copy.collaboration.draftBody}
        target={collabCommandLabel(collabGlobalCommand)}
        title={copy.collaboration.draftTitle}
        tone="warning"
      />
    ) : null;

  const recoveryBlock = (
    <>
      {task === null ? closeWarningNode : null}
      {collabGlobalBanner}
      {moveNoticeNode}
      {moveFeedbackInDetail ? null : moveFeedbackNode}
      {draftInDetail ? null : draftBanner}
      {policyDraftBanner}
      {feedbackInDetail ? null : feedbackNode}
      {form === null ? policyFeedbackNode : null}
    </>
  );

  const statusRecoveryBlock: ReactNode =
    (status === 'error' || status === 'forbidden') &&
    (outcome === 'success' || outcome === 'forbidden') ? (
      <FeedbackPanel
        actions={
          outcome === 'success' ? (
            <button
              className={styles.secondary}
              onClick={() => {
                dismissOutcome();
                focusDismissedSurface(false);
              }}
              type="button"
            >
              {copy.common.dismiss[lang]}
            </button>
          ) : (
            <button className={styles.ghostButton} onClick={discardCurrentDraft} type="button">
              {copy.common.discardDraft[lang]}
            </button>
          )
        }
        autoFocus
        body={
          outcome === 'success' ? copy.feedback.savedReadUnavailable : copy.feedback.deniedDraftBody
        }
        title={outcome === 'success' ? copy.feedback.saved : copy.feedback.forbiddenTitle}
        tone={outcome === 'success' ? 'success' : 'danger'}
      />
    ) : null;

  const pageErrorBlock: ReactNode =
    pageError === null ? null : (
      <FeedbackPanel
        actions={
          <>
            <button
              className={styles.secondary}
              disabled={blocked}
              onClick={() => {
                void loadMore(pageError.collection);
              }}
              type="button"
            >
              {copy.feedback.pageErrorRetry[lang]}
            </button>
            <button className={styles.ghostButton} onClick={dismissPageError} type="button">
              {copy.common.dismiss[lang]}
            </button>
          </>
        }
        body={copy.feedback.pageErrorBody}
        target={copy.feedback.pageErrorTargets[pageError.collection][lang]}
        title={copy.feedback.pageErrorTitle}
        tone="warning"
      />
    );
  return {
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
  };
}
