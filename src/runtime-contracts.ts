// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DataPersistencePolicy } from 'gdc-sdk-core-ts';

export type LegacyFrontSourcePackage = never;

export type FrontRuntimeKind = 'expo' | 'web' | 'react-native';

export type FrontFetchLike = typeof fetch;

export type FrontRuntimeConfig = {
  runtimeKind: FrontRuntimeKind;
  fetcher: FrontFetchLike;
  persistencePolicy?: DataPersistencePolicy;
  cryptoProvider?: unknown;
  networkProvider?: unknown;
  secureStorageProvider?: unknown;
  vaultFactory?: unknown;
  outboxRepositoryFactory?: unknown;
  oidcProvider?: unknown;
};

export type FrontPackageStatus = {
  packageName: 'gdc-sdk-front-ts';
  dependsOnCorePackage: 'gdc-sdk-core-ts';
  legacySourcePackages: LegacyFrontSourcePackage[];
  status: 'bootstrap';
};

export const GDC_SDK_FRONT_STATUS: FrontPackageStatus = {
  packageName: 'gdc-sdk-front-ts',
  dependsOnCorePackage: 'gdc-sdk-core-ts',
  legacySourcePackages: [],
  status: 'bootstrap',
};
