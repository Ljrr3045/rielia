'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProjectCommand, Task } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import { useLocale } from './project-ui';
import { copy, type Bilingual } from './strings';
import { TaskChecklist } from './task-checklist';
import { TaskComments } from './task-comments';
import { TaskDescription } from './task-description';
import { TaskHistory } from './task-history';
import { TaskRelations } from './task-relations';
import type { ProjectTasksHook } from './task-collaboration-shared';
import styles from './projects.module.css';

type SuccessKind = 'comment' | 'commentEdit' | 'checklist' | 'parent' | 'child' | null;

function successCopy(kind: SuccessKind): Bilingual {
  switch (kind) {
    case 'comment': return copy.collaboration.commentSuccess;
    case 'commentEdit': return copy.collaboration.commentUpdated;
    case 'checklist': return copy.collaboration.checklistSuccess;
    case 'parent': return copy.collaboration.parentSuccess;
    case 'child': return copy.collaboration.childSuccess;
    default: return copy.collaboration.saveSuccess;
  }
}

function kindForCommand(command: ProjectCommand | null): SuccessKind {
  if (command === null) return null;
  if (command.type === 'add-comment') return 'comment';
  if (command.type === 'edit-comment') return 'commentEdit';
  if (command.type === 'set-task-parent') return 'parent';
  if (command.type === 'create-task') return 'child';
  return command.type.includes('checklist') ? 'checklist' : null;
}

