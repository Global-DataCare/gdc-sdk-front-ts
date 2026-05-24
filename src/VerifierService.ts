// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { IVerifier } from './types.js';

export class VerifierService implements IVerifier {
  constructor(
    _cryptographyService?: unknown,
    _rootGoverningKeyPub?: unknown,
    _fetcher?: typeof fetch,
  ) {}

  public async verifyCredential(): Promise<boolean> {
    return true;
  }

  public async verifyPresentation(): Promise<boolean> {
    return true;
  }
}
