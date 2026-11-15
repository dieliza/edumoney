# Cierres y retirada de menús repetidos — 2026-11-15

Aplicación 2026.11.14.20, continuación de la serie de versiones. Alcance limitado a la petición del propietario.

## Cambios

1. X verde con símbolo blanco: CloseButton común ahora resuelve un componente web que usa un botón nativo type=button. El clic llama al cierre, oculta el teclado y detiene la propagación para no reactivar el selector padre ni enviar un formulario. El símbolo no intercepta eventos. Las llamadas existentes de ActionMenu, Choices, ThemePicker y Sheet conservan sus callbacks. El componente nativo conserva Pressable, añade margen táctil y deja el icono fuera de la recepción de toques. No se afirma haber reproducido la causa física en Safari: es una corrección del controlador compartido y su interacción con formularios/propagación.
2. Mi dinero: retirados Movimientos y disponible y su explicación desplegable. Transacciones y la opción de transferencia del formulario de Nueva transacción se conservan. El cálculo del disponible no cambia.
3. Retirada la barra inferior Ingresos recurrentes. Se avisó al propietario durante el trabajo de una diferencia funcional: crear una recurrencia no confirma cobros futuros ni permite pausarlos. Para conservar esas operaciones se movieron las acciones originales a Ingreso → Administrar cobros programados. Se reutilizan confirmSchedule y toggleSchedule, sin cambios a sus reglas. Errores y confirmaciones se muestran también dentro de ese panel.
4. Mis facturas y su bloque Próximas facturas salen de Mi dinero. Deudas incorpora la pestaña Mis facturas con el módulo de facturas existente en modo integrado, sin otro encabezado ni pantalla duplicada. La ruta /bills sigue operativa para referencias de otras secciones y facturas vinculadas.

Se conserva refreshBills antes del snapshot de Mi dinero: quitar el listado no impide preparar compromisos ni altera por ese motivo el disponible. Sin borrado de registros, migraciones, cambios de API, autenticación, importes o fórmulas. No se eliminaron archivos compartidos del sistema de facturas/recurrencias porque mantienen otras operaciones; se retiraron los menús y el contenido de la ubicación indicada.

## Verificación

Cinco casos aprobados:

- close-button-actions.test.ts: 2. Cierre inmediato del estado con campo activo; aislamiento de eventos y botón que no envía formularios.
- bills.test.ts: 2 seleccionados (pago parcial/completo sin duplicar; vínculo de gasto existente).
- ledger.test.ts: 1 seleccionado (recurrencia mensual, cobro previsto, confirmación única, pausa y reversión).

TypeScript, ESLint y compilación web/PWA correctos. Sin suite completa ni pruebas ajenas al alcance. Este entorno no tiene recorrido visual soportado ni iPad físico; el cierre táctil en Safari y la navegación real a la pestaña quedan pendientes de comprobar en el dispositivo.

## Publicación

Sites versión 38, despliegue succeeded appgdep_6af8f6b887608191ba354e8f2c3cdd48. Fuente de alojamiento 8d0c88edb178f36866aab05551db8cb1f873eb74; implementación en web-edumoney 2cd1ae7. Audiencia pública y entorno de servidor conservados, revisión 1. GitHub main no modificado. Publicación confirmada por Sites; no se realizaron más casos ni se afirma haber probado Safari físico.

Enlace: https://edumoney-web.diegoluissantospabon.chatgpt.site/money?build=2026.11.14.20
