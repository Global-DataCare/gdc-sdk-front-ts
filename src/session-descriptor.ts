// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type {
  ActorFlags,
  ActorFacadeDescriptor,
  ActorSessionDescriptor,
} from '../../gdc-sdk-core-ts/dist/index.js';
import {
  buildActorSessionDescriptorFromActorFlags,
  expandActorSessionDescriptorToFacades,
} from '../../gdc-sdk-core-ts/dist/index.js';

export type FrontActorFlags = ActorFlags;

export type FrontSessionDescriptorInput = {
  appType: 'Organization' | 'Family';
  profileId: string;
  profileDid?: string;
  role?: string;
  actorFlags: FrontActorFlags;
};

export function describeFrontActorSession(
  input: FrontSessionDescriptorInput,
): ActorSessionDescriptor {
  return buildActorSessionDescriptorFromActorFlags(input);
}

export function describeFrontActorFacades(
  input: FrontSessionDescriptorInput,
): ActorFacadeDescriptor[] {
  return expandActorSessionDescriptorToFacades(describeFrontActorSession(input));
}
