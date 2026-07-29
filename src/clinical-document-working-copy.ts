// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  toClinicalSectionViews,
  validateBundleDocumentBasic,
  type ClinicalResourceDisplayOptions,
  type ClinicalSectionView,
} from 'gdc-common-utils-ts';

export type ClinicalDocumentBundle = Record<string, unknown> & Readonly<{
  resourceType: 'Bundle';
  type: 'document';
  entry: readonly Record<string, unknown>[];
}>;

type PendingClinicalDocumentChange = Readonly<{
  previous?: ClinicalDocumentBundle;
}>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requireDocument(bundle: Record<string, unknown>, operation: string): ClinicalDocumentBundle {
  const validation = validateBundleDocumentBasic(bundle);
  if (!validation.ok) {
    throw new TypeError(`${operation} requires one valid FHIR Bundle document: ${validation.issues.join(' ')}`);
  }
  return clone(bundle) as ClinicalDocumentBundle;
}

function entryAliases(entry: Record<string, any>): Set<string> {
  const resource = asRecord(entry.resource);
  const resourceType = asString(resource.resourceType);
  const resourceId = asString(resource.id);
  return new Set([
    asString(entry.fullUrl),
    resourceType && resourceId ? `${resourceType}/${resourceId}` : '',
  ].filter(Boolean));
}

function sectionIdentity(section: Record<string, any>): string {
  const coding = Array.isArray(section?.code?.coding) ? section.code.coding[0] : undefined;
  const system = asString(coding?.system);
  const code = asString(coding?.code);
  return system && code
    ? `${system}|${code}`
    : (code || asString(section.title));
}

function findComposition(entries: readonly Record<string, any>[]): Record<string, any> | undefined {
  return entries.find((entry) => asString(entry?.resource?.resourceType) === 'Composition')?.resource;
}

function mergeSectionEntries(
  currentComposition: Record<string, any>,
  commandComposition: Record<string, any>,
): void {
  const currentSections = Array.isArray(currentComposition.section)
    ? currentComposition.section as Record<string, any>[]
    : [];
  const commandSections = Array.isArray(commandComposition.section)
    ? commandComposition.section as Record<string, any>[]
    : [];

  for (const commandSection of commandSections) {
    const identity = sectionIdentity(commandSection);
    const currentSection = currentSections.find((section) => sectionIdentity(section) === identity);
    if (!currentSection) {
      currentSections.push(clone(commandSection));
      continue;
    }
    const currentReferences = Array.isArray(currentSection.entry)
      ? currentSection.entry as Array<Record<string, unknown>>
      : [];
    const seen = new Set(currentReferences.map((item) => asString(item.reference)).filter(Boolean));
    const commandReferences = Array.isArray(commandSection.entry) ? commandSection.entry : [];
    for (const reference of commandReferences) {
      const value = asString(reference?.reference);
      if (value && !seen.has(value)) {
        currentReferences.push(clone(reference));
        seen.add(value);
      }
    }
    currentSection.entry = currentReferences;
  }
  currentComposition.section = currentSections;
}

function mergeClinicalDocument(
  current: ClinicalDocumentBundle,
  command: ClinicalDocumentBundle,
): ClinicalDocumentBundle {
  const merged = clone(current) as Record<string, any>;
  const mergedEntries = Array.isArray(merged.entry) ? merged.entry as Record<string, any>[] : [];
  const commandEntries = Array.isArray(command.entry) ? command.entry as Record<string, any>[] : [];
  const currentComposition = findComposition(mergedEntries);
  const commandComposition = findComposition(commandEntries);
  if (!currentComposition || !commandComposition) {
    throw new TypeError('Clinical document updates require Composition-first Bundles.');
  }

  for (const commandEntry of commandEntries) {
    const resourceType = asString(commandEntry?.resource?.resourceType);
    if (!resourceType || resourceType === 'Composition') continue;
    const aliases = entryAliases(commandEntry);
    const currentIndex = mergedEntries.findIndex((entry) => {
      const currentAliases = entryAliases(entry);
      return [...aliases].some((alias) => currentAliases.has(alias));
    });

    // A minimal Patient/Practitioner emitted by a section command must never
    // erase demographics or actor details already present in the IPS.
    const isSupportingActor = ['Patient', 'Practitioner', 'PractitionerRole'].includes(resourceType);
    if (currentIndex >= 0 && isSupportingActor) continue;
    if (currentIndex >= 0) {
      mergedEntries[currentIndex] = clone(commandEntry);
    } else {
      mergedEntries.push(clone(commandEntry));
    }
  }

  mergeSectionEntries(currentComposition, commandComposition);
  merged.entry = mergedEntries;
  return requireDocument(merged, 'ClinicalDocumentWorkingCopy merge');
}

