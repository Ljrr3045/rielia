import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localRuntimeEnabled, runtimeDatabaseUrl, readApiPort } from '../../dist/runtime/config.js';

test('runtime opt-in is exact, defaults disabled and does not read a disabled connection', () => {
  for (const flag of [undefined, '', 'false', 'TRUE', ' true', '1', 'yes']) {
    const env = { LOCAL_RUNTIME_ENABLED: flag };
    Object.defineProperty(env, 'DATABASE_URL', {
      get() {
        throw new Error('Disabled DB read.');
      },
    });
    assert.equal(localRuntimeEnabled(env), false);
    assert.throws(() => runtimeDatabaseUrl(env), {
      message: 'Local diagnostic runtime requires explicit enablement and DATABASE_URL.',
    });
  }
  assert.equal(localRuntimeEnabled({ LOCAL_RUNTIME_ENABLED: 'true' }), true);
});

test('enabled diagnostics require nonempty strings but pg owns connection parsing without trim', () => {
  for (const value of [undefined, '', null, 42, {}, ['url']])
    assert.throws(
      () => runtimeDatabaseUrl({ LOCAL_RUNTIME_ENABLED: 'true', DATABASE_URL: value }),
      { message: 'Local diagnostic runtime requires explicit enablement and DATABASE_URL.' },
    );
  for (const value of [
    ' ',
    'not-a-url',
    'postgresql://unit:fictional@db.test/unit',
    '  postgres://unit:fictional@db.test/unit  ',
  ])
    assert.equal(runtimeDatabaseUrl({ LOCAL_RUNTIME_ENABLED: 'true', DATABASE_URL: value }), value);
});

test('port parsing preserves Number aliases, default and exact inclusive range', () => {
  assert.equal(readApiPort({}), 3001);
  for (const [value, expected] of [
    ['1', 1],
    ['65535', 65535],
    [' 42 ', 42],
    ['+42', 42],
    ['1e3', 1000],
    ['0x10', 16],
    ['0b10', 2],
    ['42.0', 42],
    ['0042', 42],
  ])
    assert.equal(readApiPort({ PORT: value }), expected);
  for (const value of [
    '',
    ' ',
    '0',
    '-0',
    '-1',
    '1.5',
    '65536',
    'Infinity',
    '-Infinity',
    'NaN',
    'one',
  ])
    assert.throws(() => readApiPort({ PORT: value }), {
      message: 'PORT must be an integer between 1 and 65535.',
    });
  const env = {};
  Object.defineProperty(env, 'HOST', {
    get() {
      throw new Error('Port parsing read HOST early.');
    },
  });
  assert.equal(readApiPort(env), 3001);
});

test('runtime process defaults use the current controlled environment at invocation time', (t) => {
  const previous = process.env;
  process.env = {};
  t.after(() => {
    process.env = previous;
  });
  assert.equal(localRuntimeEnabled(), false);
  assert.equal(readApiPort(), 3001);
  assert.throws(() => runtimeDatabaseUrl(), {
    message: 'Local diagnostic runtime requires explicit enablement and DATABASE_URL.',
  });
  process.env.LOCAL_RUNTIME_ENABLED = 'true';
  process.env.DATABASE_URL = ' fictional-pg-input ';
  process.env.PORT = '0x10';
  assert.equal(localRuntimeEnabled(), true);
  assert.equal(runtimeDatabaseUrl(), ' fictional-pg-input ');
  assert.equal(readApiPort(), 16);
});
