import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://rlkfornfrumvixwvcihy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_PpNT97vMF_YlICjjAQajwA_cbyX6Exf';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {

      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Evita conflictos con el enrutamiento por hash (#/dashboard, #/themes)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

