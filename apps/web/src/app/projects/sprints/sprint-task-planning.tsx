'use client';

import { useId, type FormEventHandler, type ReactNode } from 'react';
import type { TaskPlanning } from '@rielia/contracts';
import type { SprintHistoryPort } from '../../../lib/sprint-screen-model';
import { FieldError, useLocale } from '../project-ui';
import type { SprintDestinationOption } from './sprint-close-review';
import { SprintHistory } from './sprint-history';
import { sprintCopy as c, sprintReviewCopy as r } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

interface SprintTaskFieldPort {
  value: string;
  disabled: boolean;
  pending: boolean;
  error: string | null;
  feedback?: ReactNode;
  onChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
}
export interface SprintEstimateFormPort extends SprintTaskFieldPort {
  points: readonly string[];
}
export interface SprintParticipationFormPort extends SprintTaskFieldPort {
  submitDisabled: boolean;
  destinations: readonly SprintDestinationOption[];
  destinationPaging?: ReactNode;
}

/** Null edit/form ports expose only canonical data and history; SOL owns each editing lifetime. */
export function SprintTaskPlanning({
  planning,
  history,
  onEditEstimate,
  onEditParticipation,
  estimateForm,
  participationForm,
  feedback,
  focusScope,
}: {
  planning: TaskPlanning;
  history: SprintHistoryPort;
  onEditEstimate: (() => void) | null;
  onEditParticipation: (() => void) | null;
  estimateForm: SprintEstimateFormPort | null;
  participationForm: SprintParticipationFormPort | null;
  feedback?: ReactNode;
  focusScope?: string;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <section
      className={styles.taskPlanning}
      aria-labelledby={`${id}-heading`}
      data-sprint-focus-scope={focusScope}
    >
      <h3 id={`${id}-heading`} tabIndex={-1} data-sprint-focus-heading="task">
        {c.taskPlanning[lang]}
      </h3>
      {feedback}
      <dl className={styles.snapshot}>
        <div>
          <dt>{c.estimate[lang]}</dt>
          <dd>
            {planning.snapshot.estimatePoints === null
              ? c.unestimated[lang]
              : `${planning.snapshot.estimatePoints} ${c.points[lang]}`}
          </dd>
        </div>
        <div>
          <dt>{c.assignment[lang]}</dt>
          <dd>{planning.currentParticipation?.sprint.name ?? c.backlog[lang]}</dd>
        </div>
      </dl>
      <div className={styles.actions}>
        {onEditEstimate && estimateForm === null && (
          <button
            data-sprint-action="estimate-task"
            className={ui.secondary}
            type="button"
            onClick={onEditEstimate}
          >
            {r.editEstimate[lang]}
          </button>
        )}
        {onEditParticipation && participationForm === null && (
          <button
            data-sprint-action="set-task-sprint"
            className={ui.secondary}
            type="button"
            onClick={onEditParticipation}
          >
            {r.editParticipation[lang]}
          </button>
        )}
      </div>
      {estimateForm && (
        <form
          className={styles.form}
          noValidate
          onSubmit={estimateForm.onSubmit}
          aria-labelledby={`${id}-estimate-heading`}
        >
          <h4 className={styles.reviewSubheading} id={`${id}-estimate-heading`}>
            {r.editEstimate[lang]}
          </h4>
          {estimateForm.feedback}
          <div className={styles.field}>
            <label htmlFor={`${id}-estimate`}>{c.estimate[lang]}</label>
            <select
              id={`${id}-estimate`}
              data-autofocus
              value={estimateForm.value}
              disabled={estimateForm.disabled || estimateForm.pending}
              aria-invalid={Boolean(estimateForm.error)}
              aria-describedby={estimateForm.error ? `${id}-estimate-error` : undefined}
              onChange={(event) => estimateForm.onChange(event.currentTarget.value)}
            >
              <option value="">{c.unestimated[lang]}</option>
              {estimateForm.points.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
            {estimateForm.error && (
              <FieldError id={`${id}-estimate-error`}>{estimateForm.error}</FieldError>
            )}
          </div>
          <div className={styles.actions}>
            <button
              className={ui.primary}
              type="submit"
              disabled={estimateForm.disabled || estimateForm.pending}
            >
              {estimateForm.pending ? c.saving[lang] : c.saveEstimate[lang]}
            </button>
            <button
              className={ui.secondary}
              type="button"
              disabled={estimateForm.pending}
              onClick={estimateForm.onCancel}
            >
              {r.cancelEdit[lang]}
            </button>
          </div>
        </form>
      )}
      {participationForm && (
        <form
          className={styles.form}
          noValidate
          onSubmit={participationForm.onSubmit}
          aria-labelledby={`${id}-participation-heading`}
        >
          <h4 className={styles.reviewSubheading} id={`${id}-participation-heading`}>
            {r.editParticipation[lang]}
          </h4>
          {participationForm.feedback}
          <div className={styles.field}>
            <label htmlFor={`${id}-destination`}>{c.assignment[lang]}</label>
            <select
              id={`${id}-destination`}
              data-autofocus
              value={participationForm.value}
              disabled={participationForm.disabled || participationForm.pending}
              aria-invalid={Boolean(participationForm.error)}
              aria-describedby={participationForm.error ? `${id}-destination-error` : undefined}
              onChange={(event) => participationForm.onChange(event.currentTarget.value)}
            >
              <option value="">{c.backlog[lang]}</option>
              {participationForm.destinations.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            {participationForm.error && (
              <FieldError id={`${id}-destination-error`}>{participationForm.error}</FieldError>
            )}
          </div>
          {participationForm.destinationPaging}
          <div className={styles.actions}>
            <button
              className={ui.primary}
              type="submit"
              disabled={
                participationForm.disabled ||
                participationForm.pending ||
                participationForm.submitDisabled
              }
            >
              {participationForm.pending ? c.saving[lang] : c.apply[lang]}
            </button>
            <button
              className={ui.secondary}
              type="button"
              disabled={participationForm.pending}
              onClick={participationForm.onCancel}
            >
              {r.cancelEdit[lang]}
            </button>
          </div>
        </form>
      )}
      <SprintHistory port={history} scope="task" />
    </section>
  );
}
