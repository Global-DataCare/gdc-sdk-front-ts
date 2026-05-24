// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { IVaultRepository, ProfileRegistryEntry } from './types.js';

const COLLECTION = 'profiles';

export class ProfileRegistry {
  constructor(private readonly vault: IVaultRepository) {}

  public async initialize(): Promise<void> {
    await this.vault.initialize();
  }

  public async register(entry: ProfileRegistryEntry): Promise<void> {
    await this.vault.put(COLLECTION, entry);
  }

  public async upsert(entry: ProfileRegistryEntry): Promise<ProfileRegistryEntry> {
    await this.vault.put(COLLECTION, entry);
    return entry;
  }

  public async list(): Promise<ProfileRegistryEntry[]> {
    return this.vault.query<ProfileRegistryEntry>(COLLECTION, {});
  }

  public async get(id: string): Promise<ProfileRegistryEntry | undefined> {
    return this.vault.get<ProfileRegistryEntry>(COLLECTION, id);
  }

  public async remove(id: string): Promise<boolean> {
    return this.vault.delete(COLLECTION, id);
  }
}
