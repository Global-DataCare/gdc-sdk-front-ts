import test from 'node:test';
import assert from 'node:assert/strict';
import { DataspaceSectors, ServiceCapabilityToken } from 'gdc-common-utils-ts/constants';
import {
  EXAMPLE_COVERAGE_SCOPE_EU,
  EXAMPLE_HOSTING_OPERATOR_CATALOG_URL,
  EXAMPLE_HOSTING_OPERATOR_DID,
  EXAMPLE_JURISDICTION,
  EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
  EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
  EXAMPLE_TENANT_SERVICE_DID,
} from 'gdc-common-utils-ts/examples/shared';

import {
  filterPublishedProviderCardsByCapability,
  mapHostingOperatorRecordToCard,
  mapPublishedProviderRecordToCard,
} from '../dist/index.js';

test('frontend discovery maps hosting operators into UI cards', () => {
  const card = mapHostingOperatorRecordToCard({
    subjectId: EXAMPLE_HOSTING_OPERATOR_DID,
    serviceTypes: [ServiceCapabilityToken.IndexProvider],
    categories: [DataspaceSectors.AnimalCare],
    areaServed: [EXAMPLE_COVERAGE_SCOPE_EU, EXAMPLE_JURISDICTION],
    addressCountry: EXAMPLE_JURISDICTION,
    coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
  }, {
    catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_URL,
  });

  assert.equal(card.did, EXAMPLE_HOSTING_OPERATOR_DID);
  assert.equal(card.sectors[0], DataspaceSectors.AnimalCare);
  assert.equal(card.coverageLabel, `${EXAMPLE_COVERAGE_SCOPE_EU}, ${EXAMPLE_JURISDICTION}`);
});

test('frontend discovery maps published providers into UI cards', () => {
  const card = mapPublishedProviderRecordToCard({
    providerDid: EXAMPLE_TENANT_SERVICE_DID,
    serviceType: ServiceCapabilityToken.IndexProvider,
    category: DataspaceSectors.AnimalCare,
    areaServed: EXAMPLE_COVERAGE_SCOPE_EU,
    endpointUrl: EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
    catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_URL,
  });

  assert.equal(card.did, EXAMPLE_TENANT_SERVICE_DID);
  assert.equal(card.capability, ServiceCapabilityToken.IndexProvider);
  assert.equal(card.sector, DataspaceSectors.AnimalCare);
});

test('frontend discovery filters provider cards by capability', () => {
  const filtered = filterPublishedProviderCardsByCapability([
    {
      did: EXAMPLE_TENANT_SERVICE_DID,
      title: EXAMPLE_TENANT_SERVICE_DID,
      sector: DataspaceSectors.AnimalCare,
      capability: ServiceCapabilityToken.IndexProvider,
    },
    {
      did: EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
      title: EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
      sector: DataspaceSectors.AnimalCare,
      capability: ServiceCapabilityToken.DigitalTwinProvider,
    },
  ], ServiceCapabilityToken.IndexProvider);

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.did, EXAMPLE_TENANT_SERVICE_DID);
});
