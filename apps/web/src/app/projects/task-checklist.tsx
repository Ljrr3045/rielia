'use client';

import { useEffect, useState } from 'react';
import type { ProjectCommand, Task } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import { ConfirmBox, IconArrowDown, IconArrowUp, IconClose, IconEdit, useLocale } from './project-ui';
import { copy } from './strings';
import type { ProjectTasksHook } from './task-collaboration-shared';
import styles from './projects.module.css';

export function TaskChecklist({
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
  const slot = hook.collaboration.checklist;
  const data = slot.data;
  const pending = hook.mutationPending !== null;
  const archived = projectArchived || task.archivedAt !== null;
  const stale = slot.status === 'changed';
  const retrying = hook.collaborationRetryTarget !== null;
  const collaborationDraft = hook.collaborationDraft?.taskId === task.id ? hook.collaborationDraft : null;
  const addDraft = collaborationDraft?.type === 'add-checklist-item' ? collaborationDraft : null;
  const editDraft = collaborationDraft?.type === 'edit-checklist-item' && collaborationDraft.text !== undefined
    ? collaborationDraft
    : null;
  const otherDraft = hook.draftGuard.kind !== 'none' && addDraft === null && editDraft === null;
  const anyChecklistDraft = addDraft !== null || editDraft !== null;
  const disabled = archived || pending || retrying || stale || otherDraft;
  const [removeId, setRemoveId] = useState<string | null>(null);
  const canCreate = data?.capabilities.canCreate === true && !archived;
  const canEditPage = data?.capabilities.canEdit === true && !archived;
  const itemCount = data?.items.length ?? 0;
  const completed = data?.items.filter(item => item.completed).length ?? 0;
  const total = data?.total ?? 0;
  const removeItem = data?.items.find(item => item.id === removeId) ?? null;

  useEffect(() => {
    setRemoveId(null);
  }, [task.id]);

  function stageAdd(text: string) {
    if (!canCreate || disabled || anyChecklistDraft && addDraft === null) return;
    if (text.trim().length === 0) {
      if (addDraft !== null) onDiscard();
      return;
    }
    onStage({
      type: 'add-checklist-item',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      text,
      beforeItemId: null,
    });
  }

  function stageEdit(itemId: string, text: string) {
    if (!canEditPage || disabled || anyChecklistDraft && editDraft?.itemId !== itemId) return;
    onStage({
      type: 'edit-checklist-item',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      itemId,
      text,
    });
  }

  function toggleItem(itemId: string, completedState: boolean) {
    if (!canEditPage || disabled || anyChecklistDraft) return;
    onStage({
      type: 'edit-checklist-item',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      itemId,
      completed: completedState,
    });
    onSubmit();
  }

  function moveItem(itemId: string, beforeItemId: string | null) {
    if (!canEditPage || disabled || anyChecklistDraft) return;
    onStage({
      type: 'move-checklist-item',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      itemId,
      beforeItemId,
    });
    onSubmit();
  }

  function removeItemConfirmed(itemId: string) {
    if (!canEditPage || disabled || anyChecklistDraft) return;
    onStage({
      type: 'remove-checklist-item',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      itemId,
    });
    setRemoveId(null);
    onSubmit();
  }

  if (data === null) {
    return (
      <section aria-labelledby="collab-checklist-heading" className={styles.collabSection}>
        <h3 className={styles.detailSectionTitle} id="collab-checklist-heading">{copy.collaboration.checklist[lang]}</h3>
        {slot.status === 'error'
          ? (
            <FeedbackPanel
              actions={(
                <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('checklist'); }} type="button">
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

  return (
    <section aria-labelledby="collab-checklist-heading" className={styles.collabSection}>
      <div className={styles.collabHeader}>
        <h3 className={styles.detailSectionTitle} id="collab-checklist-heading">{copy.collaboration.checklist[lang]}</h3>
        {total > 0 && <span className={styles.collabCount}>{copy.collaboration.checklistProgress[lang](completed, total)}</span>}
      </div>

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
            <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('checklist'); }} type="button">
              {copy.collaboration.sectionRetry[lang]}
            </button>
          )}
          body={copy.collaboration.sectionErrorBody}
          title={copy.collaboration.sectionErrorTitle}
          tone="warning"
        />
      )}

      {total > 0 && (
        <div className={styles.checklistProgressRow}>
          <progress
            aria-label={copy.collaboration.checklistLabel[lang]}
            aria-valuetext={copy.collaboration.checklistProgress[lang](completed, total)}
            className={styles.checklistProgress}
            max={total}
            value={completed}
          />
        </div>
      )}

      {itemCount === 0 && slot.status === 'ready' && (
        <div className={styles.collabEmpty}>
          <p className={styles.collabEmptyTitle}>{copy.collaboration.checklistEmptyTitle[lang]}</p>
          <p className={styles.collabMuted}>{copy.collaboration.checklistEmptyBody[lang]}</p>
        </div>
      )}

      {itemCount > 0 && (
        <ul className={styles.checklistList} aria-label={copy.collaboration.checklist[lang]}>
          {data.items.map(item => {
            const editing = editDraft?.itemId === item.id;
            const itemDisabled = disabled || anyChecklistDraft && !editing;
            return (
              <li className={styles.checklistItem} key={item.id}>
                <label className={styles.checkToggle}>
                  <input
                    aria-label={`${copy.collaboration.checklistItemLabel[lang]}: ${item.text}`}
                    checked={item.completed}
                    disabled={!canEditPage || disabled || anyChecklistDraft || !item.capabilities.canEdit}
                    onChange={event => toggleItem(item.id, event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span className={styles.srOnly}>{item.text}</span>
                </label>
                <div className={styles.checklistMain}>
                  {editing
                    ? (
                      <form
                        className={styles.checklistEditForm}
                        onSubmit={event => {
                          event.preventDefault();
                          if ((editDraft?.text ?? '').trim().length > 0) onSubmit();
                        }}
                      >
                        <label className={styles.srOnly} htmlFor={`checklist-edit-${item.id}`}>{copy.collaboration.checklistEdit[lang]}</label>
                        <input
                          disabled={disabled}
                          id={`checklist-edit-${item.id}`}
                          maxLength={500}
                          onChange={event => stageEdit(item.id, event.currentTarget.value)}
                          value={editDraft?.text ?? ''}
                        />
                        <div className={styles.collabRowActions}>
                          <button className={styles.secondary} disabled={pending || (editDraft?.text ?? '').trim().length === 0} type="submit">
                            {copy.collaboration.checklistSave[lang]}
                          </button>
                          <button className={styles.ghostButton} disabled={pending} onClick={onDiscard} type="button">
                            {copy.collaboration.checklistCancel[lang]}
                          </button>
                        </div>
                      </form>
                    )
                    : <span className={item.completed ? styles.checklistTextDone : styles.checklistText}>{item.text}</span>}
                </div>
                {!archived && !editing && (
                  <div className={styles.checklistActions}>
                    {item.capabilities.canMoveUp && canEditPage && (
                      <button
                        aria-label={`${copy.collaboration.checklistMoveUp[lang]}: ${item.text}`}
                        className={styles.iconButton}
                        disabled={itemDisabled || pending}
                        onClick={() => moveItem(item.id, item.moveUpBeforeItemId)}
                        type="button"
                      >
                        <IconArrowUp size={16} />
                      </button>
                    )}
                    {item.capabilities.canMoveDown && canEditPage && (
                      <button
                        aria-label={`${copy.collaboration.checklistMoveDown[lang]}: ${item.text}`}
                        className={styles.iconButton}
                        disabled={itemDisabled || pending}
                        onClick={() => moveItem(item.id, item.moveDownBeforeItemId)}
                        type="button"
                      >
                        <IconArrowDown size={16} />
                      </button>
                    )}
                    {item.capabilities.canEdit && canEditPage && (
                      <button
                        aria-label={`${copy.collaboration.checklistEdit[lang]}: ${item.text}`}
                        className={styles.iconButton}
                        disabled={itemDisabled || pending}
                        onClick={() => stageEdit(item.id, item.text)}
                        type="button"
                      >
                        <IconEdit size={16} />
                      </button>
                    )}
                    {item.capabilities.canRemove && canEditPage && (
                      <button
                        aria-label={`${copy.collaboration.checklistRemove[lang]}: ${item.text}`}
                        className={styles.iconButton}
                        disabled={itemDisabled || pending}
                        onClick={() => setRemoveId(item.id)}
                        type="button"
                      >
                        <IconClose size={16} />
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canCreate && (
        <form
          className={styles.collabInlineForm}
          onSubmit={event => {
            event.preventDefault();
            if (addDraft !== null && addDraft.text.trim().length > 0) onSubmit();
          }}
        >
          <label className={styles.srOnly} htmlFor="collab-checklist-add">{copy.collaboration.checklistPlaceholder[lang]}</label>
          <input
            disabled={disabled || anyChecklistDraft && addDraft === null}
            id="collab-checklist-add"
            maxLength={500}
            onChange={event => stageAdd(event.currentTarget.value)}
            placeholder={copy.collaboration.checklistPlaceholder[lang]}
            type="text"
            value={addDraft?.text ?? ''}
          />
          <button className={styles.secondary} disabled={disabled || addDraft === null || addDraft.text.trim().length === 0} type="submit">
            {pending && addDraft !== null ? copy.collaboration.checklistAdding[lang] : copy.collaboration.checklistAdd[lang]}
          </button>
          <p className={styles.collabHint}>{copy.collaboration.checklistHint[lang]}</p>
        </form>
      )}

      {removeItem !== null && (
        <ConfirmBox
          busy={pending}
          consequence={copy.collaboration.checklistRemoveConsequence}
          confirmLabel={copy.collaboration.checklistRemoveConfirm}
          danger
          onCancel={() => setRemoveId(null)}
          onConfirm={() => removeItemConfirmed(removeItem.id)}
          title={copy.collaboration.checklistRemoveTitle}
        />
      )}
    </section>
  );
}
