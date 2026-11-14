# Sustitución de Gemini por Anthropic Haiku 5.5

## Implementación

Por instrucción del usuario se sustituye el proveedor de lectura de imágenes. Se verificó `api/_lib/receipt-reader.js` de avazquez404/pr-fun-explore en el commit 3d108af34a6b3b13b7556ab5866a42ed8ff66b7c: utiliza `claude-haiku-5-5`, Messages API, imagen base64 y output_config con esquema JSON y esfuerzo low. EduMoney adopta ese flujo y mantiene la preparación de fotos de PR Budget. Se amplía el esquema a cheques y talonarios (el original solo procesa recibos de compra).

Se conserva la arquitectura Worker REST, sin nuevas dependencias ni pasarela adicional: llamada directa a https://api.anthropic.com/v1/messages, encabezados x-api-key y anthropic-version 2023-06-01, modelo fijo claude-haiku-5-5, max_tokens 4096, output_config.effort low y format json_schema. No se envía una conversación previa ni se utilizan Files API, herramientas, reintentos ni fallback. Se retiraron el endpoint de Google y los módulos Gemini del código de ejecución.

El esquema enviado omite restricciones minimum/maximum/maxItems que la API estructurada no soporta; el normalizador aplica los límites de importes, arrays, texto y fechas localmente. Conserva cantidades en centavos enteros, vacíos separados de cero, pago actual separado de YTD y datos estructurados directos a la revisión. No se crean pagos automáticamente ni se recalculan registros históricos.

## Configuración y privacidad

Configuración → Lector de recibos y talonarios permite activar Haiku con una clave propia de Anthropic y confirmación de facturación por uso, retirarla y volver al OCR local. La clave permanece en RAM; no se publica, persiste, sincroniza ni respalda. El endpoint usa exclusivamente la clave presentada por el solicitante; no presta una clave compartida públicamente. No se configuró una clave de producción ni se adquirieron créditos. La instalación nativa mantiene el lector local; este cambio corresponde a la web/PWA.

La autorización recordada usa una marca exclusiva de Anthropic. La autorización anterior de Google no autoriza al nuevo proveedor. Se pregunta una vez para futuras fotos en ese navegador, con revocación desde configuración; borrar almacenamiento, cambiar de dispositivo o bloquear localStorage puede requerir autorizar de nuevo. La app describe procesamiento y retención, sin confundir autorización con almacenamiento perpetuo: Anthropic indica eliminación de entradas y salidas dentro de 30 días con excepciones. EduMoney no guarda ni registra foto/clave en su servidor de lectura. No se promete retención cero.

No hubo migración de base de datos, cambios de autenticación, suscripciones, módulos comerciales ni GitHub main. La autorización es una preferencia de navegador; datos financieros existentes y sincronización cifrada se mantienen.

## Archivos

- web-server/anthropic-reader.mjs sustituye a gemini-reader.mjs: API, esquema, validación y errores saneados de clave/saldo/cuota.
- scripts/package-web-site.mjs empaqueta el nuevo lector en la ruta existente /api/receipt-read.
- src/web/anthropicSession.ts y anthropicConsent.ts sustituyen los módulos de Gemini.
- src/modules/documents/AnthropicConsentHost[.web].tsx sustituye al diálogo anterior; src/app/_layout.tsx actualiza el host.
- src/modules/documents/ReceiptReaderSettings[.web].tsx, capture.ts, types.ts, ReviewForm.tsx y ai/* actualizan configuración, captura y adaptadores tipados.
- src/modules/income/IncomeDocumentsScreen.tsx y src/modules/settings/SettingsScreen.tsx actualizan integración y textos.
- src/ui/buildVersion.ts y docs/PRIVACY.md actualizan versión y condiciones.
- Pruebas anthropic-* sustituyen gemini-*; income-statements y receipt-web-capture actualizan integración.

## Verificación

65 ejecuciones de casos, todas aprobadas. No se ejecutó suite completa ni CI; límite de 100 respetado.

- 59 casos: API Anthropic simulada, modelo/encabezados/esquema, importes exactos, deducciones vacías y cero, recibos y talonarios, guardar y reabrir, cancelación, persistencia/revocación de autorización, no heredar permiso de Google, falta de saldo/clave/cuota y sin fallback, preparación de imagen y selección de proveedor.
- 6 casos: botones cámara/fotos, atributos capture y cancelación existentes.
- ESLint, TypeScript y git diff --check correctos.

Todas las claves son ficticias y las llamadas al proveedor están simuladas. No se envió la foto privada del usuario ni se probó precisión real de Haiku. Falta introducir una clave válida con saldo en Configuración y revisar una foto real. No se verificó cámara física, Safari/iPhone ni PWA instalada; el entorno Sites no dispone de cua_repl.js. No se generó APK nueva.

## Referencias oficiales

- https://platform.claude.com/docs/en/about-claude/models/overview (ID y entrada de imágenes)
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs (output_config y límites del esquema)
- https://platform.claude.com/docs/en/build-with-claude/vision (imagen base64)
- https://platform.claude.com/docs/en/about-claude/pricing
- https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data

Este documento sustituye las instrucciones activas de LECTOR-GEMINI y AUTORIZACION-GEMINI-RECORDADA; ambos se conservan como historial.
