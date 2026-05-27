import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorCapabilities, ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';

import {
  describeFrontActorFacades,
  describeFrontActorSession,
} from '../dist/index.js';

test('describeFrontActorSession builds a composite Family descriptor from actor flags', () => {
  const descriptor = describeFrontActorSession({
    appType: 'Family',
    profileId: 'profile-family-1',
    profileDid: 'did:web:family:controller',
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
      ActorCapabilities.IndividualMemberDisable,
      ActorCapabilities.IndividualMemberPurge,
      ActorCapabilities.ConsentGrantProfessionalAccess,
      ActorCapabilities.IndividualImportIps,
      ActorCapabilities.IndividualGenerateDigitalTwin,
    ],
    appType: 'Family',
    profileId: 'profile-family-1',
    profileDid: 'did:web:family:controller',
    role: 'controller',
  });
});

test('describeFrontActorFacades splits Family descriptor into scoped facades', () => {
  const facades = describeFrontActorFacades({
    appType: 'Family',
    profileId: 'profile-family-1',
    profileDid: 'did:web:family:controller',
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
        ActorCapabilities.IndividualMemberDisable,
        ActorCapabilities.IndividualMemberPurge,
        ActorCapabilities.ConsentGrantProfessionalAccess,
      ],
      appType: 'Family',
      profileId: 'profile-family-1',
      profileDid: 'did:web:family:controller',
      role: undefined,
    },
    {
      actorKind: ActorKinds.IndividualMember,
      capabilities: [ActorCapabilities.IndividualImportIps, ActorCapabilities.IndividualGenerateDigitalTwin],
      appType: 'Family',
      profileId: 'profile-family-1',
      profileDid: 'did:web:family:controller',
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
