'use client';

import { createContext, useContext, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LimitedRole, MemberState, Page, WorkspaceMember } from '@rielia/contracts';
import type { Bilingual } from './strings';
import { copy } from './strings';
import styles from './workspace.module.css';

export type Lang = 'es' | 'en';

const LocaleContext = createContext<Lang>('es');

export function LocaleProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Lang {
  return useContext(LocaleContext);
}

export function cx(...values: Array<string | false | null | undefined>): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');
}

export function BilingualText({ value }: { value: Bilingual }) {
  const lang = useLocale();
  return <>{value[lang]}</>;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

type BadgeTone = 'neutral' | 'brand' | 'warning' | 'danger' | 'success';

const badgeTone: Record<BadgeTone, string | undefined> = {
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
  children,
  confirmLabel,
  danger = false,
  disabled = false,
  onConfirm,
  onCancel,
}: {
  title: Bilingual;
  consequence: Bilingual;
  children?: ReactNode;
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
      {children}
      <p className={styles.confirmText}>
        <BilingualText value={consequence} />
      </p>
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

export const limitedRoles: readonly LimitedRole[] = ['admin', 'member', 'viewer'];

export function stateTone(state: MemberState): 'neutral' | 'warning' | 'danger' | 'success' {
  if (state === 'active') return 'success';
  if (state === 'suspended') return 'warning';
  return 'danger';
}

export function memberName(
  members: Page<WorkspaceMember> | null,
  principalId: string | null,
): string | null {
  if (principalId === null || members === null) return null;
  return members.items.find((member) => member.principalId === principalId)?.name ?? null;
}

export function BilingualOption({ value }: { value: { es: string; en: string } }) {
  const lang = useLocale();
  return <>{value[lang]}</>;
}
