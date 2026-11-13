# Lector opcional Google Gemini: recibos y talonarios

2026-11-13. Rama web-edumoney. Marcador web 2026.11.13.14.

## Alcance y autorización

El usuario rechazó expresamente Anthropic y eligió Gemini con nivel gratuito y sus condiciones, después de explicar que los datos de ese nivel pueden usarse para mejorar productos. No se envió ninguna foto a Anthropic ni OpenAI. Esta entrega no realiza llamadas reales a Google: no se dispone de una clave del usuario. La persona la introduce en EduMoney, no en el chat.

Se verificó el flujo de PR Budget en avazquez404/pr-fun-explore@3d108af34a6b3b13b7556ab5866a42ed8ff66b7c:

- src/utils/receiptPhoto.js: preparar en navegador, orientación, fallback Image, máximo 2000 px y JPEG .85.
- src/pages/MyBudgetPage.jsx y src/services/receipts.js: foto → lectura IA → resultado estructurado → revisión, sin guardar automáticamente.
- api/_lib/receipt-reader.js y api/receipts.js: validación de imagen, esquema, importes en centavos, errores y guardado posterior separado.

Se adapta esa arquitectura a Google Gemini. El código original solo acepta recibos de compra; se amplía el esquema para cheques/talonarios. No se reutilizan sus cuentas, claves, base de datos, precios ni autenticación Supabase.

## Flujo implementado

1. Configuración → Lector de recibos y talonarios: clave propia de Google AI Studio, aceptación de condiciones y confirmación de proyecto sin facturación.
2. Activar Gemini en esta sesión. Se valida formato, no acceso real ni cuota hasta una lectura. La clave solo permanece en memoria; se retira al volver a Local o al recargar/bloquear/cerrar.
3. Escanear recibo o Buscar en fotos mantienen los dos inputs y activación síncrona del toque existentes.
4. Un diálogo de EduMoney confirma cada envío. No depende de window.confirm ni permisos especiales de modales del navegador. Cancelar no prepara ni envía foto ni modifica campos.
5. Se normaliza la imagen (hasta 30 MB de entrada, 2000 px, JPEG .85 y máximo 3,5 MB preparado).
6. El cliente envía la imagen y consentimiento a /api/receipt-read, con la clave propia en un encabezado. No aparece en URLs, archivos, registros, respaldos o código publicado.
7. El servidor valida tamaño, tipo, cabecera, origen y consentimiento y llama una sola vez a Google. No guarda foto/clave ni escribe sus contenidos en logs. El endpoint no tiene una clave compartida: requiere una clave proporcionada por quien lo usa; no presta cuota de otros usuarios.
8. Gemini responde con esquema JSON. Se validan tipo de documento, moneda, fechas, centavos enteros, categorías, códigos, horas y límites. Se omiten propiedades adicionales. Importe principal ilegible, negativa de lectura o salida truncada producen error explícito, sin abrir una revisión vacía.
9. Los campos estructurados llegan directamente a la revisión y a Cheques y talonarios; no se vuelven a interpretar mediante OCR. I.T/FICA ambiguos quedan en Otra deducción. Vacíos son null, cero solo impreso; no se calculan cifras ausentes.
10. Solo después de confirmar el guardado se escribe en la base local cifrada. Para talonarios guardados como ingreso, también se conservan bruto, deducciones y filas de ingresos como desglose pendiente. No se crea dos veces el ingreso neto.

## Modelo, costo y límites

Modelo fijo gemini-2.5-flash, listado con nivel gratuito al consultar la documentación oficial. Endpoint stateless generateContent (documentado como plenamente soportado). No se crean conversaciones almacenadas, suben archivos reutilizables, activan herramientas, hacen reintentos automáticos ni cambian a un modelo/proveedor alternativo.

