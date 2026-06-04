# gdc-sdk-front-ts

Frontend runtime package for consuming the shared GDC SDK contracts in web or
mobile apps.

Use this package when your frontend needs to:

- build UI flows on top of GDC shared contracts
- manage session/profile state
- prepare consent-aware requests
- consume the shared invitation, OTP, and relationship-PIN flows
- work with communication drafts and local outbox patterns

This package is frontend-facing. It should explain app flows, not gateway route
details.

Architectural rule:

- `gdc-sdk-front-ts` should converge on the same actor-scoped facade boundaries
  as `gdc-sdk-node-ts`
- transport and adapter details may differ
- business ownership must not differ by runtime

## Start Here

If you are integrating this package for the first time, open these in order:

1. [gdc-sdk-core-ts/docs/101-SDK_PACKAGE_BOUNDARIES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_PACKAGE_BOUNDARIES.md)
   Why `core`, `node`, and `front` are separate packages, what each one owns,
   and why frontend facades should mirror backend actor boundaries.
1. [docs/101-SDK_INTEGRATION.md](./docs/101-SDK_INTEGRATION.md)
  Real frontend/native setup, imports, `new ClientSDK(...)`,
  `initializeCommunicationIdentity(...)`, provider discovery, and
   `initializeSession(...)`.
2. [docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md](./docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md)
   Frontend discovery guide for BFF-first provider/operator discovery, UI card
   mapping, and copy/paste backend DTO consumption.
3. [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)
   Shared business-flow map by actor family.
4. [gdc-sdk-node-ts/docs/101-LIVE_GW_LOCAL.md](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-LIVE_GW_LOCAL.md)
   Canonical local/TTY/Docker GW reference when the frontend team also needs a
   real local GW running for end-to-end checks.
5. [gdc-common-utils-ts/src/examples/frontend-session.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/examples/frontend-session.ts)
   Shared profile/session payload source of truth.
6. [gdc-common-utils-ts/docs/101-LIFECYCLE.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-LIFECYCLE.md)
   Canonical lifecycle semantics and reusable placeholders for UI and portal flows.

If you need the shortest path:

- app identity required by GW CORE:
  `appId` mandatory, `appVersion` optional with default `v1.0`
- frontend technical identity:
  [`initializeCommunicationIdentity(...)`](./docs/101-SDK_INTEGRATION.md)
  for the technical device/channel profile identity, not the legal organization id
- main runtime class:
  [`ClientSDK`](src/ClientSDK.ts)
- profile/session bootstrap:
  [`initializeSession(...)`](./docs/101-SDK_INTEGRATION.md)

## Frontend Runtime Modes

There are two frontend integration modes. New developers should choose the
mode first, before choosing classes or helpers.

### 1. Portal web / non confidential app

Use this mode when:

- the frontend is a Vite/web portal
- the portal backend holds controller/professional keys in AWS KMS
- the frontend does not send DIDComm directly to GW CORE

Recommended entry point:

- start from the shared editors/builders in `gdc-sdk-core-ts`
- send the resulting payload or bundle to the portal backend
- let the backend handle KMS, DIDComm, submit, and poll

Main references:

- [gdc-common-utils-ts/docs/101-EMPLOYEE_ENTRY_EDITOR.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-EMPLOYEE_ENTRY_EDITOR.md)
- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)
- [gdc-common-utils-ts/__tests__/101-consent-bundle-editor.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-consent-bundle-editor.test.ts)

Use:

- `BundleEditor` plus `EmployeeEntryEditor` for employee create/search/disable/purge payloads
- `CommunicationAttachedBundleSession` for `Communication`-carried bundles
- `createConsentAccessEditor(...)` for consent editing inside a communication bundle

Controller-only employee flow in a portal web app:

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

// This editor lives only in frontend memory.
// It helps the UI build the canonical employee payload before sending it to
// the portal backend.
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

Search is a different operation and should be built separately.

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

Primary references for those employee flows:

- [gdc-sdk-core-ts/docs/101-EMPLOYEES.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-EMPLOYEES.md)
- [gdc-sdk-core-ts/tests/101-employees.test.mjs](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/tests/101-employees.test.mjs)

Non-controller frontend references:

- professional / individual flow map:
  - [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)
- consent editing:
  - [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)
- consent + communication handoff:
  - [gdc-sdk-core-ts/docs/101-CONSENT_COMMUNICATION.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-CONSENT_COMMUNICATION.md)

