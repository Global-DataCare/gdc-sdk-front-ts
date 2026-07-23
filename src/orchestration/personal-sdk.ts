// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontClinicalBundleSearchInput, type FrontCommunicationIngestionInput, type FrontDigitalTwinGenerationInput, type FrontGrantProfessionalAccessInput, type FrontGrantProfessionalAccessResult, type FrontIndividualOrganizationBootstrapInput, type FrontIndividualOrganizationStartResult, type FrontIpsOrFhirImportInput, type FrontLicenseListSearchInput, type FrontLicenseOfferSearchInput, type FrontLicenseOrderSearchInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class PersonalSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public startIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ): Promise<FrontIndividualOrganizationStartResult> {
    return requireClientMethod(this.client, 'startIndividualOrganization')(ctx, input);
  }

  public grantProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(ctx, input);
  }

  public importIpsOrFhirAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontIpsOrFhirImportInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'importIpsOrFhirAndUpdateIndex')(ctx, input);
  }

  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  /** Reads the person's own `$summary` document without invoking ingestion. */
  public requestClinicalSummary(
    ctx: FrontRouteContext,
    input: ClinicalSummaryRequestInput,
  ): Promise<ClinicalSummaryReadResult> {
    return requireClientMethod(this.client, 'requestClinicalSummary')(ctx, input);
  }

  public generateDigitalTwinFromSubjectData(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinGenerationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'generateDigitalTwinFromSubjectData')(ctx, input);
  }

  public searchClinicalBundle(
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'searchClinicalBundle')(ctx, input);
  }

  public getLatestIps(
    ctx: FrontRouteContext,
    subject: string,
  ): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'getLatestIps')(ctx, subject);
  }

  public searchLicenses(
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchIndividualLicenses')(ctx, input);
  }

  /** Lists subject-side license seats with optional filters. */
  public listLicenses(
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listIndividualLicenses')(ctx, input);
  }

  /** Searches subject-side commercial offer records that back personal portal views. */
  public searchLicenseOffers(
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchIndividualLicenseOffers')(ctx, input);
  }

  /** Lists subject-side commercial offer records without requiring explicit filters. */
  public listLicenseOffers(
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listIndividualLicenseOffers')(ctx, input);
  }

  /** Searches subject-side commercial order/payment records for portal read-model flows. */
  public searchLicenseOrders(
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchIndividualLicenseOrders')(ctx, input);
  }

  /** Lists subject-side commercial order/payment records without requiring explicit filters. */
  public listLicenseOrders(
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listIndividualLicenseOrders')(ctx, input);
  }

  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
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
