# Eliminar desde Editar historiales

25 de noviembre de 2026. Implementación local, SIN publicar.

Se añadió «🗑 Eliminar transacción» en el editor de transacciones de los historiales, debajo de Guardar. No aparece al crear un registro ni en el editor de documentos ajeno al historial. Reutiliza MoneyStore.deleteFromHistory y sus protecciones de versiones/vínculos, incluida la revisión de comprobantes. No modifica cálculos, tablas ni servicios.

La eliminación usa el registro original, sin exigir validar primero cambios de importe o categoría del borrador. Comparte el bloqueo de envío con Guardar: no puede guardar y eliminar simultáneamente ni repetir la eliminación después de confirmar. Tras el commit, el editor muestra únicamente «Transacción eliminada» y Cerrar. Se refrescan los datos mediante historySaved cuando existe, para no mostrar un aviso incorrecto de «guardada». Si falla el refresco tras eliminar, sigue mostrando que la operación se completó; si falla eliminar, conserva el formulario y permite reintentar.

Se conserva la eliminación reversible y la auditoría existentes. No se añadió una pregunta de confirmación previa, siguiendo la instrucción anterior de colocar el zafacón directamente; sí se confirma el resultado después del commit.

Verificación: 28 ejecuciones de casos, todas aprobadas. Once pruebas finales de UI verifican cuatro combinaciones gasto/ingreso y personal/comercial, borrador inválido, pulsaciones repetidas, bloqueo posterior a eliminar, errores/refresco, aceptación del cierre, ausencia al crear o editar documentos y conservación de ingresos/gastos existentes. Hubo nueve casos de UI iniciales que se repitieron al añadir la corrección del aviso de refresco. Cinco pruebas sobre SQLite real verifican totales personales y comerciales, ingresos/gastos, auditoría/restauración y guardas de deudas/versiones. Tres pruebas de interfaz de historiales pasaron. TypeScript y ESLint aprobados; queda el aviso previo de req sin uso en patch-home-controls-site.cjs. Sin suite completa ni nuevas dependencias.

Archivos funcionales: src/modules/money/MovementForm.tsx. Pruebas: tests/entry-direction-ui.test.ts, tests/account-zone.test.ts y tests/expense-history-edit.test.ts. scripts/package-history-editor-delete.cjs prepara exclusivamente el módulo 831 para una futura publicación, preservando el loader y las demás pantallas; debe ejecutarse y verificarse contra la última fuente pública antes de publicar. Ese empaquetador aún no se ha ejecutado sobre un Worker público.

No se probó en iPhone/Safari físico. No se solicitó ni realizó push/despliegue. Pendiente aprobación del propietario para publicar este cambio nuevo, conforme a su instrucción de no publicar sin aprobación.

## Publicación aprobada

El propietario respondió «Sí» el 25 de noviembre de 2026. La fuente pública seguía en la versión 104. Se aplicó el empaquetador solo al módulo MovementForm 831 y se verificó sobre el Worker final que los otros módulos y assets anteriores permanecieran intactos, que existieran la API deleteFromHistory, el botón, la confirmación y todas las rutas de caché. Sintaxis Node aprobada. Se envió el commit 232738be924d23477c0b737abb190ced3356e785 a la rama de Sites y se guardó como versión 105. ID de versión: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_f975be02c5dc8191b1f99547aa3b39b3. Despliegue: appgdep_6b06de305a4c8191ad26cdac31770587. El guardado se hizo sin tar local por falta de espacio, usando la compilación remota de Sites. Se conserva el acceso público.

Estado final de Sites: succeeded, 2026-11-25T13:10:47.479021+00:00. Publicada la versión 105 en https://edumoney-web.diegoluissantospabon.chatgpt.site. Este resultado sustituye el estado pendiente de aprobación descrito anteriormente. La constancia local de publicación queda en el archivo de evidencia; no se hizo otro cambio funcional tras publicar.
