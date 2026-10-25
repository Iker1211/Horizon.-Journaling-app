# Horizon

Horizon organiza proyectos en wrappers, reflexiones en una bitácora Markdown y avances en un calendario de 365 días. Comparte la misma aplicación React entre la web y Android mediante Capacitor.

## Desarrollo

Requiere Node.js 22 o superior. Para Android: JDK 21 y Android SDK 36.

```sh
npm install
npm run dev
npm run build
npm test
npm run lint
```

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local`. Usa la clave publicable del proyecto, nunca una clave de servicio. Las mismas variables deben configurarse como secretos del repositorio para las compilaciones Android. Las tablas y políticas por usuario están en `supabase/schema.sql`.

Configura también las URLs y plantillas de correo siguiendo [`supabase/AUTH_SETUP.md`](supabase/AUTH_SETUP.md). Android vuelve a `horizon://auth/callback`; la web conserva el origen que inició el acceso para completar PKCE. La configuración de Google está en [`supabase/GOOGLE_AUTH_SETUP.md`](supabase/GOOGLE_AUTH_SETUP.md).

## Cuentas y datos

- El contenido de la aplicación requiere iniciar sesión. Una cuenta nueva comienza vacía.
- Los wrappers y entradas se leen y guardan en Supabase con el identificador de la cuenta. Un fallo de conexión muestra un error y permite reintentar.
- Los borradores y la fecha inicial del calendario se guardan en este dispositivo, separados por cuenta. No se sincronizan entre dispositivos.
- Los antiguos datos locales sin propietario se conservan para recuperación, pero no se muestran ni se importan automáticamente a ninguna cuenta.
- Cerrar sesión oculta el espacio privado; cambiar de cuenta descarta su estado en memoria.
- Las pantallas públicas no incluyen correos, wrappers ni registros precargados.

## Android

```sh
npm run cap:sync
cd android
./gradlew assembleDebug
```

Para una versión firmada, configura `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` y `KEY_PASSWORD`, y ejecuta `./gradlew assembleRelease`. Conserva la clave de firma existente para poder actualizar instalaciones anteriores.

La interfaz usa navegación inferior, áreas seguras y formularios adaptados al teclado. Antes de distribuir un APK, verifica inicio/cierre de sesión, cambio de cuenta, teclado y botón Atrás en un dispositivo real.

## Comprobaciones de privacidad

`npm test` comprueba que no se leen datos privados sin sesión, que una cuenta vacía no hereda datos locales, que los errores de nube no usan una caché compartida y que borradores y calendario están separados por cuenta. Son pruebas locales; no modifican registros reales ni verifican la configuración del servidor Supabase desplegado.
