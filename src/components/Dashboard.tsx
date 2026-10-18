import React from 'react';
import { BigTheme, BlogEntry, ActiveTab } from '../types';
import { CountdownTime, formatDateSpanish } from '../utils/dates';
import { calculate365Cycle, getAppStartDate } from '../utils/quarters';
import { HumanLifespanHero } from './HumanLifespanHero';
import { ArrowRight, BookOpen, CalendarDays, Layers, PenLine, Plus, Target } from 'lucide-react';

interface DashboardProps {
  userId: string;
  cycleStartDate?: string;
  themes: BigTheme[];
  blogEntries: BlogEntry[];
  countdown: CountdownTime;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBlogEntry: (entry: BlogEntry) => void;
  onSelectThemeFilter: (themeId: string) => void;
  onOpenWrapperStudio?: (themeId: string) => void;
  onWriteForTheme?: (themeId: string) => void;
  onOpenQuickEntry?: () => void;
  onCreateWrapper?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userId,
  cycleStartDate,
  themes,
  blogEntries,
  countdown,
  setActiveTab,
  onSelectBlogEntry,
  onSelectThemeFilter,
  onOpenWrapperStudio,
  onWriteForTheme,
  onOpenQuickEntry,
  onCreateWrapper,
}) => {
  const cycle = calculate365Cycle(cycleStartDate || getAppStartDate(userId));
  const hasWrappers = themes.length > 0;
  const goalCount = themes.reduce((total, theme) => total + theme.targetGoals2027.length, 0);
  const recentEntries = [...blogEntries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const createWrapper = onCreateWrapper || (() => setActiveTab('themes'));
  const writeEntry = onOpenQuickEntry || (() => setActiveTab('editor'));
  const openWrapper = (themeId: string) => {
    if (onOpenWrapperStudio) {
      onOpenWrapperStudio(themeId);
    } else {
      onSelectThemeFilter(themeId);
      setActiveTab('blog');
    }
  };

  return (
    <div className="dashboard-root">
      <div className="main-content dashboard-content">
        <header className="dashboard-hero">
          <div className="dashboard-hero-glow" aria-hidden="true" />
          <div className="dashboard-hero-copy">
            <p className="dashboard-eyebrow dashboard-date"><span aria-hidden="true">✦</span>{todayLabel}</p>
            <h1>
              <span className="dashboard-hero-motto">Todo empieza contigo.</span>
              <span className="dashboard-hero-submotto">Conquista tu horizonte <em>desde hoy.</em></span>
            </h1>
            <p className="dashboard-hero-description">
              {hasWrappers
                ? 'Tu horizonte no se espera en la distancia: se construye con cada idea, cada avance y cada reflexión que decides guardar.'
                : 'Haz espacio para lo que importa, escribe tu primera intención y empieza a construir el camino que quieres recorrer.'}
            </p>
            <div className="dashboard-hero-actions">
              <button type="button" className="btn-primary dashboard-primary-action" onClick={hasWrappers ? writeEntry : createWrapper}>
                {hasWrappers ? <PenLine size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {hasWrappers ? 'Escribir una entrada' : 'Crear mi primer wrapper'}
              </button>
              <button type="button" className="dashboard-text-action" onClick={() => setActiveTab('calendar')}>
                Ver calendario <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="dashboard-horizon" aria-label={countdown.is2027orLater ? `${countdown.days} días para cerrar 2027` : `${countdown.days} días para 2027`}>
            <div className="dashboard-horizon-caption">
              <span className="dashboard-horizon-kicker">Horizon 2027</span>
              <span className="dashboard-horizon-number">{countdown.days}</span>
              <span>{countdown.is2027orLater ? 'días para cerrar 2027' : 'días para 2027'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-overview" aria-label="Resumen de tu espacio">
          <button type="button" onClick={() => setActiveTab('themes')}>
            <span className="dashboard-stat-icon"><Layers size={19} aria-hidden="true" /></span>
            <span><strong>{themes.length}</strong><span>Wrappers</span></span>
            <ArrowRight size={15} className="dashboard-stat-arrow" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setActiveTab('blog')}>
            <span className="dashboard-stat-icon"><BookOpen size={19} aria-hidden="true" /></span>
            <span><strong>{blogEntries.length}</strong><span>Entradas</span></span>
            <ArrowRight size={15} className="dashboard-stat-arrow" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setActiveTab('themes')}>
            <span className="dashboard-stat-icon"><Target size={19} aria-hidden="true" /></span>
            <span><strong>{goalCount}</strong><span>Metas</span></span>
            <ArrowRight size={15} className="dashboard-stat-arrow" aria-hidden="true" />
          </button>
        </div>

        <section aria-labelledby="dashboard-wrappers-title">
          <div className="dashboard-section-heading">
            <div>
              <h2 id="dashboard-wrappers-title">Tus wrappers</h2>
              <p>Un espacio para cada cosa que te importa.</p>
            </div>
            {hasWrappers && (
              <button type="button" className="dashboard-text-action" onClick={() => setActiveTab('themes')}>
                Ver todos <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          {hasWrappers ? (
            <div className="dashboard-wrapper-grid">
              {themes.slice(0, 4).map(theme => {
                const entryCount = blogEntries.filter(entry => entry.themeId === theme.id).length;
                return (
                  <article key={theme.id} className={`dashboard-wrapper-card dashboard-color-${theme.color}`}>
                    <button type="button" className="dashboard-wrapper-open" onClick={() => openWrapper(theme.id)} aria-label={`Abrir wrapper ${theme.name}`}>
                      <span className="dashboard-wrapper-topline">
                        <span className="dashboard-wrapper-symbol"><Layers size={20} aria-hidden="true" /></span>
                        <span className="dashboard-priority">Prioridad {theme.priority}</span>
                        <ArrowRight size={18} aria-hidden="true" />
                      </span>
                      <span className="dashboard-wrapper-name">{theme.name}</span>
                      <span className="dashboard-wrapper-description">{theme.description || 'Un espacio para tus próximos pasos.'}</span>
                      <span className="dashboard-wrapper-meta">
                        {theme.targetGoals2027.length} {theme.targetGoals2027.length === 1 ? 'meta' : 'metas'}
                        <span aria-hidden="true">·</span>
                        {entryCount} {entryCount === 1 ? 'entrada' : 'entradas'}
                      </span>
                    </button>
                    <button type="button" className="dashboard-wrapper-write" onClick={() => onWriteForTheme ? onWriteForTheme(theme.id) : writeEntry()} aria-label={`Escribir una entrada en ${theme.name}`}>
                      <PenLine size={16} aria-hidden="true" /> Escribir aquí
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-wrapper">
              <span className="dashboard-empty-symbol"><Layers size={25} aria-hidden="true" /></span>
              <div>
                <h3>Empieza con algo que quieras cuidar.</h3>
                <p>Un wrapper reúne las metas y reflexiones de un área de tu vida. Tú eliges el nombre y el rumbo.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={createWrapper}><Plus size={17} aria-hidden="true" /> Crear wrapper</button>
            </div>
          )}
        </section>

        <div className="dashboard-lower-grid">
          <section className="dashboard-journal" aria-labelledby="dashboard-journal-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">Bitácora</p>
                <h2 id="dashboard-journal-title">Lo más reciente</h2>
              </div>
              {blogEntries.length > 0 && (
                <button type="button" className="dashboard-text-action" onClick={() => setActiveTab('blog')}>
                  Ver todas <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            {recentEntries.length > 0 ? (
              <div className="dashboard-entry-list">
                {recentEntries.map(entry => {
                  const theme = themes.find(item => item.id === entry.themeId);
                  return (
                    <button type="button" className="dashboard-entry" key={entry.id} onClick={() => onSelectBlogEntry(entry)}>
                      <span className="dashboard-entry-main">
                        <span className="dashboard-entry-meta">
                          <time dateTime={entry.date}>{formatDateSpanish(entry.date)}</time>
                          {theme && <span className={`dashboard-entry-theme dashboard-color-${theme.color}`}>{theme.name}</span>}
                        </span>
                        <span className="dashboard-entry-title">{entry.title || 'Sin título'}</span>
                        <span className="dashboard-entry-summary">{entry.summary || entry.content}</span>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-journal-empty">
                <BookOpen size={26} aria-hidden="true" />
                <h3>Las pequeñas ideas también cuentan.</h3>
                <p>Guarda lo que aprendiste, lo que cambió o lo que quieres intentar mañana.</p>
                <button type="button" className="dashboard-text-action" onClick={hasWrappers ? writeEntry : createWrapper}>
                  {hasWrappers ? 'Escribir mi primera entrada' : 'Preparar mi bitácora'} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>

          <aside className="dashboard-sidebar" aria-label="Tu horizonte">
            <button type="button" className="dashboard-cycle-card" onClick={() => setActiveTab('calendar')}>
              <span className="dashboard-cycle-heading"><CalendarDays size={19} aria-hidden="true" /><span>Tu ciclo de 365 días</span><ArrowRight size={17} aria-hidden="true" /></span>
              <span className="dashboard-cycle-day">Día {cycle.currentDayNumber}<span> / 365</span></span>
              <span className="dashboard-cycle-progress" role="progressbar" aria-label="Progreso del ciclo" aria-valuenow={cycle.currentDayNumber} aria-valuemin={0} aria-valuemax={365}>
                <span style={{ width: `${cycle.progressPercent}%` }} />
              </span>
              <span className="dashboard-cycle-footer"><span>{cycle.currentQuarter.name} · {cycle.currentQuarter.subtitle}</span><strong>{cycle.progressPercent}%</strong></span>
              <span className="dashboard-cycle-description">Un día a la vez, a tu ritmo.</span>
            </button>
            <HumanLifespanHero />
          </aside>
        </div>
      </div>
    </div>
  );
};
