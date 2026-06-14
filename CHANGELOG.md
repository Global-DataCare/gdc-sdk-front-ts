# Changelog

All notable changes to this project will be documented in this file.

## [0.10.1] - 2026-06-13

### Changed
- Expanded the public frontend orchestration surface so:
  - `OrganizationControllerSdk` exposes `searchOrganizationEmployees(...)`
  - `IndividualControllerSdk` exposes `searchClinicalBundle(...)`
  - `PersonalSdk` exposes `getLatestIps(...)`
- Expanded the frontend license/commercial orchestration surface so
  organization and individual flows can call:
  - `searchLicenses(...)`
  - `listLicenses(...)`
  - `searchLicenseOffers(...)`
  - `listLicenseOffers(...)`
  - `searchLicenseOrders(...)`
  - `listLicenseOrders(...)`
- Wired frontend employee search through the shared bundle-search contract so
  org-admin flows can submit `Employee/_search` requests from the public
  surface instead of using runtime internals.
- Kept the frontend clinical read surface aligned with the runtime methods that
  already existed internally, promoting them to stable public façade methods.
- Promoted the shared commercial/license search/list contract to the public
  frontend service layer instead of forcing portal/BFF code to drop down into
  runtime-private helpers.
- Expanded the public frontend hosting/lifecycle orchestration surface so:
  - `HostOnboardingSdk` exposes:
    - `activateOrganizationInGatewayFromIcaProof(...)`
    - `confirmLegalOrganizationOrder(...)`
    - `disableHost(...)`
    - `purgeHost(...)`
  - `OrganizationControllerSdk` exposes:
    - `disableTenant(...)`
    - `purgeTenant(...)`
- Aligned the frontend runtime contracts and synthetic service layer with the
  canonical host-registry lifecycle facade already published by
  `gdc-sdk-core-ts`, so browser/BFF integrations can reason in the same
  host/tenant lifecycle vocabulary as `gdc-sdk-node-ts`.
- Updated the shared dependency targets to:
  - `gdc-common-utils-ts@^1.24.1`
  - `gdc-sdk-core-ts@^0.11.1`
- Refreshed `TODO.md` and orchestration coverage so facade parity is tracked in
  the frontend layer rather than hidden behind runtime-only escape hatches.
- Refreshed the package guidance docs so portal/BFF integrations now point
  directly at the canonical GW CORE functional map for:
  - related persons
  - invited members
  - effective consents
- Refreshed the lockfile so `gdc-sdk-front-ts@0.10.1` resolves the published
  npm artifacts for the latest shared packages.

### Testing
- `npm install gdc-common-utils-ts@^1.24.1 gdc-sdk-core-ts@^0.11.1`
- `npm run build`
- `npm test`

## [0.9.1] - 2026-06-11

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.20.1`
  - `gdc-sdk-core-ts@^0.9.1`

### Testing
- `npm run build`

## [0.9.0] - 2026-06-10

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.20.0`
  - `gdc-sdk-core-ts@^0.9.0`
- Clarified the frontend discovery contract so GW hosting discovery starts from
  the contextualized hosting-operator `/.well-known/dspace-version` URL rather
  than the host root.
- Clarified in frontend discovery types/docs that the backend-owned host DSP
  entrypoint is `/host/cds-{hostCoverageScope}/{version}/{hostNetwork}/.well-known/dspace-version`.
- Expanded the employee/consent frontend handoff with:
  - the split between `gdc-common-utils-ts` and higher-level SDK surfaces
  - the expected `ConsentViewModel` roundtrip and validation path
  - the required live/local verification order for employee and consent flows
- Added the first frontend onboarding-PDF integration surface so an
  individual-controller flow can:
  - materialize an onboarding PDF request bundle
  - send it through the controller/client orchestration layer
  - follow the shared `DocumentReference/_create` contract
- Documented the onboarding PDF request flow in `docs/101-SDK_INTEGRATION.md`.

### Testing
- `npm test`
- `npm run build`

## [0.8.2] - 2026-06-04

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.17.0`
  - `gdc-sdk-core-ts@^0.8.2`
- Added a dedicated frontend task handoff covering:
  - employee live/local validation order
  - individual onboarding before consent flows
  - consent roundtrip against GW demo
  - required frontend live smoke coverage

### Testing
- `npm test`

## [0.8.1] - 2026-06-04

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.16.0`
  - `gdc-sdk-core-ts@^0.8.1`
- Tightened frontend actor-facade materialization so:
  - `asProfessional()` no longer accepts individual-only sessions
  - `asOrganizationEmployee()` no longer materializes outside organization app
    profiles
