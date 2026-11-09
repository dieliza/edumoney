# Nómina — tasas patronales y exportación móvil

Rama `negocio-05-tasas-exportacion-movil`. Sin cambios de código de aplicación respecto a `3f03c59`; se reutilizan las compilaciones Android 42665307671 e iOS 42664986263. No se modifica main ni se publica.

## Alcance

Formulario real con datos ficticios, sin precargar la base: titular y empleado, porcentajes SINOT 0.30, desempleo PR 3.40, crédito FUTA 5.40, reducción FUTA 0.00 y CFSE 1.50. La aplicabilidad se conserva pendiente y la fuente se identifica ficticia; no se presentan esas tasas como carta patronal real. Se guarda, reinicia y comprueba cada valor y la nota al volver a abrir el formulario. No se crea ningún pago.

Se abren los diálogos nativos de compartir conciliación CSV y borrador PDF, se captura el nombre del archivo y se cancelan sin seleccionar destinatario. Este caso con cero pagos prueba disponibilidad e interacción; los contenidos de pagos confirmados y minimización de identidad se verifican mediante la prueba de exportación seleccionada y la evidencia del bloque anterior. No se afirma emisión oficial ni entrega de documentos.

## Presupuesto y verificaciones

Seis casos unitarios seleccionados aprobados en una sola ejecución: cálculo SS/Medicare con tasas explícitas, FUTA incompleto, vigencia, aplicabilidad desconocida, límites de tasas y contenido mínimo CSV/PDF. Otras 30 pruebas omitidas; no se ejecuta suite completa. TypeScript y ESLint aprobados.

Escenario `payroll-policy-export` añadido al workflow existente, omitiendo la suite general. Procedimiento `80007a6`. Android [42684408082](https://github.com/dieliza/edumoney/actions/runs/42684408082) e iOS [42684414704](https://github.com/dieliza/edumoney/actions/runs/42684414704) iniciados, todavía sin resultado final. Seis casos terminados, dos activos; máximo 100 contando repeticiones.

## Evidencia

[Registro de ejecución y valores esperados](evidence/business05-policy-export-mobile/). Los valores esperados no son resultados medidos. Se añadirán capturas y resultados después de completar los recorridos.
