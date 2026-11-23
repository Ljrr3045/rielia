'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { SprintFields } from '@rielia/contracts';
import type { useProjectTasks } from './use-project-tasks';
import { useProjectSprints } from './use-project-sprints';
import {
  sprintScreenModel,
  type SprintStartReview,
  type SprintNavigationReviewPort,
} from './sprint-screen-model';
import {
  beginSprintForm,
  sprintFormIdentity,
  submitSprintForm,
  type SprintForm,
  type SprintFormKind,
  type SprintFormErrors,
} from './sprint-form-state';
import type { SprintIntentResult } from './sprint-commands';
import { writeProjectSprintLocation } from './project-sprint-location';

export type ProjectSprintOwner = ReturnType<typeof useProjectTasks>;
type Editing = {
  paused?: boolean;
  identity: string;
  form: SprintForm | null;
  start: SprintStartReview | null;
  close: { destination: string } | null;
};
type FocusAction = SprintFormKind | 'start-sprint' | 'close-sprint';
type FocusReturn = { action: FocusAction; identity: string; url: string };
function focusAvailable(element: HTMLElement) {
  if (!element.isConnected || element.matches(':disabled')) return false;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (
      node.hidden ||
      node.hasAttribute('inert') ||
      node.getAttribute('aria-hidden') === 'true' ||
      node.getAttribute('aria-disabled') === 'true'
    )
      return false;
    const style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    )
      return false;
  }
  return true;
}
function focusReadsPending(action: FocusAction, state: ReturnType<typeof useProjectSprints>) {
  const resources =
    action === 'configure-planning' || action === 'create-sprint'
      ? [state.resources.planning]
      : action === 'estimate-task' || action === 'set-task-sprint'
        ? [state.resources.task]
        : action === 'start-sprint'
          ? [state.resources.planning, state.resources.sprint, state.resources.scope]
          : [state.resources.sprint];
  return resources.some((resource) => resource.status === 'idle' || resource.status === 'loading');
}

