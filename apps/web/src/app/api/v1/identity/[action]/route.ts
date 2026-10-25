import { proxyIdentity } from '../../../../../lib/identity-proxy';

export const dynamic = 'force-dynamic';
export function GET(request: Request): Promise<Response> | Response {
  if (!['config', 'session'].includes(new URL(request.url).pathname.split('/').at(-1) ?? '')) {
    return new Response(null, { status: 404 });
  }
  return proxyIdentity(request);
}
