import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROFILE_SESSION_INPUT } from 'gdc-common-utils-ts/examples';

import { ClientSDK, ProfileManager, ProfileRegistry } from '../dist/index.js';

function createVaultStub() {
  const collections = new Map();
  const calls = {
    initialize: 0,
    put: [],
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
        return collections.get(collectionName)?.get(containerId);
      },
      async query(collectionName) {
        return [...(collections.get(collectionName)?.values() || [])];
      },
      async delete(collectionName, containerId) {
        return collections.get(collectionName)?.delete(containerId) ?? false;
      },
    },
  };
}

function createSdk() {
  return new ClientSDK(
    {
      network: { isConnected: async () => true },
      api: {
        operationMode: 'DEMO',
        legacyFhirEnabled: false,
        getRetryPolicy: () => ({ retries: 0, delayMs: 0 }),
      },
      fetcher: async () => {
        throw new Error('unexpected fetch');
      },
    },
    { appType: 'Family', sector: 'health' },
    {},
    {
      verifyCredential: async () => true,
      verifyPresentation: async () => true,
    },
    'did:web:ica.example',
  );
}

test('ClientSDK.initializeSession creates the current session and persists the profile', async () => {
  const { calls, vault } = createVaultStub();
  const sdk = createSdk();

  const session = await sdk.initializeSession(
    { ...EXAMPLE_PROFILE_SESSION_INPUT },
    () => vault,
  );

  assert.ok(session instanceof ProfileManager);
  assert.equal(sdk.currentSession, session);
  assert.equal(session.profile.id, 'profile-1');
  assert.equal(session.profile.email, 'user@example.com');
  assert.equal(session.profile.role, 'controller');
  assert.equal(session.profile.providerDid, 'did:web:org.example');
  assert.equal(session.profile.appType, 'Family');
  assert.equal(typeof session.profile.createdAt, 'string');
  assert.equal(session.orgDidDoc.id, 'did:web:org.example');
  assert.deepEqual(calls.put, [[
    'profile',
    {
      id: 'profile-1',
      email: 'user@example.com',
      role: 'controller',
      providerDid: 'did:web:org.example',
      appType: 'Family',
      createdAt: session.profile.createdAt,
    },
  ]]);

  sdk.shutdownSession();
  assert.equal(sdk.currentSession, null);
});

test('ClientSDK.initializeSession rejects missing profileId and keeps the session cleared', async () => {
  const { vault } = createVaultStub();
  const sdk = createSdk();

  await assert.rejects(
    () =>
      sdk.initializeSession(
        {
          ...EXAMPLE_PROFILE_SESSION_INPUT,
          profileId: '   ',
        },
        () => vault,
      ),
    /profileId/,
  );

  assert.equal(sdk.currentSession, null);
});

test('ClientSDK.initializeProfileRegistry initializes the vault once and stores the registry', async () => {
  const { calls, vault } = createVaultStub();
  const sdk = createSdk();

  const registry = await sdk.initializeProfileRegistry(() => vault);

  assert.ok(registry instanceof ProfileRegistry);
  assert.equal(sdk.profileRegistry, registry);
  assert.equal(calls.initialize, 1);
});
