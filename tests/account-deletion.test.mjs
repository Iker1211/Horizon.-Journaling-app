import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

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

const helperUrl = await moduleUrl('../supabase/functions/delete-account/reauthentication.ts');
const { hasRecentGoogleAuthentication } = await import(helperUrl);
const projectUrl = 'https://auth.example.invalid';
const issuer = `${projectUrl}/auth/v1`;
const accountId = '11111111-1111-4111-8111-111111111111';
const otherAccountId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const userFixture = { id: accountId, email: 'synthetic@example.invalid', is_anonymous: false, identities: [{ provider: 'google' }] };
const now = () => Math.floor(Date.now() / 1000);
const claimsFixture = () => ({
  iss: issuer, sub: accountId, aud: 'authenticated', role: 'authenticated',
  session_id: sessionId, is_anonymous: false, exp: now() + 3600,
  iat: now() - 3600, amr: [{ method: 'oauth', timestamp: now() - 20 }],
});

test('recent verified OAuth AMR permits only the live Google account and a five-minute window', () => {
  const currentTime = now();
  const claims = claimsFixture();
  assert.equal(hasRecentGoogleAuthentication(claims, userFixture, issuer, currentTime), true);
  assert.equal(hasRecentGoogleAuthentication({ ...claims, aud: ['authenticated'] }, userFixture, issuer, currentTime), true);
  assert.equal(hasRecentGoogleAuthentication({ ...claims, amr: [{ method: 'oauth', timestamp: currentTime - 300 }] }, userFixture, issuer, currentTime), true);
  for (const timestamp of [currentTime - 301, currentTime + 1, '123', null, NaN, Infinity, currentTime - 0.5]) {
    assert.equal(hasRecentGoogleAuthentication({ ...claims, amr: [{ method: 'oauth', timestamp }] }, userFixture, issuer, currentTime), false);
  }
});

test('audience, role, issuer, owner, session and anonymous mismatches fail closed', () => {
  const claims = claimsFixture();
  for (const patch of [
    { aud: 'anon' }, { aud: ['anon'] }, { aud: ['authenticated', null] }, { role: 'service_role' },
    { iss: 'https://other.example.invalid/auth/v1' }, { sub: otherAccountId },
    { session_id: '' }, { session_id: 'not-a-session' }, { session_id: null },
    { is_anonymous: true }, { is_anonymous: undefined }, { exp: now() }, { nbf: now() + 10 },
  ]) assert.equal(hasRecentGoogleAuthentication({ ...claims, ...patch }, userFixture, issuer, now()), false, JSON.stringify(patch));
  for (const user of [
    { ...userFixture, id: otherAccountId }, { ...userFixture, identities: [] },
    { ...userFixture, identities: [{ provider: 'email' }] }, { ...userFixture, is_anonymous: true },
  ]) assert.equal(hasRecentGoogleAuthentication(claims, user, issuer, now()), false);
});

test('refresh timestamps, user metadata and malformed or future AMR cannot prove reauthentication', () => {
  const claims = claimsFixture();
  for (const amr of [
    undefined, null, [], 'oauth', [null], [{ method: 'oauth' }],
    [{ method: 'password', timestamp: now() }], [{ method: 'token_refresh', timestamp: now() }],
    [{ method: 'oauth', timestamp: now() - 1000 }, { method: 'token_refresh', timestamp: now() }],
    [{ method: 'oauth', timestamp: now() }, { method: 'password', timestamp: now() + 1 }],
  ]) {
    assert.equal(hasRecentGoogleAuthentication({ ...claims, amr, iat: now(), user_metadata: { reauthenticated: true } }, userFixture, issuer, now()), false);
  }
  for (const malformed of [null, [], '', true]) assert.equal(hasRecentGoogleAuthentication(malformed, userFixture, issuer, now()), false);
});

// Exercise the real Supabase JWT verifier with a short-lived, locally generated key.
// No network, real accounts, stored credentials or production signing keys are used.
const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const publicKey = { ...await webcrypto.subtle.exportKey('jwk', keys.publicKey), kid: 'synthetic-signing-key', alg: 'ES256', use: 'sig' };
const verifier = createClient(projectUrl, 'synthetic-public-key', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: () => { throw new Error('Network access is forbidden in deletion tests'); } },
});
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
async function signClaims(claims) {
  const input = `${encode({ alg: 'ES256', kid: publicKey.kid, typ: 'JWT' })}.${encode(claims)}`;
  const signature = await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(input));
  return `${input}.${Buffer.from(signature).toString('base64url')}`;
}

const state = { user: null, userError: null, passwordOwner: null, passwordError: null, events: [] };
globalThis.__horizonDeletionClient = (_url, key) => {
  if (key === 'synthetic-service-role') {
    state.events.push('admin-created');
    return {
      storage: { from: () => ({ remove: async paths => { state.events.push(['avatar-remove', paths]); return { error: null }; } }) },
      auth: { admin: { deleteUser: async id => { state.events.push(['user-delete', id]); return { error: null }; } } },
    };
  }
  return { auth: {
    getUser: async token => { state.events.push(['get-user', token]); return { data: { user: state.user }, error: state.userError }; },
    getClaims: async token => { state.events.push('get-claims'); return verifier.auth.getClaims(token, { jwks: { keys: [publicKey] } }); },
    signInWithPassword: async credentials => {
      state.events.push(['password-check', credentials.email]);
      return { data: { user: state.passwordOwner ? { id: state.passwordOwner } : null }, error: state.passwordError };
    },
  } };
};

