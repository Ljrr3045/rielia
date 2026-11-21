'use client';
import type { ReactNode } from 'react';
import type { useProjectSprintIntegration } from '../../../lib/use-project-sprint-integration';
import type { SprintFormError } from '../../../lib/sprint-form-state';
import { sprintEstimateOptions } from '../../../lib/sprint-form-state';
import type { SprintResourceName, SprintResource } from '../../../lib/sprint-client-state';
import { ModalFrame, Badge, useLocale } from '../project-ui';
import { copy, statusName } from '../strings';
import { provenanceLabel } from '../task-collaboration-shared';
import {
  SprintWorkspace,
  SprintScope,
  SprintNotice,
  type SprintTaskLabel,
} from './sprint-workspace';
import { SprintFieldsForm, SprintSettingsForm } from './sprint-forms';
import { SprintStartDialog } from './sprint-start-review';
import { SprintCloseReview, SprintClosedResults } from './sprint-close-review';
import { SprintHistory } from './sprint-history';
import { SprintTaskPlanning } from './sprint-task-planning';
import { SprintConflictComparison } from './sprint-conflict-review';
import { SprintNavigationDialog } from './sprint-navigation-review';
import { sprintCopy as c, sprintReviewCopy as r } from './sprint-copy';
import ui from '../projects.module.css';
import styles from './sprints.module.css';

