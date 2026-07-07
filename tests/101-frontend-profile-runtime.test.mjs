import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * 101 note:
 * - `gdc-common-utils-ts` owns the canonical step-by-step editors/readers and payload examples.
 * - This file starts at `ProfileRuntime -> loadProfile(...) -> workspace/session -> actor facade` and teaches the highest-level `sdk-front` runtime surface for this topic.
 * - Reuse `sdk-core` and `common-utils` contracts instead of re-teaching raw claims or low-level editors here.
 * - Read `docs/101-README.md` for the ordered path and keep login/session bootstrap explicit.
 */

/**
 * Repo convention reminder:
 * read `ARCHITECTURE.md` and `CONTRIBUTING.md` before reshaping this test.
 *
 * Non-negotiable here:
 * - no ad hoc literals when one shared fixture/type already exists
 * - prefer reusable examples from `gdc-common-utils-ts`
 * - keep the flow step by step and didactic
 * - treat this file as one technical runtime slice, not the first public
 *   actor-session tutorial for new frontend integrators
 */
import {
  EXAMPLE_DEVICE_CLIENT_ID,
  EXAMPLE_OTP_CODE,
  EXAMPLE_ORGANIZATION_CONTROLLER_ROLE,
  EXAMPLE_PROFILE_EMAIL,
  EXAMPLE_PROFILE_ID,
  EXAMPLE_PROFILE_APP_TYPE_FAMILY,
  EXAMPLE_PROFILE_CONNECTION_PIN_PASSWORD,
  EXAMPLE_PROFILE_CONNECTION_SECRET_KIND_PIN_PASSWORD,
  EXAMPLE_PROFILE_KEY_ACCESS_MODE_FRONTEND,
  EXAMPLE_PROFILE_LOCAL_PIN_PASSWORD_FRONTEND,
  EXAMPLE_PROFILE_PROVIDER_DID,
  EXAMPLE_PROFILE_RUNTIME_CLASS_FRONTEND,
  EXAMPLE_PROFILE_RUNTIME_JOB_ID,
  EXAMPLE_SUBJECT_DID,
} from 'gdc-common-utils-ts';
import {
  ActorKinds,
  FrontendProfileRuntime,
  ProfileRuntime,
  ProfileManager,
  buildActorSessionDescriptorFromActorFlags,
  expandActorSessionDescriptorToFacades,
  prepareConnectToSubjectIndex,
  prepareGetSubjectIndexComposition,
  prepareLoadedActorProfile,
  prepareLoadProfile,
  prepareRegisterTrustedDevice,
} from '../dist/index.js';

/**
 * Teaching goal:
 * show the canonical frontend runtime orchestration:
 * 1. inject runtime adapters once,
 * 2. load one protected profile into one workspace/session,
 * 3. register one trusted device/runtime context,
 * 4. connect that actor to one subject index, and
 * 5. read one subject index composition from the same loaded workspace.
 *
 * Runtime ownership rule:
 * - the unlocked user profile remains the normal crypto owner for user
 *   messages and replies
 * - when one reply arrives, the app reads it as:
 *   `DIDComm/plain -> Communication -> attached document bundle`
 * - the canonical lower-layer example for that payload shape lives in:
 *   `gdc-common-utils-ts/__tests__/101-communication-medication-document.test.ts`
 * - backend search is a separate story taught with public FHIR search params
 *   such as `Composition.section`
 * - a web/native BFF may orchestrate several such profiles and their outboxes
 * - do not confuse that app/service layer with GW server-side processing
 */
