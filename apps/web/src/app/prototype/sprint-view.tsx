'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ClosureDestination,
  DemoTask,
  PrototypeState,
  SprintFields,
  TaskPrototypeActions,
} from '../../lib/task-prototype/types';
import { getSprintSummary } from '../../lib/task-prototype';
import {
  copy,
  formatSprintRange,
  localizeError,
  sprintStateLabel,
  statusLabel,
  type Lang,
} from './strings';
import {
  EmptyState,
  IconCalendar,
  IconClose,
  IconPlus,
  SaveFeedback,
  Spinner,
  StatusDot,
  cx,
  useFocusTrap,
} from './ui';
import styles from './prototype.module.css';

interface SprintViewProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  onOpenTask: (taskId: string) => void;
  onNewSprint: () => void;
  onEditSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string) => void;
}

function sprintPoints(state: PrototypeState, sprintId: string): { points: number; unestimated: number } {
  const scope = state.tasks.filter(task => task.sprintId === sprintId);
  return {
    points: scope.reduce((total, task) => total + (task.points ?? 0), 0),
    unestimated: scope.filter(task => task.points === null).length,
  };
}

export function SprintView({
  state,
  actions,
  lang,
  onOpenTask,
  onNewSprint,
  onEditSprint,
  onCloseSprint,
}: SprintViewProps) {
  const c = copy[lang];
  const activeSprint = state.sprints.find(sprint => sprint.state === 'active') ?? null;
  const pending = state.save.status === 'pending';
  const draftOpen = state.taskDraft !== null || state.sprintDraft !== null;
  const showLocalFeedback = state.save.kind === 'sprint' || state.save.kind === 'start-sprint';

  if (state.sprints.length === 0) {
    return (
      <EmptyState body={c.noSprintsBody} title={c.noSprintsTitle}>
        <button className={styles.primaryButton} disabled={draftOpen} onClick={onNewSprint} type="button">
          {c.newSprint}
        </button>
      </EmptyState>
    );
  }

  return (
    <div className={styles.sprintFrame}>
      {showLocalFeedback && (
        <SaveFeedback
          canRetry={state.canRetry}
          lang={lang}
          onRetry={() => {
            void actions.retrySave();
          }}
          save={state.save}
          showError
        />
      )}

      <div className={styles.sprintList}>
        {state.sprints.map(sprint => {
          const summary = getSprintSummary(state, sprint.id);
          const points = sprintPoints(state, sprint.id);
          const scope = state.tasks.filter(task => task.sprintId === sprint.id);
          const startBlocked = sprint.state === 'planned' && activeSprint !== null;
          const destination = sprint.closure?.destination ?? null;
          const targetSprint = destination?.kind === 'sprint'
            ? state.sprints.find(item => item.id === destination.sprintId) ?? null
            : null;

          return (
            <article className={styles.sprintCard} data-state={sprint.state} key={sprint.id}>
              <header className={styles.sprintHeader}>
                <div className={styles.sprintHeading}>
                  <span className={styles.sprintState} data-state={sprint.state}>
                    {sprintStateLabel(sprint.state, lang)}
                  </span>
                  <h2 className={styles.sprintName}>{sprint.name}</h2>
                  <p className={styles.sprintDates}>
                    <IconCalendar size={14} />
                    {formatSprintRange(sprint.startsOn, sprint.endsOn, lang)}
                  </p>
                </div>
                <div className={styles.sprintActions}>
                  {sprint.state === 'planned' && (
                    <>
                      <button
                        className={styles.secondaryButton}
                        disabled={pending || draftOpen}
                        onClick={() => onEditSprint(sprint.id)}
                        type="button"
                      >
                        {c.editPlan}
                      </button>
                      <button
                        className={styles.primaryButton}
                        disabled={pending || draftOpen || startBlocked}
                        onClick={() => {
                          void actions.startSprint(sprint.id);
                        }}
                        title={startBlocked ? c.activeSprintExists : undefined}
                        type="button"
                      >
                        {pending && state.save.kind === 'start-sprint' ? <Spinner /> : null}
                        {pending && state.save.kind === 'start-sprint' ? c.startingSprint : c.startSprint}
                      </button>
                    </>
                  )}
                  {sprint.state === 'active' && (
                    <button
                      className={styles.primaryButton}
                      disabled={pending || draftOpen}
                      onClick={() => onCloseSprint(sprint.id)}
                      type="button"
                    >
                      {c.closeSprintAction}
                    </button>
                  )}
                </div>
              </header>

              {startBlocked && <p className={styles.sprintNotice}>{c.activeSprintExists}</p>}

              <p className={styles.sprintGoal}>
                <span className={styles.fieldLabel}>{c.sprintGoal}</span>
                {sprint.goal}
              </p>

              <div className={styles.sprintScopeBlock}>
                <div className={styles.sprintScopeHeader}>
                  <h3 className={styles.sprintScopeTitle}>{c.sprintScope}</h3>
                  <span className={styles.sprintScopeMeta}>
                    {c.taskCount(scope.length)}
                    {scope.length > 0 && ` · ${c.pointsTotal(points.points)}`}
                    {points.unestimated > 0 && ` · ${c.unestimatedCount(points.unestimated)}`}
                  </span>
                </div>

                {sprint.state !== 'closed' && scope.length > 0 && (
                  <ul aria-label={`${c.sprintScope}: ${sprint.name}`} className={styles.sprintTaskList}>
                    {scope.map(task => (
                      <li className={styles.sprintTaskRow} key={task.id}>
                        <StatusDot status={task.status} />
                        <span className={styles.taskKey}>{task.key}</span>
                        <button className={styles.sprintTaskTitle} onClick={() => onOpenTask(task.id)} type="button">
                          {task.title}
                        </button>
                        <span className={styles.sprintTaskStatus}>{statusLabel(task.status, lang)}</span>
                        <span className={styles.points}>
                          {task.points === null ? c.unestimated : c.pointsTotal(task.points)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {sprint.state !== 'closed' && scope.length === 0 && <p className={styles.columnEmpty}>{c.noScope}</p>}

                {sprint.state === 'closed' && sprint.closure !== null && (
                  <div className={styles.closureSummary}>
                    <div className={styles.closureCounts}>
                      <span>
                        <strong>{sprint.closure.doneTaskIds.length}</strong> {c.doneTasks}
                      </span>
                      <span>
                        <strong>{sprint.closure.canceledTaskIds.length}</strong> {c.canceledTasks}
                      </span>
                      <span>
                        <strong>{sprint.closure.unfinishedTaskIds.length}</strong> {c.unfinishedTasks}
                      </span>
                    </div>
                    <p className={styles.closureDestination}>
                      {sprint.closure.destination.kind === 'backlog'
                        ? c.closedDestinationBacklog
                        : copy[lang].closedDestinationSprint(
                            targetSprint?.name ?? sprint.closure.destination.sprintId,
                          )}
                    </p>
                    <p className={styles.fieldHint}>{c.canceledNotDelivered}</p>
                  </div>
                )}

                {sprint.state === 'active' && (
                  <div className={styles.sprintProgressLine} aria-live="polite">
                    <span>
                      {summary.doneTaskIds.length} {c.doneTasks}
                    </span>
                    <span>
                      {summary.canceledTaskIds.length} {c.canceledTasks}
                    </span>
                    <span>
                      {summary.unfinishedTaskIds.length} {c.unfinishedTasks}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.sprintFooterAction}>
        <button className={styles.secondaryButton} disabled={draftOpen} onClick={onNewSprint} type="button">
          <IconPlus size={16} />
          {c.newSprint}
        </button>
      </div>
    </div>
  );
}

interface SprintFormProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
}

export function SprintForm({ state, actions, lang }: SprintFormProps) {
  const c = copy[lang];
  const draft = state.sprintDraft;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const pending = state.save.status === 'pending';
  const saveError = state.save.status === 'error' ? state.save.error : null;

  useEffect(() => {
    if (confirmDiscard) keepEditingRef.current?.focus();
  }, [confirmDiscard]);

  const closeOrConfirm = () => {
    if (pending) return;
    if (confirmDiscard) setConfirmDiscard(false);
    else setConfirmDiscard(true);
  };

  useFocusTrap(dialogRef, draft !== null && draft !== undefined, closeOrConfirm);

  if (draft === undefined || draft === null) return null;

  const existing = state.sprints.some(sprint => sprint.id === draft.sprintId);
  const candidates = state.tasks
    .filter(task => task.sprintId === null || task.sprintId === draft.sprintId)
    .slice()
    .sort((left, right) => left.key.localeCompare(right.key, undefined, { numeric: true }));
  const selected = new Set(draft.taskIds);
  const selectedPoints = candidates
    .filter(task => selected.has(task.id))
    .reduce((total, task) => total + (task.points ?? 0), 0);
  const fieldError = (field: string) =>
    saveError !== null && saveError.field === field ? localizeError(saveError, lang) : null;

  const update = (fields: Partial<SprintFields & { taskIds: readonly string[] }>) => {
    actions.updateSprintDraft(fields);
  };

  return (
    <div className={styles.modalLayer}>
      <div
        aria-hidden="true"
        className={styles.modalBackdrop}
        onClick={() => {
          closeOrConfirm();
        }}
      />
      <div
        aria-labelledby="prototype-sprint-form-heading"
        aria-modal="true"
        className={styles.modal}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>{c.sprints}</p>
            <h2 className={styles.modalTitle} id="prototype-sprint-form-heading">
              {existing ? c.editSprintTitle : c.createSprintTitle}
            </h2>
          </div>
          <button
            aria-label={c.close}
            className={styles.iconButton}
            disabled={pending}
            onClick={() => {
              closeOrConfirm();
            }}
            type="button"
          >
            <IconClose size={20} />
          </button>
        </header>

        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault();
            if (!pending && !confirmDiscard) void actions.saveSprint();
          }}
        >
          <div className={styles.formScroll}>
            <SaveFeedback
              canRetry={state.canRetry}
              lang={lang}
              onRetry={() => {
                void actions.retrySave();
              }}
              save={state.save}
              showError
            />

            <fieldset className={styles.formFields} disabled={pending}>
              <div className={styles.formGrid}>
                <div className={cxField(styles.formField, styles.formFieldWide)}>
                  <label className={styles.fieldLabel} htmlFor="prototype-sprint-name">
                    {c.sprintNameLabel} <span className={styles.requiredMark}>{c.required}</span>
                  </label>
                  <input
                    aria-invalid={fieldError('name') !== null}
                    className={styles.textInput}
                    data-autofocus
                    id="prototype-sprint-name"
                    maxLength={100}
                    onChange={event => update({ name: event.target.value })}
                    placeholder={c.sprintNamePlaceholder}
                    value={draft.name}
                  />
                  {fieldError('name') !== null && <p className={styles.fieldError}>{fieldError('name')}</p>}
                </div>

                <div className={cxField(styles.formField, styles.formFieldWide)}>
                  <label className={styles.fieldLabel} htmlFor="prototype-sprint-goal">
                    {c.sprintGoalLabel} <span className={styles.requiredMark}>{c.required}</span>
                  </label>
                  <textarea
                    aria-invalid={fieldError('goal') !== null}
                    className={styles.textArea}
                    id="prototype-sprint-goal"
                    maxLength={500}
                    onChange={event => update({ goal: event.target.value })}
                    placeholder={c.sprintGoalPlaceholder}
                    rows={3}
                    value={draft.goal}
                  />
                  {fieldError('goal') !== null && <p className={styles.fieldError}>{fieldError('goal')}</p>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="prototype-sprint-start">
                    {c.startDateLabel}
                  </label>
                  <input
                    aria-invalid={fieldError('startsOn') !== null}
                    className={styles.textInput}
                    id="prototype-sprint-start"
                    onChange={event => update({ startsOn: event.target.value })}
                    type="date"
                    value={draft.startsOn}
                  />
                  {fieldError('startsOn') !== null && <p className={styles.fieldError}>{fieldError('startsOn')}</p>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="prototype-sprint-end">
                    {c.endDateLabel}
                  </label>
                  <input
                    aria-invalid={fieldError('endsOn') !== null}
                    className={styles.textInput}
                    id="prototype-sprint-end"
                    onChange={event => update({ endsOn: event.target.value })}
                    type="date"
                    value={draft.endsOn}
                  />
                  <p className={styles.fieldHint}>{c.endDateHint}</p>
                  {fieldError('endsOn') !== null && <p className={styles.fieldError}>{fieldError('endsOn')}</p>}
                </div>

                <fieldset className={cxField(styles.formField, styles.formFieldWide, styles.scopeFieldset)}>
                  <legend className={styles.fieldLabel}>{c.scopeLabel}</legend>
                  <p className={styles.fieldHint}>{c.scopeHint}</p>
                  <div className={styles.scopeSummary}>
                    <span>{c.scopeSelected(draft.taskIds.length)}</span>
                    {draft.taskIds.length > 0 && <span>{c.pointsTotal(selectedPoints)}</span>}
                  </div>
                  <div className={styles.scopeChoices}>
                    {candidates.length === 0 && <p className={styles.fieldHint}>{c.scopeEmpty}</p>}
                    {candidates.map(task => (
                      <label className={styles.scopeChoice} key={task.id}>
                        <input
                          checked={selected.has(task.id)}
                          onChange={event => {
                            const taskIds = event.target.checked
                              ? [...draft.taskIds, task.id]
                              : draft.taskIds.filter(id => id !== task.id);
                            update({ taskIds });
                          }}
                          type="checkbox"
                        />
                        <StatusDot status={task.status} />
                        <span className={styles.taskKey}>{task.key}</span>
                        <span className={styles.scopeTitle}>{task.title}</span>
                        <span className={styles.points}>
                          {task.points === null ? c.unestimated : c.pointsTotal(task.points)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {fieldError('taskIds') !== null && <p className={styles.fieldError}>{fieldError('taskIds')}</p>}
                </fieldset>
              </div>
            </fieldset>

            {confirmDiscard && (
              <div aria-live="assertive" className={styles.confirmDiscard} role="alert">
                <div>
                  <strong>{c.discardDraftTitle}</strong>
                  <p>{c.discardDraftBody}</p>
                </div>
                <div className={styles.confirmActions}>
                  <button className={styles.secondaryButton} onClick={() => actions.discardSprintDraft()} type="button">
                    {c.discard}
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => setConfirmDiscard(false)}
                    ref={keepEditingRef}
                    type="button"
                  >
                    {c.keepEditing}
                  </button>
                </div>
              </div>
            )}
          </div>

          <footer className={styles.modalFooter}>
            <button
              className={styles.secondaryButton}
              disabled={pending}
              onClick={() => {
                if (confirmDiscard) actions.discardSprintDraft();
                else closeOrConfirm();
              }}
              type="button"
            >
              {c.discardSprint}
            </button>
            <button className={styles.primaryButton} disabled={pending || confirmDiscard} type="submit">
              {pending ? c.savingSprint : existing ? c.saveSprint : c.createSprint}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

interface CloseSprintDialogProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  sprintId: string;
  onClose: () => void;
}

export function CloseSprintDialog({ state, actions, lang, sprintId, onClose }: CloseSprintDialogProps) {
  const c = copy[lang];
  const sprint = state.sprints.find(item => item.id === sprintId) ?? null;
  const [destination, setDestination] = useState<string>('backlog');
  const dialogRef = useRef<HTMLDivElement>(null);
  const pending = state.save.status === 'pending';
  const errorField = state.save.status === 'error' ? state.save.error?.field ?? null : null;

  const closeIfAllowed = () => {
    if (!pending) onClose();
  };
  useFocusTrap(dialogRef, sprint !== null, closeIfAllowed);

  if (sprint === null) return null;

  const summary = getSprintSummary(state, sprintId);
  const unfinished = summary.unfinishedTaskIds
    .map(taskId => state.tasks.find(task => task.id === taskId))
    .filter((task): task is DemoTask => task !== undefined);
  const destinationSprint = state.sprints.find(item => item.id === destination) ?? null;
  const otherSprints = state.sprints.filter(item => item.id !== sprintId && item.state === 'planned');
  const submit = () => {
    const target: ClosureDestination = destination === 'backlog'
      ? { kind: 'backlog' }
      : { kind: 'sprint', sprintId: destination };
    void actions.closeSprint(sprintId, target).then(saved => {
      if (saved) onClose();
    });
  };

  return (
    <div className={styles.modalLayer}>
      <div aria-hidden="true" className={styles.modalBackdrop} onClick={closeIfAllowed} />
      <div
        aria-labelledby="prototype-close-sprint-heading"
        aria-modal="true"
        className={styles.modal}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>{sprint.name}</p>
            <h2 className={styles.modalTitle} data-autofocus id="prototype-close-sprint-heading" tabIndex={-1}>
              {c.closeSprintTitle}
            </h2>
          </div>
          <button aria-label={c.close} className={styles.iconButton} disabled={pending} onClick={closeIfAllowed} type="button">
            <IconClose size={20} />
          </button>
        </header>

        <div className={styles.formScroll}>
          <SaveFeedback
            canRetry={state.canRetry}
            lang={lang}
            onRetry={() => {
              void actions.retrySave();
            }}
            save={state.save}
            showError
          />

          <p className={styles.modalIntro}>{c.closeSprintUnfinishedHelp}</p>

          <section aria-labelledby="prototype-close-summary" className={styles.closeSummarySection}>
            <h3 className={styles.detailSectionTitle} id="prototype-close-summary">
              {c.closeSprintSummary}
            </h3>
            <div className={styles.closureCounts}>
              <span>
                <strong>{summary.doneTaskIds.length}</strong> {c.doneTasks}
              </span>
              <span>
                <strong>{summary.canceledTaskIds.length}</strong> {c.canceledTasks}
              </span>
              <span>
                <strong>{summary.unfinishedTaskIds.length}</strong> {c.unfinishedTasks}
              </span>
            </div>
            <p className={styles.fieldHint}>{c.canceledNotDelivered}</p>
          </section>

          {unfinished.length > 0 && (
            <section aria-labelledby="prototype-close-unfinished" className={styles.closeSummarySection}>
              <h3 className={styles.detailSectionTitle} id="prototype-close-unfinished">
                {c.unfinishedTasks}
              </h3>
              <ul className={styles.unfinishedList}>
                {unfinished.map(task => (
                  <li key={task.id}>
                    <StatusDot status={task.status} />
                    <span className={styles.taskKey}>{task.key}</span>
                    {task.title}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <fieldset className={styles.destinationFieldset} disabled={pending || state.canRetry}>
            <legend className={styles.fieldLabel}>{c.destinationLabel}</legend>
            <label className={styles.destinationChoice}>
              <input
                checked={destination === 'backlog'}
                name="prototype-close-destination"
                onChange={() => setDestination('backlog')}
                type="radio"
              />
              {c.destinationBacklog}
            </label>
            {otherSprints.map(other => (
              <label className={styles.destinationChoice} key={other.id}>
                <input
                  checked={destination === other.id}
                  name="prototype-close-destination"
                  onChange={() => setDestination(other.id)}
                  type="radio"
                />
                <span>
                  {c.destinationSprint}
                  <span className={styles.destinationName}>
                    {other.name} · {formatSprintRange(other.startsOn, other.endsOn, lang)}
                  </span>
                </span>
              </label>
            ))}
            {otherSprints.length === 0 && <p className={styles.fieldHint}>{c.noOtherSprint}</p>}
            {state.canRetry && <p className={styles.fieldHint}>{c.retryFrozenDestination}</p>}
            {errorField === 'destination' && state.save.status === 'error' && state.save.error !== null && (
              <p className={styles.fieldError}>{localizeError(state.save.error, lang)}</p>
            )}
          </fieldset>

          {destinationSprint !== null && (
            <p className={styles.fieldHint}>
              {destinationSprint.name} · {c.taskCount(
                state.tasks.filter(task => task.sprintId === destinationSprint.id).length,
              )}
            </p>
          )}
        </div>

        <footer className={styles.modalFooter}>
          <button className={styles.secondaryButton} disabled={pending} onClick={closeIfAllowed} type="button">
            {c.cancel}
          </button>
          <button className={styles.primaryButton} disabled={pending} onClick={submit} type="button">
            {pending ? <Spinner /> : null}
            {pending ? c.closingSprint : c.closeSprintAction}
          </button>
        </footer>
      </div>
    </div>
  );
}

function cxField(...values: string[]): string {
  return cx(...values);
}
