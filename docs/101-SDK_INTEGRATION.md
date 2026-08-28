# SDK Integration 101 for Frontend / Native Apps

> 101 note
> - Teach here: the highest-level `sdk-front` session/profile/runtime surface after shared authoring in `gdc-common-utils-ts`.
> - Reuse lower-layer contracts and shared authoring helpers from `sdk-core` and `common-utils` instead of re-teaching raw claims or low-level editors.
> - Read [101-README.md](./101-README.md) for the ordered path and keep login/session bootstrap explicit.

This file is the short frontend integration map. It starts after the shared
authoring step and at the runtime boundary where `ProfileRuntime` loads one
workspace/session and exposes one actor facade.

If you want the business-flow overview first, start here:

- [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)

If you want the shared lifecycle semantics and reusable placeholders, use:

- [gdc-common-utils-ts/docs/101-LIFECYCLE.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-LIFECYCLE.md)

If you are implementing employee create/search/disable/purge flows, use:

- [gdc-common-utils-ts/docs/101-EMPLOYEE_ENTRY_EDITOR.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-EMPLOYEE_ENTRY_EDITOR.md)
- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)

If you are implementing the individual-controller onboarding PDF draft flow, use:

- [gdc-common-utils-ts/docs/101-INDIVIDUAL_ONBOARDING_PDF_REQUEST.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-INDIVIDUAL_ONBOARDING_PDF_REQUEST.md)

When teaching employee flows in this frontend guide, keep this order:

1. create
2. search
3. lifecycle

If you are confused about DIDComm envelope vs batch body vs entry type vs
FHIR-like `Communication` vs internal `CommMsgExtended`, read first:

- [gdc-common-utils-ts/docs/101-COMMUNICATION_LAYERING.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-COMMUNICATION_LAYERING.md)

If you also need a real local GW process or Docker image for end-to-end checks,
use:

- [gdc-sdk-node-ts/docs/101-LIVE_GW_LOCAL.md](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-LIVE_GW_LOCAL.md)

This document should answer only these questions:

- which package/class should the frontend instantiate
- which frontend runtime entrypoint should the frontend call next
- which concepts belong to UI/session state
- which concepts belong to shared activation/discovery contracts

Current canonical user-story start for frontend/native teams:

1. authenticate the user
2. load/unlock one protected profile
3. materialize one loaded frontend profile workspace/session
4. assume or bootstrap the actor state already owned by that user
5. only then create/read/edit/search business data

Canonical runtime shape:

1. inject runtime adapters such as `fetch`, crypto, secure storage, wallet, or outbox
2. build one `ProfileRuntime`
3. call `loadProfile(...)`
4. use the returned workspace/session
5. materialize one actor facade such as `asIndividualController()`

Naming rule:

- do not rename the unlocked user profile runtime by platform
- keep `frontend`, `node`, `expo`, or `web` only in adapters/factories
- keep service-tenant wallets separate from the end-user `ProfileRuntime`

First actor-scoped entrypoints after session bootstrap:

- `session.asHostOnboarding()`
- `session.asOrganizationController()`
- `session.asOrganizationEmployee()`
- `session.asIndividualController()`
- `session.asIndividualMember()`
- `session.asPersonal()`
- `session.asProfessional()`

Research-access teaching rule:

- for developer-facing 101 material, call the twin-search consumer surface
  `DigitalTwinSdk`
- current frontend session/runtime entrypoint is still
  `session.asProfessional()` and `ProfessionalSdk`
- do not teach `DigitalTwinControllerSdk`

Teaching rule:

- teach the actor-scoped session methods before generic runtime helpers
- teach shared/core editors before any GW route or envelope detail

## Author First, Deliver Later

For medications, permissions, contacts and other individual-index data, the
frontend contract is always:

1. use typed `BundleEditor` entries from `gdc-common-utils-ts`;
2. let the screen decide whether to finish after one entry or after several;
3. apply the completed Bundle to `SubjectBundleWorkingCopy`;
4. render that disposable in-memory projection immediately;
5. submit the command Bundle to the authenticated portal BFF.

The browser stops there. The backend/BFF attaches the Bundle to a claims-first
Communication, freezes the outbox job and calls
`ingestCommunicationAndUpdateIndex(...)`.

One clinical section uses `Bundle.type = batch`, not `transaction`. Its entries
choose their operation independently, so a successful create is retained even
when a different delete is rejected:

```ts
const commandBundle = new BundleEditor().setBundleType(BundleTypes.batch);

commandBundle
  .newEntryAs(BundleEditableResourceTypes.observation, 'observation-new')
  .create()
  .setSubject(subjectDid);

commandBundle
  .newEntryAs(BundleEditableResourceTypes.allergyIntolerance, allergyId)
  .delete()
  .ifMatch(versionId);

await clinicalSectionBffTransport.submit(commandBundle.buildJsonApi());
```

