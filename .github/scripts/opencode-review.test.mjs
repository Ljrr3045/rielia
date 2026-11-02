/* global structuredClone */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { GitHub, LIMITS, Obsolete, ReviewFailure, assertFresh, authorize, buildPrompt, changedLines, collectCliOutput, commandContext, exchangeToken, formatFailure, modelConfig, modelEnvironment, parseEvents, plan, prepare, publish, snapshot, validateRelay, validateResult } from './opencode-review.mjs';

const repo = 'Ljrr3045/rielia';
const head = 'a'.repeat(40);
const base = 'b'.repeat(40);
const human = { login: 'maintainer', type: 'User' };
const bot = { login: 'opencode-agent[bot]', type: 'Bot' };
const patch = '@@ -1,2 +1,2 @@\n unchanged\n-old\n+new';
function pr(overrides = {}) { return { number: 7, state: 'open', draft: false, changed_files: 1, head: { sha: head, repo: { full_name: repo } }, base: { sha: base, ref: 'dev', repo: { full_name: repo } }, ...overrides }; }
function event(body = '/oc review', kind = 'root') { return { repository: { full_name: repo }, action: 'created', sender: human, comment: { id: 9 }, ...(kind === 'root' ? { issue: { number: 7, pull_request: {} } } : { pull_request: { number: 7 } }), body }; }
function comment(body = '/oc review', overrides = {}) { return { id: 9, user: human, body, ...overrides }; }
function fakeApi(routes = {}) {
  const calls = [];
  const contents = Object.entries(routes).filter(([path]) => path.startsWith('/contents/')).map(([path, blob]) => ({ path: path.slice('/contents/'.length, path.indexOf('?ref=')), ref: path.split('?ref=')[1], blob, sha: createHash('sha1').update(path).digest('hex') }));
  const treeSha = (ref) => createHash('sha1').update(`tree-${ref}`).digest('hex');
  const api = { root: `/repos/${repo}`, calls,
    async get(path) {
      calls.push(['GET', path]);
      if (path in routes) { const value = routes[path]; return typeof value === 'function' ? value() : structuredClone(value); }
      const commit = /^\/git\/commits\/([a-f0-9]{40})$/.exec(path);
      if (commit) return { sha: commit[1], tree: { sha: treeSha(commit[1]) } };
      const tree = /^\/git\/trees\/([a-f0-9]{40})\?recursive=1$/.exec(path);
      if (tree) return { sha: tree[1], truncated: false, tree: contents.filter((entry) => treeSha(entry.ref) === tree[1]).map((entry) => ({ path: entry.path, sha: entry.sha, type: 'blob', mode: entry.blob.mode ?? (entry.blob.type === 'symlink' ? '120000' : '100644'), size: entry.blob.size })) };
      const blob = /^\/git\/blobs\/([a-f0-9]{40})$/.exec(path);
      if (blob) { const entry = contents.find((entry) => entry.sha === blob[1]); if (entry) return { ...entry.blob, sha: entry.sha }; }
      throw new Error(`Unexpected GET ${path}`);
    },
    async list(path) { return this.get(path); },
    async post(path, body) { calls.push(['POST', path, body]); return { id: 123, html_url: 'https://example.test/review', commit_id: head, state: { APPROVE: 'APPROVED', REQUEST_CHANGES: 'CHANGES_REQUESTED', COMMENT: 'COMMENTED' }[body.event] }; },
    async request(method, path, body) { calls.push([method, path, body]); return {}; },
    repository(name) { calls.push(['REPOSITORY', name]); return api; },
  };
  return api;
}
function input(overrides = {}) { return { expected: snapshot(pr()), mode: 'review', files: [{ path: 'a.js', patch }], allPaths: ['a.js'], limitations: [], ...overrides }; }
function generated(overrides = {}) { return { model: 'opencode-go/deepseek-v4.1-flash', variant: 'max', result: { head, base, complete: true, reviewed_files: ['a.js'], verdict: 'APPROVE', summary: 'Reviewed the actual change and no actionable defects found.', findings: [], ...overrides } }; }
const hasCode = (code) => (error) => error instanceof ReviewFailure && error.code === code;
function commandApi(body = '/oc review', extra = {}) { return fakeApi({ '/issues/comments/9': comment(body), '/pulls/comments/9': comment(body), '/collaborators/maintainer/permission': { permission: 'write' }, '/pulls/7': pr(), '/pulls/7/reviews': [], '/pulls/7/comments': [], '/issues/7/comments': [], ...extra }); }

test('automatic events cover every non-main base, forks, drafts and base retarget', async () => {
  for (const action of ['opened', 'synchronize', 'reopened', 'ready_for_review', 'edited']) {
    for (const ref of ['dev', 'release/next']) {
      const api = fakeApi({ '/pulls/7': pr({ draft: true, head: { sha: head, repo: { full_name: 'outside/fork' } }, base: { sha: base, ref, repo: { full_name: repo } } }) });
      assert.deepEqual(await plan(api, 'pull_request_target', { repository: { full_name: repo }, action, changes: { base: {} }, pull_request: { number: 7 } }), [7]);
    }
  }
  assert.deepEqual(await plan(fakeApi(), 'pull_request_target', { repository: { full_name: repo }, action: 'edited', changes: { title: {} }, pull_request: { number: 7 } }), []);
});

