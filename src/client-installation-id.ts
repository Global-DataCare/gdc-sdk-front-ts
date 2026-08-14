// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

/** Versioned browser storage key for one non-secret installation identifier. */
export const ClientInstallationStorageKeys = Object.freeze({
  V1: 'gdc.client-installation-id.v1',
} as const);

/** Stable failures exposed by the client-installation identity helper. */
export const ClientInstallationErrors = Object.freeze({
  EmptyGeneratedId: 'client_installation_id_empty',
} as const);

/** Minimal storage port supported by browser localStorage and test doubles. */
export type ClientInstallationStorage = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}>;

/** Dependencies for deterministic unit tests and non-browser runtimes. */
export type ClientInstallationIdOptions = Readonly<{
  storage?: ClientInstallationStorage;
  randomUuid?: () => string;
  storageKey?: string;
}>;

/**
 * Returns the stable opaque id for this application installation.
 *
 * The value is not a user id, credential or secret. A fresh UUID is created
 * once per browser/app storage partition and reused for later token exchange
 * and DCR calls. Clearing site data intentionally creates a new installation.
 */
export function getOrCreateClientInstallationId(options: ClientInstallationIdOptions = {}): string {
  const storage = options.storage || globalThis.localStorage;
  const storageKey = options.storageKey || ClientInstallationStorageKeys.V1;
  const current = storage.getItem(storageKey)?.trim();
  if (current) return current;
  const generated = (options.randomUuid || globalThis.crypto.randomUUID.bind(globalThis.crypto))().trim();
  if (!generated) throw new Error(ClientInstallationErrors.EmptyGeneratedId);
  storage.setItem(storageKey, generated);
  return generated;
}
