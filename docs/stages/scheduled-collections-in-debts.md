# Cobros programados en Mis deudas — 2026.11.16.7

Se mueve la función señalada en la captura, Administrar cobros programados, desde Nueva transacción a Mis deudas → Cobros programados. El nombre mantiene la naturaleza de los datos existentes: son cobros de ingresos recurrentes, no nuevos gastos ni deudas.

- Extraído el contenido existente a ScheduledCollections; usa los mismos MoneyStore.confirmSchedule y toggleSchedule, con las mismas fechas e identificadores.
- Retirados el botón y el contenido embebido de MovementForm/LedgerScreen. La opción de crear un ingreso recurrente se conserva.
- Añadida pestaña con color propio a las vistas existentes de deudas. La carga reutiliza la conexión/consulta monetaria del módulo.
- Avisos existentes de cobros abren /debts con tab=scheduled; identificadores estables y estados de lectura conservados.
- Sin migraciones, recálculos, cambios de clasificación, API, autenticación, límites o borrado de registros.

Validación: 14 casos correctos de interfaz de transacciones, navegación/colores de deudas e inbox; una regresión de recurrencia mensual con SQLite comprueba fechas, confirmación única, pausa y ausencia de cobros futuros automáticos. Total 15, sin repeticiones ni suite general. TypeScript correcto y ESLint sin avisos. Compilación/publicación registradas al cerrar. Dispositivos físicos y comprobación visual no disponibles en este entorno.
