// Flow contract:
// 1. The browser builds one section-scoped FHIR batch through typed editors.
// 2. One entry creates a fact while another deletes an exact ResourceType/id.
// 3. DELETE has no body and may bind the current version independently.
// Authorization invariant: GW decides creator and subject authority per entry.
// Persistence invariant: partial batch success is preserved without rollback.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BundleEditor,
  BundleEditableResourceTypes,
  BundleTypes,
  HttpRequestMethods,
  toClinicalResourceCardView,
  toClinicalSectionViews,
} from '../dist/index.js';

test('frontend SDK exposes mixed POST and DELETE clinical batch entries', () => {
  const batch = new BundleEditor().setBundleType(BundleTypes.batch);
  batch.newEntryAs(BundleEditableResourceTypes.observation, 'observation-create-001').create();
  batch.newEntryAs(BundleEditableResourceTypes.allergyIntolerance, 'allergy-delete-001')
    .delete()
    .ifMatch('allergy-version-001');

  const built = batch.build();
  assert.equal(built.type, BundleTypes.batch);
  assert.equal(built.entry[0].request.method, HttpRequestMethods.Post);
  assert.equal(built.entry[1].request.method, HttpRequestMethods.Delete);
  assert.equal(built.entry[1].request.url, 'AllergyIntolerance/allergy-delete-001');
  assert.equal(built.entry[1].request.ifMatch, 'W/"allergy-version-001"');
  assert.equal('resource' in built.entry[1], false);
});

test('frontend SDK exposes the canonical coded clinical authoring/display surface', () => {
  assert.equal(typeof BundleEditor, 'function');
  assert.equal(typeof toClinicalResourceCardView, 'function');
  assert.equal(typeof toClinicalSectionViews, 'function');
});

test('own UI components receive every Composition section and resolved card from the public frontend barrel', () => {
  /*
   * Components consume this DTO and own only markup/interaction. They must not
   * infer placement from resourceType or derive titles from `system|code`.
   */
  const sections = toClinicalSectionViews({
    resourceType: 'Bundle',
    type: 'document',
    entry: [{
      fullUrl: 'Composition/ips',
      resource: {
        resourceType: 'Composition',
        section: [{
          title: 'Alergias e intolerancias',
          code: { coding: [{ system: 'http://loinc.org', code: '48765-2' }] },
          entry: [{ reference: 'AllergyIntolerance/penicillin' }],
        }],
      },
    }, {
      fullUrl: 'AllergyIntolerance/penicillin',
      resource: {
        resourceType: 'AllergyIntolerance',
        language: 'es',
        code: {
          text: 'Penicilina',
          coding: [{
            system: 'http://snomed.info/sct',
            code: '373270004',
            display: 'Penicillin',
          }],
        },
      },
    }],
  }, { locale: 'es-ES' });

  assert.equal(sections.length, 1);
  assert.equal(sections[0].code, 'http://loinc.org|48765-2');
  assert.equal(sections[0].resources.length, 1);
  assert.equal(sections[0].resources[0].title, 'Penicilina');
  assert.notEqual(sections[0].resources[0].title, 'http://snomed.info/sct|373270004');
});
