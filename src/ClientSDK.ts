// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { ProfileManager } from './ProfileManager.js';
import { ProfileRegistry } from './ProfileRegistry.js';
import type {
  AppInfo,
  InitializeSessionParams,
  IVerifier,
  IVaultRepository,
  Profile,
  ProfileRegistryEntry,
  SdkConfig,
} from './types.js';

/**
 * Frontend-facing SDK entry point for profile/session bootstrapping, lightweight
 * provider discovery, and role-scoped session creation.
 *
 * This class is intentionally small while the convergence work is still in
 * progress. It should be treated as the bootstrap façade, not yet the full
 * replacement for every legacy runtime helper.
 *
 * Canonical frontend payload examples used by tests and docs live in:
 * `gdc-common-utils-ts/examples`
 */
export class ClientSDK {
  private readonly mockDidDocuments = new Map<string, unknown>();
  public currentSession: ProfileManager | null = null;
  public profileRegistry: ProfileRegistry | null = null;

  /**
   * @param sdkConfig Frontend runtime adapters such as fetch/network/api.
   * @param appInfo Information about the host app.
   * @param _wallet Reserved wallet/provider dependency.
   * @param _verifier DID/VC verifier dependency.
   * @param _icaDid Optional bootstrap ICA DID used by the host app.
   */
  constructor(
    private readonly sdkConfig: SdkConfig,
    private readonly appInfo: AppInfo,
    private readonly _wallet: unknown,
    private readonly _verifier: IVerifier,
    private readonly _icaDid?: string,
  ) {}

  /**
   * Registers a mock DID document for local/demo discovery flows.
   */
  public addMockDidDocument(did: string, didDoc: unknown): void {
    this.mockDidDocuments.set(String(did || '').trim(), didDoc);
  }

  /**
   * Loads `/.well-known/api-config.json` from a provider URL or `did:web`.
   */
  public async fetchWellKnownApiConfig(source: string): Promise<Record<string, unknown>> {
    const baseUrl = await this.resolveBaseUrl(source);
    const response = await this.sdkConfig.fetcher(new URL('.well-known/api-config.json', baseUrl).href);
    if (!response.ok) {
      throw new Error(`Failed to load API config (${response.status}).`);
    }
    return response.json() as Promise<Record<string, unknown>>;
  }

  /**
   * Loads `/.well-known/supported-fields.json` from a provider URL or `did:web`.
   */
  public async fetchSupportedFields(source: string): Promise<Array<{ code: string; display: string }>> {
    const baseUrl = await this.resolveBaseUrl(source);
    const response = await this.sdkConfig.fetcher(new URL('.well-known/supported-fields.json', baseUrl).href);
    if (!response.ok) return [];
    const body = await response.json() as Record<string, unknown>;
    const candidates = body.fields || body.supportedFields || [];
    if (!Array.isArray(candidates)) return [];
    return candidates
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const code = String((entry as Record<string, unknown>).code || '').trim();
        const display = String((entry as Record<string, unknown>).display || code).trim();
        return code ? { code, display } : null;
      })
      .filter((entry): entry is { code: string; display: string } => Boolean(entry));
  }

  /**
   * Initializes a profile-scoped session and returns a `ProfileManager` with the
   * role-specific services available for the current profile.
   *
   * Implemented today:
   * - canonical profile normalization and persistence bootstrap
   * - provider DID carried into the created session
   *
   * Still pending:
   * - explicit `deviceIdentity` / `actorIdentity` / `providerIdentity` stores
   * - provider DID resolution through the shared discovery contracts
   */
  public async initializeSession(
    params: InitializeSessionParams,
    createVaultForProfile: () => IVaultRepository,
  ): Promise<ProfileManager> {
    this.shutdownSession();
    const vault = createVaultForProfile();
    await vault.initialize();

    const profile: Profile = {
      id: String(params.profileId || '').trim(),
      email: String(params.email || '').trim(),
      role: String(params.role || '').trim(),
      providerDid: String(params.providerDid || '').trim(),
      appType: params.appType,
      createdAt: new Date().toISOString(),
    };
    if (!profile.id) {
      throw new Error('initializeSession requires profileId.');
    }
    await vault.put<Profile>('profile', profile);
    const session = new ProfileManager(profile, profile.providerDid);
    this.currentSession = session;
    return session;
  }

  /**
   * Initializes the local profile registry abstraction.
   */
  public async initializeProfileRegistry(
    createVaultForProfile: () => IVaultRepository,
  ): Promise<ProfileRegistry> {
    const vault = createVaultForProfile();
    const registry = new ProfileRegistry(vault);
    await registry.initialize();
    this.profileRegistry = registry;
    return registry;
  }

  /**
   * Clears the current in-memory session reference.
   */
  public shutdownSession(): void {
    this.currentSession = null;
  }

  private async resolveBaseUrl(source: string): Promise<URL> {
    const raw = String(source || '').trim();
    if (!raw) throw new Error('Provider source is required.');
    if (raw.startsWith('did:web:')) {
      const didDoc = this.mockDidDocuments.get(raw) as Record<string, unknown> | undefined;
      const didServices = (didDoc?.service && Array.isArray(didDoc.service) ? didDoc.service : []) as Array<Record<string, unknown>>;
      const endpoint = didServices
        .map((service) => service.serviceEndpoint)
        .find((candidate) => typeof candidate === 'string' && candidate.startsWith('http'));
      if (endpoint) return new URL(String(endpoint));
      const host = raw.replace(/^did:web:/, '').replace(/:/g, '/');
      return new URL(`https://${host}/`);
    }
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw.endsWith('/') ? raw : `${raw}/`);
    }
    return new URL(`https://${raw}/`);
  }
}

export type {
  InitializeSessionParams,
  ProfileRegistryEntry,
};