type Integration = ReturnType<typeof useProjectSprintIntegration>;
const text = {
  tasks: { es: 'Tareas', en: 'Tasks' },
  verify: { es: 'Verificar sesión', en: 'Verify session' },
  retry: { es: 'Reintentar la misma operación', en: 'Retry the same operation' },
  discard: { es: 'Descartar lo local', en: 'Discard local work' },
  stopWaiting: {
    es: 'Dejar de esperar y recuperar el resultado',
    en: 'Stop waiting and recover the outcome',
  },
  review: { es: 'Revisar de nuevo antes de guardar', en: 'Review again before saving' },
  navigation: { es: 'Otra vista de trabajo', en: 'Another work view' },
  consequences: { es: 'Consecuencias del cierre', en: 'Closure consequences' },
} as const;
const errorText: Record<SprintFormError, { es: string; en: string }> = {
  required: { es: 'Completa este campo.', en: 'Complete this field.' },
  invalid: { es: 'Revisa el valor de este campo.', en: 'Review this field value.' },
  'too-long': { es: 'Acorta este texto.', en: 'Shorten this text.' },
  'end-after-start': {
    es: 'El fin exclusivo debe ser posterior al inicio.',
    en: 'The exclusive end must follow the start.',
  },
};
const resourceName = {
  planning: c.settings,
  sprints: c.title,
  sprint: c.choose,
  target: c.destination,
  task: c.taskPlanning,
  scope: c.scope,
  sprintHistory: r.sprintHistory,
  taskHistory: r.taskHistory,
  preview: c.previewTitle,
  closure: c.frozen,
  outcomes: c.frozen,
};
function Action({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={ui.secondary} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
function ResourceNotice({
  integration: i,
  name,
}: {
  integration: Integration;
  name: SprintResourceName;
}) {
  const lang = useLocale();
  const resource: SprintResource<unknown> | undefined = i.model.resources?.[name];
  if (name === 'preview' && resource?.status === 'idle' && !resource.data) return null;
  if (!resource || (resource.status === 'ready' && !resource.stale)) return null;
  const kind =
    resource.status === 'error'
      ? 'error'
      : resource.status === 'changed' || resource.stale
        ? 'stale'
        : 'loading';
  return (
    <SprintNotice
      kind={kind}
      actions={
        <Action
          disabled={i.sprints.mutation.status === 'pending'}
          onClick={() => {
            void i.sprints.reload(name);
          }}
        >
          {r.reload[lang]}
        </Action>
      }
    >
      <strong>{resourceName[name][lang]}</strong>
      {resource.failure?.code && <p>{resource.failure.code}</p>}
      {resource.failure?.requestId && <p>{resource.failure.requestId}</p>}
    </SprintNotice>
  );
}
function destinationLabel(i: Integration, destination: string | null, lang: 'es' | 'en') {
  if (destination === 'backlog') return c.backlog[lang];
  if (destination === null) return c.noSelection[lang];
  return (
    i.model.resources?.sprints.data?.items.find((sprint) => sprint.id === destination)?.name ??
    destination
  );
}
function navigationLabel(i: Integration, href: string, lang: 'es' | 'en') {
  const url = new URL(href, 'https://location.invalid');
  if (url.origin !== 'https://location.invalid') return url.href;
  if (url.pathname === '/workspaces') return copy.common.workspaces[lang];
  if (url.pathname !== '/projects') return url.pathname;
  const workspaceId = url.searchParams.get('workspace');
  const projectId = url.searchParams.get('project');
  const sprintId = url.searchParams.get('sprint');
  const taskId = url.searchParams.get('task');
  const names = [
    i.parent.workspaces?.items.find((item) => item.id === workspaceId)?.name ?? workspaceId,
    i.parent.projects?.items.find((item) => item.id === projectId)?.name ?? projectId,
  ];
  if (url.searchParams.get('projectView') === 'sprints')
    names.push(
      c.title[lang],
      projectId === i.parent.selection.projectId ? destinationLabel(i, sprintId, lang) : sprintId,
    );
  if (taskId)
    names.push(
      projectId === i.parent.selection.projectId ? (taskLabels(i)[taskId]?.key ?? taskId) : taskId,
    );
  return names.filter(Boolean).join(' · ') || text.navigation[lang];
}
function destinations(i: Integration, closing: boolean) {
  const values = [...(i.model.resources?.sprints.data?.items ?? [])];
  const current = i.model.task?.currentParticipation?.sprint;
  if (!closing && current && !values.some((item) => item.id === current.id)) values.push(current);
  return values
    .filter((item) =>
      closing
        ? item.state === 'planned' &&
          item.id !== i.model.sprint?.id &&
          item.capabilities.canChangeScope
        : item.capabilities.canChangeScope || item.id === current?.id,
    )
    .map((item) => ({
      value: item.id,
      label: item.name,
      disabled: item.capabilities.canChangeScope !== true,
    }));
}
function taskLabels(i: Integration): Record<string, SprintTaskLabel> {
  const result: Record<string, SprintTaskLabel> = {};
  for (const task of [
    ...(i.parent.tasks?.items ?? []),
    ...Object.values(i.parent.taskColumns).flatMap((page) => page?.items ?? []),
    ...(i.parent.task ? [i.parent.task] : []),
  ])
    if (
      task.workspaceId === i.parent.selection.workspaceId &&
      task.projectId === i.parent.selection.projectId
    )
      result[task.id] = { key: task.key, title: task.title };
  return result;
}
function DestinationPaging({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  const resource = i.model.resources?.sprints;
  return (
    <>
      <ResourceNotice integration={i} name="sprints" />
      {resource?.data?.nextCursor && (
        <Action
          disabled={resource.stale || resource.loadingMore || resource.status !== 'ready'}
          onClick={() => {
            void i.sprints.loadMore('sprints');
          }}
        >
          {c.loadMore[lang]}
        </Action>
      )}
    </>
  );
}
export function SprintIntegrationStatus({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  if (i.model.visible || !i.parent.selection.projectId) return null;
  const status = i.sprints.status;
  return (
    <SprintNotice
      kind={
        status === 'signed-out' || status === 'forbidden' || status === 'verifying'
          ? status
          : 'loading'
      }
      actions={
        status === 'signed-out' || status === 'forbidden' ? (
          <Action
            onClick={() => {
              void i.parent.refresh();
            }}
          >
            {status === 'signed-out' ? text.verify[lang] : r.reload[lang]}
          </Action>
        ) : undefined
      }
    />
  );
}
export function SprintIntegrationFeedback({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  if (!i.model.visible) return null;
  const mutation = i.sprints.mutation;
  const busy = mutation.status === 'pending';
  const conflict = i.model.conflictReview;
  return (
    <>
      {mutation.status !== 'idle' && (
        <SprintNotice
          kind={mutation.status}
          actions={
            <>
              {mutation.status === 'unknown' && i.retryAllowed && (
                <Action
                  onClick={() => {
                    void i.sprints.retrySave();
                  }}
                >
                  {text.retry[lang]}
                </Action>
              )}
              {busy && <Action onClick={i.sprints.cancelPending}>{text.stopWaiting[lang]}</Action>}
              {mutation.status === 'confirmed' && (
                <Action onClick={i.sprints.dismissResult}>{copy.common.close[lang]}</Action>
              )}
              {!busy && i.sprints.draft && (
                <Action onClick={() => i.discard()}>{text.discard[lang]}</Action>
              )}
            </>
          }
        >
          {mutation.failure?.code && <p>{mutation.failure.code}</p>}
          {mutation.failure?.requestId && <p>{mutation.failure.requestId}</p>}
        </SprintNotice>
      )}
      {i.sprints.needsReview && !conflict && (
        <SprintNotice
          kind={i.sprints.draft?.type === 'close-sprint' ? 'close-stale' : 'stale'}
          actions={
            <>
              <Action
                onClick={() => {
                  void i.sprints.refresh();
                }}
              >
                {r.reload[lang]}
              </Action>
              {i.sprints.draft?.type !== 'close-sprint' && (
                <Action disabled={busy || i.model.parentBlocked} onClick={i.rebase}>
                  {text.review[lang]}
                </Action>
              )}
              <Action disabled={busy} onClick={() => i.discard()}>
                {text.discard[lang]}
              </Action>
            </>
          }
        />
      )}
      {conflict && (
        <SprintConflictComparison
          review={conflict}
          destinationLabel={destinationLabel(
            i,
            conflict.draft.type === 'close-sprint'
              ? conflict.draft.input.destination
              : conflict.draft.type === 'set-task-sprint'
                ? conflict.draft.input.targetSprintId
                : null,
            lang,
          )}
          onReload={
            busy
              ? null
              : () => {
                  void i.sprints.refresh();
                }
          }
          onRebase={conflict.canRebase ? i.rebase : null}
          onDiscard={busy ? null : () => i.discard()}
        />
      )}
      {i.reason && !['ready', 'busy'].includes(i.reason) && (
        <p role="status">{i.reason === 'invalid' ? errorText.invalid[lang] : text.review[lang]}</p>
      )}
    </>
  );
}
export function SprintProjectNavigation({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  if (!i.model.visible) return null;
  return (
    <nav aria-label={c.title[lang]} className={styles.actions}>
      {(['tasks', 'sprints'] as const).map((view) => (
        <a
          key={view}
          href={i.viewLink(view)}
          className={ui.secondary}
          aria-current={i.parent.sprintLocation.view === view ? 'page' : undefined}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            void i.selectView(view);
          }}
        >
          {view === 'tasks' ? text.tasks[lang] : c.title[lang]}
        </a>
      ))}
    </nav>
  );
}
export function SprintIntegrationWorkspace({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  const resources = i.model.resources;
  if (!resources) return null;
  const labels = taskLabels(i);
  const sprint = i.model.sprint;
  return (
    <SprintWorkspace
      focusScope={i.focusScope}
      sprints={resources.sprints.data}
      sprint={sprint}
      selectedId={i.parent.sprintLocation.sprintId ?? ''}
      disabled={
        i.sprints.mutation.status === 'pending' ||
        resources.sprints.stale ||
        resources.sprints.status === 'changed'
      }
      loadingMore={resources.sprints.loadingMore}
      onSelect={(id) => {
        void i.selectSprint(id);
      }}
      onLoadMore={() => {
        void i.sprints.loadMore('sprints');
      }}
      onCreate={i.model.actions.create ? () => i.begin('create-sprint') : null}
      onSettings={i.model.actions.configure ? () => i.begin('configure-planning') : null}
      onEdit={i.model.actions.edit ? () => i.begin('edit-sprint') : null}
      onStart={i.model.actions.start ? i.beginStart : null}
      onClose={i.model.actions.close ? i.beginClose : null}
      notices={
        <>
          <ResourceNotice integration={i} name="planning" />
          <ResourceNotice integration={i} name="sprints" />
          {i.parent.sprintLocation.sprintId && <ResourceNotice integration={i} name="sprint" />}
          {i.feedbackTarget === 'sprint' && <SprintIntegrationFeedback integration={i} />}
          {i.model.planning && (
            <>
              <dl className={styles.metadata}>
                <div>
                  <dt>{c.mode[lang]}</dt>
                  <dd>{i.model.planning.mode === 'scrum' ? 'Scrum' : 'Kanban'}</dd>
                </div>
                <div>
                  <dt>{c.projectZone[lang]}</dt>
                  <dd>{i.model.planning.timeZone}</dd>
                </div>
                <div>
                  <dt>{c.scale[lang]}</dt>
                  <dd>{i.model.planning.pointScale.join(', ')}</dd>
                </div>
              </dl>
              {i.model.planning.mode === 'kanban' && <SprintNotice kind="kanban" />}
              {i.model.planning.archivedAt && <SprintNotice kind="archived" />}
            </>
          )}
        </>
      }
    >
      {sprint && (
        <p>
          {copy.task.creatorLabel[lang]}: {sprint.creator.name}{' '}
          {sprint.creator.kind === 'agent' && <Badge>{copy.task.agentBadge[lang]}</Badge>} ·{' '}
          {provenanceLabel(sprint.provenance, lang)}
        </p>
      )}
      {sprint?.state !== 'closed' ? (
        <>
          <ResourceNotice integration={i} name="scope" />
          {resources.scope.data && (
            <SprintScope
              page={resources.scope.data}
              labels={labels}
              disabled={i.sprints.mutation.status === 'pending'}
              loadingMore={resources.scope.loadingMore}
              onTask={(id) => {
                void i.parent.selectTask(id);
              }}
              onLoadMore={() => {
                void i.sprints.loadMore('scope');
              }}
            />
          )}
        </>
      ) : (
        <>
          <ResourceNotice integration={i} name="closure" />
          <ResourceNotice integration={i} name="outcomes" />
          {resources.closure.data && (
            <SprintClosedResults
              closure={resources.closure.data}
              outcomes={resources.outcomes.data}
              labels={labels}
              destinationLabel={destinationLabel(i, resources.closure.data.destination, lang)}
              loadingMore={resources.outcomes.loadingMore}
              disabled={resources.outcomes.stale || resources.outcomes.status !== 'ready'}
              onLoadMore={() => {
                void i.sprints.loadMore('outcomes');
              }}
            />
          )}
        </>
      )}
      <SprintHistory
        scope="sprint"
        labels={labels}
        port={{
          resource: resources.sprintHistory,
          onReload: () => {
            void i.sprints.reload('sprintHistory');
          },
          onLoadMore:
            resources.sprintHistory.data?.nextCursor &&
            !resources.sprintHistory.stale &&
            resources.sprintHistory.status === 'ready'
              ? () => {
                  void i.sprints.loadMore('sprintHistory');
                }
              : null,
        }}
      />
    </SprintWorkspace>
  );
}
export function SprintIntegrationTask({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  const task = i.model.task;
  const resources = i.model.resources;
  if (!resources) return null;
  if (!task)
    return (
      <>
        <ResourceNotice integration={i} name="task" />
        {i.feedbackTarget === 'task' && <SprintIntegrationFeedback integration={i} />}
      </>
    );
  const form = i.editing?.form;
  const disabled =
    i.sprints.mutation.status === 'pending' ||
    i.sprints.recovery !== null ||
    i.sprints.needsReview ||
    i.model.parentBlocked;
  const pending = i.sprints.mutation.status === 'pending';
  return (
    <div data-sprint-task-planning>
      <SprintTaskPlanning
        focusScope={i.focusScope}
        planning={task}
        history={{
          resource: resources.taskHistory,
          onReload: () => {
            void i.sprints.reload('taskHistory');
          },
          onLoadMore:
            resources.taskHistory.data?.nextCursor &&
            !resources.taskHistory.stale &&
            resources.taskHistory.status === 'ready'
              ? () => {
                  void i.sprints.loadMore('taskHistory');
                }
              : null,
        }}
        onEditEstimate={i.model.actions.estimate ? () => i.begin('estimate-task') : null}
        onEditParticipation={
          i.model.actions.participation ? () => i.begin('set-task-sprint') : null
        }
        feedback={
          <>
            <ResourceNotice integration={i} name="task" />
            {i.feedbackTarget === 'task' && <SprintIntegrationFeedback integration={i} />}
          </>
        }
        estimateForm={
          form?.type === 'estimate-task'
            ? {
                value: form.fields.estimate,
                disabled,
                pending,
                points: sprintEstimateOptions(
                  i.model.planning?.pointScale ?? [],
                  task.snapshot.estimatePoints,
                ),
                error: i.errors.estimate ? errorText[i.errors.estimate][lang] : null,
                onChange: (value) => i.changeField('estimate', value),
                onSubmit: (event) => {
                  event.preventDefault();
                  void i.submitForm();
                },
                onCancel: () => i.discard(),
              }
            : null
        }
        participationForm={
          form?.type === 'set-task-sprint'
            ? {
                value: form.fields.destination,
                disabled: disabled || resources.target.status === 'loading',
                pending,
                destinations: destinations(i, false),
                error: i.errors.destination ? errorText[i.errors.destination][lang] : null,
                onChange: (value) => i.changeField('destination', value),
                onSubmit: (event) => {
                  event.preventDefault();
                  void i.submitForm();
                },
                onCancel: () => i.discard(),
                destinationPaging: (
                  <>
                    <DestinationPaging integration={i} />
                    {form.fields.destination && <ResourceNotice integration={i} name="target" />}
                  </>
                ),
              }
            : null
        }
      />
    </div>
  );
}
export function SprintIntegrationDialogs({ integration: i }: { integration: Integration }) {
  const lang = useLocale();
  if (!i.model.visible) return null;
  const navigation = i.parent.integratedNavigation;
  if (navigation)
    return (
      <SprintNavigationDialog
        destinationLabel={navigationLabel(i, navigation.url, lang)}
        review={{
          destinationURL: navigation.url,
          taskGuard: i.parent.draftGuard.kind,
          sprintGuard:
            i.sprints.getNavigationGuard() === 'none' && i.editing
              ? 'draft'
              : i.sprints.getNavigationGuard(),
          onStay: () => {
            void i.parent.resolveIntegratedNavigation('stay');
          },
          onDiscard:
            i.parent.mutationPending || i.sprints.mutation.status === 'pending'
              ? null
              : () => {
                  void i.parent.resolveIntegratedNavigation('discard');
                },
        }}
      />
    );
  const editing = i.editing;
  if (!editing) return null;
  const pending = i.sprints.mutation.status === 'pending';
  const disabled =
    pending || i.sprints.recovery !== null || i.sprints.needsReview || i.model.parentBlocked;
  if (editing.start)
    return (
      <SprintStartDialog
        review={editing.start}
        pending={pending}
        confirmDisabled={disabled}
        feedback={<SprintIntegrationFeedback integration={i} />}
        onConfirm={() => {
          void i.confirmStart();
        }}
        onCancel={() => i.discard()}
      />
    );
  if (editing.close)
    return (
      <ModalFrame title={c.closeTitle} busy={pending} onClose={() => i.discard()}>
        <SprintCloseReview
          destination={editing.close.destination}
          destinations={destinations(i, true)}
          preview={i.model.closeReview?.preview ?? null}
          reviewedDestination={destinationLabel(
            i,
            i.model.closeReview?.reviewedDestination ?? null,
            lang,
          )}
          disabled={
            pending || i.sprints.recovery !== null || !!i.sprints.draft || i.model.parentBlocked
          }
          confirmDisabled={!i.model.closeReview?.canConfirm || disabled}
          pending={pending}
          onDestination={i.changeCloseDestination}
          onPreview={() => {
            void i.previewClose();
          }}
          onConfirm={() => {
            void i.confirmClose();
          }}
          onCancel={() => i.discard()}
          notice={
            <>
              <SprintIntegrationFeedback integration={i} />
              <ResourceNotice integration={i} name="preview" />
            </>
          }
        >
          <DestinationPaging integration={i} />
          {i.model.closeReview && (
            <section aria-label={text.consequences[lang]}>
              <ul className={styles.rows}>
                {i.model.closeReview.preview.items.map((row) => (
                  <li key={row.participationId} className={styles.row}>
                    <span>{taskLabels(i)[row.taskId]?.key ?? row.taskId}</span>
                    <span>
                      {statusName(row.snapshot.status)[lang]} ·{' '}
                      {row.disposition === 'backlog' ? c.toBacklog[lang] : c[row.disposition][lang]}
                    </span>
                  </li>
                ))}
              </ul>
              {i.model.closeReview.preview.nextCursor && (
                <Action
                  disabled={
                    i.sprints.resources.preview.stale || i.sprints.resources.preview.loadingMore
                  }
                  onClick={() => {
                    void i.sprints.loadMore('preview');
                  }}
                >
                  {c.loadMore[lang]}
                </Action>
              )}
            </section>
          )}
        </SprintCloseReview>
      </ModalFrame>
    );
  const form = editing.form;
  if (!form || form.type === 'estimate-task' || form.type === 'set-task-sprint') return null;
  const errors = Object.fromEntries(
    Object.entries(i.errors).map(([key, value]) => [key, errorText[value][lang]]),
  );
  return (
    <ModalFrame
      title={
        form.type === 'configure-planning'
          ? c.settings
          : form.type === 'create-sprint'
            ? c.create
            : c.edit
      }
      busy={pending}
      onClose={() => i.discard()}
      formModal
    >
      {form.type === 'configure-planning' ? (
        <SprintSettingsForm
          value={form.fields}
          errors={errors}
          disabled={disabled}
          pending={pending}
          feedback={<SprintIntegrationFeedback integration={i} />}
          onChange={i.changeField}
          onSubmit={(event) => {
            event.preventDefault();
            void i.submitForm();
          }}
          onCancel={() => i.discard()}
        />
      ) : (
        <SprintFieldsForm
          value={form.fields}
          timeZone={form.timeZone}
          errors={errors}
          creating={form.type === 'create-sprint'}
          disabled={disabled}
          pending={pending}
          feedback={<SprintIntegrationFeedback integration={i} />}
          onChange={i.changeField}
          onSubmit={(event) => {
            event.preventDefault();
            void i.submitForm();
          }}
          onCancel={() => i.discard()}
        />
      )}
    </ModalFrame>
  );
}