### 2. Confidential app / direct client runtime

Use this mode when:

- the app stores transport keys locally
- the app can talk directly to GW CORE
- there is no portal backend doing KMS and DIDComm on behalf of the app

Recommended entry point:

- start from `ClientSDK`
- initialize runtime/session state
- use the same shared editors/builders from `sdk-core` when a flow needs them

Main references:

- [docs/101-SDK_INTEGRATION.md](./docs/101-SDK_INTEGRATION.md)
- [gdc-sdk-node-ts/docs/101-LIVE_GW_LOCAL.md](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-LIVE_GW_LOCAL.md)

Decision rule:

- no local key custody: start from `sdk-core` editors and send to your backend
- local key custody: start from `ClientSDK` runtime/session and use `sdk-core` editors as shared modeling helpers

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

// `initializeSession(...)` creates the authenticated frontend runtime session.
// In a confidential app this session owns the actor-facing runtime surface and
// can later expose organization-controller/professional capabilities.
const session = await client.initializeSession(EXAMPLE_PROFILE_SESSION_INPUT);

// The shared bundle editor from sdk-core is still used to model the employee bundle.
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

Runtime note:

- a confidential app still must choose the correct actor surface before using
  an employee flow
- employee management belongs only to the organization-controller/admin side
- professional or individual apps should start from their own actor flow, not
  from the employee examples above

Primary references for that flow:

- [docs/101-SDK_INTEGRATION.md](./docs/101-SDK_INTEGRATION.md)
- [gdc-sdk-node-ts/docs/101-LIVE_GW_LOCAL.md](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-LIVE_GW_LOCAL.md)

## Executable Usage Examples

Open these tests when you want to see exact frontend calls and exact inputs:

- [tests/client-sdk.test.mjs](tests/client-sdk.test.mjs)
  `ClientSDK` bootstrap, provider metadata, and session-facing behavior.
- [tests/actor-session.test.mjs](tests/actor-session.test.mjs)
  Actor-session descriptors and facade expansion.
- [tests/individual-service.test.mjs](tests/individual-service.test.mjs)
  Individual-facing service composition.
- [tests/profile-registry.test.mjs](tests/profile-registry.test.mjs)
  Profile registry and persistence behavior.
- [tests/session-descriptor.test.mjs](tests/session-descriptor.test.mjs)
  Session descriptor shaping for UI/runtime code.
- [tests/dataspace-discovery-client.test.mjs](tests/dataspace-discovery-client.test.mjs)
  BFF-first dataspace discovery mapping, capability filtering, and DTO-to-card
  behavior.

## Frontend Discovery Quick Map

Frontend apps should not crawl host catalogs directly by default.

Preferred model:

- backend/BFF resolves host discovery from `/.well-known/dspace-version`
- backend/BFF derives `/dsp/catalog/dcat.json`
- frontend consumes normalized DTOs and maps them into cards

Primary references:

- [docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md](./docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md)
- [tests/dataspace-discovery-client.test.mjs](tests/dataspace-discovery-client.test.mjs)

Copy/paste starting point:

```ts
import { HttpDataspaceDiscoveryClient } from 'gdc-sdk-front-ts';
import { ServiceCapabilityToken } from 'gdc-common-utils-ts/constants';

// Frontend talks to its own backend/BFF.
// The frontend should not need to know `networkType` or host bootstrap rules.
const discoveryClient = new HttpDataspaceDiscoveryClient({
  endpointUrl: '/api/dataspace-discovery/providers',
});

// Ask for providers for one business sector in one jurisdiction.
const result = await discoveryClient.listPublishedProviders({
  sector: 'animal-care',
  jurisdiction: 'ES',
  coverageScope: 'EU',
  providerCapability: ServiceCapabilityToken.IndexProvider,
});

// Use the returned cards directly in the UI.
for (const provider of result.providers) {
  console.log(provider.did, provider.title, provider.endpointUrl);
}
```

What happens behind that frontend call:

- frontend sends `sector + jurisdiction + capability` to its backend
- backend uses `gdc-sdk-node-ts` with `default-first`
- backend resolves hosts and providers
- frontend receives normalized cards and renders them

## Actor Split And UI Scope

The frontend package must also start from actor families, because screens and
permissions differ:

- organization controller
- organization employee / professional member
- individual controller
- individual member / self
- related person
- professional with consented access

