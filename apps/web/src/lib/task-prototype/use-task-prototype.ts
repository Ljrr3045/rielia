'use client';

import { useState, useSyncExternalStore } from 'react';
import { createTaskPrototype } from './controller.ts';

/** Mount once in the prototype page owner; pass state/actions to presentation. */
export function useTaskPrototype() {
  const [adapter] = useState(() => createTaskPrototype());
  const state = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot, adapter.getSnapshot);
  return { state, actions: adapter.actions };
}
