import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectTaskTransport, ProjectTaskFailure } from '../apps/web/src/lib/project-task-client.ts';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';
const creator = { principalId: 'human', name: 'Human', kind: 'human', active: true };
const project = { id: 'p', workspaceId: 'w', key: 'RIE', name: 'Project', description: '', visibility: 'workspace', version: 1, archivedAt: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', creator,
  provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null }, capabilities: { canEdit: true, canArchive: true, canRestore: false, canManageAccess: false, canChangeVisibility: false, canGrantAccess: false, canRevokeAccess: false }, url: '/projects?workspace=w&project=p' };
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

test('private policy transport preserves exact visibility/access body, captured version/key and scoped pages', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; }); const calls = []; let value = { ...project, visibility: 'private' };
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json(value); };
  const api = createProjectTaskTransport();
  await api.mutate({ type: 'create-project', workspaceId: 'w', key: 'NEW', name: 'Private', visibility: 'private' }, 'create-key', signal()); assert.equal(JSON.parse(calls.at(-1).init.body).visibility, 'private');
  await api.mutate({ type: 'change-visibility', workspaceId: 'w', projectId: 'p', expectedVersion: 3, visibility: 'workspace' }, 'visibility-key', signal());
  assert.ok(calls.at(-1).url.endsWith('/projects/p/visibility')); assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedVersion: 3, visibility: 'workspace' });
  await api.mutate({ type: 'change-access', workspaceId: 'w', projectId: 'p', principalId: 'agent', expectedVersion: 7, state: 'revoked' }, 'access-key', signal());
  assert.ok(calls.at(-1).url.endsWith('/projects/p/access/agent')); assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedVersion: 7, state: 'revoked' }); assert.equal(calls.at(-1).init.headers['Idempotency-Key'], 'access-key');
  value = { ...page([{ ...creator, role: 'admin', explicitAccess: 'revoked', implicitAccess: true, effectiveAccess: true, capabilities: { canGrant: true, canRevoke: false } }]), workspaceId: 'w', projectId: 'p', projectVersion: 7 };
  assert.equal((await api.access('w', 'p', signal(), 'human')).items[0].effectiveAccess, true); assert.ok(calls.at(-1).url.endsWith('/access?cursor=human'));
  value = { ...value, projectId: 'foreign' }; await assert.rejects(api.access('w', 'p', signal()), e => e.status === 502);
  value = { ...page([creator]), workspaceId: 'w', projectId: 'p' }; assert.equal((await api.assignees('w', 'p', signal())).items.length, 1);
  value = { ...value, items: [{ ...creator, active: false }] }; await assert.rejects(api.assignees('w', 'p', signal()), e => e.status === 502);
  const member = { ...creator, role: 'member', explicitAccess: 'active', implicitAccess: false, effectiveAccess: true, capabilities: { canGrant: false, canRevoke: true } };
  value = { project, member }; assert.equal((await api.accessReview('w', 'p', 'human', signal())).member.principalId, 'human');
  value = { project, member: { ...member, principalId: 'other' } }; await assert.rejects(api.accessReview('w', 'p', 'human', signal()), e => e.status === 502);
  globalThis.fetch = async () => Response.json({ code: 'version-conflict', current: project, accessCurrent: { ...member, principalId: 'other' } }, { status: 409 });
  await assert.rejects(api.mutate({ type: 'change-access', workspaceId: 'w', projectId: 'p', principalId: 'human', expectedVersion: 1, state: 'revoked' }, 'key', signal()), e => e.current.id === 'p' && e.accessCurrent === null);
});
test('privacy proxy allowlist admits only the exact new route and method combinations', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; }); let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p';
  for (const [suffix, method] of [['/visibility', 'POST'], ['/access', 'GET'], ['/access/human', 'POST'], ['/access/human', 'GET'], ['/assignees', 'GET']]) assert.equal((await proxyProjectTask(new Request(root + suffix, { method }))).status, 200);
  assert.equal(calls, 5);
  for (const [suffix, method] of [['/visibility', 'GET'], ['/access', 'POST'], ['/assignees', 'POST'], ['/access/human/restore', 'POST'], ['/assignees/human', 'GET'], ['/access', 'DELETE']]) assert.equal((await proxyProjectTask(new Request(root + suffix, { method }))).status, 400);
  assert.equal(calls, 5);
});
