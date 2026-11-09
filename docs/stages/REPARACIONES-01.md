# Reparaciones — entrevista iOS y límites de Negocio

9 de noviembre de 2026. Se mantiene la rama `negocio-03-ivu-contratistas`. Sin fusión en main ni publicación de la aplicación.

## Diagnóstico y cambios

**IOS-QA-10:** se revisaron el job 129193135032 y las capturas de la [ejecución 42626974236](https://github.com/dieliza/edumoney/actions/runs/42626974236). El recorrido histórico figuró como aprobado y conservó `Cierre ficticio de pruebaT`. Su aserción `Cierre ficticio de prueba.*` aceptaba la T adicional, por lo que el resultado no demuestra una entrada exacta. No se encontró evidencia de pérdida de datos: la nota se recuperó y la base mantuvo la misma huella antes/después, cabecera cifrada y rechazo de SQLite sin clave. Se conserva [la captura original](evidence/repair-iosqa10/ios-previous-text-reopened.png) y los dos JSON de integridad.

Se añade un botón accesible «Ocultar teclado» fuera del desplazamiento de las pantallas con formulario. Se usa Keyboard.dismiss de React Native 0.88 para cerrar y quitar foco sin tocar etiquetas cuya posición puede cambiar con el teclado. Los recorridos completos y de persistencia dejan de usar el toque sobre esas etiquetas, esperan la animación y comparan la nota exacta antes y después de cerrar el teclado y al reabrir. No se corrigen ni recortan notas del usuario automáticamente. La hipótesis del toque desplazado sobre el teclado requiere confirmación en la nueva ejecución estricta.

**Límites financieros vinculados:** se reprodujeron cuatro fallos con SQLite antes de modificar el servicio. Un registro anterior con importe null desactivaba la comprobación del conjunto, permitiendo superar IVU, ventas brutas o gasto vinculado con importes ya conocidos. Un componente parcial del IVU también podía superar el límite. Se comprueba ahora el mínimo demostrado por los importes conocidos, incluso si quedan otros pendientes. Esto se usa únicamente para rechazar repartos imposibles; no convierte datos desconocidos en cero en registros, informes ni cálculos contributivos. Se valida además que los componentes conocidos no superen su propio total confirmado. Las escrituras rechazadas revierten y se conserva el reparto anterior.

**Anulaciones:** errores de motivo/anulación se muestran dentro del diálogo activo. Durante la operación se impide cerrar o volver a confirmar desde ese diálogo.

**Cambio de año:** la entrevista no presenta el formulario anterior como si fuera del año recién elegido ni permite guardarlo mientras se carga el nuevo expediente. Se conserva el año de los datos cargados y se verifica antes de guardar. No cambia la política de cálculo sin requisito de CPA.

## Verificación

- 268 pruebas de lógica/SQLite aprobadas; seis casos nuevos cubren los límites con pendientes y la aceptación del caso parcial válido. Los cuatro casos iniciales fallaban antes de la reparación y pasan después.
- TypeScript y ESLint aprobados. Empaquetado JavaScript web, iOS y Android aprobado; no equivale a prueba interactiva ni APK/IPA firmados.
- Sintaxis YAML de ambos recorridos Maestro comprobada. Las nuevas aserciones son exactas, sin comodín que acepte una T extra.
- Seis recorridos de navegador aprobados, con navegación, ambos temas, contraste y anchos adaptables. La comprobación adicional de respaldo conserva exactamente notas con acentos, salto de línea y T final.
- Pendiente ejecutar la nueva validación nativa estricta. El entorno local es Linux y no tiene Xcode/simulador iOS; el éxito histórico no se presenta como prueba de esta reparación.
