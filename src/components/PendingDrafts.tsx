import { useEffect, useState } from 'react';
import { FilePenLine, ArrowRight } from 'lucide-react';
import type { BlogEntry } from '../types';
import { pendingEntryDrafts } from '../utils/entryDraft';

type PendingDraftList = ReturnType<typeof pendingEntryDrafts>;

export function PendingDrafts({ userId, entries, onResume, drafts: providedDrafts, excludeFirst = false, compact = false }: { userId: string; entries: BlogEntry[]; onResume: (entryId: string | null) => void; drafts?: PendingDraftList; excludeFirst?: boolean; compact?: boolean }) {
  const [storedDrafts, setDrafts] = useState(() => providedDrafts ?? pendingEntryDrafts(userId, entries));
  useEffect(() => {
    if (providedDrafts !== undefined) return;
    const refresh = () => setDrafts(pendingEntryDrafts(userId, entries));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, [userId, entries, providedDrafts]);
  const drafts = excludeFirst ? (providedDrafts ?? storedDrafts).slice(1) : providedDrafts ?? storedDrafts;
  if (!drafts.length) return null;
  return <section className={`pending-drafts${compact ? ' presence-other-drafts' : ''}`} aria-labelledby="pending-drafts-title">
    <div className="pending-drafts-heading"><FilePenLine size={18} aria-hidden /><div><h2 id="pending-drafts-title">{excludeFirst ? 'Otros borradores' : 'Retoma donde lo dejaste'}</h2><p>Borradores en este dispositivo · pendientes de guardar en tu cuenta</p></div></div>
    {drafts.map(({ entryId, draft }) => <button type="button" key={entryId || 'new'} className="pending-draft-row" onClick={() => onResume(entryId)}>
      <span><strong>{draft.title || 'Entrada sin título'}</strong><small>{entryId ? 'Continuar edición' : 'Continuar entrada'} · {new Date(draft.savedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</small></span><ArrowRight size={18} aria-hidden />
    </button>)}
  </section>;
}
