# Acceso con Google en Horizon

Guía de configuración y publicación para web y Android. Revisada el **24 de octubre de 2026**. Proyecto Supabase: `rlkfornfrumvixwvcihy`; web estable: `https://horizon-journaling-app.vercel.app/`; paquete Android: `com.horizon.app`.

**Estado comprobado:** el titular confirma haber completado los pasos de Google Cloud y guardado las credenciales privadamente en Supabase. La configuración pública de Auth consultada el **24 de octubre** confirma **Google habilitado**. Ese mismo día, el titular probó el acceso real con Google en `http://127.0.0.1:5173/` y confirmó que funciona. Esta confirmación acredita ese acceso local; no identifica si era una cuenta nueva ni verifica conservación de UUID o datos anteriores. `delete-account` está desplegada como **versión 3, ACTIVE, `verify_jwt: true`**, y las URLs de retorno ya están aplicadas. La publicación de web/APK y las comprobaciones reales de Android, reautenticación y eliminación siguen pendientes.

## Qué resuelve y qué sigue dependiendo del correo

“Continuar con Google” crea una cuenta o accede a ella mediante Supabase, sin enviar un código desde Horizon. Google gestiona la recuperación de la cuenta de Google; Horizon no conoce ni puede mostrar su contraseña. Se conserva el acceso existente con correo y contraseña, el mismo almacenamiento privado y las políticas RLS. No se habilitan funciones sociales.

El registro por correo, el acceso por código, la recuperación de cuentas que solo tienen contraseña y los cambios de correo **siguen necesitando SMTP operativo**. Google no recupera automáticamente una cuenta con otra dirección, ni reemplaza una prueba de identidad. Mantén la confirmación de correo y las protecciones existentes. La configuración de envío continúa en [AUTH_SETUP.md](./AUTH_SETUP.md).

El recorrido utiliza los dominios HTTPS ya operativos de Vercel y Supabase. No necesita que `uroborosgroup.tech` resuelva ni habilitar Gmail API o un servicio de envío. Un dominio propio para personalizar la marca puede abordarse después.

## 1. Preparar el cliente en Google Cloud

