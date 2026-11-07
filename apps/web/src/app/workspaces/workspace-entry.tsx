'use client';

import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { Page, WorkspaceCommand, WorkspaceMember, WorkspaceSummary } from '@rielia/contracts';
import { copy, roleName } from './strings';
import { BilingualText, cx } from './workspace-ui';
import type { CommandType } from './strings';
import styles from './workspace.module.css';
export function CreateWorkspaceForm({
  empty,
  disabled,
  draft,
  onStage,
  onCommand,
}: {
  empty: boolean;
  disabled: boolean;
  draft: WorkspaceCommand | null;
  onStage: (command: WorkspaceCommand) => void;
  onCommand: (command: WorkspaceCommand) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (draft?.type === 'create-workspace') {
      setName(draft.name);
      setError(false);
    } else if (draft === null) {
      setName('');
      setError(false);
    }
  }, [draft]);

  function change(value: string) {
    setName(value);
    if (error) setError(false);
    onStage({ type: 'create-workspace', name: value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setError(true);
      return;
    }
    setError(false);
    onCommand({ type: 'create-workspace', name: value });
  }

  const form = (
    <>
      <p className={styles.sectionBody}>
        <BilingualText value={copy.workspace.createBody} />
      </p>
      <form onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor={inputId}>
            <BilingualText value={copy.workspace.nameLabel} />
          </label>
          <input
            id={inputId}
            name="workspace-name"
            type="text"
            value={name}
            maxLength={200}
            autoComplete="off"
            required
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={cx(hintId, error ? errorId : null)}
            onChange={(event) => change(event.currentTarget.value)}
          />
          <p id={hintId} className={styles.fieldHint}>
            <BilingualText value={copy.workspace.nameHint} />
          </p>
          {error && (
            <p id={errorId} className={styles.fieldError} role="alert">
              <BilingualText value={copy.workspace.nameRequired} />
            </p>
          )}
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.primary} disabled={disabled}>
            <BilingualText value={copy.workspace.create} />
          </button>
        </div>
      </form>
    </>
  );

  if (empty) {
    return (
      <div className={styles.emptyForm}>
        <h3 className={styles.subheading}>
          <BilingualText value={copy.workspace.createTitle} />
        </h3>
        {form}
      </div>
    );
  }

  return (
    <details className={styles.disclosure}>
      <summary>
        <BilingualText value={copy.workspace.createDisclosure} />
      </summary>
      <div className={styles.disclosureBody}>
        <h2 className={styles.sectionTitle}>
          <BilingualText value={copy.workspace.createTitle} />
        </h2>
        {form}
      </div>
    </details>
  );
}

function ownerName(members: Page<WorkspaceMember> | null, ownerPrincipalId: string): string | null {
  if (members === null) return null;
  return members.items.find((member) => member.principalId === ownerPrincipalId)?.name ?? null;
}

export function WorkspaceChooser({
  workspaces,
  selectedWorkspaceId,
  pending,
  onSelect,
}: {
  workspaces: Page<WorkspaceSummary>;
  selectedWorkspaceId: string | null;
  pending: CommandType | null;
  onSelect: (workspaceId: string | null) => void;
}) {
  const id = useId();
  const knownSelection =
    selectedWorkspaceId === null ||
    workspaces.items.some((item) => item.id === selectedWorkspaceId);
  const value = selectedWorkspaceId ?? '';

  return (
    <div className={styles.workspaceChooser}>
      <label htmlFor={id}>
        <BilingualText value={copy.workspace.selectorLabel} />
      </label>
      <select
        id={id}
        value={value}
        disabled={pending !== null}
        onChange={(event) =>
          onSelect(event.currentTarget.value === '' ? null : event.currentTarget.value)
        }
      >
        {selectedWorkspaceId === null && (
          <option value="" disabled>
            <BilingualText value={copy.workspace.chooseWorkspace} />
          </option>
        )}
        {selectedWorkspaceId !== null && (
          <option value="">
            <BilingualText value={copy.workspace.clearSelection} />
          </option>
        )}
        {!knownSelection && selectedWorkspaceId !== null && (
          <option value={selectedWorkspaceId}>
            <BilingualText value={copy.workspace.currentSelection} />
          </option>
        )}
        {workspaces.items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WorkspaceBar({
  workspaces,
  workspace,
  members,
  pending,
  loadingMore,
  onSelect,
  onLoadMore,
}: {
  workspaces: Page<WorkspaceSummary>;
  workspace: WorkspaceSummary;
  members: Page<WorkspaceMember> | null;
  pending: CommandType | null;
  loadingMore: boolean;
  onSelect: (workspaceId: string) => void;
  onLoadMore: () => void;
}) {
  const selectorId = useId();
  const owner = ownerName(members, workspace.ownerPrincipalId);

  return (
    <section className={styles.workspaceBar} aria-labelledby="workspace-bar-heading">
      <h2 id="workspace-bar-heading" className={styles.srOnly}>
        <BilingualText value={copy.workspace.selectorLabel} />
      </h2>
      <div className={styles.field}>
        <label htmlFor={selectorId}>
          <BilingualText value={copy.workspace.selectorLabel} />
        </label>
        <select
          id={selectorId}
          value={workspace.id}
          disabled={pending !== null}
          onChange={(event) => onSelect(event.currentTarget.value)}
        >
          {!workspaces.items.some((item) => item.id === workspace.id) && (
            <option value={workspace.id}>{workspace.name}</option>
          )}
          {workspaces.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <dl className={styles.workspaceSummary}>
        <div>
          <dt>
            <BilingualText value={copy.workspace.roleLabel} />
          </dt>
          <dd>
            <BilingualText value={roleName[workspace.role]} />
          </dd>
        </div>
        <div>
          <dt>
            <BilingualText value={copy.workspace.ownerLabel} />
          </dt>
          <dd className={styles.longValue}>
            {owner ?? <BilingualText value={copy.workspace.ownerUnavailable} />}
          </dd>
        </div>
      </dl>
      {workspaces.nextCursor !== null && (
        <button
          type="button"
          className={styles.secondary}
          disabled={pending !== null || loadingMore}
          onClick={onLoadMore}
        >
          <BilingualText value={loadingMore ? copy.common.loadingMore : copy.workspace.loadMore} />
        </button>
      )}
    </section>
  );
}
