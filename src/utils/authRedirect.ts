import type { EmailOtpType } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

export type AuthFlow = 'signin' | 'signup' | 'recovery';

export interface ParsedAuthCallback {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  tokenHash: string | null;
  otpType: EmailOtpType | null;
  flow: AuthFlow | null;
  error: string | null;
}

const NATIVE_AUTH_CALLBACK = 'horizon://auth/callback';
const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, '');
}

export function getAuthRedirectUrl(flow: AuthFlow) {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_AUTH_CALLBACK}?flow=${flow}`;
  }

  const configuredUrl = normalizeBaseUrl(import.meta.env.VITE_PUBLIC_SITE_URL ?? '');
  const baseUrl = configuredUrl || `${window.location.origin}${window.location.pathname}`;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}auth=callback&flow=${flow}`;
}

function readCallbackParams(url: URL) {
  const params = new URLSearchParams(url.search);
  const fragment = url.hash.replace(/^#/, '');
  if (fragment && !fragment.startsWith('/')) {
    const fragmentParams = new URLSearchParams(fragment);
    fragmentParams.forEach((value, key) => params.set(key, value));
  }
  return params;
}

export function parseAuthCallbackUrl(rawUrl: string): ParsedAuthCallback | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const params = readCallbackParams(url);
  const isNativeCallback = url.protocol === 'horizon:' && url.host === 'auth' && url.pathname === '/callback';
  const currentOrigin = typeof window === 'undefined' ? null : window.location.origin;
  const isWebCallback = Boolean(currentOrigin && url.origin === currentOrigin && params.get('auth') === 'callback');
  if (!isNativeCallback && !isWebCallback) return null;

  const rawType = params.get('type');
  const otpType = rawType && EMAIL_OTP_TYPES.has(rawType as EmailOtpType)
    ? rawType as EmailOtpType
    : null;
  const rawFlow = params.get('flow');
  const flow = rawFlow === 'signin' || rawFlow === 'signup' || rawFlow === 'recovery'
    ? rawFlow
    : otpType === 'recovery' ? 'recovery' : null;

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    tokenHash: params.get('token_hash'),
    otpType,
    flow,
    error: params.get('error_description')?.replace(/\+/g, ' ') || params.get('error') || null,
  };
}

export function isRecoveryCallback(callback: ParsedAuthCallback) {
  return callback.flow === 'recovery' || callback.otpType === 'recovery';
}

