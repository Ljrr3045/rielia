'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrototypeScenario, PrototypeView, SaveContext, TaskStatus } from '../../lib/task-prototype/types';
import { useTaskPrototype } from '../../lib/task-prototype/use-task-prototype';
import { BoardView } from './board-view';
import { Filters, activeFilterCount } from './filters';
import { SprintForm, SprintView, CloseSprintDialog } from './sprint-view';
import { copy, contextTargetLabel, VIEW_LABELS, type Lang } from './strings';
import { TaskDetail } from './task-detail';
import { TaskForm } from './task-form';
import { TaskListView } from './task-views';
import {
  SaveFeedback,
  cx,
  IconBoard,
  IconClose,
  IconFilter,
  IconList,
  IconMenu,
  IconMyTasks,
  IconPlus,
  IconSprint,
  useBodyScrollLock,
  useFocusTrap,
  useIsNarrow,
  useIsSidebarDrawer,
} from './ui';
import styles from './prototype.module.css';

const NAV_ITEMS: readonly { id: PrototypeView; icon: 'my-tasks' | 'list' | 'board' | 'sprints' }[] = [
  { id: 'my-tasks', icon: 'my-tasks' },
  { id: 'list', icon: 'list' },
  { id: 'board', icon: 'board' },
  { id: 'sprints', icon: 'sprints' },
];

function NavIcon({ kind }: { kind: 'my-tasks' | 'list' | 'board' | 'sprints' }) {
  if (kind === 'my-tasks') return <IconMyTasks size={18} />;
  if (kind === 'list') return <IconList size={18} />;
  if (kind === 'board') return <IconBoard size={18} />;
  return <IconSprint size={18} />;
}

