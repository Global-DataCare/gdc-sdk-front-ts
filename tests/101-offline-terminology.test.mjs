/**
 * Teaching goal:
 * - load a small terminology fallback in an offline-capable frontend
 * - reuse it for both clinical card translation and coded form search
 * - preserve the FHIR display when the local catalog has no requested term
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OfflineClinicalTerminology,
  toClinicalResourceCardView,
} from '../dist/index.js';

test('101: an offline frontend translates and searches its loaded terminology', () => {
  // Step 1. The app loads only the catalogs needed by its offline workflow.
  const terminology = new OfflineClinicalTerminology([{
    language: 'es',
    data: [{
      id: 'ips',
      attributes: {
        '44054006': 'Diabetes mellitus tipo 2',
      },
    }],
  }]);

  // Step 2. The same local provider translates a known clinical card.
  const card = toClinicalResourceCardView({
    resource: {
      resourceType: 'Condition',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '44054006',
          display: 'Type 2 diabetes mellitus',
        }],
      },
    },
  }, {
    locale: 'es',
    translateCode: terminology.translateCode,
  });
  assert.equal(card.title, 'Diabetes mellitus tipo 2');

  // Step 3. A coded input reuses that catalog without network access.
  assert.equal(terminology.search({
    text: 'diabetes',
    language: 'es',
    systems: ['http://snomed.info/sct'],
  })[0]?.code, '44054006');
});

test('an offline frontend leaves an unknown code unresolved for FHIR fallback', () => {
  const terminology = new OfflineClinicalTerminology([]);
  assert.equal(terminology.translateCode({
    resourceType: 'Condition',
    system: 'http://snomed.info/sct',
    code: 'unknown',
    token: 'http://snomed.info/sct|unknown',
    locale: 'es',
  }), undefined);
});
