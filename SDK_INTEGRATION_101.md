# SDK Integration 101 for Frontend / Native Apps

This guide is for a developer integrating `gdc-sdk-front-ts` into:

- a native app
- Expo / React Native
- a web portal

It explains the current bootstrap/session/document API in simple terms and shows the recommended patterns while the convergence work is still in progress.

Current convergence status:

- `gdc-sdk-core-ts` now defines runtime-neutral contracts for identity stores, discovery facades, canonical activation payloads, and provider DID to endpoint resolution.
- `gdc-sdk-front-ts` still needs to wire those contracts into real browser/native runtime adapters.

## 1. Package roles

- `gdc-common-utils-ts`
  - low-level shared utilities, crypto, DID/DIDComm/FHIR helpers
- `gdc-sdk-core-ts`
  - runtime-neutral communication/document/draft helpers
- `gdc-sdk-front-ts`
  - frontend-facing session/profile bootstrap and app-side services

Reference for CORE GW trust/VC semantics used by the examples below:

- [gwtemplate-node-ts/docs/API_CORE_INTEGRATION.md](../gwtemplate-node-ts/docs/API_CORE_INTEGRATION.md)
  - activation trust rules
  - `credentialSubject.memberOf.taxID`
  - `credentialSubject.hasOccupation.identifier.value`

## 2. Current discovery status

The final first-class discovery API for:

- one or more ICAs
- node operators resolved from those ICAs
- service providers / individual index services published by node operators

is still converging.

Today, the recommended frontend pattern is:

1. start from one or more ICA `did:web` values or known provider URLs
2. resolve provider metadata through `did:web` and `/.well-known`
3. pick the provider DID/base URL
4. initialize the frontend session against that provider

What already exists today:

- `ClientSDK.fetchWellKnownApiConfig(source)`
- `ClientSDK.fetchSupportedFields(source)`
- provider bootstrap from URL or `did:web`
- shared core contracts for:
  - `IdentityStore`
  - `DiscoveryFacade`
  - canonical `_activate` payload building
  - provider DID to `service[]` endpoint selection

What is still missing in the frontend runtime:

- first-class provider/operator/ICA discovery orchestration
- explicit storage of `deviceIdentity`, `actorIdentity`, and `providerIdentity`
- controller bootstrap helper that builds `_activate` with `vp_token + controller.*`

Reusable payload source of truth for the examples in this guide:

- `gdc-common-utils-ts/examples/frontend-session`
- `gdc-common-utils-ts/examples/professional`
- `gdc-common-utils-ts/examples/api-flow-examples`

CORE vs extension note:

- keep technical transport identity, provider identity, and actor identity separate
- CORE canonical examples are not phone-first
- phone-driven consent or notification UX belongs to extension layers

Semantic split to keep explicit:

- individual/family bootstrap
  - the human controller is modeled as owner of the subject index organization
  - frontend builders should therefore expect `org.schema.Organization.owner.email` / `owner.telephone`
- legal organization activation
  - the controller is modeled as `Person` / legal representative member of a legal organization
  - activation trust and VC binding use `credentialSubject.memberOf.*` plus `credentialSubject.hasOccupation.*`

## 3. Install and imports

```ts
import {
  ClientSDK,
  createCommunicationDraft,
  addFhirResourceToDraft,
  createOutboxJobFromDraft,
  createCommunicationFacade,
  createHeartRateObservation,
  createBloodPressureObservation,
  createBodyTemperatureObservation,
} from 'gdc-sdk-front-ts';

import { CryptographyService } from 'gdc-common-utils-ts';
import {
  ClaimsPersonSchemaorg,
  DataspaceSectors,
  initializeCommunicationIdentityFromSeed,
  buildOrganizationDidWeb,
  buildProfessionalDidWeb,
  buildIndividualDidWeb,
  HealthcareActorRoles,
  HealthcareBasicSections,
  HealthcareConsentPurposes,
  HealthcareConsentActions,
  DeviceUserClasses,
  DeviceAppTypes,
  ResourceTypesFhirR4,
} from 'gdc-common-utils-ts';
```

## 4. Pick persistence policy by device trust

Use memory-only mode on shared devices such as public kiosks or library computers.

Use secure local persistence on confidential personal devices.

Conceptually:

- shared/public device
  - `persistencePolicy.mode = 'memory'`
