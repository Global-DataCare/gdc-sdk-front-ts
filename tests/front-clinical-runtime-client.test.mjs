/**
 * Flow contract:
 * 1. Node, browser and Expo submit the same public Communication outbox job.
 * 2. Firebase/login tokens never replace subject-scoped SMART authorization.
 * 3. Rendering happens before the carrier boundary, so an offline database or
 *    Bluetooth relay receives one opaque, replay-identifiable JWE.
 * 4. Polling keeps the original `thid`; carrier changes must not create a new
 *    clinical transaction.
 * Authorization invariant: GW authorizes each clinical batch entry.
 * Persistence invariant: mixed batch outcomes remain independent, with no
 * transaction-wide rollback invented by the frontend runtime.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXAMPLE_SUBJECT_DID,
  HealthcareBasicSections,
  ResourceTypesFhirR4,
} from 'gdc-common-utils-ts';
import {
  FrontClinicalRuntimeClient,
  TransportProfiles,
  attachFhirResourceAsAttachmentToCommMsgExtendedDraft,
  createCommunicationOutboxJobFromCommMsgExtendedDraft,
  createCommMsgExtendedDraft,
} from '../dist/index.js';

function createJob() {
  const draft = attachFhirResourceAsAttachmentToCommMsgExtendedDraft(
    createCommMsgExtendedDraft({
      thid: 'clinical-thread-1',
      subject: 'did:web:subject.example',
    }),
    { resourceType: 'Observation', status: 'final', code: { text: 'Heart rate' } },
  );
  return createCommunicationOutboxJobFromCommMsgExtendedDraft(draft);
}

const ctx = {
  providerDid: 'did:web:provider.example',
  idToken: 'login-token-must-not-be-used',
  accessToken: 'smart-access-token',
  tenantId: 'VATES-TEST',
  jurisdiction: 'ES',
  sector: 'health-care',
};

test('direct Front runtime sends the canonical outbox through an injected carrier', async () => {
  const requests = [];
  const client = new FrontClinicalRuntimeClient({
    carrier: {
      async send(request) {
        requests.push(request);
        return request.phase === 'submit'
          ? { status: 202, body: { accepted: true } }
          : { status: 200, body: { completed: true } };
      },
    },
  });

  const result = await client.ingestCommunicationAndUpdateIndex(ctx, { communicationJob: createJob() });
  assert.equal(result.poll.status, 200);
  assert.equal(requests[0].authorization, 'Bearer smart-access-token');
  assert.equal(requests[0].message.contentType, TransportProfiles.DidcommPlainJson);
  assert.equal(requests[0].message.thid, 'clinical-thread-1');
  assert.equal(requests[1].message.thid, 'clinical-thread-1');
});

test('direct Front runtime keeps section and summary updates as distinct contracts', async () => {
  const requests = [];
  const client = new FrontClinicalRuntimeClient({
    carrier: {
      async send(request) {
        requests.push(request);
        return request.phase === 'submit'
          ? { status: 202, body: { accepted: true } }
          : { status: 200, body: { completed: true } };
      },
    },
  });

  // Step 1: a one-section batch carries the explicit section through the
  // canonical Communication builder.
  await client.updateClinicalSection(ctx, {
    thid: 'front-section-update-1',
    subject: EXAMPLE_SUBJECT_DID,
    section: HealthcareBasicSections.VitalSigns.attributeValue,
    bundle: {
      resourceType: 'Bundle',
      type: 'batch',
      data: [{ resource: { resourceType: 'Observation', id: 'front-vital-1' } }],
    },
  });
  assert.equal(requests[0].message.thid, 'front-section-update-1');

  // Step 2: a summary write rejects anything other than a Composition-first
  // document before the carrier can report a false success.
  await assert.rejects(
    client.updateClinicalSummary(ctx, {
      subject: EXAMPLE_SUBJECT_DID,
      bundle: { resourceType: 'Bundle', type: 'batch', data: [] },
    }),
    /Bundle\.type=document/i,
  );
});

test('direct Front runtime preserves independent success and failure results from one clinical batch', async () => {
  const entryResults = [
    { id: 'observation-created', response: { status: '201' } },
    { id: 'allergy-forbidden', response: { status: '403' } },
  ];
  const client = new FrontClinicalRuntimeClient({
    carrier: {
      async send(request) {
        return request.phase === 'submit'
          ? { status: 202, body: { accepted: true } }
          : { status: 200, body: { data: entryResults } };
      },
    },
  });

  const result = await client.updateClinicalSection(ctx, {
    thid: 'front-mixed-section-batch-1',
    subject: EXAMPLE_SUBJECT_DID,
    section: HealthcareBasicSections.AllergiesAndIntolerances.attributeValue,
    bundle: {
      resourceType: 'Bundle',
      type: 'batch',
      data: [{
        type: 'Observation-create-request-v1.0',
        request: { method: 'POST', url: 'Observation' },
        resource: { resourceType: 'Observation', id: 'observation-created' },
      }, {
        type: 'AllergyIntolerance-delete-request-v1.0',
        request: { method: 'DELETE', url: 'AllergyIntolerance/allergy-forbidden' },
      }],
    },
  });

  assert.deepEqual(result.poll.body.data, entryResults);
  assert.equal(result.poll.body.data[0].response.status, '201');
  assert.equal(result.poll.body.data[1].response.status, '403');
});

test('offline or Bluetooth carrier receives the unchanged protected JWE form body', async () => {
  const transferred = [];
  const secure = {
    async pack(message) { return `jwe.${message.thid}.ciphertext`; },
    async unpack(value) { return { decrypted: value }; },
  };
  const client = new FrontClinicalRuntimeClient({
    transportProfile: TransportProfiles.DidcommEncryptedForm,
    secureTransportAdapter: secure,
    carrier: {
      async send(request) {
        transferred.push(request.message.body);
        if (request.phase === 'submit') return { status: 202, body: { accepted: true } };
        return { status: 200, body: 'response=jwe.response.ciphertext' };
      },
    },
  });

  const result = await client.ingestCommunicationAndUpdateIndex(ctx, { communicationJob: createJob() });
  assert.equal(transferred[0], 'request=jwe.clinical-thread-1.ciphertext');
  assert.deepEqual(result.poll.body, { decrypted: 'jwe.response.ciphertext' });
});

test('direct Front runtime never substitutes the login ID token for SMART authorization', async () => {
  const client = new FrontClinicalRuntimeClient({
    carrier: { async send() { throw new Error('must not send'); } },
  });
  await assert.rejects(
    client.ingestCommunicationAndUpdateIndex({ ...ctx, accessToken: undefined }, { communicationJob: createJob() }),
    /requires a SMART access token/,
  );
});

test('direct Front runtime reads $summary and returns section/type/date facades', async () => {
  const section = HealthcareBasicSections.AllergiesAndIntolerances.attributeValue;
  const bundle = {
    resourceType: ResourceTypesFhirR4.Bundle,
    type: 'document',
    entry: [{
      resource: {
        resourceType: ResourceTypesFhirR4.Composition,
        section: [{
          code: { coding: [{
            system: HealthcareBasicSections.AllergiesAndIntolerances.system,
            code: HealthcareBasicSections.AllergiesAndIntolerances.code,
          }] },
          entry: [{ reference: 'AllergyIntolerance/allergy-front-1' }],
        }],
      },
    }, {
      resource: {
        resourceType: ResourceTypesFhirR4.AllergyIntolerance,
        id: 'allergy-front-1',
        recordedDate: '2026-07-20T10:00:00Z',
      },
    }],
  };
  const client = new FrontClinicalRuntimeClient({
    carrier: {
      async send(request) {
        return request.phase === 'submit'
          ? { status: 202, body: { accepted: true } }
          : {
            status: 200,
            body: {
              data: [{
                type: 'Bundle-summary-response-v1.0',
                resource: bundle,
              }],
            },
          };
      },
    },
  });

  const result = await client.requestClinicalSummary(ctx, {
    subjectId: EXAMPLE_SUBJECT_DID,
    requesterId: EXAMPLE_SUBJECT_DID,
    filterSections: [section],
  });

  assert.equal(result.reader.getDocumentSectionResourceCount(section), 1);
  assert.equal(result.document.getResourceCount({
    sections: [section],
    types: [ResourceTypesFhirR4.AllergyIntolerance],
    date: { start: '2026-07-01', end: '2026-07-31' },
  }), 1);
});
