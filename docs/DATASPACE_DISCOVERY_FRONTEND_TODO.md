# Frontend Discovery 101

Version:
- Frontend runtime release: `0.6.0`
- Depends on: `gdc-common-utils-ts@1.12.0`
- Depends on normalized node/BFF discovery DTOs
- Date: `2026-06-01`

## Purpose

This document defines the frontend-facing discovery surface for web/native apps.

The default frontend integration path is:

1. portal or app backend resolves dataspace discovery
2. frontend consumes backend DTOs

Direct public-catalog consumption may exist as an optional mode, but must not be
the default path for portal/browser applications.

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

const client = new HttpDataspaceDiscoveryClient({
  endpointUrl: '/api/dataspace-discovery/providers',
  requestHeaders: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const result = await client.listPublishedProviders({
  sector: 'animal-care',
  jurisdiction: 'ES',
  coverageScope: 'EU',
  providerCapability: ServiceCapabilityToken.IndexProvider,
});

for (const provider of result.providers) {
  console.log(provider.did, provider.title, provider.endpointUrl);
}
```

Expected backend behavior behind that endpoint:

1. resolve hosting operators from normalized semantic records
2. fetch host `/.well-known/dspace-version`
3. derive `/dsp/catalog/dcat.json`
4. return normalized provider/operator DTOs to the frontend

## Example Rules

Do not hardcode real organizations or domains in frontend docs/tests.

Prefer:

- `Provider A`
- `Host A`
- `provider.example.org`
- `host.example.org`
