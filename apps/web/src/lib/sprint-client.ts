import {
  isRecord,
  isProjectPlanning,
  isSprint,
  isSprintPage,
  type ProjectPlanning,
  type Sprint,
  type SprintPage,
  type SprintPlanningCommand,
  type SprintPlanningResult,
} from '@rielia/contracts';

import { createContractRequest } from './api-contract-client.ts';

const planningPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/planning';
const sprintsPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints';
const sprintPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}';

export class SprintPlanningFailure extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly current: SprintPlanningResult | null;
  readonly requestId: string | null;
  constructor(
    status: number,
    code: string | null = null,
    current: SprintPlanningResult | null = null,
    requestId: string | null = null,
  ) {
    super('Sprint planning request failed.');
    this.status = status;
    this.code = code;
    this.current = current;
    this.requestId = requestId;
  }
}
export function createSprintPlanningTransport(
  options: { baseURL?: string; timeout?: number } = {},
) {
  const send = createContractRequest(options);
  const scoped = (v: SprintPlanningResult, w: string, p: string, s?: string) =>
    v.workspaceId === w && v.projectId === p && (s === undefined || ('id' in v && v.id === s));
  async function read(response: Response, w: string, p: string, s?: string): Promise<unknown> {
    const requestId = response.headers.get('x-request-id');
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new SprintPlanningFailure(response.ok ? 502 : response.status, null, null, requestId);
    }
    if (!response.ok) {
      const current =
        isRecord(value) &&
        (isSprint(value['current']) || isProjectPlanning(value['current'])) &&
        scoped(value['current'], w, p, s)
          ? value['current']
          : null;
      throw new SprintPlanningFailure(
        response.status,
        isRecord(value) && typeof value['code'] === 'string' ? value['code'] : null,
        current,
        requestId,
      );
    }
    return value;
  }
  return {
    async planning(w: string, p: string, signal: AbortSignal): Promise<ProjectPlanning> {
      const value = await read(
        await send('get', planningPath, { path: { workspaceId: w, projectId: p }, signal }),
        w,
        p,
      );
      if (!isProjectPlanning(value) || !scoped(value, w, p)) throw new SprintPlanningFailure(502);
      return value;
    },
    async sprint(w: string, p: string, s: string, signal: AbortSignal): Promise<Sprint> {
      const value = await read(
        await send('get', sprintPath, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
        }),
        w,
        p,
        s,
      );
      if (!isSprint(value) || !scoped(value, w, p, s)) throw new SprintPlanningFailure(502);
      return value;
    },
    async sprints(w: string, p: string, signal: AbortSignal, cursor?: string): Promise<SprintPage> {
      const value = await read(
        await send('get', sprintsPath, {
          path: { workspaceId: w, projectId: p },
          ...(cursor === undefined ? {} : { query: { cursor } }),
          signal,
        }),
        w,
        p,
      );
      if (!isSprintPage(value) || value.workspaceId !== w || value.projectId !== p)
        throw new SprintPlanningFailure(502);
      return value;
    },
    async mutate(
      command: SprintPlanningCommand,
      key: string,
      signal: AbortSignal,
    ): Promise<SprintPlanningResult> {
      const { workspaceId: w, projectId: p } = command;
      const path = { workspaceId: w, projectId: p };
      const response =
        command.type === 'configure-planning'
          ? await send('post', planningPath, {
              path,
              body: { expectedVersion: command.expectedVersion, ...command.settings },
              key,
              signal,
            })
          : command.type === 'create-sprint'
            ? await send('post', sprintsPath, {
                path,
                body: { expectedProjectVersion: command.expectedProjectVersion, ...command.fields },
                key,
                signal,
              })
            : await send('post', sprintPath, {
                path: { ...path, sprintId: command.sprintId },
                body: { expectedVersion: command.expectedVersion, ...command.fields },
                key,
                signal,
              });
      const s = command.type === 'edit-sprint' ? command.sprintId : undefined;
      const value = await read(response, w, p, s);
      if (command.type === 'configure-planning') {
        if (!isProjectPlanning(value) || !scoped(value, w, p, s))
          throw new SprintPlanningFailure(502);
        return value;
      }
      if (!isSprint(value) || !scoped(value, w, p, s)) throw new SprintPlanningFailure(502);
      return value;
    },
  };
}
