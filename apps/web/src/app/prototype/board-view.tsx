'use client';

import { useState } from 'react';
import type { DemoTask, PrototypeState, TaskPrototypeActions, TaskStatus } from '../../lib/task-prototype/types';
import { copy, formatDate, statusLabel, type Lang } from './strings';
import {
  AssigneeTag,
  EmptyState,
  IconCalendar,
  IconPlus,
  LabelChip,
  PriorityMark,
  StatusDot,
  StatusSelect,
  cx,
} from './ui';
import styles from './prototype.module.css';

interface BoardViewProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  onOpen: (taskId: string) => void;
  onNew: (status: TaskStatus) => void;
}

function BoardCard({
  task,
  state,
  actions,
  lang,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: DemoTask;
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  onOpen: (taskId: string) => void;
  dragging: boolean;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}) {
  const c = copy[lang];
  const assignee = state.principals.find(principal => principal.id === task.assigneeId) ?? null;
  const labels = task.labelIds
    .map(labelId => state.labels.find(label => label.id === labelId))
    .filter((label): label is { id: string; name: string } => label !== undefined);
  const pending = state.save.status === 'pending';

  return (
    <article
      className={cx(styles.boardCard, dragging && styles.boardCardDragging)}
      draggable={!pending}
      onDragEnd={onDragEnd}
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', task.id);
        onDragStart(task.id);
      }}
    >
      <div className={styles.cardTopLine}>
        <span className={styles.taskKey}>{task.key}</span>
        <PriorityMark lang={lang} priority={task.priority} />
      </div>
      <h3 className={styles.cardTitle}>
        <button className={styles.cardTitleButton} onClick={() => onOpen(task.id)} type="button">
          {task.title}
        </button>
      </h3>
      {labels.length > 0 && (
        <div className={styles.cardLabels}>
          {labels.map(label => (
            <LabelChip key={label.id} name={label.name} />
          ))}
        </div>
      )}
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          <IconCalendar size={14} />
          {task.dueDate === null ? c.noDueDate : formatDate(task.dueDate, lang)}
        </span>
        {task.points !== null && (
          <span className={styles.points}>
            {task.points} {task.points === 1 ? c.pointsShort : c.pointsShortPlural}
          </span>
        )}
        <AssigneeTag lang={lang} principal={assignee} />
      </div>
      <div className={styles.cardFooter}>
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
    </article>
  );
}

export function BoardView({ state, actions, lang, onOpen, onNew }: BoardViewProps) {
  const c = copy[lang];
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('in_progress');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const pending = state.save.status === 'pending';
  const draftOpen = state.taskDraft !== null || state.sprintDraft !== null;
  const addDisabled = pending || draftOpen;

  if (state.tasks.length === 0) {
    return (
      <EmptyState body={c.emptyProjectBody} title={c.emptyProjectTitle}>
        <button className={styles.primaryButton} disabled={addDisabled} onClick={() => actions.beginCreateTask('backlog')} type="button">
          {c.createFirstTask}
        </button>
      </EmptyState>
    );
  }

  if (state.visibleTasks.length === 0) {
    return (
      <EmptyState body={c.noResultsBody} title={c.noResultsTitle}>
        <button className={styles.secondaryButton} onClick={() => actions.clearFilters()} type="button">
          {c.clearFilters}
        </button>
        <button className={styles.primaryButton} disabled={addDisabled} onClick={() => actions.beginCreateTask('backlog')} type="button">
          {c.newTask}
        </button>
      </EmptyState>
    );
  }

  return (
    <div className={styles.boardFrame}>
      <div aria-label={c.boardColumn} className={styles.columnPicker} role="group">
        {state.columns.map(column => (
          <button
            aria-pressed={column.status === activeColumn}
            className={styles.columnPickerButton}
            key={column.status}
            onClick={() => setActiveColumn(column.status)}
            type="button"
          >
            <StatusDot status={column.status} />
            {statusLabel(column.status, lang)}
            <span className={styles.columnCount}>{column.tasks.length}</span>
          </button>
        ))}
      </div>

      <div className={styles.board}>
        {state.columns.map(column => {
          const statusName = statusLabel(column.status, lang);
          return (
            <section
              aria-labelledby={`prototype-column-${column.status}`}
              className={cx(
                styles.column,
                column.status === activeColumn && styles.columnActive,
                dragOver === column.status && styles.columnDragOver,
              )}
              key={column.status}
              onDragLeave={() => setDragOver(current => (current === column.status ? null : current))}
              onDragOver={event => {
                if (pending || draggingId === null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragOver(column.status);
              }}
              onDrop={event => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData('text/plain') || draggingId;
                setDraggingId(null);
                setDragOver(null);
                const task = taskId === null ? undefined : state.tasks.find(item => item.id === taskId);
                if (task !== undefined && task.status !== column.status) void actions.moveTask(task.id, column.status);
              }}
            >
              <header className={styles.columnHeader}>
                <h2 className={styles.columnTitle} id={`prototype-column-${column.status}`}>
                  <StatusDot status={column.status} />
                  {statusName}
                  <span className={styles.columnCount}>{column.tasks.length}</span>
                </h2>
                <button
                  aria-label={c.addTaskTo(statusName)}
                  className={styles.iconButton}
                  disabled={addDisabled}
                  onClick={() => onNew(column.status)}
                  type="button"
                >
                  <IconPlus size={18} />
                </button>
              </header>

              <div className={styles.columnCards}>
                {column.tasks.map(task => (
                  <BoardCard
                    actions={actions}
                    dragging={draggingId === task.id}
                    key={task.id}
                    lang={lang}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                    onDragStart={setDraggingId}
                    onOpen={onOpen}
                    state={state}
                    task={task}
                  />
                ))}
                {column.tasks.length === 0 && <p className={styles.columnEmpty}>{c.emptyColumn}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
