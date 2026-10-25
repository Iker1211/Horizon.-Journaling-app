// Used only by scripts/auth-preview.mjs. Never connect this review to personal accounts.
import type { SupabaseClient, User } from '@supabase/supabase-js';
export const reviewUser = {
  id: '11111111-1111-4111-8111-111111111111', email: 'alex@example.invalid',
  app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-10-23T00:00:00Z',
  identities: [{ id: 'google-synthetic', provider: 'google', user_id: '11111111-1111-4111-8111-111111111111', identity_data: {} }],
} as User;
export const isSupabaseConfigured = true;
export const supabaseAuthConfig = { url: 'https://horizon-auth-preview.example.invalid', publicKey: 'synthetic-public-key' };
const scenario = new URLSearchParams(window.location.search).get('scenario');
window.fetch = async input => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url === `${supabaseAuthConfig.url}/auth/v1/settings`) {
    if (scenario === 'offline') throw new TypeError('Synthetic network failure');
    return new Response(JSON.stringify({ external: { google: scenario !== 'disabled' } }), { headers: { 'Content-Type': 'application/json' } });
  }
  throw new Error('Network disabled in the synthetic authentication review.');
};
const denied = (code: string) => ({ data: { user: null, session: null }, error: { code, message: 'Synthetic authentication result' } });
export const supabase = {
  auth: {
    signInWithOAuth: async () => { throw Object.assign(new Error('Synthetic cancellation'), { code: 'oauth_cancelled' }); },
    signInWithPassword: async () => denied('invalid_credentials'),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithOtp: async () => ({ error: null }), resend: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }), verifyOtp: async () => denied('otp_expired'),
    getUser: async () => ({ data: { user: reviewUser }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
  functions: { invoke: async () => ({ error: new Error('La revisión no elimina cuentas.') }) },
} as unknown as SupabaseClient;
