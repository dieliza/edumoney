# Rechazo persistente del formato de Anthropic

## Evidencia

La nueva captura identifica schema_rejected y referencia req_011Ch22C3AiRvgBvJtQZobjn. Los logs de producción confirman POST /api/receipt-read con HTTP del proveedor 400, modelo claude-haiku-5-5 y ese identificador. También hubo otra invocación 400. Los registros no guardan el mensaje bruto, la foto o la clave, por lo que no permiten determinar cuál restricción interna exacta rechazó el compilador.

La corrección de 33 uniones a listas de cero/un elemento no bastó en producción. Las pruebas anteriores verificaban límites explícitos y conversión con proveedor simulado; no demostraban aceptación por el compilador real. Se retira ese transporte y no se vuelve a ajustar a ciegas su gramática.

## Cambio

Se utiliza la extracción mediante una herramienta estándar de Messages API, sin output_config.format ni strict:true. La herramienta propose_edumoney_document describe los campos completos con null/valor y se selecciona con tool_choice {type:tool,name:...}. No se especifica output_config; Haiku 5.5 acepta herramienta forzada y omite thinking en esa llamada según la documentación vigente.

La herramienta no se ejecuta ni cambia datos: únicamente contiene la propuesta estructurada del modelo. El servidor acepta un solo bloque tool_use con ese nombre, verifica entrada objeto y tamaño, y pasa los valores al normalizador local existente. No se envía tool_result ni hay una segunda consulta. Herramientas desconocidas, múltiples llamadas, solo texto, rechazo o truncamiento no generan un registro. Se mantiene claude-haiku-5-5, una foto por llamada y max_tokens 4096.

Se conserva la información completa de comercio/dirección, referencia, subtotal, impuestos, productos, descuentos y cargos, cheques, neto/bruto, deducciones, horas, YTD y patronales. No hay migración, cambios a la API guardada, a la autorización, al proveedor, al login o GitHub main. La respuesta que recibe la interfaz conserva el mismo modelo interno.

Se eliminan el esquema de transporte con listas y sus convertidores/fixture. Se conservan los códigos de error, HTTP del proveedor y request-id saneados para diagnóstico, sin mensaje bruto, foto o clave.

## Verificación

53 ejecuciones de casos aprobadas, sin repetir suite completa ni CI; límite 100 respetado. Cubren el contrato estándar de herramienta, ausencia de output_config y strict, una sola petición, decodificación directa, campos completos, cero/null, rechazo de herramientas desconocidas/múltiples y datos parciales, errores saneados, normalización de recibos/talonarios y cliente.

Proveedor simulado y datos ficticios: sin acceso a la clave que vive en el navegador de la persona no se realizó una llamada real con su cuenta. No se afirma validación real del proveedor ni lectura física de iPad. Es necesaria otra lectura con esa clave para confirmar funcionamiento en producción. No se enviaron fotos privadas ni se generaron cargos de prueba.

Archivos: web-server/anthropic-reader.mjs; tests/anthropic-reader.test.ts; nuevo tests/anthropic-extraction.test.ts; retirada de tests/anthropic-schema-limits.test.ts y tests/fixtures/anthropicWire.ts; src/ui/buildVersion.ts (2026.11.14.06).

Fuentes oficiales verificadas:
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use (Haiku 5.5 permite herramienta forzada; omite thinking)
- https://platform.claude.com/docs/en/api/messages/create (tools/input_schema y tool_use)
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs (límites exclusivos de salida/uso estricto)

TypeScript, ESLint, git diff --check y compilación web correctos.

Publicada el 14 de noviembre de 2026 a las 02:28 UTC. Versión alojada 24, marcador 2026.11.14.06. Fuente b0d67257b4a674a47e624ad4c46d54f86d705514; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_a52efe30f9f88191aa0368a40e3c94e3; despliegue appgdep_6af7c72f81a4819188ba26249c75c7ea, succeeded. Audiencia pública conservada; se conserva la API cifrada del navegador.
