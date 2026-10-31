'use client';

import { useId } from 'react';
import type { MouseEvent } from 'react';
import { taskStatuses, type Task, type TaskStatus } from '@rielia/contracts';
import { IconChevron, StatusMark, cx, useLocale } from './project-ui';
import { copy, statusName } from './strings';
import styles from './projects.module.css';

export function TaskMoveControl({
  task,
  readOnly,
  canMove,
  pending,
  variant,
  previous,
  nextNext,
  onMove,
  onMoveBefore,
  onMoveEnd,
}: {
  task: Task;
  readOnly: boolean;
  canMove: boolean;
  pending: boolean;
  variant: 'row' | 'card';
  previous: Task | null;
  nextNext: Task | null;
  onMove: (status: TaskStatus) => void;
  onMoveBefore: (beforeTaskId: string) => void;
  onMoveEnd: () => void;
}) {
  const lang = useLocale();
  const selectId = useId();

  if (readOnly) {
    return <StatusMark name={statusName(task.status)} status={task.status} />;
  }

  const disabled = pending || !canMove;

  function closeMenu(event: MouseEvent<HTMLButtonElement>) {
    const details = event.currentTarget.closest('details');
    const summary = details?.querySelector<HTMLElement>('summary') ?? null;
    details?.removeAttribute('open');
    summary?.focus();
  }

  return (
    <div className={cx(styles.moveControls, variant === 'card' && styles.moveControlsCard)}>
      <label className={styles.srOnly} htmlFor={selectId}>{copy.move.statusLabel[lang](task.key)}</label>
      <select
        aria-label={copy.move.statusLabel[lang](task.key)}
        className={styles.moveStatusSelect}
        disabled={disabled}
        id={selectId}
        onChange={event => {
          const next = event.currentTarget.value as TaskStatus;
          if (next !== task.status) onMove(next);
        }}
        value={task.status}
      >
        {taskStatuses.map(status => (
          <option key={status} value={status}>{statusName(status)[lang]}</option>
        ))}
      </select>

      {!disabled && (
        <details className={styles.moveMenu}>
          <summary
            aria-label={copy.move.menuLabel[lang](task.key)}
            className={styles.moveMenuSummary}
            onKeyDown={event => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              const details = event.currentTarget.closest('details');
              if (details !== null) details.open = !details.open;
            }}
          >
            <span>{copy.move.menu[lang]}</span>
            <IconChevron size={14} />
          </summary>
          <div
            className={styles.moveMenuPanel}
            onKeyDown={event => {
              if (event.key !== 'Escape') return;
              const details = event.currentTarget.closest('details');
              const summary = details?.querySelector<HTMLElement>('summary') ?? null;
              details?.removeAttribute('open');
              summary?.focus();
            }}
          >
            {previous !== null && (
              <button
                className={styles.moveMenuItem}
                onClick={event => {
                  closeMenu(event);
                  onMoveBefore(previous.id);
                }}
                type="button"
              >
                {copy.move.beforeTask[lang](previous.key, previous.title)}
              </button>
            )}
            {nextNext !== null && (
              <button
                className={styles.moveMenuItem}
                onClick={event => {
                  closeMenu(event);
                  onMoveBefore(nextNext.id);
                }}
                type="button"
              >
                {copy.move.beforeTask[lang](nextNext.key, nextNext.title)}
              </button>
            )}
            <button
              className={styles.moveMenuItem}
              onClick={event => {
                closeMenu(event);
                onMoveEnd();
              }}
              type="button"
            >
              {copy.move.endOfColumn[lang]}
            </button>
          </div>
        </details>
      )}

      {pending && <span className={styles.movePending} role="status">{copy.move.pendingShort[lang]}</span>}
    </div>
  );
}
