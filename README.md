# gdc-sdk-front-ts

Target frontend runtime package for the converged GDC SDK family.

Key docs:

- [CHANGELOG.md](CHANGELOG.md)
- [SECURITY.md](SECURITY.md)
- [SDK_INTEGRATION_101.md](SDK_INTEGRATION_101.md)
- [../gdc-common-utils-ts/docs/CONSENT_ACCESS_101.md](../gdc-common-utils-ts/docs/CONSENT_ACCESS_101.md)

Current status:

- package created
- build/test baseline created
- migration target from `gdc-sdk-client-ts` declared
- frontend runtime contract skeleton declared
- shared core identity/discovery/bootstrap contracts are now available for frontend wiring

Why `front` and not `expo`:

- the SDK architecture is frontend-agnostic
- Expo is one runtime, not the product boundary
- the same package family should later support web portal and Expo/mobile adapters

Not migrated yet:

- `ClientSDK`
- `ProfileManager`
- `roleRegistry`
- `capabilityMapper`
- app-facing session bootstrap
- Expo/web adapter implementations
- provider/operator/ICA discovery facade wiring
- explicit device/actor/provider identity store wiring
- controller bootstrap helper for `_activate` with `vp_token + controller.*`

Role in the transition:

- `gdc-sdk-core-ts` will own shared actor/capability contracts
- `gdc-sdk-front-ts` will own frontend-facing runtime adapters and session/profile orchestration
- `gdc-sdk-client-ts` is now the legacy source repo for migration, not the final name

Reusable payload source of truth:

- `gdc-common-utils-ts/examples/frontend-session`
  - session/profile bootstrap examples
- `gdc-common-utils-ts/examples/professional`
  - lightweight communication/search request examples reused by frontend services
  - reusable professional role/permission scenarios by section and expected FHIR types
  - reusable consent-vs-smart matrices for actor targeting by email, organization, or jurisdiction
- `gdc-common-utils-ts/examples/api-flow-examples`
  - preferred compatibility aggregator when one import surface is needed without using the overloaded term `contract`

CORE vs extension note:

- CORE shared examples model provider and actor identities with DID/email-first semantics
- phone-only subject/controller fields are compatibility or product-extension concerns, not required CORE GW inputs
- individual/family bootstrap uses `org.schema.Organization.owner.*` claims for the owner/controller of the subject index
- legal organization activation uses `Person` representative semantics plus VC `memberOf` / `hasOccupation`

## API Index

The canonical API contract should live in JSDoc on exported code. The README is the linked index.

### Core draft/document helpers re-exported from `gdc-sdk-core-ts`

- [`createCommunicationDraft(...)`](../gdc-sdk-core-ts/src/communication-draft.ts)
  - Starts an in-memory communication draft.
- [`addFhirResourceToDraft(...)`](../gdc-sdk-core-ts/src/communication-draft.ts)
  - Appends a concrete FHIR resource or document.
- [`addClaimsResourceToDraft(...)`](../gdc-sdk-core-ts/src/communication-draft.ts)
  - Appends a claims-only pseudo-resource.
- [`createOutboxJobFromDraft(...)`](../gdc-sdk-core-ts/src/communication-draft.ts)
  - Freezes the draft into a transport-oriented outbox job.
- [`updateOutboxJobStatus(...)`](../gdc-sdk-core-ts/src/communication-draft.ts)
  - Updates the outbox job status in memory.
- [`IOutboxRepository`](../gdc-sdk-core-ts/src/communication-outbox.ts)
- [`OutboxRepositoryMemory`](../gdc-sdk-core-ts/src/communication-outbox.ts)
- [`createCommunicationFacade()`](../gdc-sdk-core-ts/src/communication-document-facade.ts)
  - Resolves documents from FHIR `Communication`.
- [`createHeartRateObservation(...)`](../gdc-sdk-core-ts/src/vital-signs.ts)
- [`createBodyTemperatureObservation(...)`](../gdc-sdk-core-ts/src/vital-signs.ts)
- [`createBloodPressureObservation(...)`](../gdc-sdk-core-ts/src/vital-signs.ts)

### Consent access helpers re-exported from `gdc-sdk-core-ts`

- [`groupConsentsForControllerView(...)`](../gdc-sdk-core-ts/src/consent-access.ts)
- [`evaluateRequestedAccess(...)`](../gdc-sdk-core-ts/src/consent-access.ts)
- [`getMissingPermissions(...)`](../gdc-sdk-core-ts/src/consent-access.ts)
- [`buildPermissionRequestCommunication(...)`](../gdc-sdk-core-ts/src/consent-access.ts)
- [`buildPermissionRequestCommunicationLookupQuery(...)`](../gdc-sdk-core-ts/src/consent-access.ts)

Use these helpers when the frontend needs to:

- show the controller which active permissions exist by target
- detect whether a SMART request is fully covered
- prepare the canonical permission-request `Communication`
- recover that request by identifier, thread id, or linked CID

Consent precedence in the shared model is documented as:

1. explicit deny for a concrete email
2. explicit permit for a concrete email
3. organization decision
4. jurisdiction decision
5. default deny

### Runtime configuration

- [`FrontRuntimeConfig`](src/runtime-contracts.ts)
  - Includes `persistencePolicy?` and `outboxRepositoryFactory?` so frontend runtimes can disable local persistence on shared devices or use secure local storage on confidential devices.

### Documentation rule

- JSDoc on exported code is canonical.
- README entries should link to source and summarize the main parameters.
- If a payload shape is shown in docs or validated by tests, keep its reusable source in the relevant module under `gdc-common-utils-ts/examples`.
