# Mis deudas: acceso único a Facturas y selector de calendario

## Cambios solicitados

- Se retira únicamente el botón Facturas vinculadas dentro de Simuladores. Se conserva Préstamo · Auto · Vivienda, su selector interno y el acceso principal Mis facturas. La explicación remite a Mis facturas.
- Calendario de Facturas reutiliza MonthPicker, el selector existente de Mi progreso, en lugar del campo de texto Mes del calendario (AAAA-MM). En Web es un control nativo de mes/año con botón de calendario; el valor interno sigue siendo AAAA-MM para conservar filtros y registros.
- La selección continúa actualizando las facturas y el mes de las aportaciones de Mis metas. No se modifican fechas guardadas, vencimientos, pagos, saldos, cálculos financieros ni datos IRA.

## Alcance técnico

Fuentes funcionales modificadas: src/modules/debts/DebtSimulators.tsx y src/modules/bills/BillsScreen.tsx. Sin migraciones, pantallas ni herramientas nuevas. Se conserva el diseño y se reutiliza MonthPicker con ThemeProvider.

El paquete Web modifica solo los módulos43001 y849. En Bills se reemplaza únicamente la llamada del campo de mes y su mensaje de validación; se conserva el resto del módulo Web, incluidas sus personalizaciones anteriores. El selector compartido32013 se registra en el código común para que Facturas lo tenga disponible al abrir. Se conservan1,465 módulos ajenos al cambio y todas las rutas/alias anteriores. Los manejadores de push y actualización segura del service worker se mantienen, con una caché distinta para esta publicación.

## Pruebas

- 43 pruebas de facturas, deudas y control de mes aprobadas.
- 4 comprobaciones del componente compilado aprobadas: acceso único del simulador, navegación existente, actualización del filtro y GoalCalendar al cambiar mes, control nativo type=month y llamada showPicker, y registro del selector antes de abrir Facturas.
- 9 comprobaciones del paquete aprobadas: hashes de fuentes, dos módulos afectados/cero nuevos, service worker y precarga, regla contributiva mensual intacta y respuestas HTTP del Worker.
- TypeScript, ESLint de las dos fuentes y git diff --check aprobados.
- El controlador reutilizado de pruebas tenía primero un mock que sustituía BillsScreen y luego una referencia antigua al identificador de GoalCalendar; se corrigieron exclusivamente esos mocks. Se cuentan sus cuatro intentos de caso, incluidas repeticiones, dentro del máximo de100.
- Total antes de comprobación HTTP de producción:60 ejecuciones (43+4+9+4 intentos previos). No se repitieron las suites financieras.
- No se realizó prueba visual interactiva ni en dispositivos físicos: no está disponible la herramienta de navegador administrado. Las comprobaciones de apertura de calendario verifican la llamada del componente; no simulan una interacción física con Safari.

Se usaron exclusivamente datos ficticios para comprobar el filtro. No se modificaron datos de usuarios.

## Publicación

Versión160 publicada correctamente. Source59b5301b0ba7a5cb6e1e85bb83b3f084496459ea. Se conservan acceso público y env revision4. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site . Ver publication.json. La página /bills?view=calendar y el service worker sirven200 con el build nuevo (production-http.json).

Total del bloque:62 ejecuciones incluyendo repeticiones del controlador y dos comprobaciones HTTP de producción. Las43 pruebas de datos,4 comprobaciones finales de componentes,9 del paquete y2 HTTP están aprobadas.
