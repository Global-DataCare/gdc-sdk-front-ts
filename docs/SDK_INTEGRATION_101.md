# SDK Integration 101 for Frontend / Native Apps

This file is the short frontend integration map.

Related profiles / active subject selector:

- [SDK_RELATED_PROFILES_101.md](./SDK_RELATED_PROFILES_101.md)

If you want the business-flow overview first, start here:

- [gdc-sdk-core-ts/docs/SDK_FLOWS_101.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/SDK_FLOWS_101.md)

If you want the shared lifecycle semantics and reusable placeholders, use:

- [gdc-common-utils-ts/docs/LIFECYCLE_101.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/LIFECYCLE_101.md)

This document should answer only these questions:

- which package/class should the frontend instantiate
- which helper should the frontend call next
- which concepts belong to UI/session state
- which concepts belong to shared activation/discovery contracts

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

## Main Frontend Runtime

Use:

- `ClientSDK`

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

It should not start from:

- raw `_activate` JSON
- nested GW `body.data[0].resource.meta.claims`
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

Shared business flow reference:

- [gdc-sdk-core-ts/docs/SDK_FLOWS_101.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/SDK_FLOWS_101.md)

### Individual / family flows

Frontend usually prepares UX/state for:

- individual bootstrap
- consent grant/review
- related-person invitation
- IPS/FHIR import and read flows

Use shared references instead of restating the full tutorial here.

## Shared Builders And Constants

Prefer these shared helpers:

- `initializeCommunicationIdentity(...)`
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
- first-class DCAT3 frontend discovery helpers
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
