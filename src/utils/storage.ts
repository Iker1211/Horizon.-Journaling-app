import { BigTheme, BlogEntry, BlogDraft } from '../types';
import { INITIAL_THEMES, INITIAL_BLOG_ENTRIES } from './demoData';

const STORAGE_KEYS = {
  THEMES: 'clay_2027_themes_v1',
  BLOG: 'clay_2027_blog_v1',
  BLOG_DRAFT: 'clay_2027_blog_draft_v1',
};

export function loadThemes(): BigTheme[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THEMES);
    if (!data) {
      saveThemes(INITIAL_THEMES);
      return INITIAL_THEMES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_THEMES;
  }
}

export function saveThemes(themes: BigTheme[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
  } catch (err) {
    console.error('Failed to save themes to localStorage:', err);
  }
}

export function loadBlogEntries(): BlogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BLOG);
    if (!data) {
      saveBlogEntries(INITIAL_BLOG_ENTRIES);
      return INITIAL_BLOG_ENTRIES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_BLOG_ENTRIES;
  }
}

export function saveBlogEntries(entries: BlogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save blog entries to localStorage:', err);
  }
}

export function resetAllData(): {
  themes: BigTheme[];
  blogEntries: BlogEntry[];
} {
  saveThemes(INITIAL_THEMES);
  saveBlogEntries(INITIAL_BLOG_ENTRIES);
  localStorage.removeItem('clay_2027_milestones_v1');
  return {
    themes: INITIAL_THEMES,
    blogEntries: INITIAL_BLOG_ENTRIES,
  };
}

export function loadBlogDraft(): BlogDraft | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BLOG_DRAFT);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveBlogDraft(draft: BlogDraft): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOG_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save blog draft to localStorage:', err);
  }
}

export function clearBlogDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BLOG_DRAFT);
  } catch (err) {
    console.warn('Failed to clear blog draft from localStorage:', err);
  }
}
