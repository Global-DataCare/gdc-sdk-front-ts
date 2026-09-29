// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ActorKinds,
  DigitalTwinSdk,
  HostOnboardingSdk,
  IndividualControllerSdk,
  IndividualMemberSdk,
  LoadedProfileWorkspace,
  OrganizationControllerSdk,
  OrganizationEmployeeSdk,
  PersonalSdk,
  ProfessionalSdk,
  getActorFacadeMethods,
} from '../dist/index.js';
import { CommunicationCategoryCodes } from 'gdc-common-utils-ts/constants/communication';
import { CommunicationClaim } from 'gdc-common-utils-ts/models/interoperable-claims/communication-claims';
import {
  EXAMPLE_GENERIC_SUBJECT_DID,
  EXAMPLE_PROFESSIONAL_IDENTITY,
} from 'gdc-common-utils-ts';

const frontendFacades = new Map([
  [ActorKinds.HostOnboarding, HostOnboardingSdk],
  [ActorKinds.OrganizationController, OrganizationControllerSdk],
  [ActorKinds.OrganizationEmployee, OrganizationEmployeeSdk],
  [ActorKinds.IndividualController, IndividualControllerSdk],
  [ActorKinds.IndividualMember, IndividualMemberSdk],
  [ActorKinds.Professional, ProfessionalSdk],
]);

test('frontend actor facades implement the complete runtime-neutral Core surface', () => {
  const missingByActor = {};
  for (const [actorKind, Facade] of frontendFacades) {
    const missing = getActorFacadeMethods(actorKind).filter(
      (method) => typeof Facade.prototype[method] !== 'function',
    );
    if (missing.length > 0) missingByActor[actorKind] = missing;
  }
  assert.deepEqual(missingByActor, {});
});

test('frontend exposes the complete browser-safe digital-twin facade', () => {
  const methods = ['requestSmartToken', 'search', 'saveSelection', 'searchSelections', 'materialize'];
  assert.deepEqual(
    methods.filter((method) => typeof DigitalTwinSdk.prototype[method] !== 'function'),
    [],
  );
  assert.equal(typeof LoadedProfileWorkspace.prototype.asDigitalTwin, 'function');
});

const nodeBusinessSurface = new Map([
  [OrganizationControllerSdk, [
    'submitLegalOrganizationVerificationTransaction',
    'submitLegalOrganizationCredentialReissuance',
    'submitLegalOrganizationIssue',
    'provisionOrganizationEmployee',
    'issueOrganizationEmployeeLicense',
    'disableOrganizationEmployee',
    'listOrganizationEmployeeLifecycle',
    'addFreeEmployeeLicenses',
    'requestEmployeeLicenseOffer',
    'confirmOrganizationLicenseOrder',
    'purgeOrganizationEmployee',
    'enableTenant',
    'getTenantLifecycleStatus',
    'disableTenantDescendants',
    'purgeTenantDescendants',
    'revokeEmployeeDevice',
  ]],
  [IndividualControllerSdk, [
    'registerIndividualOrganization',
    'ensureFamilyOrganizationRegistration',
    'searchFamilyOrganization',
    'listProfessionalAccessRequests',
    'revokeProfessionalAccess',
    'setDigitalTwinSecondaryUseConsent',
    'purgeDigitalTwinSubjectLink',
    'getDigitalTwinSecondaryUseConsentStatus',
  ]],
  [ProfessionalSdk, [
    'requestProfessionalAccess',
    'listProfessionalAccessRequests',
  ]],
  [PersonalSdk, [
    'registerIndividualOrganization',
    'listProfessionalAccessRequests',
    'updateSubjectSection',
    'registerBlockchainArtifactAndUpdateIndex',
    'searchCommunicationParticipants',
  ]],
]);

test('frontend facades retain the browser-safe Node business surface', () => {
  const missingByFacade = {};
  for (const [Facade, methods] of nodeBusinessSurface) {
    const missing = methods.filter((method) => typeof Facade.prototype[method] !== 'function');
    if (missing.length > 0) missingByFacade[Facade.name] = missing;
  }
  assert.deepEqual(missingByFacade, {});
});

