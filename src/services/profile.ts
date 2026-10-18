import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AvatarCharacterId, UserProfile } from '../types';
import { isAvatarCharacterId } from '../utils/avatarCharacters';

const AVATAR_BUCKET = 'avatars';

async function profileClient(userId: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('No se pudo conectar con Horizon.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!userId || data.session?.user.id !== userId) throw new Error('Tu sesión ha cambiado. Vuelve a iniciar sesión.');
  return supabase;
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    displayName: typeof row.display_name === 'string' ? row.display_name : '',
    bio: typeof row.bio === 'string' ? row.bio : '',
    avatarPath: typeof row.avatar_path === 'string' ? row.avatar_path : null,
    avatarVersion: typeof row.avatar_version === 'number' ? row.avatar_version : Number(row.avatar_version || 0),
    avatarCharacter: isAvatarCharacterId(row.avatar_character) ? row.avatar_character : null,
    cycleStartDate: typeof row.cycle_start_date === 'string' ? row.cycle_start_date : '',
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

export async function getOrCreateProfile(userId: string, initialCycleDate: string): Promise<UserProfile> {
  const client = await profileClient(userId);
  let { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;

  if (!data) {
    const result = await client.from('profiles').upsert({ id: userId }, { onConflict: 'id' }).select('*').single();
    if (result.error) throw result.error;
    data = result.data;
  }

  if (!data.cycle_start_date) {
    const initialized = await client
      .from('profiles')
      .update({ cycle_start_date: initialCycleDate })
      .eq('id', userId)
      .is('cycle_start_date', null)
      .select('*')
      .maybeSingle();
    if (initialized.error) throw initialized.error;
    if (initialized.data) data = initialized.data;
    else {
      const refreshed = await client.from('profiles').select('*').eq('id', userId).single();
      if (refreshed.error) throw refreshed.error;
      data = refreshed.data;
    }
  }
  return mapProfile(data);
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'cycleStartDate'>>,
): Promise<UserProfile> {
  const client = await profileClient(userId);
  const payload: Record<string, unknown> = {};
  if (patch.displayName !== undefined) payload.display_name = patch.displayName.trim() || null;
  if (patch.bio !== undefined) payload.bio = patch.bio.trim();
  if (patch.cycleStartDate !== undefined) payload.cycle_start_date = patch.cycleStartDate;
  const { data, error } = await client.from('profiles').update(payload).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

export async function loadAvatarObjectUrl(userId: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const client = await profileClient(userId);
  const { data, error } = await client.storage.from(AVATAR_BUCKET).download(path);
  if (error) {
    if (/not found|404/i.test(error.message)) return null;
    throw error;
  }
  return URL.createObjectURL(data);
}

export async function uploadAvatar(userId: string, blob: Blob, currentVersion: number): Promise<UserProfile> {
  const client = await profileClient(userId);
  const path = `${userId}/avatar.webp`;
  const uploaded = await client.storage.from(AVATAR_BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: true,
  });
  if (uploaded.error) throw uploaded.error;
  const { data, error } = await client.from('profiles').update({
    avatar_path: path,
    avatar_version: currentVersion + 1,
    avatar_character: null,
  }).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

export async function selectAvatarCharacter(userId: string, characterId: AvatarCharacterId | null): Promise<UserProfile> {
  if (characterId !== null && !isAvatarCharacterId(characterId)) throw new Error('Elige uno de los personajes disponibles.');
  const client = await profileClient(userId);
  // Keep a previously uploaded photo so switching back does not require uploading it again.
  const { data, error } = await client.from('profiles').update({ avatar_character: characterId }).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

export async function removeAvatar(userId: string): Promise<UserProfile> {
  const client = await profileClient(userId);
  const path = `${userId}/avatar.webp`;
  const removed = await client.storage.from(AVATAR_BUCKET).remove([path]);
  if (removed.error && !/not found|404/i.test(removed.error.message)) throw removed.error;
  const { data, error } = await client.from('profiles').update({ avatar_path: null }).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}
