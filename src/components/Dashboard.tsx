import React from 'react';
import { BigTheme, BlogEntry, ActiveTab } from '../types';
import { CountdownTime, formatDateSpanish } from '../utils/dates';
import { calculate365Cycle } from '../utils/quarters';
import { FireGoatLogo } from './FireGoatLogo';
import { HumanLifespanHero } from './HumanLifespanHero';
import { ArrowRight, BookOpen, Target, Calendar, Plus, Layers, Sparkles } from 'lucide-react';

interface DashboardProps {
  themes: BigTheme[];
  blogEntries: BlogEntry[];
  countdown: CountdownTime;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBlogEntry: (entry: BlogEntry) => void;
  onSelectThemeFilter: (themeId: string) => void;
  onOpenWrapperStudio?: (themeId: string) => void;
  onWriteForTheme?: (themeId: string) => void;
  onOpenQuickEntry?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  themes,
  blogEntries,
  countdown,
  setActiveTab,
  onSelectBlogEntry,
  onSelectThemeFilter,
  onOpenWrapperStudio,
  onWriteForTheme,
  onOpenQuickEntry,
}) => {
  const cycle365 = calculate365Cycle();

  const getThemeColorClass = (color: string) => {
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

  return (
    <div className="dashboard-root">
      {/* 1. Panoramic Ambient Horizon Stage (Decoupled, Edge-to-Edge) */}
      <header className="panoramic-horizon-stage" role="banner" aria-label="Horizonte 2027">
        <div className="panoramic-horizon-ambient-glow" aria-hidden="true" />

        <div className="panoramic-horizon-inner">
          {/* Top Brand Totem */}
          <div className="hero-horizon-badge-wrapper">
            <div className="badge-pill hero-horizon-pill">
              <FireGoatLogo size={22} withGlow={true} />
              <span className="hero-horizon-pill-text">
                ✦ HORIZON 2027 · TODO EMPIEZA CONTIGO · YEAR OF THE FIRE GOAT
              </span>
            </div>
          </div>

          {/* Grand Display Headline */}
          <div className="hero-horizon-headline-group">
            <h1 className="hero-horizon-main-title">
              <span className="hero-horizon-motto">Todo empieza contigo.</span>
              <span className="hero-horizon-submotto">
                Conquista tu <span className="highlight-coral">2027</span> desde <span className="highlight-teal">hoy</span>.
              </span>
            </h1>

            <p className="hero-horizon-narrative">
              <em>Everything starts with you.</em> El horizonte hacia 2027 no se espera pasivamente en la lejanía: se conquista día a día, blindando tus <strong>Wrappers</strong> como pilares maestros y documentando cada reflexión en tu bitácora de vida.
            </p>
          </div>

          {/* Temporal Cockpit & Direct Action Row */}
          <div className="hero-horizon-cockpit">
            {/* Level 1: Live Countdown Cards (Stratigraphic Clay 3D) */}
            <div className="hero-countdown-block">
              <div className="hero-section-subtitle">
                <Sparkles size={14} color="var(--color-brand-ochre)" />
                <span>Nivel 1 · Cuenta Regresiva al 2027</span>
              </div>

              <div className="countdown-box-container hero-countdown-floating">
                <div className="countdown-unit-card tactile-clay-card clay-card-ochre" title="Estrato Solar: Días restantes">
                  <span className="countdown-unit-num">{countdown.days}</span>
                  <span className="countdown-unit-label">Días Restantes</span>
                </div>
                <div className="countdown-unit-card tactile-clay-card clay-card-peach" title="Estrato Aurora: Horas restantes">
                  <span className="countdown-unit-num">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="countdown-unit-label">Horas</span>
                </div>
                <div className="countdown-unit-card tactile-clay-card clay-card-lavender" title="Estrato Atmósfera: Minutos restantes">
                  <span className="countdown-unit-num">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="countdown-unit-label">Minutos</span>
                </div>
                <div className="countdown-unit-card tactile-clay-card clay-card-coral" title="Estrato Terracota: Segundos en vivo">
                  <span className="countdown-unit-num">
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="countdown-unit-label" style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-brand-coral)', display: 'inline-block' }} aria-hidden="true" />
                    Segundos
                  </span>
                </div>
              </div>
            </div>

            {/* Ergonomic Quick Actions Dock */}
            <div className="hero-action-dock">
              <button
                className="btn-primary clay-button-interactive hero-action-btn hero-primary-cta"
                onClick={() => (onOpenQuickEntry ? onOpenQuickEntry() : setActiveTab('editor'))}
                title="Escribir una nueva entrada en la bitácora"
              >
                <Plus size={16} />
                <span>Escribir en Bitácora</span>
              </button>

              <button
                className="btn-secondary clay-button-interactive hero-action-btn"
                onClick={() => setActiveTab('calendar')}
                title="Explorar el calendario de 365 días y quarters"
              >
                <Calendar size={15} color="var(--color-brand-teal)" />
                <span>Calendario 365</span>
              </button>

              <button
                className="btn-secondary clay-button-interactive hero-action-btn"
                onClick={() => setActiveTab('themes')}
                title="Gestionar tus Wrappers estratégicos"
              >
                <Layers size={15} color="var(--color-brand-ochre)" />
                <span>Wrappers ({themes.length})</span>
              </button>
            </div>
          </div>

          {/* 365-Day Cycle Bar (Tactile Clay Floating Bar) */}
          <div className="hero-cycle-banner tactile-clay-bar">
            <div className="hero-cycle-left">
              <div className="hero-cycle-day">
                <Calendar size={18} color="var(--color-brand-ochre)" />
                <span>Día {cycle365.currentDayNumber} de 365</span>
              </div>
              <span
                className="badge-pill hero-cycle-badge"
                style={{
                  backgroundColor: 'var(--color-brand-teal)',
                  color: 'var(--color-on-dark)',
                  boxShadow: '0 2px 0 rgba(10, 26, 26, 0.4)',
                }}
              >
                ● {cycle365.currentQuarter.name} en curso ({cycle365.currentQuarter.subtitle})
              </span>
              <span className="hero-cycle-progress">
                Quedan {cycle365.daysRemainingInYear} días · {cycle365.progressPercent}% transcurrido
              </span>
            </div>

            <button
              className="btn-secondary btn-sm clay-button-interactive"
              onClick={() => setActiveTab('calendar')}
              style={{ fontSize: 12, gap: 6 }}
            >
              <span>Ver Calendario & 4 Quarters</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Levels 2, 3 & 4 Stats Strip */}
          <div className="hero-stats-strip hero-stats-floating">
            <div
              className="hero-stat-card tactile-clay-stat"
              onClick={() => setActiveTab('themes')}
              title="Ir a Administrar Wrappers"
              style={{ cursor: 'pointer' }}
            >
              <span className="hero-stat-num">{themes.length}</span>
              <span className="hero-stat-label">Wrappers Activos</span>
            </div>
            <div
              className="hero-stat-card tactile-clay-stat"
              onClick={() => setActiveTab('blog')}
              title="Ir a Bitácora"
              style={{ cursor: 'pointer' }}
            >
              <span className="hero-stat-num">{blogEntries.length}</span>
              <span className="hero-stat-label">Entradas Bitácora</span>
            </div>
            <div
              className="hero-stat-card tactile-clay-stat"
              onClick={() => setActiveTab('calendar')}
              title="Ir a Calendario 365"
              style={{ cursor: 'pointer' }}
            >
              <span className="hero-stat-num">Día {cycle365.currentDayNumber}</span>
              <span className="hero-stat-label">Progreso Anual ({cycle365.progressPercent}%)</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Bounded Content Grid (Wrappers, Blog & Pilares, Existential HUD) */}
      <div className="main-content dashboard-grid" style={{ marginTop: 40 }}>
        {/* Wrappers Grid Showcase */}
        <section>
          <div className="section-header">
          <div>
            <span className="caption-uppercase" style={{ color: 'var(--color-brand-coral)' }}>
              Pilares de Vida
            </span>
            <h2 className="section-title">Wrappers</h2>
            <p className="section-desc">
              Cada reflexión y avance hacia el 2027 se ancla en uno de estos bloques estratégicos.
            </p>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => setActiveTab('themes')}>
            Administrar Wrappers ({themes.length}) <ArrowRight size={13} />
          </button>
        </div>

        {themes.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-surface-soft)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 2px 0 var(--color-surface-strong)',
            }}
          >
            <h3 className="title-md" style={{ color: 'var(--color-ink)', marginBottom: 8 }}>
              No tienes ningún Wrapper configurado
            </h3>
            <p className="body-sm" style={{ color: 'var(--color-muted)', maxWidth: 540, margin: '0 auto 20px' }}>
              Los Wrappers son los pilares estratégicos que sustentan cada reflexión y avance hacia el 2027.
              Crea tu primer wrapper para comenzar a estructurar tu progreso.
            </p>
            <button className="btn-primary clay-button-interactive" onClick={() => setActiveTab('themes')}>
              <Plus size={15} /> Crear Primer Wrapper
            </button>
          </div>
        ) : (
          <div className="themes-cards-grid">
            {themes.map(theme => {
            const linkedBlogs = blogEntries.filter(b => b.themeId === theme.id);
            const cardClass = getThemeColorClass(theme.color);

            return (
              <div
                key={theme.id}
                className={`theme-card-mini ${cardClass}`}
                onClick={() => {
                  if (onOpenWrapperStudio) {
                    onOpenWrapperStudio(theme.id);
                  } else {
                    onSelectThemeFilter(theme.id);
                    setActiveTab('blog');
                  }
                }}
                title={`Entrar al Studio del Wrapper "${theme.name}"`}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <div className="theme-card-header">
                    <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.25)', border: 'none' }}>
                      {theme.priority.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 20 }}>✦</span>
                  </div>
                  <h3 className="theme-card-title">{theme.name}</h3>
                  <p className="theme-card-desc">{theme.description}</p>
                </div>

                <div>
                  <div className="theme-card-footer">
                    <span className="theme-meta-pill">
                      {theme.targetGoals2027.length} metas
                    </span>
                    <span className="theme-meta-pill">
                      {linkedBlogs.length} bitácoras
                    </span>
                    <span className="theme-meta-pill" style={{ fontWeight: 800 }}>
                      Entrar →
                    </span>
                  </div>

                  {/* Contextual Quick In-Situ Creation */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn-on-color btn-sm clay-button-interactive"
                      style={{ flex: 1, padding: '4px 8px', fontSize: 11, height: 30 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onWriteForTheme) {
                          onWriteForTheme(theme.id);
                        } else {
                          setActiveTab('editor');
                        }
                      }}
                      title={`Escribir en bitácora para ${theme.name}`}
                    >
                      <Plus size={12} />
                      <span>Escribir Reflexión</span>
                    </button>
                    {onOpenWrapperStudio && (
                      <button
                        type="button"
                        className="btn-on-color btn-sm clay-button-interactive"
                        style={{ padding: '4px 10px', fontSize: 11, height: 30 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWrapperStudio(theme.id);
                        }}
                        title={`Entrar al Studio de ${theme.name}`}
                      >
                        <span>Studio →</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Two Columns: Recent Blog & Wrappers Strategic Pillars */}
      <section className="dashboard-columns">
        {/* Left: Recent Blog Reflections */}
        <div className="dashboard-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="caption-uppercase" style={{ color: 'var(--color-muted)' }}>
                Bitácora de Progreso
              </span>
              <h3 className="title-md" style={{ fontFamily: 'var(--font-display)', marginTop: 2 }}>
                Últimas Entradas
              </h3>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setActiveTab('blog')}>
              Ver Bitácora <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {blogEntries.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <p className="body-sm" style={{ color: 'var(--color-muted)', marginBottom: 14 }}>
                  Aún no has escrito ninguna reflexión en tu bitácora.
                </p>
                <button
                  className="btn-primary btn-sm clay-button-interactive"
                  onClick={onOpenQuickEntry || (() => setActiveTab('editor'))}
                  style={{ display: 'inline-flex', margin: '0 auto', gap: 6 }}
                >
                  <Plus size={13} /> Escribir Primera Reflexión
                </button>
              </div>
            ) : (
              blogEntries.slice(0, 4).map(entry => {
                const theme = themes.find(t => t.id === entry.themeId);
                return (
                  <div
                    key={entry.id}
                    className="blog-recent-item clay-button-interactive"
                    onClick={() => onSelectBlogEntry(entry)}
                    style={{
                      borderLeft: theme ? `4px solid var(--color-brand-${theme.color})` : '4px solid var(--color-ink)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="caption-uppercase" style={{ color: 'var(--color-muted)' }}>
                        {formatDateSpanish(entry.date)}
                      </span>
                      {theme && (
                        <span
                          className="badge-pill"
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            backgroundColor: `var(--color-brand-${theme.color})`,
                            color: theme.color === 'teal' || theme.color === 'pink' || theme.color === 'coral' ? 'var(--color-on-dark)' : 'var(--color-ink)',
                          }}
                        >
                          {theme.name}
                        </span>
                      )}
                    </div>
                    <h4 className="blog-recent-title">{entry.title}</h4>
                    <p className="blog-recent-snippet">{entry.summary || entry.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Metas Estratégicas 2027 por Wrapper */}
        <div className="dashboard-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="caption-uppercase" style={{ color: 'var(--color-brand-ochre)' }}>
                Dirección Estratégica
              </span>
              <h3 className="title-md" style={{ fontFamily: 'var(--font-display)', marginTop: 2 }}>
                Pilares & Metas 2027
              </h3>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setActiveTab('themes')}>
              Ver Wrappers <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {themes.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <p className="body-sm" style={{ color: 'var(--color-muted)', marginBottom: 14 }}>
                  No hay Wrappers configurados aún. Crea tus pilares estratégicos hacia 2027.
                </p>
                <button
                  className="btn-primary btn-sm clay-button-interactive"
                  onClick={() => setActiveTab('themes')}
                  style={{ display: 'inline-flex', margin: '0 auto', gap: 6 }}
                >
                  <Plus size={14} /> <span>Crear Primer Wrapper</span>
                </button>
              </div>
            ) : (
              themes.map(theme => {
                const linkedBlogs = blogEntries.filter(b => b.themeId === theme.id);

                return (
                  <div
                    key={theme.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-surface-soft)',
                      border: '1px solid var(--color-hairline)',
                      borderLeft: `4px solid var(--color-brand-${theme.color})`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>
                        {theme.name}
                      </span>
                      <span className="theme-badge-priority" style={{ fontSize: 10 }}>
                        {theme.priority.toUpperCase()}
                      </span>
                    </div>

                    {theme.targetGoals2027 && theme.targetGoals2027.length > 0 ? (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, margin: '4px 0' }}>
                        {theme.targetGoals2027.slice(0, 2).map((g, gIdx) => (
                          <li key={gIdx} style={{ fontSize: 12, color: 'var(--color-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: `var(--color-brand-${theme.color})`, fontSize: 12 }}>✦</span>
                            <span>{g}</span>
                          </li>
                        ))}
                        {theme.targetGoals2027.length > 2 && (
                          <span style={{ fontSize: 11, color: 'var(--color-muted)', paddingLeft: 14 }}>
                            +{theme.targetGoals2027.length - 2} metas más...
                          </span>
                        )}
                      </ul>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        {theme.description || 'Pilar estratégico hacia 2027.'}
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-hairline)', paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                        📖 {linkedBlogs.length} reflexiones
                      </span>
                      {onOpenWrapperStudio && (
                        <button
                          type="button"
                          className="theme-btn-action"
                          style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => onOpenWrapperStudio(theme.id)}
                        >
                          Entrar al Studio →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Nivel de Fondo: Marco Existencial de la Vida Humana (HUD Introspectivo) */}
      <section style={{ marginTop: 'var(--spacing-md)' }}>
        <HumanLifespanHero countdown={countdown} />
      </section>
      </div>
    </div>
  );
};
