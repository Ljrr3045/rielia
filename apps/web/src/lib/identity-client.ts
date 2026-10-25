import { createAuthClient } from 'better-auth/client';
import type { IdentityTransport } from './identity-controller';

/** Overrides allow local HTTP transport tests; product requests use same origin. */
export function createIdentityTransport(options: { baseURL?: string; timeout?: number } = {}): IdentityTransport {
  const timeout = options.timeout ?? 15000;
  let auth: ReturnType<typeof createAuthClient> | undefined;
  function client() {
    if (!auth) {
      const origin = options.baseURL ?? (typeof window === 'undefined' ? undefined : window.location.origin);
      if (!origin) throw new Error('Identity mutations require a browser origin.');
      auth = createAuthClient({ baseURL: origin, fetchOptions: { timeout, retry: 0 } });
    }
    return auth;
  }
  async function read(path: string): Promise<unknown> {
    const target = options.baseURL ? new URL(path, options.baseURL).href : path;
    const response = await fetch(target, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new Error('Identity response unavailable.');
    return response.json() as Promise<unknown>;
  }
  return {
    configuration: () => read('/api/v1/identity/config'),
    session: () => read('/api/v1/identity/session'),
    async signIn(provider) {
      const result = await client().signIn.social({ provider, callbackURL: '/identity', errorCallbackURL: '/identity?auth=error' });
      if (result.error) throw new Error('Identity sign-in failed.');
    },
    async signOut() {
      const result = await client().signOut();
      if (result.error) throw new Error('Identity sign-out failed.');
    },
  };
}
