import test from 'node:test';
import assert from 'node:assert/strict';
import { DataspaceSectors, ServiceCapabilityToken } from 'gdc-common-utils-ts/constants';
import {
  EXAMPLE_COVERAGE_SCOPE_EU,
  EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
  EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
  EXAMPLE_HOSTING_OPERATOR_DID,
  EXAMPLE_JURISDICTION,
  EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
  EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
  EXAMPLE_TENANT_SERVICE_DID,
} from 'gdc-common-utils-ts/examples/shared';

import {
  filterPublishedProviderCardsByCapability,
  HttpDataspaceDiscoveryClient,
  mapHostingOperatorMatchToCard,
  mapHostingOperatorRecordToCard,
  mapPublishedProviderMatchToCard,
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
    catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
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
      discoveryUrl: EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
      catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
    });

  assert.equal(card.did, EXAMPLE_TENANT_SERVICE_DID);
  assert.equal(card.capability, ServiceCapabilityToken.IndexProvider);
  assert.equal(card.sector, DataspaceSectors.AnimalCare);
});

test('frontend discovery maps backend match DTOs into UI cards', () => {
  const providerCard = mapPublishedProviderMatchToCard({
    providerDid: EXAMPLE_TENANT_SERVICE_DID,
    record: {
      providerDid: EXAMPLE_TENANT_SERVICE_DID,
      serviceType: ServiceCapabilityToken.IndexProvider,
      category: DataspaceSectors.AnimalCare,
      areaServed: EXAMPLE_COVERAGE_SCOPE_EU,
      endpointUrl: EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
      discoveryUrl: EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
      catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
    },
  });
  const hostCard = mapHostingOperatorMatchToCard({
    operatorDid: EXAMPLE_HOSTING_OPERATOR_DID,
    record: {
      subjectId: EXAMPLE_HOSTING_OPERATOR_DID,
      serviceTypes: [ServiceCapabilityToken.IndexProvider],
      categories: [DataspaceSectors.AnimalCare],
      areaServed: [EXAMPLE_COVERAGE_SCOPE_EU, EXAMPLE_JURISDICTION],
      addressCountry: EXAMPLE_JURISDICTION,
      coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
    },
    catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
  });

  assert.equal(providerCard.did, EXAMPLE_TENANT_SERVICE_DID);
  assert.equal(hostCard.did, EXAMPLE_HOSTING_OPERATOR_DID);
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

test('HttpDataspaceDiscoveryClient maps backend discovery DTOs into UI cards', async () => {
  const client = new HttpDataspaceDiscoveryClient({
    endpointUrl: 'https://portal.example.org/api/dataspace-discovery/providers',
    fetcher: async (_input, init) => {
      assert.equal(init?.method, 'POST');
      assert.match(String(init?.body || ''), /"providerCapability":"indexing\.cruds"/);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          providers: [{
            providerDid: EXAMPLE_TENANT_SERVICE_DID,
            record: {
              providerDid: EXAMPLE_TENANT_SERVICE_DID,
              serviceType: ServiceCapabilityToken.IndexProvider,
              category: DataspaceSectors.AnimalCare,
              areaServed: EXAMPLE_COVERAGE_SCOPE_EU,
              endpointUrl: EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
              discoveryUrl: EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
              catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
            },
            hostingOperatorDid: EXAMPLE_HOSTING_OPERATOR_DID,
          }],
          hostingOperators: [{
            operatorDid: EXAMPLE_HOSTING_OPERATOR_DID,
            record: {
              subjectId: EXAMPLE_HOSTING_OPERATOR_DID,
              serviceTypes: [ServiceCapabilityToken.IndexProvider],
              categories: [DataspaceSectors.AnimalCare],
              areaServed: [EXAMPLE_COVERAGE_SCOPE_EU, EXAMPLE_JURISDICTION],
              addressCountry: EXAMPLE_JURISDICTION,
              coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
            },
            catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
          }],
        }),
      };
    },
  });

  const result = await client.listPublishedProviders({
    sector: DataspaceSectors.AnimalCare,
    providerCapability: ServiceCapabilityToken.IndexProvider,
    coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
  });

  assert.equal(result.providers.length, 1);
  assert.equal(result.providers[0]?.did, EXAMPLE_TENANT_SERVICE_DID);
  assert.equal(result.providers[0]?.endpointUrl, EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL);
  assert.equal(result.hostingOperators?.[0]?.did, EXAMPLE_HOSTING_OPERATOR_DID);
});

