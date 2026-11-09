# Negocio — gasto mixto y recibo manual en móvil

Rama `negocio-movimientos-movil`. Continúa el cierre de respaldo y los recorridos pendientes de calidad. No se modifica main ni se publica. No hay cambios de código de aplicación respecto a `3f03c59`; se reutilizan los paquetes de simulador previos.

## Caso preparado

Se crea desde la interfaz un titular ficticio, dos proyectos, un gasto mixto de $55.00 y un reparto de $33.00/$22.00. Con 37.5% comercial, la parte comercial total esperada es $20.63 y la del primer proyecto $12.38. Se comprueban vistas por titular/proyecto, se adjunta un recibo manual con nota identificada y se reinicia para comprobar los mismos totales y el recibo.

No incluye cámara, fototeca, OCR, ingresos, edición o reservas mediante la interfaz. Esos elementos conservan sus pruebas de lógica/evidencia previa y no se declaran validados por este caso. La prueba utiliza solo datos ficticios introducidos mediante los formularios, sin sembrar la base.

## Pruebas locales

Seis casos de `tests/business-ledger.test.ts` aprobados en una ejecución: gasto compartido, recibo mixto, depósito neto, corrección comercial, rollback de reparto y reapertura SQLite. Catorce casos omitidos; no se ejecuta la suite completa. TypeScript y ESLint aprobados. YAML comprobado.

## Seguimiento móvil

Android se ejecuta primero para comprobar los selectores de los formularios existentes. Las ejecuciones, repeticiones y comprobaciones internas XCTest de iOS se añadirán al [presupuesto de ejecución](evidence/business-ledger-mobile/execution.json), con máximo 100. No se afirma aprobación por iniciar CI.

Nuevo escenario `business-ledger` en el workflow registrado, que omite las pruebas generales. Recorrido `.maestro/business-ledger.yaml`. [Valores esperados, no mediciones](evidence/business-ledger-mobile/expected-ficticio.json).
