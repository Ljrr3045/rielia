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
  const root = (w: string, p: string) =>
    `workspaces/${encodeURIComponent(w)}/projects/${encodeURIComponent(p)}`;
  const scoped = (v: SprintPlanningResult, w: string, p: string, s?: string) =>
    v.workspaceId === w && v.projectId === p && (s === undefined || ('id' in v && v.id === s));
  async function request(
    path: string,
    w: string,
    p: string,
    signal: AbortSignal,
    body?: unknown,
    key?: string,
    s?: string,
  ): Promise<unknown> {
    const response = await fetch(
      options.baseURL ? new URL(`/api/v1/${path}`, options.baseURL) : `/api/v1/${path}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(options.timeout ?? 15000)]),
        ...(body === undefined
          ? {}
          : {
              headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key! },
              body: JSON.stringify(body),
            }),
      },
    );
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
      const value = await request(`${root(w, p)}/planning`, w, p, signal);
      if (!isProjectPlanning(value) || !scoped(value, w, p)) throw new SprintPlanningFailure(502);
      return value;
    },
    async sprint(w: string, p: string, s: string, signal: AbortSignal): Promise<Sprint> {
      const value = await request(
        `${root(w, p)}/sprints/${encodeURIComponent(s)}`,
        w,
        p,
        signal,
        undefined,
        undefined,
        s,
      );
      if (!isSprint(value) || !scoped(value, w, p, s)) throw new SprintPlanningFailure(502);
      return value;
    },
    async sprints(w: string, p: string, signal: AbortSignal, cursor?: string): Promise<SprintPage> {
      const value = await request(
        `${root(w, p)}/sprints${cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`}`,
        w,
        p,
        signal,
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
      const path =
        command.type === 'configure-planning'
          ? `${root(w, p)}/planning`
          : `${root(w, p)}/sprints${command.type === 'edit-sprint' ? `/${encodeURIComponent(command.sprintId)}` : ''}`;
      const body =
        command.type === 'configure-planning'
          ? { expectedVersion: command.expectedVersion, ...command.settings }
          : command.type === 'create-sprint'
            ? { expectedProjectVersion: command.expectedProjectVersion, ...command.fields }
            : { expectedVersion: command.expectedVersion, ...command.fields };
      const s = command.type === 'edit-sprint' ? command.sprintId : undefined;
      const value = await request(path, w, p, signal, body, key, s);
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
