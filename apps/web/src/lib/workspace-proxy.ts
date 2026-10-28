// Product API fallback for local same-origin Next hosting. Edge routing can send
// these exact paths directly to Nest. No destination or actor comes from input.
export async function proxyWorkspace(request: Request): Promise<Response> {
  const fail = (status: number) => Response.json({ message: 'Workspace request unavailable.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const incoming = new URL(request.url);
    const identifier = '[A-Za-z0-9_-]{1,128}';
    const allowed = new RegExp(`^/api/v1/(?:workspaces(?:/${identifier}(?:/(?:members(?:/${identifier})?|agents(?:/${identifier})?|invitations(?:/${identifier}/revoke)?|execution-context))?)?|workspace-invitations/accept)$`);
    if (!allowed.test(incoming.pathname) || !['GET', 'POST'].includes(request.method)) return fail(400);
    const forbidden = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    if ([...request.headers.keys()].some(key => forbidden.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')))) return fail(400);
    const target = new URL(incoming.pathname + incoming.search, process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3001');
    const headers = new Headers();
    for (const name of ['cookie', 'content-type', 'origin', 'sec-fetch-site', 'idempotency-key']) {
      const value = request.headers.get(name); if (value !== null) headers.set(name, value);
    }
    const init: RequestInit & { duplex: 'half' } = { method: request.method, headers, redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]), duplex: 'half', ...(request.method === 'GET' ? {} : { body: request.body }) };
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' });
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch { return fail(503); }
}
