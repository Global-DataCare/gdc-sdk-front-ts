# Security

## Scope

`gdc-sdk-front-ts` is the target frontend runtime package for:

- Expo/mobile apps
- browser portal runtimes
- other frontend environments that inject platform-specific adapters

It is not yet the full migrated replacement for `gdc-sdk-client-ts`, but its security posture is already defined here.

## Security principles

### 1. Frontend runtime is not the trust anchor

The frontend may:

- collect user context
- hold session/profile state
- build actor/facade descriptors

The frontend should **not** be the place where operator trust policy is decided.

### 2. Prefer backend mediation for ICA and GW onboarding

Recommended production posture:

- frontend calls a BFF, Node backend, or Cloud Functions layer
- backend calls ICA `_verify`
- backend calls GW `_activate`

Avoid exposing direct ICA coupling as the primary production model for public apps.

### 3. Firebase / OIDC acceptance is backend-controlled

If a frontend uses Firebase Auth or another OIDC provider:

- the backend/operator must explicitly trust that provider/project
- acceptance should be configured server-side
- a valid frontend token must not by itself grant privileged onboarding behavior

### 4. Actor surface separation

A Family or Organization session may imply multiple actors, but the frontend surface must still remain actor-scoped.

Examples:

- `individual_controller` must not automatically inherit `individual_member` capabilities
- `organization_controller` must not automatically inherit `organization_employee` capabilities

The extracted helpers:

- `describeFrontActorSession`
- `describeFrontActorFacades`

must preserve that split when translating frontend namespace presence into neutral descriptors/facades.

### 5. Demo behavior must not define production contract

Legacy app/demo fallbacks are useful for UX and discovery, but they must not redefine the core backend contract.

If an endpoint is required by contract:

- production code should fail clearly when it is missing
- tests should not normalize endpoint absence into fake success

## Current migration status

- Source implementation still lives mainly in `gdc-sdk-client-ts`
- This package is the destination and should accumulate frontend runtime logic incrementally
- Shared actor/capability rules should converge toward `gdc-sdk-core-ts`
