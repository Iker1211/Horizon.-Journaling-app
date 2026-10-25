import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

// Exercise the shipped modules; mock only browser, storage, network and Supabase boundaries.
// Addresses, identities and credentials below are synthetic. No request reaches a real service.
async function moduleUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(imports)) {
    output = output.replaceAll(`'${specifier}'`, `'${replacement}'`);
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

const USER_A = '00000000-0000-4000-8000-00000000000a';
const USER_B = '00000000-0000-4000-8000-00000000000b';
const googleUser = (id = USER_A) => ({ id, identities: [{ provider: 'google' }] });
const state = {
  native: false, calls: [], settings: { external: { google: true } }, settingsStatus: 200,
  fetchError: null, oauthError: null, authorizeUrl: null, currentUser: googleUser(),
  returnedUser: googleUser(), exchangeError: null, exchangeGate: null, browserError: null,
};
const fakeClient = {
  auth: {
    async getUser() { return { data: { user: state.currentUser }, error: null }; },
    async signInWithOAuth(options) {
      state.calls.push({ kind: 'oauth', options });
      return {
        data: { url: state.authorizeUrl ?? 'https://auth.example/auth/v1/authorize?provider=google' },
        error: state.oauthError,
      };
    },
    async exchangeCodeForSession(code) {
      state.calls.push({ kind: 'exchange', code });
      if (state.exchangeGate) await state.exchangeGate;
      return {
        data: state.exchangeError ? { session: null, user: null } : { session: { user: state.returnedUser }, user: state.returnedUser },
        error: state.exchangeError,
      };
    },
    async signOut(options) { state.calls.push({ kind: 'signout', options }); return { error: null }; },
    async setSession() { state.calls.push({ kind: 'set-session' }); throw new Error('Bearer session injection is forbidden'); },
  },
};
globalThis.__horizonGoogleTest = { state, client: fakeClient };
const fakeUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const clientUrl = fakeUrl(`export const supabase = globalThis.__horizonGoogleTest.client; export const supabaseAuthConfig = { url: 'https://auth.example', publicKey: 'synthetic-public-key' };`);
const capacitorUrl = fakeUrl(`export const Capacitor = { isNativePlatform: () => globalThis.__horizonGoogleTest.state.native };`);
const browserUrl = fakeUrl(`export const Browser = { async open(options) { const s = globalThis.__horizonGoogleTest.state; s.calls.push({ kind: 'browser', options }); if (s.browserError) throw s.browserError; } };`);
const stateUrl = await moduleUrl('../src/utils/googleAuthState.ts');
const googleState = await import(stateUrl);
const redirectUrl = await moduleUrl('../src/utils/authRedirect.ts', { '@capacitor/core': capacitorUrl });
const redirect = await import(redirectUrl);
const googleUrl = await moduleUrl('../src/services/googleAuth.ts', {
  '@capacitor/core': capacitorUrl, '@capacitor/browser': browserUrl,
  '../lib/supabase': clientUrl, '../utils/authRedirect': redirectUrl, '../utils/googleAuthState': stateUrl,
});
const google = await import(googleUrl);
const callback = await import(await moduleUrl('../src/services/authCallback.ts', {
  '../utils/authRedirect': redirectUrl, './googleAuth': googleUrl,
}));
const { createAuthStorage } = await import(await moduleUrl('../src/utils/authStorage.ts'));
const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

beforeEach(() => {
  Object.assign(state, {
    native: false, calls: [], settings: { external: { google: true } }, settingsStatus: 200,
    fetchError: null, oauthError: null, authorizeUrl: null, currentUser: googleUser(),
    returnedUser: googleUser(), exchangeError: null, exchangeGate: null, browserError: null,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        origin: 'https://horizon.example', pathname: '/', href: 'https://horizon.example/',
        assign: url => state.calls.push({ kind: 'assign', url }),
      },
      localStorage: memoryStorage(), sessionStorage: memoryStorage(),
      dispatchEvent: event => { state.calls.push({ kind: 'event', type: event.type }); return true; },
    },
  });
  globalThis.fetch = async (url, options) => {
    state.calls.push({ kind: 'settings', url, options });
    assert.equal(url, 'https://auth.example/auth/v1/settings');
    if (state.fetchError) throw state.fetchError;
    return new Response(JSON.stringify(state.settings), { status: state.settingsStatus });
  };
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
  delete globalThis.__horizonGoogleTest;
});

