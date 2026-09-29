// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  HostRouteContext,
  HostedTenantLifecycleInput,
  IcaControllerCredentialPair,
  IcaControllerCredentialPairInput,
  IcaCredentialDownloadInput,
  IcaRetrievedCredential,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';
import {
  requireClientMethod,
  type FrontEmployeeDeviceActivationRequestInput,
  type FrontEmployeeDeviceRevocationInput,
  type FrontLegalOrganizationVerificationTransactionInput,
  type FrontLicenseListSearchInput,
  type FrontLicenseOfferSearchInput,
  type FrontLicenseOrderSearchInput,
  type FrontOrganizationDidBindingInput,
  type FrontOrganizationEmployeeCreationInput,
  type FrontOrganizationEmployeeLicenseAddInput,
  type FrontOrganizationEmployeeLicenseInvitationInput,
  type FrontOrganizationEmployeeLicenseOfferInput,
  type FrontOrganizationEmployeeLifecycleInput,
  type FrontOrganizationEmployeeProvisioningInput,
  type FrontOrganizationEmployeeProvisioningResult,
  type FrontOrganizationEmployeeSearchInput,
  type FrontOrganizationLicenseOrderConfirmInput,
  type FrontRouteContext,
  type FrontRuntimeClient,
  type FrontSmartTokenExchangeResult,
  type FrontSmartTokenRequestInput,
} from './client-port.js';
import type { OrganizationEmployeeLifecycleRecord } from 'gdc-common-utils-ts/models/organization-employee-lifecycle';

export class OrganizationControllerSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public submitLegalOrganizationVerificationTransaction(
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'submitLegalOrganizationVerificationTransaction')(
      hostCtx, input, pollOptions,
    );
  }

  public submitLegalOrganizationCredentialReissuance(
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    if (this.client.submitLegalOrganizationCredentialReissuance) {
      return requireClientMethod(this.client, 'submitLegalOrganizationCredentialReissuance')(
        hostCtx, input, pollOptions,
      );
    }
    return requireClientMethod(this.client, 'submitLegalOrganizationIssue')(
      hostCtx, input, pollOptions,
    );
  }

  /** @deprecated Use `submitLegalOrganizationCredentialReissuance`. */
  public submitLegalOrganizationIssue(
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return this.submitLegalOrganizationCredentialReissuance(hostCtx, input, pollOptions);
  }

  /** Retrieves the organization VC through the configured ICA/BFF adapter. */
  public retrieveOrganizationCredentialFromIca(
    input: IcaCredentialDownloadInput,
  ): Promise<IcaRetrievedCredential> {
    return requireClientMethod(this.client, 'retrieveOrganizationCredentialFromIca')(input);
  }

  /** Retrieves the legal-representative VC through the configured ICA/BFF adapter. */
  public retrieveLegalRepresentativeCredentialFromIca(
    input: IcaCredentialDownloadInput,
  ): Promise<IcaRetrievedCredential> {
    return requireClientMethod(this.client, 'retrieveLegalRepresentativeCredentialFromIca')(input);
  }

  /** Retrieves the paired controller credentials through one configured adapter. */
  public retrieveControllerCredentialsFromIca(
    input: IcaControllerCredentialPairInput,
  ): Promise<IcaControllerCredentialPair> {
    return requireClientMethod(this.client, 'retrieveControllerCredentialsFromIca')(input);
  }

  /**
   * Binds the current tenant organization DID document to one public alias
   * view.
   *
   * Alias contract:
   * - the current tenant path identifies the organization
   * - `organization.url` carries the public alias/domain list
   * - `controller.sameAs` is optional corroborating identity evidence
   *
   * Current version limits:
   * - this binding flow does not accept new organization public keys
   */
  public submitOrganizationDidBinding(
    ctx: FrontRouteContext,
    input: FrontOrganizationDidBindingInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'submitOrganizationDidBinding')(ctx, input, pollOptions);
  }

  public createOrganizationEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeCreationInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'createOrganizationEmployee')(ctx, input, pollOptions);
  }

  public provisionOrganizationEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeProvisioningInput,
  ): Promise<FrontOrganizationEmployeeProvisioningResult> {
    return requireClientMethod(this.client, 'provisionOrganizationEmployee')(ctx, input);
  }

  public issueOrganizationEmployeeLicense(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseInvitationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'issueOrganizationEmployeeLicense')(ctx, input);
  }

  public disableOrganizationEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableOrganizationEmployee')(ctx, input, pollOptions);
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

  public listOrganizationEmployeeLifecycle(
    ctx: FrontRouteContext,
  ): Promise<OrganizationEmployeeLifecycleRecord[]> {
    return requireClientMethod(this.client, 'listOrganizationEmployeeLifecycle')(ctx);
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

  /** @deprecated Professional seats use an Offer followed by a confirmed Order. */
  public addFreeEmployeeLicenses(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseAddInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'addFreeOrganizationEmployeeLicenses')(ctx, input);
  }

  public requestEmployeeLicenseOffer(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseOfferInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'requestOrganizationEmployeeLicenseOffer')(ctx, input);
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

  public confirmOrganizationLicenseOrder(
    ctx: FrontRouteContext,
    input: FrontOrganizationLicenseOrderConfirmInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'confirmOrganizationLicenseOrder')(ctx, input, pollOptions);
  }

  public purgeOrganizationEmployee(
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeOrganizationEmployee')(ctx, input, pollOptions);
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

  public enableTenant(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'enableTenant')(hostCtx, input, pollOptions);
  }

  public getTenantLifecycleStatus(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'getTenantLifecycleStatus')(hostCtx, input, pollOptions);
  }

  public disableTenantDescendants(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput & { descendantKind: 'individuals' },
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableTenantDescendants')(hostCtx, input, pollOptions);
  }

  public purgeTenantDescendants(
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput & { descendantKind: 'individuals' },
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeTenantDescendants')(hostCtx, input, pollOptions);
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

  public revokeEmployeeDevice(
    ctx: FrontRouteContext,
    input: FrontEmployeeDeviceRevocationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'revokeEmployeeDevice')(ctx, input);
  }

  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
  }

  /** Low-level escape hatch for an adapter-owned submit/poll operation. */
  public submitAndPoll(
    submitPath: string,
    pollPath: string,
    payload: SubmitPayload,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'submitAndPoll')(submitPath, pollPath, payload, pollOptions);
  }
}
