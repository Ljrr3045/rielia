import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readIdentityConfig } from '../../dist/identity/config.js';

// Fictional settings keep this suite independent of operator environment values.
const base = Object.freeze({
  IDENTITY_ENABLED: 'true',
  NODE_ENV: 'production',
  BETTER_AUTH_URL: 'https://identity.example.test',
  BETTER_AUTH_SECRET: 'fictional-secret-for-unit-tests-0123456789',
  DATABASE_URL: 'postgresql://unit:fictional-password@db.example.test/unit',
  GOOGLE_CLIENT_ID: 'fictional-google-client',
  GOOGLE_CLIENT_SECRET: 'fictional-google-secret',
  GITHUB_CLIENT_ID: 'fictional-github-client',
  GITHUB_CLIENT_SECRET: 'fictional-github-secret',
});

// Retains every assertion from the synchronous integration-file control.
// That control stays intact until a separate formatting adoption permits relocation.
test('configuration fails closed without exposing values', { timeout: 5000 }, () => {
  assert.equal(readIdentityConfig({}).enabled, false);
  for (const key of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']) {
    assert.throws(() => readIdentityConfig({ ...base, [key]: '' }));
  }
  for (const origin of [
    'https://a.example/path',
    'https://user:pass@a.example',
    'https://a.example?x=1',
    'http://a.example',
    'javascript:example',
  ]) {
    assert.throws(() => readIdentityConfig({ ...base, BETTER_AUTH_URL: origin }));
  }
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: 'true' }));
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: '127.0.0.1/33' }));
  assert.throws(() => readIdentityConfig({ ...base, GOOGLE_CLIENT_SECRET: '' }));
  assert.throws(() => readIdentityConfig({ ...base, DATABASE_URL: 'file:identity.db' }));
  assert.throws(() => readIdentityConfig({ ...base, BETTER_AUTH_SECRET: 'short' }));
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_ENABLED: 'yes' }));
  assert.throws(() =>
    readIdentityConfig({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_URL: 'http://localhost:3000',
      IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
    }),
  );
  assert.equal(
    readIdentityConfig({
      ...base,
      NODE_ENV: 'development',
      BETTER_AUTH_URL: 'http://127.0.0.1:3000',
      IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
    }).origin,
    'http://127.0.0.1:3000',
  );
});

test('disabled configuration returns no credential or provider settings', { timeout: 5000 }, () => {
  const disabled = {
    enabled: false,
    origin: '',
    secret: '',
    databaseUrl: '',
    trustedProxies: [],
    providers: {},
  };
  assert.deepEqual(readIdentityConfig({ ...base, IDENTITY_ENABLED: 'false' }), disabled);
  assert.deepEqual(readIdentityConfig({ ...base, IDENTITY_ENABLED: undefined }), disabled);
});

test(
  'canonical HTTPS configuration trims settings and enables only complete providers',
  { timeout: 5000 },
  () => {
    const config = readIdentityConfig({
      ...base,
      BETTER_AUTH_URL: ' HTTPS://IDENTITY.EXAMPLE.TEST:443/ ',
      GOOGLE_CLIENT_ID: ' google-id ',
      GOOGLE_CLIENT_SECRET: ' google-secret ',
      GITHUB_CLIENT_ID: ' ',
      GITHUB_CLIENT_SECRET: '',
      IDENTITY_TRUSTED_PROXIES: ' 127.0.0.1/32, ::1/128, 192.0.2.1 , ',
    });
    assert.deepEqual(config, {
      enabled: true,
      origin: 'https://identity.example.test',
      secret: base.BETTER_AUTH_SECRET,
      databaseUrl: base.DATABASE_URL,
      trustedProxies: ['127.0.0.1/32', '::1/128', '192.0.2.1'],
      providers: { google: { clientId: 'google-id', clientSecret: 'google-secret' } },
    });
    const both = readIdentityConfig(base);
    assert.deepEqual(Object.keys(both.providers), ['google', 'github']);
    assert.deepEqual(
      readIdentityConfig({
        ...base,
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        GITHUB_CLIENT_ID: '',
        GITHUB_CLIENT_SECRET: '',
      }).providers,
      {},
    );
  },
);

test('HTTP requires explicit nonproduction loopback permission', { timeout: 5000 }, () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    const origin = `http://${host}:3000`;
    assert.equal(
      readIdentityConfig({
        ...base,
        NODE_ENV: 'development',
        BETTER_AUTH_URL: origin,
        IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
      }).origin,
      origin,
    );
    assert.throws(() =>
      readIdentityConfig({ ...base, NODE_ENV: 'development', BETTER_AUTH_URL: origin }),
    );
    assert.throws(() =>
      readIdentityConfig({
        ...base,
        BETTER_AUTH_URL: origin,
        IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
      }),
    );
  }
  assert.throws(() =>
    readIdentityConfig({
      ...base,
      NODE_ENV: 'development',
      BETTER_AUTH_URL: 'http://remote.example.test',
      IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
    }),
  );
});

test(
  'invalid configuration errors contain setting names without supplied values',
  { timeout: 5000 },
  () => {
    const cases = [
      ['BETTER_AUTH_URL', 'https://unit:private-url-password@identity.example.test/path'],
      ['DATABASE_URL', 'mysql://unit:private-db-password@db.example.test/unit'],
      ['BETTER_AUTH_SECRET', 'private-short'],
      ['IDENTITY_TRUSTED_PROXIES', 'private-proxy-name'],
      ['IDENTITY_TRUSTED_PROXIES', '127.0.0.1/-1'],
      ['IDENTITY_TRUSTED_PROXIES', '::1/129'],
      ['IDENTITY_TRUSTED_PROXIES', '127.0.0.1/24/1'],
      ['IDENTITY_TRUSTED_PROXIES', '127.0.0.1/nope'],
    ];
    for (const [setting, value] of cases) {
      assert.throws(
        () => readIdentityConfig({ ...base, [setting]: value }),
        (error) => {
          assert.ok(error.message.includes(setting));
          assert.ok(!error.message.includes(value));
          assert.ok(!error.message.includes(base.BETTER_AUTH_SECRET));
          assert.ok(!error.message.includes(base.DATABASE_URL));
          return true;
        },
      );
    }
    for (const provider of ['GOOGLE', 'GITHUB']) {
      for (const absent of ['CLIENT_ID', 'CLIENT_SECRET']) {
        assert.throws(() => readIdentityConfig({ ...base, [`${provider}_${absent}`]: '' }), {
          message: `${provider} requires both client ID and secret.`,
        });
      }
    }
  },
);
