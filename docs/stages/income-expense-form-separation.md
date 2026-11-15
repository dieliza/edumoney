# Separación de ingresos y gastos — 2026.11.15.17

## Diagnóstico
La rueda ya filtraba por kind, pero la revisión del escáner compartía un menú con gasto, ingreso y factura, sin un contexto superior claro. Los detalles del comprobante ofrecían las mismas preguntas de compras y nómina. El selector también ofrecía categorías heredadas llamadas Dictado por voz. Al cambiar entre formularios podían quedar selecciones y opciones abiertas de la otra operación.

## Cambios
- En revisión de escaneo, selector Gasto/Ingreso arriba del formulario. Cheques y talonarios proponen ingreso; recibos proponen gasto. Son propuestas editables: no se guarda ningún movimiento hasta pulsar Guardar.
- El menú Cómo guardar muestra solo el tipo financiero actual y sus adjuntos/notas. En ingreso no se ofrece gasto ni factura pendiente; las vinculaciones de ingreso muestran ingresos, y las de gasto muestran gastos/facturas.
- Cambiar de contexto limpia categoría, vínculos y selección de crédito incompatible. Los selectores se reinician con el contexto, impidiendo conservar menús/ruedas del tipo anterior. Se mantienen importe y fecha revisados cuando corresponden al mismo documento.
- Métodos con lenguaje de cobro para ingresos (Cheque recibido, efectivo recibido, transferencia/depósito) y pago para gastos. Crédito se ofrece exclusivamente en gastos, conforme a la validación existente.
- Rueda de categorías con categorías propias/personalizadas del tipo actual. Dictado por voz heredado no se ofrece para transacciones nuevas. Si un registro antiguo lo usa, se presenta como Por clasificar sin borrar ni reclasificar su información.
- Categorías creadas durante el formulario se conservan al cambiar de vista. La finalización tardía de una creación no puede seleccionar una categoría de gasto en ingreso ni viceversa.
- Formulario manual: campos de bruto/retención y cobros programados solo para ingresos; importe del gasto y crédito solo en gasto. Historial en ese formulario corresponde al tipo activo; ambos siguen accesibles cambiando Gasto/Ingreso y desde el historial general.
- Menús y campos del desglose se adaptan: cheques/talonarios muestran importes/acumulados del ingreso y aportaciones patronales cuando corresponden; compras muestran subtotal, cargos, partidas e impuestos del gasto. Se preserva toda la evidencia reconocida aunque un campo no se muestre en el contexto activo. No se recalculan impuestos, deducciones ni registros históricos.

## Archivos
ReviewForm.tsx, ReadingDetailsForm.tsx, reviewContext.ts, readingContext.ts; MovementForm.tsx, CategoryPicker.tsx, entryContext.ts; IncomeDocumentsScreen.tsx y BusinessReceiptForm.tsx para transmitir el contexto; buildVersion.ts. Pruebas de contexto/estado y actualización de expectativas del historial y versión ya existente del respaldo.

## Verificación
17 casos únicos comprobados; 21 ejecuciones totales incluidas repeticiones. Una ejecución inicial detectó una expectativa antigua de schema 17 cuando el proyecto ya usa 18: se corrigió solo esa expectativa y se repitió con éxito. Los demás casos pasaron.
Cobertura: opciones de ingresos/gastos, categorías personalizadas, eliminación de marcador heredado en nuevos selectores, cheque recibido guardado como paid_income por 49732 centavos y categoría Salario, cambio gasto→ingreso limpiando Vivienda/crédito, vuelta a gasto conservando categorías creadas, campos manuales y sus historiales, validación real de categoría/método en SQLite, conservación del desglose/total/exportación contable y respaldo/restauración.
TypeScript, ESLint y build web/PWA correctos; diff sin errores. Sin API real de Anthropic ni cargos de generación. No se ejecutó suite general ni receipt-labels. Por debajo de 100 casos.
Las pruebas de interacción son unitarias de estado/árbol de componentes; no equivalen a Safari físico. Pendiente comprobación visual en iPad/iPhone/Android. Entorno sin navegador de pruebas; fuente nativa actualizada, pero una APK/IPA anterior necesita nueva compilación para incorporar cambios de interfaz.
Sin migraciones, cambios en cálculos, precios, suscripciones, autenticación, sincronización o configuración/cuotas de Anthropic. No se modificaron transacciones existentes.
