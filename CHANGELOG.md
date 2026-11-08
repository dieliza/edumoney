# Registro de cambios por etapa

## Etapa 1 — Base técnica y seguridad

- Inspección de repositorio vacío y selección de Expo/React Native con TypeScript.
- Modelos locales y esquema relacional versionado para movimientos, facturas, deudas, metas, documentos y revisión contributiva.
- Dinero en centavos, UUID, claves de idempotencia, referencias e índices únicos.
- Apertura SQLCipher con SecureStore, protección ante clave perdida y exclusión de copias automáticas.
- Pantalla técnica mínima, pruebas automáticas e instrucciones de validación nativa.
- Sin avance a Etapa 2 ni implementación de pantallas financieras.

### Seguimiento — compilación y pruebas nativas

- CI en GitHub Actions para Android e iOS sin publicación.
- Prueba Maestro de primera apertura y reapertura del almacenamiento cifrado.
- Capturas y compilaciones de simulador como evidencias descargables.

### Resultados de validación nativa

- Android compilado y apertura/reapertura sin Wi-Fi ni datos aprobadas en emulador.
- iOS compilado con firma local de Xcode y permisos de llavero; primera apertura/reapertura aprobadas en simulador.
- Verificación iOS directa de cabecera cifrada, rechazo de lectura sin clave, huella estable y exclusión de backup.
- Evidencias y resultados en docs/stages/01.md; pruebas físicas y recuperación siguen pendientes.

## Etapa 2 — Diseño visual y navegación

- Bienvenida con lema oficial y acceso a demostración sin cuenta.
- Cuatro pestañas y datos ficticios visibles en ambos temas.
- Temas claro/oscuro/automático con preferencia local persistente y controles accesibles.
- Tokens, componentes reutilizables, adaptación de anchos y pruebas de navegación/contraste.
- Conservación de apertura cifrada nativa; sin conexión de funciones financieras.
- Logo original pendiente de entrega; no se recrea el logo de los bocetos.

### Seguimiento de verificación visual

- 20 pruebas unitarias y 3 recorridos de navegador aprobados; TypeScript, ESLint y Expo Doctor sin errores.
- Navegación y persistencia verificadas en iOS/Android; capturas en docs/stages/evidence.
- Ajuste de barra de estado y apariencia nativa al cambiar de tema.
- Automatización adaptada a metadatos del selector iOS y avisos de Quickstep del emulador Android.
- Galería en Markdown para revisar ambos temas sin descargar ZIP.
