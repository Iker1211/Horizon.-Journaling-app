import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { checkSupabaseHealth, syncSmartData, syncLocalToSupabase, SupabaseHealthCheck } from "../services/db";
import {
  X,
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
  KeyRound,
} from "lucide-react";
import { FireGoatLogo } from "./FireGoatLogo";

export type AuthStep = "email" | "otp";
export type AuthMode = AuthStep | "signin" | "signup" | "magiclink" | "forgot" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string;
  user: User | null | any;
  onSignOut: () => void;
  onAuthSuccess?: () => void;
}

const REGISTERED_HINT_EMAIL = "velezlucasiker1@gmail.com";
const RESEND_COOLDOWN_SECONDS = 60;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
  onAuthSuccess,
}) => {
  // Step state: 'email' (request OTP) or 'otp' (verify 6-digit code)
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  
  // Cooldown timer for resending OTP
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status and feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Health check state (when authenticated)
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheck | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // References for OTP 6 inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Health check query
  const runHealthCheck = useCallback(async () => {
    if (!user) return;
    setCheckingHealth(true);
    const res = await checkSupabaseHealth(user.id);
    setHealthStatus(res);
    setCheckingHealth(false);
  }, [user]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setStep("email");
      setOtpDigits(["", "", "", "", "", ""]);
      if (user) {
        runHealthCheck();
      }
    }
  }, [isOpen, user, runHealthCheck]);

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Manual cloud sync handler
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

  // STEP 1: Send OTP to email
  const handleSendOtp = async (targetEmail?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase no está configurado. Revisa tu archivo .env.local.");
      return;
    }

    const emailToSend = (targetEmail || email).trim();

    if (!emailToSend || !emailToSend.includes("@")) {
      setErrorMsg("Por favor ingresa un correo electrónico válido (ej: velezlucasiker1@gmail.com).");
      return;
    }

    if (emailToSend.toLowerCase() === "2027") {
      setErrorMsg("Debes ingresar un correo electrónico, no el nombre del proyecto \"2027\".");
      return;
    }

    setLoading(true);

    try {
      // Supabase signInWithOtp sends the 6-digit OTP code to the email
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        // Handle common rate limit
        if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("seconds")) {
          throw new Error("Por seguridad, debes esperar antes de solicitar otro código. Intenta de nuevo en un momento.");
        }
        throw error;
      }

      setEmail(emailToSend);
      setStep("otp");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccessMsg(`¡Código de 6 dígitos enviado a ${emailToSend}! Revisa tu bandeja de entrada o spam.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP code
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
      // Verify the 6-digit OTP code with Supabase Auth v2
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (error) {
        if (error.message.toLowerCase().includes("expired") || error.message.toLowerCase().includes("invalid")) {
          throw new Error("El código de verificación es incorrecto o ha expirado. Por favor verifica o solicita un nuevo código.");
        }
        throw error;
      }

      if (data?.user) {
        // Run smart sync: upload offline work if cloud is empty, or pull user's cloud data
        await syncSmartData(data.user.id);

        setSuccessMsg("¡Código verificado con éxito! Sesión iniciada.");

        // Celebrate success with confetti
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 1100);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo verificar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input event handlers (Auto-advance, backspace, paste)
  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    // Single digit input
    const char = cleanVal.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    // Auto-advance to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically trigger verification
    const completeToken = nextDigits.join("");
    if (completeToken.length === 6 && !nextDigits.includes("")) {
      handleVerifyOtp(completeToken);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Move to previous input on backspace if current is empty
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FireGoatLogo size={28} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
              Horizon Cloud Sync
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 4 }}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. USER IS AUTHENTICATED: Cloud Verification Dashboard */}
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

            {/* Cloud Health Card */}
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
                style={{ flex: 1, height: 40 }}
              >
                <Cloud size={15} />
                <span>{syncing ? "Sincronizando..." : "Sincronizar datos locales a la nube"}</span>
              </button>

              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{ color: "var(--color-error)", height: 40 }}
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : !isSupabaseConfigured ? (
          /* 2. SUPABASE NOT CONFIGURED */
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
              Para activar la sincronización en la nube multi-dispositivo, verifica tu archivo{" "}
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
          </div>
        ) : step === "email" ? (
          /* 3. STEP 1: SOLICITAR CÓDIGO AL CORREO (NO PASSWORD, NO USERNAME) */
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendOtp();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "rgba(26, 58, 58, 0.08)",
                  color: "var(--color-brand-teal)",
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                <Sparkles size={12} />
                <span>Acceso directo sin contraseñas</span>
              </div>
              <h3 className="title-md" style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>
                Iniciar sesión con código
              </h3>
              <p className="body-sm" style={{ fontSize: 13, color: "var(--color-body)" }}>
                Recibe un código de 6 dígitos en tu correo para acceder directamente y sincronizar tu información.
              </p>
            </div>

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

            {/* Email Field */}
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
                  autoFocus
                  inputMode="email"
                  autoComplete="email"
                  className="input-text"
                  style={{ paddingLeft: 38 }}
                  placeholder="ej: velezlucasiker1@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Quick Fill Button */}
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(REGISTERED_HINT_EMAIL);
                    handleSendOtp(REGISTERED_HINT_EMAIL);
                  }}
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
                  <KeyRound size={12} />
                  <span>Usar {REGISTERED_HINT_EMAIL}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary clay-button-interactive"
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 44,
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
                  <span>Enviar código al correo</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* 4. STEP 2: INTRODUCIR CÓDIGO DE 6 DÍGITOS (OTP) */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
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
                <span>Cambiar correo ({email})</span>
              </button>

              <h3 className="title-md" style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>
                Introduce el código de 6 dígitos
              </h3>
              <p className="body-sm" style={{ fontSize: 13, color: "var(--color-body)" }}>
                Enviamos un código numérico a <strong>{email}</strong>. Ingrésalo para entrar directamente.
              </p>
            </div>

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

            {/* 6-Digit OTP Box Grid */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 6,
                marginBottom: 6,
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
                    width: 52,
                    height: 56,
                    fontSize: 24,
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

            {/* Verify Button */}
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

            {/* Resend Code Section */}
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
    </div>
  );
};
