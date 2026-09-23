import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
}) => {
  return (
    <nav className="bottom-game-nav" aria-label="Navegación táctil móvil">
      <div className="bottom-game-nav-inner">
        {/* 1. Panel */}
        <button
          type="button"
          className={`bottom-game-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Ir al Panel General"
        >
          <div className="bottom-tab-icon-wrapper">
            <LayoutDashboard size={20} />
            {activeTab === 'dashboard' && <span className="bottom-tab-active-dot" />}
          </div>
          <span className="bottom-tab-label">Panel</span>
        </button>

        {/* 2. Wrappers (Pilares de Vida) */}
        <button
          type="button"
          className={`bottom-game-tab ${activeTab === 'themes' || activeTab === 'wrapper-studio' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('themes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Ir a Wrappers"
        >
          <div className="bottom-tab-icon-wrapper">
            <Layers size={20} />
            {(activeTab === 'themes' || activeTab === 'wrapper-studio') && (
              <span className="bottom-tab-active-dot" />
            )}
          </div>
          <span className="bottom-tab-label">Wrappers</span>
        </button>

        {/* 3. Central Elevated Action FAB (+) (Clash Royale Tactile Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            type="button"
            className="bottom-game-fab"
            onClick={onOpenQuickAction}
            title="Crear nueva bitácora o wrapper"
            aria-label="Creación rápida"
          >
            <Plus size={24} strokeWidth={2.8} />
          </button>
          <span className="bottom-game-fab-label">Crear</span>
        </div>

        {/* 4. Bitácora */}
        <button
          type="button"
          className={`bottom-game-tab ${activeTab === 'blog' || activeTab === 'editor' || activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('blog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Ir a Bitácora"
        >
          <div className="bottom-tab-icon-wrapper">
            <BookOpen size={20} />
            {(activeTab === 'blog' || activeTab === 'editor' || activeTab === 'entry') && (
              <span className="bottom-tab-active-dot" />
            )}
          </div>
          <span className="bottom-tab-label">Bitácora</span>
        </button>

        {/* 5. Calendario */}
        <button
          type="button"
          className={`bottom-game-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('calendar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Ir al Calendario"
        >
          <div className="bottom-tab-icon-wrapper">
            <Calendar size={20} />
            {activeTab === 'calendar' && <span className="bottom-tab-active-dot" />}
          </div>
          <span className="bottom-tab-label">Calendario</span>
        </button>
      </div>
    </nav>
  );
};
