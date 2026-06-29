// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { IVaultRepository, UserProfileIndex, UserProfileLookupKey } from './types.js';

const COLLECTION = 'user-profile-index';

/**
 * Persisted local user-profile index document.
 *
 * The shared `UserProfileIndex` contract from `gdc-sdk-core-ts` does not impose
 * a storage identifier because it is runtime-neutral. Frontend runtimes need a
 * stable document id to persist and replace one logical index record.
 */
export interface UserProfileIndexRecord extends UserProfileIndex {
  /**
   * Stable storage identifier for one local profile-index document.
   */
  id: string;
}

/**
 * Frontend persistence adapter for local hashed user-profile indexes.
 *
 * Responsibilities:
 * - store ordered local profile indexes
 * - list available index documents
 * - resolve one index by hashed lookup key before profile unlock
 *
 * Non-responsibilities:
 * - hashing raw phone/email input
 * - unlocking profiles with PIN
 * - storing seeds or decrypted key material
 */
export class UserProfileIndexStore {
  constructor(private readonly vault: IVaultRepository) {}

  /**
   * Initializes the underlying storage adapter.
   */
  public async initialize(): Promise<void> {
    await this.vault.initialize();
  }

  /**
   * Creates or replaces one stored user-profile index record.
   */
  public async upsert(record: UserProfileIndexRecord): Promise<UserProfileIndexRecord> {
    await this.vault.put(COLLECTION, record);
    return record;
  }

  /**
   * Returns every stored user-profile index record.
   */
  public async list(): Promise<UserProfileIndexRecord[]> {
    return this.vault.query<UserProfileIndexRecord>(COLLECTION, {});
  }

  /**
   * Returns one stored index by storage id.
   */
  public async get(id: string): Promise<UserProfileIndexRecord | undefined> {
    return this.vault.get<UserProfileIndexRecord>(COLLECTION, id);
  }

  /**
   * Resolves the first stored index that contains the given hashed lookup key.
   *
   * This intentionally compares hashed lookup tokens only. Raw phone/email
   * values are outside this store contract.
   */
  public async findByLookup(lookup: UserProfileLookupKey): Promise<UserProfileIndexRecord | undefined> {
    const records = await this.list();
    return records.find((record) => record.lookup.some((item) => lookupEquals(item, lookup)));
  }

  /**
   * Deletes one stored index by storage id.
   */
  public async remove(id: string): Promise<boolean> {
    return this.vault.delete(COLLECTION, id);
  }
}

function lookupEquals(left: UserProfileLookupKey, right: UserProfileLookupKey): boolean {
  return left.kind === right.kind
    && left.algorithm === right.algorithm
    && left.value === right.value;
}

