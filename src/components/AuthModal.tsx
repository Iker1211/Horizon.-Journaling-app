import React, { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { checkSupabaseHealth, syncLocalToSupabase, SupabaseHealthCheck } from "../services/db";
import {
  X,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Cloud,
  RefreshCw,
  Database,
  LogOut,
  Check,
  KeyRound,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { FireGoatLogo } from "./FireGoatLogo";

export type AuthMode = "signin" | "signup" | "magiclink" | "forgot" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  user: any;
  onSignOut: () => void;
  onAuthSuccess?: () => void;
}

const REGISTERED_HINT_EMAIL = "velezlucasiker1@gmail.com";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "signin",
  user,
  onSignOut,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Health check state
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheck | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const runHealthCheck = useCallback(async () => {
    if (!user) return;
    setCheckingHealth(true);
    const res = await checkSupabaseHealth(user.id);
    setHealthStatus(res);
    setCheckingHealth(false);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      if (user) {
        runHealthCheck();
      }
    }
  }, [isOpen, initialMode, user, runHealthCheck]);

  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    await syncLocalToSupabase(user.id);
    await runHealthCheck();
    setSyncing(false);
    setSuccessMsg("¡Datos sincronizados exitosamente con Supabase!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase aún no está configurado con tus credenciales en .env.local.");
      return;
    }

    // Validation: prevent entering "2027" or plain non-email text
    const cleanEmail = email.trim();
    if (mode !== "update-password") {
      if (!cleanEmail.includes("@") || cleanEmail.toLowerCase() === "2027") {
        setErrorMsg(
          "Debes ingresar un correo electrónico válido (ej: velezlucasiker1@gmail.com). El usuario \"2027\" guardado en Chrome es el nombre del proyecto de base de datos, no un correo de inicio de sesión."
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSuccessMsg("¡Cuenta creada e iniciada con éxito!");
          setTimeout(() => {
            onAuthSuccess?.();
            onClose();
          }, 1200);
        } else {
          setSuccessMsg(
            "¡Cuenta registrada! Por favor revisa tu correo electrónico para confirmar tu cuenta y poder ingresar."
          );
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "Credenciales inválidas. Recuerda que no debes usar \"2027\" como usuario. Usa tu correo velezlucasiker1@gmail.com. Si no recuerdas la contraseña de este usuario, utiliza la opción de \"Enlace Mágico\" para entrar sin contraseña."
            );
          }
          throw error;
        }
        setSuccessMsg("¡Sesión iniciada con éxito!");
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 800);
      } else if (mode === "magiclink") {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccessMsg(
          `¡Enlace mágico enviado a ${cleanEmail}! Abre tu Gmail o cliente de correo y haz clic en el enlace para iniciar sesión al instante sin contraseña.`
        );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg(
          `¡Instrucciones enviadas a ${cleanEmail}! Revisa tu correo y haz clic en el enlace para definir una nueva contraseña.`
        );
      } else if (mode === "update-password") {
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }
        const { error } = await supabase.auth.updateUser({
          password,
        });
        if (error) throw error;
        setSuccessMsg("¡Contraseña actualizada correctamente! Ahora puedes iniciar sesión con ella.");
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FireGoatLogo size={28} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
              Horizon Cloud Sync
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User is Authenticated: Show Cloud Verification Dashboard */}
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
              }}
            >
              <CheckCircle2 size={22} color="var(--color-success)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-ink)" }}>
                  Sesión activa con Supabase
                </div>
                <div style={{ fontSize: 13, color: "var(--color-body)" }}>{user.email}</div>
              </div>
            </div>

            {successMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(34, 197, 94, 0.08)",
                  color: "var(--color-ink)",
                  fontSize: 13,
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Check size={16} color="var(--color-success)" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Cloud Verification Card */}
            <div
              style={{
                backgroundColor: "var(--color-surface-soft)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Database size={16} color="var(--color-brand-teal)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Registros verificados en PostgreSQL:
                  </span>
                </div>
                <button
                  className="btn-secondary btn-sm"
                  onClick={runHealthCheck}
                  disabled={checkingHealth}
                  style={{ height: 28, padding: "2px 8px", fontSize: 11 }}
                  title="Consultar Supabase ahora"
                >
                  <RefreshCw size={12} className={checkingHealth ? "clay-float-slow" : ""} />
                  <span>{checkingHealth ? "Verificando..." : "Recontar"}</span>
                </button>
              </div>

              {healthStatus?.connected ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      border: "1px solid var(--color-hairline)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>
                      {healthStatus.themesCount}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Wrappers
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      border: "1px solid var(--color-hairline)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>
                      {healthStatus.blogsCount}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Bitácoras
                    </div>
                  </div>
                </div>
              ) : healthStatus?.error ? (
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#fef2f2",
                    color: "var(--color-error)",
                    fontSize: 12,
                    border: "1px solid #fecaca",
                  }}
                >
                  Aviso de conexión: {healthStatus.error}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--color-muted)", textAlign: "center" }}>
                  Consultando base de datos en Supabase...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
              <button
                className="btn-secondary btn-sm"
                onClick={handleManualSync}
                disabled={syncing}
                style={{ flex: 1 }}
              >
                <Cloud size={14} />
                <span>{syncing ? "Sincronizando..." : "Subir datos locales a Supabase"}</span>
              </button>

              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{ color: "var(--color-error)" }}
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : !isSupabaseConfigured ? (
          <div
            style={{
              backgroundColor: "var(--color-surface-soft)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              border: "1px solid var(--color-hairline)",
              textAlign: "center",
            }}
          >
            <Cloud size={36} color="var(--color-brand-teal)" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              Conecta tu base de datos Supabase
            </h4>
            <p className="body-sm" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Para activar la sincronización en la nube multi-dispositivo, crea tu archivo{" "}
              <code>.env.local</code> con tus claves de proyecto de Supabase.
            </p>
            <div
              style={{
                background: "#ffffff",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                textAlign: "left",
                fontFamily: "monospace",
                border: "1px solid var(--color-hairline)",
              }}
            >
              VITE_SUPABASE_URL=https://tu-id.supabase.co
              <br />
              VITE_SUPABASE_ANON_KEY=tu-anon-key
            </div>
            <p className="body-sm" style={{ fontSize: 12, marginTop: 12, color: "var(--color-muted)" }}>
              Por ahora, tus datos están a salvo guardados localmente.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Header depending on mode */}
            <div>
              {mode !== "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 8,
                    padding: 0,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Volver al inicio de sesión</span>
                </button>
              )}

              <h3 className="title-md" style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>
                {mode === "signup" && "Crear cuenta en Horizon"}
                {mode === "signin" && "Iniciar Sesión en Horizon"}
                {mode === "magiclink" && "Acceso con Enlace Mágico"}
                {mode === "forgot" && "Restablecer Contraseña"}
                {mode === "update-password" && "Definir Nueva Contraseña"}
              </h3>
              <p className="body-sm" style={{ fontSize: 13 }}>
                {mode === "signup" &&
                  "Sincroniza tus temas, bitácoras y metas en Supabase PostgreSQL."}
                {mode === "signin" &&
                  "Ingresa con tu correo electrónico para sincronizar tu base de datos."}
                {mode === "magiclink" &&
                  "Te enviaremos un enlace a tu correo para ingresar al instante sin contraseñas."}
                {mode === "forgot" &&
                  "Ingresa tu correo para enviarte un enlace seguro de restablecimiento."}
                {mode === "update-password" &&
                  "Escribe tu nueva contraseña para guardarla en tu cuenta."}
              </p>
            </div>

            {/* Explanatory callout for Chrome saved user 2027 */}
            {mode !== "update-password" && (
              <div
                style={{
                  backgroundColor: "var(--color-surface-soft)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  border: "1px solid var(--color-hairline)",
                  fontSize: 12,
                  color: "var(--color-body)",
                  lineHeight: 1.45,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <KeyRound size={14} color="var(--color-brand-ochre)" />
                  <span>¿Por qué Chrome guardó el usuario \"2027\"?</span>
                </div>
                <div>
                  \"2027\" es el <strong>nombre del proyecto</strong> en Supabase, y la contraseña sugerida
                  por Google era la clave maestra de la base de datos PostgreSQL. Tu cuenta de acceso a la
                  nube utiliza tu correo electrónico:
                </div>
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEmail(REGISTERED_HINT_EMAIL)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--color-hairline)",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-brand-teal)",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Mail size={12} />
                    <span>Usar {REGISTERED_HINT_EMAIL}</span>
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "#fef2f2",
                  color: "var(--color-error)",
                  fontSize: 13,
                  border: "1px solid #fecaca",
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(34, 197, 94, 0.08)",
                  color: "var(--color-ink)",
                  fontSize: 13,
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Email Field (for signin, signup, magiclink, forgot) */}
            {mode !== "update-password" && (
              <div>
                <label
                  htmlFor="auth-email"
                  className="caption-uppercase"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Correo Electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-muted)",
                    }}
                  />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username email"
                    className="input-text"
                    style={{ paddingLeft: 38 }}
                    placeholder={REGISTERED_HINT_EMAIL}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Password Field (for signin, signup, update-password) */}
            {(mode === "signin" || mode === "signup" || mode === "update-password") && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="auth-password"
                    className="caption-uppercase"
                    style={{ display: "block", marginBottom: 0 }}
                  >
                    {mode === "update-password" ? "Nueva Contraseña" : "Contraseña"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-muted)",
                        fontSize: 12,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-muted)",
                    }}
                  />
                  <input
                    id="auth-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={
                      mode === "signup" || mode === "update-password"
                        ? "new-password"
                        : "current-password"
                    }
                    className="input-text"
                    style={{ paddingLeft: 38 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Field (only for update-password) */}
            {mode === "update-password" && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="caption-uppercase"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Confirmar Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-muted)",
                    }}
                  />
                  <input
                    id="auth-confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="input-text"
                    style={{ paddingLeft: 38 }}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary clay-button-interactive"
              style={{ marginTop: 4 }}
            >
              {loading
                ? "Conectando..."
                : mode === "signin"
                ? "Iniciar Sesión"
                : mode === "signup"
                ? "Registrarme y Sincronizar"
                : mode === "magiclink"
                ? "Enviar Enlace Mágico"
                : mode === "forgot"
                ? "Enviar Instrucciones por Correo"
                : "Guardar Nueva Contraseña"}
            </button>

            {/* Alternative Actions in Sign-in mode */}
            {mode === "signin" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  borderTop: "1px solid var(--color-hairline)",
                  paddingTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("magiclink");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="btn-secondary btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    height: 40,
                  }}
                >
                  <Sparkles size={14} color="var(--color-brand-ochre)" />
                  <span>Entrar sin contraseña con Enlace Mágico</span>
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-muted)",
                      fontSize: 13,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ¿No tienes cuenta? Regístrate aquí
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  ¿Ya tienes una cuenta? Inicia sesión aquí
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
