// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { BundleEntry, BundleJsonApi } from 'gdc-common-utils-ts';

export type SubjectBundleNotice = Readonly<{
  entryIndex: number;
  identifier: string;
  kind: 'remote-error' | 'remote-warning' | 'transport-error';
  responseStatus?: string;
  diagnostics: readonly string[];
}>;

export type SubjectBundleReconciliation = Readonly<{
  snapshot: BundleJsonApi<BundleEntry>;
  confirmedIdentifiers: readonly string[];
  removedIdentifiers: readonly string[];
  pendingIdentifiers: readonly string[];
  notices: readonly SubjectBundleNotice[];
}>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveEntryIdentifier(entry: BundleEntry, index: number): string {
  const resource = asRecord(entry.resource);
  const claims = asRecord(asRecord(resource.meta).claims);
  const claimIdentifier = Object.entries(claims)
    .find(([key, value]) => key.endsWith('.identifier') && asNonEmptyString(value))?.[1];
  const identifier = asNonEmptyString(entry.fullUrl)
    || asNonEmptyString(resource.id)
    || asNonEmptyString(entry.id)
    || asNonEmptyString(claimIdentifier);
  if (!identifier) {
    throw new Error(`Subject bundle entry ${index} requires a stable fullUrl, resource.id or identifier claim.`);
  }
  return identifier;
}

function readOutcome(entry: BundleEntry): {
  status?: string;
  severities: string[];
  diagnostics: string[];
} {
  const response = asRecord(entry.response);
  const issues = asRecord(response.outcome).issue;
  const issueList = Array.isArray(issues) ? issues.map(asRecord) : [];
  return {
    status: asNonEmptyString(response.status),
    severities: issueList.map((issue) => asNonEmptyString(issue.severity)).filter((value): value is string => !!value),
    diagnostics: issueList.map((issue) => asNonEmptyString(issue.diagnostics)).filter((value): value is string => !!value),
  };
}

/**
 * Owns the frontend's disposable, in-memory projection of one subject Bundle.
 *
 * This object is deliberately not a backend cache or persistence API:
 * - `applyOptimisticBundle` updates only the screen's working copy;
 * - the app submits the same Bundle through its Communication/runtime path;
 * - `reconcileSubmission` removes resources rejected by the GW response;
 * - one aggregate-specific `replaceFrom*Search(...)` method discards local
 *   state in favour of the matching fresh `_search` result.
 */
export class SubjectBundleWorkingCopy {
  private snapshot: BundleJsonApi<BundleEntry>;

  public constructor(authoritativeBundle: BundleJsonApi<BundleEntry>) {
    this.snapshot = clone(authoritativeBundle);
  }

  /** Returns a defensive copy suitable for ViewModel rendering. */
  public getSnapshot(): BundleJsonApi<BundleEntry> {
    return clone(this.snapshot);
  }

  /** Replaces the clinical copy from subject-scoped Composition/IPS search. */
  public replaceFromClinicalCompositionSearch(searchResultBundle: BundleJsonApi<BundleEntry>): BundleJsonApi<BundleEntry> {
    const resourceTypes = searchResultBundle.data.map((entry) => asNonEmptyString(asRecord(entry.resource).resourceType));
    if (resourceTypes.length > 0 && !resourceTypes.includes('Composition')) {
      throw new Error('Clinical search readback requires a Composition entry.');
    }
    return this.replaceFromSearchResult(searchResultBundle);
  }

  /** Replaces the permission copy from subject-scoped Consent search. */
  public replaceFromConsentSearch(searchResultBundle: BundleJsonApi<BundleEntry>): BundleJsonApi<BundleEntry> {
    this.requireOnlyResourceType(searchResultBundle, 'Consent');
    return this.replaceFromSearchResult(searchResultBundle);
  }

  /** Replaces the contact copy from subject-scoped RelatedPerson search. */
  public replaceFromRelatedPersonSearch(searchResultBundle: BundleJsonApi<BundleEntry>): BundleJsonApi<BundleEntry> {
    this.requireOnlyResourceType(searchResultBundle, 'RelatedPerson');
    return this.replaceFromSearchResult(searchResultBundle);
  }

