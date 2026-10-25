'use client';

import type { DemoTask, PrototypeState, TaskPrototypeActions, TaskStatus } from '../../lib/task-prototype/types';
import { copy, formatDate, type Lang } from './strings';
import { activeFilterCount } from './filters';
import {
  AssigneeTag,
  EmptyState,
  IconCalendar,
  IconList,
  LabelChip,
  PriorityMark,
  StatusSelect,
  cx,
} from './ui';
import styles from './prototype.module.css';

interface TaskListProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  mode: 'my-tasks' | 'list';
  onOpen: (taskId: string) => void;
}

function TaskPoints({ task, lang }: { task: DemoTask; lang: Lang }) {
  const c = copy[lang];
  if (task.points === null) return <span className={styles.mutedText}>{c.unestimated}</span>;
  return (
    <span className={styles.points}>
      {task.points} {task.points === 1 ? c.pointsShort : c.pointsShortPlural}
    </span>
  );
}

function TaskRow({
  task,
  state,
  actions,
  lang,
  mode,
  onOpen,
}: {
  task: DemoTask;
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  mode: 'my-tasks' | 'list';
  onOpen: (taskId: string) => void;
}) {
  const c = copy[lang];
  const assignee = state.principals.find(principal => principal.id === task.assigneeId) ?? null;
  const labels = task.labelIds
    .map(labelId => state.labels.find(label => label.id === labelId))
    .filter((label): label is { id: string; name: string } => label !== undefined);
  const pending = state.save.status === 'pending';

  return (
    <li className={styles.taskRow} data-status={task.status}>
      <div className={styles.taskStatusCell}>
        <StatusSelect
          disabled={pending}
          label={c.changeStatusFor(task.key)}
          lang={lang}
          onChange={(status: TaskStatus) => {
            void actions.moveTask(task.id, status);
          }}
          status={task.status}
          statuses={state.statuses}
        />
      </div>

      <div className={styles.taskMain}>
        <button className={styles.taskTitleButton} onClick={() => onOpen(task.id)} type="button">
          {task.title}
        </button>
        <div className={styles.taskMeta}>
          <span className={styles.taskKey}>{task.key}</span>
          {labels.map(label => (
            <LabelChip key={label.id} name={label.name} />
          ))}
          <span className={styles.metaItem}>
            <IconCalendar size={14} />
            {task.dueDate === null ? c.noDueDate : formatDate(task.dueDate, lang)}
          </span>
          <span className={styles.metaItem}>
            <TaskPoints lang={lang} task={task} />
          </span>
          {mode === 'list' && (
            <span className={styles.metaItem}>
              <AssigneeTag lang={lang} principal={assignee} />
            </span>
          )}
        </div>
      </div>

      <div className={styles.taskPriorityCell}>
        <PriorityMark lang={lang} priority={task.priority} />
      </div>
    </li>
  );
}

export function TaskListView({ state, actions, lang, mode, onOpen }: TaskListProps) {
  const c = copy[lang];
  const filtersActive = activeFilterCount(state.filters) > 0;
  const createDisabled = state.save.status === 'pending' || state.taskDraft !== null || state.sprintDraft !== null;

  if (state.tasks.length === 0) {
    return (
      <EmptyState body={c.emptyProjectBody} title={c.emptyProjectTitle}>
        <button className={styles.primaryButton} disabled={createDisabled} onClick={() => actions.beginCreateTask('backlog')} type="button">
          {c.createFirstTask}
        </button>
      </EmptyState>
    );
  }

  if (state.visibleTasks.length === 0) {
    if (mode === 'my-tasks' && !filtersActive) {
      return (
        <EmptyState body={c.emptyMyTasksBody} title={c.emptyMyTasksTitle}>
          <button className={styles.primaryButton} onClick={() => actions.setView('list')} type="button">
            {c.viewAllTasks}
          </button>
          <button className={styles.secondaryButton} disabled={createDisabled} onClick={() => actions.beginCreateTask('backlog')} type="button">
            {c.newTask}
          </button>
        </EmptyState>
      );
    }
    return (
      <EmptyState body={c.noResultsBody} title={c.noResultsTitle}>
        <button className={styles.secondaryButton} onClick={() => actions.clearFilters()} type="button">
          {c.clearFilters}
        </button>
        <button className={styles.primaryButton} disabled={createDisabled} onClick={() => actions.beginCreateTask('backlog')} type="button">
          {c.newTask}
        </button>
      </EmptyState>
    );
  }

  return (
    <div className={styles.listFrame}>
      <div className={styles.listSummary} aria-live="polite">
        <IconList size={16} />
        <span>{c.taskCount(state.visibleTasks.length)}</span>
        {filtersActive && <span className={styles.summaryMuted}>· {c.filtersCount(activeFilterCount(state.filters))}</span>}
      </div>
      <ul aria-label={c.taskList} className={cx(styles.taskList)}>
        {state.visibleTasks.map(task => (
          <TaskRow
            actions={actions}
            key={task.id}
            lang={lang}
            mode={mode}
            onOpen={onOpen}
            state={state}
            task={task}
          />
        ))}
      </ul>
    </div>
  );
}