- confidential personal device
  - `persistencePolicy.mode = 'local-secure'`

## 5. Initialize technical communication identity from seed

This is the profile/device/portal technical identity.

It is not the same as the personal wallet/controller identity of the
professional or individual who may later sign access-token or authorization
requests. This identity is for securing communications.

Pending frontend work:

- separate persistence/orchestration for technical transport identity and human actor identity
- provider DID document resolution cached alongside the active app session

```ts
const cryptography = new CryptographyService(cryptoHelper);

const deviceIdentity = await initializeCommunicationIdentityFromSeed({
  entityId: 'did:web:portal.example.org:user-frontend',
  cryptography,
  includeVcSigningKey: true,
  // Optional explicit seed. If omitted, deterministic mode derives from entityId.
  // seedMaterial: crypto.getRandomValues(new Uint8Array(32)),
});
```

Useful outputs:

- `deviceIdentity.commSigningKeyPair.publicJWKey.kid`
- `deviceIdentity.commEncryptionKeyPair.publicJWKey.kid`
- `deviceIdentity.headers.jwsProtected`
- `deviceIdentity.headers.jweHeader`

If you omit `seedMaterial`:

- `mode = deterministic` derives seeds from `entityId`
- `mode = random` lets the cryptography engine generate random seed material internally

## 6. Create the frontend SDK bootstrap object

```ts
const sdk = new ClientSDK(
  {
    network,
    api,
    fetcher: fetch,
  },
  {
    name: 'Demo Health App',
    version: '0.1.0',
  },
  wallet,
  verifier,
  'did:web:ica.example.org',
);
```

## 7. Resolve provider metadata

### From URL

```ts
const apiConfig = await sdk.fetchWellKnownApiConfig('https://provider.example.org');
```

### From `did:web`

```ts
sdk.addMockDidDocument('did:web:provider.example.org', {
  id: 'did:web:provider.example.org',
  service: [
    {
      id: '#api',
      type: 'GatewayApi',
      serviceEndpoint: 'https://provider.example.org/',
    },
  ],
});

const apiConfig = await sdk.fetchWellKnownApiConfig('did:web:provider.example.org');
const supportedFields = await sdk.fetchSupportedFields('did:web:provider.example.org');
```

This is the current lightweight discovery path while the ICA/node operator/DCAT3 discovery API is still being converged.

## 8. Initialize a user/profile session

```ts
const session = await sdk.initializeSession(
  {
    profileId: 'profile-001',
    email: 'user@example.org',
    role: 'individual',
    providerDid: 'did:web:provider.example.org',
    appType: 'individual',
  },
  createVaultForProfile,
);
```

## 9. Professional role and permission examples

Shared examples for professional access scenarios live in:

- `gdc-common-utils-ts/examples/professional`

Those examples cover reusable combinations of:

- professional role such as physician, nursing professional, or paramedic
- actor target such as direct email, organization, or jurisdiction
- consent purpose
- section-level consent actions over an individual
- SMART scopes requested against GW CORE
- expected FHIR resource types after access
- expected allow/deny outcome for the token request depending on current active consent state

Source payload reference:

- `gdc-common-utils-ts/examples/frontend-session`
  - `EXAMPLE_PROFILE_SESSION_INPUT`

This returns a `ProfileManager`.

## 9. What `ProfileManager` gives you

Depending on role/capabilities, the session may expose:

- `session.common.auth`
- `session.orgAdmin`
- `session.familyAdmin`
- `session.individual`
- `session.professional`

It also provides convenience methods directly on the manager.

## 10. Organization/professional flow from frontend

### Create an organization employee

```ts
const organizationDid = buildOrganizationDidWeb({
  hostDidWeb: 'did:web:api.example.org',
  tenantId: 'acme-id',
  jurisdiction: 'ES',
  sector: DataspaceSectors.HealthCare,
});

const professionalDid = buildProfessionalDidWeb({
  organizationDidWeb: organizationDid,
  email: 'doctor@example.org',
  role: HealthcareActorRoles.Physician,
});

const employee = await session.createOrganizationEmployee(
  'did:web:provider.example.org',
  '<id-token>',
  {
    email: 'doctor@example.org',
    role: HealthcareActorRoles.Physician,
    userClass: DeviceUserClasses.Employee,
    type: DeviceAppTypes.Mobile,
  },
);
```

