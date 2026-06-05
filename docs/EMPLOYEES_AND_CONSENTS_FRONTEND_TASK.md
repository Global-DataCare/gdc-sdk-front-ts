# Employees And Consents Frontend Task

## Purpose

This task defines the next frontend-facing integration block for:

- organization-controller employee management
- individual-controller consent management

It is written so another thread can implement it with the right repo/package
boundaries and without mixing employee flows with consent flows.

## Dependency Order

Before implementing this task in `gdc-sdk-front-ts`:

1. `gdc-sdk-core-ts` should be bumped and released with the latest shared
   facade/contracts surface.
2. `gdc-sdk-front-ts` should then update to that released `gdc-sdk-core-ts`
   version.

Reason:

- frontend should consume stable `sdk-core` contracts/facades
- frontend should not invent its own business ownership or payload semantics

## Existing References

These are the current source-of-truth references that already exist and should
be reviewed before adding new frontend helpers.

### Frontend repo

- [`gdc-sdk-front-ts/README.md`](https://github.com/Global-DataCare/gdc-sdk-front-ts/blob/main/README.md)
  explains the package purpose and the current SDK layering at frontend level.
- [`gdc-sdk-front-ts/docs/101-SDK_INTEGRATION.md`](https://github.com/Global-DataCare/gdc-sdk-front-ts/blob/main/docs/101-SDK_INTEGRATION.md)
  describes how `sdk-front` is expected to consume `sdk-core` and backend-facing
  contracts.

### SDK core repo

- [`gdc-sdk-core-ts/docs/101-EMPLOYEES.md`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
  is the main employee 101 and should be the primary reference for
  organization-controller employee flows.
- [`gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
  is the main consent communication 101 and should be the primary reference for
  individual-controller consent flows.
- [`gdc-sdk-core-ts/docs/101-IPS_COMMUNICATION_OUTBOX.md`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-IPS_COMMUNICATION_OUTBOX.md)
  documents the existing communication outbox pattern that consent read/write
  should stay aligned with.
- [`gdc-sdk-core-ts/docs/101-SDK_FLOWS.md`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)
  summarizes higher-level SDK flow composition across the package.
- [`gdc-sdk-core-ts/src/employee-draft.ts`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/src/employee-draft.ts)
  reexports the employee bundle/editor surface that frontend is expected to use,
  including `BundleEditor`, `BundleEntryEditor`, and `EmployeeEntryEditor`.

SDK core tests that already prove those flows:

- [`gdc-sdk-core-ts/tests/101-employees.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)
  shows the high-level employee flow.
- [`gdc-sdk-core-ts/tests/101-consent-bundle-outbox.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-consent-bundle-outbox.test.mjs)
  shows the high-level consent bundle outbox flow.
- [`gdc-sdk-core-ts/tests/101-communication-ips-search-outbox.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-communication-ips-search-outbox.test.mjs)
  shows the communication IPS search outbox flow used as the closest existing
  read pattern.
- [`gdc-sdk-core-ts/tests/employee-draft.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/employee-draft.test.mjs)
  covers lower-level employee draft helpers.
- [`gdc-sdk-core-ts/tests/communication-draft.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/communication-draft.test.mjs)
  covers the communication draft surface.
- [`gdc-sdk-core-ts/tests/communication-consent-mutation-contract.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/communication-consent-mutation-contract.test.mjs)
  covers the consent mutation contract carried by communication.
- [`gdc-sdk-core-ts/tests/communication-document-facade.test.mjs`](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/communication-document-facade.test.mjs)
  covers communication-level document/request facade behavior.

### Shared common utils repo

`gdc-common-utils-ts` is still hosted in GitLab, not GitHub. These links are
still important because the low-level bundle/editor/communication semantics live
there.

- [`gdc-common-utils-ts/docs/101-BUNDLE_EDITOR_READER.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-BUNDLE_EDITOR_READER.md)
  is the base 101 for bundle creation and bundle reading.
- [`gdc-common-utils-ts/docs/101-EMPLOYEE_ENTRY_EDITOR.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-EMPLOYEE_ENTRY_EDITOR.md)
  explains the employee entry editor layer used inside employee bundles.
- [`gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-CONSENT_ACCESS.md)
  explains consent editing and reading through `ConsentAccessEditor`.
- [`gdc-common-utils-ts/docs/101-CONSENT_PERMISSION_TEMPLATES.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-CONSENT_PERMISSION_TEMPLATES.md)
  documents the consent permission template layer used to prefill consent data.
- [`gdc-common-utils-ts/docs/101-IPS_BUNDLE.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-IPS_BUNDLE.md)
  documents the communication search/request contract used as the reference for
  IPS-like communication reads.
- [`gdc-common-utils-ts/docs/101-COMMUNICATION_LAYERING.md`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/docs/101-COMMUNICATION_LAYERING.md)
  explains the separation between bundle construction and communication
  transport.
- [`gdc-common-utils-ts/src/utils/bundle-editor.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/src/utils/bundle-editor.ts)
  contains `BundleEditor`, the base bundle construction/reading helper.
- [`gdc-common-utils-ts/src/utils/communication-attached-bundle-session.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/src/utils/communication-attached-bundle-session.ts)
  contains `CommunicationAttachedBundleSession`, used to wrap an already-built
  bundle into `Communication`.
- [`gdc-common-utils-ts/src/utils/communication-bundle-document-request.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/src/utils/communication-bundle-document-request.ts)
  contains the communication request builder logic used for attached search or
  operation payloads.

Common utils tests that already prove the contract:

- [`gdc-common-utils-ts/__tests__/101-bundle-reader.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-bundle-reader.test.ts)
  proves bundle reading.
- [`gdc-common-utils-ts/__tests__/101-employee-examples.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-employee-examples.test.ts)
  proves employee example flows.
- [`gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-consent-bundle-editor.test.ts)
  proves the high-level consent bundle editor flow.
- [`gdc-common-utils-ts/__tests__/101-consent-template-bundle-editor.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-consent-template-bundle-editor.test.ts)
  proves the high-level consent bundle flow populated from permission templates.
- [`gdc-common-utils-ts/__tests__/101-consent-permission-bundle-readwrite.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-consent-permission-bundle-readwrite.test.ts)
  proves the complementary lower-level consent template read/write flow.
- [`gdc-common-utils-ts/__tests__/101-communication-search-reference.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/101-communication-search-reference.test.ts)
  proves the communication-based search reference flow.
- [`gdc-common-utils-ts/__tests__/utils-communication-bundle-session.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/utils-communication-bundle-session.test.ts)
  covers wrapping bundles into communication sessions.
- [`gdc-common-utils-ts/__tests__/utils-consent-access-editor-classification.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/utils-consent-access-editor-classification.test.ts)
  covers consent classification helpers.
- [`gdc-common-utils-ts/__tests__/utils-communication-bundle-document-request.test.ts`](https://gitlab.dev.accuro.es/idi/espacio-de-datos/global-datacare/gdc-common-utils-ts/-/blob/main/__tests__/utils-communication-bundle-document-request.test.ts)
  covers communication request payload construction, including the FHIR
  `$summary` operation carried in `Communication` with attached `Parameters`.

## Live Local E2E Validation Setup

The implementation thread should validate the contract against a local GW demo
stack, not only with pure unit tests.

Use two TTY sessions in `gwtemplate-node-ts`.

TTY 1 (replace the project path with your own local path if it differs):

```bash
cd $HOME/GITS/gdc-workspace/gwtemplate-node-ts
npm run api:local-demo
```

TTY 2, once the API is up (replace the project path with your own local path if it differs):

```bash
cd $HOME/GITS/gdc-workspace/gwtemplate-node-ts
env BASE_URL=http://127.0.0.1:3000 npm run demo:bootstrap-single-tenant
```

Notes:

- use `127.0.0.1` instead of `localhost` if bootstrap behaves inconsistently
- keep the demo API TTY open while running live/local tests from the SDK repos
- the tenant bootstrap is required before running end-to-end flows that depend
  on a real tenant context
- when running one continuous local validation session, bootstrap only once and
  then execute employee, consent, and optional IPS follow-up flows on the same
  tenant state

This local GW demo setup should be used when validating live-style E2E behavior
from:

- `gdc-common-utils-ts`
- `gdc-sdk-core-ts`
- `gdc-sdk-front-ts`

Current status:

- the real live/local backend proof exists today in `gwtemplate-node-ts`
- `gdc-common-utils-ts`, `gdc-sdk-core-ts`, and `gdc-sdk-front-ts` mainly prove
  payload construction, facade behavior, and in-memory readback
- therefore this task must not stop at local contract tests inside `sdk-front`
- it must also add one frontend-facing live/local smoke path that exercises the
  real GW demo flow through the frontend SDK surface
- that live/local coverage should be split into:
  - incremental stage tests
  - one later orchestrated full-flow test

The goal is to verify not only object construction but also the real transport
shape expected by GW:

- employee bundle create/search/read flows
- consent bundle wrapped in `Communication`
- consent readback through `Communication` with embedded `Subject/_search`
- medication ingestion through `Communication`
- IPS retrieval after those ingestions through `Communication` using FHIR
  operation-style search or summary payloads

Testing strategy:

- first add incremental live/local tests per stage so each state transition is
  independently reproducible and debuggable
- then add one orchestrated end-to-end test that runs those stages
  successively against the same tenant state
- do not replace the incremental tests with only one large smoke test

Recommended continuous validation order for one local demo session:

1. bootstrap the tenant once with `EMPLOYEE_COUNT=3`
2. run the employee lifecycle smoke on that tenant state
3. create or onboard the individual from the controller-side flow
4. run the consent create/read flow on that same tenant state
5. create two medication ingestions through two separate `Communication`
   submissions
6. request the IPS document so it includes those two medications
7. optionally continue with follow-up flows such as:
   - updating the index with an attached IPS bundle
   - updating the index with IPS material referenced by `contentReference`

Do not re-bootstrap between those steps unless the tenant state has been reset
or the test explicitly requires a clean environment.

Important:

- the consent flow must not assume that the individual already exists by magic
- this task should explicitly prove how the frontend creates or onboards the
  individual before sending consent payloads
- the preferred test subject should exist with the nickname `Doraemon`
- the onboarding evidence may be a signed PDF attachment or a signed PDF link,
  as long as the contract exercised by the frontend matches GW expectations
- in demo mode, the onboarding flow may use OTP-based evidence instead of a
  certificate-signed PDF, as long as the OTP is bound to the PDF hash and a
  timestamp and the test records that evidence path explicitly

## Current Live Reference Test

The existing real live/local reference is currently in `gwtemplate-node-ts`.

Employee lifecycle smoke references already present in `gwtemplate-node-ts`:

- `README.md`
  documents the `EMPLOYEE_COUNT=3` bootstrap mode for the local two-employee
  lifecycle smoke:
  - create employee 1
  - create employee 2
  - disable employee 2
  - purge both
- `scripts/bootstrap-single-tenant.sh`
  consumes `EMPLOYEE_COUNT` and injects it into the bootstrap payload
- `src/__tests__/unit/managers/EmployeeManager.test.ts`
  proves the purge rule and mixed-result behavior, including:
  - `should reject purge unless the employee is already inactive`
  - `should return a per-entry conflict for active employees and purge disabled employees in the same bundle`

Primary consent integration test:

- `src/__tests__/integration/consent.communication.api.test.ts`

Current IPS / medication / Communication references already present in the SDK
family:

- `gdc-sdk-node-ts/tests/live-gw-node-runtime.e2e.test.mjs`
  already contains the live runtime references for:
  - `LIVE communication ingestion indexes two medication statements from two bundles`
  - `LIVE actor-scoped node runtime chain on GW`
- `gdc-sdk-core-ts/tests/101-communication-ips-search-outbox.test.mjs`
  shows how the SDK builds the IPS request through `Communication`
- `gdc-common-utils-ts/__tests__/utils-communication-bundle-document-request.test.ts`
  proves the shared builder for FHIR `Parameters` plus the `$summary`
  operation-style request contract
- `gdc-common-utils-ts/docs/101-IPS_BUNDLE.md`
  is the canonical 101 for requesting IPS through `Communication`
- `gwtemplate-node-ts/src/__tests__/unit/managers/CommunicationManager.unit.test.ts`
  proves backend execution for:
  - `Bundle/_search referenced in Communication.contentReference`
  - `Subject/$summary referenced in Communication.contentReference as a summary operation`
  - `Patient/$summary as an alias of Subject/$summary`
  - `Subject/_search referenced in Communication payload with attached Parameters`

Individual onboarding references already present in `gwtemplate-node-ts`:

- `artifacts/openapi-profiles/openapi-extension.json`
  documents the hosted individual onboarding compatibility route and explicitly
  states that the route accepts a signed individual onboarding PDF as a DIDComm
  attachment
- `src/__tests__/data/example-payloads.ts`
  contains canonical individual onboarding payload material, including:
  - `signed-individual-form-pdf`
  - link-based signed PDF payload placeholders such as `{{signedIndividualFormPdfUrl}}`
  - embedded signed PDF placeholders such as `{{signedIndividualFormPdfBase64}}`
  - individual resource examples under `individual/org.schema/Person/`
- `src/__tests__/data/customer-onboarding.data.ts`
  contains individual/customer onboarding evidence examples with PDF attachment
  semantics

Current gap:

- this task document previously jumped from tenant bootstrap to consent flows
- that is incomplete for the real frontend story
- the frontend task must also cover controller-side individual onboarding before
  consent creation
- the onboarding story must also explain how demo evidence is materialized when
  no real digital certificate signature is required

How the continuous local GW demo flow should be executed:

1. start `npm run api:local-demo` in one TTY
2. bootstrap the tenant once with `EMPLOYEE_COUNT=3`
3. use that same tenant state first for employee lifecycle validation
4. then execute the individual onboarding flow on that same tenant state
5. then execute the consent integration test on that same tenant state
6. then execute the medication-ingestion and IPS-read flow on that same tenant state
7. optionally continue with extra index update flows on that same tenant state

For the employee-first bootstrap reference, use:

```bash
cd $HOME/GITS/gdc-workspace/gwtemplate-node-ts
env BASE_URL=http://127.0.0.1:3000 EMPLOYEE_COUNT=3 npm run demo:bootstrap-single-tenant
```

Or, if you want the bootstrap log preserved:

```bash
cd $HOME/GITS/gdc-workspace/gwtemplate-node-ts
env BASE_URL=http://127.0.0.1:3000 EMPLOYEE_COUNT=3 npm run demo:bootstrap-single-tenant:logged
```

After that bootstrap, keep using the same tenant state for:

- employee lifecycle validation
- individual onboarding validation
- consent write/read validation
- medication ingestion validation
- IPS communication validation
- optional IPS update-by-attachment or update-by-contentReference validation

For the later medication-to-IPS live reference in `gdc-sdk-node-ts`, use:

```bash
cd $HOME/GITS/gdc-workspace/gdc-sdk-node-ts
RUN_LIVE_GW_E2E=1 node --test tests/live-gw-node-runtime.e2e.test.mjs
```

And, when specifically validating the IPS ingestion branch:

```bash
cd $HOME/GITS/gdc-workspace/gdc-sdk-node-ts
RUN_LIVE_GW_E2E=1 RUN_LIVE_GW_E2E_IPS_INGESTION=1 node --test tests/live-gw-node-runtime.e2e.test.mjs
```

Then run the consent integration test:

```bash
cd $HOME/GITS/gdc-workspace/gwtemplate-node-ts
npm test -- --watchman=false src/__tests__/integration/consent.communication.api.test.ts
```

That test is the current proof that the consent `Communication` flow is
accepted by GW demo, persisted, and later readable again.

## Missing Frontend Live Test

This task should add the equivalent live/local smoke coverage in
`gdc-sdk-front-ts`.

That new frontend-facing live test should:

- build the employee or consent payload through the frontend SDK surface
- build the individual onboarding payload through the frontend SDK surface
- build the medication-ingestion payloads through the frontend SDK surface
- build the IPS request through the frontend SDK surface
- build the additional complete IPS bundle addition payload through the
  frontend SDK surface when that optional follow-up flow is exercised
- submit it to the demo backend/BFF or equivalent local gateway path
- verify that the GW demo accepts it
- verify the readback path after persistence

This should be implemented in two layers:

- layer 1: incremental frontend live/local tests for each stage
- layer 2: one full orchestrated frontend live/local test that reuses those
  steps in order

This is required because otherwise `sdk-front` would only prove local payload
construction, not real end-to-end behavior against GW.

## Current Understanding

The current intended split appears to be:

### 1. Organization controller -> employees

This flow is bundle-centric.

The frontend should be able to:

- create employee bundles
- submit those bundles to its own backend/BFF
- ask the backend/BFF for employee bundle searches
- read the returned bundle in frontend memory
- search/filter inside the returned bundle for rendering

The likely frontend user need is:

- render a list/table of employees
- show friendly values such as:
  - email
  - role
  - identifier

So the frontend-facing reader/editor surface likely needs helpers such as:

- `getEmail()`
- `getRole()`
- `getIdentifier()`

for each employee entry/resource shown in the UI.

Important:

- this is not a consent flow
- this is not `Communication`-centric
- this is a bundle search/read/render flow

### 2. Individual controller -> consents

This flow is `Communication`-centric.

The frontend should be able to:

- create one or more `Consent` resources
- place them in a `Bundle`
- wrap that bundle into `Communication`
- send that result to its own backend/BFF
- later read the subject consents again through the `Communication` read path

Current intended backend/GW shape:

- write:
  - `Communication/_batch`
  - attached bundle with separate `Consent` resources
- read:
  - `Communication`
  - embedded `Subject/_search`
  - attached FHIR `Parameters`

Important:

- this is not the same UX or API shape as employee search
- this should stay separate in frontend contracts and docs

## What Seems Correct Architecturally

This is the current best interpretation and should be treated as the default
implementation hypothesis unless product/UX says otherwise.

### Employees

- employee create/search belongs to organization-controller/admin screens
- the frontend works with employee bundles and bundle readers/editors
- the frontend renders entry-level fields from returned employee bundles

### Consents

- consent create/read belongs to individual/family/controller screens
- the frontend works with consent bundle creation plus `Communication` wrapping
- consent readback should follow the GW read pattern, not an ad-hoc frontend API

## What Is Still Unclear

The user explicitly raised a valid concern:

- the proposed employee entry helpers and rendering model may or may not be the
  right UX abstraction for the real frontend user journey

So this task must not assume too quickly that:

- `getEmail()`
- `getRole()`
- `getIdentifier()`

are the final public UI-facing API.

Those helpers are probably useful, but the frontend may instead want:

- normalized row/view-model mappers
- search result cards
- table row DTOs
- grouped sections by employee state/role/team

So the implementation thread should first validate:

1. whether entry-level getters are enough for the target screens
2. or whether frontend needs one higher-level mapper on top of the reader/editor

## Recommended Frontend Scope

### Employee side

Add frontend-facing contracts/helpers for:

- building employee create/search requests through `sdk-core`
- reading returned employee bundles
- mapping bundle entries into UI-friendly employee records

Minimum useful UI-friendly shape to evaluate:

- `identifier`
- `email`
- `role`
- `status`
- optional organization/member linkage when present

Use the existing employee examples as the baseline reproducible scenario.
A good minimum live/local workflow should keep a stable employee dataset such as:

- `count_employees = 3` as the initial expected collection size
- create 2 new employees
- delete the second employee through the supported flow
- attempt a purge of the first employee and verify the expected backend outcome
- re-read the bundle/search results after each step to confirm what the frontend
  would actually render

This matters because the frontend task is not only about create payloads. It
also needs to prove that readback and rendering stay coherent after mutations.

### Consent side

Add frontend-facing contracts/helpers for:

- building separate consent grants for:
  - professional
  - organization
  - jurisdictions
- onboarding one individual from the controller-side flow with signed-PDF
  evidence before sending those consents
- wrapping the resulting bundle into `Communication`
- building the read request for the same subject using the `Communication`
  embedded search contract
- creating two distinct medication ingestions through two distinct
  `Communication` payloads
- requesting the IPS after those ingestions so the returned summary includes
  both medications
- mapping returned consent records into frontend-friendly grouped views

Minimum useful UI-friendly grouped shape to evaluate:

- professional consents
- organizational consents
- jurisdictional consents
- actor identifier
- role
- purpose
- action/section scope
- active/inactive state if available

For the onboarding precondition, the implementation thread should validate:

- how the controller creates the individual from frontend
- whether GW expects the signed PDF as embedded base64, external link, or both
- how the individual nickname or alias is stored and later rendered
- that the canonical demo individual used in the flow is `Doraemon`
- how the PDF form template is populated from `schema.org` claims
- how controller data is projected into `Organization.owner.*` fields
- how the demo OTP is generated from PDF hash + timestamp
- how that OTP is automatically consumed by the test to finalize onboarding
- how the later IPS request is built:
  - current `Subject/_search` read path for consent retrieval
  - FHIR `$summary` operation path with attached `Parameters` for IPS retrieval

## Non-Goals

- do not make `gdc-sdk-front-ts` own raw GW route details
- do not make frontend build backend-only DIDComm/KMS concerns
- do not collapse employee and consent flows into one generic abstraction too early
- do not assume the first reader/getter API is the final UI API

## Suggested Implementation Sequence

1. update `gdc-sdk-front-ts` to the latest released `gdc-sdk-core-ts`
2. validate what `sdk-core` already exposes for:
   - employee bundle create/search/read
   - consent communication create/read
3. run the local GW demo validation setup described above
4. add frontend adapters/view-model helpers for employee results
5. add frontend adapters/view-model helpers for controller-side individual
   onboarding results
6. add frontend adapters/view-model helpers for consent results
7. document one portal-web flow and one confidential/native flow if their
   transport boundaries differ
8. add tests for those flows at frontend-contract level
9. run live/local end-to-end validation against the demo tenant
10. add or update one `sdk-front` live/local smoke test that proves the real GW
    demo roundtrip, not only in-memory contract behavior
11. extend that smoke path so it continues from:
   - employee setup
   - to individual onboarding
   - to consent write/read
   - to two medication ingestions
   - to IPS retrieval showing both medications
12. keep the per-stage tests runnable on their own even after the orchestrated
    test exists

## Tests To Add

### Employees

- build employee create payload from frontend helper
- build employee search payload from frontend helper
- read returned bundle and map entries to UI-facing employee rows
- validate the stable dataset scenario with `count_employees = 3`
- validate create/delete/purge readback behavior after each mutation
- add one live/local smoke test that submits the employee flow through the
  frontend-facing surface against the demo tenant
- keep this test runnable independently from later consent or IPS stages

### Individual onboarding

- build the controller-side individual onboarding payload from frontend helper
- fill the PDF form template from `schema.org` claims
- map controller data into `Organization.owner.*`
- include evidence as:
  - signed PDF link or embedded signed PDF when certificate-backed evidence is available
  - demo OTP-based evidence when running the low-assurance local flow
- use the canonical demo nickname `Doraemon`
- generate the OTP from PDF hash + timestamp in demo mode
- auto-use that OTP inside the test to complete the onboarding flow
- submit the onboarding flow against the demo tenant
- verify that the individual is then available for downstream consent flows
- keep this test runnable independently once employees are already bootstrapped

### Consents

- build 3 separate consent grants from frontend helper
- wrap the consent bundle into `Communication`
- build the consent read request using embedded `Subject/_search`
- map returned consent records into grouped frontend view models
- validate live/local readback against the demo tenant
- add one live/local smoke test that submits and reads the consent flow through
  the frontend-facing surface against the demo tenant
- keep this test runnable independently once the individual onboarding stage is
  already satisfied

### Medications and IPS

- build two separate medication ingestions through two separate `Communication`
  payloads
- submit both ingestions against the same demo tenant and same subject
- then build the IPS request through `Communication`
- use the FHIR operation-style request path with attached `Parameters`
- verify that the returned IPS includes the two previously ingested medications
- add optional follow-up coverage for:
  - IPS update by attached additional complete IPS bundle payload
  - IPS update by `contentReference`
- keep medication-ingestion and IPS-read tests runnable incrementally before
  adding the final all-in-one orchestrated test

### Full orchestrator

- add one final live/local orchestrated test that performs, in order:
  - tenant bootstrap
  - employee lifecycle baseline
  - individual onboarding
  - consent write/read
  - medication ingestion 1
  - medication ingestion 2 (optionally with another additional complete IPS bundle)
  - IPS request/readback
- this full test should reuse the same canonical payload builders and assertions
  already used by the incremental tests

## Thread Handoff

If this task is launched in another thread, that thread should start by checking:

1. which `gdc-sdk-core-ts` version is already published and installed here
2. whether the employee reader/getter API is sufficient for the real screens
3. whether consent readback should be exposed as raw records, grouped records,
   or UI-ready cards/rows
4. whether the local GW demo stack is up in TTY and the tenant is already
   bootstrapped
