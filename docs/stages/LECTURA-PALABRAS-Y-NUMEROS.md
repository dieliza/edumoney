# Lectura de palabras e importes desde fotografías

2026-11-13. Versión web 2026.11.13.10. Rama web-edumoney.

## Hallazgos del código

El lector web podía omitir la segunda lectura si la confianza general era alta y aparecía TOTAL, aunque no hubiera un importe legible. El parser de talonarios aceptaba principalmente cifras con punto y dos decimales y no compartía las correcciones conservadoras del parser de recibos. No se dispone de la foto concreta reportada por el usuario: los hallazgos son causas posibles observadas en código, no un diagnóstico de su imagen.

## Cambios

- Dos pasadas locales siempre: fotografía original con detección de inclinación y versión de contraste adaptativo con segmentación de texto disperso. Se conserva la misma corrección angular para comparar coordenadas.
- Agrupación por posición de rótulos y cifras. Las palabras reconocidas con alta confianza ya no impiden buscar números.
- Relectura de filas monetarias prioritarias (total/bruto/neto) y filas de deducciones sin cifras o con baja confianza, ampliadas hasta 2×. Máximo 12 filas por foto. No se usa una lista exclusiva de dígitos sobre la foto completa, que perdería las palabras.
- Si Tesseract detecta inclinación relevante, se mantienen las dos pasadas corregidas y se omiten los recortes: sus coordenadas no corresponden a la foto sin rotar. No se recortan regiones incorrectas.
- Se conserva el rótulo cuando otra pasada reconoce únicamente su columna numérica. Se mantienen las filas y columnas separadas por coordenadas.
- Parser monetario compartido para recibos y talonarios: punto/coma decimal, millares convencionales y espacios de impresión, por ejemplo 1,500.00; 1.500,00; 1 500 . 00; 55,00.
- Corrección acotada de O/I/l/S confundidos con 0/1/1/5 dentro de tokens monetarios que contienen dígitos. No se convierten palabras en cantidades ni se inventa un decimal ausente. La revisión indica que hubo corrección.
- Ante importes incompatibles de una misma fila, se marca revisión y se retira la cifra propuesta de esa fila. En Cheques y talonarios se dejan en blanco bruto, neto y deducciones numéricas cuando la captura informa discrepancia, conservando foto y rótulos para revisión manual. Nunca se reemplaza una cifra desconocida por cero.
- Si el talonario indica columnas actual/acumulado y solo se reconoce una cantidad en una fila, queda pendiente: no se asume que pertenece al pago actual.
- Foto original normalizada conservada como evidencia. No se añaden servicios remotos ni IA generativa. Se mantienen los modelos spa+eng locales, las confirmaciones, el guardado cifrado y el flujo manual existente.

## Archivos

- src/modules/documents/photo.web.ts: pasadas OCR y ampliación de filas.
- src/modules/documents/photoReadings.ts (nuevo): reconciliación por posición y discrepancias.
- src/modules/documents/printedAmounts.ts (nuevo): parser monetario compartido.
- src/modules/documents/receiptImage.ts: agrupación geométrica de filas.
- src/modules/documents/domain.ts: usa el parser común para totales.
- src/modules/income/recognition.ts: formatos numéricos, correcciones y columnas incompletas.
- src/modules/income/IncomeDocumentsScreen.tsx: respeta revisión de cifras discrepantes.
- src/ui/buildVersion.ts: marcador de actualización.
- tests/receipt-numbers.test.ts, tests/receipt-photo-pipeline.test.ts (nuevos): regresiones numéricas y flujo OCR con motor simulado.

Sin migración ni cambios de autenticación, datos guardados o módulos comerciales.

## Pruebas

57 ejecuciones aprobadas, incluidas repeticiones; límite 100 respetado.

1. receipt-numbers, receipt-photo, income-statements y receipt-ocr-local: 27 casos aprobados. Incluye una lectura con el motor Tesseract real y modelos locales sobre la imagen ficticia existente: total $55.00.
2. receipt-numbers, receipt-photo e income-statements tras ajustes: 28 aprobados.
3. receipt-photo-pipeline: 2 aprobados. Motor simulado para comprobar la secuencia de fotografía → relectura ampliada → total, incluso con confianza de palabras de 99%; también discrepancia y conservación de foto.

TypeScript, ESLint, git diff --check y compilación web: correctos. Sin QA visual en navegador por ausencia de cua_repl.js en este entorno Sites administrado. No se probaron fotos reales del usuario ni cámara de un dispositivo físico. No se compiló una APK nueva.

## Límites

Sombras, reflejos, papel curvado, desenfoque o resolución insuficiente pueden impedir leer cifras. No se promete lectura completa ni corrección garantizada. Las filas ampliadas pueden aumentar el tiempo de procesamiento local. Recibos muy largos pueden superar el límite de relecturas. Revisar la foto y completar manualmente permanece disponible.

## Remitente confirmado

El usuario confirmó acceso@prbudget.org para los futuros correos de EduMoney. Esta entrega mejora OCR; no activa ni afirma haber enviado correos de recuperación, cuyo trabajo de autenticación sigue separado.
