import test from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationEmployeePortalApiRoutes } from '../dist/portal-api-routes.js';

/**
 * A controller buys professional seats before creating members. Keeping the
 * BFF route in the shared frontend SDK prevents each portal from inventing a
 * different local endpoint for the same lifecycle.
 */
test('exports the explicit organization license purchase route', () => {
  assert.equal(OrganizationEmployeePortalApiRoutes.Licenses, '/api/licenses');
});
