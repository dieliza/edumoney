# Eliminar desde Editar historiales

25 de noviembre de 2026. Implementación local, SIN publicar.

Se añadió «🗑 Eliminar transacción» en el editor de transacciones de los historiales, debajo de Guardar. No aparece al crear un registro ni en el editor de documentos ajeno al historial. Reutiliza MoneyStore.deleteFromHistory y sus protecciones de versiones/vínculos, incluida la revisión de comprobantes. No modifica cálculos, tablas ni servicios.

La eliminación usa el registro original, sin exigir validar primero cambios de importe o categoría del borrador. Comparte el bloqueo de envío con Guardar: no puede guardar y eliminar simultáneamente ni repetir la eliminación después de confirmar. Tras el commit, el editor muestra únicamente «Transacción eliminada» y Cerrar. Se refrescan los datos mediante historySaved cuando existe, para no mostrar un aviso incorrecto de «guardada». Si falla el refresco tras eliminar, sigue mostrando que la operación se completó; si falla eliminar, conserva el formulario y permite reintentar.

Se conserva la eliminación reversible y la auditoría existentes. No se añadió una pregunta de confirmación previa, siguiendo la instrucción anterior de colocar el zafacón directamente; sí se confirma el resultado después del commit.

Verificación: 28 ejecuciones de casos, todas aprobadas. Once pruebas finales de UI verifican cuatro combinaciones gasto/ingreso y personal/comercial, borrador inválido, pulsaciones repetidas, bloqueo posterior a eliminar, errores/refresco, aceptación del cierre, ausencia al crear o editar documentos y conservación de ingresos/gastos existentes. Hubo nueve casos de UI iniciales que se repitieron al añadir la corrección del aviso de refresco. Cinco pruebas sobre SQLite real verifican totales personales y comerciales, ingresos/gastos, auditoría/restauración y guardas de deudas/versiones. Tres pruebas de interfaz de historiales pasaron. TypeScript y ESLint aprobados; queda el aviso previo de req sin uso en patch-home-controls-site.cjs. Sin suite completa ni nuevas dependencias.

Archivos funcionales: src/modules/money/MovementForm.tsx. Pruebas: tests/entry-direction-ui.test.ts, tests/account-zone.test.ts y tests/expense-history-edit.test.ts. scripts/package-history-editor-delete.cjs prepara exclusivamente el módulo 831 para una futura publicación, preservando el loader y las demás pantallas; debe ejecutarse y verificarse contra la última fuente pública antes de publicar. Ese empaquetador aún no se ha ejecutado sobre un Worker público.

No se probó en iPhone/Safari físico. No se solicitó ni realizó push/despliegue. Pendiente aprobación del propietario para publicar este cambio nuevo, conforme a su instrucción de no publicar sin aprobación.
