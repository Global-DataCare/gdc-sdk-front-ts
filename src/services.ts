// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
/**
 * @fileoverview Frontend-only service facades.
 *
 * @architecture 101
 * Keep this layer free from GW routing/crypto concerns. Product apps should call
 * their portal/BFF here and map responses into shared DTOs.
 */

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import { RELATED_PROFILE_SEARCH_PARAM_ACTOR_IDENTIFIER } from 'gdc-sdk-core-ts';
import type { FrontRelatedProfileSearchResult, FrontRelatedProfileSummary } from './types.js';

function requireNonEmptyText(value: unknown, fieldName: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

export class CommonAuthService {
  public async activateDevice(
    _licenseCode: string,
    _providerDid: string,
    _idToken: string,
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }
}

export class OrgAdminService {
  public async createOrganizationEmployee(
    _providerDid: string,
    _idToken: string,
    _params: {
      email: string;
      role: string;
      userClass?: DeviceUserClass;
      type?: DeviceAppType;
    },
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }
}

export class FamilyAdminService {
  public async bootstrapSubjectOrganizationIndex(
    _params: {
      registrationClaims: object;
      providerDid: string;
      idToken: string;
      acceptedOfferId?: string;
    },
  ): Promise<{ registrationThid: string; confirmationThid?: string }> {
    return { registrationThid: `thid-${Date.now()}` };
  }
}

export class IndividualService {
  /**
   * Imports a document/FHIR payload for subject indexing.
   *
   * Canonical example input lives in:
   * `gdc-common-utils-ts/examples`
   */
  public async importIpsOrFhirAndUpdateIndex(
    _compositionPayload: object,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api',
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }

  public async grantProfessionalAccess(_params: {
    subjectDid?: string;
    /**
     * Compatibility/extension field.
     *
     * CORE canonical consent examples identify the subject with `subjectDid`.
     * Phone-based consent targeting belongs to extension layers, not the base
     * CORE GW contract.
     */
    subjectPhone?: string;
    /**
     * Compatibility/extension display hint.
     *
     * Keep this only for UX layers that still surface phone/notification flows.
     * CORE canonical examples do not require it.
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
    return {
      thid: `thid-${Date.now()}`,
      subjectIdentifier: '',
      actorIdentifier: '',
      consentClaims: {},
    };
  }

  public async generateDigitalTwinFromSubjectData(
    _compositionPayload: object,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api',
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }

  /**
   * Sends a lightweight communication request description.
   *
   * Canonical example input lives in:
   * `gdc-common-utils-ts/examples`
   */
  public async sendCommunication(
    _communication: {
      thid?: string;
      pthid?: string;
      channelId?: string;
      partOf?: string;
      subject: string;
      text?: string;
      sender?: string;
      recipient?: string | string[];
      sent?: string;
      category?: string | string[];
      attachments?: Array<{ contentType?: string; title?: string; dataBase64?: string; url?: string }>;
      claims?: Record<string, unknown>;
    },
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api',
  ): Promise<{ thid: string }> {
    requireNonEmptyText(_communication?.subject, 'sendCommunication subject');
    requireNonEmptyText(_providerDid, 'sendCommunication providerDid');
    requireNonEmptyText(_requiredScope, 'sendCommunication requiredScope');
    requireNonEmptyText(_idToken, 'sendCommunication idToken');
    return { thid: `thid-${Date.now()}` };
  }

  /**
   * Builds a lightweight clinical bundle search request description.
   *
   * Canonical example input lives in:
   * `gdc-common-utils-ts/examples`
   */
  public async searchClinicalBundle(
    _query: {
      subject: string;
      section?: string | string[];
      includedTypes?: string[];
      date?: { start?: string; end?: string };
      code?: string | string[];
      category?: string | string[];
      author?: string | string[];
      thid?: string;
      pthid?: string;
      channelId?: string;
      partOf?: string;
      searchParams?: Record<string, string | number | boolean | undefined>;
    },
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
  ): Promise<{ thid: string }> {
    requireNonEmptyText(_query?.subject, 'searchClinicalBundle subject');
    requireNonEmptyText(_providerDid, 'searchClinicalBundle providerDid');
    requireNonEmptyText(_requiredScope, 'searchClinicalBundle requiredScope');
    requireNonEmptyText(_idToken, 'searchClinicalBundle idToken');
    return { thid: `thid-${Date.now()}` };
  }

  public async getLatestIps(
    _subject: string,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _date?: { start?: string; end?: string },
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }

  /**
   * Placeholder frontend-facing related-profile query surface.
   *
   * Product integrations are expected to call a portal/BFF endpoint such as
   * `GET /api/personal/related-profiles` and map the response to this shared DTO.
   */
  public async listRelatedProfiles(
    actorIdentifier: string,
  ): Promise<FrontRelatedProfileSearchResult> {
    requireNonEmptyText(actorIdentifier, `listRelatedProfiles ${RELATED_PROFILE_SEARCH_PARAM_ACTOR_IDENTIFIER}`);
    const data: FrontRelatedProfileSummary[] = [];
    return {
      actorIdentifier,
      total: data.length,
      data,
    };
  }
}

export class PhysicianService {}
export class ParamedicService {}
