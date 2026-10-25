import React, { useEffect, useRef, useState } from 'react';
import { FunctionsHttpError, type User } from '@supabase/supabase-js';
import { AlertCircle, Camera, CheckCircle2, Download, KeyRound, LoaderCircle, LogOut, Mail, RefreshCw, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import type { AvatarCharacterId, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../utils/authRedirect';
import { validateAvatarFile } from '../utils/avatar';
import { buildAccountExport, deliverAccountExport } from '../utils/accountExport';
import { AvatarEditor } from './AvatarEditor';
import { AvatarCharacterPicker } from './AvatarCharacterPicker';
import { ProfileAvatar } from './ProfileAvatar';
import { DEFAULT_AVATAR_CHARACTER, resolveAvatarCharacter } from '../utils/avatarCharacters';
import { CompanionMotionPreference } from './CompanionMotionPreference';
import { clearGoogleReauthentication, getGoogleReauthenticationExpiresAt, hasGoogleIdentity, hasRecentGoogleReauthentication, isGoogleOnlyAccount, startGoogleSignIn } from '../services/googleAuth';

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
  onAvatarCharacterSelect: (id: AvatarCharacterId | null) => Promise<void>;
  onSignOut: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  accountActionsEnabled?: boolean;
}

type BusyAction = 'profile' | 'avatar' | 'email' | 'password' | 'export' | 'delete' | 'signout' | 'google' | null;

function describeError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : '';
  if (/network|fetch|connection|offline/i.test(message)) return 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.';
  if (/password|credentials|contraseña/i.test(message)) return 'La contraseña actual no es correcta o la sesión necesita renovarse.';
  return message || 'No pudimos completar el cambio. Inténtalo de nuevo.';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user, profile, avatarUrl, loading, error, onRetry, onSave, onAvatarSave, onAvatarRemove, onAvatarCharacterSelect, onSignOut, onDirtyChange, accountActionsEnabled = true,
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
  const [googleReauthenticationExpiresAt, setGoogleReauthenticationExpiresAt] = useState(() => hasRecentGoogleReauthentication(user.id) ? getGoogleReauthenticationExpiresAt(user.id) : 0);
  const [googleConfirmationExpired, setGoogleConfirmationExpired] = useState(false);
  const [showGoogleSavePrompt, setShowGoogleSavePrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const googleLinked = hasGoogleIdentity(user);
  const googleOnly = isGoogleOnlyAccount(user);
  const googleRecentlyConfirmed = googleLinked && googleReauthenticationExpiresAt > 0;
  const fileInput = useRef<HTMLInputElement>(null);
  const googleSavePrompt = useRef<HTMLDivElement>(null);
  const allowGoogleRedirect = useRef(false);
  const [pendingCharacter, setPendingCharacter] = useState<AvatarCharacterId | null>(null);
  const previousProfile = useRef(profile);
  useEffect(() => {
    if (!profile) return;
    const previous = previousProfile.current;
    // Avatar changes must not remount the form or erase a name/bio being edited.
    setDisplayName(value => value === (previous?.displayName ?? '') ? profile.displayName : value);
    setBio(value => value === (previous?.bio ?? '') ? profile.bio : value);
    setCycleStartDate(value => value === (previous?.cycleStartDate ?? '') ? profile.cycleStartDate : value);
    previousProfile.current = profile;
  }, [profile]);

  const dirty = profile ? (
    displayName !== profile.displayName || bio !== profile.bio || cycleStartDate !== profile.cycleStartDate
  ) : false;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (allowGoogleRedirect.current) return;
      event.preventDefault(); event.returnValue = '';
    };
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
  useEffect(() => {
    const refreshGoogleConfirmation = () => {
      const recent = hasRecentGoogleReauthentication(user.id);
      setGoogleReauthenticationExpiresAt(recent ? getGoogleReauthenticationExpiresAt(user.id) : 0);
      if (recent) setGoogleConfirmationExpired(false);
      else if (googleReauthenticationExpiresAt) setGoogleConfirmationExpired(true);
    };
    const confirmed = () => {
      refreshGoogleConfirmation();
      if (hasRecentGoogleReauthentication(user.id)) {
        setDeleteConfirmation('');
        setFeedback({ type: 'success', text: 'Identidad confirmada con Google. Si quieres eliminar tu cuenta, escribe ELIMINAR y confirma la acción.' });
      }
    };
    window.addEventListener('horizon:google-reauthenticated', confirmed);
    window.addEventListener('focus', refreshGoogleConfirmation);
    document.addEventListener('visibilitychange', refreshGoogleConfirmation);
    return () => {
      window.removeEventListener('horizon:google-reauthenticated', confirmed);
      window.removeEventListener('focus', refreshGoogleConfirmation);
      document.removeEventListener('visibilitychange', refreshGoogleConfirmation);
    };
  }, [user.id, googleReauthenticationExpiresAt]);
  useEffect(() => {
    if (!googleReauthenticationExpiresAt) return;
    const timeout = window.setTimeout(() => {
      setGoogleReauthenticationExpiresAt(0);
      setGoogleConfirmationExpired(true);
    }, Math.max(0, googleReauthenticationExpiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [googleReauthenticationExpiresAt]);
  useEffect(() => {
    if (showGoogleSavePrompt && dirty) googleSavePrompt.current?.focus();
  }, [showGoogleSavePrompt, dirty]);

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

  const confirmWithGoogle = async (saveChanges = false) => {
    if (dirty && !saveChanges) {
      setShowGoogleSavePrompt(true);
      return;
    }
    await run('google', async () => {
      if (dirty) {
        await onSave({ displayName, bio, cycleStartDate });
        setDisplayName(displayName.trim());
        setBio(bio.trim());
      }
      setShowGoogleSavePrompt(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setDeletePassword(''); setDeleteConfirmation('');
      // Only saved profile changes may bypass the normal leave-page protection.
      allowGoogleRedirect.current = true;
      onDirtyChange?.(false);
      try {
        await startGoogleSignIn({ reauthenticateUserId: user.id });
      } finally {
        allowGoogleRedirect.current = false;
      }
    }, 'Completa la verificación en Google y vuelve a Horizon. Abrir Google no elimina tu cuenta.');
  };

  if (loading) return <section className="profile-page profile-state" aria-busy="true"><LoaderCircle className="profile-spinner" size={26} /><p>Cargando tu perfil…</p></section>;
  if (error || !profile) return <section className="profile-page profile-state"><AlertCircle size={28} /><h1>No pudimos cargar tu perfil</h1><p role="alert">{error || 'Tu perfil todavía no está disponible.'}</p><button type="button" className="btn-primary" onClick={onRetry}><RefreshCw size={17} />Volver a intentar</button></section>;

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div><span className="profile-eyebrow">TU ESPACIO</span><h1>Perfil y cuenta</h1><p>Tu identidad en Horizon, tus preferencias y la seguridad de tu cuenta.</p></div>
        <ProfileAvatar characterId={profile.avatarCharacter} photoUrl={avatarUrl} className="profile-hero-portrait" alt="Tu imagen de perfil" />
      </header>

      {!isOnline && <div className="profile-feedback profile-feedback--error" role="status"><AlertCircle size={18} /><p>Estás sin conexión. Conservaremos tus cambios en pantalla para que puedas reintentar al volver.</p></div>}

      {feedback && <div className={`profile-feedback ${feedback.type === 'error' ? 'profile-feedback--error' : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}<p>{feedback.text}</p></div>}

      <div className="profile-grid">
        <section className="profile-card profile-card--identity" aria-labelledby="identity-title" inert={busy === 'google'}>
          <div className="profile-card-heading"><span className="profile-card-icon"><UserRound size={20} /></span><div><h2 id="identity-title">Tu perfil</h2><p>Visible únicamente dentro de tu cuenta.</p></div></div>
          <AvatarCharacterPicker selected={profile.avatarCharacter || (avatarUrl ? null : DEFAULT_AVATAR_CHARACTER)} pending={pendingCharacter} disabled={Boolean(busy) || !isOnline} onSelect={id => { setPendingCharacter(id); void run('avatar', () => onAvatarCharacterSelect(id), 'Tu personaje ya te acompaña.').finally(() => setPendingCharacter(null)); }} />
          {resolveAvatarCharacter(profile.avatarCharacter, avatarUrl) && <CompanionMotionPreference />}
          {avatarUrl && profile.avatarCharacter && <button type="button" className="profile-text-button" disabled={Boolean(busy) || !isOnline} onClick={() => void run('avatar', () => onAvatarCharacterSelect(null), 'Foto de perfil restaurada.')}>Volver a usar mi foto</button>}
          <details className="profile-photo-option" open={Boolean(avatarUrl && !profile.avatarCharacter)}><summary>¿Prefieres tu propia foto?</summary>
            <div className="profile-avatar-controls">
              {avatarUrl && <ProfileAvatar photoUrl={avatarUrl} className="profile-identity-portrait" alt="Tu foto personal" />}
              <div><input ref={fileInput} className="visually-hidden" type="file" aria-label="Subir foto de perfil" tabIndex={-1} accept="image/jpeg,image/png,image/webp" onChange={pickAvatar} /><button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()} disabled={Boolean(busy)}><Camera size={17} />{avatarUrl ? 'Cambiar foto' : 'Subir foto'}</button>{avatarUrl && <button type="button" className="profile-text-button profile-text-button--danger" onClick={() => void run('avatar', onAvatarRemove, 'Foto eliminada.')} disabled={Boolean(busy)}>Eliminar foto</button>}<small>JPG, PNG o WebP. Se recorta y protege antes de subir.</small></div>
            </div>
          </details>
          <div className="profile-fields">
            <label><span>Nombre visible</span><input type="text" maxLength={60} autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="¿Cómo quieres llamarte?" /><small>{displayName.length}/60</small></label>
            <label><span>Descripción breve <em>Opcional</em></span><textarea maxLength={160} rows={3} value={bio} onChange={event => setBio(event.target.value)} placeholder="Una frase que te recuerde hacia dónde vas." /><small>{bio.length}/160</small></label>
            <label><span>Inicio de tu ciclo de 365 días</span><input type="date" value={cycleStartDate} onChange={event => setCycleStartDate(event.target.value)} required /><small>Se sincroniza entre tus dispositivos.</small></label>
          </div>
          <div className="profile-form-actions"><button type="button" className="btn-secondary" disabled={!dirty || Boolean(busy)} onClick={() => { setDisplayName(profile.displayName); setBio(profile.bio); setCycleStartDate(profile.cycleStartDate); setShowGoogleSavePrompt(false); }}>Descartar</button><button type="button" className="btn-primary" disabled={!dirty || !cycleStartDate || Boolean(busy)} onClick={() => void run('profile', async () => { await onSave({ displayName, bio, cycleStartDate }); setDisplayName(displayName.trim()); setBio(bio.trim()); setShowGoogleSavePrompt(false); }, 'Cambios guardados.')}>{busy === 'profile' ? <><LoaderCircle className="profile-spinner" size={17} />Guardando…</> : 'Guardar cambios'}</button></div>
        </section>

        <div className="profile-side-column" inert={!accountActionsEnabled || busy === 'google'}>
          {googleOnly ? <section className="profile-card" aria-labelledby="google-account-title">
            <div className="profile-card-heading"><span className="profile-card-icon"><KeyRound size={20} /></span><div><h2 id="google-account-title">Acceso con Google</h2><p>Google verifica tu identidad al entrar en Horizon.</p></div></div>
            <p className="profile-account-address">{user.email}</p>
            <p className="profile-account-note">Tu cuenta no tiene una contraseña de Horizon. Los cambios de correo, contraseña y la recuperación de acceso se gestionan en tu cuenta de Google.</p>
          </section> : <>
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
          </>}

          <section className="profile-card" aria-labelledby="data-title">
            <div className="profile-card-heading"><span className="profile-card-icon"><Download size={20} /></span><div><h2 id="data-title">Tus datos</h2><p>Descarga una copia legible y verificable.</p></div></div>
            <button type="button" className="btn-secondary profile-full-button" disabled={Boolean(busy)} onClick={() => void run('export', async () => deliverAccountExport(await buildAccountExport(user.id)), 'Exportación preparada.')}>{busy === 'export' ? <><LoaderCircle className="profile-spinner" size={17} />Preparando…</> : <><Download size={17} />Exportar mis datos</>}</button>
            <button type="button" className="profile-signout" disabled={Boolean(busy)} onClick={() => void run('signout', onSignOut)}><LogOut size={17} />Cerrar sesión en este dispositivo</button>
          </section>
        </div>
      </div>

      <section className="profile-card profile-danger" aria-labelledby="delete-title" inert={!accountActionsEnabled}>
        <div className="profile-card-heading"><span className="profile-card-icon"><ShieldAlert size={20} /></span><div><h2 id="delete-title">Eliminar cuenta</h2><p>Elimina tu perfil, wrappers, entradas, hitos y avatar de forma permanente.</p></div></div>
        {googleLinked && <div className="profile-google-confirmation">
          <p className="profile-account-note">{googleOnly ? 'Confirma tu identidad con Google antes de eliminar tu cuenta.' : 'Confirma tu identidad con Google o utiliza tu contraseña actual.'} Puede que Google te pida volver a iniciar sesión. Necesitamos una confirmación reciente para proteger tu cuenta.</p>
          <button type="button" className="btn-secondary" disabled={Boolean(busy) || !isOnline} onClick={() => void confirmWithGoogle()}>{busy === 'google' ? <><LoaderCircle className="profile-spinner" size={17} />Abriendo Google…</> : 'Confirmar identidad con Google'}</button>
          {googleRecentlyConfirmed && <p className="profile-account-note" role="status">Identidad confirmada. Todavía debes escribir ELIMINAR y pulsar el botón de eliminación.</p>}
          {googleConfirmationExpired && <p className="profile-account-note" role="status">La confirmación ha caducado. Vuelve a confirmar tu identidad con Google para continuar.</p>}
          {showGoogleSavePrompt && dirty && <div ref={googleSavePrompt} className="profile-google-save-prompt" tabIndex={-1} role="alert">
            <p>Tienes cambios de perfil sin guardar. Guárdalos antes de abrir Google para conservarlos.</p>
            <div className="profile-google-save-actions"><button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => setShowGoogleSavePrompt(false)}>Seguir editando</button><button type="button" className="btn-primary" disabled={Boolean(busy) || !isOnline || !cycleStartDate} onClick={() => void confirmWithGoogle(true)}>Guardar cambios y continuar con Google</button></div>
          </div>}
        </div>}
        <div className="profile-danger-fields">{!googleOnly && <label><span>Contraseña actual{googleLinked && googleRecentlyConfirmed ? ' (opcional tras confirmar con Google)' : ''}</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} /></label>}<label><span>Escribe ELIMINAR</span><input type="text" autoComplete="off" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} /></label></div>
        <button type="button" className="profile-delete-button" disabled={Boolean(busy) || !isOnline || (!googleRecentlyConfirmed && (googleOnly || !deletePassword)) || deleteConfirmation !== 'ELIMINAR'} onClick={() => void run('delete', async () => {
          if (!supabase) throw new Error('Servicio no disponible.');
          const useGoogleConfirmation = googleLinked && hasRecentGoogleReauthentication(user.id);
          if (!useGoogleConfirmation && (googleOnly || !deletePassword)) {
            setGoogleReauthenticationExpiresAt(0);
            setGoogleConfirmationExpired(true);
            throw new Error('La confirmación de Google ha caducado. Confirma tu identidad de nuevo antes de eliminar tu cuenta.');
          }
          const { error: invokeError } = await supabase.functions.invoke('delete-account', { body: {
            confirmation: deleteConfirmation,
            ...(!useGoogleConfirmation && { currentPassword: deletePassword }),
          } });
          if (invokeError instanceof FunctionsHttpError && invokeError.context instanceof Response && invokeError.context.status === 403) {
            let detail: unknown;
            try { detail = await invokeError.context.clone().json(); } catch { /* A response without a code must not invalidate a confirmed identity. */ }
            if (typeof detail === 'object' && detail !== null && 'code' in detail && detail.code === 'oauth_reauthentication_required') {
              clearGoogleReauthentication(user.id);
              setGoogleReauthenticationExpiresAt(0);
              setGoogleConfirmationExpired(true);
              throw new Error('Confirma tu identidad de nuevo con Google antes de eliminar tu cuenta.');
            }
          }
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
