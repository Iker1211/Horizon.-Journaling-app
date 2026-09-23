import React, { useState, useEffect } from 'react';
import { BlogEntry, BigTheme, BlogDraft } from '../types';
import { formatDateSpanish } from '../utils/dates';
import { loadBlogDraft, clearBlogDraft } from '../utils/storage';
import { Plus, Search, Edit2, Trash2, Sparkles, Clock } from 'lucide-react';

interface BlogJournalProps {
  entries: BlogEntry[];
  themes: BigTheme[];
  selectedThemeFilter: string | null;
  onSelectThemeFilter: (themeId: string | null) => void;
  onOpenCreateEntry: () => void;
  onEditEntry: (entry: BlogEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenReader: (entry: BlogEntry) => void;
  onOpenWrapperStudio?: (themeId: string) => void;
}

export const BlogJournal: React.FC<BlogJournalProps> = ({
  entries,
  themes,
  selectedThemeFilter,
  onSelectThemeFilter,
  onOpenCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onOpenReader,
  onOpenWrapperStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDraft, setPendingDraft] = useState<BlogDraft | null>(null);

  // Check for saved draft when mounting or window gains focus
  useEffect(() => {
    const checkDraft = () => {
      const draft = loadBlogDraft();
      if (draft && (draft.title?.trim() || draft.content?.trim() || draft.summary?.trim())) {
        setPendingDraft(draft);
      } else {
        setPendingDraft(null);
      }
    };

    checkDraft();
    window.addEventListener('focus', checkDraft);
    return () => window.removeEventListener('focus', checkDraft);
  }, []);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (selectedThemeFilter && entry.themeId !== selectedThemeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = entry.title.toLowerCase().includes(q);
      const inContent = entry.content.toLowerCase().includes(q);
      const inTags = entry.tags && entry.tags.some(t => t.toLowerCase().includes(q));
      if (!inTitle && !inContent && !inTags) return false;
    }
    return true;
  });

  const getThemeById = (id: string) => themes.find(t => t.id === id);

  return (
    <div className="blog-page-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <span style={{ color: 'var(--color-brand-peach)', fontWeight: 800 }}>✎</span>
            <span>Bitácora Oficial de Ruta</span>
          </div>
          <h1 className="display-sm" style={{ color: 'var(--color-ink)' }}>
            Bitácora Rumbo a 2027
          </h1>
          <p className="section-desc" style={{ maxWidth: 680 }}>
            Cada reflexión está contenida en un <strong>Wrapper</strong>. Documenta los descubrimientos,
            puntos de inflexión y modelos mentales que te preparan para el año maestro.
          </p>
        </div>

        <button className="btn-primary clay-button-interactive" onClick={onOpenCreateEntry}>
          <Plus size={16} /> Escribir en Bitácora
        </button>
      </div>

      {/* Unsaved Draft Banner */}
      {pendingDraft && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-soft)',
            border: '1.5px dashed var(--color-brand-peach)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-brand-peach)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ink)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>
                Tienes un borrador pendiente: "{pendingDraft.title || 'Reflexión sin título'}"
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                Guardado automáticamente {pendingDraft.savedAt ? `a las ${new Date(pendingDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}. Seguro ante cualquier cambio de pestaña.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-primary btn-sm clay-button-interactive" onClick={onOpenCreateEntry}>
              Continuar escribiendo
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                if (window.confirm('¿Deseas descartar este borrador pendiente?')) {
                  clearBlogDraft();
                  setPendingDraft(null);
                }
              }}
              style={{ color: 'var(--color-error)' }}
            >
              <Trash2 size={13} />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs by Wrapper */}
      <div className="blog-filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="blog-theme-tabs" role="tablist" aria-label="Filtrar por Wrapper">
            <span className="caption-uppercase" style={{ color: 'var(--color-muted)', marginRight: 4, flexShrink: 0 }}>
              Filtrar:
            </span>
            <button
              className={`blog-theme-tab-btn ${selectedThemeFilter === null ? 'active' : ''}`}
              onClick={() => onSelectThemeFilter(null)}
            >
              <span>Todos</span>
              <span className="blog-theme-tab-badge">{entries.length}</span>
            </button>

            {themes.map(t => {
              const count = entries.filter(e => e.themeId === t.id).length;
              const isSelected = selectedThemeFilter === t.id;

              return (
                <button
                  key={t.id}
                  className={`blog-theme-tab-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: isSelected ? `var(--color-brand-${t.color})` : undefined,
                    backgroundColor: isSelected ? `var(--color-brand-${t.color})` : undefined,
                    color: isSelected && (t.color === 'teal' || t.color === 'pink' || t.color === 'coral') ? '#fff' : undefined,
                  }}
                  onClick={() => onSelectThemeFilter(isSelected ? null : t.id)}
                >
                  <span>{t.name}</span>
                  <span className="blog-theme-tab-badge">{count}</span>
                </button>
              );
            })}
          </div>

          {selectedThemeFilter && onOpenWrapperStudio && (
            <button
              type="button"
              className="btn-secondary btn-sm clay-button-interactive"
              onClick={() => onOpenWrapperStudio(selectedThemeFilter)}
              style={{ fontSize: 12, gap: 6 }}
            >
              <Sparkles size={13} color="var(--color-brand-ochre)" />
              <span>Entrar al Studio de este Wrapper →</span>
            </button>
          )}
        </div>

        {/* Search row */}
        <div className="blog-search-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={17}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}
            />
            <input
              type="text"
              className="input-text"
              style={{ paddingLeft: 40 }}
              placeholder="Buscar por título, contenido o etiquetas (#IA, #Hábitos, #Finanzas)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface-soft)',
          borderRadius: 'var(--radius-xl)',
          padding: 60,
          textAlign: 'center',
          border: '1px solid var(--color-hairline)',
          boxShadow: '0 2px 0 var(--color-surface-strong)',
        }}>
          <h3 className="title-md">No se encontraron entradas en la bitácora</h3>
          <p className="body-sm" style={{ marginTop: 8, marginBottom: 20 }}>
            {selectedThemeFilter
              ? 'No hay reflexiones registradas bajo este Wrapper todavía.'
              : 'Empieza a redactar tu primera entrada reflexiva rumbo a 2027.'}
          </p>
          <button className="btn-primary" onClick={onOpenCreateEntry}>
            <Plus size={15} /> Redactar Primera Entrada
          </button>
        </div>
      ) : (
        <div className="blog-entries-grid">
          {filteredEntries.map(entry => {
            const theme = getThemeById(entry.themeId);

            return (
              <article
                key={entry.id}
                className="blog-card"
                onClick={() => onOpenReader(entry)}
              >
                <div>
                  <div className="blog-card-top">
                    {theme && (
                      <span
                        className="blog-wrapper-badge"
                        style={{
                          backgroundColor: `var(--color-brand-${theme.color})`,
                          color: theme.color === 'teal' || theme.color === 'pink' || theme.color === 'coral' ? '#fff' : '#0a0a0a',
                        }}
                      >
                        {theme.name}
                      </span>
                    )}
                  </div>

                  <h3 className="blog-card-title">{entry.title}</h3>
                  <p className="blog-card-summary">{entry.summary || entry.content}</p>
                </div>

                <div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="blog-card-tags" style={{ marginBottom: 12 }}>
                      {entry.tags.map((t, idx) => (
                        <span key={idx} className="blog-tag-chip">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="blog-card-footer">
                    <span>{formatDateSpanish(entry.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {entry.readTimeMinutes || 3} min
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onEditEntry(entry);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                        title="Editar entrada"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar la entrada "${entry.title}"?`)) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                        title="Eliminar entrada"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
