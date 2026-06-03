// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { PollOptions, SubmitAndPollResult, SubmitPayload } from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontLegalOrganizationOrderInput, type FrontOrganizationActivationInput, type FrontRuntimeClient } from './client-port.js';

export class HostOnboardingSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public activateOrganizationInGatewayFromIcaProof(
    input: FrontOrganizationActivationInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'activateOrganizationInGatewayFromIcaProof')(input, pollOptions);
  }

  public confirmLegalOrganizationOrder(
    input: FrontLegalOrganizationOrderInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'confirmLegalOrganizationOrder')(input, pollOptions);
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
