// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import type { LicenseListSearchState } from 'gdc-common-utils-ts/utils/license-list-search';
import type { LicenseOfferSearchState, LicenseOrderSearchState } from 'gdc-common-utils-ts/utils/license-commercial-search';
import type { IndividualOrganizationLifecycleEditor } from 'gdc-common-utils-ts/utils/individual-organization-lifecycle';
import type { FamilyOrganizationSummary } from 'gdc-common-utils-ts/utils/family-organization-summary';
import type { OrganizationEmployeeLifecycleRecord } from 'gdc-common-utils-ts/models/organization-employee-lifecycle';
import type { LegalOrganizationVerificationTransactionInput } from 'gdc-common-utils-ts/utils/legal-organization-verification-transaction';
import { CommunicationCategoryCodes } from 'gdc-common-utils-ts/constants/communication';
import { CommunicationClaim } from 'gdc-common-utils-ts/models/interoperable-claims/communication-claims';
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
  SubjectSectionUpdateCommunicationInput,
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  ClinicalUpdateCommunicationInput,
  EmployeeSearchValue,
  HostLifecycleInput,
  HostRouteContext,
  HostedTenantLifecycleInput,
  OrganizationDidBindingInput,
  PermissionRequestCommunicationInput,
  LegalOrganizationOrderInput,
  PollOptions,
  SmartTokenRequestContract,
  SubmitAndPollResult,
  SubmitPayload,
  TransportProfile,
  IcaCredentialDownloadInput,
  IcaControllerCredentialPairInput,
  IcaRetrievedCredential,
  IcaControllerCredentialPair,
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
export type FrontLegalOrganizationVerificationTransactionInput = LegalOrganizationVerificationTransactionInput;

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

