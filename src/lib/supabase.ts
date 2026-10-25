import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createAuthStorage } from '../utils/authStorage';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('your-project')
);

export const supabaseAuthConfig = isSupabaseConfigured ? { url: supabaseUrl.replace(/\/$/, ''), publicKey: supabaseAnonKey } : null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {

      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Evita conflictos con el enrutamiento por hash (#/dashboard, #/themes)
        storage: typeof window !== 'undefined' ? createAuthStorage(window.localStorage) : undefined,
      },
    })
  : null;

