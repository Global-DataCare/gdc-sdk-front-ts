import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXAMPLE_PROFILE_PROVIDER_DID,
  EXAMPLE_SEARCH_CLINICAL_BUNDLE_INPUT,
  EXAMPLE_SEND_COMMUNICATION_INPUT,
} from 'gdc-common-utils-ts/examples';

import { IndividualService } from '../dist/index.js';

test('IndividualService.sendCommunication returns a thread id for canonical input', async () => {
  const service = new IndividualService();

  const result = await service.sendCommunication(
    { ...EXAMPLE_SEND_COMMUNICATION_INPUT },
    EXAMPLE_PROFILE_PROVIDER_DID,
    'professional.communication.create',
    'id-token-123',
  );

  assert.match(result.thid, /^thid-/);
});

test('IndividualService.sendCommunication rejects missing required subject', async () => {
  const service = new IndividualService();

  await assert.rejects(
    () =>
      service.sendCommunication(
        {
          text: 'Message body',
        },
        EXAMPLE_PROFILE_PROVIDER_DID,
        'professional.communication.create',
        'id-token-123',
      ),
    /subject/,
  );
});

test('IndividualService.searchClinicalBundle returns a thread id for canonical input', async () => {
  const service = new IndividualService();

  const result = await service.searchClinicalBundle(
    { ...EXAMPLE_SEARCH_CLINICAL_BUNDLE_INPUT },
    EXAMPLE_PROFILE_PROVIDER_DID,
    'professional.communication.search',
    'id-token-123',
  );

  assert.match(result.thid, /^thid-/);
});

test('IndividualService.searchClinicalBundle rejects missing required subject', async () => {
  const service = new IndividualService();

  await assert.rejects(
    () =>
      service.searchClinicalBundle(
        {
          includedTypes: ['Communication'],
        },
        EXAMPLE_PROFILE_PROVIDER_DID,
        'professional.communication.search',
        'id-token-123',
      ),
    /subject/,
  );
});
