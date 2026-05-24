# Changelog

All notable changes to this project will be documented in this file.

## 0.1.2 - 2026-05-21

### Changed
- Added front SDK lifecycle coverage for profile registry delegation and session bootstrap/deactivate flows.
- Added actor-session descriptor edge-case coverage for omitted optional fields and empty actor flags.
- Added negative-path coverage for individual communication send and clinical bundle search facades.
- Fixed `ClientSDK.initializeProfileRegistry(...)` so the vault is initialized once instead of twice.
- Added required-input validation to `IndividualService.sendCommunication(...)` and `IndividualService.searchClinicalBundle(...)`.
- Frontend contract examples are now consumed from `gdc-common-utils-ts/examples` instead of package-local test fixtures.
- README and `SDK_INTEGRATION_101.md` now point to the shared request/response example source of truth in `gdc-common-utils-ts`.

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
