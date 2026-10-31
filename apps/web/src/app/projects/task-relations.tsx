'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ProjectCommand, Task, TaskReference } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import {
  Badge,
  ConfirmBox,
  IconArrowLeft,
  StatusMark,
  useLocale,
} from './project-ui';
import { copy, statusName } from './strings';
import type { ProjectTasksHook } from './task-collaboration-shared';
import styles from './projects.module.css';

function referenceLink(
  reference: TaskReference,
  onOpen: (reference: TaskReference) => void,
  lang: 'es' | 'en',
  current: boolean,
) {
  return (
    <a
      className={styles.collabTaskLink}
      href={reference.url}
      onClick={event => {
        if (current || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        onOpen(reference);
      }}
    >
      <span className={styles.taskKey}>{reference.key}</span>
      <span>{reference.title}</span>
      <StatusMark name={statusName(reference.status)} status={reference.status} />
      {reference.archivedAt !== null && <Badge tone="archived">{copy.task.archivedBadge[lang]}</Badge>}
    </a>
  );
}

export function TaskRelations({
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
  const slot = hook.collaboration.relations;
  const candidates = hook.collaboration['parent-candidates'];
  const relations = slot.data;
  const pending = hook.mutationPending !== null;
  const archived = projectArchived || task.archivedAt !== null;
  const ownDraft = hook.collaborationDraft?.taskId === task.id ? hook.collaborationDraft : null;
  const childDraft = hook.draft?.type === 'create-task'
    && hook.draft.projectId === task.projectId
    && hook.draft.fields.parentTaskId === task.id
    ? hook.draft
    : null;
  const retrying = hook.collaborationRetryTarget !== null
    || hook.retryTarget?.type === 'create-task' && hook.retryTarget.fields.parentTaskId !== undefined;
  const otherDraft = hook.draftGuard.kind !== 'none' && !childDraft && !ownDraft;
  const stale = slot.status === 'changed';
  const disabled = archived || pending || retrying || stale || otherDraft;
  const draftLocked = ownDraft !== null || childDraft !== null;
  const readOnly = archived || (relations !== null && !relations.capabilities.canCreate && !relations.capabilities.canLink && !relations.capabilities.canUnlink);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const linkOpenerRef = useRef<HTMLElement | null>(null);
  const setWanted = hook.setParentCandidatesWanted;

  useEffect(() => {
    setLinkOpen(false);
    setSelectedParentId('');
    setUnlinkOpen(false);
    void setWanted(false);
  }, [task.id, setWanted]);

  useEffect(() => {
    if (linkOpen && candidates.status === 'ready') selectRef.current?.focus();
  }, [linkOpen, candidates.status]);

  function closeLink(focus = true) {
    setLinkOpen(false);
    setSelectedParentId('');
    void setWanted(false);
    if (!focus) return;
    requestAnimationFrame(() => {
      const opener = linkOpenerRef.current;
      if (opener !== null && opener.isConnected) {
        opener.focus();
        return;
      }
      document.getElementById('collab-relations-heading')?.focus();
    });
  }

  function openLink(event: ReactMouseEvent<HTMLButtonElement>) {
    if (disabled || draftLocked) return;
    linkOpenerRef.current = event.currentTarget;
    setLinkOpen(true);
    void setWanted(true);
  }

  function linkParent() {
    if (!relations || disabled || draftLocked || selectedParentId.length === 0) return;
    const candidate = candidates.data?.items.find(item => item.id === selectedParentId);
    if (candidate === undefined) return;
    onStage({
      type: 'set-task-parent',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      parentTaskId: candidate.id,
      expectedParentVersion: candidate.version,
    });
    closeLink(false);
    onSubmit();
  }

  function unlinkParent() {
    if (!relations || !relations.capabilities.canUnlink || disabled || draftLocked) return;
    onStage({
      type: 'set-task-parent',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      expectedVersion: task.version,
      parentTaskId: null,
    });
    setUnlinkOpen(false);
    onSubmit();
  }

  function stageChild(title: string) {
    if (!relations?.capabilities.canCreate || disabled || ownDraft !== null) return;
    if (title.trim().length === 0) {
      if (childDraft !== null) onDiscard();
      return;
    }
    onStage({
      type: 'create-task',
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      fields: {
        title,
        parentTaskId: task.id,
        expectedParentVersion: task.version,
      },
    });
  }

  function submitChild() {
    if (childDraft === null || childDraft.fields.title.trim().length === 0 || disabled) return;
    onSubmit();
  }

  if (relations === null) {
    return (
      <section aria-labelledby="collab-relations-heading" className={styles.collabSection}>
        <h3 className={styles.detailSectionTitle} id="collab-relations-heading" tabIndex={-1}>{copy.collaboration.subtasks[lang]}</h3>
        {slot.status === 'error'
          ? (
            <FeedbackPanel
              actions={(
                <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('relations'); }} type="button">
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

  const parent = relations.parent;
  const children = relations.items;

  return (
    <section aria-labelledby="collab-relations-heading" className={styles.collabSection}>
      <div className={styles.collabHeader}>
        <h3 className={styles.detailSectionTitle} id="collab-relations-heading" tabIndex={-1}>
          {parent === null ? copy.collaboration.subtasks[lang] : copy.collaboration.parentTask[lang]}
        </h3>
        {parent === null && (
          <span className={styles.collabCount}>{copy.collaboration.subtaskCount[lang](relations.total, relations.open)}</span>
        )}
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
            <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('relations'); }} type="button">
              {copy.collaboration.sectionRetry[lang]}
            </button>
          )}
          body={copy.collaboration.sectionErrorBody}
          title={copy.collaboration.sectionErrorTitle}
          tone="warning"
        />
      )}

      {parent !== null && (
        <div className={styles.collabParentRow}>
          <span className={styles.collabMuted}>{copy.collaboration.partOf[lang]}</span>
          {referenceLink(parent, reference => { void hook.selectTask(reference.id); }, lang, false)}
        </div>
      )}

      {parent === null && (
        <ul className={styles.collabList} aria-label={copy.collaboration.subtasks[lang]}>
          {children.map(child => (
            <li className={styles.collabTaskRow} key={child.id}>
              {referenceLink(child, reference => { void hook.selectTask(reference.id); }, lang, false)}
            </li>
          ))}
        </ul>
      )}

      {parent === null && children.length === 0 && slot.status === 'ready' && (
        <div className={styles.collabEmpty}>
          <p className={styles.collabEmptyTitle}>{copy.collaboration.noSubtasksTitle[lang]}</p>
          <p className={styles.collabMuted}>{copy.collaboration.noSubtasksBody[lang]}</p>
        </div>
      )}

      {!readOnly && !archived && parent === null && relations.capabilities.canCreate && (
        <form
          className={styles.collabInlineForm}
          onSubmit={event => {
            event.preventDefault();
            submitChild();
          }}
        >
          <label className={styles.srOnly} htmlFor="collab-child-title">{copy.collaboration.addChildPlaceholder[lang]}</label>
          <input
            disabled={disabled}
            id="collab-child-title"
            maxLength={300}
            onChange={event => stageChild(event.currentTarget.value)}
            placeholder={copy.collaboration.addChildPlaceholder[lang]}
            type="text"
            value={childDraft?.fields.title ?? ''}
          />
          <button className={styles.secondary} disabled={disabled || childDraft === null} type="submit">
            {childDraft !== null && pending ? copy.collaboration.addingChild[lang] : copy.collaboration.addChild[lang]}
          </button>
          <p className={styles.collabHint}>{copy.collaboration.childHint[lang]}</p>
        </form>
      )}

      {!readOnly && !archived && (
        <div className={styles.collabRelationActions}>
          {parent === null && relations.capabilities.canLink && !linkOpen && (
            <>
              <button className={styles.ghostButton} disabled={disabled || draftLocked} onClick={openLink} type="button">
                {copy.collaboration.linkToParent[lang]}
              </button>
              <span className={styles.collabHint}>{copy.collaboration.childCentricHint[lang]}</span>
            </>
          )}
          {parent !== null && (
            <>
              {!linkOpen && (
                <button className={styles.ghostButton} disabled={disabled || draftLocked} onClick={openLink} type="button">
                  {copy.collaboration.changeParent[lang]}
                </button>
              )}
              {relations.capabilities.canUnlink && !unlinkOpen && (
                <button className={styles.ghostButton} disabled={disabled || draftLocked} onClick={() => setUnlinkOpen(true)} type="button">
                  {copy.collaboration.unlinkParent[lang]}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {linkOpen && !archived && (
        <div
          className={styles.collabPicker}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            closeLink();
          }}
          role="group"
          aria-labelledby="collab-link-title"
        >
          <div className={styles.collabHeader}>
            <p className={styles.collabPickerTitle} id="collab-link-title">{copy.collaboration.linkPickerTitle[lang]}</p>
            <button
              aria-label={copy.collaboration.closeCandidatePicker[lang]}
              className={styles.iconButton}
              disabled={pending}
              onClick={() => closeLink()}
              type="button"
            >
              <IconArrowLeft size={16} />
            </button>
          </div>
          <p className={styles.collabHint}>{copy.collaboration.linkPickerBody[lang]}</p>
          {candidates.status === 'error' && (
            <FeedbackPanel
              actions={(
                <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('parent-candidates'); }} type="button">
                  {copy.collaboration.candidateRetry[lang]}
                </button>
              )}
              body={copy.collaboration.candidateError}
              title={copy.collaboration.sectionErrorTitle}
              tone="warning"
            />
          )}
          {(candidates.status === 'idle' || candidates.status === 'loading') && (
            <p className={styles.collabMuted} role="status">{copy.collaboration.candidateLoading[lang]}</p>
          )}
          {candidates.status === 'changed' && (
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
          {candidates.data !== null && candidates.status !== 'changed' && (
            <>
              {candidates.data.items.length === 0
                ? <p className={styles.collabMuted}>{copy.collaboration.noCandidates[lang]}</p>
                : (
                  <>
                    <label className={styles.collabLabel} htmlFor="collab-parent-select">{copy.collaboration.chooseParent[lang]}</label>
                    <select
                      disabled={disabled}
                      id="collab-parent-select"
                      onChange={event => setSelectedParentId(event.currentTarget.value)}
                      ref={selectRef}
                      value={selectedParentId}
                    >
                      <option value="">{copy.collaboration.chooseParent[lang]}</option>
                      {candidates.data.items.map(candidate => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.key} · {candidate.title}{candidate.archivedAt !== null ? ` · ${copy.task.archivedBadge[lang]}` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              <div className={styles.collabRelationActions}>
                <button
                  className={styles.secondary}
                  disabled={disabled || selectedParentId.length === 0}
                  onClick={linkParent}
                  type="button"
                >
                  {pending ? copy.collaboration.linking[lang] : copy.collaboration.linkParentAction[lang]}
                </button>
                <button className={styles.ghostButton} disabled={pending} onClick={() => closeLink()} type="button">
                  {copy.common.cancel[lang]}
                </button>
                {candidates.data.nextCursor !== null && (
                  <button
                    className={styles.loadMoreButton}
                    disabled={disabled}
                    onClick={() => { void hook.loadCollaborationMore('parent-candidates'); }}
                    type="button"
                  >
                    {copy.collaboration.candidatesLoadMore[lang]}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {unlinkOpen && (
        <ConfirmBox
          busy={pending}
          consequence={copy.collaboration.unlinkConsequence}
          confirmLabel={copy.collaboration.unlinkConfirm}
          danger
          onCancel={() => setUnlinkOpen(false)}
          onConfirm={unlinkParent}
          title={copy.collaboration.unlinkTitle}
        />
      )}

      {readOnly && !archived && (
        <p className={styles.collabReadOnly}>{copy.collaboration.readOnly[lang]}</p>
      )}
      {children.length > 0 && relations.nextCursor !== null && (
        <div className={styles.collabRelationActions}>
          <button
            className={styles.loadMoreButton}
            disabled={pending}
            onClick={() => { void hook.loadCollaborationMore('relations'); }}
            type="button"
          >
            {copy.common.loadMore[lang]}
          </button>
        </div>
      )}
    </section>
  );
}
