import React, { useState } from 'react';
import { BigTheme, BlogEntry } from '../types';
import { formatDateSpanish } from '../utils/dates';
import { getQuarterForDate, QUARTER_DEFINITIONS, QuarterDefinition } from '../utils/quarters';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Target,
  Calendar,
  Sparkles,
  Edit2,
  Clock,
  Layers,
  Search,
  PenLine,
  FileText,
} from 'lucide-react';

interface WrapperStudioPageProps {
  wrapper: BigTheme;
  allWrappers: BigTheme[];
  blogEntries: BlogEntry[];
  onSelectWrapper: (id: string) => void;
  onWriteForWrapper: (wrapperId: string) => void;
  onOpenReader: (entry: BlogEntry) => void;
  onEditWrapper: (wrapper: BigTheme) => void;
  onBackToAllWrappers: () => void;
}

export const WrapperStudioPage: React.FC<WrapperStudioPageProps> = ({
  wrapper,
  allWrappers,
  blogEntries,
  onSelectWrapper,
  onWriteForWrapper,
  onOpenReader,
  onEditWrapper,
  onBackToAllWrappers,
}) => {
  const [journalSearch, setJournalSearch] = useState('');

  // Filter blog entries for this specific wrapper
  const wrapperBlogs = blogEntries.filter(b => b.themeId === wrapper.id);
  const filteredBlogs = wrapperBlogs.filter(b => {
    if (!journalSearch.trim()) return true;
    const q = journalSearch.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.content.toLowerCase().includes(q) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  // Group blog entries by the 4 Quarters (Q1, Q2, Q3, Q4)
  const blogsByQuarter: Record<string, BlogEntry[]> = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: [],
  };

  wrapperBlogs.forEach(b => {
    const qInfo = getQuarterForDate(b.date);
    if (qInfo?.quarterId && blogsByQuarter[qInfo.quarterId]) {
      blogsByQuarter[qInfo.quarterId].push(b);
    } else {
      blogsByQuarter.Q1.push(b);
    }
  });

  const getThemeClass = (color: string) => {
    switch (color) {
      case 'pink': return 'feature-card-pink';
      case 'teal': return 'feature-card-teal';
      case 'lavender': return 'feature-card-lavender';
      case 'peach': return 'feature-card-peach';
      case 'ochre': return 'feature-card-ochre';
      case 'mint': return 'feature-card-mint';
      case 'coral': return 'feature-card-coral';
      default: return 'feature-card-cream';
    }
  };

  const heroCardClass = getThemeClass(wrapper.color);

  return (
    <div className="wrapper-studio-container">
      {/* Ambient Backlight Halo glowing with wrapper color */}
      <div className="wrapper-studio-ambient-aura" aria-hidden="true" />

      {/* Top Bar: Back Action & Fast Switcher Strip */}
      <div className="studio-nav-header">
        <button
          type="button"
          className="studio-back-btn clay-button-interactive"
          onClick={onBackToAllWrappers}
        >
          <ArrowLeft size={16} />
          <span>Todos los Wrappers</span>
        </button>

        {/* Quick Horizontal Lens Switcher */}
        <div className="studio-switcher-strip" role="tablist" aria-label="Cambiar de Wrapper">
          <span className="caption-uppercase" style={{ color: 'var(--color-muted)', marginRight: 4 }}>
            Pilares:
          </span>
          {allWrappers.map(w => {
            const isActive = w.id === wrapper.id;
            return (
              <button
                key={w.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`studio-pill-switch ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWrapper(w.id)}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: `var(--color-brand-${w.color})`,
                    display: 'inline-block',
                  }}
                />
                <span>{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Grand Studio Cocoon (Tactile Enveloping Hero) */}
      <div className={`studio-hero-card ${heroCardClass}`}>
        <div className="studio-hero-top">
          <div className="studio-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="theme-badge-priority">
                Prioridad {wrapper.priority.toUpperCase()}
              </span>
              <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.3)', border: 'none' }}>
                ✦ Dimensión Activa 2027
              </span>
            </div>

            <h1 className="studio-wrapper-title">{wrapper.name}</h1>
            <p className="studio-wrapper-desc">{wrapper.description}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="theme-btn-action clay-button-interactive"
              onClick={() => onEditWrapper(wrapper)}
              title="Configurar metas y detalles del Wrapper"
            >
              <Edit2 size={14} />
              <span>Configurar</span>
            </button>
            <button
              type="button"
              className="btn-primary clay-button-interactive"
              onClick={() => onWriteForWrapper(wrapper.id)}
              style={{ height: 38, padding: '0 16px', fontSize: 13 }}
            >
              <Plus size={15} />
              <span>Escribir en este Wrapper</span>
            </button>
          </div>
        </div>

        {/* Strategic Goals Checklist towards 2027 */}
        {wrapper.targetGoals2027 && wrapper.targetGoals2027.length > 0 && (
          <div className="studio-goals-container">
            <div className="studio-goals-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={15} color="var(--color-ink)" />
                <span className="caption-uppercase" style={{ color: 'var(--color-ink)', fontWeight: 800 }}>
                  Metas Estratégicas 2027 para este Pilar:
                </span>
              </div>
              <span className="badge-pill" style={{ fontSize: 11, background: 'var(--color-canvas)' }}>
                {wrapper.targetGoals2027.length} objetivos innegociables
              </span>
            </div>

            <ul className="studio-goals-list">
              {wrapper.targetGoals2027.map((goal, gIdx) => (
                <li key={gIdx} className="studio-goal-item">
                  <span style={{ color: `var(--color-brand-${wrapper.color})`, fontSize: 16 }}>✦</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Studio Metrics HUD Strip */}
      <div className="studio-stats-hud">
        <div className="studio-stat-card">
          <span className="studio-stat-num">{wrapperBlogs.length}</span>
          <span className="studio-stat-label">Reflexiones en Bitácora</span>
        </div>

        <div className="studio-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="studio-stat-num">
              {wrapper.targetGoals2027?.length || 0}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand-coral)' }}>
              Pilares 2027
            </span>
          </div>
          <span className="studio-stat-label">Metas Innegociables</span>
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-surface-strong)',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: wrapper.targetGoals2027?.length ? '100%' : '0%',
                height: '100%',
                backgroundColor: `var(--color-brand-${wrapper.color})`,
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        <div className="studio-stat-card">
          <span className="studio-stat-num">
            {wrapperBlogs.length > 0
              ? formatDateSpanish(wrapperBlogs[0].date).split(',')[0]
              : 'Sin reflexiones'}
          </span>
          <span className="studio-stat-label">Última Entrada</span>
        </div>

        <div className="studio-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={18} color="var(--color-brand-ochre)" />
            <span className="studio-stat-num" style={{ fontSize: 20 }}>
              Prioridad {wrapper.priority.toUpperCase()}
            </span>
          </div>
          <span className="studio-stat-label">Estatus Estratégico</span>
        </div>
      </div>

      {/* 3. The 4 Quarters Horizon for this Wrapper */}
      <section className="studio-quarters-section">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <div className="badge-pill" style={{ marginBottom: 6 }}>
              <Calendar size={13} color="var(--color-brand-teal)" />
              <span>Línea de Tiempo Anual</span>
            </div>
            <h2 className="title-lg" style={{ fontFamily: 'var(--font-display)' }}>
              Despliegue Estratégico en los 4 Quarters (Q1 - Q4)
            </h2>
            <p className="section-desc">
              Distribución táctica y bitácoras de <strong>{wrapper.name}</strong> a lo largo del ciclo 365.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary btn-sm clay-button-interactive"
            onClick={() => onWriteForWrapper(wrapper.id)}
          >
            <PenLine size={14} />
            <span>Escribir Reflexión</span>
          </button>
        </div>

        <div className="studio-quarters-grid">
          {QUARTER_DEFINITIONS.map((qDef: QuarterDefinition) => {
            const qBlogs = blogsByQuarter[qDef.id] || [];

            return (
              <div key={qDef.id} className="studio-quarter-column">
                <div className="studio-quarter-header">
                  <div>
                    <span className="studio-quarter-badge">{qDef.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginTop: 4 }}>
                      {qDef.subtitle}
                    </span>
                  </div>
                  <span className="badge-pill" style={{ fontSize: 11, background: 'var(--color-canvas)' }}>
                    {qBlogs.length} {qBlogs.length === 1 ? 'entrada' : 'entradas'}
                  </span>
                </div>

                <div className="studio-quarter-entries-list">
                  {qBlogs.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
                      <p style={{ marginBottom: 8 }}>Sin reflexiones en {qDef.name}</p>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => onWriteForWrapper(wrapper.id)}
                        style={{ fontSize: 11, height: 26, padding: '2px 8px' }}
                      >
                        <Plus size={11} /> Documentar
                      </button>
                    </div>
                  ) : (
                    qBlogs.map(b => (
                      <div
                        key={b.id}
                        className="studio-entry-row"
                        onClick={() => onOpenReader(b)}
                        title="Haz clic para leer reflexión"
                        style={{ cursor: 'pointer' }}
                      >
                        <FileText size={16} color={`var(--color-brand-${wrapper.color})`} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.title}
                          </span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                            {formatDateSpanish(b.date)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Embedded Journal Stream for this Wrapper */}
      <section className="studio-journal-section">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <div className="badge-pill" style={{ marginBottom: 6 }}>
              <BookOpen size={13} color="var(--color-brand-peach)" />
              <span>Cuaderno de Bitácora</span>
            </div>
            <h2 className="title-lg" style={{ fontFamily: 'var(--font-display)' }}>
              Bitácora de {wrapper.name}
            </h2>
            <p className="section-desc">
              Reflexiones, experimentos y decisiones exclusivas documentadas bajo este Wrapper.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary clay-button-interactive"
            onClick={() => onWriteForWrapper(wrapper.id)}
          >
            <Plus size={15} />
            <span>Escribir Reflexión</span>
          </button>
        </div>

        {/* Search inside this wrapper's journal */}
        {wrapperBlogs.length > 0 && (
          <div className="blog-search-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-muted)',
                }}
              />
              <input
                type="text"
                className="input-text blog-search-input"
                style={{ paddingLeft: 40 }}
                placeholder={`Buscar reflexiones en ${wrapper.name}...`}
                value={journalSearch}
                onChange={e => setJournalSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Journal Entries Grid */}
        {filteredBlogs.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 2px 0 var(--color-surface-strong)',
            }}
          >
            <h3 className="title-md" style={{ marginBottom: 8 }}>
              {journalSearch
                ? 'No se encontraron reflexiones con este término'
                : `Aún no has escrito reflexiones en ${wrapper.name}`}
            </h3>
            <p className="body-sm" style={{ color: 'var(--color-muted)', maxWidth: 500, margin: '0 auto 20px' }}>
              Documenta los descubrimientos y modelos mentales que fundamentan este pilar hacia 2027.
            </p>
            <button
              type="button"
              className="btn-primary clay-button-interactive"
              onClick={() => onWriteForWrapper(wrapper.id)}
            >
              <Plus size={15} /> Escribir Primera Entrada
            </button>
          </div>
        ) : (
          <div className="blog-entries-grid">
            {filteredBlogs.map(entry => (
              <article
                key={entry.id}
                className="blog-card"
                onClick={() => onOpenReader(entry)}
                title="Leer esta entrada"
              >
                <div>
                  <div className="blog-card-top">
                    <span
                      className="blog-wrapper-badge"
                      style={{
                        backgroundColor: `var(--color-brand-${wrapper.color})`,
                        color:
                          wrapper.color === 'teal' || wrapper.color === 'pink' || wrapper.color === 'coral'
                            ? '#fff'
                            : 'var(--color-ink)',
                      }}
                    >
                      {wrapper.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {formatDateSpanish(entry.date)}
                    </span>
                  </div>

                  <h3 className="blog-card-title">{entry.title}</h3>
                  <p className="blog-card-summary">{entry.summary || entry.content.slice(0, 140)}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-hairline)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted)' }}>
                    <Clock size={12} />
                    <span>{entry.readTimeMinutes || 3} min de lectura</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-coral)' }}>
                    Leer entrada →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
