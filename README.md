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

## Start Here

If you are integrating this package for the first time, open these in order:

1. [SDK_INTEGRATION_101.md](./SDK_INTEGRATION_101.md)
   Real frontend/native setup, imports, `new ClientSDK(...)`,
   `initializeCommunicationIdentityFromSeed(...)`, provider discovery, and
   `initializeSession(...)`.
2. [../gdc-sdk-core-ts/docs/SDK_FLOWS_101.md](../gdc-sdk-core-ts/docs/SDK_FLOWS_101.md)
   Shared business-flow map by actor family.
3. [../gdc-common-utils-ts/src/examples/frontend-session.ts](../gdc-common-utils-ts/src/examples/frontend-session.ts)
   Shared profile/session payload source of truth.

If you need the shortest path:

- frontend technical identity:
  [`initializeCommunicationIdentityFromSeed(...)`](./SDK_INTEGRATION_101.md)
- main runtime class:
  [`ClientSDK`](src/ClientSDK.ts)
- profile/session bootstrap:
  [`initializeSession(...)`](./SDK_INTEGRATION_101.md)

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
  EXAMPLE_CONSENT_ACCESS_PROVIDER_EMAIL,
  EXAMPLE_CONSENT_ACCESS_SUBJECT,
} from 'gdc-common-utils-ts/examples/consent-access';
import { HealthcareActorRoles } from 'gdc-common-utils-ts/constants/healthcare';

const missing = getMissingPermissions(evaluation);

const communication = buildPermissionRequestCommunication({
  subject: EXAMPLE_CONSENT_ACCESS_SUBJECT,
  requester: { actorKind: 'professional', email: EXAMPLE_CONSENT_ACCESS_PROVIDER_EMAIL },
  requesterRole: HealthcareActorRoles.Physician,
  missing,
});
```

## Shared Contract Sources

- [../gdc-sdk-core-ts/README.md](../gdc-sdk-core-ts/README.md)
- [../gdc-common-utils-ts/docs/CONSENT_ACCESS_101.md](../gdc-common-utils-ts/docs/CONSENT_ACCESS_101.md)

Reusable payload examples:

- `gdc-common-utils-ts/examples/frontend-session`
- `gdc-common-utils-ts/examples/professional`
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
