// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import type { LicenseListSearchDraft, LicenseOfferSearchDraft, LicenseOrderSearchDraft } from 'gdc-common-utils-ts';
import type {
  IndividualOnboardingDraftInput,
  IndividualOnboardingDraftResult,
} from 'gdc-common-utils-ts/models/individual-onboarding';
import type {
  BundleSearchQuery,
  CommunicationInput,
  EmployeeSearchValue,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';

export type FrontRouteContext = {
  providerDid: string;
  idToken: string;
  requiredScope?: string;
  format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

/**
 * Frontend/runtime-neutral contract consumed by actor-scoped facades in
 * `gdc-sdk-front-ts`.
 *
 * Frontend code still needs the same actor boundaries as `gdc-sdk-node-ts`,
 * even when execution goes through local services, a BFF, or browser/mobile
 * adapters instead of direct GW calls.
 */

export type FrontOrganizationActivationInput = {
  vpToken: string;
  controller?: Record<string, unknown>;
  service?: Record<string, unknown>;
  additionalClaims?: Record<string, unknown>;
};

export type FrontLegalOrganizationOrderInput = {
  offerId: string;
  orderClaims?: Record<string, unknown>;
};

export type FrontOrganizationEmployeeCreationInput = {
  email: string;
  role: string;
  userClass?: DeviceUserClass;
  type?: DeviceAppType;
  employeeClaims?: Record<string, unknown>;
};

export type FrontOrganizationEmployeeLifecycleInput = {
  employeeClaims?: Record<string, unknown>;
  resourceId?: string;
};

export type FrontOrganizationEmployeeSearchInput = {
  employeeClaims?: Record<string, EmployeeSearchValue>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/**
 * Frontend/runtime search/list input for license seats.
 */
export type FrontLicenseListSearchInput = {
  licenseQuery?: Partial<LicenseListSearchDraft>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/**
 * Frontend/runtime search/list input for commercial offer read-models.
 */
export type FrontLicenseOfferSearchInput = {
  offerQuery?: Partial<LicenseOfferSearchDraft>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/**
 * Frontend/runtime search/list input for commercial order/payment read-models.
 */
export type FrontLicenseOrderSearchInput = {
  orderQuery?: Partial<LicenseOrderSearchDraft>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

export type FrontEmployeeDeviceActivationRequestInput = {
  activationCode: string;
  dcrPayload?: Record<string, unknown>;
};

export type FrontSmartTokenRequestInput = {
  idToken: string;
  scopes: string[];
  actorDid?: string;
  subjectDid?: string;
  clientId?: string;
  issuer?: string;
  audience?: string;
  additionalClaims?: Record<string, unknown>;
};

export type FrontSmartTokenExchangeResult = {
  status: 'fetched' | 'failed';
  accessToken?: string;
  tokenType?: string;
  scopes?: string[];
  statusCode?: number;
  response?: unknown;
};

export type FrontIndividualOrganizationBootstrapInput = {
  registrationClaims: object;
  acceptedOfferId?: string;
};

export type FrontIndividualOrganizationStartResult = {
  registrationThid: string;
  confirmationThid?: string;
};

export type FrontIndividualOnboardingPdfDraftInput = IndividualOnboardingDraftInput;
export type FrontIndividualOnboardingPdfDraftResult = IndividualOnboardingDraftResult;

export type FrontIndividualOrganizationConfirmOrderInput = {
  offerId: string;
  orderClaims?: Record<string, unknown>;
};

export type FrontIndividualOrganizationLifecycleInput = {
  organizationClaims?: Record<string, unknown>;
  resourceId?: string;
};

export type FrontIndividualMemberLifecycleInput = {
  memberClaims?: Record<string, unknown>;
  resourceId?: string;
};

export type FrontIpsOrFhirImportInput = {
  compositionPayload: object;
  format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

export type FrontRelatedPersonUpsertInput = {
  relatedPersonPayload: object;
};

export type FrontCommunicationIngestionInput = {
  communicationPayload: CommunicationInput & Record<string, unknown>;
  pathFormatSegment?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

export type FrontClinicalBundleSearchInput = BundleSearchQuery & {
  requestThid?: string;
};

export type FrontGrantProfessionalAccessInput = {
  subjectDid?: string;
  subjectPhone?: string;
  subjectGivenName?: string;
  actorId?:
    | string
    | string[]
    | {
      didWeb?: string;
      organizationUrl?: string;
      organizationTaxId?: string;
      email?: string;
      phone?: string;
    };
  actor?:
    | string
    | string[]
    | {
      didWeb?: string;
      organizationUrl?: string;
      organizationTaxId?: string;
      email?: string;
      phone?: string;
    };
  actorRole: string;
  purpose: string;
  actions: string[];
  consentIdentifier?: string;
  consentDate?: string;
  decision?: 'permit' | 'deny';
  attachmentContentType?: string;
  attachmentBase64?: string;
};

export type FrontGrantProfessionalAccessResult = {
  thid: string;
  consent: SubmitAndPollResult;
  subjectIdentifier: string;
  actorIdentifier: string;
  consentClaims: Record<string, unknown>;
  claimsCid?: string;
};

export type FrontDigitalTwinGenerationInput = {
  compositionPayload: object;
  format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

export type FrontRuntimeClient = {
  activateOrganizationInGatewayFromIcaProof?: (
    input: FrontOrganizationActivationInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  confirmLegalOrganizationOrder?: (
    input: FrontLegalOrganizationOrderInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  createOrganizationEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeCreationInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  disableEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  searchOrganizationEmployees?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeSearchInput,
  ) => Promise<SubmitAndPollResult>;
  searchOrganizationLicenses?: (
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listOrganizationLicenses?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseListSearchInput,
  ) => Promise<SubmitAndPollResult>;
  searchOrganizationLicenseOffers?: (
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listOrganizationLicenseOffers?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseOfferSearchInput,
  ) => Promise<SubmitAndPollResult>;
  searchOrganizationLicenseOrders?: (
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listOrganizationLicenseOrders?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseOrderSearchInput,
  ) => Promise<SubmitAndPollResult>;
  purgeEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  activateEmployeeDeviceWithActivationRequest?: (
    ctx: FrontRouteContext,
    input: FrontEmployeeDeviceActivationRequestInput,
  ) => Promise<SubmitAndPollResult>;
  requestSmartToken?: (
    input: FrontSmartTokenRequestInput,
  ) => Promise<FrontSmartTokenExchangeResult>;
  startIndividualOrganization?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ) => Promise<FrontIndividualOrganizationStartResult>;
  prepareIndividualOnboardingPdfDraft?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOnboardingPdfDraftInput,
  ) => Promise<FrontIndividualOnboardingPdfDraftResult>;
  confirmIndividualOrganizationOrder?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationConfirmOrderInput,
  ) => Promise<SubmitAndPollResult>;
  disableIndividual?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeIndividual?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  disableIndividualMember?: (
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeIndividualMember?: (
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  searchIndividualLicenses?: (
    ctx: FrontRouteContext,
    input: FrontLicenseListSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listIndividualLicenses?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseListSearchInput,
  ) => Promise<SubmitAndPollResult>;
  searchIndividualLicenseOffers?: (
    ctx: FrontRouteContext,
    input: FrontLicenseOfferSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listIndividualLicenseOffers?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseOfferSearchInput,
  ) => Promise<SubmitAndPollResult>;
  searchIndividualLicenseOrders?: (
    ctx: FrontRouteContext,
    input: FrontLicenseOrderSearchInput,
  ) => Promise<SubmitAndPollResult>;
  listIndividualLicenseOrders?: (
    ctx: FrontRouteContext,
    input?: FrontLicenseOrderSearchInput,
  ) => Promise<SubmitAndPollResult>;
  grantProfessionalAccess?: (
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ) => Promise<FrontGrantProfessionalAccessResult>;
  importIpsOrFhirAndUpdateIndex?: (
    ctx: FrontRouteContext,
    input: FrontIpsOrFhirImportInput,
  ) => Promise<SubmitAndPollResult>;
  upsertRelatedPersonAndPoll?: (
    ctx: FrontRouteContext,
    input: FrontRelatedPersonUpsertInput,
  ) => Promise<SubmitAndPollResult>;
  ingestCommunicationAndUpdateIndex?: (
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ) => Promise<SubmitAndPollResult>;
  generateDigitalTwinFromSubjectData?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinGenerationInput,
  ) => Promise<SubmitAndPollResult>;
  searchClinicalBundle?: (
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ) => Promise<{ thid: string }>;
  getLatestIps?: (
    ctx: FrontRouteContext,
    subject: string,
  ) => Promise<{ thid: string }>;
  submitAndPoll?: (
    submitPath: string,
    pollPath: string,
    payload: SubmitPayload,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
};

export function requireClientMethod<T extends keyof FrontRuntimeClient>(
  client: FrontRuntimeClient,
  method: T,
): NonNullable<FrontRuntimeClient[T]> {
  const candidate = client[method];
  if (typeof candidate !== 'function') {
    throw new Error(`FrontRuntimeClient does not implement '${String(method)}'.`);
  }
  return candidate.bind(client) as NonNullable<FrontRuntimeClient[T]>;
}

export function createSyntheticSubmitAndPollResult(
  thid: string,
  body: unknown = { thid, accepted: true },
): SubmitAndPollResult {
  return {
    submit: {
      status: 202,
      location: `/jobs/${thid}`,
      body,
    },
    poll: {
      status: 200,
      body: {
        completed: true,
        thid,
        ...(body && typeof body === 'object' ? body as Record<string, unknown> : { body }),
      },
      attempts: 1,
    },
  };
}
