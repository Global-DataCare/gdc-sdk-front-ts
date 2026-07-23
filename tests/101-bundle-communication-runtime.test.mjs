/**
 * Teaching goal:
 * - the frontend edits one or several semantic resources inside a Bundle
 * - sdk-core freezes the completed Bundle as one Communication outbox job
 * - sdk-front passes that job through the actor facade without route upserts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BundleEditableResourceTypes,
  BundleEditor,
  BundleOperations,
  BundleTypes,
} from '../../gdc-common-utils-ts/dist/index.js';
import {
  EXAMPLE_CONSENT_IDENTIFIER,
  EXAMPLE_CONSENT_PURPOSE_TREATMENT,
  EXAMPLE_EMAIL_PROFESSIONAL,
  EXAMPLE_PROFILE_PROVIDER_DID,
  EXAMPLE_SUBJECT_DID,
} from '../../gdc-common-utils-ts/dist/examples/shared.js';
import { ConsentDecisions } from '../../gdc-common-utils-ts/dist/models/consent-rule.js';
import {
  attachBundleToCommMsgExtendedDraft,
  createCommMsgExtendedDraft,
  createCommunicationOutboxJobFromCommMsgExtendedDraft,
} from '../../gdc-sdk-core-ts/dist/index.js';

import { IndividualControllerSdk } from '../dist/index.js';

test('101: frontend actor facade submits a completed permission Bundle through Communication', async () => {
  // Step 1. The screen edits the permission Bundle without network calls.
  const permissions = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(BundleEditableResourceTypes.consent);
  permissions
    .newEntryAs(BundleEditableResourceTypes.consent)
    .setIdentifier(EXAMPLE_CONSENT_IDENTIFIER)
    .setSubject(EXAMPLE_SUBJECT_DID)
    .setDecision(ConsentDecisions.Permit)
    .setActorIdentifierList([EXAMPLE_EMAIL_PROFESSIONAL])
    .setPurposeList([EXAMPLE_CONSENT_PURPOSE_TREATMENT])
    .doneEntry();

  // Step 2. The completed Bundle becomes one transport-neutral outbox job.
  let draft = createCommMsgExtendedDraft({
    subject: EXAMPLE_SUBJECT_DID,
    sender: EXAMPLE_SUBJECT_DID,
    recipient: EXAMPLE_PROFILE_PROVIDER_DID,
  });
  draft = attachBundleToCommMsgExtendedDraft(draft, permissions.buildJsonApi());
  const communicationJob = createCommunicationOutboxJobFromCommMsgExtendedDraft(draft);

  // Step 3. The facade receives the job; rendering and carrier remain runtime choices.
  const calls = [];
  const sdk = new IndividualControllerSdk({
    async ingestCommunicationAndUpdateIndex(ctx, input) {
      calls.push({ ctx, input });
      return {
        submit: { status: 202, body: {} },
        poll: { status: 200, attempts: 1, body: {} },
      };
    },
  });
  const ctx = { providerDid: EXAMPLE_PROFILE_PROVIDER_DID };
  const result = await sdk.ingestCommunicationAndUpdateIndex(ctx, { communicationJob });

  assert.equal(result.poll.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.communicationJob.thid, communicationJob.thid);
});
