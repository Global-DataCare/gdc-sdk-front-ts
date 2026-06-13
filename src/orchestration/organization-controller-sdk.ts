// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { PollOptions, SubmitAndPollResult } from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontEmployeeDeviceActivationRequestInput, type FrontOrganizationEmployeeCreationInput, type FrontOrganizationEmployeeLifecycleInput, type FrontOrganizationEmployeeSearchInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class OrganizationControllerSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public createOrganizationEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeCreationInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'createOrganizationEmployee')(ctx, input, pollOptions);
  }

  public disableEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableEmployee')(ctx, input, pollOptions);
  }

  public searchOrganizationEmployees(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchOrganizationEmployees')(ctx, input);
  }

  public purgeEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeEmployee')(ctx, input, pollOptions);
  }

  public activateEmployeeDeviceWithActivationRequest(
    ctx: FrontRouteContext,
    input: FrontEmployeeDeviceActivationRequestInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'activateEmployeeDeviceWithActivationRequest')(ctx, input);
  }

  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
  }
}