const callsOf = kind => state.calls.filter(call => call.kind === kind);
const newCallbackClient = () => ({ auth: fakeClient.auth });
const callbackUrl = (flow, code = 'synthetic-code') => `https://horizon.example/?auth=callback&flow=${flow}&code=${code}`;
const beginAttempt = (userId = null) => googleState.saveGoogleAttempt(window.localStorage, userId);

test('only an explicit enabled Google setting grants the provider capability', async () => {
  assert.equal(await google.getGoogleAuthAvailability(), true);
  assert.equal(callsOf('settings')[0].options.headers.apikey, 'synthetic-public-key');
  state.settings.external.google = false;
  assert.equal(await google.getGoogleAuthAvailability(), false);
  await assert.rejects(google.startGoogleSignIn(), { code: 'oauth_provider_disabled' });
  assert.equal(callsOf('oauth').length, 0);
  assert.equal(window.localStorage.length, 0);
});

test('offline, failed and malformed settings never offer a false Google capability', async () => {
  state.fetchError = new TypeError('Synthetic offline failure');
  const unavailable = error => {
    assert.equal(error.code, 'oauth_unavailable');
    assert.equal(error.message.includes('Synthetic offline failure'), false);
    assert.notEqual(error.name, 'AbortError');
    return true;
  };
  await assert.rejects(google.getGoogleAuthAvailability(), unavailable);
  await assert.rejects(google.startGoogleSignIn(), unavailable);
  state.fetchError = null;
  state.settingsStatus = 503;
  await assert.rejects(google.getGoogleAuthAvailability(), { code: 'oauth_unavailable' });
  state.settingsStatus = 200;
  for (const settings of [null, {}, { external: {} }, { external: { google: 'true' } }]) {
    state.settings = settings;
    await assert.rejects(google.getGoogleAuthAvailability(), { code: 'oauth_unavailable' });
  }
  assert.equal(callsOf('oauth').length, 0);
});

test('only caller cancellation propagates AbortError; a network abort is unavailable', async () => {
  state.fetchError = new DOMException('Synthetic transport abort', 'AbortError');
  await assert.rejects(google.getGoogleAuthAvailability(), error => {
    assert.equal(error.code, 'oauth_unavailable');
    assert.notEqual(error.name, 'AbortError');
    assert.equal(error.message.includes('Synthetic transport abort'), false);
    return true;
  });
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal.aborted, true);
    throw options.signal.reason;
  };
  await assert.rejects(google.getGoogleAuthAvailability(controller.signal), { name: 'AbortError' });
  assert.equal(callsOf('oauth').length, 0);
});

test('web OAuth stays on the initiating origin and explicitly controls the redirect', async () => {
  window.location.origin = 'http://127.0.0.1:5176';
  window.location.pathname = '/journal/';
  await google.startGoogleSignIn();
  assert.deepEqual(callsOf('oauth')[0].options, {
    provider: 'google', options: {
      redirectTo: 'http://127.0.0.1:5176/journal/?auth=callback&flow=google',
      skipBrowserRedirect: true, queryParams: { prompt: 'select_account' },
    },
  });
  assert.equal(callsOf('assign').length, 1);
  assert.equal(callsOf('browser').length, 0);
  assert.equal(googleState.takeGoogleAttempt(window.localStorage).reauthenticateUserId, null);
});

test('Android OAuth opens the system browser rather than navigating the app WebView', async () => {
  state.native = true;
  await google.startGoogleSignIn();
  assert.equal(callsOf('oauth')[0].options.options.redirectTo, 'horizon://auth/callback?flow=google');
  assert.deepEqual(callsOf('browser')[0].options, { url: 'https://auth.example/auth/v1/authorize?provider=google' });
  assert.equal(callsOf('assign').length, 0);
});

