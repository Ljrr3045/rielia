'use client';

import { useId } from 'react';
import type { Task, TaskColumnCounts, TaskStatus } from '@rielia/contracts';
import {
  AssigneeTag,
  DueDate,
  EmptyState,
  IconRestore,
  IconTask,
  PriorityMark,
  cx,
  useLocale,
} from './project-ui';
import { TaskMoveControl } from './task-move';
import { copy, priorityName, statusName, typeName } from './strings';
import styles from './projects.module.css';

function TaskRow({
  task,
  archivedView,
  readOnly,
  canMove,
  movePending,
  pending,
  previous,
  nextNext,
  onOpen,
  onRestore,
  onMove,
  onMoveBefore,
  onMoveEnd,
}: {
  task: Task;
  archivedView: boolean;
  readOnly: boolean;
  canMove: boolean;
  movePending: boolean;
  pending: boolean;
  previous: Task | null;
  nextNext: Task | null;
  onOpen: (taskId: string, opener: HTMLElement) => void;
  onRestore: (task: Task, opener: HTMLElement) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onMoveBefore: (task: Task, beforeTaskId: string) => void;
  onMoveEnd: (task: Task) => void;
}) {
  const lang = useLocale();
  const archived = task.archivedAt !== null;
  return (
    <li className={cx(styles.taskRow, archived && styles.taskRowArchived)} data-task-id={task.id}>
      <div className={styles.taskStatusCell}>
        <TaskMoveControl
          canMove={canMove}
          nextNext={nextNext}
          onMove={status => onMove(task, status)}
          onMoveBefore={beforeTaskId => onMoveBefore(task, beforeTaskId)}
          onMoveEnd={() => onMoveEnd(task)}
          pending={movePending}
          previous={previous}
          readOnly={readOnly}
          task={task}
          variant="row"
        />
      </div>

      <div className={styles.taskMain}>
        <a
          className={styles.taskTitleButton}
          data-task-open
          href={task.url}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            onOpen(task.id, event.currentTarget);
          }}
        >
          {task.title}
        </a>
        <div className={styles.taskMeta}>
          <span className={styles.taskKey}>{task.key}</span>
          <span className={styles.taskMetaItem}>{typeName(task.type)[lang]}</span>
          {task.dueDate !== null && (
            <span className={styles.taskMetaItem}>
              <DueDate value={task.dueDate} />
            </span>
          )}
          <span className={styles.taskMetaItem}>
            <AssigneeTag
              inactive={task.assignee !== null && !task.assignee.active}
              kind={task.assignee?.kind ?? null}
              name={task.assignee?.name ?? null}
            />
          </span>
          <span className={cx(styles.taskMetaItem, styles.mobilePriority)}>
            <PriorityMark name={priorityName(task.priority)} priority={task.priority} />
          </span>
          {archived && (
            <span className={styles.taskMetaItem}>
              <span className={styles.taskArchivedFlag}>{copy.task.archivedBadge[lang]}</span>
            </span>
          )}
        </div>
      </div>

      <div className={styles.taskAside}>
        <PriorityMark name={priorityName(task.priority)} priority={task.priority} />
        {archivedView && task.capabilities.canRestore && (
          <button
            className={styles.secondary}
            disabled={pending}
            onClick={event => onRestore(task, event.currentTarget)}
            type="button"
          >
            <IconRestore size={16} />
            {copy.task.restore[lang]}
          </button>
        )}
      </div>
    </li>
  );
}