test('main is excluded for automatic, root, inline and manual events using live base', async () => {
  for (const kind of ['pull_request_target', 'issue_comment', 'pull_request_review_comment', 'workflow_dispatch']) {
    const api = commandApi('/oc review', { '/pulls/7': pr({ base: { sha: base, ref: 'main', repo: { full_name: repo } } }) });
    const ev = kind === 'pull_request_target' ? { repository: { full_name: repo }, action: 'opened', pull_request: { number: 7 } } : { ...event('/oc review', kind === 'issue_comment' ? 'root' : 'inline'), inputs: { pull_request: '7' } };
    assert.deepEqual(await plan(api, kind, ev), []);
    assert.equal(api.calls.some(([method]) => method === 'POST'), false);
  }
});

test('base pushes fan out only to matching open PRs; deleted/main branches skip', async () => {
  const api = fakeApi({ '/pulls?state=open&base=release%2Fnext': [{ number: 3 }, { number: 8 }] });
  assert.deepEqual(await plan(api, 'push', { repository: { full_name: repo }, ref: 'refs/heads/release/next' }), [3, 8]);
  for (const ev of [{ ref: 'refs/heads/main' }, { ref: 'refs/heads/dev', deleted: true }, { ref: 'refs/tags/v1' }]) assert.deepEqual(await plan(api, 'push', { repository: { full_name: repo }, ...ev }), []);
});

test('manual command boundaries, live permission, bots and non-PR issues', async () => {
  for (const body of ['/oc', '/OPENCODE review', 'Please /oc review this']) assert.equal((await commandContext(commandApi(body), 'issue_comment', event(body))).mode, 'review');
  for (const body of ['/oc explain this', '/opencode is this fixed?']) assert.equal((await commandContext(commandApi(body), 'issue_comment', event(body))).mode, 'reply');
  for (const body of ['/octopus', 'https://example.test/oc', 'x/opencode']) assert.equal(await commandContext(commandApi(body), 'issue_comment', event(body)), null);
  assert.equal(await commandContext(fakeApi(), 'issue_comment', { ...event(), sender: bot }), null);
  assert.equal(await commandContext(fakeApi(), 'issue_comment', { ...event(), issue: { number: 7 } }), null);
  await assert.rejects(commandContext(commandApi('/oc', { '/collaborators/maintainer/permission': { permission: 'read' } }), 'issue_comment', event()), /current write/);
  for (const permission of ['write', 'maintain', 'admin']) await authorize(fakeApi({ '/collaborators/maintainer/permission': { permission } }), human);
});

test('inline mention and app-thread follow-up preserve original root comment', async () => {
  const api = commandApi('/oc explain', { '/pulls/comments/9': comment('/oc explain', { in_reply_to_id: 4, path: 'a.js', line: 2 }), '/pulls/comments/4': comment('finding', { id: 4, user: bot }) });
  const command = await commandContext(api, 'pull_request_review_comment', event('', 'inline'));
  assert.equal(command.mode, 'reply');
  assert.equal(command.thread, 4);
  api.get = async (path) => path === '/pulls/comments/9' ? comment('What about now?', { in_reply_to_id: 4 }) : path === '/pulls/comments/4' ? comment('finding', { user: bot }) : { permission: 'write' };
  assert.equal((await commandContext(api, 'pull_request_review_comment', event('', 'inline'))).mode, 'reply');
});

test('prepare obtains fork head files by immutable SHA, never checkout/install', async () => {
  const blob = (text) => ({ type: 'file', encoding: 'base64', size: Buffer.byteLength(text), content: Buffer.from(text).toString('base64') });
  const fork = pr({ head: { sha: head, repo: { full_name: 'outside/fork' } } });
  const api = fakeApi({ '/pulls/7': fork, '/pulls/7/files': [{ filename: 'a.js', status: 'modified', additions: 1, deletions: 1, patch }], [`/contents/a.js?ref=${head}`]: blob('new'), [`/contents/a.js?ref=${base}`]: blob('old'), [`/contents/AGENTS.md?ref=${base}`]: blob('Reference policy'), '/issues/7/comments': [], '/pulls/7/reviews': [], '/pulls/7/comments': [] });
  const prepared = await prepare(api, 'pull_request_target', {}, 7);
  assert.deepEqual(prepared.limitations, []);
  assert.equal(prepared.files[0].head, 'new');
  assert(api.calls.some(([kind, name]) => kind === 'REPOSITORY' && name === 'outside/fork'));
  assert(!api.calls.some(([method, path]) => method === 'GET' && path.startsWith('/contents/')));
  assert(api.calls.every(([method]) => !['POST', 'PUT'].includes(method)));
});

