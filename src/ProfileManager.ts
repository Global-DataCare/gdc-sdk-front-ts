// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
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

/**
 * Role-scoped session object returned by `ClientSDK.initializeSession(...)`.
 *
 * It exposes the common/auth surface plus the services allowed by the current
 * profile capabilities.
 */
export class ProfileManager {
  public readonly profile: Profile;
  public readonly orgDidDoc: { id: string };
  public readonly common: CommonServices;
  public readonly orgAdmin?: OrgAdminServices;
  public readonly familyAdmin?: FamilyAdminServices;
  public readonly individual?: IndividualServices;
  public readonly professional?: ProfessionalServices;

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
    decision?: 'permit' | 'deny';
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
}

/**
 * Preferred neutral frontend actor-session surface.
 *
 * Keep `ProfileManager` for compatibility with earlier app-facing terminology.
 */
export { ProfileManager as ActorSession };
