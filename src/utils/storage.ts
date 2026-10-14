import type { BlogDraft } from '../types';

/** Legacy clay_2027_* keys have no owner and must never be read or migrated into an account. */
function draftKey(userId: string): string | null {
  return userId ? `horizon:${encodeURIComponent(userId)}:blog-draft:v2` : null;
}

export function loadBlogDraft(userId: string): BlogDraft | null {
  const key = draftKey(userId);
  if (!key) return null;
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    const draft: unknown = JSON.parse(data);
    if (!draft || typeof draft !== 'object') return null;
    const fields: (keyof BlogDraft)[] = ['title', 'themeId', 'date', 'summary', 'content', 'tagsInput', 'savedAt'];
    if (!fields.every(field => typeof (draft as BlogDraft)[field] === 'string')) return null;
    return draft as BlogDraft;
  } catch {
    return null;
  }
}

export function saveBlogDraft(draft: BlogDraft, userId: string): void {
  const key = draftKey(userId);
  if (!key) return;
  // Let the editor distinguish a real saved draft from unavailable device storage.
  localStorage.setItem(key, JSON.stringify(draft));
}

export function clearBlogDraft(userId: string): void {
  const key = draftKey(userId);
  if (!key) return;
  localStorage.removeItem(key);
}
