'use client';

import { useId, type ReactNode } from 'react';
import type {
  SprintClosePreview,
  SprintClosure,
  SprintClosingOutcomePage,
} from '@rielia/contracts';
import { useLocale, Badge } from '../project-ui';
import { statusName } from '../strings';
import { sprintCopy as c } from './sprint-copy';
import { SprintTotalsView, type SprintTaskLabel } from './sprint-workspace';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

export interface SprintDestinationOption {
  value: string;
  label: string;
  disabled: boolean;
}

/** Selection is a raw field intent. Only Get preview and Confirm invoke their supplied actions. */
export function SprintCloseReview({
  destination,
  destinations,
  preview,
  reviewedDestination,
  disabled,
  confirmDisabled,
  pending,
  notice,
  onDestination,
  onPreview,
  onConfirm,
  onCancel,
  children,
}: {
  destination: string;
  destinations: readonly SprintDestinationOption[];
  preview: SprintClosePreview | null;
  reviewedDestination: string;
  disabled: boolean;
  confirmDisabled: boolean;
  pending: boolean;
  notice?: ReactNode;
  onDestination: (value: string) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <div className={styles.closeReview}>
      <p>{c.closeHint[lang]}</p>
      {notice}
      <div className={styles.field}>
        <label htmlFor={id}>{c.destination[lang]}</label>
        <select
          id={id}
          data-autofocus
          aria-describedby={`${id}-hint`}
          value={destination}
          disabled={disabled}
          onChange={(event) => onDestination(event.currentTarget.value)}
        >
          <option value="">{c.chooseDestination[lang]}</option>
          <option value="backlog">{c.backlog[lang]}</option>
          {destinations.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <p className={styles.hint} id={`${id}-hint`}>
          {c.destinationHint[lang]}
        </p>
      </div>
      {children}
      <button className={ui.secondary} type="button" disabled={disabled} onClick={onPreview}>
        {c.preview[lang]}
      </button>
      {preview && (
        <section className={styles.preview} aria-labelledby={`${id}-preview`}>
          <h3 id={`${id}-preview`}>{c.previewTitle[lang]}</h3>
          <p className={styles.hint}>{c.completePreview[lang]}</p>
          <SprintTotalsView totals={preview.totals} />
          <dl className={styles.decision}>
            <div>
              <dt>{c.pendingParticipants[lang]}</dt>
              <dd>{preview.pendingParticipants}</dd>
            </div>
            <div>
              <dt>{c.previewDestination[lang]}</dt>
              <dd>{reviewedDestination}</dd>
            </div>
          </dl>
          <p>{c.closeConsequence[lang]}</p>
        </section>
      )}
      <div className={styles.actions}>
        <button className={ui.primary} type="button" disabled={confirmDisabled} onClick={onConfirm}>
          {pending ? c.saving[lang] : c.confirmClose[lang]}
        </button>
        <button className={ui.secondary} type="button" disabled={pending} onClick={onCancel}>
          {c.cancel[lang]}
        </button>
      </div>
    </div>
  );
}

export function SprintClosedResults({
  closure,
  outcomes,
  labels,
  destinationLabel,
  loadingMore,
  disabled,
  onLoadMore,
  notice,
}: {
  closure: SprintClosure;
  outcomes: SprintClosingOutcomePage | null;
  labels: Readonly<Record<string, SprintTaskLabel>>;
  destinationLabel: string;
  loadingMore: boolean;
  disabled: boolean;
  onLoadMore: () => void;
  notice?: ReactNode;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <section className={styles.scope} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <h3 id={id}>{c.frozen[lang]}</h3>
        <p className={styles.hint}>{c.frozenHint[lang]}</p>
      </header>
      {notice}
      <SprintTotalsView totals={closure.totals} />
      <dl className={styles.decision}>
        <div>
          <dt>{c.pendingParticipants[lang]}</dt>
          <dd>{closure.pendingParticipants}</dd>
        </div>
        <div>
          <dt>{c.previewDestination[lang]}</dt>
          <dd>{destinationLabel}</dd>
        </div>
      </dl>
      {outcomes?.total === 0 && <p className={styles.empty}>{c.noOutcomes[lang]}</p>}
      <ul className={styles.rows}>
        {outcomes?.items.map((item) => (
          <li key={item.id} className={styles.row}>
            <div className={styles.taskLabel}>
              <span className={styles.taskKey}>{labels[item.taskId]?.key ?? item.taskId}</span>
              {labels[item.taskId] && <span>{labels[item.taskId]?.title}</span>}
            </div>
            <div className={styles.rowMeta}>
              <span>{statusName(item.snapshot.status)[lang]}</span>
              <span>
                {item.snapshot.estimatePoints === null
                  ? c.unestimated[lang]
                  : `${item.snapshot.estimatePoints} ${c.points[lang]}`}
              </span>
              <Badge>
                {item.disposition === 'backlog' ? c.toBacklog[lang] : c[item.disposition][lang]}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      {outcomes && (
        <div className={styles.pager}>
          <span>
            {c.loaded[lang]} {outcomes.items.length} {c.of[lang]} {outcomes.total}
          </span>
          {outcomes.nextCursor && (
            <button
              className={ui.secondary}
              type="button"
              disabled={disabled || loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? c.loadingMore[lang] : c.loadMore[lang]}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