When you build equivalent claims for the backend/GW side, use canonical `org.schema.Person.*` keys:

```ts
const employeeClaims = {
  '@context': 'org.schema',
  [ClaimsPersonSchemaorg.identifier]: professionalDid,
  [ClaimsPersonSchemaorg.email]: 'doctor@example.org',
  [ClaimsPersonSchemaorg.hasOccupationalRoleValue]: HealthcareActorRoles.Physician,
  [ClaimsPersonSchemaorg.memberOfTaxId]: 'acme-id',
};
```

## 11. Individual flow from frontend

### Bootstrap subject organization/index

```ts
const bootstrap = await session.bootstrapSubjectOrganizationIndex({
  registrationClaims: {
    sub: 'did:web:api.example.org:individual:subject-001',
  },
  providerDid: 'did:web:provider.example.org',
  idToken: '<id-token>',
});
```

### Grant professional access

```ts
const subjectDid = buildIndividualDidWeb({
  organizationDidWeb: organizationDid,
  subjectId: 'subject-001',
});
const professionalEmail = 'doctor@example.org';

const consent = await session.grantProfessionalAccess({
  subjectDid,
  actorId: professionalEmail,
  actorRole: HealthcareActorRoles.Physician,
  purpose: HealthcareConsentPurposes.Treatment,
  actions: [HealthcareConsentActions.PatientSummaryDocument],
  providerDid: 'did:web:provider.example.org',
  requiredScope: 'user/*.write',
  idToken: '<id-token>',
});
```

In a real integration, the controller will often know the professional email
or, in veterinary scenarios, a `tel:+...` identifier before knowing a full
professional `did:web`. All of these map to the flat `Consent.actor-identifier`
claim.

### Import IPS or FHIR

```ts
const ingest = await session.importIpsOrFhirAndUpdateIndex({
  compositionPayload: ipsBundle,
  providerDid: 'did:web:provider.example.org',
  requiredScope: 'user/*.write',
  idToken: '<id-token>',
  format: 'org.hl7.fhir.r4',
});
```

## 12. Compose a communication draft in memory

```ts
let draft = createCommunicationDraft({
  subject: subjectDid,
  sender: professionalDid,
  recipient: 'did:web:provider.example.org',
  noteText: 'Vitals update',
});
```

## 13. Add vital signs to the draft

```ts
draft = addFhirResourceToDraft(
  draft,
  createHeartRateObservation({
    subject: subjectDid,
    effectiveDateTime: '2026-05-22T10:00:00Z',
    value: 72,
  }),
);

draft = addFhirResourceToDraft(
  draft,
  createBloodPressureObservation({
    subject: subjectDid,
    effectiveDateTime: '2026-05-22T10:00:00Z',
    systolic: 120,
    diastolic: 78,
  }),
);
```

## 14. Freeze the draft into an outbox job

```ts
const job = createOutboxJobFromDraft(draft, {
  batchOptions: {
    requestUrl: 'individual/org.hl7.fhir.r4/Communication',
  },
});
```

Use this split mentally:

- `draft`
  - editable in-memory object
- `job`
  - transport snapshot

## 15. Read documents back from a communication

```ts
const communicationFacade = createCommunicationFacade();
const resolved = communicationFacade.getDocument(job.payload);

if (resolved?.kind === 'fhir') {
  const fhirDoc = communicationFacade.getFhirDocument(job.payload);
  const sections = fhirDoc?.getSections() || [];
  const observations = fhirDoc?.getResources(ResourceTypesFhirR4.Observation) || [];
}
```

This hides:

- direct bundle attachment
- embedded `DocumentReference`
- attachment metadata lookup

## 16. Recommended simple setup for evaluations

For demo/evaluation use:

1. one ICA `did:web`
2. one provider `did:web` or base URL
3. one frontend profile
4. one in-memory or secure-local draft flow
5. one consent grant
6. one IPS or vital signs communication

## 17. Current limitations

- the full ICA -> node operator -> DCAT3 discovery chain is not yet a dedicated typed frontend API
- the frontend package is still in convergence and some app-facing services remain lightweight placeholders
- secure signed/encrypted DIDComm is not yet the default demo path

## 18. Where to look next

- [README.md](README.md)
- [../gdc-sdk-core-ts/README.md](../gdc-sdk-core-ts/README.md)
- `gdc-common-utils-ts`
