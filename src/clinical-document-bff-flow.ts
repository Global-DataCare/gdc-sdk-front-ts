// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  ClinicalDocumentWorkingCopy,
  type ClinicalDocumentBundle,
} from './clinical-document-working-copy.js';

export type ClinicalDocumentCommandKind = 'import' | 'section-update';

export type ClinicalDocumentBffCommand = Readonly<{
  kind: ClinicalDocumentCommandKind;
  bundle: Record<string, unknown>;
}>;

export type ClinicalDocumentBffResult =
  | Readonly<{ state: 'accepted'; jobId: string; retryAfterMs?: number }>
  | Readonly<{ state: 'pending'; jobId: string; retryAfterMs?: number }>
  | Readonly<{ state: 'completed'; bundle: Record<string, unknown>; jobId?: string }>
  | Readonly<{ state: 'rejected'; message: string; jobId?: string }>;

export type ClinicalDocumentBffTransport = Readonly<{
  /** Submits the exact import/update command to the authenticated application BFF. */
  submit(command: ClinicalDocumentBffCommand): Promise<ClinicalDocumentBffResult>;
  /** Reads one accepted BFF job without exposing the backend outbox repository. */
  readJob(jobId: string): Promise<ClinicalDocumentBffResult>;
}>;

export type ClinicalDocumentBffFlowOptions = Readonly<{
  workingCopy: ClinicalDocumentWorkingCopy;
  transport: ClinicalDocumentBffTransport;
  onSnapshot(snapshot: ClinicalDocumentBundle | undefined): void;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
}>;

export type ClinicalDocumentBffFlowResult = Readonly<{
  bundle: ClinicalDocumentBundle;
  jobId?: string;
}>;

/** Raised when the BFF job remains valid but unconfirmed after the local wait window. */
export class ClinicalDocumentBffPendingError extends Error {
  public constructor(public readonly jobId: string) {
    super(`Clinical document job '${jobId}' is still pending.`);
    this.name = 'ClinicalDocumentBffPendingError';
  }
}

/**
 * Coordinates one optimistic IPS command with an asynchronous application BFF.
 *
 * The BFF owns its durable outbox, Communication creation, GW submit/poll and
 * authoritative `$summary` readback. This frontend flow owns only the
 * disposable working copy, job waiting and UI notifications.
 */
export class ClinicalDocumentBffFlow {
  public constructor(private readonly options: ClinicalDocumentBffFlowOptions) {}

  /**
   * Applies the command locally, submits that exact command, waits for an
   * accepted BFF job and reconciles the working copy from the terminal result.
   *
   * Network failures and timeouts leave the optimistic snapshot pending.
   * Definite BFF rejection restores the previous snapshot.
   */
  public async execute(
    command: ClinicalDocumentBffCommand,
    signal?: AbortSignal,
  ): Promise<ClinicalDocumentBffFlowResult> {
    const optimistic = command.kind === 'import'
      ? this.options.workingCopy.importDocumentOptimistically(command.bundle)
      : this.options.workingCopy.applyDocumentUpdateOptimistically(command.bundle);
    this.options.onSnapshot(optimistic);

    const submitted = await this.options.transport.submit(command);
    return this.resolve(submitted, signal);
  }

  private async resolve(
    result: ClinicalDocumentBffResult,
    signal?: AbortSignal,
  ): Promise<ClinicalDocumentBffFlowResult> {
    if (result.state === 'completed') {
      const authoritative = this.options.workingCopy.replaceFromClinicalSummary(result.bundle);
      this.options.onSnapshot(authoritative);
      return { bundle: authoritative, jobId: result.jobId };
    }
    if (result.state === 'rejected') {
      this.options.onSnapshot(this.options.workingCopy.rejectPendingChange());
      throw new Error(result.message);
    }

    const jobId = requireJobId(result.jobId);
    const timeoutMs = this.options.pollTimeoutMs ?? 30_000;
    const defaultIntervalMs = this.options.pollIntervalMs ?? 500;
    const startedAt = Date.now();
    let pending = result;

    while (Date.now() - startedAt <= timeoutMs) {
      if (signal?.aborted) throw signal.reason ?? new Error('Clinical document wait aborted.');
      await delay(pending.retryAfterMs ?? defaultIntervalMs, signal);
      const next = await this.options.transport.readJob(jobId);
      if (next.state === 'accepted' || next.state === 'pending') {
        if (next.jobId !== jobId) {
          throw new Error(`Clinical document BFF changed job id from '${jobId}' to '${next.jobId}'.`);
        }
        pending = next;
        continue;
      }
      return this.resolve(next, signal);
    }

    throw new ClinicalDocumentBffPendingError(jobId);
  }
}

function requireJobId(value: string): string {
  const jobId = String(value || '').trim();
  if (!jobId) throw new TypeError('Accepted clinical document BFF result requires jobId.');
  return jobId;
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, Math.max(0, milliseconds));
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error('Clinical document wait aborted.'));
    }, { once: true });
  });
}
