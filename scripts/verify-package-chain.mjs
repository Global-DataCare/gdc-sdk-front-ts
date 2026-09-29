// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'));
const nodeExpectedVersion = process.env.GDC_SDK_NODE_EXPECTED_VERSION
  || packageJson.devDependencies['gdc-sdk-node-ts'];
const nodePackageSpec = process.env.GDC_SDK_NODE_PACKAGE_SPEC
  || `gdc-sdk-node-ts@${nodeExpectedVersion}`;
const expectedVersions = Object.freeze({
  'gdc-common-utils-ts': packageJson.dependencies['gdc-common-utils-ts'],
  'gdc-sdk-core-ts': packageJson.dependencies['gdc-sdk-core-ts'],
  'gdc-sdk-node-ts': nodeExpectedVersion,
  'gdc-sdk-front-ts': packageJson.version,
});

assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Package-chain verification requires Node.js 24 or newer.');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}.`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result.stdout.trim();
}

function collectPackageVersions(node, name, versions = new Set()) {
  if (!node || typeof node !== 'object') return versions;
  if (node.name === name && typeof node.version === 'string') versions.add(node.version);
  for (const [dependencyName, dependency] of Object.entries(node.dependencies || {})) {
    if (dependencyName === name && typeof dependency?.version === 'string') {
      versions.add(dependency.version);
    }
    collectPackageVersions(dependency, name, versions);
  }
  return versions;
}

const consumerDirectory = await mkdtemp(join(tmpdir(), 'gdc-sdk-front-package-chain-'));
try {
  const packOutput = run('npm', [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    consumerDirectory,
  ], repositoryRoot);
  const [{ filename }] = JSON.parse(packOutput);
  const tarballPath = join(consumerDirectory, filename);

  await writeFile(join(consumerDirectory, 'package.json'), JSON.stringify({
    name: 'gdc-sdk-clean-consumer',
    private: true,
    type: 'module',
  }, null, 2));
  await writeFile(join(consumerDirectory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      target: 'ES2022',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    include: ['consumer.mts'],
  }, null, 2));
  await writeFile(join(consumerDirectory, 'consumer.mts'), `
import { AllergyIntoleranceEntryEditor, DigitalTwinSdk, ProfessionalSdk } from 'gdc-sdk-front-ts';
import { getActorFacadeMethods } from 'gdc-sdk-core-ts';
import { MedicationStatementEntryEditor } from 'gdc-common-utils-ts/utils/medication-statement-entry-editor';
import { NodeHttpClient } from 'gdc-sdk-node-ts';

void AllergyIntoleranceEntryEditor;
void DigitalTwinSdk;
void ProfessionalSdk;
void MedicationStatementEntryEditor;
void getActorFacadeMethods;
void NodeHttpClient;
`);
  await writeFile(join(consumerDirectory, 'runtime.mjs'), `
import { DigitalTwinSdk, MedicationStatementEntryEditor } from 'gdc-sdk-front-ts';
import { getActorFacadeMethods } from 'gdc-sdk-core-ts';
import { ActorKinds } from 'gdc-common-utils-ts/constants/actor-session';

if (typeof DigitalTwinSdk !== 'function') throw new Error('DigitalTwinSdk is not exported at runtime.');
if (typeof MedicationStatementEntryEditor !== 'function') throw new Error('Clinical editors are not exported at runtime.');
if (!getActorFacadeMethods(ActorKinds.Professional).includes('requestClinicalSummary')) {
  throw new Error('Core actor facade surface is unavailable.');
}
`);

  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarballPath,
    `gdc-common-utils-ts@${expectedVersions['gdc-common-utils-ts']}`,
    `gdc-sdk-core-ts@${expectedVersions['gdc-sdk-core-ts']}`,
    nodePackageSpec,
    `typescript@${packageJson.devDependencies.typescript}`,
  ], consumerDirectory);

  const tree = JSON.parse(run('npm', [
    'ls',
    '--all',
    '--json',
    ...Object.keys(expectedVersions),
  ], consumerDirectory));
  for (const [name, expectedVersion] of Object.entries(expectedVersions)) {
    assert.deepEqual(
      [...collectPackageVersions(tree, name)].sort(),
      [expectedVersion],
      `${name} must resolve exactly once at ${expectedVersion}`,
    );
  }

  run('npm', ['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumerDirectory);
  run(process.execPath, ['runtime.mjs'], consumerDirectory);
  process.stdout.write(`Verified isolated SDK chain: ${JSON.stringify(expectedVersions)}\n`);
} finally {
  await rm(consumerDirectory, { recursive: true, force: true });
}
