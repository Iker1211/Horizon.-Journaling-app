import React, { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AlertCircle, Camera, CheckCircle2, Download, KeyRound, LoaderCircle, LogOut, Mail, RefreshCw, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../utils/authRedirect';
import { validateAvatarFile } from '../utils/avatar';
import { buildAccountExport, deliverAccountExport } from '../utils/accountExport';
import { AvatarEditor } from './AvatarEditor';

interface ProfilePageProps {
  user: User;
  profile: UserProfile | null;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSave: (patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'cycleStartDate'>>) => Promise<void>;
  onAvatarSave: (blob: Blob) => Promise<void>;
  onAvatarRemove: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

type BusyAction = 'profile' | 'avatar' | 'email' | 'password' | 'export' | 'delete' | 'signout' | null;

function initials(name: string, email?: string) {
  const source = name.trim() || email?.split('@')[0] || 'H';
  return source.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

function describeError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : '';
  if (/network|fetch|connection|offline/i.test(message)) return 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.';
  if (/password|credentials|contraseña/i.test(message)) return 'La contraseña actual no es correcta o la sesión necesita renovarse.';
  return message || 'No pudimos completar el cambio. Inténtalo de nuevo.';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user, profile, avatarUrl, loading, error, onRetry, onSave, onAvatarSave, onAvatarRemove, onSignOut, onDirtyChange,
}) => {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [cycleStartDate, setCycleStartDate] = useState(profile?.cycleStartDate ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState(user.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = profile ? (
    displayName !== profile.displayName || bio !== profile.bio || cycleStartDate !== profile.cycleStartDate
  ) : false;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [dirty]);
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  const run = async (action: BusyAction, task: () => Promise<void>, success?: string) => {
    setBusy(action);
    setFeedback(null);
    try {
      await task();
      if (success) setFeedback({ type: 'success', text: success });
    } catch (cause) {
      setFeedback({ type: 'error', text: describeError(cause) });
    } finally {
      setBusy(null);
    }
  };

  const pickAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      validateAvatarFile(file);
      setAvatarFile(file);
    } catch (cause) {
      setFeedback({ type: 'error', text: describeError(cause) });
    }
  };

  if (loading) return <section className="profile-page profile-state" aria-busy="true"><LoaderCircle className="profile-spinner" size={26} /><p>Cargando tu perfil…</p></section>;
  if (error || !profile) return <section className="profile-page profile-state"><AlertCircle size={28} /><h1>No pudimos cargar tu perfil</h1><p role="alert">{error || 'Tu perfil todavía no está disponible.'}</p><button type="button" className="btn-primary" onClick={onRetry}><RefreshCw size={17} />Volver a intentar</button></section>;

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div><span className="profile-eyebrow">TU ESPACIO</span><h1>Perfil y cuenta</h1><p>Tu identidad en Horizon, tus preferencias y la seguridad de tu cuenta.</p></div>
        <div className="profile-avatar" aria-label="Foto de perfil">{avatarUrl ? <img src={avatarUrl} alt="Tu foto de perfil" /> : <span>{initials(displayName, user.email)}</span>}</div>
      </header>

      {!isOnline && <div className="profile-feedback profile-feedback--error" role="status"><AlertCircle size={18} /><p>Estás sin conexión. Conservaremos tus cambios en pantalla para que puedas reintentar al volver.</p></div>}

      {feedback && <div className={`profile-feedback ${feedback.type === 'error' ? 'profile-feedback--error' : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}<p>{feedback.text}</p></div>}

      <div className="profile-grid">
        <section className="profile-card profile-card--identity" aria-labelledby="identity-title">
          <div className="profile-card-heading"><span className="profile-card-icon"><UserRound size={20} /></span><div><h2 id="identity-title">Tu perfil</h2><p>Visible únicamente dentro de tu cuenta.</p></div></div>
          <div className="profile-avatar-controls">
            <div className="profile-avatar profile-avatar--large">{avatarUrl ? <img src={avatarUrl} alt="Tu foto de perfil" /> : <span>{initials(displayName, user.email)}</span>}</div>
            <div><input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickAvatar} /><button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()} disabled={Boolean(busy)}><Camera size={17} />{avatarUrl ? 'Cambiar foto' : 'Subir foto'}</button>{avatarUrl && <button type="button" className="profile-text-button profile-text-button--danger" onClick={() => void run('avatar', onAvatarRemove, 'Foto eliminada.')} disabled={Boolean(busy)}>Eliminar foto</button>}<small>JPG, PNG o WebP. Se recorta y protege antes de subir.</small></div>
          </div>
          <div className="profile-fields">
            <label><span>Nombre visible</span><input type="text" maxLength={60} autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="¿Cómo quieres llamarte?" /><small>{displayName.length}/60</small></label>
            <label><span>Descripción breve <em>Opcional</em></span><textarea maxLength={160} rows={3} value={bio} onChange={event => setBio(event.target.value)} placeholder="Una frase que te recuerde hacia dónde vas." /><small>{bio.length}/160</small></label>
            <label><span>Inicio de tu ciclo de 365 días</span><input type="date" value={cycleStartDate} onChange={event => setCycleStartDate(event.target.value)} required /><small>Se sincroniza entre tus dispositivos.</small></label>
          </div>
          <div className="profile-form-actions"><button type="button" className="btn-secondary" disabled={!dirty || Boolean(busy)} onClick={() => { setDisplayName(profile.displayName); setBio(profile.bio); setCycleStartDate(profile.cycleStartDate); }}>Descartar</button><button type="button" className="btn-primary" disabled={!dirty || !cycleStartDate || Boolean(busy)} onClick={() => void run('profile', () => onSave({ displayName, bio, cycleStartDate }), 'Cambios guardados.')}>{busy === 'profile' ? <><LoaderCircle className="profile-spinner" size={17} />Guardando…</> : 'Guardar cambios'}</button></div>
        </section>

        <div className="profile-side-column">
          <section className="profile-card" aria-labelledby="email-title">
            <div className="profile-card-heading"><span className="profile-card-icon"><Mail size={20} /></span><div><h2 id="email-title">Correo electrónico</h2><p>Se confirma en tu correo antes de cambiar.</p></div></div>
            <label className="profile-field"><span>Nuevo correo</span><input type="email" inputMode="email" autoCapitalize="none" value={newEmail} onChange={event => setNewEmail(event.target.value)} /></label>
            <button type="button" className="btn-secondary profile-full-button" disabled={Boolean(busy) || newEmail.trim().toLowerCase() === (user.email ?? '').toLowerCase()} onClick={() => void run('email', async () => {
              if (!supabase) throw new Error('Servicio no disponible.');
              const { error: updateError } = await supabase.auth.updateUser({ email: newEmail.trim() }, { emailRedirectTo: getAuthRedirectUrl('signup') });
              if (updateError) throw updateError;
            }, 'Revisa ambos correos para confirmar el cambio.')}>{busy === 'email' ? 'Solicitando…' : 'Cambiar correo'}</button>
          </section>

          <section className="profile-card" aria-labelledby="password-title">
            <div className="profile-card-heading"><span className="profile-card-icon"><KeyRound size={20} /></span><div><h2 id="password-title">Contraseña</h2><p>Confirma primero tu contraseña actual.</p></div></div>
            <div className="profile-fields profile-fields--compact">
              <label><span>Contraseña actual</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
              <label><span>Nueva contraseña</span><input type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
              <label><span>Repite la nueva contraseña</span><input type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
            </div>
            <button type="button" className="btn-secondary profile-full-button" disabled={Boolean(busy) || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword} onClick={() => void run('password', async () => {
              if (!supabase || !user.email) throw new Error('Servicio no disponible.');
              const verified = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
              if (verified.error) throw verified.error;
              const updated = await supabase.auth.updateUser({ password: newPassword });
              if (updated.error) throw updated.error;
              setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            }, 'Contraseña actualizada.')}>{busy === 'password' ? 'Actualizando…' : 'Actualizar contraseña'}</button>
          </section>

          <section className="profile-card" aria-labelledby="data-title">
            <div className="profile-card-heading"><span className="profile-card-icon"><Download size={20} /></span><div><h2 id="data-title">Tus datos</h2><p>Descarga una copia legible y verificable.</p></div></div>
            <button type="button" className="btn-secondary profile-full-button" disabled={Boolean(busy)} onClick={() => void run('export', async () => deliverAccountExport(await buildAccountExport(user.id)), 'Exportación preparada.')}>{busy === 'export' ? <><LoaderCircle className="profile-spinner" size={17} />Preparando…</> : <><Download size={17} />Exportar mis datos</>}</button>
            <button type="button" className="profile-signout" disabled={Boolean(busy)} onClick={() => void run('signout', onSignOut)}><LogOut size={17} />Cerrar sesión en este dispositivo</button>
          </section>
        </div>
      </div>

      <section className="profile-card profile-danger" aria-labelledby="delete-title">
        <div className="profile-card-heading"><span className="profile-card-icon"><ShieldAlert size={20} /></span><div><h2 id="delete-title">Eliminar cuenta</h2><p>Elimina tu perfil, wrappers, entradas, hitos y avatar de forma permanente.</p></div></div>
        <div className="profile-danger-fields"><label><span>Contraseña actual</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} /></label><label><span>Escribe ELIMINAR</span><input type="text" autoComplete="off" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} /></label></div>
        <button type="button" className="profile-delete-button" disabled={Boolean(busy) || !deletePassword || deleteConfirmation !== 'ELIMINAR'} onClick={() => void run('delete', async () => {
          if (!supabase) throw new Error('Servicio no disponible.');
          const { error: invokeError } = await supabase.functions.invoke('delete-account', { body: { currentPassword: deletePassword, confirmation: deleteConfirmation } });
          if (invokeError) throw invokeError;
          await supabase.auth.signOut({ scope: 'local' });
          window.location.hash = '#/dashboard';
          window.location.reload();
        })}>{busy === 'delete' ? <><LoaderCircle className="profile-spinner" size={17} />Eliminando…</> : <><Trash2 size={17} />Eliminar mi cuenta permanentemente</>}</button>
      </section>

      {avatarFile && <AvatarEditor file={avatarFile} onCancel={() => setAvatarFile(null)} onSave={async blob => {
        setBusy('avatar');
        setFeedback(null);
        try {
          await onAvatarSave(blob);
          setAvatarFile(null);
          setFeedback({ type: 'success', text: 'Foto actualizada.' });
        } finally {
          setBusy(null);
        }
      }} />}
    </div>
  );
};
