# TODO - Browser And Expo Reconciliation

Authoritative plan: `../gdc-sdk-core-ts/docs/MVP_BUNDLE_CHANGE_RECONCILIATION_PLAN.md`.

- [ ] Replace merge-oriented working-copy behavior with the Core analysis of
  `changesBundle` versus `responseBundle`.
- [ ] Do not publish the current merge-oriented `SubjectBundleWorkingCopy` as
  the canonical contract; it is not consumed by UHC or VetChain today.
- [ ] Keep display/ViewModel state application-owned; the SDK returns resource
  identifiers and diagnostics but does not merge Bundles.
- [ ] Preserve a compatibility export while moving pure reconciliation to
  `gdc-sdk-core-ts`.
- [ ] Add the same tests for browser and Expo: success, partial failure,
  ambiguous result, offline retry and fresh search replacement.
- [ ] Define IndexedDB and native encrypted-store adapters only behind the
  existing durable repository port; do not make them Core dependencies.
