# EduMoney — preparación contributiva guiada (especificación inicial)

Estado: diseño para implementación y pruebas; NO es una planilla certificada ni una función desplegada.

## Propósito
Preparar un borrador descargable alineado campo por campo con el Formulario 482 y los anejos oficiales del año contributivo seleccionado. EduMoney no radica ante Hacienda.

## Perfiles
- Asalariado: comprobantes de retención, otros ingresos, deducciones y créditos aplicables.
- Contratista / trabajador por cuenta propia: ingresos por servicios, retenciones, relevos, gastos deducibles, informativas y anejos comerciales pertinentes.
- Comerciante / dueño de negocio: ventas, devoluciones, costo de ventas cuando aplique, inventario, gastos, nómina, IVU separado de ingresos y conciliación de informativas.
- Individuo con ingresos mixtos: combinar fuentes sin duplicarlas y aplicar todos los anejos que correspondan.

## Flujo requerido
1. Seleccionar año contributivo y residencia/situación contributiva.
2. Importar 12 meses de registros de EduMoney sin alterar originales; conciliar cuentas, duplicados, reembolsos y movimientos entre cuentas.
3. Detectar perfiles combinados y seleccionar formularios/anexos según reglas oficiales versionadas por año.
4. Mostrar preguntas breves en español sencillo con ayuda contextual, opción «No sé» y documentos de respaldo requeridos.
5. Separar información confirmada, estimada y faltante; no calcular como definitiva una planilla incompleta.
6. Calcular ingresos, deducciones, retenciones, créditos y contribución solo con reglas verificadas y pruebas de referencia; incorporar Anejo CT y cambios BI RI 26-06 únicamente tras validación normativa.
7. Generar informe anual de conciliación y PDF de referencia con numeración, orden y encasillados de la versión oficial del Formulario 482 y anejos pertinentes. Incluir mapeo de cada valor a su fuente y advertencia «No radicado ante Hacienda».
8. Mantener los botones de descarga existentes, sin prometer radicación ni certificación.

## Reglas de seguridad y calidad
- No asumir que gasto contable equivale a deducción contributiva.
- No duplicar ingresos entre 480.6G y 480.6SP; registrar discrepancias.
- Separar reglas vigentes de propuestas y años 2025/2026.
- Proteger datos sensibles como SSN; no incluirlos en logs.
- Bloquear la etiqueta «listo para radicar» mientras falten datos o reglas validadas.
- Casos de prueba: asalariado, contratista, comerciante y perfil mixto con 12 meses, retenciones, gastos no deducibles, créditos, pérdidas, formularios faltantes y descargas.

## Criterios para aceptar el desarrollo
La aplicación debe producir un PDF de referencia cuyo valor, año, formulario, anejo y número de encasillado coincidan con el formulario oficial vigente; cada cálculo debe tener pruebas automatizadas y revisión normativa. Requiere implementación de código, pruebas y autorización antes de fusionar o desplegar.