The BFF forwards this command through `updateClinicalSection`. GW evaluates
creator authorization and `ifMatch` for each entry and returns independent
statuses such as `201`, `204`, `403`, `404` or `412`. The resource contains
only its creator DID; verified email/phone linkage is checked outside it.

Do not call `upsert*` route helpers from authoring components. Those methods
are compatibility plumbing. A contact list, permission set, clinical section
or complete history differs by Bundle contents and commit timing, not by a new
transport contract.

## Complete IPS Screen Flow: Import, Render, Submit, Edit

This is the complete browser flow for a screen that owns its own React/Vue/Expo
components. `ClinicalDocumentWorkingCopy` is for native FHIR IPS documents
with `entry[]`; do not confuse it with `SubjectBundleWorkingCopy`, which owns
JSON-API-like command Bundles with `data[]`.

### 1. Keep one working copy beside component state

```tsx
import {
  ClinicalDocumentBffFlow,
  ClinicalDocumentWorkingCopy,
  toClinicalSectionViews,
} from 'gdc-sdk-front-ts';

const clinicalCopy = useRef(new ClinicalDocumentWorkingCopy()).current;
const [bundleInMemory, setBundleInMemory] = useState();
const clinicalFlow = useMemo(() => new ClinicalDocumentBffFlow({
  workingCopy: clinicalCopy,
  // Inject a Next.js, Vite, native or other application BFF adapter.
  // Its backend owns the durable outbox and GW submit/poll.
  transport: clinicalDocumentBffTransport,
  onSnapshot: setBundleInMemory,
  pollTimeoutMs: 30_000,
}), [clinicalCopy, clinicalDocumentBffTransport]);

const sections = bundleInMemory
  ? toClinicalSectionViews(bundleInMemory, {
      locale: currentUserLocale,
      translateCode: terminology.translate,
    })
  : [];
```

`bundleInMemory` is the only Bundle rendered by the screen. `sections` is
derived every render; do not keep a second hand-built section/card cache.

### 2. Apply, submit and wait through the BFF flow

```ts
async function applyAndSubmitClinicalDocument(commandBundle, kind) {
  return clinicalFlow.execute({
    kind,
    bundle: commandBundle,
  });
}
```

`clinicalDocumentBffTransport` implements only two application-facing methods:

```ts
const clinicalDocumentBffTransport = {
  submit(command) {
    return bffClient.submitClinicalDocument(command);
  },
  readJob(jobId) {
    return bffClient.readClinicalDocumentJob(jobId);
  },
};
```

Both methods return the typed `ClinicalDocumentBffResult` union:
`accepted`, `pending`, `completed` with authoritative `bundle`, or `rejected`.
The adapter may use `fetch`, a query library or a native HTTP client. HTTP
status parsing, authentication headers and BFF route layout stay in that
adapter, outside clinical components.

The flow performs this order:

1. validate/merge the Bundle in memory;
2. notify `onSnapshot(...)` so the component paints immediately;
3. send the exact command Bundle to the BFF in the same handler;
4. wait for an accepted BFF job through `readJob(jobId)`;
5. retain it as unconfirmed for network failures or local wait timeout;
6. roll it back only for a definite BFF rejection;
7. replace it with the complete authoritative `$summary` Bundle on success.

The durable outbox/job manager remains in the BFF. The frontend only consumes
its typed submit/job API. It never builds a Communication and never calls
`ingestCommunicationAndUpdateIndex(...)`.

### 3. Import a JSON IPS file

```ts
async function importIpsFile(file) {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new TypeError('Select one JSON FHIR document');
  }
  const importedBundle = JSON.parse(await file.text());
  await applyAndSubmitClinicalDocument(importedBundle, 'import');
}
```

`importDocumentOptimistically(...)` runs the shared document validation. A
malformed/non-document Bundle fails before UI state or network submission is
changed. The official all-sections IPS fixture is published at
`gdc-common-utils-ts/fixtures/fhir-ips-bundle-all-sections.json`.

### 4. Add an allergy through the same flow

```ts
const allergySection = [
  HealthcareIpsSectionResourceProfiles.AllergiesAndIntolerances.section.system,
  HealthcareIpsSectionResourceProfiles.AllergiesAndIntolerances.section.code,
].join('|');
const allergyId = crypto.randomUUID();

const allergyCommand = new BundleEditor()
  .setBundleOperation(BundleOperations.create)
  .setBundleType(BundleTypes.document)
  .setCompositionSubject(subjectDid)
  .setCompositionType(HealthcareDocumentTypes.IPS.attributeValue)
  .setCompositionTitle('Allergy update')
  .setCompositionDate(new Date().toISOString())
  .setCompositionAuthorList([actorDid])
  .newEntryAs(
    BundleEditableResourceTypes.allergyIntolerance,
    allergyId,
  )
  .setIdentifier(allergyId)
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

await applyAndSubmitClinicalDocument(allergyCommand, 'section-update');
```

