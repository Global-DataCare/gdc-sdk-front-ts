import test from 'node:test';
import assert from 'node:assert/strict';

import {
  expandActorSessionDescriptorToFacades,
  filterCapabilitiesForActor,
} from '../dist/index.js';

test('gdc-sdk-front-ts reuses core facade expansion for Family sessions', () => {
  const facades = expandActorSessionDescriptorToFacades({
    actorKinds: ['individual_controller', 'individual_member'],
    capabilities: [
      'individual.bootstrap',
      'individual.import_ips',
      'individual.generate_digital_twin',
      'consent.grant_professional_access',
    ],
    appType: 'Family',
    profileId: 'profile-family-1',
    profileDid: 'did:web:family:controller',
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

test('gdc-sdk-front-ts reuses core capability filtering', () => {
  assert.deepEqual(
    filterCapabilitiesForActor('organization_employee', [
      'organization.issue_activation_code',
      'organization.request_smart_token',
      'individual.import_ips',
    ]),
    ['organization.issue_activation_code', 'organization.request_smart_token'],
  );
});
