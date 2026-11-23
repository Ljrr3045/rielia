'use client';

import { useId, type ReactNode } from 'react';
import type { SprintFields, PlanningSettings, TaskPlanning } from '@rielia/contracts';
import type { SprintConflictReview } from '../../../lib/sprint-screen-model';
import { useLocale } from '../project-ui';
import { formatDateOnly } from '../strings';
import { SprintPlanningSnapshot } from './sprint-history';
import { sprintCopy as c, sprintReviewCopy as r } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

function SprintFieldComparison({ fields }: { fields: SprintFields }) {
  const lang = useLocale();
  return (
    <dl className={styles.snapshot}>
      <div>
        <dt>{c.name[lang]}</dt>
        <dd>{fields.name}</dd>
      </div>
      <div>
        <dt>{c.goal[lang]}</dt>
        <dd className={styles.multiline}>{fields.goal}</dd>
      </div>
      <div>
        <dt>{c.startDate[lang]}</dt>
        <dd>
          <time dateTime={fields.startDate}>{formatDateOnly(fields.startDate, lang)}</time>
        </dd>
      </div>
      <div>
        <dt>{c.endDate[lang]}</dt>
        <dd>
          <time dateTime={fields.endDateExclusive}>
            {formatDateOnly(fields.endDateExclusive, lang)}
          </time>
        </dd>
      </div>
    </dl>
  );
}

function PlanningSettingsComparison({ settings }: { settings: PlanningSettings }) {
  const lang = useLocale();
  return (
    <dl className={styles.snapshot}>
      <div>
        <dt>{c.mode[lang]}</dt>
        <dd>{settings.mode === 'scrum' ? 'Scrum' : 'Kanban'}</dd>
      </div>
      <div>
        <dt>{c.projectZone[lang]}</dt>
        <dd>{settings.timeZone}</dd>
      </div>
      <div>
        <dt>{c.scale[lang]}</dt>
        <dd>{settings.pointScale.join(', ')}</dd>
      </div>
    </dl>
  );
}

function TaskPlanningComparison({ task }: { task: TaskPlanning }) {
  const lang = useLocale();
  return (
    <>
      <SprintPlanningSnapshot snapshot={task.snapshot} />
      <dl className={styles.snapshot}>
        <div>
          <dt>{c.assignment[lang]}</dt>
          <dd>{task.currentParticipation?.sprint.name ?? c.backlog[lang]}</dd>
        </div>
      </dl>
    </>
  );
}

/** Both snapshots remain read-only; the supplied callbacks alone may reload, rebase or discard. */
export function SprintConflictComparison({
  review,
  destinationLabel,
  onReload,
  onRebase,
  onDiscard,
  feedback,
}: {
  review: SprintConflictReview;
  destinationLabel: string;
  onReload: (() => void) | null;
  onRebase: (() => void) | null;
  onDiscard: (() => void) | null;
  feedback?: ReactNode;
}) {
  const lang = useLocale();
  const id = useId();
  const { draft, current } = review;
  return (
    <section className={styles.conflict} aria-labelledby={id}>
      <h3 id={id}>{r.compare[lang]}</h3>
      <p className={styles.hint}>{r.compareHint[lang]}</p>
      {feedback}
      <div className={styles.comparison}>
        <div>
          <h4>{r.draft[lang]}</h4>
          {(draft.type === 'create-sprint' || draft.type === 'edit-sprint') && (
            <SprintFieldComparison fields={draft.fields} />
          )}
          {draft.type === 'configure-planning' && (
            <PlanningSettingsComparison settings={draft.settings} />
          )}
          {draft.type === 'estimate-task' && (
            <dl className={styles.snapshot}>
              <div>
                <dt>{c.estimate[lang]}</dt>
                <dd>
                  {draft.input.estimatePoints === null
                    ? c.unestimated[lang]
                    : `${draft.input.estimatePoints} ${c.points[lang]}`}
                </dd>
              </div>
            </dl>
          )}
          {draft.type === 'set-task-sprint' && (
            <dl className={styles.snapshot}>
              <div>
                <dt>{c.assignment[lang]}</dt>
                <dd>{destinationLabel}</dd>
              </div>
            </dl>
          )}
          {draft.type === 'start-sprint' && <p>{r.startDecision[lang]}</p>}
          {draft.type === 'close-sprint' && (
            <>
              <p>{r.closeDecision[lang]}</p>
              <dl className={styles.snapshot}>
                <div>
                  <dt>{c.previewDestination[lang]}</dt>
                  <dd>{destinationLabel}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
        <div>
          <h4>{r.serverCurrent[lang]}</h4>
          {'snapshot' in current ? (
            <TaskPlanningComparison task={current} />
          ) : 'state' in current ? (
            <>
              <SprintFieldComparison fields={current} />
              <dl className={styles.snapshot}>
                <div>
                  <dt>{r.status[lang]}</dt>
                  <dd>{c[current.state][lang]}</dd>
                </div>
                <div>
                  <dt>{c.zone[lang]}</dt>
                  <dd>{current.timeZone}</dd>
                </div>
              </dl>
            </>
          ) : (
            <PlanningSettingsComparison settings={current} />
          )}
        </div>
      </div>
      {(draft.type === 'create-sprint' || draft.type === 'edit-sprint' || 'state' in current) && (
        <p className={styles.hint}>{c.datesHint[lang]}</p>
      )}
      <p className={styles.hint}>
        {draft.type === 'close-sprint'
          ? r.closeConflict[lang]
          : review.canRebase
            ? r.rebaseHint[lang]
            : r.rebaseUnavailable[lang]}
      </p>
      <div className={styles.actions}>
        {onReload && (
          <button className={ui.secondary} type="button" onClick={onReload}>
            {r.reload[lang]}
          </button>
        )}
        {onRebase && draft.type !== 'close-sprint' && (
          <button
            className={ui.primary}
            type="button"
            disabled={!review.canRebase}
            onClick={onRebase}
          >
            {r.rebase[lang]}
          </button>
        )}
        {onDiscard && (
          <button className={ui.secondary} type="button" onClick={onDiscard}>
            {r.discardDecision[lang]}
          </button>
        )}
      </div>
    </section>
  );
}
