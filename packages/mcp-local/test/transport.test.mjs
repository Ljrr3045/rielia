import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as createTlsServer } from 'node:https';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { assertGroupExited, backend, config, diagnostic, fixture, health, main, root, trackedProcess, wire } from './helpers.mjs';

test('SDK 2.4.0 child process talks to real Nest in legacy and modern eras', async (t) => {
  const origin = await backend(t);
  for (const mode of ['legacy', { pin: '2026-07-28' }]) {
    const transport = new StdioClientTransport({ command: process.execPath, args: [main], env: config(origin), stderr: 'pipe' });
    const client = new Client({ name: 'rielia-sdk-test', version: '0.0.0' }, { versionNegotiation: { mode } });
    t.after(() => client.close());
    let stderr = '';
    transport.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    await client.connect(transport);
    assert.equal(client.getNegotiatedProtocolVersion(), mode === 'legacy' ? '2025-11-25' : '2026-07-28');
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, 'rielia_health');
    assert.equal(tools[0].inputSchema.additionalProperties, false);
    assert.match(tools[0].description, /not authentication, database health, product readiness, or user capabilities/);
    assert.deepEqual(tools[0].annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true });
    const result = await client.callTool({ name: 'rielia_health', arguments: {} });
    assert.deepEqual(result.structuredContent, health);
    assert.deepEqual(result.content, [{ type: 'text', text: JSON.stringify(health) }]);
    assert.notEqual(result.isError, true);
    const pid = transport.pid;
    await client.close();
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
    assert.equal(stderr, '');
    t.diagnostic(`SDK 2.4.0 negotiated ${client.getNegotiatedProtocolVersion() ?? (mode === 'legacy' ? '2025-11-25' : '2026-07-28')}`);
  }
});

