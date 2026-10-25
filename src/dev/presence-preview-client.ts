// Review-only client: no account session is created or read by this preview server.
import type { SupabaseClient } from '@supabase/supabase-js';
export const supabase: SupabaseClient | null = null;
export const isSupabaseConfigured = false;
export const supabaseAuthConfig: { url: string; publicKey: string } | null = null;
