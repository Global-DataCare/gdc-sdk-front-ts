// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  TransportProfiles,
  buildClinicalSummaryCommunicationJob,
  decodeTransportResponse,
  readClinicalSummaryOperationResult,
  renderCommunicationOutboxRequest,
  renderGatewayMessageRequest,
  renderTransportPollRequest,
  type RenderedTransportRequest,
  type CommunicationClinicalFormatRenderers,
  type SecureDidcommTransportAdapter,
  type SubmitAndPollResult,
  type TransportProfile,
  type ClinicalSummaryReadResult,
  type ClinicalSummaryRequestInput,
} from 'gdc-sdk-core-ts';
import type {
  FrontClinicalBundleSearchInput,
  FrontCommunicationIngestionInput,
  FrontRouteContext,
  FrontRuntimeClient,
} from './orchestration/client-port.js';

export type FrontClinicalCarrierResponse = Readonly<{
  status: number;
  body: unknown;
  location?: string;
  retryAfterMs?: number;
}>;

/**
 * Carrier-neutral request. HTTP, an offline sync queue, Bluetooth or another
 * local link receives the same already-rendered protected message.
 */
export type FrontClinicalCarrierRequest = Readonly<{
  phase: 'submit' | 'poll';
  path: string;
  authorization: string;
  message: RenderedTransportRequest;
}>;

export type FrontClinicalCarrier = Readonly<{
  /** Deliver an already-rendered message without decrypting or rebuilding it. */
  send(request: FrontClinicalCarrierRequest): Promise<FrontClinicalCarrierResponse>;
}>;

export type FrontClinicalRuntimeClientOptions = Readonly<{
  carrier: FrontClinicalCarrier;
  transportProfile?: TransportProfile;
  secureTransportAdapter?: SecureDidcommTransportAdapter;
  /** Product-supplied projections not owned by the generic frontend runtime. */
  communicationFormatRenderers?: CommunicationClinicalFormatRenderers;
  accessToken?: string;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
}>;

/**
 * Direct browser/mobile implementation of the canonical Node clinical surface.
 *
 * The client owns message rendering, SMART bearer use, thread correlation and
 * polling. The carrier owns delivery only. An offline-first carrier persists
 * `request.message` byte-for-byte with its `thid`; a Bluetooth carrier relays
 * that persisted JWE without seeing FHIR or wallet keys.
 *
 * A native confidential app must inject an unlocked wallet-backed
 * `secureTransportAdapter`. It should protect that wallet with the same
 * PIN-plus-device envelope described by the Node profile contract, replacing
 * Cloud KMS with Keychain/Keystore rather than weakening the KDF.
 */
export class FrontClinicalRuntimeClient implements FrontRuntimeClient {
  private readonly profile: TransportProfile;

  public constructor(private readonly options: FrontClinicalRuntimeClientOptions) {
    this.profile = options.transportProfile || TransportProfiles.DidcommPlainJson;
  }

  public async ingestCommunicationAndUpdateIndex(
    ctx: FrontRouteContext,
    input: FrontCommunicationIngestionInput,
  ): Promise<SubmitAndPollResult> {
    if (!input.communicationJob) {
      throw new Error('Direct clinical ingestion requires communicationJob.');
    }
    return this.submitCommunicationJobAndPoll(ctx, input.communicationJob, input);
  }

  /**
   * Reads `Subject/$summary` through an auditable Communication and returns the
   * authoritative Bundle with neutral section/type/date readers.
   *
   * This is a read lifecycle; it does not ingest resources or update indexes.
   */
  public async requestClinicalSummary(
    ctx: FrontRouteContext,
    input: ClinicalSummaryRequestInput,
  ): Promise<ClinicalSummaryReadResult> {
    const communicationJob = buildClinicalSummaryCommunicationJob(input);
    const operation = await this.submitCommunicationJobAndPoll(
      ctx,
      communicationJob,
      input,
    );
    return readClinicalSummaryOperationResult(operation);
  }

