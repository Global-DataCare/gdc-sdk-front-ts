# Dataspace Discovery Frontend TODO

Version:
- Planned runtime release: `0.6.0`
- Depends on: `gdc-common-utils-ts@1.12.0`
- Depends on node/BFF discovery contract alignment
- Branch baseline: `feat/dataspace-discovery-foundation`
- Date: `2026-05-29`

## Purpose

This document defines the frontend-facing discovery surface for web/native apps.

The default frontend integration path is:

1. portal or app backend resolves dataspace discovery
2. frontend consumes backend DTOs

Direct public-catalog consumption may exist as an optional mode, but must not be
the default path for portal/browser applications.

## Public API To Add

Add a frontend discovery client module under:

- `src/discovery/DataspaceDiscoveryClient.ts`
- `src/discovery/types.ts`
- `src/discovery/index.ts`

Expected public surface:

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

## JSDoc To Generate

Required JSDoc targets:

- `DataspaceDiscoveryClient`
- all exported DTOs
- mapper helpers from backend DTOs to UI cards

Each JSDoc block must state:

- default BFF-first integration model
- optional direct-public-catalog mode as secondary path
- no tenant-host private linkage assumptions on the client

## Tests To Add

Add:

- `tests/dataspace-discovery-client.test.mjs`

Coverage minimum:

- backend DTO to frontend card mapping
- sector and coverage label normalization
- provider capability filtering at presentation layer

## Example Rules

Do not hardcode real organizations or domains in frontend docs/tests.

Prefer:

- `Provider A`
- `Host A`
- `provider.example.org`
- `host.example.org`
