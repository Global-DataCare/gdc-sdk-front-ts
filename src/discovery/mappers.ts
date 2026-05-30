// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  HostingOperatorSemanticRecord,
  PublishedProviderCatalogRecord,
} from 'gdc-common-utils-ts';
import type { HostingOperatorCard, PublishedProviderCard } from './types.js';

function titleFromDid(did: string): string {
  const normalized = String(did || '').trim();
  if (!normalized) return 'Unknown';
  const suffix = normalized.split(':').pop() || normalized;
  return suffix.replace(/[-_]+/g, ' ');
}

/**
 * Maps a normalized hosting-operator semantic record to a compact UI card.
 */
export function mapHostingOperatorRecordToCard(
  record: HostingOperatorSemanticRecord,
  input: { catalogUrl?: string; title?: string } = {},
): HostingOperatorCard {
  return {
    did: record.subjectId || '',
    title: input.title || titleFromDid(record.subjectId || ''),
    sectors: record.categories,
    coverageLabel: record.areaServed.join(', ') || record.coverageScope,
    catalogUrl: input.catalogUrl,
  };
}

/**
 * Maps a published-provider catalog entry to a compact UI card.
 */
export function mapPublishedProviderRecordToCard(
  record: PublishedProviderCatalogRecord,
  input: { title?: string } = {},
): PublishedProviderCard {
  return {
    did: record.providerDid,
    title: input.title || titleFromDid(record.providerDid),
    sector: record.category,
    capability: record.serviceType,
    coverageLabel: record.areaServed,
    endpointUrl: record.endpointUrl,
    catalogUrl: record.catalogUrl,
  };
}

/**
 * Filters provider cards by the requested capability at the presentation layer.
 */
export function filterPublishedProviderCardsByCapability(
  cards: readonly PublishedProviderCard[],
  capability: string,
): PublishedProviderCard[] {
  const normalized = String(capability || '').trim();
  return cards.filter((card) => card.capability === normalized);
}
