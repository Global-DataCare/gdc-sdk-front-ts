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
} from 'gdc-sdk-core-ts';
import {
  EXAMPLE_RELATIONSHIP_CHANNEL_INVITATION_INPUT,
  EXAMPLE_RELATIONSHIP_CHANNEL_OTP_START_INPUT,
} from 'gdc-common-utils-ts/examples/relationship-access';

const invitation = createRelationshipChannelInvitationInput(
  EXAMPLE_RELATIONSHIP_CHANNEL_INVITATION_INPUT,
);

const otpStart = createRelationshipChannelOtpStartInput(
  EXAMPLE_RELATIONSHIP_CHANNEL_OTP_START_INPUT,
);
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
