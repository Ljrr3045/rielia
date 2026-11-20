import {
  isRecord,
  isSprint,
  isTaskPlanning,
  isSprintScopePage,
  isPlanningHistoryPage,
  isSprintTransitionResult,
  type TaskPlanning,
  type Sprint,
  type SprintScopePage,
  type PlanningHistoryPage,
  type SprintTransitionResult,
  type StartSprintInput,
  type SetTaskSprintInput,
} from '@rielia/contracts';

export class TaskPlanningFailure extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly current: TaskPlanning | Sprint | null;
  readonly requestId: string | null;
  constructor(
    status: number,
    code: string | null = null,
    current: TaskPlanning | Sprint | null = null,
    requestId: string | null = null,
  ) {
    super('Task planning request failed.');
    this.status = status;
    this.code = code;
    this.current = current;
    this.requestId = requestId;
  }
}
/** Transport only. The caller retains the exact key/body for explicit retry. No automatic mutation retry. */
export function createTaskPlanningTransport(options: { baseURL?: string; timeout?: number } = {}) {
  const root = (w: string, p: string) =>
    `workspaces/${encodeURIComponent(w)}/projects/${encodeURIComponent(p)}`;
  const task = (t: string) => `tasks/${encodeURIComponent(t)}`;
  const sprint = (s: string) => `sprints/${encodeURIComponent(s)}`;
  const scoped = (v: { workspaceId: string; projectId: string }, w: string, p: string) =>
    v.workspaceId === w && v.projectId === p;
  async function request<T>(
    w: string,
    p: string,
    path: string,
    signal: AbortSignal,
    valid: (v: unknown) => v is T,
    body?: unknown,
    key?: string,
    entity?: { taskId?: string; sprintId?: string },
  ): Promise<T> {
    const url = `/api/v1/${root(w, p)}/${path}`;
    const response = await fetch(options.baseURL ? new URL(url, options.baseURL) : url, {
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
    });
    const requestId = response.headers.get('x-request-id');
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new TaskPlanningFailure(response.ok ? 502 : response.status, null, null, requestId);
    }
    const matches = (v: TaskPlanning | Sprint) =>
      scoped(v, w, p) &&
      (entity?.taskId === undefined || ('taskId' in v && v.taskId === entity.taskId)) &&
      (entity?.sprintId === undefined || ('id' in v && v.id === entity.sprintId));
    if (!response.ok) {
      const current =
        isRecord(value) &&
        (isTaskPlanning(value['current']) || isSprint(value['current'])) &&
        matches(value['current'])
          ? value['current']
          : null;
      throw new TaskPlanningFailure(
        response.status,
        isRecord(value) && typeof value['code'] === 'string' ? value['code'] : null,
        current,
        requestId,
      );
    }
    if (!valid(value)) throw new TaskPlanningFailure(502, null, null, requestId);
    return value;
  }
  const query = (cursor?: string) =>
    cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`;
  const transition =
    (
      w: string,
      p: string,
      entity: { taskId?: string; sprintId?: string },
      type: 'start-sprint' | 'set-task-sprint',
    ) =>
    (v: unknown): v is SprintTransitionResult =>
      isSprintTransitionResult(v) &&
      v.operation.type === type &&
      scoped(v.current, w, p) &&
      (entity.taskId === undefined ||
        ('taskId' in v.current && v.current.taskId === entity.taskId)) &&
      (entity.sprintId === undefined ||
        ('id' in v.current &&
          v.current.id === entity.sprintId &&
          v.operation.sprintId === entity.sprintId));
  return {
    planning(w: string, p: string, t: string, signal: AbortSignal) {
      return request(
        w,
        p,
        `${task(t)}/planning`,
        signal,
        (v): v is TaskPlanning => isTaskPlanning(v) && scoped(v, w, p) && v.taskId === t,
        undefined,
        undefined,
        { taskId: t },
      );
    },
    estimate(
      w: string,
      p: string,
      t: string,
      input: { expectedVersion: number; estimatePoints: number | null },
      key: string,
      signal: AbortSignal,
    ) {
      return request(
        w,
        p,
        `${task(t)}/planning`,
        signal,
        (v): v is TaskPlanning => isTaskPlanning(v) && scoped(v, w, p) && v.taskId === t,
        input,
        key,
        { taskId: t },
      );
    },
    setSprint(
      w: string,
      p: string,
      t: string,
      input: SetTaskSprintInput,
      key: string,
      signal: AbortSignal,
    ) {
      return request(
        w,
        p,
        `${task(t)}/sprint`,
        signal,
        (v): v is SprintTransitionResult =>
          transition(w, p, { taskId: t }, 'set-task-sprint')(v) &&
          v.operation.exitedVisitId === input.expectedCurrentParticipationId &&
          (input.targetSprintId === null
            ? input.expectedCurrentParticipationId !== null && v.operation.enteredVisitId === null
            : v.operation.sprintId === input.targetSprintId && v.operation.enteredVisitId !== null),
        input,
        key,
        { taskId: t },
      );
    },
    start(
      w: string,
      p: string,
      s: string,
      input: StartSprintInput,
      key: string,
      signal: AbortSignal,
    ) {
      return request(
        w,
        p,
        `${sprint(s)}/start`,
        signal,
        transition(w, p, { sprintId: s }, 'start-sprint'),
        input,
        key,
        { sprintId: s },
      );
    },
    scope(w: string, p: string, s: string, signal: AbortSignal, cursor?: string) {
      return request(
        w,
        p,
        `${sprint(s)}/scope${query(cursor)}`,
        signal,
        (v): v is SprintScopePage => isSprintScopePage(v) && scoped(v, w, p) && v.sprintId === s,
      );
    },
    sprintHistory(w: string, p: string, s: string, signal: AbortSignal, cursor?: string) {
      return request(
        w,
        p,
        `${sprint(s)}/history${query(cursor)}`,
        signal,
        (v): v is PlanningHistoryPage =>
          isPlanningHistoryPage(v) && scoped(v, w, p) && v.sprintId === s && v.taskId === null,
      );
    },
    taskHistory(w: string, p: string, t: string, signal: AbortSignal, cursor?: string) {
      return request(
        w,
        p,
        `${task(t)}/sprint-history${query(cursor)}`,
        signal,
        (v): v is PlanningHistoryPage =>
          isPlanningHistoryPage(v) && scoped(v, w, p) && v.taskId === t && v.sprintId === null,
      );
    },
  };
}
