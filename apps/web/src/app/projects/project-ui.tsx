'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useSyncExternalStore } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Bilingual, Lang } from './strings';
import { copy, formatDateOnly } from './strings';
import styles from './projects.module.css';

const LocaleContext = createContext<Lang>('es');

export function LocaleProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Lang {
  return useContext(LocaleContext);
}

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ');
}

export function BilingualText({ value }: { value: Bilingual }) {
  const lang = useLocale();
  return <>{value[lang]}</>;
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'archived';

const badgeTone: Record<BadgeTone, string | undefined> = {
  neutral: styles.badgeNeutral,
  brand: styles.badgeBrand,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  archived: styles.badgeArchived,
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={cx(styles.badge, badgeTone[tone])}>{children}</span>;
}

export function AgentBadge() {
  return <Badge tone="brand"><BilingualText value={copy.task.agentBadge} /></Badge>;
}

export function StatusMark({ status, name }: { status: string; name: Bilingual }) {
  return (
    <span className={styles.statusValue} data-status={status}>
      <span aria-hidden="true" className={styles.statusDot} />
      <BilingualText value={name} />
    </span>
  );
}

export function PriorityMark({ priority, name }: { priority: string; name: Bilingual }) {
  return (
    <span className={styles.priorityValue} data-priority={priority}>
      <span aria-hidden="true" className={styles.priorityBars}>
        <span />
        <span />
        <span />
      </span>
      <BilingualText value={name} />
    </span>
  );
}

export function AssigneeTag({ name, kind, inactive = false }: { name: string | null; kind: string | null; inactive?: boolean }) {
  if (name === null) return <span className={styles.mutedValue}><BilingualText value={copy.task.unassigned} /></span>;
  return (
    <span className={styles.assigneeValue}>
      <span className={styles.assigneeName}>{name}</span>
      {kind === 'agent' && <AgentBadge />}
      {inactive && <span className={styles.inactiveFlag}><BilingualText value={copy.task.inactiveAssignee} /></span>}
    </span>
  );
}

export function DueDate({ value }: { value: string | null }) {
  const lang = useLocale();
  if (value === null) return <span className={styles.mutedValue}><BilingualText value={copy.task.noDueDate} /></span>;
  return (
    <span className={styles.dateValue}>
      <IconCalendar size={14} />
      <time dateTime={value}>{formatDateOnly(value, lang)}</time>
    </span>
  );
}

export function ConfirmBox({
  title,
  consequence,
  confirmLabel,
  pendingLabel,
  busy = false,
  disabled = false,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: Bilingual;
  consequence: Bilingual;
  confirmLabel: Bilingual;
  pendingLabel?: Bilingual;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={styles.confirm} role="group" aria-labelledby={titleId}>
      <h3 id={titleId} ref={headingRef} tabIndex={-1} className={styles.confirmTitle}>
        <BilingualText value={title} />
      </h3>
      <p className={styles.confirmText}><BilingualText value={consequence} /></p>
      <div className={styles.formActions}>
        <button
          type="button"
          className={danger ? styles.dangerButton : styles.primary}
          disabled={busy || disabled}
          onClick={onConfirm}
        >
          <BilingualText value={busy && pendingLabel !== undefined ? pendingLabel : confirmLabel} />
        </button>
        <button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>
          <BilingualText value={copy.common.cancel} />
        </button>
      </div>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return <p className={styles.fieldError} id={id} role="alert">{children}</p>;
}

export function EmptyState({
  icon,
  title,
  body,
  actions,
}: {
  icon?: ReactNode;
  title: Bilingual;
  body: Bilingual;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className={styles.emptyState}>
      {icon !== undefined && <div className={styles.emptyIcon}>{icon}</div>}
      <h3 className={styles.emptyTitle}><BilingualText value={title} /></h3>
      <p className={styles.emptyBody}><BilingualText value={body} /></p>
      {actions !== undefined && <div className={styles.emptyActions}>{actions}</div>}
    </div>
  );
}

export function ModalFrame({
  eyebrow,
  title,
  busy = false,
  small = false,
  wide = false,
  onClose,
  children,
}: {
  eyebrow?: Bilingual;
  title: Bilingual;
  busy?: boolean;
  small?: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const lang = useLocale();
  useFocusTrap(ref, true, busy ? undefined : onClose);
  useBodyScrollLock(true);

  return (
    <div className={styles.modalLayer}>
      <button
        aria-hidden="true"
        className={styles.modalBackdrop}
        onClick={busy ? undefined : onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cx(styles.modal, small && styles.modalSmall, wide && styles.modalWide)}
        ref={ref}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.modalHeader}>
          <div>
            {eyebrow !== undefined && <p className={styles.modalEyebrow}><BilingualText value={eyebrow} /></p>}
            <h2 className={styles.modalTitle} id={titleId}><BilingualText value={title} /></h2>
          </div>
          <button
            aria-label={copy.common.close[lang]}
            className={styles.iconButton}
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            <IconClose size={20} />
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export function StateCard({
  busy = false,
  icon,
  title,
  body,
  actions,
  compact = false,
  children,
}: {
  busy?: boolean;
  icon?: ReactNode;
  title: Bilingual;
  body: Bilingual;
  actions?: ReactNode;
  compact?: boolean;
  children?: ReactNode;
}) {
  const titleId = useId();
  return (
    <section className={cx(styles.stateCard, compact && styles.stateCardCompact)} aria-labelledby={titleId} aria-busy={busy}>
      {icon !== undefined && <div className={styles.stateIcon}>{icon}</div>}
      <h2 className={styles.stateTitle} id={titleId}><BilingualText value={title} /></h2>
      <p className={styles.stateBody}><BilingualText value={body} /></p>
      {children}
      {actions !== undefined && <div className={styles.stateActions}>{actions}</div>}
    </section>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span aria-hidden="true" className={styles.spinner} style={{ width: size, height: size }} />;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useIsDetailOverlay(): boolean {
  return useMediaQuery('(max-width: 79.9375rem)');
}

export function useIsSidebarDrawer(): boolean {
  return useMediaQuery('(max-width: 63.9375rem)');
}

export function useIsNarrow(): boolean {
  return useMediaQuery('(max-width: 47.9375rem)');
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

function IconBase({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden="true"
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

export function IconProject({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M3 7h7l2 2h9v10H3z" />
      <path d="M3 7V5h7l2 2" />
    </IconBase>
  );
}

export function IconTask({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </IconBase>
  );
}

export function IconUsers({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17.5 19a5 5 0 0 0-2.2-4.1" />
    </IconBase>
  );
}

export function IconPlus({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="M12 5v14M5 12h14" /></IconBase>;
}

export function IconClose({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="m6 6 12 12M18 6 6 18" /></IconBase>;
}

export function IconMenu({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="M4 7h16M4 12h16M4 17h16" /></IconBase>;
}

export function IconArrowLeft({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="M20 12H4M10 6l-6 6 6 6" /></IconBase>;
}

export function IconSettings({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 7h9M18 7h2M4 17h2M11 17h9" />
      <circle cx="15.5" cy="7" r="2.5" />
      <circle cx="8.5" cy="17" r="2.5" />
    </IconBase>
  );
}

export function IconArchive({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M5 9v11h14V9M10 13h4" />
    </IconBase>
  );
}

export function IconRestore({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4 9a8 8 0 1 1 2 8" />
      <path d="M4 4v5h5" />
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

export function IconCheck({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="m4 12 5.5 5.5L20 6.5" /></IconBase>;
}

export function IconAlert({ size = 20 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M12 3 2.8 19h18.4z" />
      <path d="M12 9v4.5M12 17h.01" />
    </IconBase>
  );
}

export function IconChevron({ size = 20 }: { size?: number }) {
  return <IconBase size={size}><path d="m8 10 4 4 4-4" /></IconBase>;
}
