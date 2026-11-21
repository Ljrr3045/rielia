'use client';

import { useId, type FormEventHandler, type ReactNode } from 'react';
import type { SprintFields } from '@rielia/contracts';
import { FieldError, useLocale } from '../project-ui';
import { sprintCopy as c } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

interface FormPorts {
  disabled: boolean;
  pending: boolean;
  feedback?: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
}

/** Parent owns captured drafts, validation and command preparation; these inputs emit strings. */
export function SprintFieldsForm({
  value,
  timeZone,
  errors,
  creating,
  onChange,
  ...ports
}: FormPorts & {
  value: SprintFields;
  timeZone: string;
  errors: Partial<Record<keyof SprintFields, string>>;
  creating: boolean;
  onChange: (field: keyof SprintFields, value: string) => void;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <form className={styles.form} noValidate onSubmit={ports.onSubmit}>
      {ports.feedback}
      <div className={styles.field}>
        <label htmlFor={`${id}-name`}>{c.name[lang]}</label>
        <input
          id={`${id}-name`}
          data-autofocus
          value={value.name}
          disabled={ports.disabled}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          onChange={(event) => onChange('name', event.currentTarget.value)}
        />
        {errors.name && <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-goal`}>{c.goal[lang]}</label>
        <textarea
          id={`${id}-goal`}
          value={value.goal}
          disabled={ports.disabled}
          required
          rows={4}
          aria-invalid={Boolean(errors.goal)}
          aria-describedby={errors.goal ? `${id}-goal-error` : undefined}
          onChange={(event) => onChange('goal', event.currentTarget.value)}
        />
        {errors.goal && <FieldError id={`${id}-goal-error`}>{errors.goal}</FieldError>}
      </div>
      <div className={styles.dateFields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-start`}>{c.startDate[lang]}</label>
          <input
            id={`${id}-start`}
            type="date"
            value={value.startDate}
            disabled={ports.disabled}
            required
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? `${id}-start-error` : undefined}
            onChange={(event) => onChange('startDate', event.currentTarget.value)}
          />
          {errors.startDate && <FieldError id={`${id}-start-error`}>{errors.startDate}</FieldError>}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-end`}>{c.endDate[lang]}</label>
          <input
            id={`${id}-end`}
            type="date"
            value={value.endDateExclusive}
            disabled={ports.disabled}
            required
            aria-invalid={Boolean(errors.endDateExclusive)}
            aria-describedby={`${id}-date-hint${errors.endDateExclusive ? ` ${id}-end-error` : ''}`}
            onChange={(event) => onChange('endDateExclusive', event.currentTarget.value)}
          />
          {errors.endDateExclusive && (
            <FieldError id={`${id}-end-error`}>{errors.endDateExclusive}</FieldError>
          )}
        </div>
      </div>
      <p id={`${id}-date-hint`} className={styles.hint}>
        {c.datesHint[lang]}
      </p>
      <div className={styles.zone}>
        <strong>{c.zone[lang]}</strong>
        <span>{timeZone}</span>
        <p className={styles.hint}>{c.zoneHint[lang]}</p>
      </div>
      <FormActions {...ports} label={creating ? c.create[lang] : c.save[lang]} />
    </form>
  );
}

export interface PlanningSettingsFields {
  mode: string;
  timeZone: string;
  pointScale: string;
}

export function SprintSettingsForm({
  value,
  errors,
  onChange,
  ...ports
}: FormPorts & {
  value: PlanningSettingsFields;
  errors: Partial<Record<keyof PlanningSettingsFields, string>>;
  onChange: (field: keyof PlanningSettingsFields, value: string) => void;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <form className={styles.form} noValidate onSubmit={ports.onSubmit}>
      {ports.feedback}
      <div className={styles.field}>
        <label htmlFor={`${id}-mode`}>{c.mode[lang]}</label>
        <select
          id={`${id}-mode`}
          data-autofocus
          value={value.mode}
          disabled={ports.disabled}
          aria-invalid={Boolean(errors.mode)}
          aria-describedby={errors.mode ? `${id}-mode-error` : undefined}
          onChange={(event) => onChange('mode', event.currentTarget.value)}
        >
          <option value="kanban">Kanban</option>
          <option value="scrum">Scrum</option>
        </select>
        {errors.mode && <FieldError id={`${id}-mode-error`}>{errors.mode}</FieldError>}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-zone`}>{c.projectZone[lang]}</label>
        <input
          id={`${id}-zone`}
          value={value.timeZone}
          disabled={ports.disabled}
          required
          aria-invalid={Boolean(errors.timeZone)}
          aria-describedby={`${id}-zone-hint${errors.timeZone ? ` ${id}-zone-error` : ''}`}
          onChange={(event) => onChange('timeZone', event.currentTarget.value)}
        />
        <p id={`${id}-zone-hint`} className={styles.hint}>
          {c.settingsHint[lang]}
        </p>
        {errors.timeZone && <FieldError id={`${id}-zone-error`}>{errors.timeZone}</FieldError>}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-scale`}>{c.scale[lang]}</label>
        <input
          id={`${id}-scale`}
          value={value.pointScale}
          disabled={ports.disabled}
          required
          aria-invalid={Boolean(errors.pointScale)}
          aria-describedby={`${id}-scale-hint${errors.pointScale ? ` ${id}-scale-error` : ''}`}
          onChange={(event) => onChange('pointScale', event.currentTarget.value)}
        />
        <p id={`${id}-scale-hint`} className={styles.hint}>
          {c.scaleHint[lang]}
        </p>
        {errors.pointScale && <FieldError id={`${id}-scale-error`}>{errors.pointScale}</FieldError>}
      </div>
      <FormActions {...ports} label={c.save[lang]} />
    </form>
  );
}

function FormActions({
  disabled,
  pending,
  onCancel,
  label,
}: Pick<FormPorts, 'disabled' | 'pending' | 'onCancel'> & { label: string }) {
  const lang = useLocale();
  return (
    <div className={styles.actions}>
      <button className={ui.primary} type="submit" disabled={disabled}>
        {pending ? c.saving[lang] : label}
      </button>
      <button className={ui.secondary} type="button" disabled={pending} onClick={onCancel}>
        {c.cancel[lang]}
      </button>
    </div>
  );
}