test('official Inspector 2.12.0 CLI initializes/lists/calls real Nest; isolated settings', async (t) => {
  const origin = await backend(t);
  const directory = await mkdtemp(join(tmpdir(), 'rielia-mcp-inspector-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const settings = join(directory, 'client.json');
  await writeFile(settings, '{}');
  const launcher = new URL('../node_modules/@modelcontextprotocol/inspector/clients/launcher/build/index.js', import.meta.url).pathname;
  for (const era of ['legacy', 'modern']) {
    for (const method of ['initialize', 'tools/list', 'tools/call']) {
      const args = [launcher, '--cli', '--format', 'json', '--quiet', '--stored-auth-only',
        '--client-config', settings, '--protocol-era', era, '--connect-timeout', '5000', '--method', method,
        '-e', `RIELIA_API_ORIGIN=${origin}`, '-e', 'RIELIA_MCP_ALLOW_LOOPBACK_HTTP=true',
        ...(method === 'tools/call' ? ['--tool-name', 'rielia_health'] : []), process.execPath, main];
      const entry = trackedProcess(t, 'Inspector CLI', args, root, {
        MCP_INSPECTOR_SECRET_STORE: 'memory', MCP_INSPECTOR_OAUTH_STATE_PATH: join(directory, 'oauth.json'),
        MCP_CATALOG_PATH: join(directory, 'catalog.json'),
      });
      let stdout = '';
      entry.child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      const result = await Promise.race([once(entry.child, 'exit'), delay(10000, 'timeout', { ref: false })]);
      assert.deepEqual(result, [0, null], entry.log);
      await assertGroupExited(entry);
      // Inspector --format json wraps the protocol result in { result }.
      const envelope = JSON.parse(stdout);
      assert.deepEqual(Object.keys(envelope), ['result'], stdout);
      const output = envelope.result;
      if (method === 'initialize') {
        assert.equal(output.protocolVersion, era === 'legacy' ? '2025-11-25' : '2026-07-28');
        assert.equal(output.serverInfo.name, 'rielia-local-experimental');
        t.diagnostic(`Inspector 2.12.0 ${era} initialize stdout: ${stdout.trim()}`);
      } else if (method === 'tools/list') {
        assert.equal(output.tools.length, 1);
        assert.equal(output.tools[0].name, 'rielia_health');
      } else assert.deepEqual(output.structuredContent, health);
    }
  }
});

test('wire rejects unknown tool and model-controlled arguments without HTTP requests', async (t) => {
  let requests = 0;
  const { origin } = await fixture(t, (_req, res) => { requests++; res.end(); });
  const peer = await diagnostic(t, origin);
  const unknown = await peer.request('tools/call', { name: 'get_task', arguments: {} }).answer;
  assert(unknown.error || unknown.result?.isError);
  for (const args of [{ url: 'https://example.invalid/private', headers: { Authorization: 'synthetic-secret' } }, [], 'bad']) {
    const result = await peer.request('tools/call', { name: 'rielia_health', arguments: args }).answer;
    assert(result.error || result.result?.isError);
  }
  assert.equal(requests, 0);
  await peer.close();
});

test('untrusted upstream failures are bounded, sanitized, and recoverable over wire', async (t) => {
  let responseMode = 'malformed';
  let redirectHits = 0;
  const target = await fixture(t, (_req, res) => { redirectHits++; res.end('private'); });
  const upstream = await fixture(t, (req, res) => {
    assert.equal(req.url, '/api/v1/health');
    assert.equal(req.method, 'GET');
    assert.equal(req.headers.authorization, undefined);
    assert.equal(req.headers.cookie, undefined);
    res.setHeader('Content-Type', 'application/json');
    if (responseMode === 'malformed') res.end('{synthetic-private-upstream');
    if (responseMode === 'shape') res.end(JSON.stringify({ status: 'synthetic-private-upstream', service: 'rielia-api' }));
    if (responseMode === 'http') { res.statusCode = 503; res.end('synthetic-private-upstream'); }
    if (responseMode === 'oversize') res.end('x'.repeat(4097));
    if (responseMode === 'redirect') { res.statusCode = 302; res.setHeader('Location', `${target.origin}/secret`); res.end(); }
    if (responseMode === 'timeout') res.write('{');
    if (responseMode === 'type') { res.setHeader('Content-Type', 'text/html'); res.end('synthetic-private-upstream'); }
    if (responseMode === 'ok') res.end(JSON.stringify({ ...health, instructions: 'synthetic-private-upstream', token: 'synthetic-secret' }));
  });
  const peer = await diagnostic(t, upstream.origin);
  for (const [mode, code] of [
    ['malformed', 'LIVENESS_INVALID_RESPONSE'], ['shape', 'LIVENESS_INVALID_RESPONSE'],
    ['http', 'LIVENESS_HTTP_ERROR'], ['oversize', 'LIVENESS_TOO_LARGE'], ['redirect', 'LIVENESS_HTTP_ERROR'],
    ['type', 'LIVENESS_INVALID_RESPONSE'], ['timeout', 'LIVENESS_TIMEOUT'],
  ]) {
    responseMode = mode;
    const before = Date.now();
    const { result } = await peer.request('tools/call', { name: 'rielia_health', arguments: {} }).answer;
    assert.deepEqual(result, { isError: true, content: [{ type: 'text', text: code }] });
    assert(Date.now() - before < 4000);
  }
  assert.equal(redirectHits, 0);
  responseMode = 'ok';
  const { result } = await peer.request('tools/call', { name: 'rielia_health', arguments: {} }).answer;
  assert.deepEqual(result.structuredContent, health);
  assert(!JSON.stringify(result).includes('synthetic-'));
  await peer.close();
});

test('connection refusal is a sanitized tool error', async (t) => {
  const { server, origin } = await fixture(t, (_req, res) => res.end());
  await new Promise((resolve) => server.close(resolve));
  const peer = await diagnostic(t, origin);
  const { result } = await peer.request('tools/call', { name: 'rielia_health', arguments: {} }).answer;
  assert.deepEqual(result, { isError: true, content: [{ type: 'text', text: 'LIVENESS_UNAVAILABLE' }] });
  await peer.close();
});

test('configuration fails closed before protocol output and never prints values', async (t) => {
  for (const value of [undefined, 'http://example.com', 'http://127.0.0.1', 'ftp://127.0.0.1',
    'https://user:synthetic-secret@example.com', 'https://example.com?token=synthetic-secret',
    'https://example.com#synthetic-secret', 'https://example.com/private', 'https://@example.com',
    'https://example.com?', 'https://example.com\\private', 'https://example.com\n', 'not-a-url']) {
    const peer = wire(t, value === undefined ? {} : { RIELIA_API_ORIGIN: value });
    assert.deepEqual(await peer.exited, [1, null]);
    assert.equal(peer.lines.length, 0);
    assert.equal(peer.stderr(), 'MCP startup failed: invalid configuration; see docs/development/local-mcp.md.\n');
  }
});

test('cancellation, EOF, SIGINT and SIGTERM abort active HTTP and leave no child/socket', async (t) => {
  for (const action of ['cancel', 'eof', 'SIGINT', 'SIGTERM']) {
    await t.test(action, async (t) => {
      let seen;
      let closed;
      const started = new Promise((resolve) => { seen = resolve; });
      const disconnected = new Promise((resolve) => { closed = resolve; });
      const { origin } = await fixture(t, (_req, res) => {
        res.on('close', closed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write('{');
        seen();
      });
      const peer = await diagnostic(t, origin);
      const call = peer.request('tools/call', { name: 'rielia_health', arguments: {} });
      await started;
      if (action === 'cancel') {
        peer.send({ method: 'notifications/cancelled', params: { requestId: call.id, reason: 'test' } });
      } else if (action === 'eof') peer.child.stdin.end();
      else peer.child.kill(action);
      assert.notEqual(await Promise.race([disconnected, delay(1000, 'timeout', { ref: false })]), 'timeout');
      await peer.close();
    });
  }
});

test('HTTPS rejects an untrusted self-signed certificate with normal validation', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'rielia-mcp-tls-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  // Ephemeral public test certificate/key only; never a real installation credential.
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=localhost', '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem')], { stdio: 'ignore' });
  const { readFile } = await import('node:fs/promises');
  let hits = 0;
  const server = createTlsServer({ key: await readFile(join(directory, 'key.pem')), cert: await readFile(join(directory, 'cert.pem')) }, (_req, res) => { hits++; res.end(JSON.stringify(health)); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const peer = wire(t, { RIELIA_API_ORIGIN: `https://127.0.0.1:${server.address().port}` });
  await peer.initialize();
  const { result } = await peer.request('tools/call', { name: 'rielia_health', arguments: {} }).answer;
  assert.deepEqual(result, { isError: true, content: [{ type: 'text', text: 'LIVENESS_UNAVAILABLE' }] });
  assert.equal(hits, 0);
  await peer.close();
});
