// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  buildProfessionalIdentityVpPayload,
  buildUnsignedProfessionalIdentityVpJwt,
  getProfessionalIdentitySameAs,
  getProfessionalIdentityVC,
  type ProfessionalEmployeeCredentialInput,
  type ProfessionalSmartVpPayloadInput,
} from 'gdc-common-utils-ts';
import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  PollOptions,
  SubmitAndPollResult,
  SubmitPayload,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontClinicalBundleSearchInput, type FrontClinicalSectionUpdateInput, type FrontClinicalSummaryUpdateInput, type FrontCommunicationIngestionInput, type FrontGrantProfessionalAccessInput, type FrontGrantProfessionalAccessResult, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class ProfessionalSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  /**
   * Requests subject-scoped SMART material for the same professional DID used
   * by the consent grant and VP credential subject.
   *
   * Browser/product code should omit `audience`; its runtime client owns
   * provider discovery and concrete endpoint selection.
   */
  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
  }

  /**
   * Returns the normalized public continuity aliases that would be embedded in
   * the professional identity VC for SMART/OpenID4VP flows.
   */
  public getIdentitySameAs(input: ProfessionalEmployeeCredentialInput): string[] {
    return getProfessionalIdentitySameAs(input);
  }

  /**
   * Builds the canonical professional identity VC used by the shared SMART VP
   * helpers.
   */
  public getIdentityVC(input: ProfessionalEmployeeCredentialInput): Record<string, unknown> {
    return getProfessionalIdentityVC(input);
  }

  /**
   * Builds the canonical professional identity VP payload used by the shared
   * SMART/OpenID4VP helpers.
   */
  public buildIdentityVpPayload(input: ProfessionalSmartVpPayloadInput): Record<string, unknown> {
    return buildProfessionalIdentityVpPayload(input);
  }

  /**
   * Builds one unsigned compact VP JWT for the canonical professional
   * identity payload.
   */
  public buildUnsignedIdentityVpJwt(
    input: ProfessionalSmartVpPayloadInput,
    options: Readonly<{ nowSeconds?: number; ttlSeconds?: number; nonce?: string }> = {},
  ): string {
    return buildUnsignedProfessionalIdentityVpJwt(input, options);
  }

  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  /** Updates one consent-authorized clinical section through a scoped batch/collection. */
  public updateClinicalSection(ctx: FrontRouteContext, input: FrontClinicalSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSection')(ctx, input);
  }

  /** Updates a consent-authorized multi-section summary document. */
  public updateClinicalSummary(ctx: FrontRouteContext, input: FrontClinicalSummaryUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSummary')(ctx, input);
  }

  /** Reads the consent-authorized `$summary` document without ingestion. */
  public requestClinicalSummary(
    ctx: FrontRouteContext,
    input: ClinicalSummaryRequestInput,
  ): Promise<ClinicalSummaryReadResult> {
    return requireClientMethod(this.client, 'requestClinicalSummary')(ctx, input);
  }

  public grantProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(ctx, input);
  }

  public searchClinicalBundle(
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'searchClinicalBundle')(ctx, input);
  }

  public getLatestIps(ctx: FrontRouteContext, subject: string): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'getLatestIps')(ctx, subject);
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
