// Local QA only: real PG, migrations, Nest/Better Auth and Next. This file is
// outside src/, dist/ and container COPY/deploy inputs. No production login path.
import 'reflect-metadata';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { createServer as createFixtureServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { makeSignature } from 'better-auth/crypto';
import { taskStatuses, taskPriorities } from '@rielia/contracts';
import { startProcess, stopProcess } from '../../../scripts/smoke-process.mjs';
import assert from 'node:assert/strict';
import { openEventStream } from './event-stream-client.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const outputPath = resolve(process.argv[2] ?? join(tmpdir(), 'rielia-project-task-qa.json'));
if (!outputPath.startsWith(resolve(tmpdir()) + '/') && !outputPath.startsWith('/private/tmp/')) throw new Error('Write the private QA state file under the temporary directory.');
const execute = promisify(execFile); const token = randomBytes(8).toString('hex'); const name = `rielia-t06-qa-${token}`; const volume = `${name}-data`;
const directory = await mkdtemp(join(tmpdir(), 'rielia-t06-qa-')); let app; let web; let fixture; let stopping = false; let stopRequested = false; let phase = 'loopback allocation';
const image = 'postgres:18.6@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6';
async function command(executable, args, timeout = 120000) {
  if (stopRequested && !stopping) throw new Error('QA shutdown requested.');
  const result = await execute(executable, args, { cwd: root, env: process.env, timeout, maxBuffer: 2 * 1024 * 1024 });
  if (stopRequested && !stopping) throw new Error('QA shutdown requested.');
  return result;
}
async function port() { const server = createServer(); await new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', yes); }); const value = server.address().port; await new Promise(yes => server.close(yes)); return value; }
let resolveStop; const stopped = new Promise(yes => { resolveStop = yes; });
async function cleanup() {
  if (stopping) return; stopping = true;
  if (fixture) { fixture.closeAllConnections(); await new Promise((yes, no) => fixture.close(error => error ? no(error) : yes())); }
  await stopProcess(web ?? { stopped: true }); await app?.close();
  const owned = await command('docker', ['inspect', '--format', '{{index .Config.Labels "rielia.t06-qa"}}', name], 10000).catch(() => null);
  if (owned?.stdout.trim() === token) await command('docker', ['rm', '--force', name], 10000);
  const ownedVolume = await command('docker', ['volume', 'inspect', '--format', '{{index .Labels "rielia.t06-qa"}}', volume], 10000).catch(() => null);
  if (ownedVolume?.stdout.trim() === token) await command('docker', ['volume', 'rm', volume], 10000);
  const containers = await command('docker', ['ps', '--all', '--filter', `label=rielia.t06-qa=${token}`, '--format', '{{.ID}}'], 10000);
  const volumes = await command('docker', ['volume', 'ls', '--filter', `label=rielia.t06-qa=${token}`, '--format', '{{.Name}}'], 10000);
  if (containers.stdout.trim() || volumes.stdout.trim()) throw new Error('QA resources remain after cleanup.');
  await rm(directory, { recursive: true, force: true }); await rm(outputPath, { force: true }); resolveStop();
}
// Let each in-flight command settle, then the single finally block owns cleanup.
const stop = () => { stopRequested = true; resolveStop(); };
process.once('SIGTERM', stop); process.once('SIGINT', stop);
try {
  const password = randomBytes(36).toString('hex'); const secret = randomBytes(48).toString('base64'); const webPort = await port(); const origin = `http://127.0.0.1:${webPort}`;
  await writeFile(join(directory, 'database.env'), `POSTGRES_USER=qa\nPOSTGRES_DB=qa\nPOSTGRES_PASSWORD=${password}\n`, { mode: 0o600 });
  phase = 'database startup'; await command('docker', ['volume', 'create', '--label', `rielia.t06-qa=${token}`, volume]);
  await command('docker', ['run', '--detach', '--rm', '--name', name, '--label', `rielia.t06-qa=${token}`, '--publish', '127.0.0.1::5432', '--mount', `type=volume,source=${volume},target=/var/lib/postgresql`, '--env-file', join(directory, 'database.env'), image]);
  let ready = false;
  for (let n = 0; n < 60; n++) { if (await command('docker', ['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'qa', '-d', 'qa'], 3000).catch(() => null)) { ready = true; break; } await delay(250); }
  if (!ready) throw new Error('QA database readiness failed.');
  const ports = await command('docker', ['port', name, '5432/tcp']); const databasePort = /^127\.0\.0\.1:(\d+)\s*$/.exec(ports.stdout)?.[1]; if (!databasePort) throw new Error('QA database port was not loopback-only.');
  Object.assign(process.env, { NODE_ENV: 'development', IDENTITY_ENABLED: 'true', DATABASE_URL: `postgresql://qa:${password}@127.0.0.1:${databasePort}/qa`, BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: secret, IDENTITY_ALLOW_HTTP_LOOPBACK: 'true', IDENTITY_TRUSTED_PROXIES: '', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', GITHUB_CLIENT_ID: '', GITHUB_CLIENT_SECRET: '', RUNTIME_ENABLED: 'false' });
  phase = 'migration'; await command('pnpm', ['--filter', '@rielia/api', 'exec', 'prisma', 'migrate', 'deploy']);
  const { NestFactory } = await import('@nestjs/core'); const { AppModule } = await import('../dist/app.module.js'); const { configureApplication, createHttpAdapter } = await import('../dist/application.js');
  const { IdentityService } = await import('../dist/identity/identity.service.js'); const { PrincipalService } = await import('../dist/principals/principal.service.js'); const { ProjectTaskService } = await import('../dist/projects/project-task.service.js');
  phase = 'Nest startup'; app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false }); configureApplication(app); await app.listen(0, '127.0.0.1');
  const apiURL = await app.getUrl(); const prisma = app.get(IdentityService).runtime.prisma; const principals = app.get(PrincipalService); const domain = app.get(ProjectTaskService);
  async function human(label) {
    const id = randomUUID(); const sessionId = randomUUID(); const raw = randomUUID(); await prisma.user.create({ data: { id, name: label, email: `${id}@example.test`, emailVerified: true } });
    await prisma.session.create({ data: { id: sessionId, userId: id, token: raw, expiresAt: new Date(Date.now() + 24 * 3600000) } });
    const principal = await prisma.principal.findUniqueOrThrow({ where: { userId: id } });
    const value = `${raw}.${await makeSignature(raw, secret)}`; return { principalId: principal.id, userId: id, sessionId, cookie: `better-auth.session_token=${encodeURIComponent(value)}`,
      browserCookie: { name: 'better-auth.session_token', value: encodeURIComponent(value), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' } };
  }
  phase = 'fictional real-data fixture'; const owner = await human('QA Owner'); const admin = await human('QA Administrator'); const unavailable = await human('QA Historical Assignee'); const member = await human('QA Collaborator'); const viewer = await human('QA Viewer'); const outsider = await human('QA Other Tenant');
  const workspaceId = await principals.bootstrapWorkspaceForHuman(owner.userId, 'QA Workspace'); const otherWorkspaceId = await principals.bootstrapWorkspaceForHuman(outsider.userId, 'Other QA Tenant');
  const context = (await principals.webContext({ cookie: owner.cookie }, workspaceId)).context; await principals.addHumanMember(context, admin.userId, 'admin'); await principals.addHumanMember(context, unavailable.userId, 'member'); await principals.addHumanMember(context, member.userId, 'member'); await principals.addHumanMember(context, viewer.userId, 'viewer');
  const agentId = await principals.registerAgent(context, { name: 'QA Builder', role: 'member', custodianPrincipalId: owner.principalId });
  const project = await domain.createProject(context, workspaceId, randomUUID(), randomUUID(), { key: 'QAT', name: 'QA Persistent Project', description: 'Fictional local QA data' });
  const task = await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: 'QA persistent task', description: '# Safe Markdown\n\n[Documentation](https://example.test) and `<script>` as text.', assigneePrincipalId: agentId, dueDate: '2027-01-15' });
  let privateProject = await domain.createProject(context, workspaceId, randomUUID(), randomUUID(), { key: 'QAP', name: 'QA Private Project', description: 'Workspace owners and admins automatically see this content.' });
  const historicalTask = await domain.createTask(context, workspaceId, privateProject.id, randomUUID(), randomUUID(), { title: 'QA historical unavailable assignee', assigneePrincipalId: unavailable.principalId });
  privateProject = await domain.changeVisibility(context, workspaceId, privateProject.id, randomUUID(), randomUUID(), { expectedVersion: privateProject.version, visibility: 'private' });
  for (const principalId of [member.principalId, viewer.principalId, agentId]) privateProject = await domain.changeAccess(context, workspaceId, privateProject.id, principalId, randomUUID(), randomUUID(), { expectedVersion: privateProject.version, state: 'active' });
  if (process.argv.includes('--large-members')) {
    for (let n = 0; n < 101; n++) {
      const person = await human(`QA Paging Member ${n + 1}`); await principals.addHumanMember(context, person.userId, 'member');
      privateProject = await domain.changeAccess(context, workspaceId, privateProject.id, person.principalId, randomUUID(), randomUUID(), { expectedVersion: privateProject.version, state: 'active' });
    }
  }
  let taskViewFixtures = null;
  let collaborationFixtures = null;
  let discoveryFixtures = null;
  if (process.argv.includes('--discovery')) {
    const rows = [];
    for (let n = 0; n < 105; n++) rows.push(await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), {
      title: `QA discoverable task ${n + 1}`, status: taskStatuses[n % taskStatuses.length], priority: taskPriorities[n % taskPriorities.length],
      assigneePrincipalId: n % 3 === 0 ? owner.principalId : n % 3 === 1 ? member.principalId : agentId,
    }));
    discoveryFixtures = { taskIds: rows.map(row => row.id), mineURL: `${origin}/projects?workspace=${workspaceId}&taskScope=mine`, searchURL: `${origin}/projects?workspace=${workspaceId}&taskScope=search&q=discoverable` };
  }
  if (process.argv.includes('--collaboration')) {
    const { TaskCollaborationService } = await import('../dist/projects/task-collaboration.service.js'); const collaboration = app.get(TaskCollaborationService);
    const child = await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: 'QA open child remains visible after parent close', parentTaskId: task.id, expectedParentVersion: task.version });
    const archived = await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: 'QA archived open child', parentTaskId: task.id, expectedParentVersion: task.version });
    await domain.changeTask(context, workspaceId, project.id, archived.id, randomUUID(), randomUUID(), 'archive-task', { expectedVersion: archived.version });
    const leaf = await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: 'QA link or reparent this leaf' });
    async function write(execution, action, fields, itemId) {
      const current = await domain.task(execution, workspaceId, project.id, task.id);
      return collaboration.mutate(execution, workspaceId, project.id, task.id, randomUUID(), randomUUID(), action, { expectedVersion: current.version, ...fields }, itemId);
    }
    for (const text of ['Review keyboard behavior', 'Check safe Markdown and immutable author', 'Keep child work visible']) await write(context, 'add-checklist-item', { text, beforeItemId: null });
    const checklist = await collaboration.page(context, workspaceId, project.id, task.id, 'checklist'); await write(context, 'edit-checklist-item', { completed: true }, checklist.items[0].id);
    await write(context, 'add-comment', { body: '# QA evidence\n\n**Safe Markdown** and [documentation](https://example.test).\n\n<script>alert(1)</script> [unsafe](javascript:alert)\n\n```\n<img src=x onerror=alert(1)>\n```' });
    const comment = (await collaboration.page(context, workspaceId, project.id, task.id, 'comments')).items[0];
    await write(context, 'edit-comment', { body: comment.body + '\n\nEdited by its original author.', expectedCommentVersion: comment.version }, comment.id);
    const memberContext = (await principals.webContext({ cookie: member.cookie }, workspaceId)).context; await write(memberContext, 'add-comment', { body: 'QA collaborator comment; owner cannot edit this author.' });
    for (const [subjectPrincipalId, mode] of [[owner.principalId, 'delegated'], [agentId, 'autonomous']]) {
      const grant = await principals.recordInternalGrant(context, { subjectPrincipalId, mode, allowedOperations: ['read', 'write'], expiresAt: new Date(Date.now() + 3600000) });
      await write(await principals.internalGrantContext(grant, workspaceId), 'add-comment', { body: `QA ${mode} authorship` });
    }
    if (process.argv.includes('--large-collaboration')) {
      for (let n = 0; n < 101; n++) {
        await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: `QA child ${n + 1}`, parentTaskId: task.id, expectedParentVersion: (await domain.task(context, workspaceId, project.id, task.id)).version });
        await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), { title: `QA parent candidate ${n + 1}` });
        await write(context, 'add-comment', { body: `QA paged comment ${n + 1}` });
      }
    }
    collaborationFixtures = { parentTaskId: task.id, childTaskId: child.id, archivedOpenChildId: archived.id, leafTaskId: leaf.id, ownCommentId: comment.id, parentURL: `${origin}${task.url}`, leafURL: `${origin}${leaf.url}` };
  }
  if (process.argv.includes('--task-views')) {
    const rows = [];
    for (let n = 0; n < 114; n++) rows.push(await domain.createTask(context, workspaceId, project.id, randomUUID(), randomUUID(), {
      title: n === 0 ? 'A long persistent task title for responsive list and board verification with explicit human and Agent attribution' : `QA ordered task ${n + 1}`,
      status: n < 104 ? 'backlog' : taskStatuses[(n - 104) % taskStatuses.length], priority: taskPriorities[n % taskPriorities.length],
      assigneePrincipalId: n % 3 === 0 ? agentId : n % 3 === 1 ? member.principalId : null,
    }));
    const archived = rows.at(-1); await domain.changeTask(context, workspaceId, project.id, archived.id, randomUUID(), randomUUID(), 'archive-task', { expectedVersion: archived.version });
    taskViewFixtures = { sourceTaskId: rows[0].id, anchorTaskId: rows[1].id, taskIds: rows.map(row => row.id),
      boardURL: `${origin}${project.url}&taskLayout=board`, filteredURL: `${origin}${project.url}&priority=urgent&assignee=unassigned` };
  }
  if (stopRequested) throw new Error('QA shutdown requested.');
  // Separate loopback test server; it never shares product routing or bundles.
  // Host headers cannot select redirect destinations or fixture subjects.
  const subjects = { owner, admin, member, viewer, unavailable, outsider };
  fixture = createFixtureServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const match = /^\/as\/(owner|admin|member|viewer|unavailable|outsider|signed-out)$/.exec(req.url ?? '');
    if (req.method !== 'GET' || !match) { res.writeHead(404); res.end(); return; }
    const subject = match[1];
    res.setHeader('Set-Cookie', subject === 'signed-out' ? 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      : `${subjects[subject].cookie}; Path=/; HttpOnly; SameSite=Lax`);
    res.writeHead(303, { Location: `${origin}/projects` }); res.end();
  });
  await new Promise((yes, no) => { fixture.once('error', no); fixture.listen(0, '127.0.0.1', yes); });
  const fixtureOrigin = `http://127.0.0.1:${fixture.address().port}`;
  const fixtureURLs = Object.fromEntries(['owner', 'admin', 'member', 'viewer', 'unavailable', 'outsider', 'signed-out'].map(subject => [subject, `${fixtureOrigin}/as/${subject}`]));
  const fixtureProbe = await fetch(fixtureURLs.owner, { redirect: 'manual' });
  if (fixtureProbe.status !== 303 || fixtureProbe.headers.get('location') !== `${origin}/projects` || !fixtureProbe.headers.get('set-cookie')?.includes('HttpOnly')) throw new Error('QA fixture session switching failed.');
  phase = 'Next startup/proxy'; web = startProcess('T06 QA Next', ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(webPort)], join(root, 'apps/web'), { ...process.env, API_BASE_URL: apiURL });
  let webReady = false;
  for (let n = 0; n < 120; n++) {
    if (stopRequested) throw new Error('QA shutdown requested.');
    if (web.child.exitCode !== null || web.error) throw new Error('QA Next process failed.');
    try { const response = await fetch(`${origin}/api/v1/workspaces/${workspaceId}/projects/${project.id}/tasks/${task.id}`, { headers: { cookie: owner.cookie }, signal: AbortSignal.timeout(1000) }); if (response.status === 200 && (await response.json()).id === task.id) { webReady = true; break; } } catch { /* bounded readiness retry */ }
    await delay(250);
  }
  if (!webReady) throw new Error('QA Next real proxy readiness failed.');
  for (const [person, expectedStatus] of [[owner, 200], [admin, 200], [member, 200], [viewer, 200], [unavailable, 403], [outsider, 403]]) {
    const response = await fetch(`${origin}/api/v1/workspaces/${workspaceId}/projects/${privateProject.id}`, { headers: { cookie: person.cookie } });
    if (response.status !== expectedStatus) throw new Error('QA private project access probe failed.');
  }
  const historyResponse = await fetch(`${origin}/api/v1/workspaces/${workspaceId}/projects/${privateProject.id}/tasks/${historicalTask.id}`, { headers: { cookie: admin.cookie } });
  if (historyResponse.status !== 200 || (await historyResponse.json()).assignee.active !== false) throw new Error('QA historical assignee probe failed.');
  if (taskViewFixtures) {
    const path = `${origin}/api/v1/workspaces/${workspaceId}/projects/${project.id}/tasks`;
    const firstResponse = await fetch(`${path}?status=backlog`, { headers: { cookie: owner.cookie } }); const first = await firstResponse.json();
    if (firstResponse.status !== 200 || first.items.length !== 100 || !first.nextCursor || first.orderVersion < 1) throw new Error('QA ordered page probe failed.');
    const tailResponse = await fetch(`${path}?status=backlog&cursor=${first.nextCursor}`, { headers: { cookie: owner.cookie } }); const tail = await tailResponse.json();
    if (tailResponse.status !== 200 || tail.orderVersion !== first.orderVersion || tail.items.length < 1) throw new Error('QA ordered tail probe failed.');
    const source = first.items.find(row => row.id === taskViewFixtures.sourceTaskId); const key = randomUUID();
    const body = JSON.stringify({ expectedVersion: source.version, expectedOrderVersion: first.orderVersion, status: 'todo', beforeTaskId: null });
    const init = { method: 'POST', headers: { cookie: owner.cookie, origin, 'content-type': 'application/json', 'idempotency-key': key }, body };
    const movedResponse = await fetch(`${path}/${source.id}/move`, init); const moved = await movedResponse.json();
    const replayResponse = await fetch(`${path}/${source.id}/move`, init); const replay = await replayResponse.json();
    if (movedResponse.status !== 201 || replayResponse.status !== 201 || moved.status !== 'todo' || moved.version !== replay.version || moved.orderVersion <= first.orderVersion) throw new Error('QA move/replay probe failed.');
    const stale = await fetch(`${path}?status=backlog&cursor=${first.nextCursor}`, { headers: { cookie: owner.cookie } });
    if (stale.status !== 409 || (await stale.json()).code !== 'page-changed') throw new Error('QA changed-page probe failed.');
  }
  if (discoveryFixtures) {
    phase = 'T10 real Next discovery and streaming'; const rootURL = `${origin}/api/v1/workspaces/${workspaceId}`;
    const read = async (path, person = owner) => { const response = await fetch(rootURL + path, { headers: { cookie: person.cookie } }); assert.equal(response.status, 200); return response.json(); };
    const post = async (path, body, person = owner) => { const response = await fetch(rootURL + path, { method: 'POST', headers: { cookie: person.cookie, origin, 'content-type': 'application/json', 'idempotency-key': randomUUID() }, body: JSON.stringify(body) }); return { status: response.status, data: await response.json() }; };
    const first = await read('/task-discovery?q=discoverable'); assert.equal(first.items.length, 100); const tail = await read(`/task-discovery?q=discoverable&cursor=${first.nextCursor}`); assert.equal(new Set([...first.items, ...tail.items].map(row => row.id)).size, 105);
    const mine = await read('/task-discovery?scope=mine', member); assert.equal(mine.total, 35); assert.ok(mine.items.every(row => row.assigneePrincipalId === member.principalId));
    assert.equal((await read(`/task-discovery?q=${historicalTask.id}`, unavailable)).total, 0);
    const one = await openEventStream(origin, workspaceId, owner.cookie); const two = await openEventStream(origin, workspaceId, member.cookie);
    let resume;
    try {
      resume = (await two.wait(row => row.id)).id; await one.wait(row => row.id);
      const current = await read(`/projects/${project.id}/tasks/${task.id}`); const saved = await post(`/projects/${project.id}/tasks/${task.id}`, { expectedVersion: current.version, title: 'QA committed proxy invalidation' }, member); assert.equal(saved.status, 201);
      for (const stream of [one, two]) await stream.wait(row => row.data.id === task.id && row.data.version === saved.data.version);
      // The event really passes the proxy, and its JSON route immediately reads
      // the persisted version instead of treating the hint as a task store.
      assert.equal((await read(`/projects/${project.id}/tasks/${task.id}`)).version, saved.data.version);
      const before = await prisma.outboxEvent.count();
      await prisma.$executeRawUnsafe(`CREATE FUNCTION t10_qa_rollback() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''QA deferred rollback''; END'`);
      await prisma.$executeRawUnsafe(`CREATE CONSTRAINT TRIGGER t10_qa_rollback AFTER INSERT ON task DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.title='QA rollback stream witness') EXECUTE FUNCTION t10_qa_rollback()`);
      try { assert.equal((await post(`/projects/${project.id}/tasks`, { title: 'QA rollback stream witness' })).status, 503); }
      finally { await prisma.$executeRawUnsafe('DROP TRIGGER t10_qa_rollback ON task'); await prisma.$executeRawUnsafe('DROP FUNCTION t10_qa_rollback()'); }
      assert.equal(await prisma.outboxEvent.count(), before);
      // More than the JSON proxy deadline: heartbeat must remain unbuffered.
      await two.wait(row => row.data.type === 'heartbeat', 18000);
      let policy = await read(`/projects/${privateProject.id}`); const start = two.records.length;
      const revoked = await post(`/projects/${privateProject.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'revoked' }); assert.equal(revoked.status, 201); policy = revoked.data;
      await two.wait(row => row.data.type === 'reset' && two.records.indexOf(row) >= start);
      const hidden = await post(`/projects/${privateProject.id}/tasks`, { title: 'QA private post-revocation' }); assert.equal(hidden.status, 201); await delay(1200); assert.ok(two.records.slice(start).every(row => row.data.projectId !== privateProject.id));
      assert.equal((await read(`/task-discovery?q=${hidden.data.id}`, member)).total, 0);
      assert.equal((await post(`/projects/${privateProject.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'active' })).status, 201);
    } finally { await one.close(); await two.close(); }
    const replay = await openEventStream(origin, workspaceId, member.cookie, resume); await replay.wait(row => row.id); await replay.close();
    const fallback = await openEventStream(origin, workspaceId, owner.cookie, 'expired-or-foreign-handle'); assert.equal((await fallback.wait(row => row.id)).data.type, 'reset'); await fallback.close();
    const { TaskEventsService } = await import('../dist/projects/task-events.service.js'); const eventService = app.get(TaskEventsService);
    for (let n = 0; n < 100 && eventService.connections.size; n++) await delay(20); assert.equal(eventService.connections.size, 0);
    console.log('T10 real Nest/Next proxy: search/mine paging, two-session committed invalidation, rollback silence, >15s heartbeat, private revocation, resume/reset and abort cleanup passed.');
  }
  if (collaborationFixtures) {
    phase = 'collaboration Next proxy'; const path = `${origin}/api/v1/workspaces/${workspaceId}/projects/${project.id}/tasks/${task.id}`;
    const read = async suffix => { const response = await fetch(path + suffix, { headers: { cookie: owner.cookie } }); if (response.status !== 200) throw new Error('QA collaboration read failed.'); return response.json(); };
    for (const collection of ['relations', 'parent-candidates', 'checklist', 'comments', 'history']) await read(`/${collection}`);
    const current = await read(''); const key = randomUUID();
    const post = async (suffix, payload, subject = owner, requestKey = randomUUID()) => {
      const response = await fetch(path + suffix, { method: 'POST', headers: { cookie: subject.cookie, origin, 'content-type': 'application/json', 'idempotency-key': requestKey }, body: JSON.stringify(payload) }); return { status: response.status, data: await response.json() };
    };
    const input = { expectedVersion: current.version, body: 'Real Next proxy duplicate-free comment' }; const saved = await post('/comments', input, owner, key); const replay = await post('/comments', input, owner, key);
    if (saved.status !== 201 || replay.status !== 201 || saved.data.version !== replay.data.version) throw new Error('QA collaboration replay failed.');
    if ((await read('/comments')).items[0]?.body !== input.body) throw new Error('QA recent comment discovery failed.');
    const warning = await post('', { expectedVersion: saved.data.version, status: 'done' });
    if (warning.status !== 409 || warning.data.code !== 'open-children' || warning.data.closeWarning.open < 2) throw new Error('QA parent-close warning failed.');
    const closed = await post('', { expectedVersion: saved.data.version, status: 'done', acknowledgedChildrenVersion: warning.data.closeWarning.childrenVersion });
    if (closed.status !== 201 || !(await read('/relations')).items.some(row => row.id === collaborationFixtures.childTaskId)) throw new Error('QA child visibility failed.');
    if ((await post('/comments', { expectedVersion: closed.data.version, body: 'Viewer denied' }, viewer)).status !== 403) throw new Error('QA viewer collaboration denial failed.');
    const reopened = await post('', { expectedVersion: closed.data.version, status: 'backlog' }); if (reopened.status !== 201) throw new Error('QA parent reopen failed.');
  }
  await writeFile(outputPath, JSON.stringify({ pid: process.pid, origin, apiURL, fixtureURLs, container: name, volume, workspaceId, otherWorkspaceId, projectId: project.id, taskId: task.id, agentId, owner, admin, member, viewer, unavailable, outsider, privateProjectId: privateProject.id, historicalTaskId: historicalTask.id, largeMembers: process.argv.includes('--large-members'), taskViewFixtures, collaborationFixtures, discoveryFixtures,
    projectURL: `${origin}${project.url}`, taskURL: `${origin}${task.url}`, privateProjectURL: `${origin}${privateProject.url}`, historicalTaskURL: `${origin}${historicalTask.url}` }, null, 2), { mode: 0o600 });
  console.log(`Real PG/Nest/Next QA ready at ${origin}; private session/state file: ${outputPath}. SIGTERM/SIGINT cleans owned servers, container, volume and state file.`);
  if (process.argv.includes('--smoke')) resolveStop();
  await stopped;
} catch (error) { if (!stopRequested) { console.error(`Local project/task QA failed during ${phase} (${typeof error?.code === 'string' ? error.code : 'failed'}); diagnostics withheld because runtime values are private.`); process.exitCode = 1; } }
finally { await cleanup(); process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop); }
