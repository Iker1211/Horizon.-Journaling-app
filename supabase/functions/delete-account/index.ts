import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hasRecentGoogleAuthentication } from './reauthentication.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: Record<string, unknown>, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Método no permitido.' }, 405);

  try {
    const authorization = request.headers.get('Authorization');
    const accessToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!accessToken) return response({ error: 'Sesión requerida.' }, 401);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return response({ error: 'Servicio no disponible.' }, 503);

    const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    const user = userData.user;
    if (userError || !user?.email) return response({ error: 'La sesión no es válida.' }, 401);

    const body = await request.json().catch(() => ({}));
    if (body?.confirmation !== 'ELIMINAR') {
      return response({ error: 'La confirmación es obligatoria.' }, 400);
    }

    if (body.currentPassword !== undefined && typeof body.currentPassword !== 'string') {
      return response({ error: 'La contraseña no es válida.' }, 400);
    }
    if (body.currentPassword) {
      const verificationClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const verification = await verificationClient.auth.signInWithPassword({ email: user.email, password: body.currentPassword });
      if (verification.error || verification.data.user?.id !== user.id) return response({ error: 'La contraseña actual no es correcta.' }, 403);
    } else {
      // getUser checks the live account; getClaims independently verifies this exact token's signature.
      const { data: verified, error: claimsError } = await userClient.auth.getClaims(accessToken);
      const issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;
      if (claimsError || !hasRecentGoogleAuthentication(verified?.claims, user, issuer, Math.floor(Date.now() / 1000))) {
        return response({ error: 'Confirma tu identidad de nuevo con Google o introduce tu contraseña actual.', code: 'oauth_reauthentication_required' }, 403);
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const avatar = await admin.storage.from('avatars').remove([`${user.id}/avatar.webp`]);
    if (avatar.error && !/not found|404/i.test(avatar.error.message)) return response({ error: 'No pudimos eliminar todos los archivos de la cuenta.' }, 500);
    const deletion = await admin.auth.admin.deleteUser(user.id);
    if (deletion.error) return response({ error: 'No pudimos eliminar la cuenta.' }, 500);
    return response({ deleted: true }, 200);
  } catch {
    return response({ error: 'No pudimos completar la eliminación.' }, 500);
  }
});
