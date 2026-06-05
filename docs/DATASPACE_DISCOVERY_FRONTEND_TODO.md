# Frontend Discovery 101

## Purpose

This document defines the frontend-facing discovery surface for web/native apps.

The default frontend integration path is:

1. portal or app backend resolves dataspace discovery
2. frontend consumes backend DTOs

Direct public-catalog consumption may exist as an optional mode, but must not be
the default path for portal/browser applications.

## Main idea

Frontend developers should think in this simple flow:

1. choose `sector`
2. choose `jurisdiction`
3. choose provider capability:
   - `IndexProvider`
   - `DigitalTwinProvider`
4. call the backend/BFF
5. render the returned provider and host cards

The frontend should not need to know:

- `networkType`
- ICA defaults
- host bootstrap plans
- `/.well-known/dspace-version`
- `/dsp/catalog/dcat.json`

Those belong to the backend.

## Public API

Current frontend discovery module:

- `src/discovery/DataspaceDiscoveryClient.ts`
- `src/discovery/types.ts`
- `src/discovery/index.ts`

Current public surface:

- `interface DataspaceDiscoveryClient`
- `type ListPublishedProvidersInput`
- `type ListPublishedProvidersResult`
- `type HostingOperatorCard`
- `type PublishedProviderCard`

## Frontend Rules

- do not parse raw tenant VCs in the browser as the primary integration path
- consume normalized DTOs from backend/BFF when available
- keep UI-facing contracts stable even if backend discovery internals evolve
- preserve sector vs coverage distinction:
  - sector from `category`
  - coverage from `areaServed` or inferred EU scope

## Optional Direct Mode

If direct public-catalog discovery is added later:

- keep it behind an explicit adapter
- reuse shared semantic parsing from `gdc-common-utils-ts`
- avoid embedding credentials or privileged topology assumptions

## JSDoc Targets

Keep these exports documented:

- `DataspaceDiscoveryClient`
- all exported DTOs
- mapper helpers from backend DTOs to UI cards

Each JSDoc block must state:

- default BFF-first integration model
- optional direct-public-catalog mode as secondary path
- no tenant-host private linkage assumptions on the client

## Tests

Coverage minimum:

- backend DTO to frontend card mapping
- sector and coverage label normalization
- provider capability filtering at presentation layer

Executable reference:

- [`tests/dataspace-discovery-client.test.mjs`](../tests/dataspace-discovery-client.test.mjs)

## Copy/Paste Backend DTO Consumption

```ts
import { HttpDataspaceDiscoveryClient } from 'gdc-sdk-front-ts';
import { ServiceCapabilityToken } from 'gdc-common-utils-ts/constants';

// Frontend client for one backend endpoint.
const client = new HttpDataspaceDiscoveryClient({
  endpointUrl: '/api/dataspace-discovery/providers',
  requestHeaders: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// Ask the backend for one business use case:
// "show me index providers for animal-care in ES".
const result = await client.listPublishedProviders({
  sector: 'animal-care',
  jurisdiction: 'ES',
  coverageScope: 'EU',
  providerCapability: ServiceCapabilityToken.IndexProvider,
});

// Render the returned cards in the UI.
for (const provider of result.providers) {
  console.log(provider.did, provider.title, provider.endpointUrl);
}
```

Expected backend behavior behind that endpoint:

1. load configured defaults or live discovery sources
2. resolve hosting operators for one `sector + jurisdiction`
3. fetch the contextualized hosting-operator `/.well-known/dspace-version`
   when provider catalogs are needed
4. derive `/dsp/catalog/dcat.json`
5. return normalized provider/operator DTOs to the frontend

## What the frontend should remember

- frontend asks only for:
  - `sector`
  - `jurisdiction`
  - `providerCapability`
- backend owns:
  - `networkType`
  - `default-first`
  - ICA/default host bootstrap
  - host catalog crawling
- frontend renders:
  - provider title
  - provider did
  - provider endpoint URL
  - host title when present
  - coverage labels

## Example Rules

Do not hardcode real organizations or domains in frontend docs/tests.

Prefer:

- `Provider A`
- `Host A`
- `provider.example.org`
- `host.example.org`
