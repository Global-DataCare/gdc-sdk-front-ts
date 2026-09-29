// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('published frontend SDK pins one coherent shared dependency chain', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies['gdc-common-utils-ts'], '2.9.25');
  assert.equal(packageJson.dependencies['gdc-sdk-core-ts'], '2.9.11');
});
