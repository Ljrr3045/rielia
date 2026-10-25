import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { IdentityService } from './identity/identity.service.js';

export function configureApplication(app: NestExpressApplication): void {
  const identity = app.get(IdentityService);
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  express.set('trust proxy', identity.config.trustedProxies.length ? identity.config.trustedProxies : false);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    // Express checks the socket peer and configured proxy chain first. Better
    // Auth must never independently trust client-supplied forwarding headers.
    const ip = req.ip ?? req.socket.remoteAddress;
    for (const name of Object.keys(req.headers)) {
      if (name.startsWith('x-forwarded-') || ['forwarded', 'x-real-ip', 'x-rielia-client-ip'].includes(name)) {
        delete req.headers[name];
      }
    }
    if (ip) req.headers['x-rielia-client-ip'] = ip;
    next();
  });
  if (identity.runtime) {
    const handler = toNodeHandler(identity.runtime.auth);
    const callbacks = new Set(['/api/auth/callback/google', '/api/auth/callback/github']);
    express.all('/api/auth/*splat', (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', 'no-store');
      let pathname: string;
      try {
        // Match the WHATWG normalization used by the auth Request boundary.
        // Express req.path retains raw dot segments and cannot select exemptions.
        pathname = new URL(req.originalUrl, 'http://identity.internal').pathname;
        decodeURI(pathname); // Reject malformed percent encoding before dispatch.
      } catch {
        res.status(400).json({ message: 'Invalid identity request path.' });
        return;
      }
      // Social sign-in without an existing cookie is not covered by every
      // library CSRF branch. Browser mutations always require our exact origin.
      // Provider callbacks instead authenticate the library's state/PKCE flow.
      if (req.method !== 'GET' && req.method !== 'HEAD'
        && !callbacks.has(pathname) && req.headers.origin !== identity.config.origin) {
        res.status(403).json({ message: 'Untrusted identity request origin.' });
        return;
      }
      // A rejected handler cannot fall through to a second authentication path.
      Promise.resolve(handler(req, res)).catch(() => {
        if (!res.headersSent) res.status(503).json({ message: 'Identity is unavailable.' });
        else res.end();
      }).catch(next);
    });
  }
  // Explicit parsers follow the raw auth handler; general API behavior survives.
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
  app.setGlobalPrefix('api/v1');
}
