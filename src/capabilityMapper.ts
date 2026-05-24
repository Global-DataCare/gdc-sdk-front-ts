// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { HealthcareActorRoleCodes } from 'gdc-common-utils-ts/constants';
import type { Profile } from './types.js';
import type {
  FamilyAdminServices,
  IndividualServices,
  OrgAdminServices,
  ProfessionalServices,
} from './roleRegistry.js';
import { FamilyAdminService, IndividualService, OrgAdminService, ParamedicService, PhysicianService } from './services.js';

export function mapCapabilitiesToServices(
  profile: Profile,
  appType: 'Organization' | 'Family',
): {
  professional?: ProfessionalServices;
  orgAdmin?: OrgAdminServices;
  familyAdmin?: FamilyAdminServices;
  individual?: IndividualServices;
} {
  const role = String(profile.role || '').toLowerCase();
  const code = role.includes('|') ? role.split('|')[1] : role;
  const isController = code === 'controller' || code === 'resprsn' || code === HealthcareActorRoleCodes.Controller;
  const isPhysician = code === HealthcareActorRoleCodes.PhysicianBroad || code === HealthcareActorRoleCodes.Physician || code === 'physician';
  const isParamedic = code === HealthcareActorRoleCodes.Paramedic || code === 'paramedic';

  const professional: ProfessionalServices = {};
  const orgAdmin: OrgAdminServices = {};
  const familyAdmin: FamilyAdminServices = {};
  const individual: IndividualServices = {};

  if (appType === 'Organization' && isController) {
    orgAdmin.admin = new OrgAdminService();
  }
  if (appType === 'Family' && isController) {
    familyAdmin.admin = new FamilyAdminService();
    individual.service = new IndividualService();
  }
  if (isPhysician) {
    professional.physician = new PhysicianService();
  }
  if (isParamedic) {
    professional.paramedic = new ParamedicService();
  }

  return { professional, orgAdmin, familyAdmin, individual };
}
