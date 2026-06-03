// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DeviceAppType, DeviceUserClass } from 'gdc-common-utils-ts/constants';
import type { SubmitAndPollResult } from 'gdc-sdk-core-ts';
import {
  createSyntheticSubmitAndPollResult,
  type FrontGrantProfessionalAccessResult,
  type FrontSmartTokenExchangeResult,
  type FrontSmartTokenRequestInput,
} from './orchestration/client-port.js';

function requireNonEmptyText(value: unknown, fieldName: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function runtimeThid(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export class CommonAuthService {
  public async activateDevice(
    _licenseCode: string,
    _providerDid: string,
    _idToken: string,
  ): Promise<{ thid: string }> {
    return { thid: `thid-${Date.now()}` };
  }

  public async activateEmployeeDeviceWithActivationRequest(
    _activationCode: string,
    _providerDid: string,
    _idToken: string,
    _dcrPayload?: Record<string, unknown>,
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('employee-device-activation'));
  }

  public async requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    const scopes = [...new Set((input.scopes || []).filter(Boolean))];
    return {
      status: 'fetched',
      accessToken: `front-token-${Date.now()}`,
      tokenType: 'Bearer',
      scopes,
      statusCode: 200,
      response: {
        actorDid: input.actorDid,
        subjectDid: input.subjectDid,
        scopes,
      },
    };
  }
}

export class OrgAdminService {
  public async activateOrganizationInGatewayFromIcaProof(
    _input: {
      vpToken: string;
      controller?: Record<string, unknown>;
      service?: Record<string, unknown>;
      additionalClaims?: Record<string, unknown>;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('host-activation'));
  }

  public async confirmLegalOrganizationOrder(
    _input: {
      offerId: string;
      orderClaims?: Record<string, unknown>;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('host-order-confirmation'));
  }

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

  public async disableEmployee(
    _providerDid: string,
    _idToken: string,
    _input: {
      employeeClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('employee-disable'));
  }

  public async purgeEmployee(
    _providerDid: string,
    _idToken: string,
    _input: {
      employeeClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('employee-purge'));
  }
}

export class FamilyAdminService {
  public async startIndividualOrganization(
    _providerDid: string,
    _idToken: string,
    _params: {
      registrationClaims: object;
      acceptedOfferId?: string;
    },
  ): Promise<{ registrationThid: string; confirmationThid?: string }> {
    return { registrationThid: runtimeThid('individual-bootstrap') };
  }

  public async bootstrapSubjectOrganizationIndex(
    params: {
      registrationClaims: object;
      providerDid: string;
      idToken: string;
      acceptedOfferId?: string;
    },
  ): Promise<{ registrationThid: string; confirmationThid?: string }> {
    return this.startIndividualOrganization(params.providerDid, params.idToken, params);
  }

  public async confirmIndividualOrganizationOrder(
    _providerDid: string,
    _idToken: string,
    _input: {
      offerId: string;
      orderClaims?: Record<string, unknown>;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('individual-order-confirmation'));
  }

  public async disableIndividual(
    _providerDid: string,
    _idToken: string,
    _input: {
      organizationClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('individual-disable'));
  }

  public async purgeIndividual(
    _providerDid: string,
    _idToken: string,
    _input: {
      organizationClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('individual-purge'));
  }

  public async disableIndividualMember(
    _providerDid: string,
    _idToken: string,
    _input: {
      memberClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('individual-member-disable'));
  }

  public async purgeIndividualMember(
    _providerDid: string,
    _idToken: string,
    _input: {
      memberClaims?: Record<string, unknown>;
      resourceId?: string;
    },
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('individual-member-purge'));
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
  }): Promise<FrontGrantProfessionalAccessResult> {
    const thid = runtimeThid('consent');
    return {
      thid,
      consent: createSyntheticSubmitAndPollResult(thid),
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

  public async upsertRelatedPersonAndPoll(
    _relatedPersonPayload: object,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('related-person-upsert'));
  }

  public async ingestCommunicationAndUpdateIndex(
    _communicationPayload: object,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api',
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('communication-ingest'));
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
}

export class ParamedicService {
  public async requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return {
      status: 'fetched',
      accessToken: `front-token-${Date.now()}`,
      tokenType: 'Bearer',
      scopes: [...new Set((input.scopes || []).filter(Boolean))],
      statusCode: 200,
      response: { actorDid: input.actorDid },
    };
  }

  public async ingestCommunicationAndUpdateIndex(
    _communicationPayload: object,
    _providerDid: string,
    _requiredScope: string,
    _idToken: string,
    _format?: 'org.hl7.fhir.r4' | 'org.hl7.fhir.api',
  ): Promise<SubmitAndPollResult> {
    return createSyntheticSubmitAndPollResult(runtimeThid('professional-communication'));
  }
}

export class PhysicianService extends ParamedicService {
  public async grantProfessionalAccess(_params: Record<string, unknown>): Promise<FrontGrantProfessionalAccessResult> {
    const thid = runtimeThid('professional-consent');
    return {
      thid,
      consent: createSyntheticSubmitAndPollResult(thid),
      subjectIdentifier: '',
      actorIdentifier: '',
      consentClaims: {},
    };
  }
}
