// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { SubmitAndPollResult } from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontEmployeeDeviceActivationRequestInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class OrganizationEmployeeSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

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
