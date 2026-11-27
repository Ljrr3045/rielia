import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readIdentityConfig } from '../../dist/identity/config.js';
import { identityProviderSchema } from '../../dist/identity/config.js';

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

test('disabled flags never inspect credentials, providers, transport or proxy settings', () => {
  for (const flag of [undefined, '', 'false']) {
    const env = { IDENTITY_ENABLED: flag };
    for (const key of Object.keys(base)
      .filter((key) => key !== 'IDENTITY_ENABLED')
      .concat(['IDENTITY_ALLOW_HTTP_LOOPBACK', 'IDENTITY_TRUSTED_PROXIES', 'UNRELATED_SETTING']))
      Object.defineProperty(env, key, {
        get() {
          throw new Error('Ignored setting was read.');
        },
      });
    assert.deepEqual(readIdentityConfig(env), {
      enabled: false,
      origin: '',
      secret: '',
      databaseUrl: '',
      trustedProxies: [],
      providers: {},
    });
  }
  for (const flag of ['TRUE', 'False', ' true', 'false ', '0', '1', 'yes']) {
    assert.throws(() => readIdentityConfig({ ...base, IDENTITY_ENABLED: flag }), {
      message: 'IDENTITY_ENABLED must be true or false.',
    });
  }
});

test('identity required-setting errors and multi-error precedence remain staged and redacted', () => {
  for (const value of [undefined, '', ' \t ']) {
    for (const [key, message] of [
      ['BETTER_AUTH_URL', 'BETTER_AUTH_URL must be a canonical origin.'],
      ['BETTER_AUTH_SECRET', 'BETTER_AUTH_SECRET is required when identity is enabled.'],
      ['DATABASE_URL', 'DATABASE_URL is required when identity is enabled.'],
    ])
      assert.throws(() => readIdentityConfig({ ...base, [key]: value }), { message });
  }
  const cases = [
    [
      { BETTER_AUTH_URL: 'bad', BETTER_AUTH_SECRET: '' },
      'BETTER_AUTH_URL must be a canonical origin.',
    ],
    [
      { BETTER_AUTH_URL: 'https://a.test/path', BETTER_AUTH_SECRET: '' },
      'BETTER_AUTH_URL must contain only a canonical origin.',
    ],
    [
      { BETTER_AUTH_URL: 'http://a.test', BETTER_AUTH_SECRET: '' },
      'Identity requires HTTPS; explicit non-production loopback HTTP is the only exception.',
    ],
    [
      { BETTER_AUTH_SECRET: 'short', DATABASE_URL: '' },
      'BETTER_AUTH_SECRET must contain at least 32 characters.',
    ],
    [
      { DATABASE_URL: 'file:fictional', IDENTITY_TRUSTED_PROXIES: 'bad' },
      'DATABASE_URL must be a PostgreSQL connection URL.',
    ],
    [
      { IDENTITY_TRUSTED_PROXIES: 'bad', GOOGLE_CLIENT_SECRET: '' },
      'IDENTITY_TRUSTED_PROXIES must list explicit proxy IP addresses or CIDRs.',
    ],
    [
      { GOOGLE_CLIENT_SECRET: '', GITHUB_CLIENT_SECRET: '' },
      'GOOGLE requires both client ID and secret.',
    ],
  ];
  for (const [override, message] of cases)
    assert.throws(() => readIdentityConfig({ ...base, ...override }), { message });
  const env = { ...base, GOOGLE_CLIENT_SECRET: '' };
  Object.defineProperty(env, 'GITHUB_CLIENT_ID', {
    get() {
      throw new Error('Later provider was read.');
    },
  });
  assert.throws(() => readIdentityConfig(env), {
    message: 'GOOGLE requires both client ID and secret.',
  });
});

