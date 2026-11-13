# Talonarios tabulares y menús compactos

Fecha: 2026-11-13. Rama de aplicación web-edumoney. Versión web 2026.11.13.11.

## Problema reproducido con la foto aportada

El motor local reconocía números, pero el parser descartaba importes pegados a reglas de la tabla, por ejemplo `$552.58]`. También se concatenaban salario y deducciones de dos mitades de una fila. Una pasada parcial se confundía con una contradicción frente a otra más completa, y el formulario dejaba todos los importes en blanco ante cualquier discrepancia. El contraste/ampliación podía además reemplazar cifras correctas de las lecturas primarias.

La imagen del usuario se procesó localmente y no se incorpora al código, fixtures públicos, archivos exportados ni despliegue. Los casos persistentes de parser/almacenamiento emplean datos ficticios; la prueba óptica privada solo se activa indicando EDUMONEY_PAYSTUB_PHOTO.

## Implementación

- Dos lecturas primarias del original: segmentación automática y texto disperso, con coordenadas compatibles. Se utiliza la imagen enderezada que devuelve el motor para ampliar filas inclinadas sin recortar regiones incorrectas.
- Contraste y ampliaciones son lecturas auxiliares. Una secuencia parcial compatible no invalida otra más completa. Las lecturas auxiliares incompatibles con cifras primarias no las borran. Las contradicciones primarias se mantienen pendientes por fila.
- Parser monetario acepta separadores de tabla junto a las cifras y números contiguos a rótulos, además de los formatos decimales anteriores.
- Parser tabular separa las columnas de ingresos y deducciones, incluso con ruido del fondo delante del código. Separa bruto y neto que comparten una fila y excluye sus acumulados YTD del importe actual.
- Encabezado Amount / Year To Date identifica el orden del desglose. No se toma automáticamente una cifra anual aislada como importe actual.
- Se conservan códigos, tarifas, horas e importes de ingresos como campos opcionales del JSON del cheque, sin una nueva migración. Pueden revisarse y editarse desde un selector de filas; se guardan/reabren y viajan en el respaldo existente. No se suman otra vez como movimientos.
- Fechas de pago/inicio/fin se reconocen por sus encabezados cuando una fecha inequívoca permite identificar el formato del conjunto. Si todas son ambiguas, se dejan pendientes para el calendario.
- Celda médica con cero aislado: búsqueda geométrica tras el rótulo y antes de la columna anual; eliminación de reglas largas de la tabla; aislamiento del componente de tinta; ampliación y OCR de un carácter. Solo se incorpora un cero leído explícitamente con confianza mínima de 85, nunca un cero predeterminado. Las celdas vacías FICA/INCP permanecen desconocidas. Esta recuperación adicional está acotada a la celda médica identificable; no se afirma reconocer cualquier celda de cualquier formato.
- I.T sin jurisdicción explícita se conserva en Otra deducción para confirmar su categoría; no se etiqueta automáticamente como contribución PR.
- Revisión del reconocimiento abre el texto completo propuesto en memoria. La foto sigue siendo la evidencia completa. No se guardan automáticamente nombres ni identificadores sensibles como nuevos campos estructurados.
- Una discrepancia en una fila no vacía todos los campos del talonario: los importes no contradictorios permanecen y los afectados se revisan.
- Mi dinero: selector de sección en vez de pestañas; menús Movimientos y disponible, Ingresos recurrentes, Respaldo y configuración y Nueva transacción. Se mantienen destinos, confirmación de cobros, pausa/reanudación, explicación del disponible y respaldo. La sección recurrente empieza cerrada.

## Archivos

- src/modules/documents/photo.web.ts
- src/modules/documents/photoReadings.ts
- src/modules/documents/printedAmounts.ts
- src/modules/documents/receiptImage.ts
- src/modules/documents/zeroCells.ts (nuevo)
- src/modules/income/paystubTable.ts (nuevo)
- src/modules/income/recognition.ts
- src/modules/income/domain.ts
- src/modules/income/IncomeDocumentsScreen.tsx
- src/modules/money/LedgerScreen.tsx
- src/ui/buildVersion.ts
- tests/paystub-table.test.ts (nuevo)
- tests/paystub-photo-provided.test.ts (nuevo, óptica privada opcional)
- tests/income-statements.test.ts
- tests/receipt-photo-pipeline.test.ts

## Verificación

Presupuesto consumido: 94 casos/ejecuciones conservadoras de 100, contando repeticiones, cuatro diagnósticos ópticos iniciales y fallos corregidos. No se ejecutó la suite completa ni CI.

- Primera selección: 30 aprobados (tablas, números, talonarios y lectura real de la foto en dos pasadas).
- Regresión tras ajustes: 32 aprobados, incluyendo guardar/reabrir/restaurar tarifas y horas, sin duplicar movimientos.
- Selección de tablas y flujo óptico tras separar pasadas auxiliares: 11 aprobados.
- Dos casos de aislamiento de glifo y protección de celdas vacías, aprobados antes y después de la revisión de la marca de cero.
- Última selección: 2 aprobados: foto completa con motor local real y regresión de ruido antes del código.
- Los fallos intermedios permitieron corregir la invalidación de cifras por lecturas auxiliares, el reconocimiento/vinculación del cero médico y el ruido del fondo. Una ejecución de preprocesamiento Python dentro del sandbox no pudo completar; la misma comprobación local pudo ejecutarse con el permiso de herramientas aprobado, sin transferir la foto a servidores.
- La última prueba óptica reproduce original automático, original disperso, contraste, hasta 12 filas ampliadas y recuperación de cero, usando los mismos helpers de producción. Pillow sustituye las operaciones de Canvas en la comprobación local; no constituye una prueba de cámara/Safari físico.

Valores comprobados en la imagen: bruto 552.58; neto 497.32; deducción 55.26; MED. INS 0.00; REGHR tarifa 11.50, horas 48.05 e importe 552.58; pago 2026-11-12 e inicio de período 2026-10-30. Bruto menos neto concilia con 55.26. No se confirma jurisdicción contributiva solo por el código I.T.

Compilación web, TypeScript, ESLint y git diff --check: correctos. Sin nueva migración, cambios en autenticación, módulos comerciales ni GitHub main.

## Límites

No se promete extraer el 100% de cualquier talonario. Las celdas vacías y ambiguas requieren revisión; no se deducen importes faltantes por diferencia. La recuperación de ceros exige geometría y trazo verificables. El trabajo se limita a lectura local, propuestas revisables y guardado confirmado.

No se probó la cámara de un iPad/Android físico ni hubo QA visual en navegador: el entorno Sites administrado carece de cua_repl.js. No se generó APK. Los modelos siguen siendo locales spa+eng; las fotos no se envían a servicios de OCR ni IA externa.

## Publicación

Sites confirmó estado succeeded para la versión alojada 13, el 2026-11-13 a las 15:33 UTC.
URL pública conservada: https://edumoney-web.diegoluissantospabon.chatgpt.site
Despliegue: appgdep_6af72da90cec8191865c18ab1c132ffc.
Versión guardada: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_40f0dbfcbb4c819193de73a51457f522.
Fuente alojada: 09087189c7f6a30bf53c92156084b1043a230017.
Implementación local: b05ce7d, rama web-edumoney. Sin cambios en GitHub main.
