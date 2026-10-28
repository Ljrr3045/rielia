import { NodeAdapter, type NestNodeApplication, type NodeRequest, type NodeResponse } from '@nestjs/platform-node';
import { toNodeHandler } from 'better-auth/node';
import { IdentityService } from './identity/identity.service.js';
import { readIdentityConfig } from './identity/config.js';
import { randomUUID } from 'node:crypto';

// Bootstrap and integration tests use the same supported adapter configuration.
export function createHttpAdapter(): NodeAdapter {
  const { trustedProxies } = readIdentityConfig();
  return new NodeAdapter({ trustProxy: trustedProxies.length ? trustedProxies : false });
}

export function configureApplication(app: NestNodeApplication): void {
  const identity = app.get(IdentityService);
  app.use((req: NodeRequest, res: NodeResponse, next: () => void) => {
    // Install before parsers so rejected/oversized JSON and unmatched domain
    // routes have the same no-store/correlation boundary as controller results.
    if (/^\/api\/v1\/workspaces\/[^/]+\/projects(?:\/|\?|$)/.test(req.originalUrl)) {
      res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Request-Id', randomUUID());
    }
    next();
  });
  app.use((req: NodeRequest, _res: NodeResponse, next: () => void) => {
    // The adapter checks the socket peer and configured proxy chain first. Better
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
    app.getHttpAdapter().all('/api/auth/*splat', (req: NodeRequest, res: NodeResponse) => {
      res.setHeader('Cache-Control', 'no-store');
      let pathname: string;
      try {
        // Match the WHATWG normalization used by the auth Request boundary.
        // Do not select exemptions from router-decoded paths or raw prefixes.
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
      return Promise.resolve(handler(req, res)).catch(() => {
        if (!res.headersSent) res.status(503).json({ message: 'Identity is unavailable.' });
        else res.end();
      });
    });
  }
  // Explicit parsers follow the raw auth handler; general API behavior survives.
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
  app.setGlobalPrefix('api/v1');
}
