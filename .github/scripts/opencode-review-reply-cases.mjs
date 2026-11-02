import assert from 'node:assert/strict';
import { AuthorizationDenied, GitHub, Obsolete, ReviewFailure, commandContext, modelConfig, publish, publishWithRevocation, validateResult } from './opencode-review.mjs';

// Focused callbacks are imported by the single main test entry point.
export function createReplyTests({ repo, head, base, bot, patch, pr, event, comment, input, generated, hasCode, commandApi }) {
  const replyRequest = async (kind, threaded = true) => {
    const name = kind === 'root' ? 'issue_comment' : 'pull_request_review_comment';
    const ev = event('/oc explain', kind);
    const api = commandApi('/oc explain', threaded ? { '/pulls/comments/9': comment('/oc explain', { in_reply_to_id: 4 }) } : {});
    return { api, name, ev, command: await commandContext(api, name, ev) };
  };
  return {
    contract: () => {
      const reply = input({ mode: 'reply', files: [{ path: 'a.js', patch }, { path: 'b.js', patch }], allPaths: ['a.js', 'b.js'], limitations: ['missing context'] });
      for (const reviewed_files of [[], ['a.js'], ['b.js'], ['b.js', 'a.js']]) {
        for (const complete of [false, true]) assert.deepEqual(validateResult(reply, generated({ verdict: 'COMMENT', complete, reviewed_files })), { summary: generated().result.summary, findings: [], complete: false, verdict: 'COMMENT' });
      }
      for (const reviewed_files of [['a.js', 'a.js'], ['outside.js'], [null], [7]]) assert.throws(() => validateResult(reply, generated({ verdict: 'COMMENT', reviewed_files })), hasCode('REVIEW_COVERAGE'));
      for (const verdict of ['APPROVE', 'REQUEST_CHANGES']) assert.throws(() => validateResult(reply, generated({ verdict, reviewed_files: [] })), hasCode('REVIEW_VERDICT'));
      assert.throws(() => validateResult(reply, generated({ verdict: 'COMMENT', reviewed_files: [], findings: [{}] })), hasCode('REVIEW_VERDICT'));
      for (const field of ['head', 'base']) assert.throws(() => validateResult(reply, generated({ verdict: 'COMMENT', [field]: 'c'.repeat(40), reviewed_files: [] })), hasCode('REVIEW_BINDING'));
      for (const invalid of [{ complete: 'false' }, { summary: '' }, { findings: null }]) assert.throws(() => validateResult(reply, generated({ verdict: 'COMMENT', reviewed_files: [], ...invalid })), hasCode('REVIEW_SCHEMA'));
      assert.throws(() => validateResult(input(), generated({ verdict: 'COMMENT', reviewed_files: [] })), hasCode('REVIEW_COVERAGE'));
      assert.equal(validateResult(input({ limitations: ['missing context'] }), generated()).complete, false);
      assert(modelConfig('opencode-go/deepseek-v4.1-flash', 'max').agent.review.prompt.includes('reviewed_files may be empty or a unique subset'));
    },
    followup: async () => {
      for (const kind of ['root', 'inline']) {
        const { api, name, ev, command } = await replyRequest(kind);
        const outcome = await publish(api, input({ command, mode: 'reply' }), generated({ verdict: 'COMMENT' }), name, ev, '123-1');
        assert.equal(outcome.verdict, 'REPLY');
        const write = api.calls.find(([method]) => method === 'POST');
        assert.equal(write[1], kind === 'root' ? '/issues/7/comments' : '/pulls/7/comments/4/replies');
        assert.equal(write[2].event, undefined);
        assert(write[2].body.includes('no review approval'));
      }
    },
    incomplete: async () => {
      for (const kind of ['root', 'inline']) {
        for (const context of [{}, { files: [], allPaths: [] }, { files: [], allPaths: ['missing.js'], limitations: ['unavailable file'] }, { limitations: ['discussion truncated'] }]) {
          const { api, name, ev, command } = await replyRequest(kind);
          const recorded = [];
          const outcome = await publishWithRevocation(api, input({ command, mode: 'reply', ...context }), generated({ verdict: 'COMMENT', complete: false, reviewed_files: [] }), name, ev, '123-1', async (value) => recorded.push(value));
          assert.equal(outcome.verdict, 'REPLY');
          assert.equal(outcome.complete, false);
          assert.deepEqual(recorded, [outcome]);
          const writes = api.calls.filter(([method]) => method === 'POST');
          assert.equal(writes.length, 1);
          assert.equal(writes[0][1], kind === 'root' ? '/issues/7/comments' : '/pulls/7/comments/4/replies');
          assert(writes[0][2].body.includes('Thread reply only; no review approval.'));
          assert(!writes[0][2].body.includes('Complete supplied-file review.'));
          assert.equal(api.calls.filter(([method]) => method === 'DELETE').length, 1);
        }
      }
    },
    guards: async (t) => {
      const logs = [];
      t.mock.method(console, 'error', (message) => logs.push(message));
      for (const kind of ['root', 'inline']) {
        const { name, ev, command } = await replyRequest(kind, false);
        const reply = input({ command, mode: 'reply' });
        const result = generated({ verdict: 'COMMENT', complete: false, reviewed_files: [] });
        for (const invalid of [{ verdict: 'APPROVE' }, { reviewed_files: ['unknown.js'] }, { complete: 'false' }]) {
          const malformed = commandApi('/oc explain');
          await assert.rejects(publishWithRevocation(malformed, reply, generated({ ...result.result, ...invalid }), name, ev, '123-1'), ReviewFailure);
          assert(!malformed.calls.some(([method]) => method === 'POST'));
          assert.equal(malformed.calls.filter(([method]) => method === 'DELETE').length, 1);
        }
        for (const [extra, expected] of [[{ '/collaborators/maintainer/permission': { permission: 'read' } }, AuthorizationDenied], [{ '/issues/comments/9': comment('/oc edited'), '/pulls/comments/9': comment('/oc edited') }, Obsolete], [{ '/pulls/7': pr({ base: { sha: base, ref: 'main', repo: { full_name: repo } } }) }, Obsolete]]) {
          const api = commandApi('/oc explain', extra);
          await assert.rejects(publishWithRevocation(api, reply, result, name, ev, '123-1'), expected);
          assert(!api.calls.some(([method]) => method === 'POST'));
          assert.equal(api.calls.filter(([method]) => method === 'DELETE').length, 1);
        }
        let reads = 0;
        const stale = commandApi('/oc explain', { '/pulls/7': () => ++reads === 1 ? pr() : pr({ state: 'closed' }) });
        await assert.rejects(publishWithRevocation(stale, reply, result, name, ev, '123-1'), Obsolete);
        assert.equal(stale.calls.filter(([method]) => method === 'POST').length, 1);
        assert.equal(stale.calls.filter(([method]) => method === 'DELETE').length, 1);
        const duplicate = commandApi('/oc explain', { [kind === 'root' ? '/issues/7/comments' : '/pulls/7/comments']: [{ user: bot, body: `<!-- rielia-opencode 123-1 head=${head} base=${base} -->` }] });
        await assert.rejects(publishWithRevocation(duplicate, reply, result, name, ev, '123-1'), /already published/);
        assert(!duplicate.calls.some(([method]) => method === 'POST'));
        const cleanup = commandApi('/oc explain');
        cleanup.request = async (method, path) => { cleanup.calls.push([method, path]); throw new Error('fake-revoke-must-not-log'); };
        await assert.rejects(publishWithRevocation(cleanup, reply, result, name, ev, '123-1'), hasCode('APP_TOKEN_REVOCATION_FAILED'));
        assert.equal(cleanup.calls.filter(([method]) => method === 'POST').length, 1);
        assert.equal(cleanup.calls.filter(([method]) => method === 'DELETE').length, 1);
        assert(logs.at(-1).includes('publication=confirmed'));
        assert(!logs.at(-1).includes('fake-'));
      }
    },
    receipts: async (t) => {
      const logs = [];
      t.mock.method(console, 'error', (message) => logs.push(message));
      for (const kind of ['root', 'inline']) {
        const { api: source, name, ev, command } = await replyRequest(kind);
        const reply = input({ command, mode: 'reply' });
        const answer = generated({ verdict: 'COMMENT', complete: false, reviewed_files: [] });
        const fixture = (mutate = (value) => value, revokeDenied = false) => {
          const calls = [];
          const api = new GitHub(repo, 'fake-token', async (url, options) => {
            const path = new URL(url).pathname.replace(`/repos/${repo}`, '');
            calls.push([options.method, path]);
            if (options.method === 'DELETE') {
              if (revokeDenied) throw new Error('fake-revoke-must-not-log');
              return new Response(null, { status: 204 });
            }
            if (options.method === 'POST') {
              const value = await source.post(path, JSON.parse(options.body));
              return Response.json(mutate(value), { status: 201 });
            }
            return Response.json(await source.get(path));
          });
          return { api, calls };
        };
        const valid = fixture();
        const outcome = await publishWithRevocation(valid.api, reply, answer, name, ev, '123-1');
        assert.equal(outcome.id, 123);
        assert.equal(outcome.verdict, 'REPLY');
        assert.equal(outcome.complete, false);
        assert.equal(outcome.url, `https://github.com/${repo}/pull/7#${kind === 'root' ? 'issuecomment-' : 'discussion_r'}123`);
        assert.deepEqual(valid.calls.filter(([method]) => method === 'POST'), [['POST', kind === 'root' ? '/issues/7/comments' : '/pulls/7/comments/4/replies']]);
        const changes = [() => null, () => ({}), () => 'wrong type', ...[0, -1, 1.5, '123', Number.MAX_SAFE_INTEGER + 1].map((id) => (r) => ({ ...r, id })),
          ...[undefined, null, 'https://evil.test/pull/7#issuecomment-123', `https://github.com/${repo}/pull/8#discussion_r123`, `https://github.com/${repo}/pull/7#${kind === 'root' ? 'issuecomment-' : 'discussion_r'}124`, `https://github.com/other/repo/pull/7#discussion_r123`].map((html_url) => (r) => ({ ...r, html_url })),
          (r) => ({ ...r, body: undefined }), (r) => ({ ...r, body: r.body + '\n' }), (r) => ({ ...r, body: r.body.replace('123-1 head=', '124-1 head=') }),
          ...[null, { login: 'other[bot]', type: 'Bot' }, { login: bot.login, type: 'User' }].map((user) => (r) => ({ ...r, user })),
          (r) => ({ ...r, [kind === 'root' ? 'issue_url' : 'pull_request_url']: `https://api.github.com/repos/${repo}/${kind === 'root' ? 'issues' : 'pulls'}/8` }),
          ...(kind === 'inline' ? [undefined, '4', 5].map((in_reply_to_id) => (r) => ({ ...r, in_reply_to_id })) : []),
        ];
        for (const mutate of changes) {
          for (const revokeDenied of [false, true]) {
            const invalid = fixture(mutate, revokeDenied);
            let recorded = false;
            await assert.rejects(publishWithRevocation(invalid.api, reply, answer, name, ev, '123-1', async () => { recorded = true; }), Obsolete);
            assert.equal(recorded, false);
            assert.equal(invalid.calls.filter(([method]) => method === 'POST').length, 1);
            assert.equal(invalid.calls.filter(([method]) => method === 'DELETE').length, 1);
            assert(!invalid.calls.some(([method]) => method === 'PUT'));
            if (revokeDenied) assert(logs.at(-1).includes('publication=unconfirmed') && !logs.at(-1).includes('fake-'));
          }
        }
      }
    },
  };
}
