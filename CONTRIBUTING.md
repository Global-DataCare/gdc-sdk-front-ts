# Contributing

Read [ARCHITECTURE.md](./ARCHITECTURE.md) before adding frontend/confidential-app
facades.

## Main Rule

`gdc-sdk-front-ts` is for frontend runtime and actor-facing orchestration.

Do not introduce reusable neutral high-level semantics here when they belong in
`gdc-common-utils-ts` or `gdc-sdk-core-ts`.

Do not add canonical shared `get...` / `set...` methods here; those must be
defined in `gdc-common-utils-ts` first.

For actor runtime work in `sdk-front`, keep this split explicit:

- `JobManager` = common profile/session orchestration concept
- `Outbox` = logical pending work owned by the profile/runtime
- `Queue` = frontend scheduling/execution layer
- `Vault...` = persistence adapter
- `loadProfile(...)` / `closeProfile(...)` = runtime lifecycle entry/exit

Concrete frontend implementations belong here, but keep the specialization at
the end of the name, for example:

- `createJobManagerInMemory(...)`
- future `createJobManagerSqlite(...)`
- `VaultMemory`
- future `VaultSqlite`
- `UserProfileIndexStoreInMemory`
- `UserProfileIndexStoreSecureStorage`
- `UserProfileVaultSecureStorage`
- future `UserProfileIndexStoreIndexedDb`

Do not rename the common abstraction itself as if offline/storage were its
primary identity.

Programming/autocomplete rule:

- start all specialized implementations with the same shared concept
- end the name with the concrete specialization
- prefer:
  - `UserProfileIndexStoreSecureStorage`
  - `UserProfileIndexStoreIndexedDb`
- avoid:
  - `SecureStorageUserProfileIndexStore`
  - `IndexedDbUserProfileIndexStore`

## Test Rule

Keep frontend tests step by step and high-level.

Prefer shared fixtures/examples from `gdc-common-utils-ts` and
`gdc-sdk-core-ts` instead of cloning literal payloads unless the test is
explicitly about a frontend-only edge case.

Use the same header block at the top of every test file, immediately below the
copyright line, so the test intent is visible before the imports:

- `101 note` or `Teaching goal` comment block
- one-sentence contract summary
- reused shared fixtures/examples
- positive path and at least one negative/validation path
- compatibility path when legacy aliases or fallback behavior exist
- no ad hoc literals when shared fixtures exist
- helper functions stay in dedicated helper modules, not beside the class

TDD rule:

1. add or update the failing test first
2. implement the minimum change to pass
3. add the compatibility case if the API supports legacy inputs
4. refactor without changing behavior
