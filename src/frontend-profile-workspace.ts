// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  ActorKinds,
  type ActorKindsValue,
} from 'gdc-common-utils-ts/constants/actor-session';
import { ProfileAppTypes } from 'gdc-common-utils-ts/constants';
import type {
  LoadedActorProfile,
  ProfileLoadRequest,
  SubjectIndexCompositionRequest,
  SubjectIndexConnectionRequest,
  TrustedDeviceRegistrationRequest,
} from 'gdc-sdk-core-ts';
import { ProfileManager } from './ProfileManager.js';
import type {
  FrontendProfileRuntimeClient,
  FrontendSubjectIndexCompositionResult,
  FrontendSubjectIndexConnectionResult,
  FrontendTrustedDeviceRegistrationResult,
} from './frontend-profile-runtime.js';
import {
  getFrontendSubjectIndexComposition,
  loadFrontendProfile,
  connectFrontendToSubjectIndex,
  registerFrontendTrustedDevice,
} from './frontend-profile-runtime.js';
import { HostOnboardingSdk } from './orchestration/host-onboarding-sdk.js';
import { IndividualControllerSdk } from './orchestration/individual-controller-sdk.js';
import { IndividualMemberSdk } from './orchestration/individual-member-sdk.js';
import { OrganizationControllerSdk } from './orchestration/organization-controller-sdk.js';
import { OrganizationEmployeeSdk } from './orchestration/organization-employee-sdk.js';
import { PersonalSdk } from './orchestration/personal-sdk.js';
import { ProfessionalSdk } from './orchestration/professional-sdk.js';
import type { FrontRuntimeClient } from './orchestration/client-port.js';
import type { Profile } from './types.js';

export type FrontendLoadedActorProfile = LoadedActorProfile & {
  actorSession: ProfileManager;
};

export type LoadedProfile = FrontendLoadedActorProfile;

function toSessionProfile(profile: LoadedActorProfile): Profile {
  const descriptor = profile.descriptor || {};
  const id = String(
    descriptor.profileId
    || descriptor.profileDid
    || descriptor.subjectDid
    || descriptor.providerDid
    || 'frontend-profile',
  ).trim();
  return {
    id,
    email: String(descriptor.email || '').trim(),
    role: String(descriptor.actorRole || '').trim(),
    providerDid: String(descriptor.providerDid || '').trim(),
    appType: descriptor.appType || ProfileAppTypes.Family,
    createdAt: new Date().toISOString(),
  };
}

function requireActorKind(profile: LoadedActorProfile, actorKind: ActorKindsValue): void {
  if (!profile.session.actorKinds.includes(actorKind)) {
    throw new Error(`Loaded frontend profile does not expose actor kind '${actorKind}'.`);
  }
}

function requirePersonalCapability(profile: LoadedActorProfile): void {
  if (
    profile.session.actorKinds.includes(ActorKinds.IndividualController)
    || profile.session.actorKinds.includes(ActorKinds.IndividualMember)
  ) {
    return;
  }
  throw new Error('Loaded frontend profile does not expose one personal-capable actor kind.');
}

/**
 * Frontend loaded-profile workspace that keeps the login/profile bootstrap
 * steps explicit and then exposes actor-scoped facades from that loaded
 * profile.
 */
export class LoadedProfileWorkspace {
  public readonly profile: FrontendLoadedActorProfile;
  public readonly actorSession: ProfileManager;
  private readonly profileRuntime: FrontendProfileRuntimeClient;
  private readonly facadeClient?: FrontRuntimeClient;

  constructor(
    profileRuntime: FrontendProfileRuntimeClient,
    loadedProfile: LoadedActorProfile,
    facadeClient?: FrontRuntimeClient,
  ) {
    this.profileRuntime = profileRuntime;
    this.facadeClient = facadeClient;
    this.actorSession = new ProfileManager(
      toSessionProfile(loadedProfile),
      String(loadedProfile.descriptor.providerDid || ''),
    );
    this.profile = {
      ...loadedProfile,
      actorSession: this.actorSession,
    };
  }

