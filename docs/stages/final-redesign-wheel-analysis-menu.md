# Ajustes finales A + B — 2026-11-14

Versión de aplicación: 2026.11.14.13. Rama de trabajo: web-edumoney.

## Implementación

- Categorías de Nueva transacción: una rueda vertical, selección central destacada, ajuste a la fila más cercana y lista virtualizada. Categorías del tipo elegido, incluidas personalizadas; una categoría archivada ya seleccionada sigue visible al editar. Botón separado «+ Añadir categoría». Se mantienen el guardado y las validaciones existentes.
- Web/PWA: flechas, Inicio/Fin, avance por páginas y búsqueda escribiendo el nombre; listbox con selección y posición accesibles. Nativo: lista con ajuste por fila y acciones accesibles de incremento/decremento.
- Mi dinero: saldo estimado, gráfica compacta inmediatamente debajo y Top 3 ordenado por gasto descendente. La flecha abre todas las categorías del mismo mes.
- Gráficas y categorías: tendencias de seis o doce meses, comparación de ingresos/gastos y evolución por categoría. Desglose del período y acceso a categorías/presupuestos y transacciones existentes. No repite un Top 3 independiente. Las cifras reutilizan monthlySummary; no se creó una fórmula financiera nueva.
- Menú del encabezado: configuración, lector de fotos, sincronización, respaldo, Para mi contable/exportación, ayuda y cierre. Se cierra al elegir, tocar fuera o Escape. Los accesos administrativos repetidos salieron de los menús operativos.
- «Cerrar sección» web/PWA usa exactamente la recarga del bloqueo anterior, que elimina claves en memoria; no navega a una pantalla fingiendo cerrar. La APK nativa no tenía ese bloqueo autenticado: no se añadió un cierre ficticio ni se modificó su autenticación. Un cierre nativo nuevo requiere un alcance autorizado aparte.
- Se retiró la etiqueta del proveedor de IA de las pantallas de selección de fotos. Se conservan configuración, autorización, privacidad y procesamiento de documentos.
- Se conservan colores, tipografía, tarjetas, navegación inferior y gráficas del diseño actual. No se añadieron dependencias.

## Archivos

Nuevos: ui/WheelPicker(.web).tsx, ui/wheelModel.ts, ui/SideMenu.tsx, ui/closeSection(.web).ts, ui/ExpenseTopThree.tsx, ui/HistoryTrend.tsx, modules/money/analysisModel.ts, modules/money/ChartsScreen.tsx y app/charts.tsx.
Ampliados: CategoryPicker, LedgerScreen, MoneyScreen, MonthlyCharts, components, ActionMenu, DocumentsScreen, IncomeDocumentsScreen, SettingsScreen, SecuritySettings.web y buildVersion. Dos archivos de pruebas nuevos.

## Comprobaciones realizadas

32 casos automatizados aprobados, sin ejecutar la suite completa:

- final-redesign.test.ts: 7. Rueda/listas largas y teclado; estructura accesible renderizada en servidor (5,000 categorías, 21 filas montadas); validación; Top 3; períodos; cierre web por recarga.
- final-redesign-persistence.test.ts: 1. SQLite real: crear categorías de ingreso y gasto, guardar movimiento, rechazar cambio de tipo y reabrir conservando categoría e importes. Historia y resumen coherentes.
- ledger.test.ts: 15. Persistencia, clasificación, importes, categorías, auditoría, recurrencias, validación y cálculos existentes.
- monthly-charts.test.ts: 4. Totales, categorías, exclusión de registros eliminados/otro mes y ausencia de doble conteo.
- backup.test.ts: 5. Regresión del respaldo existente.

TypeScript y ESLint: sin errores ni advertencias. Compilación Expo web/PWA: correcta. Empaquetado y publicación registrados al completar el despliegue.

No se realizaron migraciones ni cambios de API, autenticación o lógica financiera. Las migraciones existentes solo se ejecutaron en bases ficticias de prueba.

## Pendientes de validación física

Este entorno no dispone de navegador interactivo ni iPhone, iPad o Android físico. No se afirma haber probado gestos, inercia, VoiceOver/TalkBack, cierre por interacción o apariencia real en esos dispositivos. El renderizado en servidor no sustituye esas pruebas. Verificar en Safari/PWA de iPhone/iPad, Chrome Android y escritorio: deslizar y detener, teclado/lector de pantalla, crear/seleccionar/guardar categoría, abrir desglose por flecha y cerrar menú con selección/fuera/Escape. La APK instalada necesita una compilación nueva para recibir código nativo; esta entrega publica la web/PWA.

## Publicación

- Sites versión 31; despliegue succeeded: appgdep_6af86ae496148191887c4db27639bb0c.
- Versión guardada: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_4ee5737dfb988191b34a29d1532355b7.
- Fuente de alojamiento: dc1a75bb217bf1140684d92735845659fa985b41. Implementación en rama web-edumoney: e2424a3. No se modificó main de GitHub.
- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- HTTP con curl: inicio, desglose del mes y categorías devuelven 200; cuatro archivos cliente públicos descargados (index, common, money, charts), idénticos byte por byte a la compilación 2026.11.14.13. Esto verifica disponibilidad, no interacción ni autenticación.
- Dos intentos de urllib recibieron 403; curl sí accedió correctamente. Un HEAD adicional obtuvo 200. Diez solicitudes HTTP en total, incluidos intentos. La primera búsqueda de textos no consideraba los archivos por ruta ni el escape de caracteres; se sustituyó por comparación exacta de los cuatro archivos. Presupuesto conservador del bloque: 44 comprobaciones contando 32 casos automatizados, diez solicitudes y dos validaciones del contenido del cliente; menor a 100.
- Audiencia pública y variables del servidor conservadas, revisión de entorno 1.
