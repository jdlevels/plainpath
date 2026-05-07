/**
 * Clerk v6 browser mock for Playwright E2E tests.
 *
 * IMPORTANT: window.Clerk must be set to an INSTANCE (not a constructor class).
 *
 * How @clerk/react v6 loading works (via @clerk/shared/loadClerkJsScript):
 *  1. `loadClerkJSScript()` checks: if (!!window.Clerk) return null immediately
 *  2. Otherwise, inserts <script> tag → real clerk.browser.js loads →
 *     sets window.Clerk to the Clerk INSTANCE (already constructed & ready)
 *  3. `getClerkJsEntryChunk()` returns global.Clerk (the instance)
 *  4. Caller checks !clerk.loaded → calls clerk.load(options) → instance method
 *  5. After load: replayInterceptedInvocations(clerk) → React state updates
 *
 * Fix: set window.Clerk to a plain object (acting as the instance) with all
 * instance methods (load, addListener, etc.) so steps 1-5 work correctly.
 *
 * Injected via page.addInitScript({ path: 'clerk-mock.js' }) BEFORE React hydrates.
 * Since window.Clerk is truthy at step 1, the real script is never loaded.
 */
(function () {
  "use strict";

  if (window.Clerk && window.__clerk_e2e_mock) {
    return; // Already injected (e.g., after SPA navigation)
  }

  var MOCK_TOKEN = "test_jwt_e2e_clerk_mock_v6";
  var MOCK_USER_ID = "user_qa_e2e_test_00001";
  var MOCK_SESSION_ID = "sess_qa_e2e_test_00001";

  var mockUser = {
    id: MOCK_USER_ID,
    object: "user",
    username: null,
    firstName: "QA",
    lastName: "Tester",
    fullName: "QA Tester",
    imageUrl: "",
    hasImage: false,
    primaryEmailAddressId: "idn_qa_e2e_001",
    primaryEmailAddress: {
      id: "idn_qa_e2e_001",
      emailAddress: "qa-e2e@test.plainpathapp.com",
      verification: { status: "verified", strategy: "email_code" },
      linkedTo: [],
    },
    emailAddresses: [
      {
        id: "idn_qa_e2e_001",
        emailAddress: "qa-e2e@test.plainpathapp.com",
        verification: { status: "verified", strategy: "email_code" },
        linkedTo: [],
      },
    ],
    phoneNumbers: [],
    web3Wallets: [],
    passkeys: [],
    externalAccounts: [],
    samlAccounts: [],
    organizationMemberships: [],
    publicMetadata: { role: "admin", accessTier: "pro" },
    privateMetadata: {},
    unsafeMetadata: {},
    externalId: null,
    lastSignInAt: new Date("2024-01-01"),
    banned: false,
    locked: false,
    lockoutExpiresInSeconds: null,
    verificationAttemptsRemaining: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    lastActiveAt: new Date("2024-01-01"),
    deleteProfileImageEnabled: true,
    createOrganizationEnabled: false,
    deleteSelfEnabled: true,
    legalAcceptedAt: null,
    update: function () { return Promise.resolve(this); },
    delete: function () { return Promise.resolve(); },
    reload: function () { return Promise.resolve(this); },
    setProfileImage: function () { return Promise.resolve({}); },
    getOrganizationMemberships: function () {
      return Promise.resolve({ data: [], totalCount: 0 });
    },
    getOrganizationInvitations: function () {
      return Promise.resolve({ data: [], totalCount: 0 });
    },
    getOrganizationSuggestions: function () {
      return Promise.resolve({ data: [], totalCount: 0 });
    },
    isPrimaryIdentification: function () { return true; },
    getSessions: function () { return Promise.resolve([]); },
  };

  var mockSession = {
    id: MOCK_SESSION_ID,
    object: "session",
    status: "active",
    expireAt: new Date("2099-01-01"),
    abandonAt: new Date("2099-01-01"),
    lastActiveAt: new Date("2024-01-01"),
    lastActiveOrganizationId: null,
    actor: null,
    user: mockUser,
    userId: MOCK_USER_ID,
    publicUserData: {
      firstName: "QA",
      lastName: "Tester",
      imageUrl: "",
      hasImage: false,
      identifier: "qa-e2e@test.plainpathapp.com",
      userId: MOCK_USER_ID,
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    factorVerificationAge: [0, 0],
    lastActiveToken: {
      getRawString: function () { return MOCK_TOKEN; },
      // resolveAuthState reads session.lastActiveToken?.jwt?.claims to derive sessionClaims.
      // If sessionClaims is falsy: resolveAuthState returns undefined → "Invalid state" error.
      jwt: {
        claims: {
          sub: MOCK_USER_ID,
          sid: MOCK_SESSION_ID,
          iss: "https://clerk.plainpathapp.com",
          aud: "plainpath",
          exp: 9999999999,
          iat: 1700000000,
          nbf: 1700000000,
          azp: "plainpath",
          fea: "",
          pla: "",
        },
      },
    },
    getToken: function () { return Promise.resolve(MOCK_TOKEN); },
    checkAuthorization: function () { return true; },
    touch: function () { return Promise.resolve(this); },
    clearCache: function () {},
    end: function () { return Promise.resolve(); },
  };

  var mockClient = {
    id: "client_qa_e2e_test_001",
    object: "client",
    sessions: [mockSession],
    activeSessions: [mockSession],
    signIn: null,
    signUp: null,
    lastActiveSessionId: MOCK_SESSION_ID,
    isLoaded: true,
    destroy: function () { return Promise.resolve(); },
    removeSessions: function () { return Promise.resolve(); },
  };

  var _listeners = [];
  var _emission = {
    user: mockUser,
    session: mockSession,
    client: mockClient,
    organization: null,
  };

  // ── The mock Clerk INSTANCE ────────────────────────────────────────────────
  // Must be an instance (not a constructor), because @clerk/shared returns
  // global.Clerk directly and calls instance methods (.load, .addListener) on it.
  //
  // CRITICAL: loaded MUST be true from the start.
  // @clerk/react v6 getEntryChunks() does:
  //   if (!clerk.loaded) { await getClerkUIEntryChunk(); await clerk.load(); }
  //   if (clerk.loaded) { replayInterceptedInvocations(clerk); }
  // If loaded=false, it tries to fetch the Clerk UI script (ui.browser.js) which
  // fails due to SSL errors in the test environment → catch fires → clerk.load()
  // is never called → isLoaded stays false → blank screen forever.
  // With loaded=true: skips the UI script entirely → replayInterceptedInvocations
  // is called → React context is updated → auth gates open.
  var clerkInstance = {
    version: "6.0.0",
    loaded: true,
    user: mockUser,
    session: mockSession,
    client: mockClient,
    organization: null,
    publishableKey: "",
    proxyUrl: "",
    domain: "",
    isStandardBrowser: true,
    sdkMetadata: { name: "@clerk/clerk-js", version: "6.0.0", environment: "test" },
    instanceType: "production",

    // ── Core lifecycle ───────────────────────────────────────────────────────
    load: function (options) {
      var self = this;
      console.info("[clerk-mock] .load() called (should be skipped with loaded=true)");
      self.loaded = true;
      self.user = mockUser;
      self.session = mockSession;
      self.client = mockClient;
      // Fire all registered listeners with the mock auth emission
      _listeners.forEach(function (fn) {
        try { fn(_emission); } catch (e) { console.warn("[clerk-mock] listener error:", e); }
      });
      return Promise.resolve();
    },

    addListener: function (fn, opts) {
      console.info("[clerk-mock] .addListener() called (replay from replayInterceptedInvocations)");
      _listeners.push(fn);
      // Fire immediately if already loaded
      if (this.loaded) {
        try { fn(_emission); } catch (e) { console.warn("[clerk-mock] emission error:", e); }
      }
      return function () {
        var idx = _listeners.indexOf(fn);
        if (idx > -1) _listeners.splice(idx, 1);
      };
    },

    removeListener: function (fn) {
      var idx = _listeners.indexOf(fn);
      if (idx > -1) _listeners.splice(idx, 1);
    },

    // ── Token methods ────────────────────────────────────────────────────────
    getToken: function () { return Promise.resolve(MOCK_TOKEN); },

    // ── Session management ───────────────────────────────────────────────────
    setActive: function (params) { return Promise.resolve(); },

    signOut: function (callbackOrOptions, options) {
      this.user = null;
      this.session = null;
      _emission.user = null;
      _emission.session = null;
      _listeners.forEach(function (fn) { try { fn(_emission); } catch (e) {} });
      if (typeof callbackOrOptions === "function") callbackOrOptions();
      return Promise.resolve();
    },

    // ── Navigation ───────────────────────────────────────────────────────────
    navigate: function (to) { if (to) window.location.href = to; },
    redirectToSignIn: function () { window.location.replace("/app/sign-in"); },
    redirectToSignUp: function () { window.location.replace("/app/sign-up"); },
    redirectToUserProfile: function () {},
    redirectToOrganizationProfile: function () {},
    redirectToCreateOrganization: function () {},
    redirectToHome: function () { window.location.replace("/app/"); },
    redirectToAfterSignIn: function () { window.location.replace("/app/"); },
    redirectToAfterSignUp: function () { window.location.replace("/app/"); },
    redirectToAfterSignOut: function () { window.location.replace("/"); },

    // ── URL builders ─────────────────────────────────────────────────────────
    buildSignInUrl: function () { return "/app/sign-in"; },
    buildSignUpUrl: function () { return "/app/sign-up"; },
    buildUserProfileUrl: function () { return "#"; },
    buildHomeUrl: function () { return "/app/"; },
    buildAfterSignInUrl: function () { return "/app/"; },
    buildAfterSignUpUrl: function () { return "/app/"; },
    buildAfterSignOutUrl: function () { return "/"; },
    buildCreateOrganizationUrl: function () { return "#"; },
    buildOrganizationProfileUrl: function () { return "#"; },
    buildNewSubscriptionRedirectUrl: function () { return "#"; },
    buildUrlWithAuth: function (url) { return url; },

    // ── Organization ─────────────────────────────────────────────────────────
    getOrganization: function () { return Promise.resolve(null); },
    createOrganization: function () { return Promise.reject(new Error("not available")); },

    // ── Auth ─────────────────────────────────────────────────────────────────
    checkAuthorization: function () { return true; },

    // ── Redirect callbacks ────────────────────────────────────────────────────
    handleRedirectCallback: function () { return Promise.resolve(); },
    handleEmailLinkVerification: function () { return Promise.resolve(); },
    handleMagicLinkVerification: function () { return Promise.resolve(); },
    handleGoogleOneTapCallback: function () { return Promise.resolve(); },

    // ── Web3 / Wallet ─────────────────────────────────────────────────────────
    authenticateWithMetamask: function () { return Promise.resolve(); },
    authenticateWithCoinbaseWallet: function () { return Promise.resolve(); },
    authenticateWithWeb3: function () { return Promise.resolve(); },

    // ── Subscription (Clerk billing) ──────────────────────────────────────────
    __internal_openSubscriptionDetails: function () {},
    __internal_closeSubscriptionDetails: function () {},

    // ── Internal / telemetry ──────────────────────────────────────────────────
    telemetry: { record: function () {}, identify: function () {} },
    __internal_toSnapshot: function () { return {}; },
    __unstable__updateProps: function () {},

    // ── Critical: used by useSyncExternalStore snapshot in useUserBase, etc. ─
    // useSyncExternalStore getSnapshot reads:
    //   clerk.__internal_lastEmittedResources.user  (via IsomorphicClerk → clerkjs)
    // If this is undefined → snapshot returns undefined → useUser returns isLoaded:false
    __internal_lastEmittedResources: {
      user: mockUser,
      session: mockSession,
      client: mockClient,
      organization: null,
    },

    // isSignedIn is read directly by IsomorphicClerk.isSignedIn getter
    isSignedIn: true,
    // CRITICAL: do NOT set status here.
    // replayInterceptedInvocations checks: if (typeof clerkjs.status === "undefined")
    // and only then emits "ready" on the internal event bus.
    // If status is set (even to "ready"), the bus "ready" event is suppressed →
    // clerkLoaded() in createGetToken() waits forever → getToken() hangs →
    // entitlements fetch never fires → spinner never clears → blank page forever.
    __unstable__environment: {
      displayConfig: { applicationName: "PlainPath" },
      authConfig: {},
      userSettings: { attributes: {}, social: {} },
      organizationSettings: { enabled: false, maxAllowedMemberships: 0 },
    },
    updateEnvironment: function () {},
    isReady: function () { return this.loaded; },
    getFrontendApi: function () { return "clerk.plainpathapp.com"; },
    on: function () {},
    off: function () {},
    emit: function () {},
    addObserver: function () { return function () {}; },
    __internal_getOption: function (key) { return undefined; },
    __internal_queryClient: null,
  };

  window.Clerk = clerkInstance;
  window.__clerk_e2e_mock = true;

  // ── E2E test flags ────────────────────────────────────────────────────────
  // These window globals let useEntitlements know it's running under Playwright
  // so it can use a short getToken() timeout instead of waiting indefinitely
  // for Clerk's internal event bus "ready" event.
  window.__PLAYWRIGHT_E2E__ = true;
  window.__PLAYWRIGHT_TOKEN__ = MOCK_TOKEN;

  console.info(
    "[E2E] Clerk v6 mock (instance) active — signed in as qa-e2e@test.plainpathapp.com (admin/pro)"
  );
})();
