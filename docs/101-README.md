# 101 Reading Path

> 101 note
> - Start here when you need the `gdc-sdk-front-ts` learning order.
> - `gdc-common-utils-ts` owns the canonical step-by-step editors/readers and shared payload examples.
> - This repo starts at `ProfileRuntime -> loadProfile(...) -> workspace/session -> actor facade` and owns frontend/native session bootstrap, actor-scoped facades, and app-side runtime execution.
> - Reuse lower-layer contracts and authoring helpers from `gdc-sdk-core-ts` and `gdc-common-utils-ts` instead of rebuilding them here.

## User Story Start

For a self-managed user in web or Expo/native apps, the canonical story starts
after shared authoring in `gdc-common-utils-ts`, then enters this repo at the
runtime boundary:

1. authenticate the user
2. load/unlock one protected profile
3. materialize one loaded frontend profile workspace/session
4. assume or bootstrap the actor state already owned by that user
5. only then create/read/edit/search business data

Current executable entrypoints:

- [../tests/101-frontend-profile-runtime.test.mjs](../tests/101-frontend-profile-runtime.test.mjs)
- [../tests/101-individual-controller-frontend-runtime.test.mjs](../tests/101-individual-controller-frontend-runtime.test.mjs)

## Read First

1. [gdc-sdk-core-ts/docs/101-USER_STORY_CANON.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-USER_STORY_CANON.md)
2. [gdc-common-utils-ts/docs/101-BFF_AND_CHANNEL_MESSAGE_FLOW.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-BFF_AND_CHANNEL_MESSAGE_FLOW.md)
3. [101-SDK_INTEGRATION.md](./101-SDK_INTEGRATION.md)
4. [gdc-sdk-core-ts/docs/101-SDK_FLOWS.md](https://github.com/Global-DataCare/gdc-sdk-core-ts/blob/main/docs/101-SDK_FLOWS.md)
5. [gdc-common-utils-ts/docs/101-LIFECYCLE.md](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-LIFECYCLE.md)

## Boundary

- Teach here: login/session bootstrap, frontend profile runtime, actor facades, and app-facing runtime flow.
- Reuse lower-layer builders and shared semantics from `sdk-core` and `common-utils`.
- Do not restart from raw claims or low-level editors unless the file is explicitly about them.

Canonical shape:

- inject `fetch` / crypto / secure storage / wallet / outbox adapters
- create one `ProfileRuntime`
- `loadProfile(...)`
- work from the returned workspace/session and actor-scoped facade

Separate concept:

- the unlocked user profile runtime is `ProfileRuntime`
- a tenant/BFF service wallet for DIDComm/plain, signing, encryption, or confidential storage is a different runtime concern and should not reuse the same public name

Responsibility split:

- the unlocked user profile runtime normally encrypts outbound messages and
  decrypts inbound replies
- frontend UI first decodes one `DIDComm/plain` payload into one
  `Communication`, shows metadata, and opens the attached document bundle
- for current health document cases, the canonical attached payload is one
  document bundle with `Composition` first entry
- backend search stays a separate story and must be documented with public
  FHIR search params such as `Composition.section`
- an app BFF may orchestrate several such profiles and their outboxes
- GW starts owning processing only after message reception
- do not re-teach raw `Bundle`/`Communication` plumbing here; link the shared
  lower-layer 101s instead

Canonical frontend snippet:

```ts
const workspace = await new ProfileRuntime(runtimeClient).loadProfile(loadRequest);
const actor = workspace.asIndividualController();

// When one message arrives, the frontend read path is still:
// DIDComm/plain -> Communication -> attached document bundle
```

Lower-layer canonical references:

- [gdc-common-utils-ts/__tests__/101-communication-medication-document.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-communication-medication-document.test.ts)
- [gdc-common-utils-ts/__tests__/101-communication-profile-wallet-e2e.test.ts](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/__tests__/101-communication-profile-wallet-e2e.test.ts)
