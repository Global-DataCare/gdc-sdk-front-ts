# Contributing

Read [ARCHITECTURE.md](./ARCHITECTURE.md) before adding frontend/confidential-app
facades.

## Main Rule

`gdc-sdk-front-ts` is for frontend runtime and actor-facing orchestration.

Do not introduce reusable neutral high-level semantics here when they belong in
`gdc-common-utils-ts` or `gdc-sdk-core-ts`.

Do not add canonical shared `get...` / `set...` methods here; those must be
defined in `gdc-common-utils-ts` first.

## Test Rule

Keep frontend tests step by step and high-level.

Prefer shared fixtures/examples from `gdc-common-utils-ts` and
`gdc-sdk-core-ts` instead of cloning literal payloads unless the test is
explicitly about a frontend-only edge case.
