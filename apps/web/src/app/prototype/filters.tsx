'use client';

import type { TaskFilters, TaskPrototypeActions, PrototypeState } from '../../lib/task-prototype/types';
import {
  copy,
  priorityLabel,
  sprintStateLabel,
  statusLabel,
  type Lang,
} from './strings';
import { cx, IconClose, IconSearch } from './ui';
import styles from './prototype.module.css';

export function activeFilterCount(filters: TaskFilters): number {
  return [
    filters.search.trim().length > 0,
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.assigneeId !== 'all',
    filters.labelId !== 'all',
    filters.sprintId !== 'all',
  ].filter(Boolean).length;
}

interface FiltersProps {
  state: PrototypeState;
  actions: TaskPrototypeActions;
  lang: Lang;
  open: boolean;
}

export function Filters({ state, actions, lang, open }: FiltersProps) {
  const c = copy[lang];
  const count = activeFilterCount(state.filters);
  const sprintLabel = (sprintId: string) => {
    const sprint = state.sprints.find(item => item.id === sprintId);
    if (sprint === undefined) return sprintId;
    return `${sprint.name} · ${sprintStateLabel(sprint.state, lang)}`;
  };

  return (
    <section
      aria-label={c.filterPanel}
      className={cx(styles.filtersPanel, open && styles.filtersPanelOpen)}
      id="prototype-filters"
    >
      <label className={cx(styles.filterField, styles.filterSearch)}>
        <span className={styles.fieldLabel}>{c.search}</span>
        <span className={styles.searchBox}>
          <IconSearch size={16} />
          <input
            autoComplete="off"
            className={styles.textInput}
            onChange={event => actions.setFilters({ search: event.target.value })}
            placeholder={c.searchPlaceholder}
            type="search"
            value={state.filters.search}
          />
          {state.filters.search.length > 0 && (
            <button
              aria-label={c.clearSearch}
              className={styles.searchClear}
              onClick={() => actions.setFilters({ search: '' })}
              type="button"
            >
              <IconClose size={14} />
            </button>
          )}
        </span>
      </label>

      <label className={styles.filterField}>
        <span className={styles.fieldLabel}>{c.status}</span>
        <select
          className={styles.select}
          onChange={event => actions.setFilters({ status: event.target.value as TaskFilters['status'] })}
          value={state.filters.status}
        >
          <option value="all">{c.all}</option>
          {state.statuses.map(status => (
            <option key={status.id} value={status.id}>
              {statusLabel(status.id, lang)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.fieldLabel}>{c.priority}</span>
        <select
          className={styles.select}
          onChange={event => actions.setFilters({ priority: event.target.value as TaskFilters['priority'] })}
          value={state.filters.priority}
        >
          <option value="all">{c.all}</option>
          <option value="urgent">{priorityLabel('urgent', lang)}</option>
          <option value="high">{priorityLabel('high', lang)}</option>
          <option value="medium">{priorityLabel('medium', lang)}</option>
          <option value="low">{priorityLabel('low', lang)}</option>
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.fieldLabel}>{c.assignee}</span>
        <select
          className={styles.select}
          onChange={event => actions.setFilters({ assigneeId: event.target.value })}
          value={state.filters.assigneeId}
        >
          <option value="all">{c.all}</option>
          <option value="unassigned">{c.unassigned}</option>
          {state.principals.map(principal => (
            <option key={principal.id} value={principal.id}>
              {principal.name}
              {principal.kind === 'agent' ? ` · ${c.agent}` : ''}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.fieldLabel}>{c.label}</span>
        <select
          className={styles.select}
          onChange={event => actions.setFilters({ labelId: event.target.value })}
          value={state.filters.labelId}
        >
          <option value="all">{c.all}</option>
          {state.labels.map(label => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.fieldLabel}>{c.sprint}</span>
        <select
          className={styles.select}
          onChange={event => actions.setFilters({ sprintId: event.target.value })}
          value={state.filters.sprintId}
        >
          <option value="all">{c.all}</option>
          <option value="backlog">{c.noSprint}</option>
          {state.sprints.map(sprint => (
            <option key={sprint.id} value={sprint.id}>
              {sprintLabel(sprint.id)}
            </option>
          ))}
        </select>
      </label>

      {count > 0 && (
        <button className={styles.clearFilters} onClick={() => actions.clearFilters()} type="button">
          {c.clearFilters}
          <span className={styles.filterCount}>{count}</span>
        </button>
      )}
    </section>
  );
}
