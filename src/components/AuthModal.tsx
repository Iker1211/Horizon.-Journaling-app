import React, { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, LogOut, Mail, ShieldCheck, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useDialog } from "../hooks/useDialog";
import { getGoogleAuthAvailability, isGoogleOnlyAccount, startGoogleSignIn } from "../services/googleAuth";
import { getAuthRedirectUrl } from "../utils/authRedirect";
import { describeAuthError, getCodeRequestNotice, isValidEmailCode, normalizeEmailCode, EMAIL_CODE_MIN_LENGTH, EMAIL_CODE_MAX_LENGTH, type CodePurpose } from "../utils/authFeedback";
import "../styles/auth.css";

export type AuthMode = "signin" | "signup" | "otp" | "forgot" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string | AuthMode;
  user: User | null;
  onSignOut: () => void | Promise<void>;
  onAuthSuccess?: () => void;
  initialError?: string | null;
}

const MODES: AuthMode[] = ["signin", "signup", "otp", "forgot", "update-password"];
const RESEND_COOLDOWN_SECONDS = 60;
type GoogleAvailability = "checking" | "enabled" | "disabled" | "failed";

const GoogleMark = () => <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.18v5.14h6.61c3.87-3.56 6.08-8.81 6.08-14.82Z" />
  <path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.51-4.97l-6.61-5.14c-1.83 1.23-4.18 1.96-6.9 1.96-5.31 0-9.81-3.59-11.42-8.42H5.75v5.3A20 20 0 0 0 24 44Z" />
  <path fill="#FBBC05" d="M12.58 27.43a12 12 0 0 1 0-6.86v-5.3H5.75a20 20 0 0 0 0 17.46l6.83-5.3Z" />
  <path fill="#EA4335" d="M24 12.15c3 0 5.69 1.03 7.81 3.05l5.86-5.86A19.64 19.64 0 0 0 24 4 20 20 0 0 0 5.75 15.27l6.83 5.3C14.19 15.74 18.69 12.15 24 12.15Z" />
</svg>;

export const AuthModal: React.FC<AuthModalProps> = props => props.isOpen
  ? <AuthModalContent key={props.initialMode ?? "signin"} {...props} />
  : null;