Frontend concerns include:

- actor/session bootstrap
- invitation and acceptance UX
- permission management UX
- notification / permission-request UX
- communication draft and submission UX
- clinical read/write UX constrained by evaluated permissions

## Flow Families

- organization onboarding and employee invitation screens
- individual onboarding and order/offer confirmation screens
- permission creation, edit, deactivation, and grouped views
- invitation acceptance and relationship activation
- permission-request notification review
- document/resource import into the subject index
- subject-scoped communication and search flows

## Main Flows

### 1. Controller invites another actor to connect with a subject

Typical frontend sequence:

1. collect invitee data
2. build invitation payload using shared helpers
3. send it through your frontend/backend integration
4. show invitation state to the user

The frontend should only care about the shared contract:

- actor kind
- delivery channel
- delivery target
- subject id
- purpose

It should not care about gateway path families.

### 2. Invitee accepts the invitation

Typical frontend sequence:

1. enter invitation or activation details
2. start OTP challenge
3. confirm OTP
4. set relationship PIN if required
5. activate the relationship locally in UI/session state

Shared builders for this flow come from `gdc-sdk-core-ts`.

### 3. Consent-aware communication UI

Use this package when the frontend needs to:

- evaluate whether access is already covered
- show missing permissions
- prepare a permission-request `Communication`
- build local communication drafts before sending

## What This Package Owns

- frontend runtime config
- session/profile-facing helpers
- app-facing composition over shared SDK contracts

## What This Package Does Not Own

- canonical shared invitation/consent contract definitions
- Node GW runtime execution
- UNID-specific reminder/task runtime

Those belong to:

- `gdc-sdk-core-ts`
- `gdc-sdk-node-ts`
- product/runtime extension layers

## Minimal Examples

### Build invitation and OTP payloads in frontend code

```ts
import {
  createRelationshipChannelInvitationInput,
  createRelationshipChannelOtpStartInput,
  RelationshipAccessActorKinds,
  RelationshipEnrollmentChannels,
  RelationshipOtpDeliveryChannels,
  RelationshipSubjectKinds,
  type RelationshipChannelInvitationInput,
  type RelationshipChannelOtpStartInput,
} from 'gdc-sdk-core-ts';
import {
  buildIndividualDidWeb,
  HealthcareConsentPurposes,
} from 'gdc-common-utils-ts';

const tenantId = 'acme-id';
const jurisdiction = 'ES';
const sector = 'health-care';
const providerOrganizationDid = activeSubjectProfile.organizationDid;
const subjectLocalId = activeSubjectProfile.subjectId;
const subjectId = buildIndividualDidWeb({
  organizationDidWeb: providerOrganizationDid,
  subjectId: subjectLocalId,
});
const actorIdentifier = relatedPersonForm.email;
const deliveryTarget = actorIdentifier;

const invitationInput: RelationshipChannelInvitationInput = {
  tenantId,
  jurisdiction,
  sector,
  subjectId,
  subjectKind: RelationshipSubjectKinds.Person,
  actorKind: RelationshipAccessActorKinds.RelatedPerson,
  actorIdentifier,
  relationshipLabel: 'daughter',
  deliveryChannel: RelationshipEnrollmentChannels.Email,
  deliveryTarget,
  purpose: HealthcareConsentPurposes.CareManagement,
  phonePinOptional: true,
};

const invitation = createRelationshipChannelInvitationInput(invitationInput);

const invitationId = 'rel-invite-001';

const otpStartInput: RelationshipChannelOtpStartInput = {
  invitationId,
  deliveryChannel: RelationshipOtpDeliveryChannels.Email,
  locale: 'es-ES',
};

const otpStart = createRelationshipChannelOtpStartInput(otpStartInput);
```

### Build permission-request communication

```ts
import {
  buildPermissionRequestCommunication,
  getMissingPermissions,
} from 'gdc-sdk-core-ts';
import {
  EXAMPLE_EMAIL_PROFESSIONAL,
  EXAMPLE_INDIVIDUAL_DID_WEB,
} from 'gdc-common-utils-ts/examples/consent-access';
import { HealthcareActorRoles } from 'gdc-common-utils-ts/constants/healthcare';

const subjectDid = EXAMPLE_INDIVIDUAL_DID_WEB;
const emailProfessional = EXAMPLE_EMAIL_PROFESSIONAL;
const missing = getMissingPermissions(evaluation);

const communication = buildPermissionRequestCommunication({
  subject: subjectDid,
  requester: { actorKind: 'professional', email: emailProfessional },
  requesterRole: HealthcareActorRoles.Physician,
  missing,
});
```

