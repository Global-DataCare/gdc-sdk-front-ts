// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  LoadedActorProfile,
  ProfileLoadRequest,
  SubjectIndexCompositionRequest,
  SubjectIndexConnectionRequest,
  TrustedDeviceRegistrationRequest,
} from 'gdc-sdk-core-ts';

/**
 * Result of registering one trusted frontend device/runtime context.
 */
export type FrontendTrustedDeviceRegistrationResult = {
  trustedDeviceId: string;
  status: 'registered' | 'already-trusted';
};

/**
 * Result of connecting one loaded actor profile to one subject index from a
 * frontend runtime.
 */
export type FrontendSubjectIndexConnectionResult = {
  subjectId: string;
  userId: string;
  userRoleCode: string;
  status: 'connected' | 'already-connected';
};

/**
 * Result of reading one subject index composition from a frontend runtime.
 */
export type FrontendSubjectIndexCompositionResult = {
  subjectId: string;
  userId: string;
  userRoleCode: string;
  composition: unknown;
};

/**
 * Canonical frontend runtime contract for:
 * - loading one actor profile,
 * - registering one trusted device/runtime context,
 * - connecting one actor to one subject index, and
 * - reading the resulting subject index composition.
 */
export type FrontendProfileRuntimeClient = {
  loadProfile?: (input: ProfileLoadRequest) => Promise<LoadedActorProfile>;
  registerTrustedDevice?: (
    input: TrustedDeviceRegistrationRequest,
  ) => Promise<FrontendTrustedDeviceRegistrationResult>;
  connectToSubjectIndex?: (
    input: SubjectIndexConnectionRequest,
  ) => Promise<FrontendSubjectIndexConnectionResult>;
  getSubjectIndexComposition?: (
    input: SubjectIndexCompositionRequest,
  ) => Promise<FrontendSubjectIndexCompositionResult>;
};

export type FrontendProfileRuntimeAdapters = {
  loadProfile(input: ProfileLoadRequest): Promise<LoadedActorProfile>;
  registerTrustedDevice(
    input: TrustedDeviceRegistrationRequest,
  ): Promise<FrontendTrustedDeviceRegistrationResult>;
  connectToSubjectIndex(
    input: SubjectIndexConnectionRequest,
  ): Promise<FrontendSubjectIndexConnectionResult>;
  getSubjectIndexComposition(
    input: SubjectIndexCompositionRequest,
  ): Promise<FrontendSubjectIndexCompositionResult>;
};

/**
 * Default frontend-generic profile runtime implementation backed by injected
 * adapters.
 */
export class FrontendProfileRuntime implements FrontendProfileRuntimeClient {
  private readonly adapters: FrontendProfileRuntimeAdapters;

  constructor(adapters: FrontendProfileRuntimeAdapters) {
    this.adapters = adapters;
  }

  async loadProfile(input: ProfileLoadRequest): Promise<LoadedActorProfile> {
    return this.adapters.loadProfile(input);
  }

  async registerTrustedDevice(
    input: TrustedDeviceRegistrationRequest,
  ): Promise<FrontendTrustedDeviceRegistrationResult> {
    return this.adapters.registerTrustedDevice(input);
  }

  async connectToSubjectIndex(
    input: SubjectIndexConnectionRequest,
  ): Promise<FrontendSubjectIndexConnectionResult> {
    return this.adapters.connectToSubjectIndex(input);
  }

  async getSubjectIndexComposition(
    input: SubjectIndexCompositionRequest,
  ): Promise<FrontendSubjectIndexCompositionResult> {
    return this.adapters.getSubjectIndexComposition(input);
  }
}

export function requireFrontendProfileRuntimeMethod<
  T extends keyof FrontendProfileRuntimeClient,
>(
  client: FrontendProfileRuntimeClient,
  method: T,
): NonNullable<FrontendProfileRuntimeClient[T]> {
  const candidate = client[method];
  if (typeof candidate !== 'function') {
    throw new Error(`FrontendProfileRuntimeClient does not implement '${String(method)}'.`);
  }
  return candidate.bind(client) as NonNullable<FrontendProfileRuntimeClient[T]>;
}

export async function loadFrontendProfile(
  client: FrontendProfileRuntimeClient,
  input: ProfileLoadRequest,
): Promise<LoadedActorProfile> {
  return requireFrontendProfileRuntimeMethod(client, 'loadProfile')(input);
}

export async function registerFrontendTrustedDevice(
  client: FrontendProfileRuntimeClient,
  input: TrustedDeviceRegistrationRequest,
): Promise<FrontendTrustedDeviceRegistrationResult> {
  return requireFrontendProfileRuntimeMethod(client, 'registerTrustedDevice')(input);
}

export async function connectFrontendToSubjectIndex(
  client: FrontendProfileRuntimeClient,
  input: SubjectIndexConnectionRequest,
): Promise<FrontendSubjectIndexConnectionResult> {
  return requireFrontendProfileRuntimeMethod(client, 'connectToSubjectIndex')(input);
}

export async function getFrontendSubjectIndexComposition(
  client: FrontendProfileRuntimeClient,
  input: SubjectIndexCompositionRequest,
): Promise<FrontendSubjectIndexCompositionResult> {
  return requireFrontendProfileRuntimeMethod(client, 'getSubjectIndexComposition')(input);
}

