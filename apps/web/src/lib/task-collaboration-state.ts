import type { CollaborationCollection, TaskCollaborationPages } from '@rielia/contracts';

export interface CollaborationSlot<T> { status: 'idle' | 'loading' | 'ready' | 'error' | 'changed'; data: T | null; requestId: string | null }
export type CollaborationState = { [K in CollaborationCollection]: CollaborationSlot<TaskCollaborationPages[K]> };
export function emptyCollaboration(): CollaborationState {
  return { relations: { status: 'idle', data: null, requestId: null }, 'parent-candidates': { status: 'idle', data: null, requestId: null }, checklist: { status: 'idle', data: null, requestId: null }, comments: { status: 'idle', data: null, requestId: null }, history: { status: 'idle', data: null, requestId: null } };
}
