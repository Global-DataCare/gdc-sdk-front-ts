// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { PollOptions, SubmitAndPollResult } from 'gdc-sdk-core-ts';
import { requireClientMethod, type FrontCommunicationIngestionInput, type FrontDigitalTwinGenerationInput, type FrontGrantProfessionalAccessInput, type FrontGrantProfessionalAccessResult, type FrontIndividualMemberLifecycleInput, type FrontIndividualOrganizationBootstrapInput, type FrontIndividualOrganizationConfirmOrderInput, type FrontIndividualOrganizationLifecycleInput, type FrontIndividualOrganizationStartResult, type FrontIpsOrFhirImportInput, type FrontRelatedPersonUpsertInput, type FrontRouteContext, type FrontRuntimeClient, type FrontSmartTokenExchangeResult, type FrontSmartTokenRequestInput } from './client-port.js';

export class IndividualControllerSdk {
  constructor(private readonly client: FrontRuntimeClient) {}

  public startIndividualOrganization(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationBootstrapInput,
  ): Promise<FrontIndividualOrganizationStartResult> {
    return requireClientMethod(this.client, 'startIndividualOrganization')(ctx, input);
  }

  public confirmIndividualOrganizationOrder(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationConfirmOrderInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'confirmIndividualOrganizationOrder')(ctx, input);
  }

  public disableIndividual(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableIndividual')(ctx, input, pollOptions);
  }

  public purgeIndividual(
    ctx: FrontRouteContext,
    input: FrontIndividualOrganizationLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeIndividual')(ctx, input, pollOptions);
  }

  public disableIndividualMember(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'disableIndividualMember')(ctx, input, pollOptions);
  }

  public purgeIndividualMember(
    ctx: FrontRouteContext,
    input: FrontIndividualMemberLifecycleInput,
    pollOptions?: PollOptions,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'purgeIndividualMember')(ctx, input, pollOptions);
  }

  public grantProfessionalAccess(
    ctx: FrontRouteContext,
    input: FrontGrantProfessionalAccessInput,
  ): Promise<FrontGrantProfessionalAccessResult> {
    return requireClientMethod(this.client, 'grantProfessionalAccess')(ctx, input);
  }

  public importIpsOrFhirAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontIpsOrFhirImportInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'importIpsOrFhirAndUpdateIndex')(ctx, input);
  }

  public upsertRelatedPersonAndPoll(
    ctx: FrontRouteContext,
    input: FrontRelatedPersonUpsertInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'upsertRelatedPersonAndPoll')(ctx, input);
  }

  public ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'ingestCommunicationAndUpdateIndex')(ctx, input);
  }

  public generateDigitalTwinFromSubjectData(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinGenerationInput,
  ): Promise<SubmitAndPollResult> {
    return requireClientMethod(this.client, 'generateDigitalTwinFromSubjectData')(ctx, input);
  }

  public requestSmartToken(input: FrontSmartTokenRequestInput): Promise<FrontSmartTokenExchangeResult> {
    return requireClientMethod(this.client, 'requestSmartToken')(input);
  }
}