test('invalid authorize destinations and browser failures cannot leave an active local attempt', async () => {
  for (const url of ['https://other.example/auth/v1/authorize?provider=google', 'https://auth.example/other?provider=google', 'https://auth.example/auth/v1/authorize?provider=github']) {
    state.authorizeUrl = url;
    await assert.rejects(google.startGoogleSignIn(), { code: 'oauth_unavailable' });
    assert.equal(googleState.takeGoogleAttempt(window.localStorage), null);
  }
  assert.equal(callsOf('assign').length + callsOf('browser').length, 0);
  state.authorizeUrl = null;
  state.native = true;
  state.browserError = Object.assign(new Error('Synthetic cancellation'), { code: 'oauth_cancelled' });
  await assert.rejects(google.startGoogleSignIn(), { code: 'oauth_cancelled' });
  assert.equal(googleState.takeGoogleAttempt(window.localStorage), null);
});

test('reauthentication starts only for the active account with an actual Google identity', async () => {
  await assert.rejects(google.startGoogleSignIn({ reauthenticateUserId: USER_B }), { code: 'oauth_account_changed' });
  state.currentUser = { id: USER_A, identities: [{ provider: 'email' }] };
  await assert.rejects(google.startGoogleSignIn({ reauthenticateUserId: USER_A }), { code: 'oauth_account_changed' });
  assert.equal(callsOf('oauth').length, 0);
  state.currentUser = googleUser();
  await google.startGoogleSignIn({ reauthenticateUserId: USER_A });
  assert.equal(new URL(callsOf('oauth')[0].options.options.redirectTo).searchParams.get('flow'), 'google-reauth');
  assert.equal(googleState.takeGoogleAttempt(window.localStorage).reauthenticateUserId, USER_A);
});

test('Google callbacks without a matching local attempt are rejected before code exchange', async () => {
  const result = await callback.completeAuthCallback(newCallbackClient(), callbackUrl('google'));
  assert.equal(result.kind, 'error');
  assert.equal(callsOf('exchange').length, 0);
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), false);
});

test('unrelated callback origins and routes cannot reach the authentication boundary', async () => {
  const client = newCallbackClient();
  for (const url of ['https://other.example/?auth=callback&flow=google&code=code', 'horizon://other/callback?code=code', 'horizon://auth/wrong?code=code', 'not a URL']) {
    assert.equal(await callback.completeAuthCallback(client, url), null);
  }
  assert.equal(callsOf('exchange').length, 0);
});

test('concurrent delivery of a one-time callback shares one exchange and consumes one attempt', async () => {
  beginAttempt();
  let release;
  state.exchangeGate = new Promise(resolve => { release = resolve; });
  const client = newCallbackClient();
  const url = callbackUrl('google');
  const first = callback.completeAuthCallback(client, url);
  const second = callback.completeAuthCallback(client, url);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(callsOf('exchange').length, 1);
  assert.equal(googleState.takeGoogleAttempt(window.localStorage), null);
  release();
  assert.deepEqual(await first, { kind: 'success', recovery: false, returnToProfile: false });
  assert.deepEqual(await second, await first);
  assert.deepEqual(await callback.completeAuthCallback(client, url), await first);
  assert.equal(callsOf('exchange').length, 1);
});

test('a failed code exchange reports no success, no confirmation and no bearer installation', async () => {
  beginAttempt(USER_A);
  state.exchangeError = new Error('Synthetic invalid code');
  const result = await callback.completeAuthCallback(newCallbackClient(), callbackUrl('google-reauth'));
  assert.equal(result.kind, 'error');
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), false);
  assert.equal(callsOf('event').length, 0);
  assert.equal(callsOf('set-session').length, 0);
});

test('bearer fragments and token_hash links are rejected without calling setSession or exchanging', async () => {
  const client = newCallbackClient();
  for (const suffix of ['#access_token=synthetic-access&refresh_token=synthetic-refresh', '&token_hash=synthetic-hash', '&code=code&token_hash=synthetic-hash', '&code=code#access_token=synthetic-access']) {
    beginAttempt();
    const result = await callback.completeAuthCallback(client, `horizon://auth/callback?flow=google${suffix}`);
    assert.equal(result.kind, 'error');
  }
  assert.equal(callsOf('set-session').length, 0);
  assert.equal(callsOf('exchange').length, 0);
});