test('new browser-safe facade methods delegate through the configured runtime adapter', async () => {
  const routeContext = Object.freeze({});
  const input = Object.freeze({});
  const result = Object.freeze({ delegated: true });
  const calls = [];
  const client = new Proxy({}, {
    get(_target, method) {
      return async (...args) => {
        calls.push({ method, args });
        return result;
      };
    },
  });

  const organization = new OrganizationControllerSdk(client);
  const individual = new IndividualControllerSdk(client);
  const professional = new ProfessionalSdk(client);
  const personal = new PersonalSdk(client);

  assert.equal(
    await organization.submitLegalOrganizationVerificationTransaction(routeContext, input),
    result,
  );
  assert.equal(await organization.provisionOrganizationEmployee(routeContext, input), result);
  assert.equal(await organization.enableTenant(routeContext, input), result);
  assert.equal(await organization.revokeEmployeeDevice(routeContext, input), result);
  assert.equal(await individual.registerIndividualOrganization(routeContext, input), result);
  assert.equal(await individual.ensureFamilyOrganizationRegistration(routeContext, input), result);
  assert.equal(await individual.revokeProfessionalAccess(routeContext, input), result);
  assert.equal(await individual.setDigitalTwinSecondaryUseConsent(routeContext, input), result);
  assert.equal(await professional.requestProfessionalAccess(routeContext, input), result);
  assert.equal(await personal.updateSubjectSection(routeContext, input), result);

  assert.deepEqual(
    calls.map(({ method }) => method),
    [
      'submitLegalOrganizationVerificationTransaction',
      'provisionOrganizationEmployee',
      'enableTenant',
      'revokeEmployeeDevice',
      'registerIndividualOrganization',
      'ensureFamilyOrganizationRegistration',
      'revokeProfessionalAccess',
      'setDigitalTwinSecondaryUseConsent',
      'requestProfessionalAccess',
      'updateSubjectSection',
    ],
  );
  for (const call of calls) {
    assert.equal(call.args[0], routeContext);
    assert.equal(call.args[1], input);
  }
});

test('professional access request lists add the canonical notification filter', async () => {
  let delegatedInput;
  const result = Object.freeze({ delegated: true });
  const client = {
    async searchCommunicationParticipants(_ctx, input) {
      delegatedInput = input;
      return result;
    },
  };
  const original = Object.freeze({
    subject: Object.freeze(['subject-filter']),
    searchParams: Object.freeze({ existing: 'preserved' }),
  });

  assert.equal(
    await new ProfessionalSdk(client).listProfessionalAccessRequests(Object.freeze({}), original),
    result,
  );
  assert.equal(delegatedInput.subject, original.subject);
  assert.equal(delegatedInput.searchParams.existing, 'preserved');
  assert.equal(
    delegatedInput.searchParams[CommunicationClaim.Category],
    CommunicationCategoryCodes.Notification.attributeValue,
  );
});

test('digital-twin facade binds research SMART requests to the loaded actor', async () => {
  let delegatedInput;
  const client = {
    async requestSmartToken(input) {
      delegatedInput = input;
      return { status: 'fetched', accessToken: 'opaque-token' };
    },
  };
  const sdk = new DigitalTwinSdk(client, EXAMPLE_PROFESSIONAL_IDENTITY.actorDid);
  const result = await sdk.requestSmartToken({
    actorDid: EXAMPLE_PROFESSIONAL_IDENTITY.actorDid,
    subjectDid: EXAMPLE_GENERIC_SUBJECT_DID,
    scopes: [],
  });

  assert.equal(result.accessToken, 'opaque-token');
  assert.equal(delegatedInput.actorDid, EXAMPLE_PROFESSIONAL_IDENTITY.actorDid);
  assert.ok(delegatedInput.scopes.every((scope) => scope.includes('?subject=*')));
  await assert.rejects(
    () => sdk.requestSmartToken({
      actorDid: EXAMPLE_GENERIC_SUBJECT_DID,
      subjectDid: EXAMPLE_GENERIC_SUBJECT_DID,
      scopes: [],
    }),
    /actorDid must match/,
  );
});
