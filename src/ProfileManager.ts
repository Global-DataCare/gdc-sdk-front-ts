// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import {
  createClinicalSectionUpdateOutboxJob,
  createClinicalSummaryUpdateOutboxJob,
  type SubmitAndPollResult,
} from 'gdc-sdk-core-ts';
import type { Profile } from './types.js';
import type {
  CommonServices,
  FamilyAdminServices,
  IndividualServices,
  OrgAdminServices,
  ProfessionalServices,
} from './roleRegistry.js';
import { CommonAuthService } from './services.js';
import { mapCapabilitiesToServices } from './capabilityMapper.js';
import {
  HostOnboardingSdk,
} from './orchestration/host-onboarding-sdk.js';
import { IndividualControllerSdk } from './orchestration/individual-controller-sdk.js';
import { IndividualMemberSdk } from './orchestration/individual-member-sdk.js';
import { OrganizationControllerSdk } from './orchestration/organization-controller-sdk.js';
import { OrganizationEmployeeSdk } from './orchestration/organization-employee-sdk.js';
import { PersonalSdk } from './orchestration/personal-sdk.js';
import { ProfessionalSdk } from './orchestration/professional-sdk.js';
import { createSyntheticSubmitAndPollResult, type FrontLicenseListSearchInput, type FrontLicenseOfferSearchInput, type FrontLicenseOrderSearchInput, type FrontOrganizationEmployeeSearchInput, type FrontRuntimeClient } from './orchestration/client-port.js';

/**
 * Role-scoped session object returned by `ClientSDK.initializeSession(...)`.
 *
 * It exposes the common/auth surface plus the services allowed by the current
 * profile capabilities.
 *
 * Architectural note:
 * `ProfileManager` remains the frontend session/composition entry point, but it
 * also materializes actor-scoped facades that mirror `gdc-sdk-node-ts`.
 *
 * The goal is to preserve the legacy/frontend-friendly session API while
 * keeping the same actor boundaries as the backend runtime.
 */
export class ProfileManager {
  public readonly profile: Profile;
  public readonly orgDidDoc: { id: string };
  public readonly common: CommonServices;
  public readonly orgAdmin?: OrgAdminServices;
  public readonly familyAdmin?: FamilyAdminServices;
  public readonly individual?: IndividualServices;
  public readonly professional?: ProfessionalServices;
  private readonly runtimeClient: FrontRuntimeClient;

