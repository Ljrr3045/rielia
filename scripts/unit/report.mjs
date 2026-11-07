import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { metrics, zeroUnits } from './config.mjs';
import { inside, regular } from './files.mjs';

function integer(n) {
  assert.ok(Number.isSafeInteger(n) && n >= 0, 'Coverage counter must be a nonnegative integer');
}
function location(loc, lines) {
  assert.ok(loc && loc.start && loc.end, 'Missing mapped location');
  for (const point of [loc.start, loc.end]) {
    assert.ok(
      Number.isSafeInteger(point.line) && point.line > 0 && point.line <= lines.length,
      'Mapped line out of source',
    );
    assert.ok(
      point.column === null ||
        (Number.isSafeInteger(point.column) &&
          point.column >= 0 &&
          point.column <= lines[point.line - 1].length),
      'Mapped column out of source',
    );
  }
}

export function normalizeReport(root, scope, expected, raw, coverage) {
  assert.ok(raw && typeof raw === 'object' && !Array.isArray(raw), 'Malformed coverage report');
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    const file = inside(root, key);
    assert.ok(expected.includes(file), `Unexpected coverage input: ${file}`);
    assert.equal(inside(root, data.path), file, 'Coverage path mismatch');
    assert.ok(!result[file], 'Duplicate mapped input');
    const lines = readFileSync(regular(root, file), 'utf8').split('\n');
    for (const [counters, map] of [
      ['s', 'statementMap'],
      ['f', 'fnMap'],
      ['b', 'branchMap'],
    ]) {
      assert.ok(data[counters] && data[map], 'Missing counter map');
      assert.deepEqual(
        Object.keys(data[counters]).sort(),
        Object.keys(data[map]).sort(),
        'Counter/map IDs differ',
      );
      for (const [id, count] of Object.entries(data[counters])) {
        const entry = data[map][id];
        if (counters === 'b') {
          assert.ok(
            Array.isArray(count) && count.length === entry.locations.length && count.length > 0,
            'Malformed branch counter',
          );
          count.forEach(integer);
          entry.locations.forEach((loc) => location(loc, lines));
        } else {
          integer(count);
          location(counters === 'f' ? entry.loc : entry, lines);
          if (counters === 'f' && entry.decl) location(entry.decl, lines);
        }
      }
    }
    // Deliberately omit inputSourceMap, sourcesContent, hashes and provider/temp metadata.
    result[file] = Object.fromEntries(
      ['statementMap', 'fnMap', 'branchMap', 's', 'f', 'b'].map((key) => [key, data[key]]),
    );
    result[file].path = file;
  }
  const missing = expected.filter((file) => !result[file]);
  assert.deepEqual(missing, zeroUnits[scope], 'Maintained input/report mismatch');
  for (const file of missing) {
    result[file] = { path: file, statementMap: {}, fnMap: {}, branchMap: {}, s: {}, f: {}, b: {} };
  }
  const map = coverage.createCoverageMap(result);
  const perFile = Object.fromEntries(
    expected.map((file) => [file, counts(map.fileCoverageFor(file).toSummary())]),
  );
  const total = counts(map.getCoverageSummary());
  return { counters: result, summary: { scope, total, files: perFile } };
}

function counts(summary) {
  return Object.fromEntries(
    metrics.map((metric) => {
      const { covered, total } = summary[metric];
      integer(covered);
      integer(total);
      assert.ok(covered <= total, 'Covered count exceeds total');
      return [metric, { covered, total }];
    }),
  );
}

export function assertComparable(actual, accepted) {
  assert.deepEqual(
    actual,
    accepted,
    'Source/provider/test manifest changed; reviewed comparable before/after evidence required',
  );
}

export function assertGate(actual, baseline) {
  assert.ok(actual && baseline && actual.scope === baseline.scope, 'Missing/wrong baseline scope');
  assert.deepEqual(
    Object.keys(actual.files).sort(),
    Object.keys(baseline.files).sort(),
    'Coverage source inventory changed; reviewed comparable baseline required',
  );
  for (const metric of metrics) {
    const current = actual.total[metric];
    const previous = baseline.total[metric];
    compare(current, previous, metric);
    const floor = baseline.floors[metric];
    if (current.total === 0) assert.equal(floor, null, 'Zero-unit metric must be N/A');
    else {
      assert.ok(
        Number.isSafeInteger(floor) && floor >= 0 && floor <= 10000,
        'Invalid metric floor',
      );
      assert.ok(
        BigInt(current.covered) * 10000n >= BigInt(floor) * BigInt(current.total),
        `${metric} floor failed`,
      );
    }
    for (const [file, values] of Object.entries(actual.files)) {
      compare(values[metric], baseline.files[file][metric], `${file} ${metric}`);
    }
  }
  const covered = (files) =>
    Object.values(files).filter((values) => metrics.some((m) => values[m].covered > 0)).length;
  assert.ok(covered(actual.files) >= covered(baseline.files), 'Covered-file ratio regressed');
}

function compare(current, previous, label) {
  integer(current.covered);
  integer(current.total);
  integer(previous.covered);
  integer(previous.total);
  assert.ok(
    current.covered <= current.total && previous.covered <= previous.total,
    'Invalid counts',
  );
  assert.equal(
    current.total,
    previous.total,
    `${label} denominator changed; reviewed comparable baseline required`,
  );
  assert.ok(
    BigInt(current.covered) * BigInt(previous.total) >=
      BigInt(previous.covered) * BigInt(current.total),
    `${label} exact-ratio regression`,
  );
  assert.ok(
    current.total - current.covered <= previous.total - previous.covered,
    `${label} uncovered count increased`,
  );
}

export function baselineFor(summary, manifest) {
  return {
    ...summary,
    manifest,
    floors: Object.fromEntries(
      metrics.map((m) => [
        m,
        summary.total[m].total
          ? Math.floor((summary.total[m].covered * 10000) / summary.total[m].total)
          : null,
      ]),
    ),
  };
}

export function normalizeLcov(root, raw, expected, reportCwd = root) {
  return raw
    .split('\n')
    .map((line) => {
      if (!line.startsWith('SF:')) return line;
      const file = inside(root, resolve(reportCwd, line.slice(3)));
      assert.ok(expected.includes(file), 'Unexpected LCOV path');
      return `SF:${file}`;
    })
    .join('\n');
}
