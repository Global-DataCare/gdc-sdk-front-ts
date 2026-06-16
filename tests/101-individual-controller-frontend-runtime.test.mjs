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
 */
import {
  EXAMPLE_CLINICAL_BUNDLE_SEARCH_INPUT,
  EXAMPLE_ORGANIZATION_CONTROLLER_ROLE,
  EXAMPLE_PROFILE_EMAIL,
  EXAMPLE_PROFILE_ID,
  EXAMPLE_PROFILE_APP_TYPE_FAMILY,
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
  IndividualControllerFrontendRuntime,
  buildActorSessionDescriptorFromActorFlags,
  expandActorSessionDescriptorToFacades,
  prepareLoadedActorProfile,
  prepareLoadProfile,
} from '../dist/index.js';

const EXAMPLE_FRONT_ROUTE_CONTEXT = Object.freeze({
  providerDid: EXAMPLE_PROFILE_PROVIDER_DID,
  idToken: 'id-token',
  requiredScope: 'individual.index.read',
});

/**
 * Teaching goal:
 * show the first pragmatic frontend use-case wrapper on top of the generic v2
 * profile runtime:
 * 1. load the frontend individual-controller profile,
 * 2. start individual registration,
 * 3. confirm the returned order,
 * 4. search the subject index.
 */
test('101: frontend individual-controller runtime wraps the current frontend baseline', async () => {
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

  const profileRuntime = new FrontendProfileRuntime({
    async loadProfile(input) {
      assert.equal(input.localPinPassword, EXAMPLE_PROFILE_LOCAL_PIN_PASSWORD_FRONTEND);
      return loadedProfile;
    },
    async registerTrustedDevice() {
      throw new Error('not-used-in-this-101');
    },
    async connectToSubjectIndex() {
      throw new Error('not-used-in-this-101');
    },
    async getSubjectIndexComposition() {
      throw new Error('not-used-in-this-101');
    },
  });

  const runtime = new IndividualControllerFrontendRuntime(profileRuntime, {
    async startIndividualOrganization(ctx, input) {
      assert.equal(ctx.providerDid, EXAMPLE_FRONT_ROUTE_CONTEXT.providerDid);
      assert.deepEqual(input.registrationClaims, { alias: 'ana' });
      return {
        registrationThid: 'frontend-registration-thid-1',
        confirmationThid: 'frontend-confirmation-thid-1',
      };
    },
    async confirmIndividualOrganizationOrder(ctx, input) {
      assert.equal(ctx.providerDid, EXAMPLE_FRONT_ROUTE_CONTEXT.providerDid);
      assert.equal(input.offerId, 'offer-family-1');
      return {
        submit: { status: 202, body: { accepted: true } },
        poll: { status: 200, body: { accepted: true }, attempts: 1 },
      };
    },
    async searchClinicalBundle(ctx, input) {
      assert.equal(ctx.providerDid, EXAMPLE_FRONT_ROUTE_CONTEXT.providerDid);
      assert.equal(input.subject, EXAMPLE_CLINICAL_BUNDLE_SEARCH_INPUT.subject);
      return { thid: 'frontend-clinical-search-thid-1' };
    },
    async getLatestIps(ctx, subject) {
      assert.equal(ctx.providerDid, EXAMPLE_FRONT_ROUTE_CONTEXT.providerDid);
      assert.equal(subject, EXAMPLE_SUBJECT_DID);
      return { thid: 'frontend-latest-ips-thid-1' };
    },
  });

  const profile = await runtime.loadProfile(loadRequest);
  const startResult = await runtime.startIndividualOrganization(
    profile,
    EXAMPLE_FRONT_ROUTE_CONTEXT,
    { registrationClaims: { alias: 'ana' } },
  );
  const orderResult = await runtime.confirmIndividualOrganizationOrder(
    profile,
    EXAMPLE_FRONT_ROUTE_CONTEXT,
    { offerId: 'offer-family-1' },
  );
  const searchResult = await runtime.searchClinicalBundle(
    profile,
    EXAMPLE_FRONT_ROUTE_CONTEXT,
    EXAMPLE_CLINICAL_BUNDLE_SEARCH_INPUT,
  );
  const latestIps = await runtime.getLatestIps(
    profile,
    EXAMPLE_FRONT_ROUTE_CONTEXT,
    EXAMPLE_SUBJECT_DID,
  );

  assert.equal(profile.profile.descriptor.profileId, EXAMPLE_PROFILE_ID);
  assert.equal(startResult.registrationThid, 'frontend-registration-thid-1');
  assert.equal(orderResult.poll.status, 200);
  assert.equal(searchResult.thid, 'frontend-clinical-search-thid-1');
  assert.equal(latestIps.thid, 'frontend-latest-ips-thid-1');
});