/**
 * Disposable browser working copy for one native FHIR IPS document.
 *
 * This class joins the frontend steps that must stay synchronized:
 *
 * 1. import a validated `Bundle.type=document`;
 * 2. render every Composition section from the optimistic in-memory snapshot;
 * 3. send the exact imported/update Bundle to an authenticated BFF;
 * 4. keep queued work explicitly pending, roll back a definite rejection, or
 *    replace everything with authoritative `$summary` readback.
 *
 * It performs no fetch, Communication creation, ingestion or persistence.
 * `SubjectBundleWorkingCopy` remains the separate surface for JSON-API-like
 * `data[]` command Bundles; do not use it for native IPS `entry[]` documents.
 */
export class ClinicalDocumentWorkingCopy {
  private snapshot?: ClinicalDocumentBundle;
  private pending?: PendingClinicalDocumentChange;

  public constructor(authoritativeDocument?: Record<string, unknown>) {
    if (authoritativeDocument) {
      this.snapshot = requireDocument(authoritativeDocument, 'ClinicalDocumentWorkingCopy constructor');
    }
  }

  /** Returns a defensive copy for React/Vue/Expo state, or `undefined` before the first import/read. */
  public getSnapshot(): ClinicalDocumentBundle | undefined {
    return this.snapshot ? clone(this.snapshot) : undefined;
  }

  /** Projects all current Composition sections and UI-ready cards. */
  public getSectionViews(options: ClinicalResourceDisplayOptions = {}): ClinicalSectionView[] {
    return this.snapshot ? toClinicalSectionViews(this.snapshot, options) : [];
  }

  /** True while the BFF/GW outcome is still unconfirmed. */
  public hasPendingChange(): boolean {
    return !!this.pending;
  }

  /**
   * Installs an imported IPS immediately in browser memory.
   *
   * The caller must send this same `document` argument to its BFF after
   * updating UI state with the returned snapshot.
   */
  public importDocumentOptimistically(document: Record<string, unknown>): ClinicalDocumentBundle {
    this.requireNoPendingChange();
    const next = requireDocument(document, 'importDocumentOptimistically');
    this.pending = { previous: this.snapshot ? clone(this.snapshot) : undefined };
    this.snapshot = next;
    return clone(next);
  }

  /**
   * Merges one Composition-first section command into the visible IPS.
   *
   * Build `commandDocument` with `BundleEditor`, explicit
   * `setSectionList(...)`, and the resource-specific entry editor. Send the
   * unchanged command document to the BFF; do not send the merged UI snapshot.
   */
  public applyDocumentUpdateOptimistically(
    commandDocument: Record<string, unknown>,
  ): ClinicalDocumentBundle {
    this.requireNoPendingChange();
    if (!this.snapshot) {
      throw new Error('applyDocumentUpdateOptimistically requires an imported or authoritative IPS first.');
    }
    const command = requireDocument(commandDocument, 'applyDocumentUpdateOptimistically');
    const previous = clone(this.snapshot);
    this.snapshot = mergeClinicalDocument(this.snapshot, command);
    this.pending = { previous };
    return clone(this.snapshot);
  }

  /** Replaces all optimistic state with authoritative `requestClinicalSummary(...)` readback. */
  public replaceFromClinicalSummary(document: Record<string, unknown>): ClinicalDocumentBundle {
    const next = requireDocument(document, 'replaceFromClinicalSummary');
    this.snapshot = next;
    this.pending = undefined;
    return clone(next);
  }

  /** Rolls back the single in-flight import/update after a definite failure. */
  public rejectPendingChange(): ClinicalDocumentBundle | undefined {
    if (!this.pending) return this.getSnapshot();
    this.snapshot = this.pending.previous ? clone(this.pending.previous) : undefined;
    this.pending = undefined;
    return this.getSnapshot();
  }

  private requireNoPendingChange(): void {
    if (this.pending) {
      throw new Error('Resolve the pending clinical document change before starting another.');
    }
  }
}