test('provider cancellation discards the attempt and never reflects descriptions containing private data', async () => {
  beginAttempt();
  const description = 'synthetic-person@example.invalid denied token=synthetic-private-token';
  const url = `horizon://auth/callback?flow=google&error=access_denied&error_description=${encodeURIComponent(description)}`;
  const result = await callback.completeAuthCallback(newCallbackClient(), url);
  assert.equal(result.kind, 'error');
  assert.match(result.message, /canceló/);
  assert.equal(result.message.includes(description), false);
  assert.equal(result.message.includes('@'), false);
  assert.equal(result.message.includes('synthetic-private-token'), false);
  assert.equal(googleState.takeGoogleAttempt(window.localStorage), null);
  assert.equal(callsOf('exchange').length, 0);
});

test('changing between login and reauthentication intent cannot authorize a sensitive operation', async () => {
  const client = newCallbackClient();
  beginAttempt();
  assert.equal((await callback.completeAuthCallback(client, callbackUrl('google-reauth'))).kind, 'error');
  beginAttempt(USER_A);
  assert.equal((await callback.completeAuthCallback(client, callbackUrl('google'))).kind, 'error');
  assert.equal(callsOf('exchange').length, 0);
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), false);
});

test('selecting another UUID during Google reauthentication signs out locally and grants no confirmation', async () => {
  beginAttempt(USER_A);
  state.returnedUser = googleUser(USER_B);
  const result = await callback.completeAuthCallback(newCallbackClient(), callbackUrl('google-reauth'));
  assert.equal(result.kind, 'error');
  assert.deepEqual(callsOf('signout').map(call => call.options), [{ scope: 'local' }]);
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), false);
  assert.equal(google.hasRecentGoogleReauthentication(USER_B), false);
  assert.equal(callsOf('event').length, 0);
});

test('an exchanged user without a Google identity is not accepted as a Google login', async () => {
  beginAttempt();
  state.returnedUser = { id: USER_A, identities: [{ provider: 'email' }], app_metadata: { provider: 'google' } };
  const result = await callback.completeAuthCallback(newCallbackClient(), callbackUrl('google'));
  assert.equal(result.kind, 'error');
  assert.deepEqual(callsOf('signout').map(call => call.options), [{ scope: 'local' }]);
});

test('successful reauthentication returns to profile and scopes the short-lived confirmation to its UUID', async () => {
  beginAttempt(USER_A);
  const result = await callback.completeAuthCallback(newCallbackClient(), callbackUrl('google-reauth'));
  assert.deepEqual(result, { kind: 'success', recovery: false, returnToProfile: true });
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), true);
  assert.equal(google.hasRecentGoogleReauthentication(USER_B), false);
  assert.deepEqual(callsOf('event').map(call => call.type), ['horizon:google-reauthenticated']);
  google.clearGoogleReauthentication(USER_A);
  assert.equal(google.hasRecentGoogleReauthentication(USER_A), false);
});

test('attempts are single use and reject expired, future, malformed or invalid-owner state', () => {
  const store = memoryStorage();
  const now = 1_000_000;
  googleState.saveGoogleAttempt(store, USER_A, now);
  assert.deepEqual(googleState.takeGoogleAttempt(store, now + 1), { startedAt: now, reauthenticateUserId: USER_A });
  assert.equal(googleState.takeGoogleAttempt(store, now + 1), null);
  for (const raw of ['{broken', JSON.stringify({ startedAt: now - 600_001, reauthenticateUserId: null }), JSON.stringify({ startedAt: now + 1, reauthenticateUserId: null }), JSON.stringify({ startedAt: now, reauthenticateUserId: '' }), JSON.stringify({ startedAt: 'now', reauthenticateUserId: null })]) {
    store.setItem(googleState.GOOGLE_ATTEMPT_KEY, raw);
    assert.equal(googleState.takeGoogleAttempt(store, now), null);
    assert.equal(store.getItem(googleState.GOOGLE_ATTEMPT_KEY), null);
  }
  googleState.saveGoogleConfirmation(store, USER_A, now);
  assert.equal(googleState.googleConfirmationExpiresAt(store, USER_A, now + 1), now + 240_000);
  assert.equal(googleState.googleConfirmationExpiresAt(store, USER_B, now + 1), 0);
  assert.equal(googleState.googleConfirmationExpiresAt(store, USER_A, now + 240_000), 0);
  googleState.clearGoogleState(store);
  assert.equal(googleState.googleConfirmationExpiresAt(store, USER_A, now), 0);
});

