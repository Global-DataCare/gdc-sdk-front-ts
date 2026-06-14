// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  HostLifecycleInput,
  HostRouteContext,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';
import {
  requireClientMethod,
  type FrontOrganizationActivationInput,
  type FrontRuntimeClient,
} from './client-port.js';
import type { LegalOrganizationOrderInput } from 'gdc-sdk-core-ts';

export class HostOnboardingSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public activateOrganizationInGatewayFromIcaProof(
    hostCtx: HostRouteContext,
    input: FrontOrganizationActivationInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'activateOrganizationInGatewayFromIcaProof')(hostCtx, input, pollOptions);
  }

  public confirmLegalOrganizationOrder(
    hostCtx: HostRouteContext,
    input: LegalOrganizationOrderInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'confirmLegalOrganizationOrder')(hostCtx, input, pollOptions);
  }

  public disableHost(
    hostCtx: HostRouteContext,
    input: HostLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableHost')(hostCtx, input, pollOptions);
  }

  public purgeHost(
    hostCtx: HostRouteContext,
    input: HostLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeHost')(hostCtx, input, pollOptions);
  }

  public submitAndPoll(
    submitPath: string,
    pollPath: string,
    payload: SubmitPayload,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'submitAndPoll')(submitPath, pollPath, payload, pollOptions);
  }
}
