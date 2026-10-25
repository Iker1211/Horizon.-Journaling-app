export const OAUTH_REAUTH_MAX_AGE_SECONDS = 5 * 60;

interface VerifiedAccount {
  id: string;
  is_anonymous?: boolean;
  identities?: Array<{ provider?: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accept only claims already signature-verified by auth.getClaims(), paired with auth.getUser(). */
export function hasRecentGoogleAuthentication(
  claims: unknown,
  user: VerifiedAccount,
  issuer: string,
  nowSeconds: number,
): boolean {
  if (!isRecord(claims) || !Number.isSafeInteger(nowSeconds) || nowSeconds <= 0) return false;
  if (!UUID.test(user.id) || claims.sub !== user.id || claims.iss !== issuer) return false;
  const authenticatedAudience = claims.aud === 'authenticated' || (
    Array.isArray(claims.aud) && claims.aud.every(value => typeof value === 'string') && claims.aud.includes('authenticated')
  );
  if (!authenticatedAudience || claims.role !== 'authenticated') return false;
  if (typeof claims.session_id !== 'string' || !UUID.test(claims.session_id)) return false;
  if (claims.is_anonymous !== false || user.is_anonymous === true) return false;
  if (typeof claims.exp !== 'number' || !Number.isSafeInteger(claims.exp) || claims.exp <= nowSeconds) return false;
  if (claims.nbf !== undefined && (
    typeof claims.nbf !== 'number' || !Number.isSafeInteger(claims.nbf) || claims.nbf > nowSeconds
  )) return false;
  if (!Array.isArray(user.identities) || !user.identities.some(identity => identity?.provider === 'google')) return false;
  if (!Array.isArray(claims.amr) || claims.amr.length === 0) return false;

  // A refreshed token's iat is not proof of reauthentication. The signed OAuth AMR records it.
  if (!claims.amr.every(entry => isRecord(entry)
    && typeof entry.method === 'string' && entry.method.length > 0
    && typeof entry.timestamp === 'number' && Number.isSafeInteger(entry.timestamp)
    && entry.timestamp > 0 && entry.timestamp <= nowSeconds)) return false;

  return claims.amr.some(entry => entry.method === 'oauth'
    && entry.timestamp >= nowSeconds - OAUTH_REAUTH_MAX_AGE_SECONDS);
}
