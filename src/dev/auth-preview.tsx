import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { AuthModal, type AuthMode } from '../components/AuthModal';
import { ProfilePage } from '../components/ProfilePage';
import type { UserProfile } from '../types';
import { reviewUser } from './auth-preview-client';

const params = new URLSearchParams(window.location.search);
const view = params.get('view') ?? 'signin';
export function Review() {
  const [open, setOpen] = useState(view !== 'profile');
  const [audit, setAudit] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    id: reviewUser.id, displayName: 'Alex', bio: 'Un día a la vez.', cycleStartDate: '2026-10-23',
    avatarPath: null, avatarCharacter: 'penguin', avatarVersion: 0, createdAt: '2026-10-23', updatedAt: '2026-10-23',
  });
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const dialog = document.querySelector('.auth-dialog');
      if (!dialog) return;
      const { default: axe } = await import('axe-core');
      const result = await axe.run(dialog, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
      if (!cancelled) setAudit(JSON.stringify({ violations: result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })) }));
    }, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [open]);
  return <>
    <aside style={{ padding: 16, maxWidth: 900, margin: '0 auto', lineHeight: 1.6 }}>
      <p><strong>Revisión del acceso · solo datos ficticios.</strong> No inicia sesión, envía correos ni elimina cuentas.</p>
      <nav aria-label="Escenarios de revisión" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <a href="?view=signin">Entrar</a><a href="?view=signup">Crear cuenta</a><a href="?view=forgot">Recuperar</a><a href="?view=profile">Perfil Google</a><a href="?scenario=offline">Sin conexión</a><a href="?scenario=disabled">Google desactivado</a>
      </nav>
      <button className="btn-secondary" type="button" onClick={() => setOpen(true)}>Revisar formulario</button>
      <button className="btn-secondary" type="button" onClick={async () => {
        const { default: axe } = await import('axe-core');
        const result = await axe.run(document.querySelector('.auth-dialog') || document.querySelector('.profile-page') || document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
        setAudit(JSON.stringify({ violations: result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })) }));
      }}>Comprobar accesibilidad</button>
      {audit && <pre data-auth-audit="complete">{audit}</pre>}
    </aside>
    {view === 'profile' && <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}><ProfilePage user={reviewUser} profile={profile} avatarUrl={null} loading={false} error={null}
      onRetry={() => {}} onSave={async patch => setProfile(current => ({ ...current, ...patch }))}
      onAvatarSave={async () => {}} onAvatarRemove={async () => {}} onAvatarCharacterSelect={async avatarCharacter => setProfile(current => ({ ...current, avatarCharacter }))}
      onSignOut={async () => {}} /></main>}
    <AuthModal isOpen={open} onClose={() => setOpen(false)} initialMode={(['signin', 'signup', 'forgot', 'otp'].includes(view) ? view : 'signin') as AuthMode} user={null} onSignOut={() => {}} />
  </>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<Review />);