export type FrontOrganizationEmployeeLicenseOfferInput = {
  issuerDid: string;
  quantity: number;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/** @deprecated Professional seats use an Offer followed by a confirmed Order. */
export type FrontOrganizationEmployeeLicenseAddInput = FrontOrganizationEmployeeLicenseOfferInput;

export type FrontOrganizationEmployeeLicenseInvitationInput = {
  email: string;
  role: string;
  subjectDid: string;
  subjectId?: string;
  type?: DeviceAppType;
  requestThid?: string;
  pollOptions?: PollOptions;
};

export type FrontOrganizationLicenseOrderConfirmInput = Readonly<{
  issuerDid: string;
  offerId: string;
  hostNetwork?: string;
  dataType?: string;
  additionalClaims?: Record<string, unknown>;
  timeoutSeconds?: number;
  intervalSeconds?: number;
}>;

export type FrontOrganizationEmployeeProvisioningInput = Readonly<{
  creation: FrontOrganizationEmployeeCreationInput;
  invitation: FrontOrganizationEmployeeLicenseInvitationInput;
  licenseOrder?: Omit<FrontOrganizationLicenseOrderConfirmInput, 'offerId'>;
}>;

export type FrontOrganizationEmployeeProvisioningResult = Readonly<{
  employee: SubmitAndPollResult;
  license: SubmitAndPollResult;
  licenseOrder?: SubmitAndPollResult;
  activationCode: string;
  maxDevices?: number;
}>;

export type FrontEmployeeDeviceRevocationInput = {
  licenseId: string;
  clientId: string;
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

export type FrontSmartTokenRequestInput = SmartTokenRequestContract & {
  /** Consent purpose used by research and other purpose-bound SMART flows. */
  purpose?: string;
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

export type FrontIndividualOrganizationRegistrationInput = FrontIndividualOrganizationBootstrapInput;
export type FrontIndividualOrganizationRegistrationResult = FrontIndividualOrganizationStartResult;

/** Legacy phone-first lookup retained for compatibility with existing channel applications. */
export type FrontFamilyOrganizationSearchInput = Readonly<{
  controllerPhone: string;
  usualname: string;
  birthDate?: string;
  timeoutSeconds?: number;
  intervalSeconds?: number;
}>;

export type FrontEnsureFamilyOrganizationRegistrationInput =
  FrontFamilyOrganizationSearchInput & Readonly<{
    controllerEmail?: string;
    controllerRole?: string;
    serviceProviderDid?: string;
    tenantId?: string;
    jurisdiction?: string;
    sector?: string;
    additionalClaims?: Record<string, unknown>;
  }>;

export type FrontEnsureFamilyOrganizationRegistrationResult = Readonly<{
  status: 'already_exists' | 'resume_required' | 'new_created';
  summary?: FamilyOrganizationSummary;
  started?: FrontIndividualOrganizationStartResult;
}>;

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

/**
 * Front runtime input for updating exactly one clinical section. A typed FHIR
 * batch may mix create, update and delete entries. Each delete targets
 * `ResourceType/id`, has no resource body and may carry `ifMatch`; GW returns
 * and authorizes every entry independently.
 */
export type FrontClinicalSectionUpdateInput =
  ClinicalSectionUpdateCommunicationInput & FrontClinicalUpdateRuntimeOptions;

/** Front runtime input for updating one Composition-first summary document. */
export type FrontClinicalSummaryUpdateInput =
  ClinicalUpdateCommunicationInput & FrontClinicalUpdateRuntimeOptions;

/** Frontend/BFF input for one subject-owned section update. */
export type FrontSubjectSectionUpdateInput =
  SubjectSectionUpdateCommunicationInput & FrontClinicalUpdateRuntimeOptions;

/** Registers one clinical resource or raw artifact through the configured BFF. */
export type FrontBlockchainArtifactRegistrationInput = {
  subject: string;
  resource?: Record<string, unknown>;
  contentDataBase64?: string;
  contentType?: string;
  identifier?: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  language?: string;
  requestThid?: string;
  pollOptions?: PollOptions;
};

/** Communication participant filters accepted by the frontend BFF adapter. */
export type FrontCommunicationParticipantSearchInput = {
  searchParams?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined>;
  subject?: string | string[];
  actorId?: string | string[];
  senderActorId?: string | string[];
  recipientActorId?: string | string[];
  userActorId?: string | string[];
  targetActorId?: string | string[];
  periodStart?: string;
  periodEnd?: string;
  requestThid?: string;
  pollOptions?: PollOptions;
  page?: number;
  count?: number;
};

/** Vital-sign resources selected from one search response for Communication submission. */
export type FrontVitalSignBatchCommunicationInput = Readonly<{
  subject: string;
  searchResponse: unknown;
  selectedResourceIds?: readonly string[];
  sender?: string;
  recipient?: string | string[];
  sent?: string;
  status?: string;
  noteText?: string;
  requestThid?: string;
  pollOptions?: PollOptions;
}>;

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
  /** ISO 8601 instant persisted as `Consent.period-end` for temporary access. */
  periodEnd?: string;
  decision?: 'permit' | 'deny';
  /** Permission-request Communication identifier or thread being answered. */
  eventBasedOn?: string;
  /** Canonical permission-request Communication reference. */
  sourceReference?: string;
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

/** Subject decision correlated to its originating professional access request. */
export type FrontProfessionalAccessRequestDecisionInput = Readonly<FrontGrantProfessionalAccessInput & {
  requestThid: string;
  requestCommunicationIdentifier?: string;
}>;

export type FrontProfessionalAccessRequestInput =
  Omit<PermissionRequestCommunicationInput, 'missing'> & Readonly<{
    missing: Readonly<{
      sections: string[];
      resourceTypes: string[];
      pairs?: PermissionRequestCommunicationInput['missing']['pairs'];
    }>;
    transportProfile?: TransportProfile;
    pollOptions?: PollOptions;
  }>;

export type FrontProfessionalAccessRequestResult = Readonly<{
  thid: string;
  communicationIdentifier: string;
  consentIdentifier: string;
  communication: CommunicationInput;
  delivery: SubmitAndPollResult;
}>;

export type FrontProfessionalAccessRequestSearchInput = FrontCommunicationParticipantSearchInput;

/** Restricts participant searches to canonical professional access requests. */
export function buildFrontProfessionalAccessRequestSearchInput(
  input: FrontProfessionalAccessRequestSearchInput,
): FrontCommunicationParticipantSearchInput {
  return {
    ...input,
    searchParams: {
      ...input.searchParams,
      [CommunicationClaim.Category]: CommunicationCategoryCodes.Notification.attributeValue,
    },
  };
}

export type FrontRevokeProfessionalAccessInput = {
  consentClaims: Record<string, unknown>;
  periodEnd?: string;
  dataType?: string;
  pollOptions?: PollOptions;
};

export type FrontRevokeProfessionalAccessResult = {
  thid: string;
  consent: SubmitAndPollResult;
  consentClaims: Record<string, unknown>;
};

/** Converts a frontend request decision into the canonical correlated grant. */
export function buildFrontProfessionalAccessRequestDecisionGrant(
  input: FrontProfessionalAccessRequestDecisionInput,
): FrontGrantProfessionalAccessInput {
  const requestThid = String(input.requestThid || '').trim();
  if (!requestThid) throw new Error('Permission request decision requires requestThid.');
  const communicationIdentifier = String(input.requestCommunicationIdentifier || '').trim();
  const { requestThid: _requestThid, requestCommunicationIdentifier: _requestCommunicationIdentifier, ...grant } = input;
  return {
    ...grant,
    eventBasedOn: communicationIdentifier || requestThid,
    sourceReference: communicationIdentifier
      ? `Communication?identifier=${encodeURIComponent(communicationIdentifier)}`
      : `Communication?thid=${encodeURIComponent(requestThid)}`,
  };
}

export type FrontDigitalTwinGenerationInput = {
  compositionPayload: object;
  format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
};

export type FrontDigitalTwinFhirFormat = 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';

export type FrontDigitalTwinSearchInput = {
  accessToken?: string;
  thid?: string;
  format?: FrontDigitalTwinFhirFormat;
  resourceType?: 'ResearchSubject';
  sections?: readonly string[];
  dateFrom?: string;
  dateTo?: string;
  text?: string;
  filters?: Readonly<Record<string, string | readonly string[] | undefined>>;
  pollOptions?: PollOptions;
};

export type FrontDigitalTwinSearchMatch = Record<string, unknown> & {
  resourceType?: 'ResearchSubject';
  id?: string;
  composition?: Record<string, unknown>;
  meta?: { tag?: FrontDigitalTwinResearchTag[] };
};

export type FrontDigitalTwinSearchResult = {
  total: number;
  matches: FrontDigitalTwinSearchMatch[];
  operation: SubmitAndPollResult;
};

export type FrontDigitalTwinResearchTag = {
  id?: string;
  system: string;
  code: string;
  version?: string;
  userSelected: true;
};

export type FrontDigitalTwinWorksetTagInput = Omit<FrontDigitalTwinResearchTag, 'userSelected'>;

export type FrontDigitalTwinSelectionInput = {
  accessToken?: string;
  twinSubjectId: string;
  section: string;
  tags: readonly FrontDigitalTwinWorksetTagInput[];
  authorDid?: string;
  selectionId?: string;
  /** @deprecated Use `selectionId`. */
  compositionId?: string;
  documentType?: string;
  date?: string;
  thid?: string;
  format?: FrontDigitalTwinFhirFormat;
  pollOptions?: PollOptions;
};

export type FrontDigitalTwinMaterializationInput = {
  accessToken?: string;
  twinSubjectId: string;
  thid?: string;
  format?: FrontDigitalTwinFhirFormat;
  sections?: readonly string[];
  sent?: string;
  pollOptions?: PollOptions;
};

export type FrontDigitalTwinSecondaryUseConsentInput = {
  subjectDid: string;
  indexProviderOrganizationDid: string;
  decision: 'permit' | 'deny';
  researchUseReference: string;
  consentDate?: string;
  dataType?: string;
  pollOptions?: PollOptions;
};

export type FrontDigitalTwinSubjectLinkPurgeInput = {
  subjectDid: string;
  pollOptions?: PollOptions;
};

export type FrontRuntimeClient = {
  submitLegalOrganizationVerificationTransaction?: (
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  submitLegalOrganizationCredentialReissuance?: (
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  submitLegalOrganizationIssue?: (
    hostCtx: HostRouteContext,
    input: FrontLegalOrganizationVerificationTransactionInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  retrieveOrganizationCredentialFromIca?: (
    input: IcaCredentialDownloadInput,
  ) => Promise<IcaRetrievedCredential>;
  retrieveLegalRepresentativeCredentialFromIca?: (
    input: IcaCredentialDownloadInput,
  ) => Promise<IcaRetrievedCredential>;
  retrieveControllerCredentialsFromIca?: (
    input: IcaControllerCredentialPairInput,
  ) => Promise<IcaControllerCredentialPair>;
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
  provisionOrganizationEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeProvisioningInput,
  ) => Promise<FrontOrganizationEmployeeProvisioningResult>;
  issueOrganizationEmployeeLicense?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseInvitationInput,
  ) => Promise<SubmitAndPollResult>;
  disableOrganizationEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  listOrganizationEmployeeLifecycle?: (
    ctx: FrontRouteContext,
  ) => Promise<OrganizationEmployeeLifecycleRecord[]>;
  addFreeOrganizationEmployeeLicenses?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseAddInput,
  ) => Promise<SubmitAndPollResult>;
  requestOrganizationEmployeeLicenseOffer?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLicenseOfferInput,
  ) => Promise<SubmitAndPollResult>;
  confirmOrganizationLicenseOrder?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationLicenseOrderConfirmInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeOrganizationEmployee?: (
    ctx: FrontRouteContext,
    input: FrontOrganizationEmployeeLifecycleInput,
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
  enableTenant?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  getTenantLifecycleStatus?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput,
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  disableTenantDescendants?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput & { descendantKind: 'individuals' },
    pollOptions?: PollOptions,
  ) => Promise<SubmitAndPollResult>;
  purgeTenantDescendants?: (
    hostCtx: HostRouteContext,
    input: HostedTenantLifecycleInput & { descendantKind: 'individuals' },
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
  revokeEmployeeDevice?: (
    ctx: FrontRouteContext,
    input: FrontEmployeeDeviceRevocationInput,
  ) => Promise<SubmitAndPollResult>;
  requestSmartToken?: (
    input: FrontSmartTokenRequestInput,
  ) => Promise<FrontSmartTokenExchangeResult>;
  startIndividualOrganization?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ) => Promise<FrontIndividualOrganizationStartResult>;
  registerIndividualOrganization?: (
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationRegistrationInput,
  ) => Promise<FrontIndividualOrganizationRegistrationResult>;
  searchFamilyOrganization?: (
    ctx: FrontRouteContext,
    input: FrontFamilyOrganizationSearchInput,
  ) => Promise<FamilyOrganizationSummary | null>;
  ensureFamilyOrganizationRegistration?: (
    ctx: FrontRouteContext,
    input: FrontEnsureFamilyOrganizationRegistrationInput,
  ) => Promise<FrontEnsureFamilyOrganizationRegistrationResult>;
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
  requestProfessionalAccess?: (
    ctx: FrontRouteContext,
    input: FrontProfessionalAccessRequestInput,
  ) => Promise<FrontProfessionalAccessRequestResult>;
  revokeProfessionalAccess?: (
    ctx: FrontRouteContext,
    input: FrontRevokeProfessionalAccessInput,
  ) => Promise<FrontRevokeProfessionalAccessResult>;
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
  updateSubjectSection?: (
    ctx: FrontRouteContext,
    input: FrontSubjectSectionUpdateInput,
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
  setDigitalTwinSecondaryUseConsent?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSecondaryUseConsentInput,
  ) => Promise<FrontGrantProfessionalAccessResult>;
  purgeDigitalTwinSubjectLink?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSubjectLinkPurgeInput,
  ) => Promise<SubmitAndPollResult>;
  getDigitalTwinSecondaryUseConsentStatus?: (
    ctx: FrontRouteContext,
    input: Readonly<{
      subjectDid: string;
      indexProviderOrganizationDid: string;
      researchUseReference: string;
    }>,
  ) => Promise<Readonly<{ exists: boolean; enabled: boolean }>>;
  searchDigitalTwins?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSearchInput,
  ) => Promise<FrontDigitalTwinSearchResult>;
  saveDigitalTwinSelection?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSelectionInput,
  ) => Promise<SubmitAndPollResult>;
  materializeDigitalTwin?: (
    ctx: FrontRouteContext,
    input: FrontDigitalTwinMaterializationInput,
  ) => Promise<SubmitAndPollResult>;
  registerBlockchainArtifactAndUpdateIndex?: (
    ctx: FrontRouteContext,
    input: FrontBlockchainArtifactRegistrationInput,
  ) => Promise<SubmitAndPollResult>;
  submitVitalSignBatchCommunicationFromSearchResponse?: (
    ctx: FrontRouteContext,
    input: FrontVitalSignBatchCommunicationInput,
  ) => Promise<SubmitAndPollResult>;
  searchCommunicationParticipants?: (
    ctx: FrontRouteContext,
    input: FrontCommunicationParticipantSearchInput,
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
