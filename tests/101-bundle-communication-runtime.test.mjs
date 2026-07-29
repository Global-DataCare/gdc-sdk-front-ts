/**
 * Teaching goal:
 * - the frontend edits one or several semantic resources inside a Bundle
 * - the screen displays that Bundle optimistically from memory
 * - the browser submits the command Bundle to its authenticated BFF
 * - only the backend turns it into a Communication ingestion job
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
  EXAMPLE_SUBJECT_DID,
} from '../../gdc-common-utils-ts/dist/examples/shared.js';
import { ConsentDecisions } from '../../gdc-common-utils-ts/dist/models/consent-rule.js';

import { SubjectBundleWorkingCopy } from '../dist/index.js';

test('101: browser keeps the Bundle in memory and delegates persistence to its BFF', async () => {
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
  const submittedBundle = permissions.buildJsonApi();

  // Step 2. The UI updates its disposable working copy immediately.
  const workingCopy = new SubjectBundleWorkingCopy({
    resourceType: 'Bundle',
    type: 'batch',
    total: 0,
    data: [],
  });
  assert.equal(workingCopy.applyOptimisticBundle(submittedBundle).data.length, 1);

  // Step 3. The browser sends only the command Bundle to its authenticated BFF.
  // The BFF owns Communication creation and ingestCommunicationAndUpdateIndex.
  const calls = [];
  const portalBff = {
    async submitClinicalBundle(bundle) {
      calls.push(bundle);
      return {
        resourceType: 'Bundle',
        type: 'batch-response',
        total: 1,
        data: [{
          response: {
            status: '201',
            outcome: { resourceType: 'OperationOutcome', issue: [] },
          },
        }],
      };
    },
  };
  const responseBundle = await portalBff.submitClinicalBundle(submittedBundle);

  // Step 4. The UI reconciles the GW result without performing ingestion.
  const reconciled = workingCopy.reconcileSubmission(submittedBundle, responseBundle);
  assert.equal(calls.length, 1);
  assert.deepEqual(reconciled.confirmedIdentifiers, [EXAMPLE_CONSENT_IDENTIFIER]);
  assert.deepEqual(reconciled.removedIdentifiers, []);
});