test('HttpDataspaceDiscoveryClient sends app identity and custom headers to the BFF', async () => {
  const requests = [];
  const client = new HttpDataspaceDiscoveryClient({
    endpointUrl: '/api/personal/dataspace-discovery/providers',
    appInfo: {
      appId: 'portal.globaldatacare.es',
      appVersion: 'v2.4.0',
      appType: 'Family',
      sector: 'animal-care',
    },
    requestHeaders: {
      Authorization: 'Bearer test-token',
    },
    fetcher: async (url, init) => {
      requests.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({ providers: [] }),
      };
    },
  });

  await client.listPublishedProviders({
    sector: DataspaceSectors.AnimalCare,
    providerCapability: ServiceCapabilityToken.IndexProvider,
    jurisdiction: EXAMPLE_JURISDICTION,
    coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
  });

  assert.deepEqual(requests, [{
    url: '/api/personal/dataspace-discovery/providers',
    init: {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        AppId: 'es.globaldatacare.portal',
        AppVersion: 'v2.4.0',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        sector: DataspaceSectors.AnimalCare,
        providerCapability: ServiceCapabilityToken.IndexProvider,
        jurisdiction: EXAMPLE_JURISDICTION,
        coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
      }),
    },
  }]);
});

test('HttpDataspaceDiscoveryClient derives hosting operators from provider matches when the BFF omits them', async () => {
  const client = new HttpDataspaceDiscoveryClient({
    fetcher: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        providers: [
          {
            providerDid: EXAMPLE_TENANT_SERVICE_DID,
            record: {
              providerDid: EXAMPLE_TENANT_SERVICE_DID,
              serviceType: ServiceCapabilityToken.IndexProvider,
              category: DataspaceSectors.AnimalCare,
              areaServed: EXAMPLE_COVERAGE_SCOPE_EU,
              endpointUrl: EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
              discoveryUrl: EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
              catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
            },
            hostingOperatorDid: EXAMPLE_HOSTING_OPERATOR_DID,
            hostingOperatorTitle: 'Host A',
            hostingOperator: {
              subjectId: EXAMPLE_HOSTING_OPERATOR_DID,
              serviceTypes: [ServiceCapabilityToken.IndexProvider],
              categories: [DataspaceSectors.AnimalCare],
              areaServed: [EXAMPLE_COVERAGE_SCOPE_EU, EXAMPLE_JURISDICTION],
              addressCountry: EXAMPLE_JURISDICTION,
              coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
            },
          },
          {
            providerDid: EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
            record: {
              providerDid: EXAMPLE_SECONDARY_TENANT_SERVICE_DID,
              serviceType: ServiceCapabilityToken.IndexProvider,
              category: DataspaceSectors.AnimalCare,
              areaServed: EXAMPLE_COVERAGE_SCOPE_EU,
              endpointUrl: EXAMPLE_PROVIDER_PUBLISHED_ENDPOINT_URL,
              discoveryUrl: EXAMPLE_HOSTING_OPERATOR_DSPACE_VERSION_URL,
              catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
            },
            hostingOperatorDid: EXAMPLE_HOSTING_OPERATOR_DID,
            hostingOperatorTitle: 'Host A',
            hostingOperator: {
              subjectId: EXAMPLE_HOSTING_OPERATOR_DID,
              serviceTypes: [ServiceCapabilityToken.IndexProvider],
              categories: [DataspaceSectors.AnimalCare],
              areaServed: [EXAMPLE_COVERAGE_SCOPE_EU, EXAMPLE_JURISDICTION],
              addressCountry: EXAMPLE_JURISDICTION,
              coverageScope: EXAMPLE_COVERAGE_SCOPE_EU,
            },
          },
        ],
      }),
    }),
  });

  const result = await client.listPublishedProviders({
    sector: DataspaceSectors.AnimalCare,
    providerCapability: ServiceCapabilityToken.IndexProvider,
  });

  assert.equal(result.providers.length, 2);
  assert.deepEqual(result.hostingOperators, [{
    did: EXAMPLE_HOSTING_OPERATOR_DID,
    title: 'Host A',
    sectors: [DataspaceSectors.AnimalCare],
    coverageLabel: `${EXAMPLE_COVERAGE_SCOPE_EU}, ${EXAMPLE_JURISDICTION}`,
    catalogUrl: EXAMPLE_HOSTING_OPERATOR_CATALOG_ARTIFACT_URL,
  }]);
});
