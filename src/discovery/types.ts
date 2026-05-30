// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

/**
 * Input used by frontend discovery clients to request published providers from
 * a backend/BFF or, optionally, a public-catalog adapter.
 */
export type ListPublishedProvidersInput = Readonly<{
  sector: string;
  providerCapability: string;
  jurisdiction?: string;
  coverageScope?: string;
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
