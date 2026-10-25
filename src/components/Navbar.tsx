import React, { useEffect, useState } from 'react';
import { ActiveTab, AvatarCharacterId } from '../types';
import { LayoutDashboard, Calendar, Layers, BookOpen, Plus } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { AnimalCompanion } from './AnimalCompanion';
import { resolveAvatarCharacter } from '../utils/avatarCharacters';
import { useCompanionPresence } from '../hooks/useCompanionPresence';

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
  const [companionAttention, setCompanionAttention] = useState(0);
  const companion = resolveAvatarCharacter(userAvatarCharacter, userAvatarUrl);
  const presence = useCompanionPresence();

  useEffect(() => {
    if (presence.enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setMessageIndex(index => (index + 1) % MOTIVATIONAL_MESSAGES.length);
      }
    }, 18_000);
    return () => window.clearInterval(timer);
  }, [presence.enabled]);

  const note = presence.state.cue === 'error' ? 'Tu texto sigue aquí.'
    : presence.state.cue === 'saving' ? 'Guardando en tu cuenta…'
      : presence.state.cue === 'saved' ? 'Guardada en tu cuenta.'
        : activeTab === 'editor' ? 'A tu ritmo. Sin prisa.'
          : activeTab === 'entry' ? 'Un momento para volver a leer.'
            : activeTab === 'dashboard' ? 'Qué bien que estés aquí.' : 'Un paso, a tu ritmo.';

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'themes', label: 'Wrappers', icon: Layers, active: activeTab === 'themes' || activeTab === 'wrapper-studio' },
    { id: 'blog', label: 'Bitácora', icon: BookOpen, active: ['blog', 'editor', 'entry'].includes(activeTab) },
    { id: 'calendar', label: 'Calendario', icon: Calendar, active: activeTab === 'calendar' },
  ] as const;

  return (
    <header className={`top-nav${presence.enabled ? ' presence-nav' : ''}`} data-presence={presence.enabled ? presence.state.cue : undefined}>
      {presence.enabled ? <p className="presence-note" aria-hidden="true">
        <span className="presence-note-kicker">{activeTab === 'editor' ? 'Espacio para pensar' : 'Tu rincón'}</span>
        <span className="presence-note-copy">{note}</span>
      </p> : <p className="nav-motivation" aria-hidden="true" title={MOTIVATIONAL_MESSAGES[messageIndex]}>
        <span key={messageIndex}>{MOTIVATIONAL_MESSAGES[messageIndex]}</span>
      </p>}
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
        <button type="button" className={`nav-account-button nav-character-button ${companion ? 'nav-companion-button' : ''} ${activeTab === 'profile' ? 'active' : ''}`} onClick={onOpenAuth} onPointerEnter={() => { if (companion) setCompanionAttention(value => value + 1); }} onFocus={() => { if (companion) setCompanionAttention(value => value + 1); }} aria-label={userEmail ? 'Abrir mi perfil' : 'Iniciar sesión'} title={userDisplayName?.trim() ? `Perfil · ${userDisplayName.trim()}` : 'Mi perfil'} aria-current={activeTab === 'profile' ? 'page' : undefined}>
          {companion ? <AnimalCompanion key={companion.id} characterId={companion.id} quiet={activeTab === 'editor'} attention={companionAttention} presence={presence.enabled ? presence.state : undefined} /> : <ProfileAvatar characterId={userAvatarCharacter} photoUrl={userAvatarUrl} />}
        </button>
      </div>
    </header>
  );
};
