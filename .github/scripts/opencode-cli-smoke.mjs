// Actual pinned CLI, loopback fake provider, generated fake key. No real auth.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { modelConfig, modelEnvironment, parseEvents } from './opencode-review.mjs';

const binary = process.env.OPENCODE_BIN;
assert(binary?.startsWith('/'), 'Set OPENCODE_BIN to the checksum-verified 1.19.5 binary');
const requests = [];
let malicious = false;
const reviewPrompt = 'Return only the requested JSON; do not use tools.';
const isReview = (body) => !body.messages?.some((message) => message.role === 'system' && String(message.content).startsWith('You are a title generator.')) && body.messages?.some((message) => message.role === 'user' && (typeof message.content === 'string' ? message.content.trim() === reviewPrompt : message.content?.some((part) => part.text?.trim() === reviewPrompt)));
const expected = { head: 'a'.repeat(40), base: 'b'.repeat(40), complete: true, reviewed_files: [], verdict: 'COMMENT', summary: 'Fake provider smoke response.', findings: [] };
const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  requests.push({ body, authorization: req.headers.authorization });
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
  const attempt = malicious && isReview(body);
  if (attempt) malicious = false;
  const delta = attempt ? { tool_calls: [{ index: 0, id: 'untrusted-tool', type: 'function', function: { name: 'bash', arguments: '{"command":"touch /tmp/this-must-never-run"}' } }] } : { content: JSON.stringify(expected) };
  for (const [content, reason] of [[{ role: 'assistant', ...delta }, null], [{}, attempt ? 'tool_calls' : 'stop']]) res.write(`data: ${JSON.stringify({ id: 'fake', object: 'chat.completion.chunk', created: 1, model: 'deepseek-v4.1-flash', choices: [{ index: 0, delta: content, finish_reason: reason }] })}\n\n`);
  res.end('data: [DONE]\n\n');
});
await new Promise((fulfill) => server.listen(0, '127.0.0.1', fulfill));
const directory = await mkdtemp(join(tmpdir(), 'opencode-cli-smoke-'));
try {
  const config = modelConfig('opencode-go/deepseek-v4.1-flash', 'max');
  config.provider['opencode-go'].options = { baseURL: `http://127.0.0.1:${server.address().port}/v1`, apiKey: 'fake-provider-key' };
  await mkdir(join(directory, 'home'));
  const env = modelEnvironment({ PATH: process.env.PATH, OPENCODE_API_KEY: 'fake-provider-key', GITHUB_TOKEN: 'must-not-inherit', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'must-not-inherit' }, directory, config);
  env.OPENCODE_DISABLE_MODELS_FETCH = 'true';
  const run = () => new Promise((fulfill, reject) => {
    const child = spawn(binary, ['run', '--format', 'json', '--model', config.model, '--variant', 'max', '--agent', 'review'], { cwd: directory, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Fake provider smoke timed out')); }, 45_000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => { clearTimeout(timer); fulfill({ code, stdout, stderr }); });
    child.stdin.end(reviewPrompt);
  });
  const normal = await run();
  assert.equal(normal.code, 0, `Actual CLI failed using generated fake credentials: ${normal.stderr.slice(-2000)}`);
  assert.deepEqual(parseEvents(normal.stdout), expected);
  assert(requests.length > 0);
  const reviewRequests = requests.filter(({ body }) => isReview(body));
  assert(reviewRequests.length > 0, 'Must observe the actual review request');
  for (const request of reviewRequests) {
    assert.equal(request.authorization, 'Bearer fake-provider-key');
    assert.equal(request.body.reasoning_effort, 'max', 'Pinned CLI must send effective max reasoning on the review call');
    assert.equal(request.body.tools?.length ?? 0, 0, 'Tools must be absent under wildcard deny');
  }
  malicious = true;
  const attempted = await run();
  assert.throws(() => parseEvents(attempted.stdout), 'A provider tool attempt must never establish review completion');
  console.log('Pinned CLI 1.19.5 smoke passed: fake Go-compatible provider, max on wire, no tools exposed, malicious tool attempt rejected, isolated HOME/XDG, no GitHub/OIDC credentials.');
} finally {
  await rm(directory, { recursive: true, force: true });
  await new Promise((fulfill) => server.close(fulfill));
}
