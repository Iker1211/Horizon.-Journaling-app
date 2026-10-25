import type { User } from '@supabase/supabase-js';

export const GOOGLE_ATTEMPT_KEY = 'horizon.google-auth.attempt.v1';
const REAUTH_KEY = 'horizon.google-auth.confirmation.v1';
const ATTEMPT_LIFETIME = 10 * 60_000;
// Keep a margin below the backend's five-minute authentication window.
const REAUTH_LIFETIME = 4 * 60_000;
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface GoogleAuthAttempt { startedAt: number; reauthenticateUserId: string | null }

export function hasGoogleIdentity(user: User) {
  return user.identities?.some(identity => identity.provider === 'google') === true;
}

export function isGoogleOnlyAccount(user: User) {
  return hasGoogleIdentity(user) && user.identities?.every(identity => identity.provider === 'google') === true;
}

export function saveGoogleAttempt(store: Store, userId: string | null, now = Date.now()) {
  store.setItem(GOOGLE_ATTEMPT_KEY, JSON.stringify({ startedAt: now, reauthenticateUserId: userId }));
}

export function takeGoogleAttempt(store: Store, now = Date.now()): GoogleAuthAttempt | null {
  const raw = store.getItem(GOOGLE_ATTEMPT_KEY);
  store.removeItem(GOOGLE_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (typeof value.startedAt !== 'number' || !Number.isFinite(value.startedAt)
      || value.startedAt > now || now - value.startedAt > ATTEMPT_LIFETIME
      || !(value.reauthenticateUserId === null || (typeof value.reauthenticateUserId === 'string' && value.reauthenticateUserId.length > 0))) return null;
    return { startedAt: value.startedAt, reauthenticateUserId: value.reauthenticateUserId };
  } catch { return null; }
}

export function clearGoogleState(store: Store) {
  store.removeItem(GOOGLE_ATTEMPT_KEY);
  store.removeItem(REAUTH_KEY);
}

// This marker controls presentation only. The Edge Function independently checks signed AMR.
export function saveGoogleConfirmation(store: Store, userId: string, now = Date.now()) {
  store.setItem(REAUTH_KEY, JSON.stringify({ userId, expiresAt: now + REAUTH_LIFETIME }));
}

export function googleConfirmationExpiresAt(store: Store, userId: string, now = Date.now()): number {
  try {
    const raw = store.getItem(REAUTH_KEY);
    if (!raw) return 0;
    const value = JSON.parse(raw);
    return value.userId === userId && Number.isFinite(value.expiresAt)
      && value.expiresAt > now && value.expiresAt <= now + REAUTH_LIFETIME ? value.expiresAt : 0;
  } catch { return 0; }
}