## Shared Contract Sources

- [gdc-sdk-core-ts/README.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/README.md)
- [gdc-common-utils-ts/docs/101-CONSENT_ACCESS.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CONSENT_ACCESS.md)

Reusable payload examples:

- `gdc-common-utils-ts/examples/frontend-session`
- `gdc-common-utils-ts/examples/professional`
- `gdc-common-utils-ts/examples/lifecycle`
- `gdc-common-utils-ts/examples/api-flow-examples`

## API Index

## Full Public Surface

This package exports the full `gdc-sdk-core-ts` surface plus the frontend
runtime modules below.

- [`src/runtime-contracts.ts`](src/runtime-contracts.ts)
  - types/constants: `LegacyFrontSourcePackage`, `FrontRuntimeKind`, `FrontFetchLike`, `FrontRuntimeConfig`, `FrontPackageStatus`, `GDC_SDK_FRONT_STATUS`
- [`src/actor-session.ts`](src/actor-session.ts)
  - re-exports actor-session descriptor helpers for frontend consumption
- [`src/session-descriptor.ts`](src/session-descriptor.ts)
  - types: `FrontActorFlags`, `FrontSessionDescriptorInput`
  - functions: `describeFrontActorSession(...)`, `describeFrontActorFacades(...)`
- [`src/types.ts`](src/types.ts)
  - types: `SdkConfig`, `FrontDateRange`, `FrontBundleSearchQuery`, `FrontCommunicationInput`
  - re-exported shared types: `AppInfo`, `InitializeSessionParams`, `Profile`, `ProfileRegistryEntry`, `VaultQueryCondition`, `VaultQuery`, `IVaultRepository`, `IApiConfig`, `INetwork`, `IVerifier`
- [`src/services.ts`](src/services.ts)
  - classes: `CommonAuthService`, `OrgAdminService`, `FamilyAdminService`, `IndividualService`, `PhysicianService`, `ParamedicService`
- [`src/roleRegistry.ts`](src/roleRegistry.ts)
  - interfaces: `OrgAdminServices`, `FamilyAdminServices`, `IndividualServices`, `ProfessionalServices`, `CommonServices`
- [`src/capabilityMapper.ts`](src/capabilityMapper.ts)
  - function: `mapCapabilitiesToServices(...)`
- [`src/VerifierService.ts`](src/VerifierService.ts)
  - class: `VerifierService`
- [`src/ProfileManager.ts`](src/ProfileManager.ts)
  - class: `ProfileManager`
  - compatibility export: `ActorSession`
- [`src/ProfileRegistry.ts`](src/ProfileRegistry.ts)
  - class: `ProfileRegistry`
- [`src/ClientSDK.ts`](src/ClientSDK.ts)
  - class: `ClientSDK`
  - re-exported session/profile types from shared contracts

The runtime-facing meaning of these exports is:

- `ClientSDK`, `ProfileManager`, `ProfileRegistry`, `VerifierService`
  - app/session orchestration
- `services.ts`
  - app-facing domain services
- `session-descriptor.ts` and `actor-session.ts`
  - actor-role expansion for frontend use
- `capabilityMapper.ts` and `roleRegistry.ts`
  - capability-to-service wiring

### Re-exported shared helpers from `gdc-sdk-core-ts`

- consent access helpers
- relationship invitation/acceptance builders
- communication draft helpers
- document facade helpers
- vital-sign helpers

### Frontend runtime configuration

- [`FrontRuntimeConfig`](src/runtime-contracts.ts)

### Frontend runtime services

- [`ClientSDK`](src/ClientSDK.ts)
- [`ProfileManager`](src/ProfileManager.ts)
- [`ProfileRegistry`](src/ProfileRegistry.ts)
- [`VerifierService`](src/VerifierService.ts)
- [`describeFrontActorSession(...)`](src/actor-session.ts)
- [`describeFrontActorFacades(...)`](src/actor-session.ts)

## Documentation Rule

- README should explain app flows first.
- Shared contract definitions should stay in `gdc-sdk-core-ts`.
- Frontend consumers should not need UNID runtime knowledge to understand this package.
