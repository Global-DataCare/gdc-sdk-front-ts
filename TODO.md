# TODO - gdc-sdk-front-ts

## NOW
1. Add frontend-facing contracts/services for loading `related-profiles` from the portal/BFF without exposing GW route details to the browser.
2. Normalize active profile cards from shared relationship summaries:
   - subject identity
   - relationship label
   - controller/member role
   - active/pending status
3. Keep the frontend surface compatible with a portal API such as `GET /api/personal/related-profiles`.
4. Preserve the separation between technical transport identity and human actor/profile identity in session state.
5. Expose the same controller surface gaps already solved at runtime on the frontend facades:
   - do not leave `searchClinicalBundle` / latest-IPS-style reads hidden behind non-facade service layers when they are part of the controller UX
   - frontend actor/profile services should not require direct `runtimeClient` escape hatches for controller searches
   - keep facade parity with the controller capabilities already declared in shared contracts
6. Add frontend-facing license view contracts/services for controller dashboards:
   - available / used / free / contracted counters
   - list/filter seats by `userClass`, app `type`, status, role, and target email
   - BFF-first DTOs so the browser never needs to understand GW vault internals
7. Add frontend-facing high-level builders/examples beyond employee-only bundle editing:
   - `RelatedPerson` request authoring examples
   - license issue/search examples
   - `Offer` / `Order` examples for controller flows that still submit batch-style payloads
   - keep the documentation centered on `BundleEditor`-style ergonomics where shared builders exist
8. Add BFF-first active-profile selection/state helpers for `related-profiles`:
   - load `related-profiles` DTOs from portal/BFF
   - normalize active vs pending relationship cards
   - select/store the active human profile separately from the transport/session identity
   - propagate the chosen active related profile through `ProfileManager` and public session helpers
9. Add dataspace discovery client contracts aligned with backend/BFF resolution:
   - hosting-operator list DTOs
   - published-provider list DTOs
   - UI card mappers for sector and coverage
10. Follow `docs/DATASPACE_DISCOVERY_FRONTEND_TODO.md` for the exact BFF-first integration scope.
11. Follow `docs/EMPLOYEES_AND_CONSENTS_FRONTEND_TASK.md` for the next employee vs consent frontend split:
   - organization-controller employee bundle create/search/read flows
   - individual-controller consent bundle + `Communication` create/read flows

## NEXT
1. Add profile/session helpers for selecting the active related profile and propagating it through UI state.
2. Add tests for frontend mapping from backend DTOs to session/profile registry entries.
3. Add dataspace discovery client tests for backend DTO mapping and optional direct-public-catalog adapters.
4. Validate whether employee result rendering should expose entry-level getters
   (`getEmail()`, `getRole()`, `getIdentifier()`) or a higher-level UI mapper.
5. Add frontend-facing grouped consent view-model helpers once the employee vs
   consent split is confirmed by the target UX.

## LATER
1. Add optional adapters for direct-vs-BFF runtime selection without changing UI-facing contracts.
