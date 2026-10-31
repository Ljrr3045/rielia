'use client';

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { taskStatuses, type Task, type TaskPage, type TaskStatus, type TaskView } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import { TaskMoveControl } from './task-move';
import {
  AssigneeTag,
  DueDate,
  IconPlus,
  PriorityMark,
  StatusMark,
  cx,
  useIsNarrow,
  useLocale,
  useMediaQuery,
} from './project-ui';
import { copy, priorityName, statusName, typeName } from './strings';
import styles from './projects.module.css';

type ColumnError = { requestId: string | null; reason?: 'changed' };

export function TaskBoard({
  taskView,
  taskColumns,
  taskColumnErrors,
  taskColumnsChanged,
  readOnly,
  canCreate,
  canMove,
  capture,
  capturePending,
  filtersActive,
  pendingTaskId,
  onOpenTask,
  onBeginCapture,
  onCaptureChange,
  onCancelCapture,
  onSubmitCapture,
  onMove,
  onMoveBefore,
  onMoveEnd,
  onLoadColumn,
  onRefresh,
  onSetColumn,
  onClearFilters,
}: {
  taskView: TaskView;
  taskColumns: Partial<Record<TaskStatus, TaskPage>>;
  taskColumnErrors: Partial<Record<TaskStatus, ColumnError>>;
  taskColumnsChanged: boolean;
  readOnly: boolean;
  canCreate: boolean;
  canMove: (task: Task) => boolean;
  capture: { status: TaskStatus; title: string } | null;
  capturePending: boolean;
  filtersActive: boolean;
  pendingTaskId: string | null;
  onOpenTask: (taskId: string, opener: HTMLElement) => void;
  onBeginCapture: (status: TaskStatus) => void;
  onCaptureChange: (title: string) => void;
  onCancelCapture: () => void;
  onSubmitCapture: () => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onMoveBefore: (task: Task, status: TaskStatus, beforeTaskId: string) => void;
  onMoveEnd: (task: Task, status: TaskStatus) => void;
  onLoadColumn: (status: TaskStatus) => void;
  onRefresh: () => void;
  onSetColumn: (status: TaskStatus) => void;
  onClearFilters: () => void;
}) {
  const lang = useLocale();
  const narrow = useIsNarrow();
  const finePointer = useMediaQuery('(pointer: fine)');
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const visibleStatuses = taskView.filters.status
    ? [taskView.filters.status]
    : narrow
      ? [taskView.column]
      : [...taskStatuses];

  return (
    <section aria-label={copy.board.label[lang]} className={styles.board} data-task-board>
      {narrow && !taskView.filters.status && (
        <label className={styles.boardColumnSelector}>
          <span>{copy.board.columnSelector[lang]}</span>
          <select
            disabled={capturePending}
            onChange={event => onSetColumn(event.currentTarget.value as TaskStatus)}
            value={taskView.column}
          >
            {taskStatuses.map(status => {
              const page = taskColumns[status];
              const count = page?.columnCounts[status];
              return (
                <option key={status} value={status}>
                  {count === undefined ? statusName(status)[lang] : `${statusName(status)[lang]} (${count})`}
                </option>
              );
            })}
          </select>
        </label>
      )}

      {taskColumnsChanged && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={onRefresh} type="button">
              {copy.common.refresh[lang]}
            </button>
          )}
          body={copy.board.changedBody}
          title={copy.board.changedTitle}
          tone="warning"
        />
      )}

      {!narrow && <p className={styles.boardHint}>{copy.board.horizontalHint[lang]}</p>}
      <div
        aria-label={copy.board.scrollLabel[lang]}
        className={cx(styles.boardFrame, narrow && styles.boardFrameNarrow)}
        data-board-frame
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * Math.max(160, event.currentTarget.clientWidth * 0.7) });
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            event.currentTarget.scrollTo({ left: event.key === 'Home' ? 0 : event.currentTarget.scrollWidth });
          }
        }}
        role={narrow ? undefined : 'region'}
        tabIndex={narrow ? -1 : 0}
      >
        {visibleStatuses.map(status => (
          <BoardColumn
            canCreate={canCreate}
            canMove={canMove}
            capture={capture}
            capturePending={capturePending}
            draggingTask={draggingTask}
            error={taskColumnErrors[status]}
            filtersActive={filtersActive}
            finePointer={finePointer}
            key={status}
            narrow={narrow}
            onBeginCapture={onBeginCapture}
            onCancelCapture={onCancelCapture}
            onCaptureChange={onCaptureChange}
            onClearFilters={onClearFilters}
            onLoadColumn={onLoadColumn}
            onMove={onMove}
            onMoveBefore={onMoveBefore}
            onMoveEnd={onMoveEnd}
            onOpenTask={onOpenTask}
            onRefresh={onRefresh}
            onSubmitCapture={onSubmitCapture}
            overStatus={overStatus}
            overTaskId={overTaskId}
            page={taskColumns[status]}
            pendingTaskId={pendingTaskId}
            readOnly={readOnly}
            setDraggingTask={setDraggingTask}
            setOverStatus={setOverStatus}
            setOverTaskId={setOverTaskId}
            status={status}
            taskColumnsChanged={taskColumnsChanged}
          />
        ))}
      </div>
    </section>
  );
}

