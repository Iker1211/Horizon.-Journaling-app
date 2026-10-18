# Configuración de autenticación de Horizon

Horizon completa la autenticación dentro de la aplicación. La versión Android usa el callback `horizon://auth/callback`; la versión web usa la URL pública configurada mediante `VITE_PUBLIC_SITE_URL`.

## URLs en Supabase

En **Authentication → URL Configuration**:

1. Cambia **Site URL** por la URL pública real de Horizon. No uses `localhost` en producción.
2. Añade `horizon://auth/callback` a **Redirect URLs** para abrir el APK.
3. Añade la URL web pública estable de Horizon a **Redirect URLs**: `https://horizon-journaling-app.vercel.app/**`.

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

## Despliegue del perfil privado

La release que incorpora perfiles requiere desplegar el backend antes que los clientes:

1. Vincula el proyecto con `supabase link --project-ref <project-ref>`.
2. Revisa el cambio con `supabase db push --dry-run` y aplica las migraciones con `supabase db push`.
3. Publica la función con `supabase functions deploy delete-account`.
4. Comprueba con dos cuentas que ninguna pueda leer o modificar el perfil o avatar de la otra.
5. Publica después la web y el APK.

`SUPABASE_SERVICE_ROLE_KEY` pertenece únicamente al entorno de la Edge Function. Nunca debe añadirse a Vercel, al APK ni a variables con prefijo `VITE_`.
