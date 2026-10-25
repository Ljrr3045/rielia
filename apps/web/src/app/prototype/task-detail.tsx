'use client';

import { useEffect, useRef } from 'react';
import type { DemoTask, PrototypeState, TaskPrototypeActions, TaskStatus } from '../../lib/task-prototype/types';
import { copy, formatDate, sprintStateLabel, type Lang } from './strings';
import {
  AgentBadge,
  AssigneeTag,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconClose,
  LabelChip,
  PriorityMark,
  SaveFeedback,
  StatusSelect,
  useFocusTrap,
} from './ui';
import styles from './prototype.module.css';

interface TaskDetailProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  trapFocus: boolean;
  onClose: () => void;
  onEdit: (taskId: string) => void;
}

function provenanceText(task: DemoTask, lang: Lang): string {
  const c = copy[lang];
  if (task.provenance.mode === 'delegated') {
    return lang === 'es' ? `Mediante ${task.provenance.clientName}` : `Through ${task.provenance.clientName}`;
  }
  if (task.provenance.mode === 'autonomous') {
    return `${c.autonomousAgent} · ${task.provenance.clientName}`;
  }
  return c.throughWeb;
}

export function TaskDetail({ state, actions, lang, trapFocus, onClose, onEdit }: TaskDetailProps) {
  const c = copy[lang];
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const task = state.selectedTask;
  useFocusTrap(panelRef, trapFocus, onClose);

  useEffect(() => {
    if (state.selectedTaskId !== null) headingRef.current?.focus();
  }, [state.selectedTaskId]);

  if (state.selectedTaskId === null) return null;

  if (task === null) {
    return (
      <div className={styles.detailLayer}>
        <div aria-hidden="true" className={styles.detailBackdrop} onClick={onClose} />
        <aside
          aria-labelledby="prototype-detail-heading"
          aria-modal={trapFocus}
          className={styles.detailPanel}
          ref={panelRef}
          role={trapFocus ? 'dialog' : 'complementary'}
          tabIndex={-1}
        >
          <header className={styles.detailHeader}>
            <button aria-label={c.closeDetail} className={styles.backButton} onClick={onClose} type="button">
              <IconArrowLeft size={18} />
              <span>{c.back}</span>
            </button>
            <button aria-label={c.closeDetail} className={styles.iconButton} onClick={onClose} type="button">
              <IconClose size={18} />
            </button>
          </header>
          <div className={styles.detailBody}>
            <h2 className={styles.detailTitle} data-autofocus id="prototype-detail-heading" ref={headingRef} tabIndex={-1}>
              {c.missingTaskTitle}
            </h2>
            <p className={styles.detailDescription}>{c.missingTaskBody}</p>
          </div>
        </aside>
      </div>
    );
  }

  const assignee = state.principals.find(principal => principal.id === task.assigneeId) ?? null;
  const creator = state.principals.find(principal => principal.id === task.createdByPrincipalId) ?? null;
  const sprint = state.sprints.find(item => item.id === task.sprintId) ?? null;
  const labels = task.labelIds
    .map(labelId => state.labels.find(label => label.id === labelId))
    .filter((label): label is { id: string; name: string } => label !== undefined);
  const pending = state.save.status === 'pending';

  return (
    <div className={styles.detailLayer}>
      <div aria-hidden="true" className={styles.detailBackdrop} onClick={onClose} />
      <aside
        aria-labelledby="prototype-detail-heading"
        aria-modal={trapFocus}
        className={styles.detailPanel}
        ref={panelRef}
        role={trapFocus ? 'dialog' : 'complementary'}
        tabIndex={-1}
      >
        <header className={styles.detailHeader}>
          <button aria-label={c.closeDetail} className={styles.backButton} onClick={onClose} type="button">
            <IconArrowLeft size={18} />
            <span className={styles.detailBackLabel}>{c.back}</span>
          </button>
          <span className={styles.detailHeaderKey}>{task.key}</span>
          <button className={styles.secondaryButton} disabled={pending} onClick={() => onEdit(task.id)} type="button">
            {c.edit}
          </button>
          <button aria-label={c.closeDetail} className={styles.iconButton} onClick={onClose} type="button">
            <IconClose size={18} />
          </button>
        </header>

        <div className={styles.detailBody}>
          <div className={styles.detailFeedback}>
            <SaveFeedback
              canRetry={state.canRetry}
              lang={lang}
              onRetry={() => {
                void actions.retrySave();
              }}
              save={state.save}
              showError
            />
          </div>

          <div className={styles.detailTitleRow}>
            <h2 className={styles.detailTitle} data-autofocus id="prototype-detail-heading" ref={headingRef} tabIndex={-1}>
              {task.title}
            </h2>
          </div>

          <p className={styles.detailDescription}>{task.description.length > 0 ? task.description : c.noDescription}</p>

          {task.assigneeId === null && <p className={styles.detailNotice}>{c.unassignedHint}</p>}

          <section aria-labelledby="prototype-properties-heading" className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle} id="prototype-properties-heading">
              {c.properties}
            </h3>
            <dl className={styles.propertyList}>
              <div className={styles.propertyRow}>
                <dt>{c.status}</dt>
                <dd>
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
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.priority}</dt>
                <dd>
                  <PriorityMark lang={lang} priority={task.priority} />
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.assignee}</dt>
                <dd>
                  <AssigneeTag lang={lang} principal={assignee} />
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.labels}</dt>
                <dd className={styles.propertyLabels}>
                  {labels.length > 0 ? labels.map(label => <LabelChip key={label.id} name={label.name} />) : c.noLabels}
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.dueDate}</dt>
                <dd className={styles.metaItem}>
                  <IconCalendar size={14} />
                  {task.dueDate === null ? c.noDueDate : formatDate(task.dueDate, lang)}
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.points}</dt>
                <dd>
                  {task.points === null ? c.unestimated : <span className={styles.points}>{c.pointsTotal(task.points)}</span>}
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.sprint}</dt>
                <dd>
                  {sprint === null ? (
                    c.noSprint
                  ) : (
                    <span className={styles.sprintProperty}>
                      {sprint.name}
                      <span className={styles.sprintState} data-state={sprint.state}>
                        {sprintStateLabel(sprint.state, lang)}
                      </span>
                    </span>
                  )}
                </dd>
              </div>
              <div className={styles.propertyRow}>
                <dt>{c.projectLabel}</dt>
                <dd>
                  {state.project.name} <span className={styles.taskKey}>{state.project.key}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="prototype-provenance-heading" className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle} id="prototype-provenance-heading">
              {c.provenance}
            </h3>
            <div className={styles.provenanceCard}>
              <div className={styles.provenanceRow}>
                <span className={styles.provenanceLabel}>{c.createdBy}</span>
                <span className={styles.provenanceValue}>
                  {creator?.name ?? task.createdByPrincipalId}
                  {creator?.kind === 'agent' && <AgentBadge lang={lang} />}
                </span>
              </div>
              <div className={styles.provenanceRow}>
                <span className={styles.provenanceLabel}>{c.assignedTo}</span>
                <span className={styles.provenanceValue}>
                  <AssigneeTag lang={lang} principal={assignee} />
                </span>
              </div>
              <p className={styles.provenanceNote}>{provenanceText(task, lang)}</p>
            </div>
          </section>

          <p className={styles.detailHint}>
            <IconCheck size={14} />
            {c.memoryOnly}
          </p>
        </div>
      </aside>
    </div>
  );
}