export function TaskCollaboration({
  hook,
  onDiscard,
  onReloadConflict,
  onRetry,
  onStage,
  onSubmit,
  collaborationSource,
  projectArchived,
  task,
}: {
  hook: ProjectTasksHook;
  onDiscard: () => void;
  onReloadConflict: () => void;
  onRetry: () => void;
  onStage: (command: ProjectCommand) => void;
  onSubmit: () => void;
  collaborationSource: boolean;
  projectArchived: boolean;
  task: Task;
}) {
  const lang = useLocale();
  const [successKind, setSuccessKind] = useState<SuccessKind>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const draft = hook.collaborationDraft;
  const anyChildDraft = hook.draft?.type === 'create-task' && hook.draft.fields.parentTaskId !== undefined
    ? hook.draft
    : null;
  const anyChildRetry = hook.retryTarget?.type === 'create-task' && hook.retryTarget.fields.parentTaskId !== undefined
    ? hook.retryTarget
    : null;
  const activeDraft = draft ?? anyChildDraft;
  const retry = hook.collaborationRetryTarget ?? anyChildRetry;
  const conflict = hook.outcome === 'conflict' ? hook.conflict : null;
  const childTargetMismatch = anyChildDraft !== null && anyChildDraft.fields.parentTaskId !== task.id;
  const offTarget = (hook.draftGuard.kind !== 'none' && !hook.draftGuard.atTarget) || childTargetMismatch;
  const canReturnToDraft = hook.draftGuard.canReturn || childTargetMismatch;
  const checklistDraft = draft?.type.includes('checklist') ? draft : null;
  const closeWarning = hook.closeWarning;
  const successResult = collaborationSource
    && hook.outcome === 'success'
    && hook.result !== null
    && 'title' in hook.result
    && (hook.result.id === task.id || hook.result.parentTaskId === task.id)
    ? hook.result
    : null;

  useEffect(() => {
    setSuccessKind(null);
  }, [task.id]);

  useEffect(() => {
    if (hook.outcome === 'conflict' && conflictRef.current !== null) {
      conflictRef.current.focus();
    }
  }, [hook.outcome]);

  function submitWithSuccess() {
    setSuccessKind(kindForCommand(hook.collaborationDraft) ?? (hook.draft?.type === 'create-task' ? 'child' : null));
    onSubmit();
  }

  function returnToDraftContext() {
    const parentId = anyChildDraft?.fields.parentTaskId ?? anyChildRetry?.fields.parentTaskId ?? null;
    if (parentId !== null) {
      void hook.selectTask(parentId);
      return;
    }
    void hook.returnToDraft();
  }

  function discardAndRefresh() {
    onDiscard();
    void hook.refresh();
  }

  function reviewConflict() {
    onReloadConflict();
  }

  function canRebase(): boolean {
    if (draft === null) return false;
    if (draft.type === 'edit-comment') {
      return hook.commentConflict !== null
        && hook.commentConflict.id === draft.commentId
        && hook.commentConflict.capabilities.canEdit;
    }
    if (draft.type === 'add-checklist-item') {
      return hook.checklistConflict !== null
        && hook.checklistConflict.capabilities.canEdit
        && hook.checklistConflict.capabilities.canCreate;
    }
    if (draft.type === 'edit-checklist-item' || draft.type === 'remove-checklist-item') {
      return hook.checklistConflict !== null
        && hook.checklistConflict.capabilities.canEdit
        && hook.checklistConflict.items.some(item => item.id === draft.itemId);
    }
    return false;
  }

  function conflictBody() {
    const activeDraft = draft;
    if (activeDraft === null) return null;
    if (activeDraft.type === 'edit-comment') {
      if (hook.commentConflict === null) {
        return (
          <FeedbackPanel
            autoFocus
            actions={(
              <button className={styles.secondary} onClick={reviewConflict} type="button">
                {copy.collaboration.conflictReview[lang]}
              </button>
            )}
            body={copy.collaboration.conflictCommentBody}
            title={copy.collaboration.conflictTitle}
            tone="warning"
          />
        );
      }
      return (
        <div className={styles.collabConflict} ref={conflictRef} tabIndex={-1}>
          <p className={styles.feedbackTitle}>{copy.collaboration.conflictTitle[lang]}</p>
          <p className={styles.feedbackBody}>{copy.collaboration.conflictCommentBody[lang]}</p>
          <div className={styles.collabConflictGrid}>
            <div>
              <p className={styles.collabLabel}>{copy.collaboration.conflictCurrentLabel[lang]}</p>
              <div className={styles.commentBody}><TaskDescription source={hook.commentConflict.body} /></div>
            </div>
            <div>
              <p className={styles.collabLabel}>{copy.collaboration.conflictDraftLabel[lang]}</p>
              <div className={styles.commentBody}><TaskDescription source={activeDraft.body} /></div>
            </div>
          </div>
          <div className={styles.collabRowActions}>
            {canRebase() && (
              <button className={styles.secondary} onClick={() => hook.rebaseDraft()} type="button">
                {copy.collaboration.conflictKeep[lang]}
              </button>
            )}
            <button className={styles.ghostButton} onClick={discardAndRefresh} type="button">
              {copy.collaboration.conflictDiscard[lang]}
            </button>
          </div>
        </div>
      );
    }
    if (checklistDraft !== null) {
      if (hook.checklistConflict === null) {
        return (
          <FeedbackPanel
            autoFocus
            actions={(
              <button className={styles.secondary} onClick={reviewConflict} type="button">
                {copy.collaboration.conflictReview[lang]}
              </button>
            )}
            body={copy.collaboration.conflictChecklistBody}
            title={copy.collaboration.conflictTitle}
            tone="warning"
          />
        );
      }
      return (
        <div className={styles.collabConflict} ref={conflictRef} tabIndex={-1}>
          <p className={styles.feedbackTitle}>{copy.collaboration.conflictTitle[lang]}</p>
          <p className={styles.feedbackBody}>{copy.collaboration.conflictChecklistBody[lang]}</p>
          <p className={styles.collabLabel}>{copy.collaboration.conflictCurrentLabel[lang]}</p>
          <ul className={styles.collabConflictList}>
            {hook.checklistConflict.items.map(item => (
              <li className={item.completed ? styles.collabConflictDone : undefined} key={item.id}>
                <span aria-hidden="true">{item.completed ? '✓' : '○'}</span>
                {item.text}
              </li>
            ))}
          </ul>
          <p className={styles.collabHint}>
            {copy.collaboration.conflictDraftLabel[lang]}
            {': '}
            {activeDraft.type === 'add-checklist-item'
              ? activeDraft.text
              : activeDraft.type === 'edit-checklist-item' && activeDraft.text !== undefined
                ? activeDraft.text
                : 'itemId' in activeDraft
                  ? hook.checklistConflict.items.find(item => item.id === activeDraft.itemId)?.text ?? copy.collaboration.noValue[lang]
                  : copy.collaboration.noValue[lang]}
          </p>
          <div className={styles.collabRowActions}>
            {canRebase() && (
              <button className={styles.secondary} onClick={() => hook.rebaseDraft()} type="button">
                {copy.collaboration.conflictKeepChange[lang]}
              </button>
            )}
            <button className={styles.ghostButton} onClick={discardAndRefresh} type="button">
              {copy.collaboration.conflictDiscard[lang]}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.collabConflict} ref={conflictRef} tabIndex={-1}>
        <p className={styles.feedbackTitle}>{copy.collaboration.conflictTitle[lang]}</p>
        <p className={styles.feedbackBody}>{copy.collaboration.conflictParentBody[lang]}</p>
        {conflict !== null && (
          <p className={styles.feedbackTarget}>
            {conflict.key} · {'title' in conflict ? conflict.title : conflict.name}
          </p>
        )}
        <div className={styles.collabRowActions}>
          <button className={styles.ghostButton} onClick={discardAndRefresh} type="button">
            {copy.collaboration.conflictDiscard[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {retry !== null && (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} disabled={hook.mutationPending !== null} onClick={onRetry} type="button">
                {copy.collaboration.retry[lang]}
              </button>
              {canReturnToDraft && (
                <button className={styles.secondary} onClick={returnToDraftContext} type="button">
                  {copy.collaboration.draftReturn[lang]}
                </button>
              )}
              <button className={styles.ghostButton} onClick={onDiscard} type="button">
                {copy.collaboration.discard[lang]}
              </button>
            </>
          )}
          autoFocus
          body={copy.collaboration.unknownBody}
          target={draftLabel(activeDraft, hook, lang)}
          title={copy.collaboration.unknownTitle}
          tone="warning"
        />
      )}

      {retry === null && activeDraft !== null && offTarget && (
        <FeedbackPanel
          actions={(
            <>
              {canReturnToDraft && (
                <button className={styles.secondary} onClick={returnToDraftContext} type="button">
                  {copy.collaboration.draftReturn[lang]}
                </button>
              )}
              {hook.draftGuard.canDiscard && (
                <button className={styles.ghostButton} onClick={onDiscard} type="button">
                  {copy.collaboration.draftDiscard[lang]}
                </button>
              )}
            </>
          )}
          autoFocus
          body={copy.collaboration.draftBody}
          target={draftLabel(activeDraft, hook, lang)}
          title={copy.collaboration.draftTitle}
          tone="warning"
        />
      )}

      {hook.collaborationPending !== null && draft !== null && !offTarget && (
        <FeedbackPanel
          busy
          target={draftLabel(activeDraft, hook, lang)}
          title={copy.collaboration.pendingTitle}
          tone="info"
        />
      )}

      {successResult !== null && (
        <FeedbackPanel
          actions={(
            <button
              className={styles.secondary}
              onClick={() => {
                setSuccessKind(null);
                hook.dismissOutcome();
              }}
              type="button"
            >
              {copy.common.dismiss[lang]}
            </button>
          )}
          autoFocus
          target={`${successResult.key} · ${successResult.title}`}
          title={successCopy(successKind)}
          tone="success"
        />
      )}

      {hook.outcome === 'conflict' && !closeWarning && draft !== null && conflictBody()}

      {hook.outcome === 'error' && retry === null && activeDraft !== null && (
        <FeedbackPanel
          actions={(
            <button className={styles.ghostButton} onClick={onDiscard} type="button">
              {copy.collaboration.discard[lang]}
            </button>
          )}
          body={copy.collaboration.unknownBody}
          target={draftLabel(activeDraft, hook, lang)}
          title={copy.collaboration.unknownTitle}
          tone="danger"
        />
      )}

      {hook.outcome === 'invalid' && activeDraft !== null && (
        <FeedbackPanel
          actions={(
            <button className={styles.ghostButton} onClick={onDiscard} type="button">
              {copy.collaboration.discard[lang]}
            </button>
          )}
          body={copy.collaboration.invalidBody}
          title={copy.collaboration.invalidTitle}
          tone="warning"
        />
      )}

      {hook.outcome === 'forbidden' && activeDraft !== null && (
        <FeedbackPanel
          actions={(
            <button className={styles.ghostButton} onClick={onDiscard} type="button">
              {copy.collaboration.discard[lang]}
            </button>
          )}
          body={copy.collaboration.forbiddenBody}
          title={copy.collaboration.forbiddenTitle}
          tone="danger"
        />
      )}

      <TaskRelations
        hook={hook}
        onDiscard={onDiscard}
        onStage={onStage}
        onSubmit={submitWithSuccess}
        projectArchived={projectArchived}
        task={task}
      />
      <TaskChecklist
        hook={hook}
        onDiscard={onDiscard}
        onStage={onStage}
        onSubmit={submitWithSuccess}
        projectArchived={projectArchived}
        task={task}
      />
      <TaskComments
        hook={hook}
        onDiscard={onDiscard}
        onStage={onStage}
        onSubmit={submitWithSuccess}
        projectArchived={projectArchived}
        task={task}
      />
      <TaskHistory hook={hook} />
    </>
  );
}

function taskKeyForCommand(command: ProjectCommand, hook: ProjectTasksHook): string | null {
  const targetId = 'taskId' in command
    ? command.taskId
    : command.type === 'create-task' && command.fields.parentTaskId !== undefined
      ? command.fields.parentTaskId
      : null;
  if (targetId === null) return null;
  if (hook.task?.id === targetId) return hook.task.key;
  const pages = [hook.tasks, ...Object.values(hook.taskColumns)];
  for (const page of pages) {
    const found = page?.items.find(item => item.id === targetId);
    if (found !== undefined) return found.key;
  }
  return null;
}

function draftLabel(command: ProjectCommand | null, hook: ProjectTasksHook, lang: 'es' | 'en'): string | null {
  if (command === null) return null;
  const action = copy.collaboration.activityActions[command.type];
  const label = action === undefined ? command.type : action[lang];
  const key = taskKeyForCommand(command, hook);
  return key === null ? label : `${key} · ${label}`;
}