- Updated actor/session tests to stay aligned with the expanded capability
  split coming from `sdk-core`.

### Testing
- `node --test tests/actor-session.test.mjs tests/session-descriptor.test.mjs tests/orchestration.test.mjs`
- `npm run build`

## [0.8.0] - 2026-06-04

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.16.0`
  - `gdc-sdk-core-ts@^0.8.0`
- Reworked the frontend employee onboarding path so it teaches:
  - `BundleEditor`
  - `setAllowedResourceType(EmployeeResourceTypes.employee)`
  - `newEntry(...).asEmployee()`
  instead of presenting employee-specific setters directly on the generic
  bundle editor surface.
- Clarified in README and `101-SDK_INTEGRATION.md` that employee management in
  Vite/non-confidential apps builds one homogeneous employee batch/search
  bundle and sends it to the portal backend.

### Testing
- `npm run build`

## [0.7.0] - 2026-06-04

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.15.0`
  - `gdc-sdk-core-ts@^0.7.0`
- Reworked the frontend employee documentation so the primary teaching path now
  starts from the shared `BundleEditor` model rather than employee-specific
  ad-hoc bundle helpers.
- Clarified the split between:
  - portal web / Vite with backend-owned KMS and transport
  - confidential/native apps with client-side runtime and local key custody

### Testing
- `npm run build`

## [0.6.5] - 2026-06-02

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.14.10`
  - `gdc-sdk-core-ts@^0.6.9`

### Testing
- `npm run build`

## [0.6.3] - 2026-06-01

### Changed
- Simplified frontend discovery documentation so the primary integration story
  is:
  - frontend sends `sector + jurisdiction + providerCapability` to its backend
  - backend owns `default-first`, `networkType`, and host bootstrap
  - frontend renders normalized provider/host cards
- Reworked the README discovery snippet to be more self-explanatory for portal
  developers and to avoid mixing frontend concerns with backend bootstrap
  internals.

### Testing
- `npm test`

## [0.6.1] - 2026-06-01

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.14.0`
  - `gdc-sdk-core-ts@^0.6.1`
- Kept frontend discovery docs/examples aligned with the shared
  `default-first` backend bootstrap guidance.

### Testing
- `npm test`

## [0.6.0] - 2026-05-29

### Added
- Added the first frontend-facing dataspace discovery runtime surface:
  - `src/discovery/DataspaceDiscoveryClient.ts`
  - `src/discovery/types.ts`
  - `src/discovery/mappers.ts`
  - `src/discovery/index.ts`
- Added public root exports for the dataspace discovery client contract and UI
  mapping helpers.
- Added focused frontend discovery tests covering:
  - hosting-operator card mapping
  - published-provider card mapping
  - capability filtering at presentation layer

### Changed
- Updated the shared dependency targets to:
  - `gdc-common-utils-ts@^1.13.0`
  - `gdc-sdk-core-ts@^0.6.0`
  so the
  frontend runtime can align with the new common dataspace discovery semantics.
- Updated `TODO.md` and `docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md` to keep the
  default integration path BFF-first, with direct public-catalog mode treated
  as an optional later adapter.
- Clarified frontend DTO/documentation examples so `discoveryUrl` and
  `/dsp/catalog/dcat.json` are treated as distinct concerns.

### Testing
- `npm test -- tests/dataspace-discovery-client.test.mjs`

## [0.5.2] - 2026-05-28

### Changed
- Updated shared dependency target to `gdc-common-utils-ts@^1.11.0`.
- Kept frontend package alignment with the latest shared key-binding and VP-token documentation.

### Testing
- `npm run build`

## [0.5.1] - 2026-05-27

### Changed
- Updated shared dependency targets to:
  - `gdc-common-utils-ts@^1.10.0`
  - `gdc-sdk-core-ts@^0.5.1`
- Kept frontend-facing onboarding vocabulary aligned with the clearer shared
  capability naming.

### Testing
- `npm run build`

## [0.3.2] - 2026-05-26

### Changed
- Reduced `docs/101-SDK_INTEGRATION.md` to a short frontend integration map instead of a second long tutorial.
- Aligned the frontend doc naming with the shared/core/node vocabulary:
  - `subjectDid`
  - `org.schema.Service.serviceType`
  - `serviceCapabilities` / `service.capabilities`
  - `facets` as UI/session-only terminology
- Updated README examples to avoid `individualDidWeb` as the teaching variable name.

### Testing
- Doc-only change; no runtime surface change.

## [0.3.1] - 2026-05-26

