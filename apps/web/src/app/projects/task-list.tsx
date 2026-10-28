'use client';

import type { Task } from '@rielia/contracts';
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
import { copy, listCount, priorityName, statusName, typeName } from './strings';
import styles from './projects.module.css';

function TaskRow({
  task,
  archivedView,
  pending,
  onOpen,
  onRestore,
}: {
  task: Task;
  archivedView: boolean;
  pending: boolean;
  onOpen: (taskId: string, opener: HTMLElement) => void;
  onRestore: (task: Task, opener: HTMLElement) => void;
}) {
  const lang = useLocale();
  const archived = task.archivedAt !== null;
  return (
    <li className={cx(styles.taskRow, archived && styles.taskRowArchived)}>
      <div className={styles.taskStatusCell}>
        <span className={styles.statusValue} data-status={task.status}>
          <span aria-hidden="true" className={styles.statusDot} />
          {statusName(task.status)[lang]}
        </span>
      </div>

      <div className={styles.taskMain}>
        <a
          className={styles.taskTitleButton}
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
            <PriorityMark priority={task.priority} name={priorityName(task.priority)} />
          </span>
          {archived && (
            <span className={styles.taskMetaItem}>
              <span className={styles.taskArchivedFlag}>{copy.task.archivedBadge[lang]}</span>
            </span>
          )}
        </div>
      </div>

      <div className={styles.taskAside}>
        <PriorityMark priority={task.priority} name={priorityName(task.priority)} />
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
  archivedView,
  canCreate,
  hasMore,
  pending,
  onCreate,
  onOpen,
  onRestore,
  onLoadMore,
}: {
  tasks: readonly Task[];
  archivedView: boolean;
  canCreate: boolean;
  hasMore: boolean;
  pending: boolean;
  onCreate: () => void;
  onOpen: (taskId: string, opener: HTMLElement) => void;
  onRestore: (task: Task, opener: HTMLElement) => void;
  onLoadMore: () => void;
}) {
  const lang = useLocale();

  if (tasks.length === 0) {
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

  return (
    <>
      <div className={styles.listSummary}>
        <IconTask size={14} />
        <span>{archivedView ? copy.project.archivedTaskCount[lang](tasks.length) : listCount(tasks.length, lang)}</span>
      </div>
      <ul aria-label={copy.task.listLabel[lang]} className={styles.taskList}>
        {tasks.map(task => (
          <TaskRow
            archivedView={archivedView}
            key={task.id}
            onOpen={onOpen}
            onRestore={onRestore}
            pending={pending}
            task={task}
          />
        ))}
      </ul>
      {hasMore && (
        <div className={styles.formActions}>
          <button className={styles.secondary} disabled={pending} onClick={onLoadMore} type="button">
            {copy.common.loadMore[lang]}
          </button>
        </div>
      )}
    </>
  );
}
