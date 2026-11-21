'use client';

import type { ReactNode } from 'react';
import type { SprintStartReview } from '../../../lib/sprint-screen-model';
import { ModalFrame, useLocale } from '../project-ui';
import { formatDateOnly } from '../strings';
import { SprintTotalsView } from './sprint-workspace';
import { sprintCopy as c, sprintReviewCopy as r } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

/** The parent retains the captured review and owns freshness, confirmation and cancellation. */
export function SprintStartDialog({
  review,
  pending,
  confirmDisabled,
  feedback,
  onConfirm,
  onCancel,
}: {
  review: SprintStartReview;
  pending: boolean;
  confirmDisabled: boolean;
  feedback?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const lang = useLocale();
  return (
    <ModalFrame title={c.startTitle} busy={pending} onClose={onCancel}>
      <div className={styles.reviewBody}>
        <p data-autofocus tabIndex={-1}>
          {c.startHint[lang]}
        </p>
        {feedback}
        <h3 className={styles.sprintTitle}>{review.name}</h3>
        <div className={styles.goal}>
          <h4>{c.goal[lang]}</h4>
          <p>{review.goal}</p>
        </div>
        <dl className={styles.metadata}>
          <div>
            <dt>{c.startDate[lang]}</dt>
            <dd>
              <time dateTime={review.startDate}>{formatDateOnly(review.startDate, lang)}</time>
            </dd>
          </div>
          <div>
            <dt>{c.endDate[lang]}</dt>
            <dd>
              <time dateTime={review.endDateExclusive}>
                {formatDateOnly(review.endDateExclusive, lang)}
              </time>
            </dd>
          </div>
          <div>
            <dt>{c.zone[lang]}</dt>
            <dd>{review.timeZone}</dd>
          </div>
        </dl>
        <p className={styles.hint}>{c.datesHint[lang]}</p>
        <h4 className={styles.reviewSubheading}>{r.capturedScope[lang]}</h4>
        <SprintTotalsView totals={review.totals} />
        <div className={styles.actions}>
          <button
            className={ui.primary}
            type="button"
            disabled={confirmDisabled || pending}
            onClick={onConfirm}
          >
            {pending ? r.starting[lang] : r.confirmStart[lang]}
          </button>
          <button className={ui.secondary} type="button" disabled={pending} onClick={onCancel}>
            {c.cancel[lang]}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
