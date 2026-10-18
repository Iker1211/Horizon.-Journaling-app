import { useCallback, useEffect, useRef, useState } from 'react';
import type { BigTheme, BlogDraft, BlogEntry } from '../types';
import { getTodayDateString } from '../utils/dates';
import { clearBlogDraft, saveBlogDraft } from '../utils/storage';
import { draftDiffersFromEntry, ENTRY_LEAVE_EVENT, recoverableDraft } from '../utils/entryDraft';

export type DraftFields = Pick<BlogDraft, 'title' | 'themeId' | 'date' | 'summary' | 'content' | 'tagsInput'>;

export function useEntryDraft(userId: string, themes: BigTheme[], entry?: BlogEntry | null, initialThemeId?: string | null) {
  const [initial] = useState(() => {
    const recovered = recoverableDraft(userId, entry);
    const fallbackTheme = themes.find(t => t.id === initialThemeId)?.id || themes[0]?.id || '';
    const values: DraftFields = recovered || (entry ? {
      title: entry.title, themeId: entry.themeId, date: entry.date,
      summary: entry.summary, content: entry.content, tagsInput: entry.tags.join(', '),
    } : { title: '', themeId: fallbackTheme, date: getTodayDateString(), summary: '', content: '', tagsInput: '' });
    return {
      values: { ...values, themeId: themes.some(t => t.id === values.themeId) ? values.themeId : fallbackTheme },
      recovered: Boolean(recovered),
      id: entry?.id || recovered?.entryId || `blog-${crypto.randomUUID()}`,
      createdAt: entry?.createdAt || recovered?.createdAt || new Date().toISOString(),
    };
  });
  const [values, setValues] = useState<DraftFields>(initial.values);
  const [status, setStatus] = useState<'clean' | 'pending' | 'local' | 'error'>(initial.recovered ? 'local' : 'clean');
  const [restored, setRestored] = useState(initial.recovered);
  const valuesRef = useRef(values);
  const identity = useRef({ id: initial.id, createdAt: initial.createdAt });
  const committed = useRef(false);
  const saving = useRef(false);

  const flush = useCallback((notify = true): boolean => {
    if (committed.current) return true;
    const draft: BlogDraft = { ...valuesRef.current, entryId: identity.current.id, createdAt: identity.current.createdAt, savedAt: new Date().toISOString() };
    const dirty = draftDiffersFromEntry(draft, entry);
    try {
      if (dirty) saveBlogDraft(draft, userId, entry?.id);
      else { try { clearBlogDraft(userId, entry?.id); } catch { /* An unchanged or empty editor has no writing to lose. */ } }
      if (notify) setStatus(dirty ? 'local' : 'clean');
      return true;
    } catch {
      if (notify) setStatus('error');
      return false;
    }
  }, [entry, userId]);

  const update = <K extends keyof DraftFields>(field: K, value: DraftFields[K]) => {
    if (saving.current) return;
    valuesRef.current = { ...valuesRef.current, [field]: value };
    setValues(valuesRef.current);
    setStatus('pending');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => flush(), 500);
    return () => window.clearTimeout(timer);
  }, [values, flush]);

  useEffect(() => {
    const leave = (event: Event) => {
      if (saving.current) { event.preventDefault(); return; }
      if (!flush() && !window.confirm('No pudimos guardar el borrador en este dispositivo. Si sales, puedes perder los cambios. ¿Salir de todos modos?')) event.preventDefault();
    };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(false); };
    const pagehide = () => { flush(false); };
    const unload = (event: BeforeUnloadEvent) => {
      if (saving.current || !flush(false)) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener(ENTRY_LEAVE_EVENT, leave);
    window.addEventListener('pagehide', pagehide);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      flush(false);
      window.removeEventListener(ENTRY_LEAVE_EVENT, leave);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [flush]);

  const markCommitted = () => {
    committed.current = true;
    try { clearBlogDraft(userId, entry?.id); } catch { /* Account copy is confirmed; stale recovery is filtered. */ }
  };
  const isSaving = () => saving.current;
  const beginSave = () => { saving.current = true; };
  const finishSave = () => { saving.current = false; };
  const getIdentity = () => identity.current;

  const discard = () => {
    clearBlogDraft(userId, entry?.id);
    if (!entry) identity.current = { id: `blog-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
    valuesRef.current = entry ? { title: entry.title, themeId: entry.themeId, date: entry.date, summary: entry.summary, content: entry.content, tagsInput: entry.tags.join(', ') } : { title: '', themeId: initial.values.themeId, date: getTodayDateString(), summary: '', content: '', tagsInput: '' };
    setValues(valuesRef.current);
    setRestored(false);
    setStatus('clean');
  };
  return { values, update, status, restored, flush, discard, markCommitted, isSaving, beginSave, finishSave, getIdentity };
}
