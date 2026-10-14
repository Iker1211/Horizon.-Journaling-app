import React, { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, LogOut, Mail, ShieldCheck, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useDialog } from "../hooks/useDialog";
import { getAuthRedirectUrl } from "../utils/authRedirect";
import "../styles/auth.css";

export type AuthMode = "signin" | "signup" | "otp" | "forgot" | "update-password";
type CodePurpose = "signin" | "signup" | "recovery";

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

function describeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "El correo o la contraseña no son correctos. Revísalos o entra con un código por correo.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Confirma tu correo antes de entrar. También puedes solicitar un código por correo.";
  }
  if (code === "otp_expired" || /expired|invalid.*token/i.test(message)) {
    return "El código no es válido o ha vencido. Revísalo o solicita uno nuevo.";
  }
  if (/rate|seconds|too many/i.test(message)) {
    return "Espera un momento antes de intentarlo de nuevo.";
  }
  if (/fetch|network|connection/i.test(message)) {
    return "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.";
  }
  if (code === "user_already_exists" || /already registered/i.test(message)) {
    return "Ya existe una cuenta con este correo. Inicia sesión para continuar.";
  }
  if (code === "weak_password" || /password.*(weak|characters|length)/i.test(message)) {
    return "Usa una contraseña más segura, con al menos 6 caracteres, letras y números.";
  }
  if (code === "same_password") return "Elige una contraseña diferente a la actual.";
  if (code === "reauthentication_needed") return "Vuelve a iniciar sesión antes de cambiar tu contraseña.";
  if (code === "email_address_invalid") return "Ingresa un correo electrónico válido.";
  return "No pudimos completar la solicitud. Inténtalo de nuevo en un momento.";
}

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
  const requestVersion = useRef(0);
  const requestPending = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const dialogRef = useDialog(isOpen, onClose);

  // Ignore responses from a dismissed form; opening the modal creates a fresh form.
  useEffect(() => () => { requestVersion.current += 1; }, []);

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
    setNotice(resend ? "Te enviamos un nuevo código. Revisa también la carpeta de spam." : "Revisa tu correo para continuar. El mensaje puede tardar unos minutos.");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !isSupabaseConfigured) return;
    if (mode !== "update-password" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if ((mode === "signup" || mode === "update-password") && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (mode === "update-password" && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (mode === "otp" && codeSent && !/^\d{6}$/.test(code)) {
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
          setNotice("Revisa tu correo e ingresa el código de confirmación para activar tu cuenta.");
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
    otp: codeSent ? `Escribe aquí el código de seis dígitos enviado a ${email}. No necesitas abrir ningún enlace.` : "Te enviaremos un código para entrar sin contraseña.",
    forgot: "Verifica tu correo con un código y elige una nueva contraseña.",
    "update-password": "Usa al menos 6 caracteres. Combina letras y números para mayor seguridad.",
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
            <button className="auth-secondary" type="button" disabled={loading} onClick={() => navigate("update-password")}><LockKeyhole size={17} />Cambiar contraseña</button>
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
            <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
              <fieldset disabled={loading}>
                {mode !== "update-password" && !(mode === "otp" && codeSent) && <label className="auth-field" htmlFor="auth-email"><span>Correo electrónico</span><input id="auth-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="tu@correo.com" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
                {(mode === "signin" || mode === "signup" || mode === "update-password") && <label className="auth-field" htmlFor="auth-password"><span>{mode === "update-password" ? "Nueva contraseña" : "Contraseña"}</span><div className="auth-password-input"><input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Tu contraseña" : "Al menos 6 caracteres"} required minLength={mode === "signin" ? undefined : 6} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="auth-icon-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>}
                {mode === "update-password" && <label className="auth-field" htmlFor="auth-confirm"><span>Repite la nueva contraseña</span><input id="auth-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Escríbela una vez más" required minLength={6} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
                {mode === "signin" && <button type="button" className="auth-link auth-forgot" onClick={() => navigate("forgot")}>¿Olvidaste tu contraseña?</button>}
                {mode === "otp" && codeSent && <label className="auth-field" htmlFor="auth-code"><span>Código de verificación</span><input ref={codeInput} className="auth-code-input" id="auth-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="· · · · · ·" required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /><small>Puedes copiarlo desde el correo y pegarlo aquí.</small></label>}
                <button type="submit" className="auth-primary">{loading ? <><LoaderCircle size={18} className="auth-spinner" />Un momento…</> : <>{submitLabel}<ArrowRight size={18} /></>}</button>
              </fieldset>
            </form>
            {mode === "signin" && <button type="button" className="auth-secondary" disabled={loading} onClick={() => navigate("otp")}><Mail size={18} />Entrar con un código</button>}
            {mode === "otp" && codeSent && <div className="auth-code-actions"><button type="button" className="auth-link" disabled={loading || resendCooldown > 0} onClick={() => void runRequest(isCurrent => sendCode(codePurpose, isCurrent, true))}>{resendCooldown > 0 ? `Reenviar en ${resendCooldown} s` : "Reenviar código"}</button><button type="button" className="auth-link" disabled={loading} onClick={() => navigate(codePurpose === "recovery" ? "forgot" : codePurpose === "signup" ? "signup" : "otp")}>Cambiar correo</button></div>}
            {(mode === "otp" || mode === "forgot" || mode === "update-password") && <button type="button" className="auth-back auth-link" disabled={loading} onClick={() => navigate("signin")}><ArrowLeft size={16} />{user ? "Volver a tu cuenta" : "Volver al inicio de sesión"}</button>}
          </>
        )}
      </div>
    </div>
  );
};
