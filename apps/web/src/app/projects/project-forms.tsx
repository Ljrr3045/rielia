'use client';

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { ProjectVisibility } from '@rielia/contracts';
import { Badge, FieldError, useLocale } from './project-ui';
import { copy, visibilityName } from './strings';
import styles from './projects.module.css';

export interface ProjectFormValue {
  name: string;
  key: string;
  description: string;
  visibility: ProjectVisibility;
}

export function ProjectForm({
  mode,
  value,
  canCreatePrivate = false,
  pending,
  disabled = false,
  errorField = null,
  errorMessage = null,
  onChange,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  value: ProjectFormValue;
  canCreatePrivate?: boolean;
  pending: boolean;
  disabled?: boolean;
  errorField?: string | null;
  errorMessage?: string | null;
  onChange: (fields: Partial<ProjectFormValue>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const lang = useLocale();
  const nameId = useId();
  const keyId = useId();
  const descriptionId = useId();
  const visibilityId = useId();
  const nameErrorId = useId();
  const keyErrorId = useId();
  const [localError, setLocalError] = useState<'name' | 'key' | null>(null);

  const nameError = errorField === 'name' || localError === 'name';
  const keyError = errorField === 'key' || localError === 'key';
  const message = errorMessage ?? copy.project.nameRequired[lang];
  const blocked = pending || disabled;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.name.trim().length === 0) {
      setLocalError('name');
      return;
    }
    if (mode === 'create' && value.key.trim().length === 0) {
      setLocalError('key');
      return;
    }
    setLocalError(null);
    onSubmit();
  }

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={nameId}>
            {copy.project.nameLabel[lang]} <span className={styles.requiredMark}>{copy.form.requiredMark[lang]}</span>
          </label>
          <input
            aria-describedby={nameError ? nameErrorId : undefined}
            aria-invalid={nameError}
            autoComplete="off"
            data-autofocus
            disabled={blocked}
            id={nameId}
            maxLength={200}
            onChange={event => {
              if (localError === 'name') setLocalError(null);
              onChange({ name: event.currentTarget.value });
            }}
            required
            type="text"
            value={value.name}
          />
          {nameError
            ? <FieldError id={nameErrorId}>{message}</FieldError>
            : <p className={styles.fieldHint}>{copy.project.nameHint[lang]}</p>}
        </div>

        {mode === 'create' && (
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={keyId}>
              {copy.project.keyLabel[lang]} <span className={styles.requiredMark}>{copy.form.requiredMark[lang]}</span>
            </label>
            <input
              aria-describedby={keyError ? keyErrorId : undefined}
              aria-invalid={keyError}
              autoComplete="off"
              disabled={blocked}
              id={keyId}
              maxLength={10}
              onChange={event => {
                if (localError === 'key') setLocalError(null);
                onChange({ key: event.currentTarget.value.toUpperCase() });
              }}
              required
              spellCheck={false}
              type="text"
              value={value.key}
            />
            {keyError
              ? <FieldError id={keyErrorId}>{copy.project.keyRequired[lang]}</FieldError>
              : <p className={styles.fieldHint}>{copy.project.keyHint[lang]}</p>}
          </div>
        )}

        {mode === 'edit' && (
          <div className={styles.fieldWide}>
            <div className={styles.fixedContext}>
              <span>{copy.project.keyLabel[lang]}</span>
              <span className={styles.fixedContextValue}><span className={styles.taskKey}>{value.key}</span></span>
              <span className={styles.fieldHint}>{copy.project.keyImmutableHint[lang]}</span>
            </div>
          </div>
        )}

        <div className={styles.fieldWide}>
          <label className={styles.fieldLabel} htmlFor={descriptionId}>
            {copy.project.descriptionLabel[lang]} <span className={styles.optionalMark}>{copy.form.optionalMark[lang]}</span>
          </label>
          <textarea
            aria-describedby={errorField === 'description' ? descriptionId + '-error' : undefined}
            aria-invalid={errorField === 'description'}
            disabled={blocked}
            id={descriptionId}
            maxLength={20000}
            onChange={event => onChange({ description: event.currentTarget.value })}
            rows={4}
            value={value.description}
          />
          {errorField === 'description'
            ? <FieldError id={descriptionId + '-error'}>{message}</FieldError>
            : <p className={styles.fieldHint}>{copy.project.descriptionHint[lang]}</p>}
        </div>

        {mode === 'create' && (
          <fieldset className={styles.choiceFieldset}>
            <legend className={styles.fieldLabel}>
              {copy.project.visibilityLabel[lang]} <span className={styles.requiredMark}>{copy.form.requiredMark[lang]}</span>
            </legend>
            {canCreatePrivate ? (
              <>
                <div className={styles.choiceGroup}>
                  <label className={styles.choice} htmlFor={visibilityId + '-workspace'}>
                    <input
                      checked={value.visibility === 'workspace'}
                      disabled={blocked}
                      id={visibilityId + '-workspace'}
                      name="project-visibility"
                      onChange={() => onChange({ visibility: 'workspace' })}
                      type="radio"
                      value="workspace"
                    />
                    <span>
                      <span className={styles.choiceTitle}>{copy.project.visibilityWorkspace[lang]}</span>
                      <span className={styles.fieldHint}>{copy.project.visibilityWorkspaceHint[lang]}</span>
                    </span>
                  </label>
                  <label className={styles.choice} htmlFor={visibilityId + '-private'}>
                    <input
                      checked={value.visibility === 'private'}
                      disabled={blocked}
                      id={visibilityId + '-private'}
                      name="project-visibility"
                      onChange={() => onChange({ visibility: 'private' })}
                      type="radio"
                      value="private"
                    />
                    <span>
                      <span className={styles.choiceTitle}>{copy.project.visibilityPrivate[lang]}</span>
                      <span className={styles.fieldHint}>{copy.project.visibilityPrivateHint[lang]}</span>
                    </span>
                  </label>
                </div>
                {value.visibility === 'private' && (
                  <p className={styles.fieldHint}>{copy.access.automaticNote[lang]}</p>
                )}
              </>
            ) : (
              <div className={styles.fixedContext}>
                <Badge tone="neutral">{copy.project.visibilityWorkspace[lang]}</Badge>
                <span className={styles.fieldHint}>{copy.project.visibilityUnavailableHint[lang]}</span>
              </div>
            )}
          </fieldset>
        )}

        {mode === 'edit' && (
          <div className={styles.fieldWide}>
            <div className={styles.fixedContext}>
              <span>{copy.project.visibilityLabel[lang]}</span>
              <Badge tone={value.visibility === 'private' ? 'warning' : 'neutral'}>{visibilityName(value.visibility)[lang]}</Badge>
              <span className={styles.fieldHint}>{copy.project.visibilityManageHint[lang]}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        <button className={styles.primary} disabled={blocked} type="submit">
          {pending
            ? (mode === 'create' ? copy.project.creating[lang] : copy.common.saving[lang])
            : (mode === 'create' ? copy.project.create[lang] : copy.project.saveSettings[lang])}
        </button>
        <button className={styles.secondary} disabled={pending} onClick={onCancel} type="button">
          {copy.common.cancel[lang]}
        </button>
      </div>
    </form>
  );
}
