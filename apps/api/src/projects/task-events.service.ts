import { HttpException, Inject, Injectable, ServiceUnavailableException, type OnModuleDestroy } from '@nestjs/common';
import type { NodeResponse } from '@nestjs/platform-node';
import { createHash, randomUUID } from 'node:crypto';
import type { TaskInvalidation } from '@rielia/contracts';
import { PrincipalService, type VerifiedExecution } from '../principals/principal.service.js';
import { ProjectTaskService } from './project-task.service.js';

interface Position { binding: string; sequence: bigint; policy: string; expires: number }
/** Single-replica bounded invalidation reader; never dispatches business effects. */
@Injectable()
export class TaskEventsService implements OnModuleDestroy {
  private readonly handles = new Map<string, Position>();
  private readonly connections = new Map<NodeResponse, { binding: string; close: () => void }>();
  constructor(@Inject(ProjectTaskService) private readonly tasks: ProjectTaskService, @Inject(PrincipalService) private readonly principals: PrincipalService) {}
  onModuleDestroy() { for (const connection of this.connections.values()) connection.close(); this.handles.clear(); }
  private handle(position: Omit<Position, 'expires'>) {
    const now = Date.now();
    for (const [key, value] of this.handles) if (value.expires <= now) this.handles.delete(key);
    const own = [...this.handles].filter(([, value]) => value.binding === position.binding);
    while (own.length >= 32) this.handles.delete(own.shift()![0]);
    while (this.handles.size >= 512) this.handles.delete(this.handles.keys().next().value!);
    const key = randomUUID(); this.handles.set(key, { ...position, expires: now + 60000 }); return key;
  }
  async serve(context: VerifiedExecution, workspaceId: string, response: NodeResponse, resume?: string): Promise<void> {
    const binding = this.principals.webSubscriptionKey(context);
    if (this.connections.size >= 32 || [...this.connections.values()].filter(c => c.binding === binding).length >= 4) throw new ServiceUnavailableException('Stream capacity is unavailable.');
    const previous = resume ? this.handles.get(resume) : undefined;
    let position = previous?.binding === binding && previous.expires > Date.now() ? { ...previous } : null;
    let closed = false; let timer: ReturnType<typeof setTimeout> | undefined; let heartbeat = 0; const started = Date.now();
    const close = () => { if (closed) return; closed = true; clearTimeout(timer); this.connections.delete(response); response.off('close', close); if (!response.destroyed) response.end(); };
    // Reserve synchronously before the first await so concurrent opens are capped.
    this.connections.set(response, { binding, close }); response.once('close', close);
    const send = (data: TaskInvalidation, sequence?: bigint, policy?: string) => {
      if (closed || response.destroyed) { close(); return; }
      const token = sequence === undefined || policy === undefined ? '' : `id: ${this.handle({ binding, sequence, policy })}\n`;
      // No producer queue: a slow peer gets disconnected at Node's bounded high
      // water mark and resumes or performs a full refresh on reconnect.
      if (!response.write(`${token}event: update\ndata: ${JSON.stringify(data)}\n\n`)) close();
    };
    const poll = async (initial: boolean) => {
      await this.tasks.discoveryRead(context, workspaceId, async (tx, actor, canWrite, projects) => {
        if (closed) return;
        const policy = createHash('sha256').update(JSON.stringify([actor.actorPrincipalId, actor.role, canWrite, projects.map(p => [p.id, p.version])])).digest('hex');
        const where = { workspaceId, type: 'domain.activity', activity: { projectId: { in: projects.map(p => p.id) } } };
        const latest = (await tx.outboxEvent.aggregate({ where, _max: { sequence: true } }))._max.sequence ?? 0n;
        if (initial) { heartbeat = Date.now(); response.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); response.setHeader('Cache-Control', 'no-store, no-transform'); response.setHeader('X-Accel-Buffering', 'no'); response.flushHeaders(); }
        if (!position || position.policy !== policy || position.sequence > latest) {
          position = { binding, sequence: latest, policy, expires: Date.now() + 60000 }; send({ type: 'reset' }, latest, policy); return;
        }
        const events = await tx.outboxEvent.findMany({ where: { ...where, sequence: { gt: position.sequence } }, orderBy: { sequence: 'asc' }, take: 101,
          select: { sequence: true, activity: { select: { projectId: true, taskId: true, entityVersion: true } } } });
        if (events.length > 100) { position.sequence = latest; send({ type: 'reset' }, latest, policy); return; }
        for (const row of events) {
          if (closed) break;
          const event = row.activity; position.sequence = row.sequence;
          send({ type: 'invalidate', entity: event.taskId ? 'task' : 'project', id: event.taskId ?? event.projectId, projectId: event.projectId, version: event.entityVersion }, row.sequence, policy);
        }
        if (initial || Date.now() - heartbeat >= 15000) { heartbeat = Date.now(); send({ type: 'heartbeat' }, position.sequence, policy); }
      });
    };
    try { await poll(true); } catch (error) {
      if (response.headersSent) { close(); return; }
      closed = true; this.connections.delete(response); response.off('close', close); throw error;
    }
    const tick = async () => {
      if (closed) return;
      try {
        await poll(false);
        // Renew the web session through a fresh HTTP handshake once a minute.
        if (Date.now() - started >= 60000) { close(); return; }
      } catch (error) {
        if (error instanceof HttpException && [401, 403].includes(error.getStatus())) send({ type: 'denied', reason: error.getStatus() === 401 ? 'signed-out' : 'forbidden' });
        close(); return;
      }
      if (!closed) timer = setTimeout(() => { void tick(); }, 1000);
    };
    if (!closed) timer = setTimeout(() => { void tick(); }, 1000);
  }
}
