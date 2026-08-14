import assert from 'node:assert/strict';
import test from 'node:test';
import { EXAMPLE_CLIENT_INSTANCE_UUID } from 'gdc-common-utils-ts/examples';
import {
  ClientInstallationErrors,
  ClientInstallationStorageKeys,
  getOrCreateClientInstallationId,
} from '../dist/index.js';

test('client installation id is generated once and reused from the shared storage key', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const first = getOrCreateClientInstallationId({
    storage,
    randomUuid: () => EXAMPLE_CLIENT_INSTANCE_UUID,
  });
  const second = getOrCreateClientInstallationId({
    storage,
    randomUuid: () => { throw new Error('must reuse the stored installation id'); },
  });
  assert.equal(first, EXAMPLE_CLIENT_INSTANCE_UUID);
  assert.equal(second, EXAMPLE_CLIENT_INSTANCE_UUID);
  assert.equal(values.get(ClientInstallationStorageKeys.V1), EXAMPLE_CLIENT_INSTANCE_UUID);
});

test('client installation id exposes a typed stable error for an empty generator result', () => {
  const storage = { getItem: () => null, setItem: () => {} };
  assert.throws(
    () => getOrCreateClientInstallationId({ storage, randomUuid: () => '' }),
    new Error(ClientInstallationErrors.EmptyGeneratedId),
  );
});
