// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DataspaceDiscoveryFilter } from 'gdc-common-utils-ts';
import type {
  HostingOperatorSemanticRecord,
  PublishedProviderCatalogRecord,
  TenantServiceSemanticRecord,
} from 'gdc-common-utils-ts';

/**
 * Input used by frontend discovery clients to request published providers from
 * a backend/BFF or, optionally, a public-catalog adapter.
 *
 * Default integration:
 * - browser/native app calls its backend
 * - backend resolves host DSP discovery and returns normalized DTOs
 */
export type ListPublishedProvidersInput = Omit<DataspaceDiscoveryFilter, 'capability' | 'requiredCapabilities'> & Readonly<{
  providerCapability: string;
}>;

/**
 * Normalized hosting-operator match DTO returned by a backend/BFF discovery
 * endpoint.
 *
 * `catalogUrl` is optional because the frontend should not need to know
 * whether the backend started from the contextualized hosting-operator
 * `/.well-known/dspace-version` URL
 * (`/host/cds-{hostCoverageScope}/{version}/{hostNetwork}/.well-known/dspace-version`)
 * and derived the DSP artifact or received a pre-normalized DTO from another
 * layer.
 */
export type HostingOperatorMatchDto = Readonly<{
  operatorDid: string;
  record: HostingOperatorSemanticRecord;
  matchedCapabilities?: readonly string[];
  catalogUrl?: string;
  title?: string;
}>;

/**
 * Normalized published-provider match DTO returned by a backend/BFF discovery
 * endpoint.
 *
 * `record.discoveryUrl` is the participant-scoped `/.well-known/dspace-version`
 * entrypoint when the backend chooses to expose it.
 *
 * `record.catalogUrl` is the derived `/dsp/catalog/dcat.json` artifact.
 */
export type PublishedProviderMatchDto = Readonly<{
  providerDid: string;
  record: PublishedProviderCatalogRecord;
  hostingOperator?: HostingOperatorSemanticRecord;
  hostingOperatorDid?: string;
  tenantSemanticRecord?: TenantServiceSemanticRecord;
  title?: string;
  hostingOperatorTitle?: string;
}>;

/**
 * Compact UI-oriented hosting-operator summary.
 */
export type HostingOperatorCard = Readonly<{
  did: string;
  title: string;
  sectors: string[];
  coverageLabel?: string;
  catalogUrl?: string;
}>;

/**
 * Compact UI-oriented provider summary.
 */
export type PublishedProviderCard = Readonly<{
  did: string;
  title: string;
  sector: string;
  capability: string;
  coverageLabel?: string;
  endpointUrl?: string;
  catalogUrl?: string;
}>;

/**
 * Frontend-facing result shape for published provider discovery.
 */
export type ListPublishedProvidersResult = Readonly<{
  providers: PublishedProviderCard[];
  hostingOperators?: HostingOperatorCard[];
}>;

/**
 * Backend/BFF discovery payload consumed by the frontend HTTP discovery
 * client before mapping into UI cards.
 */
export type ListPublishedProvidersResponseDto = Readonly<{
  providers: readonly PublishedProviderMatchDto[];
  hostingOperators?: readonly HostingOperatorMatchDto[];
}>;
