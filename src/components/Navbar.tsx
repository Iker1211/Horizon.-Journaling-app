import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus, UserRound } from 'lucide-react';
import { FireGoatLogo } from './FireGoatLogo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickEntry: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenQuickEntry, userEmail, onOpenAuth }) => {
  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'themes', label: 'Wrappers', icon: Layers, active: activeTab === 'themes' || activeTab === 'wrapper-studio' },
    { id: 'blog', label: 'Bitácora', icon: BookOpen, active: ['blog', 'editor', 'entry'].includes(activeTab) },
    { id: 'calendar', label: 'Calendario', icon: Calendar, active: activeTab === 'calendar' },
  ] as const;

  return (
    <header className="top-nav">
      <button type="button" className="nav-brand" onClick={() => setActiveTab('dashboard')} aria-label="Horizon, ir al inicio">
        <FireGoatLogo size={34} />
        <span className="nav-brand-title">Horizon <span className="nav-brand-badge">2027</span></span>
      </button>
      <nav className="nav-tabs" aria-label="Navegación principal">
        {tabs.map(({ id, label, icon: Icon, active }) => (
          <button key={id} type="button" className={`nav-tab-btn ${active ? 'active' : ''}`} onClick={() => setActiveTab(id)} aria-current={active ? 'page' : undefined}>
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <button type="button" className="btn-primary nav-write-button" onClick={onOpenQuickEntry}>
          <Plus size={17} aria-hidden="true" /> Escribir
        </button>
        <button type="button" className="nav-account-button" onClick={onOpenAuth} aria-label={userEmail ? 'Abrir mi cuenta' : 'Iniciar sesión'}>
          <UserRound size={19} aria-hidden="true" />
          <span>{userEmail ? 'Mi cuenta' : 'Entrar'}</span>
        </button>
      </div>
    </header>
  );
};
