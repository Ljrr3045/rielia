/** Fixed API destination and allowlist; selectors never select an upstream. */
import { isTaskFilters } from '@rielia/contracts';
export async function proxyProjectTask(request: Request): Promise<Response> {
  const fail = (status: number) => Response.json({ message: 'Project/task request unavailable.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const incoming = new URL(request.url); const id = '[A-Za-z0-9_-]{1,128}';
    const root = `/api/v1/workspaces/${id}/projects`;
    const read = new RegExp(`^${root}(?:/${id}(?:/(?:access(?:/${id})?|assignees|tasks(?:/${id})?))?)?$`);
    const write = new RegExp(`^${root}(?:/${id}(?:/(?:archive|restore|visibility|access/${id}|tasks(?:/${id}(?:/(?:archive|restore|move))?)?))?)?$`);
    const taskRoot = `${root}/${id}/tasks/${id}`;
    const collaborationRead = new RegExp(`^${taskRoot}/(?:relations|parent-candidates|checklist|comments(?:/${id})?|history)$`);
    const collaborationWrite = new RegExp(`^${taskRoot}/(?:parent|checklist(?:/${id}(?:/(?:move|remove))?)?|comments(?:/${id})?)$`);
    if (!(request.method === 'GET' ? read.test(incoming.pathname) || collaborationRead.test(incoming.pathname)
      : request.method === 'POST' ? write.test(incoming.pathname) || collaborationWrite.test(incoming.pathname) : false)) return fail(400);
    const tasks = new RegExp(`^${root}/${id}/tasks$`).test(incoming.pathname);
    const collection = tasks || incoming.pathname.endsWith('/projects');
    const collaboration = new RegExp(`^${taskRoot}/(?:relations|parent-candidates|checklist|comments|history)$`).test(incoming.pathname);
    const cursorOnly = /\/(access|assignees)$/.test(incoming.pathname) || collaboration;
    const allowed = request.method !== 'GET' ? [] : tasks ? ['view', 'cursor', 'status', 'assignee', 'priority'] : collection ? ['view', 'cursor'] : cursorOnly ? ['cursor'] : [];
    if ([...incoming.searchParams.keys()].some(key => !allowed.includes(key) || incoming.searchParams.getAll(key).length !== 1)) return fail(400);
    const filters = Object.fromEntries(['status', 'assignee', 'priority'].filter(key => incoming.searchParams.has(key)).map(key => [key, incoming.searchParams.get(key)]));
    const cursor = incoming.searchParams.get('cursor'); const view = incoming.searchParams.get('view');
    if (!isTaskFilters(filters) || (view !== null && !['active', 'archived'].includes(view)) || (cursor !== null && !(tasks || collaboration ? /^[A-Za-z0-9_-]{1,2048}$/ : /^[A-Za-z0-9_-]{1,128}$/).test(cursor))) return fail(400);
    const forbidden = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    if ([...request.headers.keys()].some(key => forbidden.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')))) return fail(400);
    if (request.method === 'GET' && (request.headers.has('transfer-encoding') || (request.headers.has('content-length') && request.headers.get('content-length') !== '0'))) return fail(400);
    const target = new URL(incoming.pathname + incoming.search, process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3001');
    const headers = new Headers();
    for (const name of ['cookie', 'content-type', 'origin', 'sec-fetch-site', 'idempotency-key']) { const value = request.headers.get(name); if (value !== null) headers.set(name, value); }
    const response = await fetch(target, { method: request.method, headers, redirect: 'manual', cache: 'no-store', signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
      ...(request.method === 'GET' ? {} : { body: request.body, duplex: 'half' } as RequestInit) });
    const output = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': response.headers.get('content-type') ?? 'application/json' });
    const requestId = response.headers.get('x-request-id'); if (requestId && /^[0-9a-f-]{36}$/.test(requestId)) output.set('x-request-id', requestId);
    for (const cookie of response.headers.getSetCookie()) output.append('set-cookie', cookie);
    return new Response(response.body, { status: response.status, headers: output });
  } catch { return fail(503); }
}
