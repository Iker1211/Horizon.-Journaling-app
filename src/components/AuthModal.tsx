import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { checkSupabaseHealth, syncSmartData, syncLocalToSupabase, SupabaseHealthCheck } from "../services/db";
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
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { FireGoatLogo } from "./FireGoatLogo";

export type AuthMode = "signin" | "signup" | "otp" | "forgot" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string | AuthMode;
  user: User | null | any;
  onSignOut: () => void;
  onAuthSuccess?: () => void;
}

const REGISTERED_HINT_EMAIL = "velezlucasiker1@gmail.com";
const RESEND_COOLDOWN_SECONDS = 60;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "signin",
  user,
  onSignOut,
  onAuthSuccess,
}) => {
  // Navigation mode
  const [mode, setMode] = useState<AuthMode>((initialMode as AuthMode) || "signin");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP 6-digit code state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status and feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cloud Health check state (when authenticated)
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheck | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Health check query
  const runHealthCheck = useCallback(async () => {
    if (!user) return;
    setCheckingHealth(true);
    const res = await checkSupabaseHealth(user.id);
    setHealthStatus(res);
    setCheckingHealth(false);
  }, [user]);

  // Sync mode with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMode && (initialMode === "signin" || initialMode === "signup" || initialMode === "otp" || initialMode === "forgot" || initialMode === "update-password")) {
        setMode(initialMode as AuthMode);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      if (user) {
        runHealthCheck();
      }
    }
  }, [isOpen, initialMode, user, runHealthCheck]);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first OTP input when transitioning to OTP code entry
  useEffect(() => {
    if (mode === "otp" && otpSent) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode, otpSent]);

  // Manual cloud sync handler (authenticated)
  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    setErrorMsg(null);
    try {
      await syncLocalToSupabase(user.id);
      await runHealthCheck();
      setSuccessMsg("¡Datos sincronizados exitosamente con Supabase PostgreSQL!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al sincronizar con la nube.");
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  // Validation helper
  const getCleanEmail = (): string => {
    const clean = email.trim();
    if (!clean || !clean.includes("@") || clean.toLowerCase() === "2027") {
      throw new Error(
        "Debes ingresar un correo electrónico válido (ej: velezlucasiker1@gmail.com). Evita usar \"2027\" que es el nombre del proyecto de base de datos."
      );
    }
    return clean;
  };

  // Trigger post-auth cloud synchronization and celebrate
  const handleAuthSuccessCelebration = async (userId: string, successMessage: string) => {
    try {
      await syncSmartData(userId);
    } catch (syncErr) {
      console.warn("Smart sync error on auth success:", syncErr);
    }

    setSuccessMsg(successMessage);

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    setTimeout(() => {
      onAuthSuccess?.();
      onClose();
    }, 1100);
  };

  // 1. Direct Password Login (SIN REDIRECCIÓN, DIRECTO CON SUPABASE)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado en el cliente.");
      return;
    }

    let cleanEmail = "";
    try {
      cleanEmail = getCleanEmail();
    } catch (valErr: any) {
      setErrorMsg(valErr.message);
      return;
    }

    if (!password) {
      setErrorMsg("Ingresa tu contraseña para continuar.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          throw new Error(
            "Credenciales incorrectas. Verifica tu correo y contraseña. Si no recuerdas tu contraseña, puedes usar la pestaña \"Código por Correo (OTP)\" para entrar directamente."
          );
        }
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error(
            "Tu correo aún no ha sido confirmado. Puedes ingresar directamente solicitando un código en la pestaña \"Código por Correo (OTP)\"."
          );
        }
        throw error;
      }

      if (data?.user) {
        await handleAuthSuccessCelebration(
          data.user.id,
          "¡Sesión iniciada con éxito! Sincronizando con la nube..."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Account Signup (SIN REDIRECCIÓN A LOCALHOST)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado en el cliente.");
      return;
    }

    let cleanEmail = "";
    try {
      cleanEmail = getCleanEmail();
    } catch (valErr: any) {
      setErrorMsg(valErr.message);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Direct registration without redirecting to localhost
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data?.session && data.user) {
        // Email confirmations disabled: immediate login
        await handleAuthSuccessCelebration(
          data.user.id,
          "¡Cuenta creada e iniciada con éxito!"
        );
      } else {
        // Confirmation required: switch to OTP mode so user enters code directly without link
        setOtpSent(true);
        setMode("otp");
        setSuccessMsg(
          "¡Cuenta registrada! Te enviamos un código de verificación por correo. Ingrésalo a continuación para activar tu cuenta."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Send 6-digit OTP Code (SIN REDIRECCIÓN A LOCALHOST)
  const handleSendOtp = async (targetEmail?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado en el cliente.");
      return;
    }

    const emailToSend = (targetEmail || email).trim();
    if (!emailToSend || !emailToSend.includes("@") || emailToSend.toLowerCase() === "2027") {
      setErrorMsg("Ingresa un correo electrónico válido para recibir el código.");
      return;
    }

    setLoading(true);

    try {
      // NOTE: We deliberately do NOT pass emailRedirectTo to avoid localhost redirects.
      // The user will enter the 6-digit code directly in the app.
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("seconds")) {
          throw new Error("Por seguridad, debes esperar antes de solicitar otro código. Intenta de nuevo en un momento.");
        }
        throw error;
      }

      setEmail(emailToSend);
      setOtpSent(true);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccessMsg(`¡Código numérico enviado a ${emailToSend}! Ingrésalo abajo.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify 6-digit OTP Code (DIRECTO IN-APP CON SUPABASE)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado.");
      return;
    }

    const token = (codeToVerify || otpDigits.join("")).trim();

    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setErrorMsg("El código de verificación debe contener exactamente 6 dígitos numéricos.");
      return;
    }

    setLoading(true);

    try {
      // In-app direct OTP token verification
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (error) {
        if (error.message.toLowerCase().includes("expired") || error.message.toLowerCase().includes("invalid")) {
          throw new Error("El código de verificación es incorrecto o ha expirado. Por favor verifica o solicita uno nuevo.");
        }
        throw error;
      }

      if (data?.user) {
        await handleAuthSuccessCelebration(
          data.user.id,
          "¡Código verificado con éxito! Sesión iniciada."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers (Auto-advance, backspace, paste)
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    const char = cleanVal.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const completeToken = nextDigits.join("");
    if (completeToken.length === 6 && !nextDigits.includes("")) {
      handleVerifyOtp(completeToken);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = "";
        setOtpDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (pasteData.length > 0) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pasteData[i] || "";
      }
      setOtpDigits(nextDigits);
      
      const lastIndex = Math.min(pasteData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      if (pasteData.length >= 6) {
        handleVerifyOtp(pasteData.slice(0, 6));
      }
    }
  };

  // 5. Update Password (IN-APP)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      if (data?.user) {
        await handleAuthSuccessCelebration(
          data.user.id,
          "¡Contraseña actualizada correctamente! Sesión activa."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 490, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FireGoatLogo size={28} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
              Horizon Cloud Sync
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ======================================================== */}
        {/* 1. USUARIO AUTENTICADO: Panel de Sincronización en Nube */}
        {/* ======================================================== */}
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
              <CheckCircle2 size={22} color="var(--color-success)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-ink)" }}>
                  Sesión activa con Supabase
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-body)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
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

            {/* Cloud Health Card */}
            <div
              style={{
                backgroundColor: "var(--color-surface-soft)",
                borderRadius: "var(--radius-lg)",
                padding: 18,
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
                    Registros en PostgreSQL (Nube):
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
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      border: "1px solid var(--color-hairline)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
                      {healthStatus.themesCount}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Wrappers
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      border: "1px solid var(--color-hairline)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
                      {healthStatus.blogsCount}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
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

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 4 }}>
              <button
                className="btn-secondary btn-sm"
                onClick={handleManualSync}
                disabled={syncing}
                style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Cloud size={15} />
                <span>{syncing ? "Sincronizando..." : "Sincronizar a la nube"}</span>
              </button>

              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{
                  color: "var(--color-error)",
                  height: 42,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : !isSupabaseConfigured ? (
          /* ======================================================== */
          /* 2. SUPABASE NO CONFIGURADO                               */
          /* ======================================================== */
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
              Para activar la sincronización en la nube, verifica tus claves de proyecto de Supabase.
            </p>
          </div>
        ) : (
          /* ======================================================== */
          /* 3. USUARIO NO AUTENTICADO: MODAL MULTI-MODO DIRECTO     */
          /* ======================================================== */
          <div>
            {/* Navegación por pestañas directas (Como estaba antes + Código OTP) */}
            {mode !== "update-password" && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: 4,
                  backgroundColor: "var(--color-surface-soft)",
                  borderRadius: "var(--radius-pill)",
                  marginBottom: 18,
                  border: "1px solid var(--color-hairline)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    backgroundColor: mode === "signin" ? "#ffffff" : "transparent",
                    color: mode === "signin" ? "var(--color-ink)" : "var(--color-muted)",
                    fontWeight: mode === "signin" ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: mode === "signin" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  Iniciar Sesión
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("otp");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    backgroundColor: mode === "otp" ? "#ffffff" : "transparent",
                    color: mode === "otp" ? "var(--color-ink)" : "var(--color-muted)",
                    fontWeight: mode === "otp" ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: mode === "otp" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  <Sparkles size={13} color="var(--color-brand-ochre)" />
                  <span>Código (OTP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    backgroundColor: mode === "signup" ? "#ffffff" : "transparent",
                    color: mode === "signup" ? "var(--color-ink)" : "var(--color-muted)",
                    fontWeight: mode === "signup" ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: mode === "signup" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Subtítulo descriptivo */}
            <div style={{ marginBottom: 14 }}>
              <h3 className="title-md" style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>
                {mode === "signin" && "Iniciar Sesión en Horizon"}
                {mode === "signup" && "Crear Cuenta en Horizon"}
                {mode === "otp" && (otpSent ? "Introduce tu código de 6 dígitos" : "Acceso con código por correo")}
                {mode === "forgot" && "Recuperar Contraseña"}
                {mode === "update-password" && "Definir Nueva Contraseña"}
              </h3>
              <p className="body-sm" style={{ fontSize: 13, color: "var(--color-body)" }}>
                {mode === "signin" && "Ingresa con tu correo y contraseña directo a Supabase. Sin redirecciones."}
                {mode === "signup" && "Crea tu cuenta para sincronizar tus Wrappers y bitácoras en PostgreSQL."}
                {mode === "otp" && (otpSent ? `Ingresa el código que enviamos a ${email} para entrar.` : "Recibe un código numérico en tu correo e ingrésalo en la app sin hacer clic en enlaces.")}
                {mode === "forgot" && "Ingresa tu correo para recibir las instrucciones seguras."}
                {mode === "update-password" && "Escribe tu nueva contraseña para asegurarla en Supabase."}
              </p>
            </div>

            {/* Quick Fill Button */}
            {mode !== "update-password" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface-soft)",
                  border: "1px solid var(--color-hairline)",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-body)" }}>
                  <ShieldCheck size={14} color="var(--color-brand-teal)" />
                  <span>Tu cuenta principal:</span>
                </div>
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
                  <span>{REGISTERED_HINT_EMAIL}</span>
                </button>
              </div>
            )}

            {/* Mensajes de Feedback */}
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
                  marginBottom: 14,
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
                  marginBottom: 14,
                }}
              >
                <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{successMsg}</div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* MODO A: INICIAR SESIÓN CON EMAIL Y CONTRASEÑA                    */}
            {/* ----------------------------------------------------------------- */}
            {mode === "signin" && (
              <form onSubmit={handlePasswordSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Email */}
                <div>
                  <label htmlFor="auth-signin-email" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
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
                      id="auth-signin-email"
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="username email"
                      className="input-text"
                      style={{ paddingLeft: 38 }}
                      placeholder="ej: velezlucasiker1@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label htmlFor="auth-signin-password" className="caption-uppercase" style={{ display: "block", marginBottom: 0 }}>
                      Contraseña
                    </label>
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
                      id="auth-signin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      className="input-text"
                      style={{ paddingLeft: 38, paddingRight: 40 }}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-muted)",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Botón de envío directo */}
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="btn-primary clay-button-interactive"
                  style={{
                    marginTop: 6,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="clay-float-slow" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>

                {/* Alternativa rápida: OTP */}
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("otp");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--color-brand-teal)",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} color="var(--color-brand-ochre)" />
                    <span>¿Prefieres entrar sin contraseña? Usa código por correo</span>
                  </button>
                </div>
              </form>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* MODO B: CÓDIGO POR CORREO (OTP 6 DÍGITOS - CERO REDIRECCIONES)   */}
            {/* ----------------------------------------------------------------- */}
            {mode === "otp" && (
              <div>
                {!otpSent ? (
                  /* Paso 1: Enviar código */
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSendOtp();
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 14 }}
                  >
                    <div>
                      <label htmlFor="auth-otp-email" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
                        Enviar código a tu correo
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
                          id="auth-otp-email"
                          type="email"
                          required
                          inputMode="email"
                          autoComplete="email"
                          className="input-text"
                          style={{ paddingLeft: 38 }}
                          placeholder="ej: velezlucasiker1@gmail.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="btn-primary clay-button-interactive"
                      style={{
                        marginTop: 6,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="clay-float-slow" />
                          <span>Enviando código...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          <span>Enviar código numérico de 6 dígitos</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Paso 2: Introducir casillas de 6 dígitos */
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setErrorMsg(null);
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
                          padding: 0,
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>Cambiar correo ({email})</span>
                      </button>
                    </div>

                    {/* Cuadrícula de 6 dígitos para celular y web */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                    >
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={digit}
                          onChange={e => handleDigitChange(index, e.target.value)}
                          onKeyDown={e => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          style={{
                            width: "14%",
                            maxWidth: 54,
                            height: 54,
                            fontSize: 22,
                            fontWeight: 800,
                            textAlign: "center",
                            borderRadius: "var(--radius-md)",
                            border: digit
                              ? "2px solid var(--color-ink)"
                              : "1px solid var(--color-hairline)",
                            backgroundColor: "var(--color-canvas)",
                            outline: "none",
                            boxShadow: digit ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        />
                      ))}
                    </div>

                    {/* Botón de verificar */}
                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={loading || otpDigits.join("").length !== 6}
                      className="btn-primary clay-button-interactive"
                      style={{
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="clay-float-slow" />
                          <span>Verificando código...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Verificar e Iniciar Sesión</span>
                        </>
                      )}
                    </button>

                    {/* Reenviar código */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingTop: 8,
                        borderTop: "1px solid var(--color-hairline)",
                      }}
                    >
                      {resendCooldown > 0 ? (
                        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
                          Reenviar código disponible en <strong>{resendCooldown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={loading}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--color-brand-teal)",
                            textDecoration: "underline",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <RefreshCw size={13} />
                          <span>¿No recibiste el correo? Reenviar código</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* MODO C: REGISTRARSE CON EMAIL Y CONTRASEÑA                       */}
            {/* ----------------------------------------------------------------- */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Email */}
                <div>
                  <label htmlFor="auth-signup-email" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
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
                      id="auth-signup-email"
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="username email"
                      className="input-text"
                      style={{ paddingLeft: 38 }}
                      placeholder="ej: velezlucasiker1@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="auth-signup-password" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
                    Contraseña (mínimo 6 caracteres)
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
                      id="auth-signup-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-text"
                      style={{ paddingLeft: 38, paddingRight: 40 }}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-muted)",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || password.length < 6}
                  className="btn-primary clay-button-interactive"
                  style={{
                    marginTop: 6,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="clay-float-slow" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Registrarme y Sincronizar</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* MODO D: RECUPERAR CONTRASEÑA                                     */}
            {/* ----------------------------------------------------------------- */}
            {mode === "forgot" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                    padding: 0,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Volver al inicio de sesión</span>
                </button>

                <p className="body-sm" style={{ fontSize: 13, color: "var(--color-body)" }}>
                  Para recuperar tu acceso de forma segura en tu celular y web sin depender de enlaces externos, te enviaremos un código numérico a tu correo.
                </p>

                <div>
                  <label htmlFor="auth-forgot-email" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
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
                      id="auth-forgot-email"
                      type="email"
                      required
                      inputMode="email"
                      className="input-text"
                      style={{ paddingLeft: 38 }}
                      placeholder="ej: velezlucasiker1@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || !email.trim()}
                  className="btn-primary clay-button-interactive"
                  style={{
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="clay-float-slow" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Enviar código de recuperación</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* MODO E: ACTUALIZAR CONTRASEÑA                                    */}
            {/* ----------------------------------------------------------------- */}
            {mode === "update-password" && (
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label htmlFor="auth-new-password" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
                    Nueva Contraseña
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
                      id="auth-new-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-text"
                      style={{ paddingLeft: 38 }}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-confirm-password" className="caption-uppercase" style={{ display: "block", marginBottom: 6 }}>
                    Confirmar Nueva Contraseña
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

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="btn-primary clay-button-interactive"
                  style={{
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="clay-float-slow" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
