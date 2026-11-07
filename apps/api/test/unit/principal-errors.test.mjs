import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storageConstraintException } from '../../dist/principals/principal-errors.js';

test(
  'structured duplicate codes classify nested and cyclic wrappers as sanitized conflicts',
  { timeout: 5000 },
  () => {
    for (const code of ['P2002', '23505']) {
      const cause = {
        originalCode: code,
        message: 'private SQL INSERT user_credentials',
        detail: 'private-identifier',
      };
      const error = {
        meta: { driverAdapterError: { cause } },
        connection: 'postgresql://private:password@db/private',
      };
      cause.cause = error;
      const exception = storageConstraintException(error);
      assert.equal(exception.getStatus(), 409);
      assert.deepEqual(exception.getResponse(), {
        statusCode: 409,
        error: 'Conflict',
        message: 'Principal data already exists.',
      });
      assert.equal(JSON.stringify(exception.getResponse()).includes('private'), false);
      assert.equal(storageConstraintException({ code }).getStatus(), 409);
    }
  },
);

test(
  'structured Prisma and PostgreSQL constraint codes produce sanitized bad requests',
  { timeout: 5000 },
  () => {
    for (const code of ['P2000', 'P2003', 'P2004', 'P2011', '23502', '23503', '23514', '23001']) {
      const error = {
        cause: {
          meta: { code, message: 'private SQL constraint table_name', detail: 'private-config' },
        },
      };
      const exception = storageConstraintException(error);
      assert.equal(exception.getStatus(), 400);
      assert.deepEqual(exception.getResponse(), {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Principal data violates a storage constraint.',
      });
      assert.equal(JSON.stringify(exception.getResponse()).includes('private'), false);
    }
  },
);

test('unknown values and message-only SQL codes do not classify', { timeout: 5000 }, () => {
  const cycle = {};
  cycle.cause = cycle;
  for (const error of [
    null,
    undefined,
    false,
    23505,
    '23505',
    {},
    cycle,
    new Error('P2002: duplicate 23505'),
    { message: '23503 constraint' },
    { code: 23505 },
    { code: 'unknown', meta: { detail: '23505' } },
    { unrelated: { code: 'P2002' } },
  ]) {
    assert.equal(storageConstraintException(error), undefined);
  }
});

test(
  'a duplicate code takes precedence over a constraint in the same error chain',
  { timeout: 5000 },
  () => {
    assert.equal(
      storageConstraintException({ code: 'P2003', cause: { originalCode: '23505' } }).getStatus(),
      409,
    );
  },
);