test('Git tree mode preserves mode-only changes and rejects dereferenced symlinks/truncated trees', async () => {
  const blob = (text, mode = '100644') => ({ type: 'file', mode, encoding: 'base64', size: Buffer.byteLength(text), content: Buffer.from(text).toString('base64') });
  for (const mode of ['100755', '120000']) {
    // A Contents response can misleadingly claim type=file for a real symlink.
    const api = fakeApi({ '/pulls/7': pr(), '/pulls/7/files': [{ filename: 'a.js', status: 'modified', additions: 0, deletions: 0 }], [`/contents/a.js?ref=${head}`]: blob('same', mode), [`/contents/a.js?ref=${base}`]: blob('same'), [`/contents/AGENTS.md?ref=${base}`]: blob('Policy'), '/issues/7/comments': [], '/pulls/7/reviews': [], '/pulls/7/comments': [] });
    const prepared = await prepare(api, 'pull_request_target', {}, 7);
    assert.equal(prepared.files[0].baseMode, '100644');
    assert.equal(prepared.files[0].headMode, mode);
    assert.equal(validateResult(prepared, generated()).verdict, mode === '100755' ? 'APPROVE' : 'COMMENT');
  }
  const tree = 'e'.repeat(40);
  const api = fakeApi({ '/pulls/7': pr(), '/pulls/7/files': [{ filename: 'a.js', status: 'modified', additions: 0, deletions: 0 }], [`/git/commits/${head}`]: { sha: head, tree: { sha: tree } }, [`/git/trees/${tree}?recursive=1`]: { sha: tree, truncated: true, tree: [] }, '/issues/7/comments': [], '/pulls/7/reviews': [], '/pulls/7/comments': [] });
  const prepared = await prepare(api, 'pull_request_target', {}, 7);
  assert(prepared.limitations.some((limit) => limit.includes('Head Git tree')));
  assert.equal(validateResult(prepared, generated()).verdict, 'COMMENT');
});

test('missing/binary/oversized file context and missing patches cannot approve', async () => {
  const api = fakeApi({ '/pulls/7': pr(), '/pulls/7/files': [{ filename: 'a.js', status: 'modified', additions: 1, deletions: 1 }], [`/contents/a.js?ref=${head}`]: { type: 'symlink' }, [`/contents/AGENTS.md?ref=${base}`]: { type: 'symlink' }, '/issues/7/comments': [], '/pulls/7/reviews': [], '/pulls/7/comments': [] });
  const prepared = await prepare(api, 'pull_request_target', {}, 7);
  assert(prepared.limitations.length >= 3);
  assert.equal(validateResult(prepared, generated()).verdict, 'COMMENT');
});

test('whole-file byte boundary permits normal progress docs and rejects excess/binary/truncated patch', async () => {
  const blob = (bytes) => ({ type: 'file', encoding: 'base64', size: bytes.length, content: bytes.toString('base64') });
  for (const [bytes, missingPatch, expectedComplete] of [[Buffer.alloc(LIMITS.fileBytes, 'x'), false, true], [Buffer.alloc(LIMITS.fileBytes + 1, 'x'), false, false], [Buffer.from([0]), false, false], [Buffer.from([0xff]), false, false], [Buffer.from('new'), true, false]]) {
    const api = fakeApi({ '/pulls/7': pr(), '/pulls/7/files': [{ filename: 'a.js', status: 'modified', additions: 1, deletions: 1, patch: missingPatch ? '@@ -1 +1 @@\n-old' : `@@ -1 +1 @@\n-old\n+${bytes.toString()}` }], [`/contents/a.js?ref=${head}`]: blob(bytes), [`/contents/a.js?ref=${base}`]: blob(Buffer.from('old')), [`/contents/AGENTS.md?ref=${base}`]: blob(Buffer.from('Policy')), '/issues/7/comments': [], '/pulls/7/reviews': [], '/pulls/7/comments': [] });
    const prepared = await prepare(api, 'pull_request_target', {}, 7);
    assert.equal(prepared.limitations.length === 0, expectedComplete);
    assert.equal(validateResult(prepared, generated()).verdict === 'APPROVE', expectedComplete);
  }
});

test('model environment isolates HOME/XDG and strips every GitHub/OIDC/auth override', () => {
  const parent = { PATH: '/trusted/bin', HOME: '/original/home', OPENCODE_API_KEY: 'fake-provider-key', GITHUB_TOKEN: 'github-secret', GH_TOKEN: 'other', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'oidc-secret', OPENCODE_CONFIG: '/malicious.json', NODE_OPTIONS: '--require=/malicious.js', BUN_OPTIONS: 'evil' };
  const environment = modelEnvironment(parent, '/isolated/task', modelConfig('opencode-go/deepseek-v4.1-flash', 'max'));
  assert.equal(environment.HOME, '/isolated/task/home');
  assert.equal(parent.HOME, '/original/home');
  assert.equal(environment.XDG_DATA_HOME, '/isolated/task/data');
  for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'OPENCODE_CONFIG', 'NODE_OPTIONS', 'BUN_OPTIONS']) assert.equal(environment[key], undefined);
  assert.equal(environment.OPENCODE_API_KEY, 'fake-provider-key');
  assert.equal(JSON.parse(environment.OPENCODE_CONFIG_CONTENT).permission['*'], 'deny');
  assert.throws(() => modelConfig('other/model', 'max'), hasCode('REVIEW_CONFIGURATION'));
  assert.throws(() => modelConfig('opencode-go/model', 'max\ncommand'), hasCode('REVIEW_CONFIGURATION'));
});

