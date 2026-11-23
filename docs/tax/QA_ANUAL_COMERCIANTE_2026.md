# EduMoney — prueba integral de cierre contributivo (borrador, no radicado)

Fecha: 2026-11-23. Rama de revisión; no desplegar sin aprobación.

## Cambios oficiales por incorporar
- BI RI 26-06: https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-06-bi-ri-26-06
- 480.6D: distinguir ingresos exentos sujetos/no sujetos a CBA y excluidos (encasillado 23).
- 480.6G vs 480.6SP: conciliar informativas y ventas sin duplicar ingresos.
- 480.7E (encasillado 6) y 480.7F (encasillado 7): cargos bancarios/procesamiento de pagos.
- Anejo CT: cálculo solo cuando año, ingresos, composición familiar, residencia y elegibilidad estén verificados en instrucciones oficiales. No asignar crédito cero por ausencia de datos.

## Caso ficticio: comerciante individual, 2025-01-01 a 2025-12-31
- Ventas facturadas: $72,000.00; devoluciones: $2,000.00; ingresos netos de ventas: $70,000.00.
- Gastos documentados: materiales $12,000; renta $9,600; servicios $3,600; publicidad $2,400; comisiones de procesamiento $1,400; otros gastos $3,000. Total $32,000.
- Resultado contable ilustrativo: $38,000 ANTES de ajustes contributivos, depreciación, gastos no deducibles, contribución por trabajo propio y otros ajustes.
- Pago por servicios de $5,000 a proveedor con retención ordinaria: exceso sobre $500 = $4,500; retención ilustrativa $450 (si aplica y sin relevos).
- Un cobro de $1,000 por tarjeta ya incluido en ventas NO es $1,000 adicional de ingresos al recibir 480.6G.
- Comisiones bancarias $1,400 clasificadas por separado, sin duplicar gasto.
- Gastos personales nunca se deducen automáticamente del negocio.

## Prueba E2E requerida
1. Crear perfil DBA/individuo y doce meses de operaciones; importar comprobantes sin duplicados.
2. Conciliar banco, efectivo, Stripe y 480.6G con facturas y 480.6SP; mostrar diferencias.
3. Verificar retenciones acumuladas por proveedor/año y relevos.
4. Generar y descargar informe anual (ingresos, gastos, utilidad contable, retenciones, IVU separado, conciliación y fuentes).
5. Seleccionar tipo de contribuyente: individuo con negocio vs corporación vs entidad conducto; NO usar 482 para todos.
6. Preparar 482 y anejos aplicables con campos y cálculo verificables; si falta algún anejo, mostrar «incompleto» y descargar solamente borrador marcado.
7. Descargar PDF oficial cuando el mapeo esté validado; nunca simular certificación ni radicación SURI.
8. Comprobar que botones existentes siguen funcionando en iOS, Android y web, con datos ficticios.

## Criterios de aceptación
- Ningún ingreso ni gasto duplicado; conciliación explicable.
- Resultado contable no presentado como ingreso tributable ni impuesto adeudado.
- Crédito CT no calculado sin requisitos verificados.
- Exportaciones PDF distinguen informe contable, borrador 482 y planilla radicada (esta última solo con confirmación externa real).
- No almacenar SSN ni datos bancarios en archivos de prueba.
- Sin cambios de producción ni despliegues.

Estado: ESPECIFICACIÓN DE QA; no significa implementación ni prueba ejecutada.
