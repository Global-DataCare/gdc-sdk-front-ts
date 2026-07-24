// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  ClinicalSummaryReadResult,
  ClinicalSummaryRequestInput,
  SubmitAndPollResult,
} from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontClinicalBundleSearchInput, type FrontClinicalSectionUpdateInput, type FrontClinicalSummaryUpdateInput, type FrontCommunicationIngestionInput, type FrontRelatedPersonUpsertInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class IndividualMemberSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  /**
   * @deprecated Compatibility adapter for the older direct RelatedPerson
   * route. Author a typed Bundle and use
   * `ingestCommunicationAndUpdateIndex(...)` for new flows.
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

  /** Delegates a permitted member write to the same canonical clinical outbox. */
  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  /** Updates one authorized clinical section through a scoped batch/collection. */
  public updateClinicalSection(ctx: FrontRouteContext, input: FrontClinicalSectionUpdateInput): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'updateClinicalSection')(ctx, input);
  }

  /** Updates an authorized multi-section summary document. */
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
}
