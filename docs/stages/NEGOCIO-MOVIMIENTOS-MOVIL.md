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


### Corrección del guion Android

[42696209452](https://github.com/dieliza/edumoney/actions/runs/42696209452) falló antes de introducir datos: el alias YAML `id001` generado para un selector fue interpretado como texto por Maestro. Se expanden los selectores sin alias; la aplicación no cambia. Repetición [42696892099](https://github.com/dieliza/edumoney/actions/runs/42696892099), procedimiento `3435513`. Primer intento incluido en el presupuesto.


### Resultado Android

[42696892099](https://github.com/dieliza/edumoney/actions/runs/42696892099), procedimiento `3435513`, aprobado. Emulador Pixel 6 API 35, con Wi-Fi y datos desactivados: total $55.00, comercial $20.63; primer proyecto $33.00 y comercial $12.38; retorno a vista del titular; recibo manual y nota exacta conservados al reiniciar. Las capturas y aserciones se guardan en evidencia, sin bases ni claves.

### Seguimiento iOS

[42698356510](https://github.com/dieliza/edumoney/actions/runs/42698356510), procedimiento `fddf598`, en curso. Se reutilizan desplazamientos por el margen para evitar encabezado y barra inferior, comprobados en los recorridos previos de la misma navegación. No se repiten las pruebas unitarias. Presupuesto conservador previsto: 16 casos, incluyendo el intento Android fallido y siete comprobaciones internas XCTest si se ejecutan.
