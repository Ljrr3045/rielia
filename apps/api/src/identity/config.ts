import { isIP } from 'node:net';

export interface IdentityConfig {
  enabled: boolean;
  origin: string;
  secret: string;
  databaseUrl: string;
  trustedProxies: string[];
  providers: Partial<Record<'google' | 'github', { clientId: string; clientSecret: string }>>;
}

export function readIdentityConfig(env: NodeJS.ProcessEnv = process.env): IdentityConfig {
  const empty: IdentityConfig = {
    enabled: false, origin: '', secret: '', databaseUrl: '', trustedProxies: [], providers: {},
  };
  if (env['IDENTITY_ENABLED'] !== 'true') {
    if (env['IDENTITY_ENABLED'] && env['IDENTITY_ENABLED'] !== 'false') {
      throw new Error('IDENTITY_ENABLED must be true or false.');
    }
    return empty;
  }
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) throw new Error(`${name} is required when identity is enabled.`);
    return value;
  };
  let url: URL;
  try { url = new URL(required('BETTER_AUTH_URL')); }
  catch { throw new Error('BETTER_AUTH_URL must be a canonical origin.'); }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BETTER_AUTH_URL must contain only a canonical origin.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const localHttp = url.protocol === 'http:' && loopback && env['NODE_ENV'] !== 'production'
    && env['IDENTITY_ALLOW_HTTP_LOOPBACK'] === 'true';
  if (url.protocol !== 'https:' && !localHttp) {
    throw new Error('Identity requires HTTPS; explicit non-production loopback HTTP is the only exception.');
  }
  const secret = required('BETTER_AUTH_SECRET');
  if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  const databaseUrl = required('DATABASE_URL');
  try {
    const database = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.hostname) throw new Error();
  } catch { throw new Error('DATABASE_URL must be a PostgreSQL connection URL.'); }
  const trustedProxies = (env['IDENTITY_TRUSTED_PROXIES'] ?? '').split(',').map(v => v.trim()).filter(Boolean);
  for (const proxy of trustedProxies) {
    const [address, mask, ...extra] = proxy.split('/');
    const family = isIP(address ?? '');
    if (!family || extra.length || (mask !== undefined && (!/^\d+$/.test(mask)
      || Number(mask) < 0 || Number(mask) > (family === 4 ? 32 : 128)))) {
      throw new Error('IDENTITY_TRUSTED_PROXIES must list explicit proxy IP addresses or CIDRs.');
    }
  }
  const providers: IdentityConfig['providers'] = {};
  for (const provider of ['google', 'github'] as const) {
    const prefix = provider.toUpperCase();
    const clientId = env[`${prefix}_CLIENT_ID`]?.trim();
    const clientSecret = env[`${prefix}_CLIENT_SECRET`]?.trim();
    if (Boolean(clientId) !== Boolean(clientSecret)) throw new Error(`${prefix} requires both client ID and secret.`);
    if (clientId && clientSecret) providers[provider] = { clientId, clientSecret };
  }
  return { enabled: true, origin: url.origin, secret, databaseUrl, trustedProxies, providers };
}
