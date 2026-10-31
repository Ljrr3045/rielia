'use client';

import type { ProjectCommand, Task } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import { AgentBadge, IconEdit, useLocale } from './project-ui';
import { TaskDescription } from './task-description';
import { copy } from './strings';
import { formatTimestamp, provenanceLabel, type ProjectTasksHook } from './task-collaboration-shared';
import styles from './projects.module.css';

export function TaskComments({
  hook,
  onDiscard,
  onStage,
  onSubmit,
  projectArchived,
  task,
}: {
  hook: ProjectTasksHook;
  onDiscard: () => void;
  onStage: (command: ProjectCommand) => void;
  onSubmit: () => void;
  projectArchived: boolean;
  task: Task;
}) {
  const lang = useLocale();
  const slot = hook.collaboration.comments;
  const data = slot.data;
  const pending = hook.mutationPending !== null;
  const archived = projectArchived || task.archivedAt !== null;
  const stale = slot.status === 'changed';
  const retrying = hook.collaborationRetryTarget !== null;
  const collaborationDraft = hook.collaborationDraft?.taskId === task.id ? hook.collaborationDraft : null;
  const addDraft = collaborationDraft?.type === 'add-comment' ? collaborationDraft : null;
  const editDraft = collaborationDraft?.type === 'edit-comment' ? collaborationDraft : null;
  const otherDraft = hook.draftGuard.kind !== 'none' && addDraft === null && editDraft === null;
  const disabled = archived || pending || retrying || stale || otherDraft;
  const canCreate = data?.capabilities.canCreate === true && !archived;

  function stageAdd(body: string) {
    if (!canCreate || disabled) return;
    if (body.trim().length === 0) {
      if (addDraft !== null) onDiscard();
      return;
    }
    onStage({
      type: 'add-comment',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      body,
    });
  }

  function startEdit(commentId: string, body: string) {
    if (archived || pending || stale || otherDraft || editDraft !== null || addDraft !== null) return;
    onStage({
      type: 'edit-comment',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      commentId,
      expectedCommentVersion: data?.items.find(comment => comment.id === commentId)?.version ?? 1,
      body,
    });
  }

  function stageEdit(commentId: string, body: string) {
    if (archived || pending || stale || addDraft !== null) return;
    if (editDraft?.commentId !== commentId) return;
    onStage({
      type: 'edit-comment',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      commentId,
      expectedCommentVersion: editDraft.expectedCommentVersion,
      body,
    });
  }

  if (data === null) {
    return (
      <section aria-labelledby="collab-comments-heading" className={styles.collabSection}>
        <h3 className={styles.detailSectionTitle} id="collab-comments-heading">{copy.collaboration.comments[lang]}</h3>
        {slot.status === 'error'
          ? (
            <FeedbackPanel
              actions={(
                <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('comments'); }} type="button">
                  {copy.collaboration.sectionRetry[lang]}
                </button>
              )}
              body={copy.collaboration.sectionErrorBody}
              title={copy.collaboration.sectionErrorTitle}
              tone="warning"
            />
          )
          : <p className={styles.collabMuted} role="status">{copy.collaboration.sectionLoading[lang]}</p>}
      </section>
    );
  }

  const comments = data.items;

  return (
    <section aria-labelledby="collab-comments-heading" className={styles.collabSection}>
      <div className={styles.collabHeader}>
        <h3 className={styles.detailSectionTitle} id="collab-comments-heading">{copy.collaboration.comments[lang]}</h3>
        <span className={styles.collabCount}>{copy.collaboration.commentsCount[lang](data.total)}</span>
      </div>
      <p className={styles.collabHint}>{copy.collaboration.commentsHint[lang]}</p>

      {slot.status === 'changed' && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={() => { void hook.refresh(); }} type="button">
              {copy.collaboration.sectionRefresh[lang]}
            </button>
          )}
          body={copy.collaboration.sectionStale}
          title={copy.collaboration.sectionChangedTitle}
          tone="warning"
        />
      )}
      {slot.status === 'error' && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('comments'); }} type="button">
              {copy.collaboration.sectionRetry[lang]}
            </button>
          )}
          body={copy.collaboration.sectionErrorBody}
          title={copy.collaboration.sectionErrorTitle}
          tone="warning"
        />
      )}

      {canCreate && editDraft === null && (
        <form
          className={styles.collabCommentForm}
          onSubmit={event => {
            event.preventDefault();
            if (addDraft !== null && addDraft.body.trim().length > 0) onSubmit();
          }}
        >
          <label className={styles.collabLabel} htmlFor="collab-comment-body">{copy.collaboration.commentPlaceholder[lang]}</label>
          <textarea
            disabled={disabled}
            id="collab-comment-body"
            maxLength={10000}
            onChange={event => stageAdd(event.currentTarget.value)}
            placeholder={copy.collaboration.commentPlaceholder[lang]}
            rows={3}
            value={addDraft?.body ?? ''}
          />
          <div className={styles.collabRowActions}>
            <button className={styles.primary} disabled={pending || addDraft === null || addDraft.body.trim().length === 0} type="submit">
              {pending && addDraft !== null ? copy.collaboration.commentAdding[lang] : copy.collaboration.commentAdd[lang]}
            </button>
            {addDraft !== null && (
              <button className={styles.ghostButton} disabled={pending} onClick={onDiscard} type="button">
                {copy.common.cancel[lang]}
              </button>
            )}
          </div>
          <p className={styles.collabHint}>{copy.collaboration.commentLimit[lang]}</p>
        </form>
      )}

      {comments.length === 0 && slot.status === 'ready' && (
        <div className={styles.collabEmpty}>
          <p className={styles.collabEmptyTitle}>{copy.collaboration.commentsEmptyTitle[lang]}</p>
          <p className={styles.collabMuted}>{copy.collaboration.commentsEmptyBody[lang]}</p>
        </div>
      )}

      {comments.length > 0 && (
        <>
          <p className={styles.collabHint}>{copy.collaboration.commentsMostRecent[lang]}</p>
          <ol className={styles.commentList} aria-label={copy.collaboration.comments[lang]}>
            {comments.map(comment => {
              const editing = editDraft?.commentId === comment.id;
              return (
                <li className={styles.commentItem} key={comment.id}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{comment.author.name}</span>
                    {comment.author.kind === 'agent' && <AgentBadge />}
                    <span className={styles.collabMuted}>{provenanceLabel(comment.provenance, lang)}</span>
                    <span className={styles.commentTime}>
                      <time dateTime={comment.createdAt}>{formatTimestamp(comment.createdAt, lang)}</time>
                    </span>
                    {comment.editedAt !== null && (
                      <span className={styles.commentEdited}>
                        {copy.collaboration.commentEdited[lang]}
                        {' '}
                        <time dateTime={comment.editedAt}>{formatTimestamp(comment.editedAt, lang)}</time>
                      </span>
                    )}
                    {comment.capabilities.canEdit && !archived && !editing && (
                      <button
                        aria-label={`${copy.collaboration.editComment[lang]}: ${comment.author.name}`}
                        className={styles.ghostButton}
                        disabled={disabled || addDraft !== null || editDraft !== null}
                        onClick={() => startEdit(comment.id, comment.body)}
                        type="button"
                      >
                        <IconEdit size={14} />
                        {copy.common.edit[lang]}
                      </button>
                    )}
                  </div>
                  {editing
                    ? (
                      <form
                        className={styles.collabCommentForm}
                        onSubmit={event => {
                          event.preventDefault();
                          if ((editDraft?.body ?? '').trim().length > 0) onSubmit();
                        }}
                      >
                        <label className={styles.collabLabel} htmlFor={`comment-edit-${comment.id}`}>{copy.collaboration.editCommentHint[lang]}</label>
                        <textarea
                          autoFocus
                          disabled={disabled}
                          id={`comment-edit-${comment.id}`}
                          maxLength={10000}
                          onChange={event => stageEdit(comment.id, event.currentTarget.value)}
                          rows={4}
                          value={editDraft?.body ?? ''}
                        />
                        <div className={styles.collabRowActions}>
                          <button className={styles.primary} disabled={pending || (editDraft?.body ?? '').trim().length === 0} type="submit">
                            {copy.collaboration.saveComment[lang]}
                          </button>
                          <button className={styles.ghostButton} disabled={pending} onClick={onDiscard} type="button">
                            {copy.collaboration.cancelComment[lang]}
                          </button>
                        </div>
                        <p className={styles.collabHint}>{copy.collaboration.commentLimit[lang]}</p>
                      </form>
                    )
                    : (
                      <div className={styles.commentBody}>
                        <TaskDescription source={comment.body} />
                      </div>
                    )}
                </li>
              );
            })}
          </ol>
          {data.nextCursor !== null && slot.status === 'ready' && (
            <button
              className={styles.loadMoreButton}
              disabled={pending}
              onClick={() => { void hook.loadCollaborationMore('comments'); }}
              type="button"
            >
              {copy.collaboration.loadOlderComments[lang]}
            </button>
          )}
        </>
      )}
    </section>
  );
}
