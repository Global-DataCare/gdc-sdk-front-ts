# SDK Related Profiles 101 for Frontends

Frontend apps should not talk to GW directly for this feature.

Use the portal/backend endpoint:

- `GET /api/personal/related-profiles`

## Rule

The browser asks the portal backend:

- which subjects am I related to?
- what role do I have on each subject?

The portal backend calls GW using `gdc-sdk-node-ts`.

## Frontend responsibilities

- keep actor session state
- call the backend endpoint
- render the returned profile list
- let the user choose the active related profile

## Do not do this in the frontend

- do not call raw `RelatedPerson/_search`
- do not build GW route paths in browser code
- do not hardcode flat FHIR claim names for this feature

## Expected response

Use the shared DTO from:

- `gdc-sdk-front-ts/src/types.ts`

Current shape:

```ts
export type FrontRelatedProfileSearchResult = {
  actorIdentifier: string;
  total: number;
  data: FrontRelatedProfileSummary[];
};
```

## Typical UI

The UI usually needs:

- subject label
- relationship label
- role
- controller flag
- active/inactive state

## Minimal service usage

Current frontend-facing placeholder:

- `IndividualService.listRelatedProfiles(...)`

In product code this should call the backend/BFF endpoint and map the response to the shared frontend DTO.