function BoardColumn({
  status,
  page,
  error,
  taskColumnsChanged,
  narrow,
  readOnly,
  canCreate,
  canMove,
  capture,
  capturePending,
  filtersActive,
  pendingTaskId,
  onOpenTask,
  onBeginCapture,
  onCaptureChange,
  onCancelCapture,
  onSubmitCapture,
  onMove,
  onMoveBefore,
  onMoveEnd,
  onLoadColumn,
  onRefresh,
  onClearFilters,
  finePointer,
  draggingTask,
  overStatus,
  overTaskId,
  setDraggingTask,
  setOverStatus,
  setOverTaskId,
}: {
  status: TaskStatus;
  page: TaskPage | undefined;
  error: ColumnError | undefined;
  taskColumnsChanged: boolean;
  narrow: boolean;
  readOnly: boolean;
  canCreate: boolean;
  canMove: (task: Task) => boolean;
  capture: { status: TaskStatus; title: string } | null;
  capturePending: boolean;
  filtersActive: boolean;
  pendingTaskId: string | null;
  onOpenTask: (taskId: string, opener: HTMLElement) => void;
  onBeginCapture: (status: TaskStatus) => void;
  onCaptureChange: (title: string) => void;
  onCancelCapture: () => void;
  onSubmitCapture: () => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onMoveBefore: (task: Task, status: TaskStatus, beforeTaskId: string) => void;
  onMoveEnd: (task: Task, status: TaskStatus) => void;
  onLoadColumn: (status: TaskStatus) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  finePointer: boolean;
  draggingTask: Task | null;
  overStatus: TaskStatus | null;
  overTaskId: string | null;
  setDraggingTask: (task: Task | null) => void;
  setOverStatus: (status: TaskStatus | null) => void;
  setOverTaskId: (taskId: string | null) => void;
}) {
  const lang = useLocale();
  const headingId = useId();
  const captureId = useId();
  const [captureError, setCaptureError] = useState(false);
  const count = page?.columnCounts[status] ?? null;
  const changed = taskColumnsChanged || error?.reason === 'changed';
  const loading = page === undefined && error === undefined;
  const canAdd = canCreate && !readOnly && !changed && error === undefined && page !== undefined;
  const showCapture = capture?.status === status && !readOnly && !changed && error === undefined;
  const canDrop = !readOnly && draggingTask !== null;
  const draggingId = draggingTask?.id ?? null;

  function submitCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (capture === null || capture.title.trim().length === 0) {
      setCaptureError(true);
      return;
    }
    setCaptureError(false);
    onSubmitCapture();
  }

  function clearDrag() {
    setDraggingTask(null);
    setOverStatus(null);
    setOverTaskId(null);
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        styles.boardColumn,
        narrow && styles.boardColumnNarrow,
        overStatus === status && canDrop && styles.boardColumnDragOver,
      )}
      onDragLeave={event => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setOverStatus(null);
      }}
      onDragOver={event => {
        if (!canDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setOverStatus(status);
      }}
      onDrop={event => {
        if (!canDrop) return;
        event.preventDefault();
        const dragged = draggingTask;
        clearDrag();
        if (dragged !== null) onMoveEnd(dragged, status);
      }}
    >
      <header className={styles.boardColumnHeader}>
        <h2 className={styles.boardColumnTitle} data-column-heading={status} id={headingId} tabIndex={-1}>
          <StatusMark name={statusName(status)} status={status} />
          <span className={styles.boardColumnCount}>
            {loading ? '…' : count === null ? copy.board.countUnavailable[lang] : count}
          </span>
        </h2>
        {canAdd && (
          <button
            aria-label={copy.board.addTaskTo[lang](statusName(status)[lang])}
            className={styles.iconButton}
            disabled={capture !== null || capturePending}
            onClick={() => onBeginCapture(status)}
            type="button"
          >
            <IconPlus size={18} />
          </button>
        )}
      </header>

      {error !== undefined && (
        <div className={styles.columnError} role="alert">
          <p>{error.reason === 'changed' ? copy.board.columnChangedBody[lang] : copy.board.columnErrorBody[lang]}</p>
          <button
            className={styles.secondary}
            onClick={() => { if (error.reason === 'changed') onRefresh(); else onLoadColumn(status); }}
            type="button"
          >
            {error.reason === 'changed' ? copy.common.refresh[lang] : copy.common.retry[lang]}
          </button>
        </div>
      )}

      {showCapture && capture !== null && (
        <form className={styles.boardCapture} noValidate onSubmit={submitCapture}>
          <label className={styles.srOnly} htmlFor={captureId}>{copy.board.captureLabel[lang](statusName(status)[lang])}</label>
          <input
            aria-describedby={captureError ? `${captureId}-error` : undefined}
            aria-invalid={captureError}
            autoFocus
            disabled={capturePending}
            id={captureId}
            maxLength={300}
            onChange={event => {
              if (captureError) setCaptureError(false);
              onCaptureChange(event.currentTarget.value);
            }}
            placeholder={copy.board.capturePlaceholder[lang]}
            type="text"
            value={capture.title}
          />
          {captureError && (
            <p className={styles.fieldError} id={`${captureId}-error`} role="alert">
              {copy.task.titleRequired[lang]}
            </p>
          )}
          <div className={styles.boardCaptureActions}>
            <button className={styles.primary} disabled={capturePending} type="submit">
              {capturePending ? copy.task.capturing[lang] : copy.task.captureSubmit[lang]}
            </button>
            <button className={styles.ghostButton} disabled={capturePending} onClick={onCancelCapture} type="button">
              {copy.common.cancel[lang]}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div aria-busy="true" className={styles.boardColumnSkeleton} role="status">
          <span className={styles.srOnly}>{copy.board.columnLoading[lang](statusName(status)[lang])}</span>
          <div />
          <div />
          <div />
        </div>
      )}

      {page !== undefined && (
        <>
          {page.items.length === 0
            ? (
              <div className={styles.boardColumnEmpty}>
                <p>{filtersActive ? copy.board.emptyFiltered[lang] : copy.board.emptyColumn[lang](statusName(status)[lang])}</p>
                {canAdd && capture === null && (
                  <button className={styles.secondary} onClick={() => onBeginCapture(status)} type="button">
                    {copy.board.addTask[lang]}
                  </button>
                )}
                {filtersActive && (
                  <button className={styles.ghostButton} onClick={onClearFilters} type="button">
                    {copy.taskView.clearFilters[lang]}
                  </button>
                )}
              </div>
            )
            : (
              <ul aria-label={copy.board.cardsLabel[lang](statusName(status)[lang])} className={styles.boardCards}>
                {page.items.map((task, index) => {
                  const previous = index > 0 ? page.items[index - 1] ?? null : null;
                  const nextNext = page.items[index + 2] ?? null;
                  const movable = !readOnly && canMove(task);
                  return (
                    <li
                      className={cx(
                        styles.boardCard,
                        draggingId === task.id && styles.boardCardDragging,
                        overTaskId === task.id && styles.boardCardDropBefore,
                      )}
                      data-task-id={task.id}
                      draggable={finePointer && movable && pendingTaskId !== task.id}
                      key={task.id}
                      onDragEnd={clearDrag}
                      onDragOver={event => {
                        if (!canDrop || draggingId === null || draggingId === task.id) return;
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = 'move';
                        setOverTaskId(task.id);
                        setOverStatus(status);
                      }}
                      onDragStart={event => {
                        if (!movable || pendingTaskId === task.id) {
                          event.preventDefault();
                          return;
                        }
                        if ((event.target as HTMLElement).closest('a,button,select,input,summary') !== null) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', task.id);
                        setDraggingTask(task);
                        setOverTaskId(null);
                        setOverStatus(status);
                      }}
                      onDrop={event => {
                        if (!canDrop || draggingId === null) return;
                        event.preventDefault();
                        event.stopPropagation();
                        if (draggingId === task.id) {
                          clearDrag();
                          return;
                        }
                        const dragged = draggingTask;
                        clearDrag();
                        if (dragged !== null) onMoveBefore(dragged, status, task.id);
                      }}
                    >
                      <div className={styles.boardCardTop}>
                        <span className={styles.taskKey}>{task.key}</span>
                        <PriorityMark name={priorityName(task.priority)} priority={task.priority} />
                      </div>
                      <h3 className={styles.boardCardTitle}>
                        <a
                          className={styles.cardTitleButton}
                          data-task-open
                          href={task.url}
                          onClick={event => {
                            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                            event.preventDefault();
                            onOpenTask(task.id, event.currentTarget);
                          }}
                        >
                          {task.title}
                        </a>
                      </h3>
                      <div className={styles.boardCardMeta}>
                        <span>{typeName(task.type)[lang]}</span>
                        <span><DueDate value={task.dueDate} /></span>
                        <span>
                          <AssigneeTag
                            inactive={task.assignee !== null && !task.assignee.active}
                            kind={task.assignee?.kind ?? null}
                            name={task.assignee?.name ?? null}
                          />
                        </span>
                        {task.archivedAt !== null && <span className={styles.taskArchivedFlag}>{copy.task.archivedBadge[lang]}</span>}
                      </div>
                      <div className={styles.boardCardFooter}>
                        <TaskMoveControl
                          canMove={movable}
                          nextNext={nextNext}
                          onMove={next => onMove(task, next)}
                          onMoveBefore={beforeTaskId => onMoveBefore(task, status, beforeTaskId)}
                          onMoveEnd={() => onMoveEnd(task, status)}
                          pending={pendingTaskId === task.id}
                          previous={previous}
                          readOnly={readOnly}
                          task={task}
                          variant="card"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

          <div className={styles.boardColumnFooter}>
            {count !== null && page.items.length < count && (
              <span>{copy.board.showing[lang](page.items.length, count)}</span>
            )}
            {page.nextCursor !== null && !changed && (
              <button className={styles.secondary} onClick={() => onLoadColumn(status)} type="button">
                {copy.board.loadMore[lang]}
              </button>
            )}
            {changed && page.nextCursor !== null && (
              <button className={styles.secondary} onClick={onRefresh} type="button">
                {copy.common.refresh[lang]}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