  /**
   * @param profile Current logical profile.
   * @param orgDid DID of the provider/organization used as the session anchor.
   */
  constructor(profile: Profile, orgDid: string) {
    this.profile = profile;
    this.orgDidDoc = { id: orgDid };
    this.common = { auth: new CommonAuthService() };
    const mapped = mapCapabilitiesToServices(profile, profile.appType);
    this.orgAdmin = mapped.orgAdmin;
    this.familyAdmin = mapped.familyAdmin;
    this.individual = mapped.individual;
    this.professional = mapped.professional;
    this.runtimeClient = {
      activateOrganizationInGatewayFromIcaProof: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.activateOrganizationInGatewayFromIcaProof(hostCtx, input);
      },
      confirmLegalOrganizationOrder: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.confirmLegalOrganizationOrder(hostCtx, input);
      },
      disableHost: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.disableHost(hostCtx, input);
      },
      purgeHost: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.purgeHost(hostCtx, input);
      },
      createOrganizationEmployee: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.createOrganizationEmployee(ctx.providerDid, ctx.idToken, input)
          .then((result) => createSyntheticSubmitAndPollResult(result.thid));
      },
      searchOrganizationEmployees: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.searchOrganizationEmployees(ctx.providerDid, ctx.idToken, input);
      },
      searchOrganizationLicenses: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.searchOrganizationLicenses(ctx.providerDid, ctx.idToken, input);
      },
      listOrganizationLicenses: (ctx, input = {}) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.listOrganizationLicenses(ctx.providerDid, ctx.idToken, input);
      },
      searchOrganizationLicenseOffers: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.searchOrganizationLicenseOffers(ctx.providerDid, ctx.idToken, input);
      },
      listOrganizationLicenseOffers: (ctx, input = {}) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.listOrganizationLicenseOffers(ctx.providerDid, ctx.idToken, input);
      },
      searchOrganizationLicenseOrders: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.searchOrganizationLicenseOrders(ctx.providerDid, ctx.idToken, input);
      },
      listOrganizationLicenseOrders: (ctx, input = {}) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.listOrganizationLicenseOrders(ctx.providerDid, ctx.idToken, input);
      },
      disableEmployee: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.disableEmployee(ctx.providerDid, ctx.idToken, input);
      },
      purgeEmployee: (ctx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.purgeEmployee(ctx.providerDid, ctx.idToken, input);
      },
      disableTenant: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.disableTenant(hostCtx, input);
      },
      purgeTenant: (hostCtx, input) => {
        if (!this.orgAdmin?.admin) throw new Error('orgAdmin.admin service is not available for this profile.');
        return this.orgAdmin.admin.purgeTenant(hostCtx, input);
      },
      activateEmployeeDeviceWithActivationRequest: (ctx, input) =>
        this.common.auth.activateEmployeeDeviceWithActivationRequest(input.activationCode, ctx.providerDid, ctx.idToken, input.dcrPayload),
      requestSmartToken: (input) => this.common.auth.requestSmartToken(input),
      startIndividualOrganization: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.startIndividualOrganization(ctx.providerDid, ctx.idToken, input);
      },
      confirmIndividualOrganizationOrder: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.confirmIndividualOrganizationOrder(ctx.providerDid, ctx.idToken, input);
      },
      disableIndividual: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.disableIndividual(ctx.providerDid, ctx.idToken, input);
      },
      purgeIndividual: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.purgeIndividual(ctx.providerDid, ctx.idToken, input);
      },
      disableIndividualMember: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.disableIndividualMember(ctx.providerDid, ctx.idToken, input);
      },
      purgeIndividualMember: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.purgeIndividualMember(ctx.providerDid, ctx.idToken, input);
      },
      searchIndividualLicenses: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.searchIndividualLicenses(ctx.providerDid, ctx.idToken, input);
      },
      listIndividualLicenses: (ctx, input = {}) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.listIndividualLicenses(ctx.providerDid, ctx.idToken, input);
      },
      searchIndividualLicenseOffers: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.searchIndividualLicenseOffers(ctx.providerDid, ctx.idToken, input);
      },
      listIndividualLicenseOffers: (ctx, input = {}) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.listIndividualLicenseOffers(ctx.providerDid, ctx.idToken, input);
      },
      searchIndividualLicenseOrders: (ctx, input) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.searchIndividualLicenseOrders(ctx.providerDid, ctx.idToken, input);
      },
      listIndividualLicenseOrders: (ctx, input = {}) => {
        if (!this.familyAdmin?.admin) throw new Error('familyAdmin.admin service is not available for this profile.');
        return this.familyAdmin.admin.listIndividualLicenseOrders(ctx.providerDid, ctx.idToken, input);
      },
      grantProfessionalAccess: (ctx, input) => {
        if (this.professional?.physician) {
          return this.professional.physician.grantProfessionalAccess({ ...input, providerDid: ctx.providerDid, requiredScope: ctx.requiredScope, idToken: ctx.idToken });
        }
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.grantProfessionalAccess({ ...input, providerDid: ctx.providerDid, requiredScope: ctx.requiredScope || '', idToken: ctx.idToken });
      },
      importIpsOrFhirAndUpdateIndex: (ctx, input) => {
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.importIpsOrFhirAndUpdateIndex(
          input.compositionPayload,
          ctx.providerDid,
          ctx.requiredScope || '',
          ctx.idToken,
          input.format,
        ).then((result) => createSyntheticSubmitAndPollResult(result.thid));
      },
      upsertRelatedPersonAndPoll: (ctx, input) => {
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.upsertRelatedPersonAndPoll(
          input.relatedPersonPayload,
          ctx.providerDid,
          ctx.requiredScope || '',
          ctx.idToken,
        );
      },
      ingestCommunicationAndUpdateIndex: (ctx, input) => {
        const communicationInput = input.communicationJob || input.communicationPayload;
        if (!communicationInput) throw new Error('Clinical ingestion requires communicationJob.');
        if (this.professional?.physician) {
          return this.professional.physician.ingestCommunicationAndUpdateIndex(
            communicationInput,
            ctx.providerDid,
            ctx.requiredScope || '',
            ctx.idToken,
            input.pathFormatSegment,
          );
        }
        if (this.professional?.paramedic) {
          return this.professional.paramedic.ingestCommunicationAndUpdateIndex(
            communicationInput,
            ctx.providerDid,
            ctx.requiredScope || '',
            ctx.idToken,
            input.pathFormatSegment,
          );
        }
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.ingestCommunicationAndUpdateIndex(
          communicationInput,
          ctx.providerDid,
          ctx.requiredScope || '',
          ctx.idToken,
          input.pathFormatSegment,
        );
      },
      updateClinicalSection: (ctx, input) => {
        const ingest = this.runtimeClient.ingestCommunicationAndUpdateIndex;
        if (!ingest) throw new Error('Clinical ingestion is not available for this profile.');
        return ingest(ctx, {
          communicationJob: createClinicalSectionUpdateOutboxJob(input),
          clinicalFormat: input.clinicalFormat,
          transportProfile: input.transportProfile,
          pollOptions: input.pollOptions,
        });
      },
      updateClinicalSummary: (ctx, input) => {
        const ingest = this.runtimeClient.ingestCommunicationAndUpdateIndex;
        if (!ingest) throw new Error('Clinical ingestion is not available for this profile.');
        return ingest(ctx, {
          communicationJob: createClinicalSummaryUpdateOutboxJob(input),
          clinicalFormat: input.clinicalFormat,
          transportProfile: input.transportProfile,
          pollOptions: input.pollOptions,
        });
      },
      generateDigitalTwinFromSubjectData: (ctx, input) => {
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.generateDigitalTwinFromSubjectData(
          input.compositionPayload,
          ctx.providerDid,
          ctx.requiredScope || '',
          ctx.idToken,
          input.format,
        ).then((result) => createSyntheticSubmitAndPollResult(result.thid));
      },
      searchClinicalBundle: (ctx, input) => {
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.searchClinicalBundle(input as any, ctx.providerDid, ctx.requiredScope || '', ctx.idToken);
      },
      getLatestIps: (ctx, subject) => {
        if (!this.individual?.service) throw new Error('individual.service is not available for this profile.');
        return this.individual.service.getLatestIps(subject, ctx.providerDid, ctx.requiredScope || '', ctx.idToken);
      },
      submitAndPoll: async (_submitPath, _pollPath, payload) => createSyntheticSubmitAndPollResult(String(payload.thid || `front-${Date.now()}`)),
    };
  }

  /**
   * Organization-admin helper for employee/professional creation.
   */
  public async createOrganizationEmployee(
    providerDid: string,
    idToken: string,
    params: {
      email: string;
      role: string;
      userClass?: DeviceUserClass;
      type?: DeviceAppType;
    },
  ): Promise<{ thid: string }> {
    if (!this.orgAdmin?.admin) {
      throw new Error('orgAdmin.admin service is not available for this profile.');
    }
    return this.orgAdmin.admin.createOrganizationEmployee(providerDid, idToken, params);
  }

  /**
   * Organization-admin helper to search employee bundles through the frontend runtime.
   */
  public async searchOrganizationEmployees(params: {
    providerDid: string;
    idToken: string;
    employeeClaims?: FrontOrganizationEmployeeSearchInput['employeeClaims'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.orgAdmin?.admin) {
      throw new Error('orgAdmin.admin service is not available for this profile.');
    }
    return this.orgAdmin.admin.searchOrganizationEmployees(
      params.providerDid,
      params.idToken,
      {
        employeeClaims: params.employeeClaims,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Organization-admin helper to search/list tenant-owned license seats.
   */
  public async searchOrganizationLicenses(params: {
    providerDid: string;
    idToken: string;
    licenseQuery?: FrontLicenseListSearchInput['licenseQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.orgAdmin?.admin) {
      throw new Error('orgAdmin.admin service is not available for this profile.');
    }
    return this.orgAdmin.admin.searchOrganizationLicenses(
      params.providerDid,
      params.idToken,
      {
        licenseQuery: params.licenseQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Organization-admin helper to search/list hosted commercial offer records.
   */
  public async searchOrganizationLicenseOffers(params: {
    providerDid: string;
    idToken: string;
    offerQuery?: FrontLicenseOfferSearchInput['offerQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.orgAdmin?.admin) {
      throw new Error('orgAdmin.admin service is not available for this profile.');
    }
    return this.orgAdmin.admin.searchOrganizationLicenseOffers(
      params.providerDid,
      params.idToken,
      {
        offerQuery: params.offerQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Family-admin helper to search/list subject-side commercial offer records.
   */
  public async searchIndividualLicenseOffers(params: {
    providerDid: string;
    idToken: string;
    offerQuery?: FrontLicenseOfferSearchInput['offerQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.familyAdmin?.admin) {
      throw new Error('familyAdmin.admin service is not available for this profile.');
    }
    return this.familyAdmin.admin.searchIndividualLicenseOffers(
      params.providerDid,
      params.idToken,
      {
        offerQuery: params.offerQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Organization-admin helper to search/list hosted commercial order/payment records.
   */
  public async searchOrganizationLicenseOrders(params: {
    providerDid: string;
    idToken: string;
    orderQuery?: FrontLicenseOrderSearchInput['orderQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.orgAdmin?.admin) {
      throw new Error('orgAdmin.admin service is not available for this profile.');
    }
    return this.orgAdmin.admin.searchOrganizationLicenseOrders(
      params.providerDid,
      params.idToken,
      {
        orderQuery: params.orderQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Family-admin helper to search/list subject-side commercial order/payment records.
   */
  public async searchIndividualLicenseOrders(params: {
    providerDid: string;
    idToken: string;
    orderQuery?: FrontLicenseOrderSearchInput['orderQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.familyAdmin?.admin) {
      throw new Error('familyAdmin.admin service is not available for this profile.');
    }
    return this.familyAdmin.admin.searchIndividualLicenseOrders(
      params.providerDid,
      params.idToken,
      {
        orderQuery: params.orderQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Family/individual-admin helper to search/list subject-side license seats.
   */
  public async searchIndividualLicenses(params: {
    providerDid: string;
    idToken: string;
    licenseQuery?: FrontLicenseListSearchInput['licenseQuery'];
    requestThid?: string;
  }): Promise<SubmitAndPollResult> {
    if (!this.familyAdmin?.admin) {
      throw new Error('familyAdmin.admin service is not available for this profile.');
    }
    return this.familyAdmin.admin.searchIndividualLicenses(
      params.providerDid,
      params.idToken,
      {
        licenseQuery: params.licenseQuery,
        requestThid: params.requestThid,
      },
    );
  }

  /**
   * Family/individual-admin helper for subject organization/index bootstrap.
   */
  public async bootstrapSubjectOrganizationIndex(params: {
    registrationClaims: object;
    providerDid: string;
    idToken: string;
    acceptedOfferId?: string;
  }): Promise<{ registrationThid: string; confirmationThid?: string }> {
    if (!this.familyAdmin?.admin) {
      throw new Error('familyAdmin.admin service is not available for this profile.');
    }
    return this.familyAdmin.admin.bootstrapSubjectOrganizationIndex(params);
  }

  /**
   * Individual-service helper to import a FHIR payload or IPS bundle.
   */
  public async importIpsOrFhirAndUpdateIndex(params: {
    compositionPayload: object;
    providerDid: string;
    requiredScope: string;
    idToken: string;
    format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
  }): Promise<{ thid: string }> {
    if (!this.individual?.service) {
      throw new Error('individual.service is not available for this profile.');
    }
    return this.individual.service.importIpsOrFhirAndUpdateIndex(
      params.compositionPayload,
      params.providerDid,
      params.requiredScope,
      params.idToken,
      params.format,
    );
  }

  /**
   * Individual-service helper to create a consent-based access grant for a professional.
   */
  public async grantProfessionalAccess(params: {
    subjectDid?: string;
    /**
     * Compatibility/extension field.
     *
     * CORE canonical consent examples identify the subject with `subjectDid`.
     */
    subjectPhone?: string;
    /**
     * Compatibility/extension display hint for phone-oriented UX flows.
     */
    subjectGivenName?: string;
    /**
     * Canonical flat consent actor identifier input.
     *
     * Preferred forms:
     * - `did:web:...`
     * - `user@example.org`
     * - `tel:+34600111222`
     * - `ES`
     * - comma-separated list or string array of those values
     *
     * A legacy structured object is still accepted for compatibility.
     */
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
    /**
     * @deprecated Use `actorId`.
     */
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
    providerDid: string;
    requiredScope: string;
    idToken: string;
    consentIdentifier?: string;
    consentDate?: string;
    /** ISO 8601 instant persisted as `Consent.period-end` for temporary access. */
    periodEnd?: string;
    decision?: 'permit' | 'deny';
    eventBasedOn?: string;
    sourceReference?: string;
    attachmentContentType?: string;
    attachmentBase64?: string;
  }): Promise<{
    thid: string;
    subjectIdentifier: string;
    actorIdentifier: string;
    consentClaims: Record<string, unknown>;
    claimsCid?: string;
  }> {
    if (!this.individual?.service) {
      throw new Error('individual.service is not available for this profile.');
    }
    return this.individual.service.grantProfessionalAccess(params);
  }

  /**
   * Individual-service helper to generate a digital twin projection from subject data.
   */
  public async generateDigitalTwinFromSubjectData(params: {
    compositionPayload: object;
    providerDid: string;
    requiredScope: string;
    idToken: string;
    format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api';
  }): Promise<{ thid: string }> {
    if (!this.individual?.service) {
      throw new Error('individual.service is not available for this profile.');
    }
    return this.individual.service.generateDigitalTwinFromSubjectData(
      params.compositionPayload,
      params.providerDid,
      params.requiredScope,
      params.idToken,
      params.format,
    );
  }

  public asHostOnboarding(): HostOnboardingSdk {
    if (!this.orgAdmin?.admin) throw new Error('HostOnboardingSdk is not available for this profile.');
    return new HostOnboardingSdk(this.runtimeClient);
  }

  public asOrganizationController(): OrganizationControllerSdk {
    if (!this.orgAdmin?.admin) throw new Error('OrganizationControllerSdk is not available for this profile.');
    return new OrganizationControllerSdk(this.runtimeClient);
  }

  public asOrganizationEmployee(): OrganizationEmployeeSdk {
    if (this.profile.appType !== 'Organization') {
      throw new Error('OrganizationEmployeeSdk is not available for this profile.');
    }
    return new OrganizationEmployeeSdk(this.runtimeClient);
  }

  public asIndividualController(): IndividualControllerSdk {
    if (!this.familyAdmin?.admin) throw new Error('IndividualControllerSdk is not available for this profile.');
    return new IndividualControllerSdk(this.runtimeClient);
  }

  public asIndividualMember(): IndividualMemberSdk {
    if (!this.individual?.service) throw new Error('IndividualMemberSdk is not available for this profile.');
    return new IndividualMemberSdk(this.runtimeClient);
  }

  public asPersonal(): PersonalSdk {
    if (!this.familyAdmin?.admin && !this.individual?.service) {
      throw new Error('PersonalSdk is not available for this profile.');
    }
    return new PersonalSdk(this.runtimeClient);
  }

  public asProfessional(): ProfessionalSdk {
    if (!this.professional?.physician && !this.professional?.paramedic) {
      throw new Error('ProfessionalSdk is not available for this profile.');
    }
    return new ProfessionalSdk(this.runtimeClient);
  }
}

/**
 * Preferred neutral frontend actor-session surface.
 *
 * Keep `ProfileManager` for compatibility with earlier app-facing terminology.
 */
export { ProfileManager as ActorSession };
