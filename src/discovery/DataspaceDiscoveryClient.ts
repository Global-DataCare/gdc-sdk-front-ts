// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { ListPublishedProvidersInput, ListPublishedProvidersResult } from './types.js';

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
