import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import type { LimitedRole, MemberState, Page, WorkspaceInvitation, WorkspaceMember, WorkspaceSummary } from '@rielia/contracts';
import type { Invitation, Prisma } from '../generated/prisma/client.js';
import { PrincipalService, type HumanActor, type Transaction } from '../principals/principal.service.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const limitedRoles = ['admin', 'member', 'viewer'];
const states = ['active', 'suspended', 'revoked'];
const oneOf = (value: unknown, values: string[]): value is string => typeof value === 'string' && values.includes(value);
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
function object(value: unknown, allowed: string[], required = allowed): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))
    || required.some(key => !(key in value))) throw new BadRequestException('Invalid workspace request.');
  return value as Record<string, unknown>;
}
function name(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 200) throw new BadRequestException('Name must contain 1 to 200 characters.');
  return value.trim();
}
function email(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new BadRequestException('A recipient email is required.');
  return value.trim().toLowerCase();
}
function page<T>(items: T[], total: number, cursor: (value: T) => string): Page<T> {
  const visible = items.slice(0, 100);
  return { items: visible, total, nextCursor: items.length > 100 ? cursor(visible[visible.length - 1]!) : null };
}
function invitation(row: Invitation): WorkspaceInvitation {
  return { id: row.id, workspaceId: row.workspaceId, recipientEmail: row.recipientEmail, role: row.role as LimitedRole,
    issuerPrincipalId: row.issuerPrincipalId, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt.toISOString(),
    state: row.consumedAt ? 'accepted' : row.revokedAt ? 'revoked' : row.expiresAt <= new Date() ? 'expired' : 'pending' };
}

@Injectable()
export class WorkspaceService {
  constructor(@Inject(PrincipalService) private readonly principals: PrincipalService) {}