### 5. Add a medication through the same flow

```ts
const medicationSection = [
  HealthcareIpsSectionResourceProfiles.HistoryOfMedicationUse.section.system,
  HealthcareIpsSectionResourceProfiles.HistoryOfMedicationUse.section.code,
].join('|');
const medicationId = crypto.randomUUID();

const medicationCommand = new BundleEditor()
  .setBundleOperation(BundleOperations.create)
  .setBundleType(BundleTypes.document)
  .setCompositionSubject(subjectDid)
  .setCompositionType(HealthcareDocumentTypes.IPS.attributeValue)
  .setCompositionTitle('Medication update')
  .setCompositionDate(new Date().toISOString())
  .setCompositionAuthorList([actorDid])
  .newEntryAs(
    BundleEditableResourceTypes.medicationStatement,
    medicationId,
  )
  .setIdentifier(medicationId)
  .setSubject(subjectDid)
  .setSectionList([medicationSection])
  .setLanguage('es')
  .setStatus('active')
  .setCode('http://snomed.info/sct|387207008')
  .setCodeTextLocal('Ibuprofeno 400 mg')
  .setCodeDisplay('Ibuprofen 400 mg')
  .setEffective(new Date().toISOString())
  .doneEntry()
  .buildDocument();

await applyAndSubmitClinicalDocument(medicationCommand, 'section-update');
```

`setSectionList(...)` controls `Composition.section.entry` placement. It is not
the same as `setCategory(...)`: category remains clinical data and must never
be overloaded to decide where the UI places a card.

### 6. Render with their own components

```tsx
return sections.map((section, sectionIndex) => (
  <TheirSection
    key={section.code ?? `${section.title}:${sectionIndex}`}
    code={section.code}
    title={section.title}
    pending={clinicalCopy.hasPendingChange()}
  >
    {section.resources.map((card, resourceIndex) => (
      <TheirClinicalCard
        key={card.fullUrl ?? `${card.resourceType}:${resourceIndex}`}
        title={card.title}
        resourceType={card.resourceType}
        date={card.date}
      />
    ))}
  </TheirSection>
));
```

Their component owns markup, interaction, styling and form controls. The
shared SDK owns document validation, section placement, claims/native-FHIR
reading, language resolution, optimistic Bundle merging and rollback/readback
state.

## Keep Remote Submission Separate From The Subject Working Copy

The screen's current subject Bundle/ViewModels are a disposable local
projection, not the backend record. The frontend flow is:

1. build the command Bundle;
2. call `SubjectBundleWorkingCopy.applyOptimisticBundle(...)` to update the
   visible local copy;
3. submit the command Bundle to the authenticated BFF;
4. pass the per-entry GW operation response to `reconcileSubmission(...)`;
5. show every returned notice and remove rejected resources from the local
   copy;
6. run the read operation for the aggregate shown by that screen and pass its
   result to the matching `replaceFromClinicalCompositionSearch(...)`,
   `replaceFromConsentSearch(...)` or `replaceFromRelatedPersonSearch(...)`
   method.

There is no generic reconciliation endpoint:

- clinical history/sections: `requestClinicalSummary(...)`, which sends an
  auditable Communication to `Subject/$summary` with attached FHIR Parameters;
- permissions: subject-scoped `Consent/_search` returning the full permission
  list required by that screen;
- contacts/related entities: subject-scoped `RelatedPerson/_search` returning
  the full related-person list.

A response entry that is absent is ambiguous and stays pending until the
corresponding authoritative aggregate readback.
A definite transport rejection can use `rejectSubmission(...)` to remove the
whole optimistic command. The executable contract is
`tests/101-subject-bundle-working-copy.test.mjs`.

## Read The Clinical Summary, Do Not Ingest It

The canonical frontend read is:

```ts
const summary = await profile.sdk.requestClinicalSummary(ctx, {
  subjectId,
  requesterId: actorDid,
  filterSections: [HealthcareBasicSections.AllergiesAndIntolerances.attributeValue],
});

const sectionCount = summary.reader.getDocumentSectionResourceCount(
  HealthcareBasicSections.AllergiesAndIntolerances.attributeValue,
);
const recentAllergies = summary.document.getResourcesByFilter({
  sections: [HealthcareBasicSections.AllergiesAndIntolerances.attributeValue],
  types: [ResourceTypesFhirR4.AllergyIntolerance],
  date: { start: '2026-01-01', end: '2026-12-31' },
});
```

- `summary.reader` is the shared `BundleReader` for generic document structure,
  sections, counts, references and entries.
- `summary.document` is the SDK Core `FhirDocumentFacade` for clinical
  resources and combined section/type/date filters.
- `LifecycleResultReader` analyzes operation outcomes and issues; it does not
  navigate the returned clinical document.

