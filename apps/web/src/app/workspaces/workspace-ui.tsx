'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Bilingual } from './strings';
import { copy } from './strings';
import styles from './workspace.module.css';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ');
}

export function phrase(value: Bilingual): string {
  return `${value.es} / ${value.en}`;
}

export function BilingualText({ value }: { value: Bilingual }) {
  return (
    <>
      {value.es} / <span lang="en">{value.en}</span>
    </>
  );
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

type BadgeTone = 'neutral' | 'brand' | 'warning' | 'danger' | 'success';

const badgeTone: Record<BadgeTone, string> = {
  neutral: styles.badgeNeutral,
  brand: styles.badgeBrand,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  success: styles.badgeSuccess,
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={cx(styles.badge, badgeTone[tone])}>{children}</span>;
}

export function ConfirmBox({
  title,
  consequence,
  details,
  confirmLabel,
  danger = false,
  disabled = false,
  onConfirm,
  onCancel,
}: {
  title: Bilingual;
  consequence: Bilingual;
  details?: ReactNode;
  confirmLabel: Bilingual;
  danger?: boolean;
  disabled?: boolean;
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
      {details}
      <p className={styles.confirmText}><BilingualText value={consequence} /></p>
      <div className={styles.formActions}>
        <button
          type="button"
          className={danger ? styles.dangerButton : styles.primary}
          disabled={disabled}
          onClick={onConfirm}
        >
          <BilingualText value={confirmLabel} />
        </button>
        <button type="button" className={styles.secondary} disabled={disabled} onClick={onCancel}>
          <BilingualText value={copy.common.cancel} />
        </button>
      </div>
    </div>
  );
}