  private async submitCommunicationJobAndPoll(
    ctx: FrontRouteContext,
    communicationJob: NonNullable<FrontCommunicationIngestionInput['communicationJob']>,
    input: Readonly<{
      clinicalFormat?: string;
      transportProfile?: TransportProfile;
      pollOptions?: { timeoutMs?: number; intervalMs?: number };
      pathFormatSegment?: string;
    }>,
  ): Promise<SubmitAndPollResult> {
    const route = requireDirectRoute(ctx);
    const format = normalizeFormat(input.clinicalFormat || input.pathFormatSegment);
    const profile = input.transportProfile || this.profile;
    const submit = await renderCommunicationOutboxRequest(
      communicationJob,
      profile,
      this.options.secureTransportAdapter,
      {
        clinicalFormat: input.clinicalFormat || input.pathFormatSegment || 'api',
        formatRenderers: this.options.communicationFormatRenderers,
      },
    );
    return this.sendAndPoll(
      ctx,
      resourcePath(route, format, 'Communication', '_batch'),
      resourcePath(route, format, 'Communication', '_batch-response'),
      submit,
      profile,
      input.pollOptions,
    );
  }

  public async searchClinicalBundle(
    ctx: FrontRouteContext,
    input: FrontClinicalBundleSearchInput,
  ): Promise<SubmitAndPollResult & { thid: string }> {
    const route = requireDirectRoute(ctx);
    const profile = input.transportProfile || this.profile;
    const thid = input.requestThid || `bundle-search-${runtimeUuid()}`;
    const message = await renderGatewayMessageRequest({
      thid,
      body: {
        resourceType: 'Bundle',
        type: 'batch',
        entry: [{ request: { method: 'GET', url: buildBundleSearchQuery(input) } }],
      },
    }, profile, this.options.secureTransportAdapter);
    const result = await this.sendAndPoll(
      ctx,
      resourcePath(route, 'org.hl7.fhir.r4', 'Bundle', '_search'),
      resourcePath(route, 'org.hl7.fhir.r4', 'Bundle', '_search-response'),
      message,
      profile,
      input.pollOptions,
    );
    return { thid, ...result };
  }

  public getLatestIps(
    ctx: FrontRouteContext,
    subject: string,
  ): Promise<SubmitAndPollResult & { thid: string }> {
    return this.searchClinicalBundle(ctx, {
      subject,
      section: 'LOINC|60591-5',
      includedTypes: ['Composition', 'DocumentReference'],
    });
  }

  private async sendAndPoll(
    ctx: FrontRouteContext,
    submitPath: string,
    pollPath: string,
    submitMessage: RenderedTransportRequest,
    profile: TransportProfile,
    pollOptions?: { timeoutMs?: number; intervalMs?: number },
  ): Promise<SubmitAndPollResult> {
    const authorization = requireSmartBearer(ctx, this.options.accessToken);
    const submitted = await this.options.carrier.send({
      phase: 'submit',
      path: submitPath,
      authorization,
      message: submitMessage,
    });
    const submit = { status: submitted.status, location: submitted.location, body: submitted.body };
    if (submitted.status !== 202) {
      const body = await decodeTransportResponse(submitted.body, profile, this.options.secureTransportAdapter);
      return { submit, poll: { status: submitted.status, body, attempts: 1 } };
    }

    const started = Date.now();
    const timeoutMs = pollOptions?.timeoutMs ?? this.options.pollTimeoutMs ?? 30_000;
    const intervalMs = pollOptions?.intervalMs ?? this.options.pollIntervalMs ?? 500;
    let attempts = 0;
    while (Date.now() - started <= timeoutMs) {
      attempts += 1;
      const pollMessage = await renderTransportPollRequest(
        submitMessage.thid,
        profile,
        this.options.secureTransportAdapter,
      );
      const response = await this.options.carrier.send({
        phase: 'poll',
        path: pollPath,
        authorization,
        message: pollMessage,
      });
      if (response.status !== 202) {
        return {
          submit,
          poll: {
            status: response.status,
            body: await decodeTransportResponse(response.body, profile, this.options.secureTransportAdapter),
            attempts,
          },
        };
      }
      await delay(response.retryAfterMs ?? intervalMs);
    }
    throw new Error(`Clinical transport polling timed out for thread '${submitMessage.thid}'.`);
  }
}

