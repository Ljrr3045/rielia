import { Injectable, ServiceUnavailableException, type OnModuleDestroy } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { createIdentity, type IdentityRuntime } from './auth.js';
import { readIdentityConfig } from './config.js';

@Injectable()
export class IdentityService implements OnModuleDestroy {
  readonly config = readIdentityConfig();
  readonly runtime: IdentityRuntime | undefined = this.config.enabled ? createIdentity(this.config) : undefined;

  async session(headers: IncomingHttpHeaders) {
    if (!this.runtime) throw new ServiceUnavailableException('Identity is not enabled.');
    try {
      const { response: session, headers: responseHeaders } = await this.runtime.auth.api.getSession({
        headers: fromNodeHeaders(headers), query: { disableCookieCache: true }, returnHeaders: true,
      });
      return {
        headers: responseHeaders,
        data: session ? {
          user: { id: session.user.id, name: session.user.name, email: session.user.email, emailVerified: session.user.emailVerified },
          session: { id: session.session.id, expiresAt: session.session.expiresAt },
        } : null,
      };
    } catch { throw new ServiceUnavailableException('Identity session lookup is unavailable.'); }
  }

  async onModuleDestroy(): Promise<void> { await this.runtime?.prisma.$disconnect(); }
}
