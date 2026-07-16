import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FrontClinicalRuntimeClient,
  TransportProfiles,
  attachFhirResourceAsAttachmentToCommMsgExtendedDraft,
  createCommunicationOutboxJobFromCommMsgExtendedDraft,
  createCommMsgExtendedDraft,
} from '../dist/index.js';

/**
 * Flow contract:
 * 1. Node, browser and Expo submit the same public Communication outbox job.
 * 2. Firebase/login tokens never replace subject-scoped SMART authorization.
 * 3. Rendering happens before the carrier boundary, so an offline database or
 *    Bluetooth relay receives one opaque, replay-identifiable JWE.
 * 4. Polling keeps the original `thid`; carrier changes must not create a new
 *    clinical transaction.
 */

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
