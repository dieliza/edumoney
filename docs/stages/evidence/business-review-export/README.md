# Revisión comercial y exportación — evidencia

Datos exclusivamente ficticios. No se incluyen bases, claves, archivos de contribuyentes ni aplicaciones compiladas. El receptor Android solo lee el URI compartido en memoria; carece de permisos de red y no guarda archivos.

## Android

- [Clasificación, nota y reparto conservados tras reiniciar](android/commercial-review-reopened.png).
- [Resumen del expediente](android/commercial-export-summary.png).
- [JSON recibido y validado](android/commercial-received-json.png).
- [CSV recibido y validado](android/commercial-received-csv.png).
- [Resultado funcional y fallo de la última aserción](android/result.json).
- [Formulario al regresar del receptor: botón CSV debajo de la vista](android/return-to-export-form.png).

Los dos archivos validaron gasto 5500, parte comercial 2750 y personal 2750 centavos, dos filas con el mismo movimiento, porcentaje 5000 puntos básicos, nota exacta y estado `changes`. JSON comprobó pendientes y ausencia de imágenes no seleccionadas. El trabajo de CI terminó con fallo en la aserción final: después de volver del receptor, el botón CSV estaba debajo de la zona visible. La aplicación había vuelto al formulario. El desplazamiento se corrigió sin repetir casos; no se declara CI aprobado.

## iOS

- [Revisión conservada después de reiniciar](ios/commercial-review-reopened.png).
- [Menú de compartir JSON](ios/commercial-share-json.png).
- [Menú de compartir CSV](ios/commercial-share-csv.png).
- [Resultado y único controlador XCTest](ios/result.json).
- [Base cifrada](ios/database-check.json) y [reapertura con igual huella](ios/database-reopened-check.json).

El trabajo iOS terminó con success. Se comprobó apertura y cancelación, sin enviar a una aplicación externa. No se afirma lectura independiente de los archivos en iOS. Se inspeccionaron las tres capturas enlazadas.

[Presupuesto total y ejecuciones](execution.json): diez casos conservadores, incluidos cancelación y fallos. Ningún caso adicional de este bloque.

## Intentos anteriores

[Cancelación conservadora](cancelled-attempt.json), [primer Android](android-first-result.json) y [primer iOS](ios-first-result.json). Las capturas `*-note-replacement-failure.png` muestran la nota con el sufijo que dejó la automatización; son diagnóstico anterior, no el estado corregido.

Las capturas corresponden a partes visibles de pantallas desplazables. Los pasos de Maestro no se cuentan como casos separados. El informe de etapa conserva el presupuesto total, incluidas repeticiones, cancelación y controlador iOS.
