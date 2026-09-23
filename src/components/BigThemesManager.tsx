import React from 'react';
import { BigTheme, BlogEntry } from '../types';
import { Plus, Edit2, Trash2, BookOpen, Target } from 'lucide-react';

interface BigThemesManagerProps {
  themes: BigTheme[];
  blogEntries: BlogEntry[];
  onOpenCreateTheme: () => void;
  onEditTheme: (theme: BigTheme) => void;
  onDeleteTheme: (id: string) => void;
  onWriteForTheme: (themeId: string) => void;
  onFilterBlogByTheme: (themeId: string) => void;
  onOpenStudio?: (themeId: string) => void;
}

export const BigThemesManager: React.FC<BigThemesManagerProps> = ({
  themes,
  blogEntries,
  onOpenCreateTheme,
  onEditTheme,
  onDeleteTheme,
  onWriteForTheme,
  onFilterBlogByTheme,
  onOpenStudio,
}) => {
  const getCardThemeClass = (color: string) => {
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
    <div className="themes-page-container">
      <div className="section-header">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <span style={{ color: 'var(--color-brand-ochre)', fontWeight: 800 }}>★</span>
            <span>Estructura de Wrappers 2027</span>
          </div>
          <h1 className="display-sm" style={{ color: 'var(--color-ink)' }}>
            Wrappers
          </h1>
          <p className="section-desc" style={{ maxWidth: 680 }}>
            Los Wrappers son los pilares integrales que dan coherencia y estructura al camino hacia 2027.
            Sirven como contenedores para cada reflexión de la bitácora
            y cada meta estratégica del año.
          </p>
        </div>

        <button className="btn-primary clay-button-interactive" onClick={onOpenCreateTheme}>
          <Plus size={16} /> Crear Wrapper
        </button>
      </div>

      {themes.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface-soft)',
          borderRadius: 'var(--radius-xl)',
          padding: 60,
          textAlign: 'center',
          border: '1px solid var(--color-hairline)',
          boxShadow: '0 2px 0 var(--color-surface-strong)',
        }}>
          <h3 className="title-md">No tienes ningún Wrapper configurado</h3>
          <p className="body-sm" style={{ marginTop: 8, marginBottom: 20 }}>
            Crea tu primer Wrapper (por ejemplo: Salud Radical, Maestría en IA, Soberanía Financiera) para empezar a estructurar tus entradas de bitácora y metas 2027.
          </p>
          <button className="btn-primary" onClick={onOpenCreateTheme}>
            <Plus size={15} /> Crear Primer Wrapper
          </button>
        </div>
      ) : (
        <div className="themes-grid-showcase">
          {themes.map(theme => {
            const cardClass = getCardThemeClass(theme.color);
            const linkedBlogs = blogEntries.filter(b => b.themeId === theme.id);

            return (
              <div key={theme.id} className={`theme-card-full ${cardClass}`}>
                <div>
                  <div className="theme-top">
                    <span className="theme-badge-priority">
                      Prioridad {theme.priority}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="theme-btn-action"
                        onClick={() => onEditTheme(theme)}
                        title="Editar Wrapper"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="theme-btn-action"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el wrapper "${theme.name}"?`)) {
                            onDeleteTheme(theme.id);
                          }
                        }}
                        title="Eliminar Wrapper"
                        style={{ color: 'var(--color-error)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="theme-header-info">
                    <h3
                      className="theme-title"
                      style={{ cursor: onOpenStudio ? 'pointer' : 'default' }}
                      onClick={() => onOpenStudio && onOpenStudio(theme.id)}
                      title="Entrar al Studio de este Wrapper"
                    >
                      {theme.name}
                    </h3>
                  </div>

                  <p className="theme-desc">{theme.description}</p>

                  {theme.targetGoals2027 && theme.targetGoals2027.length > 0 && (
                    <div className="theme-goals-box">
                      <div className="theme-goals-title">
                        <Target size={13} /> Metas 2027 en este Eje:
                      </div>
                      <ul className="theme-goals-list">
                        {theme.targetGoals2027.map((goal, gIdx) => (
                          <li key={gIdx} className="theme-goal-item">
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <div className="theme-card-actions">
                    <div className="theme-stats-summary">
                      <span title="Entradas de bitácora asociadas">
                        📖 {linkedBlogs.length} bitácoras
                      </span>
                      <span title="Metas fijadas">
                        🎯 {theme.targetGoals2027.length} metas
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="theme-btn-action"
                        onClick={() => onWriteForTheme(theme.id)}
                        title="Escribir entrada vinculada a este Wrapper"
                      >
                        <BookOpen size={13} /> Escribir
                      </button>
                      <button
                        className="theme-btn-action"
                        onClick={() => onOpenStudio ? onOpenStudio(theme.id) : onFilterBlogByTheme(theme.id)}
                        title="Entrar al Studio inmersivo de este Wrapper"
                        style={{ fontWeight: 700 }}
                      >
                        Entrar al Studio →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
