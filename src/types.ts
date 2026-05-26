// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
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
