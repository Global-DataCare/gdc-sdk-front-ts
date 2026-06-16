# Architecture

## Purpose

`gdc-sdk-front-ts` owns actor-aware frontend runtime orchestration on top of
`gdc-sdk-core-ts` and `gdc-common-utils-ts`.

This repository is the canonical place for:

- actor-facing frontend facades
- frontend runtime orchestration
- frontend runtime integration contracts
- actor/profile runtimes when they depend on frontend execution context

This repository is not the place for:

- shared neutral editors/readers/states
- node/BFF transport logic
- GW manager behavior

## Ownership Rules

Put code here when it:

- serves browser/mobile frontend integration
- represents a concrete actor-facing or UX-facing facade
- depends on frontend/runtime concerns
- implements actor-profile runtime concerns such as local profile state,
  unlock/trust flows, or frontend execution context

Do not put code here when it:

- can be shared neutrally in `common-utils`
- belongs to neutral domain facades in `sdk-core`
- belongs to node/server orchestration in `sdk-node`

## Dependency Rule

Expected layering:

1. `gdc-common-utils-ts`
2. `gdc-sdk-core-ts`
3. `gdc-sdk-front-ts`

`sdk-front` should compose lower layers, not duplicate their shared semantics.

It should not become the first home of canonical high-level `get...` / `set...`
methods on shared semantic classes.

## Actor Profile Runtime Rule

`sdk-front` and `sdk-node` are both actor-aware runtime layers.

The difference is runtime environment:

- `sdk-front` owns frontend execution concerns such as local profile state,
  trust/unlock decisions, and user-presence flows
- `sdk-node` owns server-side execution concerns such as transport/runtime
  orchestration and actor-bound execution context

Both may materialize actor profiles and operate on behalf of concrete users.

## Naming Rules

When a method prepares a helper for a later operation, keep the operation
prefix first and the detail later.

Examples:

- `prepareSearchLicenseList`
- `prepareLifecycleIndividualOrganizationDisable`

Use direct runtime verbs only for methods that actually execute work in the
frontend integration context.

## Test And Example Policy

High-level tests should prove actor-session and orchestration behavior with
minimal plumbing and shared fixtures.

Preferred anchors:

- [tests/session-descriptor.test.mjs](/Users/fernando/GITS/gdc-workspace/gdc-sdk-front-ts/tests/session-descriptor.test.mjs:1)
- [tests/actor-session.test.mjs](/Users/fernando/GITS/gdc-workspace/gdc-sdk-front-ts/tests/actor-session.test.mjs:1)
- [tests/orchestration.test.mjs](/Users/fernando/GITS/gdc-workspace/gdc-sdk-front-ts/tests/orchestration.test.mjs:1)

Frontend tests should reuse examples and high-level data from
`gdc-common-utils-ts` and `gdc-sdk-core-ts` where possible rather than cloning
literal fixtures.

Prefer step-by-step tests that make the actor flow explicit without introducing
UI plumbing unless the test is specifically about that integration boundary.
