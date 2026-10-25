# Autenticación y entrega de correo de Horizon

Para el acceso alternativo sin correo de Horizon, consulta [Configuración de Google para web y Android](./GOOGLE_AUTH_SETUP.md). SMTP sigue siendo necesario para las altas y recuperación por correo.

Horizon confirma el registro, el acceso sin contraseña y la recuperación mediante un código escrito dentro de la aplicación, tanto en web como en Android. El cliente solicita el envío a Supabase Auth; el transporte SMTP y las plantillas pertenecen al backend.

**Una respuesta aceptada no demuestra que el mensaje haya llegado.** Supabase puede responder sin revelar si un correo ya tiene cuenta. La entrega debe comprobarse con los eventos del proveedor y con una bandeja de prueba controlada; nunca con el texto de éxito de la aplicación.

## Panel del proyecto

Estos enlaces requieren una sesión autorizada en Supabase:

- [SMTP](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/smtp).
- [Plantillas de correo](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/templates).
- [Usuarios de Auth](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/users).
- [Límites de Auth](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/rate-limits).
- [URLs de autenticación](https://supabase.com/dashboard/project/rlkfornfrumvixwvcihy/auth/url-configuration).

Para los registros del backend, abre **Logs → Logs Explorer** desde el proyecto y selecciona la fuente de Auth. Consulta en privado la hora de la solicitud, el código de error y la respuesta SMTP; no publiques correos, códigos, contraseñas ni tokens en capturas o incidencias.

## 1. Habilitar entrega real mediante SMTP

El servicio de correo predeterminado de Supabase está limitado a direcciones de miembros del equipo de la organización y, según su documentación actual, a **dos mensajes por hora por proyecto**. No sirve para altas abiertas de usuarios. Un destinatario externo puede producir `email_address_not_authorized`; agotar la cuota puede producir `over_email_send_rate_limit`. Estas restricciones y sus valores pueden cambiar. [Documentación oficial de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

En **SMTP**, configura un proveedor para el que dispongas de credenciales, junto con el remitente autorizado. Completa la verificación del dominio/remitente y los registros SPF/DKIM/DMARC que exija ese proveedor. Revisa también restricciones de entorno de pruebas, destinatarios permitidos, supresiones, rebotes y cuotas. La aceptación SMTP y la llegada a la bandeja de entrada son comprobaciones distintas. [Recomendaciones oficiales de entrega](https://supabase.com/docs/guides/auth/auth-smtp).

Guarda las credenciales SMTP únicamente en la configuración privada de Supabase o en el gestor de secretos del backend. No las añadas al repositorio, al APK ni a variables `VITE_`. Una contraseña de la cuenta personal de Horizon no es una credencial de envío SMTP. La elección/contratación del proveedor y la configuración del remitente son pasos separados; este repositorio no los automatiza. Sin ese servicio configurado, el registro público por correo sigue pendiente aunque se publique una nueva web o APK.

En **Límites de Auth**, ajusta la cuota global a la capacidad autorizada del proveedor y mantén un intervalo mínimo de reenvío de 60 segundos. No desactives la confirmación del correo para eludir un fallo de entrega.

### Dominio de envío de Horizon

La configuración prevista utiliza un subdominio del dominio autorizado por su titular:

| Campo | Valor previsto |
| --- | --- |
| Dominio que verificar en Resend | `horizon.uroborosgroup.tech` |
| Nombre del remitente en Supabase | `Horizon` |
| Correo del remitente en Supabase | `acceso@horizon.uroborosgroup.tech` |
| Servidor SMTP | `smtp.resend.com` |
| Puerto SMTP | `465` |
| Usuario SMTP | `resend` |
| Contraseña SMTP | Una API key privada de Resend con permiso de envío para ese dominio |

Estos valores son un plan de configuración; no acreditan que el dominio esté verificado ni que el servicio esté conectado. [Integración oficial Resend–Supabase](https://resend.com/docs/send-with-supabase-smtp).

**Avance real:** se ha añadido `horizon.uroborosgroup.tech` a Resend, en la región São Paulo (`sa-east-1`). Se ha iniciado la comprobación de sus tres registros, pero el estado confirmado sigue siendo **Pending**. La recepción está desactivada. No se ha creado una clave de envío ni habilitado SMTP en Supabase. Para continuar, reutiliza el [dominio ya creado](https://resend.com/domains/39a6cb7b-6651-4c63-824f-f9599c97ca4e); no crees otro.

Registros exactos que Resend generó para la zona `uroborosgroup.tech`:

| Tipo | Nombre relativo a la zona | Contenido | TTL |
| --- | --- | --- | --- |
| TXT | `resend._domainkey.horizon` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbOUaKnbcwZj+5j8MPdX/+BuD1yNVLbczOA5JeipjxAp9x3WOIGGDsJ158A+OM2WsuTanv2WoNF86CUvDAqwHkRyRKeuMr7gcNemka+AkMlti2iBBiqONpm8hNQET2c9sR4AbvZ4eq/ooyhar1IM0+2zTMj3iaAyRD+bwyyq65DwIDAQAB` | Auto |
| CNAME | `rsend.horizon` | `rsend-sae1.forge.rmta.net` | Auto |
| CNAME | `send.horizon` | `send.forge.rmta.net` | Auto |

La clave DKIM de esta tabla es **pública**, destinada al DNS; no es una API key ni una contraseña SMTP. Si el panel pide un nombre completo en lugar de relativo, añade `.uroborosgroup.tech` una sola vez. No añadas valores MX de otros tutoriales: utiliza los registros reales del dominio de Resend. Si el dominio se elimina y vuelve a crearse, vuelve a obtener sus registros; la clave puede cambiar.

El asistente también sugiere un DMARC opcional en `_dmarc`; no se ha aplicado. Antes de añadirlo, revisa la política existente y su alcance: el envío de Horizon debe configurarse sin sobrescribir la política del dominio principal. No actives recepción para este flujo.

**Precondición pendiente, comprobada de nuevo el 19 de octubre de 2026:** la delegación pública de `uroborosgroup.tech` sigue apuntando a `ns1.verification-hold.suspended-domain.com` y `ns2.verification-hold.suspended-domain.com`. Las consultas públicas de NS, del TXT DKIM y de ambos CNAME devuelven `REFUSED`, sin respuestas. Esto impide que Resend valide los registros de correo aunque estén guardados en el panel. El motivo de la retención o de su restauración pendiente debe comprobarse con el registrador. No se ha confirmado un estado EPP `clientHold` o `serverHold`, y el fallo de DNS tampoco permite concluir que los registros falten o estén mal escritos.

**Comprobación directa del proveedor, 19 de octubre de 2026:** el panel del titular muestra los cuatro servidores predeterminados `cont603385.earth.orderbox-dns.com`, `cont603385.mars.orderbox-dns.com`, `cont603385.mercury.orderbox-dns.com` y `cont603385.venus.orderbox-dns.com`. Consultando directamente la dirección IPv4 de cada servidor, los cuatro responden con el TXT DKIM exacto y con ambos destinos CNAME esperados de la tabla. Los tres registros están correctamente servidos por Orderbox; queda pendiente que la delegación pública deje de apuntar a los servidores de retención. Conserva los registros y los servidores configurados en el panel mientras el registrador revisa esa discrepancia.

Si es necesario escalar, el soporte técnico oficial de .tech es `support@get.tech`. Aporta el dominio, la verificación del contacto ya completada, los cuatro servidores configurados en el panel, los dos servidores de retención que aún publica el registro y la comprobación directa positiva de los tres registros. Solicita revisar la reactivación y restaurar la delegación a la zona DNS existente sin eliminar sus registros. No envíes contraseñas, tokens, enlaces de verificación ni claves SMTP. [Contacto oficial](https://get.tech/contact-us).

Secuencia para habilitar el envío:

1. El titular revisa el estado del dominio en el panel de .tech. Si está pendiente la verificación del contacto, abre **Order Information → Resend Email / Resend Verification Email** y completa la verificación desde su bandeja privada. Si el panel indica otro motivo, resuelve ese motivo con el registrador. No compartas enlaces de verificación ni credenciales. [Procedimiento oficial de .tech](https://cp.get.tech/kb/answer/2008).
2. Comprueba que la delegación DNS vuelva a responder públicamente. Namify indica que la reactivación tras verificar el correo suele tardar unas horas y, excepcionalmente, hasta 24 horas. Si persiste la retención, revisa **Your domains → Manage → DNS → Nameservers** y contrasta los servidores del panel con el registro público. No sustituyas nameservers ni DNSSEC a ciegas: identifica primero qué servidores alojan la zona que contiene los registros. Si han pasado 24 horas desde la verificación y sigue igual, solicita al soporte del registrador la revisión de la verificación y restauración de la delegación existente, conservando sus registros. [Plazo oficial de reactivación](https://helpdesk.namify.tech/en/articles/10529232-how-to-verify-your-domain-name), [gestión de nameservers](https://helpdesk.namify.tech/en/articles/10353279-how-to-change-or-switch-your-nameservers).
3. En una cuenta autorizada de Resend, añade `horizon.uroborosgroup.tech` como dominio de envío. Copia los nombres, tipos, prioridades y valores exactos que genere el proveedor al panel DNS que realmente aloje la zona; el registrador y el proveedor DNS pueden ser distintos. No inventes claves DKIM ni sustituyas los MX o SPF del dominio principal. Conserva el sitio y cualquier correo existente. [Verificación de dominios y uso de subdominios](https://resend.com/docs/dashboard/domains/introduction).
4. Espera a que Resend marque el dominio como verificado. Revisa SPF/DKIM y una política DMARC adecuada al subdominio; evita políticas restrictivas antes de comprobar la alineación del remitente.
5. Crea una API key con permiso **Sending access**, restringida al dominio verificado. Introdúcela directamente como contraseña en el SMTP privado de Supabase, junto con los valores de la tabla. No la pegues en el chat ni en archivos del frontend. [Permisos de API keys](https://resend.com/docs/dashboard/api-keys/introduction).
6. Aplica las plantillas y opciones de OTP descritas abajo. Comprueba los escenarios de entrega y autenticación de la sección 5 antes de declarar resuelta la incidencia.

El dominio de envío no obliga a alojar la web en ese dominio. Conserva la URL de Vercel, la configuración local y el callback Android de la sección 3. No se necesita crear un buzón para cada código de autenticación; este flujo requiere un remitente autorizado y un servicio de envío. La recepción de respuestas o correo de soporte es una configuración diferente.

### Si Supabase solo abre en Chrome de Windows

No hace falta que el navegador de Codex comparta esa sesión. El titular puede abrir los enlaces del proyecto en Chrome y aplicar allí los ajustes de SMTP, OTP y plantillas de este documento. La API key de Resend se copia directamente al formulario privado de Supabase; nunca al chat. Completar esa configuración no requiere exportar cookies, compartir credenciales de GitHub, crear una contraseña nueva de Supabase ni generar un token general de administración de la cuenta.

Mantén SMTP sin activar hasta que el dominio esté verificado y dispongas de la clave correcta. Conservar acceso por contraseña no demuestra que el servicio de correo funcione; verifica después el registro y la recuperación con una bandeja controlada.

## 2. Confirmación y códigos sin enlaces

En la configuración del proveedor Email de **Authentication**, mantén habilitados el registro por correo y **Confirm email**. Configura la longitud de OTP en **6** para el comportamiento previsto de Horizon y revisa su caducidad. La longitud admitida por Supabase es de 6 a 10 dígitos; el cliente debe permitir pegar el código completo si el proyecto utiliza otra longitud admitida. [Referencia de configuración](https://supabase.com/docs/guides/local-development/cli/config#auth.email.otp_length).

En **Plantillas de correo**, sustituye el cuerpo de cada plantilla por el archivo correspondiente y guarda cada cambio:

| Plantilla de Supabase | Archivo versionado | Asunto | Verificación del cliente |
| --- | --- | --- | --- |
| Confirm signup | `templates/confirmation.html` | Confirma tu cuenta de Horizon | `signup` |
| Magic Link | `templates/magic-link.html` | Tu código de acceso a Horizon | `email` |
| Reset password | `templates/recovery.html` | Recupera tu acceso a Horizon | `recovery` |

Los tres archivos muestran exclusivamente `{{ .Token }}` como mecanismo de verificación. No incluyen enlaces, `{{ .ConfirmationURL }}`, datos del usuario ni recursos externos. Aunque la plantilla se llame **Magic Link**, mostrar el token permite el acceso mediante código. El nombre de esa plantilla no cambia el tipo `email` usado al verificar el acceso sin contraseña. [Variables y edición de plantillas](https://supabase.com/docs/guides/auth/auth-email-templates).

Estas tres plantillas no sustituyen las de cambio de correo ni las notificaciones de seguridad. Conserva esos flujos existentes. Después de verificar recuperación, Horizon muestra el formulario para elegir la nueva contraseña dentro de la aplicación.

## 3. URLs para web y Android

En **URLs de autenticación**:

1. Establece **Site URL** en `https://horizon-journaling-app.vercel.app/`.
2. Añade `https://horizon-journaling-app.vercel.app/**` a **Redirect URLs**.
3. Añade `horizon://auth/callback` y los retornos exactos `horizon://auth/callback?flow=signin`, `horizon://auth/callback?flow=signup` y `horizon://auth/callback?flow=recovery` a **Redirect URLs** para la aplicación Android. Los dos retornos adicionales de Google están en [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md).
4. Conserva las URLs locales que realmente uses solo para desarrollo.

La web vuelve al mismo origen y pathname que iniciaron el acceso, para conservar el verificador PKCE en ese navegador; Android utiliza `horizon://auth/callback`. Los códigos se introducen en la aplicación sin abrir estas URLs. Los callbacks se mantienen para los flujos que sí utilizan redirecciones. Cambiar una redirección no repara un fallo SMTP.

## 4. Diferenciar configuración local y alojada

`supabase/config.toml` configura el backend local de la CLI: confirmación habilitada, OTP de seis dígitos, intervalo de un minuto y los tres archivos HTML. Un reinicio del backend local aplica esos cambios. El capturador de correo del entorno local permite inspeccionar mensajes sin enviarlos a direcciones externas; utiliza la URL que indique la CLI. [Configuración local](https://supabase.com/docs/guides/local-development/cli/config), [plantillas locales](https://supabase.com/docs/guides/local-development/customizing-email-templates).

Arrancar Vite en `localhost` no implica utilizar ese backend: comprueba a qué proyecto apuntan las variables del cliente. Los cambios de este archivo, un build del frontend y `supabase db push` no publican por sí solos estas plantillas ni la configuración SMTP en el proyecto alojado. Aplica allí los pasos anteriores desde el panel o mediante una operación autorizada de la Management API.

## 5. Verificación antes de dar la incidencia por resuelta

Usa cuentas y bandejas de prueba que controles. Realiza los escenarios de fallos en local o staging; no cambies el SMTP de producción para provocar errores. Registra únicamente plataforma, escenario, hora, resultado y código de error, sin destinatarios ni tokens. No ejecutes envíos masivos para comprobar las cuotas.

| Escenario | Comprobación verificable |
| --- | --- |
| Registro con dirección nueva externa al equipo | Llega un correo sin enlace, con el código completo; introducirlo activa la cuenta. Antes de verificar no hay acceso a datos privados. Repetir en web y APK. |
| Registro de una dirección ya confirmada | No se crea una segunda cuenta ni se promete entrega. La respuesta no se utiliza para revelar la existencia de la cuenta. El usuario conserva las opciones de iniciar sesión y recuperar acceso. |
| Acceso sin contraseña | Cerrar sesión, solicitar el código e introducirlo permite acceder a la cuenta existente; un correo no registrado no crea una cuenta automáticamente. |
| Recuperación | El código permite elegir contraseña dentro de la aplicación; después funciona la nueva contraseña y falla la anterior. No requiere abrir `localhost` ni un enlace. |
| Reenvío | El botón respeta los 60 segundos; después se puede solicitar otro código y completar el flujo con el más reciente. No se muestra éxito si Supabase devuelve un error. |
| Cuota o intervalo agotado | Mediante un doble de prueba o entorno de staging controlado, un error de límite muestra espera/reintento y conserva el correo escrito; no simula entrega. |
| SMTP rechazado o no disponible | Mediante simulación o SMTP de staging, el fallo muestra un problema de envío y permite reintentar. La configuración del proveedor y los logs explican el rechazo. |
| Código incompleto, erróneo o caducado | No se autentica al usuario ni se cambia su contraseña; se puede corregir o solicitar otro código. |

Conserva el resultado de cada comprobación. Un test sintético puede verificar el contrato y el mensaje de error, pero no demuestra entrega real. La incidencia de envío solo queda resuelta cuando una bandeja controlada recibe el mensaje desde el proyecto alojado y el código completa la operación en ambos clientes.

## Despliegue del perfil privado

La release que incorpora perfiles requiere desplegar el backend antes que los clientes:

1. Vincula el proyecto con `supabase link --project-ref <project-ref>`.
2. Revisa el cambio con `supabase db push --dry-run` y aplica las migraciones con `supabase db push`.
3. Publica la función con `supabase functions deploy delete-account`.
4. Comprueba con dos cuentas que ninguna pueda leer o modificar el perfil o avatar de la otra.
5. Publica después la web y el APK.

`SUPABASE_SERVICE_ROLE_KEY` pertenece únicamente al entorno de la Edge Function. Nunca debe añadirse a Vercel, al APK ni a variables con prefijo `VITE_`.
