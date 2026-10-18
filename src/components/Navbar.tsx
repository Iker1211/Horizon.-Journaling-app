import React, { useEffect, useState } from 'react';
import { ActiveTab, AvatarCharacterId } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';

const MOTIVATIONAL_MESSAGES = [
  'Todo empieza contigo.',
  'Un paso pequeño también cuenta.',
  'Tu ritmo también es progreso.',
  'Lo importante merece espacio.',
  'Hoy también puedes empezar.',
  'Avanza con calma, pero avanza.',
  'Escribe lo que no quieres olvidar.',
  'Tu atención construye tu horizonte.',
] as const;

function initialMessageIndex() {
  return Math.floor(Date.now() / 18_000) % MOTIVATIONAL_MESSAGES.length;
}

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickEntry: () => void;
  userEmail: string | null;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  userAvatarCharacter?: AvatarCharacterId | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenQuickEntry, userEmail, userDisplayName, userAvatarUrl, userAvatarCharacter, onOpenAuth }) => {
  const [messageIndex, setMessageIndex] = useState(initialMessageIndex);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setMessageIndex(index => (index + 1) % MOTIVATIONAL_MESSAGES.length);
      }
    }, 18_000);
    return () => window.clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'themes', label: 'Wrappers', icon: Layers, active: activeTab === 'themes' || activeTab === 'wrapper-studio' },
    { id: 'blog', label: 'Bitácora', icon: BookOpen, active: ['blog', 'editor', 'entry'].includes(activeTab) },
    { id: 'calendar', label: 'Calendario', icon: Calendar, active: activeTab === 'calendar' },
  ] as const;

  return (
    <header className="top-nav">
      <p className="nav-motivation" aria-hidden="true" title={MOTIVATIONAL_MESSAGES[messageIndex]}>
        <span key={messageIndex}>{MOTIVATIONAL_MESSAGES[messageIndex]}</span>
      </p>
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
        <button type="button" className={`nav-account-button nav-character-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={onOpenAuth} aria-label={userEmail ? 'Abrir mi perfil' : 'Iniciar sesión'} title={userDisplayName?.trim() ? `Perfil · ${userDisplayName.trim()}` : 'Mi perfil'} aria-current={activeTab === 'profile' ? 'page' : undefined}>
          <ProfileAvatar characterId={userAvatarCharacter} photoUrl={userAvatarUrl} />
        </button>
      </div>
    </header>
  );
};
