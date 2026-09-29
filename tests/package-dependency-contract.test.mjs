// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('published frontend SDK pins one coherent shared dependency chain', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies['gdc-common-utils-ts'], '2.9.25');
  assert.equal(packageJson.dependencies['gdc-sdk-core-ts'], '2.9.11');
  assert.equal(packageJson.devDependencies['gdc-sdk-node-ts'], '2.9.27');
  assert.match(packageJson.scripts['verify:package-chain'], /verify-package-chain\.mjs/);
  assert.match(packageJson.scripts.prepublishOnly, /verify:package-chain/);
  await access(new URL('../scripts/verify-package-chain.mjs', import.meta.url));
});
