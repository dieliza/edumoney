# Registro de incidencias

## IOS-QA-10 — Automatización de entrevista contributiva

Estado: **resuelta en el recorrido de persistencia del simulador iOS**, 9 de noviembre de 2026. Ejecución 42647274836, job 129263822414, conclusión success. No bloquea los cálculos ni exige revisión de CPA.

Se revisó la ejecución 42626974236 y el job iOS 129193135032: terminaron con success. Sin embargo, la captura conservó `Cierre ficticio de pruebaT` y la aserción `Cierre ficticio de prueba.*` lo aceptó. El éxito histórico no demuestra que se haya introducido y recuperado el texto exacto. La interacción de foco/teclado sigue siendo la hipótesis principal; no se ha demostrado pérdida de datos.

La apertura/reapertura histórica conserva igual huella de la base, cabecera cifrada, rechazo de lectura sin clave y exclusión de respaldo. Evidencia anterior: ejecuciones 42612854920, 42624113429 y 42626974236. Android aprobó el recorrido histórico completo en 42608879499. Estas ejecuciones no validan por sí solas el código actual de Negocio.

Reparación implementada y verificada: botón estable para ocultar el teclado fuera del formulario desplazable, eliminación de toques sobre etiquetas movibles, espera de animación y aserciones exactas antes/después de cerrar teclado y tras reabrir. No se altera el texto guardado para hacer pasar la prueba.

[Informe y evidencia](stages/REPARACIONES-01.md). Mantener pruebas físicas y de distribución pendientes según QUALITY_RELEASE.md. No publicar la aplicación ni fusionar main.

Cierre: se comprobó el texto exacto antes/después de ocultar teclado y después de reiniciar, sin aceptar caracteres finales adicionales. El campo se revela por el margen exterior antes de tocarlo; el indicador focused de UITextView no es fiable en este driver y se sustituye en iOS por la comprobación exacta del contenido. Android conserva su comprobación de foco. El binario actual mantiene cabecera cifrada, rechazo de SQLite sin clave y huella estable al reabrir. [Captura del resultado correcto](stages/evidence/repair-iosqa10/ios-exact-reopened.png).

Continúan pendientes las pruebas físicas, la interacción comercial completa y la validación de distribución. No se fusionó main ni se publicó la aplicación.


## UI-NEGOCIO-01 — Nombre del estado documental en la ficha comercial

Estado: **resuelta en nuevas compilaciones de emulador Android y simulador iOS**, 11 de noviembre de 2026. Los recorridos históricos Android 42696892099 e iOS 42698356510 guardaron y recuperaron correctamente el recibo, pero su ficha mostraba el código `received` en lugar de una etiqueta española. El importe, nota y vínculo financiero se conservan. No bloquea cálculos ni requiere CPA.

Se reutilizan las etiquetas de `statusOptions` en la ficha y los botones: Recibido, Pendiente, Corregido y No aplica. Retirado conserva prioridad para documentos retirados; un código desconocido muestra Estado por confirmar. No se modifican códigos persistidos ni referencias. El recorrido Maestro exige Recibido en botón y ficha. Las nuevas compilaciones lo aprobaron: Android job 130288423060 y iOS job 130295486009. [Captura iOS](stages/evidence/business-ledger-mobile/ios-business-receipt-reopened.png) · [Informe](stages/NEGOCIO-MOVIMIENTOS-MOVIL.md).

[Implementación de UI-NEGOCIO-01](stages/UI-NEGOCIO-01.md) · [Verificación visual y capturas nuevas](stages/UI-NEGOCIO-01-VISUAL.md). Las capturas históricas anteriores muestran el estado previo a la corrección.


## QA-NEGOCIO-02 — Visibilidad del botón al volver de compartir en Android

Estado histórico del bloque anterior: **ajuste de automatización aplicado; reejecución pendiente**. En 43124881691, JSON y CSV comerciales se recibieron y validaron correctamente, y la aplicación volvió al formulario. La última aserción esperaba el botón CSV visible sin desplazar, pero estaba debajo de la vista. 4a2e38c añade scrollUntilVisible; no se ejecutó de nuevo para cerrar el presupuesto de diez casos conservadores de este bloque. No se declara aprobado ese trabajo Android ni se bloquea el cálculo o la exportación de la aplicación. iOS aprobó el mismo recorrido en 43125832018.

[Informe, capturas y presupuesto cerrado](stages/NEGOCIO-REVISION-EXPORTACION-MOVIL.md). No repetir los casos de este bloque ni reiniciar su contador.


### Cierre de QA-NEGOCIO-02 en la regresión de entrega

Estado actual: **resuelta en Android de emulador**, ejecución [43152429446](https://github.com/dieliza/edumoney/actions/runs/43152429446), job 130964538115, artefacto 13913919237, aplicación `7b918b9`. El recorrido completo terminó success: 136 comandos completados y 7 omitidos, incluido el desplazamiento final hasta Compartir CSV de movimientos después de volver del receptor. Se revisaron las capturas del CSV validado y del gasto reabierto: $55, 50% comercial/$27.50, repartos $30/$25 y un movimiento. El receptor local no guarda archivos ni usa red.

Es un caso nuevo de regresión del cierre autorizado, contado en `evidence/closure/execution.json`; no se reinicia ni altera el presupuesto histórico del bloque anterior. Destinos reales y teléfonos físicos continúan pendientes.


## UI-NEGOCIO-03 — Texto del calendario comercial sobre nómina

Estado al detectarlo: **pendiente de corrección de texto y verificación en nueva compilación**. El módulo de nómina ya existe, pero `planning/Forms.tsx` y `planning/domain.ts` todavía lo anuncian como próximo bloque. No afecta importes, almacenamiento ni ejecución de pagos. Detectado durante la revisión del panel; el bloque actual solo cambia automatización y pruebas y reutiliza binarios existentes.


### Resolución de UI-NEGOCIO-03

Texto corregido en `7b918b9`: Forms y calendario remiten a Nómina existente y a obligaciones por confirmar. Las nuevas aplicaciones Android/iOS compilaron con ese código; la corrección no cambia importes ni registros. No se presenta como una evaluación física de accesibilidad.
