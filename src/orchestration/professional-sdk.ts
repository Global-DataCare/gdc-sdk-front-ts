// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  buildProfessionalIdentityVpPayload,
  buildUnsignedProfessionalIdentityVpJwt,
  getProfessionalIdentitySameAs,
  getProfessionalIdentityVC,
  type ProfessionalEmployeeCredentialInput,
  type ProfessionalSmartVpPayloadInput,
} from 'gdc-common-utils-ts';
import type { PollOptions, SubmitAndPollResult, SubmitPayload } from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontCommunicationIngestionInput, type FrontGrantProfessionalAccessInput, type FrontGrantProfessionalAccessResult, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class ProfessionalSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

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

  public grantProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(ctx, input);
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
