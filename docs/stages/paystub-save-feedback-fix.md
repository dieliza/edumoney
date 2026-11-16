# Guardar talonarios desde Ingresos — 2026.11.16.5

El usuario confirmó que Guardar parecía no responder. En Cheques y talonarios el botón estaba arriba, pero la confirmación obligatoria de ingreso recibido seguía al final del formulario; su valor inicial «no» impedía el guardado. No se quitó esa protección: se movió junto al botón.

## Cambios acotados
- Confirmación del ingreso junto a Guardar, error visible en la misma zona y progreso Guardando ingreso con indicador accesible.
- Guardia inmediata mediante ref frente a doble pulsación, además del estado ocupado existente.
- Mensajes explícitos para neto pendiente y método sin confirmar. Se mantienen fecha, período, deducciones, duplicados y validaciones existentes.
- Tras persistir, se confirma Guardado exitosamente, se libera la foto temporal y se limpia el formulario. Actualizar el historial se trata aparte: si falla, se informa que el ingreso sí quedó guardado y se evita reutilizar el mismo identificador con otro contenido.
- No se cambiaron cálculos, categorías, documentos históricos, autenticación, APIs, respaldo ni base de datos. Sin migraciones.

## Verificación
Pruebas de interfaz con hooks simulados y SQLite real: confirmación antes del botón, mensaje por falta de confirmación, talonario manual registrado una vez por su neto, doble pulsación, progreso, fallo del refresco posterior a persistencia, foto interpretada con bruto/neto/deducciones/método y evidencia, y error de persistencia que conserva el formulario sin anunciar éxito. Historial IncomeStore y resumen mensual comprobados con neto 497.32, bruto 552.58 y deducción 55.26 ficticios. No se usaron fotos ni claves del usuario ni llamadas reales a Anthropic.

- Dos arranques del nuevo harness no iniciaron casos por importación de Expo (__DEV__); se corrigió el mock de UUID. Presupuesto conservador de esos intentos: 5 casos solicitados.
- Primera ejecución del harness: 4 casos, 3 correctos y un fallo del test que consultaba el espía antes de resolverse getDocumentStore; corregido esperando el microtask.
- Ejecución final enfocada: 13 correctos (nuevo UI de talonarios 6, separación de formularios 5, persistencia de evidencia y origen 2).
- Regresiones de income-statements seleccionadas: 4 correctas (totales/retenciones, guardado atómico e idempotencia, rollback, propuesta estructurada sin duplicar ingreso).
- Total conservador del bloque: 26, inferior al máximo 100.
- TypeScript, ESLint y compilación se registran al publicar. Safari/iPad/iPhone/Android físicos pendientes; este entorno no ofrece QA visual en dispositivo.

## Publicación confirmada
TypeScript, ESLint sin avisos, diff --check, compilación web/PWA y sintaxis Worker correctos. Implementación 9041c93. Fuente hosting 869807f599936872f3078d09ece746961cfacad4. Sites versión 61, versión guardada appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_fce9eb52962881918653df8e8cbe5479. Despliegue appgdep_6afa7f0e336481919d4af7cf604fd412 succeeded, entorno existente preservado (env_set_revision=1). URL https://edumoney-web.diegoluissantospabon.chatgpt.site, versión visible 2026.11.16.5. Verificación física del dispositivo del usuario pendiente.
