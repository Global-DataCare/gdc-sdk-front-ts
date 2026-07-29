// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  PollOptions,
  SubmitAndPollResult,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontClinicalBundleSearchInput, type FrontClinicalSectionUpdateInput, type FrontClinicalSummaryUpdateInput, type FrontCommunicationIngestionInput, type FrontDigitalTwinGenerationInput, type FrontGrantProfessionalAccessInput, type FrontGrantProfessionalAccessResult, type FrontIndividualMemberLifecycleInput, type FrontIndividualOnboardingPdfDraftInput, type FrontIndividualOnboardingPdfDraftResult, type FrontIndividualOrganizationBootstrapInput, type FrontIndividualOrganizationConfirmOrderInput, type FrontIndividualOrganizationLifecycleInput, type FrontIndividualOrganizationStartResult, type FrontIpsOrFhirImportInput, type FrontLicenseListSearchInput, type FrontLicenseOfferSearchInput, type FrontLicenseOrderSearchInput, type FrontRelatedPersonUpsertInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class IndividualControllerSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public startIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ): Promise<FrontIndividualOrganizationStartResult> {
    return requireClientMethod(this.client, 'startIndividualOrganization')(ctx, input);
  }

  public prepareIndividualOnboardingPdfDraft(
    ctx: FrontRouteContext,
    input: FrontIndividualOnboardingPdfDraftInput,
  ): Promise<FrontIndividualOnboardingPdfDraftResult> {
    return requireClientMethod(this.client, 'prepareIndividualOnboardingPdfDraft')(ctx, input);
  }

  public confirmIndividualOrganizationOrder(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationConfirmOrderInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'confirmIndividualOrganizationOrder')(ctx, input);
  }

  public disableIndividual(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableIndividual')(ctx, input, pollOptions);
  }

  public purgeIndividual(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeIndividual')(ctx, input, pollOptions);
  }

  public disableIndividualMember(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableIndividualMember')(ctx, input, pollOptions);
  }

  public purgeIndividualMember(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeIndividualMember')(ctx, input, pollOptions);
  }

  public grantProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(ctx, input);
  }

  /** @deprecated Browser UI submits the IPS Bundle to its authenticated BFF. */
  public importIpsOrFhirAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontIpsOrFhirImportInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'importIpsOrFhirAndUpdateIndex')(ctx, input);
  }

  /**
   * @deprecated Compatibility adapter for the older direct RelatedPerson
   * route. Browser UI authors a typed Bundle and submits it to its BFF.
   */
  public upsertRelatedPersonAndPoll(
    ctx: FrontRouteContext,
    input: FrontRelatedPersonUpsertInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'upsertRelatedPersonAndPoll')(ctx, input);
  }

  /**
   * @deprecated Backend/BFF compatibility surface. Browser components submit
   * command Bundles to their authenticated BFF and never ingest directly.
   */
  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  /** @deprecated Browser UI submits its section command Bundle to its BFF. */
  public updateClinicalSection(ctx: FrontRouteContext, input: FrontClinicalSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSection')(ctx, input);
  }

  /** @deprecated Browser UI submits its Composition-first Bundle to its BFF. */
  public updateClinicalSummary(ctx: FrontRouteContext, input: FrontClinicalSummaryUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSummary')(ctx, input);
  }

  /** Reads the current `$summary` document and exposes section/type/date readers. */
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

  /** Lists subject/individual-side license seats with optional filters. */
  public listLicenses(
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput = {},
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'listIndividualLicenses')(ctx, input);
  }

  /** Searches subject-side commercial offer records that back portal list/detail views. */
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
}
