import { isIP } from 'node:net';
import { z } from 'zod';

const enabledSchema = z.union([
  z.literal('true'),
  z.literal('false'),
  z.literal(''),
  z.undefined(),
]);
const requiredSettingSchema = z
  .string()
  .trim()
  .refine((value) => value.length > 0);
const originComponentsSchema = z
  .instanceof(URL)
  .refine(
    (url) => !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash,
  );
const secretSchema = z.string().refine((value) => value.length >= 32);
const databaseUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
});
const proxySchema = z.string().refine((proxy) => {
  const [address, mask, ...extra] = proxy.split('/');
  const family = isIP(address ?? '');
  return (
    Boolean(family) &&
    extra.length === 0 &&
    (mask === undefined ||
      (/^\d+$/.test(mask) && Number(mask) >= 0 && Number(mask) <= (family === 4 ? 32 : 128)))
  );
});
const proxiesSchema = z.array(proxySchema);

/** Trimmed provider settings; an omitted pair never enables a provider. */
export const identityProviderSchema = z.union([
  z
    .strictObject({ clientId: z.literal('').optional(), clientSecret: z.literal('').optional() })
    .transform(() => undefined),
  z.strictObject({ clientId: z.string().min(1), clientSecret: z.string().min(1) }),
]);
export type IdentityProvider = Exclude<z.output<typeof identityProviderSchema>, undefined>;

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
    enabled: false,
    origin: '',
    secret: '',
    databaseUrl: '',
    trustedProxies: [],
    providers: {},
  };
  const enabled = enabledSchema.safeParse(env['IDENTITY_ENABLED']);
  if (!enabled.success) throw new Error('IDENTITY_ENABLED must be true or false.');
  if (enabled.data !== 'true') return empty;
  const required = (name: string): string => {
    const value = requiredSettingSchema.safeParse(env[name]);
    if (!value.success) throw new Error(`${name} is required when identity is enabled.`);
    return value.data;
  };
  let url: URL;
  try {
    url = new URL(required('BETTER_AUTH_URL'));
  } catch {
    throw new Error('BETTER_AUTH_URL must be a canonical origin.');
  }
  if (!originComponentsSchema.safeParse(url).success) {
    throw new Error('BETTER_AUTH_URL must contain only a canonical origin.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const localHttp =
    url.protocol === 'http:' &&
    loopback &&
    env['NODE_ENV'] !== 'production' &&
    env['IDENTITY_ALLOW_HTTP_LOOPBACK'] === 'true';
  if (
    !z
      .instanceof(URL)
      .refine((value) => value.protocol === 'https:' || localHttp)
      .safeParse(url).success
  ) {
    throw new Error(
      'Identity requires HTTPS; explicit non-production loopback HTTP is the only exception.',
    );
  }
  const secret = required('BETTER_AUTH_SECRET');
  if (!secretSchema.safeParse(secret).success)
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  const databaseUrl = required('DATABASE_URL');
  if (!databaseUrlSchema.safeParse(databaseUrl).success) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
  }
  const trustedProxies = (env['IDENTITY_TRUSTED_PROXIES'] ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!proxiesSchema.safeParse(trustedProxies).success) {
    throw new Error('IDENTITY_TRUSTED_PROXIES must list explicit proxy IP addresses or CIDRs.');
  }
  const providers: IdentityConfig['providers'] = {};
  for (const provider of ['google', 'github'] as const) {
    const prefix = provider.toUpperCase();
    const clientId = env[`${prefix}_CLIENT_ID`]?.trim();
    const clientSecret = env[`${prefix}_CLIENT_SECRET`]?.trim();
    const pair = identityProviderSchema.safeParse({ clientId, clientSecret });
    if (!pair.success) throw new Error(`${prefix} requires both client ID and secret.`);
    if (pair.data) providers[provider] = pair.data;
  }
  return { enabled: true, origin: url.origin, secret, databaseUrl, trustedProxies, providers };
}
