# Presupuesto mensual — informe de implementación

Trabajo en `feat/monthly-budget-center` de `dieliza/edumoney`. La producción se sirve desde la rama `main` del repositorio de Sites; base publicada: versión 130, commit `7c49a129a08f79eeaac6400243802a444441f990`. No se sustituye la aplicación con una exportación antigua de Expo: se integran los módulos del presupuesto conservando los demás módulos publicados.

## Implementación

- Acceso directo por la ruta existente `/funds?kind=budget`: mes/año, ingresos netos proyectados ajustables, ingresos recibidos/programados/estimados, círculo sólido en vivo, seis categorías de referencia, importes, totales y guardado.
- Categorías y subcategorías configurables: nombre, color, orden, estado, vínculos únicos con categorías del libro y fondos. Restablecimiento recomendado 50/15/10/10/10/5 por solicitud, con reparto exacto de centavos. El borrado de una categoría no elimina registros financieros.
- Borradores incompletos o deficitarios; activación solo con distribución completa sin exceso. Edición con versiones para detectar cambios concurrentes. Original activo conservado.
- Comparación presupuestado/utilizado, barras, restantes/excesos, semáforo explicable, resumen y proyección compactos. Los meses cerrados no vuelven a proyectar cantidades pendientes.
- Gastos anuales: vencimiento, importe, fondo existente, progreso, aportación mensual/última aportación, recurrencia al completar, edición y eliminación. La opción de calendario reutiliza BillsStore. Los ejemplos son informativos y no crean dinero ni facturas.
- Reservas anuales mediante TransferEditor/FundsStore. Un destino nuevo solo se materializa dentro de la primera transferencia confirmada, en la misma transacción SQL. El sobregiro revierte también esa creación; el ID de transferencia evita duplicados.
- Historial con selección, comparación de dos períodos, original frente al plan editado y resultados reales, copia sin sobrescritura y borrado individual/múltiple confirmado. Los registros contables y fondos se conservan.
- Aprende recibe señales locales mediante ordenamiento de sus lecciones disponibles. No añade botones, tarjetas, lecciones duplicadas ni marcas de lectura; no envía importes financieros al servidor.

## Sistemas reutilizados

MoneyStore y categorías del libro, schedules/nextOccurrence para cobros programados, FundsStore/FundTransfers/TransferEditor/fundSummary, metas vinculadas a fondos, BillsStore y recurrencias/calendario, DebtStore, EducationPanel y catálogo existente, ThemeProvider, FundSheet/TransactionSheet, DateField, notificaciones de cambios y respaldo/sincronización existentes.

## Datos y migración

Esquema local cifrado 20: añade `budget_plans` y `budget_plan_revisions`. Migración transaccional, aditiva e idempotente desde 19; no elimina movimientos, imágenes, recibos, metas, fondos ni transferencias. Los límites activos se reflejan en `monthly_budgets`, reutilizado por las estadísticas existentes. El plan nunca reserva dinero por sí mismo. Respaldos nuevos incluyen las dos tablas; se mantiene lectura de formatos 9–19. Una restauración inválida revierte por completo.

No hay migración de Supabase, cambios de autenticación, permisos, servidor financiero ni llamadas bancarias. Se conservan los espacios cifrados por usuario y la separación personal/comercial.

## Archivos

- `src/modules/budget/`: dominio, tipos, almacenamiento y componentes web del centro, gráfica, controles, categorías, paneles, anualidades, historial e integración educativa. El archivo nativo conserva su acceso de transferencias anterior; el centro nuevo se entrega en EduMoney Web/PWA.
- Integración: `src/modules/funds/{FundsScreen,TransferEditor}.tsx`, `src/modules/funds/store.ts`, `src/modules/goals/MonthlyBudgetEditor.tsx`, `src/modules/education/EducationPanel.tsx`.
- Persistencia: `src/storage/{schemaV20,migrate}.ts`, `src/modules/backup/{store.ts,BackupScreen.tsx}`.
- Pruebas: `tests/monthly-budget{,-ui}.test.ts`; expectativas del esquema en pruebas existentes de fondos, educación y documentos.
- Publicación verificable: `web-enhancements/monthly-budget/`, `scripts/publish-monthly-budget.py`, evidencia en este directorio.

