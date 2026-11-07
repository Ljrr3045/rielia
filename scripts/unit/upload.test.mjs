import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  artifactFiles,
  uploadWithClient,
  runnerEnvironment,
  runArtifactAction,
} from './upload.mjs';
import { write } from './files.mjs';

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rielia-upload-proof-')));
  t.after(() => fs.rmSync(root, { recursive: true }));
  write(root, 'coverage/artifacts/status.json', '{"api":"complete"}\n');
  write(root, 'coverage/artifacts/api/summary.json', '{"scope":"api"}\n');
  const env = {
    ACTIONS_RUNTIME_TOKEN: 'fictional-runner-capability',
    ACTIONS_RESULTS_URL: 'https://results.example.test',
    GITHUB_WORKSPACE: root,
    GITHUB_TOKEN: 'must-not-be-forwarded',
    UNRELATED_SECRET: 'must-not-be-forwarded',
  };
  return { root, env };
}

test(
  'official frozen SDK loads on Node24 without lifecycle execution or network',
  { timeout: 5000 },
  async () => {
    const { createArtifactClient } = await import('./tools/artifact-client.mjs');
    assert.equal(typeof createArtifactClient().uploadArtifact, 'function');
  },
);

test(
  'upload success passes explicit bounded files and seven-day options only',
  { timeout: 5000 },
  async (t) => {
    const { root, env } = fixture(t);
    let calls = 0;
    const result = await uploadWithClient(
      root,
      {
        uploadArtifact: async (name, files, directory, options) => {
          calls++;
          assert.equal(name, 'unit-coverage');
          assert.deepEqual(files, [
            path.join(root, 'coverage/artifacts/api/summary.json'),
            path.join(root, 'coverage/artifacts/status.json'),
          ]);
          assert.equal(directory, path.join(root, 'coverage/artifacts'));
          assert.deepEqual(options, { retentionDays: 7, compressionLevel: 6 });
          return { id: 123, size: 32, ignored: 'not-forwarded' };
        },
      },
      env,
    );
    assert.deepEqual(result, { id: 123, size: 32 });
    assert.equal(calls, 1);
    const forwarded = runnerEnvironment(root, env);
    assert.equal(forwarded.GITHUB_TOKEN, undefined);
    assert.equal(forwarded.UNRELATED_SECRET, undefined);
    assert.equal(forwarded.ACTIONS_RUNTIME_TOKEN, env.ACTIONS_RUNTIME_TOKEN);
  },
);

test(
  'missing runner capability fails before SDK and never substitutes another token',
  { timeout: 5000 },
  async (t) => {
    const { root, env } = fixture(t);
    let calls = 0;
    const client = {
      uploadArtifact: async () => {
        calls++;
        return { id: 123, size: 32 };
      },
    };
    for (const key of ['ACTIONS_RUNTIME_TOKEN', 'ACTIONS_RESULTS_URL', 'GITHUB_WORKSPACE']) {
      const missing = { ...env };
      delete missing[key];
      await assert.rejects(uploadWithClient(root, client, missing), /capability missing/);
      await assert.rejects(runArtifactAction(root, missing), /capability missing/);
    }
    assert.equal(calls, 0);
  },
);

test(
  'SDK rejection, malformed response and timeout fail without signed endpoint/token diagnostics',
  { timeout: 5000 },
  async (t) => {
    const { root, env } = fixture(t);
    for (const uploadArtifact of [
      async () => {
        throw new Error('signed-endpoint?token=fictional-runner-capability');
      },
      async () => ({}),
      () => new Promise(() => {}),
    ]) {
      await assert.rejects(uploadWithClient(root, { uploadArtifact }, env, 10), (error) => {
        assert.equal(error.message, 'Unit artifact upload failed or exceeded its deadline');
        assert.ok(!error.message.includes(env.ACTIONS_RUNTIME_TOKEN));
        return true;
      });
    }
  },
);

test(
  'upload revalidates allowed paths, symlinks and byte bounds before SDK effects',
  { timeout: 5000 },
  async (t) => {
    const { root, env } = fixture(t);
    let calls = 0;
    const client = {
      uploadArtifact: async () => {
        calls++;
        return { id: 123, size: 32 };
      },
    };
    const unexpected = path.join(root, 'coverage/artifacts/source.map');
    fs.writeFileSync(unexpected, '{}');
    await assert.rejects(uploadWithClient(root, client, env), /Unexpected upload/);
    fs.unlinkSync(unexpected);
    const link = path.join(root, 'coverage/artifacts/api/manifest.json');
    fs.symlinkSync(path.join(root, 'coverage/artifacts/status.json'), link);
    assert.throws(() => artifactFiles(root), /symlink/);
    fs.unlinkSync(link);
    const file = path.join(root, 'coverage/artifacts/api/summary.json');
    fs.writeFileSync(file, 'x'.repeat(2 * 1024 * 1024 + 1));
    await assert.rejects(uploadWithClient(root, client, env), /bound/);
    assert.equal(calls, 0);
  },
);
