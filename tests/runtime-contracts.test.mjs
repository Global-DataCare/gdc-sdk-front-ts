import test from 'node:test';
import assert from 'node:assert/strict';

import { GDC_SDK_FRONT_STATUS } from '../dist/index.js';

test('gdc-sdk-front-ts exposes its migration target status', () => {
  assert.deepEqual(GDC_SDK_FRONT_STATUS, {
    packageName: 'gdc-sdk-front-ts',
    dependsOnCorePackage: 'gdc-sdk-core-ts',
    legacySourcePackages: [],
    status: 'bootstrap',
  });
});
