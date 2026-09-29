// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { HealthcareConsentPurposes, ServiceCapability } from 'gdc-common-utils-ts/constants';
import { CompositionClaim } from 'gdc-common-utils-ts/models';
import {
  requireClientMethod,
  type FrontDigitalTwinMaterializationInput,
  type FrontDigitalTwinSearchInput,
  type FrontDigitalTwinSearchResult,
  type FrontDigitalTwinSelectionInput,
  type FrontRouteContext,
  type FrontRuntimeClient,
  type FrontSmartTokenExchangeResult,
  type FrontSmartTokenRequestInput,
} from './client-port.js';
import type { SubmitAndPollResult } from 'gdc-sdk-core-ts';

const DIGITAL_TWIN_SUBJECT_URN_UUID =
  /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FrontDigitalTwinSearchParameter = Object.freeze({
  Section: 'section',
  DateFrom: 'date-from',
  DateTo: 'date-to',
  Text: 'text',
  MetaTag: 'Composition.meta-tag',
});

/** Rejects operational DIDs and malformed pseudonymous subject identifiers. */
export function assertFrontDigitalTwinSubjectId(value: unknown): asserts value is string {
  if (!DIGITAL_TWIN_SUBJECT_URN_UUID.test(String(value || '').trim())) {
    throw new Error('Digital twin subject must be a valid urn:uuid identifier.');
  }
}

/** Browser-safe research facade backed by an application/BFF runtime adapter. */
export class DigitalTwinSdk {
  private smartAccessToken?: string;
  private researcherDid?: string;

  constructor(private readonly client: FrontRuntimeClient, actorDid?: string) {
    this.researcherDid = String(actorDid || '').trim() || undefined;
  }

  public async requestSmartToken(
    input: FrontSmartTokenRequestInput,
  ): Promise<FrontSmartTokenExchangeResult> {
    const requestedActorDid = String(input.actorDid || '').trim() || undefined;
    if (this.researcherDid && requestedActorDid && requestedActorDid !== this.researcherDid) {
      throw new Error('DigitalTwinSdk actorDid must match the actor session.');
    }
    const actorDid = this.researcherDid || requestedActorDid;
    const scopes = (input.scopes?.length ? input.scopes : [ServiceCapability.DigitalTwinReader])
      .map((scope) => scope === ServiceCapability.DigitalTwinReader
        ? `${scope}?subject=*`
        : scope);
    const result = await requireClientMethod(this.client, 'requestSmartToken')({
      ...input,
      actorDid,
      purpose: input.purpose || HealthcareConsentPurposes.Research,
      scopes,
    });
    if (result.accessToken) this.smartAccessToken = result.accessToken;
    if (actorDid) this.researcherDid = actorDid;
    return result;
  }

  public search(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSearchInput,
  ): Promise<FrontDigitalTwinSearchResult> {
    const filters = { ...(input.filters || {}) };
    const selectionSearch = Object.keys(filters).some((name) => {
      const normalized = String(name || '').trim().toLowerCase();
      return normalized === 'composition.meta-tag' || normalized === 'composition.meta.tag';
    });
    if (selectionSearch) {
      if (!this.researcherDid) {
        throw new Error('Digital twin working-selection search requires an operational actor DID.');
      }
      const requestedAuthor = filters[CompositionClaim.Author];
      const requestedAuthors = Array.isArray(requestedAuthor)
        ? requestedAuthor.map(String)
        : requestedAuthor === undefined
          ? []
          : [String(requestedAuthor)];
      if (requestedAuthors.some((author) => author !== this.researcherDid)) {
        throw new Error('Digital twin selection author filter must match the actor session.');
      }
      filters[CompositionClaim.Author] = this.researcherDid;
    }
    return requireClientMethod(this.client, 'searchDigitalTwins')(ctx, {
      ...input,
      resourceType: 'ResearchSubject',
      filters,
      accessToken: input.accessToken || this.smartAccessToken,
    });
  }

  public saveSelection(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinSelectionInput,
  ): Promise<SubmitAndPollResult> {
    assertFrontDigitalTwinSubjectId(input.twinSubjectId);
    const requestedAuthorDid = String(input.authorDid || '').trim() || undefined;
    if (this.researcherDid && requestedAuthorDid && requestedAuthorDid !== this.researcherDid) {
      throw new Error('Digital twin selection authorDid must match the actor session.');
    }
    return requireClientMethod(this.client, 'saveDigitalTwinSelection')(ctx, {
      ...input,
      authorDid: this.researcherDid || requestedAuthorDid,
      accessToken: input.accessToken || this.smartAccessToken,
    });
  }

  public searchSelections(
    ctx: FrontRouteContext,
    input: Omit<FrontDigitalTwinSearchInput, 'filters'> & {
      section: string;
      tag: Readonly<{ system: string; code: string }>;
    },
  ): Promise<FrontDigitalTwinSearchResult> {
    const section = String(input.section || '').trim();
    const system = String(input.tag?.system || '').trim();
    const code = String(input.tag?.code || '').trim();
    if (!section) throw new Error('Digital twin selection section is required.');
    if (!system || !code) throw new Error('Digital twin selection tag requires system and code.');
    const { section: _section, tag: _tag, ...searchInput } = input;
    return this.search(ctx, {
      ...searchInput,
      filters: {
        [FrontDigitalTwinSearchParameter.Section]: section,
        [FrontDigitalTwinSearchParameter.MetaTag]: `${system}|${code}`,
      },
    });
  }

  public materialize(
    ctx: FrontRouteContext,
    input: FrontDigitalTwinMaterializationInput,
  ): Promise<SubmitAndPollResult> {
    assertFrontDigitalTwinSubjectId(input.twinSubjectId);
    return requireClientMethod(this.client, 'materializeDigitalTwin')(ctx, {
      ...input,
      accessToken: input.accessToken || this.smartAccessToken,
    });
  }
}
