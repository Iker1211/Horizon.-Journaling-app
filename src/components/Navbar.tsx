import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus, RotateCcw, Cloud, LogOut, User, Palette } from 'lucide-react';
import { FireGoatLogo } from './FireGoatLogo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickEntry: () => void;
  onResetData: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickEntry,
  onResetData,
  userEmail,
  onOpenAuth,
  onSignOut,
}) => {
  return (
    <header className="top-nav">
      <div className="nav-brand" onClick={() => setActiveTab('dashboard')} title="Horizon 2027 · Todo empieza contigo">
        <FireGoatLogo size={36} />
        <div className="nav-brand-title">
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Horizon</span>
          <span
            className="badge-pill"
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              backgroundColor: 'var(--color-brand-teal)',
              color: '#ffffff',
              letterSpacing: '0.5px',
            }}
          >
            2027
          </span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          title="Panel General"
        >
          <LayoutDashboard size={17} />
          <span>Panel General</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          title="Calendario de 365 Días (Q1-Q4)"
        >
          <Calendar size={17} />
          <span>Calendario</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
          title="Wrappers"
        >
          <Layers size={17} />
          <span>Wrappers</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'blog' || activeTab === 'editor' || activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('blog')}
          title="Bitácora / Blog"
        >
          <BookOpen size={17} />
          <span>Bitácora</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
          title="Capa de Presentación & Tokens de Diseño"
        >
          <Palette size={17} />
          <span>Diseño</span>
        </button>
      </nav>

      <div className="nav-actions">
        <button
          className="btn-primary btn-sm clay-button-interactive"
          onClick={onOpenQuickEntry}
          title="Nueva Entrada rápida de Bitácora"
        >
          <Plus size={15} />
          <span>Escribir</span>
        </button>

        {/* Cloud / Auth Button */}
        {userEmail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              className="badge-pill"
              onClick={onOpenAuth}
              title={`Sesión iniciada con: ${userEmail}. Haz clic para ver estado de sincronización en Supabase`}
              style={{
                backgroundColor: 'var(--color-surface-soft)',
                border: '1px solid var(--color-hairline)',
                fontSize: 12,
                fontWeight: 600,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <User size={13} color="var(--color-brand-teal)" />
              <span>{userEmail.split('@')[0]}</span>
              <span style={{ fontSize: 9, color: 'var(--color-brand-teal)', fontWeight: 800 }}>☁</span>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={onSignOut}
              title="Cerrar sesión"
              style={{ padding: '6px 8px' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            className="btn-secondary btn-sm"
            onClick={onOpenAuth}
            title="Conectar con Supabase Cloud"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Cloud size={14} />
            <span>Nube</span>
          </button>
        )}

        <button
          className="btn-secondary btn-sm"
          onClick={() => {
            if (confirm('¿Deseas restaurar los datos de demostración para el 2027?')) {
              onResetData();
            }
          }}
          title="Restaurar datos de muestra"
          style={{ padding: '6px 8px' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </header>
  );
};
