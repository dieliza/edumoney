# Detalle de deuda: eliminar en lugar de preparar mínimo

## Resultado

- Se retira Preparar factura del mínimo pendiente y el texto explicativo de ese control del detalle de deuda.
- Se incorpora Eliminar deuda en ese mismo detalle, para deudas actuales y archivadas, incluso con saldo positivo.
- La confirmación identifica nombre y saldo, permite cancelar y explica que no paga ni cancela la obligación con la entidad.
- Al confirmar, el registro deja de aparecer en las listas actuales/archivadas, avisos, calendario y proyecciones de deudas. Se conserva una marca auditada de eliminación para evitar reactivaciones accidentales y mantener respaldo e integridad de vínculos.
- Los pagos realizados y sus movimientos financieros se conservan: no se devuelve dinero al balance disponible ni se borra un gasto/pago real.
- Se anula únicamente el pendiente de facturas vinculadas. Las facturas completamente pagadas y sus pagos permanecen. Se reutiliza la lógica de anulación de BillsStore dentro de la misma transacción para evitar cambios parciales.
- El refresco existente de facturas actualiza los recordatorios de los pendientes anulados.

## Archivos y arquitectura

- src/modules/debts/DebtsScreen.tsx: acceso contextual de eliminación y retirada del control anterior.
- src/modules/debts/DebtDeleteAction.tsx: confirmación inline dentro del Sheet existente; reutiliza Body y ActionButton con el tema actual.
- src/modules/debts/store.ts: eliminación atómica, idempotencia, versión vigente, evento delete, ocultación de eliminadas y protección contra edición/pagos futuros que las reactiven.
- src/modules/bills/store.ts: extrae voidInTransaction para reutilizar la anulación existente en una operación financiera atómica. La anulación pública de facturas conserva sus validaciones y comportamiento.
- tests/debts.test.ts: seis casos nuevos de eliminación.

Sin migraciones, tablas, pantallas, navegación ni servicios nuevos. Se conservan registrar pago, actualizar condiciones, Abrir Mis facturas y los historiales. El método scheduleMinimum se conserva para compatibilidad interna; se elimina el acceso solicitado de la pantalla.

## Validación

- 47 pruebas seleccionadas de deudas/facturas aprobadas, incluidos seis casos de eliminación.
- Casos nuevos: saldo positivo y confirmación, versión obsoleta, pulsaciones repetidas, pagos y disponible intactos, cancelación del pendiente, conservación de facturas pagadas, bloqueo de reactivación, rollback ante fallo de escritura, restauración de respaldo, deudas archivadas y separación entre usuarios.
- Cuatro pruebas del componente compilado: detalle normal, detalle archivado, confirmar/cancelar con saldo y reutilización de versión/auditoría/anulación de factura. Aprobadas.
- Nueve comprobaciones del paquete: hashes de fuente, tres módulos existentes afectados y un componente contextual, preservación de otros módulos, service worker/precarga y rutas HTTP, e investigación contributiva mensual intacta. Aprobadas.
- Se repitieron exclusivamente las cuatro pruebas del componente y nueve del paquete tras corregir cómo se transmite la key de React en el ensamblado Web; no se repitieron las47 financieras. Ver logs de ambas fases.
- TypeScript, ESLint de fuentes afectadas y git diff --check aprobados.
- Presupuesto antes de HTTP de producción:73 ejecuciones (47+4+9+4+9) de un máximo de100. La primera preparación del paquete detectó un identificador de dependencia no declarado; se completó el mapa antes de modificar archivos.
- La revisión automática rechazó una restauración amplia del directorio Worker. Se verificó HEAD160, ausencia de cambios en servicios contributivos/correo y coincidencia de los dos archivos modificados con nuestro último build. Se restauraron exclusivamente esos dos archivos generados; la operación segura se completó sin aprobación adicional ni pérdida de cambios ajenos.

No se usaron datos financieros reales. No se ejecutaron pagos, transferencias, correos ni operaciones bancarias. No está disponible la herramienta de navegador administrado; no se afirma una prueba visual interactiva en Safari, iOS ni Android.

## Publicación

Versión161 publicada correctamente. Sourcee5282e8742deadff7eae90fd7e8713ce5dac1914. Se conservan acceso público y env revision4. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site . Recibo: publication.json. La página /debts y /sw.js devuelven200 con el build nuevo.

Total del bloque:75 ejecuciones de casos incluyendo repeticiones y las dos comprobaciones HTTP finales, dentro del máximo de100. Las pruebas de lógica, componentes y paquete están aprobadas. La revisión visual interactiva sigue sin estar disponible.
