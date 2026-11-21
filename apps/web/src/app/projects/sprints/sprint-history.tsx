'use client';

import { useId } from 'react';
import type { PlanningSnapshot } from '@rielia/contracts';
import type { SprintHistoryPort } from '../../../lib/sprint-screen-model';
import { Badge, useLocale } from '../project-ui';
import { copy, statusName } from '../strings';
import { formatTimestamp, provenanceLabel } from '../task-collaboration-shared';
import { sprintCopy as c, sprintReviewCopy as r, sprintHistoryKindCopy } from './sprint-copy';
import type { SprintTaskLabel } from './sprint-workspace';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

export function SprintPlanningSnapshot({ snapshot }: { snapshot: PlanningSnapshot | null }) {
  const lang = useLocale();
  if (snapshot === null) return <p className={styles.hint}>{r.noSnapshot[lang]}</p>;
  return (
    <dl className={styles.snapshot}>
      <div>
        <dt>{r.status[lang]}</dt>
        <dd>{statusName(snapshot.status)[lang]}</dd>
      </div>
      <div>
        <dt>{c.estimate[lang]}</dt>
        <dd>
          {snapshot.estimatePoints === null
            ? c.unestimated[lang]
            : `${snapshot.estimatePoints} ${c.points[lang]}`}
        </dd>
      </div>
      <div>
        <dt>{r.parent[lang]}</dt>
        <dd>{snapshot.parentTaskId ?? r.topLevel[lang]}</dd>
      </div>
      <div>
        <dt>{r.archive[lang]}</dt>
        <dd>{snapshot.archivedAt === null ? r.notArchived[lang] : c.archivedTask[lang]}</dd>
      </div>
    </dl>
  );
}

/** Canonical order, snapshots and actor/provenance are rendered without reconstructing history. */
export function SprintHistory({
  port,
  scope,
  labels = {},
}: {
  port: SprintHistoryPort;
  scope: 'sprint' | 'task';
  labels?: Readonly<Record<string, SprintTaskLabel>>;
}) {
  const lang = useLocale();
  const id = useId();
  const { resource, onReload, onLoadMore } = port;
  const page = resource.data;
  return (
    <section className={styles.history} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <h3 id={id}>{scope === 'sprint' ? r.sprintHistory[lang] : r.taskHistory[lang]}</h3>
        <p className={styles.hint}>{r.historyHint[lang]}</p>
      </header>
      {resource.status === 'idle' && page === null && (
        <div className={styles.reviewBody}>
          <p className={styles.hint}>{r.historyIdle[lang]}</p>
          <button className={ui.secondary} type="button" onClick={onReload}>
            {r.loadHistory[lang]}
          </button>
        </div>
      )}
      {resource.status === 'loading' && (
        <p className={styles.hint} role="status">
          {page === null ? r.historyLoading[lang] : r.historyRefreshing[lang]}
        </p>
      )}
      {(resource.status === 'error' || resource.status === 'changed' || resource.stale) && (
        <div className={styles.notice} data-kind="stale" role="status">
          <p>
            {resource.status === 'error'
              ? r.historyError[lang]
              : resource.status === 'changed'
                ? r.historyChanged[lang]
                : r.historyStale[lang]}
          </p>
          <div className={styles.actions}>
            <button
              className={ui.secondary}
              type="button"
              disabled={resource.status === 'loading'}
              onClick={onReload}
            >
              {r.reload[lang]}
            </button>
          </div>
        </div>
      )}
      {page && (
        <>
          {page.total === 0 && resource.status === 'ready' && (
            <p className={styles.empty}>{r.historyEmpty[lang]}</p>
          )}
          <ol className={styles.historyList}>
            {page.items.map((entry) => (
              <li key={entry.id} className={styles.historyItem}>
                <div className={styles.historyActor}>
                  <strong>{entry.actor.name}</strong>
                  {entry.actor.kind === 'agent' && (
                    <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>
                  )}
                  <span>{sprintHistoryKindCopy[entry.kind][lang]}</span>
                </div>
                <p className={styles.historyMeta}>
                  <span>{provenanceLabel(entry.provenance, lang)}</span>
                  <time dateTime={entry.occurredAt}>{formatTimestamp(entry.occurredAt, lang)}</time>
                </p>
                {entry.taskId && (
                  <p className={styles.historyTask}>
                    {labels[entry.taskId]?.key ?? entry.taskId}
                    {labels[entry.taskId] && <span> {labels[entry.taskId]?.title}</span>}
                  </p>
                )}
                {(entry.before !== null || entry.after !== null) && (
                  <div className={styles.comparison}>
                    <div>
                      <h4>{r.before[lang]}</h4>
                      <SprintPlanningSnapshot snapshot={entry.before} />
                    </div>
                    <div>
                      <h4>{r.after[lang]}</h4>
                      <SprintPlanningSnapshot snapshot={entry.after} />
                    </div>
                  </div>
                )}
                {entry.disposition && (
                  <p className={styles.hint}>
                    {r.outcome[lang]}:{' '}
                    {entry.disposition === 'backlog'
                      ? c.toBacklog[lang]
                      : c[entry.disposition][lang]}
                  </p>
                )}
                {entry.targetSprintId && (
                  <p className={styles.hint}>
                    {r.target[lang]}: {entry.targetSprintId}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className={styles.pager}>
            <span>
              {c.loaded[lang]} {page.items.length} {c.of[lang]} {page.total}
            </span>
            {onLoadMore && (
              <button
                className={ui.secondary}
                type="button"
                disabled={resource.loadingMore || resource.status !== 'ready' || resource.stale}
                onClick={onLoadMore}
              >
                {resource.loadingMore ? c.loadingMore[lang] : c.loadMore[lang]}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
