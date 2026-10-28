import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectTaskTransport, ProjectTaskFailure } from '../apps/web/src/lib/project-task-client.ts';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';
const creator = { principalId: 'human', name: 'Human', kind: 'human', active: true };
const project = { id: 'p', workspaceId: 'w', key: 'RIE', name: 'Project', description: '', visibility: 'workspace', version: 1, archivedAt: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', creator,
  provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null }, capabilities: { canEdit: true, canArchive: true, canRestore: false }, url: '/projects?workspace=w&project=p' };
const page = items => ({ items, total: items.length, nextCursor: null, capabilities: { canCreate: true } });
const task = { ...project, id: 't', projectId: 'p', projectKey: 'RIE', key: 'RIE-1', number: 1, title: 'Title', type: 'task', priority: 'none', status: 'backlog', assigneePrincipalId: null, assignee: null, dueDate: null, projectArchivedAt: null };
const signal = () => new AbortController().signal;

test('transport uses fixed scoped paths, exact command data/version/key and validates authoritative responses', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; }); const calls = []; let value = page([project]);
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json(value); };
  const api = createProjectTaskTransport({ baseURL: 'https://app.example.test' });
  assert.equal((await api.projects('w', 'archived', signal(), 'cursor')).items[0].id, 'p'); assert.ok(calls[0].url.endsWith('/workspaces/w/projects?view=archived&cursor=cursor'));
  value = task; await api.mutate({ type: 'edit-task', workspaceId: 'w', projectId: 'p', taskId: 't', expectedVersion: 7, fields: { title: 'Draft', dueDate: null } }, 'captured-key', signal());
  assert.deepEqual(JSON.parse(calls[1].init.body), { title: 'Draft', dueDate: null, expectedVersion: 7 }); assert.equal(calls[1].init.headers['Idempotency-Key'], 'captured-key'); assert.equal(calls[1].init.cache, 'no-store'); assert.equal(calls[1].init.redirect, 'error');
  value = { ...task, workspaceId: 'foreign' }; await assert.rejects(api.task('w', 'p', 't', signal()), e => e instanceof ProjectTaskFailure && e.status === 502);
  value = { ...page([project]), capabilities: undefined }; await assert.rejects(api.projects('w', 'active', signal()), e => e.status === 502);
  value = { ...project, version: 0 }; await assert.rejects(api.project('w', 'p', signal()), e => e.status === 502);
});
test('structured conflict includes current record and request ID; stalled HTTP is bounded and later retry recovers', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  const command = { type: 'edit-project', workspaceId: 'w', projectId: 'p', expectedVersion: 1, name: 'Draft', description: '' }; const api = createProjectTaskTransport({ timeout: 10 });
  globalThis.fetch = async () => Response.json({ code: 'version-conflict', current: { ...project, version: 2 } }, { status: 409, headers: { 'x-request-id': 'request' } });
  await assert.rejects(api.mutate(command, 'key', signal()), e => e.status === 409 && e.current.version === 2 && e.requestId === 'request');
  globalThis.fetch = async () => Response.json({ code: 'version-conflict', current: { ...project, workspaceId: 'foreign' } }, { status: 409 });
  await assert.rejects(api.mutate(command, 'key', signal()), e => e.status === 409 && e.current === null);
  globalThis.fetch = (_url, init) => new Promise((_resolve, reject) => { init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true }); });
  const alive = setTimeout(() => {}, 1000); try { await assert.rejects(api.project('w', 'p', signal())); } finally { clearTimeout(alive); }
  globalThis.fetch = async () => Response.json(project); assert.equal((await api.project('w', 'p', signal())).id, 'p');
});
test('proxy forwards only required cookie/origin/key, no redirects or forwarding identity; cookies/request ID/no-store retained', async t => {
  const original = globalThis.fetch; const previous = process.env.API_BASE_URL; t.after(() => { globalThis.fetch = original; if (previous === undefined) delete process.env.API_BASE_URL; else process.env.API_BASE_URL = previous; });
  process.env.API_BASE_URL = 'http://127.0.0.1:3011'; let captured;
  globalThis.fetch = async (url, init) => { captured = { url, init }; return Response.json(project, { headers: { 'set-cookie': 'renewed=value; HttpOnly', 'x-request-id': '00000000-0000-4000-8000-000000000001' } }); };
  const response = await proxyProjectTask(new Request('https://app.example.test/api/v1/workspaces/w/projects/p', { method: 'POST', headers: { cookie: 'session=value', origin: 'https://app.example.test', 'content-type': 'application/json', 'idempotency-key': 'key', 'x-forwarded-host': 'evil.test', 'x-request-id': 'forged' }, body: '{}' }));
  assert.equal(captured.url.origin, 'http://127.0.0.1:3011'); assert.equal(captured.init.headers.get('cookie'), 'session=value'); assert.equal(captured.init.headers.get('origin'), 'https://app.example.test'); assert.equal(captured.init.headers.get('x-forwarded-host'), null); assert.equal(captured.init.headers.get('x-request-id'), null);
  assert.equal(captured.init.redirect, 'manual'); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.ok(response.headers.get('set-cookie').startsWith('renewed=')); assert.equal(response.headers.get('x-request-id'), '00000000-0000-4000-8000-000000000001');
  for (const path of ['/api/v1/workspaces/w/projects/p/export', '/api/v1/workspaces/w/projects/p/tasks/t/evil', '/api/v1/workspaces/w/projects/p/tasks/t/members']) assert.equal((await proxyProjectTask(new Request(`https://app.example.test${path}`))).status, 400);
  assert.equal((await proxyProjectTask(new Request('https://app.example.test/api/v1/workspaces/w/projects', { headers: { 'x-rielia-source': 'forged' } }))).status, 400);
  globalThis.fetch = async () => { throw new Error('Private upstream details'); }; const failed = await proxyProjectTask(new Request('https://app.example.test/api/v1/workspaces/w/projects')); assert.equal(failed.status, 503); assert.ok(!(await failed.text()).includes('Private'));
});
