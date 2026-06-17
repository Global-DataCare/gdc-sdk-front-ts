// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';
import type { SubmitAndPollResult } from 'gdc-sdk-core-ts';
import type { ProfileLoadRequest } from 'gdc-sdk-core-ts';
import {
  loadFrontendProfile,
  type FrontendProfileRuntimeClient,
} from './frontend-profile-runtime.js';
import { IndividualControllerSdk } from './orchestration/individual-controller-sdk.js';
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
  profile: LoadedActorProfile;
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
    const profile = await loadFrontendProfile(this.profileRuntime, input);
    if (!profile.session.actorKinds.includes(ActorKinds.IndividualController)) {
      throw new Error('Loaded frontend profile does not expose actor kind \'individual_controller\'.');
    }
    return {
      profile,
      sdk: new IndividualControllerSdk(this.facadeClient),
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
