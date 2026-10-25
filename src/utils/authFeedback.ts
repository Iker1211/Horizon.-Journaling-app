export type CodePurpose = 'signin' | 'signup' | 'recovery';
export const EMAIL_CODE_MIN_LENGTH = 6;
export const EMAIL_CODE_MAX_LENGTH = 10;

// Supabase controls the actual length; never truncate a configured 8/10-digit OTP to six.
export const isValidEmailCode = (value: string) => /^\d{6,10}$/.test(value);
export const normalizeEmailCode = (value: string) => value.replace(/\D/g, '').slice(0, EMAIL_CODE_MAX_LENGTH);

/** Accepted requests are not receipts: duplicate accounts may get an opaque success. */
export function getCodeRequestNotice(purpose: CodePurpose) {
  if (purpose === 'signup') return 'Solicitud recibida. Si este correo necesita confirmación, recibirás un código. Si ya tienes cuenta, inicia sesión o recupera tu acceso.';
  if (purpose === 'recovery') return 'Solicitud recibida. Si hay una cuenta asociada a este correo, recibirás un mensaje para recuperar el acceso. Revisa también spam.';
  return 'Solicitud recibida. Si hay una cuenta asociada a este correo, recibirás un código. Revisa también spam.';
}

/** Explain known failures without displaying provider logs, addresses or tokens. */
export function describeAuthError(error: unknown) {
  const detail = typeof error === 'object' && error !== null ? error as { message?: unknown; code?: unknown } : {};
  const message = typeof detail.message === 'string' ? detail.message : '';
  const code = typeof detail.code === 'string' ? detail.code : '';
  if (code === 'email_address_not_authorized') return 'El envío de correos de Horizon necesita una corrección de configuración. No podemos enviar el código a esta dirección en este momento.';
  if (code === 'over_email_send_rate_limit') return 'El servicio de correo de Horizon ha alcanzado temporalmente su límite de envíos. Inténtalo más tarde.';
  if (code === 'over_request_rate_limit' || /rate|seconds|too many/i.test(message)) return 'Espera unos minutos antes de intentarlo de nuevo.';
  if (/error sending.*(?:email|mail)|smtp/i.test(message)) return 'No se pudo enviar el correo de verificación. El servicio de correo de Horizon necesita una revisión. Inténtalo más tarde.';
  if (code === 'signup_disabled' || code === 'email_provider_disabled') return 'La creación de cuentas por correo no está disponible en este momento.';
  if (code === 'otp_disabled') return 'El acceso con código no está disponible en este momento. Puedes iniciar sesión con tu contraseña.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return 'El correo o la contraseña no son correctos. Revísalos o entra con un código por correo.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return 'Confirma tu correo antes de entrar. También puedes solicitar un código por correo.';
  if (code === 'otp_expired' || /expired|invalid.*token/i.test(message)) return 'El código no es válido o ha vencido. Revísalo o solicita uno nuevo.';
  if (/fetch|network|connection/i.test(message)) return 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.';
  if (code === 'user_already_exists' || /already registered/i.test(message)) return 'No pudimos crear la cuenta. Si ya la habías creado, inicia sesión o recupera tu acceso.';
  if (code === 'weak_password' || /password.*(weak|characters|length)/i.test(message)) return 'Usa una contraseña más segura, con al menos 8 caracteres, letras y números.';
  if (code === 'same_password') return 'Elige una contraseña diferente a la actual.';
  if (code === 'reauthentication_needed') return 'Vuelve a iniciar sesión antes de cambiar tu contraseña.';
  if (code === 'email_address_invalid') return 'Ingresa un correo electrónico válido.';
  return 'No pudimos completar la solicitud. Inténtalo de nuevo en un momento.';
}
