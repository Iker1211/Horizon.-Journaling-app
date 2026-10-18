import type { BlogDraft } from '../types';

/** Legacy clay_2027_* keys have no owner and must never be read or migrated into an account. */
function draftKey(userId: string, entryId?: string | null): string | null {
  if (!userId) return null;
  const base = `horizon:${encodeURIComponent(userId)}:blog-draft:v2`;
  return entryId ? `${base}:entry:${encodeURIComponent(entryId)}` : base;
}

export function loadBlogDraft(userId: string, entryId?: string | null): BlogDraft | null {
  const key = draftKey(userId, entryId);
  if (!key) return null;
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    const draft: unknown = JSON.parse(data);
    if (!draft || typeof draft !== 'object') return null;
    const fields: (keyof BlogDraft)[] = ['title', 'themeId', 'date', 'summary', 'content', 'tagsInput', 'savedAt'];
    if (!fields.every(field => typeof (draft as BlogDraft)[field] === 'string')) return null;
    if (!Number.isFinite(Date.parse((draft as BlogDraft).savedAt))) return null;
    if ((draft as BlogDraft).entryId !== undefined && typeof (draft as BlogDraft).entryId !== 'string') return null;
    if ((draft as BlogDraft).createdAt !== undefined && typeof (draft as BlogDraft).createdAt !== 'string') return null;
    return draft as BlogDraft;
  } catch {
    return null;
  }
}

export function saveBlogDraft(draft: BlogDraft, userId: string, entryId?: string | null): void {
  const key = draftKey(userId, entryId);
  if (!key) return;
  // Let the editor distinguish a real saved draft from unavailable device storage.
  localStorage.setItem(key, JSON.stringify(draft));
}

export function clearBlogDraft(userId: string, entryId?: string | null): void {
  const key = draftKey(userId, entryId);
  if (!key) return;
  localStorage.removeItem(key);
}
