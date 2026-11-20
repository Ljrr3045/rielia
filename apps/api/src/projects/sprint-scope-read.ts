import { BadRequestException, ConflictException } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import {
  isPlanningSnapshot,
  isRecord,
  type PlanningSnapshot,
  type SprintScopePage,
  type SprintTotals,
  type PlanningHistoryPage,
  type PlanningHistoryItem,
} from '@rielia/contracts';
import { Prisma, type Project } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { identifier } from './project-task-input.js';
import { loadPeople } from './project-task-read.js';
import { sprintRow } from './sprint-read.js';
import { planningTasks, planningSnapshot } from './task-planning.js';

interface Anchor {
  a: string;
  o: string;
}
function paging(
  project: Project,
  kind: string,
  scope: string,
  entityVersion: number,
  cursor?: string,
) {
  const binding = {
    v: 1,
    kind,
    w: project.workspaceId,
    p: project.id,
    scope,
    projectVersion: project.version,
    taskRevision: project.taskRevision,
    sprintRevision: project.sprintRevision,
    entityVersion,
  };
  let anchor: Anchor | null = null;
  if (cursor !== undefined) {
    let saved: Record<string, unknown>;
    try {
      const v: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (
        !/^[A-Za-z0-9_-]{1,2048}$/.test(cursor) ||
        !isRecord(v) ||
        Object.keys(v).length !== 11 ||
        !identifier(v['a']) ||
        typeof v['o'] !== 'string' ||
        !/^[0-9]{1,20}$/.test(v['o'])
      )
        throw new Error();
      saved = v;
    } catch {
      throw new BadRequestException('Invalid planning cursor.');
    }
    if (
      BigInt(saved['o'] as string) > 9223372036854775807n ||
      saved['v'] !== 1 ||
      saved['kind'] !== kind ||
      saved['w'] !== project.workspaceId ||
      saved['p'] !== project.id ||
      saved['scope'] !== scope
    )
      throw new BadRequestException('Invalid planning cursor scope.');
    for (const k of [
      'projectVersion',
      'taskRevision',
      'sprintRevision',
      'entityVersion',
    ] as const) {
      if (!Number.isSafeInteger(saved[k]) || Number(saved[k]) < 1)
        throw new BadRequestException('Invalid planning cursor version.');
      if (saved[k] !== binding[k])
        throw new ConflictException({
          code: 'page-changed',
          message: 'Planning changed. Refresh before continuing.',
        });
    }
    anchor = { a: saved['a'] as string, o: saved['o'] as string };
  }
  return {
    anchor,
    next: (a: string, o: string) =>
      Buffer.from(JSON.stringify({ ...binding, a, o })).toString('base64url'),
  };
}
export function summarizeSnapshots(rows: PlanningSnapshot[]): SprintTotals {
  const totals: SprintTotals = {
    done: 0,
    canceled: 0,
    pending: 0,
    donePoints: 0,
    canceledPoints: 0,
    pendingPoints: 0,
    unestimated: 0,
    children: 0,
    archived: 0,
  };
  for (const row of rows) {
    if (row.archivedAt !== null) totals.archived++;
    if (row.parentTaskId !== null) {
      totals.children++;
      continue;
    }
    const category =
      row.status === 'done' ? 'done' : row.status === 'canceled' ? 'canceled' : 'pending';
    totals[category]++;
    if (row.estimatePoints === null) totals.unestimated++;
    else totals[`${category}Points`] += row.estimatePoints;
  }
  return totals;
}
async function aggregateTotals(
  tx: Transaction,
  project: Project,
  sprintId: string,
  start: boolean,
): Promise<SprintTotals> {
  const w = project.workspaceId,
    p = project.id;
  const source = start
    ? Prisma.sql`SELECT snapshot FROM sprint_start_reference WHERE "workspaceId"=${w} AND "projectId"=${p} AND "sprintId"=${sprintId}`
    : Prisma.sql`SELECT jsonb_build_object('status',t.status,'estimatePoints',t."estimatePoints",'parentTaskId',t."parentTaskId",'archivedAt',t."archivedAt") AS snapshot FROM sprint_participation v JOIN task t ON t."workspaceId"=v."workspaceId" AND t."projectId"=v."projectId" AND t.id=v."taskId" WHERE v."workspaceId"=${w} AND v."projectId"=${p} AND v."sprintId"=${sprintId} AND v."exitedAt" IS NULL`;
  const rows = await tx.$queryRaw<SprintTotals[]>(Prisma.sql`WITH scope AS (${source}) SELECT
    count(*) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status'='done')::int AS done,
    count(*) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status'='canceled')::int AS canceled,
    count(*) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status' NOT IN ('done','canceled'))::int AS pending,
    COALESCE(sum((snapshot->>'estimatePoints')::int) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status'='done'),0)::int AS "donePoints",
    COALESCE(sum((snapshot->>'estimatePoints')::int) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status'='canceled'),0)::int AS "canceledPoints",
    COALESCE(sum((snapshot->>'estimatePoints')::int) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'status' NOT IN ('done','canceled')),0)::int AS "pendingPoints",
    count(*) FILTER (WHERE snapshot->>'parentTaskId' IS NULL AND snapshot->>'estimatePoints' IS NULL)::int AS unestimated,
    count(*) FILTER (WHERE snapshot->>'parentTaskId' IS NOT NULL)::int AS children,
    count(*) FILTER (WHERE snapshot->>'archivedAt' IS NOT NULL)::int AS archived FROM scope`);
  return rows[0]!;
}
export async function sprintScope(
  tx: Transaction,
  project: Project,
  s: string,
  cursor?: string,
): Promise<SprintScopePage> {
  const sprint = await sprintRow(tx, project, s),
    where = { workspaceId: project.workspaceId, projectId: project.id, sprintId: s };
  const page = paging(project, 'sprint-scope', s, sprint.version, cursor);
  if (
    page.anchor &&
    !(await tx.sprintParticipation.findFirst({ where: { ...where, id: page.anchor.a } }))
  )
    throw new BadRequestException('Invalid planning anchor.');
  if (page.anchor && page.anchor.o !== '0')
    throw new BadRequestException('Invalid planning anchor.');
  const rows = await tx.sprintParticipation.findMany({
    where: { ...where, ...(page.anchor ? { id: { gt: page.anchor.a } } : {}) },
    orderBy: { id: 'asc' },
    take: 101,
  });
  const visible = rows.slice(0, 100);
  const tasks = new Map(
    (
      await planningTasks(
        tx,
        project,
        visible.map((v) => v.taskId),
      )
    ).map((t) => [t.id, planningSnapshot(t)]),
  );
  const references = new Map(
    (
      await tx.sprintStartReference.findMany({
        where: { ...where, participationId: { in: visible.map((v) => v.id) } },
      })
    ).map((r) => [r.participationId, r.snapshot as unknown as PlanningSnapshot]),
  );
  return {
    ...where,
    taskRevision: project.taskRevision,
    sprintRevision: project.sprintRevision,
    sprintVersion: sprint.version,
    items: visible.map((v) => ({
      id: v.id,
      taskId: v.taskId,
      enteredAt: v.enteredAt.toISOString(),
      enteredOrdinal: v.enteredOrdinal,
      entry: v.entrySnapshot as unknown as PlanningSnapshot,
      exitedAt: v.exitedAt?.toISOString() ?? null,
      exitedOrdinal: v.exitedOrdinal,
      exitReason: v.exitReason as 'removed' | 'transferred' | null,
      exit: v.exitSnapshot as unknown as PlanningSnapshot | null,
      current: tasks.get(v.taskId)!,
      start: references.get(v.id) ?? null,
    })),
    total: await tx.sprintParticipation.count({ where }),
    removed: await tx.sprintParticipation.count({ where: { ...where, exitedAt: { not: null } } }),
    currentTotals: await aggregateTotals(tx, project, s, false),
    startTotals: await aggregateTotals(tx, project, s, true),
    nextCursor: rows.length > 100 ? page.next(visible.at(-1)!.id, '0') : null,
  };
}
/** Scoped union projects retained legacy Sprint activities exactly once. Task history orders by committed outbox sequence. */
export async function planningHistory(
  tx: Transaction,
  project: Project,
  target: { sprintId: string } | { taskId: string },
  cursor?: string,
): Promise<PlanningHistoryPage> {
  const w = project.workspaceId,
    p = project.id;
  const s = 'sprintId' in target ? target.sprintId : null,
    t = 'taskId' in target ? target.taskId : null;
  const entityVersion = s
    ? (await sprintRow(tx, project, s)).version
    : (
        await tx.task.findUniqueOrThrow({
          where: { workspaceId_projectId_id: { workspaceId: w, projectId: p, id: t! } },
          select: { version: true },
        })
      ).version;
  const page = paging(
    project,
    s ? 'sprint-history' : 'task-sprint-history',
    s ?? t!,
    entityVersion,
    cursor,
  );
  const filter = s ? Prisma.sql`e."sprintId"=${s}` : Prisma.sql`e."taskId"=${t}`;
  const legacy = s
    ? Prisma.sql`a."sprintId"=${s} AND a.action IN ('create-sprint','edit-sprint')`
    : Prisma.sql`a."taskId"=${t} AND a.action='estimate-task' AND a.changes->0->'planningBefore'->'estimatePoints' IS DISTINCT FROM a.changes->0->'planningAfter'->'estimatePoints'`;
  const ordering = s ? Prisma.sql`e.ordinal::bigint` : Prisma.sql`o.sequence`;
  const oldOrder = s ? Prisma.sql`a."entityVersion"::bigint` : Prisma.sql`o.sequence`;
  const base = Prisma.sql`SELECT e.id,'event'::text AS source,${ordering} AS ordering FROM sprint_scope_event e JOIN outbox_event o ON o."workspaceId"=e."workspaceId" AND o."activityId"=e."activityId" WHERE e."workspaceId"=${w} AND e."projectId"=${p} AND ${filter}
    UNION ALL SELECT a.id,'activity'::text AS source,${oldOrder} AS ordering FROM activity_event a JOIN outbox_event o ON o."workspaceId"=a."workspaceId" AND o."activityId"=a.id WHERE a."workspaceId"=${w} AND a."projectId"=${p} AND ${legacy} AND NOT EXISTS(SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=a."workspaceId" AND e."projectId"=a."projectId" AND e."activityId"=a.id)`;
  if (page.anchor) {
    const anchor = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`WITH items AS (${base}) SELECT id FROM items WHERE id=${page.anchor.a} AND ordering=${BigInt(page.anchor.o)}`,
    );
    if (!anchor.length) throw new BadRequestException('Invalid planning anchor.');
  }
  const result = await tx.$queryRaw<Array<{ id: string; source: string; ordering: bigint }>>(
    Prisma.sql`WITH items AS (${base}) SELECT * FROM items ${page.anchor ? Prisma.sql`WHERE (ordering,id)>(${BigInt(page.anchor.o)},${page.anchor.a})` : Prisma.empty} ORDER BY ordering,id LIMIT 101`,
  );
  const count = await tx.$queryRaw<Array<{ total: number }>>(
    Prisma.sql`WITH items AS (${base}) SELECT count(*)::int AS total FROM items`,
  );
  const visible = result.slice(0, 100);
  const events = await tx.sprintScopeEvent.findMany({
    where: {
      workspaceId: w,
      projectId: p,
      id: { in: visible.filter((x) => x.source === 'event').map((x) => x.id) },
    },
  });
  const activities = await tx.activityEvent.findMany({
    where: {
      workspaceId: w,
      projectId: p,
      id: {
        in: [
          ...events.map((e) => e.activityId),
          ...visible.filter((x) => x.source === 'activity').map((x) => x.id),
        ],
      },
    },
  });
  const people = await loadPeople(
    tx,
    w,
    activities.map((a) => a.actorPrincipalId),
  );
  const eventMap = new Map(events.map((e) => [e.id, e])),
    activityMap = new Map(activities.map((a) => [a.id, a]));
  const items: PlanningHistoryItem[] = visible.map((row) => {
    const event = eventMap.get(row.id),
      a = activityMap.get(event?.activityId ?? row.id)!;
    const change = Array.isArray(a.changes) ? a.changes[0] : null;
    const changes = isRecord(change) ? change : {};
    return {
      id: row.id,
      sprintId: event?.sprintId ?? a.sprintId,
      taskId: event?.taskId ?? a.taskId,
      participationId: event?.participationId ?? null,
      ordinal: event?.ordinal ?? a.entityVersion,
      kind: (event?.kind as PlanningHistoryItem['kind']) ?? (s ? 'metadata' : 'estimate'),
      action: a.action,
      occurredAt: (event?.occurredAt ?? a.createdAt).toISOString(),
      before:
        (event?.beforeSnapshot as unknown as PlanningSnapshot | null) ??
        (isPlanningSnapshot(changes['planningBefore']) ? changes['planningBefore'] : null),
      after:
        (event?.afterSnapshot as unknown as PlanningSnapshot | null) ??
        (isPlanningSnapshot(changes['planningAfter']) ? changes['planningAfter'] : null),
      actor: people.get(a.actorPrincipalId)!,
      provenance: {
        actorPrincipalId: a.actorPrincipalId,
        executionMode: a.executionMode as PlanningHistoryItem['provenance']['executionMode'],
        source: a.source as PlanningHistoryItem['provenance']['source'],
        grantId: a.grantId,
      },
    };
  });
  return {
    workspaceId: w,
    projectId: p,
    sprintId: s,
    taskId: t,
    taskRevision: project.taskRevision,
    sprintRevision: project.sprintRevision,
    total: count[0]!.total,
    items,
    nextCursor:
      result.length > 100
        ? page.next(visible.at(-1)!.id, visible.at(-1)!.ordering.toString())
        : null,
  };
}
