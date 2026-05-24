// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import {
  CommonAuthService,
  FamilyAdminService,
  IndividualService,
  OrgAdminService,
  ParamedicService,
  PhysicianService,
} from './services.js';

export interface OrgAdminServices {
  admin?: OrgAdminService;
  it?: unknown;
}

export interface FamilyAdminServices {
  admin?: FamilyAdminService;
  it?: unknown;
}

export interface IndividualServices {
  service?: IndividualService;
}

export interface ProfessionalServices {
  physician?: PhysicianService;
  paramedic?: ParamedicService;
}

export interface CommonServices {
  auth: CommonAuthService;
}