### Render every section with your own components

Applications do not need to use a React component. They must,
however, consume the shared projection instead of rebuilding FHIR/claims
mapping inside their components:

```tsx
import { toClinicalSectionViews } from 'gdc-sdk-front-ts';

function TheirClinicalSummary({ bundle, locale, translateCode }) {
  const sections = toClinicalSectionViews(bundle, {
    locale,
    translateCode,
  });

  return sections.map((section, sectionIndex) => (
    <TheirSection
      key={section.code ?? `${section.title}:${sectionIndex}`}
      code={section.code}
      title={section.title}
      unresolvedReferences={section.unresolvedReferences}
    >
      {section.resources.map((card, resourceIndex) => (
        <TheirClinicalCard
          key={card.fullUrl ?? `${card.resourceType}:${resourceIndex}`}
          title={card.title}
          resourceType={card.resourceType}
          date={card.date}
        />
      ))}
    </TheirSection>
  ));
}
```

The ownership boundary is exact:

- their component owns layout, interaction, styling, filters and editors;
- `toClinicalSectionViews(...)` owns all-section traversal, placement through
  `Composition.section.entry`, native-FHIR/`meta.claims` reading and card DTOs;
- `section.resources` is already the card list for that section;
- do not group by `resourceType`, inspect raw claim keys or manufacture a title
  in JSX;
- pass `locale` and `translateCode` once at the projection boundary so every
  card follows the same language rule.

When a form authors a coded name, store the manual label with
`setCodeTextLocal(...)`, its resource language with `setLanguage(...)`, and the
English/international label with `setCodeDisplay(...)`. `setCode(...)` carries
only the `system|code` terminology identity. Pass the UI locale and an optional
terminology resolver to `toClinicalResourceCardView(...)`; never use that token
as a visible title or write it back into the manual-name field.

For example, their own allergy form should write through the typed entry
editor, not mutate `meta.claims` directly:

```ts
const commandBundle = new BundleEditor()
  .setBundleOperation(BundleOperations.create)
  .setBundleType(BundleTypes.batch)
  .setAllowedResourceType(BundleEditableResourceTypes.allergyIntolerance)
  .newEntry('AllergyIntolerance/penicillin')
  .asAllergy()
  .setIdentifier('AllergyIntolerance/penicillin')
  .setSubject(subjectDid)
  .setLanguage('es')
  .setCode('http://snomed.info/sct|373270004')
  .setCodeTextLocal('Penicilina')
  .setCodeDisplay('Penicillin')
  .doneEntry()
  .buildJsonApi();
```

The component applies `commandBundle` to `SubjectBundleWorkingCopy`, renders
the resulting snapshot immediately and posts the command Bundle to its BFF.
It does not call ingestion.

- `ingestCommunicationAndUpdateIndex(...)` is backend/BFF-only. Browser
  components never call it.
- frontend extensions reuse the same readers and add only product formats
  such as R5.

Executable references:

