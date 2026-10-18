import type { BlogDraft, BlogEntry } from '../types';
import { loadBlogDraft } from './storage';

export const ENTRY_LEAVE_EVENT = 'horizon:entry-before-leave';

/** Shared by app links, browser history and Android back. */
export function canLeaveEntry(): boolean {
  return window.dispatchEvent(new Event(ENTRY_LEAVE_EVENT, { cancelable: true }));
}

export function draftDiffersFromEntry(draft: BlogDraft, entry?: BlogEntry | null): boolean {
  if (!entry) return Boolean(draft.title.trim() || draft.content.trim() || draft.summary.trim() || draft.tagsInput.trim());
  return draft.title !== entry.title || draft.themeId !== entry.themeId || draft.date !== entry.date ||
    draft.summary !== entry.summary || draft.content !== entry.content || draft.tagsInput !== entry.tags.join(', ');
}

export function recoverableDraft(userId: string, entry?: BlogEntry | null): BlogDraft | null {
  const draft = loadBlogDraft(userId, entry?.id);
  if (!draft || !draftDiffersFromEntry(draft, entry)) return null;
  if (entry && Date.parse(draft.savedAt) <= Date.parse(entry.updatedAt)) return null;
  return draft;
}

export function pendingEntryDrafts(userId: string, entries: BlogEntry[]) {
  const pending: { entryId: string | null; draft: BlogDraft }[] = [];
  const fresh = recoverableDraft(userId);
  if (fresh) pending.push({ entryId: null, draft: fresh });
  for (const entry of entries) {
    const draft = recoverableDraft(userId, entry);
    if (draft) pending.push({ entryId: entry.id, draft });
  }
  return pending.sort((a, b) => b.draft.savedAt.localeCompare(a.draft.savedAt));
}
