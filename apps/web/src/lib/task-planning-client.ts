import {
  isRecord,
  isSprint,
  isTaskPlanning,
  isSprintScopePage,
  isPlanningHistoryPage,
  isSprintTransitionResult,
  type TaskPlanning,
  type EstimateTaskInput,
  type Sprint,
  type SprintScopePage,
  type PlanningHistoryPage,
  type SprintTransitionResult,
  type StartSprintInput,
  isSprintClosePreview,
  isSprintClosure,
  isSprintClosingOutcomePage,
  isSprintCloseResult,
  type SprintClosePreview,
  type SprintClosure,
  type SprintClosingOutcomePage,
  type SprintCloseResult,
} from '@rielia/contracts';
import { createContractRequest, type RequestInput } from './api-contract-client.ts';

const projectPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}';
const taskPath = `${projectPath}/tasks/{taskId}`;
const sprintPath = `${projectPath}/sprints/{sprintId}`;
type CloseSprintInput = RequestInput<'post', `${typeof sprintPath}/close`>['body'];
type SetTaskSprintInput = RequestInput<'post', `${typeof taskPath}/sprint`>['body'];
// G07's unchanged binding refinement checks this relation on the original wire value.
type AdmittedClosePreview = SprintClosePreview & CloseSprintInput;

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
  const send = createContractRequest(options);
  const scoped = (v: { workspaceId: string; projectId: string }, w: string, p: string) =>
    v.workspaceId === w && v.projectId === p;
  async function read<T>(
    response: Response,
    w: string,
    p: string,
    valid: (v: unknown) => v is T,
    entity?: { taskId?: string; sprintId?: string },
  ): Promise<T> {
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
    async closePreview(
      w: string,
      p: string,
      s: string,
      destination: string | null,
      signal: AbortSignal,
      cursor?: string,
    ) {
      return read(
        await send('get', `${sprintPath}/close-preview`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          query: {
            ...(destination !== null ? { destination } : {}),
            ...(cursor !== undefined ? { cursor } : {}),
          },
          signal,
        }),
        w,
        p,
        (v): v is AdmittedClosePreview =>
          isSprintClosePreview(v) &&
          scoped(v, w, p) &&
          v.sprintId === s &&
          v.destination === destination,
      );
    },
    async close(
      w: string,
      p: string,
      s: string,
      input: CloseSprintInput,
      key: string,
      signal: AbortSignal,
    ) {
      return read(
        await send('post', `${sprintPath}/close`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
          body: input,
          key,
        }),
        w,
        p,
        (v): v is SprintCloseResult =>
          isSprintCloseResult(v) &&
          scoped(v.current, w, p) &&
          v.operation.sprintId === s &&
          v.closure.destination === input.destination &&
          v.closure.previewHash === input.previewHash &&
          v.closure.previewSchema === input.previewSchema &&
          v.closure.sourceOrdinal === input.expectedVersion + 1 &&
          v.closure.targetOrdinal ===
            (input.expectedTargetVersion === null ? null : input.expectedTargetVersion + 1),
        { sprintId: s },
      );
    },
    async closure(w: string, p: string, s: string, signal: AbortSignal) {
      return read(
        await send('get', `${sprintPath}/closure`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
        }),
        w,
        p,
        (v): v is SprintClosure => isSprintClosure(v) && scoped(v, w, p) && v.sprintId === s,
      );
    },
    async outcomes(w: string, p: string, s: string, signal: AbortSignal, cursor?: string) {
      return read(
        await send('get', `${sprintPath}/closure/outcomes`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
          ...(cursor === undefined ? {} : { query: { cursor } }),
        }),
        w,
        p,
        (v): v is SprintClosingOutcomePage =>
          isSprintClosingOutcomePage(v) && scoped(v, w, p) && v.sprintId === s,
      );
    },
    async planning(w: string, p: string, t: string, signal: AbortSignal) {
      return read(
        await send('get', `${taskPath}/planning`, {
          path: { workspaceId: w, projectId: p, taskId: t },
          signal,
        }),
        w,
        p,
        (v): v is TaskPlanning => isTaskPlanning(v) && scoped(v, w, p) && v.taskId === t,
        { taskId: t },
      );
    },
    async estimate(
      w: string,
      p: string,
      t: string,
      input: EstimateTaskInput,
      key: string,
      signal: AbortSignal,
    ) {
      return read(
        await send('post', `${taskPath}/planning`, {
          path: { workspaceId: w, projectId: p, taskId: t },
          signal,
          body: input,
          key,
        }),
        w,
        p,
        (v): v is TaskPlanning => isTaskPlanning(v) && scoped(v, w, p) && v.taskId === t,
        { taskId: t },
      );
    },
    async setSprint(
      w: string,
      p: string,
      t: string,
      input: SetTaskSprintInput,
      key: string,
      signal: AbortSignal,
    ) {
      return read(
        await send('post', `${taskPath}/sprint`, {
          path: { workspaceId: w, projectId: p, taskId: t },
          signal,
          body: input,
          key,
        }),
        w,
        p,
        (v): v is SprintTransitionResult =>
          transition(w, p, { taskId: t }, 'set-task-sprint')(v) &&
          v.operation.exitedVisitId === input.expectedCurrentParticipationId &&
          (input.targetSprintId === null
            ? input.expectedCurrentParticipationId !== null && v.operation.enteredVisitId === null
            : v.operation.sprintId === input.targetSprintId && v.operation.enteredVisitId !== null),
        { taskId: t },
      );
    },
    async start(
      w: string,
      p: string,
      s: string,
      input: StartSprintInput,
      key: string,
      signal: AbortSignal,
    ) {
      return read(
        await send('post', `${sprintPath}/start`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
          body: input,
          key,
        }),
        w,
        p,
        transition(w, p, { sprintId: s }, 'start-sprint'),
        { sprintId: s },
      );
    },
    async scope(w: string, p: string, s: string, signal: AbortSignal, cursor?: string) {
      return read(
        await send('get', `${sprintPath}/scope`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
          ...(cursor === undefined ? {} : { query: { cursor } }),
        }),
        w,
        p,
        (v): v is SprintScopePage => isSprintScopePage(v) && scoped(v, w, p) && v.sprintId === s,
      );
    },
    async sprintHistory(w: string, p: string, s: string, signal: AbortSignal, cursor?: string) {
      return read(
        await send('get', `${sprintPath}/history`, {
          path: { workspaceId: w, projectId: p, sprintId: s },
          signal,
          ...(cursor === undefined ? {} : { query: { cursor } }),
        }),
        w,
        p,
        (v): v is PlanningHistoryPage =>
          isPlanningHistoryPage(v) && scoped(v, w, p) && v.sprintId === s && v.taskId === null,
      );
    },
    async taskHistory(w: string, p: string, t: string, signal: AbortSignal, cursor?: string) {
      return read(
        await send('get', `${taskPath}/sprint-history`, {
          path: { workspaceId: w, projectId: p, taskId: t },
          signal,
          ...(cursor === undefined ? {} : { query: { cursor } }),
        }),
        w,
        p,
        (v): v is PlanningHistoryPage =>
          isPlanningHistoryPage(v) && scoped(v, w, p) && v.taskId === t && v.sprintId === null,
      );
    },
  };
}
