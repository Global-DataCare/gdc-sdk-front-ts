# SDK Integration 101 for Frontend / Native Apps

This file is the short frontend integration map.

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
- which helper should the frontend call next
- which concepts belong to UI/session state
- which concepts belong to shared activation/discovery contracts

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

Before choosing a class or helper, decide which frontend mode you are building.

### Portal web / non confidential app

Use this mode when:

- the frontend is a Vite/web portal
- the portal backend owns controller/professional keys in AWS KMS
- the backend sends DIDComm to GW CORE

In this mode, do not start from frontend session/runtime APIs for employee or
consent payload authoring.

Start from shared editors/builders instead:

- `BundleEditor` plus `EmployeeEntryEditor`
- `CommunicationAttachedBundleSession`
- `createConsentAccessEditor(...)`

Then send the resulting payload or bundle to the portal backend.

Use these references first:

- [gdc-common-utils-ts/docs/101-EMPLOYEE_ENTRY_EDITOR.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-EMPLOYEE_ENTRY_EDITOR.md)
- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)
- [gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-consent-bundle-editor.test.ts)

Practical rule:

- `BundleEditor` plus `EmployeeEntryEditor` for employee create/search/disable/purge
- `CommunicationAttachedBundleSession` for `Communication`-carried bundles
- `createConsentAccessEditor(...)` for editing one consent inside that bundle

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