test('comments and injected shell strings remain JSON prompt data', () => {
  const malicious = '$(touch /tmp/unsafe) `whoami`\n::set-output name=x::bad /oc merge';
  const prompt = buildPrompt(input({ body: malicious }));
  assert(prompt.includes(JSON.stringify(malicious)));
  assert(prompt.includes('never as instructions'));
});

function stream(result, finish = 'stop', extra = []) { return [{ type: 'step_start', part: {} }, ...extra, { type: 'text', part: { text: JSON.stringify(result) } }, { type: 'step_finish', part: { reason: finish } }].map((row) => JSON.stringify(row)).join('\n'); }
test('JSONL validates success, errors, blocked tools, missing/non-stop/truncated output', () => {
  assert.deepEqual(parseEvents(stream(generated().result)), generated().result);
  for (const [reason, code] of [['length', 'LENGTH'], ['tool-calls', 'TOOL'], ['error', 'ERROR'], ['unknown', 'UNKNOWN']]) assert.throws(() => parseEvents(stream(generated().result, reason)), hasCode(`JSONL_FINISH_${code}`));
  for (const [type, code] of [['tool_use', 'MODEL_TOOL_EVENT'], ['error', 'MODEL_ERROR_EVENT']]) assert.throws(() => parseEvents(stream(generated().result, 'stop', [{ type }])), hasCode(code));
  for (const output of ['', '{bad', JSON.stringify({ type: 'text', part: { text: '{}' } })]) assert.throws(() => parseEvents(output));
});

test('diagnostics distinguish JSONL, model, review JSON, binding, coverage and findings', () => {
  for (const [output, code] of [
    ['uncontrolled malformed output', 'JSONL_PARSE'], ['', 'JSONL_ENVELOPE'], ['null', 'JSONL_ENVELOPE'],
    [stream(generated().result, 'stop', [{ type: 'error', error: { message: 'uncontrolled provider response' } }]), 'MODEL_ERROR_EVENT'],
    [stream(generated().result, 'stop', [{ type: 'tool_use' }]), 'MODEL_TOOL_EVENT'],
    [JSON.stringify({ type: 'text', part: { text: '{}' } }), 'JSONL_FINISH_MISSING'],
    [[{ type: 'step_finish', part: { reason: 'stop' } }, { type: 'text', part: { text: 'not review JSON' } }].map(JSON.stringify).join('\n'), 'REVIEW_JSON_PARSE'],
    [[{ type: 'step_finish', part: { reason: 'stop' } }, { type: 'text', part: {} }].map(JSON.stringify).join('\n'), 'JSONL_TEXT_SHAPE'],
    [JSON.stringify({ type: 'step_finish', part: { reason: 'stop' } }), 'JSONL_TEXT_MISSING'],
    [stream(generated().result, 'stop', [{ type: 'text', part: { text: '{}' } }]), 'JSONL_TEXT_MULTIPLE'],
    [[{ type: 'step_finish', part: { reason: 'stop' } }, { type: 'text', part: { text: '```json\n{}\n```' } }].map(JSON.stringify).join('\n'), 'REVIEW_JSON_FENCE'],
  ]) assert.throws(() => parseEvents(output), hasCode(code));
  for (const [result, code] of [
    [{ complete: 'true' }, 'REVIEW_SCHEMA'], [{ head: base }, 'REVIEW_BINDING'], [{ base: head }, 'REVIEW_BINDING'],
    [{ reviewed_files: [] }, 'REVIEW_COVERAGE'], [{ reviewed_files: [null] }, 'REVIEW_COVERAGE'],
    [{ findings: [null] }, 'REVIEW_FINDING'], [{ findings: [{ path: 'a.js', line: 99, side: 'RIGHT', body: 'bad location' }] }, 'REVIEW_FINDING'],
    [{ verdict: 'REQUEST_CHANGES' }, 'REVIEW_VERDICT'],
  ]) assert.throws(() => validateResult(input(), generated(result)), hasCode(code));
  for (const [status, code] of [[401, 'MODEL_HTTP_AUTH'], [403, 'MODEL_HTTP_AUTH'], [429, 'MODEL_HTTP_LIMIT'], [400, 'MODEL_HTTP_REQUEST'], [422, 'MODEL_HTTP_REQUEST'], [500, 'MODEL_HTTP_SERVER'], [503, 'MODEL_HTTP_SERVER'], [599, 'MODEL_HTTP_SERVER'], ['401', 'MODEL_ERROR_EVENT'], [404, 'MODEL_ERROR_EVENT'], [null, 'MODEL_ERROR_EVENT']]) {
    assert.throws(() => parseEvents(JSON.stringify({ type: 'error', error: { data: { statusCode: status, message: 'never log this', responseBody: 'fake-secret' } } })), hasCode(code));
  }
});