test('identity retains native origin canonicalization and UTF-16 secret bounds', () => {
  for (const origin of [
    ' HTTPS://IDENTITY.EXAMPLE.TEST:443/ ',
    'https://@identity.example.test?',
    'https://identity.example.test/a/..#',
  ]) {
    assert.equal(
      readIdentityConfig({ ...base, BETTER_AUTH_URL: origin }).origin,
      'https://identity.example.test',
    );
  }
  assert.equal(
    readIdentityConfig({ ...base, BETTER_AUTH_SECRET: ` ${'😀'.repeat(16)} ` }).secret,
    '😀'.repeat(16),
  );
  assert.throws(() => readIdentityConfig({ ...base, BETTER_AUTH_SECRET: '😀'.repeat(15) }));
  for (const flag of [undefined, '', 'false', 'TRUE', ' true']) {
    assert.throws(() =>
      readIdentityConfig({
        ...base,
        NODE_ENV: 'development',
        BETTER_AUTH_URL: 'http://localhost',
        IDENTITY_ALLOW_HTTP_LOOPBACK: flag,
      }),
    );
    assert.equal(readIdentityConfig({ ...base, IDENTITY_ALLOW_HTTP_LOOPBACK: flag }).enabled, true);
  }
  for (const host of ['127.1', '2130706433', '0x7f000001']) {
    assert.equal(
      readIdentityConfig({
        ...base,
        NODE_ENV: '',
        BETTER_AUTH_URL: `http://${host}`,
        IDENTITY_ALLOW_HTTP_LOOPBACK: 'true',
      }).origin,
      'http://127.0.0.1',
    );
  }
  const secure = { ...base };
  for (const name of ['NODE_ENV', 'IDENTITY_ALLOW_HTTP_LOOPBACK'])
    Object.defineProperty(secure, name, {
      get() {
        throw new Error('HTTPS does not inspect the exception.');
      },
    });
  assert.equal(readIdentityConfig(secure).enabled, true);
});

test('explicit proxies retain bounds, representation, duplicates and empty-token handling', () => {
  const values = [
    '127.0.0.1/0',
    '127.0.0.1/32',
    '127.0.0.1/000',
    '::1/0',
    '::1/128',
    '::1/00128',
    '192.0.2.1',
    '192.0.2.1',
  ];
  assert.deepEqual(
    readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: ` , ${values.join(' , ')},,` })
      .trustedProxies,
    values,
  );
  for (const proxy of [
    'localhost',
    '[::1]',
    '*',
    '127.0.0.1/',
    '127.0.0.1/+1',
    '::1/1.0',
    '::1/1e2',
    '::1/129',
    '127.0.0.1/33',
    '127.0.0.1 /24',
    '::1/ 1',
    '::1/1/2',
  ])
    assert.throws(() => readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: proxy }), {
      message: 'IDENTITY_TRUSTED_PROXIES must list explicit proxy IP addresses or CIDRs.',
    });
  const raw = '  postgres://unit:fictional@db.example.test/unit?application_name=unit  ';
  assert.equal(readIdentityConfig({ ...base, DATABASE_URL: raw }).databaseUrl, raw.trim());
  assert.throws(() => readIdentityConfig({ ...base, DATABASE_URL: 'fictional-not-a-url' }), {
    message: 'DATABASE_URL must be a PostgreSQL connection URL.',
  });
});

test('the default identity reader consumes only the controlled process settings', (t) => {
  const previous = process.env;
  process.env = { ...base };
  t.after(() => {
    process.env = previous;
  });
  assert.equal(readIdentityConfig().origin, 'https://identity.example.test');
  process.env.IDENTITY_ENABLED = 'false';
  assert.equal(readIdentityConfig().secret, '');
});

test('provider schema rejects nonstring/partial pairs without coercion or extra settings', () => {
  for (const value of [
    null,
    [],
    { clientId: 1, clientSecret: 2 },
    { clientId: ['id'], clientSecret: 'secret' },
    { clientId: 'id' },
    { clientId: '', clientSecret: 'secret' },
    { clientId: 'id', clientSecret: 'secret', extra: true },
  ])
    assert.equal(identityProviderSchema.safeParse(value).success, false);
  assert.equal(identityProviderSchema.parse({}), undefined);
  assert.equal(identityProviderSchema.parse({ clientId: '', clientSecret: '' }), undefined);
  assert.deepEqual(identityProviderSchema.parse({ clientId: 'id', clientSecret: 'secret' }), {
    clientId: 'id',
    clientSecret: 'secret',
  });
});
