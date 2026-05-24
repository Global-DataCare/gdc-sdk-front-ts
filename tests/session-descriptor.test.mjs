import test from 'node:test';
import assert from 'node:assert/strict';

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
    actorKinds: ['individual_controller', 'individual_member'],
    capabilities: [
      'individual.bootstrap',
      'consent.grant_professional_access',
      'individual.import_ips',
      'individual.generate_digital_twin',
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
      actorKind: 'individual_controller',
      capabilities: ['individual.bootstrap', 'consent.grant_professional_access'],
      appType: 'Family',
      profileId: 'profile-family-1',
      profileDid: 'did:web:family:controller',
      role: undefined,
    },
    {
      actorKind: 'individual_member',
      capabilities: ['individual.import_ips', 'individual.generate_digital_twin'],
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
