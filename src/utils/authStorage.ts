// Supabase owns session persistence. Horizon does not need Google's API credentials.
export function createAuthStorage(storage: Storage) {
  return {
    getItem: (key: string) => storage.getItem(key),
    removeItem: (key: string) => storage.removeItem(key),
    setItem(key: string, value: string) {
      let stored = value;
      try {
        const session = JSON.parse(value);
        if (session && typeof session === 'object' && !Array.isArray(session)) {
          delete session.provider_token;
          delete session.provider_refresh_token;
          stored = JSON.stringify(session);
        }
      } catch { /* PKCE verifiers and other SDK values need no transformation. */ }
      storage.setItem(key, stored);
    },
  };
}
