import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenQuickAction }) => {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'themes', label: 'Wrappers', icon: Layers, active: ['themes', 'wrapper-studio'].includes(activeTab) },
    { id: 'create', label: 'Crear', icon: Plus, active: false },
    { id: 'blog', label: 'Bitácora', icon: BookOpen, active: ['blog', 'entry', 'editor'].includes(activeTab) },
    { id: 'calendar', label: 'Calendario', icon: Calendar, active: activeTab === 'calendar' },
  ] as const;
  return (
    <nav className="mobile-nav" aria-label="Navegación principal móvil">
      <div className="mobile-nav-inner">
        {items.map(({ id, label, icon: Icon, active }) => (
          <button key={id} type="button" className={`mobile-nav-item ${active ? 'is-active' : ''} ${id === 'create' ? 'mobile-nav-create' : ''}`}
            onClick={() => id === 'create' ? onOpenQuickAction() : setActiveTab(id)}
            aria-current={active ? 'page' : undefined} aria-label={id === 'create' ? 'Crear entrada o wrapper' : label}>
            <span className="mobile-nav-icon"><Icon size={21} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" /></span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
