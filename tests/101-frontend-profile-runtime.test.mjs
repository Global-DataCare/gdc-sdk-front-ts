import test from 'node:test';
import assert from 'node:assert/strict';

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
  buildActorSessionDescriptorFromActorFlags,
  connectFrontendToSubjectIndex,
  expandActorSessionDescriptorToFacades,
  getFrontendSubjectIndexComposition,
  loadFrontendProfile,
  prepareConnectToSubjectIndex,
  prepareGetSubjectIndexComposition,
  prepareLoadedActorProfile,
  prepareLoadProfile,
  prepareRegisterTrustedDevice,
  registerFrontendTrustedDevice,
} from '../dist/index.js';

/**
 * Teaching goal:
 * show the frontend-generic runtime flow for:
 * 1. loading one actor profile,
 * 2. registering one trusted device/runtime context,
 * 3. connecting that actor to one subject index, and
 * 4. reading one subject index composition.
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

  const actualLoadedProfile = await loadFrontendProfile(runtimeClient, loadRequest);
  const trustedDevice = await registerFrontendTrustedDevice(runtimeClient, trustedDeviceRequest);
  const connection = await connectFrontendToSubjectIndex(runtimeClient, subjectConnectionRequest);
  const composition = await getFrontendSubjectIndexComposition(runtimeClient, compositionRequest);

  assert.equal(actualLoadedProfile.descriptor.profileId, EXAMPLE_PROFILE_ID);
  assert.equal(actualLoadedProfile.descriptor.runtimeClass, 'frontend');
  assert.equal(trustedDevice.status, 'registered');
  assert.equal(connection.status, 'connected');
  assert.deepEqual(composition.composition, {
    resourceType: 'Composition',
    id: 'frontend-subject-index-composition-1',
  });
});