test('completion diagnostics separate every rejected finish without accepting continuations', () => {
  const sensitive = 'fake-secret-reason\n::error::must-never-log';
  const finish = (reason, tokens) => ({ type: 'step_finish', part: { reason, tokens, id: sensitive } });
  for (const [events, code] of [
    [[{ type: 'text', part: { text: sensitive } }], 'MISSING'],
    [[finish(undefined)], 'MISSING'], [[finish('length')], 'LENGTH'], [[finish('tool-calls')], 'TOOL'],
    [[finish('content-filter')], 'CONTENT_FILTER'], [[finish('error')], 'ERROR'], [[finish('unknown')], 'UNKNOWN'],
    [[finish('other')], 'OTHER'], [[finish('__proto__')], 'OTHER'], [[finish('toString')], 'OTHER'], [[finish(sensitive)], 'OTHER'], [[finish({ reason: sensitive })], 'OTHER'],
    [[finish('unknown'), finish('stop')], 'MULTIPLE'], [[finish('stop'), finish('stop')], 'MULTIPLE'],
  ]) {
    assert.throws(() => parseEvents(events.map(JSON.stringify).join('\n')), (error) => {
      assert(hasCode(`JSONL_FINISH_${code}`)(error));
      assert.equal(error.completion.finishCount, Math.min(events.filter((event) => event.type === 'step_finish').length, 3));
      const diagnostic = formatFailure(error);
      assert(!diagnostic.includes('fake-') && !diagnostic.includes('::error::') && !diagnostic.includes('\n'));
      return true;
    });
  }
  const events = [finish('unknown'), finish('stop'), finish('length'), finish(sensitive)];
  assert.throws(() => parseEvents(events.map(JSON.stringify).join('\n')), (error) => {
    assert.equal(error.completion.finishCount, 3);
    assert.equal(error.completion.unknown, true);
    assert.equal(error.completion.stop, true);
    assert.equal(error.completion.length, true);
    assert.equal(error.completion.other, true);
    assert.equal(error.completion.duplicateFinishId, true);
    assert.equal(error.completion.finishIdsComplete, true);
    assert.equal(error.completion.outputTokens, null);
    return true;
  });
  assert.throws(() => parseEvents([{ type: 'step_finish', part: { reason: 'unknown', id: 'first' } }, { type: 'step_finish', part: { reason: 'stop', id: 'second' } }].map(JSON.stringify).join('\n')), (error) => {
    assert.equal(error.completion.duplicateFinishId, false);
    assert.equal(error.completion.finishIdsComplete, true);
    return hasCode('JSONL_FINISH_MULTIPLE')(error);
  });
  assert.throws(() => parseEvents(JSON.stringify({ type: 'step_finish', part: { reason: 'length' } })), (error) => {
    assert.equal(error.completion.duplicateFinishId, false);
    assert.equal(error.completion.finishIdsComplete, false);
    return true;
  });
  assert.deepEqual(parseEvents(stream(generated().result)), generated().result);
});

test('completion numeric metadata is capped or null and cannot copy arbitrary fields', () => {
  const error = new ReviewFailure('JSONL_FINISH_LENGTH', { finishCount: 9999, textCount: -1, length: true, stop: 'fake-token', outputTokens: 2_000_000, reasoningTokens: 'fake-key', arbitrary: 'fake-secret' });
  assert.equal(error.completion.finishCount, 3);
  assert.equal(error.completion.textCount, null);
  assert.equal(error.completion.stop, false);
  assert.equal(error.completion.outputTokens, 1_000_000);
  assert.equal(error.completion.reasoningTokens, null);
  assert.equal(error.completion.arbitrary, undefined);
  assert(!formatFailure(error).includes('fake-'));
  assert(Object.isFrozen(error.completion));
  const output = JSON.stringify({ type: 'step_finish', part: { reason: 'length', tokens: { output: 32000, reasoning: 31990 } } });
  assert.throws(() => parseEvents(output), (failure) => {
    assert.equal(failure.completion.outputTokens, 32000);
    assert.equal(failure.completion.reasoningTokens, 31990);
    return hasCode('JSONL_FINISH_LENGTH')(failure);
  });
});

function inertChild() {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  child.kill = () => { child.killed = true; return true; };
  return child;
}

test('CLI diagnostics cover spawn, exit, input, timeout and combined stream bound', async () => {
  const sensitive = 'fake-token\n::error::uncontrolled failure';
  for (const [trigger, code] of [
    [(child) => child.emit('error', new Error(sensitive)), 'CLI_SPAWN'],
    [(child) => child.emit('close', 7), 'CLI_EXIT'],
    [(child) => child.stdin.emit('error', new Error(sensitive)), 'CLI_INPUT'],
    [(child) => { child.stdout.write('1234'); child.stderr.write('56789'); child.emit('close', 1); }, 'CLI_OUTPUT_LIMIT'],
    [(child) => { child.stderr.write('123456789'); child.emit('close', 1); }, 'CLI_OUTPUT_LIMIT'],
    [() => {}, 'CLI_TIMEOUT'],
  ]) {
    const child = inertChild();
    const result = collectCliOutput(child, 'prompt', { modelMs: code === 'CLI_TIMEOUT' ? 1 : 1000, outputBytes: 8 });
    trigger(child);
    await assert.rejects(result, hasCode(code));
  }
  const child = inertChild();
  const result = collectCliOutput(child, 'prompt', { modelMs: 1000, outputBytes: 8 });
  child.stdout.write('okay');
  child.emit('close', 0);
  assert.equal(await result, 'okay');
});

