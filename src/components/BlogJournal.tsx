import React, { useState } from 'react';
import { Plus, Search, ArrowUpRight, Edit2, X } from 'lucide-react';
import type { BlogEntry, BigTheme } from '../types';
import { formatDateSpanish } from '../utils/dates';
import { PendingDrafts } from './PendingDrafts';

interface BlogJournalProps {
  userId: string;
  entries: BlogEntry[];
  themes: BigTheme[];
  selectedThemeFilter: string | null;
  onSelectThemeFilter: (themeId: string | null) => void;
  onOpenCreateEntry: () => void;
  onEditEntry: (entry: BlogEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenReader: (entry: BlogEntry) => void;
  onOpenWrapperStudio?: (themeId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export const BlogJournal: React.FC<BlogJournalProps> = ({ userId, entries, themes, selectedThemeFilter, onSelectThemeFilter, onOpenCreateEntry, onEditEntry, onOpenReader, onOpenWrapperStudio, searchQuery, onSearchQueryChange }) => {
  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const changeQuery = onSearchQueryChange ?? setLocalQuery;
  const normalized = query.trim().toLocaleLowerCase('es');
  const filtered = entries.filter(entry => (!selectedThemeFilter || entry.themeId === selectedThemeFilter) &&
    (!normalized || [entry.title, entry.content, entry.summary, ...entry.tags].some(text => text.toLocaleLowerCase('es').includes(normalized))))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const hasFilters = Boolean(normalized || selectedThemeFilter);
  const selectedTheme = themes.find(t => t.id === selectedThemeFilter);
  const reset = () => { changeQuery(''); onSelectThemeFilter(null); };
  return <section className="blog-page-container journey-journal" aria-labelledby="journal-title">
    <header className="journey-page-heading"><div><p className="dashboard-eyebrow">Tu espacio para recordar</p><h1 id="journal-title">Bitácora</h1><p>Vuelve a tus ideas. Continúa tu historia.</p></div><button type="button" className="btn-primary" onClick={onOpenCreateEntry}><Plus size={18} aria-hidden />Escribir entrada</button></header>
    <PendingDrafts userId={userId} entries={entries} onResume={id => { const entry = entries.find(e => e.id === id); if (entry) onEditEntry(entry); else onOpenCreateEntry(); }} />
    {(entries.length > 0 || hasFilters) && <div className="journal-search-tools">
      <div className="journal-search"><label htmlFor="journal-search">Buscar en tu bitácora</label><div><Search size={18} aria-hidden /><input id="journal-search" type="search" value={query} onChange={e => changeQuery(e.target.value)} placeholder="Título, texto o etiquetas" autoComplete="off" />{query && <button type="button" aria-label="Borrar búsqueda" onClick={() => changeQuery('')}><X size={18} aria-hidden /></button>}</div></div>
      <div className="journal-wrapper-filter"><label htmlFor="journal-wrapper">Wrapper</label><select id="journal-wrapper" value={selectedThemeFilter || ''} onChange={e => onSelectThemeFilter(e.target.value || null)}><option value="">Todos los wrappers</option>{themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
    </div>}
    {entries.length > 0 && <div className="journal-results-heading"><p role="status">{filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'}{hasFilters ? filtered.length === 1 ? ' encontrada' : ' encontradas' : ' · más recientes primero'}</p>{hasFilters && <button type="button" className="dashboard-text-action" onClick={reset}>Limpiar filtros</button>}{selectedTheme && onOpenWrapperStudio && <button type="button" className="dashboard-text-action" onClick={() => onOpenWrapperStudio(selectedTheme.id)}>Abrir wrapper<ArrowUpRight size={16} aria-hidden /></button>}</div>}
    {!filtered.length ? <div className="journal-empty"><h2>{hasFilters ? 'No hay entradas con estos filtros.' : 'Lo que escribas hoy puede acompañarte mañana.'}</h2><p>{hasFilters ? 'Prueba con otra palabra o busca en todos tus wrappers.' : themes.length ? 'Empieza con una idea. No tiene que estar terminada.' : 'Primero dale un nombre al espacio donde guardarás tus entradas: tu primer wrapper.'}</p><button type="button" className={hasFilters ? 'btn-secondary' : 'btn-primary'} onClick={hasFilters ? reset : onOpenCreateEntry}>{hasFilters ? 'Ver todas las entradas' : themes.length ? 'Escribir mi primera entrada' : 'Crear wrapper y escribir'}</button></div>
      : <div className="journal-entry-list">{filtered.map(entry => {
        const theme = themes.find(t => t.id === entry.themeId);
        return <article key={entry.id} className="journal-entry-row">
          <div className="journal-entry-body">
            <span className="journal-entry-meta"><time dateTime={entry.date}>{formatDateSpanish(entry.date)}</time>{theme && <span className={`journal-wrapper-name dashboard-color-${theme.color}`}>{theme.name}</span>}</span>
            <h2><button id={`journal-entry-${entry.id}`} type="button" className="journal-entry-open" onClick={() => onOpenReader(entry)} aria-label={`Leer: ${entry.title}`}>{entry.title}</button></h2><p>{entry.summary || entry.content.replace(/[#*_>`[\]]/g, '').slice(0, 180)}</p>
            {!!entry.tags.length && <span className="journal-entry-tags">{entry.tags.map(t => `#${t}`).join(' · ')}</span>}
          </div>
          <button type="button" className="icon-button journal-edit" onClick={() => onEditEntry(entry)} aria-label={`Editar: ${entry.title}`}><Edit2 size={17} aria-hidden /></button>
        </article>;
      })}</div>}
  </section>;
};
