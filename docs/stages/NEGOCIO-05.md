# Negocio 5 — Nómina

Entrega aislada en `negocio-05-nomina`, sobre el bloque de panel y escenarios (`5874970`). No modifica main, publica la aplicación ni añade notificaciones push.

## Implementación

- Acceso a Nómina desde cada titular de Negocio; reutiliza navegación, temas, formularios y SQLCipher. Sin empleados de ejemplo automáticos.
- Empleados con código único por titular, salario por período o tarifa/horas, frecuencia semanal/bisemanal/quincenal/mensual y resumen del 499 R-4: exención personal, veterano, dependientes completos/mitad, concesiones, adicional y fecha del certificado. Se admiten únicamente los últimos cuatro dígitos de identificación, opcionales.
- Perfil patronal anual con aplicabilidad explícita, tasas, carta/fuente, clase CFSE y fechas de vigencia. FUTA no presupone crédito completo ni reducción cero; desempleo y CFSE no reciben una tasa inventada.
- Cálculo determinístico 2026 con tablas PR, Seguro Social, Medicare/adicional, SINOT y aportaciones patronales según los datos declarados. Los importes desconocidos permanecen pendientes. No exige revisión de CPA para calcular.
- Cada cálculo conserva el empleado, certificado, perfil y catálogo utilizados. Confirmar un pago requiere introducir/revisar bruto, bases, retenciones, neto y comprobante reales. Los importes deben cuadrar; una simulación no integra acumulados de pagos.
- Depósitos por nómina/agencia separados de retenciones, con partidas y referencias únicas. Conciliación por empleado/año: calculado, retenido, obligación y depositado. Retener menos FICA no reduce su obligación calculada.
- Control de duplicados, titular, versiones, comprobantes y orden temporal. El saldo inicial importado se mantiene separado de los pagos guardados. Cambiar un perfil no reescribe pagos históricos. Anulaciones y correcciones de depósitos conservan auditoría; no revierten dinero en bancos/agencias.
- Borrador PDF imprimible de trabajo para 499R-2/W-2PR y CSV de acumulados/conciliación por agencia. Excluyen nombres, últimos dígitos, certificado y notas privadas. El PDF usa códigos de empleado y se identifica en todas sus páginas como no emitido/no radicado; no replica el formulario oficial ni es un archivo de presentación electrónica.
- Esquema 14 con empleados, perfiles, nóminas y depósitos; migración atómica y respaldo cifrado. Se admiten respaldos 9–14 con advertencia de que restaurar anteriores reemplaza también la nómina actual.

Los registros de nómina **no generan automáticamente movimientos financieros**. Se debe conciliar netos y depósitos con los movimientos existentes: sumar bruto, neto y retenciones como tres gastos duplicaría cantidades. Esta entrega no ejecuta pagos ni incorpora una integración automática de nómina con el panel de efectivo/reservas.

## Archivos principales

- `src/modules/business/payroll/`: modelos, fuentes, cálculos/validación, persistencia, formulario, pantalla nativa, vista web informativa, conciliación y exportación.
- `src/app/business-payroll.tsx`; accesos en `BusinessScreen.tsx` y `BusinessRoute.tsx`.
- `src/storage/schemaV14.ts`, migrador y módulo de respaldo.
- `tests/business-payroll.test.ts`, recorrido web y adaptaciones de fixtures de migración anteriores.
- Catálogo documentado en [fuentes 2026](../tax/payroll-2026/SOURCES.md); evidencia en [business05](evidence/business05/README.md).

## Verificación

- TypeScript y ESLint aprobados.
- **345 pruebas aprobadas** en 22 archivos: 309 anteriores y 36 de nómina. Incluyen ejemplo oficial PR, cuatro frecuencias, topes, Medicare adicional sin pareo, bases SINOT/desempleo, crédito FUTA incompleto, tarifas/horas, precisión/rango, datos desconocidos, tasas vencidas, pago real discrepante, retención insuficiente, duplicados, correcciones, conciliación, PDF/CSV, reapertura SQLite, migración 13→14 y respaldo/recuperación 13/14.
- Dos pagos ficticios de $2,200 producen bruto acumulado $4,400 y retención PR real $109.82; depósito parcial $20 deja diferencia PR $89.82. Los cálculos no crean movimientos financieros adicionales.
- Ocho recorridos web: ambos temas, contraste axe, anchos 320/390/430/768, navegación y retorno. La web es informativa; estos recorridos no prueban los formularios nativos de nómina.
- Exportación JavaScript web/iOS/Android; no equivale a una compilación firmada ni a una nueva prueba de interacción en dispositivos.

## Pendientes antes de uso en producción

1. Interacción, teclado, accesibilidad, permisos de compartir y reinicio de los nuevos formularios en iPhone/Android. La reapertura SQLite automatizada no sustituye esta prueba.
2. Contrastar cálculos/centavos con vectores externos y validar el criterio de truncamiento PR documentado junto al ejemplo de Hacienda. Mantener actualizados los catálogos por año, sin usar 2026 en otro año.
3. Completar las tasas/cubiertas asignadas a cada patrono, sus vigencias y el historial anterior. Prima CFSE es una estimación por clase declarada, no una liquidación oficial.
4. Situaciones fuera del caso ordinario: beneficios/exclusiones, retiro, propinas, bonos, jóvenes, retención federal sobre ingresos, empleo doméstico/agrícola y cálculo legal de horas extraordinarias. Permiten registro documentado; las fórmulas no cubiertas se señalan como pendientes.
5. Antes de **emitir oficialmente** 499R-2/W-2PR: validar formato del año, identidad completa, casillas/códigos, acumulados, diferencias, depósitos, correcciones y trámites Hacienda/SSA. No se exige que esta revisión la haga un CPA para utilizar los cálculos de EduMoney.

Se detiene el trabajo al concluir este bloque, según la instrucción del usuario.
