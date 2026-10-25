'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createIdentityController } from './identity-controller';
import { createIdentityTransport } from './identity-client';

/** UI owns labels/layout only; all auth transitions and requests stay here. */
export function useIdentity() {
  const [controller] = useState(() => createIdentityController(createIdentityTransport()));
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('auth') === 'error') controller.markIncomplete();
    void controller.refresh();
    return controller.cancelPendingLoads;
  }, [controller]);
  return { ...state, refresh: controller.refresh, signIn: controller.signIn,
    signOut: controller.signOut, dismissMessage: controller.dismissMessage };
}
