// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  buildIndividualControllerIdentityVpPayload,
  buildUnsignedIndividualControllerIdentityVpJwt,
  getIndividualControllerIdentitySameAs,
  getIndividualControllerIdentityVC,
  getIndividualSubjectVC,
  type IndividualControllerCredentialInput,
  type IndividualControllerVpPayloadInput,
  type IndividualSubjectCredentialInput,
} from 'gdc-common-utils-ts';

import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';
import {
  buildFrontProfessionalAccessRequestDecisionGrant,
  buildFrontProfessionalAccessRequestSearchInput,
  requireClientMethod,
  type FrontBlockchainArtifactRegistrationInput,
  type FrontClinicalBundleSearchInput,
  type FrontClinicalSectionUpdateInput,
  type FrontClinicalSummaryUpdateInput,
  type FrontCommunicationIngestionInput,
  type FrontCommunicationParticipantSearchInput,
  type FrontDigitalTwinGenerationInput,
  type FrontDigitalTwinSecondaryUseConsentInput,
  type FrontDigitalTwinSubjectLinkPurgeInput,
  type FrontEnsureFamilyOrganizationRegistrationInput,
  type FrontEnsureFamilyOrganizationRegistrationResult,
  type FrontFamilyOrganizationSearchInput,
  type FrontGrantProfessionalAccessInput,
  type FrontGrantProfessionalAccessResult,
  type FrontIndividualMemberLifecycleInput,
  type FrontIndividualMemberLicenseAddInput,
  type FrontIndividualMemberLicenseInvitationInput,
  type FrontIndividualMemberLicenseTransitionInput,
  type FrontIndividualOnboardingPdfDraftInput,
  type FrontIndividualOnboardingPdfDraftResult,
  type FrontIndividualOrganizationBootstrapInput,
  type FrontIndividualOrganizationConfirmOrderInput,
  type FrontIndividualOrganizationLifecycleInput,
  type FrontIndividualOrganizationRegistrationInput,
  type FrontIndividualOrganizationRegistrationResult,
  type FrontIndividualOrganizationStartResult,
  type FrontIpsOrFhirImportInput,
  type FrontLicenseListSearchInput,
  type FrontLicenseOfferSearchInput,
  type FrontLicenseOrderSearchInput,
  type FrontProfessionalAccessRequestDecisionInput,
  type FrontProfessionalAccessRequestSearchInput,
  type FrontRelatedPersonUpsertInput,
  type FrontRevokeProfessionalAccessInput,
  type FrontRevokeProfessionalAccessResult,
  type FrontRouteContext,
  type FrontRuntimeClient,
  type FrontSmartTokenExchangeResult,
  type FrontSmartTokenRequestInput,
  type FrontSubjectSectionUpdateInput,
  type FrontVitalSignBatchCommunicationInput,
} from './client-port.js';
import type { FamilyOrganizationSummary } from 'gdc-common-utils-ts/utils/family-organization-summary';

