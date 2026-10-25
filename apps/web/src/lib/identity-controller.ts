export type IdentityProvider = 'google' | 'github';
export type IdentityMessage = 'sign-in-incomplete' | 'sign-in-failed' | 'sign-out-failed' | null;
export interface IdentitySession {
  user: { id: string; name: string; email: string; emailVerified: boolean };
  session: { id: string; expiresAt: string };
}
export interface IdentityState {
  status: 'loading' | 'disabled' | 'signed-out' | 'signed-in' | 'unavailable';
  providers: readonly IdentityProvider[];
  session: IdentitySession | null;
  pending: 'sign-in' | 'sign-out' | null;
  message: IdentityMessage;
}
export interface IdentityTransport {
  configuration(): Promise<unknown>;
  session(): Promise<unknown>;
  signIn(provider: IdentityProvider): Promise<void>;
  signOut(): Promise<void>;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function configuration(value: unknown): { enabled: boolean; providers: IdentityProvider[] } {
  if (!record(value) || typeof value['enabled'] !== 'boolean' || !Array.isArray(value['providers'])
    || !value['providers'].every(provider => provider === 'google' || provider === 'github')) throw new Error('Invalid identity configuration response.');
  return { enabled: value['enabled'], providers: [...new Set(value['providers'] as IdentityProvider[])] };
}
function session(value: unknown): IdentitySession | null {
  if (value === null) return null;
  if (!record(value) || !record(value['user']) || !record(value['session'])) throw new Error('Invalid identity session response.');
  const user = value['user']; const data = value['session'];
  if (typeof user['id'] !== 'string' || typeof user['name'] !== 'string' || typeof user['email'] !== 'string'
    || typeof user['emailVerified'] !== 'boolean' || typeof data['id'] !== 'string' || typeof data['expiresAt'] !== 'string'
    || !Number.isFinite(Date.parse(data['expiresAt']))) throw new Error('Invalid identity session response.');
  return { user: { id: user['id'], name: user['name'], email: user['email'], emailVerified: user['emailVerified'] },
    session: { id: data['id'], expiresAt: data['expiresAt'] } };
}

/** Presentation-independent state machine. Transport failures never mean signed out. */
export function createIdentityController(transport: IdentityTransport) {
  let state: IdentityState = { status: 'loading', providers: [], session: null, pending: null, message: null };
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (next: IdentityState) => { state = next; for (const listener of listeners) listener(); };

  async function refresh(): Promise<void> {
    if (state.pending) return;
    const current = ++generation;
    publish({ ...state, status: 'loading', session: null });
    try {
      const config = configuration(await transport.configuration());
      const data = config.enabled ? session(await transport.session()) : null;
      if (current !== generation) return;
      publish({ ...state, status: config.enabled ? data ? 'signed-in' : 'signed-out' : 'disabled',
        providers: config.enabled ? config.providers : [], session: data });
    } catch {
      if (current === generation) publish({ ...state, status: 'unavailable', providers: [], session: null });
    }
  }

  async function signIn(provider: IdentityProvider): Promise<void> {
    if (state.pending || state.status !== 'signed-out' || !state.providers.includes(provider)) return;
    const current = ++generation;
    publish({ ...state, pending: 'sign-in', message: null });
    try {
      await transport.signIn(provider);
      if (current === generation) publish({ ...state, pending: null });
    } catch {
      if (current === generation) publish({ ...state, pending: null, message: 'sign-in-failed' });
    }
  }

  async function signOut(): Promise<void> {
    if (state.pending || state.status !== 'signed-in') return;
    const current = ++generation;
    publish({ ...state, pending: 'sign-out', message: null });
    try {
      await transport.signOut();
      if (current !== generation) return;
      publish({ ...state, pending: null });
      await refresh();
    } catch {
      if (current === generation) publish({ ...state, pending: null, message: 'sign-out-failed' });
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, signIn, signOut,
    dismissMessage() { publish({ ...state, message: null }); },
    markIncomplete() { publish({ ...state, message: 'sign-in-incomplete' }); },
    cancelPendingLoads() { generation++; if (state.pending) publish({ ...state, pending: null }); },
  };
}