- [gdc-common-utils-ts/__tests__/101-bundle-communication-authoring.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-bundle-communication-authoring.test.ts)
- [gdc-sdk-core-ts/tests/101-bundle-communication-delivery.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-bundle-communication-delivery.test.mjs)
- [gdc-sdk-front-ts/tests/101-subject-bundle-working-copy.test.mjs](https://github.com/Global-DataCare/gdc-sdk-front-ts/blob/main/tests/101-subject-bundle-working-copy.test.mjs)

## Inter-Tenant Research Access For Frontend Teams

Use this product-facing split:

- `OrganizationControllerSdk`
  - organization admin/controller flow
  - contract/governance preparation
  - researcher/member authorization administration
- `DigitalTwinSdk`
  - researcher search flow
  - SMART token request
  - digital twin listing
  - IPS open/download flow

Current implementation honesty:

- in frontend code today, the callable actor/session surface is still
  `session.asProfessional()`
- the 101 should nevertheless explain the business capability as
  `DigitalTwinSdk`
- this keeps the documentation understandable for product/frontend developers
  while the public façade naming converges

Canonical UI sequence for a junior developer:

1. organization controller screen
   - choose provider tenant `acme`
   - choose consumer tenant `lab`
   - review/sign/send contract data
2. researcher access screen
   - obtain or receive the contract VC / VP proof
   - request SMART access token
3. digital twin search screen
   - type free text such as `ibuprofen` or `paracetamol`
   - choose clinical section
   - list matching digital twins
4. results screen
   - open one IPS
   - or select several results and download multiple IPS bundles

Canonical teaching example:

- `Doraemon`
  - one imported IPS
- `Novita`
  - one `ibuprofen` medication demo bundle
  - one `paracetamol` medication demo bundle

Expected UX behavior:

- searching `ibuprofen` shows one digital twin
- searching `paracetamol` shows one digital twin
- both results point to `Novita`

Frontend responsibility boundary:

- collect form input
- manage local session/profile state
- build or forward the VP/contract input expected by the backend
- render search results and IPS actions

Do not put these concerns in the frontend:

- GW queue polling internals
- ledger/smart-contract persistence
- direct GW storage assumptions

Canonical portal/BFF functional mapping over GW CORE lives in:

- [gwtemplate-node-ts/docs/PORTAL_API_TO_GW_CORE.md](https://github.com/Global-DataCare/gwtemplate-node-ts/blob/main/docs/PORTAL_API_TO_GW_CORE.md)

Use that GW CORE document when the frontend team needs the product-facing
distinction between:

- `related persons` as contacts/relationships
- invited `members` in the individual health-index context
- effective `access consents`

## Individual Controller Onboarding PDF

For the current onboarding-PDF draft flow:

- actor: `individualController`
- payload: `Bundle` with one `DocumentReference`
- canonical PDF base64 field:
  - `resource.meta.claims[DocumentReferenceClaim.ContentData]`

Use this order:

1. build `kyc`, `formFields`, and `template`
2. call `createIndividualOnboardingFacade().buildDraft(...)` or
   `buildPdfDraftRequestBundle(...)`
3. send that business payload through the individual-controller frontend path

Reference:

- [gdc-common-utils-ts/docs/101-INDIVIDUAL_ONBOARDING_PDF_REQUEST.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-INDIVIDUAL_ONBOARDING_PDF_REQUEST.md)

Teaching rule for this `101`:

- start from the highest-level frontend/session surface
- then point to the shared/core high-level editor/session object
- only after that explain lower-level bundle/claims builders
- do not start a new frontend developer from raw claims keys or raw FHIR
  bundle payloads

## Choose The Frontend Mode First

Before choosing a class or runtime entrypoint, decide which frontend mode you are building.

### Portal web / non confidential app

Use this mode when:

- the frontend is a Vite/web portal
- the portal backend owns controller/professional keys in AWS KMS
- the backend sends DIDComm to GW CORE

In this mode, do not start from frontend session/runtime APIs for employee or
consent payload authoring.

Start from shared editors/builders instead:

- typed `BundleEditor` entry editors for Employee, Consent, RelatedPerson and
  clinical resources
- `CommunicationEditor` for attaching the completed Bundle
- `createConsentAccessEditor(...)` for reading/editing returned permission
  ViewModels

Then send the resulting payload or bundle to the portal backend.

The runtime boundary still stays the same elsewhere in this repo:
`ProfileRuntime -> loadProfile(...) -> workspace/session -> actor facade`.

Use these references first:

- [gdc-common-utils-ts/docs/101-EMPLOYEE_ENTRY_EDITOR.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-EMPLOYEE_ENTRY_EDITOR.md)
- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)
- [gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-consent-bundle-editor.test.ts)

Practical rule:

- `BundleEditor` plus `EmployeeEntryEditor` for employee create/search/disable/purge
- `CommunicationEditor` for the completed Bundle attachment boundary
- `createConsentAccessEditor(...)` for returned permission ViewModels; its
  lower-level session/upsert methods are not the initial authoring path

Controller-only portal-web employee flow:

Use this example only when the current frontend screen belongs to the
organization-controller/admin side.

Do not reuse this employee example for:

- professional screens
- individual/family screens
- generic end-user screens

Those actor families should start from their own business flow:

- professionals
  - consent-aware access
  - SMART token
  - communication/index flows
- individuals / family
  - consent editing
  - related-person flows
  - IPS/FHIR import or read flows

### Create

Use `BundleEditor` plus one employee entry editor to prepare one employee create bundle. The browser
does not send it directly to GW CORE.
The portal backend wraps it into its own request/envelope, then applies KMS,
DIDComm, submit, and poll.

```ts
import { BundleEditor } from 'gdc-sdk-core-ts';
import {
  EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE,
  EXAMPLE_PROVIDER_ORGANIZATION_DID,
} from 'gdc-common-utils-ts/examples';
import { ClaimsPersonSchemaorg } from 'gdc-common-utils-ts/constants/schemaorg';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

// Build the employee payload locally in the frontend before calling the portal backend.
const bundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.create)
  .setAllowedResourceType(EmployeeResourceTypes.employee);

const employeeEntry = bundle
  .newEntry()
  .asEmployee()
  .setEmail(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.email)
  .setRole(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.role)
  .addClaim(ClaimsPersonSchemaorg.memberOf, EXAMPLE_PROVIDER_ORGANIZATION_DID);

// `employeeCreateBatchBundle` is the canonical one-entry employee `_batch` bundle.
// Your Vite frontend normally sends this bundle to its own backend, not
// directly to GW CORE.
const generatedEmployeeIdentifier = employeeEntry.getIdentifier();
employeeEntry.doneEntry();

const employeeCreateBatchBundle = bundle.build();
console.log(employeeCreateBatchBundle);
```

If the frontend does not provide an employee identifier up front, the create
flow can generate one and keep it in the same editor:

```ts
import { EmployeeBundleOperations } from 'gdc-common-utils-ts/utils/employee';

const bundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.create)
  .setAllowedResourceType(EmployeeResourceTypes.employee);

const employeeEntry = bundle
  .newEntry()
  .asEmployee()
  .setEmail(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.email)
  .setRole(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.role);

const generatedEmployeeIdentifier = employeeEntry.getIdentifier();
employeeEntry.doneEntry();

const employeeCreateBatchBundle = bundle.build();
```

If a frontend needs explicit claim-level control instead of only `setEmail()` /
`setRole()`, the same editor also exposes generic claim methods:

```ts
import { BundleEditor } from 'gdc-sdk-core-ts';
import {
  EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE,
  EXAMPLE_PROVIDER_ORGANIZATION_DID,
} from 'gdc-common-utils-ts/examples';
import { ClaimsPersonSchemaorg } from 'gdc-common-utils-ts/constants/schemaorg';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

const bundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.create)
  .setAllowedResourceType(EmployeeResourceTypes.employee);

const employeeEntry = bundle
  .newEntry(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.identifier)
  .asEmployee()
  .setClaim(ClaimsPersonSchemaorg.email, EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.email)
  .setClaim(ClaimsPersonSchemaorg.hasOccupationalRoleValue, EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.role)
  .addClaim(ClaimsPersonSchemaorg.memberOf, EXAMPLE_PROVIDER_ORGANIZATION_DID);

console.log(employeeEntry.getClaim(ClaimsPersonSchemaorg.email));

employeeEntry.doneEntry();

const employeeCreateBatchBundle = bundle.build();
```

### Search

Search is a separate operation and should be built separately.

`email + role` is the recommended exact operational lookup.

```ts
import { BundleEditor } from 'gdc-sdk-core-ts';
import { EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE } from 'gdc-common-utils-ts/examples';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

const bundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.search)
  .setAllowedResourceType(EmployeeResourceTypes.employee);

bundle
  .newEntry()
  .asEmployee()
  .setEmail(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.email)
  .setRole(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.role)
  .doneEntry();

const employeeSearchBundle = bundle.build();

console.log(employeeSearchBundle);
```

Other valid search shapes:

- by `email` only: all active profiles for that mailbox
- by `role` only: all active employees for that role
- with no filters: all employees
- by `identifier`: one exact technical or historical profile

### Disable

Disable is a lifecycle operation. Today the shared employee editor still
produces the canonical `_batch` bundle with inner `request.method = DELETE`.

```ts
import { BundleEditor } from 'gdc-sdk-core-ts';
import { EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE } from 'gdc-common-utils-ts/examples';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

const bundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.disable)
  .setAllowedResourceType(EmployeeResourceTypes.employee);

bundle
  .newEntry(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.identifier)
  .asEmployee()
  .doneEntry();

const employeeDisableBatchBundle = bundle.build();

console.log(employeeDisableBatchBundle);
```

Current GW CORE contract vs preferred target:

- current live contract
  - disable = `_batch` + inner `request.method = DELETE`
  - purge = `POST .../Employee/_purge`
- preferred target contract
  - disable/enable = semantic state change via `PATCH`
  - purge = final removal operation kept separate from state changes

Conceptual `PATCH` example for state change:

```ts
import { EmployeeBundleOperations } from 'gdc-common-utils-ts/utils/employee';

const employeeDisablePatchBatchBundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.disable)
  .setAllowedResourceType(EmployeeResourceTypes.employee)
  .newEntry(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.identifier)
  .asEmployee();
```

Business meaning:

- `PATCH` should mean state transition such as enable/disable
- `DELETE` should be reserved for final removal semantics such as purge
- future operations like merge/split/destroy should be modeled first as named
  business operations, then mapped to transport

### Purge

Purge is not the same route as create/disable, but the frontend should still
prepare a `Bundle` for it. The portal backend or runtime later submits that
bundle to the explicit `Employee/_purge` flow. The canonical purge selector is
the employee `identifier`.

```ts
import { BundleEditor } from 'gdc-sdk-core-ts';
import { EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE } from 'gdc-common-utils-ts/examples';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

const employeePurgeBundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.purge)
  .setAllowedResourceType(EmployeeResourceTypes.employee)
  .newEntry(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.identifier)
  .asEmployee()
  .doneEntry()
  .build();

console.log(employeePurgeBundle);
```

### Confidential app / direct client runtime

Use this mode when:

- the app stores transport keys locally
- the app talks directly to GW CORE
- there is no portal backend doing KMS/DIDComm on behalf of the app

In this mode, start from the frontend runtime/session layer:

- `ClientSDK`
- `initializeSession(...)`

What `initializeSession(...)` means here:

- it creates the authenticated frontend runtime session
- it materializes the actor-facing runtime surface for that app/profile
- use this path when the app itself owns local keys and direct GW interaction

Important actor rule:

- this still does not mean every confidential app should start from employee management
- employee management belongs only to the organization-controller/admin side
- professional or individual apps should start from their own actor flow, then
  use shared bundle editors only for the resources relevant to that actor

Then use the same shared editors/builders from `sdk-core` when the runtime flow
needs employee or communication payload authoring.

Use these references first:

- [gdc-sdk-node-ts/docs/101-LIVE_GW_LOCAL.md](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-LIVE_GW_LOCAL.md)
- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)

