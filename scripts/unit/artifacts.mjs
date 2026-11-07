import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { scopes, artifactLimits } from './config.mjs';
import { regular, tree, write, json, coverageDirectory } from './files.mjs';

const reportFiles = ['summary.json', 'manifest.json', 'coverage-final.json', 'lcov.info'];
export function packageArtifacts(root) {
  assert.equal(fs.realpathSync(root), path.resolve(root), 'Unsafe artifact root');
  const input = coverageDirectory(root, 'unit');
  const output = coverageDirectory(root, 'artifacts');
  if (fs.existsSync(output)) {
    assert.ok(!fs.lstatSync(output).isSymbolicLink(), 'Unsafe artifact directory');
    for (const file of tree(root, 'coverage/artifacts')) regular(root, file);
    fs.rmSync(output, { recursive: true });
  }
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  const status = {};
  const readInput = (file) => {
    const target = regular(input, file);
    assert.ok(fs.statSync(target).size <= artifactLimits.file, 'Artifact file bound exceeded');
    return fs.readFileSync(target);
  };
  const current = fs.existsSync(path.join(input, 'status.json'))
    ? JSON.parse(readInput('status.json').toString('utf8'))
    : {};
  assert.ok(
    current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      Object.entries(current).every(
        ([scope, value]) => scopes.includes(scope) && ['complete', 'partial'].includes(value),
      ),
    'Invalid artifact status schema',
  );
  let bytes = 0;
  function append(file, body) {
    const text = body.toString('utf8');
    const length = Buffer.byteLength(text);
    assert.ok(length <= artifactLimits.file, 'Artifact file bound exceeded');
    bytes += length;
    assert.ok(bytes <= artifactLimits.total, 'Artifact total bound exceeded');
    assert.ok(
      !/sourcesContent|sourceMappingURL|\/(?:Users|private|home|tmp)\//.test(text),
      'Unsafe artifact payload',
    );
    write(output, file, body);
  }
  for (const scope of scopes) {
    const files = reportFiles.map((f) => `${scope}/${f}`);
    if (
      current[scope] !== 'complete' ||
      !files.every((file) => fs.existsSync(path.join(input, file)))
    ) {
      status[scope] = 'missing or partial';
      continue;
    }
    for (const file of files) {
      const body = readInput(file);
      // Allowlist output schemas; never upload raw NYC output, source maps or test logs.
      append(file, body);
    }
    status[scope] = 'complete';
  }
  if (fs.existsSync(path.join(input, 'failure.json'))) {
    const failure = JSON.parse(readInput('failure.json').toString('utf8'));
    const phase = (value) =>
      typeof value === 'string' &&
      /^(?:build|artifacts|(?:api|web|contracts|prototype):(?:prepare|instrument|tests|report))$/.test(
        value,
      );
    assert.ok(
      failure.status === 'failed' &&
        phase(failure.phase) &&
        Array.isArray(failure.diagnostics) &&
        failure.diagnostics.length <= 64,
      'Invalid artifact failure schema',
    );
    for (const item of failure.diagnostics)
      assert.ok(
        item &&
          Object.keys(item).sort().join(',') === 'exit,phase' &&
          phase(item.phase) &&
          Number.isSafeInteger(item.exit) &&
          item.exit >= 0 &&
          item.exit <= 255,
        'Invalid artifact diagnostic schema',
      );
    append(
      'failure.json',
      json({ status: 'failed', phase: failure.phase, diagnostics: failure.diagnostics }),
    );
  }
  append('status.json', json(status));
  return status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  try {
    const status = packageArtifacts(process.cwd());
    console.log(status);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const rows = scopes.map((scope) => {
        const file = path.join(process.cwd(), `coverage/artifacts/${scope}/summary.json`);
        if (!fs.existsSync(file)) return `| ${scope} | missing or partial |`;
        const summary = JSON.parse(fs.readFileSync(file, 'utf8'));
        return `| ${scope} | ${Object.entries(summary.total)
          .map(([metric, value]) => `${metric} ${value.covered}/${value.total}`)
          .join('; ')} |`;
      });
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Unit coverage\n\n| Scope | Covered / total |\n| --- | --- |\n${rows.join('\n')}\n\nReports do not replace real integration/security/runtime checks.\n`,
      );
    }
  } catch {
    console.error('Unit artifact packaging failed schema/path/size validation');
    process.exitCode = 1;
  }
}
