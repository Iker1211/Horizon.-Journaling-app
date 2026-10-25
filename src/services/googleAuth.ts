import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase, supabaseAuthConfig } from '../lib/supabase';
import { getAuthRedirectUrl } from '../utils/authRedirect';
import { clearGoogleState, googleConfirmationExpiresAt, hasGoogleIdentity, saveGoogleAttempt, saveGoogleConfirmation, takeGoogleAttempt } from '../utils/googleAuthState';

export { hasGoogleIdentity, isGoogleOnlyAccount } from '../utils/googleAuthState';

const authError = (code: string) => Object.assign(new Error('No pudimos completar el acceso con Google.'), { code });

export async function getGoogleAuthAvailability(signal?: AbortSignal): Promise<boolean> {
  if (!supabaseAuthConfig) return false;
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 8_000);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const result = await fetch(`${supabaseAuthConfig.url}/auth/v1/settings`, {
      headers: { apikey: supabaseAuthConfig.publicKey }, signal: controller.signal,
    });
    if (!result.ok) throw authError('oauth_unavailable');
    const settings = await result.json();
    if (typeof settings?.external?.google !== 'boolean') throw authError('oauth_unavailable');
    return settings.external.google;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw authError('oauth_unavailable');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function startGoogleSignIn(options: { reauthenticateUserId?: string } = {}): Promise<void> {
  if (!supabase || !supabaseAuthConfig) throw authError('oauth_unavailable');
  if (!await getGoogleAuthAvailability()) throw authError('oauth_provider_disabled');
  const userId = options.reauthenticateUserId ?? null;
  if (userId) {
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== userId || !hasGoogleIdentity(data.user)) throw authError('oauth_account_changed');
  }
  try {
    clearGoogleState(window.localStorage);
    clearGoogleState(window.sessionStorage);
    saveGoogleAttempt(window.localStorage, userId);
  } catch { throw authError('oauth_storage_unavailable'); }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(userId ? 'google-reauth' : 'google'),
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    const url = new URL(data.url ?? '');
    if (url.origin !== new URL(supabaseAuthConfig.url).origin || url.pathname !== '/auth/v1/authorize'
      || url.searchParams.get('provider') !== 'google') throw authError('oauth_unavailable');
    if (Capacitor.isNativePlatform()) await Browser.open({ url: url.href });
    else window.location.assign(url.href);
  } catch (error) {
    try { clearGoogleState(window.localStorage); } catch { /* Storage may have become unavailable. */ }
    throw error;
  }
}

export function consumeGoogleAuthAttempt() {
  try { return takeGoogleAttempt(window.localStorage); } catch { return null; }
}

export function confirmGoogleReauthentication(userId: string) {
  try { saveGoogleConfirmation(window.sessionStorage, userId); } catch { return; }
  window.dispatchEvent(new Event('horizon:google-reauthenticated'));
}

export function getGoogleReauthenticationExpiresAt(userId: string) {
  try { return googleConfirmationExpiresAt(window.sessionStorage, userId); } catch { return 0; }
}

export function hasRecentGoogleReauthentication(userId: string) {
  return getGoogleReauthenticationExpiresAt(userId) > Date.now();
}

export function clearGoogleReauthentication(_userId?: string) {
  try { clearGoogleState(window.sessionStorage); } catch { /* A missing store cannot supply a confirmation. */ }
}

export function clearGoogleAuthenticationState() {
  try { clearGoogleState(window.localStorage); clearGoogleState(window.sessionStorage); } catch { /* No persistent marker remains usable without its store. */ }
}