Decision rule:

- no local key custody: start from shared editors/builders and send to backend
- local key custody: start from `ClientSDK` runtime/session and use the same shared editors/builders underneath

Minimal confidential-app example:

```ts
import { ClientSDK } from 'gdc-sdk-front-ts';
import { BundleEditor } from 'gdc-sdk-core-ts';
import {
  EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE,
  EXAMPLE_PROFILE_SESSION_INPUT,
} from 'gdc-common-utils-ts/examples';
import {
  EmployeeBundleOperations,
  EmployeeResourceTypes,
} from 'gdc-common-utils-ts/utils/employee';

const appId = frontendAppConfig.appId;
const client = new ClientSDK({ appId });

// The authenticated runtime session for this frontend app/profile.
const session = await client.initializeSession(EXAMPLE_PROFILE_SESSION_INPUT);

// The shared bundle editor still models the employee search bundle.
const employeeSearchBundle = new BundleEditor()
  .setBundleOperation(EmployeeBundleOperations.search)
  .setAllowedResourceType(EmployeeResourceTypes.employee)
  .newEntry()
  .asEmployee()
  .setEmail(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.email)
  .setRole(EXAMPLE_EMPLOYEE_DOCTOR_ACTIVE.role)
  .doneEntry()
  .build();

console.log(session, employeeSearchBundle);
```

