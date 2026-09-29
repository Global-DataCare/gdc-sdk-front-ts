// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  buildIndividualMemberIdentityVpPayload,
  buildUnsignedIndividualMemberIdentityVpJwt,
  getIndividualMemberIdentitySameAs,
  getIndividualMemberIdentityVC,
  type IndividualMemberCredentialInput,
  type IndividualMemberVpPayloadInput,
} from 'gdc-common-utils-ts';

import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  SubmitAndPollResult,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontClinicalBundleSearchInput, type FrontClinicalSectionUpdateInput, type FrontClinicalSummaryUpdateInput, type FrontCommunicationIngestionInput, type FrontIndividualMemberLicenseTransitionInput, type FrontRelatedPersonUpsertInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput, type FrontSubjectSectionUpdateInput } from './client-port.js';

export class IndividualMemberSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  /**
   * Accepts one controller-issued invitation using the authenticated member's
   * verified actor identifier. Acceptance establishes the seat/relationship
   * lifecycle; the later SMART request is still narrowed by active Consent.
   */
  public acceptMemberInvitation(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLicenseTransitionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'transitionIndividualMemberLicense')(
      ctx,
      '_accept',
      input,
    );
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

  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
  }

  /** @deprecated Backend/BFF compatibility surface; never call from browser UI. */
  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  /** @deprecated Browser UI submits its section command Bundle to its BFF. */
  public updateClinicalSection(ctx: FrontRouteContext, input: FrontClinicalSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSection')(ctx, input);
  }

  /** Submits one authorized subject-owned section through the configured BFF. */
  public updateSubjectSection(ctx: FrontRouteContext, input: FrontSubjectSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateSubjectSection')(ctx, input);
  }

  /** @deprecated Browser UI submits its Composition-first Bundle to its BFF. */
  public updateClinicalSummary(ctx: FrontRouteContext, input: FrontClinicalSummaryUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSummary')(ctx, input);
  }

  /** Reads the member-authorized `$summary` document without mutating the index. */
  public requestClinicalSummary(
    ctx: FrontRouteContext,
    input: ClinicalSummaryRequestInput,
  ): Promise<ClinicalSummaryReadResult> {
    return requireClientMethod(this.client, 'requestClinicalSummary')(ctx, input);
  }

  /** Reads clinical documents under the member's accepted consent and SMART scopes. */
  public searchClinicalBundle(
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'searchClinicalBundle')(ctx, input);
  }

  /** Reads the latest IPS permitted for this member and subject. */
  public getLatestIps(ctx: FrontRouteContext, subject: string): Promise<{ thid: string }> {
    return requireClientMethod(this.client, 'getLatestIps')(ctx, subject);
  }

  public getIdentitySameAs(input: IndividualMemberCredentialInput): string[] {
    return getIndividualMemberIdentitySameAs(input);
  }

  public getIdentityVC(input: IndividualMemberCredentialInput): Record<string, unknown> {
    return getIndividualMemberIdentityVC(input);
  }

  public buildIdentityVpPayload(input: IndividualMemberVpPayloadInput): Record<string, unknown> {
    return buildIndividualMemberIdentityVpPayload(input);
  }

  public buildUnsignedIdentityVpJwt(
    input: IndividualMemberVpPayloadInput,
    options: Readonly<{ nowSeconds?: number; ttlSeconds?: number; nonce?: string }> = {},
  ): string {
    return buildUnsignedIndividualMemberIdentityVpJwt(input, options);
  }
}