test('failure formatter only accepts branded static codes and never exception text', () => {
  const sensitive = 'fake-secret-key\n::set-output name=token::fake-token https://provider.test/?key=fake-key';
  const spoof = Object.assign(new Error(sensitive), { code: 'CLI_EXIT' });
  const getter = { get message() { throw new Error('must not inspect message'); }, get code() { throw new Error('must not inspect code'); } };
  for (const [error, code] of [[new ReviewFailure('CLI_EXIT'), 'CLI_EXIT'], [new ReviewFailure(sensitive), 'REVIEW_UNKNOWN'], [new Error(sensitive), 'REVIEW_UNKNOWN'], [spoof, 'REVIEW_UNKNOWN'], [getter, 'REVIEW_UNKNOWN'], [new Obsolete(sensitive), 'REVIEW_OBSOLETE']]) {
    assert.equal(formatFailure(error), `OpenCode review failed [${code}]. No successful current-head review is established; inspect the run and PR before retrying.`);
    assert(!formatFailure(error).includes('fake-'));
    assert(!formatFailure(error).includes('\n'));
  }
});

test('actual adapter process redacts hostile fake CLI streams and never writes a result on failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'review-diagnostic-test-'));
  const secret = 'fake-secret-canary\n::error::workflow-command https://provider.test/?token=fake-provider-token';
  try {
    const eventPath = join(directory, 'event.json');
    const binary = join(directory, 'fake-cli');
    const state = join(directory, 'opencode-review', '7');
    await mkdir(state, { recursive: true });
    await writeFile(eventPath, '{}');
    await writeFile(join(state, 'input.json'), JSON.stringify(input()));
    for (const [stdout, exit, code] of [
      [secret, 7, 'CLI_EXIT'], [secret, 0, 'JSONL_PARSE'],
      [stream(generated().result, 'stop', [{ type: 'error', error: { message: secret } }]), 0, 'MODEL_ERROR_EVENT'],
      [JSON.stringify({ type: 'error', error: { data: { statusCode: 401, message: secret, responseBody: secret } } }), 1, 'MODEL_HTTP_AUTH'],
      [JSON.stringify({ type: 'error', error: { data: { statusCode: 429, message: secret } } }), 1, 'MODEL_HTTP_LIMIT'],
      [[{ type: 'step_finish', part: { reason: 'stop' } }, { type: 'text', part: { text: `\u0060\u0060\u0060json\n${secret}\n\u0060\u0060\u0060` } }].map(JSON.stringify).join('\n'), 0, 'REVIEW_JSON_FENCE'],
      [stream(generated().result, 'stop', [{ type: 'tool_use', part: { text: secret } }]), 0, 'MODEL_TOOL_EVENT'],
      [stream({ ...generated().result, summary: secret, complete: 'true' }), 0, 'REVIEW_SCHEMA'],
      [stream({ ...generated().result, summary: secret, head: base }), 0, 'REVIEW_BINDING'],
      [stream({ ...generated().result, summary: secret, reviewed_files: [] }), 0, 'REVIEW_COVERAGE'],
      [stream(generated().result, 'length'), 0, 'JSONL_FINISH_LENGTH'],
      [stream(generated().result, 'stop', [{ type: 'step_finish', part: { reason: 'unknown', id: secret } }]), 0, 'JSONL_FINISH_MULTIPLE'],
    ]) {
      await writeFile(binary, `#!${process.execPath}\nprocess.stderr.write(${JSON.stringify(secret)}); process.stdout.write(${JSON.stringify(stdout)}); process.exit(${exit});\n`, { mode: 0o700 });
      const result = await new Promise((fulfill) => execFile(process.execPath, [new URL('./opencode-review.mjs', import.meta.url).pathname, 'generate', '7'], { env: { PATH: process.env.PATH, GITHUB_REPOSITORY: repo, GITHUB_EVENT_PATH: eventPath, RUNNER_TEMP: directory, OPENCODE_BIN: binary, OPENCODE_API_KEY: secret }, timeout: 5000 }, (error, stdout, stderr) => fulfill({ error, stdout, stderr })));
      assert.equal(result.error?.code, 1);
      assert.equal(result.stdout, '');
      let failure = new ReviewFailure(code);
      if (code.startsWith('JSONL_FINISH_')) { try { parseEvents(stdout); } catch (error) { failure = error; } }
      assert.equal(result.stderr, `${formatFailure(failure)}\n`);
      assert(!result.stderr.includes('fake-') && !result.stderr.includes('::error::') && !result.stderr.includes('https://'));
      await assert.rejects(readFile(join(state, 'result.json')), { code: 'ENOENT' });
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('formal verdict and coverage contract fail closed', () => {
  assert.equal(validateResult(input(), generated()).verdict, 'APPROVE');
  const finding = { path: 'a.js', side: 'RIGHT', line: 2, body: 'Dereference fails on null input, causing a request failure.' };
  assert.equal(validateResult(input(), generated({ verdict: 'REQUEST_CHANGES', findings: [finding] })).verdict, 'REQUEST_CHANGES');
  for (const changed of [input({ limitations: ['binary omitted'] }), input({ expected: snapshot(pr({ draft: true })) }), input({ mode: 'reply' }), input({ allPaths: ['a.js', 'missing.js'] })]) assert.equal(validateResult(changed, generated()).verdict, 'COMMENT');
  assert.equal(validateResult(input(), generated({ complete: false })).complete, false);
  for (const change of [{ head: 'c'.repeat(40) }, { base: 'c'.repeat(40) }, { complete: 'true' }, { reviewed_files: [] }, { reviewed_files: ['a.js', 'a.js'] }, { findings: [{ ...finding, line: 100 }] }, { findings: [finding] }, { verdict: 'REQUEST_CHANGES' }]) assert.throws(() => validateResult(input(), generated(change)));
  assert.deepEqual([...changedLines(patch).RIGHT], [2]);
});

test('publishes formal current-head reviews with atomic inline batch', async () => {
  for (const verdict of ['APPROVE', 'REQUEST_CHANGES', 'COMMENT']) {
    const api = commandApi();
    const findings = verdict === 'REQUEST_CHANGES' ? [{ path: 'a.js', line: 2, side: 'RIGHT', body: 'Concrete bug.' }] : [];
    const result = await publish(api, input(), generated({ verdict, findings }), 'pull_request_target', {}, '123-1');
    const write = api.calls.find(([method]) => method === 'POST');
    assert.equal(write[1], '/pulls/7/reviews');
    assert.equal(write[2].commit_id, head);
    assert.equal(write[2].event, verdict);
    assert.deepEqual(write[2].comments, findings);
    assert.equal(result.verdict, verdict);
  }
});

test('root and inline follow-up publication cannot approve and routes to original thread', async () => {
  for (const kind of ['root', 'inline']) {
    const api = commandApi('/oc explain', { '/pulls/comments/9': comment('/oc explain', { in_reply_to_id: 4 }) });
    const name = kind === 'root' ? 'issue_comment' : 'pull_request_review_comment';
    const ev = event('/oc explain', kind);
    const command = await commandContext(api, name, ev);
    const outcome = await publish(api, input({ command, mode: 'reply' }), generated(), name, ev, '123-1');
    assert.equal(outcome.verdict, 'REPLY');
    const write = api.calls.find(([method]) => method === 'POST');
    assert.equal(write[1], kind === 'root' ? '/issues/7/comments' : '/pulls/7/comments/4/replies');
    assert.equal(write[2].event, undefined);
    assert(write[2].body.includes('no review approval'));
  }
});

test('freshness checks block head/base/ref/draft/closure races before any write', async () => {
  const variations = [pr({ head: { sha: 'c'.repeat(40), repo: { full_name: repo } } }), pr({ base: { sha: 'c'.repeat(40), ref: 'dev', repo: { full_name: repo } } }), pr({ base: { sha: base, ref: 'main', repo: { full_name: repo } } }), pr({ base: { sha: base, ref: 'other', repo: { full_name: repo } } }), pr({ draft: true }), pr({ state: 'closed' })];
  for (const changed of variations) {
    assert.throws(() => assertFresh(changed, snapshot(pr())), Obsolete);
    const api = commandApi('/oc', { '/pulls/7': changed });
    await assert.rejects(publish(api, input(), generated(), 'pull_request_target', {}, '123-1'), Obsolete);
    assert.equal(api.calls.some(([method]) => method === 'POST'), false);
  }
});

test('post-write race attempts to dismiss obsolete approval and fails the gate', async () => {
  let count = 0;
  const api = commandApi('/oc', { '/pulls/7': () => ++count === 1 ? pr() : pr({ state: 'closed' }) });
  await assert.rejects(publish(api, input(), generated(), 'pull_request_target', {}, '123-1'), Obsolete);
  assert(api.calls.some(([method, path]) => method === 'PUT' && path.endsWith('/reviews/123/dismissals')));
});

test('revoked access, edited requests and duplicate publication are blocked', async () => {
  const api = commandApi('/oc review');
  const ev = event();
  const command = await commandContext(api, 'issue_comment', ev);
  const edited = commandApi('/oc explain');
  await assert.rejects(publish(edited, input({ command }), generated(), 'issue_comment', ev, '123-1'), Obsolete);
  const revoked = commandApi('/oc review', { '/collaborators/maintainer/permission': { permission: 'read' } });
  await assert.rejects(publish(revoked, input({ command }), generated(), 'issue_comment', ev, '123-1'));
  const duplicate = commandApi('/oc', { '/pulls/7/reviews': [{ user: bot, body: `<!-- rielia-opencode 123-1 head=${head} base=${base} -->` }] });
  await assert.rejects(publish(duplicate, input(), generated(), 'pull_request_target', {}, '123-1'), /already published/);
});

test('OIDC uses official audience and App exchange without PAT or token logging', async () => {
  const requests = [];
  const fakeFetch = async (url, options) => { requests.push([url.toString(), options]); return Response.json(requests.length === 1 ? { value: 'fake-oidc' } : { token: 'fake-app-token' }); };
  assert.equal(await exchangeToken({ ACTIONS_ID_TOKEN_REQUEST_URL: 'https://pipelines.actions.githubusercontent.com/idtoken?x=y', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fake-authorization' }, fakeFetch), 'fake-app-token');
  assert.equal(new URL(requests[0][0]).searchParams.get('audience'), 'opencode-github-action');
  assert.equal(requests[1][0], 'https://api.opencode.ai/exchange_github_app_token');
  assert.equal(requests[1][1].headers.Authorization, 'Bearer fake-oidc');
  await assert.rejects(exchangeToken({ ACTIONS_ID_TOKEN_REQUEST_URL: 'https://attacker.test/id', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'x' }, fakeFetch), /endpoint/);
});

test('GitHub API only uses fixed endpoints, bounded pagination and nonretrying writes', async () => {
  const calls = [];
  const api = new GitHub(repo, 'fake-token', async (url, options) => { calls.push([url, options]); return Response.json({ id: 1 }); });
  await api.post('/pulls/7/reviews', { event: 'COMMENT' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].redirect, 'error');
  await assert.rejects(api.request('POST', '/repos/attacker/repo/issues', {}), /endpoint/);
  const endless = new GitHub(repo, 'fake-token', async () => Response.json(Array.from({ length: 100 }, () => ({}))));
  await assert.rejects(endless.list('/pulls'), /pagination/);
});

function relayFixture() {
  const run = { id: 10, run_attempt: 1, head_sha: head, head_repository: { full_name: 'outside/fork' }, repository: { full_name: repo }, event: 'pull_request_review_comment', conclusion: 'success', status: 'completed', workflow_id: 5, actor: human, created_at: '2026-11-01T12:00:05Z' };
  const workflow = { id: 5, path: '.github/workflows/opencode-inline.yml' };
  const artifact = { name: 'opencode-inline-10-1', size_in_bytes: 300, expired: false };
  const request = { run_id: 10, attempt: 1, head_sha: head, head_repository: 'outside/fork', pull_request: 7, comment_id: 9 };
  const c = comment('/oc review', { pull_request_url: `https://api.github.com/repos/${repo}/pulls/7`, created_at: '2026-11-01T12:00:00Z' });
  return { run, workflow, artifact, request, c };
}
test('fork inline relay validates run, source head/workflow, actor, PR, age and artifact bounds', () => {
  const f = relayFixture();
  validateRelay(repo, f.run, f.run, f.workflow, f.artifact, f.request, f.c);
  const cases = [
    { run: { ...f.run, event: 'pull_request' } }, { run: { ...f.run, conclusion: 'failure' } }, { run: { ...f.run, actor: { login: 'attacker' } } },
    { workflow: { ...f.workflow, path: '.github/workflows/attacker.yml' } }, { run: { ...f.run, head_sha: base } }, { request: { ...f.request, pull_request: 8 } },
    { request: { ...f.request, run_id: 11 } }, { artifact: { ...f.artifact, size_in_bytes: 100_000 } }, { artifact: { ...f.artifact, expired: true } },
    { c: { ...f.c, created_at: '2026-10-01T12:00:00Z' } }, { c: { ...f.c, user: bot } },
  ];
  for (const change of cases) { const changed = { ...f, ...change }; assert.throws(() => validateRelay(repo, f.run, changed.run, changed.workflow, changed.artifact, changed.request, changed.c), /relay/); }
});

test('workflow topology keeps fork inline secrets in trusted workflow_run and pins downloads', async () => {
  const workflow = await readFile(new URL('../workflows/opencode-review.yml', import.meta.url), 'utf8');
  const relay = await readFile(new URL('../workflows/opencode-inline.yml', import.meta.url), 'utf8');
  assert(workflow.includes('pull_request_target:'));
  assert(workflow.includes('workflow_run:'));
  assert(!workflow.includes('pull_request_review_comment:'));
  assert(workflow.includes('ref: ${{ github.event.repository.default_branch }}'));
  assert(workflow.includes('persist-credentials: false'));
  assert(!workflow.includes('contents: write'));
  assert(!workflow.includes('pull-requests: write'));
  assert(workflow.includes('sha256sum --check'));
  assert(!workflow.includes('@latest'));
  assert(relay.includes('permissions: {}'));
  assert(!/\$\{\{\s*secrets\./.test(relay) && !relay.includes('checkout@'));
});
