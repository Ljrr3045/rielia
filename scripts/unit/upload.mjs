import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { artifactLimits } from './config.mjs';
import { coverageDirectory, regular, tree } from './files.mjs';
import { runProcess } from './process.mjs';

export function artifactFiles(root) {
  assert.equal(fs.realpathSync(root), path.resolve(root), 'Unsafe artifact root');
  const directory = coverageDirectory(root, 'artifacts');
  const files = tree(root, 'coverage/artifacts', {
    bounds: { files: 19, bytes: artifactLimits.total, depth: 3 },
  });
  assert.ok(files.includes('coverage/artifacts/status.json'), 'Packaged artifact status missing');
  let bytes = 0;
  for (const file of files) {
    const relative = path.relative(directory, path.join(root, file));
    assert.ok(
      /^(?:(?:api|web|contracts|prototype)\/(?:summary\.json|manifest\.json|coverage-final\.json|lcov\.info)|failure\.json|status\.json)$/.test(
        relative,
      ),
      'Unexpected upload input',
    );
    const target = regular(root, file);
    assert.ok(fs.statSync(target).size <= artifactLimits.file, 'Artifact file bound exceeded');
    const body = fs.readFileSync(target, 'utf8');
    bytes += Buffer.byteLength(body);
    assert.ok(bytes <= artifactLimits.total, 'Artifact total bound exceeded');
    assert.ok(
      !/sourcesContent|sourceMappingURL|\/(?:Users|private|home|tmp)\//.test(body),
      'Unsafe upload payload',
    );
  }
  return { directory, files: files.map((file) => path.join(root, file)) };
}

export function runnerEnvironment(root, env) {
  for (const key of ['ACTIONS_RUNTIME_TOKEN', 'ACTIONS_RESULTS_URL', 'GITHUB_WORKSPACE']) {
    if (typeof env[key] !== 'string' || !env[key])
      throw new Error('Artifact capability missing; use the local JavaScript Action');
  }
  assert.equal(fs.realpathSync(env.GITHUB_WORKSPACE), root, 'Artifact workspace mismatch');
  const url = new URL(env.ACTIONS_RESULTS_URL);
  assert.ok(
    url.protocol === 'https:' && !url.username && !url.password,
    'Invalid runner artifact endpoint',
  );
  return {
    ...Object.fromEntries(
      [
        'PATH',
        'HOME',
        'TMPDIR',
        'ACTIONS_RUNTIME_TOKEN',
        'ACTIONS_RESULTS_URL',
        'GITHUB_WORKSPACE',
        'GITHUB_SERVER_URL',
        'GITHUB_RUN_ID',
        'GITHUB_RUN_ATTEMPT',
        'GITHUB_REPOSITORY',
      ]
        .filter((key) => typeof env[key] === 'string')
        .map((key) => [key, env[key]]),
    ),
    ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY: '2',
    ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS: '60000',
  };
}

export async function uploadWithClient(root, client, env, deadline = 60000) {
  runnerEnvironment(root, env);
  const { directory, files } = artifactFiles(root);
  let timer;
  try {
    const result = await Promise.race([
      client.uploadArtifact('unit-coverage', files, directory, {
        retentionDays: 7,
        compressionLevel: 6,
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Artifact upload deadline exceeded')), deadline);
      }),
    ]);
    assert.ok(
      Number.isSafeInteger(result?.id) &&
        result.id > 0 &&
        Number.isSafeInteger(result.size) &&
        result.size > 0,
      'Artifact upload returned no artifact',
    );
    return { id: result.id, size: result.size };
  } catch {
    // SDK exceptions can contain signed endpoints. Never print or persist them.
    throw new Error('Unit artifact upload failed or exceeded its deadline');
  } finally {
    clearTimeout(timer);
  }
}

export async function runArtifactAction(root, env = process.env) {
  const childEnv = runnerEnvironment(root, env);
  artifactFiles(root);
  const result = await runProcess(
    process.execPath,
    [path.join(root, 'scripts/unit/upload-worker.mjs')],
    {
      cwd: root,
      env: childEnv,
      group: true,
      deadline: 90000,
      maxBytes: 204800,
    },
  );
  if (result.code !== 0) throw new Error('Unit artifact upload failed');
  // Child SDK output is deliberately not forwarded or added to artifacts.
}
