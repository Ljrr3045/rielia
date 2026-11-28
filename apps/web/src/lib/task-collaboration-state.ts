import type { CollaborationCollection, TaskCollaborationPages } from '@rielia/contracts';

export interface CollaborationSlot<T> {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'changed';
  data: T | null;
  stale: boolean;
  requestId: string | null;
}
export type CollaborationState = {
  [K in CollaborationCollection]: CollaborationSlot<TaskCollaborationPages[K]>;
};
export function emptyCollaboration(): CollaborationState {
  return {
    relations: { status: 'idle', data: null, stale: false, requestId: null },
    'parent-candidates': { status: 'idle', data: null, stale: false, requestId: null },
    checklist: { status: 'idle', data: null, stale: false, requestId: null },
    comments: { status: 'idle', data: null, stale: false, requestId: null },
    history: { status: 'idle', data: null, stale: false, requestId: null },
  };
}