### Changed
- Updated frontend-facing onboarding docs to keep legal-organization activation aligned with the canonical capability model from the shared/core SDKs.
- Updated dependency targets to `gdc-common-utils-ts@^1.7.0` and `gdc-sdk-core-ts@^0.3.2`.

### Testing
- `npm run build`

## [0.3.0] - 2026-05-25

### Changed
- Switched published frontend imports from workspace-relative `../../gdc-sdk-core-ts/dist/...` paths to the package import `gdc-sdk-core-ts`, so the npm artifact works outside the monorepo checkout.
- Aligned shared dependencies to `gdc-common-utils-ts@^1.6.0` and `gdc-sdk-core-ts@^0.3.0`.
- Kept the frontend docs pointing at the canonical shared lifecycle and `101` material instead of duplicating payload examples locally.

### Testing
- `npm run build` passes.
- `npm test` passes.

## [0.2.1] - 2026-05-24

### Changed
- Updated README and `101-SDK_INTEGRATION.md` to document the shared consent-access model, controller permission inspection, missing-permission detection, and canonical permission-request `Communication` flow.

### Testing
- `npm run type-check` passes after the consent-access documentation alignment.

## 0.2.0 - 2026-05-23

### Added
- Promoted the frontend runtime alignment with shared bootstrap/discovery/examples to the first minor release line.

### Changed
- Aligned the shared dependency to `gdc-common-utils-ts@^1.5.0`.
- Updated README and `101-SDK_INTEGRATION.md` to describe the canonical shared examples and owner-vs-legal-representative semantics.

### Testing
- `npm test` passes against the packaged `gdc-common-utils-ts` artifact.

## 0.1.2 - 2026-05-21

### Changed
- Added front SDK lifecycle coverage for profile registry delegation and session bootstrap/deactivate flows.
- Added actor-session descriptor edge-case coverage for omitted optional fields and empty actor flags.
- Added negative-path coverage for individual communication send and clinical bundle search facades.
- Fixed `ClientSDK.initializeProfileRegistry(...)` so the vault is initialized once instead of twice.
- Added required-input validation to `IndividualService.sendCommunication(...)` and `IndividualService.searchClinicalBundle(...)`.
- Frontend contract examples are now consumed from `gdc-common-utils-ts/examples` instead of package-local test fixtures.
- README and `101-SDK_INTEGRATION.md` now point to the shared request/response example source of truth in `gdc-common-utils-ts`.

### Testing
- `npm run type-check` planned.
- `npm test` planned.

## 0.1.1 - 2026-05-20

### Changed
- Removed `Gdc` prefixes from frontend public types/method names.
- Updated frontend imports to consume renamed core contracts without legacy aliases.
- Rebuilt runtime artifacts so `dist` exports the same neutral names as `src`.
- Replaced duplicated frontend channel/document contracts with direct aliases to core contracts:
  - `FrontDateRange` -> core `DateRange`
  - `FrontBundleSearchQuery` -> core `BundleSearchQuery`
  - `FrontCommunicationInput` -> core `CommunicationInput`
- Replaced frontend-local actor-flag-to-session mapping logic with core helper `buildActorSessionDescriptorFromActorFlags(...)`.
- Replaced duplicated front session/profile/query contracts with direct core re-exports:
  - `AppInfo`, `InitializeSessionParams`, `Profile`, `ProfileRegistryEntry`
  - `VaultQueryCondition`, `VaultQuery`, `IVaultRepository`
  - `IApiConfig`, `INetwork`, `IVerifier`

### Testing
- `npm run type-check` passes.
- `npm run build` passes.

## 0.1.0 - 2026-05-18

### Added
- Created `gdc-sdk-front-ts` as the target frontend runtime package in the converged `gdc-*` SDK family.
- Added frontend-facing reexports for actor/capability contracts from `gdc-sdk-core-ts`.
- Added first frontend-facing actor helpers:
  - `expandActorSessionDescriptorToFacades`
  - `filterCapabilitiesForActor`
- Added frontend session descriptor helpers:
  - `describeFrontActorSession`
  - `describeFrontActorFacades`

### Changed
- Frontend package naming is now `front` rather than `expo` to reflect a runtime-agnostic frontend boundary.

### Security
- Frontend capability expansion now follows the same actor-isolation contract as the core and Node packages.
- Documented `gdc-sdk-client-ts` as a legacy migration source, not the final package target.

### Testing
- Added package-level tests for:
  - Family facade expansion
  - actor capability filtering
  - namespace-presence to actor-session conversion
  - migration target status
