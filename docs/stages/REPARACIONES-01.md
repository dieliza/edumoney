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
- Validación nativa estricta aprobada en la ejecución 42647274836; detalles, capturas y alcance en el cierre de este informe. El entorno local es Linux: la prueba real se ejecutó en el simulador de GitHub Actions.

## Diagnóstico de la primera repetición estricta

La ejecución 42641895603 compiló el código actual a70f569. Falló antes de guardar: el campo estaba vacío y sin foco. La jerarquía sitúa `closure-notes` en y=141…189 y el control fijo del encabezado en y=132…180: el toque por identificador recaía en la zona superpuesta. [Captura](evidence/repair-iosqa10/ios-first-repair-occluded.png) y [coordenadas/estado originales](evidence/repair-iosqa10/occlusion.json). No se atribuye este fallo a SQLite.

Se ajusta el recorrido iOS para revelar el campo mediante un desplazamiento por el margen exterior, verificar su posición bajo el encabezado y comprobar foco antes de borrar/escribir. Se conserva la aserción exacta. La siguiente repetición reutiliza únicamente el binario actual de 42641895603, sin una nueva compilación ni reutilizar binarios anteriores a las reparaciones.

## Verificación del campo revelado y limitación del driver

La ejecución 42644597524 confirma que el desplazamiento deja el campo visible en y=366…414, con cursor y teclado activos. El driver informa `focused=false` en el UITextView, por lo que esa comprobación auxiliar no es fiable en esta combinación iOS/Maestro. Se conserva la verificación por foco en Android y, en iOS, se exige la escritura exacta antes/después de cerrar teclado y tras reiniciar. [Captura con cursor activo](evidence/repair-iosqa10/ios-visible-caret.png). Se reutiliza el mismo binario a70f569, sin cambiar el código ni los datos para hacer pasar las comprobaciones.

## Resultado final — IOS-QA-10 cerrada en simulador

La [ejecución 42647274836](https://github.com/dieliza/edumoney/actions/runs/42647274836), job iOS 129263822414, terminó con **success** en iPhone 17 Pro / iOS 26.4. Fuente del recorrido: 5a65000; binario compilado desde el código de aplicación a70f569 en 42641895603. Los commits posteriores modifican pruebas y documentación, no ese código de aplicación.

- Campo visible bajo el encabezado, escritura de `Cierre ficticio de prueba` y comprobación exacta antes/después de ocultar teclado.
- Motivo de cierre escrito y confirmado; entrevista guardada localmente.
- Aplicación detenida y abierta de nuevo; navegación al mismo año y comprobación exacta de la nota recuperada, sin T añadida.
- Cabecera cifrada y rechazo de lectura mediante SQLite sin clave. Huella idéntica antes/después de la reapertura: `6f2b81027001539c141c00dde93782ddfeab7d73dbf5b653da67b13e6a9ba3de`. Exclusión de respaldo comprobada por ios-smoke.sh, parte del paso aprobado.

[Antes de guardar](evidence/repair-iosqa10/ios-exact-before-save.png) · [Nota exacta recuperada](evidence/repair-iosqa10/ios-exact-reopened.png) · [Recorrido completo aprobado](evidence/repair-iosqa10/maestro-exact-persistence.log).

Las 268 pruebas locales y los seis recorridos web aprobaron. Se mantiene pendiente la interacción completa de los formularios comerciales en dispositivos, accesibilidad con lectores nativos y pruebas físicas/distribución según QUALITY_RELEASE.md. Este cierre resuelve el recorrido de entrevista iOS; no declara completa toda la validación de publicación. Sin fusión de main ni publicación de la aplicación.
