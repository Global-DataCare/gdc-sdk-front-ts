// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';
import type { SubmitAndPollResult } from 'gdc-sdk-core-ts';
import type { ProfileLoadRequest } from 'gdc-sdk-core-ts';
import type { ProfileManager } from './ProfileManager.js';
import {
  ProfileRuntime,
  type LoadedProfileWorkspace,
} from './frontend-profile-workspace.js';
import type { FrontendProfileRuntimeClient } from './frontend-profile-runtime.js';
import type { IndividualControllerSdk } from './orchestration/individual-controller-sdk.js';
import type {
  FrontClinicalBundleSearchInput,
  FrontIndividualOrganizationBootstrapInput,
  FrontIndividualOrganizationConfirmOrderInput,
  FrontIndividualOrganizationStartResult,
  FrontRouteContext,
  FrontRuntimeClient,
} from './orchestration/client-port.js';
import type { LoadedActorProfile } from 'gdc-sdk-core-ts';

export type FrontendIndividualControllerProfile = {
  profile: LoadedActorProfile & { actorSession: ProfileManager };
  workspace: LoadedProfileWorkspace;
  actorSession: ProfileManager;
  sdk: IndividualControllerSdk;
};

/**
 * First pragmatic frontend use-case wrapper on top of the generic v2 profile
 * runtime.
 *
 * It keeps the generic `loadProfile(...)` contract intact while giving portal
 * or app code one narrower surface for the current individual-controller
 * baseline.
 */
export class IndividualControllerFrontendRuntime {
  constructor(
    private readonly profileRuntime: FrontendProfileRuntimeClient,
    private readonly facadeClient: FrontRuntimeClient,
  ) {}

  /**
   * Loads one frontend profile and ensures it exposes the individual-controller
   * actor capability before materializing the facade.
   */
  public async loadProfile(
    input: ProfileLoadRequest,
  ): Promise<FrontendIndividualControllerProfile> {
    const workspace = await new ProfileRuntime(
      this.profileRuntime,
      this.facadeClient,
    ).loadProfile(input);
    if (!workspace.profile.session.actorKinds.includes(ActorKinds.IndividualController)) {
      throw new Error('Loaded frontend profile does not expose actor kind \'individual_controller\'.');
    }
    return {
      profile: workspace.profile,
      workspace,
      actorSession: workspace.actorSession,
      sdk: workspace.asIndividualController(),
    };
  }

  /**
   * Starts the current individual/family bootstrap flow from frontend code.
   */
  public startIndividualOrganization(
    profile: FrontendIndividualControllerProfile,
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ): Promise<FrontIndividualOrganizationStartResult> {
    return profile.sdk.startIndividualOrganization(ctx, input);
  }

  /**
   * Confirms the order returned by the frontend bootstrap flow.
   */
  public confirmIndividualOrganizationOrder(
    profile: FrontendIndividualControllerProfile,
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationConfirmOrderInput,
  ): Promise<SubmitAndPollResult> {
    return profile.sdk.confirmIndividualOrganizationOrder(ctx, input);
  }

  /**
   * Searches the subject clinical index from the frontend individual-controller
   * facade.
   */
  public searchClinicalBundle(
    profile: FrontendIndividualControllerProfile,
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ): Promise<{ thid: string }> {
    return profile.sdk.searchClinicalBundle(ctx, input);
  }

  /**
   * Reads the latest IPS-oriented bundle from the frontend individual-controller
   * facade.
   */
  public getLatestIps(
    profile: FrontendIndividualControllerProfile,
    ctx: FrontRouteContext,
    subject: string,
  ): Promise<{ thid: string }> {
    return profile.sdk.getLatestIps(ctx, subject);
  }
}
