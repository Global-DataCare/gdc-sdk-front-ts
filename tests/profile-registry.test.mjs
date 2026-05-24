import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROFILE_REGISTRY_ENTRY } from 'gdc-common-utils-ts/examples';

import { ProfileRegistry } from '../dist/index.js';

function createVaultStub() {
  const collections = new Map();
  const calls = {
    initialize: 0,
    put: [],
    get: [],
    query: [],
    delete: [],
  };

  const ensureCollection = (collectionName) => {
    if (!collections.has(collectionName)) {
      collections.set(collectionName, new Map());
    }
    return collections.get(collectionName);
  };

  return {
    calls,
    vault: {
      async initialize() {
        calls.initialize += 1;
      },
      async put(collectionName, containers) {
        calls.put.push([collectionName, containers]);
        const collection = ensureCollection(collectionName);
        const items = Array.isArray(containers) ? containers : [containers];
        for (const item of items) {
          collection.set(item.id, item);
        }
        return true;
      },
      async get(collectionName, containerId) {
        calls.get.push([collectionName, containerId]);
        return collections.get(collectionName)?.get(containerId);
      },
      async query(collectionName, query) {
        calls.query.push([collectionName, query]);
        return [...(collections.get(collectionName)?.values() || [])];
      },
      async delete(collectionName, containerId) {
        calls.delete.push([collectionName, containerId]);
        return collections.get(collectionName)?.delete(containerId) ?? false;
      },
    },
  };
}

test('ProfileRegistry delegates create/update/search/deactivate/not-found lifecycle calls to vault', async () => {
  const { calls, vault } = createVaultStub();
  const registry = new ProfileRegistry(vault);

  await registry.initialize();
  assert.equal(calls.initialize, 1);

  const entry = { ...EXAMPLE_PROFILE_REGISTRY_ENTRY };

  await registry.register(entry);

  const updatedEntry = {
    ...entry,
    email: 'updated@example.com',
  };
  assert.deepEqual(await registry.upsert(updatedEntry), updatedEntry);

  assert.deepEqual(await registry.list(), [updatedEntry]);
  assert.deepEqual(await registry.get('profile-1'), updatedEntry);
  assert.equal(await registry.remove('profile-1'), true);
  assert.equal(await registry.get('profile-1'), undefined);
  assert.equal(await registry.remove('missing-profile'), false);

  assert.deepEqual(calls.put, [
    ['profiles', entry],
    ['profiles', updatedEntry],
  ]);
  assert.deepEqual(calls.query, [['profiles', {}]]);
  assert.deepEqual(calls.get, [
    ['profiles', 'profile-1'],
    ['profiles', 'profile-1'],
  ]);
  assert.deepEqual(calls.delete, [
    ['profiles', 'profile-1'],
    ['profiles', 'missing-profile'],
  ]);
});