test('Google-only classification uses actual identities and preserves mixed email accounts', () => {
  assert.equal(google.isGoogleOnlyAccount(googleUser()), true);
  assert.equal(google.isGoogleOnlyAccount({ id: USER_A, identities: [{ provider: 'google' }, { provider: 'email' }] }), false);
  assert.equal(google.isGoogleOnlyAccount({ id: USER_A, app_metadata: { provider: 'google' } }), false);
  assert.equal(google.hasGoogleIdentity({ id: USER_A, identities: [] }), false);
});

test('auth storage discards Google API tokens while retaining Supabase session and PKCE values', () => {
  const underlying = memoryStorage();
  const storage = createAuthStorage(underlying);
  storage.setItem('session', JSON.stringify({
    access_token: 'synthetic-supabase-access', refresh_token: 'synthetic-supabase-refresh',
    provider_token: 'synthetic-google-access', provider_refresh_token: 'synthetic-google-refresh',
    user: googleUser(), expires_at: 123456,
  }));
  assert.deepEqual(JSON.parse(storage.getItem('session')), {
    access_token: 'synthetic-supabase-access', refresh_token: 'synthetic-supabase-refresh',
    user: googleUser(), expires_at: 123456,
  });
  for (const value of ['synthetic-pkce-verifier', JSON.stringify('synthetic-pkce-verifier')]) {
    storage.setItem('code-verifier', value);
    assert.equal(storage.getItem('code-verifier'), value);
  }
  storage.removeItem('session');
  assert.equal(storage.getItem('session'), null);
});

test('the installed Supabase SDK persists a real PKCE verifier and exchanges its matching challenge without network', async () => {
  const underlying = memoryStorage();
  const storageKey = 'horizon-synthetic-sdk-session';
  const requests = [];
  const client = createClient('https://sdk-auth.example', 'synthetic-public-key', {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, storageKey, storage: createAuthStorage(underlying) },
    global: {
      fetch: async (url, options) => {
        requests.push({ url: String(url), options });
        assert.equal(String(url), 'https://sdk-auth.example/auth/v1/token?grant_type=pkce');
        const now = Math.floor(Date.now() / 1000);
        const accessToken = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: USER_A, exp: now + 3600, iat: now })).toString('base64url')}.synthetic-signature`;
        return new Response(JSON.stringify({
          access_token: accessToken, refresh_token: 'synthetic-session-refresh', expires_in: 3600, token_type: 'bearer',
          provider_token: 'synthetic-provider-access', provider_refresh_token: 'synthetic-provider-refresh',
          user: { ...googleUser(), aud: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: {} },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      },
    },
  });
  try {
    const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect.getAuthRedirectUrl('google'), skipBrowserRedirect: true } });
    assert.equal(error, null);
    const authorize = new URL(data.url);
    assert.equal(authorize.searchParams.get('provider'), 'google');
    assert.equal(authorize.searchParams.get('code_challenge_method'), 's256');
    const storedVerifier = JSON.parse(underlying.getItem(`${storageKey}-code-verifier`));
    assert.equal(typeof storedVerifier, 'string');
    const challenge = createHash('sha256').update(storedVerifier).digest('base64url');
    assert.equal(authorize.searchParams.get('code_challenge'), challenge);
    assert.equal(requests.length, 0);
    const exchanged = await client.auth.exchangeCodeForSession('synthetic-one-time-code');
    assert.equal(exchanged.error, null);
    assert.equal(exchanged.data.user.id, USER_A);
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(requests[0].options.body), { auth_code: 'synthetic-one-time-code', code_verifier: storedVerifier });
    const persisted = JSON.parse(underlying.getItem(storageKey));
    assert.equal(persisted.user.id, USER_A);
    assert.equal(persisted.refresh_token, 'synthetic-session-refresh');
    assert.equal('provider_token' in persisted, false);
    assert.equal('provider_refresh_token' in persisted, false);
    assert.equal(underlying.getItem(`${storageKey}-code-verifier`), null);
  } finally {
    await client.auth.stopAutoRefresh();
  }
});
