import { BadRequestException, ConflictException, ForbiddenException, HttpException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import type { CreationAttribution, ExecutionContextResponse, MembershipRole } from '@rielia/contracts';
import type { Prisma } from '../generated/prisma/client.js';
import { IdentityService } from '../identity/identity.service.js';
import { storageConstraintException } from './principal-errors.js';

export type Transaction = Prisma.TransactionClient;
export interface HumanActor { principalId: string; userId: string; email: string; emailVerified: boolean; context: ExecutionContextResponse | null }
type Evidence = { workspaceId: string } & ({ sessionId: string; userId: string } | { grantId: string });
type Operation = 'read' | 'write' | 'admin';
// The WeakMap, rather than a public DTO/brand, is the runtime trust boundary.
export type VerifiedExecution = Readonly<ExecutionContextResponse>;

@Injectable()
export class PrincipalService {
  private readonly evidence = new WeakMap<VerifiedExecution, Evidence>();
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  private get database() {
    if (!this.identity.runtime) throw new ServiceUnavailableException('Identity is not enabled.');
    return this.identity.runtime.prisma;
  }

  private async transaction<T>(work: (tx: Transaction) => Promise<T>, readOnly = false): Promise<T> {
    try {
      return await this.database.$transaction(async tx => {
        if (readOnly) {
          const rows = await tx.$queryRaw<unknown[]>`SELECT singleton FROM principal_policy_fence WHERE singleton FOR SHARE`;
          if (rows.length !== 1) throw new ServiceUnavailableException('Principal policy is unavailable.');
        } else if (await tx.$executeRaw`UPDATE principal_policy_fence SET revision = revision + 1 WHERE singleton` !== 1) throw new ServiceUnavailableException('Principal policy is unavailable.');
        return work(tx);
      }, { maxWait: 5000, timeout: 10000 });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const constraint = storageConstraintException(error);
      if (constraint) throw constraint;
      // Never expose Prisma/PG diagnostics, identifiers or configuration.
      throw new ServiceUnavailableException('Principal operation is unavailable.');
    }
  }

  private async resolve(tx: Transaction, evidence: Evidence, operation: Operation): Promise<ExecutionContextResponse> {
    let principalId: string;
    let mode: 'human' | 'delegated' | 'autonomous' = 'human';
    let grantId: string | null = null;
    if ('sessionId' in evidence) {
      const session = await tx.session.findUnique({ where: { id: evidence.sessionId } });
      if (!session || session.userId !== evidence.userId || session.expiresAt <= new Date()) throw new UnauthorizedException('Authentication is required.');
      const human = await tx.principal.findUnique({ where: { userId: session.userId } });
      if (!human || human.kind !== 'human') throw new ForbiddenException('Workspace access is denied.');
      principalId = human.id;
    } else {
      const grant = await tx.executionGrant.findUnique({ where: { id: evidence.grantId } });
      if (!grant || grant.workspaceId !== evidence.workspaceId || grant.revokedAt || grant.expiresAt <= new Date()) throw new UnauthorizedException('Grant access is denied.');
      if (operation === 'admin' || !grant.allowedOperations.includes(operation)) throw new ForbiddenException('Operation is not granted.');
      principalId = grant.subjectPrincipalId;
      mode = grant.mode as 'delegated' | 'autonomous';
      grantId = grant.id;
    }
    const principal = await tx.principal.findUnique({ where: { id: principalId } });
    const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: evidence.workspaceId, principalId } } });
    if (!principal || principal.state !== 'active' || !member || member.state !== 'active'
      || (mode === 'autonomous' ? principal.kind !== 'agent' || principal.workspaceId !== evidence.workspaceId : principal.kind !== 'human')) {
      throw new ForbiddenException('Workspace access is denied.');
    }
    if (operation === 'write' && member.role === 'viewer') throw new ForbiddenException('Workspace is read-only.');
    if (operation === 'admin' && (mode !== 'human' || !['owner', 'admin'].includes(member.role))) throw new ForbiddenException('Human administration is required.');
    return Object.freeze({ actorPrincipalId: principalId, principalKind: principal.kind as 'human' | 'agent', workspaceId: evidence.workspaceId,
      executionMode: mode, source: mode === 'human' ? 'web' : 'mcp', role: member.role as MembershipRole, grantId });
  }

  async webContext(headers: IncomingHttpHeaders, workspaceId: string) {
    const session = await this.identity.session(headers);
    if (!session.data) throw new UnauthorizedException('Authentication is required.');
    const evidence: Evidence = { workspaceId, sessionId: session.data.session.id, userId: session.data.user.id };
    const context = await this.transaction(tx => this.resolve(tx, evidence, 'read'), true);
    this.evidence.set(context, evidence);
    return { context, headers: session.headers };
  }

  /** Backend-only policy/transaction seam for the workspace owning service.
   * Cookie evidence is reloaded after acquiring the fence, including recipient
   * verification. No DTO or request actor can enter this seam as authority. */
  async workspaceOperation<T>(headers: IncomingHttpHeaders, workspaceId: string | null, operation: 'read' | 'admin',
    work: (tx: Transaction, actor: HumanActor) => Promise<T>, readOnly = false) {
    const session = await this.identity.session(headers);
    if (!session.data) throw new UnauthorizedException('Authentication is required.');
    const data = await this.transaction(async tx => {
      const current = await tx.session.findUnique({ where: { id: session.data!.session.id }, include: { user: { include: { principal: true } } } });
      if (!current || current.userId !== session.data!.user.id || current.expiresAt <= new Date()) throw new UnauthorizedException('Authentication is required.');
      const human = current.user.principal;
      if (!human || human.kind !== 'human' || human.state !== 'active') throw new ForbiddenException('Active human is required.');
      const context = workspaceId === null ? null : await this.resolve(tx, { workspaceId, sessionId: current.id, userId: current.userId }, operation);
      return work(tx, { principalId: human.id, userId: current.userId, email: current.user.email, emailVerified: current.user.emailVerified, context });
    }, readOnly);
    return { data, headers: session.headers };
  }

  /** Backend transaction seam; caller already holds/revalidates fenced policy. */
  async createMembership(tx: Transaction, workspaceId: string, principalId: string, role: MembershipRole): Promise<void> {
    await tx.membership.create({ data: { workspaceId, principalId, role } });
  }

  /** INTERNAL POLICY ONLY. Future T12 credential verifier must authenticate first.
   * No controller, MCP adapter or request field can call this as authentication. */
  async internalGrantContext(grantId: string, workspaceId: string): Promise<VerifiedExecution> {
    const evidence: Evidence = { grantId, workspaceId };
    const context = await this.transaction(tx => this.resolve(tx, evidence, 'read'), true);
    this.evidence.set(context, evidence);
    return context;
  }

  private async withContext<T>(context: VerifiedExecution, operation: Operation, work: (tx: Transaction, current: ExecutionContextResponse) => Promise<T>): Promise<T> {
    const evidence = this.evidence.get(context);
    if (!evidence) throw new UnauthorizedException('Verified execution context is required.');
    return this.transaction(async tx => work(tx, await this.resolve(tx, evidence, operation)));
  }

  /** Domain owners use this seam, never a serialized context. The current
   * principal/session/grant and membership stay fenced until the domain commits. */
  async domainOperation<T>(context: VerifiedExecution, workspaceId: string, operation: 'read' | 'write',
    work: (tx: Transaction, current: ExecutionContextResponse, canWrite: boolean) => Promise<T>): Promise<T> {
    const evidence = this.evidence.get(context);
    if (!evidence || evidence.workspaceId !== workspaceId) throw new UnauthorizedException('Verified scoped execution is required.');
    return this.transaction(async tx => {
      const current = await this.resolve(tx, evidence, operation);
      const grant = 'grantId' in evidence ? await tx.executionGrant.findUnique({ where: { id: evidence.grantId } }) : null;
      const canWrite = current.role !== 'viewer' && (!grant || grant.allowedOperations.includes('write'));
      return work(tx, current, canWrite);
    }, operation === 'read');
  }

  /** Same-scope active assignees only; retaining an unchanged historical
   * assignment is the domain owner's explicit edit policy. */
  async assertAssignable(tx: Transaction, workspaceId: string, principalId: string): Promise<void> {
    const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId, principalId } }, include: { principal: true } });
    if (!member || member.state !== 'active' || member.principal.state !== 'active' || !['human', 'agent'].includes(member.principal.kind)
      || (member.principal.kind === 'agent' && member.principal.workspaceId !== workspaceId)) throw new ForbiddenException('Assignment is denied.');
  }

  /** Trusted installation/bootstrap seam, not an API or delegated operation.
   * T05 will own registration/invitations and invoke this through verified policy. */
  async bootstrapWorkspaceForHuman(userId: string, name: string, workspaceId = randomUUID()): Promise<string> {
    return this.transaction(async tx => {
      const principal = await tx.principal.findUnique({ where: { userId } });
      if (!principal || principal.kind !== 'human' || principal.state !== 'active') throw new ForbiddenException('Active human is required.');
      await tx.workspace.create({ data: { id: workspaceId, name, ownerPrincipalId: principal.id } });
      await tx.membership.create({ data: { workspaceId, principalId: principal.id, role: 'owner' } });
      return workspaceId;
    });
  }

  async addHumanMember(context: VerifiedExecution, userId: string, role: Exclude<MembershipRole, 'owner'>): Promise<string> {
    if (!['admin', 'member', 'viewer'].includes(role)) throw new BadRequestException('Invalid membership role.');
    return this.withContext(context, 'admin', async (tx, current) => {
      const human = await tx.principal.findUnique({ where: { userId } });
      if (!human || human.kind !== 'human' || human.state !== 'active') throw new ForbiddenException('Active human is required.');
      await tx.membership.create({ data: { workspaceId: current.workspaceId, principalId: human.id, role } });
      return human.id;
    });
  }

  async registerAgent(context: VerifiedExecution, input: { name: string; custodianPrincipalId: string; role: 'member' | 'viewer' }): Promise<string> {
    if (!input || Object.keys(input).some(key => !['name', 'custodianPrincipalId', 'role'].includes(key)) || !['member', 'viewer'].includes(input.role)) throw new BadRequestException('Invalid agent registration.');
    return this.withContext(context, 'admin', (tx, current) => this.registerAgentInTransaction(tx, current, input));
  }

  async registerAgentInTransaction(tx: Transaction, current: ExecutionContextResponse, input: { name: string; custodianPrincipalId: string; role: 'member' | 'viewer' }): Promise<string> {
      await this.assertCustodian(tx, current.workspaceId, input.custodianPrincipalId);
      const agent = await tx.principal.create({ data: { kind: 'agent', displayName: input.name, workspaceId: current.workspaceId, custodianPrincipalId: input.custodianPrincipalId } });
      await tx.membership.create({ data: { workspaceId: current.workspaceId, principalId: agent.id, role: input.role } });
      return agent.id;
  }

  private async assertCustodian(tx: Transaction, workspaceId: string, principalId: string): Promise<void> {
    const principal = await tx.principal.findUnique({ where: { id: principalId } });
    const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId, principalId } } });
    if (!principal || principal.kind !== 'human' || principal.state !== 'active' || !member || member.state !== 'active' || !['owner', 'admin'].includes(member.role)) throw new ForbiddenException('Active human administrator custodian is required.');
  }

  async updateMember(context: VerifiedExecution, principalId: string, patch: { role?: Exclude<MembershipRole, 'owner'>; state?: 'active' | 'suspended' | 'revoked' }): Promise<void> {
    if (!patch || !Object.keys(patch).length || Object.keys(patch).some(key => !['role', 'state'].includes(key))
      || (patch.role !== undefined && !['admin', 'member', 'viewer'].includes(patch.role)) || (patch.state !== undefined && !['active', 'suspended', 'revoked'].includes(patch.state))) throw new BadRequestException('Invalid membership update.');
    return this.withContext(context, 'admin', (tx, current) => this.updateMemberInTransaction(tx, current, principalId, patch));
  }

  async updateMemberInTransaction(tx: Transaction, current: ExecutionContextResponse, principalId: string, patch: { role?: Exclude<MembershipRole, 'owner'>; state?: 'active' | 'suspended' | 'revoked' }): Promise<void> {
      const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: current.workspaceId, principalId } } });
      const principal = await tx.principal.findUnique({ where: { id: principalId } });
      if (!member || !principal || member.role === 'owner' || (principal.kind === 'agent' && patch.role === 'admin')) throw new ForbiddenException('Membership change is denied.');
      if (member.state === 'revoked' && patch.state !== undefined && patch.state !== 'revoked') throw new ConflictException('Revoked membership cannot change state.');
      if ((patch.role && !['owner', 'admin'].includes(patch.role)) || (patch.state && patch.state !== 'active')) {
        if (await tx.principal.count({ where: { custodianPrincipalId: principalId, workspaceId: current.workspaceId, state: 'active' } })) throw new ForbiddenException('Transfer management or suspend dependent agents first.');
      }
      await tx.membership.update({ where: { workspaceId_principalId: { workspaceId: current.workspaceId, principalId } }, data: patch });
  }

  async manageAgent(context: VerifiedExecution, principalId: string, patch: { state?: 'active' | 'suspended' | 'revoked'; custodianPrincipalId?: string }): Promise<void> {
    if (!patch || !Object.keys(patch).length || Object.keys(patch).some(key => !['state', 'custodianPrincipalId'].includes(key))
      || (patch.state !== undefined && !['active', 'suspended', 'revoked'].includes(patch.state))) throw new BadRequestException('Invalid agent update.');
    return this.withContext(context, 'admin', (tx, current) => this.manageAgentInTransaction(tx, current, principalId, patch));
  }

  async manageAgentInTransaction(tx: Transaction, current: ExecutionContextResponse, principalId: string, patch: { state?: 'active' | 'suspended' | 'revoked'; custodianPrincipalId?: string }): Promise<void> {
      const agent = await tx.principal.findUnique({ where: { id: principalId } });
      if (!agent || agent.kind !== 'agent' || agent.workspaceId !== current.workspaceId || agent.state === 'revoked') throw new ForbiddenException('Agent management is denied.');
      if (patch.custodianPrincipalId || patch.state === 'active') await this.assertCustodian(tx, current.workspaceId, patch.custodianPrincipalId ?? agent.custodianPrincipalId!);
      await tx.principal.update({ where: { id: agent.id }, data: patch });
  }

  /** Policy record only. Issuance of a credential is explicitly T12 work. */
  async recordInternalGrant(context: VerifiedExecution, input: { subjectPrincipalId: string; mode: 'delegated' | 'autonomous'; allowedOperations: ('read' | 'write')[]; expiresAt: Date }): Promise<string> {
    return this.withContext(context, 'read', async (tx, current) => {
      const subject = await tx.principal.findUnique({ where: { id: input.subjectPrincipalId } });
      const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: current.workspaceId, principalId: input.subjectPrincipalId } } });
      if (current.executionMode !== 'human' || !subject || subject.state !== 'active' || !member || member.state !== 'active'
        || (input.mode === 'delegated' ? subject.kind !== 'human' || subject.id !== current.actorPrincipalId : input.mode !== 'autonomous' || subject.kind !== 'agent' || subject.workspaceId !== current.workspaceId)
        || (input.mode === 'autonomous' && !['owner', 'admin'].includes(current.role))
        || (member.role === 'viewer' && input.allowedOperations.includes('write'))
        || !(input.expiresAt > new Date()) || !input.allowedOperations.length || input.allowedOperations.some(value => !['read', 'write'].includes(value))) throw new ForbiddenException('Grant policy is denied.');
      const grant = await tx.executionGrant.create({ data: { ...input, id: randomUUID(), workspaceId: current.workspaceId, authorizedByPrincipalId: current.actorPrincipalId } });
      return grant.id;
    });
  }

  async revokeGrant(context: VerifiedExecution, grantId: string): Promise<void> {
    return this.withContext(context, 'read', async (tx, current) => {
      const grant = await tx.executionGrant.findUnique({ where: { id: grantId } });
      const ownDelegated = grant?.mode === 'delegated' && grant.subjectPrincipalId === current.actorPrincipalId;
      if (current.executionMode !== 'human' || !grant || grant.workspaceId !== current.workspaceId
        || (!ownDelegated && !['owner', 'admin'].includes(current.role))) throw new ForbiddenException('Grant access is denied.');
      if (!grant.revokedAt) await tx.executionGrant.update({ where: { id: grantId }, data: { revokedAt: new Date() } });
    });
  }

  /** Foundation only: T06 must validate project access and persist attribution
   * atomically with actual task/comment writes, using this same transaction. */
  async creationAttribution(context: VerifiedExecution, payload: unknown): Promise<CreationAttribution> {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload) || Object.keys(payload).some(key => key !== 'assigneePrincipalId')) throw new BadRequestException('Only an independent assignee is accepted.');
    const assignee = (payload as { assigneePrincipalId?: unknown }).assigneePrincipalId ?? null;
    if (assignee !== null && typeof assignee !== 'string') throw new BadRequestException('Invalid assignee.');
    return this.withContext(context, 'write', async (tx, current) => {
      if (assignee !== null) {
        const principal = await tx.principal.findUnique({ where: { id: assignee } });
        const member = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: current.workspaceId, principalId: assignee } } });
        if (!principal || !['human', 'agent'].includes(principal.kind) || principal.state !== 'active' || !member || member.state !== 'active') throw new ForbiddenException('Assignment is denied.');
      }
      return Object.freeze({ createdByPrincipalId: current.actorPrincipalId, authorPrincipalId: current.actorPrincipalId, assigneePrincipalId: assignee, provenance: current });
    });
  }
}
