import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorCapabilities, ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';
import { EXAMPLE_PROFILE_ORGANIZATION_DID, EXAMPLE_PROFILE_SESSION_INPUT } from 'gdc-common-utils-ts/examples';

import {
  describeFrontActorFacades,
  describeFrontActorSession,
} from '../dist/index.js';

test('describeFrontActorSession builds a composite Family descriptor from actor flags', () => {
  const descriptor = describeFrontActorSession({
    appType: 'Family',
    profileId: EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim(),
    profileDid: EXAMPLE_PROFILE_ORGANIZATION_DID,
    role: 'controller',
    actorFlags: {
      individualController: true,
      individualMember: true,
    },
  });

  assert.deepEqual(descriptor, {
    actorKinds: [ActorKinds.IndividualController, ActorKinds.IndividualMember],
    capabilities: [
      ActorCapabilities.IndividualBootstrap,
      ActorCapabilities.IndividualDisable,
      ActorCapabilities.IndividualPurge,
      ActorCapabilities.IndividualIngestCommunication,
      ActorCapabilities.IndividualUpsertRelatedPerson,
      ActorCapabilities.IndividualMemberDisable,
      ActorCapabilities.IndividualMemberPurge,
      ActorCapabilities.ConsentGrantProfessionalAccess,
      ActorCapabilities.IndividualImportIps,
      ActorCapabilities.IndividualGenerateDigitalTwin,
    ],
    appType: 'Family',
    profileId: EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim(),
    profileDid: EXAMPLE_PROFILE_ORGANIZATION_DID,
    role: 'controller',
  });
});

test('describeFrontActorFacades splits Family descriptor into scoped facades', () => {
  const facades = describeFrontActorFacades({
    appType: 'Family',
    profileId: EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim(),
    profileDid: EXAMPLE_PROFILE_ORGANIZATION_DID,
    actorFlags: {
      individualController: true,
      individualMember: true,
    },
  });

  assert.deepEqual(facades, [
    {
      actorKind: ActorKinds.IndividualController,
      capabilities: [
        ActorCapabilities.IndividualBootstrap,
        ActorCapabilities.IndividualDisable,
        ActorCapabilities.IndividualPurge,
        ActorCapabilities.IndividualIngestCommunication,
        ActorCapabilities.IndividualUpsertRelatedPerson,
        ActorCapabilities.IndividualMemberDisable,
        ActorCapabilities.IndividualMemberPurge,
        ActorCapabilities.ConsentGrantProfessionalAccess,
        ActorCapabilities.IndividualImportIps,
        ActorCapabilities.IndividualGenerateDigitalTwin,
      ],
      appType: 'Family',
      profileId: EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim(),
      profileDid: EXAMPLE_PROFILE_ORGANIZATION_DID,
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
      profileId: EXAMPLE_PROFILE_SESSION_INPUT.profileId.trim(),
      profileDid: EXAMPLE_PROFILE_ORGANIZATION_DID,
      role: undefined,
    },
  ]);
});

test('describeFrontActorSession keeps optional fields undefined when they are omitted', () => {
  const descriptor = describeFrontActorSession({
    appType: 'Organization',
    profileId: 'profile-org-1',
    actorFlags: {},
  });

  assert.deepEqual(descriptor, {
    actorKinds: [],
    capabilities: [],
    appType: 'Organization',
    profileId: 'profile-org-1',
    profileDid: undefined,
    role: undefined,
  });
});

test('describeFrontActorFacades returns no facades when actor flags are missing', () => {
  const facades = describeFrontActorFacades({
    appType: 'Organization',
    profileId: 'profile-org-1',
    actorFlags: {},
  });

  assert.deepEqual(facades, []);
});
