import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ClaimsPersonSchemaorg,
  EXAMPLE_PROFESSIONAL_IDENTITY,
  ProfessionalCredentialTypes,
  W3cCredentialTypes,
  normalizeSameAsHash,
  normalizeTelephoneHash,
} from 'gdc-common-utils-ts';
import {
  ClientSDK,
  HostOnboardingSdk,
  IndividualControllerSdk,
  OrganizationControllerSdk,
  OrganizationEmployeeSdk,
  PersonalSdk,
  ProfessionalSdk,
} from '../dist/index.js';

const HOST_ROUTE_CONTEXT = Object.freeze({
  jurisdiction: 'ES',
  hostNetwork: 'test',
});

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

  const hostDisable = await session.asHostOnboarding().disableHost(
    HOST_ROUTE_CONTEXT,
    { organizationClaims: { 'org.schema.Organization.identifier.value': 'host-1' } },
  );
  assert.equal(hostDisable.poll.status, 200);

  const tenantDisable = await session.asOrganizationController().disableTenant(
    HOST_ROUTE_CONTEXT,
    { organizationClaims: { 'org.schema.Organization.identifier.value': 'tenant-1' } },
  );
  assert.equal(tenantDisable.poll.status, 200);

  const created = await session.asOrganizationController().createOrganizationEmployee(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    { email: 'doctor@example.org', role: 'physician' },
  );
  assert.equal(created.poll.status, 200);

  const search = await session.searchOrganizationEmployees({
    providerDid: 'did:web:org.example',
    idToken: 'id-token',
    employeeClaims: {
      'org.schema.Person.email': 'doctor@example.org',
    },
  });
  assert.equal(search.poll.status, 200);
  assert.equal(search.poll.body.request.resourceType, 'Bundle');
  assert.equal(search.poll.body.request.entry[0].request.url, 'Employee/_search');

  const facadeSearch = await session.asOrganizationController().searchOrganizationEmployees(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    {
      employeeClaims: {
        'org.schema.Person.memberOf.taxID': '12345678',
      },
    },
  );
  assert.equal(facadeSearch.poll.status, 200);

  const licenseSearch = await session.asOrganizationController().searchLicenses(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    { licenseQuery: { active: true } },
  );
  assert.equal(licenseSearch.poll.status, 200);
  assert.equal(licenseSearch.poll.body.request.entry[0].type, 'License-search-request-v1.0');

  const licenseList = await session.asOrganizationController().listLicenses(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
  );
  assert.equal(licenseList.poll.status, 200);

  const offerSearch = await session.asOrganizationController().searchLicenseOffers(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    { offerQuery: { active: true } },
  );
  assert.equal(offerSearch.poll.status, 200);
  assert.equal(offerSearch.poll.body.request.entry[0].type, 'Offer-search-request-v1.0');

  const orderList = await session.asOrganizationController().listLicenseOrders(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
  );
  assert.equal(orderList.poll.status, 200);
  assert.equal(orderList.poll.body.request.entry[0].type, 'Order-search-request-v1.0');
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

  const clinicalSearch = await session.asIndividualController().searchClinicalBundle(
    {
      providerDid: 'did:web:family.example',
      idToken: 'id-token',
      requiredScope: 'individual.index.read',
    },
    { subject: 'did:web:subject.example' },
  );
  assert.match(clinicalSearch.thid, /^thid-/);

  const latestIps = await session.asIndividualController().getLatestIps(
    {
      providerDid: 'did:web:family.example',
      idToken: 'id-token',
      requiredScope: 'individual.index.read',
    },
    'did:web:subject.example',
  );
  assert.match(latestIps.thid, /^thid-/);

  const licenseSearch = await session.asIndividualController().searchLicenses(
    { providerDid: 'did:web:family.example', idToken: 'id-token' },
    { licenseQuery: { subjectId: 'did:web:subject.example' } },
  );
  assert.equal(licenseSearch.poll.status, 200);

  const personalLicenseList = await session.asPersonal().listLicenses(
    { providerDid: 'did:web:family.example', idToken: 'id-token' },
  );
  assert.equal(personalLicenseList.poll.status, 200);

  const offerSearch = await session.asIndividualController().searchLicenseOffers(
    { providerDid: 'did:web:family.example', idToken: 'id-token' },
    { offerQuery: { subjectIds: ['did:web:subject.example'] } },
  );
  assert.equal(offerSearch.poll.status, 200);
  assert.equal(offerSearch.poll.body.request.entry[0].type, 'Offer-search-request-v1.0');

  const orderList = await session.asPersonal().listLicenseOrders(
    { providerDid: 'did:web:family.example', idToken: 'id-token' },
  );
  assert.equal(orderList.poll.status, 200);
  assert.equal(orderList.poll.body.request.entry[0].type, 'Order-search-request-v1.0');
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

test('ProfessionalSdk exposes canonical identity VC and VP helpers through the shared common-utils layer', () => {
  const sdk = new ProfessionalSdk({});
  const expectedSameAs = normalizeSameAsHash(EXAMPLE_PROFESSIONAL_IDENTITY.email);
  const expectedTelephone = normalizeTelephoneHash(EXAMPLE_PROFESSIONAL_IDENTITY.telephone);

  assert.deepEqual(sdk.getIdentitySameAs(EXAMPLE_PROFESSIONAL_IDENTITY), [expectedSameAs]);
  assert.deepEqual(sdk.getIdentityVC(EXAMPLE_PROFESSIONAL_IDENTITY), {
    type: [W3cCredentialTypes.VerifiableCredential, ProfessionalCredentialTypes.EmployeeCredential],
    credentialSubject: {
      id: EXAMPLE_PROFESSIONAL_IDENTITY.actorDid,
      hasOccupation: EXAMPLE_PROFESSIONAL_IDENTITY.role,
      sameAs: expectedSameAs,
      [ClaimsPersonSchemaorg.telephone]: expectedTelephone,
      [ClaimsPersonSchemaorg.hasCredentialMaterial]: EXAMPLE_PROFESSIONAL_IDENTITY.credentialMaterial,
    },
  });
  assert.equal(
    sdk.buildIdentityVpPayload({
      clientId: EXAMPLE_PROFESSIONAL_IDENTITY.actorDid,
      ...EXAMPLE_PROFESSIONAL_IDENTITY,
    }).vp.holder,
    EXAMPLE_PROFESSIONAL_IDENTITY.actorDid,
  );
  assert.equal(
    typeof sdk.buildUnsignedIdentityVpJwt({
      clientId: EXAMPLE_PROFESSIONAL_IDENTITY.actorDid,
      ...EXAMPLE_PROFESSIONAL_IDENTITY,
    }),
    'string',
  );
});

test('OrganizationControllerSdk delegates organization DID binding to the frontend runtime client', async () => {
  const calls = [];
  const sdk = new OrganizationControllerSdk({
    submitOrganizationDidBinding: async (...args) => {
      calls.push(args);
      return { submit: { status: 202, body: {} }, poll: { status: 200, body: {}, attempts: 1 } };
    },
  });

  const result = await sdk.submitOrganizationDidBinding(
    { providerDid: 'did:web:org.example', idToken: 'id-token' },
    {
      organization: {
        url: ['https://provider.example.org'],
      },
    },
  );

  assert.equal(result.poll.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].providerDid, 'did:web:org.example');
  assert.equal(calls[0][1].organization.url[0], 'https://provider.example.org');
});
