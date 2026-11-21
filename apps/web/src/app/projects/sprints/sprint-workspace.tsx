'use client';

import { useId, type ReactNode } from 'react';
import type { Sprint, SprintPage, SprintScopePage, SprintTotals } from '@rielia/contracts';
import { Badge, useLocale } from '../project-ui';
import { formatDateOnly, statusName } from '../strings';
import { sprintCopy as c, sprintNoticeCopy } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

/** Rendering only. The composition owner supplies guarded navigation and action availability. */
export function SprintWorkspace({
  sprints,
  selectedId,
  sprint,
  disabled,
  loadingMore,
  onSelect,
  onLoadMore,
  onCreate,
  onSettings,
  onEdit,
  onStart,
  onClose,
  notices,
  children,
}: {
  sprints: SprintPage | null;
  selectedId: string;
  sprint: Sprint | null;
  disabled: boolean;
  loadingMore: boolean;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  onCreate: (() => void) | null;
  onSettings: (() => void) | null;
  onEdit: (() => void) | null;
  onStart: (() => void) | null;
  onClose: (() => void) | null;
  notices?: ReactNode;
  children?: ReactNode;
}) {
  const lang = useLocale();
  const selectId = useId();
  const headingId = useId();
  return (
    <section className={styles.workspace} aria-labelledby={headingId}>
      <header className={styles.toolbar}>
        <h2 id={headingId} tabIndex={-1}>
          {c.title[lang]}
        </h2>
        <div className={styles.actions}>
          {onSettings && (
            <button className={ui.secondary} type="button" disabled={disabled} onClick={onSettings}>
              {c.settings[lang]}
            </button>
          )}
          {onCreate && (
            <button className={ui.primary} type="button" disabled={disabled} onClick={onCreate}>
              {c.create[lang]}
            </button>
          )}
        </div>
      </header>
      {notices}
      <div className={styles.chooser}>
        <div className={styles.field}>
          <label htmlFor={selectId}>{c.choose[lang]}</label>
          <select
            id={selectId}
            value={selectedId}
            disabled={disabled || sprints === null}
            onChange={(event) => onSelect(event.currentTarget.value)}
          >
            <option value="">{c.noSelection[lang]}</option>
            {sprints?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({c[item.state][lang]})
              </option>
            ))}
          </select>
        </div>
        {sprints && (
          <span className={styles.muted}>
            {c.loaded[lang]} {sprints.items.length} {c.of[lang]} {sprints.total}
          </span>
        )}
        {sprints?.nextCursor && (
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
      {sprints?.total === 0 && <p className={styles.empty}>{c.empty[lang]}</p>}
      {sprint ? (
        <>
          <div className={styles.overview}>
            <div className={styles.titleRow}>
              <h3 className={styles.sprintTitle} tabIndex={-1}>
                {sprint.name}
              </h3>
              <Badge tone={sprint.state === 'active' ? 'brand' : 'neutral'}>
                {c[sprint.state][lang]}
              </Badge>
            </div>
            <div className={styles.goal}>
              <h4>{c.goal[lang]}</h4>
              <p>{sprint.goal}</p>
            </div>
            <dl className={styles.metadata}>
              <div>
                <dt>{c.startDate[lang]}</dt>
                <dd>
                  <time dateTime={sprint.startDate}>{formatDateOnly(sprint.startDate, lang)}</time>
                </dd>
              </div>
              <div>
                <dt>{c.endDate[lang]}</dt>
                <dd>
                  <time dateTime={sprint.endDateExclusive}>
                    {formatDateOnly(sprint.endDateExclusive, lang)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>{c.zone[lang]}</dt>
                <dd>{sprint.timeZone}</dd>
              </div>
            </dl>
            <p className={styles.hint}>{c.datesHint[lang]}</p>
            <div className={styles.actions}>
              {onEdit && (
                <button className={ui.secondary} type="button" disabled={disabled} onClick={onEdit}>
                  {c.edit[lang]}
                </button>
              )}
              {onStart && (
                <button className={ui.primary} type="button" disabled={disabled} onClick={onStart}>
                  {c.start[lang]}
                </button>
              )}
              {onClose && (
                <button className={ui.primary} type="button" disabled={disabled} onClick={onClose}>
                  {c.close[lang]}
                </button>
              )}
            </div>
          </div>
          {children}
        </>
      ) : sprints !== null && sprints.total > 0 ? (
        <p className={styles.empty}>{c.chooseHint[lang]}</p>
      ) : null}
    </section>
  );
}

export function SprintNotice({
  kind,
  actions,
  children,
}: {
  kind: keyof typeof sprintNoticeCopy;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const lang = useLocale();
  return (
    <div className={styles.notice} data-kind={kind} role="status" aria-atomic="true">
      <p>{sprintNoticeCopy[kind][lang]}</p>
      {children}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/** Totals are supplied by the server, never counted from the loaded rows. */
export function SprintTotalsView({ totals }: { totals: SprintTotals }) {
  const lang = useLocale();
  return (
    <div className={styles.totals}>
      <p className={styles.totalsHint}>{c.totalsBasis[lang]}</p>
      <dl>
        <div>
          <dt>{c.done[lang]}</dt>
          <dd>
            {totals.done}{' '}
            <span>
              {' '}
              / {totals.donePoints} {c.points[lang]}
            </span>
          </dd>
        </div>
        <div>
          <dt>{c.canceled[lang]}</dt>
          <dd>
            {totals.canceled}{' '}
            <span>
              {' '}
              / {totals.canceledPoints} {c.points[lang]}
            </span>
          </dd>
        </div>
        <div>
          <dt>{c.pending[lang]}</dt>
          <dd>
            {totals.pending}{' '}
            <span>
              {' '}
              / {totals.pendingPoints} {c.points[lang]}
            </span>
          </dd>
        </div>
      </dl>
      <p className={styles.hint}>
        {c.unestimated[lang]}: {totals.unestimated} · {c.child[lang]}: {totals.children} ·{' '}
        {c.archivedTask[lang]}: {totals.archived}
      </p>
    </div>
  );
}

export interface SprintTaskLabel {
  title: string;
  key: string;
}

/** Labels are authorized parent-task projections. Missing labels retain the canonical task ID. */
export function SprintScope({
  page,
  labels,
  onTask,
  onLoadMore,
  loadingMore,
  disabled,
  notice,
}: {
  page: SprintScopePage;
  labels: Readonly<Record<string, SprintTaskLabel>>;
  onTask: (taskId: string) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  disabled: boolean;
  notice?: ReactNode;
}) {
  const lang = useLocale();
  const id = useId();
  return (
    <section className={styles.scope} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <h3 id={id}>{c.scope[lang]}</h3>
        <p className={styles.hint}>{c.scopeHint[lang]}</p>
      </header>
      {notice}
      <SprintTotalsView totals={page.currentTotals} />
      {page.total === 0 && <p className={styles.empty}>{c.noScope[lang]}</p>}
      <ul className={styles.rows}>
        {page.items.map((visit) => (
          <li key={visit.id} className={styles.row}>
            <button
              className={styles.taskButton}
              type="button"
              disabled={disabled}
              onClick={() => onTask(visit.taskId)}
            >
              <span className={styles.taskKey}>{labels[visit.taskId]?.key ?? visit.taskId}</span>
              {labels[visit.taskId] && <span>{labels[visit.taskId]?.title}</span>}
            </button>
            <div className={styles.rowMeta}>
              <span>{statusName(visit.current.status)[lang]}</span>
              <span>
                {visit.current.estimatePoints === null
                  ? c.unestimated[lang]
                  : `${visit.current.estimatePoints} ${c.points[lang]}`}
              </span>
              <Badge>
                {visit.exitReason === 'closed'
                  ? c.participationClosed[lang]
                  : visit.exitReason === null
                    ? c.current[lang]
                    : c[visit.exitReason][lang]}
              </Badge>
              {visit.current.archivedAt && <Badge tone="archived">{c.archivedTask[lang]}</Badge>}
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.pager}>
        <span>
          {c.loaded[lang]} {page.items.length} {c.of[lang]} {page.total}
        </span>
        {page.nextCursor && (
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
    </section>
  );
}