export function TaskList({
  tasks,
  columnCounts,
  total,
  archivedView,
  canCreate,
  canMove,
  readOnly,
  hasMore,
  pending,
  pendingTaskId,
  changed,
  partial,
  filtersActive,
  onCreate,
  onOpen,
  onRestore,
  onLoadMore,
  onMove,
  onMoveBefore,
  onMoveEnd,
  onClearFilters,
}: {
  tasks: readonly Task[];
  columnCounts: TaskColumnCounts;
  total: number | null;
  archivedView: boolean;
  canCreate: boolean;
  canMove: (task: Task) => boolean;
  readOnly: boolean;
  hasMore: boolean;
  pending: boolean;
  pendingTaskId: string | null;
  changed: boolean;
  partial: boolean;
  filtersActive: boolean;
  onCreate: () => void;
  onOpen: (taskId: string, opener: HTMLElement) => void;
  onRestore: (task: Task, opener: HTMLElement) => void;
  onLoadMore: () => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onMoveBefore: (task: Task, beforeTaskId: string) => void;
  onMoveEnd: (task: Task) => void;
  onClearFilters: () => void;
}) {
  const lang = useLocale();
  const listLabelId = useId();

  if (tasks.length === 0) {
    if (filtersActive) {
      return (
        <EmptyState
          icon={<IconTask size={22} />}
          title={copy.taskView.noResultsTitle}
          body={copy.taskView.noResultsBody}
          actions={(
            <>
              <button className={styles.secondary} onClick={onClearFilters} type="button">
                {copy.taskView.clearFilters[lang]}
              </button>
              {canCreate && (
                <button className={styles.primary} onClick={onCreate} type="button">
                  {copy.task.captureSubmit[lang]}
                </button>
              )}
            </>
          )}
        />
      );
    }
    return (
      <EmptyState
        icon={<IconTask size={22} />}
        title={archivedView ? copy.status.emptyArchivedTasksTitle : copy.status.emptyTasksTitle}
        body={archivedView ? copy.status.emptyArchivedTasksBody : copy.status.emptyTasksBody}
        actions={!archivedView && canCreate ? (
          <button className={styles.primary} onClick={onCreate} type="button">
            {copy.task.captureSubmit[lang]}
          </button>
        ) : undefined}
      />
    );
  }

  const groups: Array<{ status: TaskStatus; items: Task[] }> = [];
  for (const task of tasks) {
    const last = groups[groups.length - 1];
    if (last?.status === task.status) last.items.push(task);
    else groups.push({ status: task.status, items: [task] });
  }

  const summary = total === null
    ? changed ? copy.taskView.countChanged[lang] : copy.taskView.countPartial[lang]
    : tasks.length < total
      ? copy.taskView.showing[lang](tasks.length, total)
      : copy.taskView.countTotal[lang](total);

  return (
    <>
      <div aria-live="polite" className={styles.listSummary}>
        <IconTask size={14} />
        <span>{summary}</span>
        {partial && total !== null && <span>· {copy.taskView.countPartial[lang]}</span>}
      </div>
      {groups.map(group => (
        <section aria-labelledby={`${listLabelId}-${group.status}`} className={styles.taskGroup} key={group.status}>
          <header className={styles.taskGroupHeader}>
            <h3
              className={styles.taskGroupTitle}
              data-task-group={group.status}
              id={`${listLabelId}-${group.status}`}
              tabIndex={-1}
            >
              <span className={styles.statusValue} data-status={group.status}>
                <span aria-hidden="true" className={styles.statusDot} />
                {statusName(group.status)[lang]}
              </span>
              <span className={styles.taskGroupCount}>{columnCounts[group.status]}</span>
            </h3>
            {group.items.length < columnCounts[group.status] && (
              <span className={styles.taskGroupShowing}>
                {copy.taskView.showing[lang](group.items.length, columnCounts[group.status])}
              </span>
            )}
          </header>
          <ul aria-label={copy.task.listLabel[lang]} className={styles.taskList}>
            {group.items.map((task, index) => {
              const previous = index > 0 ? group.items[index - 1] ?? null : null;
              const nextNext = group.items[index + 2] ?? null;
              return (
                <TaskRow
                  archivedView={archivedView}
                  canMove={!readOnly && canMove(task)}
                  key={task.id}
                  movePending={pendingTaskId === task.id}
                  nextNext={nextNext}
                  onMove={onMove}
                  onMoveBefore={onMoveBefore}
                  onMoveEnd={onMoveEnd}
                  onOpen={onOpen}
                  onRestore={onRestore}
                  pending={pending}
                  previous={previous}
                  readOnly={readOnly}
                  task={task}
                />
              );
            })}
          </ul>
        </section>
      ))}
      {hasMore && !changed && (
        <div className={styles.formActions}>
          <button className={styles.secondary} disabled={pending} onClick={onLoadMore} type="button">
            {copy.common.loadMore[lang]}
          </button>
        </div>
      )}
    </>
  );
}