  public registerTrustedDevice(
    input: TrustedDeviceRegistrationRequest,
  ): Promise<FrontendTrustedDeviceRegistrationResult> {
    return registerFrontendTrustedDevice(this.profileRuntime, input);
  }

  public connectToSubjectIndex(
    input: SubjectIndexConnectionRequest,
  ): Promise<FrontendSubjectIndexConnectionResult> {
    return connectFrontendToSubjectIndex(this.profileRuntime, input);
  }

  public getSubjectIndexComposition(
    input: SubjectIndexCompositionRequest,
  ): Promise<FrontendSubjectIndexCompositionResult> {
    return getFrontendSubjectIndexComposition(this.profileRuntime, input);
  }

  public asHostOnboarding(): HostOnboardingSdk {
    requireActorKind(this.profile, ActorKinds.HostOnboarding);
    return new HostOnboardingSdk(this.requireFacadeClient('HostOnboardingSdk'));
  }

  public asOrganizationController(): OrganizationControllerSdk {
    requireActorKind(this.profile, ActorKinds.OrganizationController);
    return new OrganizationControllerSdk(this.requireFacadeClient('OrganizationControllerSdk'));
  }

  public asOrganizationEmployee(): OrganizationEmployeeSdk {
    requireActorKind(this.profile, ActorKinds.OrganizationEmployee);
    return new OrganizationEmployeeSdk(this.requireFacadeClient('OrganizationEmployeeSdk'));
  }

  public asIndividualController(): IndividualControllerSdk {
    requireActorKind(this.profile, ActorKinds.IndividualController);
    return new IndividualControllerSdk(this.requireFacadeClient('IndividualControllerSdk'));
  }

  public asIndividualMember(): IndividualMemberSdk {
    requireActorKind(this.profile, ActorKinds.IndividualMember);
    return new IndividualMemberSdk(this.requireFacadeClient('IndividualMemberSdk'));
  }

  public asPersonal(): PersonalSdk {
    requirePersonalCapability(this.profile);
    return new PersonalSdk(this.requireFacadeClient('PersonalSdk'));
  }

  public asProfessional(): ProfessionalSdk {
    requireActorKind(this.profile, ActorKinds.Professional);
    return new ProfessionalSdk(this.requireFacadeClient('ProfessionalSdk'));
  }

  private requireFacadeClient(name: string): FrontRuntimeClient {
    if (!this.facadeClient) {
      throw new Error(`${name} requires one FrontRuntimeClient on the loaded frontend profile workspace.`);
    }
    return this.facadeClient;
  }
}

/**
 * Frontend counterpart to the backend loaded-profile runtime:
 * inject adapters once, load one protected profile, then work from the
 * returned workspace/session facade instead of one-off helper calls.
 */
export class ProfileRuntime {
  constructor(
    private readonly profileRuntime: FrontendProfileRuntimeClient,
    private readonly facadeClient?: FrontRuntimeClient,
  ) {}

  public async loadProfile(
    input: ProfileLoadRequest,
  ): Promise<LoadedProfileWorkspace> {
    const profile = await loadFrontendProfile(this.profileRuntime, input);
    return new LoadedProfileWorkspace(this.profileRuntime, profile, this.facadeClient);
  }
}

export function createLoadedProfileWorkspace(
  profileRuntime: FrontendProfileRuntimeClient,
  loadedProfile: LoadedActorProfile,
  facadeClient?: FrontRuntimeClient,
): LoadedProfileWorkspace {
  return new LoadedProfileWorkspace(profileRuntime, loadedProfile, facadeClient);
}

/**
 * @deprecated Prefer `LoadedProfileWorkspace`.
 */
export { LoadedProfileWorkspace as FrontendProfileWorkspace };

/**
 * @deprecated Prefer `ProfileRuntime`.
 */
export { ProfileRuntime as FrontendProfileWorkspaceRuntime };

/**
 * @deprecated Prefer `createLoadedProfileWorkspace`.
 */
export { createLoadedProfileWorkspace as createFrontendProfileWorkspace };
