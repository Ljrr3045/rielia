import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { google, verifyGoogleIdToken, type GoogleOptions } from 'better-auth/social-providers';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { IdentityConfig } from './config.js';

export function createIdentity(config: IdentityConfig) {
  if (!config.enabled || !config.databaseUrl || !config.origin || !config.secret) {
    throw new Error('Identity requires validated database, origin, and secret configuration.');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.databaseUrl, connectionTimeoutMillis: 5000, max: 5 }),
    // Errors can contain connection details. The boundary emits a fixed message.
    log: [],
  });
  const googleCredentials = config.providers.google;
  const googleOptions: GoogleOptions | undefined = googleCredentials ? {
    ...googleCredentials,
    // In 1.7.12 the redirect callback profile mapper decodes the ID token.
    // Apply the library's exported verifier before its built-in profile mapper.
    getUserInfo: async tokens => {
      if (!tokens.idToken || !await verifyGoogleIdToken({ token: tokens.idToken, audience: googleCredentials.clientId })) return null;
      return google(googleCredentials).getUserInfo(tokens);
    },
  } : undefined;
  const auth = betterAuth({
    appName: 'Rielia identity spike',
    baseURL: config.origin,
    basePath: '/api/auth',
    secret: config.secret,
    database: prismaAdapter(prisma, { provider: 'postgresql', transaction: true }),
    socialProviders: {
      ...(googleOptions ? { google: googleOptions } : {}),
      ...(config.providers.github ? { github: { ...config.providers.github, scope: ['read:user', 'user:email'] } } : {}),
    },
    emailAndPassword: { enabled: false },
    account: {
      accountLinking: { enabled: false, disableImplicitLinking: true, trustedProviders: [] },
      encryptOAuthTokens: true,
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    trustedOrigins: [config.origin],
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      trustedProxyHeaders: false,
      useSecureCookies: config.origin.startsWith('https:'),
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
      crossSubDomainCookies: { enabled: false },
      ipAddress: { ipAddressHeaders: ['x-rielia-client-ip'] },
    },
    rateLimit: { enabled: true },
    // Never print provider responses, callback tokens, or database errors.
    logger: { disabled: true },
  });
  return { auth, prisma };
}

export type IdentityRuntime = ReturnType<typeof createIdentity>;