/** One sprint lifecycle beside the existing task/session/event owner. No presentation imports. */
export function useProjectSprintIntegration(parent: ProjectSprintOwner) {
  const sprints = useProjectSprints(parent, {
    sprintId: parent.sprintLocation.sprintId,
    taskId: parent.selection.taskId,
  });
  const model = sprintScreenModel(sprints, parent);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<SprintFormErrors>({});
  const [reason, setReason] = useState<SprintIntentResult | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<'task' | 'sprint'>('sprint');
  const editingRef = useRef(editing);
  const latest = useRef({ parent, sprints, model });
  latest.current = { parent, sprints, model };
  const focusScope = useId();
  const opener = useRef<FocusReturn | null>(null);
  const restoreWanted = useRef(false);
  const identity = sprintFormIdentity(sprints);
  const visibleEditing =
    model.visible && editing?.identity === identity && !editing.paused ? editing : null;
  function updateEditing(value: Editing | null) {
    editingRef.current = value;
    setEditing(value);
  }
  function rememberOpener(action: FocusAction, identity: string) {
    restoreWanted.current = false;
    opener.current = { action, identity, url: parent.url };
  }
  function discard(restore = true) {
    if (!latest.current.sprints.discardDraft()) return false;
    updateEditing(null);
    setErrors({});
    setReason(null);
    restoreWanted.current = restore;
    if (!restore) opener.current = null;
    return true;
  }
  useEffect(
    () =>
      parent.registerNavigationBlocker({
        getGuard() {
          const guard = latest.current.sprints.getNavigationGuard();
          return guard !== 'none' ? guard : editingRef.current ? 'draft' : 'none';
        },
        discard: () => discard(false),
      }),
    [parent.registerNavigationBlocker],
  );
  useEffect(() => {
    void parent.resumeNavigation();
  }, [parent.resumeNavigation, sprints.draft, sprints.recovery, sprints.mutation.status, editing]);
  useEffect(() => {
    // Temporary verification is memory-only; a cleared/replaced owner cannot retain raw private fields.
    if (sprints.status === 'verifying') return;
    if (
      editingRef.current &&
      (sprints.status !== 'ready' || editingRef.current.identity !== identity)
    ) {
      updateEditing(null);
      setErrors({});
      setReason(null);
      opener.current = null;
      restoreWanted.current = false;
    }
  }, [identity, sprints.status]);
  useEffect(() => {
    if (sprints.status === 'verifying') return;
    if (
      opener.current &&
      (opener.current.identity !== identity || opener.current.url !== parent.url)
    ) {
      opener.current = null;
      restoreWanted.current = false;
    }
  }, [identity, parent.url, sprints.status]);
  useEffect(() => {
    if (sprints.mutation.status === 'confirmed') {
      updateEditing(null);
      setErrors({});
      setReason(null);
      restoreWanted.current = true;
    }
  }, [sprints.mutation]);
  useEffect(() => {
    const held = editingRef.current;
    if (!model.visible || !held || held.paused || sprints.mutation.status === 'confirmed') return;
    const resource =
      held.form?.type === 'configure-planning' || held.form?.type === 'create-sprint'
        ? sprints.resources.planning
        : held.form?.type === 'estimate-task' || held.form?.type === 'set-task-sprint'
          ? sprints.resources.task
          : sprints.resources.sprint;
    if (resource.status !== 'ready' || resource.stale || !resource.data) return;
    const capability =
      held.form?.type === 'configure-planning'
        ? 'canConfigurePlanning'
        : held.form?.type === 'create-sprint'
          ? 'canCreateSprint'
          : held.form?.type === 'estimate-task'
            ? 'canEstimate'
            : held.form?.type === 'set-task-sprint'
              ? 'canChangeScope'
              : held.start
                ? 'canStart'
                : held.close
                  ? 'canClose'
                  : 'canEdit';
    if ((resource.data.capabilities as unknown as Record<string, boolean>)[capability] !== true) {
      updateEditing({ ...held, paused: true });
      setReason('forbidden');
    }
  }, [model.visible, sprints.resources, sprints.mutation.status]);
  useEffect(() => {
    const target = opener.current;
    if (
      !restoreWanted.current ||
      !target ||
      editing ||
      !model.visible ||
      parent.integratedNavigation ||
      focusReadsPending(target.action, sprints)
    )
      return;
    const frame = requestAnimationFrame(() => {
      const current = latest.current;
      if (
        opener.current !== target ||
        editingRef.current ||
        !current.model.visible ||
        current.parent.integratedNavigation ||
        current.parent.url !== target.url ||
        sprintFormIdentity(current.sprints) !== target.identity ||
        focusReadsPending(target.action, current.sprints)
      )
        return;
      restoreWanted.current = false;
      opener.current = null;
      const scopes = [
        ...document.querySelectorAll<HTMLElement>('[data-sprint-focus-scope]'),
      ].filter((node) => node.dataset['sprintFocusScope'] === focusScope);
      const action = scopes
        .flatMap((node) => [
          ...node.querySelectorAll<HTMLButtonElement>('button[data-sprint-action]'),
        ])
        .find((node) => node.dataset['sprintAction'] === target.action && focusAvailable(node));
      const heading =
        target.action === 'configure-planning' || target.action === 'create-sprint'
          ? 'planning'
          : target.action === 'estimate-task' || target.action === 'set-task-sprint'
            ? 'task'
            : 'sprint';
      const fallback = scopes
        .flatMap((node) => [...node.querySelectorAll<HTMLElement>('[data-sprint-focus-heading]')])
        .find((node) => node.dataset['sprintFocusHeading'] === heading && focusAvailable(node));
      (action ?? fallback)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [
    editing,
    model.visible,
    parent.integratedNavigation,
    parent.url,
    identity,
    sprints.resources,
    focusScope,
  ]);
  useEffect(() => {
    if (
      visibleEditing?.form?.type !== 'estimate-task' &&
      visibleEditing?.form?.type !== 'set-task-sprint'
    )
      return;
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('[data-sprint-task-planning] form [data-autofocus]')
        ?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [visibleEditing?.form?.type]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        sprints.mutation.status === 'pending' ||
        !(event.target instanceof window.Element) ||
        !event.target.closest('[data-sprint-task-planning] form')
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      discard();
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [sprints.mutation.status]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        !parent.navigationProtected()
      )
        return;
      const anchor =
        event.target instanceof window.Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;
      if (!anchor || anchor.download || (anchor.target && anchor.target !== '_self')) return;
      const url = new URL(anchor.href, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      event.preventDefault();
      event.stopPropagation();
      const destination =
        url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.href;
      void parent.navigateAway(destination, () => {
        if (url.origin === window.location.origin && url.pathname === '/projects') {
          window.history.pushState(window.history.state, '', url.href);
          window.dispatchEvent(new window.PopStateEvent('popstate'));
        } else window.location.assign(url.href);
      });
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [parent.navigationProtected, parent.navigateAway]);

  function begin(type: SprintFormKind) {
    const action = {
      'configure-planning': 'configure',
      'create-sprint': 'create',
      'edit-sprint': 'edit',
      'estimate-task': 'estimate',
      'set-task-sprint': 'participation',
    } as const;
    if (!model.actions[action[type]]) return;
    const opened = beginSprintForm(sprints, sprints, type);
    setReason(opened.reason);
    if (!opened.form) return;
    setFeedbackTarget(type === 'estimate-task' || type === 'set-task-sprint' ? 'task' : 'sprint');
    rememberOpener(type, opened.form.identity);
    setErrors({});
    updateEditing({ identity: opened.form.identity, form: opened.form, start: null, close: null });
    if (type === 'set-task-sprint')
      void sprints.selectTarget(
        opened.form.type === type ? opened.form.fields.destination || null : null,
      );
  }
  function changeField(
    field: keyof SprintFields | 'mode' | 'timeZone' | 'pointScale' | 'estimate' | 'destination',
    value: string,
  ) {
    const current = editingRef.current;
    if (
      !current?.form ||
      !model.visible ||
      sprints.mutation.status === 'pending' ||
      sprints.recovery
    )
      return;
    const form = {
      ...current.form,
      fields: { ...current.form.fields, [field]: value },
    } as SprintForm;
    updateEditing({ ...current, form });
    setErrors({});
    setReason(null);
    if (form.type === 'set-task-sprint' && field === 'destination') {
      void sprints.selectTarget(value || null);
    }
  }
  async function submitForm() {
    if (!visibleEditing?.form || !model.visible || model.parentBlocked) return;
    const result = await submitSprintForm(sprints, sprints, visibleEditing.form);
    setReason(result.reason);
    setErrors(result.errors);
    if (Object.keys(result.errors).length)
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
  }
  function beginStart() {
    if (!model.actions.start || !model.startReview || !identity) return;
    if (sprints.stage({ type: 'start-sprint' }) !== 'ready') return;
    setFeedbackTarget('sprint');
    rememberOpener('start-sprint', identity);
    setReason(null);
    updateEditing({ identity, form: null, start: model.startReview, close: null });
  }
  function beginClose() {
    if (!model.actions.close || !identity) return;
    setFeedbackTarget('sprint');
    rememberOpener('close-sprint', identity);
    setReason(null);
    updateEditing({ identity, form: null, start: null, close: { destination: '' } });
  }
  async function confirmStart() {
    if (!visibleEditing?.start || !model.visible || model.parentBlocked) return;
    setReason(await sprints.submit());
  }
  async function confirmClose() {
    if (!visibleEditing?.close || !model.closeReview?.canConfirm || model.parentBlocked) return;
    const staged = sprints.stage({ type: 'close-sprint' });
    setReason(staged === 'ready' ? await sprints.submit() : staged);
  }
  function rebase() {
    if (!model.visible || model.parentBlocked) return;
    const result = sprints.rebaseDraft();
    setReason(result);
    if (result === 'ready' && editingRef.current)
      updateEditing({
        ...editingRef.current,
        paused: false,
        ...(editingRef.current.start && model.startReview ? { start: model.startReview } : {}),
      });
  }
  const hidden = parent.status === 'ready' && parent.selection.projectId !== null && !model.visible;
  const renderParent: ProjectSprintOwner = hidden
    ? {
        ...parent,
        status:
          sprints.status === 'signed-out' || sprints.status === 'forbidden'
            ? sprints.status
            : 'loading',
        workspaces: null,
        workspace: null,
        members: null,
        projects: null,
        project: null,
        tasks: null,
        task: null,
        projectAccess: null,
        assignees: null,
        taskColumns: {},
        taskColumnErrors: {},
        policyPageErrors: {},
        discovery: { status: 'idle', page: null, requestId: null },
        draft: null,
        moveDraft: null,
        policyDraft: null,
        collaborationDraft: null,
        retryTarget: null,
        moveRetryTarget: null,
        policyRetryTarget: null,
        collaborationRetryTarget: null,
        conflict: null,
        accessConflict: null,
        commentConflict: null,
        checklistConflict: null,
        result: null,
        outcome: null,
        closeWarning: null,
      }
    : parent;
  const navigationReview: SprintNavigationReviewPort | null =
    parent.integratedNavigation &&
    renderParent.status === 'ready' &&
    renderParent.session !== null &&
    Date.parse(renderParent.session.session.expiresAt) > Date.now()
      ? {
          destinationURL: parent.integratedNavigation.url,
          taskGuard: renderParent.draftGuard.kind,
          sprintGuard: model.visible
            ? sprints.getNavigationGuard() === 'none' && visibleEditing
              ? 'draft'
              : sprints.getNavigationGuard()
            : 'none',
          onStay: () => {
            void parent.resolveIntegratedNavigation('stay');
          },
          onDiscard:
            parent.mutationPending || sprints.mutation.status === 'pending'
              ? null
              : () => {
                  void parent.resolveIntegratedNavigation('discard');
                },
        }
      : null;
  return {
    focusScope,
    feedbackTarget,
    retryAllowed: !!sprints.recovery && model.visible && !model.parentBlocked,
    parent: renderParent,
    sprints,
    model,
    editing: visibleEditing,
    errors,
    reason,
    navigationReview,
    modalOpen: !!(
      visibleEditing?.start ||
      visibleEditing?.close ||
      (visibleEditing?.form &&
        !['estimate-task', 'set-task-sprint'].includes(visibleEditing.form.type)) ||
      navigationReview
    ),
    begin,
    changeField,
    submitForm,
    beginStart,
    beginClose,
    confirmStart,
    confirmClose,
    rebase,
    discard: () => discard(),
    changeCloseDestination(value: string) {
      if (!visibleEditing?.close || sprints.recovery || sprints.mutation.status === 'pending')
        return;
      updateEditing({ ...visibleEditing, close: { destination: value } });
    },
    async previewClose() {
      if (!visibleEditing?.close || !model.visible || model.parentBlocked) return;
      await sprints.preview(visibleEditing.close.destination || null);
    },
    selectSprint: (id: string) =>
      parent.setSprintLocation({ view: 'sprints', sprintId: id || null }),
    viewLink: (view: 'tasks' | 'sprints') =>
      writeProjectSprintLocation(parent.url, {
        view,
        sprintId: view === 'sprints' ? parent.sprintLocation.sprintId : null,
      }) ?? parent.url,
    selectView: (view: 'tasks' | 'sprints') =>
      parent.setSprintLocation({
        view,
        sprintId: view === 'sprints' ? parent.sprintLocation.sprintId : null,
      }),
  };
}
