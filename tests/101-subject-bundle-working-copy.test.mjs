/**
 * Teaching goal:
 * - sending a Bundle to GW and updating the screen copy are separate operations
 * - optimistic entries rejected by GW are notified and removed locally
 * - a later backend readback replaces the disposable local copy completely
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SubjectBundleWorkingCopy } from '../dist/index.js';

const contact = (identifier, name) => ({
  type: 'RelatedPerson-create-request-v1.0',
  fullUrl: identifier,
  request: { method: 'POST', url: 'RelatedPerson' },
  resource: {
    resourceType: 'RelatedPerson',
    id: identifier,
    meta: { claims: { 'RelatedPerson.identifier': identifier, 'RelatedPerson.name': name } },
  },
});

const aggregateResource = (resourceType, identifier) => ({
  type: `${resourceType}-search-response-v1.0`,
  fullUrl: identifier,
  resource: {
    resourceType,
    id: identifier,
    meta: { claims: { [`${resourceType}.identifier`]: identifier } },
  },
});

const bundle = (...entries) => ({
  resourceType: 'Bundle',
  type: 'batch',
  total: entries.length,
  data: entries,
});

const response = (status, severity, diagnostics) => ({
  type: 'RelatedPerson-create-response-v1.0',
  response: {
    status,
    outcome: {
      resourceType: 'OperationOutcome',
      issue: severity ? [{ severity, diagnostics }] : [],
    },
  },
});

test('101: partial GW failure removes only the erroneous optimistic resource and emits a notice', () => {
  const original = bundle(contact('urn:contact:existing', 'Existing contact'));
  const submitted = bundle(
    contact('urn:contact:accepted', 'Accepted contact'),
    contact('urn:contact:rejected', 'Rejected contact'),
  );
  const local = new SubjectBundleWorkingCopy(original);

  // Operation A: update only the frontend's subject projection.
  assert.equal(local.applyOptimisticBundle(submitted).data.length, 3);

  // Operation B happens separately through Communication + GW. Reconcile its result.
  const result = local.reconcileSubmission(submitted, bundle(
    response('201', 'success', 'Created'),
    response('422', 'error', 'Relationship is invalid'),
  ));

  assert.deepEqual(result.confirmedIdentifiers, ['urn:contact:accepted']);
  assert.deepEqual(result.removedIdentifiers, ['urn:contact:rejected']);
  assert.equal(result.notices[0].diagnostics[0], 'Relationship is invalid');
  assert.deepEqual(
    result.snapshot.data.map((entry) => entry.fullUrl),
    ['urn:contact:existing', 'urn:contact:accepted'],
  );
});

test('101: ambiguous entries remain pending until the relevant _search replaces local state', () => {
  const submitted = bundle(contact('urn:contact:pending', 'Pending contact'));
  const local = new SubjectBundleWorkingCopy(bundle());
  local.applyOptimisticBundle(submitted);

  const ambiguous = local.reconcileSubmission(submitted, bundle());
  assert.deepEqual(ambiguous.pendingIdentifiers, ['urn:contact:pending']);
  assert.equal(ambiguous.snapshot.data.length, 1);

  // This is the result of subject-scoped RelatedPerson/_search. A clinical
  // screen would instead use Composition/_search; permissions use Consent/_search.
  const freshBackendBundle = bundle(contact('urn:contact:backend', 'Backend contact'));
  assert.deepEqual(
    local.replaceFromRelatedPersonSearch(freshBackendBundle).data.map((entry) => entry.fullUrl),
    ['urn:contact:backend'],
  );
});

test('101: definitive transport rejection removes the whole optimistic submission', () => {
  const submitted = bundle(contact('urn:contact:rejected', 'Rejected contact'));
  const local = new SubjectBundleWorkingCopy(bundle());
  local.applyOptimisticBundle(submitted);

  const result = local.rejectSubmission(submitted, 'GW rejected the Communication');
  assert.equal(result.snapshot.data.length, 0);
  assert.equal(result.notices[0].kind, 'transport-error');
});

test('101: a rejected modification removes the erroneous local resource instead of pretending the edit persisted', () => {
  const original = bundle(contact('urn:contact:edited', 'Original name'));
  const modified = bundle(contact('urn:contact:edited', 'Optimistic name'));
  const local = new SubjectBundleWorkingCopy(original);
  local.applyOptimisticBundle(modified);

  assert.equal(local.getSnapshot().data[0].resource.meta.claims['RelatedPerson.name'], 'Optimistic name');

  const result = local.reconcileSubmission(modified, bundle(
    response('409', 'error', 'Concurrent modification'),
  ));
  assert.equal(result.snapshot.data.length, 0);
  assert.deepEqual(result.removedIdentifiers, ['urn:contact:edited']);
});

test('101: each screen refreshes from its own aggregate _search result', () => {
  const clinicalCopy = new SubjectBundleWorkingCopy(bundle());
  const permissionCopy = new SubjectBundleWorkingCopy(bundle());
  const contactCopy = new SubjectBundleWorkingCopy(bundle());

  clinicalCopy.replaceFromClinicalCompositionSearch(bundle(aggregateResource('Composition', 'urn:composition:latest')));
  permissionCopy.replaceFromConsentSearch(bundle(aggregateResource('Consent', 'urn:consent:all')));
  contactCopy.replaceFromRelatedPersonSearch(bundle(aggregateResource('RelatedPerson', 'urn:contact:all')));

  assert.equal(clinicalCopy.getSnapshot().data[0].resource.resourceType, 'Composition');
  assert.equal(permissionCopy.getSnapshot().data[0].resource.resourceType, 'Consent');
  assert.equal(contactCopy.getSnapshot().data[0].resource.resourceType, 'RelatedPerson');

  assert.throws(
    () => contactCopy.replaceFromRelatedPersonSearch(bundle(aggregateResource('Consent', 'urn:consent:wrong-screen'))),
    /cannot replace a different subject aggregate/i,
  );
});