let handler;
globalThis.Deno = {
  env: { get: name => ({ SUPABASE_URL: projectUrl, SUPABASE_ANON_KEY: 'synthetic-public-key', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role' })[name] },
  serve: callback => { handler = callback; },
};
const clientUrl = `data:text/javascript,${encodeURIComponent('export const createClient = (...args) => globalThis.__horizonDeletionClient(...args);')}`;
await import(await moduleUrl('../supabase/functions/delete-account/index.ts', {
  'https://esm.sh/@supabase/supabase-js@2': clientUrl,
  './reauthentication.ts': helperUrl,
}));

beforeEach(() => {
  state.user = structuredClone(userFixture);
  state.userError = null;
  state.passwordOwner = accountId;
  state.passwordError = null;
  state.events = [];
});

async function requestDeletion({ token, body = { confirmation: 'ELIMINAR' }, authorization } = {}) {
  return handler(new Request('https://function.example.invalid/delete-account', {
    method: 'POST',
    headers: { Authorization: authorization ?? `Bearer ${token ?? await signClaims(claimsFixture())}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}
function assertNothingDeleted() {
  assert.ok(!state.events.some(event => event === 'admin-created' || (Array.isArray(event) && ['avatar-remove', 'user-delete'].includes(event[0]))));
}

test('Google-only deletion verifies the signed token before deleting only that user and avatar', async () => {
  const result = await requestDeletion();
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { deleted: true });
  assert.ok(state.events.indexOf('get-claims') < state.events.indexOf('admin-created'));
  assert.deepEqual(state.events.slice(-2), [['avatar-remove', [`${accountId}/avatar.webp`]], ['user-delete', accountId]]);
});

test('a forged JWT payload with valid-looking fresh AMR is rejected by real signature verification', async () => {
  const original = await signClaims({ ...claimsFixture(), amr: [{ method: 'oauth', timestamp: now() - 1000 }] });
  const parts = original.split('.');
  parts[1] = encode(claimsFixture());
  const result = await requestDeletion({ token: parts.join('.') });
  assert.equal(result.status, 403);
  assertNothingDeleted();
});

test('expired, stale, future, malformed and different-owner signed tokens never delete files', async () => {
  for (const patch of [
    { exp: now() - 1 }, { amr: [{ method: 'oauth', timestamp: now() - 301 }] },
    { amr: [{ method: 'oauth', timestamp: now() + 60 }] }, { amr: null },
    { sub: otherAccountId }, { role: 'service_role' }, { session_id: null },
  ]) {
    state.events = [];
    const result = await requestDeletion({ token: await signClaims({ ...claimsFixture(), ...patch }) });
    assert.equal(result.status, 403, JSON.stringify(patch));
    assert.equal((await result.json()).code, 'oauth_reauthentication_required');
    assertNothingDeleted();
  }
  state.events = [];
  const malformed = await requestDeletion({ token: 'not-a-jwt' });
  assert.equal(malformed.status, 403);
  assertNothingDeleted();
});

test('body claims and a currently issued token cannot replace fresh verified OAuth AMR', async () => {
  const result = await requestDeletion({
    token: await signClaims({ ...claimsFixture(), iat: now(), amr: [{ method: 'oauth', timestamp: now() - 1000 }, { method: 'token_refresh', timestamp: now() }] }),
    body: { confirmation: 'ELIMINAR', reauthenticated: true, userId: accountId, claims: claimsFixture() },
  });
  assert.equal(result.status, 403);
  assertNothingDeleted();
});

test('confirmation and a live account are mandatory even with fresh signed OAuth', async () => {
  for (const body of [{}, { confirmation: 'eliminar' }, { confirmation: 'ELIMINAR', currentPassword: null }]) {
    state.events = [];
    assert.equal((await requestDeletion({ body })).status, 400);
    assertNothingDeleted();
  }
  state.userError = new Error('Invalidated user session');
  assert.equal((await requestDeletion()).status, 401);
  assertNothingDeleted();
  state.userError = null;
  state.user.identities = [{ provider: 'email' }];
  assert.equal((await requestDeletion()).status, 403);
  assertNothingDeleted();
});

test('legacy password deletion preserves password reauthentication and matching account ownership', async () => {
  state.user.identities = [{ provider: 'email' }];
  const body = { confirmation: 'ELIMINAR', currentPassword: 'synthetic-not-real-password' };
  assert.equal((await requestDeletion({ body })).status, 200);
  assert.ok(state.events.some(event => Array.isArray(event) && event[0] === 'password-check'));
  assert.ok(!state.events.includes('get-claims'));

  for (const scenario of ['wrong-password', 'other-user']) {
    state.events = [];
    state.passwordOwner = scenario === 'other-user' ? otherAccountId : null;
    state.passwordError = scenario === 'wrong-password' ? new Error('Invalid credentials') : null;
    assert.equal((await requestDeletion({ body })).status, 403);
    assertNothingDeleted();
  }
});

test('a supplied wrong password never silently falls back to a recent OAuth token', async () => {
  state.passwordError = new Error('Invalid credentials');
  assert.equal((await requestDeletion({ body: { confirmation: 'ELIMINAR', currentPassword: 'wrong' } })).status, 403);
  assert.ok(!state.events.includes('get-claims'));
  assertNothingDeleted();
});
