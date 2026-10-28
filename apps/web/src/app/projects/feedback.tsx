'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Bilingual } from './strings';
import { copy } from './strings';
import { BilingualText, IconAlert, IconCheck, Spinner, cx } from './project-ui';
import styles from './projects.module.css';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';

const toneClass: Record<FeedbackTone, string | undefined> = {
  info: styles.feedbackInfo,
  success: styles.feedbackSuccess,
  warning: styles.feedbackWarning,
  danger: styles.feedbackDanger,
};

export function FeedbackPanel({
  tone,
  title,
  body,
  target,
  busy = false,
  autoFocus = false,
  actions,
}: {
  tone: FeedbackTone;
  title: Bilingual;
  body?: Bilingual;
  target?: string | null | undefined;
  busy?: boolean;
  autoFocus?: boolean;
  actions?: ReactNode | undefined;
}) {
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, title]);

  return (
    <div className={cx(styles.feedback, toneClass[tone] ?? '')} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <p className={styles.feedbackTitle} ref={titleRef} tabIndex={autoFocus ? -1 : undefined}>
        {busy ? <Spinner /> : tone === 'success' ? <IconCheck size={18} /> : <IconAlert size={18} />}
        <BilingualText value={title} />
      </p>
      {body !== undefined && <p className={styles.feedbackBody}><BilingualText value={body} /></p>}
      {target !== undefined && target !== null && <p className={styles.feedbackTarget}>{target}</p>}
      {actions !== undefined && <div className={styles.feedbackActions}>{actions}</div>}
    </div>
  );
}

export interface ConflictFieldView {
  key: string;
  label: string;
  draft: string;
  current: string;
  changed: boolean;
}

export function ConflictPanel({
  title,
  body,
  draftLabel,
  currentLabel,
  fields,
  actions,
}: {
  title: Bilingual;
  body: Bilingual;
  draftLabel: Bilingual;
  currentLabel: Bilingual;
  fields: readonly ConflictFieldView[];
  actions: ReactNode;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={styles.conflictPanel} role="alert">
      <p className={styles.feedbackTitle} ref={headingRef} tabIndex={-1}>
        <IconAlert size={18} />
        <BilingualText value={title} />
      </p>
      <p className={styles.feedbackBody}><BilingualText value={body} /></p>
      <div className={styles.conflictGrid}>
        <div className={styles.conflictColumn}>
          <p className={styles.conflictColumnLabel}><BilingualText value={currentLabel} /></p>
          {fields.map(field => (
            <div className={styles.conflictField} key={field.key}>
              <p className={styles.conflictFieldLabel}>{field.label}</p>
              <p className={styles.conflictFieldValue}>{field.current}</p>
            </div>
          ))}
        </div>
        <div className={styles.conflictColumn}>
          <p className={styles.conflictColumnLabel}><BilingualText value={draftLabel} /></p>
          {fields.map(field => (
            <div className={styles.conflictField} key={field.key}>
              <p className={styles.conflictFieldLabel}>
                {field.label}
                {field.changed && <span className={styles.changedMark}><BilingualText value={copy.feedback.conflictChanged} /></span>}
              </p>
              <p className={styles.conflictFieldValue}>{field.draft}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.feedbackActions}>{actions}</div>
    </div>
  );
}

export function DraftContextNotice({
  title,
  body,
  target,
  actions,
}: {
  title: Bilingual;
  body: Bilingual;
  target?: string | null;
  actions: ReactNode;
}) {
  return (
    <FeedbackPanel
      actions={actions}
      body={body}
      target={target}
      title={title}
      tone="warning"
    />
  );
}
