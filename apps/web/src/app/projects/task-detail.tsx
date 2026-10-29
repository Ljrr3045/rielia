'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { DomainPerson, DomainProvenance, Task } from '@rielia/contracts';
import {
  AgentBadge,
  AssigneeTag,
  Badge,
  DueDate,
  IconAlert,
  IconArchive,
  IconArrowLeft,
  IconClose,
  IconRestore,
  PriorityMark,
  StatusMark,
  useFocusTrap,
  useLocale,
} from './project-ui';
import { copy, priorityName, statusName, typeName, type Lang } from './strings';
import styles from './projects.module.css';

export function provenanceText(provenance: DomainProvenance, lang: Lang): string {
  if (provenance.executionMode === 'autonomous') {
    return provenance.source === 'mcp'
      ? copy.task.autonomousAgent[lang] + ' · MCP'
      : copy.task.autonomousAgent[lang];
  }
  if (provenance.executionMode === 'delegated') {
    return provenance.source === 'mcp'
      ? `${copy.task.throughClient[lang]} MCP`
      : copy.task.throughWeb[lang];
  }
  return copy.task.throughWeb[lang];
}

function CreatorLine({ task }: { task: Task }) {
  const lang = useLocale();
  return (
    <div className={styles.provenanceLine}>
      <span className={styles.provenanceLabel}>{copy.task.creatorLabel[lang]}:</span>
      <span>{task.creator.name}</span>
      {task.creator.kind === 'agent' && <AgentBadge />}
      <span className={styles.sectionHint}>· {provenanceText(task.provenance, lang)}</span>
    </div>
  );
}

function AssigneeLine({ assignee }: { assignee: DomainPerson | null }) {
  return (
    <AssigneeTag
      inactive={assignee !== null && !assignee.active}
      kind={assignee?.kind ?? null}
      name={assignee?.name ?? null}
    />
  );
}

export function TaskDetail({
  task,
  projectArchived,
  overlay,
  modalOpen,
  actionsDisabled = false,
  feedback,
  description,
  onClose,
  onEdit,
  onArchive,
  onRestore,
}: {
  task: Task;
  projectArchived: boolean;
  overlay: boolean;
  modalOpen: boolean;
  actionsDisabled?: boolean;
  feedback?: ReactNode | undefined;
  description?: ReactNode | undefined;
  onClose: () => void;
  onEdit: (opener: HTMLElement) => void;
  onArchive: (opener: HTMLElement) => void;
  onRestore: (opener: HTMLElement) => void;
}) {
  const lang = useLocale();
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const propertiesId = useId();
  const provenanceId = useId();
  const taskArchived = task.archivedAt !== null;
  const readOnly = projectArchived || taskArchived || !task.capabilities.canEdit;
  useFocusTrap(panelRef, overlay && !modalOpen, onClose);

  useEffect(() => {
    headingRef.current?.focus();
  }, [task.id]);

  return (
    <div className={styles.detailLayer}>
      {overlay && (
        <button
          aria-hidden="true"
          className={styles.detailBackdrop}
          onClick={onClose}
          tabIndex={-1}
          type="button"
        />
      )}
      <aside
        aria-labelledby={headingId}
        aria-modal={overlay ? true : undefined}
        className={styles.detailPanel}
        ref={panelRef}
        role={overlay ? 'dialog' : 'complementary'}
        tabIndex={-1}
      >
        <header className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            <button aria-label={copy.common.backToProject[lang]} className={styles.ghostButton} onClick={onClose} type="button">
              <IconArrowLeft size={18} />
              <span>{copy.common.back[lang]}</span>
            </button>
            <span className={styles.detailHeaderKey}>{task.key}</span>
            {taskArchived && <Badge tone="archived">{copy.task.archivedBadge[lang]}</Badge>}
          </div>
          <div className={styles.detailHeaderRight}>
            {!readOnly && (
              <button className={styles.secondary} disabled={actionsDisabled} onClick={event => onEdit(event.currentTarget)} type="button">
                {copy.common.edit[lang]}
              </button>
            )}
            <button aria-label={copy.task.closeDetail[lang]} className={styles.iconButton} onClick={onClose} type="button">
              <IconClose size={18} />
            </button>
          </div>
        </header>

        <div className={styles.detailBody}>
          {feedback}

          <h2 className={styles.detailTitle} data-autofocus data-detail-heading id={headingId} ref={headingRef} tabIndex={-1}>
            {task.title}
          </h2>

          {taskArchived && (
            <p className={styles.detailNotice}>{copy.task.archivedTaskNotice[lang]}</p>
          )}
          {!taskArchived && projectArchived && (
            <p className={styles.detailNotice}>{copy.project.archivedNotice[lang]}</p>
          )}
          {!taskArchived && !projectArchived && task.assignee !== null && !task.assignee.active && (
            <p className={styles.detailNotice}>{copy.task.inactiveAssigneeHint[lang]}</p>
          )}

          <div className={styles.detailDescription}>
            {description ?? (task.description.length > 0
              ? <span>{task.description}</span>
              : <span className={styles.detailDescriptionMuted}>{copy.task.noDescription[lang]}</span>)}
          </div>

          <section aria-labelledby={propertiesId} className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle} id={propertiesId}>{copy.task.properties[lang]}</h3>
            <dl className={styles.propertyList}>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.task.statusLabel[lang]}</dt>
                <dd className={styles.propertyValue}>
                  <StatusMark name={statusName(task.status)} status={task.status} />
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.task.typeLabel[lang]}</dt>
                <dd className={styles.propertyValue}>{typeName(task.type)[lang]}</dd>
              </div>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.task.priorityLabel[lang]}</dt>
                <dd className={styles.propertyValue}>
                  <PriorityMark name={priorityName(task.priority)} priority={task.priority} />
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.task.assigneeLabel[lang]}</dt>
                <dd className={styles.propertyValue}>
                  <AssigneeLine assignee={task.assignee} />
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.task.dueDateLabel[lang]}</dt>
                <dd className={styles.propertyValue}><DueDate value={task.dueDate} /></dd>
              </div>
              <div className={styles.propertyRow}>
                <dt className={styles.propertyLabel}>{copy.common.project[lang]}</dt>
                <dd className={styles.propertyValue}>
                  <span className={styles.taskKey}>{task.projectKey}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby={provenanceId} className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle} id={provenanceId}>{copy.task.provenanceLabel[lang]}</h3>
            <div className={styles.provenanceCard}>
              <CreatorLine task={task} />
              <p className={styles.sectionHint}>{copy.task.creatorHint[lang]}</p>
            </div>
          </section>

          {!task.capabilities.canEdit && !projectArchived && !taskArchived && (
            <div className={styles.viewerNotice}>
              <IconAlert size={18} />
              <span>{copy.task.viewerBody[lang]}</span>
            </div>
          )}

          {!projectArchived && (taskArchived ? task.capabilities.canRestore : task.capabilities.canArchive) && (
            <div className={styles.detailFooter}>
              {taskArchived
                ? (
                  <button className={styles.secondary} disabled={actionsDisabled} onClick={event => onRestore(event.currentTarget)} type="button">
                    <IconRestore size={16} />
                    {copy.task.restore[lang]}
                  </button>
                )
                : (
                  <button className={styles.secondary} disabled={actionsDisabled} onClick={event => onArchive(event.currentTarget)} type="button">
                    <IconArchive size={16} />
                    {copy.task.archive[lang]}
                  </button>
                )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
