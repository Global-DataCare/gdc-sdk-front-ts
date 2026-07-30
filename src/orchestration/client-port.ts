// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import type { LicenseListSearchState } from 'gdc-common-utils-ts/utils/license-list-search';
import type { LicenseOfferSearchState, LicenseOrderSearchState } from 'gdc-common-utils-ts/utils/license-commercial-search';
import type { IndividualOrganizationLifecycleEditor } from 'gdc-common-utils-ts/utils/individual-organization-lifecycle';
import type {
  IndividualOnboardingDraftInput,
  IndividualOnboardingDraftResult,
} from 'gdc-common-utils-ts/models/individual-onboarding';
import type {
  BundleSearchQuery,
  CommMsgExtendedCommunicationOutboxJob,
  CommunicationOutboxJob,
  CommunicationInput,
  ClinicalSectionUpdateCommunicationInput,
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  ClinicalUpdateCommunicationInput,
  EmployeeSearchValue,
  HostLifecycleInput,
  HostRouteContext,
  HostedTenantLifecycleInput,
  OrganizationDidBindingInput,
  LegalOrganizationOrderInput,
  PollOptions,
  SmartTokenRequestContract,
  SubmitAndPollResult,
  SubmitPayload,
  TransportProfile,
} from 'gdc-sdk-core-ts';

export type FrontRouteContext = {
  providerDid: string;
  idToken: string;
  /** Direct-to-GW runtimes use the SMART access token, never the login token. */
  accessToken?: string;
  /** Direct mobile/browser runtimes require explicit GW routing. */
  tenantId?: string;
  jurisdiction?: string;
  sector?: string;
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

export type FrontOrganizationDidBindingInput = OrganizationDidBindingInput;

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
  licenseQuery?: Partial<LicenseListSearchState>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/**
 * Frontend/runtime search/list input for commercial offer read-models.
 */
export type FrontLicenseOfferSearchInput = {
  offerQuery?: Partial<LicenseOfferSearchState>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/**
 * Frontend/runtime search/list input for commercial order/payment read-models.
 */
export type FrontLicenseOrderSearchInput = {
  orderQuery?: Partial<LicenseOrderSearchState>;
  requestThid?: string;
  pollOptions?: PollOptions;
};

export type FrontEmployeeDeviceActivationRequestInput = {
  activationCode: string;
  dcrPayload?: Record<string, unknown>;
};

export type FrontSmartTokenRequestInput = SmartTokenRequestContract;

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
  individualEditor?: IndividualOrganizationLifecycleEditor;
  /**
   * @deprecated Use `individualEditor`.
   */
  organizationEditor?: IndividualOrganizationLifecycleEditor;
  resourceId?: string;
  dataType?: string;
};

export type FrontIndividualMemberLifecycleInput = {
  memberClaims?: Record<string, unknown>;
  resourceId?: string;
};

/** Adds zero-cost member seats to one individual organization. */
export type FrontIndividualMemberLicenseAddInput = {
  ownerOrganizationId: string;
  quantity: number;
  requestThid?: string;
  pollOptions?: { timeoutMs?: number; intervalMs?: number };
};

/** Reserves one member seat for an existing RelatedPerson invitation. */
export type FrontIndividualMemberLicenseInvitationInput = {
  ownerOrganizationId: string;
  subjectDid: string;
  relatedPersonId: string;
  invitationId: string;
  role: string;
  email?: string;
  telephone?: string;
  type?: DeviceAppType;
  requestThid?: string;
  pollOptions?: { timeoutMs?: number; intervalMs?: number };
};

/** Accepts, deactivates or releases one individual-member invitation. */
export type FrontIndividualMemberLicenseTransitionInput = {
  ownerOrganizationId?: string;
  activationCode: string;
  subjectId?: string;
  verifiedActorIdentifier?: string;
  requestThid?: string;
  pollOptions?: { timeoutMs?: number; intervalMs?: number };
};

export type FrontIpsOrFhirImportInput = {
  compositionPayload: object;
  format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

export type FrontRelatedPersonUpsertInput = {
  relatedPersonPayload: object;
};

export type FrontCommunicationIngestionInput = {
  /** Preferred claims-first job created by `createCommunicationOutboxJobFromCommMsgExtendedDraft(...)`. */
  communicationJob?: CommunicationOutboxJob | CommMsgExtendedCommunicationOutboxJob;
  /** Compatibility escape hatch for an already-rendered channel payload. */
  communicationPayload?: CommunicationInput & Record<string, unknown>;
  /** Claims-first representation rendered before transport. */
  clinicalFormat?: string;
  /** @deprecated Use `clinicalFormat`. */
  pathFormatSegment?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
  transportProfile?: TransportProfile;
  pollOptions?: PollOptions;
};

type FrontClinicalUpdateRuntimeOptions = {
  clinicalFormat?: string;
  transportProfile?: TransportProfile;
  pollOptions?: PollOptions;
};

/** Front runtime input for updating exactly one clinical section. */
export type FrontClinicalSectionUpdateInput =
  ClinicalSectionUpdateCommunicationInput & FrontClinicalUpdateRuntimeOptions;

/** Front runtime input for updating one Composition-first summary document. */
export type FrontClinicalSummaryUpdateInput =
  ClinicalUpdateCommunicationInput & FrontClinicalUpdateRuntimeOptions;

export type FrontClinicalBundleSearchInput = Omit<BundleSearchQuery, 'section' | 'searchParams'> & {
  section?: string | string[];
  extraSearchParams?: BundleSearchQuery['searchParams'];
  requestThid?: string;
  transportProfile?: TransportProfile;
  pollOptions?: PollOptions;
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
    hostCtx: HostRouteContext,
    input: FrontOrganizationActivationInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  confirmLegalOrganizationOrder?: (
    hostCtx: HostRouteContext,
    input: LegalOrganizationOrderInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  disableHost?: (
    hostCtx: HostRouteContext,
    input: HostLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeHost?: (
    hostCtx: HostRouteContext,
    input: HostLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  createOrganizationEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeCreationInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  submitOrganizationDidBinding?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationDidBindingInput,
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
  disableTenant?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeTenant?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
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
  addFreeIndividualMemberLicenses?: (
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLicenseAddInput,
  ) => Promise<SubmitAndPollResult>;
  issueIndividualMemberLicense?: (
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLicenseInvitationInput,
  ) => Promise<SubmitAndPollResult>;
  transitionIndividualMemberLicense?: (
    ctx: FrontRouteContext,
    action: '_accept' | '_deactivate' | '_release',
    input: FrontIndividualMemberLicenseTransitionInput,
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
  updateClinicalSection?: (
    ctx: FrontRouteContext,
    input: FrontClinicalSectionUpdateInput,
  ) => Promise<SubmitAndPollResult>;
  updateClinicalSummary?: (
    ctx: FrontRouteContext,
    input: FrontClinicalSummaryUpdateInput,
  ) => Promise<SubmitAndPollResult>;
  requestClinicalSummary?: (
    ctx: FrontRouteContext,
    input: ClinicalSummaryRequestInput,
  ) => Promise<ClinicalSummaryReadResult>;
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
