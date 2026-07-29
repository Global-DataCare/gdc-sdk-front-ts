/**
 * Teaching goal:
 * - import one complete native FHIR IPS
 * - update every visible section/card from browser memory immediately
 * - send the exact same import/update command to an authenticated BFF
 * - replace optimistic memory only with authoritative summary readback
 * - add allergy and medication entries through typed editors
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  BundleEditableResourceTypes,
  BundleEditor,
  BundleOperations,
  BundleTypes,
  ClinicalDocumentBffFlow,
  ClinicalDocumentBffPendingError,
  ClinicalDocumentWorkingCopy,
  HealthcareDocumentTypes,
  HealthcareIpsSectionResourceProfiles,
} from '../dist/index.js';

const fixtureUrl = new URL(import.meta.resolve(
  'gdc-common-utils-ts/fixtures/fhir-ips-bundle-all-sections.json',
));

function sectionToken(profile) {
  return `${profile.section.system}|${profile.section.code}`;
}

function newSectionDocumentEditor(subjectDid, title) {
  return new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.document)
    .setCompositionSubject(subjectDid)
    .setCompositionType(HealthcareDocumentTypes.IPS.attributeValue)
    .setCompositionTitle(title)
    .setCompositionDate('2026-07-30T10:00:00Z')
    .setCompositionAuthorList([subjectDid]);
}

function findSection(sections, code) {
  return sections.find((section) => section.code === code);
}

test('101: import, optimistic render, BFF readback, then allergy and medication section updates', async () => {
  const importedIps = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const subjectDid = 'did:web:subject.example';
  const allergySection = sectionToken(
    HealthcareIpsSectionResourceProfiles.AllergiesAndIntolerances,
  );
  const medicationSection = sectionToken(
    HealthcareIpsSectionResourceProfiles.HistoryOfMedicationUse,
  );
  const workingCopy = new ClinicalDocumentWorkingCopy();
  const submittedDocuments = [];

  // The fake represents only the browser-facing BFF contract. The real BFF,
  // not this UI, creates Communication, ingests, and requests `$summary`.
  const clinicalBff = {
    async submit(document, authoritativeReadback) {
      submittedDocuments.push(document);
      return { status: 200, bundle: authoritativeReadback };
    },
  };

  // 1. File parsing/validation is followed by an immediate in-memory render.
  const optimisticImport = workingCopy.importDocumentOptimistically(importedIps);
  assert.equal(workingCopy.hasPendingChange(), true);
  const importedSections = workingCopy.getSectionViews({ locale: 'es-ES' });
  assert.equal(importedSections.length, 16);

  // The official fixture is deliberately checked section by section, not only
  // by total count. Every referenced IPS resource becomes a card, including
  // repeated resource types used in different sections.
  assert.deepEqual(
    importedSections.map((section) => [
      section.title,
      section.resources.map((card) => card.resourceType),
    ]),
    [
      ['Problem List', ['Condition', 'Condition']],
      ['Allergies and Intolerances', ['AllergyIntolerance']],
      ['Medication Summary', ['MedicationStatement', 'MedicationStatement', 'MedicationStatement']],
      ['Immunizations', Array(8).fill('Immunization')],
      ['Results', Array(6).fill('Observation')],
      ['History of Procedures', ['Procedure']],
      ['Device Use', ['DeviceUseStatement']],
      ['Vital Signs', Array(3).fill('Observation')],
      ['Social History', Array(2).fill('Observation')],
      ['Alerts', ['Flag']],
      ['Patient Story', ['Consent']],
      ['Advance Directives', ['Consent']],
      ['Functional Status', ['Condition']],
      ['History of Past Problems', ['Condition']],
      ['History of Pregnancy', ['Observation']],
      ['Plan of Care', ['CarePlan']],
    ],
  );
  assert.ok(importedSections
    .flatMap((section) => section.resources)
    .every((card) => card.title && !/^https?:\/\/[^|]+\|.+/.test(card.title)));

  // 2. The exact imported Bundle is posted; the merged UI snapshot is not.
  const importResponse = await clinicalBff.submit(importedIps, optimisticImport);
  assert.deepEqual(submittedDocuments[0], importedIps);
  workingCopy.replaceFromClinicalSummary(importResponse.bundle);
  assert.equal(workingCopy.hasPendingChange(), false);

  // 3. Their allergy form produces a small Composition-first command document.
  const allergyCommand = newSectionDocumentEditor(subjectDid, 'Allergy update')
    .newEntryAs(BundleEditableResourceTypes.allergyIntolerance, 'allergy-penicillin')
    .setIdentifier('allergy-penicillin')
    .setSubject(subjectDid)
    .setSectionList([allergySection])
    .setLanguage('es')
    .setCode('http://snomed.info/sct|373270004')
    .setCodeTextLocal('Penicilina')
    .setCodeDisplay('Penicillin')
    .setClinicalStatus('active')
    .setVerificationStatus('confirmed')
    .doneEntry()
    .buildDocument();
  const allergiesBefore = findSection(workingCopy.getSectionViews(), allergySection)?.resources.length || 0;
  const optimisticAllergy = workingCopy.applyDocumentUpdateOptimistically(allergyCommand);
  const allergyView = findSection(workingCopy.getSectionViews({ locale: 'es' }), allergySection);
  assert.equal(allergyView.resources.length, allergiesBefore + 1);
  assert.ok(allergyView.resources.some((card) => card.title === 'Penicilina'));
  assert.ok(allergyView.resources.every((card) => card.title !== 'http://snomed.info/sct|373270004'));
  const allergyResponse = await clinicalBff.submit(allergyCommand, optimisticAllergy);
  assert.deepEqual(submittedDocuments[1], allergyCommand);
  workingCopy.replaceFromClinicalSummary(allergyResponse.bundle);

  // 4. Medication uses its own editor but the same memory/BFF/readback flow.
  const medicationCommand = newSectionDocumentEditor(subjectDid, 'Medication update')
    .newEntryAs(BundleEditableResourceTypes.medicationStatement, 'medication-ibuprofen')
    .setIdentifier('medication-ibuprofen')
    .setSubject(subjectDid)
    .setSectionList([medicationSection])
    .setLanguage('es')
    .setStatus('active')
    .setCode('http://snomed.info/sct|387207008')
    .setCodeTextLocal('Ibuprofeno 400 mg')
    .setCodeDisplay('Ibuprofen 400 mg')
    .setEffective('2026-07-30')
    .doneEntry()
    .buildDocument();
  const optimisticMedication = workingCopy.applyDocumentUpdateOptimistically(medicationCommand);
  const medicationView = findSection(workingCopy.getSectionViews({ locale: 'es' }), medicationSection);
  assert.ok(medicationView.resources.some((card) => card.title === 'Ibuprofeno 400 mg'));
  const medicationResponse = await clinicalBff.submit(medicationCommand, optimisticMedication);
  assert.deepEqual(submittedDocuments[2], medicationCommand);
  workingCopy.replaceFromClinicalSummary(medicationResponse.bundle);

  // 5. A definite BFF/GW failure restores the prior authoritative document.
  const rejectedCommand = newSectionDocumentEditor(subjectDid, 'Rejected allergy update')
    .newEntryAs(BundleEditableResourceTypes.allergyIntolerance, 'allergy-rejected')
    .setIdentifier('allergy-rejected')
    .setSubject(subjectDid)
    .setSectionList([allergySection])
    .setLanguage('es')
    .setCodeTextLocal('No debe persistir')
    .doneEntry()
    .buildDocument();
  workingCopy.applyDocumentUpdateOptimistically(rejectedCommand);
  assert.ok(findSection(workingCopy.getSectionViews(), allergySection)
    .resources.some((card) => card.title === 'No debe persistir'));
  workingCopy.rejectPendingChange();
  assert.ok(findSection(workingCopy.getSectionViews(), allergySection)
    .resources.every((card) => card.title !== 'No debe persistir'));
});

test('101: frontend waits for the application BFF job and reconciles authoritative readback', async () => {
  const importedIps = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const workingCopy = new ClinicalDocumentWorkingCopy();
  const snapshots = [];
  const submitted = [];
  const jobStates = [
    { state: 'pending', jobId: 'clinical-job-1', retryAfterMs: 0 },
    { state: 'completed', jobId: 'clinical-job-1', bundle: importedIps },
  ];
  const flow = new ClinicalDocumentBffFlow({
    workingCopy,
    pollIntervalMs: 0,
    transport: {
      async submit(command) {
        submitted.push(command);
        return { state: 'accepted', jobId: 'clinical-job-1', retryAfterMs: 0 };
      },
      async readJob() {
        return jobStates.shift();
      },
    },
    onSnapshot(snapshot) {
      snapshots.push(snapshot);
    },
  });

  const result = await flow.execute({ kind: 'import', bundle: importedIps });

  assert.deepEqual(submitted, [{ kind: 'import', bundle: importedIps }]);
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].entry.length, importedIps.entry.length);
  assert.equal(result.bundle.entry.length, importedIps.entry.length);
  assert.equal(result.jobId, 'clinical-job-1');
  assert.equal(workingCopy.hasPendingChange(), false);
});

test('101: BFF rejection rolls back, while an unconfirmed job remains pending', async () => {
  const importedIps = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const rejectedCopy = new ClinicalDocumentWorkingCopy();
  const rejectedSnapshots = [];
  const rejectedFlow = new ClinicalDocumentBffFlow({
    workingCopy: rejectedCopy,
    transport: {
      async submit() {
        return { state: 'rejected', message: 'Policy rejected the document.' };
      },
      async readJob() {
        throw new Error('must not poll');
      },
    },
    onSnapshot(snapshot) {
      rejectedSnapshots.push(snapshot);
    },
  });

  await assert.rejects(
    rejectedFlow.execute({ kind: 'import', bundle: importedIps }),
    /Policy rejected/,
  );
  assert.equal(rejectedSnapshots.length, 2);
  assert.equal(rejectedSnapshots[1], undefined);
  assert.equal(rejectedCopy.hasPendingChange(), false);

  const pendingCopy = new ClinicalDocumentWorkingCopy();
  const pendingFlow = new ClinicalDocumentBffFlow({
    workingCopy: pendingCopy,
    pollIntervalMs: 0,
    pollTimeoutMs: 0,
    transport: {
      async submit() {
        return { state: 'accepted', jobId: 'clinical-job-pending', retryAfterMs: 0 };
      },
      async readJob() {
        return { state: 'pending', jobId: 'clinical-job-pending', retryAfterMs: 0 };
      },
    },
    onSnapshot() {},
  });

  await assert.rejects(
    pendingFlow.execute({ kind: 'import', bundle: importedIps }),
    (error) => error instanceof ClinicalDocumentBffPendingError
      && error.jobId === 'clinical-job-pending',
  );
  assert.equal(pendingCopy.hasPendingChange(), true);
});
