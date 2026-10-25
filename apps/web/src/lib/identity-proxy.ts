// Backend destination is operator configuration, never a request parameter.
// Production edge routing should send /api/auth and /api/v1 directly to Nest.
export async function proxyIdentity(request: Request): Promise<Response> {
  try {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3001');
    const headers = new Headers();
    for (const name of ['cookie', 'content-type', 'origin', 'referer', 'user-agent', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    const init: RequestInit & { duplex: 'half' } = {
      method: request.method, headers, redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.timeout(15000), duplex: 'half',
      ...(request.method === 'GET' || request.method === 'HEAD' ? {} : { body: request.body }),
    };
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'location']) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: 'Identity API is unavailable. Try again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
