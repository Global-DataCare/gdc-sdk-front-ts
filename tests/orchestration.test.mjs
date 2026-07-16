import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ClaimsPersonSchemaorg,
  EXAMPLE_GENERIC_SUBJECT_DID,
  EXAMPLE_PROFILE_ORGANIZATION_DID,
  EXAMPLE_PROFILE_PROVIDER_DID,
  EXAMPLE_PROFILE_SESSION_INPUT,
  EXAMPLE_PROFESSIONAL_IDENTITY,
  IndividualOrganizationLifecycleEditor,
  ProfessionalCredentialTypes,
  W3cCredentialTypes,
  normalizeSameAsHash,
  normalizeTelephoneHash,
} from 'gdc-common-utils-ts';
import {
  ClientSDK,
  HostOnboardingSdk,
  IndividualControllerSdk,
  IndividualMemberSdk,
  OrganizationControllerSdk,
  OrganizationEmployeeSdk,
  PersonalSdk,
  ProfessionalSdk,
  addFhirResourceToDraft,
  createCommunicationDraft,
  createOutboxJobFromDraft,
} from '../dist/index.js';

test('frontend individual facade accepts the same canonical clinical outbox as the Node facade', async () => {
  const calls = [];
  const facade = new IndividualControllerSdk({
    async ingestCommunicationAndUpdateIndex(...args) {
      calls.push(args);
      return { submit: { status: 202, body: {} }, poll: { status: 200, body: {}, attempts: 1 } };
    },
  });
  const draft = addFhirResourceToDraft(
    createCommunicationDraft({ subject: FAMILY_SUBJECT_DID }),
    { resourceType: 'Observation', status: 'final', code: { text: 'Heart rate' } },
  );
  const job = createOutboxJobFromDraft(draft);

  await facade.ingestCommunicationAndUpdateIndex(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
    { communicationJob: job },
  );

  assert.equal(calls[0][1].communicationJob.id, job.id);
  assert.equal(calls[0][1].communicationJob.payload.resourceType, 'Communication');
});

test('frontend individual-member facade exposes the same consent-scoped clinical operations', async () => {
  const calls = [];
  const facade = new IndividualMemberSdk({
    async ingestCommunicationAndUpdateIndex(...args) { calls.push(['ingest', args]); return { submit: {}, poll: {} }; },
    async searchClinicalBundle(...args) { calls.push(['search', args]); return { thid: 'search-1' }; },
    async getLatestIps(...args) { calls.push(['latest', args]); return { thid: 'latest-1' }; },
  });
  const ctx = { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' };
  await facade.ingestCommunicationAndUpdateIndex(ctx, { communicationPayload: { subject: FAMILY_SUBJECT_DID } });
  await facade.searchClinicalBundle(ctx, { subject: FAMILY_SUBJECT_DID });
  await facade.getLatestIps(ctx, FAMILY_SUBJECT_DID);
  assert.deepEqual(calls.map(([name]) => name), ['ingest', 'search', 'latest']);
});

const ORG_PROFILE_DID = EXAMPLE_PROFILE_ORGANIZATION_DID;
const FAMILY_PROFILE_DID = EXAMPLE_PROFILE_PROVIDER_DID;
const FAMILY_SUBJECT_DID = EXAMPLE_GENERIC_SUBJECT_DID;
const PROFILE_ID = EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim();

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
      profileId: PROFILE_ID,
      email: 'controller@example.org',
      role: 'controller',
      providerDid: ORG_PROFILE_DID,
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
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
    { email: 'doctor@example.org', role: 'physician' },
  );
  assert.equal(created.poll.status, 200);

  const search = await session.searchOrganizationEmployees({
    providerDid: ORG_PROFILE_DID,
    idToken: 'id-token',
    employeeClaims: {
      'org.schema.Person.email': 'doctor@example.org',
    },
  });
  assert.equal(search.poll.status, 200);
  assert.equal(search.poll.body.request.resourceType, 'Bundle');
  assert.equal(search.poll.body.request.entry[0].request.url, 'Employee/_search');

  const facadeSearch = await session.asOrganizationController().searchOrganizationEmployees(
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
    {
      employeeClaims: {
        'org.schema.Person.memberOf.taxID': '12345678',
      },
    },
  );
  assert.equal(facadeSearch.poll.status, 200);

  const licenseSearch = await session.asOrganizationController().searchLicenses(
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
    { licenseQuery: { active: true } },
  );
  assert.equal(licenseSearch.poll.status, 200);
  assert.equal(licenseSearch.poll.body.request.entry[0].type, 'License-search-request-v1.0');

  const licenseList = await session.asOrganizationController().listLicenses(
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
  );
  assert.equal(licenseList.poll.status, 200);

  const offerSearch = await session.asOrganizationController().searchLicenseOffers(
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
    { offerQuery: { active: true } },
  );
  assert.equal(offerSearch.poll.status, 200);
  assert.equal(offerSearch.poll.body.request.entry[0].type, 'Offer-search-request-v1.0');

  const orderList = await session.asOrganizationController().listLicenseOrders(
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
  );
  assert.equal(orderList.poll.status, 200);
  assert.equal(orderList.poll.body.request.entry[0].type, 'Order-search-request-v1.0');
});