export class IndividualControllerSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public registerIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationRegistrationInput,
  ): Promise<FrontIndividualOrganizationRegistrationResult> {
    if (this.client.registerIndividualOrganization) {
      return requireClientMethod(this.client, 'registerIndividualOrganization')(ctx, input);
    }
    return requireClientMethod(this.client, 'startIndividualOrganization')(ctx, input);
  }

  public startIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ): Promise<FrontIndividualOrganizationStartResult> {
    return this.registerIndividualOrganization(ctx, input);
  }

  /** Legacy phone-first lookup retained for existing channel applications. */
  public searchFamilyOrganization(
    ctx: FrontRouteContext,
    input: FrontFamilyOrganizationSearchInput,
  ): Promise<FamilyOrganizationSummary | null> {
    return requireClientMethod(this.client, 'searchFamilyOrganization')(ctx, input);
  }

  /** Legacy phone-first bootstrap retained for existing channel applications. */
  public ensureFamilyOrganizationRegistration(
    ctx: FrontRouteContext,
    input: FrontEnsureFamilyOrganizationRegistrationInput,
  ): Promise<FrontEnsureFamilyOrganizationRegistrationResult> {
    return requireClientMethod(this.client, 'ensureFamilyOrganizationRegistration')(ctx, input);
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

  /** Explicit lifecycle name matching the hosted individual organization. */
  public disableIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return this.disableIndividual(ctx, input, pollOptions);
  }

  public purgeIndividual(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeIndividual')(ctx, input, pollOptions);
  }

  /** Explicit lifecycle name matching the hosted individual organization. */
  public purgeIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return this.purgeIndividual(ctx, input, pollOptions);
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

  /** Approves or denies a temporary access request while retaining correlation. */
  public respondToProfessionalAccessRequest(
    ctx: FrontRouteContext,
    input: FrontProfessionalAccessRequestDecisionInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(
      ctx,
      buildFrontProfessionalAccessRequestDecisionGrant(input),
    );
  }

  public listProfessionalAccessRequests(
    ctx: FrontRouteContext,
    input: FrontProfessionalAccessRequestSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchCommunicationParticipants')(
      ctx,
      buildFrontProfessionalAccessRequestSearchInput(input),
    );
  }

  public revokeProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontRevokeProfessionalAccessInput,
  ): Promise<FrontRevokeProfessionalAccessResult> {
    return requireClientMethod(this.client, 'revokeProfessionalAccess')(ctx, input);
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

  /**
   * @deprecated Browser UI submits its typed section batch to its BFF. The
   * batch may mix `.create()`, `.update()` and exact `.delete()` entries; the
   * BFF sends it by Communication and preserves independent entry outcomes.
   */
  public updateClinicalSection(ctx: FrontRouteContext, input: FrontClinicalSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSection')(ctx, input);
  }

  /** Submits one typed subject-owned section through the configured BFF. */
  public updateSubjectSection(ctx: FrontRouteContext, input: FrontSubjectSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateSubjectSection')(ctx, input);
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

  /** Registers one resource or raw artifact before Communication attachment. */
  public registerBlockchainArtifactAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontBlockchainArtifactRegistrationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'registerBlockchainArtifactAndUpdateIndex')(ctx, input);
  }

  /** Submits selected vital-sign results as one Communication batch. */
  public submitVitalSignBatchCommunicationFromSearchResponse(
    ctx: FrontRouteContext,
    input: FrontVitalSignBatchCommunicationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'submitVitalSignBatchCommunicationFromSearchResponse')(ctx, input);
  }

  /** Searches indexed Communications by their governed participant filters. */
  public searchCommunicationParticipants(
    ctx: FrontRouteContext,
    input: FrontCommunicationParticipantSearchInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'searchCommunicationParticipants')(ctx, input);
  }

  public generateDigitalTwinFromSubjectData(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinGenerationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'generateDigitalTwinFromSubjectData')(ctx, input);
  }

  public setDigitalTwinSecondaryUseConsent(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSecondaryUseConsentInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'setDigitalTwinSecondaryUseConsent')(ctx, input);
  }

  public purgeDigitalTwinSubjectLink(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSubjectLinkPurgeInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeDigitalTwinSubjectLink')(ctx, input);
  }

  public getDigitalTwinSecondaryUseConsentStatus(
    ctx: FrontRouteContext,
    input: Readonly<{
      subjectDid: string;
      indexProviderOrganizationDid: string;
      researchUseReference: string;
    }>,
  ): Promise<Readonly<{ exists: boolean; enabled: boolean }>> {
    return requireClientMethod(this.client, 'getDigitalTwinSecondaryUseConsentStatus')(ctx, input);
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

  /** Adds zero-cost capacity before inviting a personal RelatedPerson member. */
  public addFreeMemberLicenses(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLicenseAddInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'addFreeIndividualMemberLicenses')(ctx, input);
  }

  /** Reserves one member seat for an existing RelatedPerson invitation. */
  public issueMemberInvitationLicense(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLicenseInvitationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'issueIndividualMemberLicense')(ctx, input);
  }

  /** Accepts, deactivates or releases one member invitation seat. */
  public transitionMemberLicense(
    ctx: FrontRouteContext,
    action: '_accept' | '_deactivate' | '_release',
    input: FrontIndividualMemberLicenseTransitionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'transitionIndividualMemberLicense')(ctx, action, input);
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

  public getIdentitySameAs(input: IndividualControllerCredentialInput): string[] {
    return getIndividualControllerIdentitySameAs(input);
  }

  public getIdentityVC(input: IndividualControllerCredentialInput): Record<string, unknown> {
    return getIndividualControllerIdentityVC(input);
  }

  public getSubjectVC(input: IndividualSubjectCredentialInput): Record<string, unknown> {
    return getIndividualSubjectVC(input);
  }

  public buildIdentityVpPayload(input: IndividualControllerVpPayloadInput): Record<string, unknown> {
    return buildIndividualControllerIdentityVpPayload(input);
  }

  public buildUnsignedIdentityVpJwt(
    input: IndividualControllerVpPayloadInput,
    options: Readonly<{ nowSeconds?: number; ttlSeconds?: number; nonce?: string }> = {},
  ): string {
    return buildUnsignedIndividualControllerIdentityVpJwt(input, options);
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
