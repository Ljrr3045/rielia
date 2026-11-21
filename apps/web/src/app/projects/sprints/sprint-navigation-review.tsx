'use client';

import type { SprintNavigationReviewPort } from '../../../lib/sprint-screen-model';
import { ModalFrame, useLocale } from '../project-ui';
import { sprintReviewCopy as r, sprintGuardCopy } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

/** destinationLabel is the parent's human-readable label for this exact latest destinationURL. */
export function SprintNavigationDialog({
  review,
  destinationLabel,
}: {
  review: SprintNavigationReviewPort;
  destinationLabel: string;
}) {
  const lang = useLocale();
  return (
    <ModalFrame title={r.leaveTitle} onClose={review.onStay} small>
      <div className={styles.reviewBody}>
        <p data-autofocus tabIndex={-1}>
          {r.leaveHint[lang]}
        </p>
        <dl className={styles.decision}>
          <div>
            <dt>{r.requestedDestination[lang]}</dt>
            <dd>{destinationLabel}</dd>
          </div>
        </dl>
        <div className={styles.guardList} role="status" aria-live="polite">
          {review.taskGuard !== 'none' && (
            <div>
              <h3>{r.taskWork[lang]}</h3>
              <p>{sprintGuardCopy[review.taskGuard][lang]}</p>
            </div>
          )}
          {review.sprintGuard !== 'none' && (
            <div>
              <h3>{r.sprintWork[lang]}</h3>
              <p>{sprintGuardCopy[review.sprintGuard][lang]}</p>
            </div>
          )}
        </div>
        {review.onDiscard && <p className={styles.hint}>{r.discardHint[lang]}</p>}
        <div className={styles.actions}>
          <button className={ui.primary} type="button" onClick={review.onStay}>
            {r.stay[lang]}
          </button>
          {review.onDiscard && (
            <button className={ui.secondary} type="button" onClick={review.onDiscard}>
              {r.discardContinue[lang]}
            </button>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
