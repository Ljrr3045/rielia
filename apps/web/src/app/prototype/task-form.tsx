'use client';

import { useEffect, useRef, useState } from 'react';
import type { TaskFields, TaskPrototypeActions, PrototypeState, TaskPriority, TaskStatus } from '../../lib/task-prototype/types';
import { copy, localizeError, priorityLabel, statusLabel, type Lang } from './strings';
import { IconClose, SaveFeedback, cx, useFocusTrap } from './ui';
import styles from './prototype.module.css';

interface TaskFormProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
}

export function TaskForm({ state, actions, lang }: TaskFormProps) {
  const c = copy[lang];
  const draft = state.taskDraft;
  const isCreate = draft?.expectedVersion === null;
  const [detailsOpen, setDetailsOpen] = useState(!isCreate);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const errorField = state.save.status === 'error' ? state.save.error?.field ?? null : null;
  const saveError = state.save.status === 'error' ? state.save.error : null;
  const pending = state.save.status === 'pending';
  const versionConflict = saveError?.code === 'version-conflict';

  useEffect(() => {
    if (errorField !== null && errorField !== 'title') setDetailsOpen(true);
  }, [errorField]);

  useEffect(() => {
    if (confirmDiscard) keepEditingRef.current?.focus();
  }, [confirmDiscard]);

  function closeOrConfirm() {
    if (pending) return;
    if (confirmDiscard) {
      setConfirmDiscard(false);
      return;
    }
    setConfirmDiscard(true);
  }

  useFocusTrap(dialogRef, draft !== null && draft !== undefined, closeOrConfirm);

  if (draft === undefined || draft === null) return null;

  const update = (fields: Partial<TaskFields>) => {
    actions.updateTaskDraft(fields);
  };

  const discard = () => {
    actions.discardTaskDraft();
  };

  const fieldError = (field: string) =>
    saveError !== null && saveError.field === field ? localizeError(saveError, lang) : null;

  const titleError = fieldError('title');

  return (
    <div className={styles.modalLayer}>
      <div
        aria-hidden="true"
        className={styles.modalBackdrop}
        onClick={() => {
          closeOrConfirm();
        }}
      />
      <div
        aria-labelledby="prototype-task-form-heading"
        aria-modal="true"
        className={styles.modal}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>{c.taskRecord}</p>
            <h2 className={styles.modalTitle} id="prototype-task-form-heading">
              {isCreate ? c.createTaskTitle : c.editTaskTitle}
            </h2>
          </div>
          <button
            aria-label={c.close}
            className={styles.iconButton}
            disabled={pending}
            onClick={() => {
              closeOrConfirm();
            }}
            type="button"
          >
            <IconClose size={20} />
          </button>
        </header>

        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault();
            if (confirmDiscard || pending) return;
            void actions.saveTask();
          }}
        >
          <div className={styles.formScroll}>
            <SaveFeedback
              canRetry={state.canRetry}
              lang={lang}
              onRetry={() => {
                void actions.retrySave();
              }}
              save={state.save}
              showError
            />

            {versionConflict && (
              <button className={styles.secondaryButton} onClick={discard} type="button">
                {c.versionConflictAction}
              </button>
            )}

            <fieldset className={styles.formFields} disabled={pending}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="prototype-task-title">
                  {c.titleLabel} <span className={styles.requiredMark}>{c.required}</span>
                </label>
                <input
                  aria-describedby={titleError === null ? undefined : 'prototype-task-title-error'}
                  aria-invalid={titleError !== null}
                  className={styles.textInput}
                  data-autofocus
                  id="prototype-task-title"
                  maxLength={200}
                  onChange={event => update({ title: event.target.value })}
                  placeholder={c.titlePlaceholder}
                  value={draft.title}
                />
                {titleError !== null && (
                  <p className={styles.fieldError} id="prototype-task-title-error">
                    {titleError}
                  </p>
                )}
              </div>

              <p className={styles.fixedContext}>
                <span className={styles.fieldLabel}>{c.projectLabel}</span>
                {state.project.name} <span className={styles.taskKey}>{state.project.key}</span>
              </p>

              <details
                className={styles.formDetails}
                onToggle={event => setDetailsOpen(event.currentTarget.open)}
                open={detailsOpen}
              >
                <summary className={styles.formSummary}>
                  <span className={styles.summaryClosed}>{c.moreDetails}</span>
                  <span className={styles.summaryOpen}>{c.fewerDetails}</span>
                </summary>

                <div className={styles.formGrid}>
                  <div className={cx(styles.formField, styles.formFieldWide)}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-description">
                      {c.descriptionLabel} <span className={styles.optionalMark}>{c.optional}</span>
                    </label>
                    <textarea
                      aria-invalid={fieldError('description') !== null}
                      className={styles.textArea}
                      id="prototype-task-description"
                      maxLength={5000}
                      onChange={event => update({ description: event.target.value })}
                      placeholder={c.descriptionPlaceholder}
                      rows={4}
                      value={draft.description}
                    />
                    {fieldError('description') !== null && <p className={styles.fieldError}>{fieldError('description')}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-status">
                      {c.status}
                    </label>
                    <select
                      className={styles.select}
                      id="prototype-task-status"
                      onChange={event => update({ status: event.target.value as TaskStatus })}
                      value={draft.status}
                    >
                      {state.statuses.map(status => (
                        <option key={status.id} value={status.id}>
                          {statusLabel(status.id, lang)}
                        </option>
                      ))}
                    </select>
                    {fieldError('status') !== null && <p className={styles.fieldError}>{fieldError('status')}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-priority">
                      {c.priority}
                    </label>
                    <select
                      className={styles.select}
                      id="prototype-task-priority"
                      onChange={event => update({ priority: event.target.value as TaskPriority })}
                      value={draft.priority}
                    >
                      <option value="urgent">{priorityLabel('urgent', lang)}</option>
                      <option value="high">{priorityLabel('high', lang)}</option>
                      <option value="medium">{priorityLabel('medium', lang)}</option>
                      <option value="low">{priorityLabel('low', lang)}</option>
                    </select>
                    {fieldError('priority') !== null && <p className={styles.fieldError}>{fieldError('priority')}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-assignee">
                      {c.assignee}
                    </label>
                    <select
                      className={styles.select}
                      id="prototype-task-assignee"
                      onChange={event => update({ assigneeId: event.target.value === '' ? null : event.target.value })}
                      value={draft.assigneeId ?? ''}
                    >
                      <option value="">{c.unassigned}</option>
                      {state.principals.map(principal => (
                        <option key={principal.id} value={principal.id}>
                          {principal.name}
                          {principal.kind === 'agent' ? ` · ${c.agent}` : ''}
                        </option>
                      ))}
                    </select>
                    {fieldError('assigneeId') !== null && <p className={styles.fieldError}>{fieldError('assigneeId')}</p>}
                    {draft.assigneeId === null && <p className={styles.fieldHint}>{c.unassignedHint}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-due-date">
                      {c.dueDate} <span className={styles.optionalMark}>{c.optional}</span>
                    </label>
                    <input
                      className={styles.textInput}
                      id="prototype-task-due-date"
                      onChange={event => update({ dueDate: event.target.value === '' ? null : event.target.value })}
                      type="date"
                      value={draft.dueDate ?? ''}
                    />
                    <p className={styles.fieldHint}>{c.dueDateHint}</p>
                    {fieldError('dueDate') !== null && <p className={styles.fieldError}>{fieldError('dueDate')}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="prototype-task-points">
                      {c.points} <span className={styles.optionalMark}>{c.optional}</span>
                    </label>
                    <input
                      className={styles.textInput}
                      id="prototype-task-points"
                      inputMode="numeric"
                      max={100}
                      min={0}
                      onChange={event => update({ points: event.target.value === '' ? null : Number(event.target.value) })}
                      step={1}
                      type="number"
                      value={draft.points ?? ''}
                    />
                    <p className={styles.fieldHint}>{c.pointsHint}</p>
                    {fieldError('points') !== null && <p className={styles.fieldError}>{fieldError('points')}</p>}
                  </div>

                  <fieldset className={cx(styles.formField, styles.formFieldWide)}>
                    <legend className={styles.fieldLabel}>{c.labels}</legend>
                    <div className={styles.labelChoices}>
                      {state.labels.map(label => (
                        <label className={styles.labelChoice} key={label.id}>
                          <input
                            checked={draft.labelIds.includes(label.id)}
                            onChange={event => {
                              const next = event.target.checked
                                ? [...draft.labelIds, label.id]
                                : draft.labelIds.filter(id => id !== label.id);
                              update({ labelIds: next });
                            }}
                            type="checkbox"
                          />
                          {label.name}
                        </label>
                      ))}
                    </div>
                    {fieldError('labelIds') !== null && <p className={styles.fieldError}>{fieldError('labelIds')}</p>}
                  </fieldset>
                </div>
              </details>
            </fieldset>

            {confirmDiscard && (
              <div aria-live="assertive" className={styles.confirmDiscard} role="alert">
                <div>
                  <strong>{c.discardDraftTitle}</strong>
                  <p>{c.discardDraftBody}</p>
                </div>
                <div className={styles.confirmActions}>
                  <button className={styles.secondaryButton} onClick={discard} type="button">
                    {c.discard}
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => setConfirmDiscard(false)}
                    ref={keepEditingRef}
                    type="button"
                  >
                    {c.keepEditing}
                  </button>
                </div>
              </div>
            )}
          </div>

          <footer className={styles.modalFooter}>
            <button
              className={styles.secondaryButton}
              disabled={pending}
              onClick={() => {
                if (confirmDiscard) discard();
                else closeOrConfirm();
              }}
              type="button"
            >
              {c.discardDraft}
            </button>
            <button className={styles.primaryButton} disabled={pending || confirmDiscard} type="submit">
              {pending ? c.saving : isCreate ? c.createTask : c.saveTask}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