test('family controller session materializes individual and personal facades', async () => {
  const sdk = createSdk('Family');
  const session = await sdk.initializeSession(
    {
      profileId: PROFILE_ID,
      email: 'family@example.org',
      role: 'controller',
      providerDid: FAMILY_PROFILE_DID,
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
      providerDid: FAMILY_PROFILE_DID,
      idToken: 'id-token',
      requiredScope: 'individual.index.read',
    },
    { subject: FAMILY_SUBJECT_DID },
  );
  assert.match(clinicalSearch.thid, /^thid-/);

  const latestIps = await session.asIndividualController().getLatestIps(
    {
      providerDid: FAMILY_PROFILE_DID,
      idToken: 'id-token',
      requiredScope: 'individual.index.read',
    },
    FAMILY_SUBJECT_DID,
  );
  assert.match(latestIps.thid, /^thid-/);

  const licenseSearch = await session.asIndividualController().searchLicenses(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
    { licenseQuery: { subjectId: FAMILY_SUBJECT_DID } },
  );
  assert.equal(licenseSearch.poll.status, 200);

  const personalLicenseList = await session.asPersonal().listLicenses(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
  );
  assert.equal(personalLicenseList.poll.status, 200);

  const offerSearch = await session.asIndividualController().searchLicenseOffers(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
    { offerQuery: { subjectIds: [FAMILY_SUBJECT_DID] } },
  );
  assert.equal(offerSearch.poll.status, 200);
  assert.equal(offerSearch.poll.body.request.entry[0].type, 'Offer-search-request-v1.0');

  const orderList = await session.asPersonal().listLicenseOrders(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
  );
  assert.equal(orderList.poll.status, 200);
  assert.equal(orderList.poll.body.request.entry[0].type, 'Order-search-request-v1.0');

  const individualEditor = new IndividualOrganizationLifecycleEditor()
    .setIdentifier(FAMILY_SUBJECT_DID)
    .setAlternateName('ana')
    .setOwnerEmail('family@example.org');
  const disabled = await session.asIndividualController().disableIndividual(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
    { individualEditor },
  );
  assert.equal(disabled.poll.status, 200);

  const purged = await session.asIndividualController().purgeIndividual(
    { providerDid: FAMILY_PROFILE_DID, idToken: 'id-token' },
    { organizationEditor: individualEditor },
  );
  assert.equal(purged.poll.status, 200);
});

test('professional session materializes the professional facade without employee helpers', async () => {
  const sdk = createSdk('Organization');
  const session = await sdk.initializeSession(
    {
      profileId: PROFILE_ID,
      email: 'physician@example.org',
      role: 'physician',
      providerDid: ORG_PROFILE_DID,
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
    { providerDid: ORG_PROFILE_DID, idToken: 'id-token' },
    {
      organization: {
        url: ['https://provider.example.org'],
      },
    },
  );

  assert.equal(result.poll.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].providerDid, ORG_PROFILE_DID);
  assert.equal(calls[0][1].organization.url[0], 'https://provider.example.org');
});
