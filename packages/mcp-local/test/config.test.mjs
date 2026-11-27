import assert from 'node:assert/strict';
import { test } from 'node:test';
import { healthEndpoint, mcpSettingsSchema } from '../dist/config.js';

const rawError =
  'Invalid MCP configuration. Set an HTTPS RIELIA_API_ORIGIN; see the local MCP guide.';
const originError =
  'Invalid MCP configuration. HTTP requires explicit numeric-loopback development allowance.';
test('MCP operator strings retain staged raw and parsed-origin errors', () => {
  for (const origin of [
    undefined,
    '',
    'bad',
    'HTTPS://example.test',
    'https://example.test/path',
    'https://example.test?',
    'https://example.test#',
  ])
    assert.throws(() => healthEndpoint({ RIELIA_API_ORIGIN: origin }), { message: rawError });
  for (const flag of ['', 'TRUE', 'yes', ' true'])
    assert.throws(
      () =>
        healthEndpoint({
          RIELIA_API_ORIGIN: 'https://example.test',
          RIELIA_MCP_ALLOW_LOOPBACK_HTTP: flag,
        }),
      { message: rawError },
    );
  for (const origin of [
    'http://example.test',
    'http://127.0.0.1',
    'https://@example.test',
    'https://user:fictional@example.test',
    'https://example.test\\private',
    'https://example.test\n',
  ])
    assert.throws(() => healthEndpoint({ RIELIA_API_ORIGIN: origin }), { message: originError });
  assert.throws(() => healthEndpoint({ RIELIA_API_ORIGIN: 'https://[broken]' }), TypeError);
});

test('MCP HTTPS and explicit parsed numeric loopback are distinct from identity policy', () => {
  for (const flag of [undefined, 'true', 'false'])
    assert.equal(
      healthEndpoint({
        RIELIA_API_ORIGIN: 'https://EXAMPLE.TEST:443/',
        RIELIA_MCP_ALLOW_LOOPBACK_HTTP: flag,
      }).href,
      'https://example.test/api/v1/health',
    );
  for (const host of ['127.0.0.1', '[::1]', '127.1', '2130706433', '0x7f000001']) {
    const env = {
      RIELIA_API_ORIGIN: `http://${host}:3001`,
      RIELIA_MCP_ALLOW_LOOPBACK_HTTP: 'true',
      NODE_ENV: 'production',
    };
    assert.equal(
      healthEndpoint(env).href,
      `http://${host === '[::1]' ? '[::1]' : '127.0.0.1'}:3001/api/v1/health`,
    );
  }
  for (const host of ['localhost', '127.0.0.2', 'remote.example.test'])
    assert.throws(
      () =>
        healthEndpoint({
          RIELIA_API_ORIGIN: `http://${host}`,
          RIELIA_MCP_ALLOW_LOOPBACK_HTTP: 'true',
        }),
      { message: originError },
    );
  const env = { RIELIA_API_ORIGIN: 'https://example.test' };
  Object.defineProperty(env, 'UNRELATED', {
    get() {
      throw new Error('Unknown setting was read.');
    },
  });
  assert.equal(healthEndpoint(env).href, 'https://example.test/api/v1/health');
});

test('MCP raw schema never coerces operator values', () => {
  for (const value of [
    null,
    [],
    { origin: [] },
    { origin: 'https://example.test', allowance: true },
    { origin: { toString: () => 'https://example.test' } },
  ])
    assert.equal(mcpSettingsSchema.safeParse(value).success, false);
});