export function PrototypeApp() {
  const { state, actions } = useTaskPrototype();
  const [lang, setLang] = useState<Lang>('es');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingReset, setPendingReset] = useState<PrototypeScenario | null>(null);
  const [closeSprintId, setCloseSprintId] = useState<string | null>(null);
  const c = copy[lang];
  const labels = VIEW_LABELS[lang];
  const isNarrow = useIsNarrow();
  const sidebarDrawer = useIsSidebarDrawer();

  const sidebarRef = useRef<HTMLElement>(null);
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const draftOpenerRef = useRef<HTMLElement | null>(null);
  const sprintOpenerRef = useRef<HTMLElement | null>(null);
  const closeOpenerRef = useRef<HTMLElement | null>(null);
  const detailWasOpen = useRef(false);
  const taskDraftWasOpen = useRef(false);
  const sprintDraftWasOpen = useRef(false);

  const detailOpen = state.selectedTaskId !== null;
  const taskFormOpen = state.taskDraft !== null;
  const sprintFormOpen = state.sprintDraft !== null;
  const closeDialogOpen = closeSprintId !== null;
  const modalOpen = taskFormOpen || sprintFormOpen || closeDialogOpen;
  const draftOpen = taskFormOpen || sprintFormOpen;
  const pending = state.save.status === 'pending';
  const filtersActive = activeFilterCount(state.filters);
  const selectedDetailTaskId = detailOpen ? state.selectedTaskId : null;
  const isDetailTaskContext = (context: SaveContext | null) => context !== null
    && (context.kind === 'task' || context.kind === 'status')
    && selectedDetailTaskId !== null
    && context.taskId === selectedDetailTaskId;
  const isSprintLocalContext = (context: SaveContext | null) => context !== null
    && state.view === 'sprints'
    && (context.kind === 'sprint' || context.kind === 'start-sprint' || context.kind === 'close-sprint');
  const currentHandledLocally = isDetailTaskContext(state.save.context) || isSprintLocalContext(state.save.context);
  const retryHandledLocally = isDetailTaskContext(state.retryContext) || isSprintLocalContext(state.retryContext);
  const backgroundInert = (sidebarDrawer && sidebarOpen) || (isNarrow && detailOpen && !modalOpen);
  const globalSave = !modalOpen && !backgroundInert && state.save.status !== 'idle' && !currentHandledLocally ? state.save : null;
  const globalCanRetry = !modalOpen && !backgroundInert && state.retryContext !== null && !retryHandledLocally;
  const showGlobalFeedback = globalSave !== null || globalCanRetry;

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useFocusTrap(sidebarRef, sidebarDrawer && sidebarOpen, closeSidebar);
  useBodyScrollLock(modalOpen || (isNarrow && detailOpen) || (sidebarDrawer && sidebarOpen));

  useEffect(() => {
    if (!sidebarDrawer) setSidebarOpen(false);
  }, [sidebarDrawer]);

  const closeDetail = useCallback(() => {
    actions.selectTask(null);
  }, [actions]);

  const openTask = (taskId: string) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    actions.selectTask(taskId);
    setSidebarOpen(false);
  };

  const openNewTask = (status: TaskStatus = 'backlog') => {
    if (state.taskDraft !== null || state.sprintDraft !== null || pending) return;
    draftOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    actions.beginCreateTask(status);
  };

  const openEditTask = (taskId: string) => {
    if (state.taskDraft !== null || state.sprintDraft !== null || pending) return;
    draftOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    actions.beginEditTask(taskId);
  };

  const openNewSprint = () => {
    if (state.taskDraft !== null || state.sprintDraft !== null || pending) return;
    sprintOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    actions.beginCreateSprint();
  };

  const openEditSprint = (sprintId: string) => {
    if (state.taskDraft !== null || state.sprintDraft !== null || pending) return;
    sprintOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    actions.beginEditSprint(sprintId);
  };

  const openCloseSprint = (sprintId: string) => {
    closeOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCloseSprintId(sprintId);
  };

  const closeSprintDialog = useCallback(() => {
    setCloseSprintId(null);
    requestAnimationFrame(() => {
      const opener = closeOpenerRef.current;
      if (opener?.isConnected) opener.focus();
      else mainHeadingRef.current?.focus();
    });
  }, []);

  const changeView = (view: PrototypeView) => {
    if (state.selectedTaskId !== null) actions.selectTask(null);
    actions.setView(view);
    setSidebarOpen(false);
    setFiltersOpen(false);
    requestAnimationFrame(() => mainHeadingRef.current?.focus());
  };

  const resetDemo = () => {
    if (pendingReset === null) return;
    actions.reset(pendingReset);
    setPendingReset(null);
    setCloseSprintId(null);
    setFiltersOpen(false);
    setSidebarOpen(false);
    requestAnimationFrame(() => mainHeadingRef.current?.focus());
  };

  useEffect(() => {
    if (detailWasOpen.current && state.selectedTaskId === null) {
      const opener = returnFocusRef.current;
      if (opener?.isConnected) opener.focus();
      else mainHeadingRef.current?.focus();
    }
    detailWasOpen.current = state.selectedTaskId !== null;
  }, [state.selectedTaskId]);

  useEffect(() => {
    if (taskDraftWasOpen.current && !taskFormOpen) {
      requestAnimationFrame(() => {
        const detailHeading = document.getElementById('prototype-detail-heading');
        if (state.selectedTaskId !== null && detailHeading !== null) detailHeading.focus();
        else {
          const opener = draftOpenerRef.current;
          if (opener?.isConnected) opener.focus();
          else mainHeadingRef.current?.focus();
        }
      });
    }
    taskDraftWasOpen.current = taskFormOpen;
  }, [taskFormOpen, state.selectedTaskId]);

  useEffect(() => {
    if (sprintDraftWasOpen.current && !sprintFormOpen) {
      requestAnimationFrame(() => {
        const opener = sprintOpenerRef.current;
        if (opener?.isConnected) opener.focus();
        else mainHeadingRef.current?.focus();
      });
    }
    sprintDraftWasOpen.current = sprintFormOpen;
  }, [sprintFormOpen]);

  useEffect(() => {
    if (!detailOpen || modalOpen || isNarrow) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [detailOpen, modalOpen, isNarrow, closeDetail]);

  const viewTitle = labels[state.view].title;
  const viewSubtitle = labels[state.view].subtitle;

  return (
    <div className={styles.app} lang={lang}>
      <a className={styles.skipLink} href="#prototype-main">
        {c.skipLink}
      </a>

      <div className={styles.demoBar} inert={modalOpen || (isNarrow && detailOpen) || (sidebarDrawer && sidebarOpen)}>
        <span className={styles.demoBadge}>{c.prototypeLabel}</span>
        <span className={styles.demoText}>{c.fictionalData}</span>
        <span className={styles.demoText}>{c.memoryOnly}</span>
        <button
          className={styles.demoSimulate}
          disabled={pending || state.nextSaveWillFail}
          onClick={() => actions.simulateNextSaveFailure()}
          type="button"
        >
          {c.simulateFailure}
        </button>
        {state.nextSaveWillFail && (
          <span className={styles.demoArmed} role="status">
            {c.failureArmed}
          </span>
        )}
        <details className={styles.demoDetails}>
          <summary>{c.demoOptions}</summary>
          <div className={styles.demoMenu}>
            {pendingReset === null ? (
              <div className={styles.demoResetChoices}>
                <button className={styles.demoAction} onClick={() => setPendingReset('seeded')} type="button">
                  {c.resetSeeded}
                </button>
                <button className={styles.demoAction} onClick={() => setPendingReset('empty')} type="button">
                  {c.resetEmpty}
                </button>
              </div>
            ) : (
              <div className={styles.demoResetConfirm} role="alert">
                <p>
                  {c.resetWarning}{' '}
                  <strong>{pendingReset === 'empty' ? c.resetEmpty : c.resetSeeded}</strong>
                </p>
                <div className={styles.demoResetChoices}>
                  <button className={styles.demoConfirm} onClick={resetDemo} type="button">
                    {c.resetConfirm}
                  </button>
                  <button className={styles.demoAction} onClick={() => setPendingReset(null)} type="button">
                    {c.resetCancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </details>
      </div>

      <div className={cx(styles.shell, detailOpen && styles.shellWithDetail)} inert={modalOpen}>
        <div
          aria-hidden="true"
          className={cx(styles.sidebarBackdrop, sidebarOpen && styles.sidebarBackdropVisible)}
          onClick={closeSidebar}
        />
        <aside
          aria-hidden={sidebarDrawer && !sidebarOpen}
          aria-label={c.mainNavigation}
          className={cx(styles.sidebar, sidebarOpen && styles.sidebarOpen)}
          id="prototype-sidebar"
          inert={sidebarDrawer && !sidebarOpen}
          ref={sidebarRef}
        >
          <div className={styles.brandRow}>
            <div>
              <p className={styles.brandName}>Rielia</p>
              <p className={styles.brandTag}>{c.prototypeLabel}</p>
            </div>
            <button
              aria-label={c.closeMenu}
              className={cx(styles.iconButton, styles.sidebarClose)}
              data-autofocus
              onClick={closeSidebar}
              type="button"
            >
              <IconClose size={18} />
            </button>
          </div>

          <div className={styles.workspaceBlock}>
            <p className={styles.navLabel}>{c.workspaceLabel}</p>
            <p className={styles.workspaceName}>{state.workspace.name}</p>
          </div>

          <nav className={styles.nav}>
            <div className={styles.navGroup}>
              <p className={styles.navLabel}>{c.myWork}</p>
              <button
                aria-current={state.view === 'my-tasks' ? 'page' : undefined}
                className={cx(styles.navButton, state.view === 'my-tasks' && styles.navButtonActive)}
                onClick={() => changeView('my-tasks')}
                type="button"
              >
                <IconMyTasks size={18} />
                <span>{c.myTasks}</span>
              </button>
            </div>

            <div className={styles.navGroup}>
              <p className={styles.navLabel}>{c.projects}</p>
              <div className={styles.projectNavHeader}>
                <span className={styles.projectName}>{state.project.name}</span>
                <span className={styles.projectKey}>{state.project.key}</span>
              </div>
              {NAV_ITEMS.filter(item => item.id !== 'my-tasks').map(item => (
                <button
                  aria-current={state.view === item.id ? 'page' : undefined}
                  className={cx(styles.navButton, state.view === item.id && styles.navButtonActive)}
                  key={item.id}
                  onClick={() => changeView(item.id)}
                  type="button"
                >
                  <NavIcon kind={item.icon} />
                  <span>{labels[item.id].title}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <div className={styles.workspaceColumn} inert={backgroundInert}>
          <header className={styles.topbar}>
            <button
              aria-controls="prototype-sidebar"
              aria-expanded={sidebarOpen}
              aria-label={c.openMenu}
              className={cx(styles.iconButton, styles.menuButton)}
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <IconMenu size={20} />
            </button>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbWorkspace}>{state.workspace.name}</span>
              <span aria-hidden="true" className={styles.breadcrumbSeparator}>
                /
              </span>
              <span>{state.project.name}</span>
            </div>
            <div
              aria-label={c.language}
              className={styles.langToggle}
              role="group"
            >
              <button aria-label="Español" aria-pressed={lang === 'es'} onClick={() => setLang('es')} type="button">
                ES
              </button>
              <button aria-label="English" aria-pressed={lang === 'en'} onClick={() => setLang('en')} type="button">
                EN
              </button>
            </div>
          </header>

          <main className={styles.main} id="prototype-main" tabIndex={-1}>
            <div className={styles.viewHeader}>
              <div className={styles.viewHeading}>
                <p className={styles.eyebrow}>
                  {c.projectLabel} <span className={styles.projectKey}>{state.project.key}</span>
                </p>
                <h1 className={styles.viewTitle} ref={mainHeadingRef} tabIndex={-1}>
                  {viewTitle}
                </h1>
                <p className={styles.viewSubtitle}>
                  {state.view === 'board' ? (
                    <>
                      <span className={styles.desktopOnly}>{c.boardDragHint}</span>
                      <span className={styles.mobileOnly}>{viewSubtitle}</span>
                    </>
                  ) : (
                    viewSubtitle
                  )}
                </p>
              </div>
              <div className={styles.viewActions}>
                {state.view !== 'sprints' && (
                  <span className={styles.countPill}>{c.taskCount(state.visibleTasks.length)}</span>
                )}
                {state.view !== 'sprints' && (
                  <button
                    aria-controls="prototype-filters"
                    aria-expanded={filtersOpen}
                    className={cx(styles.secondaryButton, styles.filterToggle)}
                    onClick={() => setFiltersOpen(open => !open)}
                    type="button"
                  >
                    <IconFilter size={16} />
                    {c.filters}
                    {filtersActive > 0 && <span className={styles.filterCount}>{filtersActive}</span>}
                  </button>
                )}
                {state.view === 'sprints' ? (
                  <button className={styles.primaryButton} disabled={draftOpen || pending} onClick={openNewSprint} type="button">
                    <IconPlus size={16} />
                    {c.newSprint}
                  </button>
                ) : (
                  <button className={styles.primaryButton} disabled={draftOpen || pending} onClick={() => openNewTask('backlog')} type="button">
                    <IconPlus size={16} />
                    {c.newTask}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.feedbackSlot}>
              {showGlobalFeedback && (
                <SaveFeedback
                  canRetry={globalCanRetry}
                  currentTarget={contextTargetLabel(globalSave?.context ?? null, state.tasks, state.sprints)}
                  lang={lang}
                  onRetry={() => {
                    void actions.retrySave();
                  }}
                  retryTarget={globalCanRetry ? contextTargetLabel(state.retryContext, state.tasks, state.sprints) : null}
                  save={globalSave}
                  showError
                />
              )}
            </div>

            {state.view !== 'sprints' && <Filters actions={actions} lang={lang} open={filtersOpen} state={state} />}

            <section className={styles.viewBody} aria-label={viewTitle}>
              {state.view === 'my-tasks' && (
                <TaskListView actions={actions} lang={lang} mode="my-tasks" onOpen={openTask} state={state} />
              )}
              {state.view === 'list' && (
                <TaskListView actions={actions} lang={lang} mode="list" onOpen={openTask} state={state} />
              )}
              {state.view === 'board' && (
                <BoardView actions={actions} lang={lang} onNew={status => openNewTask(status)} onOpen={openTask} state={state} />
              )}
              {state.view === 'sprints' && (
                <SprintView
                  actions={actions}
                  lang={lang}
                  onCloseSprint={openCloseSprint}
                  onEditSprint={openEditSprint}
                  onNewSprint={openNewSprint}
                  onOpenTask={openTask}
                  state={state}
                />
              )}
            </section>
          </main>

          <nav aria-label={c.viewNavigation} className={styles.bottomNav}>
            {NAV_ITEMS.map(item => (
              <button
                aria-current={state.view === item.id ? 'page' : undefined}
                className={cx(styles.bottomNavButton, state.view === item.id && styles.bottomNavButtonActive)}
                key={item.id}
                onClick={() => changeView(item.id)}
                type="button"
              >
                <NavIcon kind={item.icon} />
                <span>{labels[item.id].title}</span>
              </button>
            ))}
          </nav>
        </div>

        {detailOpen && (
          <TaskDetail
            actions={actions}
            lang={lang}
            onClose={closeDetail}
            onEdit={openEditTask}
            state={state}
            trapFocus={isNarrow && !modalOpen && !sidebarOpen}
          />
        )}
      </div>

      {taskFormOpen && <TaskForm actions={actions} key={state.taskDraft?.taskId ?? 'task-form'} lang={lang} state={state} />}
      {sprintFormOpen && (
        <SprintForm actions={actions} key={state.sprintDraft?.sprintId ?? 'sprint-form'} lang={lang} state={state} />
      )}
      {closeSprintId !== null && (
        <CloseSprintDialog
          actions={actions}
          key={closeSprintId}
          lang={lang}
          onClose={closeSprintDialog}
          sprintId={closeSprintId}
          state={state}
        />
      )}
    </div>
  );
}
