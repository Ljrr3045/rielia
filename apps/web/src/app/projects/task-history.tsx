'use client';

import type { ActivityChange, TaskActivity } from '@rielia/contracts';
import { FeedbackPanel } from './feedback';
import { Badge, useLocale } from './project-ui';
import { copy, formatDateOnly, priorityName, statusName, typeName } from './strings';
import { formatTimestamp, provenanceLabel, type ProjectTasksHook } from './task-collaboration-shared';
import styles from './projects.module.css';

function changeValue(change: ActivityChange, lang: 'es' | 'en'): string {
  const value = (raw: string | null): string => {
    if (raw === null || raw.length === 0) return copy.collaboration.noValue[lang];
    if (change.field === 'status') return statusName(raw)[lang];
    if (change.field === 'type') return typeName(raw)[lang];
    if (change.field === 'priority') return priorityName(raw)[lang];
    if (change.field === 'dueDate') return formatDateOnly(raw, lang) || copy.collaboration.noValue[lang];
    return raw;
  };
  return `${value(change.before)} → ${value(change.after)}`;
}

function activityLine(entry: TaskActivity, lang: 'es' | 'en'): string {
  const action = copy.collaboration.activityActions[entry.action] ?? { es: entry.action, en: entry.action };
  const fields = entry.fields
    .map(field => copy.collaboration.activityFields[field]?.[lang] ?? field)
    .filter(value => value.length > 0);
  const changes = entry.changes.map(change => {
    const label = copy.collaboration.activityFields[change.field]?.[lang] ?? change.field;
    return `${label}: ${changeValue(change, lang)}`;
  });
  const details = changes.length > 0
    ? changes.join(' · ')
    : entry.action === 'edit-task' || entry.action === 'add-checklist-item' || entry.action === 'edit-checklist-item'
      || entry.action === 'move-checklist-item' || entry.action === 'remove-checklist-item'
      || entry.action === 'add-comment' || entry.action === 'edit-comment'
      ? fields.join(', ')
      : '';
  return details.length > 0 ? `${action[lang]} · ${details}` : action[lang];
}

export function TaskHistory({ hook }: { hook: ProjectTasksHook }) {
  const lang = useLocale();
  const slot = hook.collaboration.history;
  const data = slot.data;
  const pending = hook.mutationPending !== null;

  if (data === null) {
    return (
      <section aria-labelledby="collab-history-heading" className={styles.collabSection}>
        <h3 className={styles.detailSectionTitle} id="collab-history-heading">{copy.collaboration.history[lang]}</h3>
        {slot.status === 'error'
          ? (
            <FeedbackPanel
              actions={(
                <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('history'); }} type="button">
                  {copy.collaboration.sectionRetry[lang]}
                </button>
              )}
              body={copy.collaboration.sectionErrorBody}
              title={copy.collaboration.sectionErrorTitle}
              tone="warning"
            />
          )
          : <p className={styles.collabMuted} role="status">{copy.collaboration.sectionLoading[lang]}</p>}
      </section>
    );
  }

  return (
    <section aria-labelledby="collab-history-heading" className={styles.collabSection}>
      <div className={styles.collabHeader}>
        <h3 className={styles.detailSectionTitle} id="collab-history-heading">{copy.collaboration.history[lang]}</h3>
        <span className={styles.collabCount}>{copy.collaboration.historyCount[lang](data.total)}</span>
      </div>
      <p className={styles.collabHint}>{copy.collaboration.historyHint[lang]}</p>

      {slot.status === 'changed' && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={() => { void hook.refresh(); }} type="button">
              {copy.collaboration.sectionRefresh[lang]}
            </button>
          )}
          body={copy.collaboration.sectionStale}
          title={copy.collaboration.sectionChangedTitle}
          tone="warning"
        />
      )}
      {slot.status === 'error' && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} onClick={() => { void hook.loadCollaborationMore('history'); }} type="button">
              {copy.collaboration.sectionRetry[lang]}
            </button>
          )}
          body={copy.collaboration.sectionErrorBody}
          title={copy.collaboration.sectionErrorTitle}
          tone="warning"
        />
      )}

      {data.items.length === 0 && slot.status === 'ready' && (
        <div className={styles.collabEmpty}>
          <p className={styles.collabEmptyTitle}>{copy.collaboration.historyEmptyTitle[lang]}</p>
          <p className={styles.collabMuted}>{copy.collaboration.historyEmptyBody[lang]}</p>
        </div>
      )}

      {data.items.length > 0 && (
        <ol className={styles.historyList} aria-label={copy.collaboration.history[lang]}>
          {data.items.map(entry => (
            <li className={styles.historyItem} key={entry.id}>
              <p className={styles.historyLine}>
                <span className={styles.historyActor}>{entry.actor.name}</span>
                {entry.actor.kind === 'agent' && <Badge tone="brand">{copy.task.agentBadge[lang]}</Badge>}
                {entry.actor.kind === 'system' && <Badge tone="neutral">{copy.task.systemBadge[lang]}</Badge>}
                <span>{activityLine(entry, lang)}</span>
              </p>
              <p className={styles.historyMeta}>
                <span>{provenanceLabel(entry.provenance, lang)}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt, lang)}</time>
              </p>
            </li>
          ))}
        </ol>
      )}

      {data.nextCursor !== null && slot.status === 'ready' && (
        <button
          className={styles.loadMoreButton}
          disabled={pending}
          onClick={() => { void hook.loadCollaborationMore('history'); }}
          type="button"
        >
          {copy.collaboration.loadOlderHistory[lang]}
        </button>
      )}
    </section>
  );
}
