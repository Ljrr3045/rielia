import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isHealthResponse, type HealthResponse } from '@rielia/contracts';

export const HEALTH_TIMEOUT_MS = 2000;
export const HEALTH_MAX_BYTES = 4096;
export type HealthFailure = 'LIVENESS_UNAVAILABLE' | 'LIVENESS_TIMEOUT' | 'LIVENESS_CANCELLED'
  | 'LIVENESS_HTTP_ERROR' | 'LIVENESS_INVALID_RESPONSE' | 'LIVENESS_TOO_LARGE';

export class HealthError extends Error {
  constructor(readonly code: HealthFailure) { super(code); }
}

/** No redirects, proxy environment, cookies, credentials, or upstream text escape. */
export async function readHealth(endpoint: URL, signal: AbortSignal): Promise<HealthResponse> {
  if (signal.aborted) throw new HealthError('LIVENESS_CANCELLED');
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: HealthError, value?: HealthResponse): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      if (error) { reject(error); request.destroy(); }
      else if (value) resolve(value);
    };
    const cancel = (): void => finish(new HealthError('LIVENESS_CANCELLED'));
    // agent:false closes this request's socket, including on body/error/cancel.
    // Node HTTPS uses ordinary certificate/hostname verification; no TLS override.
    const request = (endpoint.protocol === 'https:' ? httpsRequest : httpRequest)(endpoint, {
      method: 'GET', agent: false, headers: { Accept: 'application/json' }, maxHeaderSize: 8192,
    }, (response) => {
      if (response.statusCode !== 200) {
        finish(new HealthError('LIVENESS_HTTP_ERROR'));
        response.destroy();
        return;
      }
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers['content-type'] ?? '')
        || (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
        finish(new HealthError('LIVENESS_INVALID_RESPONSE'));
        response.destroy();
        return;
      }
      let bytes = 0;
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > HEALTH_MAX_BYTES) {
          finish(new HealthError('LIVENESS_TOO_LARGE'));
          response.destroy();
        } else chunks.push(chunk);
      });
      response.on('error', () => finish(new HealthError('LIVENESS_UNAVAILABLE')));
      response.on('end', () => {
        if (settled) return;
        try {
          const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!isHealthResponse(value)) throw new Error();
          // Copy only the bounded public literals; extra fields are untrusted.
          finish(undefined, { status: value.status, service: value.service });
        } catch { finish(new HealthError('LIVENESS_INVALID_RESPONSE')); }
      });
    });
    const timer = setTimeout(() => finish(new HealthError('LIVENESS_TIMEOUT')), HEALTH_TIMEOUT_MS);
    request.on('error', () => finish(new HealthError('LIVENESS_UNAVAILABLE')));
    signal.addEventListener('abort', cancel, { once: true });
    request.end();
  });
}
