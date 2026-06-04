import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ClientSDK,
  HostOnboardingSdk,
  IndividualControllerSdk,
  OrganizationControllerSdk,
  OrganizationEmployeeSdk,
  PersonalSdk,
  ProfessionalSdk,
} from '../dist/index.js';

function createVaultStub() {
  return {
    async initialize() {},
    async put() { return true; },
    async get() { return undefined; },
    async query() { return []; },
    async delete() { return false; },
  };
}

function createSdk(appType = 'Organization') {
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
    { appId: 'https://globaldatacare.es/app', appType, sector: 'health' },
    {},
    {
      verifyCredential: async () => true,
      verifyPresentation: async () => true,
    },
  );
}

test('organization controller session materializes host and organization facades', async () => {
  const sdk = createSdk('Organization');
  const session = await sdk.initializeSession(
    {
      profileId: 'profile-org-controller',
      email: 'controller@example.org',
      role: 'controller',
      providerDid: 'did:web:org.example',
      appType: 'Organization',
    },
    () => createVaultStub(),
  );

  assert.ok(session.asHostOnboarding() instanceof HostOnboardingSdk);
  assert.ok(session.asOrganizationController() instanceof OrganizationControllerSdk);
  assert.ok(session.asOrganizationEmployee() instanceof OrganizationEmployeeSdk);

  const created = await session.asOrganizationController().createOrganizationEmployee(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    { email: 'doctor@example.org', role: 'physician' },
  );
  assert.equal(created.poll.status, 200);
});

test('family controller session materializes individual and personal facades', async () => {
  const sdk = createSdk('Family');
  const session = await sdk.initializeSession(
    {
      profileId: 'profile-family-controller',
      email: 'family@example.org',
      role: 'controller',
      providerDid: 'did:web:family.example',
      appType: 'Family',
    },
    () => createVaultStub(),
  );

  assert.ok(session.asIndividualController() instanceof IndividualControllerSdk);
  assert.ok(session.asPersonal() instanceof PersonalSdk);
  assert.throws(() => session.asOrganizationEmployee(), /OrganizationEmployeeSdk is not available/);
  assert.throws(() => session.asProfessional(), /ProfessionalSdk is not available/);

  const token = await session.asPersonal().requestSmartToken({
    idToken: 'id-token',
    scopes: ['individual.index.read'],
  });
  assert.equal(token.status, 'fetched');
});

test('professional session materializes the professional facade without employee helpers', async () => {
  const sdk = createSdk('Organization');
  const session = await sdk.initializeSession(
    {
      profileId: 'profile-professional',
      email: 'physician@example.org',
      role: 'physician',
      providerDid: 'did:web:org.example',
      appType: 'Organization',
    },
    () => createVaultStub(),
  );

  assert.ok(session.asProfessional() instanceof ProfessionalSdk);
  assert.throws(() => session.asOrganizationController(), /OrganizationControllerSdk is not available/);
  assert.equal(typeof ProfessionalSdk.prototype.activateOrganizationInGatewayFromIcaProof, 'undefined');
  assert.equal(typeof ProfessionalSdk.prototype.createOrganizationEmployee, 'undefined');
  assert.equal(typeof ProfessionalSdk.prototype.activateEmployeeDeviceWithActivationRequest, 'undefined');
});
