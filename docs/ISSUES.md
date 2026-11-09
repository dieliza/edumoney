# Registro de incidencias

## IOS-QA-10 — Automatización de entrevista contributiva

Estado: **resuelta en el recorrido de persistencia del simulador iOS**, 9 de noviembre de 2026. Ejecución 42647274836, job 129263822414, conclusión success. No bloquea los cálculos ni exige revisión de CPA.

Se revisó la ejecución 42626974236 y el job iOS 129193135032: terminaron con success. Sin embargo, la captura conservó `Cierre ficticio de pruebaT` y la aserción `Cierre ficticio de prueba.*` lo aceptó. El éxito histórico no demuestra que se haya introducido y recuperado el texto exacto. La interacción de foco/teclado sigue siendo la hipótesis principal; no se ha demostrado pérdida de datos.

La apertura/reapertura histórica conserva igual huella de la base, cabecera cifrada, rechazo de lectura sin clave y exclusión de respaldo. Evidencia anterior: ejecuciones 42612854920, 42624113429 y 42626974236. Android aprobó el recorrido histórico completo en 42608879499. Estas ejecuciones no validan por sí solas el código actual de Negocio.

Reparación implementada y verificada: botón estable para ocultar el teclado fuera del formulario desplazable, eliminación de toques sobre etiquetas movibles, espera de animación y aserciones exactas antes/después de cerrar teclado y tras reabrir. No se altera el texto guardado para hacer pasar la prueba.

[Informe y evidencia](stages/REPARACIONES-01.md). Mantener pruebas físicas y de distribución pendientes según QUALITY_RELEASE.md. No publicar la aplicación ni fusionar main.

Cierre: se comprobó el texto exacto antes/después de ocultar teclado y después de reiniciar, sin aceptar caracteres finales adicionales. El campo se revela por el margen exterior antes de tocarlo; el indicador focused de UITextView no es fiable en este driver y se sustituye en iOS por la comprobación exacta del contenido. Android conserva su comprobación de foco. El binario actual mantiene cabecera cifrada, rechazo de SQLite sin clave y huella estable al reabrir. [Captura del resultado correcto](stages/evidence/repair-iosqa10/ios-exact-reopened.png).

Continúan pendientes las pruebas físicas, la interacción comercial completa y la validación de distribución. No se fusionó main ni se publicó la aplicación.