const AuthModalContent: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = "signin", user, onSignOut, onAuthSuccess, initialError = null }) => {
  const [mode, setMode] = useState<AuthMode>(MODES.includes(initialMode as AuthMode) ? initialMode as AuthMode : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [codePurpose, setCodePurpose] = useState<CodePurpose>("signin");
  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleAvailability, setGoogleAvailability] = useState<GoogleAvailability>("checking");
  const [googleAvailabilityAttempt, setGoogleAvailabilityAttempt] = useState(0);
  const [googlePending, setGooglePending] = useState(false);
  const requestVersion = useRef(0);
  const requestPending = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const dialogRef = useDialog(isOpen, onClose);

  // Ignore responses from a dismissed form; opening the modal creates a fresh form.
  useEffect(() => () => { requestVersion.current += 1; }, []);

  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured) return;
    const controller = new AbortController();
    void getGoogleAuthAvailability(controller.signal).then(enabled => {
      if (!controller.signal.aborted) setGoogleAvailability(enabled ? "enabled" : "disabled");
    }).catch(() => {
      if (!controller.signal.aborted) setGoogleAvailability("failed");
    });
    return () => controller.abort();
  }, [isOpen, googleAvailabilityAttempt]);

  useEffect(() => {
    if (!isOpen || resendCooldown === 0) return;
    const timer = window.setTimeout(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [isOpen, resendCooldown]);

  useEffect(() => {
    if (isOpen && codeSent && mode === "otp") codeInput.current?.focus();
  }, [isOpen, codeSent, mode]);

  const navigate = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setCode("");
    setCodeSent(false);
    setCodePurpose(next === "forgot" ? "recovery" : "signin");
  };

  const finishAuth = () => {
    setPassword("");
    setConfirmPassword("");
    onAuthSuccess?.();
    onClose();
  };

  const runRequest = async (request: (isCurrent: () => boolean) => Promise<void>) => {
    if (requestPending.current) return;
    const version = requestVersion.current;
    const isCurrent = () => requestVersion.current === version;
    requestPending.current = true;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await request(isCurrent);
    } catch (cause) {
      if (isCurrent()) setError(describeAuthError(cause));
    } finally {
      if (isCurrent()) {
        requestPending.current = false;
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = () => void runRequest(async isCurrent => {
    setGooglePending(true);
    setPassword("");
    setConfirmPassword("");
    try {
      await startGoogleSignIn();
      if (isCurrent()) setNotice("Continúa en Google. Al terminar volverás a Horizon. Si cancelas, puedes volver a intentarlo aquí.");
    } catch (cause) {
      if (!isCurrent()) return;
      const errorCode = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      if (errorCode === "oauth_cancelled" || (cause instanceof Error && cause.name === "AbortError")) {
        setNotice("Acceso con Google cancelado. Puedes volver a intentarlo o entrar con tu correo.");
      } else {
        setError("No pudimos iniciar el acceso con Google. Inténtalo otra vez o utiliza tu correo y contraseña.");
      }
    } finally {
      if (isCurrent()) setGooglePending(false);
    }
  });

  const sendCode = async (purpose: CodePurpose, isCurrent: () => boolean, resend = false) => {
    if (!supabase) return;
    const address = email.trim();
    const redirectUrl = getAuthRedirectUrl(purpose);
    const result = purpose === "recovery"
      ? await supabase.auth.resetPasswordForEmail(address, { redirectTo: redirectUrl })
      : purpose === "signup" && resend
        ? await supabase.auth.resend({ type: "signup", email: address, options: { emailRedirectTo: redirectUrl } })
        : await supabase.auth.signInWithOtp({
            email: address,
            options: { shouldCreateUser: false, emailRedirectTo: redirectUrl },
          });
    if (result.error) throw result.error;
    if (!isCurrent()) return;
    setEmail(address);
    setCodePurpose(purpose);
    setCodeSent(true);
    setCode("");
    setMode("otp");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setNotice(getCodeRequestNotice(purpose));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !isSupabaseConfigured) return;
    if (mode !== "update-password" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if ((mode === "signup" || mode === "update-password") && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (mode === "update-password" && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (mode === "otp" && codeSent && !isValidEmailCode(code)) {
      setError("Escribe el código completo que recibiste por correo.");
      return;
    }
    void runRequest(async isCurrent => {
      if (!supabase) return;
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        if (isCurrent()) finishAuth();
      } else if (mode === "signup") {
        const address = email.trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl("signup") },
        });
        if (authError) throw authError;
        if (!isCurrent()) return;
        if (data.session) {
          finishAuth();
        } else {
          setEmail(address);
          setPassword("");
          setCodePurpose("signup");
          setCodeSent(true);
          setMode("otp");
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setNotice(getCodeRequestNotice("signup"));
        }
      } else if (mode === "forgot" || (mode === "otp" && !codeSent)) {
        await sendCode(mode === "forgot" ? "recovery" : "signin", isCurrent);
      } else if (mode === "otp") {
        const otpType = codePurpose === "recovery" ? "recovery" : codePurpose === "signup" ? "signup" : "email";
        const { error: authError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: otpType });
        if (authError) throw authError;
        if (!isCurrent()) return;
        if (codePurpose === "recovery") {
          setMode("update-password");
          setCode("");
          setPassword("");
          setNotice("Correo verificado. Ahora puedes elegir una nueva contraseña.");
        } else finishAuth();
      } else if (mode === "update-password") {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        if (isCurrent()) {
          setPassword("");
          setConfirmPassword("");
          finishAuth();
        }
      }
    });
  };

  if (!isOpen) return null;

  const isAccount = Boolean(user) && mode !== "update-password" && !(mode === "otp" && codePurpose === "recovery");
  const googleOnly = user ? isGoogleOnlyAccount(user) : false;
  const showGoogleOption = !isAccount && mode !== "update-password";
  const heading = isAccount ? "Tu cuenta" : {
    signin: "Tu espacio, a tu ritmo.",
    signup: "Empieza tu próximo capítulo.",
    otp: codeSent ? (codePurpose === "recovery" ? "Confirma que eres tú" : codePurpose === "signup" ? "Activa tu cuenta" : "Revisa tu correo") : "Entra con un código",
    forgot: "Recupera tu acceso",
    "update-password": "Una nueva contraseña",
  }[mode];
  const description = isAccount ? "Tus proyectos y tus ideas, contigo." : {
    signin: "Inicia sesión para continuar con tus wrappers y bitácoras.",
    signup: "Crea una cuenta para organizar tus proyectos en Horizon.",
    otp: codeSent ? `Introduce el código de verificación del correo de Horizon para ${email}.` : "Solicita un código para entrar sin contraseña.",
    forgot: "Verifica tu correo con un código y elige una nueva contraseña.",
    "update-password": "Usa al menos 8 caracteres. Combina letras y números para mayor seguridad.",
  }[mode];
  const submitLabel = {
    signin: "Iniciar sesión",
    signup: "Crear cuenta",
    otp: codeSent ? "Verificar código" : "Enviar código",
    forgot: "Enviar código de recuperación",
    "update-password": "Guardar contraseña",
  }[mode];

  return (
    <div className="auth-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description" tabIndex={-1}>
        <header className="auth-header">
          <span className="auth-brand"><span className="auth-brand-mark" aria-hidden="true"><ShieldCheck size={18} /></span>Horizon</span>
          <button type="button" className="auth-icon-button" onClick={onClose} aria-label="Cerrar"><X size={21} /></button>
        </header>

        <div className="auth-intro">
          <span className="auth-eyebrow">{isAccount ? "TU ESPACIO" : "TODO EMPIEZA AQUÍ"}</span>
          <h2 id="auth-title">{heading}</h2>
          <p id="auth-description">{description}</p>
        </div>

        {error && <div className="auth-feedback auth-feedback--error" role="alert"><AlertCircle size={18} /><p>{error}</p></div>}
        {notice && <div className="auth-feedback" role="status"><CheckCircle2 size={18} /><p>{notice}</p></div>}

        {isAccount ? (
          <div className="auth-account">
            <div className="auth-account-card"><Mail size={21} /><div><span>Sesión iniciada</span><strong>{user?.email}</strong></div></div>
            {googleOnly ? <p className="auth-account-help">Entras con Google. Tu contraseña y la recuperación de acceso se gestionan en tu cuenta de Google.</p> : <button className="auth-secondary" type="button" disabled={loading} onClick={() => navigate("update-password")}><LockKeyhole size={17} />Cambiar contraseña</button>}
            <button className="auth-secondary auth-signout" type="button" disabled={loading} onClick={() => void runRequest(async isCurrent => { await onSignOut(); if (isCurrent()) onClose(); })}>
              {loading ? <LoaderCircle size={18} className="auth-spinner" /> : <LogOut size={18} />}{loading ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        ) : !isSupabaseConfigured ? (
          <div className="auth-unavailable"><LockKeyhole size={24} /><h3>El acceso no está disponible</h3><p>No podemos iniciar sesión en este momento. Inténtalo más tarde.</p><button type="button" className="auth-secondary" onClick={onClose}>Volver a Horizon</button></div>
        ) : (
          <>
            {(mode === "signin" || mode === "signup") && <div className="auth-switch" aria-label="Opciones de acceso">
              <button type="button" aria-pressed={mode === "signin"} disabled={loading} onClick={() => navigate("signin")}>Iniciar sesión</button>
              <button type="button" aria-pressed={mode === "signup"} disabled={loading} onClick={() => navigate("signup")}>Crear cuenta</button>
            </div>}
            {showGoogleOption && googleAvailability === "enabled" && <div className="auth-google-option">
              <button type="button" className="auth-secondary auth-google-button" disabled={loading} onClick={handleGoogleSignIn} aria-busy={googlePending}>
                {googlePending ? <LoaderCircle size={20} className="auth-spinner" /> : <GoogleMark />}
                {googlePending ? "Abriendo Google…" : "Continuar con Google"}
              </button>
              {mode === "forgot" && <p className="auth-account-help">Si creaste tu cuenta con Google, entra con ese botón. Google gestiona su contraseña; el código de abajo recupera el acceso con correo de Horizon.</p>}
              <div className="auth-divider"><span>{mode === "forgot" ? "o recupera con tu correo" : mode === "otp" ? "o utiliza un código por correo" : "o con tu correo"}</span></div>
            </div>}
            {showGoogleOption && googleAvailability === "checking" && <p className="auth-provider-status" role="status">Comprobando opciones de acceso…</p>}
            {showGoogleOption && googleAvailability === "failed" && <div className="auth-provider-status"><p role="status">No pudimos comprobar el acceso con Google. Puedes continuar con tu correo.</p><button type="button" className="auth-link" disabled={loading} onClick={() => { setGoogleAvailability("checking"); setGoogleAvailabilityAttempt(attempt => attempt + 1); }}>Reintentar Google</button></div>}
            <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
              <fieldset disabled={loading}>
                {mode !== "update-password" && !(mode === "otp" && codeSent) && <label className="auth-field" htmlFor="auth-email"><span>Correo electrónico</span><input id="auth-email" name="email" type="email" inputMode="email" autoComplete={mode === "signin" ? "username" : "email"} autoCapitalize="none" spellCheck={false} placeholder="tu@correo.com" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
                {(mode === "signin" || mode === "signup" || mode === "update-password") && <label className="auth-field" htmlFor="auth-password"><span>{mode === "update-password" ? "Nueva contraseña" : "Contraseña"}</span><div className="auth-password-input"><input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Tu contraseña" : "Al menos 8 caracteres"} required minLength={mode === "signin" ? undefined : 8} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="auth-icon-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>}
                {mode === "update-password" && <label className="auth-field" htmlFor="auth-confirm"><span>Repite la nueva contraseña</span><input id="auth-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Escríbela una vez más" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
                {mode === "signin" && <button type="button" className="auth-link auth-forgot" onClick={() => navigate("forgot")}>¿Olvidaste tu contraseña?</button>}
                {mode === "otp" && codeSent && <label className="auth-field" htmlFor="auth-code"><span>Código de verificación</span><input ref={codeInput} className={`auth-code-input ${code.length > 6 ? 'auth-code-input--long' : ''}`} id="auth-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={EMAIL_CODE_MIN_LENGTH} maxLength={EMAIL_CODE_MAX_LENGTH} placeholder="Tu código" required value={code} onChange={event => setCode(normalizeEmailCode(event.target.value))} /><small>Pega el código completo que aparece en el correo.</small></label>}
                <button type="submit" className="auth-primary">{loading && !googlePending ? <><LoaderCircle size={18} className="auth-spinner" />Un momento…</> : <>{submitLabel}<ArrowRight size={18} /></>}</button>
              </fieldset>
            </form>
            {mode === "signin" && <button type="button" className="auth-secondary" disabled={loading} onClick={() => navigate("otp")}><Mail size={18} />Entrar con un código</button>}
            {mode === "otp" && codeSent && <div className="auth-code-actions"><button type="button" className="auth-link" disabled={loading || resendCooldown > 0} onClick={() => void runRequest(isCurrent => sendCode(codePurpose, isCurrent, true))}>{resendCooldown > 0 ? `Reenviar en ${resendCooldown} s` : "Reenviar código"}</button><button type="button" className="auth-link" disabled={loading} onClick={() => navigate(codePurpose === "recovery" ? "forgot" : codePurpose === "signup" ? "signup" : "otp")}>Cambiar correo</button></div>}
            {mode === "otp" && codeSent && <div className="auth-delivery-help"><p>¿No llega? Revisa la dirección y la carpeta de spam. Si ya habías creado una cuenta, puedes iniciar sesión o recuperar el acceso.</p>{codePurpose !== "recovery" && <button type="button" className="auth-link" disabled={loading} onClick={() => navigate("forgot")}>Recuperar acceso</button>}</div>}
            {(mode === "otp" || mode === "forgot" || mode === "update-password") && <button type="button" className="auth-back auth-link" disabled={loading} onClick={() => navigate("signin")}><ArrowLeft size={16} />{user ? "Volver a tu cuenta" : "Volver al inicio de sesión"}</button>}
          </>
        )}
      </div>
    </div>
  );
};
