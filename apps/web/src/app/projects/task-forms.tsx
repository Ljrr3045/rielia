'use client';

import { useId, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  taskPriorities,
  taskStatuses,
  taskTypes,
  type DomainPerson,
  type TaskFields,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from '@rielia/contracts';
import { FieldError, useLocale } from './project-ui';
import { copy, priorityName, statusName, typeName } from './strings';
import styles from './projects.module.css';

export function TaskEditForm({
  value,
  members,
  projectName,
  projectKey,
  pending,
  disabled = false,
  errorField = null,
  errorMessage = null,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: TaskFields;
  members: readonly DomainPerson[];
  projectName: string;
  projectKey: string;
  pending: boolean;
  disabled?: boolean;
  errorField?: string | null;
  errorMessage?: string | null;
  onChange: (fields: Partial<TaskFields>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const lang = useLocale();
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const typeId = useId();
  const priorityId = useId();
  const assigneeId = useId();
  const dueId = useId();
  const titleErrorId = useId();
  const [localError, setLocalError] = useState<'title' | null>(null);
  const titleError = errorField === 'title' || localError === 'title';
  const titleMessage = errorField === 'title' && errorMessage !== null ? errorMessage : copy.task.titleRequired[lang];
  const blocked = pending || disabled;

  const assignees = members.filter(
    member => member.active || member.principalId === value.assigneePrincipalId,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.title.trim().length === 0) {
      setLocalError('title');
      return;
    }
    setLocalError(null);
    onSubmit();
  }

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <div className={styles.fixedContext}>
        <span>{copy.form.projectContext[lang]}</span>
        <span className={styles.fixedContextValue}>{projectName}</span>
        <span className={styles.taskKey}>{projectKey}</span>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldWide}>
          <label className={styles.fieldLabel} htmlFor={titleId}>
            {copy.task.titleLabel[lang]} <span className={styles.requiredMark}>{copy.form.requiredMark[lang]}</span>
          </label>
          <input
            aria-describedby={titleError ? titleErrorId : undefined}
            aria-invalid={titleError}
            data-autofocus
            disabled={blocked}
            id={titleId}
            maxLength={300}
            onChange={event => {
              if (localError === 'title') setLocalError(null);
              onChange({ title: event.currentTarget.value });
            }}
            required
            type="text"
            value={value.title}
          />
          {titleError
            ? <FieldError id={titleErrorId}>{titleMessage}</FieldError>
            : <p className={styles.fieldHint}>{copy.task.titleHint[lang]}</p>}
        </div>

        <div className={styles.fieldWide}>
          <label className={styles.fieldLabel} htmlFor={descriptionId}>
            {copy.task.descriptionLabel[lang]} <span className={styles.optionalMark}>{copy.form.optionalMark[lang]}</span>
          </label>
          <textarea
            disabled={blocked}
            id={descriptionId}
            maxLength={20000}
            onChange={event => onChange({ description: event.currentTarget.value })}
            placeholder={copy.task.descriptionPlaceholder[lang]}
            rows={6}
            value={value.description}
          />
          <p className={styles.fieldHint}>{copy.task.descriptionHint[lang]}</p>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={statusId}>{copy.task.statusLabel[lang]}</label>
          <select
            disabled={blocked}
            id={statusId}
            onChange={event => onChange({ status: event.currentTarget.value as TaskStatus })}
            value={value.status}
          >
            {taskStatuses.map(status => (
              <option key={status} value={status}>{statusName(status)[lang]}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={typeId}>{copy.task.typeLabel[lang]}</label>
          <select
            disabled={blocked}
            id={typeId}
            onChange={event => onChange({ type: event.currentTarget.value as TaskType })}
            value={value.type}
          >
            {taskTypes.map(type => (
              <option key={type} value={type}>{typeName(type)[lang]}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={priorityId}>{copy.task.priorityLabel[lang]}</label>
          <select
            disabled={blocked}
            id={priorityId}
            onChange={event => onChange({ priority: event.currentTarget.value as TaskPriority })}
            value={value.priority}
          >
            {taskPriorities.map(priority => (
              <option key={priority} value={priority}>{priorityName(priority)[lang]}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={dueId}>{copy.task.dueDateLabel[lang]}</label>
          <input
            disabled={blocked}
            id={dueId}
            onChange={event => onChange({ dueDate: event.currentTarget.value.length === 0 ? null : event.currentTarget.value })}
            type="date"
            value={value.dueDate ?? ''}
          />
          <p className={styles.fieldHint}>{copy.task.dueDateHint[lang]}</p>
        </div>

        <div className={styles.fieldWide}>
          <label className={styles.fieldLabel} htmlFor={assigneeId}>{copy.task.assigneeLabel[lang]}</label>
          <select
            disabled={blocked}
            id={assigneeId}
            onChange={event => onChange({ assigneePrincipalId: event.currentTarget.value.length === 0 ? null : event.currentTarget.value })}
            value={value.assigneePrincipalId ?? ''}
          >
            <option value="">{copy.task.unassigned[lang]}</option>
            {assignees.map(member => (
              <option key={member.principalId} value={member.principalId}>
                {member.name}
                {member.kind === 'agent' ? ` · ${copy.task.agentBadge[lang]}` : ''}
                {!member.active ? ` · ${copy.task.inactiveAssignee[lang]}` : ''}
              </option>
            ))}
          </select>
          <p className={styles.fieldHint}>{copy.task.assigneeHint[lang]}</p>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primary} disabled={blocked} type="submit">
          {pending ? copy.common.saving[lang] : copy.task.saveChanges[lang]}
        </button>
        <button className={styles.secondary} disabled={blocked} onClick={onCancel} type="button">
          {copy.common.cancel[lang]}
        </button>
      </div>
    </form>
  );
}

export function TaskCaptureForm({
  value,
  pending,
  disabled = false,
  error = false,
  inputRef,
  onChange,
  onSubmit,
}: {
  value: string;
  pending: boolean;
  disabled?: boolean;
  error?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onChange: (title: string) => void;
  onSubmit: () => void;
}) {
  const lang = useLocale();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [localError, setLocalError] = useState(false);
  const showError = error || localError;
  const blocked = pending || disabled;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim().length === 0) {
      setLocalError(true);
      return;
    }
    setLocalError(false);
    onSubmit();
  }

  return (
    <div className={styles.capturePanel}>
      <form className={styles.captureForm} noValidate onSubmit={submit}>
        <div className={styles.captureInputWrap}>
          <label className={styles.srOnly} htmlFor={inputId}>{copy.task.captureLabel[lang]}</label>
          <input
            aria-describedby={showError ? errorId : hintId}
            aria-invalid={showError}
            autoComplete="off"
            className={styles.captureInput}
            disabled={blocked}
            id={inputId}
            maxLength={300}
            onChange={event => {
              if (localError) setLocalError(false);
              onChange(event.currentTarget.value);
            }}
            placeholder={copy.task.capturePlaceholder[lang]}
            ref={inputRef}
            type="text"
            value={value}
          />
        </div>
        <button className={styles.primary + ' ' + styles.captureSubmit} disabled={blocked} type="submit">
          {pending ? copy.task.capturing[lang] : copy.task.captureSubmit[lang]}
        </button>
      </form>
      {showError
        ? <p className={styles.captureHint + ' ' + styles.captureHintError} id={errorId} role="alert">{copy.task.titleRequired[lang]}</p>
        : <p className={styles.captureHint} id={hintId}>{copy.task.captureHint[lang]}</p>}
    </div>
  );
}