test('101: frontend profile runtime stays generic across frontend consumers', async () => {
  const loadRequest = prepareLoadProfile({
    actorKind: ActorKinds.IndividualController,
    providerDid: EXAMPLE_PROFILE_PROVIDER_DID,
    runtimeClass: EXAMPLE_PROFILE_RUNTIME_CLASS_FRONTEND,
    keyAccessMode: EXAMPLE_PROFILE_KEY_ACCESS_MODE_FRONTEND,
    actorRole: EXAMPLE_ORGANIZATION_CONTROLLER_ROLE,
    profileId: EXAMPLE_PROFILE_ID,
    profileDid: EXAMPLE_PROFILE_PROVIDER_DID,
    subjectDid: EXAMPLE_SUBJECT_DID,
    email: EXAMPLE_PROFILE_EMAIL,
    appType: EXAMPLE_PROFILE_APP_TYPE_FAMILY,
    localPinPassword: EXAMPLE_PROFILE_LOCAL_PIN_PASSWORD_FRONTEND,
  });

  const session = buildActorSessionDescriptorFromActorFlags({
    appType: loadRequest.appType,
    profileId: loadRequest.profileId,
    profileDid: loadRequest.profileDid,
    role: loadRequest.actorRole,
    actorFlags: {
      individualController: true,
    },
  });

  const facades = expandActorSessionDescriptorToFacades(session);
  const loadedProfile = prepareLoadedActorProfile({
    descriptor: {
      profileId: loadRequest.profileId,
      actorKind: loadRequest.actorKind,
      actorRole: loadRequest.actorRole,
      providerDid: loadRequest.providerDid,
      runtimeClass: loadRequest.runtimeClass,
      profileDid: loadRequest.profileDid,
      subjectDid: loadRequest.subjectDid,
      email: loadRequest.email,
      appType: loadRequest.appType,
    },
    session,
    facades,
    jobManager: {
      descriptor: {
        profileId: loadRequest.profileId,
        actorKind: loadRequest.actorKind,
        actorRole: loadRequest.actorRole,
        providerDid: loadRequest.providerDid,
        runtimeClass: loadRequest.runtimeClass,
      },
      isInitialized: true,
      async initialize() {},
      shutdown() {},
      setListener() {},
      async createJob() { throw new Error('not-used-in-this-101'); },
      async findDraftJobByFormType() { return null; },
      async createOrUpdateDraftJob() { throw new Error('not-used-in-this-101'); },
      async sync() {},
      async queryJobs() { return []; },
      async submitJob() {},
      async sealJobWithToken(job) { return job; },
      async getJobResponseByThid() { return null; },
      generateId() { return EXAMPLE_PROFILE_RUNTIME_JOB_ID; },
    },
  });

  const trustedDeviceRequest = prepareRegisterTrustedDevice({
    userId: loadRequest.profileDid,
    userRoleCode: loadRequest.actorRole,
    deviceDid: EXAMPLE_DEVICE_CLIENT_ID,
    providerDid: loadRequest.providerDid,
    otpCode: EXAMPLE_OTP_CODE,
  });

  const subjectConnectionRequest = prepareConnectToSubjectIndex({
    subjectId: loadRequest.subjectDid,
    userId: loadRequest.profileDid,
    userRoleCode: loadRequest.actorRole,
    secretKind: EXAMPLE_PROFILE_CONNECTION_SECRET_KIND_PIN_PASSWORD,
    connectionPinPassword: EXAMPLE_PROFILE_CONNECTION_PIN_PASSWORD,
  });

  const compositionRequest = prepareGetSubjectIndexComposition({
    subjectId: loadRequest.subjectDid,
    userId: loadRequest.profileDid,
    userRoleCode: loadRequest.actorRole,
  });

  const runtimeClient = new FrontendProfileRuntime({
    async loadProfile(input) {
      assert.equal(input.localPinPassword, EXAMPLE_PROFILE_LOCAL_PIN_PASSWORD_FRONTEND);
      return loadedProfile;
    },
    async registerTrustedDevice(input) {
      assert.equal(input.deviceDid, EXAMPLE_DEVICE_CLIENT_ID);
      return {
        trustedDeviceId: 'frontend-trusted-device-1',
        status: 'registered',
      };
    },
    async connectToSubjectIndex(input) {
      assert.equal(input.secretKind, EXAMPLE_PROFILE_CONNECTION_SECRET_KIND_PIN_PASSWORD);
      return {
        subjectId: input.subjectId,
        userId: input.userId,
        userRoleCode: input.userRoleCode,
        status: 'connected',
      };
    },
    async getSubjectIndexComposition(input) {
      return {
        subjectId: input.subjectId,
        userId: input.userId,
        userRoleCode: input.userRoleCode,
        composition: {
          resourceType: 'Composition',
          id: 'frontend-subject-index-composition-1',
        },
      };
    },
  });

  const workspaceRuntime = new ProfileRuntime(runtimeClient);
  const workspace = await workspaceRuntime.loadProfile(loadRequest);
  const trustedDevice = await workspace.registerTrustedDevice(trustedDeviceRequest);
  const connection = await workspace.connectToSubjectIndex(subjectConnectionRequest);
  const composition = await workspace.getSubjectIndexComposition(compositionRequest);

  assert.equal(workspace.profile.descriptor.profileId, EXAMPLE_PROFILE_ID);
  assert.ok(workspace.actorSession instanceof ProfileManager);
  assert.equal(workspace.actorSession.profile.providerDid, EXAMPLE_PROFILE_PROVIDER_DID);
  assert.equal(workspace.profile.descriptor.runtimeClass, 'frontend');
  assert.equal(trustedDevice.status, 'registered');
  assert.equal(connection.status, 'connected');
  assert.deepEqual(composition.composition, {
    resourceType: 'Composition',
    id: 'frontend-subject-index-composition-1',
  });
});
