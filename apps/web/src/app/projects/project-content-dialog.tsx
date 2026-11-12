'use client';
import type { ReactNode } from 'react';
import {
  type TaskFields,
  type ProjectCommand,
  type ProjectTaskCommand,
  type ProjectPolicyCommand,
  type ProjectAccessMember,
  type DomainPerson,
  type ProjectVisibility,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
import {
  formCommandType,
  pendingCopy,
  modalTitle,
  type FormState,
  type ProjectFormValue,
} from './project-content-model';
import { copy, type Lang } from './strings';
import { ProjectAccessPanel } from './project-access';
import { FeedbackPanel } from './feedback';
import { ConfirmBox, ModalFrame } from './project-ui';
import { ProjectForm } from './project-forms';
import { TaskEditForm } from './task-forms';
import styles from './projects.module.css';
export interface ProjectContentDialogPorts {
  anyPending: boolean;
  assigneeOptions: readonly DomainPerson[];
  assignees: ProjectTaskState['assignees'];
  canCreatePrivate: boolean;
  closeForm: () => void;
  closeWarningNode: ReactNode;
  confirmLifecycle: () => void;
  discardCurrentDraft: () => void;
  discardDraft: () => void;
  feedbackNode: ReactNode;
  form: FormState | null;
  formAuthorized: boolean;
  lang: Lang;
  loadMore: (
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees',
  ) => Promise<void>;
  mutationPending: ProjectCommand['type'] | null;
  outcome: ProjectTaskState['outcome'];
  status: ProjectTaskState['status'];
  pageError: {
    collection: 'workspaces' | 'members' | 'projects' | 'tasks';
    requestId: string | null;
    reason?: 'changed';
  } | null;
  pageErrorBlock: ReactNode;
  pending: ProjectTaskCommand['type'] | null;
  policyBlocked: boolean;
  policyDraft: ProjectPolicyCommand | null;
  policyFeedbackNode: ReactNode;
  policyMember: ProjectAccessMember | null;
  policyPageErrors: ProjectTaskState['policyPageErrors'];
  policyPending: ProjectPolicyCommand['type'] | null;
  policyRetryTarget: ProjectPolicyCommand | null;
  project: ProjectTaskState['project'];
  projectAccess: ProjectTaskState['projectAccess'];
  projectValue: ProjectFormValue;
  refresh: () => Promise<void>;
  resolveWorkspaceChoice: (choice: 'stay' | 'discard') => void;
  retryTarget: ProjectTaskCommand | null;
  reviewAccess: (member: ProjectAccessMember, state: 'active' | 'revoked') => void;
  stageProject: (fields: Partial<ProjectFormValue>) => void;
  stageTask: (fields: Partial<TaskFields>) => void;
  stageVisibilityChange: (visibility: ProjectVisibility) => void;
  submitPolicy: () => void;
  submitProjectForm: () => void;
  submitTaskForm: () => void;
  taskValue: TaskFields;
  workspaceNavigation: ProjectTaskState['workspaceNavigation'];
  workspaces: ProjectTaskState['workspaces'];
}

export function renderProjectDialogs({
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
  status,
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
}: ProjectContentDialogPorts) {
  const readUnverified = status === 'loading' || status === 'error';
  return (
    <>
      {form !== null &&
        (readUnverified ||
          (formAuthorized &&
            (status === 'ready' || (status === 'empty' && form.kind === 'project-create')))) &&
        workspaceNavigation === null && (
          <ModalFrame
            formModal
            busy={anyPending}
            eyebrow={
              form.kind === 'project-access'
                ? copy.common.project
                : form.kind === 'project-create' || form.kind === 'project-edit'
                  ? copy.common.project
                  : form.kind === 'task-edit' ||
                      form.kind === 'task-archive' ||
                      form.kind === 'task-restore'
                    ? copy.common.task
                    : copy.common.project
            }
            onClose={closeForm}
            small={
              form.kind === 'project-archive' ||
              form.kind === 'project-restore' ||
              form.kind === 'task-archive' ||
              form.kind === 'task-restore'
            }
            title={modalTitle(form)}
            wide={form.kind === 'project-access'}
          >
            {readUnverified ? (
              <>
                <FeedbackPanel
                  autoFocus
                  busy={status === 'loading'}
                  tone={status === 'loading' ? 'info' : 'warning'}
                  title={status === 'loading' ? copy.status.loadingTitle : copy.status.errorTitle}
                  body={status === 'loading' ? copy.status.loadingBody : copy.status.errorBody}
                  actions={
                    <>
                      {status === 'error' && (
                        <button
                          className={styles.secondary}
                          onClick={() => {
                            void refresh();
                          }}
                          type="button"
                        >
                          {copy.status.retryLoad[lang]}
                        </button>
                      )}
                      <button className={styles.ghostButton} onClick={closeForm} type="button">
                        {copy.common.cancel[lang]}
                      </button>
                    </>
                  }
                />
                <p className={styles.stateHint}>{copy.status.memoryKept[lang]}</p>
              </>
            ) : (
              <>
                {closeWarningNode}
                {form.kind === 'project-access'
                  ? project === null || outcome === 'forbidden'
                    ? policyFeedbackNode
                    : null
                  : feedbackNode}
                {pageError?.collection === 'members' && pageErrorBlock}
                {form.kind === 'project-access' && project !== null && outcome !== 'forbidden' && (
                  <ProjectAccessPanel
                    access={projectAccess}
                    accessError={policyPageErrors.projectAccess ?? null}
                    feedback={policyFeedbackNode}
                    onReviewAccess={reviewAccess}
                    onDiscard={() => {
                      discardDraft();
                    }}
                    onLoadMore={() => {
                      void loadMore('projectAccess');
                    }}
                    onRefresh={() => {
                      void refresh();
                    }}
                    onStageVisibility={stageVisibilityChange}
                    onSubmit={submitPolicy}
                    onSubmitVisibility={submitPolicy}
                    policyDraft={policyDraft}
                    policyMember={policyMember}
                    policyPending={policyPending}
                    policyRetryTarget={policyRetryTarget}
                    project={project}
                  />
                )}
                {outcome !== 'forbidden' &&
                  (form.kind === 'project-create' || form.kind === 'project-edit') && (
                    <>
                      <p className={styles.stateHint}>
                        {form.kind === 'project-create'
                          ? copy.project.createBody[lang]
                          : copy.project.settingsBody[lang]}
                      </p>
                      <ProjectForm
                        canCreatePrivate={canCreatePrivate}
                        mode={form.kind === 'project-create' ? 'create' : 'edit'}
                        onChange={stageProject}
                        onCancel={closeForm}
                        onSubmit={submitProjectForm}
                        pending={pending !== null}
                        disabled={retryTarget !== null || policyBlocked}
                        value={projectValue}
                      />
                    </>
                  )}
                {outcome !== 'forbidden' && form.kind === 'task-edit' && project !== null && (
                  <TaskEditForm
                    assignees={assigneeOptions}
                    assigneesError={policyPageErrors.assignees !== undefined}
                    assigneesLoading={
                      assignees === null && policyPageErrors.assignees === undefined
                    }
                    assigneesNext={assignees !== null && assignees.nextCursor !== null}
                    assigneesPageMissing={assignees === null}
                    onChange={stageTask}
                    onCancel={closeForm}
                    onLoadMoreAssignees={() => {
                      void loadMore('assignees');
                    }}
                    onSubmit={submitTaskForm}
                    pending={pending !== null}
                    disabled={retryTarget !== null || policyBlocked}
                    projectKey={project.key}
                    projectName={project.name}
                    value={taskValue}
                  />
                )}
                {outcome !== 'forbidden' &&
                  (form.kind === 'project-archive' || form.kind === 'project-restore') && (
                    <ConfirmBox
                      busy={pending !== null}
                      disabled={retryTarget !== null || policyBlocked}
                      consequence={
                        form.kind === 'project-archive'
                          ? copy.project.archiveConsequence
                          : copy.project.restoreConsequence
                      }
                      confirmLabel={
                        form.kind === 'project-archive'
                          ? copy.project.archive
                          : copy.project.restore
                      }
                      danger={form.kind === 'project-archive'}
                      onCancel={() => {
                        discardCurrentDraft();
                        closeForm();
                      }}
                      onConfirm={confirmLifecycle}
                      pendingLabel={pendingCopy(formCommandType(form.kind))}
                      title={
                        form.kind === 'project-archive'
                          ? copy.project.archiveConfirmTitle
                          : copy.project.restore
                      }
                    />
                  )}
                {outcome !== 'forbidden' &&
                  (form.kind === 'task-archive' || form.kind === 'task-restore') && (
                    <ConfirmBox
                      busy={pending !== null}
                      disabled={retryTarget !== null}
                      consequence={
                        form.kind === 'task-archive'
                          ? copy.task.archiveConsequence
                          : copy.task.restoreConsequence
                      }
                      confirmLabel={
                        form.kind === 'task-archive' ? copy.task.archive : copy.task.restore
                      }
                      danger={form.kind === 'task-archive'}
                      onCancel={() => {
                        discardCurrentDraft();
                        closeForm();
                      }}
                      onConfirm={confirmLifecycle}
                      pendingLabel={pendingCopy(formCommandType(form.kind))}
                      title={
                        form.kind === 'task-archive'
                          ? copy.task.archiveConfirmTitle
                          : copy.task.restore
                      }
                    />
                  )}
              </>
            )}
          </ModalFrame>
        )}

      {workspaceNavigation !== null && (
        <ModalFrame
          busy={mutationPending !== null}
          eyebrow={copy.common.workspace}
          onClose={() => resolveWorkspaceChoice('stay')}
          small
          title={copy.workspaceGuard.title}
        >
          <p className={styles.stateHint}>
            {copy.workspaceGuard.body[lang](
              workspaces?.items.find((item) => item.id === workspaceNavigation.workspaceId)?.name ??
                copy.workspaceGuard.targetFallback[lang],
            )}
          </p>
          {mutationPending !== null && (
            <p className={styles.stateHint} role="status">
              {copy.workspaceGuard.pending[lang]}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              className={styles.primary}
              data-autofocus
              onClick={() => resolveWorkspaceChoice('stay')}
              type="button"
            >
              {copy.workspaceGuard.stay[lang]}
            </button>
            <button
              className={styles.dangerButton}
              disabled={mutationPending !== null}
              onClick={() => resolveWorkspaceChoice('discard')}
              type="button"
            >
              {copy.workspaceGuard.discard[lang]}
            </button>
          </div>
        </ModalFrame>
      )}
    </>
  );
}
