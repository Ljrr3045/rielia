'use client';

import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  taskPriorities,
  type Project,
  type TaskDiscoveryItem,
  type TaskFilters,
  type TaskPriority,
  type TaskStatus,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
import type { TaskStreamStatus } from '../../lib/task-events-client';
import { FeedbackPanel } from './feedback';
import {
  AssigneeTag,
  Badge,
  DueDate,
  EmptyState,
  IconAlert,
  IconArchive,
  IconChevron,
  IconPlus,
  IconSearch,
  IconTask,
  PriorityMark,
  Spinner,
  StatusMark,
  cx,
  useIsNarrow,
  useLocale,
} from './project-ui';
import { copy, priorityName, statusName, typeName } from './strings';
import styles from './projects.module.css';

export function TaskDiscoveryBar({
  scope,
  query,
  projectId,
  projects,
  selectedProjectName,
  filters,
  archived,
  disabled,
  onScope,
  onSearch,
  onFilters,
  onProject,
  onClearFilters,
  onToggleArchive,
}: {
  scope: 'mine' | 'search';
  query: string;
  projectId: string | null;
  projects: readonly Project[];
  selectedProjectName: string | null;
  filters: TaskFilters;
  archived: boolean;
  disabled: boolean;
  onScope: (scope: 'mine' | 'search') => void;
  onSearch: (query: string) => void;
  onFilters: (filters: TaskFilters) => void;
  onProject: (projectId: string | null) => void;
  onClearFilters: () => void;
  onToggleArchive: () => void;
}) {
  const lang = useLocale();
  const narrow = useIsNarrow();
  const [queryDraft, setQueryDraft] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hintId = useId();
  const searchId = useId();
  const panelId = useId();
  const statusId = useId();
  const assigneeId = useId();
  const priorityId = useId();
  const projectFilterId = useId();
  const filtersActive = Object.keys(filters).length;
  const filterCount = filtersActive + (projectId !== null ? 1 : 0);
  const selectedProjectMissing = projectId !== null && !projects.some(project => project.id === projectId);

  useEffect(() => {
    setQueryDraft(query);
  }, [query]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = queryDraft.trim();
    if (value !== query.trim()) onSearch(value);
  }

  function setFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K] | undefined) {
    const next: TaskFilters = { ...filters };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onFilters(next);
  }

  function filterFields(includeClear: boolean) {
    return (
      <>
        <label className={styles.filterField} htmlFor={statusId}>
          <span>{copy.taskView.status[lang]}</span>
          <select
            disabled={disabled}
            id={statusId}
            onChange={event => {
              const value = event.currentTarget.value;
              setFilter('status', value.length === 0 ? undefined : value as TaskStatus);
            }}
            value={filters.status ?? ''}
          >
            <option value="">{copy.taskView.all[lang]}</option>
            {(['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const).map(status => (
              <option key={status} value={status}>{statusName(status)[lang]}</option>
            ))}
          </select>
        </label>

        <label className={styles.filterField} htmlFor={projectFilterId}>
          <span>{copy.discovery.projectFilter[lang]}</span>
          <select
            disabled={disabled}
            id={projectFilterId}
            onChange={event => {
              const value = event.currentTarget.value;
              onProject(value.length === 0 ? null : value);
            }}
            value={projectId ?? ''}
          >
            <option value="">{copy.discovery.allProjects[lang]}</option>
            {selectedProjectMissing && (
              <option value={projectId}>{selectedProjectName ?? copy.discovery.selectedProject[lang]}</option>
            )}
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>

        {scope === 'search' && filters.assignee !== undefined && (
          <label className={styles.filterField} htmlFor={assigneeId}>
            <span>{copy.taskView.assignee[lang]}</span>
            <select
              disabled={disabled}
              id={assigneeId}
              onChange={event => {
                const value = event.currentTarget.value;
                setFilter('assignee', value.length === 0 ? undefined : value);
              }}
              value={filters.assignee}
            >
              <option value="">{copy.taskView.all[lang]}</option>
              <option value="unassigned">{copy.taskView.unassigned[lang]}</option>
              {filters.assignee !== 'unassigned' && (
                <option value={filters.assignee}>{copy.discovery.selectedAssignee[lang]}</option>
              )}
            </select>
            <span className={styles.filterHint}>{copy.discovery.assigneeFromLink[lang]}</span>
          </label>
        )}

        <label className={styles.filterField} htmlFor={priorityId}>
          <span>{copy.taskView.priority[lang]}</span>
          <select
            disabled={disabled}
            id={priorityId}
            onChange={event => {
              const value = event.currentTarget.value;
              setFilter('priority', value.length === 0 ? undefined : value as TaskPriority);
            }}
            value={filters.priority ?? ''}
          >
            <option value="">{copy.taskView.all[lang]}</option>
            {taskPriorities.map(priority => (
              <option key={priority} value={priority}>{priorityName(priority)[lang]}</option>
            ))}
          </select>
        </label>

        {includeClear && filterCount > 0 && (
          <button className={styles.clearFilters} disabled={disabled} onClick={onClearFilters} type="button">
            {copy.discovery.clearFilters[lang]}
          </button>
        )}
      </>
    );
  }

  return (
    <section aria-label={copy.discovery.barLabel[lang]} className={styles.discoveryBar} data-discovery-bar tabIndex={-1}>
      <div className={styles.discoveryTop}>
        <div aria-label={copy.discovery.scopeLabel[lang]} className={styles.discoveryScope} role="group">
          <button
            aria-pressed={scope === 'mine'}
            className={cx(styles.discoveryScopeTab, scope === 'mine' && styles.discoveryScopeTabActive)}
            disabled={disabled}
            onClick={() => onScope('mine')}
            type="button"
          >
            {copy.discovery.myTasks[lang]}
          </button>
          <button
            aria-pressed={scope === 'search'}
            className={cx(styles.discoveryScopeTab, scope === 'search' && styles.discoveryScopeTabActive)}
            disabled={disabled}
            onClick={() => onScope('search')}
            type="button"
          >
            {copy.discovery.search[lang]}
          </button>
        </div>

        <form className={styles.discoverySearch} onSubmit={submitSearch} role="search">
          <label className={styles.srOnly} htmlFor={searchId}>{copy.discovery.searchLabel[lang]}</label>
          <input
            aria-describedby={hintId}
            autoComplete="off"
            className={styles.discoverySearchInput}
            disabled={disabled}
            enterKeyHint="search"
            id={searchId}
            maxLength={100}
            onChange={event => setQueryDraft(event.currentTarget.value)}
            placeholder={copy.discovery.searchPlaceholder[lang]}
            type="search"
            value={queryDraft}
          />
          <button className={styles.secondary} disabled={disabled} type="submit">
            {copy.discovery.searchSubmit[lang]}
          </button>
        </form>

        <button
          aria-label={archived ? copy.task.viewActive[lang] : copy.task.viewArchived[lang]}
          aria-pressed={archived}
          className={styles.secondary}
          disabled={disabled}
          onClick={onToggleArchive}
          type="button"
        >
          <IconArchive size={16} />
          {narrow
            ? (archived ? copy.discovery.activeShort[lang] : copy.discovery.archiveShort[lang])
            : (archived ? copy.task.viewActive[lang] : copy.task.viewArchived[lang])}
        </button>
      </div>

      <p className={styles.discoveryHint} id={hintId}>{copy.discovery.searchHint[lang]}</p>

      {narrow
        ? (
          <button
            aria-controls={panelId}
            aria-expanded={filtersOpen}
            className={styles.secondary}
            disabled={disabled}
            onClick={() => setFiltersOpen(open => !open)}
            type="button"
          >
            {copy.discovery.filters[lang]} ({filterCount})
          </button>
        )
        : <div className={styles.filterRow}>{filterFields(true)}</div>}

      {narrow && filtersOpen && (
        <div aria-label={copy.discovery.filterPanel[lang]} className={styles.filterPanel} id={panelId} role="group">
          <div className={styles.filterPanelGrid}>{filterFields(false)}</div>
          {filterCount > 0 && (
            <button className={styles.clearFilters} disabled={disabled} onClick={onClearFilters} type="button">
              {copy.discovery.clearFilters[lang]}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function TaskCreateShortcut({
  projects,
  disabled,
  onChoose,
}: {
  projects: readonly Project[];
  disabled: boolean;
  onChoose: (projectId: string) => void;
}) {
  const lang = useLocale();
  const eligible = projects.filter(project => project.archivedAt === null && project.capabilities.canEdit);
  const [projectId, setProjectId] = useState(() => eligible[0]?.id ?? '');

  useEffect(() => {
    const options = projects.filter(project => project.archivedAt === null && project.capabilities.canEdit);
    if (!options.some(project => project.id === projectId)) setProjectId(options[0]?.id ?? '');
  }, [projects, projectId]);

  if (eligible.length === 0) {
    return <p className={styles.discoveryHint}>{copy.discovery.createNoProjects[lang]}</p>;
  }

  return (
    <details className={styles.discoveryCreate}>
      <summary className={styles.discoveryCreateSummary}>
        <IconPlus size={16} />
        <span>{copy.discovery.createDisclosure[lang]}</span>
        <IconChevron size={16} />
      </summary>
      <form
        className={styles.discoveryCreateBody}
        onSubmit={event => {
          event.preventDefault();
          if (projectId.length > 0 && !disabled) onChoose(projectId);
        }}
      >
        <p className={styles.discoveryHint}>{copy.discovery.createBody[lang]}</p>
        <label className={styles.filterField}>
          <span>{copy.discovery.createProjectLabel[lang]}</span>
          <select
            disabled={disabled}
            onChange={event => setProjectId(event.currentTarget.value)}
            value={projectId}
          >
            {eligible.map(project => (
              <option key={project.id} value={project.id}>{project.name} · {project.key}</option>
            ))}
          </select>
        </label>
        <div className={styles.formActions}>
          <button className={styles.primary} disabled={disabled || projectId.length === 0} type="submit">
            {copy.discovery.createOpen[lang]}
          </button>
        </div>
      </form>
    </details>
  );
}

export function TaskDiscoveryList({
  discovery,
  scope,
  query,
  projectId,
  filters,
  archived,
  contextLimit,
  disabled,
  onOpen,
  onLoadMore,
  onRefresh,
  onClearQuery,
  onClearFilters,
}: {
  discovery: ProjectTaskState['discovery'];
  scope: 'mine' | 'search';
  query: string;
  projectId: string | null;
  filters: TaskFilters;
  archived: boolean;
  contextLimit: boolean;
  disabled: boolean;
  onOpen: (item: TaskDiscoveryItem, opener: HTMLElement) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onClearQuery: () => void;
  onClearFilters: () => void;
}) {
  const lang = useLocale();
  const labelsId = useId();
  const page = discovery.page;
  const failed = discovery.status === 'error';
  const changed = discovery.status === 'changed';
  const hasQuery = query.trim().length > 0;
  const filtersActive = Object.keys(filters).length;
  const filtered = filtersActive > 0 || projectId !== null;
  const sameQuery = page !== null
    && page.query.scope === scope
    && page.query.q === query.trim()
    && page.query.view === (archived ? 'archived' : 'active')
    && (page.query.projectId ?? null) === projectId
    && page.query.filters.status === filters.status
    && page.query.filters.priority === filters.priority
    && page.query.filters.assignee === filters.assignee;
  const loadingNewContext = discovery.status === 'loading' && page !== null && !sameQuery;
  const loadingMore = discovery.status === 'loading' && page !== null && sameQuery;

  function loadingSkeleton() {
    return (
      <div aria-busy="true" aria-label={copy.discovery.loading[lang]} className={styles.discoverySkeleton} role="status">
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    );
  }

  if (page === null) {
    if (discovery.status === 'loading' || discovery.status === 'idle') {
      return loadingSkeleton();
    }
    if (failed) {
      return (
        <FeedbackPanel
          actions={(
            <>
              <button className={styles.secondary} disabled={disabled} onClick={onLoadMore} type="button">
                {copy.discovery.retry[lang]}
              </button>
              <button className={styles.ghostButton} onClick={onRefresh} type="button">
                {copy.common.refresh[lang]}
              </button>
            </>
          )}
          body={copy.discovery.errorBody}
          title={copy.discovery.errorTitle}
          tone="warning"
        />
      );
    }
    if (changed) {
      return (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} disabled={disabled} onClick={onRefresh} type="button">
              {copy.common.refresh[lang]}
            </button>
          )}
          body={copy.discovery.changedBody}
          title={copy.discovery.changedTitle}
          tone="warning"
        />
      );
    }
    const empty = hasQuery || filtered
      ? { title: copy.discovery.noResultsTitle, body: copy.discovery.noResultsBody }
      : archived
        ? { title: copy.discovery.emptyArchivedTitle, body: copy.discovery.emptyArchivedBody }
        : scope === 'mine'
          ? { title: copy.discovery.emptyMineTitle, body: copy.discovery.emptyMineBody }
          : { title: copy.discovery.emptySearchTitle, body: copy.discovery.emptySearchBody };
    return (
      <EmptyState
        actions={hasQuery
          ? <button className={styles.secondary} onClick={onClearQuery} type="button">{copy.discovery.clearSearch[lang]}</button>
          : filtered
            ? <button className={styles.secondary} onClick={onClearFilters} type="button">{copy.discovery.clearFilters[lang]}</button>
            : undefined}
        body={empty.body}
        icon={<IconTask size={22} />}
        title={empty.title}
      />
    );
  }

  if (loadingNewContext) return loadingSkeleton();

  if (discovery.status === 'loading' && page.items.length === 0) return loadingSkeleton();

  if (page.items.length === 0 && !failed && !changed) {
    const empty = hasQuery || filtered
      ? { title: copy.discovery.noResultsTitle, body: copy.discovery.noResultsBody }
      : archived
        ? { title: copy.discovery.emptyArchivedTitle, body: copy.discovery.emptyArchivedBody }
        : scope === 'mine'
          ? { title: copy.discovery.emptyMineTitle, body: copy.discovery.emptyMineBody }
          : { title: copy.discovery.emptySearchTitle, body: copy.discovery.emptySearchBody };
    return (
      <EmptyState
        actions={hasQuery
          ? <button className={styles.secondary} onClick={onClearQuery} type="button">{copy.discovery.clearSearch[lang]}</button>
          : filtered
            ? <button className={styles.secondary} onClick={onClearFilters} type="button">{copy.discovery.clearFilters[lang]}</button>
            : undefined}
        body={empty.body}
        icon={<IconTask size={22} />}
        title={empty.title}
      />
    );
  }

  const groups: Array<{ id: string; name: string; key: string; items: TaskDiscoveryItem[] }> = [];
  for (const item of page.items) {
    const last = groups[groups.length - 1];
    if (last?.id === item.projectId) last.items.push(item);
    else groups.push({ id: item.projectId, key: item.projectKey, name: item.projectName, items: [item] });
  }

  const summary = page.items.length < page.total
    ? copy.discovery.showing[lang](page.items.length, page.total)
    : copy.discovery.count[lang](page.total);

  return (
    <div aria-busy={loadingMore}>
      {failed && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} disabled={disabled} onClick={onLoadMore} type="button">
              {copy.discovery.retry[lang]}
            </button>
          )}
          body={copy.discovery.errorBody}
          title={copy.discovery.errorTitle}
          tone="warning"
        />
      )}
      {changed && (
        <FeedbackPanel
          actions={(
            <button className={styles.secondary} disabled={disabled} onClick={onRefresh} type="button">
              {copy.common.refresh[lang]}
            </button>
          )}
          body={copy.discovery.changedBody}
          title={copy.discovery.changedTitle}
          tone="warning"
        />
      )}
      <div aria-live="polite" className={styles.listSummary}>
        {scope === 'mine' ? <IconTask size={14} /> : <IconSearch size={14} />}
        <span>{summary}</span>
        {filtered && <span>· {copy.discovery.filterCount[lang](filtersActive + (projectId !== null ? 1 : 0))}</span>}
      </div>
      <div>
        {groups.map((group, index) => {
          const groupId = `${labelsId}-${index}`;
          return (
            <section aria-labelledby={groupId} className={styles.discoveryGroup} key={group.id}>
              <header className={styles.discoveryGroupHeader}>
                <h3 className={styles.discoveryGroupTitle} id={groupId}>{group.name}</h3>
                <span className={styles.taskKey}>{group.key}</span>
              </header>
              <ul aria-label={group.name} className={styles.taskList}>
                {group.items.map(item => (
                  <li
                    className={cx(styles.taskRow, styles.discoveryRow, item.archivedAt !== null && styles.taskRowArchived)}
                    data-discovery-task-id={item.id}
                    key={item.id}
                  >
                    <div className={styles.taskStatusCell}>
                      <StatusMark name={statusName(item.status)} status={item.status} />
                    </div>
                    <div className={styles.taskMain}>
                      <a
                        className={cx(styles.taskTitleButton, styles.discoveryTitleLink)}
                        data-discovery-open
                        href={item.url}
                        onClick={event => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                          event.preventDefault();
                          onOpen(item, event.currentTarget);
                        }}
                      >
                        {item.title}
                      </a>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskKey}>{item.key}</span>
                        <span className={cx(styles.taskMetaItem, styles.discoveryProjectTag)}>
                          {item.projectName} · {item.projectKey}
                        </span>
                        <span className={styles.taskMetaItem}>{typeName(item.type)[lang]}</span>
                        {item.dueDate !== null && (
                          <span className={styles.taskMetaItem}><DueDate value={item.dueDate} /></span>
                        )}
                        <span className={styles.taskMetaItem}>
                          <AssigneeTag
                            inactive={item.assignee !== null && !item.assignee.active}
                            kind={item.assignee?.kind ?? null}
                            name={item.assignee?.name ?? null}
                          />
                        </span>
                        <span className={cx(styles.taskMetaItem, styles.mobilePriority)}>
                          <PriorityMark name={priorityName(item.priority)} priority={item.priority} />
                        </span>
                        {item.projectArchivedAt !== null && (
                          <span className={styles.taskMetaItem}>
                            <Badge tone="archived">{copy.project.archivedBadge[lang]}</Badge>
                          </span>
                        )}
                        {item.archivedAt !== null && (
                          <span className={styles.taskMetaItem}>
                            <span className={styles.taskArchivedFlag}>{copy.task.archivedBadge[lang]}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.taskAside}>
                      <PriorityMark name={priorityName(item.priority)} priority={item.priority} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {loadingMore && (
        <p className={styles.discoveryLoading} role="status">
          <Spinner />
          {copy.discovery.updating[lang]}
        </p>
      )}
      {contextLimit && (
        <p className={styles.discoveryHint}>{copy.discovery.contextLimit[lang]}</p>
      )}
      {page.nextCursor !== null && !changed && !contextLimit && (
        <div className={styles.formActions}>
          <button className={styles.secondary} disabled={disabled || loadingMore} onClick={onLoadMore} type="button">
            {copy.discovery.loadMore[lang]}
          </button>
        </div>
      )}
    </div>
  );
}

export function LiveUpdateNotice({
  status,
  refreshRequired,
  refreshDeferred,
  disabled,
  onRefresh,
}: {
  status: TaskStreamStatus;
  refreshRequired: boolean;
  refreshDeferred: boolean;
  disabled: boolean;
  onRefresh: () => void;
}) {
  const lang = useLocale();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!refreshRequired || refreshDeferred) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, [refreshRequired, refreshDeferred]);

  const tone = status === 'reconnecting' || status === 'offline' || refreshDeferred || slow ? 'warning' : 'info';
  const message = status === 'reconnecting'
    ? copy.live.reconnecting[lang]
    : status === 'offline'
      ? copy.live.offline[lang]
      : refreshDeferred
        ? copy.live.deferred[lang]
        : slow && refreshRequired
          ? copy.live.stale[lang]
          : null;

  if (message === null) {
    if (status === 'live') {
      return (
        <p className={styles.streamStatus} data-stream-status={status} role="status">
          <span aria-hidden="true" className={styles.streamDot} />
          {refreshRequired ? copy.live.connectedPending[lang] : copy.live.connected[lang]}
        </p>
      );
    }
    if (status === 'connecting') {
      return (
        <p className={styles.streamStatus} data-stream-status={status} role="status">
          <Spinner size={12} />
          {copy.live.connecting[lang]}
        </p>
      );
    }
    return null;
  }

  return (
    <div
      className={cx(styles.liveNotice, tone === 'warning' ? styles.liveNoticeWarning : styles.liveNoticeInfo)}
      role="status"
    >
      <IconAlert size={18} />
      <span className={styles.liveNoticeText}>{message}</span>
      {(status === 'offline' || (slow && refreshRequired && !refreshDeferred)) && (
        <button className={styles.secondary} disabled={disabled} onClick={onRefresh} type="button">
          {copy.common.refresh[lang]}
        </button>
      )}
    </div>
  );
}
