/**
 * Executable frontend 101:
 * 1. the individual controller reserves and issues one existing RelatedPerson
 *    invitation seat;
 * 2. the authenticated member accepts that exact invitation;
 * 3. the member asks for all IPS sections through its actor facade;
 * 4. the trusted runtime/GW returns only the active Consent intersection.
 *
 * UI components do not derive authority and do not ingest Communications.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXAMPLE_CONSENT_ACCESS_RELATED_PERSON_EMAIL,
  EXAMPLE_CONSENT_ACCESS_RULES,
  EXAMPLE_CONSENT_ACCESS_SUBJECT,
} from 'gdc-common-utils-ts/examples/consent-access';
import {
  EXAMPLE_INDIVIDUAL_MEMBER_IDENTITY,
} from 'gdc-common-utils-ts/examples/related-person';
import {
  EXAMPLE_DEMO_PORTAL_ID_TOKEN,
  EXAMPLE_OTP_CODE,
  EXAMPLE_OTP_INVITATION_ID,
  EXAMPLE_PROFILE_PROVIDER_DID,
  EXAMPLE_RELATED_PERSON_IDENTIFIER,
  EXAMPLE_RELATED_PERSON_ROLE,
} from 'gdc-common-utils-ts/examples/shared';
import {
  HealthcareConsentPurposes,
  HealthcareSummarySections,
} from 'gdc-common-utils-ts/constants/healthcare';
import {
  buildSmartCompositionReadScope,
  deriveGrantedSmartScopes,
} from 'gdc-common-utils-ts/utils/smart-scope';
import {
  IndividualControllerSdk,
  IndividualMemberSdk,
} from '../dist/index.js';

test('controller invitation becomes a member SMART read only through active Consent', async () => {
  const calls = [];
  const requestedSections = Object.values(HealthcareSummarySections)
    .map((section) => section.attributeValue);
  const requestedScope = buildSmartCompositionReadScope({
    subjectDid: EXAMPLE_CONSENT_ACCESS_SUBJECT,
    sections: requestedSections,
  });
  const runtime = {
    async addFreeIndividualMemberLicenses(...args) {
      calls.push(['add-seat', args]);
      return { submit: {}, poll: {} };
    },
    async issueIndividualMemberLicense(...args) {
      calls.push(['issue-invitation', args]);
      return { submit: {}, poll: {} };
    },
    async transitionIndividualMemberLicense(...args) {
      calls.push(['accept-invitation', args]);
      return { submit: {}, poll: {} };
    },
    async requestSmartToken(input) {
      calls.push(['request-smart-token', [input]]);
      const grant = deriveGrantedSmartScopes(
        [EXAMPLE_CONSENT_ACCESS_RULES.relatedPersonClinicalSections],
        {
          requestedScopes: input.scopes,
          actor: {
            actorKind: 'related-person',
            actorDid: input.actorDid,
            email: EXAMPLE_CONSENT_ACCESS_RELATED_PERSON_EMAIL,
          },
          actorRole: EXAMPLE_RELATED_PERSON_ROLE,
          purpose: HealthcareConsentPurposes.Treatment,
        },
      );
      return {
        status: grant.grantedScopes.length ? 'fetched' : 'failed',
        accessToken: grant.grantedScopes.length ? 'opaque-test-token' : undefined,
        scopes: grant.grantedScopes,
      };
    },
  };
  const route = {
    providerDid: EXAMPLE_PROFILE_PROVIDER_DID,
    idToken: EXAMPLE_DEMO_PORTAL_ID_TOKEN,
  };
  const controller = new IndividualControllerSdk(runtime);
  const member = new IndividualMemberSdk(runtime);

  await controller.addFreeMemberLicenses(route, {
    ownerOrganizationId: EXAMPLE_CONSENT_ACCESS_SUBJECT,
    quantity: 1,
  });
  await controller.issueMemberInvitationLicense(route, {
    ownerOrganizationId: EXAMPLE_CONSENT_ACCESS_SUBJECT,
    subjectDid: EXAMPLE_CONSENT_ACCESS_SUBJECT,
    relatedPersonId: EXAMPLE_RELATED_PERSON_IDENTIFIER,
    invitationId: EXAMPLE_OTP_INVITATION_ID,
    role: EXAMPLE_RELATED_PERSON_ROLE,
    email: EXAMPLE_CONSENT_ACCESS_RELATED_PERSON_EMAIL,
  });
  await member.acceptMemberInvitation(route, {
    activationCode: EXAMPLE_OTP_CODE,
    verifiedActorIdentifier: EXAMPLE_CONSENT_ACCESS_RELATED_PERSON_EMAIL,
  });
  const token = await member.requestSmartToken({
    idToken: EXAMPLE_DEMO_PORTAL_ID_TOKEN,
    actorDid: EXAMPLE_INDIVIDUAL_MEMBER_IDENTITY.actorDid,
    subjectDid: EXAMPLE_CONSENT_ACCESS_SUBJECT,
    scopes: [requestedScope],
  });

  assert.equal(token.status, 'fetched');
  assert.ok(token.accessToken);
  assert.equal(token.scopes.length, 1);
  assert.ok(!token.scopes[0].includes('section=*'));
  assert.deepEqual(calls.map(([name]) => name), [
    'add-seat',
    'issue-invitation',
    'accept-invitation',
    'request-smart-token',
  ]);
});