  private async receipt<T>(tx: Transaction, actor: HumanActor, key: string, route: string, input: unknown, work: () => Promise<T>, secret = false): Promise<T> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
    const normalized = input && typeof input === 'object' ? Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b))) : input;
    const requestHash = digest(JSON.stringify([route, normalized]));
    const previous = await tx.workspaceOperation.findUnique({ where: { actorPrincipalId_key: { actorPrincipalId: actor.principalId, key } } });
    if (previous) {
      if (previous.requestHash !== requestHash) throw new ConflictException('Idempotency key belongs to another request.');
      if (secret) throw new ConflictException({ code: 'invitation-link-unavailable', message: 'Link was already issued. Revoke it and create a new invitation.' });
      if (route === 'accept-invitation' || route === 'create-workspace') {
        if (route === 'accept-invitation') {
          const accepted = await tx.invitation.findUnique({ where: { tokenHash: (input as { tokenHash: string }).tokenHash } });
          if (!accepted || !actor.emailVerified || email(actor.email) !== accepted.recipientEmail) throw new ForbiddenException('Invitation acceptance is denied.');
        }
        const saved = previous.response as { id?: string };
        if (!saved.id) throw new ConflictException('Workspace receipt is unavailable.');
        return await this.summary(tx, actor, saved.id) as T;
      }
      return previous.response as T;
    }
    const result = await work();
    await tx.workspaceOperation.create({ data: { actorPrincipalId: actor.principalId, key, requestHash,
      response: JSON.parse(JSON.stringify(secret ? { issued: true } : result)) as Prisma.InputJsonValue } });
    return result;
  }

  private async summary(tx: Transaction, actor: HumanActor, workspaceId: string): Promise<WorkspaceSummary> {
    const membership = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId, principalId: actor.principalId } }, include: { workspace: true } });
    if (!membership || membership.state !== 'active') throw new ForbiddenException('Workspace access is denied.');
    return { id: membership.workspaceId, name: membership.workspace.name, ownerPrincipalId: membership.workspace.ownerPrincipalId,
      role: membership.role as WorkspaceSummary['role'], createdAt: membership.workspace.createdAt.toISOString() };
  }

  private async member(tx: Transaction, workspaceId: string, principalId: string, version?: number): Promise<WorkspaceMember> {
    const row = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId, principalId } }, include: { principal: true } });
    if (!row) throw new ForbiddenException('Member access is denied.');
    if (version !== undefined && version !== row.version) throw new ConflictException('Member changed. Refresh before saving.');
    return { principalId, kind: row.principal.kind as 'human' | 'agent', name: row.principal.displayName,
      role: row.role as WorkspaceMember['role'], state: row.state as MemberState, principalState: row.principal.state as MemberState,
      custodianPrincipalId: row.principal.custodianPrincipalId, version: row.version };
  }

  create(headers: IncomingHttpHeaders, key: string, payload: unknown) {
    const input = object(payload, ['name']); const title = name(input['name']);
    return this.principals.workspaceOperation(headers, null, 'read', (tx, actor) => this.receipt(tx, actor, key, 'create-workspace', { name: title }, async () => {
      const workspaceId = randomUUID();
      await tx.workspace.create({ data: { id: workspaceId, name: title, ownerPrincipalId: actor.principalId } });
      await this.principals.createMembership(tx, workspaceId, actor.principalId, 'owner');
      return this.summary(tx, actor, workspaceId);
    }));
  }

  list(headers: IncomingHttpHeaders, cursor?: string) {
    return this.principals.workspaceOperation(headers, null, 'read', async (tx, actor) => {
      const where = { principalId: actor.principalId, state: 'active' };
      const rows = await tx.membership.findMany({ where: { ...where, ...(cursor ? { workspaceId: { gt: cursor } } : {}) }, orderBy: { workspaceId: 'asc' }, take: 101, include: { workspace: true } });
      return page(rows.map(row => ({ id: row.workspaceId, name: row.workspace.name, ownerPrincipalId: row.workspace.ownerPrincipalId,
        role: row.role as WorkspaceSummary['role'], createdAt: row.workspace.createdAt.toISOString() })), await tx.membership.count({ where }), row => row.id);
    }, true);
  }

  detail(headers: IncomingHttpHeaders, workspaceId: string) {
    return this.principals.workspaceOperation(headers, workspaceId, 'read', (tx, actor) => this.summary(tx, actor, workspaceId), true);
  }

  members(headers: IncomingHttpHeaders, workspaceId: string, cursor?: string) {
    return this.principals.workspaceOperation(headers, workspaceId, 'read', async tx => {
      const rows = await tx.membership.findMany({ where: { workspaceId, ...(cursor ? { principalId: { gt: cursor } } : {}) }, orderBy: { principalId: 'asc' }, take: 101 });
      const items = await Promise.all(rows.map(row => this.member(tx, workspaceId, row.principalId)));
      return page(items, await tx.membership.count({ where: { workspaceId } }), row => row.principalId);
    }, true);
  }

  invitations(headers: IncomingHttpHeaders, workspaceId: string, cursor?: string) {
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', async tx => {
      const rows = await tx.invitation.findMany({ where: { workspaceId, ...(cursor ? { id: { gt: cursor } } : {}) }, orderBy: { id: 'asc' }, take: 101 });
      return page(rows.map(invitation), await tx.invitation.count({ where: { workspaceId } }), row => row.id);
    }, true);
  }

  invite(headers: IncomingHttpHeaders, workspaceId: string, key: string, payload: unknown) {
    const input = object(payload, ['recipientEmail', 'role']); const recipientEmail = email(input['recipientEmail']);
    if (!oneOf(input['role'], limitedRoles)) throw new BadRequestException('Invalid invitation role.');
    const role = input['role'] as LimitedRole;
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', (tx, actor) => this.receipt(tx, actor, key, `invite/${workspaceId}`, { recipientEmail, role }, async () => {
      // Any historic membership conflicts, including terminal revoked records.
      const existing = await tx.membership.findFirst({ where: { workspaceId, principal: { user: { email: { equals: recipientEmail, mode: 'insensitive' } } } } });
      if (existing) throw new ConflictException('Recipient already has a membership. Rejoining is not supported.');
      await tx.invitation.updateMany({ where: { workspaceId, recipientEmail, consumedAt: null, revokedAt: null, expiresAt: { lte: new Date() } }, data: { revokedAt: new Date() } });
      const token = randomBytes(32).toString('base64url');
      const row = await tx.invitation.create({ data: { id: randomUUID(), workspaceId, issuerPrincipalId: actor.principalId,
        recipientEmail, role, tokenHash: digest(token), expiresAt: new Date(Date.now() + 7 * 86400000) } });
      return { invitation: invitation(row), token };
    }, true));
  }

  revokeInvitation(headers: IncomingHttpHeaders, workspaceId: string, invitationId: string, key: string, payload: unknown) {
    object(payload, []);
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', (tx, actor) => this.receipt(tx, actor, key, `revoke/${workspaceId}/${invitationId}`, {}, async () => {
      const row = await tx.invitation.findFirst({ where: { id: invitationId, workspaceId } });
      if (!row) throw new ForbiddenException('Invitation access is denied.');
      if (row.consumedAt) throw new ConflictException('Invitation is already accepted.');
      return invitation(row.revokedAt ? row : await tx.invitation.update({ where: { id: row.id }, data: { revokedAt: new Date() } }));
    }));
  }

  accept(headers: IncomingHttpHeaders, key: string, payload: unknown) {
    const input = object(payload, ['token']);
    if (typeof input['token'] !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(input['token'])) throw new BadRequestException('Invalid invitation token.');
    const tokenHash = digest(input['token']);
    return this.principals.workspaceOperation(headers, null, 'read', (tx, actor) => this.receipt(tx, actor, key, 'accept-invitation', { tokenHash }, async () => {
      const row = await tx.invitation.findUnique({ where: { tokenHash } });
      if (!row || !actor.emailVerified || email(actor.email) !== row.recipientEmail) throw new ForbiddenException('Invitation acceptance is denied.');
      if (row.consumedAt || row.revokedAt || row.expiresAt <= new Date()) throw new ConflictException('Invitation is unavailable or expired.');
      const issuer = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: row.workspaceId, principalId: row.issuerPrincipalId } }, include: { principal: true } });
      if (!issuer || issuer.state !== 'active' || !['owner', 'admin'].includes(issuer.role) || issuer.principal.kind !== 'human' || issuer.principal.state !== 'active') throw new ForbiddenException('Invitation issuer is no longer authorized.');
      if (await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: row.workspaceId, principalId: actor.principalId } } })) throw new ConflictException('Membership already exists. Rejoining is not supported.');
      await this.principals.createMembership(tx, row.workspaceId, actor.principalId, row.role as LimitedRole);
      await tx.invitation.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
      return this.summary(tx, actor, row.workspaceId);
    }));
  }

  updateMember(headers: IncomingHttpHeaders, workspaceId: string, principalId: string, key: string, payload: unknown) {
    const input = object(payload, ['version', 'role', 'state'], ['version']);
    if (!Number.isSafeInteger(input['version']) || Number(input['version']) < 1 || (!('role' in input) && !('state' in input))
      || ('role' in input && !oneOf(input['role'], limitedRoles)) || ('state' in input && !oneOf(input['state'], states))) throw new BadRequestException('Invalid member change.');
    const patch = { ...('role' in input ? { role: input['role'] as LimitedRole } : {}), ...('state' in input ? { state: input['state'] as MemberState } : {}) };
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', (tx, actor) => this.receipt(tx, actor, key, `member/${workspaceId}/${principalId}`, input, async () => {
      await this.member(tx, workspaceId, principalId, Number(input['version']));
      await this.principals.updateMemberInTransaction(tx, actor.context!, principalId, patch);
      return this.member(tx, workspaceId, principalId);
    }));
  }

  registerAgent(headers: IncomingHttpHeaders, workspaceId: string, key: string, payload: unknown) {
    const input = object(payload, ['name', 'role', 'custodianPrincipalId']); const title = name(input['name']);
    if (!oneOf(input['role'], ['member', 'viewer']) || !id(input['custodianPrincipalId'])) throw new BadRequestException('Invalid agent registration.');
    const data = { name: title, role: input['role'] as 'member' | 'viewer', custodianPrincipalId: input['custodianPrincipalId'] };
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', (tx, actor) => this.receipt(tx, actor, key, `agent/${workspaceId}`, data, async () => {
      const principalId = await this.principals.registerAgentInTransaction(tx, actor.context!, data);
      return this.member(tx, workspaceId, principalId);
    }));
  }

  manageAgent(headers: IncomingHttpHeaders, workspaceId: string, principalId: string, key: string, payload: unknown) {
    const input = object(payload, ['version', 'state', 'custodianPrincipalId'], ['version']);
    if (!Number.isSafeInteger(input['version']) || Number(input['version']) < 1 || (!('state' in input) && !('custodianPrincipalId' in input))
      || ('state' in input && !oneOf(input['state'], states)) || ('custodianPrincipalId' in input && !id(input['custodianPrincipalId']))) throw new BadRequestException('Invalid agent change.');
    const patch = { ...('state' in input ? { state: input['state'] as MemberState } : {}), ...('custodianPrincipalId' in input ? { custodianPrincipalId: input['custodianPrincipalId'] as string } : {}) };
    return this.principals.workspaceOperation(headers, workspaceId, 'admin', (tx, actor) => this.receipt(tx, actor, key, `agent/${workspaceId}/${principalId}`, input, async () => {
      const existing = await this.member(tx, workspaceId, principalId, Number(input['version']));
      if (existing.state === 'revoked') throw new ConflictException('Revoked membership cannot be reactivated.');
      await this.principals.manageAgentInTransaction(tx, actor.context!, principalId, patch);
      return this.member(tx, workspaceId, principalId);
    }));
  }
}
