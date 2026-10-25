'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { DemoPrincipal, PrototypeState, TaskPriority, TaskStatus } from '../../lib/task-prototype/types';
import {
  copy,
  localizeError,
  priorityLabel,
  savePendingLabel,
  saveSavedLabel,
  statusLabel,
  type Lang,
} from './strings';
import styles from './prototype.module.css';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ');
}

const NARROW_QUERY = '(max-width: 1199px)';

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getNarrowSnapshot() {
  return window.matchMedia(NARROW_QUERY).matches;
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribeNarrow, getNarrowSnapshot, () => false);
}

let bodyLocks = 0;
let previousOverflow = '';

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (bodyLocks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyLocks += 1;
    return () => {
      bodyLocks = Math.max(0, bodyLocks - 1);
      if (bodyLocks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

export function useFocusTrap<T extends HTMLElement>(ref: RefObject<T | null>, active: boolean, onEscape?: () => void) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (node === null) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const autofocus = node.querySelector<HTMLElement>('[data-autofocus]') ?? node;
    const frame = requestAnimationFrame(() => autofocus.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        const escape = escapeRef.current;
        if (escape !== undefined) {
          event.preventDefault();
          escape();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        node!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(element => element.offsetParent !== null || element === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        node!.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || current === autofocus || current === node || !node!.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !node!.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [active, ref]);
}

function IconBase({ children, size = 20, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function IconMyTasks({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3.5 6 1.5 1.5L7.5 5M3.5 12 5 13.5 7.5 11M3.5 18 5 19.5 7.5 17" />
    </IconBase>
  );
}

export function IconList({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </IconBase>
  );
}

export function IconBoard({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="10" rx="1.5" />
      <rect x="17" y="4" width="4" height="13" rx="1.5" />
    </IconBase>
  );
}

export function IconSprint({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 7h9M4 12h6M4 17h9" />
      <path d="M16 7h4v13l-2-1.5L16 20z" />
    </IconBase>
  );
}

export function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </IconBase>
  );
}

export function IconFilter({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 5h16l-6.5 7.2V20l-3 1v-8.8z" />
    </IconBase>
  );
}

export function IconClose({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconBase>
  );
}

export function IconMenu({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function IconArrowLeft({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </IconBase>
  );
}

export function IconCheck({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="m4 12 5.5 5.5L20 6.5" />
    </IconBase>
  );
}

export function IconAlert({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M12 3 2.8 19h18.4z" />
      <path d="M12 9v4.5M12 17h.01" />
    </IconBase>
  );
}

export function IconCalendar({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </IconBase>
  );
}

export function IconTag({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M20 12.5 12.5 20 4 11.5V4h7.5z" />
      <circle cx="8.5" cy="8.5" r="1" />
    </IconBase>
  );
}

export function IconUser({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1.5-4 4.5-5.5 7.5-5.5S18 16 19.5 20" />
    </IconBase>
  );
}

export function IconInbox({ size = 32 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 5h16v14H4z" />
      <path d="M4 14h4l2 3h4l2-3h4" />
    </IconBase>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span aria-hidden="true" className={styles.spinner} style={{ width: size, height: size }} />;
}

export function StatusDot({ status }: { status: TaskStatus }) {
  return <span aria-hidden="true" className={styles.statusDot} data-status={status} />;
}

interface StatusSelectProps {
  status: TaskStatus;
  statuses: readonly { id: TaskStatus; name: string }[];
  lang: Lang;
  label: string;
  disabled: boolean;
  onChange: (status: TaskStatus) => void;
}

export function StatusSelect({ status, statuses, lang, label, disabled, onChange }: StatusSelectProps) {
  return (
    <span className={styles.statusSelectWrap} data-status={status}>
      <StatusDot status={status} />
      <select
        aria-label={label}
        className={styles.statusSelect}
        disabled={disabled}
        onChange={event => onChange(event.target.value as TaskStatus)}
        value={status}
      >
        {statuses.map(item => (
          <option key={item.id} value={item.id}>
            {statusLabel(item.id, lang)}
          </option>
        ))}
      </select>
    </span>
  );
}

export function PriorityMark({ priority, lang }: { priority: TaskPriority; lang: Lang }) {
  return (
    <span className={styles.priority} data-priority={priority}>
      <span aria-hidden="true" className={styles.priorityBars}>
        <span />
        <span />
        <span />
      </span>
      {priorityLabel(priority, lang)}
    </span>
  );
}

export function AgentBadge({ lang }: { lang: Lang }) {
  return <span className={styles.agentBadge}>{copy[lang].agent}</span>;
}

export function AssigneeTag({ principal, lang }: { principal: DemoPrincipal | null; lang: Lang }) {
  if (principal === null) return <span className={styles.mutedText}>{copy[lang].unassigned}</span>;
  return (
    <span className={styles.assignee}>
      <Avatar kind={principal.kind} name={principal.name} />
      <span>{principal.name}</span>
      {principal.kind === 'agent' && <AgentBadge lang={lang} />}
    </span>
  );
}

export function Avatar({ name, kind }: { name: string; kind: 'human' | 'agent' }) {
  const initials = name
    .replace(/\(demo\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
  return (
    <span aria-hidden="true" className={styles.avatar} data-kind={kind}>
      {initials}
    </span>
  );
}

export function LabelChip({ name }: { name: string }) {
  return (
    <span className={styles.labelChip} lang="en">
      <IconTag size={12} />
      {name}
    </span>
  );
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <span aria-hidden="true" className={styles.emptyIcon}>
        <IconInbox size={30} />
      </span>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyBody}>{body}</p>
      {children !== undefined && <div className={styles.emptyActions}>{children}</div>}
    </div>
  );
}

interface SaveFeedbackProps {
  save: PrototypeState['save'];
  lang: Lang;
  canRetry: boolean;
  showError: boolean;
  onRetry: () => void;
}

export function SaveFeedback({ save, lang, canRetry, showError, onRetry }: SaveFeedbackProps) {
  const c = copy[lang];
  if (save.status === 'idle') return null;
  if (save.status === 'error' && !showError) return null;

  if (save.status === 'pending') {
    return (
      <div aria-live="polite" className={cx(styles.feedback, styles.feedbackPending)} role="status">
        <Spinner />
        <span>{savePendingLabel(save.kind ?? 'task', lang)}</span>
      </div>
    );
  }

  if (save.status === 'saved') {
    return (
      <div aria-live="polite" className={cx(styles.feedback, styles.feedbackSaved)} role="status">
        <IconCheck size={16} />
        <span>{saveSavedLabel(save.kind ?? 'task', lang)}</span>
      </div>
    );
  }

  const problem = save.error;
  if (problem === null) return null;
  return (
    <div className={cx(styles.feedback, styles.feedbackError)} role="alert">
      <IconAlert size={18} />
      <span className={styles.feedbackBody}>
        <strong>{c.saveError}</strong>
        <span>{localizeError(problem, lang)}</span>
      </span>
      {canRetry && (
        <button className={styles.secondaryButton} onClick={onRetry} type="button">
          {c.retry}
        </button>
      )}
    </div>
  );
}