  /** Adds or replaces submitted resources locally while the remote command is pending. */
  public applyOptimisticBundle(submittedBundle: BundleJsonApi<BundleEntry>): BundleJsonApi<BundleEntry> {
    const submittedByIdentifier = new Map<string, BundleEntry>();
    submittedBundle.data.forEach((entry, index) => {
      const identifier = resolveEntryIdentifier(entry, index);
      if (submittedByIdentifier.has(identifier)) {
        throw new Error(`Submitted Bundle contains duplicate resource identifier '${identifier}'.`);
      }
      submittedByIdentifier.set(identifier, clone(entry));
    });

    const retained = this.snapshot.data.filter((entry, index) =>
      !submittedByIdentifier.has(resolveEntryIdentifier(entry, index)));
    this.snapshot = {
      ...this.snapshot,
      data: [...retained, ...submittedByIdentifier.values()],
      total: retained.length + submittedByIdentifier.size,
    };
    return this.getSnapshot();
  }

  /**
   * Applies a per-entry GW result to the optimistic copy.
   *
   * A non-2xx status or fatal/error issue removes that submitted resource.
   * Warnings notify but retain the resource. Missing response entries remain
   * pending because an ambiguous outcome requires the aggregate's `_search`,
   * not guessed rollback.
   */
  public reconcileSubmission(
    submittedBundle: BundleJsonApi<BundleEntry>,
    responseBundle: BundleJsonApi<BundleEntry>,
  ): SubjectBundleReconciliation {
    const confirmedIdentifiers: string[] = [];
    const removedIdentifiers: string[] = [];
    const pendingIdentifiers: string[] = [];
    const notices: SubjectBundleNotice[] = [];

    submittedBundle.data.forEach((submittedEntry, entryIndex) => {
      const identifier = resolveEntryIdentifier(submittedEntry, entryIndex);
      const responseEntry = responseBundle.data[entryIndex];
      if (!responseEntry) {
        pendingIdentifiers.push(identifier);
        return;
      }
      const outcome = readOutcome(responseEntry);
      const hasError = outcome.severities.some((severity) => severity === 'fatal' || severity === 'error');
      const is2xx = !!outcome.status && /^2\d\d$/.test(outcome.status);
      if (!is2xx || hasError) {
        removedIdentifiers.push(identifier);
        notices.push({
          entryIndex,
          identifier,
          kind: 'remote-error',
          ...(outcome.status ? { responseStatus: outcome.status } : {}),
          diagnostics: outcome.diagnostics,
        });
        return;
      }
      confirmedIdentifiers.push(identifier);
      if (outcome.severities.includes('warning')) {
        notices.push({
          entryIndex,
          identifier,
          kind: 'remote-warning',
          responseStatus: outcome.status,
          diagnostics: outcome.diagnostics,
        });
      }
    });

    this.removeIdentifiers(removedIdentifiers);
    return {
      snapshot: this.getSnapshot(),
      confirmedIdentifiers,
      removedIdentifiers,
      pendingIdentifiers,
      notices,
    };
  }

  /** Rolls back every resource in a definitively rejected/failed submission. */
  public rejectSubmission(
    submittedBundle: BundleJsonApi<BundleEntry>,
    diagnostic: string,
  ): SubjectBundleReconciliation {
    const removedIdentifiers = submittedBundle.data.map(resolveEntryIdentifier);
    this.removeIdentifiers(removedIdentifiers);
    return {
      snapshot: this.getSnapshot(),
      confirmedIdentifiers: [],
      removedIdentifiers,
      pendingIdentifiers: [],
      notices: removedIdentifiers.map((identifier, entryIndex) => ({
        entryIndex,
        identifier,
        kind: 'transport-error',
        diagnostics: [diagnostic],
      })),
    };
  }

  private removeIdentifiers(identifiers: readonly string[]): void {
    const rejected = new Set(identifiers);
    this.snapshot = {
      ...this.snapshot,
      data: this.snapshot.data.filter((entry, index) => !rejected.has(resolveEntryIdentifier(entry, index))),
    };
    this.snapshot.total = this.snapshot.data.length;
  }

  private replaceFromSearchResult(searchResultBundle: BundleJsonApi<BundleEntry>): BundleJsonApi<BundleEntry> {
    this.snapshot = clone(searchResultBundle);
    return this.getSnapshot();
  }

  private requireOnlyResourceType(searchResultBundle: BundleJsonApi<BundleEntry>, expected: string): void {
    const unexpected = searchResultBundle.data.find((entry) =>
      asNonEmptyString(asRecord(entry.resource).resourceType) !== expected);
    if (unexpected) {
      throw new Error(`${expected} search readback cannot replace a different subject aggregate.`);
    }
  }
}
