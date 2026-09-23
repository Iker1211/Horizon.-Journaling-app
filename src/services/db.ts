import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BigTheme, BlogEntry } from '../types';
import {
  loadThemes,
  saveThemes,
  loadBlogEntries,
  saveBlogEntries,
} from '../utils/storage';

// --- THEMES ---
export async function getThemes(userId?: string): Promise<BigTheme[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('big_themes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const loaded: BigTheme[] = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          color: item.color as any,
          icon: item.icon || 'Target',
          targetGoals2027: item.target_goals_2027 || [],
          priority: item.priority || 'alta',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        saveThemes(loaded);
        return loaded;
      }
    } catch (err) {
      console.warn('Supabase getThemes error, using local data:', err);
    }
  }
  return loadThemes();
}

export async function saveThemeItem(theme: BigTheme, userId?: string): Promise<void> {
  // Always update local cache for immediate UI responsiveness
  const current = loadThemes();
  const index = current.findIndex(t => t.id === theme.id);
  const updated = index >= 0 ? current.map(t => (t.id === theme.id ? theme : t)) : [theme, ...current];
  saveThemes(updated);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase.from('big_themes').upsert({
        id: theme.id,
        user_id: userId,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        icon: theme.icon,
        target_goals_2027: theme.targetGoals2027,
        priority: theme.priority,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      console.log('✓ Wrapper sincronizado con Supabase:', theme.name);
    } catch (err) {
      console.error('Error guardando Wrapper en Supabase:', err);
    }
  }
}

export async function deleteThemeItem(themeId: string, userId?: string): Promise<void> {
  const current = loadThemes();
  saveThemes(current.filter(t => t.id !== themeId));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from('big_themes')
        .delete()
        .eq('id', themeId)
        .eq('user_id', userId);
      if (error) throw error;
      console.log('✓ Wrapper eliminado en Supabase:', themeId);
    } catch (err) {
      console.error('Error eliminando Wrapper en Supabase:', err);
    }
  }
}

// --- BLOG ENTRIES (WRAPPED BY WRAPPERS) ---
export async function getBlogEntries(userId?: string): Promise<BlogEntry[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('blog_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const loaded: BlogEntry[] = data.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary || '',
          content: item.content || '',
          themeId: item.theme_id, // Foreign Key linking to BigTheme
          date: item.date,
          tags: item.tags || [],
          readTimeMinutes: item.read_time_minutes || 3,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        saveBlogEntries(loaded);
        return loaded;
      }
    } catch (err) {
      console.warn('Supabase getBlogEntries error, using local data:', err);
    }
  }
  return loadBlogEntries();
}

export async function saveBlogEntryItem(entry: BlogEntry, userId?: string): Promise<void> {
  const current = loadBlogEntries();
  const index = current.findIndex(b => b.id === entry.id);
  const updated = index >= 0 ? current.map(b => (b.id === entry.id ? entry : b)) : [entry, ...current];
  saveBlogEntries(updated);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase.from('blog_entries').upsert({
        id: entry.id,
        user_id: userId,
        title: entry.title,
        summary: entry.summary,
        content: entry.content,
        theme_id: entry.themeId, // Connected to BigTheme as wrapper
        date: entry.date,
        tags: entry.tags,
        read_time_minutes: entry.readTimeMinutes,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      console.log('✓ Bitácora sincronizada con Supabase:', entry.title);
    } catch (err) {
      console.error('Error guardando bitácora en Supabase:', err);
    }
  }
}

export async function deleteBlogEntryItem(entryId: string, userId?: string): Promise<void> {
  const current = loadBlogEntries();
  saveBlogEntries(current.filter(b => b.id !== entryId));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from('blog_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);
      if (error) throw error;
      console.log('✓ Bitácora eliminada en Supabase:', entryId);
    } catch (err) {
      console.error('Error eliminando bitácora en Supabase:', err);
    }
  }
}

// Sync helper: uploads initial local data to Supabase when user authenticates
export async function syncLocalToSupabase(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const localThemes = loadThemes();
  const localBlogs = loadBlogEntries();

  for (const t of localThemes) {
    await saveThemeItem(t, userId);
  }
  for (const b of localBlogs) {
    await saveBlogEntryItem(b, userId);
  }
}

// Health check to verify real records in Supabase PostgreSQL under the authenticated user
export interface SupabaseHealthCheck {
  connected: boolean;
  themesCount: number;
  blogsCount: number;
  error?: string;
}

export async function checkSupabaseHealth(userId?: string): Promise<SupabaseHealthCheck> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      themesCount: 0,
      blogsCount: 0,
      error: 'Supabase no está configurado en .env.local',
    };
  }

  if (!userId) {
    return {
      connected: false,
      themesCount: 0,
      blogsCount: 0,
      error: 'Inicia sesión para sincronizar y consultar datos de Supabase',
    };
  }

  try {
    const [resThemes, resBlogs] = await Promise.all([
      supabase.from('big_themes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('blog_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const anyError = resThemes.error || resBlogs.error;
    if (anyError) {
      return {
        connected: false,
        themesCount: 0,
        blogsCount: 0,
        error: anyError.message,
      };
    }

    return {
      connected: true,
      themesCount: resThemes.count ?? 0,
      blogsCount: resBlogs.count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      themesCount: 0,
      blogsCount: 0,
      error: err.message || 'Error de conexión',
    };
  }
}
