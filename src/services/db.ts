import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { BigTheme, BlogEntry } from '../types';

/** Every operation belongs to the current authenticated account. Device data is never imported. */
async function accountClient(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('No se pudo conectar con Horizon. Inténtalo de nuevo más tarde.');
  }
  if (!userId) throw new Error('Inicia sesión para acceder a tu espacio.');

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== userId) {
    throw new Error('Tu sesión ha cambiado. Vuelve a iniciar sesión.');
  }
  return supabase;
}

export async function getThemes(userId?: string): Promise<BigTheme[]> {
  if (!userId) return [];
  const client = await accountClient(userId);
  const { data, error } = await client
    .from('big_themes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  // An empty cloud result is an empty account, never a reason to load shared device data.
  return (data ?? []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    color: item.color,
    icon: item.icon || 'Target',
    targetGoals2027: item.target_goals_2027 || [],
    priority: item.priority || 'alta',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function saveThemeItem(theme: BigTheme, userId: string): Promise<void> {
  const client = await accountClient(userId);
  const { error } = await client.from('big_themes').upsert({
    id: theme.id,
    user_id: userId,
    name: theme.name,
    description: theme.description,
    color: theme.color,
    icon: theme.icon,
    target_goals_2027: theme.targetGoals2027,
    priority: theme.priority,
    created_at: theme.createdAt,
    updated_at: theme.updatedAt,
  });
  if (error) throw error;
}

export async function deleteThemeItem(themeId: string, userId: string): Promise<void> {
  const client = await accountClient(userId);
  const { error } = await client
    .from('big_themes')
    .delete()
    .eq('id', themeId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getBlogEntries(userId?: string): Promise<BlogEntry[]> {
  if (!userId) return [];
  const client = await accountClient(userId);
  const { data, error } = await client
    .from('blog_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;

  return (data ?? []).map(item => ({
    id: item.id,
    title: item.title,
    summary: item.summary || '',
    content: item.content || '',
    themeId: item.theme_id,
    date: item.date,
    tags: item.tags || [],
    readTimeMinutes: item.read_time_minutes ?? 3,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function saveBlogEntryItem(entry: BlogEntry, userId: string): Promise<void> {
  const client = await accountClient(userId);
  const { error } = await client.from('blog_entries').upsert({
    id: entry.id,
    user_id: userId,
    title: entry.title,
    summary: entry.summary,
    content: entry.content,
    theme_id: entry.themeId,
    date: entry.date,
    tags: entry.tags,
    read_time_minutes: entry.readTimeMinutes,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  });
  if (error) throw error;
}

export async function deleteBlogEntryItem(entryId: string, userId: string): Promise<void> {
  const client = await accountClient(userId);
  const { error } = await client
    .from('blog_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}