## Rules

- Start from app state and UI forms, not GW wire payloads.
- Use shared helpers/constants instead of hardcoded role or claim strings.
- Keep technical device identity separate from actor identity.
- Keep provider identity separate from actor identity.
- Do not collapse these three concepts into one:
  - persisted activation claim: `org.schema.Service.serviceType`
  - shared builder input: `serviceCapabilities` / `service.capabilities`
  - frontend UX/session flags: `facets`
- Use canonical names such as:
  - `subjectDid`
  - `professionalDid`
  - `orgControllerDid`
  - `individualControllerDid`
  - `emailProfessional`
  - `emailControllerOrg`
  - `emailControllerIndividual`

## Package Map

- `gdc-common-utils-ts`
  - shared constants
  - shared examples
  - DID/DIDComm/FHIR helpers
  - healthcare codings
- `gdc-sdk-core-ts`
  - runtime-neutral builders
  - communication draft helpers
  - consent-access helpers
  - activation/discovery contracts
- `gdc-sdk-front-ts`
  - frontend session bootstrap
  - provider metadata fetch
  - profile/session state
  - frontend-facing services

## Actor Map

- `gdc-common-utils-ts`
  - pure helpers, constants, and reusable examples
- `gdc-sdk-core-ts`
  - shared actor/capability model and runtime-neutral builders
- `gdc-sdk-front-ts`
  - session/profile materialization and capability-to-service mapping

Employee management belongs to:

- `orgAdmin`
  - create/search/disable/purge employee from the organization-controller side

For frontend onboarding, teach those `orgAdmin` employee operations in the same
fixed order:

- create
- search
- lifecycle

It does not belong to:

- `professional`
  - professional-facing clinical and access flows

## Onboarding Order

For new developers, teach these layers in this order:

1. choose the frontend mode: portal web vs confidential app
2. highest-level runtime or editor surface for that mode
3. actor-facing service surface when the app owns runtime/session behavior
4. shared high-level editor/session object from `sdk-core`
5. lower-level shared builders only if needed
6. raw bundle shapes only for debugging or advanced integration work

## Index Data Rule

For frontend teaching and session flows, keep this rule explicit:

- operations over individual index data travel through `Communication`
- this includes consent-related index data
- `Communication` is the auditable envelope
- attached `Bundle` payloads carry the real resources such as `Consent`,
  `Composition`, or `DocumentReference`
- a single batch may carry one or more `Communication` entries

## Main Frontend Runtime

Use:

- `ClientSDK` for confidential/direct client runtime flows

Important frontend-facing pieces:

- `ClientSDK`
- `ProfileManager`
- `ProfileRegistry`
- `IndividualService`
- `VerifierService`

## Typical Frontend Initialization Order

1. Choose provider URL or `did:web`.
2. Create `ClientSDK`.
3. Initialize technical communication identity.
4. Resolve provider metadata.
5. Initialize profile/session state.
6. Materialize actor-facing services from the current profile/session.

