import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorCapabilities, ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';

import {
  expandActorSessionDescriptorToFacades,
  filterCapabilitiesForActor,
} from '../dist/index.js';

test('gdc-sdk-front-ts reuses core facade expansion for Family sessions', () => {
  const facades = expandActorSessionDescriptorToFacades({
    actorKinds: [ActorKinds.IndividualController, ActorKinds.IndividualMember],
    capabilities: [
      ActorCapabilities.IndividualBootstrap,
      ActorCapabilities.IndividualIngestCommunication,
      ActorCapabilities.IndividualUpsertRelatedPerson,
      ActorCapabilities.IndividualImportIps,
      ActorCapabilities.IndividualGenerateDigitalTwin,
      ActorCapabilities.ConsentGrantProfessionalAccess,
    ],
    appType: 'Family',
    profileId: 'profile-family-1',
    profileDid: 'did:web:family:controller',
  });

  assert.deepEqual(facades, [
    {
      actorKind: ActorKinds.IndividualController,
      capabilities: [
        ActorCapabilities.IndividualBootstrap,
        ActorCapabilities.IndividualIngestCommunication,
        ActorCapabilities.IndividualUpsertRelatedPerson,
        ActorCapabilities.IndividualImportIps,
        ActorCapabilities.IndividualGenerateDigitalTwin,
        ActorCapabilities.ConsentGrantProfessionalAccess,
      ],
      appType: 'Family',
      profileId: 'profile-family-1',
      profileDid: 'did:web:family:controller',
      role: undefined,
    },
    {
      actorKind: ActorKinds.IndividualMember,
      capabilities: [
        ActorCapabilities.IndividualUpsertRelatedPerson,
        ActorCapabilities.IndividualImportIps,
        ActorCapabilities.IndividualGenerateDigitalTwin,
      ],
      appType: 'Family',
      profileId: 'profile-family-1',
      profileDid: 'did:web:family:controller',
      role: undefined,
    },
  ]);
});

test('gdc-sdk-front-ts reuses core capability filtering', () => {
  assert.deepEqual(
    filterCapabilitiesForActor(ActorKinds.OrganizationEmployee, [
      ActorCapabilities.OrganizationIssueActivationCode,
      ActorCapabilities.OrganizationRequestSmartToken,
      ActorCapabilities.IndividualImportIps,
    ]),
    [ActorCapabilities.OrganizationIssueActivationCode, ActorCapabilities.OrganizationRequestSmartToken],
  );
});