El titular realiza estos pasos con su propia sesión en [Google Auth Platform](https://console.cloud.google.com/auth/overview). No comparte contraseñas, cookies, enlaces privados, tokens ni archivos de credenciales con el chat.

1. En Chrome de Windows, abre [Google Cloud Console](https://console.cloud.google.com/), inicia sesión con la cuenta que administrará Horizon y usa el selector de proyecto → **New project / Nuevo proyecto**. Introduce **Horizon**, elige una organización propia o **No organization** si corresponde, crea el proyecto y selecciónalo. Completa personalmente cualquier aceptación de condiciones que aparezca. Después abre **Google Auth Platform → Get started**. Mantén separado un proyecto de pruebas si se prueban configuraciones distintas; no añadas servidores privados de desarrollo al cliente de producción. [Política de entornos y orígenes de Google](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).
2. En **Branding**, configura el nombre real de la aplicación, contacto de soporte y contacto del desarrollador. Para publicación, utiliza una página accesible y una política de privacidad que describa el uso real de datos. Completa la verificación de marca si la consola la exige para mostrar nombre/logo; no declares propiedad de dominios ajenos.
3. En **Audience**, selecciona **External** para permitir cuentas fuera de una organización de Google Workspace. Para el lanzamiento público, establece **In production / Publish app** y revisa cualquier requisito indicado por Google.
4. **Testing no es una garantía de acceso restringido:** normalmente admite hasta 100 usuarios de prueba y sus autorizaciones vencen a los siete días, pero Google exceptúa las solicitudes que solo utilizan `openid`, correo y perfil. No apliques ese límite o caducidad a Horizon sin comprobar los scopes reales. Las políticas de una organización Workspace pueden impedir el acceso igualmente. [Reglas oficiales de audiencia y excepción para identidad](https://support.google.com/cloud/answer/15549945?hl=en).
5. En **Data Access**, utiliza únicamente `openid`, `https://www.googleapis.com/auth/userinfo.email` y `https://www.googleapis.com/auth/userinfo.profile`. No solicites Gmail, Drive, Calendar ni permisos sensibles ajenos a autenticación.
6. En **Clients → Create client**, elige **Web application**. En **Authorized JavaScript origins**, configura `https://horizon-journaling-app.vercel.app`, sin ruta ni barra final. El recorrido usa la autorización de Supabase y no incorpora un SDK de Google en el WebView.
7. En **Authorized redirect URIs**, guarda exactamente:

   ```text
   https://rlkfornfrumvixwvcihy.supabase.co/auth/v1/callback
   ```

8. Conserva el **Client ID** y el **Client Secret** en un gestor privado hasta introducirlos directamente en Supabase. El secreto nunca va en `VITE_`, Git, APK, capturas o registros. Este recorrido de navegador utiliza el cliente web también en Android; no requiere configurar un cliente Android nativo ni una huella SHA para un SDK que no se utiliza.

La URI HTTPS anterior es el retorno **de Google a Supabase**. Las URLs de la siguiente sección son el retorno **de Supabase a Horizon**. No intercambies ambas configuraciones. [Preparación oficial del proveedor Google en Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

## 2. Configurar el proyecto Supabase desde el navegador disponible

El titular puede usar **Chrome de Windows**. No necesita compartir su sesión con Codex ni exportar cookies, credenciales de GitHub o un token de administración.

Abre el [proyecto Supabase](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/providers), entra en **Authentication → Sign In / Providers → Google**, introduce directamente el Client ID y Client Secret del apartado anterior y guarda la activación del proveedor. El requisito de despliegue del backend de la sección 3 ya está cumplido. No envíes las credenciales al chat ni desactives la verificación del correo para las cuentas con contraseña. Los cambios del archivo local `supabase/config.toml` no actualizan estos valores alojados.

**Aplicado el 24 de octubre:** en [URL Configuration](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/url-configuration), **Site URL** se corrigió de localhost a `https://horizon-journaling-app.vercel.app/`. La allowlist alojada tiene **25 URLs exactas**, conserva los retornos previos y cubre los cinco flujos `signin`, `signup`, `recovery`, `google` y `google-reauth` en producción, localhost:5173, 127.0.0.1:5173 y Android. Estas entradas de Google ya están incluidas; la tabla sirve también para futuras revisiones:

| Plataforma e intención | URL exacta |
| --- | --- |
| Web: acceso/alta Google | `https://horizon-journaling-app.vercel.app/?auth=callback&flow=google` |
| Web: confirmar identidad | `https://horizon-journaling-app.vercel.app/?auth=callback&flow=google-reauth` |
| Android: acceso/alta Google | `horizon://auth/callback?flow=google` |
| Android: confirmar identidad | `horizon://auth/callback?flow=google-reauth` |
| Desarrollo local: acceso/alta | `http://127.0.0.1:5173/?auth=callback&flow=google` |
| Desarrollo local: confirmar identidad | `http://127.0.0.1:5173/?auth=callback&flow=google-reauth` |
| Desarrollo local: acceso/alta | `http://localhost:5173/?auth=callback&flow=google` |
| Desarrollo local: confirmar identidad | `http://localhost:5173/?auth=callback&flow=google-reauth` |

Si el servidor local usa otro puerto o una ruta distinta, añade las dos URLs exactas correspondientes antes de probar; elimina las entradas de desarrollo que ya no se utilicen. No autorices comodines generales de Vercel ni dominios arbitrarios. Estas entradas son de **Supabase**, no orígenes de desarrollo del cliente Google de producción. [Allowlist oficial de redirecciones](https://supabase.com/docs/guides/auth/redirect-urls).

El cliente devuelve OAuth al origen y pathname que iniciaron el acceso: localhost vuelve a localhost; Vercel vuelve a Vercel. El verificador PKCE permanece en ese origen/dispositivo. No copies un callback a otro navegador para completarlo. El código es de uso único y vence a los cinco minutos. [Funcionamiento y límites de PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).

## 3. Desplegar primero el backend de eliminación

Antes de publicar web/APK con nuevas cuentas Google, despliega **la carpeta completa** `supabase/functions/delete-account/`, incluidos `index.ts` y `reauthentication.ts`. La versión anterior exige contraseña y no permite eliminar una cuenta que solo utiliza Google.

Un ingeniero con acceso autorizado al proyecto ejecuta desde la raíz del repositorio:

```sh
npx supabase login
npx supabase functions deploy delete-account --project-ref rlkfornfrumvixwvcihy --use-api
```

La autenticación de la CLI se completa privadamente. `--use-api` empaqueta en el servidor y **no requiere Docker**. El 24 de octubre se utilizó la CLI oficial **2.122.0**, se guardó una copia privada de la función anterior para rollback y se desplegaron ambos archivos. La consulta de metadatos confirmó **versión 3, ACTIVE, `verify_jwt: true`**; una petición sin `Authorization` devolvió **401**. No se probaron borrados ni se acredita todavía la reautenticación real de Google. Para otro despliegue, comprueba el destino y guarda de nuevo la versión anterior. No utilices `--no-verify-jwt` para solucionar un 401 ni `--prune`: conserva la protección del gateway y las demás funciones. [Despliegue oficial de funciones](https://supabase.com/docs/guides/functions/deploy), [despliegue sin Docker](https://supabase.com/docs/guides/functions/quickstart), [autenticación de funciones](https://supabase.com/docs/guides/functions/auth).

La verificación de versión y protección puede repetirse sin ejecutar la función mediante `GET /v1/projects/rlkfornfrumvixwvcihy/functions/delete-account` de la [Management API](https://supabase.com/docs/reference/api/v1-get-a-function), con acceso autorizado privado. Un rollback de código consiste en desplegar la copia anterior, no en borrar usuarios ni datos; antes de usarla, comprueba que conserve el acceso y la eliminación para las identidades que ya existan. Restaurar código no recupera datos eliminados.

El backend conserva la contraseña actual y la comprobación de UUID para el camino tradicional. Para Google requiere **ELIMINAR**, `getUser(token)` válido, `getClaims(token)` con firma verificada, emisor del proyecto, sujeto igual al usuario, audiencia/rol autenticados, sesión identificada, cuenta no anónima y una identidad Google. Exige además un AMR `oauth` no futuro de los últimos **300 segundos**; renovar el JWT no renueva esta prueba. El cuerpo de la petición, `user_metadata` o un simple `iat` reciente no autorizan el borrado. Un fallo devuelve 403 con `code: oauth_reauthentication_required`; no elimina archivos antes de comprobar la identidad. [Claims y AMR de Supabase](https://supabase.com/docs/guides/auth/jwt-fields), [verificación de firma con getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims).

## 4. Comportamiento del cliente que debe publicarse

El recorrido usa PKCE y navegador del sistema/Custom Tab en Android mediante `@capacitor/browser`. El manifest recibe `horizon://auth/callback`; `appUrlOpen` y `getLaunchUrl` cubren retorno en caliente y arranque. La cancelación vuelve a un estado recuperable. [Browser](https://capacitorjs.com/docs/apis/browser), [App y enlaces entrantes](https://capacitorjs.com/docs/apis/app).

Los callbacks aceptan el código PKCE y rechazan tokens de sesión sueltos en URL y `token_hash`; un enlace arbitrario no instala una sesión. Los enlaces antiguos de flujo implícito dejan de admitirse: solicita un código nuevo e introdúcelo en Horizon. El OTP manual de seis dígitos no depende de instalar una sesión desde una URL y se mantiene.

La confirmación sensible guarda la intención local y el UUID original, vuelve al perfil y no borra automáticamente. Elegir otra cuenta Google no confirma la cuenta anterior. La marca visual de confirmación no sustituye al control de AMR del backend.

Horizon persiste la sesión de Supabase para mantener el acceso; no guarda contraseñas ni los `provider_token` / `provider_refresh_token` de Google. Android declara `allowBackup="false"`; eso limita copias automáticas y no equivale a cifrar todo el almacenamiento local. Nunca vuelques sesiones o URLs con códigos en registros.

## 5. Cuentas anteriores y recuperación

Supabase puede vincular automáticamente identidades con el mismo correo verificado y mantiene una única cuenta. No programes una migración por comparación de emails: prueba el UUID antes/después con una cuenta sintética confirmada y verifica sus wrappers, entradas y perfil. Las identidades sin confirmar pueden eliminarse al vincular para evitar apropiación previa de cuentas; no prometas compatibilidad basándote solo en que el texto del correo coincida. [Política de vinculación de identidades](https://supabase.com/docs/guides/auth/auth-identity-linking).

Una dirección distinta puede crear otra cuenta con otro UUID. No fusionar datos ni “recuperar” la anterior por nombre, avatar o declaración del usuario. Para una cuenta solo Google, la recuperación se realiza en Google. Para una cuenta solo contraseña, olvidar la contraseña sigue requiriendo SMTP y una prueba de control del correo. Si el usuario aún puede entrar con su contraseña, conserva ese camino. No introduzcas contraseñas universales ni un reseteo administrativo sin verificar identidad.

## 6. Validación y orden de publicación

Ejecuta las pruebas locales disponibles antes de preparar los artefactos:

```sh
npm test
npm run build
npm run lint
npm run test:preview-boundary
```

La matriz siguiente requiere cuentas sintéticas controladas; anota fecha, versión, plataforma y resultado sin correos, contenido, códigos ni tokens. **El acceso real con Google en localhost fue confirmado por el titular el 24 de octubre; los demás escenarios de esta matriz no se dan por aprobados con esa prueba.** El proveedor ya está configurado. Una respuesta de configuración o un test con dobles no acredita un acceso real.

| Prueba real | Resultado obligatorio |
| --- | --- |
| Alta Google nueva desde web | Sesión, UUID y perfil propios; sin envío de Horizon ni acceso a datos ajenos. |
| Cuenta confirmada existente con mismo correo | Se conserva UUID, wrappers, entradas, avatar y preferencias. |
| Alta previa sin confirmar | Se verifica el resultado real según la política de Supabase; ninguna apropiación ni fusión manual. |
| Otra dirección Google | Cuenta distinta; nunca se muestran datos de la anterior. |
| Cancelar/denegar y reintentar | Mensaje útil, controles disponibles y nuevo intento válido. |
| Red lenta/sin conexión/proveedor desactivado | No hay éxito falso; se conserva la opción de acceso existente y puede reintentarse. |
| Localhost y Vercel | Cada flujo vuelve al origen inicial; ambos tipos de retorno funcionan. |
| Android: Custom Tab, atrás y retorno | Google abre fuera del WebView y devuelve el acceso a Horizon. |
| Android: app en segundo plano/proceso terminado | Se recupera o se ofrece reinicio seguro, sin bucle ni intercambio duplicado. |
| URL con tokens sueltos/código ajeno/caducado/repetido | No se instala sesión ni se filtran detalles; solo un código propio válido se intercambia. |
| Confirmación Google con otra cuenta | No autoriza acciones sobre el UUID original; requiere acceso correcto de nuevo. |
| Borrado Google: reciente, >5 min, token renovado | Solo AMR OAuth reciente válido autoriza; caducidad produce nueva confirmación. |
| JWT manipulado, sujeto ajeno o falta de ELIMINAR | Rechazo; no se elimina avatar ni datos. |
| Borrado con contraseña | Se exige contraseña correcta del mismo UUID; la incorrecta no pasa al camino Google. |
| Cierre de sesión/cambio de cuenta | No quedan perfil, rutas privadas ni borradores visibles de otra cuenta. |
| Recuperación/alta por correo | Se mantiene identificada como dependiente de SMTP; no se declara resuelta sin entrega y verificación reales. |

Orden de preparación: configurar cliente Google y retornos → desplegar y verificar `delete-account` → habilitar Google → validar en web y Android de prueba → publicar web y APK → repetir smoke test en artefactos publicados. **Al 24 de octubre, backend y retornos están aplicados, Google está habilitado y el titular confirmó el acceso local.** Continúa con la preparación de los artefactos y registra expresamente los recorridos reales que aún no se hayan ejecutado, incluido Android si no hay un dispositivo disponible. Registra cualquier escenario no ejecutado como **pendiente**, nunca como aprobado.

Si es necesario revertir el cliente, conserva el backend compatible con contraseñas y Google y todos los datos/identidades. No deshabilites Google rutinariamente cuando ya existan cuentas dependientes de él: bloquearías nuevos accesos de esos usuarios. Una incidencia de seguridad exige decidir expresamente la contención y comunicar el impacto; no eliminar usuarios como rollback.

## Comprobaciones locales realizadas el 23 de octubre de 2026

- `npm test`: pasan **7/7 archivos**, incluidos 21 casos de Google y la verificación de JWT firmados/manipulados del backend de eliminación.
- `npm run build`: correcto con Vite **8.3.5**. `npm run lint`: **0 errores y 7 advertencias previas**. `npm run test:preview-boundary`: correcto.
- Preview sintético de acceso y perfil Google a **320×640** y **360×800**, sin desbordamiento horizontal; axe devuelve **0 violaciones** en ambas pantallas. Es inspección técnica, no un estudio con usuarios ni una garantía completa de accesibilidad.
- Para revisar ese preview: ejecuta `node scripts/auth-preview.mjs` y abre `http://127.0.0.1:5181/auth-preview.html`. Utiliza datos sintéticos y no realiza llamadas reales de autenticación.
- `cap sync android`: registra **6 plugins**, incluido Browser. `:app:assembleDebug` termina correctamente con Java **21.0.13**: se genera el APK de prueba. Compilar no acredita el recorrido de Google en un dispositivo; esa comprobación sigue pendiente.

Por sí solos, estos resultados locales no acreditan OAuth real. El backend alojado, los retornos y la activación del proveedor Google quedaron comprobados el **24 de octubre de 2026** en los términos de las secciones 2 y 3.

## Validación funcional y revisión previa a publicación: 24 de octubre de 2026

- **Confirmado por el titular:** acceso real con Google en la web local `http://127.0.0.1:5173/`. No se solicitó ni registró su correo, contraseña, código, token o contenido. No se infiere que fuera un alta nueva, una vinculación con una cuenta anterior o una prueba de conservación de UUID.
- **Inspección de Android:** el manifest admite `horizon://auth/callback`, utiliza `singleTask` y deshabilita copias automáticas. Browser está registrado tanto en los plugins empaquetados como en los proyectos Gradle. La intención y el verificador PKCE persisten en el almacenamiento local del WebView; se atienden retornos en caliente y de arranque y se evita intercambiar dos veces el mismo código. Esta inspección de código no sustituye una prueba en dispositivo.
- **Disponibilidad de dispositivo:** ADB pudo consultar el entorno y no encontró dispositivos ni emuladores conectados. El retorno Google → Custom Tab → Horizon, el botón Atrás y la recuperación con el proceso terminado siguen **sin verificar en Android real**.
- **Revisión de release:** el workflow de etiquetas `v*` utiliza Node 22 y Java 21, ejecuta pruebas y compilación, sincroniza Capacitor y exige los cuatro secretos de firma antes de construir y publicar el APK. Esta revisión no acredita una ejecución nueva ni una release publicada.
- **Pendiente:** acceso en la web de producción, conservación de cuentas y datos anteriores, reautenticación sensible, eliminación real con cuentas sintéticas y smoke test de los artefactos publicados. El envío y la recuperación por correo siguen dependiendo de SMTP operativo y no quedan resueltos por este acceso con Google.