/**
 * Create the online HTTP carrier.
 *
 * Expo should inject a durable outbox carrier instead. That carrier may choose
 * HTTP or Bluetooth at delivery time, but must preserve the rendered content
 * type, exact form-encoded JWE and thread id.
 */
export function createFetchFrontClinicalCarrier(input: Readonly<{
  baseUrl: string;
  fetchImpl?: typeof fetch;
}>): FrontClinicalCarrier {
  const baseUrl = input.baseUrl.replace(/\/$/, '');
  const fetchImpl = input.fetchImpl || fetch;
  return {
    async send(request) {
      const response = await fetchImpl(`${baseUrl}${request.path}`, {
        method: 'POST',
        headers: {
          Authorization: request.authorization,
          'Content-Type': request.message.contentType,
          Accept: request.message.accept,
        },
        body: typeof request.message.body === 'string'
          ? request.message.body
          : JSON.stringify(request.message.body),
      });
      const text = await response.text();
      return {
        status: response.status,
        body: parseCarrierBody(text),
        location: response.headers.get('location') || undefined,
        retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
      };
    },
  };
}

function requireDirectRoute(ctx: FrontRouteContext): { tenantId: string; jurisdiction: string; sector: string } {
  const tenantId = String(ctx.tenantId || '').trim();
  const jurisdiction = String(ctx.jurisdiction || '').trim();
  const sector = String(ctx.sector || '').trim();
  if (!tenantId || !jurisdiction || !sector) {
    throw new Error('Direct frontend clinical transport requires tenantId, jurisdiction and sector.');
  }
  return { tenantId, jurisdiction, sector };
}

function requireSmartBearer(ctx: FrontRouteContext, fallback?: string): string {
  const token = String(ctx.accessToken || fallback || '').trim();
  if (!token) throw new Error('Direct frontend clinical transport requires a SMART access token.');
  return `Bearer ${token}`;
}

function resourcePath(
  route: { tenantId: string; jurisdiction: string; sector: string },
  format: string,
  resourceType: string,
  action: string,
): string {
  return `/${encodeURIComponent(route.tenantId)}/cds-${encodeURIComponent(route.jurisdiction)}/v1/${encodeURIComponent(route.sector)}/individual/${encodeURIComponent(format)}/${encodeURIComponent(resourceType)}/${encodeURIComponent(action)}`;
}

function normalizeFormat(value?: string): string {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'api' || normalized === 'org.hl7.fhir.api') return 'org.hl7.fhir.api';
  if (normalized === 'r4' || normalized === 'fhir.r4' || normalized === 'org.hl7.fhir.r4') return 'org.hl7.fhir.r4';
  if (/^org\.hl7\.fhir\.[a-z0-9.-]+$/.test(normalized)) return normalized;
  throw new Error(`Unsupported Communication clinical format '${String(value || '')}'.`);
}

function buildBundleSearchQuery(input: FrontClinicalBundleSearchInput): string {
  const params = new URLSearchParams();
  params.set('type', 'document');
  params.set('subject', input.subject);
  setCsv(params, 'composition.section', input.section);
  setCsv(params, '_type', input.includedTypes);
  if (input.date?.start) params.set('start', input.date.start);
  if (input.date?.end) params.set('end', input.date.end);
  setCsv(params, 'code', input.code);
  setCsv(params, 'category', input.category);
  setCsv(params, 'author', input.author);
  if (input.thid) params.set('thid', input.thid);
  if (input.pthid) params.set('pthid', input.pthid);
  if (input.channelId) params.set('channelId', input.channelId);
  if (input.partOf) params.set('part-of', input.partOf);
  for (const [key, value] of Object.entries(input.extraSearchParams || {})) {
    if (value !== undefined && value !== null && String(value).trim()) params.set(key, String(value));
  }
  return `Bundle?${params.toString()}`;
}

function setCsv(params: URLSearchParams, key: string, value?: string | string[]): void {
  const normalized = (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(',');
  if (normalized) params.set(key, normalized);
}

function parseCarrierBody(value: string): unknown {
  if (!value) return undefined;
  try { return JSON.parse(value); } catch { return value; }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

function runtimeUuid(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
