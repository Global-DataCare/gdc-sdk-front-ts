// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
/**
 * @fileoverview Frontend SDK shared type aliases.
 *
 * @architecture 101
 * Re-export runtime-neutral contracts instead of duplicating DTO definitions.
 */
import type {
  AppInfo,
  ResolvedAppInfo,
  IApiConfig,
  InitializeSessionParams,
  INetwork,
  IVerifier,
  IVaultRepository,
  BundleSearchQuery,
  CommunicationInput,
  DateRange,
  Profile,
  ProfileRegistryEntry,
  RelatedProfileSearchInput,
  RelatedProfileSearchResult,
  RelatedProfileRole,
  RelatedProfileStatus,
  RelatedProfileSummary,
  VaultQuery,
  VaultQueryCondition,
} from 'gdc-sdk-core-ts';

export type { AppInfo, ResolvedAppInfo, InitializeSessionParams, Profile, ProfileRegistryEntry, VaultQueryCondition, VaultQuery, IVaultRepository, IApiConfig, INetwork, IVerifier } from 'gdc-sdk-core-ts';

export type SdkConfig = {
  crypto?: unknown;
  network: INetwork;
  api: IApiConfig;
  fetcher: typeof fetch;
};

export type FrontDateRange = DateRange;
export type FrontBundleSearchQuery = BundleSearchQuery;
export type FrontCommunicationInput = CommunicationInput;
export type FrontRelatedProfileStatus = RelatedProfileStatus;
export type FrontRelatedProfileRole = RelatedProfileRole;
export type FrontRelatedProfileSearchInput = RelatedProfileSearchInput;
export type FrontRelatedProfileSummary = RelatedProfileSummary;
export type FrontRelatedProfileSearchResult = RelatedProfileSearchResult;
