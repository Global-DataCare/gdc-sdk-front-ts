import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_DEFAULT_ICA_DID, EXAMPLE_PROFILE_SESSION_INPUT, EXAMPLE_TENANT_IDENTIFIER } from 'gdc-common-utils-ts/examples';

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
    { appId: 'https://globaldatacare.es/app', appType: 'Family', sector: 'health' },
    {},
    {
      verifyCredential: async () => true,
      verifyPresentation: async () => true,
    },
    EXAMPLE_DEFAULT_ICA_DID,
  );
}

test('ClientSDK resolves app identity and defaults appVersion to v1.0', () => {
  const sdk = createSdk();

  assert.deepEqual(sdk.getResolvedAppInfo(), {
    appId: 'es.globaldatacare',
    appVersion: 'v1.0',
    appType: 'Family',
    sector: 'health',
  });

  assert.deepEqual(sdk.getAppHeaders(), {
    AppId: 'es.globaldatacare',
    AppVersion: 'v1.0',
  });
});

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
  assert.equal(session.profile.providerDid, EXAMPLE_PROFILE_SESSION_INPUT.providerDid.trim());
  assert.equal(session.profile.appType, 'Family');
  assert.equal(typeof session.profile.createdAt, 'string');
  assert.equal(session.orgDidDoc.id, EXAMPLE_PROFILE_SESSION_INPUT.providerDid.trim());
  assert.deepEqual(calls.put, [[
    'profile',
    {
      id: 'profile-1',
      email: 'user@example.com',
      role: 'controller',
      providerDid: EXAMPLE_PROFILE_SESSION_INPUT.providerDid.trim(),
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

test('ClientSDK sends AppId and AppVersion headers in provider discovery requests', async () => {
  const requests = [];
  const sdk = new ClientSDK(
    {
      network: { isConnected: async () => true },
      api: {
        operationMode: 'DEMO',
        legacyFhirEnabled: false,
        getRetryPolicy: () => ({ retries: 0, delayMs: 0 }),
      },
      fetcher: async (url, init) => {
        requests.push([url, init]);
        return {
          ok: true,
          async json() {
            return { fields: [] };
          },
        };
      },
    },
    { appId: 'portal.globaldatacare.es', appVersion: 'v3.2.1', appType: 'Family', sector: 'health' },
    {},
    {
      verifyCredential: async () => true,
      verifyPresentation: async () => true,
    },
  );

  await sdk.fetchWellKnownApiConfig('https://provider.example.org');
  await sdk.fetchSupportedFields('https://provider.example.org');

  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0][1].headers, {
    AppId: 'es.globaldatacare.portal',
    AppVersion: 'v3.2.1',
  });
  assert.deepEqual(requests[1][1].headers, {
    AppId: 'es.globaldatacare.portal',
    AppVersion: 'v3.2.1',
  });
});

test('ClientSDK.resolveAuthority derives one hosted tenant DID from one base URL without requiring caller-side did:web knowledge', async () => {
  const sdk = createSdk();

  const resolved = await sdk.resolveAuthority({
    authorityBaseUrl: 'https://gw.example.org',
    tenantId: EXAMPLE_TENANT_IDENTIFIER,
    jurisdiction: 'ES',
    sector: 'health-care',
    subjectSameAs: 'CARD-724-0000-111-222-333-444',
  });

  assert.equal(resolved.authorityDidWeb, 'did:web:gw.example.org');
  assert.equal(resolved.authorityBaseUrl, 'https://gw.example.org/');
  assert.equal(resolved.tenantDidWeb, `did:web:gw.example.org:${EXAMPLE_TENANT_IDENTIFIER}:cds-ES:v1:health-care`);
  assert.equal(resolved.source, 'legacy');
  assert.equal(resolved.matchedBy, 'subject-same-as');
});
