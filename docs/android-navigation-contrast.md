# Contraste de navegación Android

## Problema y causa encontrada

El usuario informa que los botones del sistema se camuflan con el fondo de Horizon. La inspección del código muestra dos políticas que competían: `MainActivity` pedía iconos oscuros una sola vez, pero el plugin integrado `SystemBars` de Capacitor 8.5.2 conservaba su estilo `DEFAULT`. Ese plugin elige iconos claros con el modo oscuro del teléfono y aplica el estilo de forma diferida y ante cambios de configuración. Horizon conserva un lienzo claro. Además, la navegación transparente permitía que el contenido y los fondos de diálogos alteraran el contraste.

Esta causa está sustentada por las implementaciones locales de `SystemBars.initSystemBars`, `setStyle` y `handleOnConfigurationChanged`; no se ha reproducido visualmente en el teléfono del usuario.

## Corrección

- `SystemBars.style = LIGHT`: en este plugin significa superficie clara e iconos oscuros. Su convención es distinta del plugin `StatusBar`, donde `DARK` selecciona los iconos oscuros.
- `SystemBars.insetsHandling = disable`: `MainActivity` ya mantiene el listener que comunica las áreas seguras a CSS. Evita que ambos componentes administren el mismo listener y el padding del decorado.
- Fondo de ventana explícitamente marfil. El tema de arranque y el tema normal seleccionan una superficie de navegación coherente.
- Android 8+: marfil con iconos oscuros. Android 7: verde profundo con iconos claros, ya que esa versión no admite navegación de iconos oscuros.
- `NavigationBarProtection` dibuja una superficie opaca bajo los controles del sistema y por encima del WebView. Usa los insets reales de navegación inferiores y laterales, sin alturas fijas. Es un Drawable pasivo, sin interceptación táctil ni nodos de accesibilidad.
- Con teclado visible, no pinta la protección: la ventana del teclado administra la navegación. Esto evita dibujar una franja sobre el editor cuando se redimensiona la ventana.
- Al recuperar foco se restablecen la apariencia y los insets. Se conserva la protección de contraste del sistema en Android 10+.

La protección nativa complementa los colores de ventana porque el dibujo edge-to-edge de Android reciente exige tratar el fondo detrás de los controles. Referencia: [guía oficial de Android](https://developer.android.com/develop/ui/views/layout/edge-to-edge).

## Validación realizada (2026-10-27)

- `npm run build`: pasa.
- `npx cap sync android`: pasa; configuración copiada verificada con `LIGHT` y `disable`.
- `npm run test:preview-boundary`: pasa.
- `npm run lint`: sin errores; siete advertencias preexistentes.
- AAPT2 36 compila los XML de colores y estilos modificados; enlaza los colores para minSDK 24 / targetSDK 36.
- Javac 21 compila `MainActivity` y `NavigationBarProtection` contra Android SDK 36, Capacitor y dependencias AndroidX disponibles localmente, con IDs generados por AAPT2 para los colores reales. Esto verifica las fuentes modificadas; no sustituye un build de APK completo.
- `git diff --check`: pasa.

No se pudo ejecutar `assembleDebug`: el sandbox monta la caché de Gradle como solo lectura e impide crear su archivo de bloqueo. ADB tampoco puede abrir su socket local. No hay resultados de instalación, captura o interacción en un dispositivo para esta corrección. No se ha publicado una nueva release.

## Comprobaciones pendientes antes de distribuir

Compilar un APK nuevo con el flujo Android existente y comprobar lo siguiente en Android 7, una versión 8–14 y una versión 15–16, usando al menos un dispositivo real de la familia afectada:

1. Navegación de tres botones y gestos, con sistema en modo claro y oscuro: Atrás/Inicio/Recientes o indicador de gesto visibles sobre una superficie uniforme.
2. Inicio, editor, lectura, perfil y diálogos: ninguna capa web tiñe la zona de navegación ni oculta sus controles.
3. Rotación y navegación lateral: superficie alineada con la barra real; controles de Horizon dentro de sus áreas seguras.
4. Abrir/cerrar teclado claro y oscuro varias veces: sin franja sobre el editor; navegación visible bajo control del teclado y apariencia de Horizon restaurada al cerrarlo.
5. Salir y regresar, bloquear/desbloquear y cambiar modo del sistema con Horizon abierto: el contraste permanece correcto.
6. Pulsar Atrás, Inicio y Recientes, y usar gestos: la protección visual no intercepta ninguno.

El APK instalado actualmente no cambia hasta compilar, distribuir e instalar la actualización nativa.
