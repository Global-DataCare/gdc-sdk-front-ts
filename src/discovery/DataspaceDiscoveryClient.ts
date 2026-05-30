// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { buildAppHeaders, resolveAppInfo, type AppInfo } from 'gdc-sdk-core-ts';
import {
  filterPublishedProviderCardsByCapability,
  mapHostingOperatorMatchToCard,
  mapPublishedProviderMatchToCard,
} from './mappers.js';
import type {
  HostingOperatorCard,
  ListPublishedProvidersInput,
  ListPublishedProvidersResponseDto,
  ListPublishedProvidersResult,
} from './types.js';

type DiscoveryFetchResponse = Readonly<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export type DiscoveryFetch = (
  input: string,
  init?: Readonly<{
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }>,
) => Promise<DiscoveryFetchResponse>;

export type HttpDataspaceDiscoveryClientOptions = Readonly<{
  endpointUrl?: string;
  fetcher?: DiscoveryFetch;
  requestHeaders?: Record<string, string>;
  appInfo?: AppInfo;
}>;

function defaultFetch(
  input: string,
  init?: Readonly<{ method?: string; headers?: Record<string, string>; body?: string }>,
) {
  return fetch(input, init) as Promise<DiscoveryFetchResponse>;
}

function normalizeResponseDto(body: unknown): ListPublishedProvidersResponseDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid dataspace discovery response payload.');
  }
  const candidate = body as Partial<ListPublishedProvidersResponseDto>;
  return {
    providers: Array.isArray(candidate.providers) ? candidate.providers : [],
    hostingOperators: Array.isArray(candidate.hostingOperators) ? candidate.hostingOperators : undefined,
  };
}

function dedupeHostingOperatorCards(cards: readonly HostingOperatorCard[]): HostingOperatorCard[] {
  const seen = new Set<string>();
  const deduped: HostingOperatorCard[] = [];
  for (const card of cards) {
    const did = String(card.did || '').trim();
    if (!did || seen.has(did)) continue;
    seen.add(did);
    deduped.push(card);
  }
  return deduped;
}

/**
 * Frontend-facing discovery client.
 *
 * Default integration model:
 * - browser/native app calls a portal or app backend
 * - backend resolves dataspace discovery and returns normalized DTOs
 *
 * Optional direct-public-catalog mode can be layered later behind an adapter,
 * but must not be treated as the default portal integration path.
 */
export interface DataspaceDiscoveryClient {
  /**
   * Lists publicly published provider offerings for a given sector and provider
   * capability.
   */
  listPublishedProviders(
    input: ListPublishedProvidersInput,
  ): Promise<ListPublishedProvidersResult>;
}

/**
 * Concrete frontend discovery client that calls a backend/BFF endpoint and
 * maps normalized provider/operator DTOs into UI cards.
 *
 * Default integration model:
 * - browser/native app calls a portal or app backend
 * - backend resolves dataspace discovery and returns normalized DTO matches
 *
 * Optional direct-public-catalog mode can be layered later behind a separate
 * adapter, but must not replace the BFF-first default contract.
 */
export class HttpDataspaceDiscoveryClient implements DataspaceDiscoveryClient {
  private readonly endpointUrl: string;
  private readonly fetcher: DiscoveryFetch;
  private readonly requestHeaders: Record<string, string>;

  constructor(options: HttpDataspaceDiscoveryClientOptions = {}) {
    this.endpointUrl = String(options.endpointUrl || '/api/dataspace-discovery/providers').trim();
    this.fetcher = options.fetcher || defaultFetch;
    const appHeaders = options.appInfo
      ? buildAppHeaders(resolveAppInfo(options.appInfo))
      : {};
    this.requestHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...appHeaders,
      ...(options.requestHeaders || {}),
    };
  }

  public async listPublishedProviders(
    input: ListPublishedProvidersInput,
  ): Promise<ListPublishedProvidersResult> {
    const response = await this.fetcher(this.endpointUrl, {
      method: 'POST',
      headers: this.requestHeaders,
      body: JSON.stringify({
        sector: input.sector,
        providerCapability: input.providerCapability,
        jurisdiction: input.jurisdiction,
        coverageScope: input.coverageScope,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list dataspace discovery providers (${response.status}).`);
    }

    const body = normalizeResponseDto(await response.json());
    const providers = filterPublishedProviderCardsByCapability(
      body.providers.map((match) => mapPublishedProviderMatchToCard(match)),
      input.providerCapability,
    );
    const hostingOperators = body.hostingOperators
      ? dedupeHostingOperatorCards(body.hostingOperators.map((match) => mapHostingOperatorMatchToCard(match)))
      : dedupeHostingOperatorCards(
        body.providers
          .filter((match) => match.hostingOperator)
          .map((match) => mapHostingOperatorMatchToCard({
            operatorDid: match.hostingOperatorDid || match.hostingOperator?.subjectId || '',
            record: match.hostingOperator!,
            title: match.hostingOperatorTitle,
            catalogUrl: match.record.catalogUrl,
          })),
      );

    return {
      providers,
      hostingOperators: hostingOperators.length ? hostingOperators : undefined,
    };
  }
}
