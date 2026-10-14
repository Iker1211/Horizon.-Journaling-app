# Configuración de autenticación de Horizon

Horizon completa la autenticación dentro de la aplicación. La versión Android usa el callback `horizon://auth/callback`; la versión web usa la URL pública configurada mediante `VITE_PUBLIC_SITE_URL`.

## URLs en Supabase

En **Authentication → URL Configuration**:

1. Cambia **Site URL** por la URL pública real de Horizon. No uses `localhost` en producción.
2. Añade `horizon://auth/callback` a **Redirect URLs** para abrir el APK.
3. Añade la URL web pública de Horizon a **Redirect URLs**, por ejemplo `https://horizon.example/**`.

`localhost` puede mantenerse como URL adicional exclusivamente para desarrollo local.

## Correos con código de seis dígitos

En **Authentication → Email Templates**, los correos usados por Horizon deben mostrar `{{ .Token }}`. El usuario no necesita abrir ningún enlace.

Aplica este patrón a **Confirm signup**, **Magic Link** y **Reset password**:

```html
<h2>Tu código de Horizon</h2>
<p>Escribe este código en la aplicación:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
<p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
```

El código usa el tipo correcto para cada operación:

- creación de cuenta: `signup`;
- acceso sin contraseña: `email`;
- recuperación de contraseña: `recovery`.

Después de verificar un código de recuperación, Horizon muestra el formulario de nueva contraseña sin salir de la aplicación.
