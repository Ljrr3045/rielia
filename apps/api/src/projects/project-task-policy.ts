import type { ExecutionContextResponse } from '@rielia/contracts';

export function administrator(actor: Pick<ExecutionContextResponse, 'principalKind' | 'role'>) {
  return actor.principalKind === 'human' && ['owner', 'admin'].includes(actor.role);
}

export function canManage(actor: ExecutionContextResponse) {
  return actor.executionMode === 'human' && administrator(actor);
}