## What The Frontend Already Has

Usually the frontend starts from:

- app configuration
- provider URL or `did:web`
- actor email
- actor kind/role
- tenant/jurisdiction/sector
- local wallet or secure device storage

Important route naming rule:

- `tenant/jurisdiction/sector` belongs to tenant-scoped application flows
- host onboarding routes use the separate host pair:
  `host coverage jurisdiction + hostNetwork`
- if the host path contains `.../v1/test/...`, that `test` is the host
  network/runtime segment, not the tenant business sector

It should not start from:

- raw `_activate` JSON
- nested GW `body.data[0].resource.meta.claims`
  Prefer the shared readers exported by `gdc-common-utils-ts` for claim access
  and VC extraction.
- hardcoded consent claim keys

## Flow Map

### Provider bootstrap

Use:

- `ClientSDK.fetchWellKnownApiConfig(...)`
- `ClientSDK.fetchSupportedFields(...)`

This is still simpler than the final ICA/operator/provider discovery story.

### Technical communication identity

Use:

- `initializeCommunicationIdentity(...)` from `gdc-common-utils-ts`

This is device/app/channel technical identity, not the human controller
identity and not the organization identity.

Conceptual split:

- `appId`
  identifies the frontend app towards GW CORE
- `entityId`
  identifies the local technical communication profile/device/channel that owns
  the transport keys
- actor DIDs
  identify the human/domain actor

### Session bootstrap

Use:

- `new ClientSDK(...)`
- `initializeSession(...)`
- `initializeProfileRegistry(...)`

Frontend note:

- session/profile runtime is mainly the entry point for confidential/direct
  client apps
- portal web apps that send employee/consent payloads to their own backend do
  not need to start here for payload authoring

Frontend note:

- session/profile runtime is mainly the entry point for confidential/direct
  client apps
- portal web apps that send employee/consent payloads to their own backend do
  not need to start here for payload authoring

### Deployment modes

Simple / compatibility mode:

- frontend may start with provider bootstrap and session state only
- useful for demos, legacy JSON flows, or non-encrypted compatibility paths

Secure mode:

- frontend still starts with `appId`
- then initializes the technical communication identity
- then keeps actor identity separate from technical transport identity
- encrypted DIDComm and FAPI live in this layer, not in the human actor naming

### Legal organization activation

Frontend note:

- the shared/core activation contract already models mandatory capabilities
- persisted GW claim: `org.schema.Service.serviceType`
- shared builder vocabulary: `serviceCapabilities` or `service.capabilities`
- frontend session/profile layer may expose `facets`, but that is not the persisted contract

Reference:

- [gwtemplate-node-ts/docs/API_CORE_INTEGRATION.md](https://github.com/Global-DataCare/gwtemplate-node-ts/blob/main/docs/API_CORE_INTEGRATION.md)

### Employee / professional flows

Frontend usually prepares UX/state for:

- employee invitation/activation
- SMART token request
- consent-aware access

Transport note:

- when these flows mutate or exchange individual index data, the canonical
  exchange envelope is `Communication`

Shared business flow reference:

- [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)

Portal-web modeling references:

- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)

Portal-web communication/consent references:

- [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- [gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-consent-bundle-editor.test.ts)

Portal-web modeling references:

- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)

Portal-web communication/consent references:

- [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- [gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-consent-bundle-editor.test.ts)

### Individual / family flows

Frontend usually prepares UX/state for:

- individual bootstrap
- consent grant/review
- related-person invitation
- IPS/FHIR import and read flows

Transport note:

- these index-oriented flows should be taught through `Communication` as the
  canonical auditable exchange envelope, not through standalone resource routes
  as the first mental model

Use shared references instead of restating the full tutorial here.

## Shared Builders And Constants

Prefer these shared helpers:

- `initializeCommunicationIdentity(...)`
- `StaticAuthorityResolver.resolveAuthority(...)`
- `buildOrganizationDidWeb(...)`
- `buildProfessionalDidWeb(...)`
- `buildIndividualDidWeb(...)`
- healthcare constants/codings from `gdc-common-utils-ts`
- communication draft helpers from `gdc-sdk-core-ts`

## Discovery Status

What already exists:

- provider bootstrap by URL
- provider bootstrap by `did:web`
- provider metadata fetch from the frontend runtime

What is still converging:

- first-class ICA discovery
- first-class operator discovery
- shared authority catalogs that hide most `did:web` routing details from app code
- first-class DSP frontend discovery helpers for optional direct mode
- a single activation helper that hides most onboarding assembly

## Use This File For

- finding the right frontend runtime class
- knowing which layer owns which concern
- checking naming and contract rules
- jumping to the correct deeper document

## Do Not Use This File For

- a long end-to-end business tutorial
- repeating the node backend onboarding flow
- teaching raw GW route payloads