La elegibilidad y cuota dependen de Google. EduMoney no puede comprobar si la clave pertenece a un proyecto con facturación. Para mantenerse en nivel gratuito se debe usar un proyecto sin facturación habilitada. Google puede aplicar condiciones, límites regionales o cambios de disponibilidad. Una clave de proyecto con facturación podría generar cargos según Google; no se promete costo cero independientemente de esa configuración. Ante 429 se informa cuota agotada, sin reintento/fallback silencioso. El modo local continúa disponible por elección.

Fuentes consultadas:

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/interactions (compatibilidad de modelos y generateContent)
- https://aistudio.google.com/api-keys

## Archivos principales

- web-server/gemini-reader.mjs (nuevo): endpoint, prompt, esquema, validación, consulta a Google y errores.
- scripts/package-web-site.mjs: incluye el endpoint en el Worker publicado.
- src/modules/documents/ai/preparePhoto.web.ts, readPhoto.web.ts, types.ts (nuevos): preparación adaptada de PR Budget, cliente y mapeo estructurado.
- src/web/geminiSession.ts, geminiConsent.ts (nuevos): clave temporal, modo y confirmación por foto.
- src/modules/documents/ReceiptReaderSettings[.web].tsx, GeminiConsentHost[.web].tsx (nuevos): configuración/estado y diálogo; la instalación nativa mantiene lector local.
- src/app/_layout.tsx: host del diálogo dentro de la app desbloqueada; sin modificar autenticación.
- src/modules/documents/capture.ts, types.ts, DocumentsScreen.tsx, ReviewForm.tsx: integración conservando captura y revisión existentes.
- src/modules/income/IncomeDocumentsScreen.tsx: campos estructurados de talonario y selección del tipo leído.
- src/modules/settings/SettingsScreen.tsx, src/ui/buildVersion.ts, docs/PRIVACY.md: configuración, versión y privacidad actualizada.
- Nuevas pruebas gemini-reader, gemini-client, gemini-photo-preparation y gemini-consent; regresiones en receipt-web-capture e income-statements.

Sin nuevas dependencias ni migraciones de base de datos. No se modifican precios, módulos comerciales ni GitHub main.

## Verificación

61 ejecuciones de casos aprobadas, incluidas repeticiones; límite de 100 respetado. No se ejecutó suite completa ni CI.

- 47: endpoint con proveedor simulado, validación/errores/privacidad, adaptadores estructurados, cliente/cancelación, botones, flujo web local y regresión de talonarios.
- 1: guardar/reabrir un talonario estructurado con un solo movimiento neto y sin claves en el respaldo.
- 4: preparación de imagen, orientación, fallback img.decode, limpieza de URL, tamaños y tipo.
- 7: cliente y confirmación dentro de la app tras cambiar el diálogo; cancelar y sustituir solicitudes no autoriza dos fotos.
- 2: captureImage usa Gemini cuando está activado y no sustituye un error por OCR local.

Todas las claves de prueba son ficticias. Las llamadas Google se sustituyen por dobles de prueba; no se enviaron fotos privadas a Google. No se afirma una lectura real con Gemini ni precisión medida en un iPad. La primera lectura real requiere que el usuario configure su propia clave y autorice una foto.

TypeScript, ESLint, git diff --check y compilación web correctos. No se probaron cámara física, Safari/iPhone ni PWA instalada; cua_repl.js no está disponible en el entorno Sites. No se generó una APK nueva.

## Activación por la persona

1. Abrir https://aistudio.google.com/api-keys con su cuenta Google y crear una clave en un proyecto sin facturación habilitada.
2. Abrir EduMoney y entrar en Configuración → Lector de recibos y talonarios.
3. Introducir la clave allí (nunca en el chat), confirmar las condiciones y pulsar Activar Gemini en esta sesión.
4. Elegir una foto y autorizar su lectura. Revisar el resultado antes de guardar.

El modo inicial sigue siendo Local. No hay una clave incluida por defecto. Si se recarga la web, debe reintroducirse la clave porque no se conserva en disco. La integración queda preparada y comprobada con dobles; su acceso real queda pendiente de la clave de la persona.
