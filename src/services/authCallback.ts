import type { SupabaseClient } from '@supabase/supabase-js';
import { isRecoveryCallback, parseAuthCallbackUrl } from '../utils/authRedirect';
import { confirmGoogleReauthentication, consumeGoogleAuthAttempt, hasGoogleIdentity } from './googleAuth';

export type AuthCallbackOutcome = { kind: 'success'; recovery: boolean; returnToProfile: boolean }
  | { kind: 'error'; message: string } | null;

// Cold launch, appUrlOpen and React's effect replay can deliver the same one-time code.
// Share its exchange without persisting callback URLs or credentials anywhere.
const exchanges = new WeakMap<SupabaseClient, Map<string, Promise<AuthCallbackOutcome>>>();
const CALLBACK_ERROR = 'No pudimos completar el acceso. Vuelve a intentarlo; si usas correo, solicita un código nuevo.';

export function completeAuthCallback(client: SupabaseClient, rawUrl: string): Promise<AuthCallbackOutcome> {
  const callback = parseAuthCallbackUrl(rawUrl);
  if (!callback) return Promise.resolve(null);
  let pending = exchanges.get(client);
  if (!pending) { pending = new Map(); exchanges.set(client, pending); }
  const existing = pending.get(rawUrl);
  if (existing) return existing;
  if (pending.size >= 4) pending.delete(pending.keys().next().value!);
  const exchange = Promise.resolve().then(async (): Promise<AuthCallbackOutcome> => {
    const google = callback.flow === 'google' || callback.flow === 'google-reauth';
    const reauth = callback.flow === 'google-reauth';
    const attempt = google ? consumeGoogleAuthAttempt() : null;
    try {
      if (callback.error) return { kind: 'error', message: google && callback.errorCode === 'access_denied'
        ? 'El acceso con Google se canceló. Puedes volver a intentarlo.' : CALLBACK_ERROR };
      if (google && (!attempt || Boolean(attempt.reauthenticateUserId) !== reauth)) throw new Error('Missing local OAuth attempt');
      // All new redirects use PKCE. Never install bearer tokens supplied by an arbitrary deep link.
      if (!callback.code || callback.accessToken || callback.refreshToken || callback.tokenHash) throw new Error('PKCE code required');
      const { data, error } = await client.auth.exchangeCodeForSession(callback.code);
      if (error || !data.session || !data.user) throw new Error('Code exchange failed');
      if (google && (!hasGoogleIdentity(data.user) || (reauth && data.user.id !== attempt!.reauthenticateUserId))) {
        await client.auth.signOut({ scope: 'local' });
        return { kind: 'error', message: 'Elegiste otra cuenta. Inicia sesión con la cuenta de Horizon que quieres gestionar.' };
      }
      if (reauth) confirmGoogleReauthentication(data.user.id);
      return { kind: 'success', recovery: isRecoveryCallback(callback), returnToProfile: reauth };
    } catch { return { kind: 'error', message: CALLBACK_ERROR }; }
  });
  pending.set(rawUrl, exchange);
  return exchange;
}
