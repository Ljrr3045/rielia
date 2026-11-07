import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createIdentityTransport } from '../apps/web/src/lib/identity-client.ts';

test('default same-origin transport can initialize during server rendering without an absolute public URL', () => {
  assert.doesNotThrow(() => createIdentityTransport());
});
