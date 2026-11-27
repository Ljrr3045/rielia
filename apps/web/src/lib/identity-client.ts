import { createAuthClient } from 'better-auth/client';
import type { IdentityTransport } from './identity-controller';
import { createContractRequest } from './api-contract-client.ts';

/** Overrides allow local HTTP transport tests; product requests use same origin. */
export function createIdentityTransport(
  options: { baseURL?: string; timeout?: number } = {},
): IdentityTransport {
  const timeout = options.timeout ?? 15000;
  const send = createContractRequest(options);
  let auth: ReturnType<typeof createAuthClient> | undefined;
  function client() {
    if (!auth) {
      const origin =
        options.baseURL ?? (typeof window === 'undefined' ? undefined : window.location.origin);
      if (!origin) throw new Error('Identity mutations require a browser origin.');
      auth = createAuthClient({ baseURL: origin, fetchOptions: { timeout, retry: 0 } });
    }
    return auth;
  }
  async function read(response: Response): Promise<unknown> {
    if (!response.ok) throw new Error('Identity response unavailable.');
    return response.json() as Promise<unknown>;
  }
  return {
    configuration: async () => read(await send('get', '/api/v1/identity/config', {})),
    session: async () => read(await send('get', '/api/v1/identity/session', {})),
    async signIn(provider) {
      const result = await client().signIn.social({
        provider,
        callbackURL: '/identity',
        errorCallbackURL: '/identity?auth=error',
      });
      if (result.error) throw new Error('Identity sign-in failed.');
    },
    async signOut() {
      const result = await client().signOut();
      if (result.error) throw new Error('Identity sign-out failed.');
    },
  };
}
