// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  HostRouteContext,
  HostedTenantLifecycleInput,
  PollOptions,
  SubmitAndPollResult,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontEmployeeDeviceActivationRequestInput, type FrontLicenseListSearchInput, type FrontLicenseOfferSearchInput, type FrontLicenseOrderSearchInput, type FrontOrganizationEmployeeCreationInput, type FrontOrganizationEmployeeLifecycleInput, type FrontOrganizationEmployeeSearchInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

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

  public searchLicenses(
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchOrganizationLicenses')(ctx, input);
  }

  /** Lists organization-owned license seats with optional filters. */
  public listLicenses(
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listOrganizationLicenses')(ctx, input);
  }

  /** Searches hosted commercial offer records that back portal list/detail views. */
  public searchLicenseOffers(
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchOrganizationLicenseOffers')(ctx, input);
  }

  /** Lists hosted commercial offer records without requiring explicit filters. */
  public listLicenseOffers(
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listOrganizationLicenseOffers')(ctx, input);
  }

  /** Searches hosted commercial order/payment records for portal read-model flows. */
  public searchLicenseOrders(
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchOrganizationLicenseOrders')(ctx, input);
  }

  /** Lists hosted commercial order/payment records without requiring explicit filters. */
  public listLicenseOrders(
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listOrganizationLicenseOrders')(ctx, input);
  }

  public purgeEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeEmployee')(ctx, input, pollOptions);
  }

  /** Disables the hosted tenant itself through the host registry. */
  public disableTenant(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableTenant')(hostCtx, input, pollOptions);
  }

  /** Purges the already-disabled hosted tenant through the host registry. */
  public purgeTenant(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeTenant')(hostCtx, input, pollOptions);
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
