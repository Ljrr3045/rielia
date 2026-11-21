'use client';

import { useId, type FormEventHandler, type ReactNode } from 'react';
import { useLocale } from '../project-ui';
import type { SprintDestinationOption } from './sprint-close-review';
import { sprintCopy as c } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

/** Parent supplies authorized options, raw fields and independent explicit submit handlers. */
export function SprintTaskPlanning({
  estimate,
  points,
  destination,
  destinations,
  estimateDisabled,
  scopeDisabled,
  estimatePending,
  scopePending,
  onEstimate,
  onDestination,
  onSaveEstimate,
  onSaveParticipation,
  estimateFeedback,
  scopeFeedback,
  children,
}: {
  estimate: string;
  points: readonly string[];
  destination: string;
  destinations: readonly SprintDestinationOption[];
  estimateDisabled: boolean;
  scopeDisabled: boolean;
  estimatePending: boolean;
  scopePending: boolean;
  onEstimate: (value: string) => void;
  onDestination: (value: string) => void;
  onSaveEstimate: FormEventHandler<HTMLFormElement>;
  onSaveParticipation: FormEventHandler<HTMLFormElement>;
  estimateFeedback?: ReactNode;
  scopeFeedback?: ReactNode;
  children?: ReactNode;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <section className={styles.taskPlanning} aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`}>{c.taskPlanning[lang]}</h3>
      <form className={styles.form} noValidate onSubmit={onSaveEstimate}>
        {estimateFeedback}
        <div className={styles.field}>
          <label htmlFor={`${id}-estimate`}>{c.estimate[lang]}</label>
          <select
            id={`${id}-estimate`}
            value={estimate}
            disabled={estimateDisabled}
            onChange={(event) => onEstimate(event.currentTarget.value)}
          >
            <option value="">{c.unestimated[lang]}</option>
            {points.map((point) => (
              <option key={point} value={point}>
                {point}
              </option>
            ))}
          </select>
        </div>
        <button className={ui.secondary} type="submit" disabled={estimateDisabled}>
          {estimatePending ? c.saving[lang] : c.saveEstimate[lang]}
        </button>
      </form>
      <form className={styles.form} noValidate onSubmit={onSaveParticipation}>
        {scopeFeedback}
        <div className={styles.field}>
          <label htmlFor={`${id}-destination`}>{c.assignment[lang]}</label>
          <select
            id={`${id}-destination`}
            value={destination}
            disabled={scopeDisabled}
            onChange={(event) => onDestination(event.currentTarget.value)}
          >
            <option value="">{c.backlog[lang]}</option>
            {destinations.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {children}
        <button className={ui.secondary} type="submit" disabled={scopeDisabled}>
          {scopePending ? c.saving[lang] : c.apply[lang]}
        </button>
      </form>
    </section>
  );
}
