import { QueryClient } from '@tanstack/react-query';
import { freezeSprintValue } from './sprint-client-state.ts';
import type {
  Page,
  WorkspaceSummary,
  WorkspaceMember,
  WorkspaceInvitation,
} from '@rielia/contracts';
import { createClientQueryResource, type ClientQueryResource } from './client-query-resource.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';

export interface WorkspaceQueryResources {
  workspaces: ClientQueryResource<Page<WorkspaceSummary>>;
  workspace: ClientQueryResource<WorkspaceSummary>;
  members: ClientQueryResource<Page<WorkspaceMember>>;
  invitations: ClientQueryResource<Page<WorkspaceInvitation>>;
}
export type WorkspaceQueryName = keyof WorkspaceQueryResources;

/** Four canonical resources, in one verified browser lifetime; commands never enter this cache. */
export function createWorkspaceQueryOwner(options: {
  transport: WorkspaceTransport;
  changed: () => void;
  authorized: () => boolean;
  denied: (reason: 'signed-out' | 'forbidden') => void;
  client?: QueryClient;
}) {
  const client =
    options.client ??
    new QueryClient({
      defaultOptions: { mutations: { retry: false, gcTime: 0, networkMode: 'always' } },
    });
  const slotOptions = {
    client,
    freeze: freezeSprintValue,
    changed: options.changed,
    authorized: options.authorized,
    denied: options.denied,
    failure: (error: unknown) =>
      error instanceof WorkspaceFailure
        ? { status: error.status, code: error.code, requestId: null }
        : { status: 0, code: null, requestId: null },
    pageChanged: () => new WorkspaceFailure(409, 'page-changed'),
  };
  const slots = {
    workspaces: createClientQueryResource<Page<WorkspaceSummary>>(slotOptions),
    workspace: createClientQueryResource<WorkspaceSummary>(slotOptions),
    members: createClientQueryResource<Page<WorkspaceMember>>(slotOptions),
    invitations: createClientQueryResource<Page<WorkspaceInvitation>>(slotOptions),
  };
  let epoch: string | null = null;
  let selected: string | null = null;
  function pages<T>(identity: (row: T) => string) {
    return {
      cursor: (value: Page<T>) => value.nextCursor,
      // The API exposes no revision token. Equal totals are only a chain admission check.
      binding: (value: Page<T>) => JSON.stringify([value.total]),
      identities: (value: Page<T>) => value.items.map(identity),
      size: (value: Page<T>) => value.items.length,
      total: (value: Page<T>) => value.total,
      compose: (values: Page<T>[]): Page<T> => ({
        ...values[0]!,
        items: values.flatMap((value) => value.items),
        nextCursor: values.at(-1)!.nextCursor,
      }),
    };
  }
  function key(name: WorkspaceQueryName, workspaceId: string | null) {
    return ['workspace', epoch, workspaceId, name, { selector: 'all' }];
  }
  function clear() {
    epoch = null;
    selected = null;
    Object.values(slots).forEach((slot) => slot.clear());
    client.clear();
    options.changed();
  }
  function bind(value: string) {
    if (epoch === value) return;
    clear();
    epoch = value;
    slots.workspaces.bind({
      key: key('workspaces', null),
      load: (signal, cursor) => options.transport.workspaces(signal, cursor),
      page: pages<WorkspaceSummary>((row) => row.id),
    });
  }
  function select(workspaceId: string | null) {
    if (!epoch || selected === workspaceId) return;
    selected = workspaceId;
    slots.workspace.clear();
    slots.members.clear();
    slots.invitations.clear();
    if (workspaceId) {
      slots.workspace.bind({
        key: key('workspace', workspaceId),
        load: (signal) => options.transport.detail(workspaceId, signal),
        admit(value) {
          if (value.id !== workspaceId) throw new WorkspaceFailure(502);
        },
      });
      slots.members.bind({
        key: key('members', workspaceId),
        load: (signal, cursor) => options.transport.members(workspaceId, signal, cursor),
        page: pages<WorkspaceMember>((row) => row.principalId),
      });
    }
    options.changed();
  }
  function administer(allowed: boolean) {
    const workspaceId = selected;
    slots.invitations.bind(
      epoch && workspaceId && allowed
        ? {
            key: key('invitations', workspaceId),
            load: (signal, cursor) => options.transport.invitations(workspaceId, signal, cursor),
            page: pages<WorkspaceInvitation>((row) => row.id),
            admit(value) {
              if (value.items.some((row) => row.workspaceId !== workspaceId))
                throw new WorkspaceFailure(502);
            },
          }
        : null,
    );
    options.changed();
  }
  function resources(): WorkspaceQueryResources {
    return {
      workspaces: slots.workspaces.resource(),
      workspace: slots.workspace.resource(),
      members: slots.members.resource(),
      invitations: slots.invitations.resource(),
    };
  }
  return {
    bind,
    select,
    administer,
    clear,
    resources,
    read: (name: WorkspaceQueryName, more = false) => slots[name].read(more),
    cancel() {
      Object.values(slots).forEach((slot) => slot.cancel());
    },
    invalidate() {
      Object.values(slots).forEach((slot) => slot.invalidate());
      options.changed();
    },
  };
}
