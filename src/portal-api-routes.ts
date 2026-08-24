/** Product-neutral BFF routes used by organization employee portals. */
export const OrganizationEmployeePortalApiRoutes = Object.freeze({
  Activation: '/api/employees/activation',
  Invitations: '/api/employees/invitations',
  Lifecycle: '/api/employees/lifecycle',
  Licenses: '/api/licenses',
} as const);