## Reglas de cálculo

Importes enteros en centavos; sumas y repartos con BigInt, validación de rango. El círculo usa ingresos proyectados/recibidos, o identifica explícitamente el total asignado/utilizado si supera esa base. Neutral para cantidades no asignadas. Sin división por cero. Categorías de transacciones y fondos se vinculan una sola vez entre categorías activas.

Las compras con tarjeta se reconocen en el gasto; el pago posterior no vuelve a consumir la categoría. Las transferencias cambian la distribución, no ingresos/gastos ni el total de fondos. Las facturas pendientes se comparan con la asignación correspondiente, evitando sumar dos veces el mismo importe previsto. Las reservas e inversiones planificadas reducen el disponible proyectado y no el total. Ingresos programados no se confirman desde el presupuesto.

El semáforo se apaga sin datos; rojo por déficit o gastos superiores al ingreso, amarillo por consumo de al menos 90% de una categoría o retraso proporcional del ahorro; verde en los demás casos con datos. La explicación está disponible al pulsarlo y no se presenta como evaluación crediticia.

## Validación y límites

Resultados y estado exacto de publicación se completan en `validation.json` y `source-result.json`. Se usan únicamente bases SQLite efímeras con datos FICTICIOS. Se cuentan las repeticiones dentro del máximo inicial de 100 casos indicado en AGENTS.md, ampliado explícitamente por el usuario a 120 en este bloque.

Este entorno de Sites no dispone de navegador interactivo ni dispositivos Safari/iPhone/iPad/Android. Las pruebas de representación HTML/SVG, temas y composición adaptable no equivalen a validación física en esos dispositivos. No se afirmará que se hayan obtenido capturas ni probado dispositivos reales.

Corrección final de proyección: las reservas de gastos anuales se financian dentro de su categoría presupuestada. Su aportación pendiente se resta del consumo ordinario planificado de esa categoría y se presenta como reserva; no se suma dos veces. Si el vencimiento ya está incluido como factura pendiente del mes, no se vuelve a añadir una nueva reserva proyectada. Se probó el ciclo completo antes/después de aportar y al revertir.

Proyección de tarjetas: las facturas pendientes de pago de deuda reducen el efectivo estimado, pero no se suman a los gastos ordinarios estimados. Se verificó una compra a crédito ya registrada junto con su factura de pago pendiente. El panel muestra las salidas de efectivo pendientes por separado.

## Resultado final

Publicado en producción: **versión 131**, commit Sites `b845014f87b41fe3bfa232555eff5f7c8d36f409`, build `monthly-budget-ad667c500eb4`.

URL: https://edumoney-web.diegoluissantospabon.chatgpt.site

Despliegue `appgdep_6b089a7fe7308191a5c14973210bb689`: `succeeded`; configuración de servicios conservada en revisión 4. Se comprobó el HTML público, el módulo con las dos correcciones finales de proyección y el service worker publicado. No se accedió a datos de usuarios.

**50 casos distintos validados; 119 ejecuciones contando repeticiones, dentro de las 120 aprobadas.** TypeScript y ESLint pasan; build local y cinco comprobaciones de integración/entrega pasan. Los fallos iniciales de fixtures y verificadores se corrigieron. Las pruebas financieras relevantes pasaron después de las correcciones; no quedan casos fallidos pendientes. Detalles en `validation.json`, `artifact-check.json` y `public-delivery.json`.

Incidencia de verificación pendiente: no hay navegador interactivo ni dispositivos físicos en este entorno; la revisión visual y los recorridos reales en Safari/iPhone/iPad/Android continúan sin verificar. La entrega es EduMoney Web/PWA; el acceso de la aplicación Expo nativa conserva su comportamiento anterior.

Código e informe guardados en https://github.com/dieliza/edumoney/tree/feat/monthly-budget-center .
