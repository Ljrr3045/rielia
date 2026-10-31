'use client';

import { useId, useRef, useState } from 'react';
import {
  taskPriorities,
  type DomainPerson,
  type ProjectAssigneePage,
  type TaskFilters,
  type TaskPriority,
  type TaskStatus,
  type TaskView,
} from '@rielia/contracts';
import type { TaskSummary } from '../../lib/project-task-controller';
import { IconArchive, useIsNarrow, useLocale, cx } from './project-ui';
import { copy, priorityName, statusName } from './strings';
import styles from './projects.module.css';

export type TaskFilterAssigneeStatus = 'none' | 'unassigned' | 'loading' | 'resolved' | 'unavailable';

export function TaskViewBar({
  taskView,
  taskSummary,
  assignees,
  selectedTaskAssignee,
  assigneeStatus,
  assigneeLoading,
  assigneeError,
  assigneesNext,
  viewsTasks,
  disabled,
  onLayout,
  onFilters,
  onLoadMoreAssignees,
  onRefresh,
  onToggleArchive,
}: {
  taskView: TaskView;
  taskSummary: TaskSummary;
  assignees: ProjectAssigneePage | null;
  selectedTaskAssignee: DomainPerson | null;
  assigneeStatus: TaskFilterAssigneeStatus;
  assigneeLoading: boolean;
  assigneeError: boolean;
  assigneesNext: boolean;
  viewsTasks: 'active' | 'archived';
  disabled: boolean;
  onLayout: (layout: TaskView['layout']) => void;
  onFilters: (filters: TaskFilters) => void;
  onLoadMoreAssignees: () => void;
  onRefresh: () => void;
  onToggleArchive: () => void;
}) {
  const lang = useLocale();
  const narrow = useIsNarrow();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const statusId = useId();
  const assigneeId = useId();
  const priorityId = useId();
  const filtersActive = Object.keys(taskView.filters).length;

  const assigneeOptions: DomainPerson[] = [];
  const seenAssignees = new Set<string>();
  for (const person of assignees?.items ?? []) {
    if (seenAssignees.has(person.principalId)) continue;
    seenAssignees.add(person.principalId);
    assigneeOptions.push(person);
  }
  if (selectedTaskAssignee !== null && !seenAssignees.has(selectedTaskAssignee.principalId)) {
    seenAssignees.add(selectedTaskAssignee.principalId);
    assigneeOptions.push(selectedTaskAssignee);
  }
  const selectedAssigneeId = taskView.filters.assignee ?? '';
  const selectedAssigneeMissing = selectedAssigneeId.length > 0
    && selectedAssigneeId !== 'unassigned'
    && !seenAssignees.has(selectedAssigneeId);
  const syntheticAssigneeName = assigneeStatus === 'loading'
    ? copy.taskView.assigneeLoading[lang]
    : assigneeStatus === 'unavailable'
      ? copy.taskView.assigneeUnavailable[lang]
      : copy.taskView.assigneeSelected[lang];

  const countLabel = taskSummary.status === 'ready' && taskSummary.total !== null
    ? copy.taskView.countTotal[lang](taskSummary.total)
    : taskSummary.status === 'loading'
      ? copy.taskView.countLoading[lang]
      : taskSummary.status === 'changed'
        ? copy.taskView.countChanged[lang]
        : copy.taskView.countPartial[lang];

  function setFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K] | undefined) {
    const next: TaskFilters = { ...taskView.filters };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onFilters(next);
  }

  function filterFields(includeClear: boolean) {
    return (
      <>
        <label className={styles.filterField} htmlFor={statusId}>
          <span>{copy.taskView.status[lang]}</span>
          <select
            disabled={disabled}
            id={statusId}
            onChange={event => {
              const value = event.currentTarget.value;
              setFilter('status', value.length === 0 ? undefined : value as TaskStatus);
            }}
            value={taskView.filters.status ?? ''}
          >
            <option value="">{copy.taskView.all[lang]}</option>
            {(['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const).map(status => (
              <option key={status} value={status}>{statusName(status)[lang]}</option>
            ))}
          </select>
        </label>

        <label className={styles.filterField} htmlFor={assigneeId}>
          <span>{copy.taskView.assignee[lang]}</span>
          <select
            disabled={disabled}
            id={assigneeId}
            onChange={event => {
              const value = event.currentTarget.value;
              setFilter('assignee', value.length === 0 ? undefined : value);
            }}
            value={selectedAssigneeId}
          >
            <option value="">{copy.taskView.all[lang]}</option>
            <option value="unassigned">{copy.taskView.unassigned[lang]}</option>
            {selectedAssigneeMissing && <option value={selectedAssigneeId}>{syntheticAssigneeName}</option>}
            {assigneeOptions.map(person => (
              <option key={person.principalId} value={person.principalId}>
                {person.name}
                {person.kind === 'agent' ? ` · ${copy.task.agentBadge[lang]}` : ''}
                {!person.active ? ` · ${copy.task.inactiveAssignee[lang]}` : ''}
              </option>
            ))}
          </select>
          {assigneeLoading && (
            <span className={styles.filterHint} role="status">{copy.taskView.peopleLoading[lang]}</span>
          )}
          {assigneeError && (
            <span className={styles.filterError} role="alert">
              {copy.taskView.peopleError[lang]}
              <button className={styles.linkButton} disabled={disabled} onClick={onLoadMoreAssignees} type="button">
                {copy.taskView.retryPeople[lang]}
              </button>
            </span>
          )}
          {assigneesNext && (
            <button className={styles.linkButton} disabled={disabled} onClick={onLoadMoreAssignees} type="button">
              {copy.taskView.loadMorePeople[lang]}
            </button>
          )}
        </label>

        <label className={styles.filterField} htmlFor={priorityId}>
          <span>{copy.taskView.priority[lang]}</span>
          <select
            disabled={disabled}
            id={priorityId}
            onChange={event => {
              const value = event.currentTarget.value;
              setFilter('priority', value.length === 0 ? undefined : value as TaskPriority);
            }}
            value={taskView.filters.priority ?? ''}
          >
            <option value="">{copy.taskView.all[lang]}</option>
            {taskPriorities.map(priority => (
              <option key={priority} value={priority}>{priorityName(priority)[lang]}</option>
            ))}
          </select>
        </label>

        {includeClear && filtersActive > 0 && (
          <button className={styles.clearFilters} disabled={disabled} onClick={() => onFilters({})} type="button">
            {copy.taskView.clearFilters[lang]}
          </button>
        )}
      </>
    );
  }

  return (
    <section
      aria-label={copy.taskView.barLabel[lang]}
      className={styles.taskViewBar}
      data-task-view-bar
      tabIndex={-1}
    >
      <div className={styles.taskViewBarTop}>
        <div aria-label={copy.taskView.viewLabel[lang]} className={styles.viewSwitch} role="group">
          <button
            aria-pressed={taskView.layout === 'list'}
            className={cx(styles.viewSegment, taskView.layout === 'list' && styles.viewSegmentActive)}
            disabled={disabled}
            onClick={() => onLayout('list')}
            type="button"
          >
            {copy.taskView.list[lang]}
          </button>
          <button
            aria-pressed={taskView.layout === 'board'}
            className={cx(styles.viewSegment, taskView.layout === 'board' && styles.viewSegmentActive)}
            disabled={disabled}
            onClick={() => onLayout('board')}
            type="button"
          >
            {copy.taskView.board[lang]}
          </button>
        </div>

        {narrow
          ? (
            <button
              aria-controls={panelId}
              aria-expanded={filtersOpen}
              className={styles.secondary}
              disabled={disabled}
              onClick={() => setFiltersOpen(open => !open)}
              ref={filterButtonRef}
              type="button"
            >
              {copy.taskView.filters[lang]} ({filtersActive})
            </button>
          )
          : <div className={styles.filterRow}>{filterFields(true)}</div>}

        <button
          aria-label={viewsTasks === 'archived' ? copy.task.viewActive[lang] : copy.task.viewArchived[lang]}
          aria-pressed={viewsTasks === 'archived'}
          className={styles.secondary}
          disabled={disabled}
          onClick={onToggleArchive}
          type="button"
        >
          <IconArchive size={16} />
          {narrow
            ? (viewsTasks === 'archived' ? copy.taskView.activeShort[lang] : copy.taskView.archiveShort[lang])
            : (viewsTasks === 'archived' ? copy.task.viewActive[lang] : copy.task.viewArchived[lang])}
        </button>
      </div>

      {narrow && filtersOpen && (
        <div aria-label={copy.taskView.filterPanel[lang]} className={styles.filterPanel} id={panelId} role="group">
          <div className={styles.filterPanelGrid}>
            {filterFields(false)}
          </div>
          {filtersActive > 0 && (
            <button className={styles.clearFilters} disabled={disabled} onClick={() => onFilters({})} type="button">
              {copy.taskView.clearFilters[lang]}
            </button>
          )}
        </div>
      )}

      <div className={styles.taskViewSummary} role="status">
        <span>{countLabel}</span>
        {filtersActive > 0 && <span>· {copy.taskView.filtersCount[lang](filtersActive)}</span>}
        {taskSummary.status === 'changed' && (
          <button className={styles.linkButton} onClick={onRefresh} type="button">
            {copy.common.refresh[lang]}
          </button>
        )}
      </div>
    </section>
  );
}
