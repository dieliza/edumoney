# Lectura conectada que devolvía 503

La captura del usuario mostraba Haiku configurado y el error genérico «Anthropic no está disponible o el modelo no está habilitado». Se consultaron errores de producción: una invocación POST /api/receipt-read respondió 503; no se había registrado la causa devuelta por el proveedor. No se inspeccionó ni recuperó ninguna clave o foto del usuario.

Se encontró un defecto independiente y reproducible: el esquema ampliado tenía 33 parámetros con uniones de tipos (type [tipo,null]); la documentación oficial limita esos parámetros a 16. Esto permite que la clave se compruebe correctamente con Models API y que Messages rechace la lectura. Sin una respuesta real detallada del proveedor no se afirma que fuera el único motivo del error de esa cuenta.

## Corrección

- Se conserva el modelo interno y toda la información de recibos, productos, Tax/IVU, cheques y talonarios.
- El esquema enviado a Anthropic usa cero uniones y cero parámetros opcionales. Cada dato primitivo desconocido se representa mediante [] y uno conocido mediante [valor]. Las listas de filas siguen siendo listas de filas.
- El prompt explica ese formato; el decodificador lo convierte de nuevo en null/valor antes de aplicar los validadores originales. Se distingue [] de [0] y se rechazan listas ambiguas de dos valores. No hay valores predeterminados ni campos eliminados.
- Se sigue haciendo una sola llamada a claude-haiku-5-5 por lectura: no se divide la foto ni se añaden reintentos/proveedores.
- Los errores distinguen clave, permisos, saldo, cuota, esquema rechazado, imagen inválida, modelo ausente, saturación, solicitud inválida y tiempo agotado. Se devuelve solo mensaje fijo, código, estado HTTP del proveedor y request-id con prefijo req_ validado. Nunca su mensaje bruto, imagen o clave.
- El código registra únicamente esos datos técnicos fijos cuando el proveedor rechaza una solicitud, para diagnóstico futuro. No añade almacenamiento de fotos o claves.
- Tiempo máximo del proveedor 90 segundos y cliente 100 segundos para permitir la compilación inicial del esquema; no implica más tokens ni reintentos automáticos.
- La tarjeta describe «conexión configurada» en lugar de presentar la disponibilidad actual de la lectura como garantizada.

## Pruebas

51 ejecuciones de casos aprobadas; máximo 100 respetado. 49 iniciales: regresión de proveedor, detalles, cliente y nuevos límites/transformación/errores. 2 adicionales: tiempo agotado y referencia/código de error en el cliente. Todas con datos ficticios y proveedor simulado; no se envió una foto privada ni se generaron cargos reales.

Se comprueba el exceso anterior de 33 uniones, el esquema nuevo con cero, recorrido completo de recibo/impuestos, exactitud de centavos, desconocidos separados de cero y un solo intento. La ampliación de detalles y categorías se conserva. El error de formato no solicita otra contraseña ni borra la API guardada.

No hubo migración de datos, cambio de modelo o de GitHub main. Falta repetir una lectura real con la clave que la persona ya configuró en su navegador; no se afirma precisión real de Haiku verificada en esta sesión. No se probó Safari/iPad físico: no hay herramientas de navegador Sites disponibles.

Referencia oficial consultada: https://platform.claude.com/docs/en/build-with-claude/structured-outputs , sección Schema complexity limits, y https://platform.claude.com/docs/en/build-with-claude/effort .

Archivos: web-server/anthropic-reader.mjs; src/modules/documents/ai/readPhoto.web.ts; ReceiptReaderSettings.web.tsx; buildVersion.ts; pruebas anthropic-reader, anthropic-client, anthropic-schema-limits y fixture anthropicWire. Marcador 2026.11.14.05.

TypeScript, ESLint, git diff --check y compilación web correctos.

Publicada el 14 de noviembre de 2026 a las 02:12 UTC. Versión alojada 23, marcador 2026.11.14.05. Fuente 749c246ac5c8561e74fd7eb2b2335de0e59cb7e0; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_65b8582867448191b616e0945c56c18a; despliegue appgdep_6af7c3a2d24c819195f2e0df12b57ada, succeeded. Audiencia pública y clave guardada del usuario conservadas.
